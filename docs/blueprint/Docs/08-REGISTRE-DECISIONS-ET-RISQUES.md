# Registre des Décisions et des Risques — EKTS

**Statut :** ✅ Terminé  
**Date de création :** 21 octobre 2026  
**Dernière mise à jour :** 21 octobre 2026  
**Version :** 1.0  
**Auteur :** Agent EKTS  
**Documents sources :**
- Tous les bilans de phases (00-14)
- `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md`
- `06-Security/11_MODELE_DE_MENACE.md`
- `07-Architecture-and-Roadmap/14_PLAN_MAINTENANCE_ET_VEILLE.md`

---

## 1. Objectif du document

Ce document consolide :
1. Le registre complet des décisions architecturales (ADR)
2. Le registre des risques identifiés
3. Les mesures de mitigation
4. Les propriétaires et statuts

**Utilisation :**
- Référence pour tout changement architectural
- Suivi des risques tout au long du projet
- Audit et conformité

---

## 2. Registre des décisions architecturales (ADR)

### 2.1 Format ADR

Chaque décision suit le format :

```markdown
### ADR-{ID} — {Titre}

**Statut :** VALIDÉ | PROVISOIRE | À DÉCIDER | À VÉRIFIER | REMPLACÉ  
**Date :** {Date décision}  
**Phase :** {Phase origine}  
**Référence :** {Document source}

**Contexte :**
{Problème à résoudre, contraintes}

**Décision :**
{Choix effectué}

**Justification :**
{Pourquoi ce choix}

**Alternatives considérées :**
{Options écartées}

**Conséquences :**
- ✅ Positif : {Impacts positifs}
- ⚠️ Négatif : {Impacts négatifs}
- 🔄 Mitigation : {Comment gérer les négatifs}

**Conditions de réexamen :**
{Quand reconsidérer cette décision}
```

### 2.2 Décisions validées

---

#### ADR-001 — Stockage SQLite WAL + FTS5 + sqlite-vec

**Statut :** ✅ VALIDÉ  
**Date :** Phase 06 (21 octobre 2026)  
**Phase :** 06 — Stockage et connaissances  
**Référence :** `04-Knowledge/06_ARCHITECTURE_STOCKAGE.md`

**Contexte :**
- Besoin de stocker ressources, projets, audits
- Recherche full-text et vectorielle requise
- Usage personnel/équipe petite (< 5 devs)
- Pas de compétence ops pour base distribuée
- Budget $0 pour MVP

**Décision :**
SQLite en mode WAL avec 3 bases séparées :
1. `ekts.db` — données structurées (ressources, projets, audits)
2. `ekts-fts.db` — index full-text (FTS5, BM25)
3. `ekts-vectors.db` — index vectoriel (sqlite-vec, cosine similarity)

**Justification :**
- ✅ Performance 80x supérieure aux lectures simples (WAL)
- ✅ Zéro overhead opérationnel (embedded, pas de serveur)
- ✅ FTS5 compétitif avec PostgreSQL tsvector
- ✅ sqlite-vec suffisant pour <100K vecteurs
- ✅ Portabilité maximale (fichiers copiables)
- ✅ Backup trivial (copie fichiers)
- ✅ $0 coût (embedded)

**Alternatives considérées :**
- ❌ PostgreSQL + pgvector : écarté (complexité ops, coût hosting)
- ❌ MongoDB : écarté (schemaless incompatible avec structure)
- ❌ Pinecone/Weaviate : écartés (services cloud, coût, dépendance)
- ❌ MySQL : écarté (FTS moins performant, pas vectoriel natif)

**Conséquences :**
- ✅ Positif : $0 coût, portable, simple, performant
- ⚠️ Négatif : écritures séquentielles (WAL permet lectures parallèles)
- ⚠️ Négatif : limite ~100K vecteurs pour sqlite-vec
- 🔄 Mitigation : migration PostgreSQL si multi-users (Phase 3)

**Conditions de réexamen :**
- Si volume > 100K vecteurs
- Si multi-users requis (> 5 devs simultanés)
- Si latence écriture > 100ms

---

#### ADR-002 — 4 outils MCP prioritaires (lecture seule)

**Statut :** ✅ VALIDÉ  
**Date :** Phase 02 (21 octobre 2026)  
**Phase :** 02 — MCP et intégration agentique  
**Référence :** `02-Agent-Integration/02_MCP_ET_AGENTS.md`

**Contexte :**
- Exposer capacités EKTS aux agents IA
- Couvrir 80% des besoins avec minimum d'outils
- Transport local sécurisé (stdio)
- Sécurité maximale (lecture seule)

**Décision :**
4 outils MCP prioritaires pour MVP-1 :
1. `search_knowledge` — recherche hybride (FTS + Vector + RRF)
2. `get_resource` — obtenir ressource par ID
3. `list_resources` — lister ressources (filtres)
4. `validate_resource` — valider schéma ressource

**Justification :**
- ✅ Couvrent 80% des cas d'usage agents
- ✅ Lecture seule (sécurité maximale)
- ✅ Transport stdio (local, pas d'exposition réseau)
- ✅ Compatible Tier 1 agents (Claude Code, Cursor, Copilot)
- ✅ Simple à implémenter et tester

**Alternatives considérées :**
- ❌ Plus d'outils (CRUD complet) : écarté (sur-ingénierie MVP, risques sécurité)
- ❌ Écriture via MCP : écarté (risque sécurité, validation humaine requise)
- ❌ Tools spécialisés (inspect, capitalize) : reportés MVP-2/3

**Conséquences :**
- ✅ Positif : simple, sécurisé, suffisant pour MVP-1
- ⚠️ Négatif : pas de modification via MCP (CLI requis pour écriture)
- 🔄 Mitigation : ajout outils écriture si besoin (MVP-2+)

**Conditions de réexamen :**
- Si agents requièrent écriture via MCP
- Si cas d'usage non couverts identifiés

---

#### ADR-003 — Playwright pour inspection navigateur

**Statut :** ✅ VALIDÉ  
**Date :** Phase 04 (21 octobre 2026)  
**Phase :** 04 — Automatisation navigateur  
**Référence :** `03-Browser-and-Scraping/04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md`

**Contexte :**
- Inspection automatisée de sites web
- 4 niveaux d'inspection (L1-L4)
- Analyse 5 dimensions (perf, a11y, SEO, UX, contenu)
- Benchmark comparatif effectué

**Décision :**
- **Principal** : Playwright (score 96/100)
- **Optionnel** : Patchright (stealth, bypass protections)

**Justification :**
- ✅ Score 96/100 (benchmark comparatif)
- ✅ Multi-browser (Chromium, Firefox, WebKit)
- ✅ MCP natif (Playwright MCP, 70+ tools)
- ✅ Performance supérieure
- ✅ Accessibilité native (arbre accessibilité)
- ✅ Traces et screenshots intégrés
- ✅ Bien maintenu (Microsoft)

**Alternatives considérées :**
- ❌ Puppeteer : écarté (Chrome-only, pas MCP natif)
- ❌ Selenium : écarté (lent, configuration lourde)
- ❌ Cypress : écarté (usage testing, pas automation)

**Conséquences :**
- ✅ Positif : puissant, flexible, MCP natif, multi-browser
- ⚠️ Négatif : dépendance lourde (~300 MB navigateurs)
- 🔄 Mitigation : feature flag pour désactiver si non utilisé

**Conditions de réexamen :**
- Si Playwright performance dégrade
- Si nouveau tool supérieur identifié

---

#### ADR-004 — Recherche hybride FTS + Vector + RRF

**Statut :** ✅ VALIDÉ  
**Date :** Phase 07 (21 octobre 2026)  
**Phase :** 07 — RAG et recherche sémantique  
**Référence :** `04-Knowledge/07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md`

**Contexte :**
- Recherche ressources par mots-clés et sémantique
- Qualité mesurable (Recall@5, Faithfulness)
- Performance acceptable (<500ms)
- 100K documents cible

**Décision :**
Recherche hybride combinant :
1. **FTS5** (BM25) — recherche textuelle, top 20 résultats
2. **sqlite-vec** (cosine similarity) — recherche vectorielle, top 20 résultats
3. **RRF** (Reciprocal Rank Fusion, k=60) — fusion, top 10 résultats

**Justification :**
- ✅ FTS5 : précision mots-clés (BM25)
- ✅ Vector : rappel sémantique (cosine)
- ✅ RRF : combine avantages, simple à implémenter
- ✅ Cibles validées : Recall@5 ≥ 0.75, Faithfulness ≥ 0.80
- ✅ Performance < 500ms (100K docs)

**Alternatives considérées :**
- ❌ FTS seul : écarté (pas de sémantique)
- ❌ Vector seul : écarté (moins précis mots-clés)
- ❌ RAG complet (LLM) : écarté (sur-ingénierie MVP, coût API)
- ❌ Elasticsearch : écarté (complexité ops, coût)

**Conséquences :**
- ✅ Positif : qualité supérieure, simple, performant
- ⚠️ Négatif : dépendance embeddings (OpenAI/Ollama)
- 🔄 Mitigation : Ollama pour embeddings locaux (optionnel)

**Conditions de réexamen :**
- Si Recall@5 < 0.70 mesuré
- Si latence > 500ms persistante
- Si nouveau algorithme supérieur identifié

---

#### ADR-005 — Architecture C Hybride

**Statut :** ✅ VALIDÉ  
**Date :** Phase 13 (21 octobre 2026)  
**Phase :** 13 — Architecture cible, MVP et roadmap  
**Référence :** `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md`

**Contexte :**
- Définir architecture cible EKTS
- Équilibrer simplicité et évolutivité
- Usage personnel → équipe petite → production si besoin
- 3 architectures comparées (A, B, C)

**Décision :**
Architecture C (Hybride) — Monolithe modulaire TypeScript/Node.js avec SQLite WAL, extensible par services optionnels activés via feature flags.

**Justification :**
- ✅ Score 8.0/10 (matrice 6 critères)
- ✅ Pragmatique : commence simple, évolue si besoin
- ✅ Coût maîtrisé : $0 pour MVP
- ✅ Progressive : migration graduelle (pas de big bang)
- ✅ Flexible : feature flags pour services optionnels
- ✅ Rétrocompatible : mode standalone toujours disponible

**Alternatives considérées :**
- ❌ Architecture A (Monolithe pur, 8.5/10) : écartée (pas de chemin évolution)
- ❌ Architecture B (Microservices, 4.8/10) : écartée (trop complexe, coût)

**Conséquences :**
- ✅ Positif : simple, évolutif, $0, flexible
- ⚠️ Négatif : complexité conditionnelle (feature flags)
- 🔄 Mitigation : documentation claire des modes

**Conditions de réexamen :**
- Si scaling horizontal requis
- Si multi-users > 5 devs simultanés
- Si SLA 24/7 requis

---

#### ADR-006 — Séquence MVP-1 → MVP-2 → MVP-3

**Statut :** ✅ VALIDÉ  
**Date :** Phase 13 (21 octobre 2026)  
**Phase :** 13 — Architecture cible, MVP et roadmap  
**Référence :** `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md`

**Contexte :**
- Définir ordre d'implémentation
- Respecter dépendances techniques
- Livrer valeur progressivement
- Timeline 9 mois

**Décision :**
3 MVPs sur 9 mois (18 sprints de 2 semaines) :
1. **MVP-1** (Mois 1-3, Sprint 1-6) : Bibliothèque + Recherche + CLI + MCP
2. **MVP-2** (Mois 4-6, Sprint 7-12) : Inspection navigateur
3. **MVP-3** (Mois 7-9, Sprint 13-18) : Capitalisation projets

**Justification :**
- ✅ MVP-1 : fondation essentielle, valeur immédiate, risques faibles
- ✅ MVP-2 : dépend de MVP-1 (stockage audits), valeur ajoutée
- ✅ MVP-3 : dépend de MVP-1 + MVP-2, valeur long terme

**Alternatives considérées :**
- ❌ Ordre différent : écarté (dépendances non respectées)
- ❌ Tout en parallèle : écarté (complexité, risques élevés)
- ❌ MVP-1 uniquement : écarté (valeur limitée)

**Conséquences :**
- ✅ Positif : progressif, dépendances respectées, valeur livrée tôt
- ⚠️ Négatif : 9 mois avant système complet
- 🔄 Mitigation : valeur livrée dès MVP-1 (Mois 3)

**Conditions de réexamen :**
- Si retard > 1 mois
- Si changements requirements majeurs

---

#### ADR-007 — 4 niveaux sécurité, STRIDE MCP

**Statut :** ✅ VALIDÉ  
**Date :** Phase 11 (21 octobre 2026)  
**Phase :** 11 — Sécurité et gouvernance  
**Référence :** `06-Security/11_MODELE_DE_MENACE.md`

**Contexte :**
- Sécuriser système EKTS
- Adapter STRIDE à MCP et agents IA
- Progression MVP → Production
- 38 vecteurs d'attaque identifiés

**Décision :**
4 niveaux de sécurité progressifs :
1. **Niveau 1 (MVP)** : Local, fichiers chmod 600, pas d'exposition réseau
2. **Niveau 2 (Équipe)** : LAN, API key, audit logs, backup quotidien
3. **Niveau 3 (Production)** : HTTPS, OAuth2/JWT, RBAC, rate limiting, Firecracker
4. **Niveau 4 (Enterprise)** : Zero-trust, HSM, compliance (SOC2, ISO27001), pentests

**Justification :**
- ✅ Progression réaliste (MVP → Production)
- ✅ Contrôles proportionnés (pas de sur-sécurité MVP)
- ✅ 38 vecteurs d'attaque identifiés (STRIDE adapté MCP)
- ✅ Default-deny network egress
- ✅ Firecracker pour Production (hardware isolation, ~125ms boot)
- ✅ LlamaFirewall pour prompt injection

**Alternatives considérées :**
- ❌ Sécurité maximale dès MVP : écarté (overhead, ralentit développement)
- ❌ Pas de sécurité : écarté (risques inacceptables)

**Conséquences :**
- ✅ Positif : sécurité proportionnée, évolutive, 38 menaces couvertes
- ⚠️ Négatif : complexité augmente avec niveaux
- 🔄 Mitigation : documentation claire par niveau, checklists

**Conditions de réexamen :**
- Si nouvelle menace identifiée
- Si incident de sécurité
- Si compliance requise (SOC2, ISO27001)

---

#### ADR-008 — Claude Code + GitHub Copilot + Cline

**Statut :** ✅ VALIDÉ  
**Date :** Phase 12 (21 octobre 2026)  
**Phase :** 12 — Outils IA, plans gratuits et offres étudiantes  
**Référence :** `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md`

**Contexte :**
- Choisir outils IA pour développement EKTS
- Équilibrer performance, coût, confidentialité
- 25+ outils comparés

**Décision :**
Top 3 outils recommandés :
1. **Claude Code Pro** ($20/mois) — meilleure performance (80.8% SWE-bench), 1M tokens contexte
2. **GitHub Copilot Pro** ($10/mois) — meilleur rapport qualité/prix, multi-IDE, MCP natif
3. **Cline + BYOK** (variable) — confidentialité maximale, open-source, multi-provider

**Justification :**
- ✅ Claude Code : 80.8% SWE-bench (benchmark), 1M tokens contexte, Agent Teams
- ✅ Copilot : $10/mois, multi-IDE (VS Code, JetBrains, Neovim), MCP natif
- ✅ Cline : open-source, multi-provider (Anthropic, OpenAI, local), zero retention possible

**Alternatives considérées :**
- ❌ Cursor : écarté (offre étudiant fermée juin 2026)
- ❌ ChatGPT : écarté (pas d'offre étudiant vérifiée)
- ❌ Codex CLI : écarté (performance inférieure Claude Code)

**Conséquences :**
- ✅ Positif : performance, coût maîtrisé, confidentialité
- ⚠️ Négatif : coûts mensuels ($30-50/mois si non-étudiant)
- 🔄 Mitigation : GitHub Student Pack pour étudiants (gratuit)

**Conditions de réexamen :**
- Avril 2027 (pricing à re-vérifier)
- Si nouveau tool supérieur identifié
- Si budget réduit

---

#### ADR-009 — MCP transport stdio

**Statut :** ✅ VALIDÉ  
**Date :** Phase 02 (21 octobre 2026)  
**Phase :** 02 — MCP et intégration agentique  
**Référence :** `02-Agent-Integration/02_MCP_ET_AGENTS.md`

**Contexte :**
- Choisir transport MCP
- Usage local, sécurité maximale
- Pas d'exposition réseau MVP

**Décision :**
Transport stdio (standard input/output) pour MVP

**Justification :**
- ✅ Local uniquement (pas d'exposition réseau)
- ✅ Sécurisé (pas de ports ouverts)
- ✅ Simple (pas de configuration réseau)
- ✅ Compatible Tier 1 agents (Claude Code, Cursor, Copilot)
- ✅ Spec MCP 2026-07-28 (stateless)

**Alternatives considérées :**
- ❌ HTTP transport : écarté (exposition réseau, complexité configuration)
- ❌ WebSocket : écarté (sur-ingénierie pour usage local)

**Conséquences :**
- ✅ Positif : simple, sécurisé, local
- ⚠️ Négatif : pas d'accès distant
- 🔄 Mitigation : HTTP transport si besoin distant (Phase 3)

**Conditions de réexamen :**
- Si accès distant requis
- Si multi-machines requis

---

#### ADR-010 — Validation Zod

**Statut :** ✅ VALIDÉ  
**Date :** Phase 03 (21 octobre 2026)  
**Phase :** 03 — Conception d'outils et services  
**Référence :** `02-Agent-Integration/03_CONCEPTION_OUTILS_ET_SERVICES.md`

**Contexte :**
- Valider entrées/sorties
- Type-safe runtime
- Excellent DX TypeScript

**Décision :**
Zod comme bibliothèque de validation

**Justification :**
- ✅ Type-safe (inférence TypeScript automatique)
- ✅ Runtime validation (vérification dynamique)
- ✅ Excellent DX (API intuitive, messages erreur clairs)
- ✅ Performant (rapide)
- ✅ Bien maintenu (communauté active)

**Alternatives considérées :**
- ❌ Joi : écarté (pas TypeScript natif, pas inférence)
- ❌ Yup : écarté (moins maintenu, API moins intuitive)
- ❌ io-ts : écarté (API plus verbeuse, moins populaire)

**Conséquences :**
- ✅ Positif : type-safe, simple, performant, excellent DX
- ⚠️ Négatif : dépendance supplémentaire
- 🔄 Mitigation : dépendance légère, bien maintenue

**Conditions de réexamen :**
- Si nouveau tool supérieur identifié
- Si Zod non maintenu

---

#### ADR-011 — Révision de la baseline technique (Node 22, TypeScript 5.9, ESLint flat, SDK MCP 1.32)

**Statut :** ✅ ACCEPTÉ  
**Date :** 21 octobre 2026 (Sprint 0)  
**Phase :** Implémentation — avant Sprint 1  
**Référence :** `docs/audit/ETAT-DES-LIEUX-2026-10-21.md` §5.2, décisions D2 et D3

**Contexte :**
- La documentation des sprints a été rédigée sur une base Node.js 20, ESLint `eslintrc`, TypeScript 5 sans borne et SDK MCP « v2 ».
- L'instantané du registre npm du 21 octobre 2026 montre que Vitest 5, better-sqlite3 13 et commander 15 exigent Node ≥ 22.12, qu'ESLint 10 a supprimé `eslintrc`, que TypeScript 7.0.2 sort du peer range de `typescript-eslint` 8.x, et que la dernière version publiée du SDK MCP est **1.32.1** (aucune v2).

**Décision :**
1. Baseline **Node.js 22.12 LTS** (CI : 22.x et 24.x).
2. **TypeScript 5.9.x épinglé** jusqu'au support de TS 7 par `typescript-eslint`.
3. **ESLint 10 en flat config** (`eslint.config.js`), sans `.eslintrc`.
4. **Vitest 5** avec `@vitest/coverage-v8` (suppression de `c8`).
5. **`@modelcontextprotocol/sdk` 1.32.x** ; la cible « v2 » est transformée en veille (aucune date de publication connue).

**Justification :**
- ✅ Exécutabilité immédiate des commandes documentées
- ✅ Cohérence avec l'environnement de développement constaté (Node 22.22.3)
- ✅ Sécurité et support : Node 20 est en fin de vie depuis avril 2026
- ✅ Reproductibilité : versions majeures épinglées + lockfile commité

**Alternatives considérées :**
- ❌ Rester Node 20 en épinglant Vitest 3, better-sqlite3 12, commander 14, ESLint 9 : dette immédiate et support de sécurité limité
- ❌ Attendre le SDK MCP v2 : bloque le Sprint 6 sans date

**Conséquences :**
- ✅ Positif : toolchain alignée, builds reproductibles
- ⚠️ Négatif : Node 20 n'est plus supporté
- 🔄 Mitigation : `.nvmrc`, `engines`, CI sur 22.x/24.x
- 🔄 Veille : réévaluation trimestrielle (ADR-V04 : publication éventuelle du SDK MCP v2)

**Conditions de réexamen :**
- Publication du SDK MCP v2
- Support de TypeScript 7 par `typescript-eslint`
- Fin de vie de Node 22 (avril 2027)

---

### 2.2.1 Décisions d'implémentation du Sprint 4 (22 octobre 2026)

Ces décisions découlent de la mise en œuvre réelle d'ADR-004 et sont consignées ici pour que les
sprints 5 et 6 s'appuient sur l'état effectif du code, non sur la conception initiale.

#### ADR-012 — Indexation vectorielle par décorateur, pas dans le manager

**Statut :** ✅ APPLIQUÉ
**Contexte :** le dossier de sprint prescrit de modifier `KnowledgeManager` pour appeler
l'indexer vectoriel à chaque écriture. La mission du sprint interdit cette modification.
**Décision :** `withVectorIndexing(manager, vectorIndexer)` renvoie un `IKnowledgeManager`
décoré qui délègue les neuf méthodes et ajoute l'indexation après `addResource`,
`updateResource`, `deleteResource` et `reindex`.
**Conséquences :** `KnowledgeManager` reste utilisable sans réseau ; l'écriture SQLite et
l'appel OpenAI ne partagent pas de transaction (dégradation réparable par `reindex()`).

#### ADR-013 — Similarité cosinus sans migration du schéma

**Statut :** ✅ APPLIQUÉ
**Contexte :** la table `vec0` de la migration 001 n'a pas d'option `distance_metric`, donc
`sqlite-vec` applique la distance L2 ; la spécification exige le cosinus. Recréer la table
imposerait une migration destructive et une réindexation complète.
**Décision :** normaliser les vecteurs à la norme 1 à l'écriture et à la lecture. Pour des vecteurs
unitaires, `cos = 1 - distance²/2` : le classement L2 est identique au classement cosinus.
**Conséquences :** aucune migration ; un futur changement de `distance_metric` devra être mesuré
(normalisation devenue inutile, mais inoffensive).

#### ADR-014 — Assainissement systématique des requêtes FTS

**Statut :** ✅ APPLIQUÉ
**Contexte :** FTS5 interprète `AND`, `OR`, `NOT`, `NEAR`, `*`, `"`, `-` et les parenthèses. Une
saisie utilisateur comme `C++ (pointeurs)` produit `fts5: syntax error near ""`.
**Décision :** `toFtsQuery()` découpe la saisie en mots, cite chaque terme et les joint par `AND` ;
une requête sans terme exploitable renvoie `[]` sans interroger FTS5.
**Conséquences :** aucune erreur de syntaxe possible depuis l'entrée utilisateur ; les opérateurs
FTS avancés ne sont pas exposés (hors périmètre, à rouvrir si un besoin réel apparaît).

#### Risques nouveaux (Sprint 4)

| ID | Risque | Impact | Probabilité | Mitigation |
|----|--------|--------|-------------|------------|
| R-4.1 | Coût OpenAI à l'indexation d'un gros corpus | Moyen | Moyenne | `embedBatch` (64 textes/appel), indexation incrémentale, fournisseur local pour les tests |
| R-4.2 | Indisponibilité de l'API OpenAI | Moyen | Moyenne | Mode `fts` sans réseau ; erreurs typées ; `reindex()` pour rattraper |
| R-4.3 | Pas d'index ANN : latence linéaire en nombre de vecteurs | Moyen | Faible (< 100K) | Mesuré à 308 ms p95 pour 100K vecteurs ; réexamen au-delà de 150K |
| R-4.4 | Écart entre l'index FTS et l'index vectoriel après un échec d'embedding | Faible | Moyenne | `reindex()` du décorateur, `checkIntegrity()` pour le FTS |

---

### 2.2.2 Décisions d'implémentation du Sprint 4.5 — couche fournisseurs (22 octobre 2026)

Le besoin exprimé est de tirer parti de **treize clés d'API hétérogènes** sans
écrire treize chemins de code, puis de pouvoir en brancher d'autres sans
attendre une nouvelle version. Ces décisions fixent la forme de la réponse.

#### ADR-015 — Registre déclaratif et routage par capacité

**Statut :** ✅ APPLIQUÉ
**Contexte :** l'appelant connaît son besoin (« je veux un embedding »), pas le
fournisseur qui doit y répondre. Coder `if (fournisseur === 'openai')` dans
chaque service répartirait la connaissance des fournisseurs dans tout le projet
et rendrait l'ajout du quatorzième fournisseur coûteux.
**Décision :** un catalogue de données (`PROVIDERS`, 13 entrées) décrit chaque
fournisseur : capacités, protocole filaire, URL de base, modèles, palier
tarifaire, variables d'environnement. `planRoutes()` produit une chaîne
ordonnée de candidats pour une capacité donnée ; les services ne dépendent que
de `ProviderGateway`.
**Conséquences :** ajouter un fournisseur compatible OpenAI ne demande aucune
ligne de code exécutable ; un fournisseur dont le protocole n'est pas modélisé
(`sofya`) est collecté mais jamais appelé ; le catalogue devient une surface de
test à part entière (12 tests d'invariants).

#### ADR-016 — L'espace d'embedding est l'identité de bascule

**Statut :** ✅ APPLIQUÉ
**Contexte :** la rotation et le repli entre fournisseurs n'ont de sens que si
les vecteurs produits restent comparables. Deux modèles d'embedding distincts
produisent des espaces vectoriels disjoints : mélanger leurs sorties ne lève
aucune erreur, cela dégrade silencieusement la recherche.
**Décision :** un espace canonique (`éditeur/modèle`) est attaché à chaque
modèle d'embedding du catalogue. `planRoutes()` épingle l'espace du premier
candidat et écarte tous les autres ; `assertSpace()` refuse une écriture
incompatible dans un index non vide ; la migration 002 persiste la liaison dans
`main.embedding_spaces` ; `switchSpace()` purge puis relie explicitement.
**Conséquences :** le repli est possible d'OpenAI vers OpenRouter (même
`text-embedding-3-small`) et de Novita vers OpenRouter (même `baai/bge-m3`),
mais jamais d'OpenAI vers Gemini ; changer d'espace est une opération
destructive, donc explicite et non automatique.

#### ADR-017 — Chargement de `.env` par `process.loadEnvFile`

**Statut :** ✅ APPLIQUÉ
**Contexte :** `.env` n'était lu que par `tsx watch` et par les tests, via des
chemins ad hoc. Les scripts exécutés avec `node dist/…` (dont
`npm run providers`) démarraient sans aucune clé, ce qui donnait l'illusion
d'une configuration absente.
**Décision :** `loadEnvFile()` s'appuie sur `process.loadEnvFile` (Node ≥ 20.12,
déjà disponible avec `engines: >= 22.12`) ; il n'écrase jamais une variable
définie par le shell, ignore silencieusement un fichier absent et n'échoue pas
sur une ligne malformée. Il n'est appelé que lorsqu'aucun environnement n'est
injecté, ce qui préserve la testabilité (les tests fournissent leur `env`).
**Conséquences :** aucune dépendance `dotenv` ; un `.env` fautif ne bloque pas
le démarrage ; la précédence est celle de Node (environnement > fichier).

#### ADR-018 — Le registre des fournisseurs est extensible sans code

**Statut :** ✅ APPLIQUÉ
**Contexte :** le catalogue livré couvre les fournisseurs connus à la rédaction.
L'utilisateur en obtient d'autres (Sofya, MiniMax, puis d'autres encore) et ne
peut pas attendre une version du logiciel pour utiliser une clé qu'il possède
déjà. Modifier `catalog.ts` à chaque ajout ferait de lui un développeur du projet.
**Décision :** un fichier `providers.custom.json` (ignoré par Git, modèle
versionné) déclare des fournisseurs : identifiant, capacité, protocole, URL de
base et **nom** de la variable qui porte la clé. Il est validé au chargement
(Zod) puis fusionné avec le catalogue par `mergeProviders()` : un identifiant
connu est remplacé sur place, un identifiant nouveau est ajouté en fin de
chaîne. Le registre obtenu est injecté dans `planRoutes()`, `loadKeyring()` et
la passerelle, qui restent des fonctions pures testables.
**Conséquences :** ajouter un fournisseur ne demande plus de code ; les
garde-fous sont structurels (HTTPS obligatoire, protocole connu, en-tête
`authorization` interdit, identifiants uniques) ; un fournisseur maison passe
après les fournisseurs éprouvés, il ne prend jamais la priorité par accident.

#### ADR-019 — CLI Commander.js, deux formats de sortie et cinq codes

**Statut :** ✅ APPLIQUÉ
**Contexte :** le Sprint 5 expose la couche métier à l'utilisateur et aux
scripts. Il faut un analyseur d'arguments robuste, une sortie lisible et une
sortie machine stable, sans dupliquer la logique du Knowledge Manager ni du
moteur de recherche.
**Décision :** Commander.js 15 pour l'analyse, sept modules de commande
(`init`, `add`, `get`, `search`, `list`, `delete`, `status`), une couche
`runtime` injectable (sorties, horloge, confirmation, ouverture des services) et
deux formats : humain par défaut, JSON avec `--json`. Les tableaux sont rendus
par un formateur ASCII interne (aucune dépendance), les couleurs par `chalk`
(désactivées hors TTY, avec `--no-colors`, `NO_COLOR` ou `TERM=dumb`). Les codes
de sortie sont fixés : 0 succès, 1 exécution, 2 arguments, 3 introuvable,
4 validation. `exitOverride()` et le retour de code (jamais `process.exit`)
rendent les commandes testables en mémoire ; le binaire compilé est en plus
couvert par un test d'intégration.
**Conséquences :** la CLI ne fait que composer les services existants ; le
serveur MCP du Sprint 6 réutilisera `openCliServices`/`createSearchEngine`
plutôt que de réimplémenter l'accès aux données ; toute évolution du format JSON
est un changement de contrat, à documenter dans `docs/CLI.md`.

> Le blueprint (`SPRINT-05.md` §5.1) renvoie à « ADR-003 (Commander.js) », mais
> l'ADR-003 du présent registre traite de Playwright. La décision CLI est donc
> consignée ici.

#### Risques nouveaux (Sprint 4.5)

| ID | Risque | Impact | Probabilité | Mitigation |
|----|--------|--------|-------------|------------|
| R-4.5.1 | Bascule silencieuse entre modèles d'embedding → vecteurs incomparables | **Élevé** | Faible | Espace épinglé par `planRoutes`, `assertSpace`, migration 002, `EmbeddingSpaceMismatchError`, 20 tests d'intégration |
| R-4.5.2 | Palier gratuit d'un fournisseur supprimé ou rétrogradé | Moyen | **Élevée** | `status` et `free` dans le catalogue, politique `quality` par défaut, repli multi-fournisseurs, `npm run providers` pour constater l'état réel |
| R-4.5.3 | Multiplication des clés en `.env` → fuite par copie ou partage d'écran | **Élevé** | Moyenne | `.env` ignoré, Gitleaks pré-commit + CI, `maskKey` (clés < 12 caractères entièrement masquées), `redactKeys` sur les erreurs |
| R-4.5.4 | Disjoncteur trop agressif : panne locale transitoire → fournisseur écarté 10 min | Faible | Moyenne | Seuil de 3 échecs, relégation en fin de chaîne (jamais suppression), reprise après `Retry-After` |
| R-4.5.5 | Protocole d'un fournisseur mal modélisé → 400 systématique | Moyen | Faible | Protocole `unknown` explicite, fournisseur collecté mais exclu du routage ; vérification documentée par fournisseur (§2 de `PROVIDERS.md`) |
| R-4.5.6 | Coût non maîtrisé sur les fournisseurs payants | Moyen | Moyenne | Politique `cost`/`free`, `npm run providers` affiche le palier, aucun appel de facturation automatisé |
| R-4.5.7 | Dépendance à un agrégateur (OpenRouter) devenu point unique de bascule | Faible | Faible | Bascule indépendante par capacité ; OpenRouter n'est jamais le seul candidat d'un espace |
| R-4.5.8 | Déclaration locale (`providers.custom.json`) invalide → clé présente mais inutilisée, sans explication | Moyen | Moyenne | Validation Zod bloquante au chargement, message avec champ fautif, `npm run providers` affiche le fichier et les fournisseurs retenus, test de non-régression sur `providers.custom.example.json` |
| R-4.5.9 | Clé écrite en dur dans `providers.custom.json` puis versionnée | **Élevé** | Faible | Seul le nom de la variable est accepté, en-tête `authorization` refusé, fichier ignoré par Git, Gitleaks en pré-commit et CI |

#### Risques nouveaux (Sprint 5)

| ID | Risque | Impact | Probabilité | Mitigation |
|----|--------|--------|-------------|------------|
| R-5.1 | Dérive du format `--json` → scripts cassés sans avertissement | Moyen | Moyenne | Formes documentées dans `docs/CLI.md` §3, test d'intégration qui analyse réellement la sortie JSON |
| R-5.2 | Suppression accidentelle en script (stdin fermé) | **Élevé** | Faible | Confirmation refusée sans terminal, `--yes` obligatoire, test dédié (`cancelled: true`) |
| R-5.3 | Repli silencieux de l'hybride vers le lexical → classement trompeur | Moyen | Faible | `hybrid`/`vector` exigent les embeddings et échouent avec un message explicite ; `--mode fts` est un choix conscient |
| R-5.4 | Point d'entrée `src/cli/index.ts` hors couverture | Faible | Faible | Fichier de trois lignes, testé de bout en bout par `tests/cli/cli.test.ts` sur le binaire compilé |
| R-5.5 | Divergence CLI/MCP dans l'accès aux services (Sprint 6) | Faible | Moyenne | Services partagés (`openCliServices`, `createSearchEngine`), ADR-019 |
| R-5.6 | Bases créées par erreur par une commande d'observation | Faible | Faible | `status` inspecte les fichiers avant toute ouverture (`migrate: false`, ouverture conditionnée aux trois fichiers) |

---

### 2.3 Décisions à vérifier

| ID | Sujet | Information | Date vérification | Statut |
|----|-------|-------------|-------------------|--------|
| ADR-V01 | Claude Code Max pricing | Prix annoncés, non confirmés officiellement | Avril 2027 | ⚠️ À VÉRIFIER |
| ADR-V02 | Cursor pricing | Évolutions rapides, offre étudiant fermée juin 2026 | Avril 2027 | ⚠️ À VÉRIFIER |
| ADR-V03 | OpenAI Codex Pro 500 | $500/mois, à vérifier | Avril 2027 | ⚠️ À VÉRIFIER |
| ADR-V04 | SDK MCP v2 | Aucune version 2 publiée au 21/10/2026 (latest 1.32.1) | Janvier 2027 | 👁️ VEILLE |

### 2.4 Décisions à prendre

| ID | Sujet | Options | Sprint décision | Statut |
|----|-------|---------|-----------------|--------|
| ADR-T01 | Ollama vs OpenAI embeddings | Local vs cloud | Sprint 5 | ⏸️ DIFFÉRÉ — la couche fournisseurs (ADR-015) rend l'ajout d'un fournisseur local déclaratif, mais Ollama n'utilise pas de clé d'API : il demande une entrée `local` dans le catalogue. |
| ADR-T02 | Mode navigateur (local/service) | Feature flag | Sprint 7 | ❓ À DÉCIDER |
| ADR-T03 | PostgreSQL migration | Si multi-users requis | Phase 3 | ❓ À DÉCIDER |

---

## 3. Registre des risques

### 3.1 Format risque

Chaque risque suit le format :

```markdown
#### RISQ-{ID} — {Titre}

**Catégorie :** Technique | Architectural | Opérationnel | Financier | Sécurité  
**Probabilité :** Faible | Moyen | Élevé  
**Impact :** Faible | Moyen | Élevé | Critique  
**Score :** Probabilité × Impact (1-9)  
**Propriétaire :** {Qui gère le risque}  
**Statut :** Identifié | En mitigation | Résolu | Accepté

**Description :**
{Description du risque}

**Signaux d'alerte :**
{Comment détecter le risque}

**Mitigation :**
{Mesures de prévention}

**Plan de repli :**
{Que faire si risque réalisé}
```

### 3.2 Risques techniques

---

#### RISQ-T01 — SQLite performance dégrade

**Catégorie :** Technique  
**Probabilité :** Faible  
**Impact :** Élevé  
**Score :** 3 (Faible × Élevé)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
SQLite WAL performance dégrade avec volume > 100K documents ou écritures concurrentes.

**Signaux d'alerte :**
- Latence recherche > 500ms
- Latence écriture > 100ms
- Benchmarks Recall@5 < 0.70

**Mitigation :**
- ✅ WAL mode activé (lecture parallèle)
- ✅ Benchmarks réguliers (Sprint 4+)
- ✅ Cache LRU pour requêtes fréquentes
- ✅ Index composites pour filtres courants

**Plan de repli :**
- Migration PostgreSQL + pgvector (Phase 3)
- Feature flag `EKTS_DB_MODE=postgres`

---

#### RISQ-T02 — Embeddings coût OpenAI

**Catégorie :** Financier  
**Probabilité :** Moyen  
**Impact :** Moyen  
**Score :** 4 (Moyen × Moyen)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Coût embeddings OpenAI dépasse budget si volume > 100K documents.

**Signaux d'alerte :**
- Facture OpenAI > $10/mois
- Nombre embeddings > 50K/mois

**Mitigation :**
- ✅ OpenAI text-embedding-3-small ($0.02/1M tokens, économique)
- ✅ Cache embeddings (pas de régénération)
- ✅ Batch processing (réduction appels API)

**Plan de repli :**
- Migration Ollama (embeddings locaux, $0)
- Feature flag `EKTS_EMBEDDINGS_MODE=local`

---

#### RISQ-T03 — Playwright stabilité

**Catégorie :** Technique  
**Probabilité :** Moyen  
**Impact :** Élevé  
**Score :** 6 (Moyen × Élevé)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Playwright instable (crash, timeout) lors inspections longues ou sites complexes.

**Signaux d'alerte :**
- Taux échec inspection > 10%
- Crashes Playwright > 5/jour

**Mitigation :**
- ✅ Retry mechanism (3 tentatives)
- ✅ Timeout handling (30s par défaut)
- ✅ Benchmark stabilité (Sprint 7-8)

**Plan de repli :**
- Switch Patchright (stealth, plus stable sur sites protégés)
- Feature flag `EKTS_BROWSER_ENGINE=patchright`

---

#### RISQ-T04 — MCP compatibilité agents

**Catégorie :** Technique  
**Probabilité :** Faible  
**Impact :** Élevé  
**Score :** 3 (Faible × Élevé)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
MCP server EKTS incompatible avec certains agents Tier 1 (Claude Code, Cursor, Copilot).

**Signaux d'alerte :**
- Tests compatibilité échouent
- Agents ne découvrent pas outils MCP

**Mitigation :**
- ✅ Spec MCP 2026-07-28 respectée
- ✅ SDK TypeScript 1.32.x officiel (ADR-011)
- ✅ Tests manuels avec 3 agents (Sprint 6)

**Plan de repli :**
- Debug avec documentation MCP
- Alternative : CLI uniquement (pas MCP)

---

#### RISQ-T05 — Dérive des versions de la toolchain

**Catégorie :** Technique  
**Probabilité :** Élevé  
**Impact :** Moyen  
**Score :** 6 (Élevé × Moyen)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Les majeures npm évoluent plus vite que la documentation ; des commandes documentées deviennent inexécutables (ESLint 10, TypeScript 7, SDK MCP v2).

**Signaux d'alerte :**
- `npm ci` ou `npm run lint` échoue après une montée de version
- Peer dependency conflict (`ERESOLVE`)
- Version majeure publiée non couverte par un ADR

**Mitigation :**
- ✅ Versions majeures épinglées dans `package.json`
- ✅ `package-lock.json` commité
- ✅ ADR-011 et revue trimestrielle de la toolchain
- ✅ CI qui exécute lint + build + tests à chaque push

**Plan de repli :**
- Revenir à la version du lockfile (`npm ci`)
- Ouvrir une révision d'ADR avant toute montée de majeure

---

### 3.3 Risques organisationnels

---

#### RISQ-O01 — Scope creep

**Catégorie :** Opérationnel  
**Probabilité :** Moyen  
**Impact :** Moyen  
**Score :** 4 (Moyen × Moyen)  
**Propriétaire :** Product Owner (utilisateur)  
**Statut :** ✅ En mitigation

**Description :**
Ajout fonctionnalités non planifiées pendant MVP, retardant livraison.

**Signaux d'alerte :**
- Nouvelles requirements pendant sprint
- Dépassement durée sprint > 20%

**Mitigation :**
- ✅ Périmètre MVP défini (Phase 13)
- ✅ Feature flags pour options
- ✅ Sprints 2 semaines (itérations courtes)

**Plan de repli :**
- Reporter fonctionnalités non critiques
- Réduire périmètre sprint

---

#### RISQ-O02 — Retard planning

**Catégorie :** Opérationnel  
**Probabilité :** Moyen  
**Impact :** Moyen  
**Score :** 4 (Moyen × Moyen)  
**Propriétaire :** Product Owner (utilisateur)  
**Statut :** ✅ En mitigation

**Description :**
Retard accumulation, timeline 9 mois dépassée.

**Signaux d'alerte :**
- Sprint terminé > 3 jours retard
- MVP terminé > 2 semaines retard

**Mitigation :**
- ✅ Buffer 2 semaines par MVP
- ✅ Points contrôle humains (fin sprint)
- ✅ Benchmarks réguliers (vélocité)

**Plan de repli :**
- Réduire périmètre MVP
- Reporter MVP-3 si nécessaire

---

#### RISQ-O03 — Compétences manquantes

**Catégorie :** Opérationnel  
**Probabilité :** Faible  
**Impact :** Élevé  
**Score :** 3 (Faible × Élevé)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Compétences techniques manquantes pour implémentation (MCP, Playwright, SQLite avancé).

**Signaux d'alerte :**
- Blocage technique > 2 jours
- Questions récurrentes sur technologie

**Mitigation :**
- ✅ Documentation complète (phases 00-14)
- ✅ Formation continue (temps alloué)
- ✅ Pair programming (agent + utilisateur)

**Plan de repli :**
- Consulter documentation officielle
- Demander aide communauté (GitHub Discussions)

---

#### RISQ-O04 — Burnout

**Catégorie :** Opérationnel  
**Probabilité :** Faible  
**Impact :** Élevé  
**Score :** 3 (Faible × Élevé)  
**Propriétaire :** Utilisateur  
**Statut :** ✅ En mitigation

**Description :**
Surcharge travail, rythme soutenu, fatigue accumulation.

**Signaux d'alerte :**
- Heures travail > 50h/semaine
- Weekends travaillés régulièrement
- Motivation en baisse

**Mitigation :**
- ✅ Rythme soutenable (40h/semaine)
- ✅ Pauses régulières (pomodoro)
- ✅ Veille technologique limitée (10h/mois)

**Plan de repli :**
- Réduire scope
- Pause développement (1-2 semaines)

---

### 3.4 Risques sécurité

---

#### RISQ-S01 — Fuite secrets

**Catégorie :** Sécurité  
**Probabilité :** Faible  
**Impact :** Critique  
**Score :** 4 (Faible × Critique)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Secrets (API keys, tokens) commités dans Git ou exposés dans logs.

**Signaux d'alerte :**
- Gitleaks détecte secrets
- Secrets dans logs

**Mitigation :**
- ✅ Gitleaks pre-commit hook
- ✅ `.gitignore` exclut `.env`, `*.db`, `logs/`
- ✅ Pino redact (secrets masqués logs)
- ✅ TruffleHog vérification

**Plan de repli :**
- git-filter-repo (nettoyage historique)
- Rotation secrets immédiates
- Audit sécurité complet

---

#### RISQ-S02 — Injection prompt via contenu web

**Catégorie :** Sécurité  
**Probabilité :** Moyen  
**Impact :** Élevé  
**Score :** 6 (Moyen × Élevé)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Pages web inspectées contiennent instructions hostiles destinées à l'agent IA.

**Signaux d'alerte :**
- Agent exécute actions non autorisées
- Fuite données vers externes

**Mitigation :**
- ✅ Contenu web traité comme données non fiables
- ✅ Sandboxing Playwright
- ✅ Pas traitement automatique par LLM
- ✅ Validation humaine requise

**Plan de repli :**
- Désactiver inspection si risque élevé
- LlamaFirewall pour prompt injection

---

#### RISQ-S03 — Serveur MCP compromis

**Catégorie :** Sécurité  
**Probabilité :** Faible  
**Impact :** Critique  
**Score :** 4 (Faible × Critique)  
**Propriétaire :** Développeur principal  
**Statut :** ✅ En mitigation

**Description :**
Serveur MCP EKTS compromis, exposition outils dangereux.

**Signaux d'alerte :**
- Outils MCP modifiés
- Accès non autorisés

**Mitigation :**
- ✅ Transport stdio (local uniquement)
- ✅ Pas serveurs MCP tiers non audités
- ✅ Whitelist outils MCP
- ✅ Audit logs appels MCP

**Plan de repli :**
- Désactiver MCP server
- Audit sécurité complet
- Rotation credentials

---

### 3.5 Risques financiers

---

#### RISQ-F01 — Coûts API imprévus

**Catégorie :** Financier  
**Probabilité :** Moyen  
**Impact :** Moyen  
**Score :** 4 (Moyen × Moyen)  
**Propriétaire :** Utilisateur  
**Statut :** ✅ En mitigation

**Description :**
Coûts API (OpenAI, Anthropic) dépassent budget.

**Signaux d'alerte :**
- Facture > budget mensuel
- Usage API > quotas prévus

**Mitigation :**
- ✅ Quotas configurables (rate limiting)
- ✅ Cache réponses (réduction appels)
- ✅ Monitoring usage (dashboard)

**Plan de repli :**
- Switch modèles moins chers (GPT-4o-mini)
- Migration solutions locales (Ollama)

---

#### RISQ-F02 — Pricing IA change

**Catégorie :** Financier  
**Probabilité :** Élevé  
**Impact :** Moyen  
**Score :** 6 (Élevé × Moyen)  
**Propriétaire :** Utilisateur  
**Statut :** ✅ En mitigation

**Description :**
Pricing outils IA change (augmentation, suppression free tier).

**Signaux d'alerte :**
- Email fournisseur (changement conditions)
- News pricing (Twitter, blogs)

**Mitigation :**
- ✅ Veille pricing (mensuelle)
- ✅ Alternatives identifiées (Cline, Copilot)
- ✅ Budget buffer (+20%)

**Plan de repli :**
- Switch outil alternatif
- Négocier contrat enterprise

---

### 3.6 Résumé des risques

| ID | Titre | Catégorie | Prob. | Impact | Score | Statut |
|----|-------|-----------|-------|--------|-------|--------|
| RISQ-T01 | SQLite performance | Technique | Faible | Élevé | 3 | ✅ En mitigation |
| RISQ-T02 | Embeddings coût | Financier | Moyen | Moyen | 4 | ✅ En mitigation |
| RISQ-T03 | Playwright stabilité | Technique | Moyen | Élevé | 6 | ✅ En mitigation |
| RISQ-T04 | MCP compatibilité | Technique | Faible | Élevé | 3 | ✅ En mitigation |
| RISQ-T05 | Dérive des versions | Technique | Élevé | Moyen | 6 | ✅ En mitigation |
| RISQ-O01 | Scope creep | Opérationnel | Moyen | Moyen | 4 | ✅ En mitigation |
| RISQ-O02 | Retard planning | Opérationnel | Moyen | Moyen | 4 | ✅ En mitigation |
| RISQ-O03 | Compétences manquantes | Opérationnel | Faible | Élevé | 3 | ✅ En mitigation |
| RISQ-O04 | Burnout | Opérationnel | Faible | Élevé | 3 | ✅ En mitigation |
| RISQ-S01 | Fuite secrets | Sécurité | Faible | Critique | 4 | ✅ En mitigation |
| RISQ-S02 | Injection prompt | Sécurité | Moyen | Élevé | 6 | ✅ En mitigation |
| RISQ-S03 | Serveur MCP compromis | Sécurité | Faible | Critique | 4 | ✅ En mitigation |
| RISQ-F01 | Coûts API imprévus | Financier | Moyen | Moyen | 4 | ✅ En mitigation |
| RISQ-F02 | Pricing IA change | Financier | Élevé | Moyen | 6 | ✅ En mitigation |

**Score moyen :** 4.2/9  
**Risques critiques (score ≥ 6) :** 3 (RISQ-T03, RISQ-S02, RISQ-F02)  
**Tous risques en mitigation :** ✅

---

## 4. Matrice risques/décisions

### 4.1 Couverture décisions → risques

| Décision | Risques couverts |
|----------|------------------|
| ADR-001 (SQLite) | RISQ-T01 (performance) |
| ADR-002 (4 outils MCP) | RISQ-S03 (serveur compromis) |
| ADR-003 (Playwright) | RISQ-T03 (stabilité) |
| ADR-004 (Recherche hybride) | RISQ-T02 (embeddings coût) |
| ADR-005 (Architecture C) | RISQ-O01 (scope creep) |
| ADR-007 (4 niveaux sécurité) | RISQ-S01, RISQ-S02, RISQ-S03 |
| ADR-008 (Outils IA) | RISQ-F01, RISQ-F02 |
| ADR-011 (Baseline technique) | RISQ-T05 (dérive des versions) |

### 4.2 Risques non couverts

**Aucun risque majeur non couvert.**  
Tous les risques identifiés ont une décision associée ou une mitigation en place.

---

## 5. Propriétaires et responsabilités

### 5.1 Propriétaires décisions

| Rôle | Responsabilités |
|------|-----------------|
| **Product Owner (utilisateur)** | Valide décisions majeures, priorise requirements |
| **Développeur principal (agent + utilisateur)** | Implémente décisions, propose ADR |
| **Agent IA** | Recherche, analyse, documentation |

### 5.2 Propriétaires risques

| Risque | Propriétaire | Action |
|--------|--------------|--------|
| RISQ-T01 à T04 | Développeur principal | Mitigation technique |
| RISQ-O01 à O04 | Product Owner | Mitigation organisationnelle |
| RISQ-S01 à S03 | Développeur principal | Mitigation sécurité |
| RISQ-F01 à F02 | Product Owner | Mitigation financière |

---

## 6. Processus de changement

### 6.1 Proposition nouvelle décision

1. **Identification** : besoin ou problème identifié
2. **Analyse** : alternatives évaluées
3. **Proposition** : ADR rédigé (format section 2.1)
4. **Revue** : Product Owner valide
5. **Statut** : ADR marqué VALIDÉ
6. **Communication** : mise à jour documents liés

### 6.2 Réexamen décision existante

1. **Trigger** : condition réexamen atteinte (section "Conditions de réexamen")
2. **Analyse** : décision toujours valide ?
3. **Action** :
   - Si valide : statut inchangé
   - Si obsolète : statut → REMPLACÉ, nouvel ADR créé
4. **Communication** : mise à jour documents liés

### 6.3 Gestion nouveau risque

1. **Identification** : risque détecté (signal d'alerte)
2. **Évaluation** : probabilité, impact, score
3. **Mitigation** : plan d'action défini
4. **Suivi** : statut mis à jour régulièrement
5. **Résolution** : statut → Résolu si éliminé

---

## 7. Révision du registre

### 7.1 Fréquence révision

- ✅ **Mensuelle** : revue risques opérationnels (RISQ-O)
- ✅ **Trimestrielle** : revue risques techniques (RISQ-T)
- ✅ **Semestrielle** : revue risques sécurité (RISQ-S) et financiers (RISQ-F)
- ✅ **Annuelle** : audit complet registre

### 7.2 Prochaine révision

- **Mensuelle** : Novembre 2026
- **Trimestrielle** : Janvier 2027
- **Semestrielle** : Avril 2027
- **Annuelle** : Octobre 2027

---

## 8. Références

### 8.1 Documents sources

- Tous les bilans de phases (`BILAN_PHASE_XX.md`)
- `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md`
- `06-Security/11_MODELE_DE_MENACE.md`
- `07-Architecture-and-Roadmap/14_PLAN_MAINTENANCE_ET_VEILLE.md`

### 8.2 Standards

- **ADR format** : https://adr.github.io
- **Risk management** : ISO 31000
- **STRIDE** : https://learn.microsoft.com/en-us/threat-modeling/threat-modeling-tool-accelerate-dev-security#stride

---

**Document rédigé le 21 octobre 2026 — PARTIE I du projet EKTS**  
**Statut : ✅ Registre des décisions et risques**
