# SPRINT-16 — Recommandations Contextuelles

**Sprint :** 16 sur 18  
**MVP :** MVP-3 (Capitalisation de Projets)  
**Durée estimée :** 2 semaines (9 jours ouvrables)  
**Statut :** ✅ TERMINÉ

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le Sprint 13 a mis en place la gestion multi-projets, le Sprint 14 le suivi temporel et le Sprint 15 la capitalisation des connaissances (bonnes pratiques). EKTS dispose maintenant d'une base riche : audits historiques, tendances détectées, bonnes pratiques extraites et associations findings ↔ bonnes pratiques.

Le problème : ces connaissances restent **réactives**. L'utilisateur doit manuellement chercher les bonnes practices ou analyser les tendances. Il n'y a pas de système **proactif** qui analyse le contexte d'un projet et suggère automatiquement les actions prioritaires.

Le Sprint 16 transforme cette base en **moteur de recommandations intelligent** : en analysant le contexte du projet (audits récents, tendances, bonnes practices existantes, historique de résolutions), le moteur génère des recommandations personnalisées et priorisées.

### 1.2 Objectifs du Sprint 16

Le Sprint 16 doit fournir :

1. **Modèle RecommendationRule** — Structure de règles explicites (dimension, sévérité, contexte → recommandation)
2. **RecommendationEngine** — Moteur hybride (règles explicites + scoring statistique)
3. **Scoring contextuel** — Score de pertinence basé sur le contexte projet (historique, tendances, bonnes practices)
4. **Intégration rapports** — Recommandations intégrées dans les rapports Markdown/PDF existants
5. **CLI `ekts recommend`** — Commande pour générer et afficher les recommandations
6. **MCP `get_recommendations`** — Outil MCP pour les agents IA
7. **Tests complets** — Couverture > 80%
8. **Documentation** — Guide utilisateur et référence API

### 1.3 Périmètre

**Inclus :**
- Modèle de règles explicites (table `recommendation_rules`)
- Module `RecommendationEngine` (règles + scoring statistique)
- Module `RecommendationRepository` (CRUD des règles, stockage des recommandations générées)
- Scoring contextuel (historique projet, tendances, bonnes practices)
- Intégration dans les rapports Markdown (extension de `MarkdownReportGenerator`)
- Intégration dans les rapports PDF (extension de `PdfReportGenerator`)
- Commande CLI `ekts recommend` (2 sous-commandes : `generate`, `list`)
- Outil MCP `get_recommendations`
- Tests unitaires et d'intégration
- Documentation utilisateur et technique

**Exclu :**
- Apprentissage automatique (ML) — approche par règles explicites uniquement
- Recommandations en temps réel (streaming)
- Personnalisation par utilisateur (pas de profil utilisateur dans MVP-3)
- Export de règles vers d'autres instances (post-MVP)
- Interface graphique web (pas dans le scope MVP)

### 1.4 Critères d'acceptation

**Fonctionnels :**
- C16.1 : Le moteur génère des recommandations basées sur les règles explicites
- C16.2 : Le moteur combine règles explicites + scoring statistique (fréquence × impact × contexte)
- C16.3 : Les recommandations sont personnalisées selon le contexte du projet (historique, tendances)
- C16.4 : Chaque recommandation a un score de pertinence (0-1)
- C16.5 : Les recommandations sont triées par pertinence décroissante
- C16.6 : Les recommandations sont intégrées dans les rapports Markdown
- C16.7 : Les recommandations sont intégrées dans les rapports PDF
- C16.8 : Commande CLI `ekts recommend generate <projectId>` génère les recommandations
- C16.9 : Commande CLI `ekts recommend list [projectId]` affiche les recommandations
- C16.10 : Outil MCP `get_recommendations` retourne les recommandations pour un projet
- C16.11 : Les règles peuvent être ajoutées/modifiées/supprimées via CLI
- C16.12 : Les bonnes practices sont automatiquement proposées comme recommandations si pertinentes

**Techniques :**
- C16.13 : Génération des recommandations < 5s pour un projet avec 100 audits
- C16.14 : Support de 10 000 règles sans dégradation de performance
- C16.15 : Couverture de tests > 80%
- C16.16 : Code linté sans erreur (`npm run lint`)
- C16.17 : Documentation complète (guide utilisateur + référence API)

**Qualité :**
- C16.18 : Pertinence > 80% (validation humaine sur un échantillon de 20 projets)
- C16.19 : Recommandations actionnables (titre, description, priorité, effort estimé)
- C16.20 : Gestion des cas limites (0 audit, 1 audit, projet sans historique)

### 1.5 Dépendances

**Prérequis :**
- Sprint 9 : Analyse 5 dimensions (findings, sévérité, priorité)
- Sprint 10 : Stockage des audits (audit_metadata, audit_findings, audit_dimensions)
- Sprint 13 : Gestion multi-projets (table projects, project_id dans audit_metadata)
- Sprint 14 : Suivi temporel (TimelineAnalyzer, TrendDetector)
- Sprint 15 : Capitalisation connaissances (BestPracticeService, associations findings ↔ BP)

**Dépendances futures :**
- Sprint 17 : Les templates pourront inclure des règles de recommandation prédéfinies
- Sprint 18 : Tests E2E MVP-3 intégreront le flux de recommandations

---

## 2. Architecture et conception

### 2.1 Composants à créer

```
src/recommendations/
├── recommendation.types.ts        # Types partagés
├── recommendation-rules.ts        # Modèle de règles explicites
├── recommendation-engine.ts       # Moteur hybride (règles + scoring)
├── recommendation-repository.ts   # CRUD des règles et recommandations
└── recommendation-context.ts      # Contexte projet (historique, tendances, BP)

src/cli/commands/
└── recommend.ts                   # Commande ekts recommend

src/mcp/tools/
└── get-recommendations.ts         # Outil MCP get_recommendations
```

### 2.2 Interfaces principales

**RecommendationEngine :**
```typescript
interface RecommendationEngine {
  generateRecommendations(projectId: string): Promise<RecommendationReport>;
  generateForFinding(finding: AuditFinding, projectId: string): Promise<Recommendation[]>;
  addRule(rule: CreateRecommendationRuleInput): Promise<RecommendationRule>;
  updateRule(ruleId: string, input: UpdateRecommendationRuleInput): Promise<RecommendationRule>;
  deleteRule(ruleId: string): Promise<void>;
  listRules(filters?: RecommendationRuleFilters): Promise<RecommendationRule[]>;
}
```

**RecommendationRepository :**
```typescript
interface RecommendationRepository {
  createRule(input: CreateRecommendationRuleInput): Promise<RecommendationRule>;
  getRuleById(id: string): Promise<RecommendationRule | null>;
  listRules(filters?: RecommendationRuleFilters): Promise<RecommendationRule[]>;
  updateRule(id: string, input: UpdateRecommendationRuleInput): Promise<RecommendationRule>;
  deleteRule(id: string): Promise<void>;
  saveRecommendation(recommendation: Recommendation): Promise<void>;
  getRecommendations(projectId: string): Promise<Recommendation[]>;
}
```

**RecommendationContext :**
```typescript
interface RecommendationContext {
  buildContext(projectId: string): Promise<ProjectContext>;
}
```

### 2.3 Modèle de données

**Nouvelles tables :**

**Table `recommendation_rules` :**
```sql
CREATE TABLE recommendation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  dimension TEXT NOT NULL,              -- 'performance' | 'accessibility' | 'seo' | 'ux' | 'content' | 'general'
  severity_threshold INTEGER NOT NULL,  -- Sévérité minimum pour activer la règle (0-4)
  pattern TEXT NOT NULL,                -- Pattern de finding (titre normalisé ou regex)
  recommendation_title TEXT NOT NULL,
  recommendation_description TEXT NOT NULL,
  effort INTEGER NOT NULL DEFAULT 3,    -- Effort estimé (1-5)
  impact INTEGER NOT NULL DEFAULT 3,    -- Impact estimé (1-5)
  priority TEXT NOT NULL DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low'
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_recommendation_rules_dimension ON recommendation_rules(dimension);
CREATE INDEX idx_recommendation_rules_active ON recommendation_rules(is_active);
```

**Table `generated_recommendations` :**
```sql
CREATE TABLE generated_recommendations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  rule_id TEXT,                         -- NULL si recommandation générée par scoring statistique
  finding_title TEXT,                   -- Finding déclencheur (si applicable)
  recommendation_title TEXT NOT NULL,
  recommendation_description TEXT NOT NULL,
  dimension TEXT NOT NULL,
  relevance_score REAL NOT NULL,        -- Score de pertinence (0-1)
  effort INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  priority TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id) ON DELETE SET NULL
);

CREATE INDEX idx_generated_recommendations_project ON generated_recommendations(project_id);
CREATE INDEX idx_generated_recommendations_score ON generated_recommendations(relevance_score DESC);
CREATE INDEX idx_generated_recommendations_generated_at ON generated_recommendations(generated_at DESC);
```

### 2.4 Algorithme de recommandation

**Approche hybride (règles explicites + scoring statistique) :**

**Étape 1 : Collecte du contexte projet**
- Récupérer les audits récents du projet (N derniers audits)
- Extraire les findings courants (dernier audit)
- Récupérer les tendances détectées (Sprint 14)
- Récupérer les bonnes practices associées (Sprint 15)
- Calculer les statistiques (fréquence des findings, scores moyens)

**Étape 2 : Application des règles explicites**
- Pour chaque finding courant :
  - Chercher les règles activées correspondant au pattern
  - Si règle trouvée ET sévérité ≥ seuil :
    - Générer une recommandation avec score de base = 0.8
    - Ajuster le score selon la sévérité du finding

**Étape 3 : Scoring statistique**
- Analyser la fréquence des findings dans l'historique du projet
- Pour les findings récurrents (≥ 3 occurrences) :
  - Calculer un score = fréquence × impact × (1 - taux_de_résolution)
  - Si une bonne practice est associée : proposer la BP comme recommandation
  - Score de base = 0.5 + (fréquence / max_fréquency) × 0.3

**Étape 4 : Personnalisation contextuelle**
- Ajuster les scores selon les tendances :
  - Si la dimension est en régression : +0.1 au score
  - Si la dimension est en amélioration : -0.1 au score
- Ajuster selon l'historique de résolutions :
  - Si le finding a déjà été résolu : -0.2 au score (moins prioritaire)
  - Si le finding persiste malgré plusieurs tentatives : +0.15 au score

**Étape 5 : Fusion et tri**
- Fusionner les recommandations des règles et du scoring statistique
- Dédupliquer (même titre = garder le score le plus élevé)
- Trier par score de pertinence décroissant
- Retourner les N premières recommandations (défaut : 10)

### 2.5 Réutilisation du capital MVP-2 et MVP-3

| Capital existant | Réutilisation Sprint 16 |
|-----------------|------------------------|
| `AuditRepository` | Lecture des findings et audits |
| `BestPracticeService` | Récupération des bonnes practices associées |
| `TimelineAnalyzer` | Contexte temporel (tendances) |
| `TrendDetector` | Détection des régressions/améliorations |
| `ProjectRepository` | Informations projet |
| `MarkdownReportGenerator` | Extension pour intégrer les recommandations |
| `PdfReportGenerator` | Extension pour intégrer les recommandations |
| CLI Commander | Extension naturelle pour `ekts recommend` |
| Schémas Zod + handlers MCP | Nouvel outil `get_recommendations` |

---

## 3. Décomposition en sous-sprints

### 3.1 Vue d'ensemble

**3 sous-sprints :**

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| **Sprint 16-01** | 3 jours | Types + Migration + RecommendationRules + RecommendationRepository + RecommendationEngine |
| **Sprint 16-02** | 3 jours | RecommendationContext + Scoring contextuel + Intégration rapports (Markdown/PDF) |
| **Sprint 16-03** | 3 jours | CLI + MCP + Tests intégration + Documentation |

### 3.2 Dépendances entre sous-sprints

```
Sprint 16-01 (Règles + Repository + Engine)
    ↓
Sprint 16-02 (Contexte + Scoring + Rapports)
    ↓
Sprint 16-03 (CLI + MCP + Docs)
```

**Dépendances critiques :**
- 16-02 dépend de 16-01 (besoin de `RecommendationEngine` pour générer les recommandations)
- 16-03 dépend de 16-01 et 16-02 (besoin du moteur complet + intégration rapports pour CLI/MCP)

---

## 4. Livrables

### 4.1 Code source

**Sprint 16-01 :**
- `src/recommendations/recommendation.types.ts`
- `src/recommendations/recommendation-rules.ts`
- `src/recommendations/recommendation-repository.ts`
- `src/recommendations/recommendation-engine.ts`
- `src/storage/migrations/007_create_recommendations.ts`

**Sprint 16-02 :**
- `src/recommendations/recommendation-context.ts`
- Extensions de `src/reports/markdown-generator.ts`
- Extensions de `src/reports/pdf-generator.ts`

**Sprint 16-03 :**
- `src/cli/commands/recommend.ts`
- `src/mcp/tools/get-recommendations.ts`

### 4.2 Tests

- `tests/recommendations/recommendation-rules.test.ts`
- `tests/recommendations/recommendation-repository.test.ts`
- `tests/recommendations/recommendation-engine.test.ts`
- `tests/recommendations/recommendation-context.test.ts`
- `tests/cli/recommend.test.ts`
- `tests/mcp/tools/get-recommendations.test.ts`
- `tests/integration/recommendations-integration.test.ts`

### 4.3 Documentation

- `docs/user/RECOMMENDATIONS.md` — Guide utilisateur
- Mise à jour de `docs/reference/CLI_REFERENCE.md`
- Mise à jour de `docs/reference/MCP_REFERENCE.md`
- Mise à jour de `docs/REPORTS.md` (section recommandations)

### 4.4 Modifications de fichiers existants

- `src/storage/migrations/migration-registry.ts` — Ajout migration 007
- `src/reports/markdown-generator.ts` — Ajout section recommandations
- `src/reports/pdf-generator.ts` — Ajout section recommandations
- `src/cli/index.ts` — Enregistrement commande recommend
- `src/mcp/tools/index.ts` — Enregistrement outil get_recommendations

### 4.5 Rapport de sprint

- `SPRINT-16-RESULTAT.md` — Rapport final du sprint

---

## 5. Décisions techniques

### ADR-036 : Approche hybride (règles explicites + scoring statistique)

**Décision :** Combiner deux approches :
1. **Règles explicites** : table de règles `(dimension, sévérité, pattern) → recommandation`
2. **Scoring statistique** : analyse de fréquence des findings × impact × contexte

**Justification :**
- Les règles explicites sont testables, explicables et maintenables
- Le scoring statistique capture les patterns récurrents non couverts par les règles
- L'approche hybride combine le meilleur des deux mondes
- Pas de ML requis (cohérent avec la roadmap : "sans ML obligatoire")

**Conséquences :**
- Créer une table `recommendation_rules` pour les règles explicites
- Implémenter un algorithme de scoring statistique dans `RecommendationEngine`
- Fusionner les résultats des deux approches avec déduplication
- Permettre l'ajout/suppression de règles via CLI

### ADR-037 : Scoring de pertinence basé sur le contexte

**Décision :** Calculer un score de pertinence (0-1) pour chaque recommandation en combinant :
- Score de base (0.8 pour règles, 0.5+ pour scoring statistique)
- Ajustement selon les tendances (régression +0.1, amélioration -0.1)
- Ajustement selon l'historique de résolutions (déjà résolu -0.2, persiste +0.15)
- Normalisation finale pour garantir 0 ≤ score ≤ 1

**Justification :**
- Permet de prioriser les recommandations les plus pertinentes
- Prend en compte le contexte spécifique du projet
- Transparent et explicable (chaque ajustement est documenté)

**Conséquences :**
- Implémenter `RecommendationContext` pour collecter l'historique et les tendances
- Appliquer les ajustements dans `RecommendationEngine`
- Afficher le score dans les rapports et la CLI

### ADR-038 : Intégration dans les rapports existants

**Décision :** Étendre `MarkdownReportGenerator` et `PdfReportGenerator` pour ajouter une section "Recommandations" en fin de rapport.

**Justification :**
- Réutilisation du capital existant (pas de nouveau générateur)
- Cohérence avec les rapports actuels
- Les recommandations sont contextualisées (projet + audit spécifique)

**Conséquences :**
- Ajouter une méthode `generateRecommendationsSection()` dans les générateurs
- Appeler cette méthode après la génération des sections existantes
- Format : liste triée par pertinence avec titre, description, effort, impact

---

## 6. Risques et mitigations

| ID | Risque | Prob. | Impact | Mitigation |
|----|--------|-------|--------|------------|
| R16.1 | Complexité du moteur de recommandations | Élevée | Élevé | Prototype obligatoire avant engagement (règles + scoring) |
| R16.2 | Recommandations non pertinentes (faux positifs) | Moyenne | Moyen | Validation humaine sur échantillon de 20 projets, ajustement des seuils |
| R16.3 | Performance sur gros volumes (10 000 règles) | Faible | Moyen | Index SQLite, pagination, cache des contextes projet |
| R16.4 | Intégration rapports trop invasive | Faible | Faible | Section optionnelle, activable par flag dans la configuration |

---

## 7. Prompt d'exécution pour l'agent de développement

**CONTEXTE :**
- Projet : EKTS (Engineering Knowledge Tooling System)
- Sprint : 16 — Recommandations Contextuelles
- Branche : `develop`
- Prérequis : Sprints 13-15 terminés (multi-projets, timeline, bonnes practices)

**INSTRUCTIONS :**

1. Lire `SPRINT-16.md` (ce document) pour comprendre les objectifs et l'architecture
2. Lire `SPRINT-16-01.md` pour le sous-sprint 1
3. Implémenter les tâches du sous-sprint 16-01 dans l'ordre :
   - Types → Migration → Rules → Repository → Engine
4. Rédiger `SPRINT-16-01-RESULTAT.md` avec les fichiers créés/modifiés
5. Exécuter `npm run verify` et corriger les erreurs
6. Lire `SPRINT-16-02.md` pour le sous-sprint 2
7. Implémenter les tâches du sous-sprint 16-02 dans l'ordre :
   - Context → Scoring → Intégration rapports
8. Rédiger `SPRINT-16-02-RESULTAT.md`
9. Exécuter `npm run verify` et corriger les erreurs
10. Lire `SPRINT-16-03.md` pour le sous-sprint 3
11. Implémenter les tâches du sous-sprint 16-03 dans l'ordre :
    - CLI → MCP → Tests intégration → Documentation
12. Rédiger `SPRINT-16-RESULTAT.md` (rapport final)
13. Exécuter `npm run verify` et corriger les erreurs

**CONTRAINTES :**
- Respecter les conventions du projet (ESLint, Prettier, TypeScript strict)
- Tests unitaires pour chaque module
- Couverture > 80% pour les nouveaux modules
- Documentation utilisateur (RECOMMENDATIONS.md)
- Pas de breaking changes sur l'API existante
- Fournir les emplacements exacts des fichiers créés/modifiés/supprimés

**LIVRABLES ATTENDUS :**
- Code source fonctionnel (`src/recommendations/`, `src/cli/`, `src/mcp/`)
- Tests unitaires et d'intégration
- Documentation utilisateur et référence
- Rapport de sprint (`SPRINT-16-RESULTAT.md`)
- `npm run verify` passe sans erreur

---

**Document rédigé le 25 octobre 2026 — Sprint 16 du projet EKTS**  
**Statut : ✅ Sprint 16 implémenté et validé (16-01/02/03)**
