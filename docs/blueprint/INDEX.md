# INDEX — Engineering Knowledge & Tooling System (EKTS)

**Statut :** ✅ Terminé (Phases 00-14 terminées)  
**Date de dernière mise à jour :** 21 octobre 2026  
**Version du blueprint source :** 1.0 (21 octobre 2026)  
**Emplacement :** `docs/blueprint/INDEX.md` — les chemins `Docs/…` de ce document sont relatifs à `docs/blueprint/`. Le code (`src/`, `tests/`) et les audits (`docs/audit/`) sont à la racine du dépôt.

---

## 1. Présentation du projet

EKTS est un système personnel d'ingénierie augmenté par l'IA qui centralise et organise :
- **Connaissances** — méthodes, normes, tutoriels, décisions, notes
- **Ressources** — bibliothèques, composants, modèles, exemples, outils
- **Capacités exécutables** — scripts, services, CLI, API, outils MCP
- **Observation** — inspection de sites, captures, parcours utilisateur
- **Mémoire de projet** — contexte, décisions, résultats, leçons
- **Accès agentique** — interface standardisée pour agents IA (MCP)

**Proposition de valeur :** « Ne pas repartir de zéro : retrouver, comprendre, exécuter, vérifier et capitaliser sur ce qui a déjà été appris ou construit. »

---

## 2. Structure des dossiers

```
Engineering-Knowledge-Tooling-System/
│
├── INDEX.md                          ← Vous êtes ici
│
├── 00-Strategy/                      ← Cadrage et stratégie
│   ├── 00_AUDIT_CADRAGE.md           ✅ Analyse du blueprint
│   ├── 00_GLOSSAIRE_TECHNIQUE.md     ✅ Définitions des termes
│   └── 00_PLAN_DIRECTEUR_RECHERCHE.md ✅ Plan des 15 phases
│
├── 01-Foundations/                   ← Fondations techniques
│   ├── 01_FONDATIONS_ET_PREREQUIS.md    ✅ Terminé (Phase 01)
│   └── 01_PARCOURS_DAPPRENTISSAGE.md    ✅ Terminé (Phase 01)
│
├── 02-Agent-Integration/             ← Intégration agentique
│   ├── 02_MCP_ET_AGENTS.md              ✅ Terminé (Phase 02)
│   ├── 02_MATRICE_COMPATIBILITE_CLIENTS.md ✅ Terminé (Phase 02)
│   ├── 03_CONCEPTION_OUTILS_ET_SERVICES.md ✅ Terminé (Phase 03)
│   ├── 03_CONTRAT_STANDARD_OUTIL.md      ✅ Terminé (Phase 03)
│   ├── BILAN_PHASE_02.md                 ✅ Terminé (Phase 02)
│   └── BILAN_PHASE_03.md                 ✅ Terminé (Phase 03)
│
├── 03-Browser-and-Scraping/          ← Automatisation et extraction
│   ├── 04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md ✅ Terminé (Phase 04)
│   ├── 04_SPEC_INSPECTION_SITE.md           ✅ Terminé (Phase 04)
│   ├── 04_BENCHMARK_REPRODUCTIBLE.md        ✅ Terminé (Phase 04)
│   ├── BILAN_PHASE_04.md                    ✅ Terminé (Phase 04)
│   ├── 05_STRATEGIE_SCRAPING_RESPONSABLE.md ✅ Terminé (Phase 05)
│   ├── 05_MATRICE_METHODES_PAR_CAS.md       ✅ Terminé (Phase 05)
│   ├── BILAN_PHASE_05.md                    ✅ Terminé (Phase 05)
│   ├── 08_METHODE_ANALYSE_EXPERIENCE.md     ✅ Terminé (Phase 08)
│   ├── 08_SCHEMA_RAPPORT_INSPECTION.md      ✅ Terminé (Phase 08)
│   └── BILAN_PHASE_08.md                    ✅ Terminé (Phase 08)
│
├── 04-Knowledge/                     ← Stockage et recherche
│   ├── 06_ARCHITECTURE_STOCKAGE.md        ✅ Terminé (Phase 06)
│   ├── 06_MODELE_DONNEES.md               ✅ Terminé (Phase 06)
│   ├── 06_STRATEGIE_RECHERCHE.md          ✅ Terminé (Phase 06)
│   ├── BILAN_PHASE_06.md                  ✅ Terminé (Phase 06)
│   ├── 07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md ✅ Terminé (Phase 07)
│   └── 07_JEU_TEST_RECUPERATION.md        ✅ Terminé (Phase 07)
│
├── 05-Creative-Engineering/          ← Design, motion, 3D, capitalisation
│   ├── 09_TAXONOMIE_CREATIVE.md           ✅ Terminé (Phase 09)
│   ├── 09_CATALOGUE_OUTILS_ET_REFERENCES.md ✅ Terminé (Phase 09)
│   ├── 09_GOUVERNANCE_DES_COMPOSANTS.md   ✅ Terminé (Phase 09)
│   ├── BILAN_PHASE_09.md                  ✅ Terminé (Phase 09)
│   ├── 10_WORKFLOW_CAPITALISATION.md      ✅ Terminé (Phase 10)
│   ├── 10_TEMPLATE_POSTMORTEM_PROJET.md   ✅ Terminé (Phase 10)
│   └── BILAN_PHASE_10.md                  ✅ Terminé (Phase 10)
│
├── 06-Security/                      ← Sécurité et gouvernance
│   ├── 11_MODELE_DE_MENACE.md             ✅ Terminé (Phase 11)
│   ├── 11_POLITIQUE_PERMISSIONS_ET_SECURITE.md ✅ Terminé (Phase 11)
│   └── BILAN_PHASE_11.md                  ✅ Terminé (Phase 11)
│
├── 07-Architecture-and-Roadmap/      ← Architecture finale
│   ├── 12_COMPARATIF_AGENTS_IA.md         ✅ Terminé (Phase 12)
│   ├── 12_PLANS_GRATUITS_ET_ETUDIANTS.md  ✅ Terminé (Phase 12)
│   ├── 12_RECOMMANDATION_SELON_SCENARIOS.md ✅ Terminé (Phase 12)
│   ├── BILAN_PHASE_12.md                  ✅ Terminé (Phase 12)
│   ├── 13_ARCHITECTURES_CIBLES_COMPAREES.md ✅ Terminé (Phase 13)
│   ├── 13_SPECIFICATION_MVP.md            ✅ Terminé (Phase 13)
│   ├── 13_ROADMAP_IMPLEMENTATION.md       ✅ Terminé (Phase 13)
│   ├── 13_CRITERES_ACCEPTATION.md         ✅ Terminé (Phase 13)
│   ├── BILAN_PHASE_13.md                  ✅ Terminé (Phase 13)
│   ├── 14_AUDIT_COHERENCE_FINAL.md        ✅ Terminé (Phase 14)
│   ├── 14_PLAN_MAINTENANCE_ET_VEILLE.md   ✅ Terminé (Phase 14)
│   └── BILAN_PHASE_14.md                  ✅ Terminé (Phase 14)
│
└── Docs/                             ← Documentation consolidée
    ├── Référence/                        ✅ Ressources (DRI, HarnAI, Students, Human-Brilliance)
    └── roadmap/sprints/                  ✅ 48 dossiers de sprint (SPRINT-01 à SPRINT-12)
```

---

## 3. Ordre de lecture recommandé

### Pour découvrir le projet

1. **INDEX.md** (ce document) — vue d'ensemble
2. **00-Strategy/00_AUDIT_CADRAGE.md** — analyse du blueprint, points forts et lacunes
3. **00-Strategy/00_PLAN_DIRECTEUR_RECHERCHE.md** — plan des 15 phases

### Pour comprendre le vocabulaire

4. **00-Strategy/00_GLOSSAIRE_TECHNIQUE.md** — définitions des termes techniques

### Pour suivre l'avancement

5. Consulter les dossiers dans l'ordre des phases (01 → 14)
6. Vérifier le statut de chaque livrable (✅ terminé, 🔄 en cours, ⏳ à venir)

---

## 4. Statut des livrables

### Phase 00 — Cadrage ✅

| Fichier | Statut | Taille | Date |
|---------|--------|--------|------|
| 00_AUDIT_CADRAGE.md | ✅ Terminé | ~15 KB | 21 oct. 2026 |
| 00_GLOSSAIRE_TECHNIQUE.md | ✅ Terminé | ~12 KB | 21 oct. 2026 |
| 00_PLAN_DIRECTEUR_RECHERCHE.md | ✅ Terminé | ~18 KB | 21 oct. 2026 |

### Phase 01 — Fondations ✅

| Fichier | Statut | Taille | Date |
|---------|--------|--------|------|
| 01_FONDATIONS_ET_PREREQUIS.md | ✅ Terminé | ~18 KB | 21 oct. 2026 |
| 01_PARCOURS_DAPPRENTISSAGE.md | ✅ Terminé | ~14 KB | 21 oct. 2026 |

### Phases 02-14 — Terminées ✅

| Phase | Dossier | Livrables attendus | Statut |
|-------|---------|-------------------|--------|
| 02 | 02-Agent-Integration/ | Guide MCP + matrice clients | ✅ Terminé |
| 03 | 02-Agent-Integration/ | Conception outils + contrat standard | ✅ Terminé |
| 04 | 03-Browser-and-Scraping/ | Comparatif + spec inspection + benchmark | ✅ Terminé |
| 05 | 03-Browser-and-Scraping/ | Stratégie scraping + matrice méthodes | ✅ Terminé |
| 06 | 04-Knowledge/ | Architecture + modèle + recherche | ✅ Terminé |
| 07 | 04-Knowledge/ | 2 documents | ✅ Terminé |
| 08 | 03-Browser-and-Scraping/ | 2 documents + bilan | ✅ Terminé |
| 09 | 05-Creative-Engineering/ | 3 documents + bilan | ✅ Terminé |
| 10 | 05-Creative-Engineering/ | 2 documents + bilan | ✅ Terminé |
| 11 | 06-Security/ | 2 documents + bilan | ✅ Terminé |
| 12 | 07-Architecture-and-Roadmap/ | 3 documents + bilan | ✅ Terminé |
| 13 | 07-Architecture-and-Roadmap/ | 4 documents + bilan | ✅ Terminé |
| 14 | 07-Architecture-and-Roadmap/ | 2 documents + bilan | ✅ Terminé |

**Total :** 51 fichiers de phase — 37 livrables numérotés + 14 bilans ✅

---

## 5. Ressources antérieures intégrées

Le projet EKTS s'appuie sur des recherches antérieures intégrées dans `Docs/Référence/` :

| Ressource | Contenu | Couverture EKTS |
|-----------|---------|-----------------|
| **dri/** | 12 fichiers, 177 ressources gratuites | Domaine A (bibliothèque de connaissances) |
| **students/** | 6 fichiers, 54 services étudiants | Domaine A (ressources avec réductions) |
| **harnai/** | 17 fichiers, 28 outils harness IA | Domaine G (intégration agents, MCP) |
| **Human-Brilliance/** | 1 PDF, outils IA par domaine | Domaine E (design, motion, 3D) |
| **cartographie-creation-numerique.md** | ~140 KB, audit de 5 plateformes créatives | Domaine E (design, motion, 3D) |

Ces ressources seront intégrées progressivement dans les phases concernées (06, 09, 12).

---

## 6. Décisions prises

### Phase 00

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Réutiliser les recherches antérieures** | DRI, Students, HarnAI constituent une base solide | Gain de temps, pas de duplication |
| **Partir de la cartographie créative** | Le document existant couvre une partie du Domaine E | Base pour le catalogue créatif |
| **Adopter l'architecture en couches** | Cohérente et permet une implémentation progressive | Structure claire |
| **Séquencer les MVP** | MVP-1 → MVP-2 → MVP-3 → MVP-4 | Progression maîtrisée |

### Phase 01

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Parcours d'apprentissage en 6 niveaux** | Progression graduelle du débutant à l'expert | Formation structurée |
| **Flexibilité JavaScript/TypeScript** | Adaptation selon les besoins du projet | Pragmatisme |
| **6 projets fil rouge** | Contextualisation des apprentissages | Motivation et cohérence |

### Phase 02 — MCP et intégration agentique

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Spécification MCP 2026-07-28 comme référence** | Version la plus récente et stable | Base solide pour l'implémentation |
| **SDK TypeScript v2 comme choix principal** | Cohérence avec la stack, maturité, communauté | Implémentation efficace |
| **Transport stdio pour MVP** | Simple, sécurisé, local | Démarrage rapide |
| **Stratégie MCP hybride** | MCP pour outils à valeur agentique, CLI pour le reste | Pragmatisme, évite la sur-ingénierie |
| **4 outils MCP prioritaires pour MVP-1** | search, get, list, validate couvrent 80% des besoins | Focus sur la valeur |

### Phase 03 — Conception d'outils et services

| Décision | Justification | Impact |
|----------|---------------|--------|
| **5 principes de conception** | Single Responsibility, Explicit Over Implicit, Fail Fast, Idempotence, Least Privilege | Cohérence et qualité |
| **Architecture en 4 couches** | Interface → Validation → Business Logic → Infrastructure | Séparation des responsabilités |
| **5 patterns réutilisables** | Command, Pipeline, Result, Retry, Circuit Breaker | Résolution de problèmes récurrents |
| **Zod pour validation** | Type-safe, runtime validation, excellent DX | Validation robuste |
| **Pino pour logging** | Rapide, structuré, JSON, performant | Observabilité efficace |
| **Template de contrat obligatoire** | Garantie de documentation complète | Facilité d'utilisation et maintenance |
| **Architecture monorepo** | Packages locaux + services séparés selon besoin | Flexibilité et réutilisation |

### Phase 04 — Automatisation navigateur

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Playwright comme solution principale** | Score 96/100, MCP natif, multi-browser, performance | Base solide pour inspections |
| **Patchright comme option stealth** | Drop-in Playwright, passe Cloudflare/DataDome/Akamai | Sites protégés accessibles |
| **Playwright MCP pour intégration** | 70+ tools, accessibility tree, agents IA | Intégration agentique native |
| **4 niveaux d'inspection** | L1 (rapide) à L4 (exhaustive/crawling) | Flexibilité selon le besoin |
| **Workflow en 5 étapes** | Préparation, navigation, capture, analyse, stockage | Reproductibilité garantie |
| **10 tests de benchmark** | Cold start, navigation, L1-L3, parallélisme, mémoire, fiabilité | Monitoring continu |

### Phase 05 — Scraping responsable

| Décision | Justification | Impact |
|----------|---------------|--------|
| **5 principes éthiques** | Transparence, Respect, Minimisation, Légalité, Responsabilité | Cadre clair pour toutes les opérations |
| **Règle d'or : "public, non-personnel, autorisé"** | Synthèse des décisions hiQ, Van Buren, Meta v Bright Data | Ligne directrice simple |
| **Hiérarchie des méthodes** | API > Dataset > HTTP > Playwright > Patchright | Évite le scraping quand une alternative existe |
| **Compliance middleware** | Automatisation robots.txt, rate limiting, anonymisation | Conformité systématique |
| **LIA requis pour données personnelles** | GDPR Art 6, EDPB Guidelines 03/2026 | Couverture légale EU |
| **Pas de contournement CAPTCHA** | Éthique + légalité (CFAA, Computer Misuse Act) | Ligne rouge claire |
| **Patchright uniquement si justifié** | Site protégé + données publiques + pas d'alternative | Usage limité et documenté |

### Phase 06 — Stockage et connaissances

| Décision | Justification | Impact |
|----------|---------------|--------|
| **SQLite en mode WAL** | Performance 80x supérieure aux lectures simples, zéro overhead ops | Base simple et rapide |
| **FTS5 pour full-text** | Compétitif avec PostgreSQL tsvector, intégré à SQLite | Recherche mots-clés efficace |
| **sqlite-vec pour embeddings** | Suffisant pour <100K vectors, même fichier DB | RAG sans infrastructure supplémentaire |
| **Recherche hybride (FTS + Vector)** | RRF combine précision (FTS) et rappel (Vector) | Meilleure qualité de recherche |
| **Architecture 3 DB** | ekts.db (structuré), ekts-fts.db (texte), ekts-vectors.db (embeddings) | Séparation des préoccupations |
| **Compliance intégrée** | retention_until, anonymisation, audit_logs dans le schéma | GDPR-ready by design |
| **JSON pour configs/logs** | Simple, lisible, versionnable, pas de requêtes complexes | Flexibilité pour métadonnées |

### Phase 08 — Analyse de l'Expérience

| Décision | Justification | Impact |
|----------|---------------|--------|
| **5 dimensions d'analyse** | Performance, Accessibilité, SEO, UX, Contenu | Couverture complète sans redondance |
| **Matrice sévérité 3 axes** | Sévérité technique (0-4) × Fréquence (1-5) × Impact business (1-3) | Priorisation objective |
| **axe-core pour accessibilité** | Standard industrie, bien maintenu | Tests WCAG 2.2 AA fiables |
| **LLM pour insights** | GPT-4o-mini pour génération recommandations | Qualité analyse, coût maîtrisé |
| **Indexation RAG** | Chunks par insight et finding critique | Réutilisation connaissances passées |
| **Rapport structuré** | JSON + Markdown, schéma validé (Zod) | Interopérabilité et lisibilité |

### Phase 09 — Bibliothèque Créative

| Décision | Justification | Impact |
|----------|---------------|--------|
| **7 familles de ressources** | UI, Motion, 3D, Data Viz, Procédural, Math/Physique, Tests | Couverture complète sans redondance |
| **103+ ressources documentées** | Catalogue exhaustif avec licence, dépendances, maintenance | Base solide pour implémentation |
| **Documentation agent-exploitable** | Markdown + JSON machine-readable, MCP tool | Support agents IA |
| **Gouvernance en 5 piliers** | Ajout, validation, tests, maintenance, référence agent | Qualité et pérennité garanties |
| **Stack recommandée EKTS** | shadcn/ui + GSAP/Motion + Three.js/R3F + Recharts | Choix pragmatiques pour MVP |
| **Intégration RAG + MCP** | Indexation ressources + search_creative_resource | Recherche sémantique et exposition agents |

### Phase 10 — Capitalisation et Mémoire Technique

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Workflow en 8 étapes** | Collecte → Nettoyage secrets → Documentation → Vérification → Validation → Publication → Indexation → Dépréciation | Processus complet et reproductible |
| **Template post-mortem en 10 sections** | Informations, Objectifs, Timeline, Succès, Difficultés, Root cause, Dette technique, Leçons, Recommandations, Annexes | Capture exhaustive de l'expérience |
| **Gitleaks + TruffleHog** | Complémentaires (rapidité + vérification secrets actifs) | Sécurité maximale des artefacts |
| **git-filter-repo** | Recommandé par Git, plus sûr que filter-branch | Nettoyage historique fiable |
| **Approche hybride Git + SQLite + RAG** | Traçabilité Git + recherche SQLite + sémantique RAG | Meilleur des deux mondes |
| **Blameless post-mortem** | Focus sur apprentissage systémique | Culture d'amélioration continue |
| **5 pourquoi + Ishikawa** | Méthodes simples et efficaces pour root cause | Analyse causes profondes |
| **Dette technique tracée** | Inventaire + plan remboursement | Visibility et suivi |
| **Recommandations temporelles** | Immédiat (0-3 mois), court terme (3-6 mois), long terme (6-12 mois) | Priorisation claire |

### Phase 11 — Sécurité, Permissions et Gouvernance

| Décision | Justification | Impact |
|----------|---------------|--------|
| **4 niveaux de sécurité** | Progression réaliste MVP → Production | Contrôles proportionnés |
| **11 domaines de sécurité** | Couverture complète (moindre privilège → supply chain) | Sécurité exhaustive |
| **STRIDE adapté MCP** | Framework reconnu + spécificités MCP/agents IA | Menaces bien identifiées |
| **Default-deny network egress** | Fermer la plupart des routes d'exfiltration | Sécurité réseau maximale |
| **Firecracker pour Production** | Hardware isolation, ~125ms boot | Isolation strongest |
| **SBOM obligatoire Production** | CISA 2026 compliance, supply chain transparency | Visibilité dépendances |
| **Secret injection per-task** | Principe NVIDIA, éviter inherit full host environment | Secrets sécurisés |
| **Approval gates Production** | OWASP guidance, irreversible actions require human | Validation humaine |
| **LlamaFirewall pour prompt injection** | Input/output classifiers, défense en profondeur | Protection contre injections |

### Phase 14 — Audit Final et Plan de Maintenance

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Audit 9 dimensions validé** | Toutes les dimensions évaluées à 10/10 | Score global 100% (90/90) |
| **Décisions toutes sourcées** | Sources officielles, dates vérification, niveaux confiance | Traçabilité complète |
| **Coûts actuels (Oct 2026)** | Pricing pages vérifiées, re-vérification Avril 2027 | Pas de surprises budgétaires |
| **Interfaces compatibles** | Contrats TypeScript définis, MCP spec 2026-07-28 | Implémentation directe |
| **Risques tous couverts** | 38 vecteurs STRIDE, mitigations définies, 4 niveaux sécurité | Sécurité maximale |
| **Phases ordonnées** | Dépendances claires, pas de circularité | Progression logique |
| **Compétences réalistes** | Niveau intermédiaire max, acquisition 2h-16h | Formation continue |
| **Critères mesurables** | Recall@5≥0.75, latence<500ms, couverture>80% | Validation objective |
| **Doublons résolus** | Référencements explicites, ADR | Cohérence documentation |
| **Stratégie mise à jour définie** | Fréquences, responsabilités, processus, outils | Maintenance pérenne |
| **Budget maintenance 640h/an** | 0.4 ETP, $600/an, 10h/semaine | Réaliste et soutenable |
| **Veille technologique continue** | MCP (mensuel), benchmarks (trimestriel), outils IA (mensuel) | Innovation continue |

---

### Phase 13 — Architecture Cible, MVP et Roadmap

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Architecture C (Hybride) choisie** | Pragmatique, progressive, coût maîtrisé ($0 MVP) | Monolithe SQLite + services optionnels |
| **Séquence MVP validée** | MVP-1 → MVP-2 → MVP-3 (dépendances logiques) | Timeline 9 mois, 18 sprints |
| **SQLite WAL + FTS5 + sqlite-vec** | Simple, performant, portable, $0 | 3 bases séparées |
| **MCP stdio transport** | Local, sécurisé, compatible Tier 1 agents | 4 outils prioritaires |
| **Recherche hybride (FTS + Vector + RRF)** | Recall@5 ≥ 0.75, Faithfulness ≥ 0.80 | Meilleure qualité recherche |
| **Playwright pour inspection** | Score 96/100, MCP natif, multi-browser | 4 niveaux d'inspection |
| **Workflow capitalisation 8 étapes** | Processus complet, sécurité secrets | Gitleaks + TruffleHog |
| **Couverture tests > 80%** | Maintenabilité, qualité | Vitest + c8 |

---

### Phase 12 — Comparatif des outils IA, plans gratuits et offres étudiantes

| Décision | Justification | Impact |
|----------|---------------|--------|
| **Claude Code recommandé pour performance** | 80.8% SWE-bench, 1M tokens contexte, Agent Teams | Meilleure IA pour codebases complexes |
| **GitHub Copilot recommandé pour rapport qualité/prix** | $10/mois, multi-IDE, MCP natif, gratuit étudiant | ROI rapide, adoption facile |
| **Cline + BYOK pour confidentialité** | Open-source, multi-provider, modèles locaux | Contrôle total, zero retention possible |
| **MCP comme standard émergent** | Linux Foundation, 10+ agents Tier 1, 97M downloads/mois | Interopérabilité, futur-proof |
| **GitHub Student Pack priorisé** | 80+ outils gratuits, $2,000+/an de valeur | Maximisation gratuit pour étudiants |
| **Distinction Tier 1/2 MCP** | OAuth natif (Tier 1) vs bridge nécessaire (Tier 2) | Robustesse intégration |
| **Verrouillage fournisseur documenté** | 🔴 Élevé (Cursor, Codex), 🟡 Moyen, 🟢 Faible (Cline, Aider) | Choix éclairé selon tolérance au risque |

---

## 7. Questions ouvertes

### Questions bloquantes (à résoudre avant l'implémentation)

| # | Question | Phase de résolution | Statut |
|---|----------|---------------------|--------|
| Q1 | Quel stockage pour le MVP-1 ? | Phase 06 | ✅ Résolu (SQLite WAL + FTS5 + sqlite-vec) |
| Q2 | Quels outils exposer via MCP ? | Phase 02 | ✅ Résolu (4 outils prioritaires) |
| Q3 | Quelle méthode d'inspection navigateur ? | Phase 04 | ✅ Résolu (Playwright, 4 niveaux) |
| Q4 | Comment valider la qualité de la recherche ? | Phase 07 | ✅ Résolu (Recall@5≥0.75, Faithfulness≥0.80) |
| Q5 | Quels critères pour la capitalisation ? | Phase 10 | ✅ Résolu (workflow 8 étapes, template 10 sections) |

### Questions importantes (peuvent être résolues pendant l'implémentation)

| # | Question | Phase de résolution | Statut |
|---|----------|---------------------|--------|
| Q6 | Comment intégrer les documents Digital Experience ? | Phase 09 | ✅ Résolu (taxonomie en 7 familles, 103+ ressources) |
| Q7 | Quel niveau d'automatisation pour la capitalisation ? | Phase 10 | ✅ Résolu (8 étapes avec validation humaine) |
| Q8 | Comment gérer les secrets ? | Phase 11 | ✅ Résolu (4 niveaux sécurité, Vault Production) |
| Q9 | Quelle stratégie de sauvegarde ? | Phase 11 | ✅ Résolu (backups quotidiens, patch management) |
| Q10 | Comment mesurer la qualité des inspections ? | Phase 08 | ✅ Résolu (5 dimensions, matrice sévérité) |

### Questions résolues — Phase 12

| # | Question | Phase de résolution | Statut |
|---|----------|---------------------|--------|
| Q11 | Quels sont les meilleurs outils IA pour le développement ? | Phase 12 | ✅ Résolu (Claude Code, Copilot, Cursor) |
| Q12 | Quels outils sont gratuits pour étudiants ? | Phase 12 | ✅ Résolu (54 services, 39 éligibles Bénin) |
| Q13 | Quel meilleur rapport qualité/prix ? | Phase 12 | ✅ Résolu (Copilot Pro $10/mois) |
| Q14 | Comment garantir la confidentialité ? | Phase 12 | ✅ Résolu (Cline + BYOK, zero retention) |
| Q15 | Quels outils sont compatibles MCP ? | Phase 12 | ✅ Résolu (10+ agents Tier 1 OAuth natif) |
| Q16 | Quels risques de verrouillage fournisseur ? | Phase 12 | ✅ Résolu (3 niveaux documentés) |
| Q17 | Quels outils recommander pour EKTS ? | Phase 12 | ✅ Résolu (Copilot Pro + Claude Code Pro) |

### Questions résolues — Phase 13

| # | Question | Phase de résolution | Statut |
|---|----------|---------------------|--------|
| Q18 | Quelle architecture choisir ? | Phase 13 | ✅ Résolu (Architecture C Hybride) |
| Q19 | Quelle séquence MVP ? | Phase 13 | ✅ Résolu (MVP-1 → MVP-2 → MVP-3) |
| Q20 | Quel périmètre pour chaque MVP ? | Phase 13 | ✅ Résolu (inclus/reporté défini) |
| Q21 | Quels contrats entre composants ? | Phase 13 | ✅ Résolu (CLI ↔ Business Logic ↔ Data Layer ↔ MCP) |
| Q22 | Quels critères d'acceptation ? | Phase 13 | ✅ Résolu (Recall@5 ≥ 0.75, latence < 500ms, etc.) |
| Q23 | Quelle roadmap ? | Phase 13 | ✅ Résolu (18 sprints, 9 mois, jalons clairs) |

### Questions résolues — Phase 14

| # | Question | Phase de résolution | Statut |
|---|----------|---------------------|--------|
| Q24 | Les décisions sont-elles sourcées ? | Phase 14 | ✅ Résolu (toutes sourcées, 10/10) |
| Q25 | Les coûts et limites sont-ils actuels ? | Phase 14 | ✅ Résolu (Oct 2026, re-vérif Avril 2027) |
| Q26 | Les interfaces sont-elles compatibles ? | Phase 14 | ✅ Résolu (toutes compatibles, MCP spec) |
| Q27 | Les risques sont-ils couverts ? | Phase 14 | ✅ Résolu (38 vecteurs, 4 niveaux sécurité) |
| Q28 | Les phases sont-elles ordonnées ? | Phase 14 | ✅ Résolu (dépendances claires, pas de circularité) |
| Q29 | Les compétences requises sont-elles réalistes ? | Phase 14 | ✅ Résolu (niveau intermédiaire max) |
| Q30 | Les critères d'acceptation sont-ils mesurables ? | Phase 14 | ✅ Résolu (Recall@5, latence, couverture) |
| Q31 | Les doublons et contradictions sont-ils résolus ? | Phase 14 | ✅ Résolu (référencements explicites) |
| Q32 | La stratégie de mise à jour est-elle définie ? | Phase 14 | ✅ Résolu (fréquences, responsabilités, processus) |

---

## 8. Dépendances entre phases

```
Phase 00 (Cadrage) ✅
    │
    ├──→ Phase 01 (Fondations) ✅
    │        │
    │        └──→ Phase 02 (MCP) ✅ ──→ Phase 03 (Outils) ✅
    │
    ├──→ Phase 04 (Navigateur) ✅ ──→ Phase 08 (Analyse) ✅
    │        │
    │        └──→ Phase 05 (Scraping) ✅
    │
    ├──→ Phase 06 (Stockage) ✅ ──→ Phase 07 (RAG) ✅
    │
    ├──→ Phase 09 (Créatif) ✅ [dépend de 04, 05, 06, 07]
    │
    ├──→ Phase 10 (Capitalisation) ✅ [dépend de 09]
    │
    ├──→ Phase 11 (Sécurité) ✅ [peut commencer tôt]
    │
    ├──→ Phase 12 (Outils IA) ✅ [indépendant]
    │
    ├──→ Phase 13 (Architecture) ✅ [dépend de 00-12]
    │
    └──→ Phase 14 (Audit) ✅ [dépend de 13] — PROJET TERMINÉ
```

### Dépendances critiques

- **Phase 06 → Phase 07** : le choix du stockage impacte la stratégie de recherche
- **Phase 04 → Phase 08** : la méthode d'inspection impacte l'analyse visuelle
- **Phase 04 → Phase 05** : ✅ Résolu — Playwright comme base, scraping responsable défini
- **Phase 02 → Phase 03** : ✅ Résolu — la stratégie MCP et les principes de conception sont définis
- **Phase 13 → Phase 14** : l'architecture cible impacte l'audit final

---

## 9. Prochaine étape

**🎉 PROJET EKTS TERMINÉ — Toutes les phases (00-14) sont complétées**

**Prochaine étape : Implémentation MVP-1 (Mois 1-3)**

- **Objectif** : Démarrer l'implémentation du premier MVP (Bibliothèque locale, recherche, CLI, MCP)
- **Durée estimée** : 3 mois (12 sprints)
- **Livrables** :
  - Setup projet Node.js/TypeScript
  - Data Layer (SQLite WAL + FTS5 + sqlite-vec)
  - Knowledge Manager (CRUD)
  - Search Engine (hybride FTS + Vector + RRF)
  - CLI (7 commandes)
  - MCP Server (4 outils prioritaires)
- **Critères de succès** : Recall@5 ≥ 0.75, latence < 500ms, couverture tests > 80%

**Phase 14 — Audit Final et Maintenance** ✅

- **Objectif** : Audit de cohérence globale, plan de maintenance et veille
- **Durée estimée** : 1 semaine
- **Livrables** :
  - `07-Architecture-and-Roadmap/14_AUDIT_COHERENCE_FINAL.md` ✅ — Audit 9 dimensions (score 100%)
  - `07-Architecture-and-Roadmap/14_PLAN_MAINTENANCE_ET_VEILLE.md` ✅ — Plan maintenance complet
- **Décision prise** : Projet 100% cohérent, prêt pour implémentation. Plan maintenance défini (640h/an + $600/an). Veille technologique mensuelle/trimestrielle/semestrielle.

**Phase 13 — Architecture Cible, MVP et Roadmap** ✅

- **Objectif** : Définir l'architecture cible, spécifier les MVPs, créer la roadmap
- **Durée estimée** : 2 semaines
- **Livrables** :
  - `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md` ✅ — 3 architectures comparées, choix justifié
  - `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` ✅ — Périmètre MVP, contrats, ce qui est reporté
  - `07-Architecture-and-Roadmap/13_ROADMAP_IMPLEMENTATION.md` ✅ — 18 sprints, compétences, points de contrôle
  - `07-Architecture-and-Roadmap/13_CRITERES_ACCEPTATION.md` ✅ — Critères fonctionnels/non-fonctionnels, tests
  - `07-Architecture-and-Roadmap/BILAN_PHASE_13.md` ✅ — Bilan Phase 13
- **Décision prise** : Architecture C (Hybride) choisie, séquence MVP validée (MVP-1 → MVP-2 → MVP-3), timeline 9 mois, Recall@5 ≥ 0.75, latence < 500ms, couverture > 80%

**Phase 12 — Comparatif des Outils IA** ✅

- **Objectif** : Comparer les outils IA (LLMs, agents, frameworks), plans gratuits et offres étudiantes
- **Durée estimée** : 2 semaines
- **Livrables** :
  - `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md` ✅ — Matrice comparative (25+ outils, 9 critères)
  - `07-Architecture-and-Roadmap/12_PLANS_GRATUITS_ET_ETUDIANTS.md` ✅ — 54 services, 39 éligibles Bénin
  - `07-Architecture-and-Roadmap/12_RECOMMANDATION_SELON_SCENARIOS.md` ✅ — Guide de décision par profil
  - `07-Architecture-and-Roadmap/BILAN_PHASE_12.md` ✅ — Bilan Phase 12
- **Décision prise** : Top 3 outils recommandés (Claude Code, GitHub Copilot, Cline), MCP standard émergent confirmé, GitHub Student Pack priorisé, pricing Octobre 2026 vérifié, benchmarks SWE-bench/Terminal-Bench intégrés

**Phase 11 — Sécurité et Gouvernance** ✅

- **Objectif** : Définir les politiques de sécurité, gestion des secrets, et gouvernance du système
- **Durée estimée** : 1-2 semaines
- **Livrables** :
  - `06-Security/11_MODELE_DE_MENACE.md` ✅ — Modèle de menace EKTS (38 vecteurs d'attaque)
  - `06-Security/11_POLITIQUE_PERMISSIONS_ET_SECURITE.md` ✅ — Politique de sécurité (4 niveaux)
  - `06-Security/BILAN_PHASE_11.md` ✅ — Bilan Phase 11
- **Décision prise** : 4 niveaux de sécurité, 11 domaines couverts, STRIDE adapté MCP, default-deny network, Firecracker pour Production, SBOM obligatoire, secret injection per-task, approval gates, LlamaFirewall pour prompt injection

**Phase 10 — Capitalisation des Projets** ✅

- **Objectif** : Capitaliser les projets via workflow de clôture et post-mortems
- **Durée estimée** : 1-2 semaines
- **Livrables** :
  - `05-Creative-Engineering/10_WORKFLOW_CAPITALISATION.md` ✅ — Workflow en 8 étapes
  - `05-Creative-Engineering/10_TEMPLATE_POSTMORTEM_PROJET.md` ✅ — Template en 10 sections
  - `05-Creative-Engineering/BILAN_PHASE_10.md` ✅ — Bilan Phase 10
- **Décision prise** : Workflow complet (collecte → dépréciation), approche blameless, outils sécurité (Gitleaks + TruffleHog), approche hybride (Git + SQLite + RAG)

---

## 10. Crédits et sources

### Documents sources

- **Blueprint EKTS** : `Blueprint_Systeme_Ingenierie_IA.md` (v1.0, 21 octobre 2026)
- **Recherches antérieures** : `recherche/` (DRI, Students, HarnAI)
- **Cartographie créative** : `cartographie-creation-numerique.md` (5 octobre 2026)

### Méthodologie

- Recherche fondée sur des preuves (sources officielles, documentation, dépôts)
- Distinction fact vérifié / affirmation / inférence / recommandation
- Pas de développement prématuré (recherche d'abord, implémentation ensuite)
- Validation humaine à chaque phase

---

## 11. Contact et maintenance

**Responsable du projet :** [À définir]  
**Dernière mise à jour de l'INDEX :** 21 octobre 2026  
**Prochaine revue prévue :** Après la Phase 02

---

*Index créé le 21 octobre 2026 — Projet EKTS*
