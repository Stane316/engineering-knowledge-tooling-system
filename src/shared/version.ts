import { readFileSync } from 'node:fs';

interface PackageManifest {
  version?: unknown;
}

const DEFAULT_MANIFEST_URL = new URL('../../package.json', import.meta.url);

/**
 * Lit la version du projet depuis package.json.
 * Le chemin est résolu depuis le module compilé (dist/shared) comme depuis les sources (src/shared).
 */
export function readVersion(manifestUrl: URL = DEFAULT_MANIFEST_URL): string {
  const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as PackageManifest;

  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    throw new Error(`Version absente ou invalide dans ${manifestUrl.pathname}`);
  }

  return manifest.version;
}

export const VERSION = readVersion();
