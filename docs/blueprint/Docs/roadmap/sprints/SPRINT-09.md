# Sprint 9 — Analyse 5 Dimensions (Semaine 17-18)

**MVP :** MVP-2 (Inspection Navigateur)  
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le **Sprint 8 (4 Niveaux d'Inspection)** a mis en place :
- ✅ Inspection L1 (rapide) : screenshot + accessibility tree + métadonnées
- ✅ Inspection L2 (standard) : L1 + Lighthouse (performance + SEO)
- ✅ Inspection L3 (approfondie) : L2 + axe-core + UX + contenu
- ✅ Données brutes collectées (Lighthouse, axe-core, etc.)

### 1.2 Objectifs du Sprint 9

Le Sprint 9 transforme les **données brutes** du Sprint 8 en **analyse structurée** :
- 🎯 Analyser les 5 dimensions (performance, accessibilité, SEO, UX, contenu)
- 🎯 Calculer la matrice de sévérité (0-4 × 1-5 × 1-3)
- 🎯 Prioriser automatiquement les findings
- 🎯 Générer des recommandations actionables

### 1.3 Pourquoi ce sprint est critique

L'analyse est le **cœur de la valeur** du MVP-2 :
- Sans analyse, les données brutes sont inutilisables
- La matrice de sévérité permet de prioriser les actions
- Les recommandations guident les utilisateurs vers les corrections

**Si l'analyse échoue, le MVP-2 ne délivre pas sa promesse.**

## 2. Périmètre du sprint

### 2.1 Inclus

| Module | Description | Fichier |
|--------|-------------|---------|
| PerformanceAnalyzer | Analyse performance (Lighthouse) | `src/analysis/performance.ts` |
| AccessibilityAnalyzer | Analyse accessibilité (axe-core) | `src/analysis/accessibility.ts` |
| SEOAnalyzer | Analyse SEO (meta, structure, contenu) | `src/analysis/seo.ts` |
| UXAnalyzer | Analyse UX (heuristiques Nielsen) | `src/analysis/ux.ts` |
| ContentAnalyzer | Analyse contenu (qualité, lisibilité) | `src/analysis/content.ts` |
| SeverityMatrix | Matrice de sévérité | `src/analysis/severity.ts` |
| FindingPrioritizer | Priorisation automatique | `src/analysis/prioritizer.ts` |

### 2.2 Exclu

| Élément | Raison |
|---------|--------|
| Stockage audits | Sprint 10 |
| Génération rapports | Sprint 11 |
| Commande CLI `ekts inspect` | Sprint 11 |
| Outil MCP `inspect_site` | Sprint 11 |

## 3. Architecture

### 3.1 Flux de données

```
Inspection L3 (Sprint 8)
    ↓
[PerformanceAnalyzer] → findings performance
[AccessibilityAnalyzer] → findings accessibilité
[SEOAnalyzer] → findings SEO
[UXAnalyzer] → findings UX
[ContentAnalyzer] → findings contenu
    ↓
[SeverityMatrix] → sévérité calculée
    ↓
[FindingPrioritizer] → findings triés par priorité
    ↓
AnalysisReport (Sprint 10)
```

### 3.2 Matrice de sévérité

| Sévérité | Impact | Effort | Priorité |
|----------|--------|--------|----------|
| 4 (Critique) | 5 (Élevé) | 1 (Faible) | 🔴 Immédiate |
| 3 (Élevé) | 4 (Élevé) | 2 (Moyen) | 🟠 Haute |
| 2 (Moyen) | 3 (Moyen) | 3 (Élevé) | 🟡 Moyenne |
| 1 (Faible) | 2 (Faible) | 4 (Élevé) | 🟢 Basse |
| 0 (Info) | 1 (Info) | 5 (Très élevé) | ⚪ Information |

**Formule :**
```
priority_score = severity × (6 - effort)
```

### 3.3 Types de findings

```typescript
interface Finding {
  id: string;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string;
  description: string;
  severity: 0 | 1 | 2 | 3 | 4;
  effort: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  recommendation: string;
  references: string[];
  elements?: string[]; // Sélecteurs CSS
}
```

## 4. Décomposition en sous-sprints

### 4.1 Vue d'ensemble

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| Sprint 9-1 | 4 jours | Analyse performance + accessibilité |
| Sprint 9-2 | 3 jours | Analyse SEO + UX + contenu |
| Sprint 9-3 | 3 jours | Matrice sévérité + priorisation + tests + docs |

### 4.2 Sprint 9-1 — Analyse performance + accessibilité (4 jours)

**Objectifs :**
- ✅ Analyser les métriques performance (LCP, FID, CLS, TTFB)
- ✅ Générer des recommandations performance
- ✅ Analyser les violations axe-core
- ✅ Calculer les scores accessibilité

**Livrables :**
- `src/analysis/performance.ts` — PerformanceAnalyzer
- `src/analysis/accessibility.ts` — AccessibilityAnalyzer
- Tests unitaires (> 80% couverture)

**Critères de validation :**
- ✅ PerformanceAnalyzer fonctionne
- ✅ AccessibilityAnalyzer fonctionne
- ✅ Recommandations générées
- ✅ Tests > 80% couverture

### 4.3 Sprint 9-2 — Analyse SEO + UX + contenu (3 jours)

**Objectifs :**
- ✅ Analyser le SEO (meta tags, structure, liens)
- ✅ Analyser l'UX (heuristiques Nielsen)
- ✅ Analyser le contenu (qualité, lisibilité)
- ✅ Générer des recommandations

**Livrables :**
- `src/analysis/seo.ts` — SEOAnalyzer
- `src/analysis/ux.ts` — UXAnalyzer
- `src/analysis/content.ts` — ContentAnalyzer
- Tests unitaires (> 80% couverture)

**Critères de validation :**
- ✅ SEOAnalyzer fonctionne
- ✅ UXAnalyzer fonctionne
- ✅ ContentAnalyzer fonctionne
- ✅ Recommandations générées
- ✅ Tests > 80% couverture

### 4.4 Sprint 9-3 — Matrice sévérité + priorisation + tests + docs (3 jours)

**Objectifs :**
- ✅ Implémenter la matrice de sévérité
- ✅ Implémenter la priorisation automatique
- ✅ Tests d'intégration complets
- ✅ Documentation complète

**Livrables :**
- `src/analysis/severity.ts` — SeverityMatrix
- `src/analysis/prioritizer.ts` — FindingPrioritizer
- Tests d'intégration
- `docs/ANALYSIS.md` — Documentation

**Critères de validation :**
- ✅ Matrice de sévérité fonctionne
- ✅ Priorisation automatique fonctionne
- ✅ Tests d'intégration passent
- ✅ Documentation complète

## 5. Choix techniques

### 5.1 Analyse performance

**Source :** Lighthouse (Sprint 8)

**Métriques analysées :**
- LCP (Largest Contentful Paint) : < 2.5s = bon, 2.5-4s = moyen, > 4s = mauvais
- FID (First Input Delay) : < 100ms = bon, 100-300ms = moyen, > 300ms = mauvais
- CLS (Cumulative Layout Shift) : < 0.1 = bon, 0.1-0.25 = moyen, > 0.25 = mauvais
- TTFB (Time to First Byte) : < 800ms = bon, 800-1800ms = moyen, > 1800ms = mauvais

**Seuils :**
```typescript
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  ttfb: { good: 800, needsImprovement: 1800 },
};
```

### 5.2 Analyse accessibilité

**Source :** axe-core (Sprint 8)

**Règles WCAG 2.2 AA :**
- 50 règles vérifiées
- Impact : minor, moderate, serious, critical
- Sévérité calculée selon impact + nombre d'éléments affectés

**Mapping impact → sévérité :**
```typescript
const IMPACT_TO_SEVERITY = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};
```

### 5.3 Analyse SEO

**Éléments analysés :**
- Meta tags (title, description, keywords)
- Structure headings (h1-h6)
- Liens (internal, external, broken)
- Images (alt text, dimensions)
- Structured data (JSON-LD, OpenGraph)

### 5.4 Analyse UX

**Heuristiques de Nielsen :**
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, recover from errors
10. Help and documentation

### 5.5 Analyse contenu

**Métriques :**
- Word count (comptage de mots)
- Reading time (temps de lecture estimé)
- Readability score (Flesch-Kincaid)
- Structure (paragraphes, listes, headings)
- Qualité (longueur phrases, complexité)

### 5.6 Matrice de sévérité

**Formule de calcul :**
```
priority_score = severity × (6 - effort)
```

**Exemples :**
- Sévérité 4, Effort 1 → Score = 4 × 5 = 20 (🔴 Immédiate)
- Sévérité 3, Effort 2 → Score = 3 × 4 = 12 (🟠 Haute)
- Sévérité 2, Effort 3 → Score = 2 × 3 = 6 (🟡 Moyenne)
- Sévérité 1, Effort 4 → Score = 1 × 2 = 2 (🟢 Basse)

### 5.7 Priorisation

**Algorithme :**
1. Calculer priority_score pour chaque finding
2. Trier par priority_score décroissant
3. Grouper par dimension
4. Générer résumé exécutif

## 6. Organisation des fichiers

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── analysis/
│   │   ├── types.ts                    # Types Analysis
│   │   ├── performance.ts              # PerformanceAnalyzer
│   │   ├── accessibility.ts            # AccessibilityAnalyzer
│   │   ├── seo.ts                      # SEOAnalyzer
│   │   ├── ux.ts                       # UXAnalyzer
│   │   ├── content.ts                  # ContentAnalyzer
│   │   ├── severity.ts                 # SeverityMatrix
│   │   └── prioritizer.ts              # FindingPrioritizer
│   └── ...
├── tests/
│   └── analysis/
│       ├── performance.test.ts
│       ├── accessibility.test.ts
│       ├── seo.test.ts
│       ├── ux.test.ts
│       ├── content.test.ts
│       ├── severity.test.ts
│       └── prioritizer.test.ts
└── docs/
    └── ANALYSIS.md                     # Documentation Analysis
```

## 7. Tests et validation

### 7.1 Stratégie de test

- **Tests unitaires** : Mock des données d'inspection
- **Tests d'intégration** : Données réelles de Lighthouse/axe-core
- **Tests de performance** : Analyse < 5s pour 100 findings

### 7.2 Couverture cible

**Objectif :** > 80% couverture sur `src/analysis/`

### 7.3 Scénarios à tester

| Module | Scénarios |
|--------|-----------|
| PerformanceAnalyzer | LCP bon/moyen/mauvais, recommandations |
| AccessibilityAnalyzer | Violations WCAG, scores, recommandations |
| SEOAnalyzer | Meta tags manquants, structure headings |
| UXAnalyzer | Heuristiques Nielsen, recommandations |
| ContentAnalyzer | Qualité contenu, lisibilité |
| SeverityMatrix | Calcul sévérité, cas limites |
| FindingPrioritizer | Tri, groupement, résumé |

## 8. Critères d'acceptation

### 8.1 Critères fonctionnels

| # | Critère | Validation |
|---|---------|------------|
| C9.1 | PerformanceAnalyzer analyse LCP, FID, CLS, TTFB | Test unitaire |
| C9.2 | AccessibilityAnalyzer analyse violations axe-core | Test unitaire |
| C9.3 | SEOAnalyzer analyse meta, structure, liens | Test unitaire |
| C9.4 | UXAnalyzer analyse heuristiques Nielsen | Test unitaire |
| C9.5 | ContentAnalyzer analyse qualité contenu | Test unitaire |
| C9.6 | SeverityMatrix calcule sévérité correctement | Test unitaire |
| C9.7 | FindingPrioritizer trie par priorité | Test unitaire |
| C9.8 | Recommandations générées pour chaque finding | Test d'intégration |

### 8.2 Critères techniques

| # | Critère | Validation |
|---|---------|------------|
| C9.9 | Tests unitaires > 80% couverture | `npm run test:coverage` |
| C9.10 | Tests d'intégration passent | `npm test tests/analysis/` |
| C9.11 | Compilation TypeScript OK | `npm run build` |
| C9.12 | Linting OK | `npm run lint` |
| C9.13 | Documentation complète | `docs/ANALYSIS.md` |

### 8.3 Critères qualité

| # | Critère | Validation |
|---|---------|------------|
| C9.14 | Performance analyse < 5s | Test performance |
| C9.15 | Code lisible (JSDoc) | Revue code |
| C9.16 | Gestion erreurs robuste | Tests erreurs |
| C9.17 | Recommandations actionables | Revue recommandations |

## 9. Livrables attendus

### 9.1 Code

| Fichier | Description | Lignes estimées |
|---------|-------------|-----------------|
| `src/analysis/types.ts` | Types Analysis | 150 |
| `src/analysis/performance.ts` | PerformanceAnalyzer | 200 |
| `src/analysis/accessibility.ts` | AccessibilityAnalyzer | 200 |
| `src/analysis/seo.ts` | SEOAnalyzer | 250 |
| `src/analysis/ux.ts` | UXAnalyzer | 200 |
| `src/analysis/content.ts` | ContentAnalyzer | 200 |
| `src/analysis/severity.ts` | SeverityMatrix | 150 |
| `src/analysis/prioritizer.ts` | FindingPrioritizer | 150 |

### 9.2 Tests

| Fichier | Description | Lignes estimées |
|---------|-------------|-----------------|
| `tests/analysis/performance.test.ts` | Tests PerformanceAnalyzer | 150 |
| `tests/analysis/accessibility.test.ts` | Tests AccessibilityAnalyzer | 150 |
| `tests/analysis/seo.test.ts` | Tests SEOAnalyzer | 150 |
| `tests/analysis/ux.test.ts` | Tests UXAnalyzer | 150 |
| `tests/analysis/content.test.ts` | Tests ContentAnalyzer | 150 |
| `tests/analysis/severity.test.ts` | Tests SeverityMatrix | 100 |
| `tests/analysis/prioritizer.test.ts` | Tests FindingPrioritizer | 150 |

### 9.3 Documentation

| Fichier | Description | Lignes estimées |
|---------|-------------|-----------------|
| `docs/ANALYSIS.md` | Documentation Analysis | 400 |

**Total estimé :** ~3 000 lignes

## 10. Procédure de fin de sprint

### 10.1 Vérifications finales

```bash
# 1. Tests unitaires
npm test tests/analysis/
# ✅ Tous les tests passent

# 2. Couverture
npm run test:coverage -- tests/analysis/
# ✅ > 80% couverture

# 3. Compilation
npm run build
# ✅ Aucune erreur

# 4. Linting
npm run lint
# ✅ Aucune erreur

# 5. Test d'intégration complet
node -e "
const { AnalysisPipeline } = require('./dist/analysis/pipeline');
const { Inspector } = require('./dist/browser/inspection/inspector');

(async () => {
  const inspector = new Inspector();
  const inspection = await inspector.inspect({
    level: 'L3',
    url: 'https://example.com'
  });
  
  const pipeline = new AnalysisPipeline();
  const report = await pipeline.analyze(inspection);
  
  console.log('Findings:', report.findings.length);
  console.log('Priority findings:', report.priorityFindings.length);
  console.log('Summary:', report.summary);
})();
"
# ✅ Analyse complète fonctionne

# 6. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ Commits atomiques
```

### 10.2 Transition vers Sprint 10

**Une fois Sprint 9 terminé :**
- ✅ Analyse 5 dimensions fonctionnelle
- ✅ Matrice de sévérité implémentée
- ✅ Priorisation automatique opérationnelle
- ✅ Recommandations générées

**Sprint 10 — Stockage + Indexation (Semaine 19-20) :**
- 🎯 Stocker les rapports d'analyse
- 🎯 Indexer pour recherche
- 🎯 Préparer la génération de rapports

## 11. Prompt de lancement pour agent

```markdown
## Mission

Implémenter le Sprint 9 — Analyse 5 Dimensions (Semaine 17-18) du projet EKTS.

## Documents à lire en priorité

1. `Docs/roadmap/sprints/SPRINT-09.md` — Dossier complet Sprint 9
2. `Docs/roadmap/sprints/SPRINT-09-01.md` — Sprint 9-1 (Performance + Accessibilité)
3. `Docs/roadmap/sprints/SPRINT-09-02.md` — Sprint 9-2 (SEO + UX + Contenu)
4. `Docs/roadmap/sprints/SPRINT-09-03.md` — Sprint 9-3 (Sévérité + Priorisation)
5. `Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture (§4.2.3)
6. `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack (ADR-012, ADR-013)

## Audit de l'état actuel

Avant toute modification, faire un audit :

```bash
# 1. Vérifier Sprint 8 terminé
ls -la src/browser/inspection/
# ✅ level-1.ts, level-2.ts, level-3.ts, inspector.ts

# 2. Tests Sprint 8
npm test tests/browser/inspection/
# ✅ Tests passent

# 3. Vérifier Lighthouse + axe-core
npm list lighthouse @axe-core/playwright
# ✅ Installés

# 4. Compilation
npm run build
# ✅ Aucune erreur
```

## Vérification des prérequis

Avant de commencer, vérifier :

- ✅ Sprint 8 terminé avec succès
- ✅ Inspection L3 fonctionnelle
- ✅ Lighthouse intégré
- ✅ axe-core intégré
- ✅ Données brutes collectées

## Périmètre autorisé

**Vous pouvez :**
- ✅ Créer `src/analysis/` (tous les fichiers)
- ✅ Créer `tests/analysis/` (tous les fichiers)
- ✅ Créer `docs/ANALYSIS.md`

**Vous ne pouvez pas :**
- ❌ Modifier `src/browser/` (sauf si bug critique)
- ❌ Modifier `src/business/` (sauf si bug critique)
- ❌ Installer de nouvelles dépendances (sauf approbation)

## Contraintes techniques

- ✅ TypeScript strict mode
- ✅ Couverture tests > 80%
- ✅ JSDoc pour toutes les fonctions publiques
- ✅ Performance analyse < 5s (100 findings)
- ✅ Matrice sévérité : 0-4 × 1-5 × 1-3
- ✅ Recommandations actionables

## Tests et validation

**Tous les tests doivent :**
- ✅ Passer sans erreur (`npm test`)
- ✅ Couverture > 80% (`npm run test:coverage`)
- ✅ Compiler sans erreur (`npm run build`)
- ✅ Linter sans erreur (`npm run lint`)

## Procédure de compte rendu

**Toutes les 2 heures, fournir un rapport :**

```markdown
## Rapport d'avancement — [DATE] [HEURE]

### Tâches terminées
- [x] Tâche 9.1 : PerformanceAnalyzer implémenté
- [x] Tâche 9.2 : AccessibilityAnalyzer implémenté

### Tâches en cours
- [ ] Tâche 9.3 : SEOAnalyzer (50% terminé)

### Tâches à venir
- [ ] Tâche 9.4 : UXAnalyzer
- [ ] Tâche 9.5 : ContentAnalyzer

### Problèmes rencontrés
- Aucun pour l'instant

### Prochain rapport
[DATE] [HEURE + 2h]
```

## Critères de fin

**Le Sprint 9 est terminé quand :**
- ✅ Les 17 critères d'acceptation sont validés (C9.1 à C9.17)
- ✅ Tous les tests passent
- ✅ Couverture > 80%
- ✅ Performance analyse < 5s
- ✅ Recommandations actionables
- ✅ Documentation complète
- ✅ Commits pushés sur `feat/sprint-9-3`

## Livrables

**À la fin du Sprint 9, fournir :**
- ✅ `src/analysis/types.ts` — Types Analysis
- ✅ `src/analysis/performance.ts` — PerformanceAnalyzer
- ✅ `src/analysis/accessibility.ts` — AccessibilityAnalyzer
- ✅ `src/analysis/seo.ts` — SEOAnalyzer
- ✅ `src/analysis/ux.ts` — UXAnalyzer
- ✅ `src/analysis/content.ts` — ContentAnalyzer
- ✅ `src/analysis/severity.ts` — SeverityMatrix
- ✅ `src/analysis/prioritizer.ts` — FindingPrioritizer
- ✅ `tests/analysis/*.test.ts` — Tests unitaires (7 fichiers)
- ✅ `docs/ANALYSIS.md` — Documentation Analysis

## Questions

**En cas de doute ou de blocage :**
- ✅ Consulter les documents de référence (Docs/)
- ✅ Vérifier les ADR (ADR-012, ADR-013)
- ✅ Demander à l'utilisateur (ne pas deviner)

## Durée estimée

**Durée totale :** 10 jours ouvrables (2 semaines)

**Répartition :**
- Sprint 9-1 : 4 jours (Performance + Accessibilité)
- Sprint 9-2 : 3 jours (SEO + UX + Contenu)
- Sprint 9-3 : 3 jours (Sévérité + Priorisation + Tests + Docs)
```

## 12. Résumé

### 12.1 Sprint 9 — Analyse 5 Dimensions (2 semaines)

**Objectif :** Transformer les données brutes du Sprint 8 en analyse structurée avec priorisation automatique.

**3 sous-sprints :**
- **Sprint 9-1** (4 jours) : Analyse performance + accessibilité
- **Sprint 9-2** (3 jours) : Analyse SEO + UX + contenu
- **Sprint 9-3** (3 jours) : Matrice sévérité + priorisation + tests + docs

**Livrables principaux :**
- ✅ 5 analyseurs (performance, accessibilité, SEO, UX, contenu)
- ✅ Matrice de sévérité (0-4 × 1-5 × 1-3)
- ✅ Priorisation automatique des findings
- ✅ Recommandations actionables
- ✅ Tests unitaires > 80% couverture
- ✅ Documentation complète

**17 critères de validation :**
- ✅ C9.1 à C9.8 (fonctionnels)
- ✅ C9.9 à C9.13 (techniques)
- ✅ C9.14 à C9.17 (qualité)

**Dépendances :**
- ✅ Sprint 8 (4 Niveaux d'Inspection) — Terminé
- 🎯 Sprint 10 (Stockage + Indexation) — Utilisera les rapports d'analyse

### 12.2 Transition

**Après Sprint 9 :**
- ✅ Analyse 5 dimensions fonctionnelle
- ✅ Matrice de sévérité implémentée
- ✅ Priorisation automatique opérationnelle
- ✅ Prêt pour Sprint 10 (Stockage + Indexation)

**Sprint 10 — Stockage + Indexation (Semaine 19-20) :**
- 🎯 Stocker les rapports d'analyse
- 🎯 Indexer pour recherche
- 🎯 Préparer la génération de rapports

---

**Fin du dossier Sprint 9 — Analyse 5 Dimensions**
