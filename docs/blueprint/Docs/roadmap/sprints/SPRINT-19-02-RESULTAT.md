# Rapport Sprint 19-02 — Trois formats et données historiques

**Date :** 30/10/2026 — **Statut :** ✅ TERMINÉ (`npm run verify` = 0 ; 1 695 tests
réussis, 30 ignorés ; couverture 96,65 %)

## Objectif

Exigences **W01** et **O04** — critères **C-W03** et **C-W12**.

- **C-W03** : produire **Markdown, HTML et PDF** d'un même audit synthétique et
  contrôler le décompte par priorité dans les données, le Markdown, le HTML et
  le **texte extrait du PDF**. « Si extracteur PDF ou navigateur indisponible :
  `bloqué`, pas réussi. »
- **C-W12** : deux fixtures historiques (priorité contradictoire, zéro
  d'origine inconnue) doivent rester lisibles, voir l'incohérence et l'origine
  **signalées**, sans **aucune** réécriture silencieuse ni attribution
  rétroactive.

## État relevé avant travaux

| Constat | Preuve |
| ------- | ------ |
| Aucun rapport **HTML** n'existait | `HtmlTemplate` ne servait qu'à alimenter le PDF ; `--format` acceptait `md, pdf, both` |
| Aucun **extracteur de texte PDF** dans le dépôt | `grep` sur `package.json` et `tests/` : aucune dépendance PDF, aucun test d'extraction |
| Aucun **diagnostic** des données historiques | rien ne signalait une priorité incohérente ni l'origine d'un zéro |
| CDN navigateur **inaccessibles** dans ce bac à sable | Playwright/Puppeteer renvoient 000 ; seul `registry.npmjs.org` répond |

## Décisions prises et validations

- **`pdfjs-dist` en `devDependency`** — validé par le propriétaire le 30/10/2026
  (`^6.4.299`). Dépendance de test uniquement : aucun impact sur le paquet
  produit. `package-lock.json` mis à jour, `npm ci` reproductible.
- **Formats CLI** : `md`, `html`, `pdf`, `both`, `all` pour `audit report`.
  `both` reste `md + pdf` (contrat historique intact) ; `all` produit les trois.
- **`audit compare`** refuse explicitement `html` et `all` : ce chemin ne
  produit pas de HTML, et l'annoncer serait une affirmation fausse.

## Livrables

### Code

- `src/reports/html-generator.ts` — `HtmlReportGenerator` (`generateSync`,
  `generate`), réutilise `HtmlTemplate` : HTML et PDF **ne peuvent pas diverger**
  sur les compteurs.
- `src/reports/types.ts` — `ReportFormat` étendu (`html`, `all`),
  `GeneratedReport.format` étendu, `ReportOptions.diagnostics`.
- `src/reports/markdown-generator.ts` — `buildReservationsSection()`.
- `src/storage/audit-diagnostics.ts` — `AuditDiagnostics` en **lecture seule** :
  `priority-mismatch`, `counter-mismatch`, `unknown-origin-zero`.
- `src/cli/commands/audit.ts` — `--format html|all`, diagnostic calculé au
  moment du rapport, réserves affichées en sortie humaine et en JSON.
- `package.json` / `package-lock.json` — `pdfjs-dist` (dev).

### Tests (écrits avant le code)

| Fichier | Niveau | Tests |
| ------- | ------ | ----- |
| `tests/reports/html-generator.test.ts` | U | 5 |
| `tests/reports/pdf-text-extraction.test.ts` | U/I | 1 (extraction réelle) |
| `tests/storage/audit-diagnostics.test.ts` | I | 4 |
| `tests/reports/report-reservations.test.ts` | I | 4 |
| `tests/e2e/report-formats.test.ts` | E2E | 3 |
| `tests/helpers/chromium.ts` | support | résolution partagée du binaire |

## Résultats RED puis GREEN

**RED comportemental obtenu** après pose des signatures vides (les erreurs
d'import ne comptent pas comme RED) :

- `html-generator` : 5 échecs — `Error: non implémenté`.
- `audit-diagnostics` : 2 échecs — `expected undefined to be defined`
  (aucune anomalie retournée).

**Défauts de mes fixtures, corrigés avant implémentation** (consignés, pas
dissimulés) :

1. `projects` créée à la main avant la migration 001 → `no such column: status` ;
   correction : laisser la migration 001 créer `projects`.
2. Base historique sans bases attachées → `unknown database fts` ; correction :
   passer par `openDatabase({ migrate: false })`.
3. Base historique sans `audit_dimensions`/`audit_findings` → fixture rendue
   fidèle au schéma réel (trois tables).
4. Assertion textuelle trop stricte (`origine inconnue` vs « son origine est
   inconnue ») → assertion reformulée en expression régulière, **sans changer
   le sens exigé par le critère**.

## Mesures (sorties réelles, 30/10/2026)

| Contrôle | Résultat |
| -------- | -------- |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run format:check` | 0 |
| `npm run build` | 0 |
| `npm run coverage` | 137 fichiers verts, 4 ignorés ; **1 695 tests réussis, 30 ignorés** (1 725) |
| Couverture globale | 96,65 % instructions, 90,94 % branches, 97,67 % fonctions, 96,85 % lignes |
| Trois formats produits par une commande | 1 `.md`, 1 `.html`, 1 `.pdf` (test E2E) |
| Texte extrait du PDF | contient `Critical`, `High`, `Medium`, `Low`, `Info`, le total et `#12` |

## Points de vigilance

- **Le PDF dépend d'un binaire Chromium.** Les deux suites de rendu se
  **sautent explicitement** s'il est absent (`describe.skipIf`), jamais un
  succès simulé. Dans ce bac à sable, Chromium est fourni hors dépôt
  (`EKTS_CHROME_PATH`) ; en CI, c'est le Chromium Playwright. **Aucun budget
  PDF n'est engagé par ce rapport.**
- **`C-W12` sera revérifié au Sprint 23** (le dossier le prévoit).
- **Pas de preuve CI distante** : facturation toujours en échec, aucun job
  exécuté.

## Checklist de clôture

| Critère | État | Preuve |
| ------- | ---- | ------ |
| C-W03 — trois formats réellement produits | ✅ | `report-formats.test.ts` (3), `html-generator.test.ts` (5) |
| C-W03 — décompte contrôlé dans le texte du PDF | ✅ | `pdf-text-extraction.test.ts`, `report-formats.test.ts` |
| C-W12 — 2/2 fixtures historiques lisibles | ✅ | `audit-diagnostics.test.ts` (4) |
| C-W12 — incohérence et origine signalées | ✅ | `audit-diagnostics.test.ts` + `report-reservations.test.ts` (4) |
| C-W12 — zéro réécriture | ✅ | instantanés JSON complets avant/après diagnostic |
| Tests avant code, RED réel | ✅ | `non implémenté` puis GREEN |
| Aucun test ignoré compté comme réussite | ✅ | 30 ignorés comptés séparément |
| `verify` = 0 | ✅ | sortie du 30/10/2026 |

## Prochaine étape

**Sprint 19-03** — C-W05 (mesures absentes), C-W06 (axe), C-W07 (score global
`null` + raison). **Point d'arrêt prévu** : le contrat retenu par le
propriétaire impose de rendre `overall_score` nullable, ce qui exige une
**reconstruction de la table `audit_metadata`** (SQLite ne sait pas retirer une
contrainte `NOT NULL` par `ALTER TABLE`). Une telle migration sera soumise à
validation humaine avant exécution.
