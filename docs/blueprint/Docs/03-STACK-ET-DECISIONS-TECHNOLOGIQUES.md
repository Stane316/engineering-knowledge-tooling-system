# Stack et Décisions Technologiques — EKTS

**Statut :** ✅ Terminé  
**Date de création :** 21 octobre 2026  
**Dernière mise à jour :** 21 octobre 2026  
**Version :** 1.0  
**Auteur :** Agent EKTS  
**Documents sources :**
- `02-Agent-Integration/02_MCP_ET_AGENTS.md`
- `02-Agent-Integration/03_CONCEPTION_OUTILS_ET_SERVICES.md`
- `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md`
- `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md`
- `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md`
- `03-Browser-and-Scraping/04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md`

---

## 1. Objectif du document

Ce document consolide :
1. La stack technique complète d'EKTS (langages, frameworks, bibliothèques, services)
2. Le registre des décisions architecturales (ADR)
3. Les justifications et alternatives pour chaque choix

**Ce que ce document n'est pas :**
- Un guide d'installation (sera créé dans PARTIE II)
- Une spécification d'implémentation (renvoi vers `02-ARCHITECTURE-TECHNIQUE.md`)

---

## 2. Stack technique consolidée

### 2.1 Langage et runtime

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **Node.js** | 22.12+ LTS | Runtime JavaScript | ✅ VALIDÉ | LTS stable, écosystème mature, requis par Vitest 5 et better-sqlite3 13 |
| **TypeScript** | 5.9.x (épinglé) | Langage typé | ✅ VALIDÉ | Type-safe, excellent DX ; TS 7 non supporté par typescript-eslint 8.x |

**Alternatives évaluées :**
- ❌ **Deno** : Écarté — écosystème moins mature, MCP SDK non officiel
- ❌ **Bun** : Écarté — compatibilité MCP SDK non garantie
- ❌ **Python** : Écarté pour cœur système — conservé comme option pour search-service (Phase 2)

### 2.2 Base de données

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **SQLite** | 3.45+ | Base principale | ✅ VALIDÉ | Embedded, WAL mode, performance 80x vs lectures simples |
| **better-sqlite3** | 13+ | Driver Node.js | ✅ VALIDÉ | Synchrone, rapide, bien maintenu (Node ≥ 22) |
| **FTS5** | Intégré SQLite | Full-text search | ✅ VALIDÉ | BM25 scoring, compétitif avec PostgreSQL tsvector |
| **sqlite-vec** | 0.1+ | Search vectorielle | ✅ VALIDÉ | Extension SQLite, cosine similarity, <100K vecteurs |

**Architecture 3 bases :**
```
ekts.db          → Données structurées (ressources, projets, audits)
ekts-fts.db      → Index full-text (FTS5 virtual tables)
ekts-vectors.db  → Index vectoriel (sqlite-vec embeddings)
```

**Alternatives évaluées :**
- ❌ **PostgreSQL** : Écarté pour MVP — trop complexe (ops, hosting), conservé comme option Phase 3
- ❌ **MongoDB** : Écarté — schemaless incompatible avec besoin de structure
- ❌ **Pinecone/Weaviate** : Écartés — services cloud, coût, dépendance fournisseur

### 2.3 Frameworks et bibliothèques

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **Commander.js** | 15+ | CLI framework | ✅ VALIDÉ | Simple, bien documenté, populaire |
| **@modelcontextprotocol/sdk** | 1.32+ | Protocole MCP | ✅ VALIDÉ | Officiel, spec 2026-07-28, TypeScript natif (aucune v2 publiée — ADR-011) |
| **Zod** | 4+ | Validation runtime | ✅ VALIDÉ | Type-safe, inférence TypeScript, excellent DX |
| **Pino** | 10+ | Logging structuré | ✅ VALIDÉ | Rapide, JSON, performant (10x Winston) |
| **Vitest** | 5+ | Tests unitaires | ✅ VALIDÉ | Natif TypeScript, rapide, compatible Vite |
| **@vitest/coverage-v8** | 5+ | Couverture tests | ✅ VALIDÉ | Intégré à Vitest ; `c8` séparé supprimé |

**Vérification des versions (21 octobre 2026) :** instantané de `registry.npmjs.org` consigné dans `docs/audit/ETAT-DES-LIEUX-2026-10-21.md` §5.2. Les versions majeures retenues sont épinglées dans `package.json` ; toute montée de version passe par une révision d'ADR.

**Alternatives évaluées :**

**CLI :**
- ❌ **yargs** : Écarté — API plus verbeuse
- ❌ **oclif** : Écarté : sur-ingénierie pour usage personnel

**Validation :**
- ❌ **Joi** : Écarté — pas de TypeScript natif
- ❌ **Yup** : Écarté — moins maintenu

**Logging :**
- ❌ **Winston** : Écarté — 10x plus lent que Pino
- ❌ **Bunyan** : Écarté — moins actif

**Tests :**
- ❌ **Jest** : Écarté — configuration lourde, lent

### 2.4 Automatisation navigateur

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **Playwright** | 1.48+ | Browser automation | ✅ VALIDÉ | Score 96/100, MCP natif, multi-browser |
| **Patchright** | 1+ | Stealth browser | ⚠️ OPTIONNEL | Drop-in Playwright, bypass Cloudflare/DataDome |
| **Playwright MCP** | 0.0.20+ | MCP server Playwright | ✅ VALIDÉ | 70+ tools, accessibility tree |

**Alternatives évaluées :**
- ❌ **Puppeteer** : Écarté — Chrome-only, pas de MCP natif
- ❌ **Selenium** : Écarté — lent, configuration lourde
- ❌ **Cypress** : Écarté — usage testing, pas automation

### 2.5 Analyse et inspection

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **Lighthouse** | 11+ | Performance/SEO | ✅ VALIDÉ | Standard industrie, intégré Playwright |
| **axe-core** | 4.10+ | Accessibilité | ✅ VALIDÉ | WCAG 2.2 AA, standard industrie |

### 2.6 Sécurité

| Technologie | Version | Rôle | Statut | Justification |
|-------------|---------|------|--------|---------------|
| **Gitleaks** | 8+ | Détection secrets | ✅ VALIDÉ | Rapide, pre-commit hook, 700+ règles |
| **TruffleHog** | 3+ | Vérification secrets | ✅ VALIDÉ | Vérifie secrets actifs, complémentaire Gitleaks |
| **git-filter-repo** | 1.3+ | Nettoyage historique | ✅ VALIDÉ | Recommandé par Git, plus sûr que filter-branch |

### 2.7 Services externes (optionnels)

| Service | Rôle | Coût | Statut | Justification |
|---------|------|------|--------|---------------|
| **OpenAI API** | Embeddings | $0.02/1M tokens | ⚠️ OPTIONNEL | text-embedding-3-small, 1536 dimensions |
| **Ollama** | Embeddings locaux | $0 (hardware) | ⚠️ OPTIONNEL | Gratuit, offline, privacy |

**Alternatives évaluées :**
- ❌ **Cohere** : Écarté — coût supérieur
- ❌ **Voyage AI** : Écarté — moins documenté

### 2.8 Outils de développement

| Outil | Rôle | Statut |
|-------|------|--------|
| **ESLint** | Linting JavaScript/TypeScript | ✅ VALIDÉ |
| **Prettier** | Formatage code | ✅ VALIDÉ |
| **GitHub Actions** | CI/CD | ✅ VALIDÉ |
| **Dependabot** | Mise à jour dépendances | ✅ VALIDÉ |
| **TypeDoc** | Documentation API | ✅ VALIDÉ |

---

## 3. Registre des décisions architecturales (ADR)

### Format ADR

Chaque décision suit le format :
- **ID** : ADR-XXX
- **Statut** : VALIDÉ | PROVISOIRE | À DÉCIDER | À VÉRIFIER | REMPLACÉ
- **Contexte** : Problème à résoudre
- **Décision** : Choix effectué
- **Justification** : Pourquoi ce choix
- **Alternatives** : Options considérées
- **Conséquences** : Impacts positifs/négatifs
- **Référence** : Document source

---

### ADR-001 — Stockage SQLite WAL + FTS5 + sqlite-vec

**Statut :** ✅ VALIDÉ  
**Date :** Phase 06 (21 octobre 2026)  
**Référence :** `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md`

**Contexte :**
- Besoin de stocker ressources, projets, audits
- Recherche full-text et vectorielle requise
- Usage personnel/équipe petite
- Pas de compétence ops pour base distribuée

**Décision :**
SQLite en mode WAL avec 3 bases séparées :
1. `ekts.db` — données structurées
2. `ekts-fts.db` — index full-text (FTS5)
3. `ekts-vectors.db` — index vectoriel (sqlite-vec)

**Justification :**
- ✅ Performance 80x supérieure aux lectures simples (WAL)
- ✅ Zéro overhead opérationnel (embedded)
- ✅ FTS5 compétitif avec PostgreSQL tsvector
- ✅ sqlite-vec suffisant pour <100K vecteurs
- ✅ Portabilité maximale (fichiers copiables)
- ✅ Backup trivial (copie fichiers)

**Alternatives :**
- PostgreSQL + pgvector : écarté (complexité ops)
- MongoDB : écarté (schemaless)
- Pinecone/Weaviate : écartés (cloud, coût)

**Conséquences :**
- ✅ Positif : $0 coût, portable, simple
- ⚠️ Négatif : écritures séquentielles, limite ~100K vecteurs
- 🔄 Mitigation : migration PostgreSQL si multi-users (Phase 3)

---

### ADR-002 — 4 outils MCP prioritaires

**Statut :** ✅ VALIDÉ  
**Date :** Phase 02 (21 octobre 2026)  
**Référence :** `02-Agent-Integration/02_MCP_ET_AGENTS.md`

**Contexte :**
- Exposer capacités EKTS aux agents IA
- Couvrir 80% des besoins avec minimum d'outils
- Transport local sécurisé

**Décision :**
4 outils MCP prioritaires pour MVP-1 :
1. `search_knowledge` — recherche hybride
2. `get_resource` — obtenir ressource par ID
3. `list_resources` — lister ressources (filtres)
4. `validate_resource` — valider schéma ressource

**Justification :**
- ✅ Couvrent 80% des cas d'usage
- ✅ Lecture seule (sécurité maximale)
- ✅ Transport stdio (local, pas d'exposition)
- ✅ Compatible Tier 1 agents (Claude, Cursor, Copilot)

**Alternatives :**
- Plus d'outils : écarté (sur-ingénierie MVP)
- Écriture via MCP : écarté (risque sécurité)

**Conséquences :**
- ✅ Positif : simple, sécurisé, suffisant
- ⚠️ Négatif : pas de modification via MCP (CLI requis)

---

### ADR-003 — Playwright pour inspection navigateur

**Statut :** ✅ VALIDÉ  
**Date :** Phase 04 (21 octobre 2026)  
**Référence :** `03-Browser-and-Scraping/04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md`

**Contexte :**
- Inspection automatisée de sites web
- 4 niveaux d'inspection (L1-L4)
- Analyse 5 dimensions (perf, a11y, SEO, UX, contenu)

**Décision :**
Playwright comme solution principale (score 96/100)  
Patchright comme option stealth (bypass protections)

**Justification :**
- ✅ Multi-browser (Chromium, Firefox, WebKit)
- ✅ MCP natif (Playwright MCP, 70+ tools)
- ✅ Performance supérieure (score 96/100)
- ✅ Accessibilité native (arbre accessibilité)
- ✅ Traces et screenshots intégrés

**Alternatives :**
- Puppeteer : écarté (Chrome-only, pas MCP)
- Selenium : écarté (lent, config lourde)
- Cypress : écarté (usage testing)

**Conséquences :**
- ✅ Positif : puissant, flexible, MCP natif
- ⚠️ Négatif : dépendance lourde (~300 MB navigateurs)
- 🔄 Mitigation : feature flag pour désactiver si non utilisé

---

### ADR-004 — Recherche hybride FTS + Vector + RRF

**Statut :** ✅ VALIDÉ  
**Date :** Phase 07 (21 octobre 2026)  
**Référence :** `04-Knowledge/07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md`

**Contexte :**
- Recherche ressources par mots-clés et sémantique
- Qualité mesurable (Recall@5, Faithfulness)
- Performance acceptable (<500ms)

**Décision :**
Recherche hybride combinant :
1. FTS5 (BM25) — recherche textuelle, top 20
2. sqlite-vec (cosine) — recherche vectorielle, top 20
3. RRF (Reciprocal Rank Fusion, k=60) — fusion, top 10

**Justification :**
- ✅ FTS5 : précision mots-clés
- ✅ Vector : rappel sémantique
- ✅ RRF : combine avantages, simple
- ✅ Cibles : Recall@5 ≥ 0.75, Faithfulness ≥ 0.80

**Alternatives :**
- FTS seul : écarté (pas de sémantique)
- Vector seul : écarté (moins précis mots-clés)
- RAG complet : écarté (sur-ingénierie MVP)

**Conséquences :**
- ✅ Positif : qualité supérieure, simple
- ⚠️ Négatif : dépendance embeddings (OpenAI/Ollama)
- 🔄 Mitigation : Ollama pour embeddings locaux

---

### ADR-005 — Architecture C Hybride

**Statut :** ✅ VALIDÉ  
**Date :** Phase 13 (21 octobre 2026)  
**Référence :** `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md`

**Contexte :**
- Définir architecture cible EKTS
- Équilibrer simplicité et évolutivité
- Usage personnel → équipe petite → production si besoin

**Décision :**
Architecture C (Hybride) — Monolithe modulaire SQLite + services optionnels activés par feature flags

**Justification :**
- ✅ Pragmatique : commence simple, évolue si besoin
- ✅ Coût maîtrisé : $0 pour MVP
- ✅ Progressive : migration graduelle
- ✅ Flexible : feature flags
- ✅ Rétrocompatible : mode standalone toujours disponible

**Alternatives :**
- Architecture A (Monolithe pur) : écartée (pas d'évolution)
- Architecture B (Microservices) : écartée (trop complexe)

**Conséquences :**
- ✅ Positif : simple, évolutif, $0
- ⚠️ Négatif : complexité conditionnelle (feature flags)
- 🔄 Mitigation : documentation claire des modes

---

### ADR-006 — Séquence MVP-1 → MVP-2 → MVP-3

**Statut :** ✅ VALIDÉ  
**Date :** Phase 13 (21 octobre 2026)  
**Référence :** `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md`

**Contexte :**
- Définir ordre d'implémentation
- Respecter dépendances
- Livrer valeur progressivement

**Décision :**
3 MVPs sur 9 mois (18 sprints) :
1. **MVP-1** (Mois 1-3) : Bibliothèque + Recherche + CLI + MCP
2. **MVP-2** (Mois 4-6) : Inspection navigateur
3. **MVP-3** (Mois 7-9) : Capitalisation projets

**Justification :**
- ✅ MVP-1 : fondation essentielle, valeur immédiate
- ✅ MVP-2 : dépend de MVP-1 (stockage audits)
- ✅ MVP-3 : dépend de MVP-1 + MVP-2 (recherche + inspection)

**Alternatives :**
- Ordre différent : écarté (dépendances non respectées)
- Tout en parallèle : écarté (complexité, risques)

**Conséquences :**
- ✅ Positif : progressif, dépendances respectées
- ⚠️ Négatif : 9 mois avant système complet
- 🔄 Mitigation : valeur livrée dès MVP-1

---

### ADR-007 — 4 niveaux sécurité, STRIDE MCP

**Statut :** ✅ VALIDÉ  
**Date :** Phase 11 (21 octobre 2026)  
**Référence :** `06-Security/11_MODELE_DE_MENACE.md`

**Contexte :**
- Sécuriser système EKTS
- Adapter STRIDE à MCP
- Progression MVP → Production

**Décision :**
4 niveaux de sécurité :
1. **Niveau 1 (MVP)** : Local, fichiers chmod 600, pas d'exposition
2. **Niveau 2 (Équipe)** : LAN, API key, audit logs
3. **Niveau 3 (Production)** : HTTPS, OAuth2/JWT, RBAC, rate limiting
4. **Niveau 4 (Enterprise)** : Zero-trust, HSM, compliance, pentests

**Justification :**
- ✅ Progression réaliste
- ✅ Contrôles proportionnés
- ✅ 38 vecteurs d'attaque identifiés (STRIDE adapté MCP)
- ✅ Default-deny network egress
- ✅ Firecracker pour Production (hardware isolation)

**Alternatives :**
- Sécurité maximale dès MVP : écarté (overhead)
- Pas de sécurité : écarté (risques inacceptables)

**Conséquences :**
- ✅ Positif : sécurité proportionnée, évolutive
- ⚠️ Négatif : complexité augmente avec niveaux
- 🔄 Mitigation : documentation claire par niveau

---

### ADR-008 — Claude Code + GitHub Copilot + Cline

**Statut :** ✅ VALIDÉ  
**Date :** Phase 12 (21 octobre 2026)  
**Référence :** `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md`

**Contexte :**
- Choisir outils IA pour développement EKTS
- Équilibrer performance, coût, confidentialité

**Décision :**
Top 3 outils recommandés :
1. **Claude Code Pro** ($20/mois) — meilleure performance (80.8% SWE-bench)
2. **GitHub Copilot Pro** ($10/mois) — meilleur rapport qualité/prix
3. **Cline + BYOK** (variable) — confidentialité maximale

**Justification :**
- ✅ Claude Code : 80.8% SWE-bench, 1M tokens contexte
- ✅ Copilot : $10/mois, multi-IDE, MCP natif
- ✅ Cline : open-source, multi-provider, local possible

**Alternatives :**
- Cursor : écarté (offre étudiant fermée juin 2026)
- ChatGPT : écarté (pas d'offre étudiant vérifiée)

**Conséquences :**
- ✅ Positif : performance, coût, confidentialité
- ⚠️ Négatif : coûts mensuels ($30-50/mois)
- 🔄 Mitigation : GitHub Student Pack pour étudiants (gratuit)

---

### ADR-009 — MCP transport stdio

**Statut :** ✅ VALIDÉ  
**Date :** Phase 02 (21 octobre 2026)  
**Référence :** `02-Agent-Integration/02_MCP_ET_AGENTS.md`

**Contexte :**
- Choisir transport MCP
- Usage local, sécurité maximale

**Décision :**
Transport stdio (standard input/output) pour MVP

**Justification :**
- ✅ Local uniquement (pas d'exposition réseau)
- ✅ Sécurisé (pas de ports ouverts)
- ✅ Simple (pas de configuration réseau)
- ✅ Compatible Tier 1 agents (Claude, Cursor, Copilot)

**Alternatives :**
- HTTP transport : écarté (exposition réseau, complexité)
- WebSocket : écarté (sur-ingénierie pour usage local)

**Conséquences :**
- ✅ Positif : simple, sécurisé, local
- ⚠️ Négatif : pas d'accès distant
- 🔄 Mitigation : HTTP transport si besoin distant (Phase 3)

---

### ADR-010 — Validation Zod

**Statut :** ✅ VALIDÉ  
**Date :** Phase 03 (21 octobre 2026)  
**Référence :** `02-Agent-Integration/03_CONCEPTION_OUTILS_ET_SERVICES.md`

**Contexte :**
- Valider entrées/sorties
- Type-safe runtime
- Excellent DX TypeScript

**Décision :**
Zod comme bibliothèque de validation

**Justification :**
- ✅ Type-safe (inférence TypeScript)
- ✅ Runtime validation
- ✅ Excellent DX (API intuitive)
- ✅ Performant
- ✅ Bien maintenu

**Alternatives :**
- Joi : écarté (pas TypeScript natif)
- Yup : écarté (moins maintenu)
- io-ts : écarté (API plus verbeuse)

**Conséquences :**
- ✅ Positif : type-safe, simple, performant
- ⚠️ Négatif : dépendance supplémentaire
- 🔄 Mitigation : dépendance légère, bien maintenue

---

## 4. Tableau récapitulatif des décisions

| ID | Sujet | Décision | Statut | Phase |
|----|-------|----------|--------|-------|
| ADR-001 | Stockage | SQLite WAL + FTS5 + sqlite-vec | ✅ VALIDÉ | 06 |
| ADR-002 | Outils MCP | 4 outils prioritaires (search, get, list, validate) | ✅ VALIDÉ | 02 |
| ADR-003 | Inspection | Playwright + Patchright | ✅ VALIDÉ | 04 |
| ADR-004 | Recherche | Hybride FTS + Vector + RRF | ✅ VALIDÉ | 07 |
| ADR-005 | Architecture | Architecture C Hybride | ✅ VALIDÉ | 13 |
| ADR-006 | Séquence MVP | MVP-1 → MVP-2 → MVP-3 | ✅ VALIDÉ | 13 |
| ADR-007 | Sécurité | 4 niveaux, STRIDE MCP | ✅ VALIDÉ | 11 |
| ADR-008 | Outils IA | Claude Code + Copilot + Cline | ✅ VALIDÉ | 12 |
| ADR-009 | MCP transport | stdio (local) | ✅ VALIDÉ | 02 |
| ADR-010 | Validation | Zod | ✅ VALIDÉ | 03 |

---

## 5. Décisions à vérifier ou à prendre

### 5.1 À vérifier (pricing Avril 2027)

| Sujet | Information | Date vérification |
|-------|-------------|-------------------|
| Claude Code Max | Prix annoncés, non confirmés | Avril 2027 |
| Cursor pricing | Évolutions rapides | Avril 2027 |
| OpenAI Codex Pro 500 | $500/mois, à vérifier | Avril 2027 |

### 5.2 À décider (pendant implémentation)

| Sujet | Options | Sprint |
|-------|---------|--------|
| Ollama vs OpenAI embeddings | Local vs cloud | Sprint 4 |
| Mode navigateur (local/service) | Feature flag | Sprint 7 |
| PostgreSQL migration | Si multi-users requis | Phase 3 |

---

## 6. Références

### 6.1 Documents sources

- `02-Agent-Integration/02_MCP_ET_AGENTS.md` — Spécification MCP
- `02-Agent-Integration/03_CONCEPTION_OUTILS_ET_SERVICES.md` — Principes conception
- `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md` — Architecture stockage
- `04-Knowledge/07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md` — Recherche hybride
- `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md` — Comparatif outils IA
- `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md` — Architectures
- `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` — Spécification MVP
- `06-Security/11_MODELE_DE_MENACE.md` — Modèle menace

### 6.2 Documentation officielle

- **Node.js** : https://nodejs.org
- **TypeScript** : https://www.typescriptlang.org
- **SQLite** : https://www.sqlite.org
- **better-sqlite3** : https://github.com/WiseLibs/better-sqlite3
- **FTS5** : https://www.sqlite.org/fts5.html
- **sqlite-vec** : https://github.com/asg017/sqlite-vec
- **Commander.js** : https://github.com/tj/commander.js
- **MCP SDK** : https://github.com/modelcontextprotocol/typescript-sdk
- **Zod** : https://zod.dev
- **Pino** : https://getpino.io
- **Vitest** : https://vitest.dev
- **Playwright** : https://playwright.dev
- **Lighthouse** : https://developer.chrome.com/docs/lighthouse
- **axe-core** : https://github.com/dequelabs/axe-core
- **Gitleaks** : https://github.com/gitleaks/gitleaks
- **TruffleHog** : https://github.com/trufflesecurity/trufflehog

---

**Document rédigé le 21 octobre 2026 — PARTIE I du projet EKTS**  
**Statut : ✅ Registre des décisions technologiques**
