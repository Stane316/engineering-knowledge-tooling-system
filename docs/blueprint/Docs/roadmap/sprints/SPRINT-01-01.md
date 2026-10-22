# Sprint 1-1 — Initialisation TypeScript + outils qualité

**Identifiant :** SPRINT-01-01  
**Parent :** SPRINT-01 (Setup projet)  
**Durée prévue :** 3 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Objectif précis

**Initialiser un projet Node.js/TypeScript avec outils de qualité code (ESLint, Prettier, Vitest).**

**Résultat concret attendu :**
- `package.json` créé avec scripts npm
- `tsconfig.json` configuré (strict mode)
- ESLint configuré pour TypeScript
- Prettier configuré et compatible ESLint
- Vitest configuré avec couverture
- `npm run build`, `npm run lint`, `npm test` fonctionnent

---

## 2. Prérequis

| Prérequis | Vérification | Action si manquant |
|-----------|--------------|-------------------|
| Node.js 22.12+ | `node --version` | Installer Node.js 22 LTS |
| npm 10+ | `npm --version` | Installer npm 10+ |
| Git | `git --version` | Installer Git |
| Workspace writable | `touch test && rm test` | Vérifier permissions |

**Si prérequis manquant :** Documenter et demander intervention utilisateur.

---

## 3. Tâches atomiques

### Tâche 1.1 — Initialiser projet Node.js + TypeScript

**Objectif :** Créer `package.json` et `tsconfig.json`  
**Durée :** 2h  
**Fichiers concernés :** `package.json`, `tsconfig.json`

**Actions :**

```bash
# 1. Initialiser package.json
npm init -y

# 2. Éditer package.json
# Ajouter :
# - "type": "module"
# - "engines": { "node": ">=20.0.0" }
# - Scripts : build, dev, start, clean

# 3. Installer TypeScript
npm install -D typescript@~5.9.3 @types/node@^22

# 4. Créer tsconfig.json
npx tsc --init

# 5. Éditer tsconfig.json
# Configurer :
# - "target": "ES2022"
# - "module": "NodeNext"
# - "moduleResolution": "NodeNext"
# - "strict": true
# - "outDir": "./dist"
# - "rootDir": "./src"
# - "esModuleInterop": true
# - "skipLibCheck": true
# - "forceConsistentCasingInFileNames": true

# 6. Créer src/index.ts (vide)
mkdir -p src
touch src/index.ts

# 7. Tester build
npm run build
```

**Résultat attendu :**
- `package.json` créé avec scripts
- `tsconfig.json` configuré (strict mode)
- `src/index.ts` créé
- `npm run build` compile sans erreur

**Vérification :**
```bash
npm run build
# Attendu : compilation réussie, dist/index.js créé
```

**Critères d'acceptation :**
- ✅ `package.json` existe avec scripts (build, dev, start, clean)
- ✅ `tsconfig.json` avec `strict: true`
- ✅ `src/index.ts` existe
- ✅ `npm run build` fonctionne

---

### Tâche 1.2 — Configurer ESLint + Prettier

**Objectif :** Configurer linting et formatage code  
**Durée :** 2h  
**Fichiers concernés :** `eslint.config.js`, `.prettierrc`, `.prettierignore`

**Actions :**

```bash
# 1. Installer ESLint 10 (flat config), typescript-eslint et Prettier
npm install -D eslint@^10.13.0 @eslint/js@^10.0.1 typescript-eslint@^8.72.0 prettier@^3.9.10 eslint-config-prettier@^10.1.8

# 2. Créer eslint.config.js (ESLint 10 ne lit plus .eslintrc.*)
cat > eslint.config.js << 'EOF'
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
);
EOF

# 3. Créer .prettierrc
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
EOF

# 4. Créer .prettierignore
cat > .prettierignore << 'EOF'
node_modules/
dist/
build/
coverage/
*.db
.env
package-lock.json
EOF

# 5. Ajouter scripts package.json
# "lint": "eslint .",
# "lint:fix": "eslint . --fix",
# "format": "prettier --write .",
# "format:check": "prettier --check ."

# 6. Tester lint
npm run lint

# 7. Tester format
npm run format:check
```

**Résultat attendu :**
- ESLint configuré pour TypeScript
- Prettier configuré
- `npm run lint` passe
- `npm run format:check` vérifie le formatage

**Vérification :**
```bash
npm run lint
# Attendu : 0 erreurs (ou warnings seulement)

npm run format:check
# Attendu : aucun fichier à reformater
```

**Critères d'acceptation :**
- ✅ `eslint.config.js` existe (flat config)
- ✅ `.prettierrc` existe
- ✅ `npm run lint` passe sans erreur
- ✅ `npm run format:check` passe

---

### Tâche 1.3 — Configurer Vitest

**Objectif :** Configurer framework de tests avec couverture  
**Durée :** 2h  
**Fichiers concernés :** `vitest.config.ts`, `tests/`

**Actions :**

```bash
# 1. Installer Vitest + coverage
npm install -D vitest@^5.0.5 @vitest/coverage-v8@^5.0.5

# 2. Créer vitest.config.ts
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.ts',
      ],
    },
  },
});
EOF

# 3. Créer structure tests
mkdir -p tests/unit tests/integration tests/benchmark

# 4. Créer test exemple (optionnel)
cat > tests/example.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
EOF

# 5. Ajouter scripts package.json
# "test": "vitest",
# "test:run": "vitest run",
# "coverage": "vitest run --coverage"

# 6. Tester
npm test
```

**Résultat attendu :**
- Vitest configuré
- `npm test` exécute Vitest
- Coverage disponible

**Vérification :**
```bash
npm test
# Attendu : Vitest démarre, 1 test passe (example.test.ts)

npm run coverage
# Attendu : rapport couverture généré
```

**Critères d'acceptation :**
- ✅ `vitest.config.ts` existe
- ✅ `npm test` exécute Vitest
- ✅ `npm run coverage` génère rapport
- ✅ Structure tests créée (tests/unit, tests/integration, tests/benchmark)

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `package.json` | Configuration npm |
| `tsconfig.json` | Configuration TypeScript |
| `src/index.ts` | Point d'entrée (vide) |
| `eslint.config.js` | Configuration ESLint (flat config) |
| `.prettierrc` | Configuration Prettier |
| `.prettierignore` | Fichiers ignorés Prettier |
| `vitest.config.ts` | Configuration Vitest |
| `tests/example.test.ts` | Test exemple |

### 4.2 Dossiers à créer

| Dossier | Rôle |
|---------|------|
| `src/` | Code source |
| `tests/` | Tests |
| `tests/unit/` | Tests unitaires |
| `tests/integration/` | Tests intégration |
| `tests/benchmark/` | Benchmarks |

---

## 5. Configurations externes nécessaires

**Aucune** — Pas de services externes pour ce sous-sprint.

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Exécuter toutes tâches
- ✅ Créer fichiers et dossiers
- ✅ Configurer outils
- ✅ Exécuter tests
- ✅ Documenter résultats

### 6.2 Utilisateur

- ✅ Valider sous-sprint terminé
- ✅ Intervenir si prérequis manquant

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
npm run build      # Build TypeScript
npm run lint       # Linting
npm run format:check  # Vérification du formatage
npm test           # Tests Vitest
npm run coverage   # Couverture
```

### 7.2 Résultats attendus

- ✅ Build : succès
- ✅ Lint : 0 erreurs
- ✅ Format : fichiers formatés
- ✅ Tests : 1 test passe (example.test.ts)
- ✅ Coverage : rapport généré

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C1.1.1 | `package.json` existe avec scripts | `cat package.json` |
| C1.1.2 | `tsconfig.json` avec `strict: true` | `cat tsconfig.json` |
| C1.1.3 | `src/index.ts` existe | `ls src/` |
| C1.1.4 | `npm run build` fonctionne | `npm run build` |
| C1.2.1 | `eslint.config.js` existe | `ls eslint.config.js` |
| C1.2.2 | `.prettierrc` existe | `ls .prettierrc` |
| C1.2.3 | `npm run lint` passe | `npm run lint` |
| C1.2.4 | `npm run format:check` passe | `npm run format:check` |
| C1.3.1 | `vitest.config.ts` existe | `ls vitest.config.ts` |
| C1.3.2 | `npm test` exécute Vitest | `npm test` |
| C1.3.3 | `npm run coverage` génère rapport | `npm run coverage` |
| C1.3.4 | Structure tests créée | `ls tests/` |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
npm run build > build.log 2>&1
npm run lint > lint.log 2>&1
npm test > test.log 2>&1
```

**Captures à conserver :**
- Liste fichiers créés (`ls -la`)
- Contenu `package.json` (scripts)
- Contenu `tsconfig.json` (strict mode)

---

## 10. Conditions d'échec

**Échec si :**
- ❌ `npm run build` échoue
- ❌ `npm run lint` échoue
- ❌ `npm test` échoue
- ❌ Fichiers configuration manquants

**Action si échec :**
1. Documenter erreur
2. Identifier cause
3. Proposer solution
4. Si blocage → demander intervention utilisateur

---

## 11. Dépendances

**Aucune** — Premier sous-sprint.

---

## 12. Conditions de passage au sous-sprint suivant

**Pour passer à Sprint 1-2 :**
- ✅ Tous critères C1.1.x, C1.2.x, C1.3.x satisfaits
- ✅ `npm run build` fonctionne
- ✅ `npm run lint` passe
- ✅ `npm test` exécute Vitest
- ✅ Approbation utilisateur

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — Toutes décisions déjà validées (ADR-005, ADR-010).

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 1-1 prêt pour exécution**
