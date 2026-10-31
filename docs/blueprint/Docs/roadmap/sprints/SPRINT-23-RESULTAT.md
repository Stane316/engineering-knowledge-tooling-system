# SPRINT-23 — Preuves locales, compatibilité et exploitation — résultat

**Date :** 31 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Statut :** ⚠️ **deux sous-sprints satisfaits, un partiel** — aucune clôture complète annoncée.

| Sous-sprint | Verdict | Preuve principale |
| --- | --- | --- |
| **23-01** | ✅ C-T01 5/5, C-T02 4/4 | [résultat](SPRINT-23-01-RESULTAT.md) — 28 cas, `verify` EXIT 0 |
| **23-02** | ⚠️ C-T03 canaris 0 exposé ; **accès non mesuré** ; C-O02/C-O03 **bloqués** | [résultat](SPRINT-23-02-RESULTAT.md) — 15 cas, protocole Windows fourni |
| **23-03** | ✅ C-O04 2/2, C-O05, C-O06, C-W12 | [résultat](SPRINT-23-03-RESULTAT.md) — 8 cas, `verify` EXIT 0 |

## 1. Périmètre réellement livré

- **Observabilité** : cinq événements (`fts`, `read`, `zero_result`, `error`,
  `refusal`) au niveau `server->client`, session/outil/mode/statut/version ;
  qualification des citations en quatre verdicts par empreintes de fenêtres.
- **Confidentialité** : caviardage des traces (secret connu ou forme
  reconnaissable, marqueur fixe), garde statique d'export, modes 0700/0600.
- **Exploitation** : sauvegarde `VACUUM INTO` avec manifeste et restauration
  gardée ; procédure opérateur ; inventaire documentaire confronté au serveur.

## 2. Ce qui n'est pas prouvé

| # | Non prouvé | Pourquoi |
| --- | --- | --- |
| 1 | Refus effectif d'un accès non autorisé | aucun second compte de test ; les modes ne valent pas refus |
| 2 | Windows natif (C-O02, C-O03, O7-B) | machine du propriétaire ; `scripts/windows-check.ps1` fourni |
| 3 | Contenu réellement transmis au modèle | la couche observée s'arrête au serveur |
| 4 | Cause de la divergence données/index après `SIGKILL` | constat reproductible, explication non établie |

## 3. Commandes et statuts

| Commande | Code | Statut |
| --- | --- | --- |
| `npm run verify` (23-01) | 0 | 1 952 passed |
| `npm run verify` (23-02) | 0 | 1 967 passed |
| `npm run verify` (23-03) | 0 | **1 975 passed**, 39 sautés |
| `scripts/windows-check.ps1` | — | **non exécuté** |

## 4. Risques résiduels

Le journal d'événements est en mémoire ; la sauvegarde n'est pas atomique
multi-fichiers ; le caviardage ne couvre pas un secret transformé ; une
interruption peut laisser données et index divergents — détecté, jamais réparé
silencieusement.

## 5. Écarts P3

`P3-23-01` divergence après arrêt brutal · `P3-23-02` contradiction
`AGENTS.md` / consigne de push (**arbitrée**) · `P3-23-03` clause « ni PR ni push »
du dossier 23-03 (**arbitrée**).

## 6. Suites

Décisions du propriétaire : E1–E6 (option E), V1–V5 (révision), mesure O2-B,
autorisation d'un second compte de test. Puis S24 (consolidation), et non S25,
tant que les chantiers d'ingestion ne sont pas validés.

## 7. Référence de commit

Non annoncée ici : relevée après création, consignée dans le registre lors d'un
commit documentaire distinct.
