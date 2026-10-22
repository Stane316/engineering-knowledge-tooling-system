# Sprint 1-2 — Structure dossiers + dépendances

**Identifiant :** SPRINT-01-02  
**Parent :** SPRINT-01 (Setup projet)  
**Durée prévue :** 3 jours  
**Date de documentation :** 21 octobre 2026  
**Statut :** ⏳ NON COMMENCÉ  

---

## 1. Objectif précis

**Créer la structure de dossiers conforme à l'architecture et installer les dépendances de base.**

**Résultat concret attendu :**
- Structure dossiers complète (src/cli, src/mcp, src/business, src/data, src/shared)
- Dépendances de base installées (better-sqlite3, commander, zod, pino)
- Fichiers placeholder créés dans chaque dossier
- `npm run build` compile sans erreur

---

## 2. Prérequis

| Prérequis | Vérification | Source |
|-----------|--------------|--------|
| Sprint 1-1 terminé | `npm run build` fonctionne | SPRINT-01-01 |
| `package.json` existe | `ls package.json` | Sprint 1-1 |
| `tsconfig.json` configuré | `cat tsconfig.json` | Sprint 1-1 |
| Structure `src/` et `tests/` créée | `ls src/ tests/` | Sprint 1-1 |

**Si prérequis manquant :** Retourner à Sprint 1-1.

---

## 3. Tâches atomiques

### Tâche 1.4 — Créer structure dossiers

**Objectif :** Créer tous dossiers nécessaires à l'architecture  
**Durée :** 2h  
**Fichiers concernés :** Dossiers src/*, tests/*, docs/guides/

**Actions :**

```bash
# 1. Créer structure src
mkdir -p src/cli
mkdir -p src/mcp
mkdir -p src/business
mkdir -p src/data/repositories
mkdir -p src/data/schemas
mkdir -p src/data/migrations
mkdir -p src/shared

# 2. Créer docs
mkdir -p docs/guides

# 3. Créer migrations
mkdir -p migrations

# 4. Créer fichiers placeholder (pour que Git tracke dossiers vides)
touch src/cli/.gitkeep
touch src/mcp/.gitkeep
touch src/business/.gitkeep
touch src/data/repositories/.gitkeep
touch src/data/schemas/.gitkeep
touch src/data/migrations/.gitkeep
touch src/shared/.gitkeep
touch docs/guides/.gitkeep
touch migrations/.gitkeep

# 5. Créer fichiers source minimaux
cat > src/shared/types.ts << 'EOF'
// Types partagés EKTS

export interface Resource {
  id: string;
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  resource: Resource;
  score: number;
  highlight?: string;
  source: 'fts' | 'vector' | 'hybrid';
}
EOF

cat > src/shared/config.ts << 'EOF'
// Configuration EKTS

export const config = {
  db: {
    main: 'data/ekts.db',
    fts: 'data/ekts-fts.db',
    vectors: 'data/ekts-vectors.db',
  },
  paths: {
    data: 'data',
    logs: 'logs',
    backups: 'backups',
  },
} as const;
EOF

# 6. Vérifier structure
tree -L 3 src/
```

**Résultat attendu :**
- Structure dossiers complète
- Fichiers placeholder créés
- `src/shared/types.ts` avec interfaces de base
- `src/shared/config.ts` avec configuration

**Vérification :**
```bash
tree -L 3 src/
# Attendu : structure complète affichée
```

**Critères d'acceptation :**
- ✅ Dossiers src/cli, src/mcp, src/business, src/data, src/shared créés
- ✅ Dossiers tests/unit, tests/integration, tests/benchmark créés
- ✅ Dossier `docs/guides` créé
- ✅ Dossier migrations créé
- ✅ `src/shared/types.ts` existe avec interfaces
- ✅ `src/shared/config.ts` existe avec configuration

---

### Tâche 1.5 — Installer dépendances de base

**Objectif :** Installer packages production et développement  
**Durée :** 2h  
**Fichiers concernés :** `package.json`, `package-lock.json`, `node_modules/`

**Actions :**

```bash
# 1. Installer dépendances production
npm install better-sqlite3@^13.0.3 commander@^15.0.0 zod@^4.6.7 pino@^10.4.0

# 2. Installer types TypeScript
npm install -D @types/better-sqlite3@^9.6.0

# 3. Vérifier installation
npm ls --depth=0

# 4. Ajouter scripts package.json
# "dev": "tsx watch src/index.ts",
# "start": "node dist/index.js",
# "clean": "rm -rf dist"

# 5. Installer tsx pour développement
npm install -D tsx@^4.23.15

# 6. Tester dev
npm run dev
# Attendu : src/index.ts s'exécute (rien ne se passe, c'est normal)

# 7. Vérifier build
npm run build
# Attendu : dist/ créé avec fichiers compilés
```

**Résultat attendu :**
- Dépendances production installées (better-sqlite3, commander, zod, pino)
- Types TypeScript installés (@types/better-sqlite3)
- tsx installé pour développement
- `npm run build` compile sans erreur
- `npm run dev` exécute src/index.ts

**Vérification :**
```bash
npm ls --depth=0
# Attendu : liste dépendances affichée

npm run build
# Attendu : compilation réussie
```

**Critères d'acceptation :**
- ✅ better-sqlite3 installé
- ✅ commander installé
- ✅ zod installé
- ✅ pino installé
- ✅ @types/better-sqlite3 installé
- ✅ tsx installé
- ✅ `npm run build` fonctionne
- ✅ `npm run dev` fonctionne

---

## 4. Fichiers concernés

### 4.1 Fichiers à créer

| Fichier | Rôle |
|---------|------|
| `src/cli/.gitkeep` | Placeholder dossier |
| `src/mcp/.gitkeep` | Placeholder dossier |
| `src/business/.gitkeep` | Placeholder dossier |
| `src/data/repositories/.gitkeep` | Placeholder dossier |
| `src/data/schemas/.gitkeep` | Placeholder dossier |
| `src/data/migrations/.gitkeep` | Placeholder dossier |
| `src/shared/.gitkeep` | Placeholder dossier |
| `src/shared/types.ts` | Types partagés |
| `src/shared/config.ts` | Configuration |
| `docs/.gitkeep` | Placeholder dossier |
| `migrations/.gitkeep` | Placeholder dossier |

### 4.2 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `package.json` | Ajouter dépendances, scripts dev/start/clean |
| `package-lock.json` | Mis à jour automatiquement |

### 4.3 Dossiers à créer

| Dossier | Rôle |
|---------|------|
| `src/cli/` | CLI (Sprint 5) |
| `src/mcp/` | MCP Server (Sprint 6) |
| `src/business/` | Business Logic (Sprint 3-4) |
| `src/data/` | Data Layer (Sprint 2) |
| `src/data/repositories/` | Repositories |
| `src/data/schemas/` | Schémas Zod |
| `src/data/migrations/` | Migrations SQL |
| `src/shared/` | Utils, types, config |
| `docs/` | Documentation |
| `migrations/` | Migrations |

---

## 5. Configurations externes nécessaires

**Aucune** — Pas de services externes pour ce sous-sprint.

---

## 6. Responsabilités

### 6.1 Agent IA

- ✅ Créer tous dossiers
- ✅ Créer fichiers placeholder
- ✅ Créer `src/shared/types.ts` et `config.ts`
- ✅ Installer dépendances
- ✅ Vérifier build et dev

### 6.2 Utilisateur

- ✅ Valider sous-sprint terminé
- ✅ Intervenir si problème installation

---

## 7. Tests

### 7.1 Tests à exécuter

```bash
npm run build   # Build TypeScript
npm run dev     # Exécuter src/index.ts
npm ls --depth=0  # Lister dépendances
```

### 7.2 Résultats attendus

- ✅ Build : succès
- ✅ Dev : exécution sans erreur
- ✅ Dépendances : liste complète

---

## 8. Critères d'acceptation

| ID | Critère | Méthode |
|----|---------|---------|
| C1.4.1 | Dossiers src/* créés | `ls src/` |
| C1.4.2 | Dossiers tests/* créés | `ls tests/` |
| C1.4.3 | Dossier docs créé | `ls docs/` |
| C1.4.4 | Dossier migrations créé | `ls migrations/` |
| C1.4.5 | `src/shared/types.ts` existe | `cat src/shared/types.ts` |
| C1.4.6 | `src/shared/config.ts` existe | `cat src/shared/config.ts` |
| C1.5.1 | better-sqlite3 installé | `npm ls better-sqlite3` |
| C1.5.2 | commander installé | `npm ls commander` |
| C1.5.3 | zod installé | `npm ls zod` |
| C1.5.4 | pino installé | `npm ls pino` |
| C1.5.5 | `npm run build` fonctionne | `npm run build` |
| C1.5.6 | `npm run dev` fonctionne | `npm run dev` |

**Tous critères obligatoires.**

---

## 9. Preuves de réussite

**Logs à conserver :**
```bash
npm ls --depth=0 > dependencies.log 2>&1
npm run build > build.log 2>&1
tree -L 3 src/ > structure.log 2>&1
```

**Captures à conserver :**
- Structure dossiers (tree)
- Liste dépendances (npm ls)

---

## 10. Conditions d'échec

**Échec si :**
- ❌ Dossiers manquants
- ❌ Dépendances non installées
- ❌ `npm run build` échoue
- ❌ `npm run dev` échoue

**Action si échec :**
1. Documenter erreur
2. Identifier cause (réseau, permissions, etc.)
3. Proposer solution
4. Si blocage → demander intervention utilisateur

---

## 11. Dépendances

**Dépend de :**
- ✅ Sprint 1-1 terminé (package.json, tsconfig.json, outils qualité)

---

## 12. Conditions de passage au sous-sprint suivant

**Pour passer à Sprint 1-3 :**
- ✅ Tous critères C1.4.x, C1.5.x satisfaits
- ✅ Structure dossiers complète
- ✅ Dépendances installées
- ✅ Build et dev fonctionnent
- ✅ Approbation utilisateur

---

## 13. Éléments à reporter

**Aucun** — Tout doit être terminé dans ce sous-sprint.

---

## 14. Décisions à faire valider

**Aucune** — Toutes décisions déjà validées (ADR-001, ADR-005).

---

**Document rédigé le 21 octobre 2026 — PARTIE II du projet EKTS**  
**Statut : ⏳ Sous-sprint 1-2 prêt pour exécution**
