# Phase 10 — Template Post-Mortem de Projet

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé (référence historique — voir note)  
**Auteur :** Agent EKTS  
**Version :** 1.0

> **⚠️ Note (25 octobre 2026) — MVP-3 redéfini :**
> Ce document décrit le template de post-mortem en 10 sections tel que conçu dans la Phase 10.
> Il reste une **référence utile** pour le Sprint 15 (Capitalisation Connaissances, BestPractice) du MVP-3 actif.
> Le périmètre complet du MVP-3 est défini dans [`docs/ROADMAP.md`](../ROADMAP.md) (ADR-031).

---

## 1. Objectif

Fournir un template complet et structuré pour conduire des post-mortem de projet EKTS. Ce template capture les leçons apprises, les décisions prises, les difficultés rencontrées, et les recommandations pour les projets futurs.

Il est conçu pour être :
- **Blameless** : Focus sur l'apprentissage, pas la culpabilisation
- **Exhaustif** : Couvre tous les aspects (technique, processus, humain)
- **Actionnable** : Recommandations concrètes pour futurs projets
- **Réutilisable** : Capitalisable dans EKTS (Phases 06-07-09)

---

## 2. Résumé

**Template en 10 sections** :
1. **Informations générales** — Contexte projet, équipe, timeline
2. **Objectifs et résultats** — Ce qui était prévu vs ce qui a été livré
3. **Timeline** — Chronologie des événements clés
4. **Ce qui a bien fonctionné** — Succès et points forts
5. **Ce qui a moins bien fonctionné** — Difficultés et échecs
6. **Analyse des causes racines** — Pourquoi les problèmes sont survenus
7. **Dette technique** — Raccourcis pris et conséquences
8. **Leçons apprises** — Insights capitalisables
9. **Recommandations** — Actions pour futurs projets
10. **Annexes** — Métriques, liens, ressources

---

## 3. Méthode

### 3.1 Approche

1. **Analyse des templates industrie** : Plane, Rootly, NN/g, builtin.com
2. **Adaptation EKTS** : Intégration avec Phases 06-09, MCP, agents IA
3. **Blameless post-mortem** : Focus sur l'apprentissage systémique
4. **Capitalisation** : Structure permettant indexation RAG

### 3.2 Principes

- **Blameless** : "What went wrong" pas "Who went wrong"
- **Data-driven** : Métriques et faits, pas opinions
- **Actionnable** : Chaque problème → recommandation concrète
- **Exhaustif** : Technique, processus, humain, contexte
- **Réutilisable** : Indexable dans EKTS pour recherche future

---

## 4. Concepts clés

### 4.1 Définitions

**Post-mortem** : Analyse rétrospective d'un projet (succès ou échec) pour identifier les leçons apprises. Diffère d'une rétrospective (qui couvre positif ET négatif) en se concentrant sur l'analyse approfondie des causes et conséquences.

**Blameless** : Approche qui évite la culpabilisation individuelle pour se concentrer sur les causes systémiques et les améliorations de processus.

**Cause racine** : Cause fondamentale d'un problème, identifiée via la méthode des "5 pourquoi" ou le diagramme d'Ishikawa (fishbone).

**Dette technique** : Conséquences des raccourcis techniques pris durant le développement. Inclut : code, architecture, documentation, tests, dépendances.

**Leçon apprise** : Insight capitalisable issu de l'expérience, formulé de manière actionnable pour les futurs projets.

### 4.2 Types de post-mortem

| Type | Quand | Focus |
|------|-------|-------|
| **Projet terminé** | Fin de projet | Bilan complet, leçons globales |
| **Incident critique** | Après incident majeur | Analyse root cause, prévention |
| **Milestone** | Fin de phase importante | Bilan intermédiaire, ajustements |
| **Feature flag** | Après lancement feature | Impact utilisateur, performance |

---

## 5. Résultats — Template complet

### 5.1 Template Post-Mortem EKTS

```markdown
# Post-Mortem : [Nom du projet]

**Statut :** Draft / Final  
**Auteur :** [Nom]  
**Reviewers :** [Noms]  
**Date du projet :** [Date début] → [Date fin]  
**Date du post-mortem :** [Date]  
**Sévérité / Importance :** SEV-1 / SEV-2 / SEV-3 / SEV-4

---

## 1. Informations générales

### 1.1 Contexte
- **Projet :** [Nom du projet]
- **Objectif business :** [Pourquoi ce projet existe]
- **Parties prenantes :** [Liste des stakeholders]
- **Équipe :** [Liste des membres avec rôles]
- **Durée prévue :** [Timeline initiale]
- **Durée réelle :** [Timeline effective]
- **Budget prévu :** [Estimation initiale]
- **Budget réel :** [Coût effectif]

### 1.2 Périmètre
- **Fonctionnalités livrées :** [Liste des features]
- **Fonctionnalités reportées :** [Ce qui n'a pas été livré]
- **Fonctionnalités ajoutées :** [Scope creep]

---

## 2. Objectifs et résultats

### 2.1 Objectifs initiaux
| Objectif | Métrique | Cible | Résultat | Statut |
|----------|----------|-------|----------|--------|
| [Objectif 1] | [KPI] | [Cible] | [Réel] | ✅ / ⚠️ / ❌ |
| [Objectif 2] | [KPI] | [Cible] | [Réel] | ✅ / ⚠️ / ❌ |

### 2.2 Résultats business
- **Impact utilisateur :** [Nombre d'utilisateurs, engagement]
- **Impact business :** [Revenus, conversion, rétention]
- **Feedback qualitatif :** [Témoignages, surveys]

### 2.3 Résultats techniques
- **Performance :** [Lighthouse scores, FPS, temps chargement]
- **Qualité code :** [Couverture tests, dette technique]
- **Stabilité :** [Uptime, incidents, bugs]

---

## 3. Timeline

### 3.1 Chronologie des événements clés
| Date | Événement | Impact | Décision |
|------|-----------|--------|----------|
| [Date] | [Événement] | [Impact] | [Décision prise] |
| [Date] | [Événement] | [Impact] | [Décision prise] |

### 3.2 Incidents majeurs
| Date | Incident | Sévérité | Durée | Root cause | Résolution |
|------|----------|----------|-------|------------|------------|
| [Date] | [Incident] | SEV-X | [Durée] | [Cause] | [Solution] |

---

## 4. Ce qui a bien fonctionné ✅

### 4.1 Succès techniques
- **[Succès 1] :** [Description + pourquoi ça a marché]
- **[Succès 2] :** [Description + pourquoi ça a marché]

### 4.2 Succès processus
- **[Succès 1] :** [Description + pourquoi ça a marché]
- **[Succès 2] :** [Description + pourquoi ça a marché]

### 4.3 Succès collaboration
- **[Succès 1] :** [Description + pourquoi ça a marché]
- **[Succès 2] :** [Description + pourquoi ça a marché]

---

## 5. Ce qui a moins bien fonctionné ⚠️

### 5.1 Difficultés techniques
| Problème | Impact | Cause | Solution apportée | Solution future |
|----------|--------|-------|-------------------|-----------------|
| [Problème 1] | [Impact] | [Cause] | [Solution] | [Recommandation] |

### 5.2 Difficultés processus
| Problème | Impact | Cause | Solution apportée | Solution future |
|----------|--------|-------|-------------------|-----------------|
| [Problème 1] | [Impact] | [Cause] | [Solution] | [Recommandation] |

### 5.3 Difficultés collaboration
| Problème | Impact | Cause | Solution apportée | Solution future |
|----------|--------|-------|-------------------|-----------------|
| [Problème 1] | [Impact] | [Cause] | [Solution] | [Recommandation] |

---

## 6. Analyse des causes racines 🔍

### 6.1 Méthode des 5 pourquoi

**Problème :** [Description du problème]

1. **Pourquoi ?** [Première cause]
2. **Pourquoi ?** [Deuxième cause]
3. **Pourquoi ?** [Troisième cause]
4. **Pourquoi ?** [Quatrième cause]
5. **Pourquoi ?** [Cause racine]

**Cause racine identifiée :** [Description]

**Recommandation :** [Action corrective]

### 6.2 Diagramme d'Ishikawa (Fishbone)

```
           Matériel                Méthode
              |                        |
              v                        v
    [Cause] ← PROBLÈME → [Cause]
              ^                        ^
              |                        |
           Main-d'œuvre             Milieu
```

**Catégories analysées :**
- **Matériel** : Équipements, outils, infrastructure
- **Méthode** : Processus, procédures, workflows
- **Main-d'œuvre** : Compétences, formation, communication
- **Milieu** : Contexte, environnement, contraintes

---

## 7. Dette technique 📊

### 7.1 Inventaire de la dette technique

| ID | Type | Description | Impact | Effort | Priorité |
|----|------|-------------|--------|--------|----------|
| DT-001 | Code | [Description] | [Impact] | [S/M/L/XL] | P1/P2/P3 |
| DT-002 | Architecture | [Description] | [Impact] | [S/M/L/XL] | P1/P2/P3 |
| DT-003 | Documentation | [Description] | [Impact] | [S/M/L/XL] | P1/P2/P3 |
| DT-004 | Tests | [Description] | [Impact] | [S/M/L/XL] | P1/P2/P3 |
| DT-005 | Dépendances | [Description] | [Impact] | [S/M/L/XL] | P1/P2/P3 |

### 7.2 Dette intentionnelle vs inadvertante

**Dette intentionnelle** (raccourcis assumés) :
- [Dette 1] : [Justification] → [Plan de remboursement]
- [Dette 2] : [Justification] → [Plan de remboursement]

**Dette inadvertante** (découverte après coup) :
- [Dette 1] : [Comment découverte] → [Plan de remboursement]
- [Dette 2] : [Comment découverte] → [Plan de remboursement]

### 7.3 Plan de remboursement

| Dette | Effort estimé | Timing | Owner | Statut |
|-------|---------------|--------|-------|--------|
| [Dette 1] | [Jours] | [Sprint/Mois] | [Nom] | Planifié / En cours / Terminé |
| [Dette 2] | [Jours] | [Sprint/Mois] | [Nom] | Planifié / En cours / Terminé |

---

## 8. Leçons apprises 💡

### 8.1 Leçons techniques

| Leçon | Contexte | Application future |
|-------|----------|---------------------|
| [Leçon 1] | [Quand appris] | [Comment réutiliser] |
| [Leçon 2] | [Quand appris] | [Comment réutiliser] |

### 8.2 Leçons processus

| Leçon | Contexte | Application future |
|-------|----------|---------------------|
| [Leçon 1] | [Quand appris] | [Comment réutiliser] |
| [Leçon 2] | [Quand appris] | [Comment réutiliser] |

### 8.3 Leçons collaboration

| Leçon | Contexte | Application future |
|-------|----------|---------------------|
| [Leçon 1] | [Quand appris] | [Comment réutiliser] |
| [Leçon 2] | [Quand appris] | [Comment réutiliser] |

### 8.4 Leçons business

| Leçon | Contexte | Application future |
|-------|----------|---------------------|
| [Leçon 1] | [Quand appris] | [Comment réutiliser] |
| [Leçon 2] | [Quand appris] | [Comment réutiliser] |

---

## 9. Recommandations 🎯

### 9.1 Recommandations immédiates (0-3 mois)

| Action | Priorité | Effort | Owner | Deadline |
|--------|----------|--------|-------|----------|
| [Action 1] | P1 | [S/M/L] | [Nom] | [Date] |
| [Action 2] | P2 | [S/M/L] | [Nom] | [Date] |

### 9.2 Recommandations court terme (3-6 mois)

| Action | Priorité | Effort | Owner | Deadline |
|--------|----------|--------|-------|----------|
| [Action 1] | P2 | [S/M/L] | [Nom] | [Date] |
| [Action 2] | P2 | [S/M/L] | [Nom] | [Date] |

### 9.3 Recommandations long terme (6-12 mois)

| Action | Priorité | Effort | Owner | Deadline |
|--------|----------|--------|-------|----------|
| [Action 1] | P3 | [S/M/L] | [Nom] | [Date] |
| [Action 2] | P3 | [S/M/L] | [Nom] | [Date] |

### 9.4 Recommandations pour futurs projets

| Recommandation | Contexte | Bénéfice attendu |
|----------------|----------|------------------|
| [Recommandation 1] | [Pourquoi] | [Bénéfice] |
| [Recommandation 2] | [Pourquoi] | [Bénéfice] |

---

## 10. Annexes 📎

### 10.1 Métriques détaillées
- **Performance :** [Lighthouse reports, WebPageTest]
- **Qualité code :** [SonarQube, CodeClimate]
- **Tests :** [Couverture, résultats]
- **Incidents :** [Logs, post-mortems incidents]

### 10.2 Liens utiles
- **Repository :** [URL Git]
- **Documentation :** [URL docs]
- **Design :** [URL Figma]
- **Démo :** [URL production/staging]
- **Métriques :** [URL dashboard]

### 10.3 Ressources
- **ADR :** [Liste des ADR produits]
- **Guides :** [Liste des guides créés]
- **Templates :** [Liste des templates réutilisables]

### 10.4 Remerciements
- [Personne 1] : [Contribution]
- [Personne 2] : [Contribution]

---

## Suivi du post-mortem

### Plan d'action
| Action | Owner | Deadline | Statut | Notes |
|--------|-------|----------|--------|-------|
| [Action 1] | [Nom] | [Date] | ⏳ / ✅ / ❌ | [Notes] |
| [Action 2] | [Nom] | [Date] | ⏳ / ✅ / ❌ | [Notes] |

### Prochaine review
- **Date :** [Date + 3 mois]
- **Objectif :** Vérifier avancement plan d'action
- **Participants :** [Liste]
```

---

## 6. Guide d'utilisation

### 6.1 Quand conduire un post-mortem

**Post-mortem recommandé pour** :
- Projets > 2 mois de développement
- Projets avec équipe > 3 personnes
- Projets ayant rencontré des incidents majeurs
- Projets avec dépassement budget/timeline > 20%
- Projets avec feedback utilisateur négatif significatif

**Post-mortem optionnel pour** :
- Petits projets < 1 mois
- Prototypes / POC
- Correctifs mineurs

### 6.2 Comment conduire le post-mortem

#### Étape 1 : Préparation (1-2 jours avant)

1. **Envoyer le template** à tous les participants
2. **Collecter les données** : métriques, logs, feedback
3. **Identifier les participants clés** : équipe technique, product, design, stakeholders
4. **Réserver 1-2h** pour la session de post-mortem

#### Étape 2 : Session de post-mortem (1-2h)

**Agenda recommandé** :
```
0-10 min   : Introduction, objectifs, règles (blameless)
10-30 min  : Review timeline et résultats
30-60 min  : Discussion ce qui a bien/mal fonctionné
60-90 min  : Analyse causes racines (5 pourquoi)
90-110 min : Identification leçons et recommandations
110-120 min : Plan d'action, owners, deadlines
```

**Règles** :
- ✅ Blameless : "What" pas "Who"
- ✅ Data-driven : Faits et métriques
- ✅ Constructif : Solutions pas plaintes
- ✅ Inclusif : Tout le monde participe
- ❌ Pas de blame
- ❌ Pas de justification
- ❌ Pas de distraction (téléphones, emails)

#### Étape 3 : Rédaction (2-3 jours après)

1. **Compiler les notes** de la session
2. **Compléter le template** avec toutes les sections
3. **Ajouter les métriques** et données
4. **Formuler les recommandations** de manière actionnable
5. **Identifier les owners** pour chaque action

#### Étape 4 : Review et validation (1 semaine après)

1. **Envoyer le draft** aux participants pour review
2. **Collecter les feedbacks** et ajuster
3. **Faire valider** par le mainteneur EKTS
4. **Publier la version finale**

#### Étape 5 : Capitalisation (2 semaines après)

1. **Indexer dans EKTS** (Phase 06-07)
2. **Publier dans bibliothèque** (Phase 09)
3. **Planifier la review** à +3 mois
4. **Suivre le plan d'action**

### 6.3 Exemples de leçons apprises

**Technique** :
- "Utiliser React Three Fiber dès le début aurait économisé 2 semaines de migration depuis Three.js vanilla"
- "Les tests visuels avec Chromatic ont détecté 15 régressions avant production"
- "Le smooth scroll Lenis a amélioré l'UX mais a causé des problèmes de performance sur mobile"

**Processus** :
- "Les daily standups de 15min max sont plus efficaces que les réunions d'1h"
- "La review de code à 2 reviewers a réduit les bugs de 40%"
- "Les sprints de 2 semaines permettent un meilleur feedback que les sprints d'1 mois"

**Collaboration** :
- "La documentation Figma partagée a amélioré la communication designer/dev"
- "Les sessions de pair programming ont accéléré l'onboarding des nouveaux"
- "Les retrospectives hebdomadaires ont permis d'ajuster le tir rapidement"

**Business** :
- "Impliquer les stakeholders tôt évite les changements de scope tardifs"
- "Les user tests avec 5 utilisateurs détectent 85% des problèmes d'UX"
- "Le MVP approach permet de valider les hypothèses avant d'investir massivement"

---

## 7. Intégration EKTS

### 7.1 Stockage Phase 06

```sql
INSERT INTO postmortems (
  id, project_name, project_date, author, severity,
  objectives, results, lessons, recommendations,
  technical_debt, action_plan, created, updated
) VALUES (
  'uuid-generated',
  'Projet X',
  '2026-01-01 → 2026-06-30',
  'Auteur',
  'SEV-2',
  '{"planned": [...], "delivered": [...]}',
  '{"business": {...}, "technical": {...}}',
  '{"technical": [...], "process": [...], "collaboration": [...]}',
  '{"immediate": [...], "short_term": [...], "long_term": [...]}',
  '{"inventory": [...], "repayment_plan": [...]}',
  '{"actions": [...]}',
  NOW(),
  NOW()
);
```

### 7.2 Indexation RAG Phase 07

```javascript
// Chunking pour recherche sémantique
const chunks = [
  {
    id: 'postmortem-x-lessons',
    type: 'postmortem',
    project: 'Projet X',
    content: 'Leçons apprises Projet X : 1) Utiliser R3F dès le début, 2) Tests visuels avec Chromatic, 3) Lenis scroll performance mobile',
    embedding: await embed('Projet X leçons apprises technique processus')
  },
  {
    id: 'postmortem-x-recommendations',
    type: 'postmortem',
    project: 'Projet X',
    content: 'Recommandations Projet X : Immediate: Migrer vers R3F, Short-term: Implémenter Chromatic, Long-term: Standardiser smooth scroll',
    embedding: await embed('Projet X recommandations immediate short-term')
  },
  {
    id: 'postmortem-x-debt',
    type: 'postmortem',
    project: 'Projet X',
    content: 'Dette technique Projet X : DT-001 Code (refactor auth, 5 jours), DT-002 Tests (couverture 60%→80%, 3 jours)',
    embedding: await embed('Projet X dette technique code tests')
  }
];

await db.ragChunks.insertMany(chunks);
```

### 7.3 Outil MCP

```typescript
// MCP tool
{
  name: 'search_postmortem',
  description: 'Rechercher un post-mortem de projet par mot-clé, leçon, ou recommandation',
  parameters: {
    query: string,
    type?: 'lesson' | 'recommendation' | 'debt' | 'incident',
    project?: string
  },
  handler: async (params) => {
    const results = await rag.search(params.query, {
      filter: {
        type: 'postmortem',
        subtype: params.type,
        project: params.project
      },
      topK: 5
    });
    
    return results.map(r => ({
      project: r.project,
      type: r.subtype,
      content: r.content,
      date: r.created
    }));
  }
}
```

**Usage agent** :
```
Agent: "Quelles leçons ont été apprises sur la performance mobile ?"
→ MCP: search_postmortem("performance mobile", type="lesson")
→ RAG: Recherche dans leçons post-mortems
→ Retour: [Projet X: Lenis mobile issues, Projet Y: Image optimization, ...]
```

---

## 8. Limites

### 8.1 Limites identifiées

1. **Temps requis** : Post-mortem complet nécessite 1-2 jours (préparation + session + rédaction)
2. **Subjectivité** : Leçons apprises peuvent être subjectives
3. **Biais de rappel** : Tendances à se souvenir des événements récents/négatifs
4. **Participation** : Difficile de réunir tous les stakeholders
5. **Suivi** : Plan d'action peut être oublié sans suivi régulier

### 8.2 Questions ouvertes

1. **Fréquence** : Post-mortem pour chaque projet ou seulement les importants ?
2. **Anonymat** : Faut-il anonymiser certains feedbacks ?
3. **Transparence** : Partager avec toute l'organisation ou restreindre ?
4. **Metrics** : Comment mesurer l'impact des leçons apprises ?
5. **Automatisation** : Peut-on automatiser la collecte de données ?

---

## 9. Recommandations

### 9.1 Bonnes pratiques

1. **Blameless** : Toujours focus sur le système, pas les individus
2. **Data-driven** : Utiliser métriques et faits, pas opinions
3. **Actionnable** : Chaque problème → recommandation concrète
4. **Suivi** : Planifier review à +3 mois
5. **Capitalisation** : Indexer dans EKTS pour réutilisation

### 9.2 Outils recommandés

**Session** :
- **Miro** : Brainstorming visuel
- **Notion** : Prise de notes collaborative
- **Otter.ai** : Transcription automatique

**Métriques** :
- **Lighthouse** : Performance web
- **SonarQube** : Qualité code
- **Sentry** : Incidents et erreurs
- **Google Analytics** : Usage utilisateur

**Suivi** :
- **GitHub Issues** : Plan d'action
- **Linear** : Tracking tâches
- **Slack reminders** : Rappels review

### 9.3 Intégration EKTS

1. **Phase 06** : Stockage post-mortems dans SQLite
2. **Phase 07** : Indexation RAG pour recherche sémantique
3. **Phase 09** : Publication leçons dans bibliothèque
4. **MCP** : Exposer `search_postmortem(query, type)` comme outil

---

## 10. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **Template en 10 sections** | Couverture complète (contexte → suivi) | 5 sections → pas assez exhaustif |
| **Blameless** | Focus sur apprentissage systémique | Blaming → culture de peur |
| **5 pourquoi** | Méthode simple et efficace pour root cause | Fishbone → plus complexe |
| **Dette technique séparée** | Visibility et suivi dédié | Intégré dans problèmes → pas de tracking |
| **Recommandations temporelles** | Priorisation claire (immédiat/court/long) | Liste simple → pas de priorisation |
| **Indexation RAG** | Réutilisabilité pour futurs projets | Stockage simple → pas de recherche |

---

## 11. Questions

1. **Fréquence** : Post-mortem systématique ou seulement projets importants ?
2. **Anonymat** : Comment gérer les feedbacks sensibles ?
3. **Transparence** : Qui a accès aux post-mortems ?
4. **Suivi** : Comment garantir l'exécution du plan d'action ?
5. **Metrics** : Comment mesurer le ROI des post-mortems ?

---

## 12. Sources

### 12.1 Templates industrie

1. **Plane** — Project post-mortem template (2026)
2. **Rootly** — Postmortem meeting guide (2026)
3. **NN/g** — UX post-mortems (2026)
4. **builtin.com** — Making the most of post-mortems (2021)

### 12.2 Méthodes

5. **5 pourquoi** — Sakichi Toyoda (Toyota)
6. **Ishikawa diagram** — Kaoru Ishikawa (1960s)
7. **Blameless post-mortem** — John Allspaw (Etsy, 2012)

### 12.3 Phases EKTS

8. **Phase 06** — Stockage SQLite
9. **Phase 07** — RAG et recherche sémantique
10. **Phase 09** — Bibliothèque créative

---

## 13. Relations

### 13.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 04** (Automatisation navigateur) | Tests E2E à documenter |
| **Phase 06** (Stockage) | Stockage post-mortems |
| **Phase 07** (RAG) | Indexation sémantique |
| **Phase 08** (Analyse expérience) | Rapports d'inspection |
| **Phase 09** (Bibliothèque créative) | Publication leçons |
| **Phase 10** (Workflow capitalisation) | Process global |

### 13.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 11** (Sécurité) | Incidents sécurité |
| **Phase 12** (Comparatif IA) | Benchmarks |

---

## 14. Critères d'évaluation

### 14.1 Critères de complétude

- [x] Template en 10 sections
- [x] Guide d'utilisation détaillé
- [x] Exemples concrets
- [x] Intégration EKTS (Phases 06-07-09)
- [x] Outil MCP (search_postmortem)

### 14.2 Critères de qualité

- [x] Blameless approach
- [x] Data-driven
- [x] Actionnable
- [x] Réutilisable

### 14.3 Critères d'actionnabilité

- [x] Template prêt à l'emploi
- [x] Guide étape par étape
- [x] Exemples de leçons
- [x] Intégration MCP

---

**Document rédigé le 21 octobre 2026 — Phase 10 du projet EKTS**
