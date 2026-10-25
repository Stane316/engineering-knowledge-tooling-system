import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

import type { RecommendationEngine } from '../recommendations/recommendation-engine.js';
import type { Audit } from '../storage/types.js';

import { HtmlTemplate } from './templates/html.js';
import type { ComparisonReport, GeneratedReport, ReportOptions } from './types.js';

/** Format des rapports produits par ce générateur. */
const FORMAT = 'pdf' as const;

/** Couleur HTML par priorité (section recommandations contextuelles). */
function priorityColorOf(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#c53030';
    case 'high':
      return '#c05621';
    case 'medium':
      return '#b7791f';
    case 'low':
      return '#2f855a';
    default:
      return '#718096';
  }
}

/** Échappement HTML minimal (titres/descriptions de recommandations). */
function escapeHtmlHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

/** Marge haute/basse du PDF (mm). */
const MARGIN_VERT = '20mm';
/** Marge gauche/droite du PDF (mm). */
const MARGIN_HORZ = '15mm';

/**
 * Options de lancement Chrome, conformes aux environnements CI/sandbox
 * (root sans user namespace).
 */
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
] as const;

/** Rapport retourné lorsqu'aucun moteur PDF n'est disponible. */
interface PdfUnavailable {
  readonly unavailable: true;
  readonly reason: string;
}

/**
 * Générateur de rapports PDF (Sprint 11-1).
 *
 * Pipeline : {@link HtmlTemplate} → `page.setContent()` (attente `load`,
 * document HTML autonome) → `page.pdf()` (A4, marges 20/15 mm, fonds imprimés)
 * → écriture `.pdf` (contenu encodé base64, jamais UTF-8).
 *
 * Le binaire Chrome est résolu dans cet ordre :
 * 1. `PUPPETEER_EXECUTABLE_PATH` (ou `EKTS_CHROME_PATH`) ;
 * 2. le Chrome embarqué de Puppeteer, s'il a été téléchargé ;
 * 3. le Chromium de Playwright (`~/.cache/ms-playwright`, `PLAYWRIGHT_BROWSERS_PATH`,
 *    `%LOCALAPPDATA%\ms-playwright`) — poste développeur et CI EKTS.
 *
 * Aucun téléchargement n'est déclenché à l'exécution.
 */
export class PDFReportGenerator {
  private readonly template = new HtmlTemplate();

  /**
   * @param recommendationEngine - Moteur de recommandations (Sprint 16).
   *   Absent (défaut) = aucune section contextuelle : comportement historique
   *   strictement conservé (pas de breaking change).
   */
  constructor(private readonly recommendationEngine?: RecommendationEngine) {}

  /**
   * Génère le rapport PDF complet d'un audit.
   *
   * @param audit - Audit à représenter (jamais modifié).
   * @param options - Options (`outputPath` recommandé ; `executablePath` de test).
   * @returns Rapport généré (`content` en base64, `filePath` si écrit).
   * @throws {Error} Audit invalide, Chrome introuvable ou échec d'écriture.
   */
  async generate(
    audit: Audit,
    options?: Partial<ReportOptions> & { readonly executablePath?: string },
  ): Promise<GeneratedReport> {
    if (!audit?.metadata || typeof audit.metadata.overallScore !== 'number') {
      throw new Error('Audit invalide : métadonnées ou score global manquant.');
    }

    let html = this.template.generateReport(audit);
    const contextSection = this.buildContextRecommendationsHtml(audit, options);
    if (contextSection !== undefined) {
      html = html.replace('<footer>', `${contextSection}\n<footer>`);
    }
    return this.render(html, audit, options);
  }

  /**
   * Construit le bloc HTML « Recommandations contextuelles » (Sprint 16,
   * C16.7) : nouvelle page, bordure colorée par priorité, HTML échappé.
   *
   * Mêmes conditions que la variante Markdown (moteur, projet, section
   * autorisée, ≥ 1 reco ≥ 0.5, 5 max) et même tolérance d'échec (section
   * optionnelle, jamais bloquante). Publique pour testabilité directe
   * (écart P3 : `private` dans le spec).
   */
  buildContextRecommendationsHtml(
    audit: Audit,
    options?: Partial<ReportOptions>,
  ): string | undefined {
    if (this.recommendationEngine === undefined) {
      return undefined;
    }

    const projectId = options?.projectId ?? audit.metadata.projectId ?? undefined;
    if (projectId === undefined || projectId === null || projectId === '') {
      return undefined;
    }

    const sections = options?.includeSections;
    if (sections !== undefined && !sections.includes('context-recommendations')) {
      return undefined;
    }

    let recommendationReport;
    try {
      recommendationReport = this.recommendationEngine.generateRecommendations(projectId, {
        maxRecommendations: 5,
        minRelevanceScore: 0.5,
      });
    } catch {
      return undefined;
    }

    if (recommendationReport.recommendations.length === 0) {
      return undefined;
    }

    const items = recommendationReport.recommendations
      .map((recommendation, index) => {
        const scorePercent = (recommendation.relevanceScore * 100).toFixed(0);
        const priorityColor = priorityColorOf(recommendation.priority);
        const findingLine =
          recommendation.findingTitle === null || recommendation.findingTitle === undefined
            ? ''
            : `<div style="font-size: 12px; color: #718096; margin-top: 4px;">Constat : ${escapeHtmlHtml(recommendation.findingTitle)}</div>`;

        return `
        <div style="margin-bottom: 16px; padding: 12px; border-left: 4px solid ${priorityColor}; background: #f9fafb;">
          <h3 style="margin: 0 0 8px 0; color: #1a1a2e;">${String(index + 1)}. ${escapeHtmlHtml(recommendation.recommendationTitle)}</h3>
          <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">${escapeHtmlHtml(recommendation.recommendationDescription)}</p>
          <div style="font-size: 12px; color: #718096;">
            <span style="color: ${priorityColor}; font-weight: bold;">${recommendation.priority.toUpperCase()}</span> ·
            Pertinence : ${scorePercent}% ·
            Effort : ${String(recommendation.effort)}/5 ·
            Impact : ${String(recommendation.impact)}/5
          </div>
          ${findingLine}
        </div>
      `;
      })
      .join('\n');

    return `
      <div style="page-break-before: always; margin-top: 32px;">
        <h2 style="color: #1a1a2e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          🧭 Recommandations contextuelles
        </h2>
        <p style="color: #718096; font-size: 13px; margin-bottom: 16px;">
          ${String(recommendationReport.recommendations.length)} recommandation(s) générée(s) en ${String(recommendationReport.durationMs)} ms
        </p>
        ${items}
      </div>
    `;
  }

  /**
   * Génère le rapport PDF d'une comparaison d'audits.
   *
   * @param comparison - Comparaison issue de `AuditComparator.compare`.
   * @param options - Options de génération.
   * @returns Rapport généré.
   * @throws {Error} Comparaison invalide, Chrome introuvable ou échec d'écriture.
   */
  async generateComparison(
    comparison: ComparisonReport,
    options?: Partial<ReportOptions> & { readonly executablePath?: string },
  ): Promise<GeneratedReport> {
    if (!comparison?.auditA || !comparison?.auditB) {
      throw new Error('Comparaison invalide : audits A et B requis.');
    }

    const html = this.template.generateComparison(comparison);
    return this.render(html, comparison.auditB, options, 'comparison');
  }

  /**
   * Rend du HTML en PDF puis écrit le fichier si demandé.
   *
   * @param html - Document HTML autonome.
   * @param audit - Audit source (nom du fichier).
   * @param options - Options de l'appelant.
   * @param prefix - Préfixe du nom de fichier.
   * @returns Rapport généré.
   * @throws {Error} Chrome indisponible ou échec d'écriture.
   */
  private async render(
    html: string,
    audit: Audit,
    options: (Partial<ReportOptions> & { readonly executablePath?: string }) | undefined,
    prefix: 'audit' | 'comparison' = 'audit',
  ): Promise<GeneratedReport> {
    const generatedAt = new Date().toISOString();
    const launch = await this.resolveLaunch(options?.executablePath);
    if ('unavailable' in launch) {
      throw new Error(`PDF indisponible : ${launch.reason}`);
    }

    const puppeteer = launch.puppeteer;
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: launch.executablePath,
        args: [...LAUNCH_ARGS],
      });
      const page = await browser.newPage();
      // Puppeteer 25 : `networkidle0` n'existe plus sur setContent (types
      // restreints à `load`/`domcontentloaded`) ; le HTML étant autonome
      // (CSS inline, aucune ressource externe), `load` suffit à le rendre.
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      const bytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: MARGIN_VERT, bottom: MARGIN_VERT, left: MARGIN_HORZ, right: MARGIN_HORZ },
      });
      const buffer = Buffer.from(bytes);
      if (buffer.length < 5 || buffer.subarray(0, 4).toString('latin1') !== '%PDF') {
        throw new Error("Chrome a produit un document qui n'est pas un PDF valide.");
      }
      const base64 = buffer.toString('base64');

      const filePath = await this.write(buffer, audit, options, generatedAt, prefix);
      return {
        auditId: audit.metadata.id ?? 0,
        format: FORMAT,
        content: base64,
        ...(filePath === undefined ? {} : { filePath }),
        generatedAt,
      };
    } finally {
      await browser?.close();
    }
  }

  /**
   * Résout Puppeteer et le binaire Chrome à utiliser.
   *
   * @param executablePath - Chemin imposé (tests).
   * @returns Lancement prêt, ou la raison de l'indisponibilité.
   */
  private async resolveLaunch(
    executablePath: string | undefined,
  ): Promise<
    | { readonly puppeteer: typeof import('puppeteer').default; readonly executablePath?: string }
    | PdfUnavailable
  > {
    let puppeteer: typeof import('puppeteer').default;
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch {
      return {
        unavailable: true,
        reason: 'paquet « puppeteer » absent (`npm install puppeteer`).',
      };
    }

    if (executablePath !== undefined && executablePath.trim().length > 0) {
      if (!existsSync(executablePath)) {
        return { unavailable: true, reason: `Chrome introuvable : « ${executablePath} ».` };
      }
      return { puppeteer, executablePath };
    }

    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.EKTS_CHROME_PATH;
    if (envPath !== undefined && envPath.trim().length > 0) {
      if (!existsSync(envPath)) {
        return {
          unavailable: true,
          reason: `Chrome introuvable (variable d'environnement) : « ${envPath} ».`,
        };
      }
      return { puppeteer, executablePath: envPath };
    }

    try {
      const bundled = await puppeteer.executablePath();
      if (existsSync(bundled)) {
        return { puppeteer, executablePath: bundled };
      }
    } catch {
      // Chrome embarqué non téléchargé : on tente Playwright ci-dessous.
    }

    const fromPlaywright = this.findPlaywrightChromium();
    if (fromPlaywright !== undefined) {
      return { puppeteer, executablePath: fromPlaywright };
    }

    return {
      unavailable: true,
      reason:
        'aucun Chrome résolvable (PUPPETEER_EXECUTABLE_PATH, Chrome embarqué, Chromium Playwright). ' +
        'Définir PUPPETEER_EXECUTABLE_PATH ou exécuter `npm run browsers:install`.',
    };
  }

  /**
   * Cherche un binaire Chromium/Chrome utilisable : Playwright d'abord
   * (cache développeur/CI EKTS), puis les emplacements système (Chrome
   * préinstallé des images CI, installations classiques).
   *
   * @returns Chemin du binaire, ou `undefined` si absent.
   */
  private findPlaywrightChromium(): string | undefined {
    const roots: string[] = [];
    const override = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (override !== undefined && override.length > 0 && override !== '0') {
      roots.push(override);
    }
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData !== undefined && localAppData.length > 0) {
      roots.push(path.join(localAppData, 'ms-playwright'));
    }
    roots.push(path.join(homedir(), '.cache', 'ms-playwright'));
    roots.push(path.join(homedir(), 'Library', 'Caches', 'ms-playwright'));

    const binaries = [
      path.join('chrome-linux64', 'chrome'),
      path.join('chrome-linux', 'chrome'),
      path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join('chrome-win', 'chrome.exe'),
    ];

    for (const root of roots) {
      if (!existsSync(root)) continue;
      let entries: string[];
      try {
        entries = readdirSync(root).filter((entry) => entry.startsWith('chromium'));
      } catch {
        continue;
      }
      for (const entry of entries.sort().reverse()) {
        for (const binary of binaries) {
          const candidate = path.join(root, entry, binary);
          if (existsSync(candidate)) return candidate;
        }
      }
    }

    // Chrome système (images CI ubuntu, installations locales) :
    const systemCandidates =
      process.platform === 'win32'
        ? [
            path.join(
              process.env.ProgramFiles ?? 'C:\\Program Files',
              'Google',
              'Chrome',
              'Application',
              'chrome.exe',
            ),
            path.join(
              process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
              'Google',
              'Chrome',
              'Application',
              'chrome.exe',
            ),
          ]
        : process.platform === 'darwin'
          ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
          : [
              '/usr/bin/google-chrome',
              '/usr/bin/google-chrome-stable',
              '/usr/bin/chromium',
              '/usr/bin/chromium-browser',
              '/opt/google/chrome/chrome',
              '/snap/bin/chromium',
            ];

    for (const candidate of systemCandidates) {
      if (existsSync(candidate)) return candidate;
    }
    return undefined;
  }

  /**
   * Écrit le PDF (binaire) dans `outputPath`.
   *
   * @param buffer - Octets du PDF.
   * @param audit - Audit source.
   * @param options - Options de l'appelant.
   * @param generatedAt - Horodatage ISO.
   * @param prefix - Préfixe du nom de fichier.
   * @returns Chemin écrit, ou `undefined` sans `outputPath`.
   * @throws {Error} Chemin vide ou refus du système de fichiers.
   */
  private async write(
    buffer: Buffer,
    audit: Audit,
    options: (Partial<ReportOptions> & { readonly executablePath?: string }) | undefined,
    generatedAt: string,
    prefix: 'audit' | 'comparison',
  ): Promise<string | undefined> {
    const outputPath = options?.outputPath;
    if (outputPath === undefined) return undefined;
    if (outputPath.trim().length === 0) {
      throw new Error('outputPath : le chemin de sortie ne peut pas être vide.');
    }

    try {
      await mkdir(outputPath, { recursive: true });
      const stamp = generatedAt.replace(/[:.]/g, '-');
      const filePath = path.join(outputPath, `${prefix}-${String(audit.metadata.id)}-${stamp}.pdf`);
      await writeFile(filePath, buffer, { flag: 'w' });
      return filePath;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Écriture du rapport PDF impossible dans « ${outputPath} » : ${reason}`, {
        cause: error,
      });
    }
  }
}
