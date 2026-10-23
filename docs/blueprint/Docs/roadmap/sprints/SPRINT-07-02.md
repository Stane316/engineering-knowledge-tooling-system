# Sprint 7-2 — Playwright MCP + Navigation basique

**Statut :** ✅ LIVRÉ (23 octobre 2026)  
**Durée :** 4 jours  
**Objectif :** Intégrer Playwright MCP et implémenter la navigation basique  
**Dépendance :** Sprint 7-1 (Installation Playwright) ✅

---

**Bilan :** `Navigator` (goto, capture, trace, PDF) avec lanceur injectable et `createBrowserMcpServer` (5 outils, politique d'URL et confinement des artefacts) ; 84 + 53 tests unitaires, 100 % de couverture ; repli automatique sans bac à sable quand Firefox plante (E7-13).

## 1. Contexte

Le **Sprint 7-1** a installé Playwright et configuré l'environnement.  
Le **Sprint 7-2** va intégrer Playwright au MCP Server et implémenter la navigation basique.

**Objectifs :**
- ✅ Intégrer Playwright MCP (Model Context Protocol)
- ✅ Implémenter la navigation basique (goto, screenshot, trace, PDF)
- ✅ Tester la navigation sur des sites réels

---

## 2. État initial (fin Sprint 7-1)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   └── types.ts                    ✅ (Sprint 7-1)
│   ├── mcp/
│   │   ├── server.ts                   ✅ (Sprint 6)
│   │   └── tools/                      ✅ (Sprint 6)
│   └── ...
├── tests/
│   ├── browser/
│   │   └── basic.test.ts               ✅ (Sprint 7-1)
│   └── ...
├── playwright.config.ts                ✅ (Sprint 7-1)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Implémenter le Navigator (Jour 1-2 — 8h)

**Fichier :** `src/browser/navigator.ts`

```typescript
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import {
  NavigationOptions,
  NavigationResult,
  ScreenshotOptions,
  ScreenshotResult,
  TraceOptions,
  TraceResult,
  PdfOptions,
  PdfResult,
} from './types';

/**
 * Navigator — Navigation basique avec Playwright
 * 
 * Permet de naviguer sur des sites web, capturer des screenshots,
 * enregistrer des traces et générer des PDFs.
 */
export class Navigator {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Démarre le navigateur
   * 
   * @param browserType - Type de navigateur (défaut: 'chromium')
   */
  async start(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'): Promise<void> {
    const browsers = { chromium, firefox, webkit };
    this.browser = await browsers[browserType].launch({
      headless: true,
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  /**
   * Arrête le navigateur
   */
  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Navigue vers une URL
   * 
   * @param options - Options de navigation
   * @returns Résultat de la navigation
   */
  async goto(options: NavigationOptions): Promise<NavigationResult> {
    if (!this.page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const startTime = Date.now();

    const response = await this.page.goto(options.url, {
      timeout: options.timeout ?? 30_000,
      waitUntil: options.waitUntil ?? 'load',
    });

    const loadTime = Date.now() - startTime;

    return {
      url: this.page.url(),
      title: await this.page.title(),
      loadTime,
      status: response?.status() ?? 0,
    };
  }

  /**
   * Capture un screenshot
   * 
   * @param options - Options de screenshot
   * @returns Résultat du screenshot
   */
  async screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
    if (!this.page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const buffer = await this.page.screenshot({
      path: options.path,
      type: options.type ?? 'png',
      quality: options.quality,
      fullPage: options.fullPage ?? false,
    });

    const fs = await import('fs');
    const stats = fs.statSync(options.path);

    // Obtenir les dimensions de l'image
    const metadata = await this.page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    return {
      path: options.path,
      size: stats.size,
      dimensions: metadata,
    };
  }

  /**
   * Démarre l'enregistrement d'une trace
   * 
   * @param options - Options de trace
   */
  async startTrace(options: TraceOptions): Promise<void> {
    if (!this.context) {
      throw new Error('Browser not started. Call start() first.');
    }

    await this.context.tracing.start({
      screenshots: options.screenshots ?? true,
      snapshots: options.snapshots ?? true,
      sources: options.sources ?? false,
    });
  }

  /**
   * Arrête l'enregistrement d'une trace
   * 
   * @param options - Options de trace
   * @returns Résultat de la trace
   */
  async stopTrace(options: TraceOptions): Promise<TraceResult> {
    if (!this.context) {
      throw new Error('Browser not started. Call start() first.');
    }

    const startTime = Date.now();

    await this.context.tracing.stop({
      path: options.path,
    });

    const fs = await import('fs');
    const stats = fs.statSync(options.path);

    return {
      path: options.path,
      size: stats.size,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Génère un PDF de la page
   * 
   * @param options - Options de PDF
   * @returns Résultat du PDF
   */
  async pdf(options: PdfOptions): Promise<PdfResult> {
    if (!this.page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const buffer = await this.page.pdf({
      path: options.path,
      format: options.format ?? 'Letter',
      landscape: options.landscape ?? false,
      margin: options.margin ?? {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    const fs = await import('fs');
    const stats = fs.statSync(options.path);

    // Compter le nombre de pages (approximation basée sur la taille)
    const pages = Math.max(1, Math.ceil(buffer.length / 50_000));

    return {
      path: options.path,
      size: stats.size,
      pages,
    };
  }

  /**
   * Obtient la page actuelle
   */
  getPage(): Page | null {
    return this.page;
  }
}
```

**Tests :** `tests/browser/navigator.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Navigator } from '../../src/browser/navigator';
import fs from 'fs';
import path from 'path';

describe('Navigator', () => {
  let navigator: Navigator;
  const testDir = './test-results/navigator';

  beforeAll(async () => {
    navigator = new Navigator();
    await navigator.start('chromium');

    // Créer le dossier de test
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await navigator.stop();

    // Nettoyer les fichiers de test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('goto', () => {
    it('should navigate to example.com', async () => {
      const result = await navigator.goto({
        url: 'https://example.com',
      });

      expect(result.url).toBe('https://example.com/');
      expect(result.title).toBe('Example Domain');
      expect(result.status).toBe(200);
      expect(result.loadTime).toBeGreaterThan(0);
    });

    it('should handle navigation timeout', async () => {
      await expect(
        navigator.goto({
          url: 'https://example.com',
          timeout: 1, // 1ms = timeout immédiat
        })
      ).rejects.toThrow();
    });
  });

  describe('screenshot', () => {
    it('should capture a screenshot', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const screenshotPath = path.join(testDir, 'screenshot.png');
      const result = await navigator.screenshot({
        path: screenshotPath,
      });

      expect(result.path).toBe(screenshotPath);
      expect(result.size).toBeGreaterThan(0);
      expect(result.dimensions.width).toBeGreaterThan(0);
      expect(result.dimensions.height).toBeGreaterThan(0);

      // Vérifier que le fichier existe
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });

    it('should capture full page screenshot', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const screenshotPath = path.join(testDir, 'screenshot-full.png');
      const result = await navigator.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      expect(result.size).toBeGreaterThan(0);
      expect(fs.existsSync(screenshotPath)).toBe(true);
    });
  });

  describe('trace', () => {
    it('should record a trace', async () => {
      const tracePath = path.join(testDir, 'trace.zip');

      await navigator.startTrace({ path: tracePath });
      await navigator.goto({ url: 'https://example.com' });
      const result = await navigator.stopTrace({ path: tracePath });

      expect(result.path).toBe(tracePath);
      expect(result.size).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);

      // Vérifier que le fichier existe
      expect(fs.existsSync(tracePath)).toBe(true);
    });
  });

  describe('pdf', () => {
    it('should generate a PDF', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const pdfPath = path.join(testDir, 'page.pdf');
      const result = await navigator.pdf({
        path: pdfPath,
      });

      expect(result.path).toBe(pdfPath);
      expect(result.size).toBeGreaterThan(0);
      expect(result.pages).toBeGreaterThan(0);

      // Vérifier que le fichier existe
      expect(fs.existsSync(pdfPath)).toBe(true);
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/navigator.test.ts
# ✅ 6 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/navigator.ts
git add tests/browser/navigator.test.ts
git commit -m "feat(browser): implement basic navigation (goto, screenshot, trace, PDF)"
```

---

### 3.2 Intégrer Playwright MCP (Jour 3-4 — 8h)

**Fichier :** `src/browser/playwright-mcp.ts`

```typescript
import { Navigator } from './navigator';
import {
  NavigationOptions,
  ScreenshotOptions,
  TraceOptions,
  PdfOptions,
} from './types';

/**
 * Playwright MCP — Intégration Playwright avec MCP
 * 
 * Expose les capacités de navigation Playwright via MCP,
 * permettant aux agents IA de contrôler le navigateur.
 */
export class PlaywrightMCP {
  private navigator: Navigator;

  constructor() {
    this.navigator = new Navigator();
  }

  /**
   * Initialise Playwright MCP
   */
  async initialize(): Promise<void> {
    await this.navigator.start('chromium');
  }

  /**
   * Arrête Playwright MCP
   */
  async shutdown(): Promise<void> {
    await this.navigator.stop();
  }

  /**
   * Navigue vers une URL
   * 
   * @param url - URL à naviguer
   * @param options - Options de navigation
   */
  async goto(url: string, options?: Omit<NavigationOptions, 'url'>): Promise<void> {
    await this.navigator.goto({ url, ...options });
  }

  /**
   * Capture un screenshot
   * 
   * @param path - Chemin du fichier de sortie
   * @param options - Options de screenshot
   */
  async screenshot(path: string, options?: Omit<ScreenshotOptions, 'path'>): Promise<void> {
    await this.navigator.screenshot({ path, ...options });
  }

  /**
   * Démarre l'enregistrement d'une trace
   */
  async startTrace(): Promise<void> {
    await this.navigator.startTrace({
      path: '', // Sera spécifié lors du stopTrace
    });
  }

  /**
   * Arrête l'enregistrement d'une trace
   * 
   * @param path - Chemin du fichier de sortie
   */
  async stopTrace(path: string): Promise<void> {
    await this.navigator.stopTrace({ path });
  }

  /**
   * Génère un PDF
   * 
   * @param path - Chemin du fichier de sortie
   * @param options - Options de PDF
   */
  async pdf(path: string, options?: Omit<PdfOptions, 'path'>): Promise<void> {
    await this.navigator.pdf({ path, ...options });
  }

  /**
   * Obtient le titre de la page actuelle
   */
  async getTitle(): Promise<string> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started');
    }
    return await page.title();
  }

  /**
   * Obtient l'URL de la page actuelle
   */
  async getUrl(): Promise<string> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started');
    }
    return page.url();
  }

  /**
   * Exécute du JavaScript dans la page
   * 
   * @param script - Script à exécuter
   */
  async evaluate<T>(script: string): Promise<T> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started');
    }
    return await page.evaluate(script) as T;
  }
}
```

**Tests :** `tests/browser/playwright-mcp.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PlaywrightMCP } from '../../src/browser/playwright-mcp';
import fs from 'fs';
import path from 'path';

describe('PlaywrightMCP', () => {
  let mcp: PlaywrightMCP;
  const testDir = './test-results/mcp';

  beforeAll(async () => {
    mcp = new PlaywrightMCP();
    await mcp.initialize();

    // Créer le dossier de test
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await mcp.shutdown();

    // Nettoyer les fichiers de test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('navigation', () => {
    it('should navigate to a URL', async () => {
      await mcp.goto('https://example.com');

      const title = await mcp.getTitle();
      expect(title).toBe('Example Domain');

      const url = await mcp.getUrl();
      expect(url).toBe('https://example.com/');
    });
  });

  describe('screenshot', () => {
    it('should capture a screenshot', async () => {
      await mcp.goto('https://example.com');

      const screenshotPath = path.join(testDir, 'mcp-screenshot.png');
      await mcp.screenshot(screenshotPath);

      expect(fs.existsSync(screenshotPath)).toBe(true);
    });
  });

  describe('evaluate', () => {
    it('should execute JavaScript', async () => {
      await mcp.goto('https://example.com');

      const title = await mcp.evaluate<string>('document.title');
      expect(title).toBe('Example Domain');
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/playwright-mcp.test.ts
# ✅ 3 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/playwright-mcp.ts
git add tests/browser/playwright-mcp.test.ts
git commit -m "feat(browser): implement Playwright MCP integration"
```

---

### 3.3 Vérification finale Sprint 7-2 (Jour 4)

**Vérifications :**

```bash
# 1. Tests Navigator
npm test tests/browser/navigator.test.ts
# ✅ 6 tests passent

# 2. Tests PlaywrightMCP
npm test tests/browser/playwright-mcp.test.ts
# ✅ 3 tests passent

# 3. Couverture
npm run test:coverage -- tests/browser/
# ✅ > 80% couverture

# 4. Compilation
npm run build
# ✅ Aucune erreur

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Test manuel navigation
node -e "
const { Navigator } = require('./dist/browser/navigator');
const nav = new Navigator();
nav.start().then(() => nav.goto({ url: 'https://example.com' })).then(r => {
  console.log('Title:', r.title);
  console.log('Load time:', r.loadTime, 'ms');
  return nav.stop();
});
"
# ✅ Navigation fonctionne

# 7. Test manuel screenshot
node -e "
const { Navigator } = require('./dist/browser/navigator');
const nav = new Navigator();
nav.start().then(() => nav.goto({ url: 'https://example.com' })).then(() => {
  return nav.screenshot({ path: 'test-manual.png' });
}).then(r => {
  console.log('Screenshot size:', r.size, 'bytes');
  return nav.stop();
});
"
# ✅ Screenshot créé

# 8. Push
git push origin feat/sprint-7-2
```

**Point de contrôle Sprint 7-2 :**
- ✅ Navigator implémenté (goto, screenshot, trace, PDF)
- ✅ PlaywrightMCP intégré
- ✅ Tests unitaires > 80% couverture
- ✅ Navigation basique fonctionnelle
- ✅ Screenshots, traces, PDFs générés

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/browser/navigator.ts` | ~200 | Navigation basique |
| `src/browser/playwright-mcp.ts` | ~120 | Playwright MCP |
| `tests/browser/navigator.test.ts` | ~150 | Tests Navigator |
| `tests/browser/playwright-mcp.test.ts` | ~80 | Tests PlaywrightMCP |

**Total Sprint 7-2 :** ~550 lignes

---

## 5. Commits

```bash
git commit -m "feat(browser): implement basic navigation (goto, screenshot, trace, PDF)"
git commit -m "feat(browser): implement Playwright MCP integration"
```

---

## 6. Transition vers Sprint 7-3

**Prérequis pour Sprint 7-3 :**
- ✅ Sprint 7-2 terminé avec succès
- ✅ Navigator fonctionnel
- ✅ PlaywrightMCP intégré
- ✅ Tests > 80% couverture

**Sprint 7-3 va implémenter :**
- Extraction accessibility tree
- Tests d'intégration complets
- Documentation Playwright

---

**Fin du document Sprint 7-2**
