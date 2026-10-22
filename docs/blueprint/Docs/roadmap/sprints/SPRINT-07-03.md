# Sprint 7-3 — Accessibility Tree + Tests + Documentation

**Statut :** ⏳ NON COMMENCÉ  
**Durée :** 3 jours  
**Objectif :** Extraire l'accessibility tree, tester et documenter  
**Dépendance :** Sprint 7-2 (Playwright MCP + Navigation) ✅

---

## 1. Contexte

Le **Sprint 7-2** a implémenté la navigation basique et l'intégration Playwright MCP.  
Le **Sprint 7-3** va extraire l'accessibility tree, compléter les tests et documenter Playwright.

**Objectifs :**
- ✅ Extraire l'accessibility tree (DOM + ARIA)
- ✅ Implémenter les tests d'intégration complets
- ✅ Documenter l'utilisation de Playwright

---

## 2. État initial (fin Sprint 7-2)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── types.ts                    ✅ (Sprint 7-1)
│   │   ├── navigator.ts                ✅ (Sprint 7-2)
│   │   └── playwright-mcp.ts           ✅ (Sprint 7-2)
│   └── ...
├── tests/
│   ├── browser/
│   │   ├── basic.test.ts               ✅ (Sprint 7-1)
│   │   ├── navigator.test.ts           ✅ (Sprint 7-2)
│   │   └── playwright-mcp.test.ts      ✅ (Sprint 7-2)
│   └── ...
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Implémenter l'extraction Accessibility Tree (Jour 1 — 8h)

**Fichier :** `src/browser/accessibility.ts`

```typescript
import { Navigator } from './navigator';
import { AccessibilityNode, AccessibilityResult } from './types';

/**
 * Accessibility — Extraction de l'accessibility tree
 * 
 * Extrait la structure d'accessibilité d'une page web,
 * incluant les rôles ARIA, noms, descriptions et valeurs.
 */
export class Accessibility {
  private navigator: Navigator;

  constructor(navigator: Navigator) {
    this.navigator = navigator;
  }

  /**
   * Extrait l'accessibility tree de la page actuelle
   * 
   * @returns Résultat de l'extraction
   */
  async extract(): Promise<AccessibilityResult> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const startTime = Date.now();

    // Extraire l'accessibility tree via Playwright
    const snapshot = await page.accessibility.snapshot({
      interestingOnly: false, // Inclure tous les nœuds
    });

    const extractionTime = Date.now() - startTime;

    if (!snapshot) {
      return {
        root: { role: 'none' },
        nodeCount: 0,
        extractionTime,
      };
    }

    // Convertir le snapshot en notre structure
    const root = this.convertNode(snapshot);
    const nodeCount = this.countNodes(root);

    return {
      root,
      nodeCount,
      extractionTime,
    };
  }

  /**
   * Convertit un nœud du snapshot Playwright en notre structure
   * 
   * @param node - Nœud du snapshot Playwright
   * @returns Nœud converti
   */
  private convertNode(node: any): AccessibilityNode {
    const converted: AccessibilityNode = {
      role: node.role,
    };

    if (node.name) {
      converted.name = node.name;
    }

    if (node.description) {
      converted.description = node.description;
    }

    if (node.value !== undefined) {
      converted.value = node.value;
    }

    if (node.level !== undefined) {
      converted.level = node.level;
    }

    if (node.url) {
      converted.url = node.url;
    }

    if (node.children && node.children.length > 0) {
      converted.children = node.children.map((child: any) => this.convertNode(child));
    }

    return converted;
  }

  /**
   * Compte le nombre total de nœuds dans l'arbre
   * 
   * @param node - Nœud racine
   * @returns Nombre de nœuds
   */
  private countNodes(node: AccessibilityNode): number {
    let count = 1;

    if (node.children) {
      for (const child of node.children) {
        count += this.countNodes(child);
      }
    }

    return count;
  }

  /**
   * Recherche des nœuds par rôle
   * 
   * @param role - Rôle à rechercher
   * @returns Liste de nœuds correspondants
   */
  async findByRole(role: string): Promise<AccessibilityNode[]> {
    const result = await this.extract();
    return this.findNodesByRole(result.root, role);
  }

  /**
   * Recherche récursive des nœuds par rôle
   * 
   * @param node - Nœud courant
   * @param role - Rôle à rechercher
   * @returns Liste de nœuds correspondants
   */
  private findNodesByRole(node: AccessibilityNode, role: string): AccessibilityNode[] {
    const results: AccessibilityNode[] = [];

    if (node.role === role) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByRole(child, role));
      }
    }

    return results;
  }

  /**
   * Recherche des nœuds par nom
   * 
   * @param name - Nom à rechercher (partiel ou complet)
   * @returns Liste de nœuds correspondants
   */
  async findByName(name: string): Promise<AccessibilityNode[]> {
    const result = await this.extract();
    return this.findNodesByName(result.root, name);
  }

  /**
   * Recherche récursive des nœuds par nom
   * 
   * @param node - Nœud courant
   * @param name - Nom à rechercher
   * @returns Liste de nœuds correspondants
   */
  private findNodesByName(node: AccessibilityNode, name: string): AccessibilityNode[] {
    const results: AccessibilityNode[] = [];

    if (node.name && node.name.toLowerCase().includes(name.toLowerCase())) {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByName(child, name));
      }
    }

    return results;
  }

  /**
   * Vérifie si un élément est accessible
   * 
   * @param selector - Sélecteur CSS
   * @returns true si l'élément est accessible
   */
  async isAccessible(selector: string): Promise<boolean> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const element = await page.$(selector);
    if (!element) {
      return false;
    }

    // Vérifier les attributs d'accessibilité
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaDescribedBy = await element.getAttribute('aria-describedby');
    const role = await element.getAttribute('role');
    const alt = await element.getAttribute('alt');
    const title = await element.getAttribute('title');

    // Un élément est accessible s'il a au moins un attribut d'accessibilité
    return !!(ariaLabel || ariaDescribedBy || role || alt || title);
  }

  /**
   * Obtient les violations d'accessibilité
   * 
   * @returns Liste de violations
   */
  async getViolations(): Promise<Array<{
    element: string;
    issue: string;
    severity: 'error' | 'warning';
  }>> {
    const page = this.navigator.getPage();
    if (!page) {
      throw new Error('Browser not started. Call start() first.');
    }

    const violations: Array<{
      element: string;
      issue: string;
      severity: 'error' | 'warning';
    }> = [];

    // Vérifier les images sans alt
    const images = await page.$$('img');
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt) {
        const src = await img.getAttribute('src');
        violations.push({
          element: `img[src="${src}"]`,
          issue: 'Image missing alt attribute',
          severity: 'error',
        });
      }
    }

    // Vérifier les inputs sans label
    const inputs = await page.$$('input, select, textarea');
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (!id && !ariaLabel && !ariaLabelledBy) {
        const type = await input.getAttribute('type');
        violations.push({
          element: `input[type="${type}"]`,
          issue: 'Input missing label',
          severity: 'error',
        });
      }
    }

    // Vérifier les boutons sans texte
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      if (!text?.trim() && !ariaLabel) {
        violations.push({
          element: 'button',
          issue: 'Button missing text or aria-label',
          severity: 'error',
        });
      }
    }

    return violations;
  }
}
```

**Tests :** `tests/browser/accessibility.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Navigator } from '../../src/browser/navigator';
import { Accessibility } from '../../src/browser/accessibility';

describe('Accessibility', () => {
  let navigator: Navigator;
  let accessibility: Accessibility;

  beforeAll(async () => {
    navigator = new Navigator();
    await navigator.start('chromium');
    accessibility = new Accessibility(navigator);
  });

  afterAll(async () => {
    await navigator.stop();
  });

  describe('extract', () => {
    it('should extract accessibility tree', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const result = await accessibility.extract();

      expect(result.root).toBeDefined();
      expect(result.root.role).toBe('WebArea');
      expect(result.nodeCount).toBeGreaterThan(0);
      expect(result.extractionTime).toBeGreaterThan(0);
    });

    it('should include headings', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const result = await accessibility.extract();

      // Trouver les headings
      const headings = accessibility.findNodesByRole(result.root, 'heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should include links', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const result = await accessibility.extract();

      // Trouver les liens
      const links = accessibility.findNodesByRole(result.root, 'link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('findByRole', () => {
    it('should find nodes by role', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const headings = await accessibility.findByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('findByName', () => {
    it('should find nodes by name', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const nodes = await accessibility.findByName('Example');
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe('isAccessible', () => {
    it('should check if element is accessible', async () => {
      await navigator.goto({ url: 'https://example.com' });

      // Le heading h1 devrait être accessible
      const isAccessible = await accessibility.isAccessible('h1');
      expect(isAccessible).toBe(true);
    });
  });

  describe('getViolations', () => {
    it('should detect accessibility violations', async () => {
      await navigator.goto({ url: 'https://example.com' });

      const violations = await accessibility.getViolations();

      // example.com est bien conçu, donc peu de violations
      expect(Array.isArray(violations)).toBe(true);
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/accessibility.test.ts
# ✅ 6 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/accessibility.ts
git add tests/browser/accessibility.test.ts
git commit -m "feat(browser): implement accessibility tree extraction"
```

---

### 3.2 Tests d'intégration complets (Jour 2 — 4h)

**Fichier :** `tests/browser/integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Navigator } from '../../src/browser/navigator';
import { Accessibility } from '../../src/browser/accessibility';
import fs from 'fs';
import path from 'path';

/**
 * Tests d'intégration complets pour Playwright
 * 
 * Teste les workflows complets :
 * - Navigation + screenshot + accessibility tree
 * - Navigation + trace + PDF
 * - Cross-browser (Chromium, Firefox, WebKit)
 */
describe('Playwright Integration Tests', () => {
  const testDir = './test-results/integration';

  beforeAll(() => {
    // Créer le dossier de test
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Nettoyer les fichiers de test
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Complete workflow', () => {
    it('should navigate, screenshot, and extract accessibility tree', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        // Navigation
        const navResult = await navigator.goto({
          url: 'https://example.com',
        });
        expect(navResult.title).toBe('Example Domain');

        // Screenshot
        const screenshotPath = path.join(testDir, 'workflow-screenshot.png');
        const screenshotResult = await navigator.screenshot({
          path: screenshotPath,
        });
        expect(screenshotResult.size).toBeGreaterThan(0);

        // Accessibility tree
        const accessibility = new Accessibility(navigator);
        const a11yResult = await accessibility.extract();
        expect(a11yResult.nodeCount).toBeGreaterThan(0);
      } finally {
        await navigator.stop();
      }
    });

    it('should navigate, trace, and generate PDF', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        // Démarrer la trace
        const tracePath = path.join(testDir, 'workflow-trace.zip');
        await navigator.startTrace({ path: tracePath });

        // Navigation
        await navigator.goto({ url: 'https://example.com' });

        // Arrêter la trace
        const traceResult = await navigator.stopTrace({ path: tracePath });
        expect(traceResult.size).toBeGreaterThan(0);

        // Générer PDF
        const pdfPath = path.join(testDir, 'workflow-page.pdf');
        const pdfResult = await navigator.pdf({ path: pdfPath });
        expect(pdfResult.size).toBeGreaterThan(0);
      } finally {
        await navigator.stop();
      }
    });
  });

  describe('Cross-browser', () => {
    const browsers = ['chromium', 'firefox', 'webkit'] as const;

    for (const browserType of browsers) {
      it(`should work with ${browserType}`, async () => {
        const navigator = new Navigator();
        await navigator.start(browserType);

        try {
          const result = await navigator.goto({
            url: 'https://example.com',
          });

          expect(result.title).toBe('Example Domain');
          expect(result.status).toBe(200);
        } finally {
          await navigator.stop();
        }
      });
    }
  });

  describe('Performance', () => {
    it('should navigate in less than 3 seconds', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        const result = await navigator.goto({
          url: 'https://example.com',
        });

        expect(result.loadTime).toBeLessThan(3000);
      } finally {
        await navigator.stop();
      }
    });

    it('should capture screenshot in less than 1 second', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        await navigator.goto({ url: 'https://example.com' });

        const startTime = Date.now();
        await navigator.screenshot({
          path: path.join(testDir, 'perf-screenshot.png'),
        });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(1000);
      } finally {
        await navigator.stop();
      }
    });

    it('should extract accessibility tree in less than 1 second', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        await navigator.goto({ url: 'https://example.com' });

        const accessibility = new Accessibility(navigator);
        const result = await accessibility.extract();

        expect(result.extractionTime).toBeLessThan(1000);
      } finally {
        await navigator.stop();
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid URL', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        await expect(
          navigator.goto({ url: 'not-a-valid-url' })
        ).rejects.toThrow();
      } finally {
        await navigator.stop();
      }
    });

    it('should handle timeout', async () => {
      const navigator = new Navigator();
      await navigator.start('chromium');

      try {
        await expect(
          navigator.goto({
            url: 'https://example.com',
            timeout: 1, // 1ms = timeout immédiat
          })
        ).rejects.toThrow();
      } finally {
        await navigator.stop();
      }
    });

    it('should throw error if browser not started', async () => {
      const navigator = new Navigator();

      await expect(
        navigator.goto({ url: 'https://example.com' })
      ).rejects.toThrow('Browser not started');
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/integration.test.ts
# ✅ 9 tests passent (3 cross-browser + 3 performance + 3 error handling)

npm run test:coverage -- tests/browser/
# ✅ Couverture totale > 80%
```

**Commit :**
```bash
git add tests/browser/integration.test.ts
git commit -m "test(browser): add comprehensive integration tests"
```

---

### 3.3 Documentation Playwright (Jour 3 — 4h)

**Fichier :** `docs/PLAYWRIGHT.md`

```markdown
# Playwright — Documentation

## Vue d'ensemble

EKTS utilise Playwright pour l'inspection automatisée de sites web. Playwright permet de :
- Naviguer sur des sites web (Chromium, Firefox, WebKit)
- Capturer des screenshots, traces et PDFs
- Extraire l'accessibility tree (structure DOM + ARIA)
- Exécuter du JavaScript dans le contexte de la page

**Version :** Playwright v1.40+ (octobre 2026)  
**Licence :** Apache 2.0 (open source)  
**Browsers supportés :** Chromium, Firefox, WebKit

## Installation

### Prérequis

- Node.js ≥ 18.x
- npm ≥ 9.x
- Espace disque : ~760 MB (pour les 3 browsers)

### Installation

```bash
# Installer Playwright
npm install --save-dev @playwright/test

# Installer les browsers
npx playwright install
```

### Vérification

```bash
# Vérifier la version
npx playwright --version

# Lister les browsers installés
npx playwright install --list
```

## Architecture

### Composants

```
src/browser/
├── types.ts                # Types TypeScript
├── navigator.ts            # Navigation basique (goto, screenshot, trace, PDF)
├── playwright-mcp.ts       # Intégration MCP
└── accessibility.ts        # Extraction accessibility tree
```

### Flux de données

```
1. Démarrer le navigateur
   ↓
2. Naviguer vers une URL
   ↓
3. Capturer screenshot / trace / PDF
   ↓
4. Extraire accessibility tree
   ↓
5. Arrêter le navigateur
```

## Utilisation

### Navigator — Navigation basique

```typescript
import { Navigator } from './browser/navigator';

// Démarrer le navigateur
const navigator = new Navigator();
await navigator.start('chromium'); // ou 'firefox', 'webkit'

// Naviguer vers une URL
const result = await navigator.goto({
  url: 'https://example.com',
  timeout: 30000,
  waitUntil: 'load',
});

console.log('Title:', result.title);
console.log('Load time:', result.loadTime, 'ms');

// Capturer un screenshot
await navigator.screenshot({
  path: 'screenshot.png',
  type: 'png',
  fullPage: true,
});

// Enregistrer une trace
await navigator.startTrace({ path: 'trace.zip' });
await navigator.goto({ url: 'https://example.com' });
await navigator.stopTrace({ path: 'trace.zip' });

// Générer un PDF
await navigator.pdf({
  path: 'page.pdf',
  format: 'A4',
  landscape: false,
});

// Arrêter le navigateur
await navigator.stop();
```

### Accessibility — Extraction accessibility tree

```typescript
import { Navigator } from './browser/navigator';
import { Accessibility } from './browser/accessibility';

const navigator = new Navigator();
await navigator.start('chromium');

const accessibility = new Accessibility(navigator);

// Naviguer vers une page
await navigator.goto({ url: 'https://example.com' });

// Extraire l'accessibility tree complet
const tree = await accessibility.extract();
console.log('Node count:', tree.nodeCount);
console.log('Root role:', tree.root.role);

// Rechercher des nœuds par rôle
const headings = await accessibility.findByRole('heading');
console.log('Found', headings.length, 'headings');

// Rechercher des nœuds par nom
const nodes = await accessibility.findByName('Example');
console.log('Found', nodes.length, 'nodes with "Example" in name');

// Vérifier si un élément est accessible
const isAccessible = await accessibility.isAccessible('h1');
console.log('h1 is accessible:', isAccessible);

// Obtenir les violations d'accessibilité
const violations = await accessibility.getViolations();
console.log('Found', violations.length, 'violations');

await navigator.stop();
```

### PlaywrightMCP — Intégration MCP

```typescript
import { PlaywrightMCP } from './browser/playwright-mcp';

const mcp = new PlaywrightMCP();

// Initialiser
await mcp.initialize();

// Naviguer
await mcp.goto('https://example.com');

// Obtenir le titre
const title = await mcp.getTitle();
console.log('Title:', title);

// Capturer un screenshot
await mcp.screenshot('screenshot.png');

// Exécuter du JavaScript
const result = await mcp.evaluate<string>('document.title');
console.log('JS result:', result);

// Arrêter
await mcp.shutdown();
```

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['list'],
  ],
  use: {
    headless: true,
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## Tests

### Exécuter les tests

```bash
# Tous les tests Playwright
npx playwright test

# Tests avec coverage
npm run test:coverage -- tests/browser/

# Tests sur un browser spécifique
npx playwright test --project=chromium

# Tests en mode headed (avec UI)
npx playwright test --headed

# Tests avec rapport HTML
npx playwright test --reporter=html
```

### Structure des tests

```
tests/browser/
├── basic.test.ts              # Tests basiques
├── navigator.test.ts          # Tests Navigator
├── playwright-mcp.test.ts     # Tests PlaywrightMCP
├── accessibility.test.ts      # Tests Accessibility
└── integration.test.ts        # Tests d'intégration
```

## Performance

### Cibles

| Opération | Cible | Mesure |
|-----------|-------|--------|
| Navigation | < 3s | `result.loadTime` |
| Screenshot | < 1s | Temps d'exécution |
| Trace | < 2s | Temps d'exécution |
| Accessibility tree | < 1s | `result.extractionTime` |
| PDF | < 3s | Temps d'exécution |

### Optimisations

- **Mode headless** : Plus rapide que le mode headed
- **Cache browser** : Réutiliser les instances de navigateur
- **Désactiver images** : Optionnel pour accélérer le chargement
- **Timeout adaptés** : Ajuster selon les besoins

## Accessibility Tree

### Structure

```typescript
interface AccessibilityNode {
  role: string;              // Rôle ARIA (ex: 'heading', 'link')
  name?: string;             // Nom accessible
  description?: string;      // Description accessible
  value?: string | number;   // Valeur (pour inputs)
  level?: number;            // Niveau (pour headings)
  url?: string;              // URL (pour links)
  children?: AccessibilityNode[]; // Enfants
}
```

### Rôles courants

| Rôle | Description |
|------|-------------|
| `WebArea` | Racine de l'arbre |
| `heading` | Titre (h1-h6) |
| `link` | Lien hypertexte |
| `button` | Bouton |
| `textbox` | Champ de texte |
| `checkbox` | Case à cocher |
| `radio` | Bouton radio |
| `list` | Liste |
| `listitem` | Élément de liste |
| `image` | Image |

### Violations d'accessibilité

Le module `Accessibility` détecte les violations courantes :
- Images sans attribut `alt`
- Inputs sans label
- Boutons sans texte ou `aria-label`

## Dépannage

### Playwright ne démarre pas

**Problème :** `Error: Executable doesn't exist`

**Solution :**
```bash
npx playwright install
```

### Timeout lors de la navigation

**Problème :** `Timeout 30000ms exceeded`

**Solutions :**
- Augmenter le timeout : `timeout: 60000`
- Vérifier la connexion Internet
- Utiliser `waitUntil: 'domcontentloaded'` au lieu de `'load'`

### Screenshot vide

**Problème :** Le screenshot est noir ou vide

**Solutions :**
- Vérifier que la page est chargée : `waitUntil: 'networkidle'`
- Attendre un élément spécifique : `await page.waitForSelector('h1')`

### Accessibility tree vide

**Problème :** `nodeCount: 0`

**Solutions :**
- Vérifier que la page est chargée
- Utiliser `interestingOnly: false` pour inclure tous les nœuds

## Ressources

- [Documentation Playwright](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Accessibility](https://playwright.dev/docs/api/class-accessibility)
- [Test Runner](https://playwright.dev/docs/test-runners)

## Références

- [Architecture technique](../Docs/02-ARCHITECTURE-TECHNIQUE.md#423-browser-inspector) — Section 4.2.3
- [ADR-011](../Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md#adr-011) — Playwright
```

**Validation :**
```bash
ls -la docs/PLAYWRIGHT.md
# ✅ Documentation créée

cat docs/PLAYWRIGHT.md | wc -l
# ✅ ~400 lignes
```

**Commit :**
```bash
git add docs/PLAYWRIGHT.md
git commit -m "docs: add Playwright documentation"
```

---

### 3.4 Vérification finale Sprint 7-3 (Jour 3, fin)

**Vérifications :**

```bash
# 1. Tous les tests
npm test tests/browser/
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage -- tests/browser/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/browser/
# ✅ types.ts, navigator.ts, playwright-mcp.ts, accessibility.ts

ls -la tests/browser/
# ✅ basic.test.ts, navigator.test.ts, playwright-mcp.test.ts, accessibility.test.ts, integration.test.ts

ls -la docs/PLAYWRIGHT.md
# ✅ Documentation existe

# 6. Test manuel accessibility tree
node -e "
const { Navigator } = require('./dist/browser/navigator');
const { Accessibility } = require('./dist/browser/accessibility');
const nav = new Navigator();
nav.start().then(() => nav.goto({ url: 'https://example.com' })).then(() => {
  const a11y = new Accessibility(nav);
  return a11y.extract();
}).then(r => {
  console.log('Node count:', r.nodeCount);
  console.log('Root role:', r.root.role);
  return nav.stop();
});
"
# ✅ Accessibility tree extrait

# 7. Test manuel violations
node -e "
const { Navigator } = require('./dist/browser/navigator');
const { Accessibility } = require('./dist/browser/accessibility');
const nav = new Navigator();
nav.start().then(() => nav.goto({ url: 'https://example.com' })).then(() => {
  const a11y = new Accessibility(nav);
  return a11y.getViolations();
}).then(v => {
  console.log('Violations:', v.length);
  return nav.stop();
});
"
# ✅ Violations détectées

# 8. Push
git push origin feat/sprint-7-3
```

**Point de contrôle Sprint 7-3 :**
- ✅ Accessibility tree extrait (DOM + ARIA)
- ✅ Tests d'intégration complets
- ✅ Tests cross-browser (Chromium, Firefox, WebKit)
- ✅ Tests performance (navigation < 3s, screenshot < 1s)
- ✅ Documentation complète
- ✅ Couverture > 80%

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/browser/accessibility.ts` | ~200 | Extraction accessibility tree |
| `tests/browser/accessibility.test.ts` | ~100 | Tests Accessibility |
| `tests/browser/integration.test.ts` | ~150 | Tests d'intégration |
| `docs/PLAYWRIGHT.md` | ~400 | Documentation Playwright |

**Total Sprint 7-3 :** ~850 lignes

---

## 5. Commits

```bash
git commit -m "feat(browser): implement accessibility tree extraction"
git commit -m "test(browser): add comprehensive integration tests"
git commit -m "docs: add Playwright documentation"
```

---

## 6. Récapitulatif complet Sprint 7

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 7-1 | 3 jours | 3 fichiers | ~240 |
| Sprint 7-2 | 4 jours | 4 fichiers | ~550 |
| Sprint 7-3 | 3 jours | 4 fichiers | ~850 |
| **Total** | **10 jours** | **11 fichiers** | **~1 640** |

---

## 7. Transition vers Sprint 8

**Prérequis pour Sprint 8 :**
- ✅ Sprint 7 terminé avec succès
- ✅ Playwright fonctionnel (3 browsers)
- ✅ Playwright MCP intégré
- ✅ Navigation basique opérationnelle
- ✅ Accessibility tree extractible
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**Sprint 8 — 4 Niveaux d'Inspection (Semaine 15-16) :**
- 🎯 Inspection L1 (rapide) : Screenshot + accessibility tree
- 🎯 Inspection L2 (standard) : L1 + Lighthouse + SEO
- 🎯 Inspection L3 (approfondie) : L2 + UX + contenu
- 🎯 Lighthouse integration (performance)
- 🎯 axe-core integration (accessibilité)

---

**Fin du document Sprint 7-3**
