# Rapport Sprint 15-02 — BestPracticeExtractor, BestPracticeService, Associations

**Date :** 25/10/2026  
**Statut :** ✅ TERMINÉ  
**Branche :** `arena/079e2f26-engineering-knowledge-tooling`

---

## 1. Fichiers créés

- `src/best-practices/best-practice-extractor.ts` — détection des constats résolus (disparition entre audits consécutifs + amélioration du score de dimension), regroupement par titre normalisé, extraction/fusion, associations avec score de confiance, `ExtractionCriteria` configurables (défauts `minOccurrences 2`, `minAudits 2`, `minConfidence 0.5`)
- `src/best-practices/best-practice-service.ts` — façade (`create` force `isManual`, CRUD, `searchPractices`, `extractFromProject`, associations `link/unlink/findByFinding/findLinkedFindings`)
- `tests/best-practices/best-practice-extractor.test.ts` — 10 tests
- `tests/best-practices/best-practice-service.test.ts` — 11 tests

## 2. Fichiers modifiés

- Aucun (le module s'appuie sur 15-01 seul).

## 3. Tests exécutés

```
tests/best-practices/ : 66/66 ✅ (repository 27, search 18, extractor 10, service 11)
Couverture module best-practices : 93,18 % stmts | 81,91 % branch | 100 % funcs | 92,95 % lines
typecheck 0 · lint 0 · npm run verify : EXIT 0 avant push
```

## 4. Décisions prises (P3)

1. **Déduplication = égalité du titre normalisé** (minuscules, ponctuation
   retirée, espaces réduits). La distance de levenshtein < 3 annoncée par
   `SPRINT-15.md` §2.4 n'est **pas** implémentée — écart soumis (éviter les
   faux rapprochements sur des titres proches mais distincts).
2. **Mappings SQL → TS** : les `SELECT *` spec recastés en `AuditMetadata`/
   `AuditFinding` (camelCase) ne collent pas aux colonnes snake_case réelles →
   lectures ciblées par colonnes + mappeurs (évite les `undefined` silencieux).
3. **Fixtures = `openDatabase({dataDir})` + `AuditSchema`** : `runMigrations`
   échoue sur `:memory:` (`unknown database fts` — migration 001 écrit dans la
   base FTS attachée). Leçon réutilisée des fixtures S14 ; la migration 005
   seule reste testable en `:memory:` (15-01).
4. **Priorité/effort/impact des findings** : le mapper ne conserve que le
   strict nécessaire (titre, sévérité, recommandation) avec valeurs par défaut
   conformes aux CHECK du schéma — l'extraction n'utilise que ces champs.
5. **Idempotence** : re-extraction → `practicesMerged` (pas de recréation),
   liens déjà présents ignorés (`findByFinding` non vide → skip) — testée.
6. **Confiance** : base 0.5 + 0.05/occurrence (plafond 0.3) + 0.05/sévérité
   (0-4), bornée à 1 — exactement le spec, test borné `[0.5 ; 1]`.

## 5. Problèmes rencontrés

1. `unknown database fts` en fixture `:memory:` → `openDatabase` réel (décision 3).
2. Types `id?: number` (`number | undefined`) → `flatMap` + garde avant
   `Map.get` (typecheck 0).
3. `ProjectRepository.create` sans champ `url` (API réelle ≠ schéma projet
   SQL) → fixture sans url (le nom suffit, `audit_metadata.project_id` ne
   référence que l'UUID).

## 6. Prochaine étape

Sprint 15-03 : CLI `ekts bestpractice` + MCP (`search_best_practices`,
`add_best_practice`) + tests d'intégration + documentation
(`docs/guides/BEST_PRACTICES.md`, `CLI.md`, `MCP.md`, `API_REFERENCE.md`).
