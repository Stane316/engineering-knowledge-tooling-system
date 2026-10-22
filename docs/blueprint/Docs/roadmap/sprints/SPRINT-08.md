# Sprint 8 — 4 Niveaux d'Inspection (Semaine 15-16)

**Durée :** 2 semaines (10 jours ouvrables)  
**Objectif :** Implémenter les 3 niveaux d'inspection (L1-L3) avec intégration Lighthouse et axe-core  
**MVP :** MVP-2 (Inspection Navigateur)
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte

### 1.1 Situation actuelle

Le **Sprint 7 (Playwright Setup)** a mis en place :
- ✅ Playwright installé avec 3 browsers (Chromium, Firefox, WebKit)
- ✅ Navigator fonctionnel (goto, screenshot, trace, PDF)
- ✅ Accessibility tree extractible
- ✅ PlaywrightMCP intégré
- ✅ Tests d'intégration > 80% couverture

### 1.2 Objectifs du Sprint 8

Ce sprint implémente **3 niveaux d'inspection** de complexité croissante :

| Niveau | Nom | Durée cible | Contenu |
|--------|-----|-------------|---------|
| **L1** | Rapide | < 10s | Screenshot + accessibility tree + métadonnées basiques |
| **L2** | Standard | < 30s | L1 + Lighthouse (performance) + analyse SEO |
| **L3** | Approfondie | < 60s | L2 + axe-core (accessibilité) + analyse UX + analyse contenu |

**Note :** Le 4e niveau (L4 - Crawling multi-pages) est reporté au-delà du MVP-2.

### 1.3 Pourquoi ce sprint est critique

L'Inspector est le **cœur du MVP-2**. C'est lui qui :
- 🎯 Collecte les données brutes pour l'analyse 5 dimensions (Sprint 9)
- 🎯 Intègre Lighthouse (performance) et axe-core (accessibilité)
- 🎯 Fournit les artifacts (screenshots, traces, PDFs) pour le rapport (Sprint 11)
- 🎯 Détermine la profondeur d'inspection selon les besoins

**Si l'Inspector échoue, tout le MVP-2 échoue.**

---

## 2. Périmètre du sprint

### 2.1 Ce qui est inclus

| # | Composant | Description | Fichier |
|---|-----------|-------------|---------|
| 1 | Types inspection | Types TypeScript pour niveaux L1-L3 | `src/browser/inspection/types.ts` |
| 2 | Inspection L1 | Rapide : screenshot + a11y tree + métadonnées | `src/browser/inspection/level-1.ts` |
| 3 | Inspection L2 | Standard : L1 + Lighthouse + SEO | `src/browser/inspection/level-2.ts` |
| 4 | Inspection L3 | Approfondie : L2 + axe-core + UX + contenu | `src/browser/inspection/level-3.ts` |
| 5 | Intégration Lighthouse | Analyse performance (Core Web Vitals) | `src/browser/lighthouse.ts` |
| 6 | Intégration axe-core | Analyse accessibilité (WCAG 2.2) | `src/browser/axe.ts` |
| 7 | Tests inspection | Tests unitaires L1-L3 | `tests/browser/inspection/` |
| 8 | Documentation | Documentation Inspector | `docs/INSPECTOR.md` |

### 2.2 Ce qui est exclu

| Exclu | Raison | Reporté à |
|-------|--------|-----------|
| ❌ Inspection L4 (Crawling) | Multi-pages, complexe | Après MVP-2 |
| ❌ Analyse 5 dimensions | Calcul scores + matrice sévérité | Sprint 9 |
| ❌ Stockage audits | Base de données audits | Sprint 10 |
| ❌ Rapport inspection | Génération rapport final | Sprint 11 |
| ❌ CLI `ekts inspect` | Commande CLI | Sprint 11 |
| ❌ MCP tool `inspect_site` | Outil MCP | Sprint 11 |

### 2.3 Dépendances

**Ce que le Sprint 8 utilise depuis les Sprints précédents :**
- ✅ Navigator (Sprint 7) — Navigation, screenshots
- ✅ Accessibility (Sprint 7) — Extraction accessibility tree
- ✅ PlaywrightMCP (Sprint 7) — Intégration MCP

**Ce que le Sprint 8 prépare pour les Sprints suivants :**
- 🎯 Données brutes pour analyse 5 dimensions (Sprint 9)
- 🎯 Artifacts pour rapport inspection (Sprint 11)
- 🎯 Interface `Inspector` pour CLI et MCP (Sprint 11)

---

## 3. État initial et prérequis

### 3.1 État initial (fin Sprint 7)

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

### 3.2 Prérequis obligatoires

```bash
# 1. Sprint 7 terminé avec succès
ls -la src/browser/navigator.ts
ls -la src/browser/accessibility.ts
# ✅ Fichiers existent

# 2. Tests Sprint 7
npm test tests/browser/
# ✅ Tests passent

# 3. Playwright fonctionnel
npx playwright --version
# ✅ Version affichée

# 4. Compilation TypeScript
npm run build
# ✅ Aucune erreur
```

### 3.3 Prérequis compétences

**L'agent de développement doit maîtriser :**
- ✅ Playwright intermédiaire (navigation, screenshots)
- 🟡 Lighthouse (bases) — peut apprendre
- 🟡 axe-core (bases) — peut apprendre
- 🟡 WCAG 2.2 (bases) — peut apprendre
- 🟡 SEO best practices (bases) — peut apprendre

---

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif | Tâches |
|-------------|-------|----------|--------|
| **Sprint 8-1** | 3 jours | Types + Inspection L1 | 8.1, 8.2 |
| **Sprint 8-2** | 4 jours | Lighthouse + Inspection L2 | 8.3, 8.4 |
| **Sprint 8-3** | 3 jours | axe-core + Inspection L3 + tests + docs | 8.5, 8.6, 8.7 |

### 4.2 Sprint 8-1 — Types + Inspection L1 (rapide)

**Durée :** 3 jours  
**Objectif :** Définir les types et implémenter l'inspection L1

**Tâches :**
- ✅ 8.1 Types inspection (L1, L2, L3, artifacts) — 4h
- ✅ 8.2 Inspection L1 (screenshot + a11y tree + métadonnées) — 8h

**Détail :** Voir document `SPRINT-08-01.md`

**Critères de validation :**
- ✅ Types TypeScript définis (InspectionLevel, InspectionResult, etc.)
- ✅ Inspection L1 fonctionne (< 10s)
- ✅ Screenshot capturé
- ✅ Accessibility tree extrait
- ✅ Métadonnées basiques collectées (URL, titre, viewport)
- ✅ Tests unitaires L1 > 80% couverture

### 4.3 Sprint 8-2 — Lighthouse + Inspection L2 (standard)

**Durée :** 4 jours  
**Objectif :** Intégrer Lighthouse et implémenter l'inspection L2

**Tâches :**
- ✅ 8.3 Intégration Lighthouse (Core Web Vitals) — 8h
- ✅ 8.4 Inspection L2 (L1 + Lighthouse + SEO) — 8h

**Détail :** Voir document `SPRINT-08-02.md`

**Critères de validation :**
- ✅ Lighthouse fonctionne (analyse performance)
- ✅ Core Web Vitals collectés (LCP, FID, CLS, TTFB)
- ✅ Analyse SEO basique (meta tags, headings, links)
- ✅ Inspection L2 fonctionne (< 30s)
- ✅ Tests unitaires L2 > 80% couverture

### 4.4 Sprint 8-3 — axe-core + Inspection L3 + tests + docs

**Durée :** 3 jours  
**Objectif :** Intégrer axe-core, implémenter L3, tester et documenter

**Tâches :**
- ✅ 8.5 Intégration axe-core (WCAG 2.2) — 8h
- ✅ 8.6 Inspection L3 (L2 + axe-core + UX + contenu) — 8h
- ✅ 8.7 Tests inspection L1-L3 + documentation — 4h

**Détail :** Voir document `SPRINT-08-03.md`

**Critères de validation :**
- ✅ axe-core fonctionne (analyse accessibilité)
- ✅ Violations WCAG 2.2 détectées
- ✅ Analyse UX basique (heuristiques Nielsen)
- ✅ Analyse contenu basique (qualité, structure)
- ✅ Inspection L3 fonctionne (< 60s)
- ✅ Tests unitaires L1-L3 > 80% couverture
- ✅ Documentation complète

---

## 5. Choix techniques et références

### 5.1 Architecture Inspector

**Décision :** Architecture en niveaux imbriqués (L1 → L2 → L3).

**Pattern :**
```typescript
class Inspector {
  async inspect(url: string, level: 'L1' | 'L2' | 'L3'): Promise<InspectionResult> {
    // L1 : Screenshot + accessibility tree + métadonnées
    const l1Result = await this.inspectL1(url);
    
    if (level === 'L1') return l1Result;
    
    // L2 : L1 + Lighthouse + SEO
    const l2Result = await this.inspectL2(url, l1Result);
    
    if (level === 'L2') return l2Result;
    
    // L3 : L2 + axe-core + UX + contenu
    const l3Result = await this.inspectL3(url, l2Result);
    
    return l3Result;
  }
}
```

**Avantages :**
- ✅ Réutilisation code (L2 inclut L1, L3 inclut L2)
- ✅ Performance (pas de duplication)
- ✅ Flexibilité (choix du niveau)

### 5.2 Lighthouse

**Décision :** Utiliser Lighthouse via Playwright (lighthouse-latest).

**Référence :** ADR-012 (Lighthouse)

**Pourquoi Lighthouse ?**
- ✅ Standard Google pour la performance web
- ✅ Core Web Vitals (LCP, FID, CLS, TTFB)
- ✅ Intégration native avec Playwright
- ✅ Rapport JSON structuré
- ✅ Open source (Apache 2.0)

**Métriques collectées :**
- **Performance** : LCP, FID, CLS, TTFB, FCP, SI
- **SEO** : Meta tags, headings, links, structured data
- **Best Practices** : HTTPS, images optimisées, etc.

**Version :** Lighthouse v11+ (octobre 2026)

### 5.3 axe-core

**Décision :** Utiliser axe-core pour l'analyse accessibilité.

**Référence :** ADR-013 (axe-core)

**Pourquoi axe-core ?**
- ✅ Standard Deque Systems pour WCAG 2.2
- ✅ Détection violations accessibilité
- ✅ Intégration native avec Playwright
- ✅ Rapport JSON structuré
- ✅ Open source (MPL 2.0)

**Règles WCAG 2.2 :**
- **Niveau A** : 30 règles (obligatoire)
- **Niveau AA** : 20 règles (recommandé)
- **Niveau AAA** : 15 règles (optionnel)

**Version :** axe-core v4.8+ (octobre 2026)

### 5.4 Analyse SEO

**Décision :** Analyse SEO basique via extraction DOM.

**Éléments analysés :**
- **Meta tags** : title, description, keywords, og:*, twitter:*
- **Headings** : h1-h6 (structure, hiérarchie)
- **Links** : internal, external, broken, anchor text
- **Images** : alt text, dimensions, format
- **Structured data** : JSON-LD, Microdata, RDFa

### 5.5 Analyse UX

**Décision :** Analyse UX basique basée sur les heuristiques de Nielsen.

**Heuristiques vérifiées :**
1. **Visibility of system status** : Loading indicators, feedback
2. **Match between system and real world** : Language clair, icônes familières
3. **User control and freedom** : Undo, redo, exit
4. **Consistency and standards** : Conventions UI
5. **Error prevention** : Validation, confirmation

**Note :** Analyse UX complète reportée au Sprint 9.

### 5.6 Analyse contenu

**Décision :** Analyse contenu basique (structure, qualité).

**Éléments analysés :**
- **Structure** : Paragraphes, listes, tableaux
- **Qualité** : Longueur phrases, complexité, lisibilité
- **Pertinence** : Mots-clés, densité, cohérence

**Note :** Analyse contenu complète reportée au Sprint 9.

### 5.7 Performance

**Cibles performance :**

| Niveau | Durée cible | Raison |
|--------|-------------|--------|
| L1 | < 10s | Rapide, screenshot + a11y tree |
| L2 | < 30s | Standard, ajoute Lighthouse + SEO |
| L3 | < 60s | Approfondie, ajoute axe-core + UX + contenu |

**Optimisations :**
- Mode headless (plus rapide)
- Lighthouse configuré pour performance (pas d'audits inutiles)
- axe-core filtré (règles WCAG 2.2 AA uniquement)
- Analyse UX/contenu basique (pas de NLP complexe)

---

## 6. Organisation des fichiers

### 6.1 Structure après Sprint 8

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── browser/
│   │   ├── types.ts                    ✅ (Sprint 7)
│   │   ├── navigator.ts                ✅ (Sprint 7)
│   │   ├── playwright-mcp.ts           ✅ (Sprint 7)
│   │   ├── accessibility.ts            ✅ (Sprint 7)
│   │   ├── lighthouse.ts               🆕 (Sprint 8-2)
│   │   ├── axe.ts                      🆕 (Sprint 8-3)
│   │   └── inspection/
│   │       ├── types.ts                🆕 (Sprint 8-1)
│   │       ├── level-1.ts              🆕 (Sprint 8-1)
│   │       ├── level-2.ts              🆕 (Sprint 8-2)
│   │       ├── level-3.ts              🆕 (Sprint 8-3)
│   │       └── inspector.ts            🆕 (Sprint 8-3)
│   └── ...
├── tests/
│   └── browser/
│       ├── navigator.test.ts           ✅ (Sprint 7)
│       ├── accessibility.test.ts       ✅ (Sprint 7)
│       ├── integration.test.ts         ✅ (Sprint 7)
│       ├── lighthouse.test.ts          🆕 (Sprint 8-2)
│       ├── axe.test.ts                 🆕 (Sprint 8-3)
│       └── inspection/
│           ├── level-1.test.ts         🆕 (Sprint 8-1)
│           ├── level-2.test.ts         🆕 (Sprint 8-2)
│           └── level-3.test.ts         🆕 (Sprint 8-3)
├── docs/
│   ├── PLAYWRIGHT.md                   ✅ (Sprint 7)
│   └── INSPECTOR.md                    🆕 (Sprint 8-3)
└── package.json                        🆕 (ajouter lighthouse, axe-core)
```

### 6.2 Fichiers à créer

| Fichier | Lignes estimées | Description |
|---------|-----------------|-------------|
| `src/browser/inspection/types.ts` | ~150 | Types inspection (L1, L2, L3) |
| `src/browser/inspection/level-1.ts` | ~120 | Inspection L1 (rapide) |
| `src/browser/inspection/level-2.ts` | ~180 | Inspection L2 (standard) |
| `src/browser/inspection/level-3.ts` | ~220 | Inspection L3 (approfondie) |
| `src/browser/inspection/inspector.ts` | ~100 | Inspector principal |
| `src/browser/lighthouse.ts` | ~150 | Intégration Lighthouse |
| `src/browser/axe.ts` | ~120 | Intégration axe-core |
| `tests/browser/lighthouse.test.ts` | ~100 | Tests Lighthouse |
| `tests/browser/axe.test.ts` | ~100 | Tests axe-core |
| `tests/browser/inspection/level-1.test.ts` | ~120 | Tests L1 |
| `tests/browser/inspection/level-2.test.ts` | ~150 | Tests L2 |
| `tests/browser/inspection/level-3.test.ts` | ~180 | Tests L3 |
| `docs/INSPECTOR.md` | ~400 | Documentation Inspector |

**Total :** ~1 990 lignes de code + documentation

---

## 7. Tests et validation

### 7.1 Stratégie de test

**Niveaux de test :**
- ✅ Tests unitaires (mock Lighthouse, axe-core)
- ✅ Tests d'intégration (vrai browser + Lighthouse + axe-core)
- ✅ Tests performance (L1 < 10s, L2 < 30s, L3 < 60s)

**Outils :**
- Vitest (test runner)
- Playwright Test (tests browser)
- Mocks Vitest (vi.fn(), vi.mock())

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/browser/inspection/`

**Mesure :**
```bash
npm run test:coverage -- tests/browser/inspection/
# ✅ Statements > 80%
# ✅ Branches > 80%
# ✅ Functions > 80%
# ✅ Lines > 80%
```

### 7.3 Scénarios à tester

**Tests unitaires L1 :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Inspection L1 basique | `inspectL1(url)` | Résultat L1 complet |
| Screenshot capturé | `inspectL1(url)` | PNG créé |
| Accessibility tree extrait | `inspectL1(url)` | Arbre JSON |
| Métadonnées collectées | `inspectL1(url)` | URL, titre, viewport |

**Tests unitaires L2 :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Inspection L2 basique | `inspectL2(url)` | Résultat L2 complet |
| Lighthouse fonctionne | `inspectL2(url)` | Core Web Vitals collectés |
| SEO analysé | `inspectL2(url)` | Meta tags, headings, links |
| Performance < 30s | `inspectL2(url)` | Durée < 30s |

**Tests unitaires L3 :**

| Scénario | Méthode | Résultat attendu |
|----------|---------|------------------|
| Inspection L3 basique | `inspectL3(url)` | Résultat L3 complet |
| axe-core fonctionne | `inspectL3(url)` | Violations WCAG détectées |
| UX analysé | `inspectL3(url)` | Heuristiques Nielsen |
| Contenu analysé | `inspectL3(url)` | Structure, qualité |
| Performance < 60s | `inspectL3(url)` | Durée < 60s |

### 7.4 Critères de validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

---

## 8. Critères d'acceptation du sprint

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C8.1 | Types inspection définis (L1, L2, L3) | Compilation OK |
| C8.2 | Inspection L1 fonctionne (< 10s) | Test performance passe |
| C8.3 | Inspection L2 fonctionne (< 30s) | Test performance passe |
| C8.4 | Inspection L3 fonctionne (< 60s) | Test performance passe |
| C8.5 | Lighthouse intégré (Core Web Vitals) | Test Lighthouse passe |
| C8.6 | axe-core intégré (WCAG 2.2) | Test axe-core passe |
| C8.7 | Analyse SEO basique | Test SEO passe |
| C8.8 | Analyse UX basique | Test UX passe |
| C8.9 | Analyse contenu basique | Test contenu passe |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C8.10 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C8.11 | Tests d'intégration passent | `npm test tests/browser/inspection/` |
| C8.12 | Compilation TypeScript OK | `npm run build` |
| C8.13 | Linting OK | `npm run lint` |
| C8.14 | Documentation Inspector complète | `docs/INSPECTOR.md` existe |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C8.15 | Performance respectée (L1 < 10s, L2 < 30s, L3 < 60s) | Tests performance |
| C8.16 | Code lisible (JSDoc, commentaires) | Revue code |
| C8.17 | Gestion erreurs robuste | Tests erreurs passent |
| C8.18 | Architecture en niveaux imbriqués | Revue architecture |

---

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Validation |
|---------|-------------|------------|
| `src/browser/inspection/types.ts` | Types inspection (L1, L2, L3) | Compilation OK |
| `src/browser/inspection/level-1.ts` | Inspection L1 (rapide) | Test unitaire passe |
| `src/browser/inspection/level-2.ts` | Inspection L2 (standard) | Test unitaire passe |
| `src/browser/inspection/level-3.ts` | Inspection L3 (approfondie) | Test unitaire passe |
| `src/browser/inspection/inspector.ts` | Inspector principal | Test unitaire passe |
| `src/browser/lighthouse.ts` | Intégration Lighthouse | Test Lighthouse passe |
| `src/browser/axe.ts` | Intégration axe-core | Test axe-core passe |

### 9.2 Tests

| Fichier | Description | Validation |
|---------|-------------|------------|
| `tests/browser/lighthouse.test.ts` | Tests Lighthouse | > 80% couverture |
| `tests/browser/axe.test.ts` | Tests axe-core | > 80% couverture |
| `tests/browser/inspection/level-1.test.ts` | Tests L1 | > 80% couverture |
| `tests/browser/inspection/level-2.test.ts` | Tests L2 | > 80% couverture |
| `tests/browser/inspection/level-3.test.ts` | Tests L3 | > 80% couverture |

### 9.3 Documentation

| Fichier | Description | Validation |
|---------|-------------|------------|
| `docs/INSPECTOR.md` | Documentation Inspector | Complète + exemples |

### 9.4 Configuration

| Fichier | Description | Validation |
|---------|-------------|------------|
| `package.json` | Ajouter `lighthouse`, `@axe-core/playwright` | Installation OK |

### 9.5 Commits Git

```bash
# Sprint 8-1
git commit -m "feat(browser): add inspection types (L1, L2, L3)"
git commit -m "feat(browser): implement inspection L1 (rapid)"
git push origin feat/sprint-8-1

# Sprint 8-2
git commit -m "feat(browser): integrate Lighthouse for performance analysis"
git commit -m "feat(browser): implement inspection L2 (standard)"
git push origin feat/sprint-8-2

# Sprint 8-3
git commit -m "feat(browser): integrate axe-core for accessibility analysis"
git commit -m "feat(browser): implement inspection L3 (deep)"
git commit -m "feat(browser): implement main Inspector class"
git commit -m "test(browser): add tests for L1, L2, L3 inspections"
git commit -m "docs: add Inspector documentation"
git push origin feat/sprint-8-3
```

---

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

**Avant de clôturer le Sprint 8 :**

```bash
# 1. Tests unitaires
npm test tests/browser/inspection/
# ✅ Tous les tests passent

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
inspector.inspect('https://example.com', 'L1').then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Screenshot:', r.artifacts.screenshot);
});
"
# ✅ Inspection L1 fonctionne

# 7. Test manuel L2
node -e "
const { Inspector } = require('./dist/browser/inspection/inspector');
const inspector = new Inspector();
inspector.inspect('https://example.com', 'L2').then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('Lighthouse:', r.lighthouse.performance.score);
});
"
# ✅ Inspection L2 fonctionne

# 8. Test manuel L3
node -e "
const { Inspector } = require('./dist/browser/inspection/inspector');
const inspector = new Inspector();
inspector.inspect('https://example.com', 'L3').then(r => {
  console.log('Level:', r.level);
  console.log('Duration:', r.duration, 'ms');
  console.log('axe-core violations:', r.axe.violations.length);
});
"
# ✅ Inspection L3 fonctionne

# 9. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques (1 tâche = 1 commit)
```

### 10.2 Point de contrôle

**Vérifier les 18 critères :**
- ✅ C8.1 à C8.9 (critères fonctionnels)
- ✅ C8.10 à C8.14 (critères techniques)
- ✅ C8.15 à C8.18 (critères qualité)

**Si tous les critères sont validés :**
```bash
# Merge dans main
git checkout main
git merge feat/sprint-8-3
git push origin main
```

**Si des critères ne sont pas validés :**
- Identifier les problèmes
- Corriger dans une nouvelle branche `fix/sprint-8-xxx`
- Re-tester

### 10.3 Transition vers Sprint 9

**Une fois Sprint 8 terminé avec succès :**
- ✅ 3 niveaux d'inspection fonctionnels (L1-L3)
- ✅ Lighthouse intégré (performance)
- ✅ axe-core intégré (accessibilité)
- ✅ Analyse SEO, UX, contenu basiques
- ✅ Tests d'intégration passent
- ✅ Documentation complète

**Préparer Sprint 9 (Analyse 5 Dimensions) :**
- 🎯 Lire `SPRINT-09.md` (quand disponible)
- 🎯 Vérifier prérequis Sprint 9
- 🎯 Créer branche `feat/sprint-9-1`

---

## 11. Prompt de lancement pour agent

**Copier ce prompt pour lancer un agent de développement :**

```markdown
## Mission

Implémenter le Sprint 8 — 4 Niveaux d'Inspection (Semaine 15-16) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-08.md` — Dossier complet Sprint 8
2. `Docs/roadmap/sprints/SPRINT-08-01.md` — Sprint 8-1 (Types + L1)
3. `Docs/roadmap/sprints/SPRINT-08-02.md` — Sprint 8-2 (Lighthouse + L2)
4. `Docs/roadmap/sprints/SPRINT-08-03.md` — Sprint 8-3 (axe-core + L3 + tests + docs)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (section 4.2.3)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-012 Lighthouse, ADR-013 axe-core)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 7 terminé
ls -la src/browser/navigator.ts
ls -la src/browser/accessibility.ts
# ✅ Fichiers existent

# 2. Tests Sprint 7
npm test tests/browser/
# ✅ Tests passent

# 3. Playwright fonctionnel
npx playwright --version
# ✅ Version affichée
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 7 terminé avec succès
- ✅ Navigator fonctionnel (goto, screenshot, trace, PDF)
- ✅ Accessibility tree extractible
- ✅ Playwright installé (3 browsers)

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer des fichiers dans `src/browser/inspection/`
- ✅ Créer `src/browser/lighthouse.ts`
- ✅ Créer `src/browser/axe.ts`
- ✅ Créer des fichiers dans `tests/browser/inspection/`
- ✅ Créer `tests/browser/lighthouse.test.ts`
- ✅ Créer `tests/browser/axe.test.ts`
- ✅ Créer `docs/INSPECTOR.md`
- ✅ Installer `lighthouse`, `@axe-core/playwright` (dépendances npm)

**Vous ne pouvez pas :**
- ❌ Modifier `src/browser/navigator.ts` (sauf si bug critique)
- ❌ Modifier `src/browser/accessibility.ts` (sauf si bug critique)
- ❌ Modifier `src/business/` (sauf si bug critique)
- ❌ Créer de fichiers hors périmètre
- ❌ Installer d'autres dépendances (sauf approbation préalable)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Architecture en niveaux imbriqués (L1 → L2 → L3)
- ✅ Performance : L1 < 10s, L2 < 30s, L3 < 60s
- ✅ Mode headless par défaut
- ✅ Lighthouse v11+ (Core Web Vitals)
- ✅ axe-core v4.8+ (WCAG 2.2 AA)

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur TypeScript (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

**Tests performance :**
- ✅ L1 < 10s
- ✅ L2 < 30s
- ✅ L3 < 60s

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 8.1 : Types inspection définis
- [x] Tâche 8.2 : Inspection L1 implémentée

### Tâches en cours
- [ ] Tâche 8.3 : Intégration Lighthouse (50% terminé)

### Tâches à venir
- [ ] Tâche 8.4 : Inspection L2
- [ ] Tâche 8.5 : Intégration axe-core
- [ ] Tâche 8.6 : Inspection L3

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 8 est terminé quand :**
- ✅ Les 18 critères d'acceptation sont validés (C8.1 à C8.18)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Performance respectée (L1 < 10s, L2 < 30s, L3 < 60s)
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-8-3`

## Livrables

**À la fin du Sprint 8, fournir :**
- ✅ `src/browser/inspection/types.ts` — Types inspection
- ✅ `src/browser/inspection/level-1.ts` — Inspection L1
- ✅ `src/browser/inspection/level-2.ts` — Inspection L2
- ✅ `src/browser/inspection/level-3.ts` — Inspection L3
- ✅ `src/browser/inspection/inspector.ts` — Inspector principal
- ✅ `src/browser/lighthouse.ts` — Intégration Lighthouse
- ✅ `src/browser/axe.ts` — Intégration axe-core
- ✅ `tests/browser/lighthouse.test.ts` — Tests Lighthouse
- ✅ `tests/browser/axe.test.ts` — Tests axe-core
- ✅ `tests/browser/inspection/level-1.test.ts` — Tests L1
- ✅ `tests/browser/inspection/level-2.test.ts` — Tests L2
- ✅ `tests/browser/inspection/level-3.test.ts` — Tests L3
- ✅ `docs/INSPECTOR.md` — Documentation Inspector

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-012 Lighthouse, ADR-013 axe-core)
- ✅ Consulter la documentation Lighthouse (https://developer.chrome.com/docs/lighthouse)
- ✅ Consulter la documentation axe-core (https://www.deque.com/axe/)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 8-1 : 3 jours (Types + L1)
- Sprint 8-2 : 4 jours (Lighthouse + L2)
- Sprint 8-3 : 3 jours (axe-core + L3 + tests + docs)

## Notes importantes

**Performance :**
- ⚠️ L1 < 10s (screenshot + a11y tree)
- ⚠️ L2 < 30s (L1 + Lighthouse + SEO)
- ⚠️ L3 < 60s (L2 + axe-core + UX + contenu)

**Lighthouse :**
- ⚠️ Core Web Vitals : LCP, FID, CLS, TTFB
- ⚠️ Configuration pour performance (pas d'audits inutiles)

**axe-core :**
- ⚠️ WCAG 2.2 Niveau AA (30 règles)
- ⚠️ Filtrer les règles (pas toutes les règles)

**Architecture :**
- ⚠️ Niveaux imbriqués (L2 inclut L1, L3 inclut L2)
- ⚠️ Pas de duplication de code
```

---

## 12. Résumé

### 12.1 Sprint 8 — 4 Niveaux d'Inspection (2 semaines)

**Objectif :** Implémenter les 3 niveaux d'inspection (L1-L3) avec intégration Lighthouse et axe-core

**3 sous-sprints :**
- **Sprint 8-1** (3 jours) : Types + Inspection L1 (rapide)
- **Sprint 8-2** (4 jours) : Lighthouse + Inspection L2 (standard)
- **Sprint 8-3** (3 jours) : axe-core + Inspection L3 (approfondie) + tests + documentation

**Livrables principaux :**
- ✅ 3 niveaux d'inspection (L1, L2, L3)
- ✅ Lighthouse intégré (Core Web Vitals)
- ✅ axe-core intégré (WCAG 2.2 AA)
- ✅ Analyse SEO basique
- ✅ Analyse UX basique (heuristiques Nielsen)
- ✅ Analyse contenu basique
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation Inspector complète

**18 critères de validation :**
- ✅ C8.1 à C8.9 (fonctionnels)
- ✅ C8.10 à C8.14 (techniques)
- ✅ C8.15 à C8.18 (qualité)

**Dépendances :**
- ✅ Sprint 7 (Playwright Setup) — Terminé
- 🎯 Sprint 9 (Analyse 5 Dimensions) — Utilisera les données d'inspection

### 12.2 Transition

**Après Sprint 8 :**
- ✅ 3 niveaux d'inspection fonctionnels
- ✅ Lighthouse + axe-core intégrés
- ✅ Prêt pour Sprint 9 (Analyse 5 Dimensions)

**Sprint 9 — Analyse 5 Dimensions (Semaine 17-18) :**
- 🎯 Analyse performance (Lighthouse)
- 🎯 Analyse accessibilité (axe-core)
- 🎯 Analyse SEO (meta tags, structured data)
- 🎯 Analyse UX (heuristiques Nielsen)
- 🎯 Analyse contenu (qualité, pertinence)
- 🎯 Matrice sévérité (0-4 × 1-5 × 1-3)
- 🎯 Priorisation automatique des findings

---

**Fin du dossier Sprint 8 — 4 Niveaux d'Inspection**
