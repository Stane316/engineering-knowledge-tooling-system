# Sprint 8-1 — Types + Inspection L1 (Semaine 15)

**Durée :** 3 jours  
**Objectif :** Définir les types d'inspection et implémenter l'inspection L1 (rapide)  
**Dépendance :** Sprint 7 (Playwright Setup) ✅
**Statut :** ✅ LIVRÉ (23 octobre 2026)
**Bilan de livraison :** `inspection/types.ts` (niveaux, budgets, contrats sérialisables), `inspection/snapshot.ts` (photographie du DOM en une évaluation, normalisée), `inspection/level-1.ts` ; **19 tests** (`tests/browser/inspection/level-1.test.ts`). Écart E8-7 : `LaunchOptions.context` ajouté pour viewport et user-agent.

---

## 1. Contexte

Le **Sprint 7 (Playwright Setup)** a mis en place :
- ✅ Navigator fonctionnel (goto, screenshot, trace, PDF)
- ✅ Accessibility tree extractible
- ✅ Tests d'intégration > 80% couverture

Le **Sprint 8-1** va :
- 🎯 Définir les types TypeScript pour les 3 niveaux d'inspection
- 🎯 Implémenter l'inspection L1 (rapide : < 10s)
- 🎯 Collecter les données de base (screenshot, accessibility tree, métadonnées)

---

## 2. État initial (fin Sprint 7)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── types.ts                    ✅ (Sprint 7-1)
│   │   ├── navigator.ts                ✅ (Sprint 7-2)
│   │   ├── playwright-mcp.ts           ✅ (Sprint 7-2)
│   │   ├── accessibility.ts            ✅ (Sprint 7-3)
│   │   └── inspection/
│   │       └── (vide — à créer Sprint 8)
│   └── ...
├── tests/
│   └── browser/
│       ├── navigator.test.ts           ✅ (Sprint 7-2)
│       ├── accessibility.test.ts       ✅ (Sprint 7-3)
│       └── integration.test.ts         ✅ (Sprint 7-3)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Types inspection (jour 1 — 4h)

**Fichier :** `src/browser/inspection/types.ts`

**Types à définir :**

```typescript
/**
 * Niveau d'inspection
 */
export type InspectionLevel = 'L1' | 'L2' | 'L3';

/**
 * Options d'inspection
 */
export interface InspectionOptions {
  /** Niveau d'inspection */
  level: InspectionLevel;
  /** URL à inspecter */
  url: string;
  /** Viewport (défaut: 1920x1080) */
  viewport?: { width: number; height: number };
  /** User agent (défaut: Chrome) */
  userAgent?: string;
  /** Timeout (défaut: 30000ms) */
  timeout?: number;
}

/**
 * Artifacts d'inspection (fichiers générés)
 */
export interface InspectionArtifacts {
  /** Screenshot PNG */
  screenshot?: string;
  /** Trace ZIP */
  trace?: string;
  /** PDF */
  pdf?: string;
  /** Rapport JSON */
  report?: string;
}

/**
 * Métadonnées de page
 */
export interface PageMetadata {
  /** URL finale (après redirections) */
  url: string;
  /** Titre de la page */
  title: string;
  /** Description meta */
  description?: string;
  /** Viewport utilisé */
  viewport: { width: number; height: number };
  /** User agent utilisé */
  userAgent: string;
  /** Temps de chargement (ms) */
  loadTime: number;
  /** Statut HTTP */
  httpStatus: number;
}

/**
 * Résultat d'inspection L1 (rapide)
 */
export interface L1InspectionResult {
  /** Niveau d'inspection */
  level: 'L1';
  /** URL inspectée */
  url: string;
  /** Date d'inspection (ISO 8601) */
  timestamp: string;
  /** Durée d'inspection (ms) */
  duration: number;
  /** Métadonnées de page */
  metadata: PageMetadata;
  /** Accessibilité (accessibility tree) */
  accessibility: {
    /** Nombre total de nœuds */
    nodeCount: number;
    /** Violations basiques */
    violations: Array<{
      element: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  };
  /** Artifacts générés */
  artifacts: InspectionArtifacts;
}

/**
 * Résultat d'inspection L2 (standard)
 */
export interface L2InspectionResult extends L1InspectionResult {
  level: 'L2';
  /** Performance (Lighthouse) */
  lighthouse: {
    /** Score performance (0-100) */
    performance: {
      score: number;
      metrics: {
        lcp: number; // Largest Contentful Paint (ms)
        fid: number; // First Input Delay (ms)
        cls: number; // Cumulative Layout Shift
        ttfb: number; // Time to First Byte (ms)
      };
    };
    /** Score SEO (0-100) */
    seo: {
      score: number;
      issues: Array<{
        title: string;
        description: string;
        severity: 'error' | 'warning' | 'info';
      }>;
    };
  };
}

/**
 * Résultat d'inspection L3 (approfondie)
 */
export interface L3InspectionResult extends L2InspectionResult {
  level: 'L3';
  /** Accessibilité (axe-core) */
  axe: {
    /** Violations WCAG 2.2 */
    violations: Array<{
      id: string;
      impact: 'minor' | 'moderate' | 'serious' | 'critical';
      description: string;
      help: string;
      helpUrl: string;
      nodes: number;
    }>;
    /** Score accessibilité (0-100) */
    score: number;
  };
  /** UX (heuristiques Nielsen) */
  ux: {
    /** Score UX (0-100) */
    score: number;
    /** Heuristiques évaluées */
    heuristics: Array<{
      id: string;
      name: string;
      score: number;
      issues: string[];
    }>;
  };
  /** Contenu */
  content: {
    /** Score contenu (0-100) */
    score: number;
    /** Métriques */
    metrics: {
      wordCount: number;
      readingTime: number; // minutes
      readabilityScore: number; // Flesch-Kincaid
    };
  };
}

/**
 * Résultat d'inspection (union des 3 niveaux)
 */
export type InspectionResult = L1InspectionResult | L2InspectionResult | L3InspectionResult;
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK
```

**Commit :**
```bash
git add src/browser/inspection/types.ts
git commit -m "feat(browser): add inspection types (L1, L2, L3)"
```

---

### 3.2 Inspection L1 — Screenshot + Accessibility tree (jour 2 — 8h)

**Fichier :** `src/browser/inspection/level-1.ts`

**Implémentation :**

```typescript
import { Navigator } from '../navigator';
import { Accessibility } from '../accessibility';
import {
  InspectionOptions,
  L1InspectionResult,
  PageMetadata,
  InspectionArtifacts,
} from './types';
import fs from 'fs';
import path from 'path';

/**
 * Inspection L1 (rapide)
 * 
 * Collecte :
 * - Screenshot
 * - Accessibility tree
 * - Métadonnées basiques (URL, titre, viewport)
 * 
 * Durée cible : < 10s
 */
export class Level1Inspector {
  private outputDir: string;

  constructor(outputDir: string = './data/inspections') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  /**
   * Effectue une inspection L1
   */
  async inspect(options: InspectionOptions): Promise<L1InspectionResult> {
    const startTime = Date.now();

    // Créer le navigateur
    const navigator = new Navigator();
    await navigator.start('chromium');

    try {
      // Naviguer vers l'URL
      const navResult = await navigator.goto({
        url: options.url,
        timeout: options.timeout ?? 30000,
      });

      // Capturer le screenshot
      const screenshotPath = await this.captureScreenshot(navigator, options);

      // Extraire l'accessibility tree
      const accessibility = new Accessibility(navigator);
      const a11yResult = await accessibility.extract();

      // Collecter les violations basiques
      const violations = await accessibility.getViolations();

      // Construire les métadonnées
      const metadata: PageMetadata = {
        url: navResult.url,
        title: navResult.title,
        description: await this.extractDescription(navigator),
        viewport: options.viewport ?? { width: 1920, height: 1080 },
        userAgent: options.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        loadTime: navResult.loadTime,
        httpStatus: navResult.status,
      };

      // Construire les artifacts
      const artifacts: InspectionArtifacts = {
        screenshot: screenshotPath,
      };

      // Construire le résultat
      const result: L1InspectionResult = {
        level: 'L1',
        url: options.url,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata,
        accessibility: {
          nodeCount: a11yResult.nodeCount,
          violations,
        },
        artifacts,
      };

      return result;
    } finally {
      await navigator.stop();
    }
  }

  /**
   * Capture le screenshot
   */
  private async captureScreenshot(
    navigator: Navigator,
    options: InspectionOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);

    await navigator.screenshot({
      path: filepath,
      fullPage: true,
    });

    return filepath;
  }

  /**
   * Extrait la description meta
   */
  private async extractDescription(navigator: Navigator): Promise<string | undefined> {
    const page = navigator.getPage();
    if (!page) return undefined;

    const description = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content')
    ).catch(() => undefined);

    return description ?? undefined;
  }

  /**
   * Crée le dossier de sortie si nécessaire
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
}
```

**Tests :** `tests/browser/inspection/level-1.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Level1Inspector } from '../../../src/browser/inspection/level-1';
import fs from 'fs';
import path from 'path';

describe('Level1Inspector', () => {
  let inspector: Level1Inspector;
  const testOutputDir = './test-results/inspection-l1';

  beforeAll(() => {
    inspector = new Level1Inspector(testOutputDir);
  });

  afterAll(() => {
    // Nettoyer les fichiers de test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('inspect', () => {
    it('should perform L1 inspection on example.com', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
      });

      expect(result.level).toBe('L1');
      expect(result.url).toBe('https://example.com');
      expect(result.duration).toBeLessThan(10000); // < 10s
      expect(result.metadata.title).toBe('Example Domain');
      expect(result.accessibility.nodeCount).toBeGreaterThan(0);
      expect(result.artifacts.screenshot).toBeDefined();
      expect(fs.existsSync(result.artifacts.screenshot!)).toBe(true);
    });

    it('should capture screenshot', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
      });

      expect(result.artifacts.screenshot).toBeDefined();
      expect(fs.existsSync(result.artifacts.screenshot!)).toBe(true);
      
      const stats = fs.statSync(result.artifacts.screenshot!);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should extract accessibility tree', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
      });

      expect(result.accessibility.nodeCount).toBeGreaterThan(0);
      expect(Array.isArray(result.accessibility.violations)).toBe(true);
    });

    it('should collect metadata', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
      });

      expect(result.metadata.url).toBe('https://example.com/');
      expect(result.metadata.title).toBe('Example Domain');
      expect(result.metadata.viewport).toBeDefined();
      expect(result.metadata.loadTime).toBeGreaterThan(0);
      expect(result.metadata.httpStatus).toBe(200);
    });

    it('should complete in less than 10 seconds', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
      });

      expect(result.duration).toBeLessThan(10000);
    });

    it('should use custom viewport', async () => {
      const result = await inspector.inspect({
        level: 'L1',
        url: 'https://example.com',
        viewport: { width: 1366, height: 768 },
      });

      expect(result.metadata.viewport).toEqual({ width: 1366, height: 768 });
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/inspection/level-1.test.ts
# ✅ 6 tests passent

npm run test:coverage -- tests/browser/inspection/level-1.test.ts
# ✅ > 80% couverture

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/inspection/level-1.ts
git add tests/browser/inspection/level-1.test.ts
git commit -m "feat(browser): implement inspection L1 (rapid)"
```

---

### 3.3 Vérifications finales Sprint 8-1 (jour 3)

**Vérifications :**

```bash
# 1. Tests unitaires
npm test tests/browser/inspection/level-1.test.ts
# ✅ 6 tests passent

# 2. Couverture
npm run test:coverage -- tests/browser/inspection/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Vérification fichiers
ls -la src/browser/inspection/
# ✅ types.ts, level-1.ts

# 6. Test manuel L1
node -e "
const { Level1Inspector } = require('./dist/browser/inspection/level-1');
const inspector = new Level1Inspector();
inspector.inspect({ level: 'L1', url: 'https://example.com' }).then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Title:', r.metadata.title);
  console.log('Screenshot:', r.artifacts.screenshot);
});
"
# ✅ Inspection L1 fonctionne

# 7. Vérifier performance < 10s
node -e "
const { Level1Inspector } = require('./dist/browser/inspection/level-1');
const inspector = new Level1Inspector();
const start = Date.now();
inspector.inspect({ level: 'L1', url: 'https://example.com' }).then(r => {
  const duration = Date.now() - start;
  console.log('Duration:', duration, 'ms');
  console.log('Performance OK:', duration < 10000);
});
"
# ✅ Performance < 10s

# 8. Vérifier screenshot créé
ls -la data/inspections/
# ✅ screenshot-*.png existe

# 9. Vérification Git
git status
# ✅ Tous les changements commités

# 10. Push
git push origin feat/sprint-8-1
```

**Point de contrôle Sprint 8-1 :**
- ✅ Types inspection définis (L1, L2, L3)
- ✅ Inspection L1 fonctionne (< 10s)
- ✅ Screenshot capturé
- ✅ Accessibility tree extrait
- ✅ Métadonnées basiques collectées
- ✅ Tests unitaires L1 > 80% couverture
- ✅ Performance respectée

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/browser/inspection/types.ts` | ~150 | Types inspection (L1, L2, L3) |
| `src/browser/inspection/level-1.ts` | ~120 | Inspection L1 (rapide) |
| `tests/browser/inspection/level-1.test.ts` | ~120 | Tests L1 |

**Total Sprint 8-1 :** ~390 lignes

---

## 5. Commits

```bash
git commit -m "feat(browser): add inspection types (L1, L2, L3)"
git commit -m "feat(browser): implement inspection L1 (rapid)"
```

---

## 6. Transition vers Sprint 8-2

**Prérequis pour Sprint 8-2 :**
- ✅ Sprint 8-1 terminé avec succès
- ✅ Types inspection définis
- ✅ Inspection L1 fonctionnelle
- ✅ Tests unitaires > 80%

**Sprint 8-2 va implémenter :**
- 🎯 Intégration Lighthouse (Core Web Vitals)
- 🎯 Inspection L2 (L1 + Lighthouse + SEO)
- 🎯 Tests unitaires L2

---

**Fin du document Sprint 8-1**
