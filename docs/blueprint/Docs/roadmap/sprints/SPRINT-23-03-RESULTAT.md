# SPRINT-23-03 — Sauvegarde, contrats historiques et docs — résultat

**Sprint parent :** [SPRINT-23](SPRINT-23.md) · **Base :** `6d8ac00` · **Date :** 31 octobre 2026
**Statut :** ✅ **C-O04 satisfait (2/2 scénarios) · C-O05 satisfait sur le corpus sélectionné · C-O06 satisfait · C-W12 re-vérifié GREEN** — référence de commit : **à renseigner** (voir § 6).

## 1. Ce qui a été construit

| Fichier | Rôle |
| --- | --- |
| `src/data/backup.ts` | `VACUUM INTO` par base, manifeste (empreintes, `user_version`, compteurs, `nonAtomic`), vérification, restauration gardée |
| `scripts/db-backup.mjs` + `npm run db:backup|db:verify|db:restore` | procédure opérateur sans nouvelle commande CLI |
| `tests/data/backup.test.ts` | 6 cas : restauration, refus d'écrasement, destination non vide, altération, incohérence bloquante, interruption `SIGKILL` |
| `tests/docs/tool-inventory.test.ts` | 2 cas : 17 outils confrontés à `tools/list` et `readOnlyHint` ; liens locaux |
| `docs/BACKUP.md` | procédure, limites, reprise |

## 2. Résultats mesurés

**C-O04 — 2/2 scénarios.** Normal : saisie de 3 ressources indexées → manifeste cohérent (3/3) → restauration → 3 ressources et recherche FTS fonctionnelle. Interruption : enfant tué par `SIGKILL` après un commit confirmé et l'ouverture d'une transaction non validée.

**Constat réel de l'interruption (consigné par le test) :**

```
[C-O04] après SIGKILL : 1 ressources, 0 entrées FTS, cohérent=false
```

La ressource validée subsiste ; l'index FTS ne la contient pas ; la sauvegarde
est signalée incohérente et la **restauration est refusée**, destination laissée
vierge. Aucune perte silencieuse : la divergence est détectée et bloque
l'opération. L'explication fine de l'absence d'entrée FTS (deux écritures
autonomes en mode WAL, ou non-rejeu du journal) **n'est pas établie** — elle est
consignée comme écart P3, pas comme conclusion.

**C-O05 — corpus sélectionné :** `tests/storage/audit-diagnostics.test.ts` et
`audit-repository.test.ts` = **36 passed** ; aucune modification de comportement
historique introduite par 23-03.

**C-O12/C-W12 :** diagnostic en lecture seule déjà en place (codes
`priority-mismatch`, `counter-mismatch`, `unknown-origin-zero`), re-vérifié
GREEN ; **aucune réécriture** de données historiques.

**C-O06 :** 17/17 outils documentés dans `docs/MCP.md`, statut `**action**`
cohérent avec `readOnlyHint` de `tools/list` ; aucun lien local mort dans
`docs/MCP.md`, `docs/CLI.md`, `docs/API_REFERENCE.md`, `README.md`.

## 3. Traçabilité

| Commande | Code | Résultat |
| --- | --- | --- |
| `npm run verify` | 0 | 173 fichiers passés, 6 sautés ; **1 975 passed**, 39 sautés ; couverture 95,75 / 89,02 / 97,27 / 95,86 |
| `npx vitest run tests/data/backup.test.ts` | 0 | **6 passed** |
| `npx vitest run tests/docs/tool-inventory.test.ts` | 0 | **2 passed** |
| `npx vitest run tests/storage/audit-diagnostics.test.ts tests/storage/audit-repository.test.ts` | 0 | **36 passed** |

**Méthode RED.** C-O04 n'avait aucune API : le RED est l'absence de capacité,
**déclaré comme non recevable** au sens du dossier ; la preuve est le GREEN avec
oracles figés avant le code. Le cas d'interruption était GREEN dès le départ
(comportement SQLite), et l'a montré deux fois : une fois par une erreur réelle
de mon test (insertion sans indexation → incohérence détectée), une fois par le
constat ci-dessus.

## 4. Limites déclarées

1. **Non-atomicité multi-fichiers assumée** : la cohérence est vérifiée par
   compteurs, pas garantie par une transaction distribuée.
2. **Pas de sauvegarde incrémentale ni planifiée** : hors périmètre de C-O04.
3. **Un cas `skipped` reste un cas non réussi** : les 6 fichiers sautés de
   `verify` sont les suites navigateur/Windows déjà déclarées.
4. **L'origine de la perte d'index après `SIGKILL` n'est pas élucidée** (P3).

## 5. Écarts

| # | Écart | Suite |
| --- | --- | --- |
| **P3-23-01** | Divergence données/index après arrêt brutal, cause non établie | instrumenter 23-… ou un sprint d'exploitation ; ne pas conclure sans mesure |
| **P3-23-02** | `AGENTS.md` §1.6 (commit+push couplés) contredisait la consigne « aucun push » | **arbitré par le propriétaire : commit + push couplés** |
| **P3-23-03** | Le dossier 23-03 prescrit « aucune PR ni push » | contredit `AGENTS.md` v1.1 ; traité selon l'arbitrage |

## 6. Référence de commit

Conformément aux règles du registre, la référence du commit de ce sous-sprint
n'est **pas** annoncée ici : elle est relevée après création et consignée dans un
commit documentaire distinct.
