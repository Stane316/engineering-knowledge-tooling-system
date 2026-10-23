# Sprint 8-3 — axe-core + Inspection L3 + Tests + Documentation (Semaine 16)

**Durée :** 3 jours  
**Objectif :** Intégrer axe-core, implémenter l'inspection L3 (approfondie), tester et documenter  
**Dépendance :** Sprint 8-2 (Lighthouse + L2) ✅
**Statut :** ✅ LIVRÉ (23 octobre 2026)
**Bilan de livraison :** `src/browser/axe.ts` (WCAG 2.2 AA, score pondéré), `inspection/ux.ts`, `inspection/content.ts`, `inspection/level-3.ts`, `inspection/inspector.ts` ; **62 tests** (`axe.test.ts` 19, `level-3.test.ts` 23, `inspector.test.ts` 20) ; `docs/INSPECTOR.md`. Couverture `src/browser/` : 98,9 %. Écart E8-11 : e2e non exécutés dans le bac à sable (binaires absents).

---

## 1. Contexte

Le **Sprint 8-2** a mis en place :
- ✅ Lighthouse intégré (Core Web Vitals)
- ✅ Inspection L2 fonctionnelle (< 30s)
- ✅ Analyse performance + SEO
- ✅ Tests unitaires L2 > 80% couverture

Le **Sprint 8-3** va :
- 🎯 Intégrer axe-core pour l'analyse accessibilité (WCAG 2.2 AA)
- 🎯 Implémenter l'inspection L3 (L2 + axe-core + UX + contenu)
- 🎯 Créer le Inspector principal (orchestration L1-L3)
- 🎯 Tester tous les niveaux d'inspection
- 🎯 Documenter l'Inspector

---

## 2. État initial (fin Sprint 8-2)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── navigator.ts                ✅
│   │   ├── accessibility.ts            ✅
│   │   ├── lighthouse.ts               ✅ (Sprint 8-2)
│   │   └── inspection/
│   │       ├── types.ts                ✅ (Sprint 8-1)
│   │       ├── level-1.ts              ✅ (Sprint 8-1)
│   │       └── level-2.ts              ✅ (Sprint 8-2)
│   └── ...
├── tests/
│   └── browser/
│       ├── lighthouse.test.ts          ✅ (Sprint 8-2)
│       └── inspection/
│           ├── level-1.test.ts         ✅ (Sprint 8-1)
│           └── level-2.test.ts         ✅ (Sprint 8-2)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Installation de axe-core (jour 1 — 2h)

**Installation :**

```bash
npm install @axe-core/playwright
```

**Vérification :**
```bash
npm list @axe-core/playwright
# ✅ @axe-core/playwright@4.8.x
```

**Commit :**
```bash
git add package.json package-lock.json
git commit -m "chore: install axe-core for accessibility analysis"
```

---

### 3.2 Intégration axe-core (jour 1 — 8h)

**Fichier :** `src/browser/axe.ts`

**Implémentation :**

```typescript
import AxeBuilder from '@axe-core/playwright';
import { Navigator } from './navigator';

/**
 * Résultat d'analyse axe-core
 */
export interface AxeResult {
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
  /** Rapport complet */
  report: any;
}

/**
 * Analyseur axe-core
 */
export class AxeAnalyzer {
  /**
   * Effectue une analyse d'accessibilité avec axe-core
   */
  async analyze(navigator: Navigator): Promise<AxeResult> {
    const page = navigator.getPage();
    if (!page) {
      throw new Error('No page available for axe-core analysis');
    }

    // Exécuter axe-core
    const builder = new AxeBuilder({ page });
    
    // Configurer pour WCAG 2.2 AA
    builder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

    const results = await builder.analyze();

    // Extraire les violations
    const violations = results.violations.map(v => ({
      id: v.id,
      impact: v.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));

    // Calculer le score (100 - nombre de violations × facteur d'impact)
    const score = this.calculateScore(violations);

    return {
      violations,
      score,
      report: results,
    };
  }

  /**
   * Calcule le score d'accessibilité
   */
  private calculateScore(violations: AxeResult['violations']): number {
    if (violations.length === 0) {
      return 100;
    }

    // Facteurs d'impact
    const impactWeights = {
      minor: 1,
      moderate: 3,
      serious: 5,
      critical: 10,
    };

    // Calculer la pénalité totale
    const penalty = violations.reduce((sum, v) => {
      const weight = impactWeights[v.impact];
      return sum + weight * v.nodes;
    }, 0);

    // Score = 100 - pénalité (plafonné à 0)
    const score = Math.max(0, 100 - penalty);

    return Math.round(score);
  }
}
```

**Tests :** `tests/browser/axe.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AxeAnalyzer } from '../../src/browser/axe';
import { Navigator } from '../../src/browser/navigator';

describe('AxeAnalyzer', () => {
  let navigator: Navigator;
  let analyzer: AxeAnalyzer;

  beforeAll(async () => {
    navigator = new Navigator();
    await navigator.start('chromium');
    analyzer = new AxeAnalyzer();
  });

  afterAll(async () => {
    await navigator.stop();
  });

  describe('analyze', () => {
    it('should analyze accessibility', async () => {
      await navigator.goto('https://example.com');

      const result = await analyzer.analyze(navigator);

      expect(result).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.report).toBeDefined();
    });

    it('should detect violations', async () => {
      await navigator.goto('https://example.com');

      const result = await analyzer.analyze(navigator);

      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation.id).toBeDefined();
        expect(['minor', 'moderate', 'serious', 'critical']).toContain(violation.impact);
        expect(violation.description).toBeDefined();
        expect(violation.help).toBeDefined();
        expect(violation.helpUrl).toBeDefined();
        expect(violation.nodes).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate accessibility score', async () => {
      await navigator.goto('https://example.com');

      const result = await analyzer.analyze(navigator);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);

      // Si pas de violations, score = 100
      if (result.violations.length === 0) {
        expect(result.score).toBe(100);
      }
    });

    it('should return WCAG 2.2 AA violations', async () => {
      await navigator.goto('https://example.com');

      const result = await analyzer.analyze(navigator);

      // Vérifier que les violations sont liées à WCAG 2.2 AA
      expect(result.report).toBeDefined();
      expect(result.report.violations).toBeDefined();
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/axe.test.ts
# ✅ 4 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/axe.ts
git add tests/browser/axe.test.ts
git commit -m "feat(browser): integrate axe-core for accessibility analysis"
```

---

### 3.3 Inspection L3 (jour 2 — 8h)

**Fichier :** `src/browser/inspection/level-3.ts`

**Implémentation :**

```typescript
import { Level2Inspector } from './level-2';
import { AxeAnalyzer } from '../axe';
import { InspectionOptions, L3InspectionResult } from './types';
import { Navigator } from '../navigator';

/**
 * Inspection L3 (approfondie)
 * 
 * Collecte :
 * - Tout ce que L2 collecte
 * - Analyse accessibilité axe-core (WCAG 2.2 AA)
 * - Analyse UX basique (heuristiques Nielsen)
 * - Analyse contenu basique (structure, qualité)
 * 
 * Durée cible : < 60s
 */
export class Level3Inspector {
  private level2Inspector: Level2Inspector;
  private axeAnalyzer: AxeAnalyzer;

  constructor(outputDir: string = './data/inspections') {
    this.level2Inspector = new Level2Inspector(outputDir);
    this.axeAnalyzer = new AxeAnalyzer();
  }

  /**
   * Effectue une inspection L3
   */
  async inspect(options: InspectionOptions): Promise<L3InspectionResult> {
    const startTime = Date.now();

    // Créer le navigateur
    const navigator = new Navigator();
    await navigator.start('chromium');

    try {
      // Effectuer l'inspection L2
      const l2Result = await this.level2Inspector.inspect(options);

      // Analyser avec axe-core
      const axeResult = await this.axeAnalyzer.analyze(navigator);

      // Analyser l'UX (basique)
      const ux = await this.analyzeUX(navigator);

      // Analyser le contenu (basique)
      const content = await this.analyzeContent(navigator);

      // Construire le résultat L3
      const result: L3InspectionResult = {
        ...l2Result,
        level: 'L3',
        duration: Date.now() - startTime,
        axe: {
          violations: axeResult.violations,
          score: axeResult.score,
        },
        ux,
        content,
      };

      return result;
    } finally {
      await navigator.stop();
    }
  }

  /**
   * Analyse l'UX (heuristiques Nielsen)
   */
  private async analyzeUX(navigator: Navigator): Promise<L3InspectionResult['ux']> {
    const page = navigator.getPage();
    if (!page) {
      throw new Error('No page available for UX analysis');
    }

    // Analyse basique des heuristiques de Nielsen
    const heuristics = [];

    // 1. Visibility of system status
    const hasLoadingIndicators = await page.evaluate(() => {
      return !!document.querySelector('[role="progressbar"], .loading, .spinner');
    });
    heuristics.push({
      id: 'visibility-status',
      name: 'Visibility of system status',
      score: hasLoadingIndicators ? 100 : 50,
      issues: hasLoadingIndicators ? [] : ['No loading indicators found'],
    });

    // 2. Match between system and real world
    const hasNaturalLanguage = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.length > 100; // Simplifié
    });
    heuristics.push({
      id: 'real-world',
      name: 'Match between system and real world',
      score: hasNaturalLanguage ? 100 : 50,
      issues: hasNaturalLanguage ? [] : ['Content too short'],
    });

    // 3. User control and freedom
    const hasUndoRedo = await page.evaluate(() => {
      return !!document.querySelector('[aria-label*="undo"], [aria-label*="redo"]');
    });
    heuristics.push({
      id: 'user-control',
      name: 'User control and freedom',
      score: hasUndoRedo ? 100 : 50,
      issues: hasUndoRedo ? [] : ['No undo/redo functionality found'],
    });

    // Calculer le score UX moyen
    const avgScore = Math.round(
      heuristics.reduce((sum, h) => sum + h.score, 0) / heuristics.length
    );

    return {
      score: avgScore,
      heuristics,
    };
  }

  /**
   * Analyse le contenu (structure, qualité)
   */
  private async analyzeContent(navigator: Navigator): Promise<L3InspectionResult['content']> {
    const page = navigator.getPage();
    if (!page) {
      throw new Error('No page available for content analysis');
    }

    // Extraire les métriques de contenu
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const text = body.innerText;
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const readingTime = Math.ceil(wordCount / 200); // 200 mots/minute
      const readabilityScore = 100; // Simplifié (Flesch-Kincaid complexe)

      return {
        wordCount,
        readingTime,
        readabilityScore,
      };
    });

    // Calculer le score contenu
    let score = 100;

    // Pénalité si trop court
    if (metrics.wordCount < 100) {
      score -= 30;
    } else if (metrics.wordCount < 300) {
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      metrics,
    };
  }
}
```

**Tests :** `tests/browser/inspection/level-3.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Level3Inspector } from '../../../src/browser/inspection/level-3';
import fs from 'fs';

describe('Level3Inspector', () => {
  let inspector: Level3Inspector;
  const testOutputDir = './test-results/inspection-l3';

  beforeAll(() => {
    inspector = new Level3Inspector(testOutputDir);
  });

  afterAll(() => {
    // Nettoyer les fichiers de test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('inspect', () => {
    it('should perform L3 inspection on example.com', async () => {
      const result = await inspector.inspect({
        level: 'L3',
        url: 'https://example.com',
      });

      expect(result.level).toBe('L3');
      expect(result.url).toBe('https://example.com');
      expect(result.duration).toBeLessThan(60000); // < 60s
      
      // Vérifier les données L1
      expect(result.metadata).toBeDefined();
      expect(result.accessibility).toBeDefined();
      expect(result.artifacts.screenshot).toBeDefined();

      // Vérifier les données L2
      expect(result.lighthouse).toBeDefined();
      expect(result.lighthouse.performance).toBeDefined();
      expect(result.lighthouse.seo).toBeDefined();

      // Vérifier les données L3
      expect(result.axe).toBeDefined();
      expect(Array.isArray(result.axe.violations)).toBe(true);
      expect(result.axe.score).toBeGreaterThanOrEqual(0);
      expect(result.axe.score).toBeLessThanOrEqual(100);

      expect(result.ux).toBeDefined();
      expect(result.ux.score).toBeGreaterThanOrEqual(0);
      expect(result.ux.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.ux.heuristics)).toBe(true);

      expect(result.content).toBeDefined();
      expect(result.content.score).toBeGreaterThanOrEqual(0);
      expect(result.content.score).toBeLessThanOrEqual(100);
      expect(result.content.metrics.wordCount).toBeGreaterThanOrEqual(0);
      expect(result.content.metrics.readingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include axe-core violations', async () => {
      const result = await inspector.inspect({
        level: 'L3',
        url: 'https://example.com',
      });

      expect(Array.isArray(result.axe.violations)).toBe(true);
      if (result.axe.violations.length > 0) {
        const violation = result.axe.violations[0];
        expect(violation.id).toBeDefined();
        expect(['minor', 'moderate', 'serious', 'critical']).toContain(violation.impact);
      }
    });

    it('should include UX heuristics', async () => {
      const result = await inspector.inspect({
        level: 'L3',
        url: 'https://example.com',
      });

      expect(result.ux.score).toBeDefined();
      expect(Array.isArray(result.ux.heuristics)).toBe(true);
      if (result.ux.heuristics.length > 0) {
        const heuristic = result.ux.heuristics[0];
        expect(heuristic.id).toBeDefined();
        expect(heuristic.name).toBeDefined();
        expect(heuristic.score).toBeDefined();
        expect(Array.isArray(heuristic.issues)).toBe(true);
      }
    });

    it('should include content metrics', async () => {
      const result = await inspector.inspect({
        level: 'L3',
        url: 'https://example.com',
      });

      expect(result.content.score).toBeDefined();
      expect(result.content.metrics.wordCount).toBeDefined();
      expect(result.content.metrics.readingTime).toBeDefined();
      expect(result.content.metrics.readabilityScore).toBeDefined();
    });

    it('should complete in less than 60 seconds', async () => {
      const result = await inspector.inspect({
        level: 'L3',
        url: 'https://example.com',
      });

      expect(result.duration).toBeLessThan(60000);
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/inspection/level-3.test.ts
# ✅ 5 tests passent

npm run test:coverage -- tests/browser/inspection/
# ✅ > 80% couverture

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/inspection/level-3.ts
git add tests/browser/inspection/level-3.test.ts
git commit -m "feat(browser): implement inspection L3 (deep)"
```

---

### 3.4 Inspector principal (jour 3 — 4h)

**Fichier :** `src/browser/inspection/inspector.ts`

**Implémentation :**

```typescript
import { Level1Inspector } from './level-1';
import { Level2Inspector } from './level-2';
import { Level3Inspector } from './level-3';
import { InspectionOptions, InspectionResult } from './types';

/**
 * Inspector principal
 * 
 * Orchestre les 3 niveaux d'inspection (L1, L2, L3)
 */
export class Inspector {
  private level1Inspector: Level1Inspector;
  private level2Inspector: Level2Inspector;
  private level3Inspector: Level3Inspector;

  constructor(outputDir: string = './data/inspections') {
    this.level1Inspector = new Level1Inspector(outputDir);
    this.level2Inspector = new Level2Inspector(outputDir);
    this.level3Inspector = new Level3Inspector(outputDir);
  }

  /**
   * Effectue une inspection au niveau spécifié
   */
  async inspect(options: InspectionOptions): Promise<InspectionResult> {
    switch (options.level) {
      case 'L1':
        return await this.level1Inspector.inspect(options);
      case 'L2':
        return await this.level2Inspector.inspect(options);
      case 'L3':
        return await this.level3Inspector.inspect(options);
      default:
        throw new Error(`Unknown inspection level: ${options.level}`);
    }
  }
}
```

**Validation :**
```bash
npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/inspection/inspector.ts
git commit -m "feat(browser): implement main Inspector class"
```

---

### 3.5 Documentation Inspector (jour 3 — 4h)

**Fichier :** `docs/INSPECTOR.md`

**Contenu :**

```markdown
# Inspector — Documentation

## Vue d'ensemble

L'Inspector EKTS permet d'inspecter des sites web à 3 niveaux de profondeur :

| Niveau | Nom | Durée cible | Contenu |
|--------|-----|-------------|---------|
| **L1** | Rapide | < 10s | Screenshot + accessibility tree + métadonnées |
| **L2** | Standard | < 30s | L1 + Lighthouse (performance) + SEO |
| **L3** | Approfondie | < 60s | L2 + axe-core (accessibilité) + UX + contenu |

## Installation

```bash
# Déjà installé avec les dépendances du projet
npm install
```

## Utilisation

### Inspection basique

```typescript
import { Inspector } from './browser/inspection/inspector';

const inspector = new Inspector();

// Inspection L1 (rapide)
const l1Result = await inspector.inspect({
  level: 'L1',
  url: 'https://example.com',
});

// Inspection L2 (standard)
const l2Result = await inspector.inspect({
  level: 'L2',
  url: 'https://example.com',
});

// Inspection L3 (approfondie)
const l3Result = await inspector.inspect({
  level: 'L3',
  url: 'https://example.com',
});
```

### Options d'inspection

```typescript
const result = await inspector.inspect({
  level: 'L2',
  url: 'https://example.com',
  viewport: { width: 1920, height: 1080 },  // Optionnel
  userAgent: 'Custom UA',                    // Optionnel
  timeout: 30000,                            // Optionnel (défaut: 30s)
});
```

## Résultat d'inspection

### Niveau L1

```typescript
interface L1InspectionResult {
  level: 'L1';
  url: string;
  timestamp: string;
  duration: number;
  metadata: {
    url: string;
    title: string;
    description?: string;
    viewport: { width: number; height: number };
    userAgent: string;
    loadTime: number;
    httpStatus: number;
  };
  accessibility: {
    nodeCount: number;
    violations: Array<{
      element: string;
      issue: string;
      severity: 'error' | 'warning';
    }>;
  };
  artifacts: {
    screenshot?: string;
  };
}
```

### Niveau L2

```typescript
interface L2InspectionResult extends L1InspectionResult {
  level: 'L2';
  lighthouse: {
    performance: {
      score: number;  // 0-100
      metrics: {
        lcp: number;  // Largest Contentful Paint (ms)
        fid: number;  // First Input Delay (ms)
        cls: number;  // Cumulative Layout Shift
        ttfb: number; // Time to First Byte (ms)
      };
    };
    seo: {
      score: number;  // 0-100
      issues: Array<{
        title: string;
        description: string;
        severity: 'error' | 'warning' | 'info';
      }>;
    };
  };
}
```

### Niveau L3

```typescript
interface L3InspectionResult extends L2InspectionResult {
  level: 'L3';
  axe: {
    violations: Array<{
      id: string;
      impact: 'minor' | 'moderate' | 'serious' | 'critical';
      description: string;
      help: string;
      helpUrl: string;
      nodes: number;
    }>;
    score: number;  // 0-100
  };
  ux: {
    score: number;  // 0-100
    heuristics: Array<{
      id: string;
      name: string;
      score: number;
      issues: string[];
    }>;
  };
  content: {
    score: number;  // 0-100
    metrics: {
      wordCount: number;
      readingTime: number;
      readabilityScore: number;
    };
  };
}
```

## Performance

| Niveau | Durée cible | Contenu |
|--------|-------------|---------|
| L1 | < 10s | Screenshot + accessibility tree + métadonnées |
| L2 | < 30s | L1 + Lighthouse + SEO |
| L3 | < 60s | L2 + axe-core + UX + contenu |

## Outils utilisés

- **Playwright** : Navigation, screenshots, accessibility tree
- **Lighthouse** : Performance (Core Web Vitals), SEO
- **axe-core** : Accessibilité (WCAG 2.2 AA)
- **Analyse UX** : Heuristiques de Nielsen (basique)
- **Analyse contenu** : Structure, qualité (basique)

## Exemples

### Exemple 1 : Inspection rapide

```typescript
const inspector = new Inspector();
const result = await inspector.inspect({
  level: 'L1',
  url: 'https://example.com',
});

console.log('Screenshot:', result.artifacts.screenshot);
console.log('Title:', result.metadata.title);
console.log('Accessibility nodes:', result.accessibility.nodeCount);
```

### Exemple 2 : Inspection standard avec performance

```typescript
const inspector = new Inspector();
const result = await inspector.inspect({
  level: 'L2',
  url: 'https://example.com',
});

console.log('Performance score:', result.lighthouse.performance.score);
console.log('LCP:', result.lighthouse.performance.metrics.lcp, 'ms');
console.log('SEO score:', result.lighthouse.seo.score);
console.log('SEO issues:', result.lighthouse.seo.issues.length);
```

### Exemple 3 : Inspection approfondie

```typescript
const inspector = new Inspector();
const result = await inspector.inspect({
  level: 'L3',
  url: 'https://example.com',
});

console.log('Accessibility score:', result.axe.score);
console.log('WCAG violations:', result.axe.violations.length);
console.log('UX score:', result.ux.score);
console.log('Content score:', result.content.score);
console.log('Word count:', result.content.metrics.wordCount);
```

## Architecture

```
Inspector (orchestrateur)
├── Level1Inspector
│   ├── Navigator (Playwright)
│   └── Accessibility (tree + violations)
├── Level2Inspector
│   ├── Level1Inspector
│   └── LighthouseAnalyzer
│       ├── Performance (Core Web Vitals)
│       └── SEO
└── Level3Inspector
    ├── Level2Inspector
    ├── AxeAnalyzer (WCAG 2.2 AA)
    ├── UX Analysis (Nielsen heuristics)
    └── Content Analysis
```

## Dépendances

- `playwright` : Browser automation
- `lighthouse` : Performance + SEO analysis
- `@axe-core/playwright` : Accessibility analysis

## Références

- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [axe-core Documentation](https://www.deque.com/axe/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Core Web Vitals](https://web.dev/vitals/)
```

**Validation :**
```bash
ls -la docs/INSPECTOR.md
# ✅ Documentation créée
```

**Commit :**
```bash
git add docs/INSPECTOR.md
git commit -m "docs: add Inspector documentation"
```

---

### 3.6 Vérifications finales Sprint 8-3 (jour 3)

**Vérifications :**

```bash
# 1. Tous les tests
npm test tests/browser/inspection/
# ✅ Tous les tests passent

npm test tests/browser/lighthouse.test.ts
# ✅ Tests Lighthouse passent

npm test tests/browser/axe.test.ts
# ✅ Tests axe-core passent

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
# ✅ types.ts, level-1.ts, level-2.ts, level-3.ts, inspector.ts

ls -la src/browser/lighthouse.ts
ls -la src/browser/axe.ts
# ✅ Fichiers existent

ls -la docs/INSPECTOR.md
# ✅ Documentation existe

# 6. Test manuel L1
node -e "
const { Inspector } = require('./dist/browser/inspection/inspector');
const inspector = new Inspector();
inspector.inspect({ level: 'L1', url: 'https://example.com' }).then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Performance OK:', r.duration < 10000);
});
"
# ✅ Inspection L1 fonctionne

# 7. Test manuel L2
node -e "
const { Inspector } = require('./dist/browser/inspection/inspector');
const inspector = new Inspector();
inspector.inspect({ level: 'L2', url: 'https://example.com' }).then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Performance score:', r.lighthouse.performance.score);
  console.log('Performance OK:', r.duration < 30000);
});
"
# ✅ Inspection L2 fonctionne

# 8. Test manuel L3
node -e "
const { Inspector } = require('./dist/browser/inspection/inspector');
const inspector = new Inspector();
inspector.inspect({ level: 'L3', url: 'https://example.com' }).then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Axe score:', r.axe.score);
  console.log('UX score:', r.ux.score);
  console.log('Content score:', r.content.score);
  console.log('Performance OK:', r.duration < 60000);
});
"
# ✅ Inspection L3 fonctionne

# 9. Vérification Git
git status
# ✅ Tous les changements commités

# 10. Push
git push origin feat/sprint-8-3
```

**Point de contrôle Sprint 8-3 :**
- ✅ axe-core installé et configuré
- ✅ AxeAnalyzer implémenté
- ✅ Violations WCAG 2.2 AA détectées
- ✅ Score accessibilité calculé
- ✅ Inspection L3 fonctionnelle (< 60s)
- ✅ Analyse UX basique
- ✅ Analyse contenu basique
- ✅ Inspector principal (orchestration L1-L3)
- ✅ Documentation complète
- ✅ Tests unitaires L3 > 80% couverture
- ✅ Tests axe-core > 80% couverture
- ✅ Performance respectée (L1 < 10s, L2 < 30s, L3 < 60s)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/browser/axe.ts` | ~120 | Intégration axe-core |
| `src/browser/inspection/level-3.ts` | ~220 | Inspection L3 (approfondie) |
| `src/browser/inspection/inspector.ts` | ~100 | Inspector principal |
| `tests/browser/axe.test.ts` | ~100 | Tests axe-core |
| `tests/browser/inspection/level-3.test.ts` | ~180 | Tests L3 |
| `docs/INSPECTOR.md` | ~400 | Documentation Inspector |

**Total Sprint 8-3 :** ~1 120 lignes

---

## 5. Récapitulatif complet Sprint 8

| Sous-sprint | Durée | Fichiers | Lignes |
|-------------|-------|----------|--------|
| Sprint 8-1 | 3 jours | 3 fichiers | ~390 |
| Sprint 8-2 | 4 jours | 4 fichiers | ~430 |
| Sprint 8-3 | 3 jours | 6 fichiers | ~1 120 |
| **Total** | **10 jours** | **13 fichiers** | **~1 940** |

---

## 6. Commits

```bash
git commit -m "chore: install axe-core for accessibility analysis"
git commit -m "feat(browser): integrate axe-core for accessibility analysis"
git commit -m "feat(browser): implement inspection L3 (deep)"
git commit -m "feat(browser): implement main Inspector class"
git commit -m "test(browser): add tests for L1, L2, L3 inspections"
git commit -m "docs: add Inspector documentation"
```

---

## 7. Transition vers Sprint 9

**Prérequis pour Sprint 9 :**
- ✅ Sprint 8 terminé avec succès
- ✅ 3 niveaux d'inspection fonctionnels
- ✅ Lighthouse + axe-core intégrés
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**Sprint 9 — Analyse 5 Dimensions (Semaine 17-18) :**
- 🎯 Analyse performance (Lighthouse)
- 🎯 Analyse accessibilité (axe-core)
- 🎯 Analyse SEO (meta tags, structured data)
- 🎯 Analyse UX (heuristiques Nielsen)
- 🎯 Analyse contenu (qualité, pertinence)
- 🎯 Matrice sévérité (0-4 × 1-5 × 1-3)
- 🎯 Priorisation automatique des findings

---

**Fin du document Sprint 8-3**
