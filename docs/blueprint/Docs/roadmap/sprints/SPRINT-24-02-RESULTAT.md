# SPRINT-24-02 — Préparation G0 — résultat et dossier

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Base :** `437b968` · **Date :** 31 octobre 2026
**Statut :** ⛔ **dossier G0 fermé · mesure O2-B exécutée et ÉCHOUÉE (5 PASS / 7 FAIL / 1 BLOCKED) · protocole corrigé**. Commit initial : `da7c4df` ; correction du protocole et mesure : **`78dedcf`**.

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
