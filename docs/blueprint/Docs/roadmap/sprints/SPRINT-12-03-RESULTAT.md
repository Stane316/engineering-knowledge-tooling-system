# Rapport de Sprint 12-3 — Validation MVP-2 + Préparation MVP-3

**Statut :** ✅ TERMINÉ
**Date :** 25 octobre 2026
**Branche :** `arena/079e2f26-engineering-knowledge-tooling`

---

## 1. Livrables

| Fichier | Lignes réelles | Cible | Statut |
|---------|---------------:|------:|--------|
| `docs/MVP2_VALIDATION.md` | 264 | 300 | ✅ (88/88 critères, preuves réelles) |
| `docs/ROADMAP.md` | 308 | 400 | ✅ (6 sprints MVP-3 + capitaux) |
| `README.md` | 291 | 250 | ✅ (statut, 10 commandes, 7 outils) |
| `CHANGELOG.md` | 155 | 200 | ✅ (0.0.1 + 0.1.0, dates git) |
| **Total** | **1 018** | **~1 150** | ✅ (−12 % : densité réelle vs bourrage, P3) |

Commits (messages exacts de la spec §5) :

```
c17da95 docs: add MVP2_VALIDATION.md with 88 criteria validated
df7bfb6 docs: add ROADMAP.md with MVP-3 plan
c886f06 docs: update README.md for MVP-2 completion
bc1962c docs: create CHANGELOG.md with MVP-1 and MVP-2 history
```

+ `5724543 docs: align guide version footers with package.json 0.1.0`
(P3 soumis : harmonisation des 5 pieds « 2.0.0 » de S12-2 vers la version
réelle `0.1.0` de `package.json` / `ekts --version`).

## 2. Validation des 88 critères

- **88/88 ✅** (C7.1 → C11.18), chaque preuve réouverte dans le code :
  fichiers réels, tests verts, mesures observées (poste développeur 25/10).
- Écarts des templates corrigés et documentés dans le tableau du
  rapport : L4 hors périmètre (3 niveaux réels), CLI 10 commandes,
  MCP 7 outils, couverture **97,06 %** (pas 88 %), Node ≥ 22.19.0,
  mesures inventées remplacées par les valeurs mesurées
  (stockage 0,89 ms/audit, PDF 2–4 s, recherche 2,74 ms/10 k audits).
- Métriques finales : `src/` **19 776 lignes** · 1 260 tests ·
  documentation `docs/` **5 081 lignes** · CI 7/7 par push · `npm audit`
  0 vuln.

## 3. Correctifs de boucle S12-1 livrés dans ce sprint

Analyse des 6 échecs de ses sorties :

1. **cli-flow (5 échecs, cause racine unique)** : `execFileSync` gelait
   l'event loop du worker vitest hébergeant le serveur fixture — le
   `page.goto` du process CLI attendait une réponse jamais servie
   (timeout 30 s), puis cascade sur les 4 tests suivants (base vide).
   → `execFile` **asynchrone** (`8c04816`) : le serveur reste servi
   pendant l'attente ; timeout 120 s signalé explicitement.
2. **inspection-flow (1 échec)** : les 3 tests partageaient la même base —
   1 audit du test chaîne + 2 du test « deux audits » = 3 ≠ 2.
   → base **isolée** par test (`b1066a2`).
3. Ce n'était **pas** la charge machine : les autres fichiers navigateur
   (identiques en charge) passaient déjà.

Vérifications locales : typecheck/lint/format ✓ · `npm run verify`
**code 0** (1 226 ✅ / 34 ⏭ sandbox) · **CI `40188421561` = 7/7 ✓**.

## 4. CI develop

- Relance du run `40128071077` impossible (`workflow file may be broken`),
  **mais develop est déjà vert** : run `40185971777` = success (25/10) —
  rien à faire côté develop.
- `gh` absent sur son poste malgré winget → recours à l'UI web ou
  réouverture de PowerShell (voir réponse du tour).

## 5. Écarts et soumissions (P3)

1. Lignes des livrables : 1 018 / ~1 150 (−12 %) — densité réelle.
2. README 291 / 250 (+16 %) — la table documentaire S12 a été ajoutée au
   README existant (271 l.) plutôt que de le remplacer par le modèle
   (contenant des faussetés).
3. Pieds de version 12-2 harmonisés vers 0.1.0 (commit dédié, cf. §1).
4. Modèles 12-3 non copiels tels quels (L4, 7 commandes, 3 outils,
   couverture 88 %, dates 2024, « votre-org », `feat/sprint-12-3`).

## 6. Point d'attention boucle E2E

À confirmer chez lui après `git fetch/reset` :

```powershell
npx vitest run tests/e2e/
npx vitest run tests/reports/
npm run verify
```

Attendu : **16 tests verts** (cli-flow 5/5 avec serveur fixture servi,
inspection-flow 3/3 avec bases isolées), reports 34/34, verify code 0.
Budget E2E < 60 s : à mesurer sur son poste (dernière mesure 66 s
incluant les 6 échecs — après correctifs, le wall-clock devrait être
plafonné par inspection-flow ≈ 48 s).

## 7. Transition

**Sprint 12 clôturé au complet** (12-1 ✅, 12-2 ✅, 12-3 ✅).
**MVP-2 validé 88/88** · `docs/ROADMAP.md` en place · MVP-3 en attente
d'un **feu vert par sprint** (règle maison) — prochain sprint cible :
Sprint 13 (Gestion Multi-Projets).

---

**Fin du rapport Sprint 12-3**
