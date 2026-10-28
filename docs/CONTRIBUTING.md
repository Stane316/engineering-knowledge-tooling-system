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
  Lecture rapide du verdict après un run (PowerShell, sans rouvrir l'HTML) :

  ```powershell
  $c = Get-Content coverage/coverage-summary.json -Raw | ConvertFrom-Json
  $c.total.statements.pct
  $c.total.branches.pct
  $c.total.functions.pct
  $c.total.lines.pct
  ```

  Chaque valeur doit être **≥ 80** (la ligne « All files » du tableau texte
  donne le même agrégat ; l'exit code de `npm run verify` doit être `0`).
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

### Réconcilier `develop` et une branche de session (anti-conflit)

**Objectif** : intégrer une branche de session dans `develop` sans conflit
résiduel ni perte de travail local.
**Prérequis** : dépôt à jour (`git fetch`), savoir sur quelle branche on est.
**Résultat attendu** : merge propre, `git status` vide, `develop` poussé.

0. **Diagnostiquer avant d'agir** (ne jamais résoudre à l'aveugle) :

   ```powershell
   git status
   git log --oneline -5
   git diff --name-only --diff-filter=U     # fichiers réellement en conflit
   ```

1. **Vérifier que le conflit ne vient pas des branches distantes** : simuler
   le merge sans rien modifier.

   ```powershell
   git merge-tree --write-tree --name-only origin/develop origin/arena/079e2f26-engineering-knowledge-tooling
   ```

   Sortie = un seul empreinte d'arbre et code 0 → **aucun conflit entre les
   branches distantes** : le conflit est **local** (fichiers modifiés non
   commités, ou commits locaux non poussés).

2. **Chemin sûr** (sauvegarde d'abord, jamais de perte) :

   ```powershell
   $d = Get-Date -Format "yyyyMMdd-HHmm"
   git branch "backup/develop-$d"          # filet de sécurité
   git merge --abort                        # si un merge est en cours
   git stash push -u -m "avant merge $d"    # met de côté le travail local
   git checkout develop
   git pull --ff-only origin develop        # aligne sur le distant
   git merge origin/arena/079e2f26-engineering-knowledge-tooling
   $LASTEXITCODE
   git push origin develop
   $LASTEXITCODE
   git stash pop                            # réapplique le travail local
   git status --short
   ```

   Si `git pull --ff-only` échoue : des commits locaux existent → les
   inspecter (`git log --oneline origin/develop..develop`) puis soit les
   fusionner, soit repartir de `origin/develop` (la branche `backup/…`
   créée à l'étape 2 conserve tout).

3. **Si le merge est déjà en cours avec conflits** : trancher **par preuve
   de diff**, jamais « au plus récent ». Règle maison vérifiée le 26/10 :

   ```powershell
   git diff --stat origin/develop origin/arena/079e2f26-engineering-knowledge-tooling
   ```

   - Si le diff ne contient **que** des ajouts de la branche de session
     (cas des documents `docs/audit/produit/*` en v1.1) → garder la branche :

     ```powershell
     git checkout --theirs -- docs/audit/produit
     git add docs/audit/produit
     ```

   - Si `develop` contient du travail propre au porteur → fusionner le
     contenu à la main, puis `git add <fichier>` (jamais `git add -A` sans
     `git log --oneline -1` vérifié au préalable).

4. **Vérifier après résolution** :

   ```powershell
   git status --short                    # doit être vide
   git log --oneline -1                  # merge commit attendu
   git rev-list --count origin/develop..develop   # 0 après push
   ```

5. **Récupération en cas d'erreur** : `git merge --abort` (merge en cours)
   ou `git reset --hard backup/develop-<date>` (retour à l'état sauvegardé),
   puis recommencer à l'étape 1. Jamais de `git push --force` sur `develop`.

6. **Ne pas committer les sorties générées** : `reports/` n'est pas ignoré
   (LIM-18) → utiliser `-o artifacts/reports`, ou ajouter `reports/` au
   `.gitignore` après accord du porteur.

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
    installation manuelle (asset officiel des releases GitHub) possible via
    extraction dans `%LOCALAPPDATA%\gitleaks` + ajout au PATH **utilisateur** ;
  - macOS : `brew install gitleaks` ;
  - Linux : `brew install gitleaks`, ou binaire officiel
    `github.com/gitleaks/gitleaks/releases`.
  - **Piège Windows** : ni `winget install` ni `SetEnvironmentVariable(…,"User")`
    ne rechargent le PATH de la session PowerShell **en cours** — dans ce cas
    « gitleaks n'est pas reconnu » persiste malgré une installation réussie.
    Recharger dans la session courante (ou ouvrir un nouveau terminal) :

    ```powershell
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    ```

    Puis `gitleaks version` et `npm run security:secrets` (exit `0` attendu).
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
