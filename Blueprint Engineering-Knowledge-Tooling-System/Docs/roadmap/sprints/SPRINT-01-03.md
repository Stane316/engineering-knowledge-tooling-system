# Sprint 1-3 — Gitleaks + README + CI

**Identifiant :** SPRINT-01-03  
**Parent :** SPRINT-01 (Setup projet)  
**Durée prévue :** 4 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif précis

**Configurer la détection de secrets (Gitleaks), créer la documentation (README, SETUP), et configurer la CI GitHub Actions.**

**Résultat concret attendu :**
- Gitleaks pre-commit hook configuré et fonctionnel
- README.md complet (installation, usage, structure)
- docs/SETUP.md détaillé (guide développeur)
- CI GitHub Actions fonctionnelle (lint + test + build)
- Projet prêt pour push vers GitHub

---

## 2. Prérequis

| Prérequis | Vérification | Source |
|-----------|--------------|--------|
| Sprint 1-1 terminé | Outils qualité configurés | SPRINT-01-01 |
| Sprint 1-2 terminé | Structure dossiers + dépendances | SPRINT-01-02 |
| Git initialisé | `git status` | Manuel |
| Accès GitHub | Compte GitHub actif | Utilisateur |

**Si prérequis manquant :** Retourner au sous-sprint manquant.

---

## 3. Tâches atomiques

### Tâche 1.6 — Configurer Gitleaks pre-commit

**Objectif :** Configurer détection automatique de secrets avant commit  
**Durée :** 2h  
**Fichiers concernés :** `.gitleaks.toml`, `.git/hooks/pre-commit`, `.gitignore`

**Actions :**

```bash
# 1. Installer Gitleaks (si pas déjà fait)
# macOS
brew install gitleaks
# Linux
# wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
# tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
# sudo mv gitleaks /usr/local/bin/

# 2. Vérifier installation
gitleaks version

# 3. Initialiser Git (si pas fait)
git init

# 4. Créer .gitleaks.toml
cat > .gitleaks.toml << 'EOF'
title = "EKTS Gitleaks Configuration"

# Règles personnalisées
[[rules]]
  description = "OpenAI API Key"
  regex = '''sk-[a-zA-Z0-9]{48}'''
  tags = ["openai", "api_key"]

[[rules]]
  description = "Anthropic API Key"
  regex = '''sk-ant-[a-zA-Z0-9]{48}'''
  tags = ["anthropic", "api_key"]

[[rules]]
  description = "Generic API Key"
  regex = '''(?i)(api[_-]?key|api[_-]?secret)["'\s:=]+["']?([a-zA-Z0-9]{32,})["']?'''
  tags = ["api", "key"]

[allowlist]
  description = "Global allowlist"
  paths = [
    '''node_modules''',
    '''\.git''',
    '''dist''',
    '''build''',
    '''docs''',
    '''coverage''',
  ]
EOF

# 5. Créer pre-commit hook
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "Running Gitleaks..."
gitleaks detect --source . --staged --verbose
if [ $? -ne 0 ]; then
  echo "Gitleaks detected secrets in staged files!"
  echo "Please remove secrets before committing."
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit

# 6. Créer .gitignore
cat > .gitignore << 'EOF'
# Secrets
.env
.env.local
.env.*.local

# Bases de données
*.db
*.db-shm
*.db-wal
data/

# Logs
logs/
*.log

# Node
node_modules/
dist/
build/

# Couverture
coverage/

# OS
.DS_Store
Thumbs.db
Desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Gitleaks
.gitleaks-report.json

# Temporary files
*.tmp
*.bak
EOF

# 7. Tester Gitleaks
gitleaks detect --source . --verbose

# 8. Tester pre-commit hook
echo "sk-1234567890abcdef1234567890abcdef1234567890abcdef12" > test-secret.txt
git add test-secret.txt
git commit -m "test: secret detection"
# Attendu : hook échoue, commit refusé

# 9. Nettoyer test
git reset
rm test-secret.txt
```

**Résultat attendu :**
- `.gitleaks.toml` configuré
- Pre-commit hook actif
- `.gitignore` créé
- Hook détecte secrets (test réussi)

**Vérification :**
```bash
# Tester hook avec faux secret
echo "sk-1234567890abcdef1234567890abcdef1234567890abcdef12" > test-secret.txt
git add test-secret.txt
git commit -m "test"
# Attendu : commit refusé par Gitleaks

# Nettoyer
git reset
rm test-secret.txt
```

**Critères d'acceptation :**
- ✅ `.gitleaks.toml` existe avec règles
- ✅ Pre-commit hook configuré et exécutable
- ✅ `.gitignore` exclut fichiers sensibles
- ✅ Hook détecte secrets (test réussi)

---

### Tâche 1.7 — Créer README + documentation

**Objectif :** Documenter projet et installation  
**Durée :** 4h  
**Fichiers concernés :** `README.md`, `docs/SETUP.md`

**Actions :**

```bash
# 1. Créer README.md
cat > README.md << 'EOF'
# EKTS — Engineering Knowledge & Tooling System

Système personnel d'ingénierie augmenté par l'IA qui centralise et organise connaissances, ressources, et capacités exécutables.

## Vision

> « Ne pas repartir de zéro : retrouver, comprendre, exécuter, vérifier et capitaliser sur ce qui a déjà été appris ou construit. »

## Fonctionnalités

- **Bibliothèque de connaissances** — Centraliser ressources, tutoriels, décisions
- **Recherche hybride** — FTS5 + Vector + RRF (Recall@5 ≥ 0.75)
- **Inspection navigateur** — Playwright, 4 niveaux (L1-L4)
- **Capitalisation projets** — Workflow 8 étapes, post-mortem
- **Interface agents IA** — MCP Server (4 outils prioritaires)

## Architecture

**Architecture C Hybride** — Monolithe TypeScript/Node.js avec SQLite WAL

```
src/
├── cli/          # CLI Commander.js
├── mcp/          # MCP Server
├── business/     # Business Logic
├── data/         # Data Layer (SQLite)
└── shared/       # Utils, types, config
```

## Installation

### Prérequis

- Node.js 20+ LTS
- npm 10+
- Git

### Setup

```bash
# Cloner dépôt
git clone https://github.com/{user}/Engineering-Knowledge-Tooling-System.git
cd Engineering-Knowledge-Tooling-System

# Installer dépendances
npm install

# Build
npm run build

# Tests
npm test
```

## Usage

### CLI

```bash
# Initialiser bases
npm run ekts -- init

# Ajouter ressource
npm run ekts -- add --type article --title "MCP Protocol" --tags "mcp,agents"

# Rechercher
npm run ekts -- search "MCP protocol"

# Obtenir ressource
npm run ekts -- get <id>

# Lister ressources
npm run ekts -- list

# Statut
npm run ekts -- status
```

### MCP Server

Configurer dans client MCP (Claude Code, Cursor, Copilot) :

```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "cwd": "/path/to/ekts"
    }
  }
}
```

**Outils MCP :**
- `search_knowledge` — Recherche hybride
- `get_resource` — Obtenir ressource par ID
- `list_resources` — Lister ressources
- `validate_resource` — Valider schéma

## Développement

```bash
# Développement (watch mode)
npm run dev

# Linting
npm run lint

# Formatage
npm run format

# Tests
npm test

# Couverture
npm run coverage
```

## Sécurité

- Gitleaks pre-commit hook (détection secrets)
- `.env` jamais commité
- Fichiers SQLite `chmod 600`

Voir `docs/SECURITY.md` pour détails.

## Documentation

- `docs/SETUP.md` — Guide développeur
- `docs/ARCHITECTURE.md` — Architecture technique
- `docs/ROADMAP.md` — Roadmap projet

## Licence

MIT

## Contribuer

Voir `CONTRIBUTING.md` (à créer)
EOF

# 2. Créer docs/SETUP.md
cat > docs/SETUP.md << 'EOF'
# Guide de setup développeur

## Prérequis

### Node.js

```bash
# Vérifier version
node --version
# Attendu : v20.x.x ou supérieur

# Installer (si nécessaire)
# macOS
brew install node@20

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### npm

```bash
# Vérifier version
npm --version
# Attendu : 10.x.x ou supérieur

# Mettre à jour (si nécessaire)
npm install -g npm@latest
```

### Git

```bash
# Vérifier version
git --version
# Attendu : 2.x.x

# Configurer
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Installation

```bash
# 1. Cloner dépôt
git clone https://github.com/{user}/Engineering-Knowledge-Tooling-System.git
cd Engineering-Knowledge-Tooling-System

# 2. Installer dépendances
npm install

# 3. Vérifier installation
npm run build
npm test
npm run lint
```

## Structure projet

```
Engineering-Knowledge-Tooling-System/
├── src/
│   ├── cli/          # CLI Commander.js (Sprint 5)
│   ├── mcp/          # MCP Server (Sprint 6)
│   ├── business/     # Business Logic (Sprint 3-4)
│   │   ├── knowledge-manager.ts
│   │   ├── search-engine.ts
│   │   └── indexer.ts
│   ├── data/         # Data Layer (Sprint 2)
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── migrations/
│   └── shared/       # Utils, types, config
│       ├── types.ts
│       └── config.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── benchmark/
├── docs/             # Documentation
├── migrations/       # Migrations SQL
├── .gitleaks.toml    # Configuration Gitleaks
├── .eslintrc.json    # Configuration ESLint
├── .prettierrc       # Configuration Prettier
├── vitest.config.ts  # Configuration Vitest
├── tsconfig.json     # Configuration TypeScript
└── package.json      # Configuration npm
```

## Commandes npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement (watch mode) |
| `npm run build` | Build TypeScript |
| `npm start` | Exécuter build |
| `npm test` | Exécuter tests |
| `npm run coverage` | Rapport couverture |
| `npm run lint` | Linting |
| `npm run lint:fix` | Linting + auto-fix |
| `npm run format` | Formatage Prettier |
| `npm run clean` | Nettoyer dist/ |

## Variables d'environnement

Créer `.env` (jamais commité) :

```bash
# OpenAI API (optionnel, pour embeddings)
OPENAI_API_KEY=sk-...

# EKTS API (optionnel, pour accès distant)
EKTS_API_KEY=...
```

## Base de données

**3 bases SQLite :**
- `data/ekts.db` — Données structurées
- `data/ekts-fts.db` — Index full-text (FTS5)
- `data/ekts-vectors.db` — Index vectoriel (sqlite-vec)

**Initialiser :**
```bash
npm run ekts -- init
```

## Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run coverage

# Benchmarks
npm run benchmark
```

## Sécurité

### Gitleaks

Pre-commit hook détecte secrets automatiquement.

**Tester :**
```bash
gitleaks detect --source . --verbose
```

### Secrets

**Ne jamais commiter :**
- `.env`
- `*.db`
- Clés API
- Tokens

**Utiliser `.gitignore` :**
- Déjà configuré

## Dépannage

### Erreur : "Cannot find module"

```bash
# Réinstaller dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Build failed"

```bash
# Vérifier TypeScript
npm run build
# Lire erreurs, corriger fichiers source
```

### Erreur : "Lint failed"

```bash
# Auto-fix
npm run lint:fix

# Ou corriger manuellement
npm run lint
```

### Erreur : "Tests failed"

```bash
# Voir détails
npm test -- --reporter=verbose
```

## Prochaines étapes

1. Sprint 2 : Data Layer (SQLite)
2. Sprint 3 : Knowledge Manager
3. Sprint 4 : Search Engine
4. Sprint 5 : CLI
5. Sprint 6 : MCP Server

Voir `docs/ROADMAP.md` pour détails.

## Support

- Issues GitHub : https://github.com/{user}/Engineering-Knowledge-Tooling-System/issues
- Documentation : `docs/`
EOF

# 3. Vérifier documentation
cat README.md
cat docs/SETUP.md
```

**Résultat attendu :**
- README.md complet (vision, fonctionnalités, installation, usage, développement)
- docs/SETUP.md détaillé (prérequis, installation, structure, commandes, dépannage)

**Vérification :**
```bash
# Vérifier présence
ls README.md docs/SETUP.md

# Vérifier contenu
head -20 README.md
head -20 docs/SETUP.md
```

**Critères d'acceptation :**
- ✅ README.md existe et complet
- ✅ docs/SETUP.md existe et détaillé
- ✅ README contient : vision, fonctionnalités, installation, usage, développement
- ✅ SETUP contient : prérequis, installation, structure, commandes, dépannage

---

### Tâche 1.8 — Configurer CI GitHub Actions

**Objectif :** Configurer CI automatique (lint + test + build)  
**Durée :** 2h  
**Fichiers concernés :** `.github/workflows/ci.yml`

**Actions :**

```bash
# 1. Créer dossier workflows
mkdir -p .github/workflows

# 2. Créer ci.yml
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Run coverage
        run: npm run coverage

      - name: Upload coverage
        if: matrix.node-version == '20.x'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false
EOF

# 3. Vérifier syntaxe YAML
# (pas d'outil simple, mais GitHub validera au push)

# 4. Commit et push (si repository GitHub créé)
git add .github/workflows/ci.yml
git commit -m "ci: configure GitHub Actions"

# 5. Vérifier dans GitHub UI
# Aller sur https://github.com/{user}/Engineering-Knowledge-Tooling-System/actions
# Attendu : workflow CI listé
```

**Résultat attendu :**
- `.github/workflows/ci.yml` configuré
- Workflow CI : lint + build + test + coverage
- Test sur Node.js 20.x et 22.x
- Upload coverage (optionnel, Codecov)

**Vérification :**
```bash
# Vérifier présence
ls .github/workflows/ci.yml

# Vérifier contenu
cat .github/workflows/ci.yml

# Après push, vérifier dans GitHub UI
# https://github.com/{user}/Engineering-Knowledge-Tooling-System/actions
```

**Critères d'acceptation :**
- ✅ `.github/workflows/ci.yml` existe
- ✅ Workflow déclenché sur push/PR vers main
- ✅ Test sur Node.js 20.x et 22.x
- ✅ Exécute lint + build + test + coverage
- ✅ CI verte après push

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `.gitleaks.toml` | Configuration Gitleaks |
| `.git/hooks/pre-commit` | Hook détection secrets |
| `.gitignore` | Fichiers ignorés Git |
| `README.md` | Documentation projet |
| `docs/SETUP.md` | Guide développeur |
| `.github/workflows/ci.yml` | CI GitHub Actions |

### 4.2 Fichiers à modifier

**Aucun** — Tous fichiers créés dans ce sous-sprint.

---

## 5. Configurations externes nécessaires

### 5.1 GitHub repository

**Action utilisateur :**

```bash
# 1. Créer repository GitHub
# Aller sur https://github.com/new
# Nom : Engineering-Knowledge-Tooling-System
# Visibilité : Privé (recommandé)
# Ne PAS initialiser avec README

# 2. Configurer remote
git remote add origin https://github.com/{user}/Engineering-Knowledge-Tooling-System.git

# 3. Push initial
git branch -M main
git push -u origin main
```

**Vérification :**
- Repository créé sur GitHub
- Remote configuré
- Push réussi
- CI GitHub Actions déclenchée

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Configurer Gitleaks
- ✅ Créer pre-commit hook
- ✅ Créer .gitignore
- ✅ Créer README.md
- ✅ Créer docs/SETUP.md
- ✅ Configurer GitHub Actions
- ✅ Commit tous fichiers

### 6.2 Utilisateur

- ✅ Créer repository GitHub
- ✅ Configurer remote
- ✅ Push initial
- ✅ Vérifier CI GitHub Actions
- ✅ Valider sous-sprint terminé

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
# Tester Gitleaks
gitleaks detect --source . --verbose

# Tester pre-commit hook
echo "sk-1234567890abcdef1234567890abcdef1234567890abcdef12" > test-secret.txt
git add test-secret.txt
git commit -m "test"
# Attendu : hook échoue

# Nettoyer
git reset
rm test-secret.txt

# Vérifier documentation
cat README.md
cat docs/SETUP.md

# Vérifier CI
cat .github/workflows/ci.yml
```

### 7.2 Résultats attendus

- ✅ Gitleaks détecte 0 secrets (code propre)
- ✅ Pre-commit hook bloque commit avec secret
- ✅ README.md complet
- ✅ docs/SETUP.md détaillé
- ✅ CI configurée

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C1.6.1 | `.gitleaks.toml` existe | `ls .gitleaks.toml` |
| C1.6.2 | Pre-commit hook configuré | `ls .git/hooks/pre-commit` |
| C1.6.3 | Hook détecte secrets | Test manuel |
| C1.6.4 | `.gitignore` exclut fichiers sensibles | `cat .gitignore` |
| C1.7.1 | README.md existe | `ls README.md` |
| C1.7.2 | README complet | `cat README.md` |
| C1.7.3 | docs/SETUP.md existe | `ls docs/SETUP.md` |
| C1.7.4 | SETUP détaillé | `cat docs/SETUP.md` |
| C1.8.1 | `.github/workflows/ci.yml` existe | `ls .github/workflows/ci.yml` |
| C1.8.2 | CI configurée | `cat .github/workflows/ci.yml` |
| C1.8.3 | CI verte après push | GitHub UI |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
gitleaks detect --source . --verbose > gitleaks.log 2>&1
```

**Captures à conserver :**
- README.md (contenu)
- docs/SETUP.md (contenu)
- `.github/workflows/ci.yml` (contenu)
- GitHub Actions : CI verte (capture écran)

---

## 10. Conditions d'échec

**Échec si :**
- ❌ Gitleaks non configuré
- ❌ Pre-commit hook ne fonctionne pas
- ❌ README.md incomplet
- ❌ docs/SETUP.md manquant
- ❌ CI GitHub Actions échoue

**Action si échec :**
1. Documenter erreur
2. Identifier cause
3. Proposer solution
4. Si blocage → demander intervention utilisateur

---

## 11. Dépendances

**Dépend de :**
- ✅ Sprint 1-1 terminé (outils qualité)
- ✅ Sprint 1-2 terminé (structure + dépendances)
- ✅ Repository GitHub créé (utilisateur)

---

## 12. Conditions de passage au sprint suivant

**Pour passer à Sprint 2 :**
- ✅ Tous critères C1.6.x, C1.7.x, C1.8.x satisfaits
- ✅ Gitleaks configuré et fonctionnel
- ✅ README.md et docs/SETUP.md complets
- ✅ CI GitHub Actions verte
- ✅ Approbation utilisateur Sprint 1 complet

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — Toutes décisions déjà validées.

---

## 15. Procédure fin Sprint 1

**Après ce sous-sprint :**

1. Vérifier tous critères Sprint 1 (C1.1 à C1.10)
2. Créer rapport validation Sprint 1
3. Commit tous fichiers
4. Push branche `sprint/01/setup-project`
5. Présenter résultats utilisateur
6. **Attendre approbation avant Sprint 2**

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 1-3 prêt pour exécution**
