# Sprint 7-1 — Installation Playwright + Configuration

**Statut :** 🟡 Documenté — En attente approbation  
**Durée :** 3 jours  
**Objectif :** Installer Playwright et configurer l'environnement  
**Dépendance :** Sprint 6 (MCP Server) ✅

---

## 1. Contexte

Le **Sprint 6** a terminé le MVP-1 avec le MCP Server fonctionnel.  
Le **Sprint 7-1** va installer Playwright et configurer l'environnement pour l'inspection navigateur.

**Objectifs :**
- ✅ Installer Playwright avec les 3 browsers (Chromium, Firefox, WebKit)
- ✅ Créer la configuration Playwright (`playwright.config.ts`)
- ✅ Vérifier que Playwright fonctionne (test basique)

---

## 2. État initial (fin Sprint 6)

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   └── (vide — à créer Sprint 7)
│   ├── business/                       ✅ (Sprints 3-4)
│   ├── cli/                            ✅ (Sprint 5)
│   ├── data/                           ✅ (Sprint 2)
│   ├── mcp/                            ✅ (Sprint 6)
│   └── ...
├── tests/
│   ├── browser/
│   │   └── (vide — à créer Sprint 7)
│   └── ...
├── docs/
│   └── ...                             ✅ (Sprints 2-6)
└── package.json                        ✅ (dépendances MVP-1)
```

---

## 3. Tâches atomiques

### 3.1 Installer Playwright (Jour 1, matin — 4h)

**Étape 1 : Installer le package Playwright**

```bash
npm install --save-dev @playwright/test
```

**Vérification :**
```bash
npm list @playwright/test
# ✅ @playwright/test@1.40.0 (ou version ultérieure)
```

**Étape 2 : Installer les browsers**

```bash
npx playwright install
```

**Ce qui est installé :**
- ✅ Chromium (~280 MB)
- ✅ Firefox (~260 MB)
- ✅ WebKit (~220 MB)
- ✅ Total : ~760 MB

**Vérification :**
```bash
npx playwright install --list
# ✅ Liste des browsers installés
```

**Étape 3 : Vérifier l'installation**

```bash
npx playwright --version
# ✅ Version affichée
```

**Commit :**
```bash
git add package.json package-lock.json
git commit -m "chore: install Playwright and browsers"
```

---

### 3.2 Créer la configuration Playwright (Jour 1, après-midi — 4h)

**Fichier :** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour EKTS
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Dossier des tests
  testDir: './tests/browser',
  
  // Patterns de fichiers de test
  testMatch: '**/*.test.ts',
  
  // Dossier des résultats
  outputDir: './test-results/browser',
  
  // Timeout global (30 secondes)
  timeout: 30_000,
  
  // Timeout pour les assertions (5 secondes)
  expect: {
    timeout: 5_000,
  },
  
  // Exécuter les tests en parallèle
  fullyParallel: true,
  
  // Nombre de retries en CI
  retries: process.env.CI ? 2 : 0,
  
  // Nombre de workers en parallèle
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['list'],
  ],
  
  // Configuration partagée pour tous les projets
  use: {
    // Dossier pour les artefacts (screenshots, traces, videos)
    outputDir: './test-results/browser/artifacts',
    
    // Mode headless
    headless: true,
    
    // Capture screenshot à chaque test
    screenshot: 'on',
    
    // Capture trace à chaque test
    trace: 'on-first-retry',
    
    // Capture vidéo (désactivé pour MVP-2)
    video: 'off',
    
    // Timeout pour les actions (10 secondes)
    actionTimeout: 10_000,
    
    // Timeout pour la navigation (15 secondes)
    navigationTimeout: 15_000,
  },
  
  // Projets (browsers)
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
  
  // Serveur de test (optionnel)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
```

**Explication de la configuration :**

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `testDir` | `./tests/browser` | Isoler les tests Playwright |
| `timeout` | 30s | Suffisant pour navigation + assertions |
| `headless` | `true` | Plus rapide, pas besoin d'UI |
| `screenshot` | `'on'` | Capture automatique pour debugging |
| `trace` | `'on-first-retry'` | Capture trace seulement en cas d'échec |
| `video` | `'off'` | Trop volumineux pour MVP-2 |
| `projects` | 3 browsers | Couverture maximale |

**Commit :**
```bash
git add playwright.config.ts
git commit -m "feat(browser): add Playwright configuration"
```

---

### 3.3 Créer la structure de dossiers (Jour 2, matin — 2h)

**Créer les dossiers :**

```bash
mkdir -p src/browser
mkdir -p tests/browser
```

**Créer les fichiers types :**

**Fichier :** `src/browser/types.ts`

```typescript
/**
 * Types pour le module browser
 */

/**
 * Options de navigation
 */
export interface NavigationOptions {
  /** URL à naviguer */
  url: string;
  /** Timeout en millisecondes (défaut: 30000) */
  timeout?: number;
  /** Attendre que la page soit complètement chargée (défaut: 'load') */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

/**
 * Options de screenshot
 */
export interface ScreenshotOptions {
  /** Chemin du fichier de sortie */
  path: string;
  /** Type d'image (défaut: 'png') */
  type?: 'png' | 'jpeg';
  /** Qualité (0-100, uniquement pour JPEG) */
  quality?: number;
  /** Capture plein écran (défaut: false) */
  fullPage?: boolean;
}

/**
 * Options de trace
 */
export interface TraceOptions {
  /** Chemin du fichier de sortie */
  path: string;
  /** Inclure les screenshots (défaut: true) */
  screenshots?: boolean;
  /** Inclure les snapshots DOM (défaut: true) */
  snapshots?: boolean;
  /** Inclure les sources (défaut: false) */
  sources?: boolean;
}

/**
 * Options de PDF
 */
export interface PdfOptions {
  /** Chemin du fichier de sortie */
  path: string;
  /** Format de page (défaut: 'Letter') */
  format?: 'Letter' | 'A4' | 'A3' | 'Legal';
  /** Orientation (défaut: 'portrait') */
  landscape?: boolean;
  /** Marges (défaut: 0.5in) */
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Résultat de navigation
 */
export interface NavigationResult {
  /** URL finale (après redirections) */
  url: string;
  /** Titre de la page */
  title: string;
  /** Temps de chargement (ms) */
  loadTime: number;
  /** Statut HTTP */
  status: number;
}

/**
 * Résultat de screenshot
 */
export interface ScreenshotResult {
  /** Chemin du fichier créé */
  path: string;
  /** Taille du fichier (bytes) */
  size: number;
  /** Dimensions de l'image */
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Résultat de trace
 */
export interface TraceResult {
  /** Chemin du fichier créé */
  path: string;
  /** Taille du fichier (bytes) */
  size: number;
  /** Durée de l'enregistrement (ms) */
  duration: number;
}

/**
 * Résultat de PDF
 */
export interface PdfResult {
  /** Chemin du fichier créé */
  path: string;
  /** Taille du fichier (bytes) */
  size: number;
  /** Nombre de pages */
  pages: number;
}

/**
 * Nœud de l'accessibility tree
 */
export interface AccessibilityNode {
  /** Rôle ARIA (ex: 'heading', 'link', 'button') */
  role: string;
  /** Nom accessible (texte ou label) */
  name?: string;
  /** Description accessible */
  description?: string;
  /** Valeur (pour inputs, sliders, etc.) */
  value?: string | number;
  /** Niveau (pour headings) */
  level?: number;
  /** URL (pour links) */
  url?: string;
  /** Enfants (nœuds enfants) */
  children?: AccessibilityNode[];
}

/**
 * Résultat d'extraction accessibility tree
 */
export interface AccessibilityResult {
  /** Racine de l'arbre */
  root: AccessibilityNode;
  /** Nombre total de nœuds */
  nodeCount: number;
  /** Temps d'extraction (ms) */
  extractionTime: number;
}
```

**Commit :**
```bash
git add src/browser/types.ts
git commit -m "feat(browser): add TypeScript types for browser module"
```

---

### 3.4 Test basique Playwright (Jour 2, après-midi — 4h)

**Fichier :** `tests/browser/basic.test.ts`

```typescript
import { test, expect } from '@playwright/test';

/**
 * Test basique pour vérifier que Playwright fonctionne
 */
test.describe('Playwright Basic Tests', () => {
  test('should navigate to example.com', async ({ page }) => {
    // Naviguer vers example.com
    await page.goto('https://example.com');
    
    // Vérifier le titre
    await expect(page).toHaveTitle('Example Domain');
    
    // Vérifier le contenu
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Example Domain');
  });

  test('should take a screenshot', async ({ page }) => {
    // Naviguer vers example.com
    await page.goto('https://example.com');
    
    // Prendre un screenshot
    const screenshot = await page.screenshot();
    
    // Vérifier que le screenshot n'est pas vide
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('should extract page content', async ({ page }) => {
    // Naviguer vers example.com
    await page.goto('https://example.com');
    
    // Extraire le contenu
    const content = await page.content();
    
    // Vérifier que le contenu contient "Example Domain"
    expect(content).toContain('Example Domain');
  });
});
```

**Exécuter les tests :**

```bash
npx playwright test tests/browser/basic.test.ts
```

**Résultat attendu :**
```
✅ 3 tests passed (3 browsers × 1 test = 9 tests au total)
```

**Vérifier les artefacts :**

```bash
ls -la test-results/browser/artifacts/
# ✅ Screenshots capturés pour chaque test
```

**Commit :**
```bash
git add tests/browser/basic.test.ts
git commit -m "test(browser): add basic Playwright tests"
```

---

### 3.5 Vérification finale Sprint 7-1 (Jour 3)

**Vérifications :**

```bash
# 1. Playwright installé
npm list @playwright/test
# ✅ @playwright/test@1.40.0

# 2. Browsers installés
npx playwright install --list
# ✅ chromium, firefox, webkit

# 3. Configuration valide
cat playwright.config.ts
# ✅ Configuration complète

# 4. Tests basiques passent
npx playwright test tests/browser/basic.test.ts
# ✅ 3 tests × 3 browsers = 9 tests passent

# 5. Artefacts générés
ls -la test-results/browser/artifacts/
# ✅ Screenshots capturés

# 6. Compilation TypeScript
npm run build
# ✅ Aucune erreur

# 7. Linting
npm run lint
# ✅ Aucune erreur

# 8. Push
git push origin feat/sprint-7-1
```

**Point de contrôle Sprint 7-1 :**
- ✅ Playwright installé avec 3 browsers
- ✅ Configuration Playwright fonctionnelle
- ✅ Types TypeScript créés
- ✅ Tests basiques passent
- ✅ Artefacts générés (screenshots)

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `playwright.config.ts` | ~50 | Configuration Playwright |
| `src/browser/types.ts` | ~150 | Types TypeScript |
| `tests/browser/basic.test.ts` | ~40 | Tests basiques |

**Total Sprint 7-1 :** ~240 lignes

---

## 5. Commits

```bash
git commit -m "chore: install Playwright and browsers"
git commit -m "feat(browser): add Playwright configuration"
git commit -m "feat(browser): add TypeScript types for browser module"
git commit -m "test(browser): add basic Playwright tests"
```

---

## 6. Transition vers Sprint 7-2

**Prérequis pour Sprint 7-2 :**
- ✅ Sprint 7-1 terminé avec succès
- ✅ Playwright installé (3 browsers)
- ✅ Configuration fonctionnelle
- ✅ Tests basiques passent

**Sprint 7-2 va implémenter :**
- Playwright MCP (intégration MCP)
- Navigation basique (goto, screenshot, trace, PDF)

---

**Fin du document Sprint 7-1**
