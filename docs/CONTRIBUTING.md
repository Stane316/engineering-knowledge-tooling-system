# Guide de Contribution — Engineering Knowledge Tooling System

> MVP-2 — règles maison, aucune contribution externe acceptée actuellement
> (ancrage personnel) · Invariants du produit : `docs/blueprint/Docs/04-CONTRAINTES-ET-INVARIANTS.md`

## Outils requis

| Outil | Version attendue |
|-------|------------------|
| Node.js | ≥ 22.19.0 |
| npm | ≥ 10.9.0 |
| Git | ≥ 2.40 |
| PowerShell | ≥ 7.4 (recommandé) |
| Chrome/Edge (PDF, Lighthouse) | récent (Chromium ≥ 102 pour PDF) |

Après clone :

```powershell
npm ci
npm run doctor
npm run verify
```

## Communauté de code

- **TypeScript strict**, ESM, JSDoc **français** sur l'API publique,
  commentaires en français.
- Conventions : 2 espaces, apostrophes simples, ~100 caractères (Prettier).
- Fichier = une responsabilité principale ; une tâche = un commit atomique.
- Regex : imbriquées non supportées (backtracking) — préférer les parseurs.
- Pas de `any` silencieux ; unions discriminées ; erreurs typées
  (`ValidationError` = **tableau** de messages).
- Rejets explicites : dépendances « qui font tout », transitions CSS
  avec `!important`, mocks là où la vraie mécanique est testable.

## Conventions de tests

- Vitest, tests isolés, **zéro réseau** (`EKTS_OFFLINE=1`, doubles navigateur,
  serveurs `127.0.0.1`).
- Priorité : fixtures locales (USB realiste) plutôt que mocks.
- Espaces de noms lisibles ; assertions sur ensembles triés ; timeout 20 s
  global (30 s pour les hooks).
- `describe.skipIf` pour les capacités d'environnement — jamais de skip silencieux
  : chaque saut doit être justifié dans le test.
- Couverture minimale **80 %** (4 métriques) — vérifiée par `npm run coverage`.
- Les E2E vivent dans `tests/e2e/` (budget < 60 s, navigation minimale).

## Processus de contribution (workflow maison)

1. **Branche** : `feature/<sujet>` (ou la branche de session imposée).
2. **Avant modification** : audit (specs, code impacté, tests) — règle S9+.
3. **Implémenter** : périmètre strictement celui de la spec en cours ;
   tout écart → **soumis** avec explications (règle P3).
4. **Qualité locale** : `npm run verify` obligatoire avant push
   (typecheck, lint, format, build, coverage).
5. **Commit** : message type Conventional Commits, une action logique ;
   statuts/registres mis à jour dans le sprint concerné.
6. **Push** sur la branche de travail uniquement ; l'intégration `develop`
   est fusionnée par le porteur (pas de PR auto, pas de push sur `main`).
7. **CI** : 7 workflows doivent être verts ; gare aux artefacts lourds.

### Checklist avant de pousser

- [ ] `npm run verify` en code 0 (les 5 sections de sortie relues).
- [ ] Nouveaux comportements couverts par des tests ; couverture ≥ 80 %.
- [ ] Commentaires/JSDoc **français** sur toute API touchée.
- [ ] Docs impactées mises à jour dans le même commit
      (CLI/MCP/types → `API_REFERENCE.md`, procédures → guides).
- [ ] Aucun secret, `.env`, binaire, ni sortie `providers` dans le diff.
- [ ] Écart de périmètre vis-à-vis de la spec → soumission écrite (P3).
- [ ] Statuts/registres de sprint à jour si la tâche clôture un sprint.
- [ ] Message de commit : type juste, portée explicite, pas de mélange
      « fix + feature + reformat » dans un même commit.

### Ce qui est interdit

- Fusions sur `main` ou `develop` par le contributeur agent (le porteur
  fusionne), **création de pull request**, auto-merge.
- `git push --force` sur les branches d'intégration ; jamais de `--no-verify`
  sur un doute de secret.
- Détourner les budgets/tests (allonger un timeout pour masquer un flaky
  sans diagnostic, baisser les seuils de couverture, skip sans message).
- Sortir du périmètre de la spec active sans soumission (P3).

## Documentation

- Toute opération écrite avec : objectif, prérequis, procédure, commande
  exacte, résultat attendu, vérification, dépannage, récupération, sécurité.
- Guides : `docs/DOCS.md` (index) → USER / DEVELOPER / API / TROUBLESHOOTING.
- Les changements d'API (CLI, MCP, types) impactent `docs/API_REFERENCE.md`
  dans le **même** commit.
- Chaque sprint clôturé met à jour statuts, registre des décisions et
  des risques.

## Sécurité

- Aucune clé, `.env` ou sortie `providers`/keyring en dépôt ou en log.
- Gitleaks en pré-commit et en CI — en cas de doute sur un secret :
  **rotation immédiate** + issue, jamais de commit suspect.
- Installation du binaire `gitleaks` (le hook pré-commit le signale et le
  contourne, la CI le bloque toujours ; `npm run security:secrets` exige le
  binaire) :
  - Windows : `winget install Gitleaks.Gitleaks` (ou `scoop install gitleaks`)
    puis **nouveau terminal** et `gitleaks version` pour vérifier ;
  - macOS : `brew install gitleaks` ;
  - Linux : `brew install gitleaks`, ou binaire officiel
    `github.com/gitleaks/gitleaks/releases`.
- `npm audit` : le CI refuse les vulnérabilités ; mettre à jour
  avec justification dans le commit.

## Commits — formats retenus

```
feat(storage): persistance SQLite des rapports
fix(cli): codes de sortie alignés sur la matrice MVP
docs(api): référence MCP à jour
test(e2e): flux inspection en budget 60 s
chore(deps): mise à jour Puppeteer avec justification
ci(github): couverture de code obligatoire
```

| Type | Quand | Exemple de sujet |
|------|-------|------------------|
| `feat` | capacité nouvelle conforme à une spec | `feat(mcp): outil audit_report format markdown` |
| `fix` | correction d'un comportement documenté | `fix(reports): timeout PDF 30 s sous charge` |
| `docs` | guides, statuts, registres | `docs: guide utilisateur MVP-2` |
| `test` | ajouts/corrections de tests seuls | `test(storage): recherche vectorielle` |
| `refactor` | sans changement de comportement | `refactor(cli): sortie JSON centralisée` |
| `chore` | outillage, dépendances justifiées | `chore: gitleaks pre-commit` |
| `ci` | workflows | `ci: job de vérification secrets` |

Corps du commit (quand nécessaire) : le **pourquoi**, l'impact observé
(codes de sortie, budgets), et le lien de soumission (P3) si écart.

---

**Version :** 0.1.0 (MVP-2) · **Dernière mise à jour :** 25 octobre 2026
