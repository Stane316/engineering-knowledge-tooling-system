import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

/**
 * Résolution du Chromium utilisable par les tests de rendu PDF.
 *
 * Même ordre que `PDFReportGenerator` : variable d'environnement imposée
 * (`PUPPETEER_EXECUTABLE_PATH` ou `EKTS_CHROME_PATH`), puis le Chrome embarqué
 * de Puppeteer, puis le Chromium de Playwright.
 *
 * **Sprint 19-02** : factorisé depuis `tests/reports/pdf-generator.test.ts`
 * pour que plusieurs suites (C-W03) partagent exactement la même règle et
 * n'annoncent jamais un rendu simulé.
 *
 * @returns Chemin absolu du binaire, ou `undefined` si aucun n'est disponible.
 */
export async function resolveTestChromium(): Promise<string | undefined> {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH ?? process.env.EKTS_CHROME_PATH;
  if (envPath !== undefined && envPath.length > 0 && existsSync(envPath)) {
    return envPath;
  }

  try {
    const require = createRequire(import.meta.url);
    const bundled = await (
      require('puppeteer') as { executablePath(): Promise<string> }
    ).executablePath();
    if (existsSync(bundled)) {
      return bundled;
    }
  } catch {
    // Puppeteer absent ou Chrome non téléchargé : on poursuit.
  }

  const root = path.join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(root)) {
    return undefined;
  }

  const binaries = [
    path.join('chrome-linux64', 'chrome'),
    path.join('chrome-linux', 'chrome'),
    path.join('chrome-win', 'chrome.exe'),
  ];

  for (const entry of readdirSync(root).filter((name) => name.startsWith('chromium'))) {
    for (const binary of binaries) {
      const candidate = path.join(root, entry, binary);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}
