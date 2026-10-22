# AGENTS.md — Règles de travail pour les agents IA

**Projet :** Engineering Knowledge & Tooling System (EKTS)  
**Version :** 1.0 — 21 octobre 2026  
**Portée :** tout agent (Arena, Claude Code, Cursor, Copilot, Cline) travaillant dans ce dépôt.

---

## 1. Règles absolues

1. **Aucune pull request.** Ne jamais créer, demander ou déclencher de pull request. L'utilisateur fusionne lui-même après revue locale.
2. **Aucun push sur `main`.** Le travail se fait sur une branche dédiée.
3. **Aucun secret** dans le code, les commits, la documentation ou les conversations. Les secrets éventuels passent par `.env` (ignoré) ou les GitHub Secrets.
4. **Aucune suppression** du dépôt, de `.git` ou de l'historique (`git reset --hard`, `git push --force` interdits).
5. **Aucune fusion automatique** dans `main`.

## 2. Branches

| Contexte                   | Branche                                                 |
| -------------------------- | ------------------------------------------------------- |
| Session Arena (imposée)    | `arena/<session-id>-<slug>`                             |
| Agent en session classique | `agent/sprint-XX-XX`                                    |
| Utilisateur                | `sprint/XX/description`, `feature/*`, `fix/*`, `docs/*` |

Commits atomiques : un commit par sous-sprint ou par correction cohérente, message au format `type(scope): description` (français ou anglais, rester cohérent dans le commit).

## 3. Avant de coder

1. Lire `docs/blueprint/INDEX.md`, `docs/blueprint/Docs/00-REFERENCE-GLOBALE-PROJET.md`, `Docs/02-ARCHITECTURE-TECHNIQUE.md`, `Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md`, `Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`.
2. Vérifier l'avancement dans `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`.
3. Lire le dossier du sprint et ses trois sous-sprints.
4. Vérifier que les prérequis du sprint précédent sont satisfaits.

> Les chemins `Docs/…` sont relatifs à `docs/blueprint/`. Le code vit à la racine du dépôt.

## 4. Baseline technique (ADR-011)

| Élément                   | Version                                    |
| ------------------------- | ------------------------------------------ |
| Node.js                   | ≥ 22.12 (LTS)                              |
| TypeScript                | 5.9.x épinglé                              |
| ESLint                    | 10+ — **flat config** (`eslint.config.js`) |
| Vitest                    | 5+ avec `@vitest/coverage-v8`              |
| better-sqlite3            | 13+                                        |
| commander                 | 15+                                        |
| zod                       | 4+                                         |
| pino                      | 10+                                        |
| @modelcontextprotocol/sdk | 1.32.x (aucune v2 publiée)                 |
| Gitleaks                  | 8.30.1                                     |

Toute montée de version majeure nécessite une révision d'ADR dans `Docs/08`.

## 5. Commandes

```bash
npm ci                 # installation reproductible (lockfile commité, sans compilation)
npm run setup          # hooks Git + vérification de l'environnement
npm run lint           # ESLint flat config
npm run typecheck      # tsc --noEmit
npm run build          # compilation dans dist/
npm test               # Vitest
npm run coverage       # couverture (seuils 80 %)
npm run format:check   # Prettier
npm run verify         # typecheck + lint + format + build + couverture
```

`.npmrc` fixe `ignore-scripts=true` : `better-sqlite3` 13 charge ses binaires précompilés et npm
ne doit **jamais** lancer `node-gyp` (aucune chaîne de compilation requise). Ne pas supprimer ce
fichier, ne pas exécuter `npm install --ignore-scripts=false`, et ne jamais proposer d'installer
Visual Studio ou `build-essential` pour ce projet. Les hooks s'installent par `npm run setup`.

**Environnement de l'utilisateur : Windows + PowerShell (terminal intégré de VS Code).**

- Fournir les commandes **en PowerShell**, jamais en bash : pas de `2>/dev/null`, pas de `||`
  ni de `&&` (Windows PowerShell 5.1 ne les accepte pas), pas de `ls -la`, `cat` ni `rm -rf`
  (`Get-ChildItem`, `Get-Content`, `Remove-Item -Recurse -Force`).
- Préférer un **script npm** (`npm run check:env`, `npm run db:inspect`) à une commande
  `node -e "…"` multi-lignes : le collage d'un bloc multi-lignes est réinterprété par PowerShell.
- Indiquer `npm.cmd` si la politique d'exécution bloque `npm.ps1`.

## 6. Définition de « terminé »

- Critères d'acceptation du sous-sprint satisfaits et vérifiés par une commande.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run coverage` passent.
- Couverture ≥ 80 % sur le code inclus.
- Documentation mise à jour dans le même commit.
- Ligne du registre d'avancement mise à jour (statut + commit).
- Rapport de fin de sprint : fichiers modifiés, tests, critères, commandes de récupération, prochaines étapes.
- **Arrêt et attente de validation utilisateur** avant le sprint suivant.

## 7. Sécurité

- Gitleaks en pre-commit (`.husky/pre-commit`) **et** en CI.
- `.env`, `*.db`, `data/`, `node_modules/`, `dist/`, `coverage/` ignorés.
- Aucune donnée utilisateur réelle dans les tests : utiliser `tests/fixtures/`.
- Les tests d'intégration créent une base temporaire (`mkdtempSync`), jamais `data/`.
- Les identifiants de test ne doivent jamais ressembler à de vraies clés (préférer `sk-EXAMPLE-...`).

## 8. Workflow de récupération (branche `develop`)

`develop` est la **branche d'intégration** du développement ; `main` reste stable et ne reçoit que des états explicitement validés.

1. **L'agent ne fusionne jamais lui-même.** Il pousse son travail sur sa branche (`arena/…`, `agent/…` ou `sprint/…`) et fournit les commandes de récupération.
2. **L'utilisateur fusionne en local** dans `develop`, avec un commit de fusion explicite (`--no-ff`), puis pousse `develop`.
3. **Aucune pull request**, aucune fusion automatique.
4. **Après fusion** : `npm ci` (jamais `npm install`, sauf ajout ou mise à jour volontaire d'une dépendance), puis `npm run setup`, `npm run build` et `npm test`.
5. **Un nouveau sprint ne démarre qu'après un feu vert explicite de l'utilisateur.**

```bash
# Côté utilisateur, après que l'agent a poussé sa branche
git fetch origin
git switch develop                        # ou : git switch -c develop --track origin/develop
git pull --ff-only origin develop
git merge --no-ff origin/<branche-agent> -m "merge: <sprint> — <résumé>"
git push origin develop

# Vérification après fusion
npm ci
npm run setup
npm run build
npm test
```

En cas de conflit, résoudre manuellement, puis `git add <fichiers>` et `git commit` (le message de fusion est déjà préparé). Ne jamais utiliser `git reset --hard` ni `git push --force`.

## 9. Documentation de référence

- Audit de démarrage : `docs/audit/ETAT-DES-LIEUX-2026-10-21.md`
- Blueprint : `docs/blueprint/`
- Registre d'avancement : `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`
- Décisions : `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md`
- Guide Git : `docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md`
