# Sprint 11-1 — Résultat (24 octobre 2026)

**Sous-sprint :** 11-1 — Rapports Markdown + PDF (4 jours prévus)
**Statut :** ✅ LIVRÉ — 3 commits atomiques
**Critères :** C11.1 (MD < 2 s), C11.2 (PDF < 10 s), C11.10 (TS strict), C11.11 (JSDoc FR), C11.13 (erreurs gérées), C11.15 (Puppeteer)

---

## 1. Fichiers livrés

| Fichier | Lignes | Commit |
| --- | --- | --- |
| `src/reports/types.ts` | 107 | `02c71b6` |
| `src/reports/templates/markdown.ts` | 306 | `9365050` |
| `src/reports/markdown-generator.ts` | 160 | `9365050` |
| `src/reports/templates/html.ts` | 294 | `d741c32` |
| `src/reports/pdf-generator.ts` | 331 | `d741c32` |
| `tests/reports/markdown-generator.test.ts` | 185 | `9365050` |
| `tests/reports/pdf-generator.test.ts` | 198 | `d741c32` |
| **Total** | **1 581** | 3 commits |

Dépendance ajoutée : `puppeteer@^25.16.0` (`package.json`, approbation
mission « Puppeteer pour le PDF »).

---

## 2. Tests et couverture

- `npx vitest run tests/reports/` : **13 ✅ / 4 ⏭ (2 fichiers)**.
- Les 4 tests sautés sont les tests de **rendu PDF** : le poste de
  développement (sandbox Arena) ne dispose d'aucun Chrome (Playwright absent,
  CDN bloqués). Ils sont conçus `skipIf` : **actifs sur CI ubuntu** (Chrome
  système préinstallé) et sur le poste développeur EKTS
  (`npm run browsers:install`).
- Couverture ciblée (lcov, `npm run coverage`) :
  - `src/reports/**` : **76,6 % lignes** (pénalisé par le fichier PDF quasi
    non exercé sans Chrome ; hors PDF : `templates/markdown.ts` 94 %,
    `markdown-generator.ts` 97 %, `comparator.ts` 98 %) ;
  - globale : **95,95 % lignes / 91,73 % branches** (seuils 80 ✅).
- Vérifications : `tsc --noEmit` ✅, `eslint` ✅, `prettier --check` ✅.

---

## 3. Performance mesurée

| Budget | Mesure locale | Verdict |
| --- | --- | --- |
| MD < 2 s (100 constats) | ≈ 1 ms | ✅ (test `génère 100 constats en moins de 2 secondes`) |
| PDF < 10 s | non mesurable ici (Chrome absent) | ⏭ local — test actif CI/poste (timeout 15 s) |

---

## 4. Problèmes rencontrés et résolus

1. **Chrome absent du poste de développement.** `puppeteer` installé avec
   `PUPPETEER_SKIP_DOWNLOAD=1` (CDN `storage.googleapis.com` non atteignable).
   Résolution à l'exécution en 4 niveaux : `PUPPETEER_EXECUTABLE_PATH` /
   `EKTS_CHROME_PATH` → Chrome embarqué → Chromium Playwright → Chrome
   système ; sinon message explicite (jamais de fichier vide).
   `@sparticuz/chromium` essayé puis retiré (libs NSS système absentes).
2. **API Puppeteer 25** : `page.pdf()` renvoie `Uint8Array` (plus
   d'option `encoding`) ; `setContent` n'accepte plus `networkidle0`
   (types `load`/`domcontentloaded` seulement) → attente `load` justifiée
   (HTML autonome, CSS inline).
3. **`ValidationError` attend un tableau d'issues** (`readonly string[]`) —
   signature différente de celle supposée par la spécification.
4. **`audit.metadata.id` est optionnel** (`id?: number`) : `GeneratedReport
   .auditId` reçoit `id ?? 0`.

---

## 5. Écarts consignés (détail dans `SPRINT-11.md` §6.1)

E11-1 (imports `../storage/audit-*` inexistants), E11-4 (Puppeteer 25),
E11-12 (tests PDF `skipIf` sans Chrome).

---

## 6. Temps

Durée réelle : **1 session du 24 octobre 2026** (≈ 40 min d'exécution agent),
contre 4 jours théoriques. Aucun blocage résiduel.
