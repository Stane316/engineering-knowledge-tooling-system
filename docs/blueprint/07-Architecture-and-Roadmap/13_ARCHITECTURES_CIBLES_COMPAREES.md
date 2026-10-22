# Architectures Cibles Comparées — Phase 13

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Objectif :** Comparer 2-3 architectures plausibles, choisir et justifier

---

## 1. Introduction

### 1.1 Contexte

**Objectif :** Définir l'architecture cible EKTS en consolidant les décisions des phases 00-12.

**Contraintes héritées :**
- Phase 02-03 : MCP (Model Context Protocol) comme standard d'intégration agents
- Phase 04-05 : Playwright pour inspection navigateur, scraping responsable
- Phase 06 : SQLite WAL + FTS5 + sqlite-vec (3 bases de données)
- Phase 07 : Recherche hybride (FTS + Vector), RAG
- Phase 08 : Analyse 5 dimensions, matrice sévérité
- Phase 09 : 7 familles créatives, 103+ ressources, MCP tools
- Phase 10 : Workflow capitalisation 8 étapes, post-mortem
- Phase 11 : 4 niveaux sécurité (MVP → Production), STRIDE MCP
- Phase 12 : Claude Code + Copilot + Cline, MCP Tier 1 agents

### 1.2 Méthodologie

**Approche :**
1. Identifier 2-3 architectures plausibles
2. Comparer selon 6 critères : complexité, coût, maintenance, sécurité, portabilité, évolutivité
3. Choisir l'architecture initiale et justifier
4. Définir les compromis et trade-offs

---

## 2. Architecture A — Monolithe modulaire SQLite

### 2.1 Description

**Architecture centralisée :** Un seul processus Node.js/TypeScript avec 3 bases SQLite, exposant une CLI et un serveur MCP local.

```
┌─────────────────────────────────────────────────────────┐
│                    EKTS Monolithe                        │
├─────────────────────────────────────────────────────────┤
│  CLI (Commander.js)                                      │
│  ├── ekts search <query>                                │
│  ├── ekts add <resource>                                │
│  ├── ekts inspect <url>                                 │
│  └── ekts analyze <project>                             │
├─────────────────────────────────────────────────────────┤
│  MCP Server (stdio transport)                           │
│  ├── search_knowledge (FTS + Vector)                    │
│  ├── get_resource (by ID)                               │
│  ├── list_resources (by type/tag)                       │
│  ├── validate_resource (schema check)                   │
│  └── inspect_site (Playwright)                          │
├─────────────────────────────────────────────────────────┤
│  Business Logic                                          │
│  ├── Knowledge Manager (CRUD + indexing)                │
│  ├── Search Engine (hybride FTS + Vector)               │
│  ├── Browser Inspector (Playwright MCP)                 │
│  ├── Creative Library (103+ ressources)                 │
│  └── Project Capitalizer (workflow 8 étapes)            │
├─────────────────────────────────────────────────────────┤
│  Data Layer (SQLite WAL)                                 │
│  ├── ekts.db (structuré : resources, projects, audits)  │
│  ├── ekts-fts.db (FTS5 : full-text search)              │
│  └── ekts-vectors.db (sqlite-vec : embeddings)          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Avantages

- ✅ **Simplicité** : Un seul processus, déploiement facile
- ✅ **Performance** : SQLite WAL = lectures rapides, zéro overhead ops
- ✅ **Coût** : $0 (pas de serveur externe, pas de SaaS)
- ✅ **Portabilité** : Fichiers SQLite copiables, backup trivial
- ✅ **Sécurité** : Local par défaut, pas d'exposition réseau
- ✅ **Maintenance** : Codebase unique, tests unitaires simples

### 2.3 Inconvénients

- ❌ **Scaling vertical** : Limité à une machine (CPU/RAM)
- ❌ **Pas de multi-users** : Concurrent access limité (WAL permet lectures parallèles, écritures séquentielles)
- ❌ **Pas de distribution** : Pas de réplication, pas de sharding
- ❌ **Monolithe** : Difficile de scaler des composants individuellement

### 2.4 Cas d'usage

- ✅ Usage personnel (single-user)
- ✅ Équipe petite (< 5 devs, même machine)
- ✅ MVP rapide (proof of concept)
- ✅ Environnements contraints (edge, offline)

---

## 3. Architecture B — Microservices avec API REST + MCP

### 3.1 Description

**Architecture distribuée :** Plusieurs services indépendants (knowledge, search, browser, creative), exposant une API REST et un serveur MCP.

```
┌─────────────────────────────────────────────────────────┐
│  API Gateway (Express/Fastify)                          │
│  ├── POST /api/knowledge                                │
│  ├── GET /api/search                                    │
│  ├── POST /api/inspect                                  │
│  └── GET /api/creative                                  │
├─────────────────────────────────────────────────────────┤
│  MCP Server (stdio ou HTTP transport)                   │
│  ├── search_knowledge                                   │
│  ├── get_resource                                       │
│  ├── inspect_site                                       │
│  └── list_creative_resources                            │
├─────────────────────────────────────────────────────────┤
│  Microservices (Docker containers)                      │
│  ├── knowledge-service (Node.js)                        │
│  │   └── PostgreSQL (structured data)                   │
│  ├── search-service (Python)                            │
│  │   └── PostgreSQL + pgvector (embeddings)             │
│  ├── browser-service (Node.js + Playwright)             │
│  │   └── Redis (queue, caching)                         │
│  └── creative-service (Node.js)                         │
│      └── MongoDB (flexible schema)                      │
├─────────────────────────────────────────────────────────┤
│  Infrastructure                                          │
│  ├── Docker Compose (local) ou Kubernetes (production)  │
│  ├── Reverse proxy (nginx/Caddy)                        │
│  └── Monitoring (Prometheus + Grafana)                  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Avantages

- ✅ **Scaling horizontal** : Chaque service scale indépendamment
- ✅ **Multi-users** : API REST, authentification, RBAC
- ✅ **Flexibilité** : Choisir le meilleur langage/DB par service
- ✅ **Résilience** : Isolation des pannes, circuit breakers
- ✅ **Évolutivité** : Ajout de services sans impacter l'existant

### 3.3 Inconvénients

- ❌ **Complexité** : Orchestration, networking, service discovery
- ❌ **Coût** : Infrastructure (serveurs, DB managées, monitoring)
- ❌ **Maintenance** : Multi-langages, multi-DBs, deployments complexes
- ❌ **Latence** : Network calls entre services
- ❌ **Debugging** : Distributed tracing requis

### 3.4 Cas d'usage

- ✅ Équipe moyenne-grande (10+ devs)
- ✅ Production scale (millions de requêtes)
- ✅ Multi-tenancy (SaaS)
- ✅ Besoin de scaling indépendant (search vs browser)

---

## 4. Architecture C — Hybride : Monolithe modulaire + Services externes optionnels

### 4.1 Description

**Architecture pragmatique :** Monolithe modulaire SQLite (comme A) avec possibilité d'extraire des services spécifiques si besoin (browser-service, search-service).

```
┌─────────────────────────────────────────────────────────┐
│  EKTS Core (Monolithe modulaire)                        │
│  ├── CLI + MCP Server                                   │
│  ├── Knowledge Manager                                  │
│  ├── Search Engine (hybride)                            │
│  ├── Creative Library                                   │
│  └── Project Capitalizer                                │
├─────────────────────────────────────────────────────────┤
│  Data Layer (SQLite WAL)                                │
│  ├── ekts.db (structuré)                                │
│  ├── ekts-fts.db (FTS5)                                 │
│  └── ekts-vectors.db (sqlite-vec)                       │
├─────────────────────────────────────────────────────────┤
│  Services Optionnels (Docker, si besoin)                │
│  ├── browser-service (Playwright)                       │
│  │   └── Activé si inspection lourde                    │
│  ├── search-service (Python + embeddings)               │
│  │   └── Activé si volume > 100K documents              │
│  └── external-db (PostgreSQL + pgvector)                │
│      └── Activé si multi-users requis                   │
├─────────────────────────────────────────────────────────┤
│  Configuration (feature flags)                          │
│  ├── EKTS_BROWSER_MODE = local | service                │
│  ├── EKTS_SEARCH_MODE = sqlite | postgres               │
│  └── EKTS_DEPLOYMENT = standalone | distributed         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Avantages

- ✅ **Pragmatisme** : Commence simple (A), évolue vers B si besoin
- ✅ **Flexibilité** : Feature flags pour activer services externes
- ✅ **Coût maîtrisé** : $0 pour MVP, scale up si nécessaire
- ✅ **Progressivité** : Migration graduelle, pas de big bang
- ✅ **Rétrocompatibilité** : Mode standalone toujours disponible

### 4.3 Inconvénients

- ❌ **Complexité conditionnelle** : Code paths multiples (if/else)
- ❌ **Testing** : Plus de configurations à tester
- ❌ **Documentation** : Plus de cas à documenter
- ⚠️ **Risque de sur-ingénierie** : Tentation d'activer services trop tôt

### 4.4 Cas d'usage

- ✅ MVP avec vision long terme
- ✅ Évolution organique (standalone → distributed)
- ✅ Besoin de flexibilité sans complexité initiale
- ✅ Projets personnels → équipe → production

---

## 5. Comparaison des architectures

### 5.1 Matrice de décision

| Critère | Poids | Architecture A (Monolithe) | Architecture B (Microservices) | Architecture C (Hybride) |
|---------|-------|----------------------------|--------------------------------|--------------------------|
| **Complexité** | 20% | 🟢 9/10 (simple) | 🔴 3/10 (très complexe) | 🟡 7/10 (modéré) |
| **Coût** | 15% | 🟢 10/10 ($0) | 🔴 3/10 ($$$) | 🟢 9/10 ($0 → $) |
| **Maintenance** | 20% | 🟢 9/10 (simple) | 🔴 4/10 (complexe) | 🟡 7/10 (modéré) |
| **Sécurité** | 15% | 🟢 9/10 (local) | 🟡 6/10 (exposé) | 🟢 8/10 (local + optionnel) |
| **Portabilité** | 15% | 🟢 10/10 (fichiers) | 🔴 4/10 (Docker/K8s) | 🟢 9/10 (fichiers + Docker) |
| **Évolutivité** | 15% | 🔴 4/10 (limité) | 🟢 9/10 (excellent) | 🟡 8/10 (progressif) |
| **TOTAL** | 100% | **8.5/10** | **4.8/10** | **8.0/10** |

### 5.2 Analyse détaillée

#### Complexité (poids 20%)

- **Architecture A** : 🟢 9/10 — Un seul processus, codebase monolithique, tests unitaires simples
- **Architecture B** : 🔴 3/10 — Orchestration Docker/K8s, service discovery, distributed tracing
- **Architecture C** : 🟡 7/10 — Monolithe simple + services optionnels, feature flags

#### Coût (poids 15%)

- **Architecture A** : 🟢 10/10 — $0 (SQLite, Node.js, local)
- **Architecture B** : 🔴 3/10 — $$$ (Docker, PostgreSQL, Redis, MongoDB, monitoring)
- **Architecture C** : 🟢 9/10 — $0 (standalone) → $ (si services activés)

#### Maintenance (poids 20%)

- **Architecture A** : 🟢 9/10 — Codebase unique, déploiement trivial, backup fichiers
- **Architecture B** : 🔴 4/10 — Multi-langages, multi-DBs, deployments complexes, monitoring
- **Architecture C** : 🟡 7/10 — Monolithe simple + services optionnels (complexité conditionnelle)

#### Sécurité (poids 15%)

- **Architecture A** : 🟢 9/10 — Local par défaut, pas d'exposition réseau, fichiers SQLite chiffrables
- **Architecture B** : 🟡 6/10 — API exposée, authentification requise, attack surface plus large
- **Architecture C** : 🟢 8/10 — Local par défaut, services optionnels isolés (Docker)

#### Portabilité (poids 15%)

- **Architecture A** : 🟢 10/10 — Fichiers SQLite copiables, backup trivial, fonctionne partout
- **Architecture B** : 🔴 4/10 — Docker/K8s requis, dépendances multiples, configuration complexe
- **Architecture C** : 🟢 9/10 — Fichiers SQLite (standalone) + Docker (services optionnels)

#### Évolutivité (poids 15%)

- **Architecture A** : 🔴 4/10 — Scaling vertical uniquement, limité CPU/RAM machine
- **Architecture B** : 🟢 9/10 — Scaling horizontal, services indépendants, multi-users
- **Architecture C** : 🟡 8/10 — Progressif : standalone → services optionnels → distribution

### 5.3 Synthèse

**Architecture A (Monolithe SQLite) :**
- ✅ Score : **8.5/10**
- ✅ Idéal pour MVP, usage personnel, équipe petite
- ❌ Limité en scaling, pas multi-users

**Architecture B (Microservices) :**
- ❌ Score : **4.8/10**
- ❌ Trop complexe pour EKTS (projet personnel/équipe petite)
- ✅ Idéal pour SaaS, production scale, multi-tenancy

**Architecture C (Hybride) :**
- ✅ Score : **8.0/10**
- ✅ Pragmatique : commence simple, évolue si besoin
- ⚠️ Complexité conditionnelle (feature flags)

---

## 6. Recommandation : Architecture C (Hybride)

### 6.1 Choix : Architecture C

**Décision :** Adopter l'**Architecture C (Hybride)** comme architecture cible EKTS.

**Justification :**

1. **Pragmatisme** : Commence simple (Architecture A), évolue vers distribution si besoin
2. **Coût maîtrisé** : $0 pour MVP, scale up uniquement si nécessaire
3. **Progressivité** : Migration graduelle, pas de big bang, apprentissage organique
4. **Flexibilité** : Feature flags pour activer services externes (browser, search, DB)
5. **Rétrocompatibilité** : Mode standalone toujours disponible, pas de dépendance forcée

### 6.2 Phase d'implémentation

**Phase 1 — MVP (Mois 1-3) : Architecture A (Monolithe SQLite)**
- Monolithe modulaire Node.js/TypeScript
- SQLite WAL + FTS5 + sqlite-vec
- CLI + MCP Server (stdio)
- 4 outils MCP prioritaires (search, get, list, validate)
- Mode standalone uniquement

**Phase 2 — Extension (Mois 4-6) : Ajout services optionnels**
- browser-service (Playwright) si inspection lourde
- search-service (Python) si volume > 100K documents
- Feature flags activés selon besoin

**Phase 3 — Production (Mois 7-12) : Distribution si requis**
- Externalisation DB (PostgreSQL + pgvector) si multi-users
- Docker Compose pour orchestration
- Monitoring (Prometheus + Grafana)

### 6.3 Critères de migration

**Quand passer de Phase 1 → Phase 2 ?**
- Volume > 50K documents (search-service)
- Inspection > 10 sites/jour (browser-service)
- Latence > 500ms (optimisation requise)

**Quand passer de Phase 2 → Phase 3 ?**
- Multi-users requis (> 5 devs)
- Production 24/7 (SLA requis)
- Scaling horizontal nécessaire

### 6.4 Compromis acceptés

**Compromis Architecture C :**
- ✅ **Complexité conditionnelle** : Feature flags (if/else) → acceptable si documenté
- ✅ **Testing multi-config** : Plus de cas à tester → acceptable si automatisé
- ✅ **Risque sur-ingénierie** : Tentation d'activer services trop tôt → discipline requise

**Compromis rejetés (Architecture B) :**
- ❌ **Complexité initiale** : Orchestration, networking, service discovery → rejeté pour MVP
- ❌ **Coût infrastructure** : $$$ requis → rejeté pour usage personnel
- ❌ **Maintenance multi-langages** : Node.js + Python + DBs multiples → rejeté

---

## 7. Architecture cible détaillée

### 7.1 Composants

```
┌─────────────────────────────────────────────────────────┐
│  EKTS Core (Monolithe modulaire TypeScript)             │
├─────────────────────────────────────────────────────────┤
│  Interface Layer                                         │
│  ├── CLI (Commander.js)                                 │
│  │   ├── ekts search <query>                            │
│  │   ├── ekts add <resource>                            │
│  │   ├── ekts inspect <url>                             │
│  │   └── ekts analyze <project>                         │
│  └── MCP Server (stdio transport)                       │
│      ├── search_knowledge (FTS + Vector)                │
│      ├── get_resource (by ID)                           │
│      ├── list_resources (by type/tag)                   │
│      ├── validate_resource (schema check)               │
│      └── inspect_site (Playwright, optionnel)           │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                    │
│  ├── Knowledge Manager                                  │
│  │   ├── CRUD resources (add, update, delete, get)      │
│  │   ├── Indexation FTS + Vector (automatique)          │
│  │   └── Tagging + categorization                       │
│  ├── Search Engine                                      │
│  │   ├── FTS5 (full-text, BM25)                         │
│  │   ├── sqlite-vec (embeddings, cosine similarity)     │
│  │   └── Hybrid search (RRF fusion)                     │
│  ├── Browser Inspector                                  │
│  │   ├── Playwright MCP (70+ tools)                     │
│  │   ├── 4 niveaux d'inspection (L1-L4)                 │
│  │   └── Analyse 5 dimensions (perf, a11y, SEO, UX, contenu) │
│  ├── Creative Library                                   │
│  │   ├── 7 familles (UI, Motion, 3D, DataViz, etc.)     │
│  │   ├── 103+ ressources documentées                    │
│  │   └── search_creative_resource (MCP tool)            │
│  └── Project Capitalizer                                │
│      ├── Workflow 8 étapes (collecte → dépréciation)    │
│      ├── Post-mortem template (10 sections)             │
│      └── Gitleaks + TruffleHog (secrets)                │
├─────────────────────────────────────────────────────────┤
│  Data Layer (SQLite WAL)                                │
│  ├── ekts.db (structuré)                                │
│  │   ├── resources (id, type, title, tags, metadata)    │
│  │   ├── projects (id, name, status, postmortem)        │
│  │   ├── audits (id, site, date, findings)              │
│  │   └── creative_resources (id, family, license, etc.) │
│  ├── ekts-fts.db (FTS5)                                 │
│  │   └── resources_fts (virtual table, BM25)            │
│  └── ekts-vectors.db (sqlite-vec)                       │
│      └── resources_vectors (embeddings, cosine)         │
├─────────────────────────────────────────────────────────┤
│  Services Optionnels (Docker, activés par feature flags)│
│  ├── browser-service (Playwright)                       │
│  │   └── EKTS_BROWSER_MODE = local | service            │
│  ├── search-service (Python + embeddings)               │
│  │   └── EKTS_SEARCH_MODE = sqlite | service            │
│  └── external-db (PostgreSQL + pgvector)                │
│      └── EKTS_DB_MODE = sqlite | postgres               │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Flux de données

**Recherche hybride :**
```
User query → CLI/MCP → Search Engine
  ├── FTS5 (BM25, top 20) → results_fts
  ├── sqlite-vec (cosine, top 20) → results_vec
  └── RRF fusion (k=60) → results_hybrid (top 10)
```

**Inspection navigateur :**
```
URL → CLI/MCP → Browser Inspector
  ├── Playwright MCP (navigate, screenshot, trace)
  ├── Analyse 5 dimensions (perf, a11y, SEO, UX, contenu)
  ├── Matrice sévérité (0-4 × 1-5 × 1-3)
  └── Stockage audits (ekts.db) + indexation RAG
```

**Capitalisation projet :**
```
Projet terminé → CLI → Project Capitalizer
  ├── Workflow 8 étapes (collecte → dépréciation)
  ├── Gitleaks + TruffleHog (secrets check)
  ├── Post-mortem (10 sections)
  ├── Publication Git + indexation RAG
  └── Stockage projects (ekts.db)
```

### 7.3 Contrats entre composants

**Contrat CLI ↔ Business Logic :**
```typescript
interface CLICommand {
  name: string;
  args: Record<string, any>;
  options: Record<string, any>;
}

interface CLIResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Exemple
const result: CLIResult = await knowledgeManager.addResource({
  type: 'article',
  title: 'MCP Protocol',
  url: 'https://modelcontextprotocol.io',
  tags: ['mcp', 'agents'],
});
```

**Contrat MCP ↔ Business Logic :**
```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (input: any) => Promise<any>;
}

// Exemple
const searchKnowledge: MCPTool = {
  name: 'search_knowledge',
  description: 'Recherche hybride (FTS + Vector) dans la base EKTS',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 10 },
      mode: { type: 'string', enum: ['hybrid', 'fts', 'vector'] },
    },
    required: ['query'],
  },
  handler: async (input) => {
    return await searchEngine.search(input.query, input.limit, input.mode);
  },
};
```

**Contrat Business Logic ↔ Data Layer :**
```typescript
interface Repository<T> {
  create(entity: T): Promise<T>;
  getById(id: string): Promise<T | null>;
  list(filters?: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Exemple
const resourceRepo: Repository<Resource> = {
  create: async (resource) => { /* SQLite INSERT */ },
  getById: async (id) => { /* SQLite SELECT WHERE id = ? */ },
  list: async (filters) => { /* SQLite SELECT WHERE ... */ },
  update: async (id, data) => { /* SQLite UPDATE */ },
  delete: async (id) => { /* SQLite DELETE */ },
};
```

---

## 8. Sécurité et gouvernance

### 8.1 Niveaux de sécurité (Phase 11)

**Niveau 1 — MVP (Local) :**
- SQLite fichiers locaux (chmod 600)
- Pas d'exposition réseau
- Secrets dans `.env` (jamais commités)
- Gitleaks pre-commit hook

**Niveau 2 — Équipe (LAN) :**
- MCP server sur LAN (IP whitelist)
- Authentification basique (API key)
- Audit logs (qui fait quoi)
- Backup quotidien (cron)

**Niveau 3 — Production (Internet) :**
- HTTPS obligatoire (Let's Encrypt)
- Authentification forte (OAuth2 / JWT)
- RBAC (roles, permissions)
- Rate limiting, DDoS protection
- Firecracker microVMs (isolation)
- SBOM (supply chain transparency)

**Niveau 4 — Enterprise (Critique) :**
- Zero-trust network
- Hardware security modules (HSM)
- Compliance (SOC2, ISO27001)
- Pentests réguliers
- Incident response plan

### 8.2 Menaces STRIDE adaptées MCP (Phase 11)

| Menace | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing** | Agent IA usurpe identité | OAuth2 + JWT, validation stricte |
| **Tampering** | Modification données en transit | HTTPS, signature requêtes |
| **Repudiation** | Nier actions effectuées | Audit logs, traçabilité complète |
| **Information Disclosure** | Fuite données sensibles | Chiffrement at-rest + in-transit, zero retention |
| **Denial of Service** | Saturation service | Rate limiting, quotas, DDoS protection |
| **Elevation of Privilege** | Accès non autorisé | RBAC, moindre privilège, default-deny |

### 8.3 Gouvernance

**Reviews :**
- Code review obligatoire (PR)
- Security review (Phase 11 checklist)
- Performance review (benchmarks)

**Documentation :**
- ADR (Architecture Decision Records) pour chaque décision
- API documentation (OpenAPI/Swagger)
- Runbooks (procédures opérationnelles)

**Monitoring :**
- Logs structurés (Pino, JSON)
- Métriques (Prometheus)
- Alertes (PagerDuty / Slack)

---

## 9. Conclusion

### 9.1 Synthèse

**Architecture choisie :** **Architecture C (Hybride)** — Monolithe modulaire SQLite + services optionnels

**Justification :**
- ✅ Pragmatique : commence simple, évolue si besoin
- ✅ Coût maîtrisé : $0 pour MVP
- ✅ Progressif : migration graduelle, pas de big bang
- ✅ Flexible : feature flags pour activer services externes
- ✅ Rétrocompatible : mode standalone toujours disponible

**Phases d'implémentation :**
1. **Phase 1 (Mois 1-3)** : Monolithe SQLite (Architecture A)
2. **Phase 2 (Mois 4-6)** : Services optionnels (browser, search)
3. **Phase 3 (Mois 7-12)** : Distribution si requis (PostgreSQL, Docker)

### 9.2 Prochaines étapes

**Phase 13 — Suite :**
- `13_SPECIFICATION_MVP.md` — Périmètre MVP, contrats, composants
- `13_ROADMAP_IMPLEMENTATION.md` — Roadmap par étapes vérifiables
- `13_CRITERES_ACCEPTATION.md` — Critères d'acceptation, tests

**Phase 14 — Audit final :**
- Cohérence globale
- Maintenance et veille
- Documentation complète

---

**Document rédigé le 21 octobre 2026 — Phase 13 du projet EKTS**
