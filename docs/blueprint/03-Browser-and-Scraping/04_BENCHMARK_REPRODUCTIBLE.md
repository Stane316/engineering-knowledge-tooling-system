# Phase 04 — Livrable 04.3 : Protocole de Benchmark Reproductible

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Moyen (définition de protocoles mesurables)

---

## 1. Objectif

Définir un protocole de benchmark reproductible pour évaluer et comparer les solutions d'automatisation navigateur dans le contexte EKTS, et pour valider les performances des outils d'inspection.

---

## 2. Résumé exécutif

Ce document définit :

1. **Un benchmark standard** — 10 tests reproductibles couvrant les cas d'usage EKTS
2. **Un environnement de référence** — spécifications hardware/software pour reproductibilité
3. **Des métriques claires** — temps, mémoire, fiabilité, tokens MCP
4. **Un processus de test** — étape par étape, de l'installation à l'analyse
5. **Un template de rapport** — pour documenter les résultats

---

## 3. Métriques de benchmark

### 3.1 Métriques de performance

| Métrique | Unité | Description | Objectif EKTS |
|----------|-------|-------------|---------------|
| **Cold start** | ms | Temps de lancement du navigateur | <2000ms |
| **Navigation** | ms | Temps de chargement d'une page | <5000ms |
| **Screenshot** | ms | Temps de capture d'un screenshot | <1000ms |
| **DOM extraction** | ms | Temps d'extraction de la structure DOM | <500ms |
| **Inspection L1** | ms | Inspection rapide (meta + screenshot) | <5000ms |
| **Inspection L2** | ms | Inspection standard (structure + contenu) | <30000ms |
| **Inspection L3** | ms | Inspection complète (+ network + perf) | <60000ms |
| **Parallel (10 pages)** | ms | 10 inspections L2 en parallèle | <60000ms |

### 3.2 Métriques de ressources

| Métrique | Unité | Description | Objectif EKTS |
|----------|-------|-------------|---------------|
| **Memory (idle)** | MB | Mémoire au repos après lancement | <200 MB |
| **Memory (active)** | MB | Mémoire pendant une inspection | <500 MB |
| **Memory (parallel x10)** | MB | Mémoire avec 10 inspections parallèles | <2000 MB |
| **CPU (idle)** | % | Utilisation CPU au repos | <5% |
| **CPU (active)** | % | Utilisation CPU pendant inspection | <80% |
| **Disk (per inspection)** | KB | Espace disque par résultat d'inspection | <500 KB |
| **Disk (screenshot)** | KB | Espace disque par screenshot | <200 KB |

### 3.3 Métriques de fiabilité

| Métrique | Unité | Description | Objectif EKTS |
|----------|-------|-------------|---------------|
| **Success rate** | % | Taux de réussite sur 50 runs | >95% |
| **Flakiness** | % | Taux d'échec non-déterministe | <5% |
| **Timeout rate** | % | Taux de timeout | <2% |
| **Error recovery** | % | Taux de récupération après retry | >90% |

### 3.4 Métriques MCP (pour Playwright MCP)

| Métrique | Unité | Description | Objectif EKTS |
|----------|-------|-------------|---------------|
| **Tokens per inspection L1** | tokens | Tokens consommés par inspection L1 | <5000 |
| **Tokens per inspection L2** | tokens | Tokens consommés par inspection L2 | <20000 |
| **Latency MCP (local)** | ms | Latence d'un appel MCP local | <100ms |
| **Latency MCP (remote)** | ms | Latence d'un appel MCP distant | <1000ms |

---

## 4. Environnement de référence

### 4.1 Hardware minimum

```
CPU: 4 cores (8 recommandé)
RAM: 8 GB (16 recommandé)
Disk: 10 GB libres (SSD recommandé)
OS: Linux (Ubuntu 22.04+), macOS 13+, Windows 10+
```

### 4.2 Software

```
Node.js: v22.0+ (LTS)
npm: v10.0+
Playwright: v1.64+
Patchright: v1.63+ (si test stealth)
```

### 4.3 Variables d'environnement

```bash
export NODE_ENV=benchmark
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers
export benchmark_runs=50
export benchmark_timeout=30000
```

---

## 5. Suite de tests standard

### 5.1 Test 1 : Cold Start

**Objectif :** Mesurer le temps de lancement du navigateur

```typescript
// benchmark/01_cold_start.ts
import { chromium, firefox, webkit } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkColdStart() {
  const browsers = { chromium, firefox, webkit };
  const results: Record<string, number[]> = {};

  for (const [name, browser] of Object.entries(browsers)) {
    const times: number[] = [];

    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      const instance = await browser.launch({ headless: true });
      const end = performance.now();
      times.push(end - start);
      await instance.close();
    }

    results[name] = times;
  }

  return {
    metric: 'cold_start_ms',
    results: Object.fromEntries(
      Object.entries(results).map(([k, v]) => [k, {
        min: Math.min(...v),
        max: Math.max(...v),
        mean: v.reduce((a, b) => a + b) / v.length,
        median: v.sort((a, b) => a - b)[Math.floor(v.length / 2)],
        p95: v.sort((a, b) => a - b)[Math.floor(v.length * 0.95)]
      }])
    )
  };
}
```

**Résultat attendu (Playwright) :**
| Navigateur | Min | Median | P95 | Max |
|------------|-----|--------|-----|-----|
| Chromium | 400ms | 600ms | 900ms | 1500ms |
| Firefox | 500ms | 800ms | 1200ms | 2000ms |
| WebKit | 600ms | 900ms | 1400ms | 2200ms |

### 5.2 Test 2 : Navigation Simple

**Objectif :** Mesurer le temps de chargement d'une page statique

```typescript
// benchmark/02_navigation.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

const TEST_URLS = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://info.cern.ch'
];

async function benchmarkNavigation() {
  const browser = await chromium.launch({ headless: true });
  const results: Record<string, number[]> = {};

  for (const url of TEST_URLS) {
    const times: number[] = [];

    for (let i = 0; i < 10; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();

      const start = performance.now();
      await page.goto(url, { waitUntil: 'networkidle' });
      const end = performance.now();

      times.push(end - start);
      await context.close();
    }

    results[url] = times;
  }

  await browser.close();
  return { metric: 'navigation_ms', results };
}
```

### 5.3 Test 3 : Screenshot

**Objectif :** Mesurer le temps de capture d'un screenshot

```typescript
// benchmark/03_screenshot.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  const viewportTimes: number[] = [];
  const fullPageTimes: number[] = [];

  for (let i = 0; i < 20; i++) {
    let start = performance.now();
    await page.screenshot({ fullPage: false });
    viewportTimes.push(performance.now() - start);

    start = performance.now();
    await page.screenshot({ fullPage: true });
    fullPageTimes.push(performance.now() - start);
  }

  await context.close();
  await browser.close();

  return {
    metric: 'screenshot_ms',
    viewport: summarize(viewportTimes),
    fullPage: summarize(fullPageTimes)
  };
}
```

### 5.4 Test 4 : Extraction DOM

**Objectif :** Mesurer le temps d'extraction de la structure DOM

```typescript
// benchmark/04_dom_extraction.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkDomExtraction() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://developer.mozilla.org', { waitUntil: 'networkidle' });

  const times: number[] = [];

  for (let i = 0; i < 20; i++) {
    const start = performance.now();
    await page.evaluate(() => {
      const extract = (el: Element): any => ({
        tag: el.tagName,
        children: Array.from(el.children).slice(0, 50).map(extract)
      });
      return extract(document.body);
    });
    times.push(performance.now() - start);
  }

  await context.close();
  await browser.close();

  return { metric: 'dom_extraction_ms', results: summarize(times) };
}
```

### 5.5 Test 5 : Inspection L1

**Objectif :** Mesurer le temps d'une inspection rapide

```typescript
// benchmark/05_inspection_l1.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkInspectionL1() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://example.com';
  const times: number[] = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();

    // Navigation
    await page.goto(url, { waitUntil: 'networkidle' });

    // Métadonnées
    const title = await page.title();
    const description = await page.$eval('meta[name="description"]',
      el => el.getAttribute('content')).catch(() => null);

    // Screenshot viewport
    const screenshot = await page.screenshot({ fullPage: false });

    // Accessibility snapshot (via Playwright MCP ou API)
    const snapshot = await page.accessibility.snapshot();

    times.push(performance.now() - start);
  }

  await context.close();
  await browser.close();

  return { metric: 'inspection_l1_ms', results: summarize(times) };
}
```

### 5.6 Test 6 : Inspection L2

**Objectif :** Mesurer le temps d'une inspection standard

```typescript
// benchmark/06_inspection_l2.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkInspectionL2() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://developer.mozilla.org/en-US/docs/Web';
  const times: number[] = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();

    // Navigation
    await page.goto(url, { waitUntil: 'networkidle' });

    // Métadonnées
    const title = await page.title();
    const description = await page.$eval('meta[name="description"]',
      el => el.getAttribute('content')).catch(() => null);

    // Screenshot
    await page.screenshot({ fullPage: true });

    // Extraction DOM structure
    const structure = await page.evaluate(() => {
      const extract = (el: Element): any => ({
        tag: el.tagName,
        id: el.id,
        children: Array.from(el.children).map(extract)
      });
      return extract(document.body);
    });

    // Extraction contenu
    const content = await page.evaluate(() => ({
      headings: Array.from(document.querySelectorAll('h1,h2,h3'))
        .map(el => ({ level: el.tagName, text: el.textContent })),
      paragraphs: Array.from(document.querySelectorAll('p'))
        .map(el => el.textContent).slice(0, 50),
      links: Array.from(document.querySelectorAll('a[href]'))
        .map(el => ({ href: el.href, text: el.textContent })).slice(0, 100),
      images: Array.from(document.querySelectorAll('img[src]'))
        .map(el => ({ src: el.src, alt: el.alt }))
    }));

    times.push(performance.now() - start);
  }

  await context.close();
  await browser.close();

  return { metric: 'inspection_l2_ms', results: summarize(times) };
}
```

### 5.7 Test 7 : Inspection L3

**Objectif :** Mesurer le temps d'une inspection complète

```typescript
// benchmark/07_inspection_l3.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkInspectionL3() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://developer.mozilla.org/en-US/docs/Web';
  const times: number[] = [];

  // Enable network monitoring
  const networkRequests: any[] = [];
  page.on('response', response => {
    networkRequests.push({
      url: response.url(),
      status: response.status(),
      size: response.headers()['content-length']
    });
  });

  // Enable console monitoring
  const consoleMessages: any[] = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  for (let i = 0; i < 5; i++) {
    const start = performance.now();

    // Navigation + performance timing
    await page.goto(url, { waitUntil: 'networkidle' });

    // Performance metrics
    const perfMetrics = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as any;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd,
        loadComplete: timing.loadEventEnd,
        firstPaint: performance.getEntriesByType('paint')
          .find(e => e.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint')
          .find(e => e.name === 'first-contentful-paint')?.startTime
      };
    });

    // Everything from L2
    const title = await page.title();
    await page.screenshot({ fullPage: true });
    const structure = await page.evaluate(() => document.body.innerHTML.length);

    // Scroll to trigger lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    times.push(performance.now() - start);

    // Reset network/console
    networkRequests.length = 0;
    consoleMessages.length = 0;
  }

  await context.close();
  await browser.close();

  return { metric: 'inspection_l3_ms', results: summarize(times) };
}
```

### 5.8 Test 8 : Parallélisme

**Objectif :** Mesurer les performances en parallèle

```typescript
// benchmark/08_parallel.ts
import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

async function benchmarkParallel() {
  const browser = await chromium.launch({ headless: true });

  const urls = [
    'https://example.com',
    'https://httpbin.org/html',
    'https://info.cern.ch',
    'https://www.iana.org/domains/reserved',
    'https://www.w3.org',
    'https://developer.mozilla.org',
    'https://web.dev',
    'https://caniuse.com',
    'https://stackoverflow.com',
    'https://github.com'
  ];

  // Test with 2, 5, 10 parallel contexts
  const results: Record<string, number> = {};

  for (const parallelism of [2, 5, 10]) {
    const start = performance.now();

    const contexts = await Promise.all(
      Array(parallelism).fill(null).map(async (_, i) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(urls[i], { waitUntil: 'networkidle' });
        await page.screenshot();
        await context.close();
      })
    );

    results[`${parallelism}_parallel`] = performance.now() - start;
  }

  await browser.close();
  return { metric: 'parallel_ms', results };
}
```

### 5.9 Test 9 : Consommation mémoire

**Objectif :** Mesurer l'empreinte mémoire

```typescript
// benchmark/09_memory.ts
import { chromium } from 'playwright';
import * as os from 'os';

function getMemoryUsage(): number {
  const proc = process.memoryUsage();
  return proc.rss / 1024 / 1024; // MB
}

async function benchmarkMemory() {
  const results: Record<string, number> = {};

  // Baseline
  results.baseline = getMemoryUsage();

  // After browser launch
  const browser = await chromium.launch({ headless: true });
  results.browser_launched = getMemoryUsage();

  // After 1 context
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto('https://example.com');
  results.one_context = getMemoryUsage();

  // After 5 contexts
  const contexts = [];
  for (let i = 0; i < 4; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('https://example.com');
    contexts.push(ctx);
  }
  results.five_contexts = getMemoryUsage();

  // After 10 contexts
  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('https://example.com');
    contexts.push(ctx);
  }
  results.ten_contexts = getMemoryUsage();

  // Cleanup
  await Promise.all(contexts.map(c => c.close()));
  await browser.close();

  return { metric: 'memory_mb', results };
}
```

### 5.10 Test 10 : Fiabilité (50 runs)

**Objectif :** Mesurer le taux de réussite et la flakiness

```typescript
// benchmark/10_reliability.ts
import { chromium } from 'playwright';

async function benchmarkReliability() {
  const browser = await chromium.launch({ headless: true });
  const url = 'https://example.com';

  let successes = 0;
  let failures = 0;
  let timeouts = 0;
  const errors: string[] = [];

  for (let i = 0; i < 50; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const title = await page.title();

      if (title.length > 0) {
        successes++;
      } else {
        failures++;
        errors.push(`Run ${i}: Empty title`);
      }
    } catch (error) {
      if (error.message.includes('Timeout')) {
        timeouts++;
      } else {
        failures++;
      }
      errors.push(`Run ${i}: ${error.message}`);
    }

    await context.close();
  }

  await browser.close();

  return {
    metric: 'reliability',
    results: {
      total_runs: 50,
      successes,
      failures,
      timeouts,
      success_rate: successes / 50,
      flakiness_rate: failures / 50,
      timeout_rate: timeouts / 50,
      errors: errors.slice(0, 10) // Top 10 errors
    }
  };
}
```

---

## 6. Processus de benchmark

### 6.1 Préparation

```bash
# 1. Cloner le projet EKTS
git clone https://github.com/ekts/benchmarks.git
cd benchmarks

# 2. Installer les dépendances
npm install

# 3. Installer les navigateurs Playwright
npx playwright install chromium firefox webkit

# 4. (Optionnel) Installer Patchright
npm install patchright
npx patchright install chromium

# 5. Vérifier l'environnement
npm run check-env
```

### 6.2 Exécution

```bash
# Exécuter tous les benchmarks
npm run benchmark:all

# Exécuter un benchmark spécifique
npm run benchmark:cold-start
npm run benchmark:navigation
npm run benchmark:inspection-l1
npm run benchmark:inspection-l2
npm run benchmark:inspection-l3
npm run benchmark:parallel
npm run benchmark:memory
npm run benchmark:reliability

# Exécuter avec un nombre de runs personnalisé
BENCHMARK_RUNS=100 npm run benchmark:reliability
```

### 6.3 Analyse

```bash
# Générer un rapport
npm run benchmark:report

# Comparer avec un benchmark précédent
npm run benchmark:compare -- --baseline=results/2026-10-01.json
```

### 6.4 Sortie

Les résultats sont sauvegardés dans `results/` au format JSON :

```json
{
  "metadata": {
    "timestamp": "2026-10-21T14:30:00Z",
    "environment": {
      "os": "Ubuntu 22.04",
      "node": "v22.12.0",
      "playwright": "1.64.1",
      "cpu": "AMD Ryzen 7 5800X",
      "ram": "32 GB"
    }
  },
  "results": {
    "cold_start": { "chromium": { "median": 600, "p95": 900 } },
    "navigation": { "example.com": { "median": 1200, "p95": 2000 } },
    "inspection_l1": { "median": 3500, "p95": 5000 },
    "inspection_l2": { "median": 18000, "p95": 25000 },
    "inspection_l3": { "median": 45000, "p95": 55000 },
    "parallel_10": { "total_ms": 45000 },
    "memory": { "baseline": 80, "ten_contexts": 650 },
    "reliability": { "success_rate": 0.98, "flakiness_rate": 0.02 }
  }
}
```

---

## 7. Template de rapport

### 7.1 Structure du rapport

```markdown
# Benchmark Report — [Date]

## Environment
- OS: [OS version]
- Node.js: [version]
- Playwright: [version]
- CPU: [model] ([cores])
- RAM: [total] GB
- Disk: [type] ([free] GB free)

## Summary

| Test | Metric | Result | Target | Status |
|------|--------|--------|--------|--------|
| Cold start | median | 600ms | <2000ms | ✅ |
| Navigation | median | 1200ms | <5000ms | ✅ |
| Inspection L1 | median | 3500ms | <5000ms | ✅ |
| Inspection L2 | median | 18000ms | <30000ms | ✅ |
| Inspection L3 | median | 45000ms | <60000ms | ✅ |
| Parallel (x10) | total | 45000ms | <60000ms | ✅ |
| Memory (10 ctx) | RSS | 650MB | <2000MB | ✅ |
| Reliability | success | 98% | >95% | ✅ |

## Detailed Results
[Graphs, distributions, outliers]

## Observations
[Any unexpected behavior, regressions, or improvements]

## Recommendations
[Actionable items based on results]
```

---

## 8. Comparaison entre solutions

### 8.1 Protocole de comparaison

Pour comparer Playwright vs Puppeteer vs Patchright :

```bash
# 1. Exécuter le benchmark avec Playwright
TOOL=playwright npm run benchmark:all
mv results/latest.json results/playwright.json

# 2. Exécuter le benchmark avec Puppeteer
TOOL=puppeteer npm run benchmark:all
mv results/latest.json results/puppeteer.json

# 3. Exécuter le benchmark avec Patchright
TOOL=patchright npm run benchmark:all
mv results/latest.json results/patchright.json

# 4. Comparer les résultats
npm run benchmark:compare -- --files=results/playwright.json,results/puppeteer.json,results/patchright.json
```

### 8.2 Résultats attendus (basés sur les benchmarks publics 2026)

| Métrique | Playwright | Puppeteer | Patchright |
|----------|------------|-----------|------------|
| Cold start | ~600ms | ~500ms | ~650ms |
| Navigation | ~1200ms | ~1300ms | ~1250ms |
| Screenshot | ~800ms | ~280ms | ~800ms |
| Memory (idle) | ~130MB | ~100MB | ~130MB |
| Memory (10 ctx) | ~650MB | ~700MB | ~650MB |
| Reliability | 98% | 96% | 97% |
| Anti-detection | Low | Low | High |
| MCP support | ✅ (70+ tools) | ❌ | ❌ |

---

## 9. Monitoring continu

### 9.1 Intégration CI

```yaml
# .github/workflows/benchmark.yml
name: Browser Automation Benchmark

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly
  workflow_dispatch:

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install browsers
        run: npx playwright install --with-deps chromium

      - name: Run benchmarks
        run: npm run benchmark:all

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: results/
```

### 9.2 Alertes

```typescript
// benchmark/alerts.ts
const THRESHOLDS = {
  cold_start_p95: 2000,       // ms
  inspection_l2_p95: 30000,   // ms
  memory_ten_contexts: 2000,  // MB
  reliability_success: 0.95,  // 95%
};

function checkThresholds(results: BenchmarkResults): Alert[] {
  const alerts: Alert[] = [];

  if (results.cold_start.p95 > THRESHOLDS.cold_start_p95) {
    alerts.push({
      severity: 'warning',
      metric: 'cold_start_p95',
      value: results.cold_start.p95,
      threshold: THRESHOLDS.cold_start_p95,
      message: 'Cold start P95 exceeds threshold'
    });
  }

  if (results.reliability.success_rate < THRESHOLDS.reliability_success) {
    alerts.push({
      severity: 'critical',
      metric: 'reliability',
      value: results.reliability.success_rate,
      threshold: THRESHOLDS.reliability_success,
      message: 'Success rate below threshold'
    });
  }

  return alerts;
}
```

---

## 10. Limites et incertitudes

### 10.1 Limites du benchmark

- **Variabilité réseau** : les temps de navigation dépendent du réseau
- **Variabilité des sites** : les sites de test peuvent changer
- **Hardware** : les résultats sont spécifiques au hardware utilisé
- **Versioning** : les résultats sont valables pour une version donnée

### 10.2 Non vérifié

- Performance sur des machines avec <8 GB RAM
- Stabilité sur des sessions de plusieurs heures
- Impact de la charge CPU sur les résultats

---

## 11. Décisions

### Décisions prises

1. **10 tests standard** — couvrant cold start, navigation, screenshot, DOM, L1-L3, parallélisme, mémoire, fiabilité
2. **Environnement de référence** — spécifications minimum pour reproductibilité
3. **Objectifs de performance** — cold start <2s, L2 <30s, succès >95%
4. **Format JSON** — pour les résultats de benchmark
5. **Intégration CI** — benchmark hebdomadaire automatisé

### Décisions reportées

- Choix des sites de test finaux — à valider avec les vrais cas d'usage EKTS
- Benchmarks comparatifs complets — à exécuter lors de l'implémentation

---

## 12. Questions ouvertes

1. **Quels sites réels utiliser comme référence ?**
   - Impact : pertinence des résultats
   - Action : sélectionner des sites représentatifs des cas d'usage EKTS

2. **Faut-il benchmarker sur différents hardware ?**
   - Impact : généralisation des résultats
   - Action : tester au minimum sur 2 configurations

3. **Quelle fréquence de benchmark ?**
   - Impact : détection de régressions
   - Action : hebdomadaire en CI, mensuel en manuel

---

## 13. Sources

- Benchmarks publics 2026 : TestDino, ScrollTest, Apify, gologin.com
- Documentation Playwright : https://playwright.dev/docs/api
- Métriques Web : https://web.dev/metrics
- Benchmark CI : https://github.com/marketplace/actions/benchmark-diff

---

**Livrable rédigé le 21 octobre 2026 — Phase 04 du projet EKTS**
