# Spécification MVP — Phase 13

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé (partiellement remplacé — voir note)  
**Auteur :** Agent EKTS  
**Objectif :** Définir le périmètre MVP, contrats entre composants, ce qui est reporté

> **⚠️ Note (25 octobre 2026) — MVP-3 redéfini :**
> Le §4 de ce document décrit le périmètre **initial** du MVP-3 (workflow 8 étapes, post-mortems, sécurité secrets).
> Le périmètre **actif** est défini dans [`docs/ROADMAP.md`](../../ROADMAP.md) (ADR-031).
> Ce document reste comme référence historique et pour les sections MVP-1/MVP-2 toujours valides.

---

## 1. Introduction

### 1.1 Contexte

**Architecture cible :** Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels

**Objectif MVP :** Livrer rapidement de la valeur avec un système fonctionnel minimal, puis itérer.

### 1.2 Séquence MVP proposée

**Séquence initiale (Blueprint) :**
1. **MVP-1** : Bibliothèque locale structurée, recherche, CLI, serveur MCP local (lecture seule)
2. **MVP-2** : Workflow d'inspection navigateur limité et reproductible
3. **MVP-3** : Capitalisation de projets

### 1.3 Validation de la séquence

**Décision :** ✅ **Séquence validée avec ajustements mineurs**

**Arguments :**

**MVP-1 (Bibliothèque + Recherche + CLI + MCP) :**
- ✅ **Fondation essentielle** : Sans stockage et recherche, rien d'autre n'est possible
- ✅ **Valeur immédiate** : Centraliser connaissances dispersées = gain de temps immédiat
- ✅ **Risques faibles** : SQLite local, pas d'exposition réseau, pas de dépendances externes
- ✅ **Apprentissage progressif** : CLI + MCP = comprendre l'intégration agents
- ✅ **Testable** : Critères clairs (recherche hybride, 4 outils MCP)

**MVP-2 (Inspection navigateur) :**
- ✅ **Dépend de MVP-1** : Besoin de stocker résultats d'inspection
- ✅ **Valeur ajoutée** : Automatiser inspections manuelles = gain de temps
- ✅ **Complexité maîtrisée** : Playwright MCP existe, 4 niveaux d'inspection définis (Phase 04)
- ⚠️ **Risque modéré** : Playwright = dépendance lourde, mais optionnel (feature flag)

**MVP-3 (Capitalisation projets) :**
- ✅ **Dépend de MVP-1 + MVP-2** : Besoin de recherche + inspection pour capitaliser
- ✅ **Valeur long terme** : Capitaliser = ne pas repartir de zéro (proposition de valeur EKTS)
- ✅ **Complexité élevée** : Workflow 8 étapes, post-mortem, sécurité secrets (Phase 10, 11)
- ⚠️ **Risque modéré** : Gitleaks + TruffleHog = dépendances, mais crucial pour sécurité

**Ajustements mineurs :**
- **MVP-1.5** (optionnel) : Creative Library (Phase 09) — 103+ ressources, MCP tool
  - **Pourquoi** : Valeur immédiate pour projets créatifs, dépend uniquement de MVP-1
  - **Quand** : Entre MVP-1 et MVP-2, si temps permet

---

## 2. MVP-1 — Bibliothèque locale, recherche, CLI, MCP

### 2.1 Périmètre inclus

**Fonctionnalités :**

1. **Stockage structuré (SQLite WAL)**
   - CRUD resources (add, update, delete, get, list)
   - 3 bases SQLite : ekts.db (structuré), ekts-fts.db (FTS5), ekts-vectors.db (embeddings)
   - Schéma validé (Zod)
   - Tags + métadonnées

2. **Recherche hybride (FTS + Vector)**
   - FTS5 (BM25, full-text)
   - sqlite-vec (embeddings, cosine similarity)
   - RRF fusion (k=60)
   - Recall@5 ≥ 0.75, Faithfulness ≥ 0.80 (Phase 07)

3. **CLI (Commander.js)**
   - `ekts add <resource>` — Ajouter une ressource
   - `ekts search <query>` — Recherche hybride
   - `ekts get <id>` — Obtenir une ressource par ID
   - `ekts list [filters]` — Lister ressources
   - `ekts delete <id>` — Supprimer une ressource
   - `ekts init` — Initialiser bases SQLite
   - `ekts status` — Statut du système

4. **MCP Server (stdio transport)**
   - 4 outils MCP prioritaires (Phase 02) :
     - `search_knowledge` — Recherche hybride
     - `get_resource` — Obtenir ressource par ID
     - `list_resources` — Lister ressources (filtres)
     - `validate_resource` — Valider schéma ressource
   - Transport : stdio (local, sécurisé)
   - Spec MCP 2026-07-28 (stateless)

5. **Indexation automatique**
   - À chaque ajout/update : indexation FTS + Vector
   - Embeddings : OpenAI text-embedding-3-small (ou local Ollama)
   - Batch processing (performance)

**Technologies :**
- Node.js 20+ (TypeScript)
- SQLite WAL (better-sqlite3)
- FTS5 (intégré SQLite)
- sqlite-vec (extension SQLite)
- Commander.js (CLI)
- MCP SDK TypeScript 1.32.x
- Zod (validation schémas)
- Pino (logs structurés)

### 2.2 Périmètre reporté

**Fonctionnalités EXCLUES de MVP-1 :**

1. **Creative Library (Phase 09)**
   - **Pourquoi reporté** : Peut être ajouté en MVP-1.5 si temps permet
   - **Dépendance** : Nécessite MVP-1 (stockage + recherche)
   - **Priorité** : Moyenne (utile mais pas critique)

2. **Browser Inspector (Phase 04)**
   - **Pourquoi reporté** : MVP-2, dépend de MVP-1
   - **Complexité** : Playwright = dépendance lourde
   - **Priorité** : Haute, mais après MVP-1

3. **Project Capitalizer (Phase 10)**
   - **Pourquoi reporté** : MVP-3, dépend de MVP-1 + MVP-2
   - **Complexité** : Workflow 8 étapes, sécurité secrets
   - **Priorité** : Haute, mais après MVP-2

4. **Analyse d'expérience (Phase 08)**
   - **Pourquoi reporté** : Dépend de MVP-2 (inspection navigateur)
   - **Priorité** : Moyenne

5. **Authentification / RBAC (Phase 11)**
   - **Pourquoi reporté** : MVP-1 = usage personnel, single-user
   - **Priorité** : Faible pour MVP-1, critique pour Production

6. **Monitoring / Alertes (Phase 11)**
   - **Pourquoi reporté** : MVP-1 = local, pas critique
   - **Priorité** : Faible pour MVP-1, importante pour Production

### 2.3 Contrats entre composants

#### Contrat 1 : CLI ↔ Knowledge Manager

**Interface :**
```typescript
// CLI Command
interface AddResourceCommand {
  type: 'article' | 'video' | 'tutorial' | 'tool' | 'other';
  title: string;
  url?: string;
  tags: string[];
  metadata?: Record<string, any>;
  content?: string; // Pour indexation
}

// Result
interface AddResourceResult {
  success: boolean;
  resourceId?: string;
  error?: string;
}

// Exemple
const result: AddResourceResult = await knowledgeManager.addResource({
  type: 'article',
  title: 'MCP Protocol Specification',
  url: 'https://modelcontextprotocol.io',
  tags: ['mcp', 'agents', 'protocol'],
  metadata: { author: 'Anthropic', date: '2026-07-28' },
  content: 'The Model Context Protocol (MCP) is...',
});
```

**Contrat :**
- CLI appelle `knowledgeManager.addResource(command)`
- Knowledge Manager valide schéma (Zod), stocke SQLite, indexe FTS + Vector
- Résultat : success + resourceId ou error

#### Contrat 2 : Knowledge Manager ↔ Data Layer

**Interface :**
```typescript
// Repository Pattern
interface ResourceRepository {
  create(resource: Resource): Promise<Resource>;
  getById(id: string): Promise<Resource | null>;
  list(filters?: ResourceFilters): Promise<Resource[]>;
  update(id: string, data: Partial<Resource>): Promise<Resource>;
  delete(id: string): Promise<void>;
}

// Resource Schema (Zod)
const ResourceSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['article', 'video', 'tutorial', 'tool', 'other']),
  title: z.string().min(1),
  url: z.string().url().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type Resource = z.infer<typeof ResourceSchema>;
```

**Contrat :**
- Knowledge Manager utilise `ResourceRepository` (abstraction)
- Implémentation : SQLite (better-sqlite3)
- Validation : Zod (runtime)

#### Contrat 3 : Search Engine ↔ Data Layer

**Interface :**
```typescript
// Search Engine
interface SearchEngine {
  search(query: string, limit?: number, mode?: SearchMode): Promise<SearchResult[]>;
}

type SearchMode = 'hybrid' | 'fts' | 'vector';

interface SearchResult {
  resource: Resource;
  score: number; // RRF score (hybrid), BM25 (fts), cosine (vector)
  highlight?: string; // Extrait avec termes surlignés
}

// Exemple
const results: SearchResult[] = await searchEngine.search('MCP protocol', 10, 'hybrid');
```

**Contrat :**
- Search Engine utilise 2 sources :
  - FTS5 (ekts-fts.db) : BM25, top 20
  - sqlite-vec (ekts-vectors.db) : cosine similarity, top 20
- Fusion RRF (k=60) : `score = 1/(k+rank_fts) + 1/(k+rank_vec)`
- Retourne top 10 (ou limit spécifié)

#### Contrat 4 : MCP Server ↔ Business Logic

**Interface :**
```typescript
// MCP Tool Definition
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (input: any) => Promise<any>;
}

// Exemple : search_knowledge
const searchKnowledgeTool: MCPTool = {
  name: 'search_knowledge',
  description: 'Recherche hybride (FTS + Vector) dans la base EKTS',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Requête de recherche' },
      limit: { type: 'number', default: 10, description: 'Nombre de résultats' },
      mode: { 
        type: 'string', 
        enum: ['hybrid', 'fts', 'vector'],
        default: 'hybrid',
        description: 'Mode de recherche'
      },
    },
    required: ['query'],
  },
  handler: async (input) => {
    const results = await searchEngine.search(input.query, input.limit, input.mode);
    return {
      results: results.map(r => ({
        id: r.resource.id,
        title: r.resource.title,
        score: r.score,
        highlight: r.highlight,
      })),
      total: results.length,
    };
  },
};
```

**Contrat :**
- MCP Server expose 4 outils (search_knowledge, get_resource, list_resources, validate_resource)
- Chaque outil appelle Business Logic (Knowledge Manager, Search Engine)
- Transport : stdio (local, sécurisé)
- Spec MCP 2026-07-28 (stateless, pas de session tracking)

### 2.4 Critères d'acceptation MVP-1

**Fonctionnels :**

1. **CLI fonctionne**
   - ✅ `ekts init` crée les 3 bases SQLite
   - ✅ `ekts add` ajoute une ressource (validée Zod)
   - ✅ `ekts search` retourne résultats hybrides (FTS + Vector)
   - ✅ `ekts get` retourne ressource par ID
   - ✅ `ekts list` liste ressources (filtres optionnels)
   - ✅ `ekts delete` supprime ressource
   - ✅ `ekts status` affiche statut (nb ressources, taille DB)

2. **Recherche hybride performante**
   - ✅ Recall@5 ≥ 0.75 (Phase 07)
   - ✅ Faithfulness ≥ 0.80 (Phase 07)
   - ✅ Latence < 500ms (100K documents)
   - ✅ FTS5 + sqlite-vec fonctionnels

3. **MCP Server opérationnel**
   - ✅ 4 outils MCP exposés (search, get, list, validate)
   - ✅ Transport stdio (local)
   - ✅ Compatible Claude Code, Cursor, Copilot (Tier 1 agents)
   - ✅ Spec MCP 2026-07-28 respectée

4. **Données persistées**
   - ✅ SQLite WAL (performance)
   - ✅ 3 bases séparées (structuré, FTS, vectors)
   - ✅ Backup trivial (copier fichiers)
   - ✅ Intégrité (transactions, foreign keys)

**Non-fonctionnels :**

1. **Performance**
   - ✅ CLI répond en < 200ms (opérations simples)
   - ✅ Recherche < 500ms (100K documents)
   - ✅ Indexation < 1s (par ressource)

2. **Sécurité**
   - ✅ Fichiers SQLite chmod 600
   - ✅ Pas d'exposition réseau (stdio uniquement)
   - ✅ Secrets dans `.env` (jamais commités)
   - ✅ Gitleaks pre-commit hook

3. **Maintenabilité**
   - ✅ Tests unitaires > 80% couverture
   - ✅ Documentation API (JSDoc)
   - ✅ Logs structurés (Pino, JSON)
   - ✅ Code TypeScript typé (strict mode)

4. **Portabilité**
   - ✅ Fonctionne sur Linux, macOS, Windows
   - ✅ Node.js 20+ (LTS)
   - ✅ Pas de dépendances système (SQLite embedded)

---

## 3. MVP-2 — Inspection navigateur

### 3.1 Périmètre inclus

**Fonctionnalités :**

1. **Browser Inspector (Playwright MCP)**
   - 4 niveaux d'inspection (Phase 04) :
     - L1 : Rapide (screenshot + accessibility tree)
     - L2 : Standard (L1 + performance + SEO)
     - L3 : Approfondie (L2 + UX + contenu)
     - L4 : Crawling (L3 + multi-pages)
   - Playwright MCP (70+ tools)
   - Patchright (optionnel, sites protégés)

2. **Analyse 5 dimensions (Phase 08)**
   - Performance (Lighthouse)
   - Accessibilité (axe-core, WCAG 2.2 AA)
   - SEO (meta tags, structured data)
   - UX (heuristiques Nielsen)
   - Contenu (qualité, pertinence)

3. **Matrice sévérité**
   - Sévérité technique (0-4) × Fréquence (1-5) × Impact business (1-3)
   - Priorisation automatique des findings

4. **Stockage + indexation**
   - Audits stockés dans ekts.db
   - Findings indexés dans FTS + Vector
   - Recherche `inspect_site` (MCP tool)

**Technologies :**
- Playwright (browser automation)
- Playwright MCP (70+ tools)
- Patchright (optionnel, stealth)
- Lighthouse (performance)
- axe-core (accessibilité)

### 3.2 Périmètre reporté

**Fonctionnalités EXCLUES de MVP-2 :**

1. **Crawling avancé (L4)**
   - **Pourquoi reporté** : Complexité élevée, cas d'usage limité
   - **Priorité** : Faible pour MVP-2

2. **Analyse IA des findings**
   - **Pourquoi reporté** : Coût API (GPT-4o-mini), pas critique
   - **Priorité** : Moyenne, peut être ajouté plus tard

3. **Comparaison multi-audits**
   - **Pourquoi reporté** : Complexité, pas critique pour MVP
   - **Priorité** : Moyenne

### 3.3 Contrats entre composants

#### Contrat : CLI/MCP ↔ Browser Inspector

**Interface :**
```typescript
// CLI Command
interface InspectSiteCommand {
  url: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  options?: {
    stealth?: boolean; // Patchright
    screenshot?: boolean;
    trace?: boolean;
  };
}

// Result
interface InspectSiteResult {
  success: boolean;
  auditId?: string;
  findings?: Finding[];
  error?: string;
}

interface Finding {
  dimension: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content';
  severity: number; // 0-4
  frequency: number; // 1-5
  impact: number; // 1-3
  priority: number; // severity × frequency × impact
  title: string;
  description: string;
  recommendation: string;
}

// Exemple
const result: InspectSiteResult = await browserInspector.inspect({
  url: 'https://example.com',
  level: 'L2',
  options: { screenshot: true },
});
```

### 3.4 Critères d'acceptation MVP-2

**Fonctionnels :**

1. **Inspection fonctionne**
   - ✅ `ekts inspect <url> --level L1` (rapide)
   - ✅ `ekts inspect <url> --level L2` (standard)
   - ✅ `ekts inspect <url> --level L3` (approfondie)
   - ✅ 5 dimensions analysées (perf, a11y, SEO, UX, contenu)
   - ✅ Matrice sévérité calculée

2. **MCP tool expose**
   - ✅ `inspect_site` (MCP tool)
   - ✅ Retourne auditId + findings
   - ✅ Compatible Tier 1 agents

3. **Stockage + indexation**
   - ✅ Audits stockés (ekts.db)
   - ✅ Findings indexés (FTS + Vector)
   - ✅ Recherche `search_knowledge` inclut audits

**Non-fonctionnels :**

1. **Performance**
   - ✅ L1 < 10s
   - ✅ L2 < 30s
   - ✅ L3 < 60s

2. **Fiabilité**
   - ✅ Playwright stable (pas de crash)
   - ✅ Retry mechanism (network errors)
   - ✅ Timeout handling

---

## 4. MVP-3 — Capitalisation de projets

### 4.1 Périmètre inclus

**Fonctionnalités :**

1. **Workflow 8 étapes (Phase 10)**
   - Collecte artefacts
   - Nettoyage secrets (Gitleaks + TruffleHog)
   - Documentation
   - Vérification
   - Validation
   - Publication
   - Indexation
   - Dépréciation

2. **Post-mortem template (10 sections)**
   - Informations projet
   - Objectifs
   - Timeline
   - Succès
   - Difficultés
   - Root cause (5 pourquoi + Ishikawa)
   - Dette technique
   - Leçons apprises
   - Recommandations
   - Annexes

3. **Sécurité secrets**
   - Gitleaks (scan rapide)
   - TruffleHog (vérification secrets actifs)
   - git-filter-repo (nettoyage historique)

4. **Stockage + indexation**
   - Projets stockés (ekts.db)
   - Post-mortems indexés (FTS + Vector)
   - Recherche `search_knowledge` inclut projets

### 4.2 Périmètre reporté

**Fonctionnalités EXCLUES de MVP-3 :**

1. **Automatisation complète**
   - **Pourquoi reporté** : Validation humaine requise à chaque étape
   - **Priorité** : Moyenne, peut être partiellement automatisé plus tard

2. **Intégration CI/CD**
   - **Pourquoi reporté** : Complexité, dépend de l'environnement
   - **Priorité** : Faible pour MVP

### 4.3 Contrats entre composants

#### Contrat : CLI ↔ Project Capitalizer

**Interface :**
```typescript
// CLI Command
interface CapitalizeProjectCommand {
  projectPath: string;
  projectName: string;
  options?: {
    skipSecretsCheck?: boolean;
    autoPublish?: boolean;
  };
}

// Result
interface CapitalizeProjectResult {
  success: boolean;
  projectId?: string;
  postmortemPath?: string;
  secretsFound?: number;
  error?: string;
}

// Exemple
const result: CapitalizeProjectResult = await projectCapitalizer.capitalize({
  projectPath: '/path/to/project',
  projectName: 'EKTS-MVP-1',
  options: { autoPublish: true },
});
```

### 4.4 Critères d'acceptation MVP-3

**Fonctionnels :**

1. **Workflow fonctionne**
   - ✅ `ekts capitalize <path>` lance workflow 8 étapes
   - ✅ Secrets détectés (Gitleaks + TruffleHog)
   - ✅ Post-mortem généré (10 sections)
   - ✅ Projet publié (Git) + indexé (FTS + Vector)

2. **Sécurité**
   - ✅ Secrets détectés avant publication
   - ✅ Nettoyage historique (git-filter-repo)
   - ✅ Validation humaine (approval gates)

---

## 5. Roadmap synthétique

### 5.1 Timeline

**Mois 1-3 : MVP-1 (Bibliothèque + Recherche + CLI + MCP)**
- Semaine 1-2 : Setup projet (Node.js, TypeScript, SQLite)
- Semaine 3-4 : Knowledge Manager (CRUD, validation Zod)
- Semaine 5-6 : Search Engine (FTS5 + sqlite-vec, RRF)
- Semaine 7-8 : CLI (Commander.js)
- Semaine 9-10 : MCP Server (4 outils)
- Semaine 11-12 : Tests, documentation, validation

**Mois 4-6 : MVP-2 (Inspection navigateur)**
- Semaine 13-14 : Playwright MCP setup
- Semaine 15-16 : 4 niveaux d'inspection (L1-L3)
- Semaine 17-18 : Analyse 5 dimensions
- Semaine 19-20 : Matrice sévérité
- Semaine 21-22 : Stockage + indexation audits
- Semaine 23-24 : Tests, documentation, validation

**Mois 7-9 : MVP-3 (Capitalisation projets)**
- Semaine 25-26 : Workflow 8 étapes
- Semaine 27-28 : Gitleaks + TruffleHog
- Semaine 29-30 : Post-mortem template
- Semaine 31-32 : Publication + indexation
- Semaine 33-34 : Tests, documentation, validation
- Semaine 35-36 : Validation finale, release

### 5.2 Jalons

**Jalon 1 (Fin Mois 3) : MVP-1 validé**
- ✅ CLI fonctionne (7 commandes)
- ✅ Recherche hybride (Recall@5 ≥ 0.75)
- ✅ MCP Server (4 outils)
- ✅ Tests > 80% couverture

**Jalon 2 (Fin Mois 6) : MVP-2 validé**
- ✅ Inspection L1-L3 fonctionne
- ✅ 5 dimensions analysées
- ✅ Audits stockés + indexés
- ✅ Tests > 80% couverture

**Jalon 3 (Fin Mois 9) : MVP-3 validé**
- ✅ Workflow 8 étapes fonctionne
- ✅ Secrets détectés
- ✅ Post-mortems générés
- ✅ Tests > 80% couverture

---

## 6. Compétences requises

### 6.1 MVP-1

**Compétences nécessaires :**
- ✅ TypeScript (intermédiaire)
- ✅ Node.js (intermédiaire)
- ✅ SQLite (bases)
- ✅ CLI design (Commander.js)
- ✅ MCP protocol (bases)

**Compétences optionnelles :**
- ⚠️ FTS5 (full-text search)
- ⚠️ Vector embeddings (sqlite-vec)
- ⚠️ RRF fusion (information retrieval)

### 6.2 MVP-2

**Compétences nécessaires :**
- ✅ Playwright (browser automation)
- ✅ Lighthouse (performance)
- ✅ axe-core (accessibilité)
- ✅ WCAG 2.2 (bases)

**Compétences optionnelles :**
- ⚠️ Patchright (stealth)
- ⚠️ SEO best practices
- ⚠️ UX heuristiques

### 6.3 MVP-3

**Compétences nécessaires :**
- ✅ Git (intermédiaire)
- ✅ Gitleaks + TruffleHog (secrets detection)
- ✅ git-filter-repo (history cleanup)
- ✅ Workflow design

**Compétences optionnelles :**
- ⚠️ Post-mortem facilitation
- ⚠️ Root cause analysis (5 pourquoi, Ishikawa)
- ⚠️ CI/CD (GitHub Actions)

---

## 7. Risques et mitigations

### 7.1 MVP-1

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **SQLite performance** | Faible | Élevé | WAL mode, benchmark régulier |
| **Embeddings coût** | Moyen | Moyen | OpenAI API, ou local Ollama |
| **MCP compatibility** | Faible | Élevé | Tester avec Claude Code, Cursor, Copilot |
| **Scope creep** | Moyen | Moyen | Stick to périmètre défini |

### 7.2 MVP-2

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Playwright stabilité** | Moyen | Élevé | Retry mechanism, timeout handling |
| **Sites protégés** | Élevé | Moyen | Patchright (optionnel) |
| **Analyse qualité** | Moyen | Moyen | Calibration avec benchmarks |

### 7.3 MVP-3

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Secrets manqués** | Faible | Élevé | Gitleaks + TruffleHog (complémentaires) |
| **Post-mortem qualité** | Moyen | Moyen | Template structuré, validation humaine |
| **Workflow complexité** | Élevé | Moyen | 8 étapes claires, documentation |

---

## 8. Conclusion

### 8.1 Synthèse

**Séquence MVP validée :**
1. ✅ **MVP-1** : Bibliothèque + Recherche + CLI + MCP (Mois 1-3)
2. ✅ **MVP-2** : Inspection navigateur (Mois 4-6)
3. ✅ **MVP-3** : Capitalisation projets (Mois 7-9)

**Périmètre défini :**
- ✅ Fonctionnalités incluses (MVP-1, MVP-2, MVP-3)
- ✅ Fonctionnalités reportées (Creative Library, Analyse IA, etc.)
- ✅ Contrats entre composants (CLI ↔ Business Logic ↔ Data Layer ↔ MCP)
- ✅ Critères d'acceptation (fonctionnels + non-fonctionnels)

**Roadmap :**
- ✅ Timeline 9 mois (3 MVPs)
- ✅ Jalons clairs (fin Mois 3, 6, 9)
- ✅ Compétences requises identifiées
- ✅ Risques et mitigations documentés

### 8.2 Prochaines étapes

**Phase 13 — Suite :**
- ✅ `13_ARCHITECTURES_CIBLES_COMPAREES.md` — Architectures comparées, choix justifié
- ✅ `13_SPECIFICATION_MVP.md` — Périmètre MVP, contrats, ce qui est reporté
- `13_ROADMAP_IMPLEMENTATION.md` — Roadmap détaillée, étapes vérifiables
- `13_CRITERES_ACCEPTATION.md` — Critères d'acceptation, tests

**Phase 14 — Audit final :**
- Cohérence globale
- Maintenance et veille
- Documentation complète

---

**Document rédigé le 21 octobre 2026 — Phase 13 du projet EKTS**
