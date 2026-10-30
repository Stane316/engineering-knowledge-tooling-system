# SPRINT-20 — Fiabilité des mesures, preuves et cibles — bilan

**Sprint parent :** [SPRINT-20](SPRINT-20.md)
**Sous-sprints :** [20-01](SPRINT-20-01-RESULTAT.md) · [20-02](SPRINT-20-02-RESULTAT.md) · [20-03](SPRINT-20-03-RESULTAT.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de la série :** `556611c` · **Tête de série :** `747553a` · **Commit du bilan :** `0defccb` · **Statut :** ⏳ **série livrée, accord du propriétaire attendu** (7 critères : 6 satisfaits, 1 accepté « préparé », 1 format bloqué sur C-W14)

## 1. Objectif et périmètre réellement traité

Le sprint 20 devait rendre les mesures **identifiables**, les constats
**prouvables** et les sorties **sûres**, sans rouvrir les contrats du sprint 19.

| Sous-sprint | Ce qui a réellement été livré |
| --- | --- |
| **20-01** | Vocabulaire de lecture (`MetricReading` : identité, unité, origine), suppression du repli INP→`max-potential-fid` et de l'alias `inp→fid`, seuils par métrique (INP 200/500, TBT 200/600, FID 100/300), limites d'interprétation injectées dans les deux rendus |
| **20-02** | Preuve des constats (règle, sélecteurs, nombre de nœuds, version du moteur) + migration **011** additive ; échec PDF après stockage signalé avec les artefacts réels, code de sortie non nul et reprise `ekts audit report <id>` |
| **20-03** | Politique de cible extraite et appliquée à la **CLI et au MCP** (schéma, identifiants, hôte privé/loopback, résolution DNS, redirection interne), exception opt-in, Markdown neutralisant `<`/`>` |

Périmètre **non** traité : refonte du moteur de recommandations, embeddings,
permissions du sprint 21, et tout ce que les critères C-W08 à C-W14 ne
demandent pas.

## 2. Commits réels de la série

| # | Commit | Objet |
| --- | --- | --- |
| 1 | `ff31dc3` | `feat(analysis)` — identité des métriques web et limites d'interprétation (20-01) |
| 2 | `f09d199` | `docs(registre)` — sprint 20-01 et son hash réel |
| 3 | `ba54632` | `docs(20-01)` — décision du propriétaire sur C-W10 |
| 4 | `c850ff8` | `feat(evidence)` — preuve des constats et reprise partielle (20-02) |
| 5 | `a4ef3fa` | `docs(registre)` — sprint 20-02 et son hash réel |
| 6 | `e2ee455` | `feat(securite)` — politique de cible CLI/MCP et rendu sûr (20-03) |
| 7 | `747553a` | `docs(registre)` — sprint 20-03 et son hash réel |

Empreinte cumulée de la série (`556611c..747553a`) : **67 fichiers**,
**+2 993 / −369** lignes. Branche **21 commits** devant `origin/develop`
(`398df3e`), dont 7 pour ce sprint.

## 3. Critères évalués

| Critère | niveau | Statut | Preuve |
| --- | --- | --- | --- |
| **C-W08 / W04 — métriques** | U/I | ✅ **5/5** | `tests/analysis/metric-identity.test.ts` (7) : identité, unité, origine, absence non numérique, aucun repli |
| **C-W09 / W05 — preuve minimale** | I/E | ✅ | `tests/analysis/evidence-chain.test.ts` (4) + `tests/integration/audit-migration-011.test.ts` (5) |
| **C-W10 / W05 — interprétation** | H | ⚠️ **préparé** | 3 rendus portent les limites (`tests/e2e/score-limitations.test.ts`) ; **revue humaine des 3 rendus due** — le propriétaire a accepté l'état « préparé » le 30/10 |
| **C-W11 / W06 — PDF échoué** | I/E | ✅ | `tests/cli/inspect.test.ts` : échec PDF → code non nul, artefacts listés, reprise sans nouvel audit |
| **C-W12 / W06+O04 — ancien audit** | I | ✅ re-vérifié | `tests/storage/audit-diagnostics.test.ts` : 2/2 fixtures lisibles, incohérence signalée, 0 réécriture |
| **C-W13 / O06 — contrôle des cibles** | U/I | ✅ **6/6** | `tests/cli/inspect-url-policy.test.ts` (6), `tests/mcp/tools/inspect-site-policy.test.ts` (4), `tests/browser/inspection/inspector.test.ts` (verrou + redirection) |
| **C-W14 / W05+O06 — sorties sûres** | I | ⚠️ **2/3 formats** | Markdown et HTML prouvés (`tests/reports/safe-render.test.ts`) ; **PDF bloqué** : Chromium absent de l'environnement |

### 3.1 Les six décisions de C-W13, une par une

| # | Décision | Test | Résultat |
| --- | --- | --- | --- |
| 1 | URL admise | CLI 1/6, MCP 1/4 | ✅ |
| 2 | Schéma interdit (file:, ftp:, javascript:) | CLI 2/6 (+ 5 cas historiques `playwright-mcp`) | ✅ |
| 3 | Cible privée/loopback interdite par la politique de production | CLI 3/6, MCP 2/4 | ✅ |
| 4 | Redirection vers une cible interdite | `inspector.test.ts` (redirection → 192.168.1.10) | ✅ refus **a posteriori** (E20-16) |
| 5 | Résolution vers une cible interdite | CLI 5/6 | ✅ |
| 6 | Erreur DNS | CLI 6/6, MCP 4/4 | ✅ |

Décision complémentaire testée : l'exception explicite (`--allow-private-hosts`,
`allow_private_hosts`) autorise la cible sans ouvrir la politique par défaut
(CLI 4/6, MCP 3/4).

## 4. Faits mesurés (sorties réelles)

```text
Baseline 19-03 (b48c175)     : 1 732 tests, couverture 96,03 % statements
20-01  npm run verify → 0    : 1 742 passed | 38 skipped (1 780) — 95,99 / 89,17 / 97,37 / 96,17
20-02  npm run verify → 0    : 1 753 passed | 38 skipped (1 791) — 95,99 / 89,39 / 97,39 / 96,17
20-03  npm run verify → 0    : 1 767 passed | 38 skipped (1 805) — 96,01 / 89,37 / 97,39 / 96,19
       fichiers              : 146 passed | 6 skipped (152)
```

Couverture du module ajouté au 20-03 : `src/browser/url-policy.ts`
**100 %** statements, **98,14 %** branches, **100 %** fonctions, **100 %** lignes.

Delta de la série : **+35 tests** (1 732 → 1 767), **38 ignorés inchangés**
(tous navigateur/PDF), couverture quasi stable (−0,02 point de statements,
le dénominateur ayant grossi d'un module au périmètre).

## 5. Écarts déclarés (16)

| # | Écart | Sous-sprint |
| --- | --- | --- |
| E20-1 à E20-5 | Fixtures converties en lectures ; constats FID dérivés d'INP disparaissent (effet voulu de D2) ; `numericValue` → `rawValue` ; origine `field` réservée ; « points Flesch » nommés | 20-01 |
| E20-6 à E20-10 | Localisation des violations **par identifiant** ; `nodes` optionnel ; `exitCode`/`SilentExit` ; colonnes historiques laissées `NULL` ; message du commit `2e24cb5` erroné (constat) | 20-02 |
| E20-11 à E20-16 | Assertion de rendu reformulée avant GREEN ; seam de résolution au lieu d'un mock de module ; deux fonctions pour une politique (URL normalisée vs saisie) ; exception transmise seulement si demandée ; champ `allowPrivateHosts` obligatoire ; redirection refusée **a posteriori** | 20-03 |

Détail complet dans les rapports de sous-sprint (§ 7 de chacun).

## 6. Risques résiduels

| Risque | Portée | Traitement |
| --- | --- | --- |
| Rebinding DNS | Politique de cible | Déclaré : la résolution précède la connexion du navigateur ; non couvert |
| Redirection interne | Politique de cible | Refus après navigation ; la requête est émise (pas d'interception) |
| `javascript:` en texte Markdown | C-W14 | Hors périmètre de la décision (chevrons) ; relève du rendu final |
| Preuve axe partielle | C-W09 | Seuls règle/sélecteurs/nœuds/version ; pas de copie de page |
| C-W10 non revu humainement | C-W10 | Revues des 3 rendus dues avant clôture de la série |

## 7. Commandes réellement exécutées pendant la série

```text
npx vitest run tests/analysis/metric-identity.test.ts
npx vitest run tests/analysis/evidence-chain.test.ts tests/cli/inspect.test.ts
npx vitest run tests/cli/inspect-url-policy.test.ts tests/reports/safe-render.test.ts
npx vitest run tests/mcp/tools/inspect-site-policy.test.ts tests/browser/inspection/inspector.test.ts
npx vitest run tests/cli/ tests/browser/playwright-mcp.test.ts
npm run build
npm run verify
npx prettier --write <fichiers touchés>
```

## 8. Commandes à exécuter sur le poste (PowerShell 5.1)

```powershell
cd <copie locale du dépôt>
git fetch origin
git checkout arena/079e2f26-engineering-knowledge-tooling
git log --oneline -7
npm ci
npm run build
npm run verify
npm run browsers:install      # restaure Chromium : lève 38 ignorés (dont le PDF de C-W14)
npx vitest run tests/reports tests/cli/inspect.test.ts tests/browser
```

Le dernier bloc est le seul moyen de prouver le **troisième format** de
C-W14 (PDF) et de vérifier que la politique de cible ne casse pas une
inspection réelle.

## 9. Ce qui n'est pas prouvé

- **PDF** : C-W14 n'est prouvé que sur Markdown et HTML (Chromium absent).
  Le PDF étant produit depuis le HTML échappé, l'hypothèse est favorable mais
  **non mesurée** dans cet environnement.
- **Navigateur réel** : 38 cas restent ignorés (6 fichiers). Aucune navigation
  réseau, aucune capture, aucun PDF n'a été produit ici.
- **Renvoi d'un PDF après `--allow-private-hosts`** : non exercé sur un site réel.
- **CI distante** : toujours non observée ; `verify` est local.
- **C-W10** : aucune validation humaine des 3 rendus n'a encore eu lieu ; le
  propriétaire a accepté le report explicite.

## 10. Checklist de clôture (SPRINT-20.md §8)

- [x] **Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code** — feu vert du 30/10 pour les trois sous-sprints ; pré-vol (lecture `AGENTS.md`, roadmap, registre, spec 21, critères 22, architecture 20, dossiers 20-01→20-03) consigné ; contradictions déclarées.
- [x] **Tests U/I/E2E préparés avant chaque implémentation ; RED pertinent ou GREEN initial justifié** — RED verbatim consigné dans les trois rapports ; cas déjà GREEN identifiés comme gardes de non-régression (20-02 « régénère un rapport », 20-03 « 1/6 » et « 1/4 »).
- [x] **Critères évalués selon 22 ; blocages, échecs et skips explicités** — 6/7 satisfaits, C-W10 accepté « préparé », C-W14 partiel (PDF bloqué), 38 ignorés déclarés.
- [x] **Contrats, migrations, données historiques, sécurité et docs vérifiés** — contrats 19-03 non rouverts ; migration 011 additive et idempotente ; historique laissé `NULL` ; politique de cible documentée (`CLI`, `MCP`, `INSPECTOR`, `REPORTS`) ; C-W12 re-vérifié.
- [x] **Rapports et commits locaux réels traçables ; registre à jour** — 3 rapports de sous-sprint, 7 commits, hashes réels dans le registre.
- [ ] **Bilan transmis et validation humaine obtenue avant le sprint suivant** — ce document ; **accord du propriétaire requis avant le sprint 21**.

## 11. Bilan et décision attendue

La série 20 est **livrée et poussée** : identité des métriques (C-W08),
preuve des constats et reprise partielle (C-W09, C-W11), politique de cible
et rendu sûr (C-W13, C-W14) ; C-W12 re-vérifié.

Trois points restent sous décision humaine :

1. **C-W10** — la revue des trois rendus synthétiques (axe saturé, UX=100 sur
   règles limitées, axe indisponible) reste due avant clôture définitive.
2. **C-W14 / PDF** — le troisième format ne peut être prouvé qu'avec Chromium ;
   sur le poste, `npm run browsers:install` puis le bloc de commandes du § 8
   suffit. Faut-il considérer C-W14 satisfait sur 2/3 formats, ou exiger la
   preuve PDF avant clôture ?
3. **Sprint 21 (permissions)** — non engagé. Il attend un **feu vert distinct**.

Aucun commit résiduel : l'arbre est propre et `HEAD` est poussé sur la branche
de session.
