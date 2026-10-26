# Extension MVP-3

> Pas-à-pas pour étendre EKTS en respectant les conventions maison
> accumulées des Sprints 1 à 17. **ADR-043** : les patterns de base
> (repository, service, commande) sont seulement référencés ici — les
> sources d'exemple restent dans les modules existants.

## 1. Structure d'un nouveau module

```
src/<module>/
├── <module>.types.ts          # types d'entrées/sorties (pas de any)
├── <module>-repository.ts     # accès SQLite (better-sqlite3, synchrone)
├── <module>-service.ts        # orchestration (façade)
└── …                          # composants spécifiques (engine, analyzer…)
```

Exemples vivants : `src/templates/`, `src/best-practices/`,
`src/recommendations/`, `src/timeline/` (voir
[`MVP3_ARCHITECTURE.md`](MVP3_ARCHITECTURE.md)).

## 2. Types

```typescript
// <module>.types.ts — interfaces publiques, JSDoc sur chaque entité
export interface MonEntite {
  id: string;              // UUID v4 pour les entités persistées
  createdAt: string;       // ISO 8601
}

export interface CreateMonEntiteInput {
  name: string;            // bornes validées à l'entrée
}
```

Conventions maison : `noUncheckedIndexedAccess` → accès indexés avec
`!` après garde ou variable intermédiaire ; `String(x ?? '')` jamais
`String(x)` sur un éventuel `undefined`.

## 3. Repository

```typescript
// <module>-repository.ts — lire src/templates/template-repository.ts
export class MonModuleRepository {
  constructor(private readonly db: Database) {}   // better-sqlite3, synchrone

  create(input: CreateMonEntiteInput): MonEntite { /* INSERT … RETURNING */ }
  getById(id: string): MonEntite | null { /* SELECT puis mappage null-safe */ }
  list(filters: MonFilters): MonEntite[] { /* WHERE dynamique + pagination */ }
  delete(id: string): void { /* DELETE */ }
}
```

Règles maison :
- **Synchron** (better-sqlite3) — aucune `Promise` dans la couche données.
- Connexion via `openDatabase({ dataDir })` → wrapper `EktsDatabase`
  (`.connection` porte l'objet better-sqlite3).
- Requêtes préparées uniquement ; jamais de `template tags` en SQL JSON
  (filtres post-requête, ADR-039).

## 4. Migration

```typescript
// src/data/migrations/009_create_mon_module.ts
// (P3 : le spec parlait de src/storage/migrations/ — répertoire maison réel)
export function migration009CreateMonModule(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS mon_module (
    id TEXT PRIMARY KEY,
    … CHECK (…) …
  );`);
  db.exec(`CREATE INDEX IF NOT EXISTS … ;`);
}
```

Puis **deux enregistrements obligatoires** :

1. `src/data/migrations/index.ts` → `{ version: 9, name: 'mon_module', up: migration009CreateMonModule }`
2. Tests qui assertent `user_version` : `tests/integration/database.test.ts`,
   `tests/cli/cli.test.ts`, `tests/cli/program.test.ts`,
   `tests/integration/project-migration-003.test.ts`.

`npm run build` avant de conclure (sinon `dist/` périmé).

## 5. CLI

```typescript
// src/cli/commands/mon-module.ts — lire src/cli/commands/template.ts
export function registerMonModuleCommand(program: Command): void {
  const cmd = program.command('mon-module').description('…');
  cmd.command('list').option('--json').action((opts) => { … });
  cmd.command('create <name>').action((name) => { … });
}
```

Puis enregistrer dans `src/cli/program.ts` (registre des 15 commandes
racine). Contrat de sortie maison (`exitCodeFor` **exporté par
`src/cli/program.ts`**, pas `shared/errors.ts`) :

| Code | Cas |
|------|-----|
| 0 | succès (y compris régénération implicite, aucune alerte…) |
| 1 | refus de confirmation (`-f`, `--yes`) |
| 2 | usage erroné (commande/option inconnue, argument manquant) |
| 3 | ressource introuvable (`NOT_FOUND`) |
| 4 | entrée invalide (`VALIDATION_FAILED`, `ValidationError`) |

Sorties : humain par défaut, `--json` = **stdout JSON pur** (les
messages `✅ …` disparaissent), erreurs sur **stderr** + code ci-dessus.

## 6. MCP

```typescript
// src/mcp/tools/mon-outil.ts — schéma Zod + handler typé McpErrorCode
export function registerMonOutil(server: McpServer): void {
  server.registerTool('mon_outil', { /* inputSchema Zod */ }, handler);
}
```

Enregistrement dans `src/mcp/tools/index.ts` :
- lecture seule → `readOnly: true` ;
- écriture → ajouter au registre `WRITING_TOOLS` (politiques,
  [`MCP.md`](MCP.md)).
- Mettre à jour le catalogue de 17 outils : [`MCP.md`](MCP.md),
  [`API_REFERENCE.md`](API_REFERENCE.md) § MCP,
  [`MVP3_GUIDE.md`](MVP3_GUIDE.md), `.mcp.json` si besoin.

## 7. Tests

- Unitaires : `tests/<module>/*.test.ts` (couverture module **> 80 %**,
  projet > 90 %) ;
- Service/CLI : fixtures isolées (bacs à sable `EKTS_DATA_DIR`, titres
  non collants avec les builtins) ;
- E2E : `tests/e2e/mvp3/<module>.test.ts` via le helper
  [`tests/e2e/mvp3/helpers.ts`](../tests/e2e/mvp3/helpers.ts)
  (`runCli` sur `dist/cli/index.js`, `seedAudit` SQL) — budgets :
  suite E2E < 120 s ;
- MCP : `tests/mcp/` (fermeture obligatoire des serveurs, délai 20 s).

## 8. Bonnes pratiques maison

1. **Typage strict** — pas de `any` ; erreurs métier typées
   (`ValidationError` → 4, ressources → 3).
2. **Injection** — constructeurs avec dépendances explicites
   (`new Repository(db)`, services qui ouvrent leurs dépôts).
3. **Validation aux frontières** — Zod dans les outils MCP, validation
   explicite dans les commandes CLI (messages `Validation échouée : …`).
4. **Idempotence** — seeds et migrations rejouables ; règles
   « régénération implicite » plutôt que code d'erreur.
5. **JSDoc** — sur tous les exports publics (contrôlé par ESLint).
6. **Documentation** — guide ou section mise à jour dans le même commit
   ; décisions dans le registre (ADR) ; écarts de spec **soumis, jamais
   résolus silencieusement** (P3).
7. **Build avant verdict** — `npm run build` puis `npm test` ;
   `npm run verify` = 0 avant chaque push.

## 9. Patterns récurrents (sources d'exemple)

| Pattern | Exemple maison |
|---|---|
| Repository CRUD + filtres | `src/templates/template-repository.ts` |
| Service orchestrateur + seed idempotent | `src/templates/template-service.ts` |
| Applier transactionnel | `src/templates/template-applier.ts` |
| Engine de score | `src/recommendations/recommendation-engine.ts` |
| Extraction sur historique | `src/best-practices/best-practice-extractor.ts` |
| Commande CLI multi-niveaux | `src/cli/commands/timeline.ts` |
| Outil MCP lecture/écriture | `src/mcp/tools/apply-template.ts` |
| E2E execFile + seed SQL | `tests/e2e/mvp3/helpers.ts` |

---

**Sprint 18-02 (MVP-3, ADR-043)** · 26 octobre 2026
