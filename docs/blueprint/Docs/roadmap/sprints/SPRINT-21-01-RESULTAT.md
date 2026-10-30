# SPRINT-21-01 — Inventaire et exposition du profil — résultat

**Sprint parent :** [SPRINT-21](SPRINT-21.md) · **Sous-sprint :** [SPRINT-21-01](SPRINT-21-01.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `3eceac0` · **Commit d'implémentation :** _à renseigner_ · **Statut :** ✅ C-P01 et C-P04 satisfaits et testés ; 38 cas d'environnement toujours ignorés.

## 1. Décisions humaines reçues avant le code

| # | Question | Réponse retenue (30/10/2026) |
| --- | --- | --- |
| 1 | Sélection du profil et comportement en son absence | **Variable `EKTS_MCP_PROFILE` (`read`/`full`), absence = `full`** — compatibilité historique intégrale ; valeur vide, malformée ou inconnue refusée |
| 2 | Code d'erreur d'un outil refusé par la politique | **`-32601` MethodNotFound** |
| 3 | C-P06/C-P07 (sandbox, exposition agent) | Traiter 21-01 et 21-02, **reposer la question à 21-03** |

## 2. Inventaire réel constaté avant correction

| Élément | Constat | Preuve |
| --- | --- | --- |
| Nombre d'outils | **17**, et non 11 comme l'affirmaient `docs/MCP.md` et `AGENTS.md` | `TOOL_DEFINITIONS` (17 entrées), `tests/mcp/handlers/tools.test.ts:14`, `tests/mcp/server.test.ts:366` |
| Annotations | 12 `readOnlyHint: true`, 5 actions ; `get_recommendations` est annoté en lecture et **écrit** | `src/mcp/handlers/tools.ts` |
| Profil | **Aucun mécanisme n'existait** : `registerTools` enregistrait les 17 sans condition, `dispatchTool` les acceptait tous | `src/mcp/handlers/tools.ts` avant correction |
| Piège du mode | `SearchKnowledgeInput.mode` vaut `.default('hybrid')` **au niveau Zod** | `src/mcp/schemas/tool-schemas.ts:40` — traité au 21-02 |

## 3. Tests écrits avant le code

### 3.1 RED (verbatim)

```text
npx vitest run tests/mcp/profile-exposure.test.ts
→ FAIL C-P01 — 1/3 — le profil de lecture expose exactement les trois outils autorisés
  AssertionError: expected [ 'search_knowledge', …(16) ] to deeply equal [ 'search_knowledge', …(2) ]
  FAIL C-P04 — 1/4 — un profil inconnu refuse le démarrage du serveur
  AssertionError: promise resolved "{ server: McpServer{ …(10) }, …(3) }" instead of rejecting
  FAIL C-P04 — 2/4 — une politique vide est refusée plutôt que d'exposer zéro ou tout
  AssertionError: expected [Function] to throw an error
  FAIL C-P04 — 3/4 — une valeur vide ou malformée n'active pas silencieusement le profil complet
  AssertionError: promise resolved "{ server: McpServer{ …(10) }, …(3) }" instead of rejecting
  FAIL C-P04 — 4/4 — un appel direct à un outil masqué est refusé par la politique
  AssertionError: expected { count: +0, projects: [] } to match object { code: -32601 }
  Tests 5 failed | 2 passed (7)

npx vitest run tests/mcp/integration/stdio-profile.test.ts
→ FAIL expose trois outils quand le profil de lecture est demandé
  AssertionError: expected [ 'search_knowledge', …(16) ] to deeply equal [ 'search_knowledge', …(2) ]
  FAIL refuse de démarrer sur un profil inconnu
  AssertionError: expected +0 not to be +0 // Object.is equality
  Tests 2 failed | 1 passed (3)
```

Les **trois** cas déjà GREEN sont des gardes de non-régression, pas des preuves
de correctif : profil complet (17), absence de profil (17), et compatibilité du
binaire sans variable. Le cas 2/4 était « `expected [Function] to throw an
error` » : la politique vide exposait silencieusement zéro outil, ce qui aurait
été un serveur muet présenté comme sûr.

### 3.2 GREEN

```text
tests/mcp/profile-exposure.test.ts        → 7 passed (7)
tests/mcp/integration/stdio-profile.test.ts → 3 passed (3)
tests/mcp/profiles.test.ts (ajouté après) → 12 passed (12)
suite tests/mcp complète                  → 177 passed (177), 25 fichiers
npm run verify                            → EXIT 0, 1 789 passed | 38 skipped, 149 fichiers
```

## 4. Mesures finales (exécutées)

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests      : 1 789 passed | 38 skipped (1 827)
  fichiers   : 149 passed | 6 skipped (155)
  couverture : statements 96,05 % · branches 89,43 % · fonctions 97,41 % · lignes 96,19 %
  src/mcp/profiles.ts : 100 % statements, 100 % branches, 100 % fonctions, 100 % lignes
```

## 5. Critères

| Critère | Statut | Preuve |
| --- | --- | --- |
| **C-P01 / P01 — découverte** | ✅ **3/3, 0 autre** | `profile-exposure.test.ts` 1/3 : `tools/list` rend exactement `search_knowledge`, `get_resource`, `list_resources` sous profil `read` ; `stdio-profile.test.ts` reproduit la mesure sur le **binaire** réel |
| **C-P04 / P02 — échec fermé** | ✅ **4/4** | 1/4 profil inconnu → refus de démarrage ; 2/4 politique vide → refus à la construction ; 3/4 valeur vide/malformée → refus ; 4/4 appel direct à `list_projects` sous profil `read` → `-32601`. Aucune bascule silencieuse dans les quatre cas |

Politique et liste capturées : `MCP_PROFILES` (`src/mcp/profiles.ts`), rendues
par les assertions `toEqual([...READ_TOOL_NAMES])` et
`toHaveLength(17)`.

## 6. Fichiers (9)

**Source (4)** : `src/mcp/profiles.ts` (**nouveau**, 185 lignes), `src/mcp/server.ts`,
`src/mcp/handlers/tools.ts`, `src/mcp/utils/errors.ts`.

**Tests (3)** : `tests/mcp/profile-exposure.test.ts` (**nouveau**),
`tests/mcp/integration/stdio-profile.test.ts` (**nouveau**),
`tests/mcp/profiles.test.ts` (**nouveau**).

**Documents (2)** : `docs/MCP.md` (§ 1.1 Profil d'exposition, table des 17
outils corrigée), `AGENTS.md` (§ 5 et variables d'environnement).

## 7. Écarts déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E21-1** | Le code de refus `-32601` est produit par la **couche de politique** (`dispatchTool`). Au niveau protocole, un outil non enregistré reçoit d'abord la réponse du SDK : `-32602` « Tool X not found » | Refus dans les deux cas, mais code différent. Forcer `-32601` au niveau protocole exigerait de réécrire le gestionnaire `tools/call` du SDK — risque élevé sur les 17 contrats pour un gain de forme. **Déclaré, décision humaine possible** |
| **E21-2** | `src/mcp/handlers/tools.ts` affiche 445 lignes de diff, dont la quasi-totalité est de la réindentation (17 blocs enveloppés dans `if (allows(...))`) | `git diff -w` : **92 insertions, 19 suppressions**. Le filtrage à l'enregistrement est préféré à un retrait après coup (fail-closed par construction) |
| **E21-3** | `EKTS_MCP_PROFILE` absent ⇒ profil `full` (décision 1) | Le cas C-P04 « politique absente si obligatoire » est couvert autrement : une politique **vide** est refusée à la construction. Les deux notions sont distinctes et documentées |
| **E21-4** | `tests/mcp/profiles.test.ts` est un **GREEN initial** (écrit après le module) | Il couvre des branches internes (casse, espaces, outil inexistant, ordre) que l'intégration n'atteint pas. Il ne remplace aucun RED ; le RED du sous-sprint est celui du § 3.1 |
| **E21-5** | `docs/ROADMAP.md` (l.345) liste encore « Sprint 21 — Commentaires + actions sur les constats », plan MVP-3 périmé | **Contradiction déclarée, non corrigée** : la roadmap historique relève d'un arbitrage séparé (elle ne doit pas être réécrite sans accord selon la spec 21 § 1.3) |

## 8. Limites et non-prouvé

- **Le profil n'est pas une sandbox.** Il restreint l'exposition et l'exécution
  côté serveur ; il ne limite ni les fichiers, ni le réseau, ni les autres
  processus. Dit explicitement dans `docs/MCP.md` § 1.1.
- **`get_recommendations`** est annoté en lecture et peut écrire : hors profil
  `read`, ce comportement reste inchangé. Constaté, non corrigé ici (21-03).
- **Écritures techniques au démarrage** (schémas, templates, WAL) : mesurées au
  21-03, pas encore.
- **CI distante** : non observée. Les nouveaux tests sont raccordés au job
  `npm test` existant (`.github/workflows/ci.yml` l.51), qui ne demande aucune
  clé ni fournisseur.
- **38 cas** navigateur/PDF restent ignorés, inchangés.

## 9. Commandes exactes

```powershell
npx vitest run tests/mcp/profile-exposure.test.ts
npx vitest run tests/mcp/integration/stdio-profile.test.ts
npx vitest run tests/mcp/profiles.test.ts
npm run build
npm run verify
```

## 10. Suite

**21-02** (C-P02, C-P03, C-P08) : refus des 14 noms non autorisés par appel
direct avec arguments valides, trois outils autorisés fonctionnels, `mode: fts`
explicite exigé avant injection du défaut, compteur d'appels d'embeddings à
zéro. Prérequis : 21-01 livré, critères C-P01 et C-P04 vérifiés — **satisfaits**.
