# Sprint 11-2 — Résultat (24 octobre 2026)

**Sous-sprint :** 11-2 — Comparaison d'audits (3 jours prévus)
**Statut :** ✅ LIVRÉ — 3 commits atomiques
**Critères :** C11.3 (comparaison < 1 s), C11.10, C11.11, C11.13, C11.16 (couverture > 80 %)

---

## 1. Fichiers livrés

| Fichier | Lignes | Commit |
| --- | --- | --- |
| `src/reports/comparator.ts` | 254 | `56dd2db` |
| `src/reports/templates/comparison-markdown.ts` | 83 | `5d622d5` |
| `tests/reports/comparator.test.ts` | 319 | `56bfbdd` |
| **Total** | **656** | 3 commits |

---

## 2. Tests et couverture

- `npx vitest run tests/reports/comparator.test.ts` : **17 ✅**.
- Le fichier de test couvre **à la fois** les 11 cas de la spécification
  (deltas, évolutions, constats, recommandations, performance) **et** les
  5 cas prévus pour `comparison-markdown` (écart E11-7 : la mission limite à
  8 fichiers de tests, le dossier ne listant pas
  `tests/reports/comparison-markdown.test.ts`).
- Couverture du périmètre : `comparator.ts` **98,7 %**, `comparison-markdown.ts`
  **100 %** (lcov).
- Vérifications : `tsc` ✅, `eslint` ✅, `prettier` ✅.

---

## 3. Performance mesurée

| Budget | Mesure locale | Verdict |
| --- | --- | --- |
| Comparaison < 1 s (100 constats) | ≈ ms (test `compare 100 constats en moins d'une seconde`) | ✅ |

---

## 4. Problèmes rencontrés et résolus

1. **Symétrie des pourcentages** : `pct = delta / scoreA × 100` n'est pas
   antisymétrique (+7/70 = +10 %, −7/77 ≈ −9,1 %) — comportement voulu de la
   spécification (base = score A) ; le test de symétrie porte sur les deltas
   en points, les pourcentages étant documentés par sens de comparaison.
2. **Améliorations de sévérité** : la clé d'appariement inclut `severity`
   (spécification) ; un constat corrigé (3 → 1) apparaît donc à la fois en
   « résolu » (ancienne clé) et « nouveau » (nouvelle clé), `improvedFindings`
   signalant l'amélioration — double comptage assumé et testé, aucun
   constat n'est muté.
3. **Délégation du rapport détaillé** : `generateDetailedReport` délègue à
   `MarkdownTemplate.generateComparisonReport` (source unique partagée avec
   `MarkdownReportGenerator.generateComparison`) — pas de duplication de
   rendu.

---

## 5. Écarts consignés

E11-7 (test `comparison-markdown` intégré à `comparator.test.ts`).

---

## 6. Temps

Durée réelle : **1 session du 24 octobre 2026** (≈ 25 min d'exécution agent),
contre 3 jours théoriques. Aucun blocage résiduel.
