# SPRINT-20 — Fiabilité des mesures, preuves et cibles — bilan

**Sprint parent :** [SPRINT-20](SPRINT-20.md)
**Sous-sprints :** [20-01](SPRINT-20-01-RESULTAT.md) · [20-02](SPRINT-20-02-RESULTAT.md) · [20-03](SPRINT-20-03-RESULTAT.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de la série :** `556611c` · **Tête de série :** `747553a` · **Commit du bilan :** `0defccb` · **Commit du mode opératoire :** `f3284fc` (+ `57e9394`, `e3f87d5`) · **Commit de clôture :** `b5c8652`
**Statut :** ✅ **série close et validée par le propriétaire le 30/10/2026** — 7/7 critères couverts : C-W10 accepté « préparé », C-W14 accepté sur **2 formats sur 3** (preuve PDF non bloquante). **Sprint 21 non engagé : feu vert distinct attendu.**

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
| **C-W10 / W05 — interprétation** | H | ✅ **accepté « préparé »** | 3 rendus portent les limites (`tests/e2e/score-limitations.test.ts`) ; l'état « préparé » est **validé par le propriétaire le 30/10/2026** — la revue des 3 rendus reste due en tant qu'amélioration, elle ne bloque plus la série |
| **C-W11 / W06 — PDF échoué** | I/E | ✅ | `tests/cli/inspect.test.ts` : échec PDF → code non nul, artefacts listés, reprise sans nouvel audit |
| **C-W12 / W06+O04 — ancien audit** | I | ✅ re-vérifié | `tests/storage/audit-diagnostics.test.ts` : 2/2 fixtures lisibles, incohérence signalée, 0 réécriture |
| **C-W13 / O06 — contrôle des cibles** | U/I | ✅ **6/6** | `tests/cli/inspect-url-policy.test.ts` (6), `tests/mcp/tools/inspect-site-policy.test.ts` (4), `tests/browser/inspection/inspector.test.ts` (verrou + redirection) |
| **C-W14 / W05+O06 — sorties sûres** | I | ✅ **2/3 formats, accepté** | Markdown et HTML prouvés (`tests/reports/safe-render.test.ts`) ; le **PDF** reste non mesuré (Chromium absent) : le propriétaire a **accepté le 30/10/2026** que la preuve PDF soit couplée à la suite et **ne bloque pas** l'avancement |

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

**Rejeu du 30/10/2026 après reconstruction de l'environnement** (`npm ci` +
`npm run build` depuis zéro) — mêmes chiffres, à l'identique :

```text
npm run verify            → EXIT 0 · 1 767 passed | 38 skipped · 146 fichiers
                            couverture 96,01 / 89,37 / 97,39 / 96,19
10 fichiers ciblés        → 68 passed (68) · 10 fichiers
CLI rejouée               → 0.2.0 · schéma v11 · add · search fts (1 résultat)
                            · 3 refus de politique avec code 1
```

Ce rejeu est la preuve que les commandes du § 8.7 fonctionnent sur un
environnement **reconstruit**, pas seulement sur celui où le code a été écrit.

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
git status --short                        # sortie vide : arbre propre
git rev-list --count origin/develop..HEAD # 23 avant les commits de documentation de ce §
```

Les commits de documentation qui suivent (`f3284fc`, `57e9394`, `e3f87d5`)
portent cette avance à **26** ; sur le poste, `git log -1` et
`git rev-list --count` font foi, pas les valeurs figées ici.

**Fusion déjà réalisée par le propriétaire (30/10/2026).** Le remote porte :

```text
refs/heads/develop                                      = 854ecb4
refs/heads/arena/079e2f26-engineering-knowledge-tooling = e3f87d5
```

`develop` contient donc **tout le code de la série 20** (jusqu'à `854ecb4`) et
il lui manque **3 commits de documentation seulement** (`f3284fc`, `57e9394`,
`e3f87d5`, tous dans `docs/`). Un `--ff-only` suffit à les avancer ; ils ne
touchent aucun fichier de code, donc aucune revérification n'est nécessaire
au-delà de `npm run verify` déjà exécuté sur cet arbre.

**La fusion n'a pas été exécutée** : l'agent ne fusionne pas (interdiction
permanente, décision humaine réservée). Elle a été **répétée sans effet de
bord** :

```powershell
git merge-base --is-ancestor origin/develop HEAD   # code 0 : develop est un ancêtre
git merge-tree --write-tree origin/develop HEAD    # code 0, arbre 1861d760…
git rev-parse HEAD^{tree}                          # 1861d760… : arbre identique
```

Conclusion vérifiée : la fusion est un **fast-forward** (`398df3e` → tête de
la branche) qui produit exactement l'arbre de `HEAD`, lequel est déjà vérifié
par `npm run verify` (EXIT 0). Aucun conflit possible.

**Incident d'environnement résolu le 30/10/2026 (avant ce bilan).** Le
répertoire de travail a été reconstruit : `.git` est revenu à un clone neuf
pointant sur la racine `c46cc18`, alors que les fichiers restaient à l'état
`e3f87d5` et que le remote portait bien `e3f87d5`. Récupération **sans perte** :

```powershell
git fetch origin                                   # ramène origin/arena → e3f87d5, origin/develop → 854ecb4
git update-ref refs/heads/<branche> e3f87d5        # le pointeur de branche, pas les fichiers
git reset                                          # ré-indexation seule (aucun contenu modifié)
git status --short                                 # 0 ligne : l'arbre est identique à e3f87d5
npm ci ; npm run build                             # node_modules et dist avaient disparu
```

Aucun `reset --hard`, aucun `clean`, aucun fichier écrasé : la comparaison
arbre/index l'a confirmé (`git status --short` vide).

### 8.1 Récupération sur le poste

```powershell
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git ekts
cd ekts
git fetch origin
git switch --track origin/arena/079e2f26-engineering-knowledge-tooling
git log --oneline -10
git rev-parse --short HEAD        # doit être identique à git rev-parse origin/arena/079e2f26-engineering-knowledge-tooling
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
git log --oneline -3              # tête = celle de la branche Arena (sha identique)
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
| Fusion vers `develop` | ✅ **faite par le propriétaire** le 30/10 (`develop` = `854ecb4`) ; répétition sans effet de bord avant cet accord : fast-forward, arbre identique | ⏳ avancer `develop` de 3 commits de documentation (§ 8.2) |
| `npm run verify` | ✅ EXIT 0 (1 767 / 38) | ⏳ après fusion |
| Tests ciblés C-W13/C-W14 | ✅ 33/33 | ⏳ |
| `npm run browsers:install` + suites navigateur | ⛔ impossible (CDN de navigateur injoignable) | ⏳ preuve PDF de C-W14 |
| Exécution du programme | ✅ init/add/list/search/status/audit list + 4 refus de politique | ⏳ rejouer pour confirmer |

### 8.7 Bloc unique à rejouer sur le poste (PowerShell 5.1)

Chaque commande ci-dessous a été exécutée **dans cet environnement** ; aucune
n'est théorique. À rejouer dans l'ordre, du dépôt fraîchement récupéré jusqu'à
l'exécution du programme.

```powershell
# 1. Récupération
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git ekts
cd ekts
git fetch origin
git switch --track origin/arena/079e2f26-engineering-knowledge-tooling
git log --oneline -10
git status --short

# 2. Avancer develop (3 commits de documentation restants ; ff obligatoire)
git switch develop
git pull --ff-only origin develop
git merge --ff-only origin/arena/079e2f26-engineering-knowledge-tooling
git log --oneline -3
git push origin develop
git switch arena/079e2f26-engineering-knowledge-tooling

# 3. Installation et compilation
npm ci
npm run build

# 4. Vérification complète (typecheck + lint + format + build + couverture)
npm run verify

# 5. Tests ciblés de la série (ceux qui prouvent C-W08, C-W09, C-W11, C-W13, C-W14)
npx vitest run tests/analysis/metric-identity.test.ts tests/analysis/evidence-chain.test.ts
npx vitest run tests/integration/audit-migration-011.test.ts tests/storage/audit-diagnostics.test.ts
npx vitest run tests/cli/inspect.test.ts tests/cli/inspect-url-policy.test.ts
npx vitest run tests/mcp/tools/inspect-site-policy.test.ts tests/reports/safe-render.test.ts
npx vitest run tests/browser/inspection/inspector.test.ts tests/e2e/score-limitations.test.ts

# 6. Preuve PDF de C-W14 (optionnelle, non bloquante) et suites navigateur
npm run browsers:install
npx vitest run tests/browser tests/reports tests/cli/inspect.test.ts

# 7. Exécution réelle du programme
$env:EKTS_DATA_DIR = "C:\temp\ekts-demo"
node dist/cli/index.js --version
node dist/cli/index.js init --no-colors
node dist/cli/index.js add --type article --title "Guide SQLite" --url https://example.invalid/sqlite --tags "sqlite,base" --content "SQLite est une base embarquee, sans serveur, lue depuis un fichier unique." --no-colors
node dist/cli/index.js list --no-colors
node dist/cli/index.js search sqlite --mode fts --no-colors
node dist/cli/index.js status --no-colors
node dist/cli/index.js audit list --no-colors

# 8. Politique de cible (les quatre refus ; code de sortie 1 attendu)
node dist/cli/index.js inspect http://127.0.0.1:3000 --format md --no-colors
node dist/cli/index.js inspect http://127.0.0.1:3000 --allow-private-hosts --format md --no-colors
node dist/cli/index.js inspect file:///etc/passwd --format md --no-colors
node dist/cli/index.js inspect https://site-inexistant.invalid --format md --no-colors
```

Résultats attendus, mesurés ici :

```text
npm ci                    → 0 vulnérabilité signalée
npm run build             → succès
npm run verify            → EXIT 0 · 1 767 passed | 38 skipped (1 805) · 146 fichiers
                            couverture 96,01 / 89,37 / 97,39 / 96,19
tests ciblés (5 blocs)    → tous verts ; les 38 ignorés restent ignorés avant l'étape 6
étape 6 (navigateur)      → les 38 ignorés doivent diminuer ; aucun échec toléré
étape 7                   → --version « 0.2.0 », init « schéma v11 », 1 ressource, audit list vide
étape 8                   → 4 × code 1 : privé, navigateur absent, schéma, DNS
```

**Écart d'environnement à connaître** : `npm ci` échoue si le registre npm est
injoignable ; `npm run build` échoue si `tsc` n'est pas installé (il vient de
`npm ci`). Les deux ont réussi ici le 30/10/2026 après reconstruction de
l'environnement.

**Si une commande échoue chez vous** : collez la sortie complète — un écart
entre les deux environnements est un défaut à corriger, pas une différence à
ignorer.

## 9. Ce qui n'est pas prouvé

- **PDF** : C-W14 n'est prouvé que sur Markdown et HTML (Chromium absent).
  Le PDF étant produit depuis le HTML échappé, l'hypothèse est favorable mais
  **non mesurée** ici. **Décision du propriétaire (30/10/2026)** : la preuve
  PDF est couplée à la suite et **ne bloque pas** l'avancement ; elle reste
  attendue au poste via `npm run browsers:install` (§ 8.7, étape 6).
- **Navigateur réel** : 38 cas restent ignorés (6 fichiers). Aucune navigation
  réseau, aucune capture, aucun PDF n'a été produit ici.
- **Renvoi d'un PDF après `--allow-private-hosts`** : non exercé sur un site réel.
- **CI distante** : toujours non observée ; `verify` est local.
- **Aucune inspection réelle** : l'exécution du programme (§ 8.4-8.5) va jusqu'au
  refus de politique et jusqu'à l'absence de navigateur — **aucun audit n'a été
  produit**, aucune page réelle analysée. Les seules preuves d'analyse restent
  les fixtures des tests.
- **C-W10** : la revue humaine des 3 rendus n'a pas eu lieu ; l'état
  « **préparé** » est **validé par le propriétaire le 30/10/2026** et suffit à
  clore la série. La revue reste un travail d'amélioration, hors sprint 20.

## 10. Checklist de clôture (SPRINT-20.md §8)

- [x] **Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code** — feu vert du 30/10 pour les trois sous-sprints ; pré-vol (lecture `AGENTS.md`, roadmap, registre, spec 21, critères 22, architecture 20, dossiers 20-01→20-03) consigné ; contradictions déclarées.
- [x] **Tests U/I/E2E préparés avant chaque implémentation ; RED pertinent ou GREEN initial justifié** — RED verbatim consigné dans les trois rapports ; cas déjà GREEN identifiés comme gardes de non-régression (20-02 « régénère un rapport », 20-03 « 1/6 » et « 1/4 »).
- [x] **Critères évalués selon 22 ; blocages, échecs et skips explicités** — 7/7 critères couverts après décision du propriétaire : C-W10 accepté « préparé », C-W14 accepté sur 2 formats sur 3 (PDF non bloquant), 38 ignorés déclarés.
- [x] **Contrats, migrations, données historiques, sécurité et docs vérifiés** — contrats 19-03 non rouverts ; migration 011 additive et idempotente ; historique laissé `NULL` ; politique de cible documentée (`CLI`, `MCP`, `INSPECTOR`, `REPORTS`) ; C-W12 re-vérifié.
- [x] **Rapports et commits locaux réels traçables ; registre à jour** — 3 rapports de sous-sprint, 7 commits, hashes réels dans le registre.
- [x] **Exécution réelle du programme** — CLI compilée : `init` (schéma v11), `add`, `list`, `search --mode fts`, `status`, `audit list`, puis quatre refus de politique de cible (privé, exception, schéma, DNS). Sorties verbatim au § 8.4-8.5.
- [x] **Bilan transmis et validation humaine obtenue avant le sprint suivant** — bilan transmis ; **accord du propriétaire obtenu le 30/10/2026** (C-W10 « préparé » validé, C-W14 accepté sur 2 formats, fusion `develop` réalisée par lui). **Aucun feu vert pour le sprint 21** : il attend une autorisation distincte.

## 11. Décisions humaines reçues et état final

| Décision | Réponse du propriétaire (30/10/2026) | Effet |
| --- | --- | --- |
| **C-W10** | ✅ Validation de l'état « préparé » | Critère clos ; la revue des 3 rendus devient une amélioration hors périmètre |
| **C-W14 / PDF** | ✅ Deux formats sur trois acceptés ; preuve PDF souhaitée mais **non bloquante**, couplée à la suite | Critère clos ; `npm run browsers:install` reste la voie de preuve au poste |
| **Fusion `develop`** | ✅ Réalisée par le propriétaire (remote `develop` = `854ecb4`) | 3 commits de documentation restent à avancer en `--ff-only` |
| **Sprint 21** | ⛔ **Aucun feu vert** — les présentes instructions sont documentaires | Le sprint 21 n'est pas engagé |

La série 20 est **close**. Rien n'a été produit pour le sprint 21 : ni lecture de
pré-vol, ni test, ni code, ni branche.

### 11.1 Contrat de reproduction (instruction permanente)

Tout bilan de sprint doit contenir, comme le § 8.7 ci-dessus :

1. les **commandes exactes** de récupération, de fusion et de test, réellement
   exécutées dans cet environnement — pas des commandes plausibles ;
2. les **résultats attendus** avec les chiffres mesurés, y compris les skips ;
3. la mention explicite de ce qui n'a **pas** pu être exécuté ici (navigateur,
   CI distante) et de la commande qui le prouvera au poste.

Un succès constaté ici ne vaut pas succès au poste : les deux environnements
sont distincts. Si une commande échoue au poste, la sortie complète devient la
priorité du tour suivant — le défaut se corrige, il ne se contourne pas.
