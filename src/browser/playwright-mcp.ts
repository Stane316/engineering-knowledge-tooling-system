/**
 * Serveur MCP du navigateur.
 *
 * Le Sprint 6 a livré un serveur MCP **de connaissances**. Celui-ci expose une
 * seconde surface, indépendante : un agent peut ouvrir une page, la capturer,
 * lire son accessibility tree et l'imprimer en PDF. Le module ne touche pas
 * `src/mcp/` : il construit son propre `McpServer` et réutilise uniquement le
 * journal JSON Lines (`stderr`), puisque `stdout` reste le canal du protocole.
 *
 * **Sécurité.** Un agent ne doit pas pouvoir lire le disque local ni atteindre
 * le réseau interne. Deux barrières, testées :
 *
 * 1. `assertNavigableUrl` n'accepte que `http`/`https`, refuse les identifiants
 *    embarqués (`user:pass@`), et bloque par défaut les hôtes privés
 *    (`localhost`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`,
 *    `fc00::/7`, `fe80::/10`). Les tests d'intégration hors ligne passent par
 *    `Navigator`, jamais par ces outils.
 * 2. `resolveArtifactPath` confine toute écriture dans `artifactsDir` : un
 *    chemin absolu ou contenant `..` est rejeté, jamais « corrigé » en silence.
 *
 * Les chemins par défaut respectent Windows : aucun `:` dans les noms de
 * fichier générés.
 */

import { resolve, sep } from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import type { McpLogger } from '../mcp/utils/logger.js';
import { SILENT_LOGGER } from '../mcp/utils/logger.js';
import { VERSION } from '../shared/version.js';
import { Accessibility } from './accessibility.js';
import { ArtifactError, BrowserError, UrlNotAllowedError } from './errors.js';
import type { AccessibilityNode, AccessibilityReport, BrowserKind } from './types.js';

/**
 * Session de navigation consommée par les outils.
 *
 * `Navigator` la satisfait telle quelle ; les tests injectent une doublure.
 */
export interface BrowserSession {
  isStarted(): boolean;
  getKind(): BrowserKind | null;
  start(kind?: BrowserKind, options?: { headless?: boolean }): Promise<unknown>;
  stop(): Promise<void>;
  goto(options: {
    url: string;
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  }): Promise<{
    readonly url: string;
    readonly title: string;
    readonly status: number;
    readonly loadTime: number;
    readonly redirected: boolean;
  }>;
  screenshot(options: {
    path: string;
    type?: 'png' | 'jpeg';
    quality?: number;
    fullPage?: boolean;
  }): Promise<{
    readonly path: string;
    readonly size: number;
    readonly type: 'png' | 'jpeg' | 'unknown';
    readonly dimensions: { readonly width: number; readonly height: number };
    readonly duration: number;
  }>;
  pdf(options: {
    path: string;
    format?: 'A4' | 'A3' | 'Letter' | 'Legal';
    landscape?: boolean;
  }): Promise<{
    readonly path: string;
    readonly size: number;
    readonly pages: number;
    readonly duration: number;
  }>;
  getPage(): {
    url(): string;
    title(): Promise<string>;
    ariaSnapshotJSON(options?: { depth?: number; boxes?: boolean }): Promise<unknown>;
    evaluate<T = unknown>(expression: string, arg?: unknown): Promise<T>;
  };
}

/** Noms des outils, dans l'ordre de `tools/list`. */
export const BROWSER_TOOL_NAMES = [
  'browser_navigate',
  'browser_screenshot',
  'browser_accessibility',
  'browser_pdf',
  'browser_close',
] as const;

/** Schémas d'entrée, exposés en JSON Schema par le SDK. */
export const BrowserNavigateInput = z.object({
  url: z.url({ protocol: /^https?$/, error: 'URL invalide (http:// ou https:// attendu)' }),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit']).default('load'),
  timeoutMs: z.number().int().min(100).max(120_000).default(30_000),
});

export const BrowserScreenshotInput = z.object({
  path: z.string().min(1).max(200).optional(),
  fullPage: z.boolean().default(true),
  type: z.enum(['png', 'jpeg']).default('png'),
  quality: z.number().int().min(1).max(100).optional(),
});

export const BrowserAccessibilityInput = z.object({
  role: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(200).optional(),
  maxDepth: z.number().int().min(1).max(64).default(20),
  maxNodes: z.number().int().min(1).max(5_000).default(2_000),
  includeTree: z.boolean().default(false),
  includeViolations: z.boolean().default(true),
});

export const BrowserPdfInput = z.object({
  path: z.string().min(1).max(200).optional(),
  format: z.enum(['A4', 'A3', 'Letter', 'Legal']).default('A4'),
  landscape: z.boolean().default(false),
});

export interface BrowserMcpOptions {
  /** Session de navigation (défaut de production : `new Navigator()`). */
  readonly session: BrowserSession;
  /** Journal JSON Lines sur `stderr` (défaut : silencieux). */
  readonly logger?: McpLogger;
  /** Dossier de sortie des captures et PDF (défaut : `./artifacts/browser`). */
  readonly artifactsDir?: string;
  /** Moteur lancé au premier outil (défaut : `chromium`). */
  readonly browserKind?: BrowserKind;
  /** Autorise les hôtes privés (défaut : `false`). */
  readonly allowPrivateHosts?: boolean;
  /** Horloge injectable pour les noms de fichiers par défaut. */
  readonly now?: () => Date;
}

/** Dossier d'artefacts par défaut, relatif au répertoire courant. */
export const DEFAULT_ARTIFACTS_DIR = 'artifacts/browser';

/** Instructions remises à l'agent au handshake. */
const BROWSER_INSTRUCTIONS = [
  'Serveur EKTS Navigateur : inspection de pages web via Playwright.',
  'browser_navigate ouvre une URL (http/https uniquement) et démarre Chromium au besoin.',
  'browser_screenshot et browser_pdf écrivent dans le dossier d’artefacts du serveur ;',
  'browser_accessibility renvoie l’accessibility tree et les violations détectées.',
  'Appelez browser_close en fin de session pour libérer le navigateur.',
].join(' ');

/**
 * Construit le serveur MCP du navigateur.
 *
 * @param options - Session, journal, artefacts et politique réseau.
 */
export function createBrowserMcpServer(options: BrowserMcpOptions): McpServer {
  const logger = options.logger ?? SILENT_LOGGER;
  const server = new McpServer(
    { name: 'ekts-browser', version: VERSION, title: 'EKTS — inspection navigateur' },
    { capabilities: { tools: {} }, instructions: BROWSER_INSTRUCTIONS },
  );

  server.server.onerror = (error) => {
    logger.error('Erreur de protocole MCP (navigateur)', error);
  };

  registerBrowserTools(server, options, logger);

  return server;
}

/**
 * Enregistre les cinq outils sur un serveur existant.
 *
 * @param server - Serveur MCP.
 * @param options - Configuration du module.
 * @param logger - Journal structuré.
 */
export function registerBrowserTools(
  server: McpServer,
  options: BrowserMcpOptions,
  logger: McpLogger = SILENT_LOGGER,
): void {
  const artifactsDir = resolve(options.artifactsDir ?? DEFAULT_ARTIFACTS_DIR);
  const now = options.now ?? ((): Date => new Date());

  server.registerTool(
    'browser_navigate',
    {
      title: 'Ouvrir une page web',
      description:
        'Ouvre une URL http/https dans le navigateur, démarre Chromium si nécessaire et renvoie URL finale, titre, code HTTP et durée de chargement.',
      inputSchema: BrowserNavigateInput,
      annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
    },
    async (args) =>
      run('browser_navigate', logger, async () => {
        const url = assertNavigableUrl(args.url, {
          allowPrivateHosts: options.allowPrivateHosts ?? false,
        });
        await ensureStarted(options, logger);
        const result = await options.session.goto({
          url: url,
          timeout: args.timeoutMs,
          waitUntil: args.waitUntil,
        });

        return { ...result, kind: options.session.getKind() };
      }),
  );

  server.registerTool(
    'browser_screenshot',
    {
      title: 'Capturer la page',
      description:
        'Capture la page courante en PNG ou JPEG. Le chemin est relatif au dossier d’artefacts du serveur ; toute tentative de sortie de ce dossier est refusée.',
      inputSchema: BrowserScreenshotInput,
      annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    },
    async (args) =>
      run('browser_screenshot', logger, async () => {
        const path = resolveArtifactPath(
          artifactsDir,
          args.path,
          `screenshot-${stamp(now())}.${args.type}`,
        );

        const result = await options.session.screenshot({
          path,
          type: args.type,
          fullPage: args.fullPage,
          ...(args.quality === undefined ? {} : { quality: args.quality }),
        });

        return { ...result, relativePath: toRelative(artifactsDir, result.path) };
      }),
  );

  server.registerTool(
    'browser_accessibility',
    {
      title: 'Lire l’accessibility tree',
      description:
        'Extrait l’accessibility tree de la page (rôles ARIA, noms, niveaux, états), filtre éventuellement par rôle ou nom, et calcule les violations détectables.',
      inputSchema: BrowserAccessibilityInput,
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    },
    async (args) =>
      run('browser_accessibility', logger, async () => {
        const accessibility = new Accessibility({
          getPage: () => options.session.getPage(),
        });
        const extraction = await accessibility.extract({
          maxDepth: args.maxDepth,
          maxNodes: args.maxNodes,
        });

        let matches: readonly AccessibilityNode[] | undefined;

        if (args.role !== undefined) {
          const role = args.role.toLowerCase();
          matches = findInTree(extraction.root, (node) => node.role.toLowerCase() === role);
        } else if (args.name !== undefined) {
          const expected = args.name.toLowerCase();
          matches = findInTree(
            extraction.root,
            (node) => node.name?.toLowerCase().includes(expected) ?? false,
          );
        }

        const report: AccessibilityReport | undefined = args.includeViolations
          ? await accessibility.getViolations()
          : undefined;

        return {
          url: extraction.url,
          title: extraction.title,
          nodeCount: extraction.nodeCount,
          maxDepth: extraction.maxDepth,
          extractionTime: extraction.extractionTime,
          truncated: extraction.truncated,
          ...(matches === undefined ? {} : { matches }),
          ...(args.includeTree ? { tree: extraction.root } : {}),
          ...(report === undefined
            ? {}
            : { violations: report.violations, summary: report.summary }),
        };
      }),
  );

  server.registerTool(
    'browser_pdf',
    {
      title: 'Imprimer la page en PDF',
      description:
        'Imprime la page courante en PDF (Chromium uniquement) dans le dossier d’artefacts du serveur.',
      inputSchema: BrowserPdfInput,
      annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    },
    async (args) =>
      run('browser_pdf', logger, async () => {
        const path = resolveArtifactPath(artifactsDir, args.path, `page-${stamp(now())}.pdf`);
        const result = await options.session.pdf({
          path,
          format: args.format,
          landscape: args.landscape,
        });

        return { ...result, relativePath: toRelative(artifactsDir, result.path) };
      }),
  );

  server.registerTool(
    'browser_close',
    {
      title: 'Fermer le navigateur',
      description:
        'Ferme le navigateur et libère les ressources. Sans effet si aucun navigateur n’est ouvert.',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    },
    async () =>
      run('browser_close', logger, async () => {
        await options.session.stop();

        return { closed: true };
      }),
  );
}

/**
 * Vérifie qu'une URL peut être ouverte par un agent.
 *
 * @param raw - URL fournie par l'appelant.
 * @param options - Politique réseau.
 * @throws {UrlNotAllowedError} Schéma, identifiants ou hôte refusés.
 */
export function assertNavigableUrl(
  raw: string,
  options: { readonly allowPrivateHosts?: boolean } = {},
): string {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new UrlNotAllowedError(raw, 'URL absolue invalide.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlNotAllowedError(raw, `schéma « ${url.protocol} » refusé (http/https uniquement).`);
  }

  if (url.username !== '' || url.password !== '') {
    throw new UrlNotAllowedError(raw, 'identifiants embarqués refusés.');
  }

  if (options.allowPrivateHosts !== true && isPrivateHost(url.hostname)) {
    throw new UrlNotAllowedError(
      raw,
      `hôte privé « ${url.hostname} » refusé (relancez le serveur avec allowPrivateHosts pour l’autoriser).`,
      'PRIVATE_NETWORK_BLOCKED',
    );
  }

  return url.toString();
}

/**
 * Reconnaît un hôte non routable publiquement.
 *
 * @param hostname - Nom d'hôte ou adresse littérale (sans crochets pour IPv6).
 */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    host === '' ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local')
  ) {
    return true;
  }

  if (host === '::1' || host === '::' || host === '0.0.0.0') {
    return true;
  }

  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return host.includes(':');
  }

  if (host.startsWith('::ffff:')) {
    return isPrivateHost(host.slice('::ffff:'.length));
  }

  const octets = host.split('.');

  if (octets.length !== 4 || !octets.every((octet) => /^\d{1,3}$/.test(octet))) {
    return false;
  }

  const [first, second] = octets.map((octet) => Number.parseInt(octet, 10)) as [
    number,
    number,
    number,
    number,
  ];

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

/**
 * Confine un chemin d'artefact dans un dossier de sortie.
 *
 * @param directory - Dossier autorisé (absolu).
 * @param requested - Chemin relatif demandé, facultatif.
 * @param fallback - Nom généré quand aucun chemin n'est fourni.
 * @throws {ArtifactError} Chemin absolu, `..` ou sortie du dossier.
 */
export function resolveArtifactPath(
  directory: string,
  requested: string | undefined,
  fallback: string,
): string {
  const base = resolve(directory);

  if (requested === undefined) {
    return resolve(base, fallback);
  }

  if (requested.includes('\0')) {
    throw new ArtifactError(requested, 'caractère nul interdit.', { code: 'ARTIFACT_PATH_ESCAPE' });
  }

  const candidate = resolve(base, requested);
  const allowed = candidate === base || candidate.startsWith(`${base}${sep}`);

  if (!allowed) {
    throw new ArtifactError(requested, `le chemin doit rester dans « ${base} ».`, {
      code: 'ARTIFACT_PATH_ESCAPE',
    });
  }

  return candidate;
}

/** Démarre la session au premier outil qui en a besoin. */
async function ensureStarted(options: BrowserMcpOptions, logger: McpLogger): Promise<void> {
  if (options.session.isStarted()) {
    return;
  }

  const kind = options.browserKind ?? 'chromium';

  logger.info('Démarrage du navigateur', { kind });
  await options.session.start(kind, { headless: true });
}

/** Exécute un outil et convertit succès ou échec en résultat MCP. */
async function run(
  name: string,
  logger: McpLogger,
  execute: () => Promise<unknown>,
): Promise<CallToolResult> {
  const started = Date.now();

  try {
    const result = await execute();
    logger.debug('Outil navigateur exécuté', { tool: name, durationMs: Date.now() - started });

    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    logger.error('Échec de l’outil navigateur', error, { tool: name });

    return toToolErrorResult(error);
  }
}

/**
 * Traduit une erreur en résultat `isError`.
 *
 * Le SDK transforme un `throw` en texte brut ; porter le code dans la charge
 * utile permet à l'agent de distinguer un refus de politique d'une panne.
 */
export function toToolErrorResult(error: unknown): CallToolResult {
  const payload = describeError(error);

  return {
    content: [{ type: 'text', text: JSON.stringify({ error: payload }) }],
    isError: true,
  };
}

function describeError(error: unknown): {
  code: number;
  message: string;
  data?: Record<string, unknown>;
} {
  if (error instanceof UrlNotAllowedError) {
    return { code: -32001, message: error.message, data: { kind: error.code } };
  }

  if (error instanceof ArtifactError) {
    return { code: -32001, message: error.message, data: { kind: error.code, path: error.path } };
  }

  if (error instanceof BrowserError) {
    return { code: -32603, message: error.message, data: { kind: error.code } };
  }

  if (error instanceof Error) {
    return { code: -32603, message: error.message };
  }

  return { code: -32603, message: String(error) };
}

/** Parcours de l'arbre avec prédicat. */
function findInTree(
  root: AccessibilityNode,
  predicate: (node: AccessibilityNode) => boolean,
): AccessibilityNode[] {
  const matches: AccessibilityNode[] = [];

  const visit = (node: AccessibilityNode): void => {
    if (predicate(node)) {
      matches.push(node);
    }

    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  visit(root);

  return matches;
}

/** Horodatage compatible système de fichiers Windows (pas de `:`). */
function stamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/** Chemin relatif au dossier d'artefacts, pour l'affichage. */
function toRelative(directory: string, path: string): string {
  return path.startsWith(`${directory}${sep}`) ? path.slice(directory.length + 1) : path;
}
