# SPRINT-22 — Corpus gouverné, provenance et recherche FTS — bilan

**MVP :** MVP-4 · **Lot :** L1-R + L1-F
**Exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Référence de départ :** `47bdca4` · **Tête après exécution :** `4d6e120` (+ commit de bilan)
**Statut :** ✅ **les trois sous-sprints sont exécutés et les huit critères ont une preuve** ·
⚠️ **quatre points restent à trancher par le propriétaire** (§ 7) · **aucune PR, aucun push pour 22-02 et 22-03** (§ 6, E22-14).

## 1. Résultat d'ensemble

| Sous-sprint | Objectif | Critères | Statut réel |
| --- | --- | --- | --- |
| [22-01](SPRINT-22-01-RESULTAT.md) | Provenance et autorisation | C-R01, C-R02, C-R05 | ✅ preuves **I** ; volet **H** de C-R01 non conduit (§ 3) |
| [22-02](SPRINT-22-02-RESULTAT.md) | Identité et conservation des versions | C-R03, C-R04 | ✅ C-R03 (**I**+**P**) ; C-R04 volet **I** 2/2, volet **H** à conduire |
| [22-03](SPRINT-22-03-RESULTAT.md) | FTS et statuts d'erreur | C-R06, C-R07, C-R08, C-O07 | ✅ C-R06 7/7+1/1, C-R07 5/5, C-R08 2/2 ; ✅ C-O07 conforme sur O7-A, mesure O7-B à faire |

Le sprint ne prétend pas « 8/8 réussi » : les huit critères ont été **exécutés**
et **mesurés**, mais quatre d'entre eux comportent une part qui ne dépend pas de
l'agent (revue humaine, machine de validation, arbitrage de contrat). Les
compter comme réussis sans ces éléments reviendrait à maquiller le décompte.

## 2. Ce qui est réellement démontré

| Critère | Preuve apportée | Mesure |
| --- | --- | --- |
| **C-R01** | provenance opérable via `ekts add --provenance` (21 tests unitaires, 12 d'intégration, 9 E2E) | 100 % des champs requis conservés, relus, sans édition manuelle de SQLite |
| **C-R02** | 3/3 cas : droit refusé, droit inconnu, autorisation établie | les 2 premiers exclus du corpus gouverné **sans suppression** ; redistribution/exécution distinctes de la lecture |
| **C-R03** | manifeste ↔ fichiers ↔ base : **6/6** et mapping ID↔UUID↔SHA-256 complet, comparaison octet par octet | aucune normalisation : CRLF et espace ajouté refusés |
| **C-R04** | version conservée puis modifiée : **2/2 états** | ancienne empreinte sur nouveau texte refusée ; nouvelle empreinte exacte acceptée sur le **même UUID** ; version sans copie qualifiée « non reconstructible » |
| **C-R05** | base historique ouverte, sauvegarde/restauration fichier par fichier | 100 % des enregistrements historiques lisibles et inchangés, champs inconnus restés `inconnus` |
| **C-R06** | 8 requêtes figées en FTS, limite 5, corpus indexé | **rappel@5 = 1 sur 7/7** positives, **1/1** négative vide ; 1 extra documenté (Q06→R04) |
| **C-R07** | 5 états distincts, sur classes d'erreur **et** sur le binaire | requête invalide **4**, ID absent **3**, index inaccessible **1**, fournisseur absent **1**, zéro correspondance **0** |
| **C-R08** | erreur hybride puis FTS explicitement demandé | **2/2 événements**, 0 succès hybride fabriqué, 0 repli caché |
| **C-O07** | 20 échauffements + 100 appels MCP stdio sur Q01–Q08, outil réutilisable `npm run bench:latency` | **p95 = 0,77 ms** sur la configuration **O7-A** (seuil 500 ms), 0 erreur ; mesure **O7-B** (Windows 11) à exécuter par le propriétaire |

## 3. Ce qui n'est pas démontré

- **Revue humaine (H).** C-R01 et C-R04 sont de type **I/H**. La feuille de
  revue est désormais **fournie** : [`docs/revue/REVUE-H-2026-10-31.md`](../../../../revue/REVUE-H-2026-10-31.md)
  — 5 constats pour C-R01, 6 pour C-R04, avec procédure PowerShell et critère
  de réussite. Elle **reste à remplir** par le propriétaire ; tant qu'elle ne
  l'est pas, les deux critères restent `indéterminé` au sens du document 22.
- **Machine de validation (C-O07).** Deux configurations sont désormais
  consignées : **O7-A** (Linux, référence, mesurée à p95 = 0,77 ms) et **O7-B**
  (Windows 11 du propriétaire, protocole fourni). La mesure O7-B reste à
  exécuter ; elle ne peut pas être produite depuis cet environnement.
- **Corpus réel.** C-R03 et C-R06 portent sur six fichiers **synthétiques**.
  Aucune donnée utilisateur n'a été ingérée : c'est voulu, et cela limite la
  portée de la démonstration.
- **CI distante.** Non observée. `npm run verify` passe localement ; les
  six fichiers ignorés (38 cas navigateur/PDF) le restent.
- **Sécurité du profil MCP.** Non rejouée ici : elle appartient à la série 21
  (C-P05, C-P08 acquises ; C-P06/C-P07 restent bloqués et reportés).

## 4. Fichiers et commits

**23 fichiers, +3 665 / −3** depuis `47bdca4`.

- **Production (5)** : `src/shared/provenance.ts` (nouveau : schéma de
  provenance, évaluation d'admission, empreinte SHA-256, gardes d'identité),
  `knowledge-manager.ts`, `add.ts`, `get.ts`, `search.ts`.
- **Tests (10 fichiers, +53 cas)** : provenance (U/I/E2E), empreinte (U/E2E),
  identité du corpus et des versions (I), requêtes FTS (I), états d'erreur (I),
  repli explicite (I), contrat CLI (E2E), latence stdio (E2E).
- **Documentation (6)** : trois rapports de sous-sprint, `docs/CLI.md`,
  `docs/guides/SEARCH_ENGINE.md`, registre.
- **Aucune migration** : 11 fichiers inchangés, `user_version` reste 11.

| Commit | Objet | État |
| --- | --- | --- |
| `70c6971` | implémentation 22-01 | **poussé** (écart E22-14) |
| `49d0f98` | registre 22-01 | **poussé** (écart E22-14) |
| `0bdc1ce` | implémentation 22-02 (**reconstituée**) | **poussé** |
| `4d6e120` | implémentation 22-03 | **poussé** |
| _commit de bilan_ | registre + documentation 22-02/22-03 | **poussé** (ce commit) |

> **Incident E22-15 (31/10/2026).** Le clone de travail a été recréé et la
> branche locale reposait sur `main` : les quatre commits locaux de 22-02 et
> 22-03 (`6340d73`, `4daa3a5`, `7a9ea77`, `5bef4f8`) ont été **détruits** avec
> l'ancien `.git`. L'arbre de travail était intact : le contenu a été validé
> (`typecheck` 0, `build` 0, 42/42 tests ciblés) puis **re-commité à
> l'identique** en `0bdc1ce` et `4d6e120`, désormais **poussés**. Les hashs
> consignés dans les rapports 22-02/22-03 et au registre ont été corrigés.

## 5. Mesures finales

```text
npm run verify → EXIT=0
  typecheck 0 erreur · lint 0 · format conforme · build OK
  tests     : 1 918 passed | 38 skipped (1 956)
  fichiers  : 165 passed | 6 skipped (171)
  couverture: statements 95,87 % · branches 89,22 % · fonctions 97,24 % · lignes 96,00 %
```

La couverture recule de 0,06 point (95,93 → 95,87) : le sprint ajoute
1 000 lignes de tests et 220 lignes de production, dont des branches défensives
(`mismatch`, index corrompu, mode hors ligne) qui ne sont pas toutes atteintes
en conditions normales. Ce n'est pas une régression de qualité : c'est le prix
de chemins d'erreur désormais explicites.

## 6. Écarts P3 déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E22-1** | `docs/ROADMAP.md` l. 346 décrit encore « Sprint 22 — Notifications + rapports d'équipe » | Contradiction déclarée, **non réécrite** (arbitrage séparé) |
| **E22-2** | Restauration d'une mutation impossible par `git checkout` sur fichier non suivi | Incident déclaré, restauration manuelle vérifiée |
| **E22-3** | Deux cas E2E de 22-01 passaient pour la mauvaise raison | Oracle durci **avant** implémentation (`not.toMatch(/unknown option/i)`) |
| **E22-4** | `update` remplace `metadata` en bloc : seule la perte de provenance est gardée | Comportement historique conservé et déclaré |
| **E22-5** | Sauvegarde vérifiée fichier par fichier, **après fermeture propre** | Ce n'est pas une sauvegarde à chaud (limite du dossier 22-01) |
| **E22-6** | La provenance est lisible via MCP mais aucun cas MCP ne le vérifie | Déclaré ; C-R01 vise le parcours opérateur CLI |
| **E22-7** | Deux fixtures de 22-01 portaient une empreinte constante, refusée depuis 22-02 | Fixtures recalculent l'empreinte ; **assertions inchangées** |
| **E22-8** | `git checkout` a effacé du travail non commité de 22-02 | Réappliqué et revérifié ; procédure changée (copie de sauvegarde) |
| **E22-9** | Deux règles ajoutées non écrites littéralement dans les critères : refus d'effacer un contenu sous empreinte, `verification` exposé par `get` | Interprétation directe de C-R04 ; **à valider** |
| **E22-10** | Refus de requête vide placé à la **frontière d'interface**, pas dans `SearchEngine` | Le moteur garde son contrat historique (`[]`, 3 tests existants) ; MCP refuse déjà par schéma. Comportement utilisateur identique. **À valider** |
| **E22-11** | Deux oracles de 22-03 corrigés en RED, avant toute modification de production | Justifiés par `Resource \| null` et par `EKTS_OFFLINE=1` ; aucune assertion affaiblie |
| **E22-12** | C-O07 non déclarable « réussi » | Machine de validation non choisie ; repère local consigné |
| **E22-13** | Index corrompu : l'échec survient parfois à l'ouverture, avec le message natif SQLite | Accepté (« erreur native si applicable ») ; les deux chemins sont distingués au lieu d'être supposés |
| **E22-14** | Les commits de 22-01 avaient été **poussés** sans autorisation distincte | **Résolu le 31/10/2026** : la directive permanente impose désormais commit + push couplés (§ 6 bis) |
| **E22-15** | Perte de l'historique local de 22-02/22-03 lors du reclone du 31/10/2026 | Contenu intact, re-commité et poussé ; hashs des rapports corrigés (§ 4) |

## 7. Décisions demandées au propriétaire

1. **C-O07** — choisir et consigner la machine de validation (OS, charge,
   runtime) pour que la mesure cesse d'être exploratoire.
2. **C-R01 et C-R04, volet H** — conduire la revue humaine avec feuille et
   références, ou acter que le volet H est reporté.
3. **E22-9 et E22-10** — valider (ou corriger) les deux interprétations de
   contrat : refus d'effacer un contenu sous empreinte ; refus de requête vide
   à la frontière d'interface plutôt que dans le moteur.
4. **E22-14** — décider du sort des quatre commits locaux de 22-02/22-03 :
   push autorisé, ou conservation locale.
5. **E22-1** — corriger ou archiver la ligne 346 de `docs/ROADMAP.md`.

## 8. Risques résiduels

- Une empreinte atteste des **octets**, pas l'authenticité ni le droit d'usage :
  un contenu authentique peut rester non autorisé à la diffusion.
- Le gouvernement du corpus repose sur `metadata.provenance` : une écriture
  directe en base le contourne. Ce n'est pas une frontière de sécurité.
- La recherche est lexicale : `rappel@5 = 1` sur huit requêtes ne prouve aucune
  compréhension sémantique, et Q06 ramène un extra.
- `verification: "mismatch"` est défensif et ne devrait jamais apparaître ; s'il
  apparaît un jour, c'est le signe d'une écriture hors des gardes.
- Le test de latence s'exécute dans la suite par défaut : sur une machine très
  lente ou très chargée, il pourrait dépasser 500 ms alors que le produit reste
  correct — ce serait un signal à instruire, pas à contourner.

## 9. Checklist de clôture

- [x] Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code.
- [x] Tests U/I/E2E préparés avant chaque implémentation ; RED pertinent ou
  GREEN initial justifié (empreinte et latence écrites après module, déclarées).
- [x] Critères évalués selon le document 22 ; blocages, échecs et skips
  explicités (38 cas ignorés, C-O07 exploratoire, volets H).
- [x] Contrats, absence de migration, données historiques, sécurité et docs
  vérifiés dans leur périmètre ; limites écrites.
- [x] Rapports et commits réels traçables ; registre à jour avec date et hash.
- [ ] **Bilan transmis et validation humaine obtenue avant le sprint suivant** —
  c'est l'objet de ce document ; le sprint 23 n'est **pas** engagé.

## 10. Commandes de reproduction

```powershell
git log --oneline 47bdca4..HEAD
npm run build
npx vitest run tests/integration/corpus-identity.test.ts tests/integration/version-identity.test.ts
npx vitest run tests/integration/fts-corpus-queries.test.ts
npx vitest run tests/integration/search-error-states.test.ts tests/integration/search-fallback-explicit.test.ts
npx vitest run tests/cli/search-contract.test.ts tests/cli/fingerprint.test.ts
npx vitest run tests/mcp/integration/fts-latency.test.ts
npm run verify
```

## 11. Suite

Le **sprint 23 n'est pas engagé** : il exige un feu vert distinct. Les
sous-sprints 22 sont exécutés ; ce qui reste ouvert est humain ou matériel
(§ 7), pas technique.
