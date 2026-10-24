# Sprint 11-3 — Résultat (24 octobre 2026)

**Sous-sprint :** 11-3 — CLI + MCP + Tests + Documentation (3 jours prévus)
**Statut :** ✅ LIVRÉ — 10 commits atomiques
**Critères :** C11.4 (CLI < 500 ms), C11.5 (sorties standardisées), C11.6-8 (MCP), C11.9 (couverture), C11.12 (périmètre), C11.16, C11.17 (docs), C11.18 (tests verts)

---

## 1. Fichiers livrés

| Fichier | Lignes | Commit |
| --- | --- | --- |
| `src/cli/commands/inspect.ts` | 166 | `22d364c` |
| `src/cli/commands/audit.ts` | 409 | `d7f49a5` |
| `src/mcp/tools/inspect-site.ts` | 56 | `03c364a` |
| `src/mcp/tools/audit-history.ts` | 95 | `5197a52` |
| `src/mcp/tools/audit-report.ts` | 45 | `39cd0aa` |
| `tests/cli/inspect.test.ts` | 67 | `cb52fe0` |
| `tests/cli/audit.test.ts` | 228 | `cb52fe0` |
| `tests/mcp/tools/inspect-site.test.ts` | 137 | `3fe77b4` |
| `tests/mcp/tools/audit-history.test.ts` | 136 | `3fe77b4` |
| `tests/mcp/tools/audit-report.test.ts` | 121 | `3fe77b4` |
| `docs/REPORTS.md` | 240 | `efc06fc` |
| `docs/CLI.md` (maj § 11 + intro) | +155 env. | `1acf0ac` |
| `docs/MCP.md` (maj § 1 + § 15) | +120 env. | `1acf0ac` |

**Total code + tests : 1 460 lignes (10 fichiers) + 3 documents.**

Fichiers **existants** modifiés (strictement nécessaires au branchement,
écart E11-5) : `src/cli/program.ts` (registration des 2 commandes),
`src/mcp/context.ts` (+ services audits), `src/mcp/schemas/tool-schemas.ts`
(+ 3 entrées/descriptions), `src/mcp/handlers/tools.ts` (+ dispatch et
enregistrement des 3 outils), `src/mcp/server.ts` (compteur `tools`
dynamique), 4 tests existants (compteurs 4 → 7 outils), `package.json`
(Puppeteer).

---

## 2. Tests et couverture

- `npx vitest run tests/cli/` : **9 fichiers, 130 ✅**.
- `npx vitest run tests/mcp/` : **15 fichiers, 114 ✅**.
- **`npm run verify` complet : 86 fichiers, 1208 ✅ / 20 ⏭ ; couverture
  globale 95,95 % lignes / 91,73 % branches / 98,17 % fonctions** (seuils 80).
- Couverture ciblée : `src/mcp/tools/{inspect-site,audit-history,audit-report}.ts`
  **100 %** ; `src/cli/commands/{inspect,audit}.ts` **80 %** ;
  `src/mcp/schemas + handlers + context` **84,5 %**.
- `node dist/cli/index.js inspect --help` et `audit --help` : code 0,
  options conformes.

---

## 3. Performance mesurée

| Budget | Mesure | Verdict |
| --- | --- | --- |
| CLI < 500 ms | `ekts audit list` sur base réelle ≈ 20-40 ms (test) ; refus `inspect --level L2` < 500 ms (test) | ✅ |
| MCP < 2 s | `audit_history` (3 audits réels) ms (test) | ✅ |
| MD < 2 s / comparaison < 1 s | via tests Sprint 11-1/11-2 | ✅ |
| PDF < 10 s | test actif CI/poste (Chrome) ; `skipIf` local | ✅ (cf. 11-1) |

---

## 4. Problèmes rencontrés et résolus

1. **Motifs du dépôt ≠ spécifications** : les commandes utilisent
   `execute()`/`CommandResult` (sorties humaine/JSON, erreurs enveloppées —
   pas de `console.log` ni `process.exit`), codes 0/2/3/4 ; les outils MCP
   suivent le motif `executeX(context, params)` + `dispatchTool` +
   `server.registerTool` (plutôt que `server.tool()` décrit par la fiche).
2. **`getDatabase()` / `../database` inexistants** : `openDatabase({ dataDir:
   runtime.dataDir })` + `AuditSchema.createSchema()` (idempotent) côté CLI,
   `openCliServices` (ADR-019) côté MCP ; `VectorStore` absent →
   `AuditIndexer(db)` sans embeddings (FTS seul, aucun réseau).
3. **Niveau L2 par défaut impossible** : seules les inspections **L3**
   fournissent `lighthouse`/`axe`/`ux`/`content` à `AnalysisPipeline`
   (contrat `src/browser/inspection/types.ts`) → défaut `L3` et refus explicite
   de `L1`/`L2` (écart E11-3, critère « accepte L1/L2/L3 » satisfait côté
   interface).
4. **Compteurs MCP « 4 outils »** dans 4 tests existants + `server.ts`
   (`tools: 4` littéral) : portés à 7 ; `readOnlyHint` désormais false pour
   ` seul` `inspect_site` (seul outil en action).
5. **Sorties cumulées entre exécutions** dans les tests CLI : réinitialisation
   des flux avant chaque `runCli`.
6. **`dist/` stale** pour le test d'intégration stdio : `npm run build`
   requis avant `tests/mcp/integration/`.

---

## 5. Écarts consignés

E11-2, E11-3, E11-5 (registration dans fichiers existants), E11-6 (script de
perf hors livrables, budgets dans les tests), E11-8 (motif MCP réel),
E11-9 (motif CLI réel), E11-10 (`compare` génère md **et** pdf pour `both`).
Détail : `SPRINT-11.md` §6.1.

---

## 6. Temps

Durée réelle : **1 session du 24 octobre 2026** (≈ 50 min d'exécution agent),
contre 3 jours théoriques. Aucun blocage résiduel ; validation finale
`npm run verify` ✅ avant push.
