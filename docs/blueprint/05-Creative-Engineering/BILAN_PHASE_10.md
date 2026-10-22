# Phase 10 — Bilan de la Capitalisation des Projets

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Résumé de la phase

La Phase 10 a établi un système complet de capitalisation des projets EKTS, permettant de transformer les livrables et l'expérience de chaque projet en connaissances réutilisables pour l'organisation.

**Objectif atteint** : Définir un workflow de clôture structuré (8 étapes) et un template post-mortem complet (10 sections) pour capturer, nettoyer, documenter, valider, publier et indexer les connaissances issues des projets.

---

## 2. Livrables produits

### 2.1 Document 1 : Workflow de capitalisation

**Fichier :** `10_WORKFLOW_CAPITALISATION.md`  
**Taille :** ~42 KB  
**Sections :** 12

**Contenu principal :**

1. **Workflow en 8 étapes**
   - Étape 1 : Collecter les artefacts (code, docs, design, tests, config, métriques)
   - Étape 2 : Nettoyer les secrets (Gitleaks + TruffleHog, git-filter-repo)
   - Étape 3 : Documenter les choix (ADR, limites, contexte)
   - Étape 4 : Vérifier tests et licences (couverture > 80%, conformité licences)
   - Étape 5 : Faire valider (review pair, validation mainteneur)
   - Étape 6 : Publier dans la bibliothèque (Phase 09, catégorisation)
   - Étape 7 : Indexer (Phase 06 stockage + Phase 07 RAG)
   - Étape 8 : Déprécier les anciennes références (rotation, archivage)

2. **Outils de sécurité**
   - **Gitleaks** : Détection rapide pre-commit + CI (MIT, 29K+ ★)
   - **TruffleHog** : Vérification secrets actifs via API (AGPL-3.0, 27K+ ★)
   - **git-filter-repo** : Nettoyage historique Git (recommandé par Git)

3. **Templates**
   - ADR (Architecture Decision Record)
   - Documentation des limites
   - Checklist validation
   - Publication bibliothèque

4. **Comparaison approches**
   - Fichiers versionnés (Git) : Traçabilité, collaboration
   - Base de données structurée (SQLite) : Recherche, performance
   - **Recommandation EKTS** : Approche hybride (Git + SQLite + RAG)

**Points clés :**
- Workflow complet de collecte à dépréciation
- Sécurité intégrée (détection + nettoyage secrets)
- Documentation structurée (ADR, limites)
- Intégration EKTS (Phases 06-07-09)

### 2.2 Document 2 : Template post-mortem

**Fichier :** `10_TEMPLATE_POSTMORTEM_PROJET.md`  
**Taille :** ~38 KB  
**Sections :** 14

**Contenu principal :**

1. **Template en 10 sections**
   - Section 1 : Informations générales (contexte, équipe, timeline)
   - Section 2 : Objectifs et résultats (prévu vs livré)
   - Section 3 : Timeline (chronologie événements clés)
   - Section 4 : Ce qui a bien fonctionné (succès techniques, processus, collaboration)
   - Section 5 : Ce qui a moins bien fonctionné (difficultés)
   - Section 6 : Analyse des causes racines (5 pourquoi, Ishikawa)
   - Section 7 : Dette technique (inventaire, intentionnelle vs inadvertante, plan remboursement)
   - Section 8 : Leçons apprises (technique, processus, collaboration, business)
   - Section 9 : Recommandations (immédiat 0-3 mois, court terme 3-6 mois, long terme 6-12 mois)
   - Section 10 : Annexes (métriques, liens, ressources)

2. **Guide d'utilisation**
   - Quand conduire un post-mortem (projets > 2 mois, équipe > 3 personnes)
   - Comment conduire (5 étapes : préparation, session, rédaction, review, capitalisation)
   - Agenda session (1-2h)
   - Règles blameless

3. **Exemples concrets**
   - Leçons techniques (R3F, Chromatic, Lenis)
   - Leçons processus (daily standups, code review, sprints)
   - Leçons collaboration (Figma, pair programming, retrospectives)
   - Leçons business (stakeholders, user tests, MVP)

4. **Intégration EKTS**
   - Stockage Phase 06 (SQLite)
   - Indexation RAG Phase 07 (recherche sémantique)
   - Outil MCP : `search_postmortem(query, type, project)`

**Points clés :**
- Template complet et structuré
- Approche blameless (focus sur apprentissage)
- Analyse root cause (5 pourquoi, Ishikawa)
- Dette technique tracée et planifiée
- Recommandations actionnables et temporelles

---

## 3. Décisions prises

### 3.1 Architecture

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **Workflow en 8 étapes** | Couverture complète (collecte → dépréciation) | 5 étapes → pas assez complet |
| **Template en 10 sections** | Couverture exhaustive (contexte → suivi) | 5 sections → pas assez détaillé |
| **Gitleaks + TruffleHog** | Complémentaires (rapidité + vérification) | Un seul outil → coverage incomplet |
| **Approche hybride (Git + SQLite)** | Traçabilité Git + recherche SQLite | Fichiers uniquement → pas de recherche |
| **Blameless post-mortem** | Focus sur apprentissage systémique | Blaming → culture de peur |
| **5 pourquoi** | Méthode simple et efficace pour root cause | Fishbone → plus complexe |
| **Dette technique séparée** | Visibility et suivi dédié | Intégré dans problèmes → pas de tracking |
| **Recommandations temporelles** | Priorisation claire (immédiat/court/long) | Liste simple → pas de priorisation |

### 3.2 Compromis acceptés

- **Processus lourd** : 8 étapes + 10 sections peuvent ralentir la capitalisation
- **Temps requis** : Post-mortem complet nécessite 1-2 jours
- **Subjectivité** : Leçons apprises peuvent être subjectives
- **Maintenance continue** : Dépréciation nécessite suivi régulier

---

## 4. Intégration avec les autres phases

### 4.1 Dépendances

| Phase | Dépendance | Type |
|-------|------------|------|
| **Phase 04** (Automatisation navigateur) | Tests E2E à capitaliser | Support |
| **Phase 06** (Stockage) | Stockage post-mortems et métadonnées | Forte |
| **Phase 07** (RAG) | Indexation sémantique leçons et recommandations | Forte |
| **Phase 08** (Analyse expérience) | Rapports d'inspection | Support |
| **Phase 09** (Bibliothèque créative) | Publication ressources et leçons | Forte |
| **Phase 11** (Sécurité) | Nettoyage secrets, incidents sécurité | Moyenne |

### 4.2 Flux de données

```
Projet terminé
    ↓
Post-mortem (template 10 sections)
    ↓
Workflow capitalisation (8 étapes)
    ├─ Collecte artefacts
    ├─ Nettoyage secrets (Gitleaks + TruffleHog)
    ├─ Documentation choix (ADR, limites)
    ├─ Vérification tests/licences
    ├─ Validation (review pair)
    └─ Publication bibliothèque (Phase 09)
    ↓
Stockage EKTS (Phase 06)
    ├─ SQLite (métadonnées post-mortems)
    └─ Git (code, docs, assets)
    ↓
Indexation RAG (Phase 07)
    ├─ Chunks leçons apprises
    ├─ Chunks recommandations
    └─ Chunks dette technique
    ↓
Recherche sémantique
    ├─ MCP: search_postmortem(query, type)
    └─ MCP: search_capitalized_resource(query)
    ↓
Capitalisation continue
    ├─ Réutilisation leçons
    ├─ Éviter erreurs passées
    └─ Accélérer futurs projets
```

---

## 5. Résultats obtenus

### 5.1 Métriques

**Couverture** :
- Workflow complet : 8 étapes définies
- Template post-mortem : 10 sections
- Outils sécurité : 3 outils recommandés (Gitleaks, TruffleHog, git-filter-repo)
- Templates : 4 templates (ADR, limites, publication, checklist validation)

**Qualité** :
- Approche blameless
- Data-driven (métriques et faits)
- Actionnable (recommandations concrètes)
- Réutilisable (indexation RAG)

**Intégration** :
- Stockage SQLite (Phase 06)
- Indexation RAG (Phase 07)
- Publication bibliothèque (Phase 09)
- Outils MCP : 2 outils (search_postmortem, search_capitalized_resource)

### 5.2 Outils recommandés

**Détection secrets** :
- **Gitleaks** : Pre-commit + CI (rapide, MIT, 29K+ ★)
- **TruffleHog** : Vérification secrets actifs (AGPL-3.0, 27K+ ★)

**Nettoyage historique** :
- **git-filter-repo** : Recommandé par Git, plus sûr que filter-branch

**Documentation** :
- **Docusaurus** : Documentation versionnée (v3.9.2, 2026)
- **Document360** : Knowledge base structurée (commercial)

**Session post-mortem** :
- **Miro** : Brainstorming visuel
- **Notion** : Prise de notes collaborative
- **Otter.ai** : Transcription automatique

**Suivi** :
- **GitHub Issues** : Plan d'action
- **Linear** : Tracking tâches

---

## 6. Limites et questions ouvertes

### 6.1 Limites identifiées

1. **Processus lourd** : 8 étapes + 10 sections peuvent ralentir la capitalisation
2. **Temps requis** : Post-mortem complet nécessite 1-2 jours
3. **Subjectivité** : Leçons apprises peuvent être subjectives
4. **Biais de rappel** : Tendances à se souvenir des événements récents/négatifs
5. **Participation** : Difficile de réunir tous les stakeholders
6. **Suivi** : Plan d'action peut être oublié sans suivi régulier
7. **Secrets cachés** : Certains secrets peuvent être difficiles à détecter
8. **Historique Git** : Nettoyage historique peut être complexe (force push, re-clone)

### 6.2 Questions ouvertes

1. **Fréquence** : Post-mortem systématique ou seulement projets importants ?
2. **Automatisation** : Comment automatiser davantage le workflow ?
3. **AI review** : Peut-on utiliser un agent IA pour valider la capitalisation ?
4. **Anonymat** : Comment gérer les feedbacks sensibles ?
5. **Transparence** : Qui a accès aux post-mortems ?
6. **Metrics** : Comment mesurer le ROI de la capitalisation ?
7. **Archivage** : Où stocker les ressources dépréciées ?
8. **Dépréciation** : À quelle fréquence déprécier les ressources ?

---

## 7. Prochaines étapes

### 7.1 Phase 11 : Sécurité (à venir)

La Phase 11 va construire sur le nettoyage des secrets pour :
- Définir un modèle de menace complet
- Établir une politique de permissions et sécurité
- Intégrer les outils de sécurité dans le workflow EKTS
- Documenter les meilleures pratiques sécurité

### 7.2 Améliorations court terme

1. **Implémenter le workflow** : Tester sur un projet pilote
2. **Automatiser** : Scripts pour collecte, nettoyage, indexation
3. **AI review** : Intégrer un agent IA dans la validation
4. **Metrics** : Définir KPIs pour mesurer le succès de la capitalisation
5. **Training** : Former l'équipe aux post-mortems blameless

---

## 8. Conclusion

La Phase 10 a établi un système complet de capitalisation des projets EKTS. Le workflow en 8 étapes couvre tous les aspects de la clôture d'un projet : collecte des artefacts, nettoyage des secrets, documentation des choix, vérification tests/licences, validation, publication, indexation, et dépréciation. Le template post-mortem en 10 sections fournit une structure complète pour capturer les leçons apprises, analyser les causes racines, tracer la dette technique, et formuler des recommandations actionnables.

**Points forts :**
- Workflow complet de collecte à dépréciation
- Template post-mortem structuré et blameless
- Outils de sécurité intégrés (Gitleaks, TruffleHog)
- Analyse root cause (5 pourquoi, Ishikawa)
- Dette technique tracée et planifiée
- Intégration EKTS (Phases 06-07-09, MCP)
- Approche hybride (Git + SQLite + RAG)

**Points d'amélioration :**
- Processus peut être lourd (8 étapes + 10 sections)
- Temps requis pour post-mortem complet (1-2 jours)
- Subjectivité des leçons apprises
- Maintenance continue nécessaire (dépréciation)

**Valeur apportée :**
- Transformation de l'expérience projet en connaissances réutilisables
- Éviter les erreurs passées dans les futurs projets
- Accélérer le développement via capitalisation
- Sécurité intégrée (nettoyage secrets)
- Traçabilité complète (Git + SQLite)
- Recherche sémantique (RAG + MCP)

La Phase 10 fait le pont entre l'exécution des projets et la capitalisation continue, permettant à EKTS d'apprendre de chaque projet et d'améliorer constamment ses pratiques.

---

## 9. Annexes

### 9.1 Glossaire

| Terme | Définition |
|-------|------------|
| **Post-mortem** | Analyse rétrospective d'un projet pour identifier les leçons apprises |
| **Blameless** | Approche qui évite la culpabilisation pour se concentrer sur les causes systémiques |
| **ADR** | Architecture Decision Record — document capturant une décision architecturale |
| **Dette technique** | Conséquences des raccourcis techniques pris durant le développement |
| **Cause racine** | Cause fondamentale d'un problème, identifiée via 5 pourquoi ou Ishikawa |
| **Secret** | Information sensible (clé API, mot de passe, token) qui ne doit pas être exposée |
| **Capitalisation** | Processus de transformation des livrables en connaissances réutilisables |

### 9.2 Ressources

- [Gitleaks](https://github.com/gitleaks/gitleaks) — Secret scanning (MIT)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) — Verified secret detection (AGPL-3.0)
- [git-filter-repo](https://github.com/newren/git-filter-repo) — Git history rewriting
- [Docusaurus](https://docusaurus.io/) — Documentation versionnée (v3.9.2)
- [Document360](https://document360.com/) — Knowledge base platform

---

**Document rédigé le 21 octobre 2026 — Phase 10 du projet EKTS**
