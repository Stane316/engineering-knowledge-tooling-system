# SPRINT-22-03 — FTS et statuts d'erreur — résultat

**Sprint parent :** [SPRINT-22](SPRINT-22.md) · **Sous-sprint :** [SPRINT-22-03](SPRINT-22-03.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `4daa3a5` · **Commit d'implémentation :** `7a9ea77`
**Statut :** ✅ **C-R06, C-R07, C-R08 satisfaits** · ⚠️ **C-O07 mesuré mais exploratoire** (machine de validation non choisie) — 4 écarts déclarés (§ 9).

## 1. Ce qui était en jeu

Le dossier demande trois choses distinctes, souvent confondues dans les
implémentations : que la recherche **trouve** (C-R06), que les **échecs ne se
déguisent pas** en succès vide (C-R07) et qu'un repli soit un **appel explicite**
(C-R08). Le quatrième critère (C-O07) est une mesure de latence, pas un
comportement : il dépend d'une machine que le propriétaire n'a pas encore
choisie.

Le jeu de huit requêtes était **déjà figé** dans le document 22 §3.1 avant toute
exécution ; il a été recopié sans retouche. Aucune annotation n'a été ajustée
après observation — y compris l'extra constaté sur Q06, qui est **documenté et
compté**, pas retiré.

## 2. RED comportemental (verbatim)

```text
npx vitest run tests/integration/search-error-states.test.ts \
               tests/integration/search-fallback-explicit.test.ts \
               tests/cli/search-contract.test.ts
→ × 1/5 : une requête vide est une erreur de validation, sans modification
  × 2/5 : un identifiant absent est une erreur, pas une liste vide
  × les quatre échecs portent des identités distinctes
  × refuse une requête vide en code 4, sans message de zéro résultat
  × expose l'erreur hybride en code 1, sans repli caché
  AssertionError: expected +0 to be 4
  AssertionError: promise resolved "{ query: '   ', mode: 'fts', …(3) }" instead of rejecting
  AssertionError: promise resolved "null" instead of rejecting
  AssertionError: expected 2 to be 3
  Tests  5 failed | 10 passed (15)
```

Deux de ces cinq échecs étaient des **assertions mal ciblées**, mesurées avant
toute modification de production et corrigées avec justification (§ 9, E22-11) :

- `manager.getResource()` renvoie `Resource | null` **par contrat** : l'état
  « ID absent » est produit par l'interface livrée (`collectGet`), pas par la
  primitive de stockage. L'oracle a été déplacé vers `collectGet`.
- en mode hermétique `EKTS_OFFLINE=1`, l'absence de fournisseur produit
  `Embeddings échoués : hors ligne…` et non `Aucun fournisseur disponible`. Le
  contrat mesuré est « erreur explicite, aucun résultat fabriqué », pas une
  phrase particulière.

Les **deux vrais RED** restent : requête vide acceptée en succès (intégration
**et** E2E), et par ricochet l'unicité des identités d'échec.

## 3. GREEN

```text
tests/integration/fts-corpus-queries.test.ts      → 4 passed
tests/integration/search-error-states.test.ts     → 6 passed
tests/integration/search-fallback-explicit.test.ts→ 3 passed
tests/cli/search-contract.test.ts                 → 6 passed
tests/mcp/integration/fts-latency.test.ts         → 1 passed
```

## 4. C-R06 — huit requêtes figées : ✅ 7/7 + 1/1

Base isolée, six fichiers indexés tels quels (contenu exact, provenance
admissible de 22-02), FTS, `limit: 5`. Classements **réellement observés** :

| # | Requête | Attendu | Renvoyé (dans l'ordre) | Rappel@5 | Précision@5 |
| --- | --- | --- | --- | ---: | ---: |
| Q01 | `blog` | R01 | R01 | 1/1 | 1/1 |
| Q02 | `520` | R03 | R03 | 1/1 | 1/1 |
| Q03 | `modification interface` | R04 | R04 | 1/1 | 1/1 |
| Q04 | `exceptions` | R05 | R05 | 1/1 | 1/1 |
| Q05 | `affectés` | R06 | R06 | 1/1 | 1/1 |
| Q06 | `nom accessible` | R02, R05 | **R04**, R02, R05 | 2/2 | 2/3 |
| Q07 | `INP` | R03, R05 | R03, R05 | 2/2 | 2/2 |
| Q08 | `licornequartz` | aucun | — | 1/1 (vide) | n/a |

**Rappel@5 = 1 pour les 7 positives**, Q08 est un **succès vide**. L'unique
résultat supplémentaire (Q06 → R04) est **documenté et asserté** dans le test :
il ne dégrade pas le rappel et ne peut pas être masqué par un `slice`.

La provenance reste lisible dans les résultats (`sensitivity: synthetic`,
`review.status: authorized`) : la recherche ne dépouille pas la gouvernance.

## 5. C-R07 — cinq états distingués : ✅ 5/5

| # | État | Code métier | CLI | Message / comportement |
| --- | --- | --- | ---: | --- |
| 1 | Requête vide ou blanche | `VALIDATION_FAILED` | **4** | « la requête ne peut pas être vide », aucune base ouverte (`readdir` vide) |
| 2 | Identifiant absent | `RESOURCE_NOT_FOUND` | **3** | « Ressource introuvable : … » |
| 3 | Index inaccessible | `SEARCH_FAILED` ou erreur SQLite native | **1** | `file is not a database` — erreur native conservée |
| 4 | Fournisseur hybride absent | `PROVIDER_UNAVAILABLE` | **1** | « Aucun fournisseur disponible pour « embedding »… » |
| 5 | Zéro correspondance | — | **0** | « Aucun résultat », `count: 0` |

Les quatre échecs portent des identités **distinctes** (test dédié : aucune
collision, aucun `SUCCES`). Aucun ne sort en code 0, aucun ne s'affiche
« Aucun résultat » : c'était exactement le défaut initial pour l'état 1, qui
sortait en succès avec « Aucun résultat pour «   » ».

## 6. C-R08 — repli explicite : ✅ 2/2 événements

| Événement | Mesure |
| --- | --- |
| 1. Erreur hybride | `PROVIDER_UNAVAILABLE` (intégration, env vide) ou erreur hors ligne explicite (E2E) ; **aucun résultat** n'est renvoyé sous une étiquette hybride |
| 2. FTS explicite | second appel distinct `--mode fts` : résultats servis, `mode: "fts"`, `source: "fts"` |

Deux appels hybrides successifs échouent tous les deux : l'échec n'est pas
absorbé par un repli interne. **0 succès hybride fabriqué, 0 repli caché.**

## 7. C-O07 — latence : ⚠️ mesurée, non substituable

Protocole appliqué : base R01–R06 locale, **serveur MCP compilé sur stdio**, une
connexion, **20 échauffements** puis **100 appels** répartis sur Q01–Q08, mesure
de l'envoi de `tools/call` à la réception complète.

```json
{"critere":"C-O07","statut":"exploratoire","machine":"linux",
 "os":"linux 6.1.158+ x64","cpu":"Intel(R) Xeon(R) Processor @ 2.60GHz × 2",
 "memoireGo":4,"charge1min":1.89,"node":"v22.22.3",
 "appels":100,"echecs":0,"p50":1.1,"p95":3.21,"max":22.27}
```

**p95 = 3,21 ms ≤ 500 ms**, 0 erreur technique. Mais le critère exige que la
mesure porte sur « la configuration de validation » — machine, OS et charge
**choisis et consignés par le propriétaire**. Ce choix n'existe pas encore :
le statut reste donc **exploratoire** et ne peut pas être déclaré « réussi »
pour C-O07. Les 100 durées brutes et la configuration ci-dessus sont la preuve
conservée ; la mesure sur l'hôte retenu reste à faire.

## 8. Sensibilité prouvée par mutation

Copie de sauvegarde, mutation, restauration, re-vérification (jamais
`git checkout` sur un arbre sale — leçon E22-8) :

```text
Mutation : `if (false && query.trim().length === 0)` dans collectSearch()
→ × 1/5 : une requête vide est une erreur de validation
  × les quatre échecs portent des identités distinctes
  × refuse une requête vide en code 4, sans message de zéro résultat
  Tests  3 failed | 9 passed (12)
→ restauration : 0 occurrence de `false &&`, build reconstruit
```

## 9. Mesures finales, fichiers et écarts

```text
npm run verify → EXIT=0
  typecheck 0 · lint 0 · format conforme · build OK
  tests     : 1 918 passed | 38 skipped (1 956)
  fichiers  : 165 passed | 6 skipped (171)
  couverture: statements 95,87 % · branches 89,22 % · fonctions 97,24 % · lignes 96,00 %
```

**Production (1)** : `src/cli/commands/search.ts` (`collectSearch` refuse une
requête vide avant toute ouverture de base — 6 lignes).

**Tests (5)** : `tests/integration/fts-corpus-queries.test.ts`,
`tests/integration/search-error-states.test.ts`,
`tests/integration/search-fallback-explicit.test.ts`,
`tests/cli/search-contract.test.ts`, `tests/mcp/integration/fts-latency.test.ts`.

**Documentation (2)** : `docs/CLI.md` § 3.4 (refus, codes 0/1/3/4, repli
explicite) et `docs/guides/SEARCH_ENGINE.md` (primitive `[]` conservée,
interface refusante).

**Aucune migration** : 11 fichiers inchangés, `user_version` reste 11.

| # | Écart | Traitement |
| --- | --- | --- |
| **E22-10** | Le refus de requête vide est placé à la **frontière d'interface** (CLI), pas dans `SearchEngine` | Le moteur garde son contrat historique (`[]`), couvert par trois tests existants (`fts-repository`, `search-engine`) ; le changer aurait modifié un oracle validé sans accord. MCP refuse déjà par schéma (`min(1)`). Comportement identique pour l'utilisateur : plus aucun succès vide sur entrée invalide. **À valider par le propriétaire** |
| **E22-11** | Deux oracles corrigés **avant** toute modification de production (§ 2) | Justifié par le contrat `Resource \| null` de `getResource` et par le mode hermétique `EKTS_OFFLINE=1` ; aucune assertion affaiblie, les deux RED réels conservés |
| **E22-12** | C-O07 non déclarable « réussi » | Machine de validation non choisie par le propriétaire ; mesure locale consignée, statut exploratoire conservé |
| **E22-13** | Index corrompu : l'échec peut survenir à l'ouverture, avec le message natif SQLite | « Conservation de l'erreur native si applicable » : accepté, mais le test distingue explicitement les deux chemins (ouverture / requête) au lieu de supposer |

## 10. Limites

- Le jeu de huit requêtes est **public et petit** : il démontre une recherche
  lexicale correcte, pas une qualité de recherche générale. Un `rappel@5 = 1`
  ici n'annonce rien sur un corpus réel.
- Q06 ramène un extra : la précision n'est pas parfaite et n'est pas présentée
  comme telle.
- La mesure C-O07 porte sur un conteneur à charge variable ; un hôte Windows
  réel n'a pas été mesuré.
- Aucune vérification de comportement sous profil `read` n'est refaite ici :
  elle appartient à la série 21 (C-P08, déjà acquise).

## 11. Commandes exactes

```powershell
npx vitest run tests/integration/fts-corpus-queries.test.ts
npx vitest run tests/integration/search-error-states.test.ts
npx vitest run tests/integration/search-fallback-explicit.test.ts
npm run build
npx vitest run tests/cli/search-contract.test.ts
npx vitest run tests/mcp/integration/fts-latency.test.ts
npm run verify
```

## 12. Suite

Les trois sous-sprints sont exécutés : voir le bilan `SPRINT-22-RESULTAT.md`
pour la synthèse, les critères restant à confirmer par le propriétaire
(C-O07 machine, C-R04 volet H, écarts E22-9/E22-10) et l'attente d'accord
avant le sprint suivant.
