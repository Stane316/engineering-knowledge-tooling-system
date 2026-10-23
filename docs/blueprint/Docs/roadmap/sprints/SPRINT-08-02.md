# Sprint 8-2 — Lighthouse + Inspection L2 (Semaine 15-16)

**Durée :** 4 jours  
**Objectif :** Intégrer Lighthouse et implémenter l'inspection L2 (standard)  
**Dépendance :** Sprint 8-1 (Types + L1) ✅
**Statut :** ✅ LIVRÉ (23 octobre 2026)
**Bilan de livraison :** `src/browser/lighthouse.ts` (port CDP réservé, conversion du rapport, exécutant injectable), `inspection/seo.ts`, `inspection/level-2.ts` ; **38 tests** (`lighthouse.test.ts` 17, `level-2.test.ts` 21). Écarts E8-2 à E8-5 : Lighthouse 12.8.2, types locaux, INP prioritaire, `server-response-time`.

---

## 1. Contexte

Le **Sprint 8-1** a mis en place :
- ✅ Types d'inspection définis (L1, L2, L3)
- ✅ Inspection L1 fonctionnelle (< 10s)
- ✅ Tests unitaires L1 > 80% couverture

Le **Sprint 8-2** va :
- 🎯 Intégrer Lighthouse pour l'analyse performance (Core Web Vitals)
- 🎯 Implémenter l'inspection L2 (L1 + Lighthouse + SEO)
- 🎯 Analyser les éléments SEO basiques (meta tags, headings, links)

---

## 2. État initial (fin Sprint 8-1)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── navigator.ts                ✅
│   │   ├── accessibility.ts            ✅
│   │   └── inspection/
│   │       ├── types.ts                ✅ (Sprint 8-1)
│   │       └── level-1.ts              ✅ (Sprint 8-1)
│   └── ...
├── tests/
│   └── browser/
│       └── inspection/
│           └── level-1.test.ts         ✅ (Sprint 8-1)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 Installation de Lighthouse (jour 1 — 2h)

**Installation :**

```bash
npm install lighthouse
```

**Vérification :**
```bash
npm list lighthouse
# ✅ lighthouse@11.x.x
```

**Commit :**
```bash
git add package.json package-lock.json
git commit -m "chore: install Lighthouse for performance analysis"
```

---

### 3.2 Intégration Lighthouse (jour 1-2 — 8h)

**Fichier :** `src/browser/lighthouse.ts`

**Implémentation :**

```typescript
import lighthouse from 'lighthouse';
import { Navigator } from './navigator';
import { PageMetadata } from './inspection/types';

/**
 * Métriques Core Web Vitals
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint (ms) */
  lcp: number;
  /** First Input Delay (ms) */
  fid: number;
  /** Cumulative Layout Shift */
  cls: number;
  /** Time to First Byte (ms) */
  ttfb: number;
}

/**
 * Résultat d'analyse Lighthouse
 */
export interface LighthouseResult {
  /** Score performance (0-100) */
  performance: {
    score: number;
    metrics: CoreWebVitals;
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
  /** Rapport complet JSON */
  report: any;
}

/**
 * Analyseur Lighthouse
 */
export class LighthouseAnalyzer {
  /**
   * Effectue une analyse Lighthouse
   */
  async analyze(navigator: Navigator, metadata: PageMetadata): Promise<LighthouseResult> {
    const page = navigator.getPage();
    if (!page) {
      throw new Error('No page available for Lighthouse analysis');
    }

    // Obtenir l'URL actuelle
    const url = page.url();

    // Configurer Lighthouse
    const options = {
      logLevel: 'error' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'seo'],
      port: new URL(navigator.getBrowser().wsEndpoint()).port,
    };

    // Exécuter Lighthouse
    const runnerResult = await lighthouse(url, options);

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse analysis failed');
    }

    const report = runnerResult.lhr;

    // Extraire les métriques Core Web Vitals
    const metrics = this.extractCoreWebVitals(report);

    // Extraire le score performance
    const performanceScore = Math.round((report.categories.performance?.score ?? 0) * 100);

    // Extraire le score SEO et les issues
    const seoScore = Math.round((report.categories.seo?.score ?? 0) * 100);
    const seoIssues = this.extractSeoIssues(report);

    return {
      performance: {
        score: performanceScore,
        metrics,
      },
      seo: {
        score: seoScore,
        issues: seoIssues,
      },
      report,
    };
  }

  /**
   * Extrait les métriques Core Web Vitals
   */
  private extractCoreWebVitals(report: any): CoreWebVitals {
    const audits = report.audits;

    return {
      lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
      fid: audits['max-potential-fid']?.numericValue ?? 0,
      cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
      ttfb: audits['server-response-time']?.numericValue ?? 0,
    };
  }

  /**
   * Extrait les issues SEO
   */
  private extractSeoIssues(report: any): Array<{
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
  }> {
    const issues: Array<{
      title: string;
      description: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];

    const seoAudits = report.audits;

    // Parcourir les audits SEO
    for (const [key, audit] of Object.entries(seoAudits)) {
      const auditData = audit as any;
      
      // Vérifier si l'audit a échoué
      if (auditData.score !== null && auditData.score < 0.9) {
        let severity: 'error' | 'warning' | 'info' = 'info';
        
        if (auditData.score < 0.5) {
          severity = 'error';
        } else if (auditData.score < 0.9) {
          severity = 'warning';
        }

        issues.push({
          title: auditData.title,
          description: auditData.description,
          severity,
        });
      }
    }

    return issues;
  }
}
```

**Tests :** `tests/browser/lighthouse.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LighthouseAnalyzer } from '../../src/browser/lighthouse';
import { Navigator } from '../../src/browser/navigator';

describe('LighthouseAnalyzer', () => {
  let navigator: Navigator;
  let analyzer: LighthouseAnalyzer;

  beforeAll(async () => {
    navigator = new Navigator();
    await navigator.start('chromium');
    analyzer = new LighthouseAnalyzer();
  });

  afterAll(async () => {
    await navigator.stop();
  });

  describe('analyze', () => {
    it('should analyze performance and SEO', async () => {
      await navigator.goto('https://example.com');
      const metadata = {
        title: 'Example Domain',
        url: 'https://example.com',
        description: 'Example website',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'test',
        loadTime: 1000,
        httpStatus: 200,
      };

      const result = await analyzer.analyze(navigator, metadata);

      expect(result.performance).toBeDefined();
      expect(result.performance.score).toBeGreaterThanOrEqual(0);
      expect(result.performance.score).toBeLessThanOrEqual(100);
      expect(result.performance.metrics).toBeDefined();
      expect(result.performance.metrics.lcp).toBeDefined();
      expect(result.performance.metrics.fid).toBeDefined();
      expect(result.performance.metrics.cls).toBeDefined();
      expect(result.performance.metrics.ttfb).toBeDefined();

      expect(result.seo).toBeDefined();
      expect(result.seo.score).toBeGreaterThanOrEqual(0);
      expect(result.seo.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.seo.issues)).toBe(true);
      expect(result.report).toBeDefined();
    });

    it('should extract Core Web Vitals', async () => {
      await navigator.goto('https://example.com');
      const metadata = {
        title: 'Example Domain',
        url: 'https://example.com',
        description: 'Example website',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'test',
        loadTime: 1000,
        httpStatus: 200,
      };

      const result = await analyzer.analyze(navigator, metadata);

      expect(result.performance.metrics.lcp).toBeGreaterThanOrEqual(0);
      expect(result.performance.metrics.fid).toBeGreaterThanOrEqual(0);
      expect(result.performance.metrics.cls).toBeGreaterThanOrEqual(0);
      expect(result.performance.metrics.ttfb).toBeGreaterThanOrEqual(0);
    });

    it('should extract SEO issues', async () => {
      await navigator.goto('https://example.com');
      const metadata = {
        title: 'Example Domain',
        url: 'https://example.com',
        description: 'Example website',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'test',
        loadTime: 1000,
        httpStatus: 200,
      };

      const result = await analyzer.analyze(navigator, metadata);

      expect(Array.isArray(result.seo.issues)).toBe(true);
      if (result.seo.issues.length > 0) {
        const issue = result.seo.issues[0];
        expect(issue.title).toBeDefined();
        expect(issue.description).toBeDefined();
        expect(['error', 'warning', 'info']).toContain(issue.severity);
      }
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/lighthouse.test.ts
# ✅ 3 tests passent

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/lighthouse.ts
git add tests/browser/lighthouse.test.ts
git commit -m "feat(browser): integrate Lighthouse for performance analysis"
```

---

### 3.3 Inspection L2 (jour 3-4 — 8h)

**Fichier :** `src/browser/inspection/level-2.ts`

**Implémentation :**

```typescript
import { Level1Inspector } from './level-1';
import { LighthouseAnalyzer } from '../lighthouse';
import { InspectionOptions, L2InspectionResult } from './types';
import { Navigator } from '../navigator';

/**
 * Inspection L2 (standard)
 * 
 * Collecte :
 * - Tout ce que L1 collecte
 * - Analyse performance Lighthouse (Core Web Vitals)
 * - Analyse SEO basique (meta tags, headings, links)
 * 
 * Durée cible : < 30s
 */
export class Level2Inspector {
  private level1Inspector: Level1Inspector;
  private lighthouseAnalyzer: LighthouseAnalyzer;

  constructor(outputDir: string = './data/inspections') {
    this.level1Inspector = new Level1Inspector(outputDir);
    this.lighthouseAnalyzer = new LighthouseAnalyzer();
  }

  /**
   * Effectue une inspection L2
   */
  async inspect(options: InspectionOptions): Promise<L2InspectionResult> {
    const startTime = Date.now();

    // Créer le navigateur
    const navigator = new Navigator();
    await navigator.start('chromium');

    try {
      // Effectuer l'inspection L1
      const l1Result = await this.level1Inspector.inspect(options);

      // Analyser avec Lighthouse
      const lighthouseResult = await this.lighthouseAnalyzer.analyze(
        navigator,
        l1Result.metadata
      );

      // Construire le résultat L2
      const result: L2InspectionResult = {
        ...l1Result,
        level: 'L2',
        duration: Date.now() - startTime,
        lighthouse: {
          performance: lighthouseResult.performance,
          seo: lighthouseResult.seo,
        },
      };

      return result;
    } finally {
      await navigator.stop();
    }
  }
}
```

**Tests :** `tests/browser/inspection/level-2.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Level2Inspector } from '../../../src/browser/inspection/level-2';
import fs from 'fs';

describe('Level2Inspector', () => {
  let inspector: Level2Inspector;
  const testOutputDir = './test-results/inspection-l2';

  beforeAll(() => {
    inspector = new Level2Inspector(testOutputDir);
  });

  afterAll(() => {
    // Nettoyer les fichiers de test
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('inspect', () => {
    it('should perform L2 inspection on example.com', async () => {
      const result = await inspector.inspect({
        level: 'L2',
        url: 'https://example.com',
      });

      expect(result.level).toBe('L2');
      expect(result.url).toBe('https://example.com');
      expect(result.duration).toBeLessThan(30000); // < 30s
      
      // Vérifier les données L1
      expect(result.metadata).toBeDefined();
      expect(result.accessibility).toBeDefined();
      expect(result.artifacts.screenshot).toBeDefined();

      // Vérifier les données Lighthouse
      expect(result.lighthouse).toBeDefined();
      expect(result.lighthouse.performance).toBeDefined();
      expect(result.lighthouse.performance.score).toBeGreaterThanOrEqual(0);
      expect(result.lighthouse.performance.score).toBeLessThanOrEqual(100);
      expect(result.lighthouse.performance.metrics).toBeDefined();
      expect(result.lighthouse.seo).toBeDefined();
      expect(result.lighthouse.seo.score).toBeGreaterThanOrEqual(0);
      expect(result.lighthouse.seo.score).toBeLessThanOrEqual(100);
    });

    it('should include Core Web Vitals', async () => {
      const result = await inspector.inspect({
        level: 'L2',
        url: 'https://example.com',
      });

      const metrics = result.lighthouse.performance.metrics;
      expect(metrics.lcp).toBeDefined();
      expect(metrics.fid).toBeDefined();
      expect(metrics.cls).toBeDefined();
      expect(metrics.ttfb).toBeDefined();
    });

    it('should include SEO analysis', async () => {
      const result = await inspector.inspect({
        level: 'L2',
        url: 'https://example.com',
      });

      expect(result.lighthouse.seo.score).toBeDefined();
      expect(Array.isArray(result.lighthouse.seo.issues)).toBe(true);
    });

    it('should complete in less than 30 seconds', async () => {
      const result = await inspector.inspect({
        level: 'L2',
        url: 'https://example.com',
      });

      expect(result.duration).toBeLessThan(30000);
    });
  });
});
```

**Validation :**
```bash
npm test tests/browser/inspection/level-2.test.ts
# ✅ 4 tests passent

npm run test:coverage -- tests/browser/inspection/
# ✅ > 80% couverture

npm run build
# ✅ Compilation OK

npm run lint
# ✅ Linting OK
```

**Commit :**
```bash
git add src/browser/inspection/level-2.ts
git add tests/browser/inspection/level-2.test.ts
git commit -m "feat(browser): implement inspection L2 (standard)"
```

---

### 3.4 Vérifications finales Sprint 8-2 (jour 4)

**Vérifications :**

```bash
# 1. Tests unitaires L2
npm test tests/browser/inspection/level-2.test.ts
# ✅ 4 tests passent

# 2. Tests Lighthouse
npm test tests/browser/lighthouse.test.ts
# ✅ 3 tests passent

# 3. Couverture
npm run test:coverage -- tests/browser/inspection/
# ✅ > 80% couverture

# 4. Compilation
npm run build
# ✅ Aucune erreur TypeScript

# 5. Linting
npm run lint
# ✅ Aucune erreur

# 6. Vérification fichiers
ls -la src/browser/inspection/
# ✅ types.ts, level-1.ts, level-2.ts

ls -la src/browser/lighthouse.ts
# ✅ Fichier existe

# 7. Test manuel L2
node -e "
const { Level2Inspector } = require('./dist/browser/inspection/level-2');
const inspector = new Level2Inspector();
inspector.inspect({ level: 'L2', url: 'https://example.com' }).then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Performance score:', r.lighthouse.performance.score);
  console.log('SEO score:', r.lighthouse.seo.score);
  console.log('LCP:', r.lighthouse.performance.metrics.lcp, 'ms');
});
"
# ✅ Inspection L2 fonctionne

# 8. Vérifier performance < 30s
node -e "
const { Level2Inspector } = require('./dist/browser/inspection/level-2');
const inspector = new Level2Inspector();
const start = Date.now();
inspector.inspect({ level: 'L2', url: 'https://example.com' }).then(r => {
  const duration = Date.now() - start;
  console.log('Duration:', duration, 'ms');
  console.log('Performance OK:', duration < 30000);
});
"
# ✅ Performance < 30s

# 9. Vérification Git
git status
# ✅ Tous les changements commités

# 10. Push
git push origin feat/sprint-8-2
```

**Point de contrôle Sprint 8-2 :**
- ✅ Lighthouse installé et configuré
- ✅ LighthouseAnalyzer implémenté
- ✅ Core Web Vitals extraits (LCP, FID, CLS, TTFB)
- ✅ Analyse SEO basique
- ✅ Inspection L2 fonctionnelle (< 30s)
- ✅ Tests unitaires L2 > 80% couverture
- ✅ Tests Lighthouse > 80% couverture
- ✅ Performance respectée

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/browser/lighthouse.ts` | ~150 | Intégration Lighthouse |
| `src/browser/inspection/level-2.ts` | ~80 | Inspection L2 (standard) |
| `tests/browser/lighthouse.test.ts` | ~100 | Tests Lighthouse |
| `tests/browser/inspection/level-2.test.ts` | ~100 | Tests L2 |

**Total Sprint 8-2 :** ~430 lignes

---

## 5. Commits

```bash
git commit -m "chore: install Lighthouse for performance analysis"
git commit -m "feat(browser): integrate Lighthouse for performance analysis"
git commit -m "feat(browser): implement inspection L2 (standard)"
```

---

## 6. Transition vers Sprint 8-3

**Prérequis pour Sprint 8-3 :**
- ✅ Sprint 8-2 terminé avec succès
- ✅ Lighthouse intégré
- ✅ Inspection L2 fonctionnelle
- ✅ Tests unitaires > 80%

**Sprint 8-3 va implémenter :**
- 🎯 Intégration axe-core (WCAG 2.2 AA)
- 🎯 Inspection L3 (L2 + axe-core + UX + contenu)
- 🎯 Tests unitaires L3
- 🎯 Documentation Inspector

---

**Fin du document Sprint 8-2**
