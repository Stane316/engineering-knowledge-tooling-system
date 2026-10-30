# SPRINT-20-02 — Preuves minimales et reprise partielle — résultat

**Sprint parent :** [SPRINT-20](SPRINT-20.md) · **Sous-sprint :** [SPRINT-20-02](SPRINT-20-02.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `ba54632` · **Statut :** ✅ C-W09 et C-W11 satisfaits et testés ; ✅ C-W12 re-vérifié (livré au 19-02) ; 38 cas d'environnement toujours ignorés.

## 1. Décisions humaines reçues avant code

| # | Question | Réponse retenue |
| --- | --- | --- |
| C-W09 | Où vit la preuve ? | **Migration 011** : `rule`, `elements_json`, `nodes_count`, `engine_version` sur `audit_findings`, additives et nullables |
| C-W11 | Comportement en échec partiel | **Signaler + code de sortie non nul**, avec la reprise `ekts audit report <id>` |

## 2. Défauts réels constatés avant correction

| # | Défaut | Preuve |
| --- | --- | --- |
| 1 | axe-core ne conservait **que le nombre** de nœuds (`raw.nodes?.length ?? 0`) : ni sélecteur, ni version de moteur | `src/browser/axe.ts` avant correction |
| 2 | `nodes: 0` **fabricait** une information : « aucun nœud » et « non fourni » étaient confondus | assertion `expected +0 to be undefined` au premier GREEN partiel |
| 3 | `audit_findings` n'avait **aucune colonne** de preuve | `src/storage/schema.ts` |
| 4 | Un échec PDF après stockage produisait `Erreur : Chromium introuvable` — **rien** n'indiquait que l'audit et le Markdown existaient | test C-W11, sortie verbatim |

## 3. Tests écrits avant le code

### 3.1 RED (verbatim)

```text
npx vitest run tests/analysis/evidence-chain.test.ts
→ FAIL capture la version du moteur… — expected undefined to be '4.10.2'
  FAIL conserve les sélecteurs… — expected undefined to deeply equal [ '#main .btn', 'nav a' ]
  FAIL relie le constat à ses éléments… — expected undefined to deeply equal [ '#main .btn', 'nav a' ]
  FAIL persiste puis restitue la preuve… — expected undefined to deeply equal [ '#main .btn', 'nav a' ]
  Tests 4 failed (4)

npx vitest run tests/cli/inspect.test.ts
→ FAIL signale les artefacts créés quand le PDF échoue… 
  AssertionError: expected 'Erreur : Chromium introuvable\n' to match /Audit #\d+ (stocké|enregistré)/
  Tests 1 failed | 10 passed (11)
```

Le cas « régénère un rapport depuis l'ID sans créer d'audit » était **déjà GREEN**
(`audit report <id>` n'ajoute aucun audit) : il est conservé comme garde de
non-régression, pas comme preuve d'un correctif.

### 3.2 GREEN, par étapes

```text
1er passage après capture axe : 2 passed | 2 failed (4)
  → le test a révélé que `nodesCount` valait `0` pour une violation sans nœud
  → correction : `AxeViolation.nodes` devient optionnel, `0` n'est plus fabriqué
2e passage : 4 passed (4)
CLI inspect : 11 passed (11)
Migration 011 : 5 passed (5)
```

## 4. Mesures finales (exécutées)

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests      : 1753 passed | 38 skipped (1791)
  fichiers   : 143 passed | 6 skipped (149)
  couverture : statements 95,99 % · branches 89,39 % · fonctions 97,39 % · lignes 96,17 %
```

**Incident d'environnement rencontré et corrigé** : `tests/cli/cli.test.ts`
échouait sur `expected 10 to be 11` après l'ajout de la migration 011 — `dist/`
était périmé. `npm run build` puis rejeu : `8 passed (8)`. Aucune valeur de test
n'a été modifiée pour masquer cet écart.

## 5. Critères

| Critère | Statut | Preuve |
| --- | --- | --- |
| **C-W09 / W05** | ✅ | `tests/analysis/evidence-chain.test.ts` (4) : capture de la version et des sélecteurs, absence explicite, propagation par le pont, constat porteur de `rule`/`elements`/`nodesCount`, persistance et relecture. `tests/integration/audit-migration-011.test.ts` (5) : ajout des colonnes, ligne historique intacte, idempotence, base neuve, version 11 enregistrée |
| **C-W11 / W06** | ✅ | `tests/cli/inspect.test.ts` : échec PDF → code non nul, sortie listant audit stocké, chemin Markdown, échec PDF et la reprise ; régénération depuis l'ID sans nouvel audit (comptage avant/après) |
| **C-W12 / W06+O04** | ✅ re-vérifié | `tests/storage/audit-diagnostics.test.ts` (livré 19-02) : deux fixtures historiques lisibles, incohérence signalée, **aucune** réécriture. Toujours vert dans cette exécution |

## 6. Fichiers (16)

**Source (12)** : `src/browser/axe.ts`, `src/browser/inspection/types.ts`,
`src/analysis/{types,adapter,accessibility}.ts`, `src/storage/{schema,types,audit-repository}.ts`,
`src/data/migrations/011_finding_evidence.ts` (nouveau), `src/data/migrations/index.ts`,
`src/cli/command.ts`, `src/cli/program.ts`, `src/cli/commands/inspect.ts`.

**Tests (3)** : `tests/analysis/evidence-chain.test.ts` (nouveau),
`tests/integration/audit-migration-011.test.ts` (nouveau), `tests/cli/inspect.test.ts`.

**Document (1)** : ce rapport.

## 7. Écarts déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E20-6** | Les tests C-W09 localisaient les violations par **index** ; axe trie par gravité, donc `violations[0]` était `image-alt` et non `color-contrast` | Oracle corrigé pour localiser **par identifiant** ; les assertions (sélecteurs présents / absents) sont inchangées et n'ont pas été affaiblies |
| **E20-7** | `AxeViolation.nodes` devient **optionnel** : `0` n'est plus produit quand axe ne fournit rien | Changement de contrat interne, justifié par C-W09 ; `scoreViolations` traite l'absence comme `0` **pour le calcul du score uniquement**, sans la publier comme mesure |
| **E20-8** | `CommandResult` gagne un `exitCode` optionnel et une erreur `SilentExit` reconnue par `runCli` | Nécessaire pour « signaler + code non nul » sans double message |
| **E20-9** | La migration 011 ajoute des colonnes **vides** aux constats historiques | Aucune réécriture de valeur ; l'absence de preuve reste `NULL` et sera signalée, jamais comblée |
| **E20-10** | Le message de commit du 19-03 mentionnait « 7 cas » pour la migration 010 alors que le fichier en contient **9** | Constat documentaire, historique déjà poussé et non réécrit |

## 8. Limites et non-prouvé

- **Aucun test navigateur réel** : les cas dépendant de Chromium/PDF restent
  ignorés (38 cas, 6 fichiers) ; la preuve axe est testée sur des résultats
  synthétiques conformes à la forme documentée d'axe-core.
- **`elements_json` est un JSON opaque** : aucune normalisation des sélecteurs
  n'est garantie au-delà de ce qu'axe fournit (les cibles en tableau, type
  iframe, sont volontairement ignorées).
- **Portée C-W09** : seuls les constats d'accessibilité portent aujourd'hui une
  règle et des sélecteurs ; les constats de performance portent leur mesure
  (`metric`) mais pas de sélecteur — déclaré, non inventé.
- **CI distante** : toujours non observée.

## 9. Commandes exactes

```powershell
npx vitest run tests/analysis/evidence-chain.test.ts tests/cli/inspect.test.ts tests/integration/audit-migration-011.test.ts
npm run build
npm run verify
```
