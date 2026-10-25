# Référence API — Engineering Knowledge Tooling System

> MVP-2 — version 2.0.0 · Entrées/sorties conformes au code (tests de contrat inclus)

## CLI

Binaire : `ekts` (ou `node dist/cli/index.js`) · global `--json` avant la
commande · `--no-colors` disponible sur chaque commande.

### Codes de sortie

| Code | Signification |
|-----:|---------------|
| 0 | Succès (y compris `--help`/`--version`) |
| 1 | Erreur inattendue |
| 2 | Usage invalide (Commander) |
| 3 | Ressource introuvable |
| 4 | Validation (paramètres, niveau, format) |

---

### `ekts init`

Initialise les bases dans `EKTS_DATA_DIR` (défaut `data/`).

```bash
ekts init
```

### `ekts add`

Ajoute une ressource et l'indexe (vecteurs si configurés).

```bash
ekts add --type article --title "SQLite en pratique" --tags sqlite,base --content "Texte…"
```

Options : `--type`, `--title`, `--tags <a,b>`, `--content`, `--url`, `--json`.

### `ekts get <id>`

Affiche une ressource ; code 3 si absente.

### `ekts search <query>`

```bash
ekts search "indexation hybride" --mode hybrid --limit 5
ekts search "sqlite" --mode fts        # sans clé d'embedding
```

Options : `--mode <fts|vector|hybrid>` (défaut hybride), `--limit`,
`--type`, `--tags` ; le mode vectoriel/hybride exige une configuration
d'embeddings (sinon : code 4 avec message).

### `ekts list`

```bash
ekts list --type article --tags base --limit 10 --offset 0
```

### `ekts delete <id>`

```bash
ekts delete <id> --yes      # sans confirmation
```

Code 3 si identifiant inconnu ; confirmation réelle sans `--yes`.

### `ekts reindex`

```bash
ekts reindex                 # réindexe dans l'espace courant
ekts reindex --force         # autorise le changement d'espace d'embedding
```

Signale les ressources restées sans vecteur ; refus sans `--force` si
l'espace change.

### `ekts status`

```bash
ekts status                  # ou ekts --json status
```

Affiche version, Node, plateforme, répertoire de données, état/taille des
bases (table), ressources et audits.

### `ekts inspect <url>`

```bash
ekts inspect <url> [-l <L1|L2|L3>] [-o <path>] [-f <md|pdf|both>] [--json] [--no-colors]
```

| Option | Défaut | Notes |
|--------|--------|-------|
| `-l, --level` | `L3` | **L3 obligatoire** pour l'audit (L1/L2 → code 4) |
| `-o, --output` | `./reports` | Dossier des rapports |
| `-f, --format` | `both` | `md`, `pdf` ou `both` |
| `--json` | — | `{ url, level, auditId, score, totalFindings, reports[], durationMs }` |

### `ekts audit`

```bash
ekts audit list [--limit <n>] [--url <url>] [--score-min <n>] [--score-max <n>]
ekts audit show <id>
ekts audit report <id> [-f <md|pdf|both>] [-o <path>]
ekts audit compare <id1> <id2> [-f <md|pdf|both>] [-o <path>]
```

- `list` : défaut 20 entrées ; `--limit` doit être un entier strictement
  positif (sinon code 4).
- `report`/`compare` : formats hors `md|pdf|both` → code 4 ;
  audit absent → code 3.
- JSON : `ekts --json audit …`.

Référence exhaustive des options : `docs/CLI.md`.

### `ekts project`

```bash
ekts project create <name> [-d <text>] [-s <active|completed|archived>]
ekts project list [-s <status>] [-n <limit>]
ekts project show <id>
ekts project delete <id> [-f|--force]
```

- `create` : UUIDv4 généré, statut défaut `active` ; sortie `--json` = objet
  projet.
- `show`/`delete` : UUID attendu (sinon code 4) ; projet absent → code 3.
- `delete` : sans `--force` → refus `CONFIRMATION_REQUIRED`, code 1 ; audits et
  ressources conservés (`project_id` → `NULL`).
- Filtres `-p/--project <uuid>` (option invalide → code 2) sur
  `audit list`, `audit show`, `search`, `list` ; assignation sur `add` et
  `inspect` (projet absent → code 3).

---

## MCP

Serveur stdio : `node dist/mcp/server.js` (config client, voir
`docs/MCP.md`). **11 outils** — entrées validées par Zod, erreurs renvoyées en
payload structuré (`isError: true`, codes MCP : `-32602` paramètres,
`-32000` ressource).

### `search_knowledge`

Entrée : `{ query: string (1-2000 car.), limit?: 1..100, mode?: 'fts'|'vector'|'hybrid', type?, tags? }`.
Sortie : `{ mode, count, resources: [...] }` (voir `docs/MCP.md`).

### `get_resource`

Entrée : `{ id: string (1-100) }` · ressource absente → erreur `-32000`.

### `list_resources`

Entrée : `{ type?, tags?: string[≤50], limit?: 1..1000 }` ·
Sortie : `{ count, resources: [...] }`.

### `validate_resource`

Entrée : `{ data: unknown }` · Sortie : `{ valid: boolean, errors? }`
(aucune écriture).

### `inspect_site` — action

Entrée :

```json
{ "url": "https://example.com", "level": "L3" }
```

`level` défaut `L3` ; `L1`/`L2` → `ValidationError` (entrées incomplètes).

Sortie (`InspectSiteResult`) :

```json
{
  "inspection_url": "https://example.com/",
  "level": "L3",
  "score": 78,
  "total_findings": 4,
  "critical_findings": 0,
  "high_findings": 1,
  "audit_id": 12,
  "timestamp": "2026-10-25T10:00:00.000Z",
  "dimensions": { "performance": 80, "accessibility": 70, "seo": 85, "ux": 75, "content": 82 }
}
```

### `audit_history`

Entrée : `{ url?: string, limit?: 1..100 (défaut 20), score_min?: 0..100, score_max?: 0..100 }`.

Sortie (`AuditHistoryResult`) :

```json
{
  "audits": [
    {
      "id": 12,
      "url": "https://example.com/",
      "timestamp": "2026-10-25T10:00:00.000Z",
      "overall_score": 78,
      "total_findings": 4,
      "critical_findings": 0,
      "high_findings": 1,
      "medium_findings": 1,
      "low_findings": 1,
      "dimensions": [
        { "dimension": "performance", "score": 80, "findings_count": 1 }
      ]
    }
  ]
}
```

### `audit_report`

Entrée : `{ audit_id: entier > 0, format?: 'markdown' | 'text' (défaut markdown) }`.

Sortie (`AuditReportResult`) : `{ audit_id, format, url, report_content, generated_at }`
— audit absent → erreur `-32000`.

### `create_project` / `list_projects` / `get_project` / `delete_project`

Entrées :

| Outil | Entrée |
| --- | --- |
| `create_project` | `{ name: string 1-200, description?: string ≤ 2000, status?: enum (défaut active), metadata?: object }` |
| `list_projects` | `{ status?: enum, limit?: 1-1000 (défaut 50), offset?: ≥ 0 (défaut 0) }` |
| `get_project` | `{ project_id: uuid }` |
| `delete_project` | `{ project_id: uuid }` |

Sorties : `create`/`get` → `{ project }` ; `list_projects` →
`{ count, projects[] }` ; `delete_project` → `{ deleted: true, project_id }`.
Projet absent → erreur `-32000` (`PROJECT_NOT_FOUND`) ; entrée invalide →
`-32602`. `inspect_site` accepte en plus `project_id?: uuid` (assignation de
l'audit créé).

---

## API TypeScript

### Inspection

```typescript
import { Inspector } from 'src/browser/inspection/inspector.js';

interface InspectionOptions {
  url: string;                 // http/https absolu
  level?: 'L1' | 'L2' | 'L3';  // défaut L1
  viewport?: { width: number; height: number };
}

type InspectionResult = L1InspectionResult | L2InspectionResult | L3InspectionResult;
// L3 : { level: 'L3', url, timestamp, duration, budget,
//        lighthouse: LighthouseAnalysis | null, seo: SeoAnalysis,
//        axe: AxeAnalysis | null, ux: UxAnalysis, content: ContentAnalysis, warnings[] }
```

### Analyse

```typescript
import { fromInspection } from 'src/analysis/adapter.js';
import { AnalysisPipeline } from 'src/analysis/pipeline.js';

const inputs = fromInspection(l3);        // pont Sprint 9
const report = await new AnalysisPipeline().analyze(
  url, inputs.lighthouse, inputs.axe, inputs.ux, inputs.content,
);
// AnalysisReport : { url, timestamp, dimensions{5}, findings[], priorityFindings[], summary }
```

### Stockage

```typescript
import { openDatabase } from 'src/data/database.js';
import { AuditSchema } from 'src/storage/schema.js';
import { AuditRepository } from 'src/storage/audit-repository.js';
import { AuditIndexer } from 'src/storage/indexing.js';

const database = openDatabase({ dataDir });
new AuditSchema(database.connection).createSchema();
const repository = new AuditRepository(database.connection);
const audit = repository.store(report);
repository.findById(id);            // Audit | null
repository.findByUrl(url);          // Audit[]
const outcome = await new AuditIndexer(database.connection).indexAudit(audit);
database.close();
```

### Recherche et statistiques

```typescript
import { AuditSearch } from 'src/storage/search.js';
import { AuditStatisticsManager } from 'src/storage/statistics.js';

new AuditSearch(connection, repository).search({
  query?, scoreMin?, scoreMax?, dimension?, priority?, offset?, limit?,
});                                  // Promise<AuditSearchResult[]>

const stats = new AuditStatisticsManager(connection);
stats.getStatistics();               // totalAudits, averageScore, min/max…
stats.getTrend('week');              // ScoreTrend[]
stats.getTopIssues(10);              // TopIssue[]
```

### Rapports et comparaison

```typescript
import { MarkdownReportGenerator } from 'src/reports/markdown-generator.js';
import { PDFReportGenerator } from 'src/reports/pdf-generator.js';
import { AuditComparator } from 'src/reports/comparator.js';

await new MarkdownReportGenerator().generate(audit, { outputPath });
await new PDFReportGenerator().generate(audit, { outputPath });   // Chrome requis
const comparison = new AuditComparator().compare(auditA, auditB);
await new MarkdownReportGenerator().generateComparison(comparison, { outputPath });
```

### Projets (Sprint 13)

```typescript
import { createProjectManager } from 'src/business/project-manager.js';
import type { IProjectManager } from 'src/business/project-manager.types.js';
import { ProjectRepository } from 'src/data/repositories/project-repository.js';

// Connecté sur la même connexion better-sqlite3 que le KnowledgeManager.
const { manager } = createProjectManager(connection);

await manager.createProject({ name: 'Site A', status: 'active' }); // Zod validé
await manager.getProject(uuid);            // Project | null
await manager.getProjectOrThrow(uuid);     // ProjectNotFoundError → code 3
await manager.listProjects({ status: 'active', limit: 50 });
await manager.updateProject(uuid, { status: 'archived' });
await manager.deleteProject(uuid);         // void, audits conservés
await manager.countProjects({ status: 'archived' });

// Stockage d'un audit rattaché à un projet :
new AuditRepository(connection).store(report, { projectId: uuid });
// Ressource rattachée :
manager.addResource({ type: 'article', title, tags: [], projectId: uuid });
```

Contrats : `IProjectManager` (async, `src/business/project-manager.types.ts`),
`ProjectRepository` (`src/data/repositories/project-repository.ts`),
schémas Zod `ProjectSchema` / `CreateProjectSchema` / `UpdateProjectSchema` /
`ProjectFiltersSchema` (`src/shared/validators.js`).

### Types principaux

```typescript
interface Audit {
  metadata: {
    id: number; url: string; timestamp: string; overallScore: number;
    totalFindings: number; criticalFindings: number; highFindings: number;
    mediumFindings: number; lowFindings: number;
    projectId?: string | null;   // Sprint 13 : projet associé (NULL = sans projet)
  };
  dimensions: { auditId: number; dimension: DimensionName; score: number; findingsCount: number }[];
  findings: Finding[];   // versionnées par audit
}

interface Project {
  id: string;                 // UUIDv4
  name: string;               // 1-200 caractères
  description?: string | null;
  status: 'active' | 'completed' | 'archived';
  startedAt?: string | null;  // ISO 8601
  completedAt?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

interface Finding {
  auditId?: number;
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  title: string; description: string;
  severity: 0 | 1 | 2 | 3 | 4;
  effort: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendation: string;            // clé obligatoire
  references?: string[];
}
```

---

**Version :** 0.1.0 (MVP-2, périmètre MVP-3 ouvert — ADR-031) · **Dernière mise à jour :** 25 octobre 2026
