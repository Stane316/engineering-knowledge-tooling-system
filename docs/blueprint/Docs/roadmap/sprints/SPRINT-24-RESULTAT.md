# SPRINT-24 — Validation transversale et décision sur le pilote — résultat

**Date d'exécution :** 31 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Statut :** ⛔ **sprint exécuté et non clôturé comme réussi — aucun pilote autorisé**. G0 fermée, G1 non atteint, G2 non atteint, G3 en attente du propriétaire.

| Sous-sprint | Verdict | Rapport |
| --- | --- | --- |
| **24-01** | ⚠️ 4/6 critères ✅, C-W03 partiel (PDF), CI distante non exécutée | [résultat](SPRINT-24-01-RESULTAT.md) |
| **24-02** | ⚠️ dossier G0 prêt, **G0 fermée** (5 champs manquants) | [résultat](SPRINT-24-02-RESULTAT.md) |
| **24-03** | ⛔ G1 et G2 non atteints, décision : **pas de pilote** | [résultat](SPRINT-24-03-RESULTAT.md) |

## 1. Périmètre réellement livré

Aucun code modifié : le sprint est **documentaire et de vérification**. Livré :
la matrice de preuve M sur la révision candidate, le dossier de préparation G0
(exécutable dès fourniture des cinq champs), la matrice G1/G2 et la décision
explicite de ne pas lancer de pilote.

## 2. Faits saillants

- **97 tests passés, 5 sautés** sur les 12 fichiers des critères M (24-01).
- **C-W03 partiel** : Markdown et HTML vérifiés, **PDF non exécuté** (5 cas sautés).
- **CI distante non exécutée** : les jobs n'ont pas démarré (facturation GitHub).
  Aucun statut de CI n'est revendiqué, ni vert ni rouge.
- **Accès non autorisé refusé, mesuré** (compte `ekts-probe`, refus réel + contrôle).
- **P3-23-01 non déterministe** (1/0 puis 1/1) : détection conservée, cause non établie.
- **Mesure O2-B, trois exécutions** : 5 PASS / 7 FAIL, puis cause établie (défaut de mon protocole : `Stop` + `2>&1` sur `stderr`), puis **11 PASS / 0 FAIL / 1 BLOCKED** sur le script corrigé ⇒ **C-O02 satisfait** sur Windows 11 Pro build 26300 (better-sqlite3 13.0.3, sqlite-vec 0.1.9, build 7,2 s, accents UTF-8, redémarrage).

## 3. Commandes et statuts

| Commande | Code | Statut |
| --- | --- | --- |
| `npx vitest run` (12 fichiers des critères M) | 0 | **97 passed / 5 skipped** |
| `npm run verify` (dernière exécution, `fc97b64`) | 0 | 1 975 passed, 39 sautés — **aucun fichier de code modifié depuis** |
| `gh run view 41220461921` | 0 | **jobs non démarrés** (facturation) |
| `scripts/windows-check.ps1` | 0 | **11 PASS / 0 FAIL / 1 BLOCKED** (Windows 11 build 26300, commit `dfb371e`) |

## 4. Limites et blocages

| # | Blocage | Conséquence |
| --- | --- | --- |
| 1 | CI distante arrêtée par la facturation GitHub | aucun statut distant ; à rétablir côté compte |
| 2 | PDF non exécuté | C-W03 partiel |
| 3 | Windows 11 **mesuré et satisfait** ; refus effectif non testé | **C-O02 levé**, **C-O03 bloqué**, O7-B conforme (p95 exact non transmis) |
| 4 | C-P07 (confinement strict) | G1 non atteint |
| 5 | G0-1 à G0-5 non fournis | aucune campagne ; C-T04/T05/T06 bloqués |

## 5. Écarts P3

| # | Écart | État |
| --- | --- | --- |
| P3-23-01 | divergence données/index après arrêt brutal | **ouvert** — non déterministe, reproduction instrumentée à planifier |
| P3-24-01 | CI distante non exécutable (facturation) | **nouveau**, dépend d'une action du propriétaire |
| P3-24-02 | PDF non exécuté faute de navigateur | **nouveau**, prérequis d'environnement |
| P3-24-03 | `npm ci` **réussit** : le FAIL venait du protocole | **résolu** — mesure valide obtenue (11 PASS) |
| P3-24-04 | protocole O2-B défectueux (5 défauts cumulés) | **résolu** — corrigé en deux passes ; la troisième mesure fait foi |
| P3-24-05 | 12 vulnérabilités modérées dans la chaîne ESLint (dev) | **constat** — `--omit=dev` = 0 ; `npm audit fix --force` **refusé** (rétrograderait eslint@4) |

## 6. Risques résiduels

Le système est **conforme sur ce qui est mesurable** et **non démontré sur sa
valeur**. Confondre les deux serait l'erreur principale : un pilote lancé sans
G0 ne prouverait rien et coûterait le budget qu'il prétendrait justifier.

## 7. Suites proposées

1. Rétablir la CI (facturation) — action propriétaire.
2. Fournir le **second compte Windows** (C-O03) et le **p95 de O7-B** (champ `faits.latence` du JSON).
3. Fournir G0-1 à G0-5 — action propriétaire.
4. Ouvrir **S25** (ingestion et lecture gouvernée, option E validée) — décision
   de sprint distincte, non couverte par le feu vert du Sprint 24.

## 8. Commits

| Commit | Contenu |
| --- | --- |
| `e4ff0a3` | 24-01 : matrice de preuve M |
| `437b968` | registre 24-01 |
| `da7c4df` | 24-02, 24-03 et bilan |
| `f383ac5` | registre du bilan |
| `78dedcf` | première correction du protocole O2-B |
| `103dc98` | registre O2-B |
| `469c3ed` | correction définitive du protocole (`stderr` + `Stop`) |
| `dfb371e` | registre O2-B |
| `c8e7c22` | **mesure C-O02 satisfaite** (11 PASS) |
| `bfb1ac3` | registre C-O02 |

**Dernier état : `bfb1ac3`, arbre propre, distante alignée.**
