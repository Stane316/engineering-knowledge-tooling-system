# Bilan de la série 19 — Fiabilité des priorités et intégrité des scores web

**Date :** 30 octobre 2026 — **Statut :** ✅ **Les trois sous-sprints sont
terminés** ; **le bilan est transmis pour accord** — le sprint 20 n'est pas
engagé.

**Exigences couvertes :** W01, W02, W03, O04.
**Sous-sprints :** [19-01](SPRINT-19-01-RESULTAT.md) ·
[19-02](SPRINT-19-02-RESULTAT.md) · [19-03](SPRINT-19-03-RESULTAT.md).

## 1. Objectif et périmètre réellement traité

La série devait « supprimer les contradictions de priorité et distinguer mesures
absentes, invalides et score global indisponible, sans réécrire les audits
historiques » ([SPRINT-19.md](SPRINT-19.md) §1).

| Sous-sprint | Objectif | Critères | Résultat |
| --- | --- | --- | --- |
| 19-01 | Priorité canonique et comptage | C-W01, C-W02, C-W04 | ✅ terminé |
| 19-02 | Cohérence stockage et rendus | C-W03, C-W12 | ✅ terminé (PDF sous réserve d'environnement) |
| 19-03 | Mesures absentes et score global | C-W05, C-W06, C-W07 | ✅ terminé |

**Hors périmètre, non traité :** marketplace, collaboration distante, client MCP
sortant, intégrations, exécution automatique de scripts, fournisseur imposé.

## 2. Commits réels de la série

| Date | Livrable | Commit |
| --- | --- | --- |
| 30/10/2026 | 19-01 — priorité canonique, compteur `info`, ordre de recommandation | `ad5cd35` |
| 30/10/2026 | 19-01 — test E2E du parcours d'audit local | `693fced` |
| 30/10/2026 | 19-01 — rapport + registre | `a8a1388` |
| 30/10/2026 | 19-02 — trois formats, diagnostic des données historiques | `696e165` |
| 30/10/2026 | 19-02 — rapport + registre | `fcd7d06` |
| 30/10/2026 | 19-03 — contrat des mesures et du score global | `b48c175` |
| 30/10/2026 | 19-03 — migration 010 et persistance | `2e24cb5` |
| 30/10/2026 | 19-03 — rapport | `5253332` |
| 30/10/2026 | 19-03 — alignement des types de lecture SQL | `fc6bfa4` |
| 30/10/2026 | Ce bilan + registre | à renseigner après commit |

**État Git vérifié le 30/10/2026 :**

- `origin/arena/079e2f26-engineering-knowledge-tooling` = `fc6bfa4` (avant ce
  bilan), arbre propre, **aucun commit résiduel** ;
- `origin/develop` = `398df3e`, **strictement ancêtre** de la branche ;
- **12 commits** d'avance sur `develop`, **102 fichiers** modifiés au total ;
- aucun push hors de la branche Arena, aucune PR, aucune fusion par l'agent.

## 3. Critères évalués

| Critère | Exigence | État | Preuve principale |
| --- | --- | --- | --- |
| C-W01 | Une seule priorité canonique `severity × (6 − effort)` partout | ✅ | `tests/analysis/canonical-priority.test.ts`, parcours E2E `693fced` |
| C-W02 | Cinquième compteur `info` persisté et rendu | ✅ | migration 009, `tests/integration/audit-migration-009.test.ts` |
| C-W03 | Markdown, HTML et PDF d'un même audit, décompte vérifié dans le texte du PDF | ✅ | `tests/reports/{html-generator,pdf-text-extraction,report-reservations}.test.ts`, `tests/e2e/report-formats.test.ts` |
| C-W04 | Ordre de recommandation nommé, distinct de la priorité | ✅ | `tests/analysis/canonical-priority.test.ts`, rapport 19-01 |
| C-W05 | Aucune mesure absente remplacée par `0` | ✅ | `tests/analysis/measurement-availability.test.ts` (14), `tests/browser/lighthouse.test.ts` réécrit |
| C-W06 | Quatre états d'accessibilité distincts, `nodes` absent non inventé | ✅ | `tests/analysis/axe-availability.test.ts` (7) |
| C-W07 | Score global mesuré ou indisponible avec raison, sans renormalisation, persistant | ✅ | `tests/reports/score-unavailable.test.ts` (12), `tests/integration/audit-migration-010.test.ts` (9) |
| C-W12 | Données historiques lisibles, anomalies signalées, aucune réécriture | ✅ | `tests/storage/audit-diagnostics.test.ts`, `tests/reports/report-reservations.test.ts` |

## 4. Faits mesurés (sorties réelles)

| Mesure | 19-01 | 19-02 | 19-03 |
| --- | --- | --- | --- |
| `npm run verify` | 0 | 0 | 0 |
| Tests réussis / ignorés | 1 669 / — | 1 695 / 30 | 1 732 / 38 |
| Fichiers de test | 132 verts | 137 verts, 4 ignorés | 139 verts, 6 ignorés |
| Couverture globale | 96,41 % | 96,65 % | 96,03 % |

**Exécution du programme (19-03, binaire compilé `dist/cli/index.js`) :**

```text
$ node dist/cli/index.js --version
0.2.0
$ EKTS_DATA_DIR=/tmp/ekts-demo node dist/cli/index.js init
  schéma       v10
$ EKTS_DATA_DIR=/tmp/ekts-demo node dist/cli/index.js status
  version 0.2.0 · node v22.22.3 · plateforme linux
$ EKTS_DATA_DIR=/tmp/ekts-demo node dist/cli/index.js audit list
📭 Aucun audit trouvé.
```

Schéma constaté dans la base créée par `init` (lecture `PRAGMA table_info`) :

```text
audit_metadata   -> overall_score (NOT NULL=0), score_status (NOT NULL=1), score_reason (NOT NULL=0)
audit_dimensions -> score (NOT NULL=0), score_status (NOT NULL=1), score_reason (NOT NULL=0)
schema_migrations -> v10 score-availability, v9 info-findings
```

**Non exécuté et pourquoi :** aucune inspection réelle (`ekts inspect`) ni
rapport PDF dans cette série — le bac à sable n'a **ni navigateur Chromium ni
accès CDN**. Ces étapes sont déclarées `bloqué`, jamais `réussi`.

## 5. Écarts P3 et réserves

| # | Écart | Portée | Traitement |
| --- | --- | --- | --- |
| E19-1 | Les trois fichiers de tests du contrat 19-03 ont été écrits **après** l'implémentation | preuve RED partielle | consigné dans le rapport 19-03 ; RED réel observé sur les tests qui exigeaient l'ancien `0` (2 échecs) et sur 132 fixtures |
| E19-2 | Migration 010 étendue à `audit_dimensions` (validation du 30/10) au-delà du périmètre initial | contrat de migration | décision du propriétaire ; documentée dans 010 et au rapport 19-03 |
| E19-3 | `getStatistics()` conserve `0` pour un agrégat `NULL` (ensemble vide **ou** aucun score mesuré) | convention historique | documenté dans le code, **hors périmètre validé** ; dette assumée |
| E19-4 | Message du commit `2e24cb5` annonçant « 7 cas » alors que le fichier en contient 9 | traçabilité | rectifié dans le rapport 19-03, historique non réécrit |
| E19-5 | Suites PDF et navigateurs ignorées faute de binaire | couverture | 38 cas ignorés, comptés séparément, aucun succès simulé |

## 6. Risques résiduels

1. **Aucune preuve CI distante** — la facturation reste en échec, aucun job n'a
   tourné. Les résultats ci-dessus sont locaux au bac à sable.
2. **Rendus PDF et inspections réelles non revérifiés** depuis 19-02 : ils
   exigent Chromium et un réseau ; à rejouer sur le poste.
3. **Base antérieure à la migration 010** : la lecture tolère l'absence des
   colonnes, mais toute écriture d'indisponibilité exige la migration appliquée.
   Aucune réécriture des lignes historiques n'est faite (elles restent
   `measured`).
4. **Convention des statistiques** (E19-3) : une moyenne `0` peut encore
   désigner « aucun score mesuré ». La tendance, elle, omet ces périodes.

## 7. Commandes réellement exécutées pendant la série

```text
npx tsc --noEmit                       # 0 erreur (src + tests)
npx vitest run                         # suites ciblées puis complètes
npx prettier --write / --check .
npm run build                          # dist/cli/index.js
npm run verify                         # EXIT 0 (typecheck, lint, format, build, coverage)
git status --porcelain                 # arbre propre avant/après chaque commit
git log --oneline -1                   # contrôle avant chaque git add
git push origin arena/…                # après chaque commit, jamais --force
node dist/cli/index.js {--version,--help,init,status,audit list}
```

## 8. Commandes à exécuter sur le poste (PowerShell 5.1)

> **L'agent ne fusionne pas** : les étapes 3 et 5 vous appartiennent. Aucune PR,
> aucun `--force`, aucune réécriture d'historique.

```powershell
# 1. Récupération
git fetch --all --prune
git rev-parse origin/arena/079e2f26-engineering-knowledge-tooling   # doit afficher fc6bfa4 (ou le hash du bilan)

# 2. Contrôles avant fusion (lecture seule)
git merge-base --is-ancestor origin/develop origin/arena/079e2f26-engineering-knowledge-tooling; $LASTEXITCODE  # 0 attendu
git rev-list --count origin/develop..origin/arena/079e2f26-engineering-knowledge-tooling                       # 12 (+ commits du bilan)
git diff --stat origin/develop..origin/arena/079e2f26-engineering-knowledge-tooling

# 3. Fusion dans la branche d'intégration (à votre main)
git switch develop
git pull --ff-only origin develop
git merge --no-ff origin/arena/079e2f26-engineering-knowledge-tooling -m "merge(sprint-19): priorites, rendus et scores indisponibles"
# variante linéaire possible, develop étant strictement ancêtre :
# git merge --ff-only origin/arena/079e2f26-engineering-knowledge-tooling

# 4. Installation, tests et vérifications sur le poste
npm ci
npm run verify            # typecheck + lint + format:check + build + couverture
npm run test:e2e          # navigateurs Playwright requis
npm run test:e2e:mvp3

# 5. Exécution du programme
$env:EKTS_DATA_DIR = Join-Path $env:TEMP "ekts-19"
node dist/cli/index.js --version
node dist/cli/index.js init            # doit annoncer « schéma v10 »
node dist/cli/index.js status
node dist/cli/index.js audit list
node dist/cli/index.js inspect https://example.com   # navigateur + réseau requis
```

## 9. Ce qui n'est pas prouvé

- Aucun job CI distant, aucune exécution sur le poste Windows de validation.
- Aucun rendu PDF ni inspection réelle dans cette série.
- Les budgets de performance (L1/L2/L3) ne sont pas remesurés ici.
- L'absence de régression sur les ~2 000 cas hors séries n'est couverte que par
  la suite locale (`verify`), pas par une matrice de versions.

## 10. Checklist de clôture (SPRINT-19.md §8)

| Point | État | Preuve |
| --- | --- | --- |
| Feu vert et prérequis vérifiés | ✅ | feu vert 19-01 → 19-03, arbitrages 30/10 |
| Tests U/I/E2E préparés avant chaque implémentation | ⚠️ partiel | 19-01/19-02 oui ; 19-03 non (E19-1) |
| RED pertinent ou GREEN initial justifié | ⚠️ partiel | RED réel sur le comportement remplacé ; GREEN initial documenté |
| Critères évalués selon 22, échecs et skips explicités | ✅ | §3 et §4 |
| Contrats, migrations, données historiques vérifiés | ✅ | migrations 009 et 010, instantanés avant/après |
| Rapports et commits réels traçables | ✅ | §2 |
| Registre à jour (date + commit) | ✅ | journal §4 du registre |
| Bilan transmis et validation obtenue | ⏳ | **ce document — accord attendu** |

## 11. Bilan et décision attendue

La série 19 atteint son objectif : la priorité est unique, les compteurs sont
complets, trois formats sont produits et contrôlés, les données historiques sont
diagnostiquées sans réécriture, et **aucune mesure absente n'est plus convertie
en `0`** — ni dans l'analyse, ni dans les rapports, ni en base, ni dans la
timeline.

**Deux points restent ouverts, hors du périmètre de 19 :** la convention `0` des
statistiques agrégées (E19-3) et la preuve CI/navigateur/PDF sur le poste.

**Décision demandée :** accord explicite sur ce bilan. **Le sprint 20
(Métriques, preuves et sécurité web) n'est pas engagé** et ne le sera qu'après
votre validation distincte.
