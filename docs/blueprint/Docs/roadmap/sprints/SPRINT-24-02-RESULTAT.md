# SPRINT-24-02 — Préparation G0 — résultat et dossier

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Base :** `437b968` · **Date :** 31 octobre 2026
**Statut :** ✅ **C-O02 SATISFAIT sur Windows 11 build 26300 (11 PASS / 0 FAIL / 1 BLOCKED) · C-O03 toujours bloqué (second compte Windows) · G0 fermé**. Commits : `da7c4df`, `78dedcf`, `469c3ed` ; mesure finale : **à renseigner**.

**Accord du propriétaire (31/10/2026) :** poursuivre la préparation **malgré la réserve C-P07**, préparer G0 **pour exécution**, sans lancer de session sans feu vert opérationnel distinct.

## 1. Ce que G0 est — et ce qu'il n'est pas

G0 est une **porte d'autorisation**, pas une mesure : il autorise ou refuse la
campagne comparative. Aucun critère comparatif n'est acquis par sa préparation.
G0 ouvert ne vaut ni G1 réussi, ni gain démontré.

## 2. Champs à fournir par le propriétaire — bloquants

| # | Champ | État | Conséquence |
| --- | --- | --- | --- |
| **G0-1** | **Hôte** de la session (machine, OS, isolément réseau) | ⛔ **à fournir** | sans lui, aucune session n'a de périmètre mesurable |
| **G0-2** | **Modèle** (nom exact et version servie) | ⛔ **à fournir** | un « modèle récent » ne se compare pas |
| **G0-3** | **Fournisseur** et endpoint | ⛔ **à fournir** | détermine coût, journalisation, résidence |
| **G0-4** | **Budget** plafond (jetons ou devise) | ⛔ **à fournir** | condition d'arrêt de la campagne |
| **G0-5** | **Comptes de test autorisés** | ⛔ **à fournir** | reprend l'écart E23-1 côté Windows |

Sans ces cinq champs, **G0 reste fermé**. Aucune valeur par défaut n'est
inventée : un budget supposé est un budget dépassé.

## 3. Ce qui est déjà prêt et vérifiable

| # | Élément | Preuve | État |
| --- | --- | --- | --- |
| P1 | Isolation réseau réelle | `tests/mcp/integration/isolation-sandbox.test.ts` — `unshare -rn`, DNS refusé, 6 passed / 1 skipped | ✅ |
| P2 | Profil de lecture (3 outils, 14/14 refusés) | `tests/mcp/profile-exposure.test.ts`, `stdio-profile.test.ts` — 16/16 | ✅ |
| P3 | Événements et citations | `events-observable.test.ts` — 5/5, couche `server->client` | ✅ |
| P4 | Latence sous charge | `npm run bench:latency` — p95 0,73–0,77 ms, 0 échec | ✅ |
| P5 | Traces sans canari | `traces-confidentiality.test.ts` — 5/5 | ✅ |
| P6 | Corpus synthétique | `tests/mcp/helpers.ts` — 3 ressources fictives, aucun fournisseur | ✅ |
| P7 | Contrôle hôte/OS complet (C-P07 strict) | exige un **hôte agent réel** | ⛔ **bloqué** |
| P8 | Windows natif (C-O02/C-O03) | `scripts/windows-check.ps1` | ⛔ **non exécuté** |
| P9 | CI distante | jobs jamais démarrés (facturation) | ⛔ **bloquée** |

## 4. Protocole de campagne, figé d'avance

| Condition | Contenu | Ce qui est mesuré |
| --- | --- | --- |
| **A** | agent **sans** EKTS | score T01, durée, erreurs |
| **C** | agent avec **recherche web seule** | idem |
| **B** | agent avec **EKTS** (profil `read`, FTS explicite) | idem |

Trois sessions par condition, même corpus, même grille de 9 critères pondérés
(note 19 § 7–8), évaluation à l'aveugle si un second évaluateur existe.
**B−A et B−C sont rapportés séparément** : un gain contre la recherche web seule
n'est pas un gain contre l'absence d'outil.

## 5. Rétention, droits et sécurité (décidés)

- **Rétention** : traces locales, 30 jours maximum, suppression sur demande ;
  aucun export par défaut.
- **Droits** : corpus **synthétique** uniquement — aucune ressource tierce, donc
  aucune question de licence dans cette campagne.
- **Sécurité** : profil `read`, réseau refusé par namespace, caviardage actif,
  journal d'événements en mémoire.
- **Coût** : plafond **G0-4** ; à défaut, la campagne ne démarre pas.

## 6. Ce qui reste bloqué après ce dossier

C-T04 (comparaison), C-T05 (score ≥ 80/100), C-T06 (durée et coût) : **aucune
session exécutée**, donc **aucun résultat**. C-P07 : bloqué au sens strict.
Aucun de ces critères n'est déclaré réussi ni « en cours de réussite ».

---

## 7. Mesure O2-B réellement exécutée — 31 octobre 2026

Première exécution **sur la machine du propriétaire**. C'est la première fois que
C-O02 dispose d'une mesure réelle ; jusqu'ici il était « bloqué ».

### 7.1 Configuration mesurée

| Élément | Valeur observée |
| --- | --- |
| Édition | Microsoft Windows 11 Professionnel |
| Build | **26300** |
| Architecture | 64 bits |
| CPU | Intel Core i5-8250U @ 1,60 GHz |
| Node | **v24.14.0** |
| npm | **11.21.0** |
| Commit mesuré | **`f383ac5`** |
| Commande | `powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1` |

### 7.2 Verdicts bruts

| Étape | Verdict | Observation |
| --- | --- | --- |
| systeme | PASS | Windows 11 Pro build 26300, x64, i5-8250U |
| outils | PASS | node v24.14.0, npm 11.21.0, commit f383ac5 |
| dependances-natives | **FAIL** | `npm error code ELSPROBLEMS` |
| npm-ci | **FAIL** | sortie tronquée à un avertissement de dépréciation |
| build | **FAIL** | `'tsc' n'est pas reconnu` |
| doctor | PASS | code 0 |
| init-base | **FAIL** | `node:internal/modules/esm/resolve:205` |
| accents-utf8 | **FAIL** | idem |
| recherche | **FAIL** | idem |
| redemarrage | **FAIL** | idem |
| acl | PASS | « 0 bases » |
| acl-acces-refuse | BLOCKED | second compte absent |
| latence | PASS | « protocole exécuté » |

### 7.3 Lecture honnête : 7 échecs, mais **un seul est réel**

L'installation a échoué ; tout le reste en découle.

```
npm ci  ──échec──►  pas de node_modules  ──►  tsc introuvable  ──►  pas de dist
                                                                └──►  init / search : ERR_MODULE_NOT_FOUND
```

| # | Verdict affiché | Ce qu'il vaut réellement |
| --- | --- | --- |
| 1 | `dependances-natives` FAIL | **faux échec** — `npm ls` était lancé **avant** l'installation. Défaut de mon script. |
| 2 | `npm-ci` FAIL | **le seul échec réel**, et son message était masqué |
| 3 | `build` FAIL | **cascade** — `tsc` vient de `node_modules` |
| 4-7 | `init`, `accents`, `recherche`, `redemarrage` FAIL | **cascade** — `dist/` absent |
| 8 | `acl` PASS | **faux succès** — « 0 base » n'est pas une ACL vérifiée |
| 9 | `latence` PASS | **non concluant** — verdict `CONFORME` jamais lu |

**Trois défauts de protocole, tous dans mon script**, corrigés le même jour :

1. **Ordre** : l'inspection des dépendances précède désormais l'installation.
2. **Troncature** : la sortie affichée est la **fin**, plus le début (400
   premiers caractères ne montraient qu'un avertissement de dépréciation).
3. **Confusion échec / blocage** : une étape privée de sa précondition devient
   `BLOCKED`, et une étape sans objet ne peut plus être `PASS`. La latence exige
   désormais un verdict `CONFORME` lu dans la sortie.

### 7.4 Verdicts des critères

| Critère | Verdict | Motif |
| --- | --- | --- |
| **C-O02** | ⛔ **NON SATISFAIT — mesuré, pas bloqué** | l'installation échoue sur cette configuration ; **cause exacte non encore établie** |
| **C-O03** | ⛔ **BLOQUÉ au sens strict** | aucune base créée ⇒ aucune ACL ; refus effectif non testé sur Windows |
| **O7-B** | ⛔ **NON CONCLUANT** | protocole lancé, verdict non lu ⇒ à refaire |

Ce que la mesure **établit** : une installation neuve sur Windows 11 build 26300
avec Node 24.14.0 n'a pas abouti, et **la configuration n'est pas déclarable
compatible**. Ce qu'elle **n'établit pas** : que le projet est défectueux sur
Windows — l'étape en cause est l'installation, pas le code mesuré.

### 7.5 Hypothèses écartées par vérification locale

| Hypothèse | Vérification | Conclusion |
| --- | --- | --- |
| `package-lock.json` désynchronisé de `package.json` | comparaison des trois blocs de dépendances | **écartée** — aucune divergence |
| Binaires Windows absents du lockfile | inventaire des paquets à `os` contraint | **écartée** — `@esbuild/win32-x64`, `sqlite-vec-windows-x64`, `@napi-rs/canvas-win32-x64-msvc`, `@rolldown/binding-win32-x64-msvc`, `lightningcss-win32-x64-msvc` tous présents |

### 7.6 Ce qu'il faut pour conclure

Le script corrigé affiche désormais **les 25 dernières lignes** de `npm ci`. La
relance sur la même machine donnera la cause réelle. Commande :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1
```

À défaut, la capture minimale :

```powershell
npm ci 2>&1 | Select-Object -Last 30
```

---

## 8. Seconde relance — la cause est établie (31/10/2026, 18 h 02)

Le propriétaire a relancé le script puis exécuté les commandes à la main. **Le
résultat renverse la lecture précédente.**

### 8.1 `npm ci` réussit, contrairement à ce que le script affichait

Sortie réelle, exécutée par le propriétaire :

```
npm ci
npm warn deprecated @opentelemetry/sdk-trace-base@2.12.0: Use @opentelemetry/sdk-trace package
added 370 packages, and audited 371 packages in 52s
99 packages are looking for funding
12 moderate severity vulnerabilities
```

**Code de sortie 0. Installation complète en 52 s.** Le `FAIL` du script était
donc un **faux négatif**.

### 8.2 Cause racine, unique, dans mon script

```powershell
$ErrorActionPreference = 'Stop'          # ligne 49
$sortie = (& $File @Arguments 2>&1 | Out-String)   # ligne 81
```

Sous PowerShell 5.1, quand une **commande native écrit sur `stderr`** et que sa
sortie est redirigée par `2>&1`, chaque ligne devient un `ErrorRecord`. Avec
`$ErrorActionPreference = 'Stop'`, le premier `ErrorRecord` est **terminant** :
la pipeline est démontée **pendant** l'exécution de `npm ci`.

`npm ci` écrit un avertissement de dépréciation sur `stderr` dès les premières
secondes. La pipeline était donc interrompue avant la fin de l'installation :

```
npm ci interrompu (faux FAIL, sortie 1 ligne = l'avertissement)
   └─► node_modules incomplet ──► tsc absent ──► build FAIL
                                              └─► dist absent ──► init/recherche FAIL
   └─► npm ls sur installation partielle ──► ELSPROBLEMS
```

**Un seul défaut explique les sept échecs.** Le projet n'est pas en cause : la
même commande, lancée à la main, aboutit.

### 8.3 Pourquoi la sortie affichée était un avertissement

`npm warn deprecated …` est écrit sur `stderr` **avant** tout le reste. Le
script tronquait aux 400 premiers caractères : cet avertissement occupait toute
la place, et l'erreur réelle — qui n'en était pas une — restait invisible.

### 8.4 Correctif appliqué

| # | Correction | Effet |
| --- | --- | --- |
| 1 | `$ErrorActionPreference = 'Continue'` **localement** dans `Invoke-Native`, restauré en `finally` | `stderr` n'interrompt plus une commande native |
| 2 | Sortie convertie ligne par ligne (`ForEach-Object { "$_" }`) | texte lisible, sans bloc `CategoryInfo` |
| 3 | `npm ci` n'est **PASS** que si `node_modules/.bin/tsc` existe | un code 0 avec installation incomplète n'est plus un succès |
| 4 | Résumé d'étape limité à la première ligne, détail conservé dans le JSON | la console redevient lisible |
| 5 | Nouvelle étape `audit-dependances`, en `INFO` | constat consigné, jamais compté comme succès |

### 8.5 Audit des dépendances — constat, sans correction automatique

Le propriétaire a relevé **12 vulnérabilités modérées** (`minimatch` < 11.0.1,
amplification de `globparts`, GHSA-g3hv-75wg-m249).

| Périmètre | Résultat mesuré le 31/10/2026 |
| --- | --- |
| `npm audit --omit=dev` | **0 vulnérabilité** |
| `npm audit` (tout) | **12 modérées**, toutes dans la chaîne **ESLint** (dev) |
| Correction proposée par npm | `npm audit fix --force` ⇒ **eslint@4**, changement cassant |

**Décision : ne rien exécuter.** `--force` rétrograderait ESLint et casserait la
configuration *flat* imposée par `AGENTS.md` §4. Une montée de `minimatch` dans
la chaîne de lint est une tâche à part, avec révision d'ADR si elle change une
version majeure. **Les dépendances de production ne sont pas affectées.**

### 8.6 Verdicts mis à jour

| Critère | Verdict | Motif |
| --- | --- | --- |
| **C-O02** | ⏳ **NON CONCLU — mesure invalidée par le protocole** | `npm ci` réussit ; les étapes suivantes n'ont jamais été mesurées dans de bonnes conditions. **Ni satisfait, ni en échec.** |
| **C-O03** | ⛔ **BLOQUÉ** | aucune base créée ; refus effectif non testé sur Windows |
| **O7-B** | ⛔ **NON CONCLUANT** | verdict jamais lu |

Il serait malhonnête de conserver « C-O02 non satisfait » : la mesure qui le
disait était fausse. Il serait tout aussi malhonnête de le déclarer satisfait :
**aucune exécution valide n'a encore eu lieu sur Windows**.

### 8.7 Prochaine commande

Le script corrigé doit être **récupéré** avant relance : les deux exécutions
ci-dessus ont tourné sur `f383ac5`, c'est-à-dire **avant** le correctif.

```powershell
git fetch origin
git switch arena/079e2f26-engineering-knowledge-tooling
git pull --ff-only origin arena/079e2f26-engineering-knowledge-tooling
powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1
```

---

## 9. Troisième relance — **C-O02 satisfait** (31/10/2026, 18 h 17)

Exécution sur le script **corrigé**, commit mesuré **`dfb371e`**.

### 9.1 Résultat brut

```
[PASS] systeme             - Windows 11 Professionnel build 26300 / 64 bits / i5-8250U
[PASS] outils              - node v24.14.0 / npm 11.21.0 / commit dfb371e
[PASS] npm-ci              - code 0, node_modules/.bin/tsc present, prebuilds better-sqlite3 : True
[PASS] dependances-natives - better-sqlite3@13.0.3 ; sqlite-vec@0.1.9
[PASS] build               - code 0, dist/cli et dist/mcp presents, 7.2 s
[INFO] doctor              - code 0 — constat consigne, non compte comme preuve
[PASS] init-base           - base initialisee dans …\ekts-windows-check-20261031-181622
[PASS] accents-utf8        - ressource accentuee ajoutee
[PASS] recherche           - recherche FTS retrouve la ressource accentuee
[PASS] redemarrage         - persistance confirmee dans un nouveau processus
[PASS] acl                 - 3 bases ; ACL consignees
[BLOCKED] acl-acces-refuse - exige un second compte Windows non autorise
[PASS] latence             - protocole C-O07 : verdict CONFORME consigne
[INFO] audit-dependances   - code 1, 12 vulnerabilites moderates — constat

Etapes comptees : 11 PASS, 0 FAIL, 1 BLOCKED
```

### 9.2 C-O02 — ✅ satisfait, sur **cette** configuration et aucune autre

| Exigence de C-O02 | Preuve observée | État |
| --- | --- | --- |
| Édition et build Windows consignés | Windows 11 Professionnel **build 26300**, 64 bits | ✅ |
| Architecture CPU | Intel Core i5-8250U @ 1,60 GHz | ✅ |
| Version Node / npm | **v24.14.0** / **11.21.0** | ✅ |
| `better-sqlite3` et `sqlite-vec` résolus | **13.0.3** et **0.1.9** | ✅ |
| Compiler et démarrer | `npm ci` code 0 ; build code 0 en **7,2 s** ; `dist/cli` et `dist/mcp` présents | ✅ |
| Ajouter puis retrouver des fichiers synthétiques | ressource accentuée ajoutée, retrouvée en FTS | ✅ |
| Espace, accents, UTF-8 | titre et contenu `éàüç`, `où…élégantes` restitués correctement | ✅ |
| Arrêt et redémarrage | persistance confirmée dans un **nouveau processus** | ✅ |
| Chemins absolus | base créée sous `C:\Users\HP\AppData\Local\Temp\…` | ✅ |

**Portée stricte :** ces neuf exigences sont satisfaites pour Windows 11
Professionnel build 26300. **Aucune autre version de Windows n'est déclarée
compatible** — la règle du dossier 22 est explicite.

### 9.3 C-O03 — ⛔ toujours bloqué

Le script consigne les ACL de **3 bases** (`icacls`), mais l'étape
`acl-acces-refuse` reste **BLOCKED** : elle exige un **second compte Windows non
autorisé**, que le script ne peut pas créer.

| Volet | État |
| --- | --- |
| ACL lues et consignées (Windows) | ✅ 3 bases |
| Refus effectif, Windows | ⛔ **non mesuré** |
| Refus effectif, POSIX | ✅ mesuré (`ekts-probe`, refus réel + contrôle 0644) |

Conformément au seuil (« tous les accès non autorisés du jeu sont refusés »),
**C-O03 n'est pas déclaré réussi**.

### 9.4 O7-B — ✅ conforme, valeur exacte non communiquée

Le script rapporte « protocole C-O07 : **verdict CONFORME** consigne (seuil
500 ms sur p95) ». La console ne montre **pas** la valeur de p95 ; elle figure
dans `faits.latence` du rapport
`windows-check-20261031-181739.json`, que je n'ai pas reçu.

**Je ne fabrique donc aucun chiffre pour O7-B** : le verdict est conforme, la
valeur mesurée reste à transmettre pour être consignée.

### 9.5 Audit des dépendances — inchangé, non corrigé

`npm audit` : **12 vulnérabilités modérées**, toutes dans la chaîne **ESLint**
(dev) ; `npm audit --omit=dev` : **0**. `npm audit fix --force` **n'est pas
exécuté** (il installerait `eslint@4`). Écart `P3-24-05` maintenu.

### 9.6 Ce que la troisième exécution démontre sur la méthode

Deux mesures successives ont produit **des verdicts opposés** sur la même
machine : 7 FAIL, puis 0 FAIL. Le facteur n'était ni la machine, ni le réseau,
ni le projet, mais **le protocole**. C'est exactement pourquoi un résultat
négatif non reproductible ne doit pas être publié comme un défaut du produit —
et pourquoi la relance après correction était nécessaire avant tout verdict.
