# Phase 09 — Gouvernance des Composants

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Définir les règles de gouvernance pour maintenir la bibliothèque créative EKTS : critères d'ajout/suppression, processus de validation, tests visuels/accessibilité/performance, et conservation des références exploitables par un agent.

Cette gouvernance garantit la qualité, la cohérence et la pérennité des ressources créatives.

---

## 2. Résumé

**Gouvernance en 5 piliers** :
1. **Critères d'ajout** — Qualité, licence, maintenance, compatibilité
2. **Processus de validation** — Review, tests, documentation
3. **Tests qualité** — Visuels, accessibilité, performance
4. **Maintenance** — Mises à jour, dépréciation, suppression
5. **Référence agent** — Documentation exploitable par agents IA

---

## 3. Méthode

### 3.1 Approche

1. **Analyse des bonnes pratiques** : Design systems industrie (Material, Ant, shadcn)
2. **Étude des documents de référence** : Source 01 (Design System), Source 02 (UX), Source 03 (3D & Motion)
3. **Synthèse** : Framework de gouvernance en 5 piliers
4. **Intégration EKTS** : Adaptation au contexte EKTS (MCP, RAG, agents)

### 3.2 Principes

- **Qualité over quantité** : Mieux vaut 50 composants excellents que 200 moyens
- **Documentation obligatoire** : Pas de composant sans documentation complète
- **Tests systématiques** : Visuels, accessibilité, performance
- **Maintenabilité** : Composants faciles à mettre à jour et déprécier
- **Exploitable par agent** : Documentation structurée pour agents IA

---

## 4. Concepts clés

### 4.1 Définitions

**Gouvernance** : Ensemble des règles et processus garantissant la qualité et la cohérence d'une bibliothèque de composants.

**Composant** : Élément réutilisable (UI, motion, 3D, pattern).

**Pattern** : Solution récurrente à un problème de conception (combinaison de composants).

**Design debt** : Accumulation de composants obsolètes, incohérents ou mal documentés.

**Agent-exploitable** : Documentation structurée permettant à un agent IA de comprendre et utiliser un composant sans ambiguïté.

### 4.2 Principes de gouvernance

- **Single source of truth** : Un composant = un emplacement = une documentation
- **Composition over configuration** : Privilégier la composition de primitives
- **Explicit over implicit** : Comportements explicites, pas de magie
- **Progressive enhancement** : Fonctionne sans JS, amélioré avec
- **Accessibility by default** : Accessible dès la conception

---

## 5. Résultats — Pilier 1 : Critères d'ajout

### 5.1 Critères obligatoires

Tout composant/pattern doit satisfaire **TOUS** les critères suivants pour être ajouté :

#### 5.1.1 Qualité technique

- [ ] **Code propre** : Lisible, maintenable, pas de duplication
- [ ] **Type-safe** : TypeScript (ou JSDoc pour JS pur)
- [ ] **Testé** : Tests unitaires + tests visuels
- [ ] **Documenté** : JSDoc/TSDoc complet
- [ ] **Pas de dépendances cachées** : Toutes les dépendances explicitement listées

#### 5.1.2 Licence et légalité

- [ ] **Licence compatible** : MIT, Apache-2.0, ISC, CC0, ou propriétaire gratuit
- [ ] **Pas de copyleft contaminant** : GPL/LGPL uniquement si dynamique (CDN)
- [ ] **Attribution respectée** : Notices de copyright préservées
- [ ] **Usage commercial autorisé** : Pas de restriction commerciale (sauf justification)

#### 5.1.3 Maintenance

- [ ] **Maintenance active** : Commits < 6 mois, releases régulières
- [ ] **Communauté active** : Issues répondues < 30 jours
- [ ] **Pas de vulnerabilities connues** : npm audit / Snyk clean
- [ ] **Changelog à jour** : Historique des changements documenté

#### 5.1.4 Compatibilité

- [ ] **Navigateurs modernes** : Chrome, Firefox, Safari, Edge (2 dernières versions)
- [ ] **Mobile support** : Responsive, touch events
- [ ] **Accessibilité WCAG 2.2 AA** : Navigation clavier, focus, contraste
- [ ] **Performance** : Pas de dégradation mesurable (Lighthouse > 90)

### 5.2 Critères recommandés

Ces critères ne sont pas obligatoires mais fortement recommandés :

- [ ] **Bundle size < 10KB** (gzipped) pour composants UI
- [ ] **Tree-shakable** : Export ESM, pas d'effets de bord
- [ ] **Framework-agnostic** : Si possible, usable sans framework
- [ ] **Theming support** : CSS variables, design tokens
- [ ] **Dark mode** : Support natif ou via tokens
- [ ] **RTL support** : Support right-to-left si pertinent
- [ ] **i18n ready** : Textes externalisables

### 5.3 Critères spécifiques par famille

#### Famille 1 : UI Components

- [ ] **Variants** : Minimum 3 variantes (primary, secondary, ghost)
- [ ] **States** : Default, hover, focus, active, disabled
- [ ] **Sizes** : Minimum 2 tailles (sm, md)
- [ ] **Composition** : Utilisable avec autres composants
- [ ] **Storybook** : Stories pour chaque variant/state

#### Famille 2 : Motion

- [ ] **Reduced motion** : Respecte `prefers-reduced-motion`
- [ ] **Interruptible** : Animation peut être interrompue
- [ ] **Performance** : 60 FPS sur mobile mid-range
- [ ] **GPU-accelerated** : Utilise transform/opacity, pas layout
- [ ] **Fallback** : Alternative statique si JS désactivé

#### Famille 3 : 3D & WebGL

- [ ] **Fallback** : Alternative non-WebGL si non supporté
- [ ] **Mobile optimization** : Réduction qualité sur mobile
- [ ] **Memory management** : Dispose des ressources (textures, geometries)
- [ ] **Loading state** : Indicateur de chargement
- [ ] **Progressive loading** : Assets chargés progressivement

#### Famille 4 : Data Viz

- [ ] **Responsive** : S'adapte au conteneur
- [ ] **Accessible** : Alternative textuelle ou tableau
- [ ] **Performance** : 1000+ data points sans lag
- [ ] **Theming** : Couleurs via tokens
- [ ] **Export** : PNG/SVG export si pertinent

#### Famille 5 : Procédural

- [ ] **Seed support** : Reproductible avec seed
- [ ] **Parameters** : Paramètres exposés et documentés
- [ ] **Performance** : < 16ms par frame (60 FPS)
- [ ] **Deterministic** : Même seed = même résultat

#### Famille 6 : Math & Physique

- [ ] **Precision** : Précision documentée (float, big number)
- [ ] **Performance** : Calculs < 1ms pour usage temps réel
- [ ] **Units** : Support des unités si pertinent
- [ ] **Validation** : Vérification des inputs

#### Famille 7 : Outils & Tests

- [ ] **CI/CD ready** : Intégrable dans pipeline
- [ ] **Reporting** : Rapports structurés (JSON, HTML)
- [ ] **Configurable** : Seuils, règles customisables
- [ ] **Fast** : < 30s pour suite de tests complète

---

## 6. Résultats — Pilier 2 : Processus de validation

### 6.1 Workflow d'ajout

```
1. PROPOSITION
   ↓
2. REVIEW (2 reviewers minimum)
   ↓
3. IMPLÉMENTATION
   ↓
4. TESTS (unit, visual, a11y, perf)
   ↓
5. DOCUMENTATION (JSDoc, README, Storybook)
   ↓
6. APPROVAL (maintainer)
   ↓
7. MERGE + RELEASE
   ↓
8. INDEXATION EKTS (RAG)
```

### 6.2 Reviewers

**Reviewers obligatoires** :
- 1 maintainer EKTS
- 1 expert domaine (UI, motion, 3D, etc.)

**Critères de review** :
- Code qualité (lisibilité, maintainabilité)
- Tests couverture (> 80%)
- Documentation complète
- Performance (pas de régression)
- Accessibilité (WCAG 2.2 AA)

### 6.3 Checklist de validation

Avant merge, le composant doit passer **TOUS** les checks :

```markdown
## Code Quality
- [ ] ESLint clean
- [ ] TypeScript strict
- [ ] Prettier formatted
- [ ] No console.log

## Tests
- [ ] Unit tests (> 80% coverage)
- [ ] Visual regression tests
- [ ] Accessibility tests (axe-core)
- [ ] Performance tests (Lighthouse > 90)

## Documentation
- [ ] JSDoc/TSDoc complet
- [ ] README avec exemples
- [ ] Storybook stories
- [ ] CodeSandbox/StackBlitz demo

## Accessibility
- [ ] Keyboard navigable
- [ ] Focus visible
- [ ] ARIA labels (si pertinent)
- [ ] Contrast ratio > 4.5:1
- [ ] Screen reader tested

## Performance
- [ ] Bundle size < 10KB (gzipped)
- [ ] No layout shift (CLS = 0)
- [ ] 60 FPS animations
- [ ] Mobile tested

## Browser Support
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome
```

---

## 7. Résultats — Pilier 3 : Tests qualité

### 7.1 Tests visuels

**Outils recommandés** :
- **Playwright** : Screenshots, comparaison pixel
- **Chromatic** : Visual regression pour Storybook
- **Loki** : Alternative open-source à Chromatic

**Process** :
1. **Baseline** : Screenshot de référence approuvé
2. **PR test** : Screenshot comparé à baseline
3. **Threshold** : Différence pixel < 0.1% acceptable
4. **Review** : Si > threshold, review manuel obligatoire

**Exemple Playwright** :
```javascript
test('button visual regression', async ({ page }) => {
  await page.goto('/storybook/button');
  await expect(page).toHaveScreenshot('button.png', {
    maxDiffPixelRatio: 0.001
  });
});
```

### 7.2 Tests accessibilité

**Outils recommandés** :
- **axe-core** : Tests automatisés WCAG
- **Lighthouse** : Audit complet
- **Playwright accessibility tree** : Inspection arbre accessibilité

**Tests obligatoires** :
```javascript
// axe-core
test('button accessibility', async () => {
  const results = await axe.run('#button');
  expect(results.violations).toHaveLength(0);
});

// Lighthouse
test('accessibility score', async () => {
  const lhr = await lighthouse(url, { onlyCategories: ['accessibility'] });
  expect(lhr.categories.accessibility.score).toBeGreaterThanOrEqual(0.9);
});
```

**Checklist WCAG 2.2 AA** :
- [ ] 1.1.1 Text alternatives (images, icônes)
- [ ] 1.3.1 Info and relationships (structure sémantique)
- [ ] 1.4.3 Contrast minimum (4.5:1 texte, 3:1 large text)
- [ ] 1.4.4 Resize text (zoom 200%)
- [ ] 1.4.11 Non-text contrast (3:1 UI components)
- [ ] 2.1.1 Keyboard (navigation clavier)
- [ ] 2.4.7 Focus visible
- [ ] 4.1.2 Name, role, value (ARIA)

### 7.3 Tests performance

**Outils recommandés** :
- **Lighthouse** : Audit performance
- **WebPageTest** : Testing real-world conditions
- **Chrome DevTools Performance** : Profiling
- **Stats.js** : FPS monitoring WebGL

**Métriques cibles** :
- **LCP** (Largest Contentful Paint) < 2.5s
- **INP** (Interaction to Next Paint) < 200ms
- **CLS** (Cumulative Layout Shift) < 0.1
- **TTFB** (Time to First Byte) < 800ms
- **Bundle size** < 100KB (gzipped) pour page initiale

**Tests WebGL** :
```javascript
// FPS monitoring
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // render scene
  stats.end();
  requestAnimationFrame(animate);
}

// Cible : 60 FPS constant
```

### 7.4 Tests spécifiques motion/3D

**Motion** :
- [ ] **Reduced motion** : Test avec `prefers-reduced-motion: reduce`
- [ ] **Interruptible** : Animation interrompue ne casse pas
- [ ] **60 FPS** : Pas de drop sur mobile mid-range
- [ ] **No layout shift** : Animations sur transform/opacity uniquement

**3D** :
- [ ] **Fallback** : Test sans WebGL (alternative affichée)
- [ ] **Memory leak** : Test avec 10+ navigation back/forth
- [ ] **Mobile optimization** : Test sur mobile (réduction qualité)
- [ ] **Loading state** : Test avec connexion lente (3G)

---

## 8. Résultats — Pilier 4 : Maintenance

### 8.1 Mises à jour

**Fréquence** :
- **Dépendances** : Mise à jour tous les 3 mois (npm audit)
- **Security patches** : Application immédiate (CVE critiques)
- **Major versions** : Migration planifiée (breaking changes)
- **Documentation** : Mise à jour à chaque release

**Process** :
1. **Dependabot/Renovate** : PR automatiques pour mises à jour
2. **Review** : Vérifier changelog, breaking changes
3. **Tests** : Lancer suite de tests complète
4. **Merge** : Si tests passent + pas de breaking changes
5. **Release** : Bump version, changelog, tag

### 8.2 Dépréciation

**Critères de dépréciation** :
- Composant non utilisé depuis 6+ mois
- Maintenance abandonnée (pas de commits > 12 mois)
- Vulnerabilités non corrigées
- Alternative supérieure disponible

**Process** :
1. **Warning** : Ajouter `@deprecated` JSDoc + console warning
2. **Documentation** : Documenter alternative recommandée
3. **Grace period** : 3 mois avant suppression
4. **Migration guide** : Guide de migration si breaking change
5. **Removal** : Supprimer après grace period

**Exemple** :
```javascript
/**
 * @deprecated Since v2.0.0. Use `<NewButton />` instead.
 * Will be removed in v3.0.0.
 * @see {@link https://ekts.dev/migration/button Migration guide}
 */
export function OldButton() {
  console.warn('OldButton is deprecated. Use NewButton instead.');
  return <NewButton {...props} />;
}
```

### 8.3 Suppression

**Critères de suppression** :
- Composant déprécié depuis 3+ mois
- Alternative disponible et documentée
- Pas d'usage dans codebase EKTS

**Process** :
1. **Check usage** : Vérifier pas d'usage dans projets EKTS
2. **Migration** : Migrer derniers usages vers alternative
3. **Remove** : Supprimer composant + tests + docs
4. **Changelog** : Documenter dans CHANGELOG.md
5. **Release** : Major version bump (breaking change)

### 8.4 Design debt prevention

**Règles** :
- **Pas de duplication** : Vérifier si composant similaire existe avant création
- **Composition** : Privilégier composition de primitives plutôt que nouveau composant
- **Review régulier** : Audit trimestriel des composants
- **Cleanup** : Supprimer composants non utilisés

**Outils** :
- **npm-check** : Dépendances non utilisées
- **depcheck** : Dépendances inutiles
- **Madge** : Visualisation dépendances

---

## 9. Résultats — Pilier 5 : Référence agent

### 9.1 Documentation structurée

Chaque composant doit avoir une documentation **agent-exploitable** :

```markdown
# NomComposant

## Description
Courte description (1-2 phrases) de ce que fait le composant.

## Usage
```jsx
import { NomComposant } from '@ekts/composants';

<NomComposant prop1="value" prop2={123} />
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description prop1 |
| prop2 | number | 0 | Description prop2 |

## Variants
- **primary** : Usage principal
- **secondary** : Usage secondaire
- **ghost** : Usage discret

## States
- **default** : État normal
- **hover** : Survol souris
- **focus** : Focus clavier
- **disabled** : Désactivé

## Accessibility
- Navigation clavier : Tab/Shift+Tab
- ARIA : role="button", aria-label="..."
- Keyboard : Enter/Space pour activer

## Performance
- Bundle size : 2.3KB (gzipped)
- Render time : < 1ms
- 60 FPS : Oui

## Dependencies
- React 18+
- Tailwind CSS 3+
- Motion (optionnel pour animations)

## Examples
- [Storybook](https://storybook.ekts.dev/?path=/docs/nomcomposant)
- [CodeSandbox](https://codesandbox.io/s/ekts-nomcomposant)
```

### 9.2 Format machine-readable

Pour exploitation par agents IA, fournir également :

```json
{
  "name": "NomComposant",
  "description": "Courte description",
  "package": "@ekts/composants",
  "import": "import { NomComposant } from '@ekts/composants'",
  "props": [
    {
      "name": "prop1",
      "type": "string",
      "required": true,
      "description": "Description prop1"
    },
    {
      "name": "prop2",
      "type": "number",
      "default": 0,
      "description": "Description prop2"
    }
  ],
  "variants": ["primary", "secondary", "ghost"],
  "states": ["default", "hover", "focus", "disabled"],
  "accessibility": {
    "keyboard": ["Tab", "Enter", "Space"],
    "aria": {
      "role": "button",
      "aria-label": "Description action"
    }
  },
  "performance": {
    "bundleSize": 2300,
    "renderTime": 1,
    "fps": 60
  },
  "dependencies": {
    "react": ">=18.0.0",
    "tailwindcss": ">=3.0.0"
  },
  "examples": [
    "https://storybook.ekts.dev/?path=/docs/nomcomposant",
    "https://codesandbox.io/s/ekts-nomcomposant"
  ]
}
```

### 9.3 Indexation EKTS

**Stockage Phase 06** :
```sql
INSERT INTO resources (
  id, type, family, name, description, package, import,
  props, variants, states, accessibility, performance,
  dependencies, examples, license, maintenance, created, updated
) VALUES (
  'uuid',
  'component',
  'ui',
  'NomComposant',
  'Courte description',
  '@ekts/composants',
  'import { NomComposant } from "@ekts/composants"',
  '[{"name":"prop1","type":"string","required":true}]',
  '["primary","secondary","ghost"]',
  '["default","hover","focus","disabled"]',
  '{"keyboard":["Tab","Enter"],"aria":{"role":"button"}}',
  '{"bundleSize":2300,"renderTime":1,"fps":60}',
  '{"react":">=18.0.0","tailwindcss":">=3.0.0"}',
  '["https://storybook.ekts.dev/..."]',
  'MIT',
  'active',
  NOW(),
  NOW()
);
```

**RAG Phase 07** :
```javascript
// Chunking pour recherche sémantique
const chunks = [
  {
    id: 'nomcomposant-description',
    type: 'component',
    family: 'ui',
    content: 'NomComposant : Courte description du composant et son usage principal.',
    embedding: await embed('NomComposant : Courte description...')
  },
  {
    id: 'nomcomposant-props',
    type: 'component',
    family: 'ui',
    content: 'Props NomComposant : prop1 (string, required), prop2 (number, default 0)',
    embedding: await embed('Props NomComposant : prop1...')
  },
  // ... autres chunks (variants, states, accessibility, etc.)
];
```

### 9.4 Outil MCP

**Exposer via MCP** :
```typescript
// MCP tool
{
  name: 'search_creative_resource',
  description: 'Rechercher une ressource créative (composant, pattern, outil)',
  parameters: {
    query: string,
    family?: 'ui' | 'motion' | '3d' | 'dataviz' | 'procedural' | 'math' | 'tools',
    type?: 'component' | 'pattern' | 'tool' | 'asset'
  },
  handler: async (params) => {
    // Recherche RAG (Phase 07)
    const results = await rag.search(params.query, {
      filter: {
        family: params.family,
        type: params.type
      },
      topK: 5
    });
    
    // Retourner résultats formatés
    return results.map(r => ({
      name: r.name,
      description: r.description,
      package: r.package,
      import: r.import,
      props: r.props,
      examples: r.examples
    }));
  }
}
```

**Usage agent** :
```
Agent: "Je cherche un composant bouton animé"
→ MCP: search_creative_resource("bouton animé", family="ui")
→ RAG: Recherche sémantique dans ressources indexées
→ Retour: [NomComposant, MagicButton, AnimatedButton, ...]
```

---

## 10. Limites

### 10.1 Limites identifiées

1. **Processus lourd** : Review + tests + documentation peut ralentir l'ajout
2. **Subjectivité** : Certains critères (qualité code) sont subjectifs
3. **Maintenance coûteuse** : Tests visuels/performance nécessitent infrastructure
4. **Évolution rapide** : Écosystème frontend évolue rapidement (nouvelles libs tous les 6 mois)
5. **Agent-exploitable** : Documentation structurée nécessite effort supplémentaire

### 10.2 Questions ouvertes

1. **Automatisation** : Comment automatiser davantage le processus de validation ?
2. **AI review** : Peut-on utiliser un agent IA pour reviewer le code ?
3. **Versioning** : Comment gérer le versioning des composants EKTS ?
4. **Monorepo vs packages** : Monorepo unique ou packages séparés ?
5. **Documentation** : Storybook vs MDX vs les deux ?

---

## 11. Recommandations

### 11.1 Priorités

1. **MVP** : Commencer avec 10-20 composants essentiels (boutons, inputs, cards)
2. **Tests** : Mettre en place Playwright + axe-core + Lighthouse en CI
3. **Documentation** : Storybook pour tous les composants
4. **MCP** : Exposer `search_creative_resource` dès Phase 10

### 11.2 Outils recommandés

**Développement** :
- **pnpm** : Gestionnaire de packages (workspace)
- **Turborepo** : Monorepo tooling
- **TypeScript** : Type-safety
- **ESLint + Prettier** : Code quality

**Tests** :
- **Vitest** : Tests unitaires
- **Playwright** : Tests E2E + visuels
- **axe-core** : Tests accessibilité
- **Lighthouse CI** : Audit performance

**Documentation** :
- **Storybook** : Documentation interactive
- **MDX** : Documentation markdown + JSX
- **TypeDoc** : Documentation API auto

**CI/CD** :
- **GitHub Actions** : Automation
- **Chromatic** : Visual regression (ou Loki)
- **Dependabot** : Mise à jour dépendances

### 11.3 Intégration EKTS

1. **Stockage** : Indexer dans `resources` table (Phase 06)
2. **RAG** : Chunker documentation pour recherche sémantique (Phase 07)
3. **MCP** : Exposer `search_creative_resource` comme outil MCP
4. **Gouvernance** : Revoir tous les 6 mois

---

## 12. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **5 piliers** | Couverture complète (ajout, validation, tests, maintenance, agent) | 3 piliers → pas assez complet |
| **Critères obligatoires** | Garantie qualité minimale | Critères optionnels → qualité variable |
| **2 reviewers** | Double validation, partage connaissances | 1 reviewer → risque d'erreur |
| **Tests obligatoires** | Qualité garantie | Tests optionnels → régression |
| **Documentation agent-exploitable** | Support agents IA | Documentation classique → pas exploitable par agents |
| **Storybook** | Standard industrie, interactif | MDX uniquement → pas interactif |

---

## 13. Questions

1. **Automatisation** : Quels tests peuvent être entièrement automatisés ?
2. **AI review** : Comment intégrer un agent IA dans le processus de review ?
3. **Versioning** : Quel schéma de versioning (semver, calver) ?
4. **Monorepo** : Monorepo (Turborepo) ou packages séparés ?
5. **Migration** : Comment gérer les migrations entre major versions ?

---

## 14. Sources

### 14.1 Documents de référence

1. **Source 01** — Design System (sections 33-35 : Governance, Naming, Debt)
2. **Source 02** — UX & Quality (sections 49-51 : Heuristics, Testing)
3. **Source 03** — 3D & Motion (sections 96-98 : Checklists)

### 14.2 Bonnes pratiques industrie

4. **shadcn/ui** : Philosophie copy-paste, composition
5. **Material UI** : Governance, versioning
6. **Ant Design** : Documentation, tests
7. **Radix Primitives** : Accessibilité, headless

### 14.3 Outils

8. **Playwright** : Tests E2E, visuels
9. **axe-core** : Tests accessibilité
10. **Storybook** : Documentation interactive
11. **Chromatic** : Visual regression

---

## 15. Relations

### 15.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 04** (Automatisation navigateur) | Tests E2E avec Playwright |
| **Phase 05** (Scraping responsable) | Assets CC0 uniquement |
| **Phase 06** (Stockage) | Stockage composants |
| **Phase 07** (RAG) | Recherche sémantique composants |
| **Phase 08** (Analyse expérience) | Tests visuels, accessibilité |

### 15.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 10** (Capitalisation) | Patterns récurrents à capitaliser |
| **Phase 12** (Comparatif IA) | Outils pour benchmarking |

---

## 16. Critères d'évaluation

### 16.1 Critères de complétude

- [x] 5 piliers définis
- [x] Critères d'ajout obligatoires et recommandés
- [x] Processus de validation (workflow, reviewers, checklist)
- [x] Tests qualité (visuels, accessibilité, performance)
- [x] Maintenance (mises à jour, dépréciation, suppression)
- [x] Référence agent (documentation structurée, JSON, MCP)

### 16.2 Critères de qualité

- [x] Gouvernance complète et actionnable
- [x] Checklist détaillées
- [x] Exemples de code
- [x] Intégration EKTS (stockage, RAG, MCP)

### 16.3 Critères d'actionnabilité

- [x] Processus clair et reproductible
- [x] Outils recommandés
- [x] Templates et exemples
- [x] Intégration MCP pour agents

---

**Document rédigé le 21 octobre 2026 — Phase 09 du projet EKTS**
