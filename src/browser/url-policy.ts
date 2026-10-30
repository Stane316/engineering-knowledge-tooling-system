/**
 * Politique de cible des inspections (Sprint 20-03, O06 / C-W13).
 *
 * Le défaut visé : la politique existait dans **un seul** point d'entrée (le
 * serveur Playwright-MCP) alors que la CLI et l'outil MCP `inspect_site`
 * acceptaient n'importe quelle URL. Une même règle doit décider à chaque
 * frontière réelle, sans contournement.
 *
 * Deux niveaux :
 * 1. `assertNavigableUrl` — contrôle **syntaxique** (schéma, identifiants,
 *    hôte littéralement privé) : synchrone, sans réseau ;
 * 2. `assertNavigableTarget` — même contrôle, puis **résolution DNS** et refus
 *    si une adresse résolue est privée, ou échec explicite si la résolution
 *    échoue.
 *
 * Limite déclarée : la résolution précède la connexion du navigateur ; ce
 * contrôle ne protège donc pas d'un rebinding DNS entre les deux instants, ni
 * des redirections internes au navigateur (C-W13 n'est pas une preuve SSRF
 * générale).
 */

import { lookup as defaultLookup } from 'node:dns/promises';

import { UrlNotAllowedError } from './errors.js';

/** Enregistrement de résolution minimal. */
export interface ResolvedAddress {
  readonly address: string;
  readonly family: number;
}

/** Résolveur injectable (tests hors réseau). */
export type HostResolver = (hostname: string) => Promise<readonly ResolvedAddress[]>;

/** Options de la politique de cible. */
export interface TargetPolicyOptions {
  /**
   * Exception **explicite** pour un poste de développement : autorise les
   * hôtes privés et court-circuite la résolution. Jamais activée par défaut.
   */
  readonly allowPrivateHosts?: boolean;
  /** Résolveur de remplacement (tests). */
  readonly resolveHost?: HostResolver;
}

/**
 * Vérifie qu'une URL peut être ouverte par un agent.
 *
 * Le retour est l'URL **normalisée** par `URL#toString` : c'est l'adresse
 * effectivement ouverte par le navigateur. Les frontières (CLI, MCP) qui
 * doivent conserver la saisie de l'utilisateur passent par
 * `assertNavigableTarget`, qui rend la cible telle qu'elle a été fournie.
 *
 * @param raw - URL fournie par l'appelant.
 * @param options - Politique réseau.
 * @returns URL absolue normalisée.
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
      `hôte privé « ${url.hostname} » refusé (utilisez --allow-private-hosts pour l’autoriser explicitement).`,
      'PRIVATE_NETWORK_BLOCKED',
    );
  }

  return url.toString();
}

/**
 * Vérifie la syntaxe **puis** la résolution de la cible avant toute navigation.
 *
 * @param raw - URL fournie par l'appelant.
 * @param options - Politique réseau et résolveur injectable.
 * @returns L'URL fournie, si elle est autorisée.
 * @throws {UrlNotAllowedError} Schéma, identifiants, hôte privé, adresse
 * résolue privée ou échec DNS.
 */
export async function assertNavigableTarget(
  raw: string,
  options: TargetPolicyOptions = {},
): Promise<string> {
  const normalized = assertNavigableUrl(raw, options);
  const target = raw.trim();

  // Exception explicite : elle ne déclenche aucune résolution réseau.
  if (options.allowPrivateHosts === true) {
    return target;
  }

  const hostname = new URL(normalized).hostname;
  const resolveHost: HostResolver =
    options.resolveHost ?? ((host) => defaultLookup(host, { all: true }));

  let addresses: readonly ResolvedAddress[];

  try {
    addresses = await resolveHost(hostname);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new UrlNotAllowedError(
      raw,
      `résolution DNS impossible pour « ${hostname} » (${reason}) : aucune navigation n’a été tentée.`,
      'DNS_RESOLUTION_FAILED',
    );
  }

  const blocked = addresses.find((entry) => isPrivateHost(entry.address));

  if (blocked !== undefined) {
    throw new UrlNotAllowedError(
      raw,
      `« ${hostname} » résout vers l’adresse privée « ${blocked.address} » : navigation refusée.`,
      'PRIVATE_NETWORK_BLOCKED',
    );
  }

  return target;
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
