# Phase 00 — Audit du Blueprint et Cadrage

**Statut :** ✅ Terminé  
**Date de recherche :** 21 octobre 2026  
**Document source :** `Blueprint_Systeme_Ingenierie_IA.md` (v1.0, 21 octobre 2026)  
**Documents antérieurs consultés :**
- `recherche/` — 28 fichiers (DRI 00-11, Students 12-14, HarnAI 15-23)
- `data/` — 21 fichiers JSON (GitHub, npm, students, harnai)
- `cartographie-creation-numerique.md` — 141 KB, audit complet de 5 plateformes créatives
- `inventaire/` — 3 fichiers (bklit-ui-registry, motion, react-bits-free)

---

## 1. Objectif et périmètre

### Objectif
Transformer le blueprint EKTS (Engineering Knowledge & Tooling System) en un plan de recherche structuré et exploitable, en identifiant :
- Ce qui est clairement défini
- Ce qui nécessite des recherches complémentaires
- Ce qui constitue des hypothèses à valider
- Les dépendances et risques majeurs

### Périmètre de l'audit
- Analyse du blueprint lui-même (cohérence, complétude, faisabilité)
- Inventaire des recherches antérieures disponibles
- Identification des ressources existantes réutilisables
- Définition du vocabulaire technique commun
- Registre des questions ouvertes

---

## 2. Résumé exécutif

### 2.1 Points forts du blueprint

1. **Vision claire et problématisée** : le document identifie précisément le problème (perte de temps à retrouver/reconstruire) et la proposition de valeur (« ne pas repartir de zéro »).

2. **Principes de conception solides** : les 10 principes (réutiliser avant reconstruire, connaissance vérifiable, outils composables, humain responsable, etc.) constituent un cadre décisionnel robuste.

3. **Architecture en couches bien pensée** : la séparation Interface → CLI → Adaptateur MCP → Orchestrateur → Services → Stockage → Gouvernance permet une évolution progressive.

4. **MVP réaliste et séquencé** : les 4 MVP (bibliothèque + recherche → inspection navigateur → capitalisation → analyse avancée) montrent une progression maîtrisée.

5. **Honnêteté intellectuelle** : le blueprint distingue explicitement « vision rapportée », « proposition d'architecture » et « à vérifier ». Il ne prétend pas connaître l'outil de référence.

6. **Compétences ordonnées** : les 6 niveaux (fondations → outils → intégration agentique → recherche → système robuste → capacités spécialisées) permettent un apprentissage progressif.

### 2.2 Lacunes et zones d'ombre identifiées

1. **Absence de métriques de baseline** : le blueprint propose 10 indicateurs de réussite (§11) mais ne définit pas de valeurs cibles ni de méthode de mesure initiale.

2. **Architecture de stockage sous-spécifiée** : la section §4.10 mentionne SQLite/PostgreSQL/files mais ne précise pas les critères de choix (volume, requêtes, concurrence, backup).

3. **MCP vs CLI/API : règle de décision insuffisante** : le blueprint dit « utiliser MCP quand un agent doit découvrir des capacités » mais ne donne pas de grille d'arbitrage pour les cas limites.

4. **Scraping responsable : principes mais pas de procédure** : la section §4.6 énonce des règles (respecter robots.txt, limiter le débit) mais ne fournit pas de checklist opérationnelle.

5. **Capitalisation : workflow décrit mais pas outillé** : la section §9 décrit le cycle de vie mais ne précise pas les outils de nettoyage, validation et indexation.

6. **Sécurité : mentionnée mais pas approfondie** : la section §4.5 et le Domaine H listent des principes mais ne proposent pas de modèle de menace concret.

7. **Recherche sémantique/RAG : position prudente mais non tranchée** : le blueprint recommande de « commencer par du textuel » et d'évaluer le RAG « si nécessaire », mais ne définit pas les critères de décision.

8. **Documents Digital Experience : référencés mais non intégrés** : le blueprint mentionne 3 documents (Design System, UX & Quality, 3D & Motion Engineering) mais ne précise pas comment ils s'articulent avec EKTS.

### 2.3 Ressources antérieures exploitables

| Ressource | Contenu | Couverture EKTS | Réutilisation |
|-----------|---------|-----------------|---------------|
| **recherche/dri/** (12 docs, 177 ressources) | Ressources numériques gratuites | Domaine A (bibliothèque de connaissances) | ✅ Directe : importer dans EKTS |
| **recherche/students/** (3 docs, 54 services) | Plans étudiants | Domaine A (ressources avec réductions) | ✅ Directe : importer dans EKTS |
| **recherche/harnai/** (9 docs, 28 outils) | Écosystèmes harness IA + MCP | Domaine G (intégration agents) | ✅ Partielle : section MCP et agents |
| **cartographie-creation-numerique.md** (141 KB) | Audit de 5 plateformes créatives | Domaine E (design, motion, 3D) | ✅ Directe : base pour le catalogue créatif |
| **inventaire/** (3 fichiers) | Composants React Bits, Bklit UI, Motion | Domaine E (bibliothèque créative) | ✅ Directe : inventaire de composants |
| **data/** (21 fichiers JSON) | Données brutes (GitHub, npm, etc.) | Méta-données pour EKTS | ⚠️ À nettoyer et indexer |

### 2.4 Décisions qui peuvent être prises maintenant

1. **Réutiliser les recherches antérieures** : les 3 projets (DRI, Students, HarnAI) constituent une base solide pour le Domaine A (bibliothèque de connaissances). Pas besoin de refaire ces recherches.

2. **Partir de la cartographie créative** : le document `cartographie-creation-numerique.md` couvre déjà une partie du Domaine E. Il peut servir de base pour le catalogue créatif.

3. **Adopter la structure en couches du blueprint** : l'architecture proposée est cohérente et permet une implémentation progressive.

4. **Séquencer les MVP comme proposé** : MVP-1 (bibliothèque + recherche) → MVP-2 (inspection navigateur) → MVP-3 (capitalisation) → MVP-4 (analyse avancée).

### 2.5 Décisions qui doivent attendre la recherche

1. **Choix du stockage principal** : fichiers vs SQLite vs PostgreSQL dépend du volume, des requêtes et de la concurrence (Phase 06).

2. **MCP systématique vs ciblé** : nécessite une analyse des cas d'usage et des coûts/bénéfices (Phase 02).

3. **Recherche textuelle seule vs hybride** : nécessite des tests sur un jeu de questions réel (Phase 07).

4. **Playwright vs Puppeteer vs Selenium** : nécessite une comparaison technique et opérationnelle (Phase 04).

5. **Niveau d'automatisation de la capitalisation** : nécessite une définition des critères de validation (Phase 10).

---

## 3. Hypothèses et risques

### 3.1 Hypothèses à valider

| # | Hypothèse | Méthode de validation | Phase |
|---|-----------|----------------------|-------|
| H1 | Les ressources DRI/Students/HarnAI sont encore valides et à jour | Vérifier les URLs et les prix | 01 |
| H2 | La cartographie créative couvre les besoins du Domaine E | Comparer avec les 3 documents Digital Experience | 09 |
| H3 | Un stockage fichier + Git suffit pour le MVP-1 | Prototype et tests de charge | 06 |
| H4 | La recherche textuelle suffit pour le MVP-1 | Tests sur un jeu de questions | 07 |
| H5 | Playwright est le meilleur choix pour l'inspection navigateur | Benchmark comparatif | 04 |
| H6 | MCP apporte un bénéfice net pour l'accès agentique | Analyse des cas d'usage | 02 |
| H7 | La capitalisation peut être semi-automatisée | Définition des critères de validation | 10 |

### 3.2 Risques majeurs

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Surarchitecture précoce** | Élevée | Élevé | Commencer par MVP-1, résister à la tentation d'ajouter des features |
| **Recherche inutile** | Moyenne | Moyen | Réutiliser les travaux antérieurs, ne pas refaire DRI/Students/HarnAI |
| **Dépendance à un fournisseur** | Moyenne | Élevé | Interfaces séparées, formats exportables, tests multi-fournisseurs |
| **Scraping non conforme** | Faible | Très élevé | Checklist de conformité, limites strictes, journalisation |
| **Fuite de secrets** | Faible | Très élevé | Nettoyage systématique, gestion dédiée des secrets |
| **MCP partout** | Moyenne | Moyen | Règle de décision claire, coût/bénéfice par cas d'usage |
| **Bibliothèque qui se dégrade** | Élevée | Élevé | Vérification périodique des liens, dépréciation, revue humaine |
| **Complexité opérationnelle** | Moyenne | Élevé | Commencer simple (fichiers, CLI), ajouter de la complexité si nécessaire |

---

## 4. Vocabulaire commun (glossaire)

> Voir le fichier companion `00_GLOSSAIRE_TECHNIQUE.md` pour les définitions complètes.

### Termes critiques à aligner

1. **Agent** : système qui planifie et choisit des actions (ex: Claude Code, Codex). Ne pas confondre avec « outil » ou « service ».

2. **MCP** : protocole de communication entre client (agent) et serveur (outil). Ce n'est pas un outil en soi, mais un moyen d'exposer des outils.

3. **CLI** : interface en ligne de commande. Peut être utilisée par un humain ou un agent.

4. **Service** : processus qui fournit une capacité. Peut être local ou distant, exposé via CLI, API, MCP ou autre.

5. **RAG** : technique de recherche + injection de contexte dans un modèle. Ne pas confondre avec « recherche documentaire » classique.

6. **Scraping vs Crawling** : scraping = extraction ciblée, crawling = parcours et découverte.

7. **Navigateur automatisé** : outil qui contrôle un navigateur (Playwright, Puppeteer). Différent d'une requête HTTP simple.

8. **Capitalisation** : processus de transformation d'un projet terminé en ressource réutilisable. Inclut nettoyage, documentation, validation.

9. **Artefact** : tout produit d'un projet (code, capture, document, composant). Pas tous les artefacts deviennent des ressources de référence.

10. **Observation vs Inférence** : observation = ce qui est vu/mesuré, inférence = déduction sur les mécanismes internes. Ne pas confondre les deux.

---

## 5. Registre des questions ouvertes

### Questions bloquantes (doivent être résolues avant l'implémentation)

| # | Question | Impact | Phase de résolution |
|---|----------|--------|---------------------|
| Q1 | Quel stockage pour le MVP-1 ? (fichiers, SQLite, PostgreSQL) | Architecture complète | 06 |
| Q2 | Quels outils exposer via MCP vs garder en CLI/API ? | Interface agentique | 02 |
| Q3 | Quelle méthode d'inspection navigateur ? (Playwright, Puppeteer, etc.) | MVP-2 | 04 |
| Q4 | Comment valider la qualité de la recherche ? (textuelle vs hybride) | MVP-1 | 07 |
| Q5 | Quels critères pour qu'un artefact devienne une ressource de référence ? | Capitalisation | 10 |

### Questions importantes (peuvent être résolues pendant l'implémentation)

| # | Question | Impact | Phase de résolution |
|---|----------|--------|---------------------|
| Q6 | Comment intégrer les 3 documents Digital Experience ? | Domaine E | 09 |
| Q7 | Quel niveau d'automatisation pour la capitalisation ? | Workflow | 10 |
| Q8 | Comment gérer les secrets et données sensibles ? | Sécurité | 11 |
| Q9 | Quelle stratégie de sauvegarde et de restauration ? | Opérations | 11 |
| Q10 | Comment mesurer la qualité des captures et inspections ? | MVP-2 | 08 |

### Questions exploratoires (peuvent être reportées)

| # | Question | Impact | Phase de résolution |
|---|----------|--------|---------------------|
| Q11 | Faut-il une interface web ou la CLI suffit-elle ? | UX | 13 |
| Q12 | Comment gérer la vidéo et les traces d'inspection ? | MVP-2 | 04 |
| Q13 | Faut-il une recherche sémantique/vectorielle ? | Recherche | 07 |
| Q14 | Comment analyser les comportements UX des sites inspectés ? | Domaine C | 08 |
| Q15 | Quels outils 3D/WebGL intégrer ? | Domaine E | 09 |

---

## 6. Dépendances entre phases

```text
Phase 00 (Cadrage) ─────────────────────────────────┐
                                                     │
Phase 01 (Fondations) ──────────────────────────────┤
                                                     │
Phase 02 (MCP) ─────────────────────────────────────┤
                                                     │
Phase 03 (CLI/API) ─────────────────────────────────┤
                                                     │
Phase 04 (Navigateur) ──────┐                        │
                             ├─→ Phase 08 (Analyse) ─┤
Phase 05 (Scraping) ─────────┘                        │
                                                     │
Phase 06 (Stockage) ────────┐                        │
                             ├─→ Phase 07 (RAG) ─────┤
                             │                        │
Phase 09 (Créatif) ─────────────────────────────────┤
                                                     │
Phase 10 (Capitalisation) ──────────────────────────┤
                                                     │
Phase 11 (Sécurité) ────────────────────────────────┤
                                                     │
Phase 12 (Outils IA) ───────────────────────────────┤
                                                     │
Phase 13 (Architecture) ────┐                        │
                             ├─→ Phase 14 (Audit) ───┘
Phase 15 (Roadmap) ─────────┘
```

### Dépendances critiques

- **Phase 06 → Phase 07** : le choix du stockage impacte la stratégie de recherche
- **Phase 04 → Phase 08** : la méthode d'inspection impacte l'analyse visuelle
- **Phase 02 → Phase 03** : la stratégie MCP impacte la conception des outils
- **Phase 13 → Phase 14** : l'architecture cible impacte l'audit final

### Phases indépendantes (peuvent être menées en parallèle)

- Phase 01 (Fondations) — indépendante
- Phase 09 (Créatif) — indépendante
- Phase 11 (Sécurité) — peut commencer tôt
- Phase 12 (Outils IA) — indépendante

---

## 7. Plan de travail proposé

### Séquencement recommandé

1. **Lot 1 — Fondations et intégration** (Phases 01, 02, 03)
   - Objectif : maîtriser les bases techniques et définir l'interface agentique
   - Durée estimée : 2-3 semaines
   - Livrables : parcours d'apprentissage, matrice MCP, contrat d'outil standard

2. **Lot 2 — Inspection et extraction** (Phases 04, 05, 08)
   - Objectif : capacités d'inspection navigateur et de scraping
   - Durée estimée : 2-3 semaines
   - Livrables : comparatif navigateurs, stratégie scraping, méthode d'analyse

3. **Lot 3 — Connaissances et recherche** (Phases 06, 07, 09)
   - Objectif : stockage, recherche et catalogue créatif
   - Durée estimée : 2-3 semaines
   - Livrables : architecture stockage, stratégie recherche, taxonomie créative

4. **Lot 4 — Système robuste** (Phases 10, 11, 12)
   - Objectif : capitalisation, sécurité et outils IA
   - Durée estimée : 2-3 semaines
   - Livrables : workflow capitalisation, modèle de menace, comparatif agents

5. **Lot 5 — Architecture et roadmap** (Phases 13, 14)
   - Objectif : synthèse finale et plan d'implémentation
   - Durée estimée : 1-2 semaines
   - Livrables : architectures comparées, spécification MVP, roadmap

### Durée totale estimée

**9-14 semaines** de recherche, selon le niveau de profondeur et les itérations nécessaires.

---

## 8. Critères de réussite de la Phase 00

- ✅ Blueprint lu et analysé en entier
- ✅ Ressources antérieures inventoriées et évaluées
- ✅ Points forts et lacunes identifiés
- ✅ Hypothèses et risques listés
- ✅ Questions ouvertes regroupées et priorisées
- ✅ Dépendances entre phases cartographiées
- ✅ Vocabulaire commun défini (glossaire)
- ✅ Plan directeur de recherche proposé

**Statut : ✅ Tous les critères remplis**

---

## 9. Fichiers créés

| Fichier | Rôle | Taille |
|---------|------|--------|
| `00_AUDIT_CADRAGE.md` | Ce document | ~15 KB |
| `00_GLOSSAIRE_TECHNIQUE.md` | Définitions des termes techniques | ~12 KB |
| `00_PLAN_DIRECTEUR_RECHERCHE.md` | Plan des 15 phases | ~18 KB |

---

## 10. Recommandation pour la suite

### Décisions validées

1. **Réutiliser les recherches antérieures** : DRI, Students, HarnAI constituent une base solide.
2. **Partir de la cartographie créative** : le document existant couvre une partie du Domaine E.
3. **Adopter l'architecture en couches** du blueprint.
4. **Séquencer les MVP** comme proposé.

### Prochaine étape recommandée

**Phase 01 — Fondations et parcours d'apprentissage**

Objectif : définir les prérequis techniques nécessaires et proposer un parcours d'apprentissage structuré pour un développeur qui veut comprendre et maîtriser les technologies.

Livrables attendus :
- `01_FONDATIONS_ET_PREREQUIS.md`
- `01_PARCOURS_DAPPRENTISSAGE.md`

### Critères de passage à la Phase 01

- ✅ Audit de cadrage validé par l'utilisateur
- ✅ Plan directeur de recherche approuvé
- ✅ Questions ouvertes identifiées et priorisées
- ✅ Ressources antérieures évaluées

---

## Sources et date de consultation

| Source | URL/Fichier | Date |
|--------|-------------|------|
| Blueprint EKTS | `Blueprint_Systeme_Ingenierie_IA.md` | 21 octobre 2026 |
| DRI (12 docs) | `recherche/dri/` | 20 octobre 2026 |
| Students (3 docs) | `recherche/students/` | 20 octobre 2026 |
| HarnAI (9 docs) | `recherche/harnai/` | 20 octobre 2026 |
| Cartographie créative | `cartographie-creation-numerique.md` | 5 octobre 2026 |
| Inventaire créatif | `inventaire/` | 5 octobre 2026 |
| Données brutes | `data/` | 20 octobre 2026 |

---

*Phase 00 terminée le 21 octobre 2026*
