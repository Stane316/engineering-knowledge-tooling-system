# SPRINT-21-02 — Contrôle direct des noms et arguments — résultat

**Sprint parent :** [SPRINT-21](SPRINT-21.md) · **Sous-sprint :** [SPRINT-21-02](SPRINT-21-02.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `64abd6e` · **Commit d'implémentation :** _à renseigner_ · **Statut :** ✅ C-P02, C-P03 et C-P08 satisfaits et mesurés ; un écart de code au niveau protocole déclaré (§ 7, E21-1).

## 1. Objectif

Refuser chaque nom hors profil par appel **direct** avec arguments valides et
préconditions suffisantes ; vérifier que les trois outils autorisés continuent
de fonctionner ; exiger un mode `fts` explicite sous profil de lecture, refusé
**avant** l'injection du défaut `hybrid`, le fournisseur d'embeddings et le
réseau.

## 2. Tests écrits avant le code

| Fichier | Niveau | Cas | Critère |
| --- | --- | ---: | --- |
| `tests/mcp/profile-refusals.test.ts` | I | 8 | C-P02 (4), C-P03 (4) |
| `tests/mcp/profile-fts-mode.test.ts` | U | 8 | C-P08 (6), non-régression (2) |
| `tests/mcp/integration/stdio-profile.test.ts` (étendu) | E2E | +6 | C-P02, C-P08 sur le binaire |
| `tests/mcp/helpers.ts` (modifié) | — | — | injection d'un fournisseur espion |

**Total** : 22 cas nouveaux, aucun fournisseur réel, aucune clé, aucun réseau.

### 2.1 RED comportemental (verbatim)

```text
npx vitest run tests/mcp/profile-fts-mode.test.ts tests/mcp/profile-refusals.test.ts
→ PASS  C-P02 — refuse 14/14 par la politique, jamais par une entrée invalide
→ PASS  C-P03 — les trois outils répondent (3/3)
→ FAIL  2/4 — mode omis : refusé, jamais comblé par le défaut « hybrid »
        AssertionError: expected true to be false // Object.is equality
→ FAIL  3/4 — « hybrid » : refusé avant le fournisseur
        AssertionError: expected true to be false // Object.is equality
→ FAIL  4/4 — « vector » : refusé avant le fournisseur
        AssertionError: expected true to be false // Object.is equality
→ FAIL  les quatre variantes ont consommé 0 appel d'embeddings et 0 accès réseau
        AssertionError: expected [ { case: 'mode omis', …(2) }, …(2) ] to deeply equal []
  Tests  4 failed | 14 passed (18)
```

Les quatre échecs disent la même chose : **le mode était accepté**. `2/4`
échouait sur `expected true to be false` — l'appel rendait un résultat au lieu
d'un refus —, ce qui est le comportement attendu avant correctif : le défaut
`hybrid` s'appliquait, le fournisseur factice répondait, et un `vector`
explicite passait aussi.

Les cas C-P02 et C-P03 étaient **déjà GREEN** grâce à la garde livrée en 21-01.
Ils ne sont pas un RED : le dossier les range explicitement dans « les cas déjà
conformes peuvent être GREEN et doivent le rester ». Ils ont été écrits avant
tout nouveau code et mesurés d'abord.

### 2.2 Un correcting de mesure, déclaré

Deux cas mesuraient `embeddings.calls` sans remettre le compteur à zéro après
le semis des fixtures : ils échouaient sur `expected 3 to be +0`, c'est-à-dire
sur mes propres appels d'insertion, pas sur le comportement visé. La fenêtre de
mesure a été déplacée **après** les préconditions ; l'oracle (zéro appel) est
inchangé. Ce correctif précède l'implémentation et est sans effet sur elle.

### 2.3 GREEN

```text
tests/mcp/profile-fts-mode.test.ts            → 8 passed (8)
tests/mcp/profile-refusals.test.ts            → 8 passed (8)
tests/mcp/integration/stdio-profile.test.ts  → 9 passed (9)
suite tests/mcp complète                      → 213 passed (213), 28 fichiers
npm run verify                                → EXIT 0, 1 813 passed | 38 skipped
```

## 3. Critères

### C-P02 — refus direct : 14/14

| # | Nom appelé | Arguments fournis | Précondition | Réponse |
| ---: | --- | --- | --- | --- |
| 1 | `validate_resource` | `data` conforme au schéma | — | `-32601`, profil `read` |
| 2 | `inspect_site` | `url`, `level: L3` | — | `-32601` |
| 3 | `audit_history` | `limit: 10` | — | `-32601` |
| 4 | `audit_report` | `audit_id: 1`, `format` | audit absent | `-32601` |
| 5 | `create_project` | `name` | — | `-32601` |
| 6 | `list_projects` | `limit: 10` | — | `-32601` |
| 7 | `get_project` | UUID réel | **projet créé** | `-32601` |
| 8 | `delete_project` | UUID réel | **projet créé** | `-32601` |
| 9 | `get_timeline` | UUID réel | **projet créé** | `-32601` |
| 10 | `search_best_practices` | `query`, `limit` | — | `-32601` |
| 11 | `add_best_practice` | `title`, `description`, `category` | — | `-32601` |
| 12 | `get_recommendations` | UUID réel | **projet créé** | `-32601` |
| 13 | `list_templates` | `limit` | — | `-32601` |
| 14 | `apply_template` | `template_id`, `project_name`, `project_url` | **template lu** | `-32601` |

Preuves : `100 %` des appels portent `code: -32601` et `data.profile === 'read'`,
**aucun** ne porte `-32602`. État logique comparé avant/après (identifiants et
nombre de ressources, `indexed`, projets, audits, bonnes pratiques, templates) :
**identique**. Le projet canari est toujours présent — `delete_project` n'a rien
supprimé. `0` appel d'embeddings, `0` appel réseau (`fetch` remplacé par un
compteur qui échoue).

Un **faux nouvel outil** (`outil_fantome_2027`, inexistant dans les 17) est
aussi refusé `-32601` par la politique : le refus est bien le défaut, pas une
liste tenue à la main.

### C-P03 — outils autorisés : 3/3

| Outil | Entrée | Réponse | Effet |
| --- | --- | --- | --- |
| `search_knowledge` | `query: "SQLite"`, `mode: "fts"` | `mode: "fts"`, `count ≥ 1` | aucun |
| `get_resource` | identifiant d'une ressource semée | ressource identique (id, titre) | aucun |
| `list_resources` | `{}` | `count: 3` | aucun |

`list_resources` filtré (`type: "video"`) rend **exactement** le même résultat
sous profil `read` et sous profil `full` : l'autorisation ne modifie pas le
contrat. Aucun effet métier, aucun appel d'embeddings, aucun réseau.

### C-P08 — mode réseau : 1/1 permis, 3/3 refusés

| Variante | Résultat | Appels d'embeddings | Réseau |
| --- | --- | ---: | ---: |
| `fts` explicite | ✅ recherche FTS (0 résultat, succès) | 0 | 0 |
| mode omis | ❌ `-32602`, `data.requiredMode: "fts"` | 0 | 0 |
| `hybrid` | ❌ `-32602`, idem | 0 | 0 |
| `vector` | ❌ `-32602`, idem | 0 | 0 |

Non-régression sous profil complet : mode omis ⇒ `mode: "hybrid"` (défaut
historique conservé, fournisseur sollicité comme avant) ; `fts` explicite ⇒
`mode: "fts"`, **0** appel de fournisseur. Aucune conversion de mode.

Deux gardes de plus : `{ query: "", mode: "fts" }` échoue sur la requête
(`-32602` sans `requiredMode`) — le contrôle de mode ne masque pas la
validation ordinaire — et `mode: "FTS"` (casse inattendue) est refusé.

## 4. E2E — binaire, entrées brutes

Six cas sur `dist/mcp/server.js` avec `EKTS_MCP_PROFILE=read`, paramètres
écrits à la main (aucun client SDK pour réparer une omission) :

| Cas envoyé | Réponse observée |
| --- | --- |
| `list_projects` + `{limit: 5}` | `isError`, `MCP error -32602: Tool list_projects not found` |
| `inspect_site` + URL valide | `isError`, `… not found` (aucune tentative réseau) |
| `search_knowledge` + `{query}` | `isError`, `-32602`, `data {profile:"read", requiredMode:"fts"}` |
| `search_knowledge` + `mode: hybrid` / `vector` | `isError`, `-32602`, idem |
| `search_knowledge` + `mode: fts` | succès `{mode:"fts", count:0}` |
| `outil_fantome_2027` | `isError`, `… not found` |

Dans ce contexte sans clé, un défaut `hybrid` aurait produit **`-32603`**
(erreur d'embeddings) : le `-32602` observé identifie bien le refus de politique.

### 4.1 Correction d'oracle, déclarée

La première rédaction du test E2E attendait un objet `error` JSON-RPC. Le
serveur — et le SDK — renvoient les erreurs d'outil comme un **résultat**
`{ isError: true, content: [{ type: "text", text }] }`. Cinq cas ont donc
échoué sur `expected { Object (content, isError) } to be undefined` : c'était
une erreur sur **l'emplacement** de l'erreur, pas sur le comportement observé.
L'oracle a été corrigé sur ce seul point ; les assertions de refus (code,
`data.requiredMode`, absence de résultat exploitable) sont inchangées. Le
détail est consigné ici parce qu'un changement d'oracle doit être justifié.

## 5. Mesures finales

```text
npm run verify → EXIT=0
  typecheck 0 erreur · lint 0 erreur · format conforme · build succès
  tests      : 1 813 passed | 38 skipped (1 851)
  fichiers   : 151 passed | 6 skipped (157)
  couverture : statements 96,04 % · branches 89,44 % · fonctions 97,42 % · lignes 96,18 %
  src/mcp/profiles.ts        : 100 % / 100 % / 100 % / 100 %
  src/mcp/handlers/tools.ts  : 82,35 % statements · 94,73 % branches · 86,66 % lignes
```

## 6. Modification de production (une seule)

`src/mcp/handlers/tools.ts` : lecture du mode dans les **arguments bruts**
(`readRequestedMode`) et refus (`assertExplicitFtsMode`) placé **entre** la
garde de nom et le `switch`, donc avant `parse` et l'injection du défaut. Plus
la correction d'un commentaire périmé (« quatorze outils » → « dix-sept »).

Aucune modification de schéma, de migration, de dépendance ou de contrat HTTP.

## 7. Écarts déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E21-1** | Au **niveau protocole**, un outil masqué n'étant pas enregistré, le SDK répond `-32602 « Tool <nom> not found »`, pas `-32601`. Le `-32601` décidé par le propriétaire s'applique au chemin d'exécution direct | Mesuré sur le binaire (§ 4). C-P02 accepte un refus « à cause du profil **ou de l'absence de l'outil** ». Rendre `-32601` au protocole exigerait soit de remplacer le gestionnaire `tools/call` du SDK (accès à ses internes), soit de reconstruire `tools/list` à la main — deux options écartées sans accord. **Décision humaine souhaitée** |
| **E21-2** | Un nom **connu mais masqué** et un nom **inexistant** produisent la même réponse protocole (`not found`) | Conséquence directe d'E21-1, et non un problème d'information : dans les deux cas l'outil n'existe pas dans la session. Distinguer exigeraital de garder les outils enregistrés mais masqués à la liste |
| **E21-3** | `audit_report` est appelé avec un `audit_id` valide mais sans audit existant | La précondition est délibérément absente : si la garde manquait, l'erreur serait `-32000` « introuvable », qui fait aussi échouer l'assertion `-32601`. Aucune confusion possible avec un refus de politique |
| **E21-4** | Le compteur d'embeddings a dû être remis à zéro après le semis (§ 2.2) | Correctif de mesure, oracle inchangé, antérieur à l'implémentation |
| **E21-5** | L'oracle E2E a été corrigé sur la forme de la réponse (§ 4.1) | Déclaré ; assertions de refus identiques |

## 8. Limites et non-prouvé

- **`0 accès réseau`** est prouvé par substitution de `fetch` et par un
  fournisseur factice. Ce n'est pas une capture réseau au niveau de l'OS.
- **Le profil n'est pas une sandbox** : inchangé depuis 21-01.
- C-P05 (effets au démarrage), C-P06/C-P07 (confinement, injection) restent
  hors de ce sous-sprint : ils sont au 21-03.
- **CI distante** non observée ; les nouveaux tests entrent dans le job
  `npm test` existant, sans clé ni fournisseur.
- **38 cas** navigateur/PDF toujours ignorés, inchangés.

## 9. Commandes exactes

```powershell
npx vitest run tests/mcp/profile-refusals.test.ts
npx vitest run tests/mcp/profile-fts-mode.test.ts
npm run build
npx vitest run tests/mcp/integration/stdio-profile.test.ts
npx vitest run tests/mcp
npm run verify
```

## 10. Suite

**21-03** (C-P05, C-P06, C-P07, C-O01) : effets au démarrage (migrations,
templates, WAL/SHM), confinement hôte/OS, injection T06. **C-P06/C-P07 sont les
deux points explicitement reportés à l'entrée de 21-03** par le propriétaire :
ils seront reposés avant d'écrire le premier test du sous-sprint.
