# Phase 10 — Workflow de Capitalisation

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé (référence historique — voir note)  
**Auteur :** Agent EKTS  
**Version :** 1.0

> **⚠️ Note (25 octobre 2026) — MVP-3 redéfini :**
> Ce document décrit le workflow de capitalisation en 8 étapes tel que conçu dans la Phase 10.
> Il reste une **référence utile** pour le Sprint 15 (Capitalisation Connaissances, BestPractice) du MVP-3 actif.
> Le périmètre complet du MVP-3 est défini dans [`docs/ROADMAP.md`](../ROADMAP.md) (ADR-031).

---

## 1. Objectif

Définir le workflow complet de clôture et capitalisation des projets EKTS : collecte des artefacts, nettoyage des secrets, documentation des choix, vérification tests/licences, validation, publication, indexation, et dépréciation des références anciennes.

Ce workflow garantit que chaque projet terminé contribue à la mémoire technique EKTS de manière structurée, sécurisée et réutilisable.

---

## 2. Résumé

**Workflow en 8 étapes** :
1. **Collecter les artefacts** — Code, docs, designs, assets, tests
2. **Nettoyer les secrets** — Gitleaks + TruffleHog, git-filter-repo
3. **Documenter les choix** — ADR (Architecture Decision Records), limites, contexte
4. **Vérifier tests et licences** — Couverture, conformité licences
5. **Faire valider** — Review pair, validation mainteneur
6. **Publier dans la bibliothèque** — Phase 09 (catégorisation, documentation)
7. **Indexer** — Phase 06 (stockage) + Phase 07 (RAG)
8. **Déprécier les anciennes références** — Rotation, archivage, suppression

---

## 3. Méthode

### 3.1 Approche

1. **Analyse des bonnes pratiques** : Post-mortem (NN/g, Plane, Rootly), gestion dette technique (IBM, arXiv 2505.13009)
2. **Étude des outils 2026** : Gitleaks, TruffleHog, git-filter-repo, Docusaurus, Document360
3. **Intégration EKTS** : Adaptation au contexte EKTS (Phases 06-09, MCP, agents IA)
4. **Comparaison approches** : Fichiers versionnés vs base de données structurée

### 3.2 Principes

- **Blameless** : Pas de culpabilisation, focus sur l'apprentissage
- **Exhaustivité** : Capturer tous les artefacts pertinents
- **Sécurité** : Nettoyage systématique des secrets
- **Réutilisabilité** : Documentation actionnable pour futurs projets
- **Traçabilité** : Lien entre projet, artefacts, et capitalisation

---

## 4. Concepts clés

### 4.1 Définitions

**Capitalisation** : Processus de transformation des livrables d'un projet en connaissances réutilisables pour l'organisation.

**Post-mortem** : Analyse rétrospective d'un projet (succès ou échec) pour identifier les leçons apprises.

**Dette technique** : Conséquences des raccourcis techniques pris durant le développement (code, architecture, documentation, tests).

**ADR (Architecture Decision Record)** : Document capturant une décision architecturale importante, son contexte, et ses conséquences.

**Secret** : Toute information sensible (clé API, mot de passe, token, certificat) qui ne doit pas être exposée.

### 4.2 Catégories d'artefacts

| Catégorie | Exemples | Conservation |
|-----------|----------|--------------|
| **Code source** | Repository Git, branches, tags | Oui (après nettoyage secrets) |
| **Documentation** | README, ADR, guides, tutoriels | Oui |
| **Design** | Figma, maquettes, design tokens | Oui |
| **Assets** | Images, vidéos, fichiers 3D | Oui (si licence compatible) |
| **Tests** | Tests unitaires, E2E, visuels | Oui |
| **Configuration** | CI/CD, environnement, dépendances | Partiellement (anonymisé) |
| **Données** | Logs, métriques, feedback utilisateur | Anonymisé ou exclu |
| **Secrets** | Clés API, mots de passe, tokens | **EXCLUS** (nettoyage obligatoire) |

---

## 5. Résultats — Workflow détaillé

### 5.1 Étape 1 : Collecter les artefacts

**Objectif** : Rassembler tous les artefacts produits durant le projet.

**Checklist** :
```markdown
## Code source
- [ ] Repository Git complet (toutes branches)
- [ ] Tags de version (v1.0.0, v1.1.0, etc.)
- [ ] README.md à jour
- [ ] CHANGELOG.md documenté
- [ ] LICENSE file

## Documentation
- [ ] Architecture Decision Records (ADR)
- [ ] Guides d'installation et de déploiement
- [ ] Documentation API (si applicable)
- [ ] Tutoriels et exemples
- [ ] Notes de conception (design docs)

## Design
- [ ] Figma/Sketch files (ou exports)
- [ ] Design tokens (JSON, CSS variables)
- [ ] Assets graphiques (images, icônes)
- [ ] Maquettes responsive (mobile, tablet, desktop)

## Tests
- [ ] Tests unitaires (couverture > 80%)
- [ ] Tests E2E (Playwright, Cypress)
- [ ] Tests visuels (Chromatic, Loki)
- [ ] Tests d'accessibilité (axe-core, Lighthouse)
- [ ] Tests de performance (Lighthouse CI)

## Configuration
- [ ] Fichiers CI/CD (GitHub Actions, GitLab CI)
- [ ] Configuration Docker (Dockerfile, docker-compose)
- [ ] Variables d'environnement (template .env.example)
- [ ] Scripts de déploiement

## Métriques
- [ ] Rapports de performance (Lighthouse scores)
- [ ] Métriques d'usage (analytics)
- [ ] Feedback utilisateur (surveys, interviews)
- [ ] Incidents et résolutions (post-mortems)
```

**Outils** :
- `git archive` : Export repository
- `gh release create` : Publication release GitHub
- `zip -r` : Compression artefacts

### 5.2 Étape 2 : Nettoyer les secrets

**Objectif** : Détecter et supprimer tous les secrets du code et de l'historique Git.

#### 5.2.1 Détection avec Gitleaks

**Installation** :
```bash
# macOS
brew install gitleaks

# Linux
curl -sSfL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_8.30.1_linux_x64.tar.gz | tar xz
sudo mv gitleaks /usr/local/bin/

# Windows
scoop install gitleaks
```

**Scan repository complet** :
```bash
# Scan de l'historique complet
gitleaks detect --source . --report-path gitleaks-report.json --verbose

# Scan directory (sans Git)
gitleaks dir ./config --report-path gitleaks-dir-report.json

# Scan contenu pipé
cat build.log | gitleaks stdin
```

**Configuration .gitleaks.toml** :
```toml
title = "EKTS Gitleaks Config"

# Règles personnalisées
[[rules]]
id = "ekts-api-key"
description = "EKTS API Key"
regex = '''ekt_[a-zA-Z0-9]{32}'''
tags = ["ekts", "api-key"]

# Allowlist pour faux positifs
[allowlist]
description = "Global allowlist"
paths = [
  '''testdata''',
  '''examples''',
  '''\.test\.'''
]
commits = [
  "initial-commit-hash"
]
```

#### 5.2.2 Vérification avec TruffleHog

**Installation** :
```bash
# macOS
brew install trufflehog

# Linux
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
```

**Scan avec vérification** :
```bash
# Scan Git local avec vérification (confirme si secrets sont encore actifs)
trufflehog git file://. --only-verified

# Scan repository GitHub distant
trufflehog github --repo=https://github.com/your-org/your-repo --only-verified

# Scan filesystem
trufflehog filesystem . --only-verified
```

**Avantage TruffleHog** : Vérifie si les secrets trouvés sont encore actifs via API providers (700+ types supportés).

#### 5.2.3 Suppression avec git-filter-repo

**Installation** :
```bash
pip install git-filter-repo
```

**Suppression secrets de l'historique** :
```bash
# Remplacer une chaîne spécifique dans tout l'historique
git filter-repo --replace-text <(echo 'SECRET_API_KEY==>REMOVED')

# Supprimer un fichier entier
git filter-repo --path config/secrets.json --invert-paths

# Supprimer tous les fichiers correspondant à un pattern
git filter-repo --path-glob '*.key' --path-glob '*.pem' --invert-paths
```

**Après nettoyage** :
```bash
# Force push (attention : réécrit l'historique)
git push --force --all
git push --force --tags

# Tous les contributeurs doivent re-clone
git clone <repo-url>
```

#### 5.2.4 Prévention future

**Pre-commit hook** :
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks
```

**GitHub Action CI** :
```yaml
# .github/workflows/gitleaks.yml
name: Gitleaks
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5.3 Étape 3 : Documenter les choix

**Objectif** : Capturer les décisions architecturales, le contexte, et les limites.

#### 5.3.1 Architecture Decision Records (ADR)

**Template ADR** :
```markdown
# ADR-001 : Choix de React Three Fiber pour la 3D

## Statut
Accepté (2026-10-21)

## Contexte
Le projet nécessite une scène 3D interactive intégrée dans une application React. 
Les options envisagées :
- Three.js vanilla
- React Three Fiber (R3F)
- Babylon.js

## Décision
Utiliser React Three Fiber avec @react-three/drei.

**Justification** :
- Intégration native avec React (hooks, state)
- Écosystème mature (23M+ dl/mois)
- Helpers drei (OrbitControls, Text, Environment)
- Licence MIT
- Communauté active (32K+ ★)

**Alternatives rejetées** :
- Three.js vanilla : Moins bon DX avec React
- Babylon.js : Plus lourd, WebGPU encore expérimental

## Conséquences
- Positif : DX amélioré, maintenance facilitée
- Négatif : Dépendance à R3F (à surveiller)
- Neutre : Courbe d'apprentissage Three.js tetaple

## Liens
- [R3F Documentation](https://docs.pmnd.rs/react-three-fiber)
- [drei](https://github.com/pmndrs/drei)
```

#### 5.3.2 Documentation des limites

**Template limites** :
```markdown
# Limites connues du projet

## Performance
- **FPS mobile** : 30 FPS sur mobile mid-range (iPhone 12)
- **Temps chargement** : 3.2s sur 4G (LCP)
- **Taille bundle** : 450KB gzipped (seuil acceptable < 500KB)

## Compatibilité
- **Navigateurs** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL** : Requiert WebGL 2.0 (pas de fallback WebGL 1.0)
- **Mobile** : iOS 14+, Android 10+

## Accessibilité
- **Reduced motion** : Animations désactivées si prefers-reduced-motion
- **Navigation clavier** : Supportée (Tab, Enter, Escape)
- **Screen reader** : Alternative textuelle pour contenu 3D

## Licence
- **Code source** : MIT
- **Assets 3D** : CC0 (Poly Haven)
- **Fonts** : OFL (Google Fonts)
```

### 5.4 Étape 4 : Vérifier tests et licences

#### 5.4.1 Couverture de tests

**Outils** :
```bash
# Jest (JavaScript/TypeScript)
npm run test -- --coverage

# Pytest (Python)
pytest --cov=. --cov-report=html

# Go
go test -coverprofile=coverage.out
go tool cover -html=coverage.out
```

**Seuil minimum** :
- **Tests unitaires** : > 80% couverture
- **Tests E2E** : Scénarios critiques couverts
- **Tests visuels** : Baselines approuvées
- **Tests accessibilité** : axe-core 0 violations
- **Tests performance** : Lighthouse > 90

#### 5.4.2 Conformité licences

**Outils** :
```bash
# License checker (npm)
npx license-checker --summary

# FOSSA (commercial, free tier)
fossa analyze

# Syft (SBOM generation)
syft packages . --output spdx-json > sbom.json
```

**Vérification** :
```markdown
## Licences utilisées
- MIT : 45 dépendances ✅
- Apache-2.0 : 12 dépendances ✅
- ISC : 8 dépendances ✅
- BSD-3-Clause : 3 dépendances ✅
- CC0 : 5 assets ✅

## Licences à vérifier
- LGPL-2.1 : p5.js (utilisation dynamique via CDN) ✅
- AGPL-3.0 : TruffleHog (usage CLI uniquement, pas de linking) ✅

## Licences incompatibles
- GPL-3.0 : 0 dépendances ✅ (aucune)
```

### 5.5 Étape 5 : Faire valider

**Processus de validation** :

```
1. Auto-review (auteur)
   ↓
2. Peer review (1 reviewer minimum)
   ↓
3. Review mainteneur (validation finale)
   ↓
4. Merge + Publication
```

**Checklist validation** :
```markdown
## Qualité code
- [ ] Code review approuvé (2 reviewers)
- [ ] Linting clean (ESLint, Prettier)
- [ ] TypeScript strict (pas de any)
- [ ] Pas de console.log

## Tests
- [ ] Couverture > 80%
- [ ] Tests E2E passent
- [ ] Tests visuels approuvés
- [ ] Tests accessibilité (0 violations axe-core)

## Documentation
- [ ] README complet
- [ ] ADR documentés
- [ ] Limites listées
- [ ] Exemples d'usage

## Sécurité
- [ ] Secrets nettoyés (Gitleaks + TruffleHog)
- [ ] Dépendances à jour (npm audit)
- [ ] Licences vérifiées

## Performance
- [ ] Lighthouse > 90 (performance, a11y, best practices, SEO)
- [ ] Bundle size < 500KB gzipped
- [ ] Core Web Vitals within limits (LCP < 2.5s, INP < 200ms, CLS < 0.1)
```

### 5.6 Étape 6 : Publier dans la bibliothèque

**Objectif** : Catégoriser et documenter selon Phase 09 (Bibliothèque Créative).

**Process** :
```markdown
1. **Catégorisation** : Déterminer famille (UI, Motion, 3D, Data Viz, etc.)
2. **Documentation** : Suivre template Phase 09 (description, usage, props, etc.)
3. **Métadonnées** : Licence, dépendances, maintenance, compatibilité
4. **Exemples** : CodeSandbox, StackBlitz, ou demo live
5. **Publication** : npm, GitHub Releases, ou interne EKTS
```

**Exemple publication** :
```markdown
# Composant : AnimatedCard

## Famille
UI Components → Animation

## Description
Carte animée avec effet hover 3D et reveal au scroll.

## Usage
```jsx
import { AnimatedCard } from '@ekts/ui';

<AnimatedCard
  title="Projet"
  description="Description du projet"
  image="/path/to/image.jpg"
  hoverEffect="3d-tilt"
  scrollReveal={true}
/>
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Titre de la carte |
| description | string | - | Description |
| image | string | - | URL image |
| hoverEffect | '3d-tilt' \| 'scale' \| 'glow' | '3d-tilt' | Effet hover |
| scrollReveal | boolean | true | Animation au scroll |

## Dépendances
- React 18+
- Motion (pour animations)
- Tailwind CSS 3+

## Licence
MIT

## Maintenance
Actif (dernière mise à jour : 2026-10-21)
```

### 5.7 Étape 7 : Indexer

**Objectif** : Rendre la ressource recherchable via EKTS (Phases 06-07).

#### 5.7.1 Stockage Phase 06

```sql
INSERT INTO resources (
  id, type, family, name, description, package, import,
  props, variants, states, accessibility, performance,
  dependencies, examples, license, maintenance, created, updated
) VALUES (
  'uuid-generated',
  'component',
  'ui',
  'AnimatedCard',
  'Carte animée avec effet hover 3D et reveal au scroll',
  '@ekts/ui',
  'import { AnimatedCard } from "@ekts/ui"',
  '[{"name":"title","type":"string","required":true},{"name":"hoverEffect","type":"enum","default":"3d-tilt"}]',
  '["3d-tilt","scale","glow"]',
  '["default","hover","active","disabled"]',
  '{"keyboard":true,"aria":"article","reducedMotion":true}',
  '{"bundleSize":3200,"renderTime":2,"fps":60}',
  '{"react":">=18.0.0","motion":">=10.0.0","tailwindcss":">=3.0.0"}',
  '["https://storybook.ekts.dev/animatedcard"]',
  'MIT',
  'active',
  NOW(),
  NOW()
);
```

#### 5.7.2 Indexation RAG Phase 07

```javascript
// Chunking pour recherche sémantique
const chunks = [
  {
    id: 'animatedcard-description',
    type: 'component',
    family: 'ui',
    content: 'AnimatedCard : Carte animée avec effet hover 3D et reveal au scroll. Utilisable dans galeries de projets, portfolios, listings.',
    embedding: await embed('AnimatedCard carte animée 3D hover scroll')
  },
  {
    id: 'animatedcard-usage',
    type: 'component',
    family: 'ui',
    content: 'Usage : import { AnimatedCard } from "@ekts/ui"; <AnimatedCard title="Projet" hoverEffect="3d-tilt" />',
    embedding: await embed('import AnimatedCard usage React props')
  },
  {
    id: 'animatedcard-props',
    type: 'component',
    family: 'ui',
    content: 'Props AnimatedCard : title (string, required), description (string), image (string), hoverEffect (3d-tilt|scale|glow), scrollReveal (boolean)',
    embedding: await embed('AnimatedCard props title description image hoverEffect')
  }
];

// Stocker dans EKTS
await db.ragChunks.insertMany(chunks);
```

### 5.8 Étape 8 : Déprécier les anciennes références

**Objectif** : Maintenir la bibliothèque à jour en dépréciant/supprimant les ressources obsolètes.

#### 5.8.1 Critères de dépréciation

- Non utilisé depuis 6+ mois
- Maintenance abandonnée (pas de commits > 12 mois)
- Vulnerabilités non corrigées
- Alternative supérieure disponible

#### 5.8.2 Process de dépréciation

```markdown
1. **Warning** : Ajouter `@deprecated` JSDoc + console warning
2. **Documentation** : Documenter alternative recommandée
3. **Grace period** : 3 mois avant suppression
4. **Migration guide** : Guide de migration si breaking change
5. **Removal** : Supprimer après grace period
```

**Exemple** :
```javascript
/**
 * @deprecated Since v2.0.0. Use `<AnimatedCard />` instead.
 * Will be removed in v3.0.0.
 * @see {@link https://ekts.dev/migration/oldcard Migration guide}
 */
export function OldCard() {
  console.warn('OldCard is deprecated. Use AnimatedCard instead.');
  return <AnimatedCard {...props} />;
}
```

#### 5.8.3 Rotation automatique

**Script de vérification** :
```bash
#!/bin/bash
# check-deprecated.sh

# Trouver composants non utilisés depuis 6 mois
grep -r "import.*OldCard" src/ || echo "OldCard non utilisé"

# Vérifier dernier commit
git log -1 --format=%cr -- path/to/component.tsx | grep -q "6 months ago" && echo "À déprécier"

# Vérifier vulnerabilities
npm audit | grep -i "high\|critical"
```

---

## 6. Limites

### 6.1 Limites identifiées

1. **Processus lourd** : 8 étapes peuvent ralentir la capitalisation
2. **Subjectivité** : Certains critères (qualité code) sont subjectifs
3. **Maintenance continue** : Dépréciation nécessite suivi régulier
4. **Secrets cachés** : Certains secrets peuvent être difficiles à détecter (variables d'environnement, configs)
5. **Historique Git** : Nettoyage historique peut être complexe (force push, re-clone)

### 6.2 Questions ouvertes

1. **Automatisation** : Comment automatiser davantage le workflow ?
2. **AI review** : Peut-on utiliser un agent IA pour valider la capitalisation ?
3. **Fréquence** : À quelle fréquence déprécier les ressources ?
4. **Archivage** : Où archiver les ressources dépréciées (au cas où) ?
5. **Metrics** : Comment mesurer le succès de la capitalisation ?

---

## 7. Recommandations

### 7.1 Approche recommandée : Fichiers versionnés + Base de données

**Comparaison** :

| Critère | Fichiers versionnés (Git) | Base de données structurée (SQLite) |
|---------|---------------------------|-------------------------------------|
| **Traçabilité** | ✅ Excellent (Git history) | ⚠️ Moyen (audit logs) |
| **Recherche** | ⚠️ Limité (grep, Git search) | ✅ Excellent (SQL, FTS5, RAG) |
| **Collaboration** | ✅ Excellent (Git workflows) | ⚠️ Moyen (concurrency) |
| **Performance** | ⚠️ Moyen (filesystem) | ✅ Excellent (indexed queries) |
| **Flexibilité** | ✅ Excellent (tout format) | ⚠️ Moyen (schéma fixe) |
| **Backup** | ✅ Simple (git clone) | ⚠️ Complexe (dump, restore) |

**Recommandation EKTS** : **Approche hybride**

- **Git** : Code source, documentation Markdown, ADR
- **SQLite** : Métadonnées structurées, indexation RAG
- **RAG** : Recherche sémantique dans chunks

```
Git Repository
├── code/
├── docs/
│   ├── README.md
│   ├── ADR/
│   └── guides/
└── assets/

SQLite Database (ekts.db)
├── resources (métadonnées)
├── rag_chunks (embeddings)
└── audit_logs

RAG Index (sqlite-vec)
└── embeddings pour recherche sémantique
```

### 7.2 Outils recommandés

**Détection secrets** :
- **Gitleaks** : Pre-commit + CI (rapide, MIT)
- **TruffleHog** : Scan historique avec vérification (AGPL-3.0)

**Nettoyage historique** :
- **git-filter-repo** : Recommandé par Git (remplace git filter-branch)

**Documentation** :
- **Docusaurus** : Documentation versionnée (MDX, React)
- **Document360** : Knowledge base structurée (commercial)

**Gestion dette technique** :
- **GitHub Issues** : Labels "tech-debt"
- **Linear** : Tracking dette technique
- **CodeClimate** : Analyse qualité code

### 7.3 Intégration EKTS

1. **Phase 06** : Stockage métadonnées dans SQLite
2. **Phase 07** : Indexation RAG pour recherche sémantique
3. **Phase 09** : Publication dans bibliothèque créative
4. **MCP** : Exposer `search_capitalized_resource(query)` comme outil

---

## 8. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **Workflow en 8 étapes** | Couverture complète (collecte → dépréciation) | 5 étapes → pas assez complet |
| **Gitleaks + TruffleHog** | Complémentaires (rapidité + vérification) | Un seul outil → coverage incomplet |
| **git-filter-repo** | Recommandé par Git, plus sûr que filter-branch | BFG Repo-Cleaner → moins flexible |
| **Approche hybride (Git + SQLite)** | Traçabilité Git + recherche SQLite | Fichiers uniquement → pas de recherche |
| **ADR obligatoires** | Capture décisions architecturales | Pas d'ADR → perte de contexte |
| **Couverture > 80%** | Standard industrie | > 90% → trop strict, ralentit développement |

---

## 9. Questions

1. **Automatisation** : Quels outils pour automatiser le workflow ?
2. **AI validation** : Comment intégrer un agent IA dans la validation ?
3. **Fréquence dépréciation** : Trimestrielle, semestrielle, annuelle ?
4. **Archivage** : Où stocker les ressources dépréciées ?
5. **Metrics** : Comment mesurer le ROI de la capitalisation ?

---

## 10. Sources

### 10.1 Bonnes pratiques

1. **NN/g** — Post-mortem UX (2026)
2. **Plane** — Project post-mortem template (2026)
3. **Rootly** — Postmortem meeting guide (2026)
4. **IBM** — Reducing technical debt (2026)
5. **arXiv 2505.13009** — Reframing Technical Debt (2025)

### 10.2 Outils

6. **Gitleaks** — Secret scanning (MIT, 29K+ ★)
7. **TruffleHog** — Verified secret detection (AGPL-3.0, 27K+ ★)
8. **git-filter-repo** — Git history rewriting
9. **Docusaurus** — Documentation versionnée (v3.9.2, 2026)
10. **Document360** — Knowledge base platform

### 10.3 Phases EKTS

11. **Phase 06** — Stockage SQLite
12. **Phase 07** — RAG et recherche sémantique
13. **Phase 09** — Bibliothèque créative

---

## 11. Relations

### 11.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 04** (Automatisation navigateur) | Tests E2E à capitaliser |
| **Phase 06** (Stockage) | Stockage métadonnées |
| **Phase 07** (RAG) | Indexation sémantique |
| **Phase 08** (Analyse expérience) | Rapports d'inspection |
| **Phase 09** (Bibliothèque créative) | Publication ressources |

### 11.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 11** (Sécurité) | Nettoyage secrets |
| **Phase 12** (Comparatif IA) | Ressources pour benchmarking |

---

## 12. Critères d'évaluation

### 12.1 Critères de complétude

- [x] 8 étapes définies
- [x] Checklist détaillées pour chaque étape
- [x] Outils recommandés (Gitleaks, TruffleHog, git-filter-repo)
- [x] Comparaison fichiers vs base de données
- [x] Intégration EKTS (Phases 06-07-09)

### 12.2 Critères de qualité

- [x] Workflow actionnable et reproductible
- [x] Exemples de code et commandes
- [x] Templates (ADR, limites, documentation)
- [x] Sécurité (détection + nettoyage secrets)

### 12.3 Critères d'actionnabilité

- [x] Commands prêtes à l'emploi
- [x] Configurations exemples (.gitleaks.toml, pre-commit)
- [x] Templates Markdown (ADR, limites)
- [x] Intégration MCP (search_capitalized_resource)

---

**Document rédigé le 21 octobre 2026 — Phase 10 du projet EKTS**
