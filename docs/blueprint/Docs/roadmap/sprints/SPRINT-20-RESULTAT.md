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

## 8. Récupération, fusion, tests et exécution

### 8.0 État vérifié le 30/10/2026 (dans cet environnement)

```powershell
git fetch origin
git log --oneline -3
# 854ecb4 docs(registre): consigner le bilan du sprint 20 avec son hash reel
# 0defccb docs(20): bilan de la serie et registre a completer
# 747553a docs(registre): consigner le sprint 20-03 et son hash reel
git status --short                              # sortie vide : arbre propre
git rev-list --count origin/develop..HEAD       # 23
```

**La fusion n'a pas été exécutée** : l'agent ne fusionne pas (interdiction
permanente, décision humaine réservée). Elle a été **répétée sans effet de
bord** :

```powershell
git merge-base --is-ancestor origin/develop HEAD   # code 0 : develop est un ancêtre
git merge-tree --write-tree origin/develop HEAD    # code 0, arbre 1861d760…
git rev-parse HEAD^{tree}                          # 1861d760… : arbre identique
```

Conclusion vérifiée : la fusion est un **fast-forward** (`398df3e → 854ecb4`)
qui produit exactement l'arbre de `HEAD`, lequel est déjà vérifié par
`npm run verify` (EXIT 0). Aucun conflit possible.

### 8.1 Récupération sur le poste

```powershell
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git ekts
cd ekts
git fetch origin
git switch --track origin/arena/079e2f26-engineering-knowledge-tooling
git log --oneline -10
git rev-parse --short HEAD        # doit afficher 854ecb4
git status --short                # doit être vide
```

Si la branche existe déjà localement : `git switch arena/079e2f26-engineering-knowledge-tooling`
puis `git pull --ff-only`.

### 8.2 Fusion vers `develop` (décision du propriétaire)

```powershell
git fetch origin
git switch develop
git pull --ff-only origin develop
git merge --ff-only origin/arena/079e2f26-engineering-knowledge-tooling
git log --oneline -3              # tête attendue : 854ecb4
git push origin develop
```

Si `--ff-only` refuse (quelqu'un a poussé sur `develop` entre-temps) :

```powershell
git merge --no-ff origin/arena/079e2f26-engineering-knowledge-tooling
git status                                   # conflits éventuels
git diff --name-only --diff-filter=U         # fichiers en conflit
# résoudre chaque fichier, puis :
git add <fichiers résolus>
git commit                                   # message de fusion proposé par git
npm run verify                               # avant tout push
git push origin develop
```

Interdits rappelés : ni `push --force`, ni `reset --hard`, ni `clean -fd` sur
une branche partagée ; `main` reste une décision distincte.

### 8.3 Tests et vérifications après fusion

```powershell
npm ci
npm run build
npm run verify
npx vitest run tests/cli/inspect-url-policy.test.ts tests/mcp/tools/inspect-site-policy.test.ts tests/reports/safe-render.test.ts tests/browser/inspection/inspector.test.ts
npm run browsers:install
npx vitest run tests/browser tests/reports tests/cli/inspect.test.ts
```

Résultats attendus (mesurés ici, hors navigateur) :

```text
npm run verify                     → EXIT 0, 1 767 passed | 38 skipped, 146 fichiers
4 fichiers ciblés                  → 33 passed (33)
après npm run browsers:install     → les 38 ignorés doivent se réduire
                                     (preuve PDF de C-W14 et inspections réelles)
```

### 8.4 Exécution réelle du programme (faite ici)

Exécutée sur la CLI compilée, répertoire de données isolé :

```powershell
$env:EKTS_DATA_DIR = "C:\temp\ekts-demo"
node dist/cli/index.js --version
node dist/cli/index.js init --no-colors
node dist/cli/index.js add --type article --title "Guide SQLite" --url https://example.invalid/sqlite --tags "sqlite,base" --content "SQLite est une base embarquee, sans serveur, lue depuis un fichier unique." --no-colors
node dist/cli/index.js list --no-colors
node dist/cli/index.js search sqlite --mode fts --no-colors
node dist/cli/index.js status --no-colors
node dist/cli/index.js audit list --no-colors
```

Sorties réelles obtenues :

```text
--version                → 0.2.0
init                     → « schéma v11 », trois bases créées, code 0
add                      → ressource créée (UUID), indexation plein texte seul
list                     → 1 ressource, tableau ID/TYPE/TITRE/TAGS/MAJ, code 0
search sqlite --mode fts → 1 résultat, code 0
status                   → version 0.2.0, node v22.22.3, trois bases présentes, code 0
audit list               → « Aucun audit trouvé. », code 0
```

La base créée porte le **schéma v11** : la migration 011 du sous-sprint 20-02
est donc bien appliquée par le programme, pas seulement par les tests.

### 8.5 Politique de cible vérifiée par le programme (C-W13)

```powershell
node dist/cli/index.js inspect http://127.0.0.1:3000 --format md --no-colors
node dist/cli/index.js inspect http://127.0.0.1:3000 --allow-private-hosts --format md --no-colors
node dist/cli/index.js inspect file:///etc/passwd --format md --no-colors
node dist/cli/index.js inspect https://site-inexistant.invalid --format md --no-colors
```

Sorties réelles (code de sortie **1** dans les quatre cas) :

```text
1) Erreur : URL refusée « http://127.0.0.1:3000 » : hôte privé « 127.0.0.1 » refusé
   (utilisez --allow-private-hosts pour l’autoriser explicitement).
2) Erreur : Navigateur « chromium » introuvable (…/chrome-linux64/chrome).
   → l'exception a bien laissé passer la politique ; le blocage restant est
     l'environnement (navigateur absent), pas la sécurité.
3) Erreur : URL refusée « file:///etc/passwd » : schéma « file: » refusé
   (http/https uniquement).
4) Erreur : URL refusée « https://site-inexistant.invalid » : résolution DNS
   impossible pour « site-inexistant.invalid » (getaddrinfo ENOTFOUND …) :
   aucune navigation n’a été tentée.
```

Ces quatre sorties sont la démonstration **de bout en bout**, par le programme
lui-même, de quatre des six décisions de C-W13 (privé, exception, schéma, DNS) ;
les deux autres (URL admise, redirection) sont prouvées par les tests.

### 8.6 Ce qui a été fait ici et ce qui reste sur le poste

| Étape | Ici (30/10/2026) | Sur le poste |
| --- | --- | --- |
| Récupération de la branche | ✅ (dépôt de session) | ⏳ clone + `switch --track` |
| Fusion vers `develop` | ⛔ non exécutée (réservée au propriétaire) — répétée sans effet de bord : fast-forward, arbre identique | ⏳ § 8.2 |
| `npm run verify` | ✅ EXIT 0 (1 767 / 38) | ⏳ après fusion |
| Tests ciblés C-W13/C-W14 | ✅ 33/33 | ⏳ |
| `npm run browsers:install` + suites navigateur | ⛔ impossible (CDN de navigateur injoignable) | ⏳ preuve PDF de C-W14 |
| Exécution du programme | ✅ init/add/list/search/status/audit list + 4 refus de politique | ⏳ rejouer pour confirmer |

## 9. Ce qui n'est pas prouvé

- **PDF** : C-W14 n'est prouvé que sur Markdown et HTML (Chromium absent).
  Le PDF étant produit depuis le HTML échappé, l'hypothèse est favorable mais
  **non mesurée** dans cet environnement.
- **Navigateur réel** : 38 cas restent ignorés (6 fichiers). Aucune navigation
  réseau, aucune capture, aucun PDF n'a été produit ici.
- **Renvoi d'un PDF après `--allow-private-hosts`** : non exercé sur un site réel.
- **CI distante** : toujours non observée ; `verify` est local.
- **Aucune inspection réelle** : l'exécution du programme (§ 8.4-8.5) va jusqu'au
  refus de politique et jusqu'à l'absence de navigateur — **aucun audit n'a été
  produit**, aucune page réelle analysée. Les seules preuves d'analyse restent
  les fixtures des tests.
- **C-W10** : aucune validation humaine des 3 rendus n'a encore eu lieu ; le
  propriétaire a accepté le report explicite.

## 10. Checklist de clôture (SPRINT-20.md §8)

- [x] **Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code** — feu vert du 30/10 pour les trois sous-sprints ; pré-vol (lecture `AGENTS.md`, roadmap, registre, spec 21, critères 22, architecture 20, dossiers 20-01→20-03) consigné ; contradictions déclarées.
- [x] **Tests U/I/E2E préparés avant chaque implémentation ; RED pertinent ou GREEN initial justifié** — RED verbatim consigné dans les trois rapports ; cas déjà GREEN identifiés comme gardes de non-régression (20-02 « régénère un rapport », 20-03 « 1/6 » et « 1/4 »).
- [x] **Critères évalués selon 22 ; blocages, échecs et skips explicités** — 6/7 satisfaits, C-W10 accepté « préparé », C-W14 partiel (PDF bloqué), 38 ignorés déclarés.
- [x] **Contrats, migrations, données historiques, sécurité et docs vérifiés** — contrats 19-03 non rouverts ; migration 011 additive et idempotente ; historique laissé `NULL` ; politique de cible documentée (`CLI`, `MCP`, `INSPECTOR`, `REPORTS`) ; C-W12 re-vérifié.
- [x] **Rapports et commits locaux réels traçables ; registre à jour** — 3 rapports de sous-sprint, 7 commits, hashes réels dans le registre.
- [x] **Exécution réelle du programme** — CLI compilée : `init` (schéma v11), `add`, `list`, `search --mode fts`, `status`, `audit list`, puis quatre refus de politique de cible (privé, exception, schéma, DNS). Sorties verbatim au § 8.4-8.5.
- [ ] **Bilan transmis et validation humaine obtenue avant le sprint suivant** — ce document ; **accord du propriétaire requis avant le sprint 21** (et avant la fusion, qui reste sa décision).

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
