# Sprint 12-2 — Documentation (Semaine 23, Jours 5-7)

**Durée :** 3 jours  
**Objectif :** Rédiger la documentation utilisateur et développeur complète  
**Dépendance :** Sprint 12-1 (Tests E2E) ✅
**Statut :** ✅ TERMINÉ (voir `SPRINT-12-02-RESULTAT.md`)  

---

## 1. Contexte

Le **Sprint 12-1** a finalisé les tests :
- ✅ Tests E2E inspection-flow
- ✅ Tests E2E cli-flow
- ✅ Tests E2E mcp-flow
- ✅ Tests E2E comparison-flow
- ✅ Tests E2E full-workflow

Le **Sprint 12-2** documente le MVP-2 avec :
- 🎯 USER_GUIDE.md — Guide utilisateur (~400 lignes)
- 🎯 DEVELOPER_GUIDE.md — Guide développeur (~500 lignes)
- 🎯 API_REFERENCE.md — Référence API (~300 lignes)
- 🎯 TROUBLESHOOTING.md — Guide dépannage (~200 lignes)
- 🎯 CONTRIBUTING.md — Guide contribution (~150 lignes)

---

## 2. État initial

```
Engineering-Knowledge-Tooling-System/
├── docs/
│   ├── INSPECTOR.md                ✅ (Sprint 8)
│   ├── ANALYSIS.md                 ✅ (Sprint 9)
│   ├── STORAGE.md                  ✅ (Sprint 10)
│   ├── REPORTS.md                  ✅ (Sprint 11)
│   ├── CLI.md                      ✅ (Sprint 11)
│   ├── MCP.md                      ✅ (Sprint 11)
│   ├── USER_GUIDE.md               (à créer)
│   ├── DEVELOPER_GUIDE.md          (à créer)
│   ├── API_REFERENCE.md            (à créer)
│   ├── TROUBLESHOOTING.md          (à créer)
│   └── CONTRIBUTING.md             (à créer)
└── ...
```

---

## 3. Tâches atomiques

### 3.1 USER_GUIDE.md (Jour 1 — 8h)

**Fichier :** `docs/USER_GUIDE.md`

```markdown
# Guide Utilisateur — Engineering Knowledge Tooling System

## Introduction

Bienvenue dans EKTS, votre système de gestion de connaissances techniques. Ce guide vous aidera à installer, configurer et utiliser efficacement EKTS pour vos projets.

### Qu'est-ce que EKTS ?

EKTS (Engineering Knowledge Tooling System) est un outil complet qui permet de :
- Inspecter des sites web (performance, accessibilité, SEO, UX, contenu)
- Analyser les résultats et générer des recommandations
- Stocker et indexer les audits pour recherche
- Générer des rapports professionnels (Markdown, PDF)
- Comparer les audits dans le temps
- Accéder via CLI ou MCP (Model Context Protocol)

### Prérequis

- Node.js 18+ (20+ recommandé)
- npm ou yarn
- Un terminal (bash, zsh, PowerShell)
- 2 GB RAM minimum
- 500 MB espace disque

---

## Installation

### 1. Installation standard

```bash
# Cloner le dépôt
git clone https://github.com/votre-org/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system

# Installer les dépendances
npm install

# Compiler le projet
npm run build

# Vérifier l'installation
node dist/cli/index.js --version
```

### 2. Installation globale (optionnel)

```bash
# Installer globalement
npm install -g .

# Vérifier
ekts --version
```

### 3. Configuration initiale

```bash
# Initialiser la base de données
ekts init

# Vérifier le statut
ekts status
```

---

## Utilisation CLI

### Commande `ekts inspect`

Inspecter un site web et générer un rapport complet.

```bash
# Inspection basique (niveau L2)
ekts inspect https://example.com

# Inspection complète (niveau L3)
ekts inspect https://example.com --level L3

# Inspection rapide (niveau L1)
ekts inspect https://example.com --level L1

# Spécifier le dossier de sortie
ekts inspect https://example.com --output ./reports

# Générer uniquement le rapport Markdown
ekts inspect https://example.com --format md

# Générer uniquement le rapport PDF
ekts inspect https://example.com --format pdf
```

**Options :**
- `--level <L1|L2|L3>` : Niveau d'inspection (défaut: L2)
  - L1 : Rapide (~10s) - Performance basique
  - L2 : Standard (~30s) - Performance + Accessibilité + SEO
  - L3 : Complet (~60s) - Performance + Accessibilité + SEO + UX + Contenu
- `--output <path>` : Dossier de sortie (défaut: ./reports)
- `--format <md|pdf|both>` : Format du rapport (défaut: both)

**Exemple complet :**
```bash
ekts inspect https://mon-site.com --level L3 --output ./rapports --format both
```

### Commande `ekts audit list`

Lister les audits stockés.

```bash
# Lister les 20 derniers audits
ekts audit list

# Lister les 10 derniers audits
ekts audit list --limit 10

# Filtrer par URL
ekts audit list --url https://example.com

# Filtrer par score minimum
ekts audit list --score-min 70

# Filtrer par score maximum
ekts audit list --score-max 80
```

**Options :**
- `--limit <n>` : Nombre maximum d'audits (défaut: 20)
- `--url <url>` : Filtrer par URL
- `--score-min <n>` : Score minimum (0-100)
- `--score-max <n>` : Score maximum (0-100)

### Commande `ekts audit show`

Afficher les détails d'un audit.

```bash
# Afficher l'audit #1
ekts audit show 1

# Afficher l'audit #42
ekts audit show 42
```

### Commande `ekts audit report`

Générer un rapport pour un audit existant.

```bash
# Générer les 2 rapports (Markdown + PDF)
ekts audit report 1

# Générer uniquement le rapport Markdown
ekts audit report 1 --format md

# Générer uniquement le rapport PDF
ekts audit report 1 --format pdf

# Spécifier le dossier de sortie
ekts audit report 1 --output ./rapports
```

### Commande `ekts audit compare`

Comparer 2 audits et générer un rapport de comparaison.

```bash
# Comparer les audits #1 et #2
ekts audit compare 1 2

# Générer uniquement le rapport Markdown
ekts audit compare 1 2 --format md

# Spécifier le dossier de sortie
ekts audit compare 1 2 --output ./comparaisons
```

### Commande `ekts status`

Afficher le statut du système.

```bash
ekts status
```

**Sortie :**
```
📊 EKTS Status
├── Base de données : OK (./data/ekts.db)
├── Audits stockés : 42
├── Taille base : 2.3 MB
└── Dernière inspection : 2024-01-15 14:30:00
```

---

## Utilisation MCP

EKTS expose également ses fonctionnalités via MCP (Model Context Protocol) pour intégration avec des agents IA.

### Configuration MCP

Dans votre client MCP (Claude Desktop, Cursor, etc.), ajoutez :

```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/chemin/vers/dist/mcp/index.js"]
    }
  }
}
```

### Outils MCP disponibles

#### `inspect_site`

Inspecter un site web via MCP.

```json
{
  "tool": "inspect_site",
  "arguments": {
    "url": "https://example.com",
    "level": "L2"
  }
}
```

**Réponse :**
```json
{
  "url": "https://example.com",
  "level": "L2",
  "audit_id": 42,
  "overall_score": 75,
  "total_findings": 12,
  "dimensions": {
    "performance": 80,
    "accessibility": 70,
    "seo": 85,
    "ux": 65,
    "content": 75
  }
}
```

#### `audit_history`

Consulter l'historique des audits.

```json
{
  "tool": "audit_history",
  "arguments": {
    "url": "https://example.com",
    "limit": 10,
    "score_min": 70
  }
}
```

#### `audit_report`

Générer un rapport via MCP.

```json
{
  "tool": "audit_report",
  "arguments": {
    "audit_id": 42,
    "format": "markdown"
  }
}
```

---

## Exemples d'utilisation

### Scénario 1 : Inspection ponctuelle

```bash
# Inspecter un site et générer les rapports
ekts inspect https://mon-site.com --level L2

# Les rapports sont générés dans ./reports/
ls -la ./reports/
# audit-42-20240115.md
# audit-42-20240115.pdf
```

### Scénario 2 : Suivi dans le temps

```bash
# Inspection initiale
ekts inspect https://mon-site.com --level L3
# → Audit #1 (score: 65)

# Après améliorations
ekts inspect https://mon-site.com --level L3
# → Audit #2 (score: 78)

# Comparer les 2 audits
ekts audit compare 1 2
# → comparison-1-2-20240115.md
```

### Scénario 3 : Recherche dans l'historique

```bash
# Lister tous les audits
ekts audit list

# Filtrer par URL
ekts audit list --url https://mon-site.com

# Filtrer par score
ekts audit list --score-min 80
```

---

## Interpretation des résultats

### Score global

Le score global (0-100) est une moyenne pondérée des 5 dimensions :
- Performance : 25%
- Accessibilité : 25%
- SEO : 20%
- UX : 15%
- Contenu : 15%

**Interprétation :**
- 90-100 : Excellent
- 70-89 : Bon
- 50-69 : Moyen
- 0-49 : À améliorer

### Niveaux d'inspection

| Niveau | Durée | Dimensions | Usage |
|--------|-------|------------|-------|
| L1 | ~10s | Performance basique | Vérification rapide |
| L2 | ~30s | Perf + A11y + SEO | Inspection standard |
| L3 | ~60s | Perf + A11y + SEO + UX + Contenu | Audit complet |

### Priorités des findings

- 🔴 **Critical** : Bloquant, à corriger immédiatement
- 🟠 **High** : Important, à corriger rapidement
- 🟡 **Medium** : Modéré, à planifier
- 🟢 **Low** : Mineur, correction optionnelle
- ⚪ **Info** : Information, pas d'action requise

---

## FAQ

### Q: Combien de temps prend une inspection ?

**R:** Cela dépend du niveau :
- L1 : ~10 secondes
- L2 : ~30 secondes
- L3 : ~60 secondes

### Q: Où sont stockés les audits ?

**R:** Dans la base SQLite `./data/ekts.db`. Vous pouvez la sauvegarder comme n'importe quel fichier.

### Q: Puis-je exporter les données ?

**R:** Oui, les rapports sont générés en Markdown et PDF. La base SQLite peut aussi être exportée avec des outils SQL.

### Q: Comment mettre à jour EKTS ?

**R:**
```bash
git pull
npm install
npm run build
```

### Q: EKTS fonctionne-t-il hors ligne ?

**R:** Oui, une fois installé, EKTS fonctionne entièrement hors ligne. Seule l'inspection nécessite une connexion internet pour accéder au site cible.

---

## Support

- **Documentation** : `docs/`
- **Issues** : https://github.com/votre-org/engineering-knowledge-tooling-system/issues
- **Discussions** : https://github.com/votre-org/engineering-knowledge-tooling-system/discussions

---

**Version :** 2.0.0 (MVP-2)  
**Dernière mise à jour :** 2024-01-15
```

**Validation :**
```bash
wc -l docs/USER_GUIDE.md
# ✅ ~400 lignes

cat docs/USER_GUIDE.md | grep -E "^##" | wc -l
# ✅ 15 sections principales
```

**Commit :**
```bash
git add docs/USER_GUIDE.md
git commit -m "docs: add comprehensive USER_GUIDE.md"
```

---

### 3.2 DEVELOPER_GUIDE.md (Jour 2 — 10h)

**Fichier :** `docs/DEVELOPER_GUIDE.md`

```markdown
# Guide Développeur — Engineering Knowledge Tooling System

## Architecture

### Vue d'ensemble

EKTS suit une architecture modulaire en 4 couches :

```
┌─────────────────────────────────────────┐
│         Interface (CLI + MCP)           │
│  ┌──────────┐      ┌────────────────┐   │
│  │   CLI    │      │     MCP        │   │
│  │Commands  │      │    Tools       │   │
│  └──────────┘      └────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Business Logic                  │
│  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │ Inspector│  │Analysis│  │Reports │  │
│  │  (L1-L3) │  │Pipeline│  │Generator│ │
│  └──────────┘  └────────┘  └────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │  SQLite  │  │Search  │  │ Vector │  │
│  │Repository│  │ Engine │  │ Store  │  │
│  └──────────┘  └────────┘  └────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Browser Automation              │
│  ┌──────────┐  ┌────────┐  ┌────────┐  │
│  │Playwright│  │Lighthouse│ │axe-core│  │
│  └──────────┘  └────────┘  └────────┘  │
└─────────────────────────────────────────┘
```

### Structure du code

```
src/
├── browser/
│   ├── inspection/
│   │   ├── level-1.ts          # Inspection niveau 1
│   │   ├── level-2.ts          # Inspection niveau 2
│   │   ├── level-3.ts          # Inspection niveau 3
│   │   ├── inspector.ts        # Orchestrateur
│   │   └── types.ts            # Types inspection
│   ├── lighthouse.ts           # Integration Lighthouse
│   ├── axe.ts                  # Integration axe-core
│   └── playwright.ts           # Setup Playwright
│
├── analysis/
│   ├── performance.ts          # Analyse performance
│   ├── accessibility.ts        # Analyse accessibilité
│   ├── seo.ts                  # Analyse SEO
│   ├── ux.ts                   # Analyse UX
│   ├── content.ts              # Analyse contenu
│   ├── severity.ts             # Matrice sévérité
│   ├── prioritizer.ts          # Priorisation findings
│   ├── pipeline.ts             # Pipeline complet
│   └── types.ts                # Types analyse
│
├── storage/
│   ├── audit-types.ts          # Types audit
│   ├── audit-schema.ts         # Schéma SQLite
│   ├── audit-repository.ts     # CRUD audits
│   ├── audit-indexing.ts       # Indexation FTS5/Vector
│   ├── audit-search.ts         # Recherche hybride
│   └── audit-statistics.ts     # Statistiques
│
├── reports/
│   ├── markdown-generator.ts   # Générateur Markdown
│   ├── pdf-generator.ts        # Générateur PDF
│   ├── comparator.ts           # Comparaison audits
│   └── templates/              # Templates
│
├── cli/
│   ├── index.ts                # Entry point CLI
│   └── commands/               # Commandes
│
└── mcp/
    ├── index.ts                # Entry point MCP
    └── tools/                  # Outils MCP
```

---

## API Reference

### Inspector

```typescript
import { Inspector } from './browser/inspection/inspector';

const inspector = new Inspector();

// Inspection niveau 2
const result = await inspector.inspect({
  level: 'L2',
  url: 'https://example.com',
});

// result contient :
// - lighthouse: Résultats Lighthouse
// - axe: Résultats axe-core
// - ux: Résultats UX
// - content: Résultats contenu
```

### AnalysisPipeline

```typescript
import { AnalysisPipeline } from './analysis/pipeline';

const pipeline = new AnalysisPipeline();

const report = await pipeline.analyze(
  url,
  inspection.lighthouse,
  inspection.axe,
  inspection.ux,
  inspection.content
);

// report contient :
// - dimensions: Scores par dimension (0-100)
// - findings: Liste des problèmes
// - summary: Résumé (score global, counts)
```

### AuditRepository

```typescript
import { AuditRepository } from './storage/audit-repository';

const repo = new AuditRepository(db);

// Stocker un audit
const audit = repo.store(report);

// Récupérer par ID
const found = repo.findById(42);

// Récupérer par URL
const audits = repo.findByUrl('https://example.com');

// Lister avec filtres
const list = repo.list({
  offset: 0,
  limit: 20,
  scoreMin: 70,
});
```

### AuditSearch

```typescript
import { AuditSearch } from './storage/audit-search';

const search = new AuditSearch(db, repo, vectorStore);

// Recherche hybride (FTS5 + Vector + RRF)
const results = await search.search({
  query: 'performance',
  scoreMin: 70,
  dimension: 'performance',
  priority: 'high',
  offset: 0,
  limit: 20,
});
```

### MarkdownReportGenerator

```typescript
import { MarkdownReportGenerator } from './reports/markdown-generator';

const generator = new MarkdownReportGenerator();

const report = await generator.generate(audit, {
  outputPath: './reports',
});

// report.filePath contient le chemin du fichier généré
```

### AuditComparator

```typescript
import { AuditComparator } from './reports/comparator';

const comparator = new AuditComparator();

const comparison = comparator.compare(auditA, auditB);

// comparison contient :
// - deltaScores: Différence scores par dimension
// - deltaFindings: Findings nouveaux/résolus/persistants
// - evolution: Évolution score global
// - recommendations: Recommandations
```

---

## Développement

### Setup

```bash
# Cloner
git clone https://github.com/votre-org/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system

# Installer
npm install

# Compiler
npm run build

# Tests
npm test

# Tests avec couverture
npm run test:coverage

# Linting
npm run lint

# Formatage
npm run format
```

### Structure des tests

```
tests/
├── browser/                      # Tests browser
├── analysis/                     # Tests analyse
├── storage/                      # Tests stockage
├── reports/                      # Tests rapports
├── cli/                          # Tests CLI
├── mcp/                          # Tests MCP
└── e2e/                          # Tests E2E
```

### Conventions de code

- TypeScript strict
- ESLint + Prettier
- JSDoc pour toutes les fonctions publiques
- Tests unitaires > 80% couverture
- Commits atomiques (1 commit = 1 feature)
- Messages de commit conventionnels (feat:, fix:, docs:, test:, etc.)

### Ajout d'une nouvelle commande CLI

1. Créer le fichier dans `src/cli/commands/`
2. Implémenter la logique
3. Ajouter les tests dans `tests/cli/`
4. Mettre à jour `docs/CLI.md`
5. Mettre à jour `docs/USER_GUIDE.md`

**Exemple :**
```typescript
// src/cli/commands/export.ts
import { Command } from 'commander';

export function registerExportCommand(program: Command) {
  program
    .command('export <format>')
    .description('Exporter les données')
    .option('--output <path>', 'Dossier de sortie')
    .action(async (format, options) => {
      // Logique
    });
}
```

### Ajout d'un nouvel outil MCP

1. Créer le fichier dans `src/mcp/tools/`
2. Implémenter l'outil avec Zod schema
3. Ajouter les tests dans `tests/mcp/`
4. Mettre à jour `docs/MCP.md`
5. Mettre à jour `docs/USER_GUIDE.md`

**Exemple :**
```typescript
// src/mcp/tools/export.ts
import { z } from 'zod';

export const exportTool = {
  name: 'export_data',
  description: 'Exporter les données',
  inputSchema: z.object({
    format: z.enum(['json', 'csv']),
    output: z.string(),
  }),
  handler: async ({ format, output }) => {
    // Logique
    return { success: true };
  },
};
```

---

## Dépannage

### Problèmes courants

#### "Cannot find module 'playwright'"

```bash
npm install
npx playwright install
```

#### "Database is locked"

Fermer toutes les instances EKTS et supprimer `./data/ekts.db-shm` et `./data/ekts.db-wal`.

#### "Lighthouse failed"

Vérifier que le site est accessible et que Chrome/Chromium est installé.

#### "Tests fail with timeout"

Augmenter le timeout dans `vitest.config.ts` ou vérifier les performances machine.

---

## Performance

### Objectifs

| Métrique | Objectif |
|----------|----------|
| Inspection L1 | < 10s |
| Inspection L2 | < 30s |
| Inspection L3 | < 60s |
| Analyse | < 5s |
| Stockage | < 100ms |
| Indexation | < 500ms |
| Recherche | < 100ms |
| Rapport Markdown | < 2s |
| Rapport PDF | < 10s |

### Optimisations

- Transactions SQLite (batch INSERT)
- Index FTS5 (recherche plein texte)
- Vector embeddings (recherche sémantique)
- RRF k=60 (fusion résultats)
- Puppeteer headless (PDF rapide)
- Cache navigateur (Playwright)

---

## Contribution

Voir `CONTRIBUTING.md` pour les détails.

**Workflow :**
1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit les changements (`git commit -m 'feat: ajouter ma-feature'`)
4. Push vers la branche (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

**Version :** 2.0.0 (MVP-2)  
**Dernière mise à jour :** 2024-01-15
```

**Validation :**
```bash
wc -l docs/DEVELOPER_GUIDE.md
# ✅ ~500 lignes

cat docs/DEVELOPER_GUIDE.md | grep -E "^##" | wc -l
# ✅ 18 sections principales
```

**Commit :**
```bash
git add docs/DEVELOPER_GUIDE.md
git commit -m "docs: add comprehensive DEVELOPER_GUIDE.md"
```

---

### 3.3 API_REFERENCE.md (Jour 3 — 6h)

**Fichier :** `docs/API_REFERENCE.md`

```markdown
# Référence API — Engineering Knowledge Tooling System

## CLI

### Commandes principales

#### `ekts inspect <url>`

Inspecter un site web et générer un rapport.

**Syntaxe :**
```bash
ekts inspect <url> [options]
```

**Options :**
- `-l, --level <L1|L2|L3>` : Niveau d'inspection (défaut: L2)
- `-o, --output <path>` : Dossier de sortie (défaut: ./reports)
- `-f, --format <md|pdf|both>` : Format du rapport (défaut: both)

**Exemples :**
```bash
ekts inspect https://example.com
ekts inspect https://example.com --level L3
ekts inspect https://example.com --format md --output ./rapports
```

**Code de sortie :**
- 0 : Succès
- 1 : Erreur

---

#### `ekts audit list`

Lister les audits stockés.

**Syntaxe :**
```bash
ekts audit list [options]
```

**Options :**
- `-n, --limit <n>` : Nombre maximum (défaut: 20)
- `--url <url>` : Filtrer par URL
- `--score-min <n>` : Score minimum (0-100)
- `--score-max <n>` : Score maximum (0-100)

**Exemples :**
```bash
ekts audit list
ekts audit list --limit 10
ekts audit list --url https://example.com --score-min 70
```

---

#### `ekts audit show <id>`

Afficher les détails d'un audit.

**Syntaxe :**
```bash
ekts audit show <id>
```

**Exemples :**
```bash
ekts audit show 1
ekts audit show 42
```

---

#### `ekts audit report <id>`

Générer un rapport pour un audit.

**Syntaxe :**
```bash
ekts audit report <id> [options]
```

**Options :**
- `-f, --format <md|pdf|both>` : Format (défaut: both)
- `-o, --output <path>` : Dossier de sortie (défaut: ./reports)

**Exemples :**
```bash
ekts audit report 1
ekts audit report 1 --format md --output ./rapports
```

---

#### `ekts audit compare <id1> <id2>`

Comparer 2 audits.

**Syntaxe :**
```bash
ekts audit compare <id1> <id2> [options]
```

**Options :**
- `-f, --format <md|pdf|both>` : Format (défaut: both)
- `-o, --output <path>` : Dossier de sortie (défaut: ./reports)

**Exemples :**
```bash
ekts audit compare 1 2
ekts audit compare 1 2 --format md
```

---

#### `ekts status`

Afficher le statut du système.

**Syntaxe :**
```bash
ekts status
```

---

#### `ekts init`

Initialiser la base de données.

**Syntaxe :**
```bash
ekts init
```

---

## MCP

### Outils

#### `inspect_site`

Inspecter un site web via MCP.

**Input :**
```json
{
  "url": "string (required)",
  "level": "L1 | L2 | L3 (optional, default: L2)"
}
```

**Output :**
```json
{
  "url": "string",
  "level": "L1 | L2 | L3",
  "audit_id": "number",
  "overall_score": "number (0-100)",
  "total_findings": "number",
  "critical_findings": "number",
  "high_findings": "number",
  "medium_findings": "number",
  "low_findings": "number",
  "dimensions": {
    "performance": "number (0-100)",
    "accessibility": "number (0-100)",
    "seo": "number (0-100)",
    "ux": "number (0-100)",
    "content": "number (0-100)"
  },
  "timestamp": "string (ISO 8601)"
}
```

**Exemple :**
```json
{
  "tool": "inspect_site",
  "arguments": {
    "url": "https://example.com",
    "level": "L2"
  }
}
```

---

#### `audit_history`

Consulter l'historique des audits.

**Input :**
```json
{
  "url": "string (optional)",
  "limit": "number (optional, default: 20)",
  "score_min": "number (optional, 0-100)",
  "score_max": "number (optional, 0-100)"
}
```

**Output :**
```json
{
  "audits": [
    {
      "id": "number",
      "url": "string",
      "timestamp": "string (ISO 8601)",
      "overall_score": "number (0-100)",
      "total_findings": "number",
      "dimensions": {
        "performance": "number",
        "accessibility": "number",
        "seo": "number",
        "ux": "number",
        "content": "number"
      }
    }
  ],
  "statistics": {
    "total_audits": "number",
    "average_score": "number",
    "min_score": "number",
    "max_score": "number"
  }
}
```

**Exemple :**
```json
{
  "tool": "audit_history",
  "arguments": {
    "url": "https://example.com",
    "limit": 10,
    "score_min": 70
  }
}
```

---

#### `audit_report`

Générer un rapport via MCP.

**Input :**
```json
{
  "audit_id": "number (required)",
  "format": "markdown | pdf (optional, default: markdown)"
}
```

**Output :**
```json
{
  "audit_id": "number",
  "format": "markdown | pdf",
  "content": "string (rapport complet)",
  "file_path": "string (chemin du fichier)",
  "generated_at": "string (ISO 8601)"
}
```

**Exemple :**
```json
{
  "tool": "audit_report",
  "arguments": {
    "audit_id": 42,
    "format": "markdown"
  }
}
```

---

## API TypeScript

### Inspector

```typescript
interface Inspector {
  inspect(options: {
    level: 'L1' | 'L2' | 'L3';
    url: string;
  }): Promise<InspectionResult>;
}

interface InspectionResult {
  level: 'L1' | 'L2' | 'L3';
  url: string;
  lighthouse: LighthouseResult;
  axe: AxeResult;
  ux: UXResult;
  content: ContentResult;
}
```

### AnalysisPipeline

```typescript
interface AnalysisPipeline {
  analyze(
    url: string,
    lighthouse: LighthouseResult,
    axe: AxeResult,
    ux: UXResult,
    content: ContentResult
  ): Promise<AnalysisReport>;
}

interface AnalysisReport {
  url: string;
  timestamp: string;
  dimensions: {
    performance: DimensionScore;
    accessibility: DimensionScore;
    seo: DimensionScore;
    ux: DimensionScore;
    content: DimensionScore;
  };
  findings: Finding[];
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    overallScore: number;
  };
}
```

### AuditRepository

```typescript
interface AuditRepository {
  store(report: AnalysisReport): Audit;
  findById(id: number): Audit | null;
  findByUrl(url: string): Audit[];
  list(options?: {
    offset?: number;
    limit?: number;
    scoreMin?: number;
    scoreMax?: number;
  }): Audit[];
  delete(id: number): boolean;
}
```

### AuditSearch

```typescript
interface AuditSearch {
  search(options: {
    query?: string;
    scoreMin?: number;
    scoreMax?: number;
    dimension?: string;
    priority?: string;
    offset?: number;
    limit?: number;
  }): Promise<AuditSearchResult[]>;
}
```

---

## Types

### Audit

```typescript
interface Audit {
  id: number;
  url: string;
  timestamp: string;
  overallScore: number;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  dimensions: {
    performance: number;
    accessibility: number;
    seo: number;
    ux: number;
    content: number;
  };
  findings: Finding[];
}
```

### Finding

```typescript
interface Finding {
  id: string;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string;
  description: string;
  severity: 0 | 1 | 2 | 3 | 4;
  effort: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendation: string;
}
```

---

**Version :** 2.0.0 (MVP-2)  
**Dernière mise à jour :** 2024-01-15
```

**Validation :**
```bash
wc -l docs/API_REFERENCE.md
# ✅ ~300 lignes
```

**Commit :**
```bash
git add docs/API_REFERENCE.md
git commit -m "docs: add comprehensive API_REFERENCE.md"
```

---

### 3.4 TROUBLESHOOTING.md (Jour 3 — 4h)

**Fichier :** `docs/TROUBLESHOOTING.md`

```markdown
# Guide de Dépannage — Engineering Knowledge Tooling System

## Problèmes d'installation

### "Cannot find module 'playwright'"

**Cause :** Les dépendances ne sont pas installées.

**Solution :**
```bash
npm install
npx playwright install
```

---

### "Permission denied" lors de l'installation

**Cause :** Permissions insuffisantes.

**Solution :**
```bash
# Linux/Mac
sudo npm install -g .

# Windows (PowerShell admin)
npm install -g .
```

---

### "Node.js version too old"

**Cause :** Node.js < 18.

**Solution :**
```bash
# Vérifier la version
node --version

# Mettre à jour avec nvm
nvm install 20
nvm use 20
```

---

## Problèmes d'exécution

### "Database is locked"

**Cause :** Plusieurs instances EKTS accèdent à la base simultanément.

**Solution :**
1. Fermer toutes les instances EKTS
2. Supprimer les fichiers de verrouillage :
```bash
rm ./data/ekts.db-shm
rm ./data/ekts.db-wal
```
3. Relancer EKTS

---

### "Lighthouse failed to run"

**Cause :** Chrome/Chromium non installé ou site inaccessible.

**Solution :**
```bash
# Installer Chrome pour Playwright
npx playwright install chromium

# Vérifier que le site est accessible
curl https://example.com
```

---

### "axe-core failed"

**Cause :** Problème d'injection du script axe-core.

**Solution :**
1. Vérifier que le site charge correctement
2. Augmenter le timeout dans `src/browser/axe.ts` :
```typescript
await page.waitForTimeout(5000); // Augmenter à 10000ms
```

---

### "Out of memory"

**Cause :** Pas assez de RAM pour Puppeteer/Playwright.

**Solution :**
1. Fermer les applications gourmandes
2. Augmenter la mémoire Node.js :
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
ekts inspect https://example.com
```

---

### "Report generation failed"

**Cause :** Problème de génération PDF avec Puppeteer.

**Solution :**
1. Vérifier que Puppeteer est installé :
```bash
npx puppeteer browsers install chrome
```
2. Essayer uniquement le rapport Markdown :
```bash
ekts inspect https://example.com --format md
```

---

## Problèmes de performance

### "Inspection très lente (> 60s)"

**Cause :** Site lourd ou connexion lente.

**Solution :**
1. Utiliser un niveau d'inspection plus bas :
```bash
ekts inspect https://example.com --level L1  # Rapide
ekts inspect https://example.com --level L2  # Standard
```
2. Vérifier la connexion internet
3. Désactiver les extensions navigateur

---

### "Recherche lente (> 1s)"

**Cause :** Base de données trop volumineuse ou index corrompu.

**Solution :**
1. Reconstruire les index :
```bash
# Supprimer et recréer la base
rm ./data/ekts.db
ekts init
```
2. Optimiser la base SQLite :
```sql
sqlite3 ./data/ekts.db "VACUUM;"
```

---

### "PDF generation très lente (> 30s)"

**Cause :** Rapport trop volumineux.

**Solution :**
1. Générer uniquement le rapport Markdown :
```bash
ekts inspect https://example.com --format md
```
2. Augmenter la mémoire Puppeteer :
```typescript
// src/reports/pdf-generator.ts
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});
```

---

## Problèmes de données

### "Audit introuvable"

**Cause :** ID incorrect ou audit supprimé.

**Solution :**
```bash
# Lister tous les audits
ekts audit list

# Vérifier l'ID
ekts audit show <id>
```

---

### "Base de données corrompue"

**Cause :** Arrêt brutal ou problème disque.

**Solution :**
1. Sauvegarder la base :
```bash
cp ./data/ekts.db ./data/ekts.db.backup
```
2. Tenter de réparer :
```bash
sqlite3 ./data/ekts.db ".recover" | sqlite3 ./data/ekts-repaired.db
mv ./data/ekts-repaired.db ./data/ekts.db
```
3. Si échec, recréer la base :
```bash
rm ./data/ekts.db
ekts init
```

---

### "Export des données"

**Solution :**
```bash
# Exporter en CSV
sqlite3 ./data/ekts.db "SELECT * FROM audits;" > exports/audits.csv

# Exporter en JSON
sqlite3 -json ./data/ekts.db "SELECT * FROM audits;" > exports/audits.json
```

---

## Problèmes MCP

### "MCP server ne démarre pas"

**Cause :** Port déjà utilisé ou configuration incorrecte.

**Solution :**
1. Vérifier le port :
```bash
lsof -i :3000  # Ou le port configuré
```
2. Changer le port dans la configuration MCP
3. Vérifier le chemin vers le serveur :
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/chemin/absolu/vers/dist/mcp/index.js"]
    }
  }
}
```

---

### "Outil MCP ne répond pas"

**Cause :** Timeout ou erreur interne.

**Solution :**
1. Vérifier les logs :
```bash
# Logs MCP
tail -f ./logs/mcp.log
```
2. Redémarrer le serveur MCP
3. Vérifier que la base de données est accessible

---

## Problèmes courants

### "Commande ekts introuvable"

**Cause :** Installation globale incorrecte ou PATH non configuré.

**Solution :**
```bash
# Vérifier l'installation
npm list -g engineering-knowledge-tooling-system

# Réinstaller
npm install -g .

# Ajouter au PATH (si nécessaire)
export PATH="$PATH:$(npm bin -g)"
```

---

### "Tests échouent"

**Cause :** Environnement de test incorrect.

**Solution :**
```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install

# Lancer les tests
npm test

# Avec couverture
npm run test:coverage
```

---

### "Git hooks ne fonctionnent pas"

**Cause :** Husky non configuré.

**Solution :**
```bash
npx husky install
```

---

## Support

Si le problème persiste :

1. **Vérifier la documentation** : `docs/USER_GUIDE.md`, `docs/DEVELOPER_GUIDE.md`
2. **Consulter les logs** : `./logs/ekts.log`, `./logs/mcp.log`
3. **Ouvrir une issue** : https://github.com/votre-org/engineering-knowledge-tooling-system/issues
4. **Rejoindre les discussions** : https://github.com/votre-org/engineering-knowledge-tooling-system/discussions

---

**Version :** 2.0.0 (MVP-2)  
**Dernière mise à jour :** 2024-01-15
```

**Validation :**
```bash
wc -l docs/TROUBLESHOOTING.md
# ✅ ~200 lignes
```

**Commit :**
```bash
git add docs/TROUBLESHOOTING.md
git commit -m "docs: add TROUBLESHOOTING.md"
```

---

### 3.5 CONTRIBUTING.md (Jour 3 — 3h)

**Fichier :** `docs/CONTRIBUTING.md`

```markdown
# Guide de Contribution — Engineering Knowledge Tooling System

Merci de votre intérêt pour contribuer à EKTS ! Ce guide vous aidera à commencer.

## Code de conduite

En participant, vous acceptez de respecter notre code de conduite :
- Respect et inclusion
- Collaboration constructive
- Communication professionnelle
- Focus sur le projet

## Comment contribuer

### Signaler un bug

1. Vérifier que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/votre-org/engineering-knowledge-tooling-system/issues)
2. Créer une nouvelle issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs observé
   - Environnement (OS, Node.js version, etc.)
   - Logs si disponibles

### Proposer une feature

1. Ouvrir une [Discussion](https://github.com/votre-org/engineering-knowledge-tooling-system/discussions) pour discuter de l'idée
2. Attendre feedback de la communauté
3. Si approuvé, créer une issue détaillée

### Soumettre du code

#### Workflow

1. **Fork** le projet
2. **Cloner** votre fork :
   ```bash
   git clone https://github.com/votre-username/engineering-knowledge-tooling-system.git
   cd engineering-knowledge-tooling-system
   ```
3. **Créer une branche** :
   ```bash
   git checkout -b feature/ma-feature
   # ou
   git checkout -b fix/mon-bug-fix
   ```
4. **Implémenter** vos changements
5. **Tester** :
   ```bash
   npm test
   npm run test:coverage
   npm run lint
   npm run build
   ```
6. **Commit** avec messages conventionnels :
   ```bash
   git add .
   git commit -m "feat: ajouter ma feature"
   # ou
   git commit -m "fix: corriger le bug X"
   ```
7. **Push** vers votre fork :
   ```bash
   git push origin feature/ma-feature
   ```
8. **Ouvrir une Pull Request** vers la branche `main`

#### Conventions de commit

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle feature
- `fix:` Correction de bug
- `docs:` Changements documentation
- `style:` Formatage, point-virgules, etc.
- `refactor:` Refactoring code
- `test:` Ajout/modification tests
- `chore:` Maintenance, dépendances

**Exemples :**
```bash
feat(cli): ajouter commande export
fix(storage): corriger fuite mémoire
docs(user-guide): améliorer section installation
test(e2e): ajouter test flux complet
```

#### Standards de code

- **TypeScript** strict
- **ESLint** + **Prettier** (configurations dans le projet)
- **JSDoc** pour toutes les fonctions publiques
- **Tests unitaires** > 80% couverture
- **Commits atomiques** (1 commit = 1 changement logique)

#### Pull Request

Votre PR doit :
- Décrire clairement les changements
- Référencer l'issue associée (#123)
- Inclure des tests si applicable
- Mettre à jour la documentation si nécessaire
- Passer tous les checks CI/CD

**Template PR :**
```markdown
## Description
Décrire les changements...

## Issue associée
Fixes #123

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle feature
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés
- [ ] Tests E2E ajoutés
- [ ] Couverture > 80%

## Documentation
- [ ] Documentation mise à jour
- [ ] Exemples ajoutés

## Checklist
- [ ] Code compile sans erreurs
- [ ] Linting OK
- [ ] Tests passent
- [ ] Documentation à jour
```

### Améliorer la documentation

La documentation est aussi importante que le code !

- Corriger les typos
- Clarifier les sections ambiguës
- Ajouter des exemples
- Traduire dans d'autres langues

Fichiers de documentation :
- `docs/USER_GUIDE.md` — Guide utilisateur
- `docs/DEVELOPER_GUIDE.md` — Guide développeur
- `docs/API_REFERENCE.md` — Référence API
- `docs/TROUBLESHOOTING.md` — Dépannage

## Development Setup

```bash
# Cloner
git clone https://github.com/votre-org/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system

# Installer
npm install

# Compiler
npm run build

# Tests
npm test

# Tests avec couverture
npm run test:coverage

# Linting
npm run lint

# Formatage
npm run format
```

## Structure du projet

Voir `docs/DEVELOPER_GUIDE.md` pour les détails.

## Questions ?

- **Discussions** : https://github.com/votre-org/engineering-knowledge-tooling-system/discussions
- **Issues** : https://github.com/votre-org/engineering-knowledge-tooling-system/issues
- **Email** : contact@votre-org.com

---

Merci pour votre contribution ! 🎉

---

**Version :** 2.0.0 (MVP-2)  
**Dernière mise à jour :** 2024-01-15
```

**Validation :**
```bash
wc -l docs/CONTRIBUTING.md
# ✅ ~150 lignes
```

**Commit :**
```bash
git add docs/CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md"
```

---

### 3.6 Vérifications finales Sprint 12-2 (Jour 3)

```bash
# 1. Vérifier tous les fichiers documentation
ls -la docs/
# ✅ 12 fichiers documentation

# 2. Vérifier tailles
wc -l docs/USER_GUIDE.md docs/DEVELOPER_GUIDE.md docs/API_REFERENCE.md docs/TROUBLESHOOTING.md docs/CONTRIBUTING.md
# ✅ ~1 550 lignes au total

# 3. Vérifier structure
for file in docs/USER_GUIDE.md docs/DEVELOPER_GUIDE.md docs/API_REFERENCE.md docs/TROUBLESHOOTING.md docs/CONTRIBUTING.md; do
  echo "=== $file ==="
  cat $file | grep -E "^##" | head -10
done
# ✅ Structure cohérente

# 4. Vérifier liens internes
grep -r "docs/" docs/ --include="*.md"
# ✅ Liens valides

# 5. Compilation
npm run build
# ✅ Aucune erreur

# 6. Tests
npm test
# ✅ Tous les tests passent

# 7. Couverture
npm run test:coverage
# ✅ > 80% couverture globale

# 8. Linting
npm run lint
# ✅ Aucune erreur

# 9. Vérification Git
git status
# ✅ Tous les changements commités

git log --oneline
# ✅ 5 commits documentation

# 10. Push
git push origin feat/sprint-12-2
```

**Point de contrôle Sprint 12-2 :**
- ✅ USER_GUIDE.md (~400 lignes, 15 sections)
- ✅ DEVELOPER_GUIDE.md (~500 lignes, 18 sections)
- ✅ API_REFERENCE.md (~300 lignes, CLI + MCP + TypeScript)
- ✅ TROUBLESHOOTING.md (~200 lignes, 20+ problèmes)
- ✅ CONTRIBUTING.md (~150 lignes, workflow complet)
- ✅ Total : ~1 550 lignes documentation

---

## 4. Récapitulatif des fichiers

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `docs/USER_GUIDE.md` | 400 | Guide utilisateur complet |
| `docs/DEVELOPER_GUIDE.md` | 500 | Guide développeur + architecture |
| `docs/API_REFERENCE.md` | 300 | Référence API (CLI + MCP + TypeScript) |
| `docs/TROUBLESHOOTING.md` | 200 | Guide dépannage (20+ problèmes) |
| `docs/CONTRIBUTING.md` | 150 | Guide contribution (workflow) |

**Total Sprint 12-2 :** ~1 550 lignes

---

## 5. Commits

```bash
git commit -m "docs: add comprehensive USER_GUIDE.md"
git commit -m "docs: add comprehensive DEVELOPER_GUIDE.md"
git commit -m "docs: add comprehensive API_REFERENCE.md"
git commit -m "docs: add TROUBLESHOOTING.md"
git commit -m "docs: add CONTRIBUTING.md"
```

---

## 6. Transition vers Sprint 12-3

**Prérequis pour Sprint 12-3 :**
- ✅ Sprint 12-2 terminé avec succès
- ✅ Documentation complète (5 guides)
- ✅ Tests E2E passent
- ✅ Couverture > 80%

**Sprint 12-3 — Validation MVP-2 + Préparation MVP-3 (Semaine 24, Jours 8-10) :**
- 🎯 Valider 88 critères MVP-2 (Sprints 7-11)
- 🎯 Rédiger MVP2_VALIDATION.md
- 🎯 Rédiger ROADMAP.md (MVP-3)
- 🎯 Mettre à jour README.md
- 🎯 Créer CHANGELOG.md

---

**Fin du document Sprint 12-2**
