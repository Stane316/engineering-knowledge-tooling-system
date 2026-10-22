# Plan Directeur de Recherche

**Statut :** ✅ Terminé  
**Date :** 21 octobre 2026  
**Version :** 1.0  
**Projet :** Engineering Knowledge & Tooling System (EKTS)

---

## 1. Vue d'ensemble

Ce document définit le plan de recherche en 15 phases pour transformer le blueprint EKTS en un plan d'architecture et d'implémentation exploitable. Chaque phase est autonome, produit des livrables vérifiables et permet de prendre des décisions structurantes.

### Organisation en lots

| Lot | Phases | Objectif | Durée estimée |
|-----|--------|----------|---------------|
| **Lot 1** | 01, 02, 03 | Fondations et intégration agentique | 2-3 semaines |
| **Lot 2** | 04, 05, 08 | Inspection navigateur et extraction | 2-3 semaines |
| **Lot 3** | 06, 07, 09 | Stockage, recherche et catalogue créatif | 2-3 semaines |
| **Lot 4** | 10, 11, 12 | Capitalisation, sécurité et outils IA | 2-3 semaines |
| **Lot 5** | 13, 14 | Architecture finale et audit | 1-2 semaines |

**Durée totale estimée :** 9-14 semaines

### Phases déjà terminées

- ✅ **Phase 00** : Audit du blueprint et cadrage (terminée le 21 octobre 2026)

---

## 2. Détail des phases

---

### Phase 01 — Fondations et parcours d'apprentissage

**Objectif :** Définir les prérequis techniques nécessaires et proposer un parcours d'apprentissage structuré pour un développeur qui veut comprendre et maîtriser les technologies avant de construire EKTS.

**Questions clés :**
- Quelles sont les compétences minimales requises pour chaque couche du système ?
- Quel est l'ordre d'apprentissage optimal ?
- Quelles ressources gratuites et vérifiées permettent d'acquérir ces compétences ?
- Comment valider la maîtrise de chaque notion ?

**Sources à privilégier :**
- Documentation officielle Node.js, npm, TypeScript
- Cours gratuits vérifiés (MDN, freeCodeCamp, Node.js official guides)
- Exercices pratiques et mini-projets

**Livrables :**
- `01-Foundations/01_FONDATIONS_ET_PREREQUIS.md` — Liste des compétences nécessaires par niveau
- `01-Foundations/01_PARCOURS_DAPPRENTISSAGE.md` — Parcours structuré avec ressources et exercices

**Critères de sortie :**
- Compétences listées et ordonnées
- Ressources gratuites identifiées et vérifiées
- Exercices de validation proposés
- Durée estimée pour chaque niveau

**Décisions possibles :**
- Validation du parcours d'apprentissage
- Identification des lacunes à combler avant de commencer l'implémentation

**Effort :** Moyen

---

### Phase 02 — MCP et intégration agentique

**Objectif :** Comprendre en profondeur le protocole MCP, ses capacités, ses limites, et définir une stratégie d'intégration pour EKTS.

**Questions clés :**
- Quelles sont les capacités réelles de MCP (tools, resources, prompts, transports) ?
- Quels clients sont compatibles et comment configurer chacun ?
- Quand utiliser MCP vs CLI vs API ?
- Quels outils EKTS ont une vraie valeur agentique via MCP ?
- Comment tester et valider un serveur MCP ?

**Sources à privilégier :**
- Spécification officielle MCP : https://modelcontextprotocol.io/
- Dépôts officiels SDK (TypeScript, Python)
- Documentation des clients (Claude Code, Codex, etc.)
- Exemples et patterns communautaires

**Livrables :**
- `02-Agent-Integration/02_MCP_ET_AGENTS.md` — Guide complet MCP (spécification, implementation, tests)
- `02-Agent-Integration/02_MATRICE_COMPATIBILITE_CLIENTS.md` — Compatibilité des clients MCP

**Critères de sortie :**
- Spécification MCP comprise et documentée
- Matrice de compatibilité des clients remplie
- Règle de décision MCP vs CLI vs API définie
- Exemple de serveur MCP minimal fonctionnel

**Décisions possibles :**
- Stratégie MCP (systématique vs ciblé)
- Liste des outils à exposer via MCP
- Choix du SDK (TypeScript vs Python)

**Effort :** Élevé

---

### Phase 03 — Conception d'outils et services

**Objectif :** Définir un contrat standard pour les outils EKTS (CLI, API, MCP) et établir des patterns de conception réutilisables.

**Questions clés :**
- Quelle est la structure minimale d'un outil EKTS ?
- Comment gérer les entrées, sorties, erreurs, logs, validation ?
- Comment versionner et documenter un outil ?
- Quand créer un service séparé vs garder un module local ?

**Sources à privilégier :**
- Patterns de conception CLI (Command pattern, options parsing)
- Bonnes pratiques API REST
- Documentation des outils existants (Playwright CLI, gh, etc.)

**Livrables :**
- `02-Agent-Integration/03_CONCEPTION_OUTILS_ET_SERVICES.md` — Guide de conception d'outils
- `02-Agent-Integration/03_CONTRAT_STANDARD_OUTIL.md` — Template de contrat d'outil

**Critères de sortie :**
- Contrat standard défini (entrées, sorties, erreurs, logs, docs)
- Patterns de conception identifiés
- Exemples d'outils conformes au contrat
- Checklist de revue d'outil

**Décisions possibles :**
- Adoption du contrat standard
- Outils prioritaires à implémenter

**Effort :** Moyen

---

### Phase 04 — Automatisation de navigateur

**Objectif :** Comparer les solutions d'automatisation de navigateur et définir une stratégie pour l'inspection de sites dans EKTS.

**Questions clés :**
- Playwright vs Puppeteer vs Selenium : quel choix pour EKTS ?
- Comment capturer des pages de manière fiable et reproductible ?
- Comment gérer les états dynamiques, les timeouts, les erreurs ?
- Quelles sont les limites (RAM, CPU, stabilité) ?
- Comment exposer ces capacités via CLI/API/MCP ?

**Sources à privilégier :**
- Documentation officielle Playwright, Puppeteer
- Benchmarks communautaires
- Articles techniques sur la stabilité et la performance
- Tests pratiques sur des sites variés

**Livrables :**
- `03-Browser-and-Scraping/04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md` — Comparaison technique
- `03-Browser-and-Scraping/04_SPEC_INSPECTION_SITE.md` — Spécification d'un workflow d'inspection
- `03-Browser-and-Scraping/04_BENCHMARK_REPRODUCTIBLE.md` — Protocole de benchmark

**Critères de sortie :**
- Comparatif documenté avec preuves
- Choix de l'outil justifié
- Workflow d'inspection défini
- Benchmark reproductible proposé

**Décisions possibles :**
- Choix de l'outil d'automatisation
- Stratégie de capture (viewport, full page, éléments)
- Limites de volume et durée

**Effort :** Élevé

---

### Phase 05 — Scraping responsable

**Objectif :** Définir une stratégie de scraping et crawling conforme, efficace et durable pour EKTS.

**Questions clés :**
- Quelle méthode pour quel cas (HTTP, navigateur, API) ?
- Comment respecter les conditions d'utilisation et robots.txt ?
- Comment gérer les limites de débit, les erreurs, les retries ?
- Comment extraire des données structurées de manière fiable ?

**Sources à privilégier :**
- Documentation des bibliothèques de parsing (cheerio, BeautifulSoup)
- Guides de scraping responsable
- Conditions d'utilisation des sites cibles
- Articles sur les bonnes pratiques

**Livrables :**
- `03-Browser-and-Scraping/05_STRATEGIE_SCRAPING_RESPONSABLE.md` — Guide de scraping
- `03-Browser-and-Scraping/05_MATRICE_METHODES_PAR_CAS.md` — Matrice de décision

**Critères de sortie :**
- Checklist de conformité définie
- Matrice méthode/cas remplie
- Patterns de scraping documentés
- Gestion des erreurs et retries définie

**Décisions possibles :**
- Bibliothèques à utiliser
- Limites de débit et volumes
- Domains autorisés

**Effort :** Moyen

---

### Phase 06 — Architecture des connaissances

**Objectif :** Définir l'architecture de stockage pour la base de connaissances EKTS.

**Questions clés :**
- Fichiers + Git vs SQLite vs PostgreSQL : quel choix pour le MVP ?
- Comment modéliser les ressources, métadonnées, relations ?
- Comment gérer la provenance, les versions, la dépréciation ?
- Comment assurer la sauvegarde, l'export, la migration ?

**Sources à privilégier :**
- Documentation SQLite, PostgreSQL
- Patterns de modélisation de données
- Articles sur la gestion de connaissances
- Expériences communautaires (Obsidian, Notion, etc.)

**Livrables :**
- `04-Knowledge/06_ARCHITECTURE_CONNAISSANCES.md` — Architecture de stockage
- `04-Knowledge/06_MODELE_DONNEES.md` — Modèle de données
- `04-Knowledge/06_STRATEGIE_RECHERCHE.md` — Stratégie de recherche

**Critères de sortie :**
- Choix de stockage justifié
- Modèle de données défini
- Stratégie de sauvegarde proposée
- Critères de migration définis

**Décisions possibles :**
- Choix du stockage principal
- Structure des métadonnées
- Stratégie de backup

**Effort :** Élevé

---

### Phase 07 — RAG et recherche sémantique

**Objectif :** Évaluer la pertinence du RAG et de la recherche sémantique pour EKTS, et définir une stratégie de recherche.

**Questions clés :**
- La recherche textuelle suffit-elle pour le MVP ?
- Quand le RAG apporte-t-il un bénéfice net ?
- Comment mesurer la qualité de la recherche ?
- Quels outils pour l'indexation et la recherche vectorielle ?

**Sources à privilégier :**
- Documentation Qdrant, ChromaDB, pgvector
- Articles sur le RAG et les embeddings
- Benchmarks de qualité de recherche
- Expériences communautaires

**Livrables :**
- `04-Knowledge/07_ETUDE_RAG_ET_RECHERCHE_SEMANTIQUE.md` — Étude comparative
- `04-Knowledge/07_JEU_TEST_RECUPERATION.md` — Jeu de test et résultats

**Critères de sortie :**
- Jeu de test défini (questions réalistes)
- Comparaison textuelle vs RAG documentée
- Recommandation justifiée
- Coût/bénéfice évalué

**Décisions possibles :**
- Stratégie de recherche (textuelle, hybride, RAG)
- Outils d'indexation
- Critères d'adoption du RAG

**Effort :** Moyen

---

### Phase 08 — Analyse visuelle et reverse engineering UX

**Objectif :** Définir une méthode d'analyse visuelle et d'inspection UX pour EKTS.

**Questions clés :**
- Comment analyser un site sans prétendre connaître son code source ?
- Comment distinguer observation, inférence et inconnu ?
- Comment produire des rapports reproductibles ?
- Comment comparer des captures et détecter des différences ?

**Sources à privilégier :**
- Documentation Playwright (captures, traces)
- Outils de comparaison d'images (pixelmatch, etc.)
- Méthodes d'analyse UX
- Articles sur le reverse engineering éthique

**Livrables :**
- `03-Browser-and-Scraping/08_METHODE_ANALYSE_EXPERIENCE.md` — Méthode d'analyse
- `03-Browser-and-Scraping/08_SCHEMA_RAPPORT_INSPECTION.md` — Template de rapport

**Critères de sortie :**
- Méthode d'analyse définie
- Template de rapport proposé
- Outils de comparaison identifiés
- Règles de distinction observation/inférence

**Décisions possibles :**
- Adoption de la méthode
- Outils de comparaison
- Niveau de détail des rapports

**Effort :** Moyen

---

### Phase 09 — Bibliothèque créative

**Objectif :** Construire le catalogue créatif EKTS en intégrant les recherches antérieures et en identifiant les lacunes.

**Questions clés :**
- Comment intégrer la cartographie créative existante ?
- Comment articuler avec les documents Digital Experience ?
- Quels outils et ressources ajouter ?
- Comment gouverner le catalogue (contributions, validations, dépréciations) ?

**Sources à privilégier :**
- `cartographie-creation-numerique.md` (existant)
- Documents Digital Experience (si disponibles)
- Dépôts officiels des bibliothèques créatives
- Documentation des outils (Three.js, R3F, shaders, etc.)

**Livrables :**
- `05-Creative-Engineering/09_TAXONOMIE_CREATIVE.md` — Taxonomie des domaines créatifs
- `05-Creative-Engineering/09_CATALOGUE_OUTILS_ET_REFERENCES.md` — Catalogue d'outils
- `05-Creative-Engineering/09_GOUVERNANCE_DES_COMPOSANTS.md` — Gouvernance

**Critères de sortie :**
- Taxonomie définie
- Catalogue initial construit
- Règles de gouvernance proposées
- Lacunes identifiées

**Décisions possibles :**
- Structure du catalogue
- Outils prioritaires à documenter
- Règles de contribution

**Effort :** Moyen

---

### Phase 10 — Capitalisation des projets

**Objectif :** Définir le workflow de capitalisation pour transformer les projets terminés en ressources réutilisables.

**Questions clés :**
- Quels artefacts conserver ?
- Comment nettoyer les secrets et données sensibles ?
- Comment documenter les choix et limites ?
- Comment valider et indexer une ressource ?

**Sources à privilégier :**
- Bonnes pratiques de postmortem
- Outils de nettoyage de secrets (git-secrets, trufflehog)
- Templates de documentation de projet
- Expériences communautaires

**Livrables :**
- `05-Creative-Engineering/10_WORKFLOW_CAPITALISATION.md` — Workflow complet
- `05-Creative-Engineering/10_TEMPLATE_POSTMORTEM_PROJET.md` — Template de postmortem

**Critères de sortie :**
- Workflow défini et documenté
- Template de postmortem proposé
- Checklist de nettoyage définie
- Critères de validation établis

**Décisions possibles :**
- Adoption du workflow
- Niveau d'automatisation
- Outils de nettoyage

**Effort :** Moyen

---

### Phase 11 — Sécurité et gouvernance

**Objectif :** Définir le modèle de menace et les politiques de sécurité pour EKTS.

**Questions clés :**
- Quels sont les risques principaux ?
- Comment appliquer le moindre privilège ?
- Comment gérer les secrets et données sensibles ?
- Comment prévenir le prompt injection ?
- Comment journaliser et auditer ?

**Sources à privilégier :**
- Guides de sécurité OWASP
- Documentation sur le prompt injection
- Bonnes pratiques de gestion des secrets
- Modèles de menace (STRIDE, etc.)

**Livrables :**
- `06-Security/11_MODELE_DE_MENACE.md` — Modèle de menace
- `06-Security/11_POLITIQUE_PERMISSIONS_ET_SECURITE.md` — Politique de sécurité

**Critères de sortie :**
- Modèle de menace défini
- Politiques de sécurité proposées
- Checklist de sécurité établie
- Plan de gestion des secrets défini

**Décisions possibles :**
- Niveau de sécurité requis
- Outils de gestion des secrets
- Politiques de permissions

**Effort :** Élevé

---

### Phase 12 — Comparatif des outils IA

**Objectif :** Comparer les outils IA et agents compatibles avec EKTS, en intégrant les recherches antérieures (HarnAI, Students).

**Questions clés :**
- Quels agents sont compatibles MCP ?
- Quels sont les coûts, quotas, limites ?
- Quels sont les plans étudiants disponibles ?
- Quelle recommandation selon les scénarios ?

**Sources à privilégier :**
- `recherche/harnai/` (existant)
- `recherche/students/` (existant)
- Documentation officielle des agents
- Pages de tarifs et plans

**Livrables :**
- `07-Architecture-and-Roadmap/12_COMPARATIF_AGENTS_IA.md` — Comparatif
- `07-Architecture-and-Roadmap/12_PLANS_GRATUITS_ET_ETUDIANTS.md` — Plans gratuits
- `07-Architecture-and-Roadmap/12_RECOMMANDATION_SELON_SCENARIOS.md` — Recommandations

**Critères de sortie :**
- Matrice de comparaison remplie
- Plans étudiants vérifiés
- Recommandations justifiées
- Coûts et limites documentés

**Décisions possibles :**
- Choix des agents à intégrer
- Stratégie de coûts
- Plans étudiants à exploiter

**Effort :** Moyen

---

### Phase 13 — Architecture cible et MVP

**Objectif :** Définir l'architecture cible d'EKTS et spécifier le MVP-1.

**Questions clés :**
- Quelle architecture parmi les options évaluées ?
- Quel périmètre pour le MVP-1 ?
- Quels sont les critères d'acceptation ?
- Quelle roadmap d'implémentation ?

**Sources à privilégier :**
- Résultats des phases précédentes
- Blueprint EKTS
- Patterns d'architecture logicielle
- Expériences communautaires

**Livrables :**
- `07-Architecture-and-Roadmap/13_ARCHITECTURES_CIBLES_COMPAREES.md` — Comparaison d'architectures
- `07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` — Spécification MVP-1
- `07-Architecture-and-Roadmap/13_ROADMAP_IMPLEMENTATION.md` — Roadmap
- `07-Architecture-and-Roadmap/13_CRITERES_ACCEPTATION.md` — Critères d'acceptation

**Critères de sortie :**
- Architecture cible choisie et justifiée
- MVP-1 spécifié
- Roadmap définie
- Critères d'acceptation mesurables

**Décisions possibles :**
- Adoption de l'architecture
- Validation du MVP-1
- Lancement de l'implémentation

**Effort :** Élevé

---

### Phase 14 — Audit final et plan de maintenance

**Objectif :** Vérifier la cohérence de tous les livrables et définir un plan de maintenance.

**Questions clés :**
- Toutes les décisions sont-elles sourcées ?
- Les interfaces sont-elles compatibles ?
- Les risques sont-ils couverts ?
- Comment maintenir et faire évoluer EKTS ?

**Sources à privilégier :**
- Tous les livrables des phases précédentes
- Documentation de maintenance
- Plans de veille technologique

**Livrables :**
- `07-Architecture-and-Roadmap/14_AUDIT_COHERENCE_FINAL.md` — Audit de cohérence
- `07-Architecture-and-Roadmap/14_PLAN_MAINTENANCE_ET_VEILLE.md` — Plan de maintenance
- `INDEX.md` — Index général du projet

**Critères de sortie :**
- Audit de cohérence validé
- Plan de maintenance défini
- Index général créé
- Toutes les phases vérifiées

**Décisions possibles :**
- Validation finale du projet
- Lancement de l'implémentation
- Priorités de maintenance

**Effort :** Moyen

---

## 3. Matrice des dépendances

```
Phase 00 (Cadrage) ✅
    │
    ├──→ Phase 01 (Fondations)
    │        │
    │        └──→ Phase 02 (MCP) ──→ Phase 03 (Outils)
    │
    ├──→ Phase 04 (Navigateur) ──→ Phase 08 (Analyse)
    │        │
    │        └──→ Phase 05 (Scraping)
    │
    ├──→ Phase 06 (Stockage) ──→ Phase 07 (RAG)
    │
    ├──→ Phase 09 (Créatif) [indépendant]
    │
    ├──→ Phase 10 (Capitalisation)
    │
    ├──→ Phase 11 (Sécurité) [peut commencer tôt]
    │
    ├──→ Phase 12 (Outils IA) [indépendant]
    │
    └──→ Phase 13 (Architecture) ──→ Phase 14 (Audit final)
```

### Dépendances critiques

- **Phase 06 → Phase 07** : le choix du stockage impacte la stratégie de recherche
- **Phase 04 → Phase 08** : la méthode d'inspection impacte l'analyse visuelle
- **Phase 02 → Phase 03** : la stratégie MCP impacte la conception des outils
- **Phase 13 → Phase 14** : l'architecture cible impacte l'audit final

### Phases indépendantes

- Phase 01, 09, 11, 12 peuvent être menées en parallèle

---

## 4. Gestion des risques

### Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Surarchitecture précoce | Élevée | Élevé | Commencer par MVP-1, résister à la tentation d'ajouter des features |
| Recherche inutile | Moyenne | Moyen | Réutiliser les travaux antérieurs (DRI, Students, HarnAI, cartographie créative) |
| Dépendance à un fournisseur | Moyenne | Élevé | Interfaces séparées, formats exportables, tests multi-fournisseurs |
| Scraping non conforme | Faible | Très élevé | Checklist de conformité, limites strictes, journalisation |
| Fuite de secrets | Faible | Très élevé | Nettoyage systématique, gestion dédiée des secrets |
| MCP partout | Moyenne | Moyen | Règle de décision claire, coût/bénéfice par cas d'usage |
| Bibliothèque qui se dégrade | Élevée | Élevé | Vérification périodique des liens, dépréciation, revue humaine |
| Complexité opérationnelle | Moyenne | Élevé | Commencer simple (fichiers, CLI), ajouter de la complexité si nécessaire |

### Stratégie de mitigation

1. **Phases courtes et vérifiables** : chaque phase produit des livrables concrets
2. **Points de contrôle** : validation humaine à la fin de chaque phase
3. **Réutilisation maximale** : ne pas refaire ce qui existe déjà
4. **Simplicité d'abord** : commencer par le MVP, ajouter de la complexité si nécessaire
5. **Documentation continue** : documenter les décisions et leurs justifications

---

## 5. Ressources antérieures exploitables

| Ressource | Couverture EKTS | Réutilisation |
|-----------|-----------------|---------------|
| **recherche/dri/** (12 docs, 177 ressources) | Domaine A (bibliothèque de connaissances) | ✅ Directe : importer dans EKTS |
| **recherche/students/** (3 docs, 54 services) | Domaine A (ressources avec réductions) | ✅ Directe : importer dans EKTS |
| **recherche/harnai/** (9 docs, 28 outils) | Domaine G (intégration agents) | ✅ Partielle : section MCP et agents |
| **cartographie-creation-numerique.md** (141 KB) | Domaine E (design, motion, 3D) | ✅ Directe : base pour le catalogue créatif |
| **inventaire/** (3 fichiers) | Domaine E (bibliothèque créative) | ✅ Directe : inventaire de composants |
| **data/** (21 fichiers JSON) | Méta-données pour EKTS | ⚠️ À nettoyer et indexer |

---

## 6. Critères de réussite globaux

Le projet de recherche sera considéré comme réussi si :

1. **Toutes les phases sont terminées** avec des livrables vérifiables
2. **Les décisions sont sourcées** et justifiées
3. **Les interfaces sont compatibles** entre les composants
4. **Les risques sont couverts** par des politiques de sécurité
5. **Le MVP-1 est spécifié** avec des critères d'acceptation mesurables
6. **La roadmap est réaliste** et ordonnée
7. **Les compétences requises sont identifiées** et un parcours d'apprentissage proposé
8. **Les ressources antérieures sont intégrées** sans duplication

---

## 7. Prochaine étape

**Phase 01 — Fondations et parcours d'apprentissage**

- **Objectif** : définir les prérequis techniques et proposer un parcours structuré
- **Durée estimée** : 1 semaine
- **Livrables** : 2 documents (fondations + parcours)
- **Décision attendue** : validation du parcours d'apprentissage

---

*Plan directeur validé le 21 octobre 2026*
