# SPRINT-14 — Suivi Temporel

**Sprint :** 14 sur 18  
**MVP :** MVP-3 (Capitalisation de Projets)  
**Durée estimée :** 2 semaines (10 jours ouvrables)  
**Statut :** ✅ TERMINÉ (25/10/2026 — voir `SPRINT-14-RESULTAT.md`)

---

## 1. Contexte et objectifs

### 1.1 Contexte

Le Sprint 13 a mis en place la gestion multi-projets dans EKTS. Chaque audit est maintenant associé à un projet via le champ `project_id` dans la table `audit_metadata`. Le Sprint 14 exploite cette association pour permettre le suivi temporel de l'évolution de chaque projet.

Le suivi temporel est essentiel pour :
- Visualiser l'évolution des scores dans le temps
- Détecter les régressions ou améliorations
- Identifier les tendances récurrentes
- Générer des alertes automatiques
- Comparer l'évolution de plusieurs projets

### 1.2 Objectifs du Sprint 14

Le Sprint 14 doit fournir :

1. **Timeline des audits** — Visualisation chronologique des audits par projet
2. **Graphiques d'évolution** — Courbes d'évolution des scores par dimension
3. **Détection de tendances** — Algorithmes d'identification d'amélioration/régression
4. **Alertes automatiques** — Notification lors de régression significative (> 10 points)
5. **CLI `ekts timeline <project>`** — Commande pour afficher la timeline
6. **MCP `get_timeline`** — Outil MCP pour exposition aux agents
7. **Tests complets** — Couverture > 80%
8. **Documentation** — Guides utilisateur et référence API

### 1.3 Périmètre

**Inclus :**
- Modèle de données pour timeline (agrégation temporelle)
- Module `TimelineAnalyzer` (analyse d'évolution)
- Module `TrendDetector` (détection de tendances)
- Module `AlertManager` (gestion des alertes)
- Génération de graphiques (export PNG/SVG)
- Commande CLI `ekts timeline`
- Outil MCP `get_timeline`
- Tests unitaires et d'intégration
- Documentation utilisateur et technique

**Exclu :**
- Interface graphique web (pas dans le scope MVP)
- Notifications email/push (reporté post-MVP)
- Comparaison inter-projets (pourra être ajouté plus tard)
- Export de données brutes (déjà disponible via CLI existante)

### 1.4 Critères d'acceptation

**Fonctionnels :**
- C14.1 : Timeline affiche les audits d'un projet dans l'ordre chronologique
- C14.2 : Graphiques montrent l'évolution des 5 dimensions (performance, accessibilité, SEO, UX, contenu)
- C14.3 : Détection automatique de tendances (amélioration, régression, stable)
- C14.4 : Alertes générées si régression > 10 points entre 2 audits consécutifs
- C14.5 : Export de graphiques en PNG/SVG
- C14.6 : Commande CLI `ekts timeline <project>` fonctionne
- C14.7 : Outil MCP `get_timeline` retourne les données de timeline

**Techniques :**
- C14.8 : Timeline générée en < 2s pour 50 audits
- C14.9 : Détection de tendances en < 1s
- C14.10 : Couverture de tests > 80%
- C14.11 : Code linté sans erreur
- C14.12 : Documentation complète

**Qualité :**
- C14.13 : Graphiques lisibles et informatifs
- C14.14 : Alertes non-bloquantes (ne gênent pas le workflow)
- C14.15 : Gestion des cas limites (0 audit, 1 audit, audits erronés)

### 1.5 Dépendances

**Prérequis :**
- Sprint 13 : Gestion multi-projets (table `projects`, champ `project_id` dans `audit_metadata`)
- Sprint 10 : Stockage des audits (table `audit_metadata`, `audit_dimensions`)

**Dépendances futures :**
- Aucune dépendance bloquante pour les sprints suivants
- Le Sprint 15 (Capitalisation des Connaissances) pourra utiliser les tendances détectées

---

## 2. Architecture et conception

### 2.1 Composants à créer

```
src/timeline/
├── timeline-analyzer.ts       # Analyse de la timeline d'un projet
├── trend-detector.ts          # Détection de tendances
├── alert-manager.ts           # Gestion des alertes
├── chart-generator.ts         # Génération de graphiques
└── timeline.types.ts          # Types TypeScript

src/cli/commands/
└── timeline.ts                # Commande ekts timeline

src/mcp/tools/
└── get-timeline.ts            # Outil MCP get_timeline
```

### 2.2 Interfaces principales

**TimelineAnalyzer :**
```typescript
interface TimelineAnalyzer {
  analyze(projectId: string): Promise<TimelineAnalysis>;
  getAuditsByDateRange(projectId: string, start: Date, end: Date): Promise<AuditMetadata[]>;
}
```

**TrendDetector :**
```typescript
interface TrendDetector {
  detectTrends(timeline: TimelineAnalysis): Promise<TrendReport>;
  detectRegressions(timeline: TimelineAnalysis, threshold: number): Promise<Regression[]>;
}
```

**AlertManager :**
```typescript
interface AlertManager {
  checkAndCreateAlerts(regressions: Regression[]): Promise<Alert[]>;
  getActiveAlerts(projectId?: string): Promise<Alert[]>;
  markAlertAsResolved(alertId: string): Promise<void>;
}
```

**ChartGenerator :**
```typescript
interface ChartGenerator {
  generateTimelineChart(timeline: TimelineAnalysis, format: 'png' | 'svg'): Promise<Buffer>;
  generateDimensionChart(timeline: TimelineAnalysis, dimension: Dimension): Promise<Buffer>;
}
```

### 2.3 Modèle de données

**Tables existantes utilisées :**
- `projects` (Sprint 13)
- `audit_metadata` (Sprint 10, avec `project_id` du Sprint 13)
- `audit_dimensions` (Sprint 10)

**Nouvelles tables :**
- `alerts` — Stockage des alertes générées
- `trend_snapshots` — Snapshots périodiques des tendances (optionnel)

**Table `alerts` :**
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  audit_id_from INTEGER NOT NULL,
  audit_id_to INTEGER NOT NULL,
  dimension TEXT NOT NULL,
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,
  regression_points INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (audit_id_from) REFERENCES audit_metadata(id),
  FOREIGN KEY (audit_id_to) REFERENCES audit_metadata(id)
);
```

### 2.4 Algorithmes

**Détection de tendances :**
- Calcul de la pente de régression linéaire sur les N derniers audits
- Classification : amélioration (pente > +2), stable (-2 ≤ pente ≤ +2), régression (pente < -2)
- Fenêtre glissante configurable (défaut : 5 audits)

**Détection de régressions :**
- Comparaison audit[N] vs audit[N-1]
- Alerte si différence > threshold (défaut : 10 points)
- Alerte par dimension et sur le score global

---

## 3. Décomposition en sous-sprints

### 3.1 Vue d'ensemble

**3 sous-sprints :**

| Sous-sprint | Durée | Objectif |
|-------------|-------|----------|
| **Sprint 14-1** | 3 jours | Timeline + Trend Detection |
| **Sprint 14-2** | 3 jours | Alert Manager + Chart Generator |
| **Sprint 14-3** | 4 jours | CLI + MCP + Tests + Documentation |

### 3.2 Dépendances entre sous-sprints

```
Sprint 14-1 (Timeline + Trends)
    ↓
Sprint 14-2 (Alerts + Charts)
    ↓
Sprint 14-3 (CLI + MCP + Docs)
```

**Dépendances critiques :**
- 14-2 dépend de 14-1 (besoin de `TrendDetector` pour générer des alertes)
- 14-3 dépend de 14-1 et 14-2 (besoin de tous les modules pour CLI/MCP)

---

## 4. Livrables

### 4.1 Code source

- `src/timeline/timeline-analyzer.ts`
- `src/timeline/trend-detector.ts`
- `src/timeline/alert-manager.ts`
- `src/timeline/chart-generator.ts`
- `src/timeline/timeline.types.ts`
- `src/cli/commands/timeline.ts`
- `src/mcp/tools/get-timeline.ts`

### 4.2 Tests

- `tests/timeline/timeline-analyzer.test.ts`
- `tests/timeline/trend-detector.test.ts`
- `tests/timeline/alert-manager.test.ts`
- `tests/timeline/chart-generator.test.ts`
- `tests/cli/timeline.test.ts`
- `tests/mcp/tools/get-timeline.test.ts`

### 4.3 Documentation

- `docs/guides/TIMELINE.md` — Guide utilisateur du suivi temporel
- Mise à jour de `docs/CLI.md` — Ajout commande `ekts timeline`
- Mise à jour de `docs/MCP.md` — Ajout outil `get_timeline`
- Mise à jour de `docs/API_REFERENCE.md` — Ajout API timeline

### 4.4 Rapport de sprint

- `SPRINT-14-RESULTAT.md` — Rapport final du sprint

---

## 5. Risques et mitigations

### 5.1 Risques identifiés

**R14.1 — Performance sur gros volumes**
- **Risque :** Timeline lente si projet avec > 100 audits
- **Mitigation :** Pagination, cache des calculs, index sur `project_id` + `timestamp`
- **Probabilité :** Faible
- **Impact :** Moyen

**R14.2 — Faux positifs dans détection de tendances**
- **Risque :** Alertes sur variations normales (bruit)
- **Mitigation :** Seuil configurable, fenêtrage glissant, validation manuelle
- **Probabilité :** Moyen
- **Impact :** Faible

**R14.3 — Complexité des graphiques**
- **Risque :** Charts illisibles ou trop complexes
- **Mitigation :** Design simple, options de personnalisation, documentation claire
- **Probabilité :** Faible
- **Impact :** Moyen

### 5.2 Hypothèses

- H14.1 : Les audits d'un projet sont suffisamment réguliers pour permettre une analyse temporelle
- H14.2 : Les scores de dimensions sont comparables entre audits (même méthodologie)
- H14.3 : Les utilisateurs veulent des alertes non-bloquantes (pas de workflow approval)

---

## 6. Plan de présentation pour l'agent de développement

### 6.1 Contexte projet

EKTS est un système personnel d'ingénierie augmenté par l'IA. Le Sprint 14 fait partie du MVP-3 (Capitalisation de Projets) et vise à permettre le suivi temporel de l'évolution des projets.

### 6.2 État initial attendu

**Avant de commencer le Sprint 14 :**
- ✅ Sprint 13 terminé (gestion multi-projets)
- ✅ Table `projects` créée
- ✅ Table `audit_metadata` avec champ `project_id`
- ✅ Table `audit_dimensions` créée
- ✅ `ProjectRepository` et `ProjectManager` fonctionnels
- ✅ Audit des audits existants (Sprint 10)

**Vérifications à effectuer :**
```bash
npm run typecheck        # Doit passer sans erreur
npm run lint             # Doit passer sans erreur
npm test                 # Tous les tests doivent passer
npm run coverage         # Couverture > 80%
```

### 6.3 Documents de référence obligatoires

**À lire avant de commencer :**
1. `docs/ROADMAP.md` — Section Sprint 14 (Suivi Temporel)
2. `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` — ADR-031 (MVP-3)
3. `docs/blueprint/Docs/roadmap/sprints/SPRINT-14.md` — Ce document
4. `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-01.md` — Sous-sprint 1
5. `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-02.md` — Sous-sprint 2
6. `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-03.md` — Sous-sprint 3
7. `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` — Architecture globale
8. `docs/blueprint/Docs/03-STACK-ET-DECISIONS-TECHNOLOGIQUES.md` — Stack technique
9. `docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md` — Workflow Git

### 6.4 Règles de développement

**Interdictions absolues :**
- ❌ Ne jamais créer de pull request
- ❌ Ne jamais push sur `main`
- ❌ Ne jamais committer de secrets
- ❌ Ne jamais modifier les sprints précédents (1-13)

**Obligations :**
- ✅ Créer une branche dédiée : `agent/sprint-14` ou `sprint/14/suivi-temporel`
- ✅ Commits atomiques avec messages conventionnels
- ✅ Tests pour chaque fonctionnalité
- ✅ Documentation inline (JSDoc)
- ✅ Couverture de tests > 80%
- ✅ `npm run verify` passe avant chaque push

### 6.5 Workflow de travail

**Pour chaque sous-sprint :**
1. Lire le document du sous-sprint (SPRINT-14-0X.md)
2. Implémenter les tâches dans l'ordre
3. Tester chaque fonctionnalité
4. Documenter (JSDoc + guides)
5. Vérifier `npm run verify`
6. Commit et push
7. Rédiger un rapport de sous-sprint

**Points de contrôle :**
- Après 14-1 : Vérifier que timeline et trends fonctionnent
- Après 14-2 : Vérifier que alerts et charts fonctionnent
- Après 14-3 : Vérifier que CLI et MCP fonctionnent
- Fin de sprint : Rédiger SPRINT-14-RESULTAT.md

### 6.6 Critères de validation du sprint

**À la fin du Sprint 14 :**
- ✅ C14.1 à C14.15 : Tous les critères d'acceptation satisfaits
- ✅ `npm run verify` : Passe sans erreur
- ✅ Couverture de tests > 80%
- ✅ Documentation complète (guides + API)
- ✅ Rapport de sprint rédigé

### 6.7 Ressources externes à consulter

**Repos GitHub pertinents pour inspiration :**
- `github/spec-kit` — Patterns de specification-driven development
- `microsoft/playwright-mcp` — Patterns MCP pour outils d'analyse
- `cloudflare/security-audit-skill` — Patterns de détection et alertes
- `Atoll92/agent-standup` — Patterns de suivi d'état

**Documentation technique :**
- SQLite FTS5 — Pour requêtes temporelles
- Chart.js / D3.js — Pour génération de graphiques (si applicable)
- MCP Protocol — Pour exposition via agents

### 6.8 Livrables attendus

**Code :**
- Modules timeline, trends, alerts, charts
- Commande CLI `ekts timeline`
- Outil MCP `get_timeline`
- Tests unitaires et d'intégration

**Documentation :**
- Guide utilisateur `TIMELINE.md`
- Mise à jour `CLI.md`, `MCP.md`, `API_REFERENCE.md`
- JSDoc complet sur tous les modules

**Rapports :**
- Rapport de chaque sous-sprint
- Rapport final `SPRINT-14-RESULTAT.md`

---

## 7. Prompt d'exécution pour l'agent de développement

```markdown
Tu es l'agent de développement EKTS. Tu vas implémenter le Sprint 14 (Suivi Temporel).

## Étape 1 — Préparation

1. Vérifie que tu es sur la bonne branche :
   ```bash
   git branch
   ```
   Si tu n'es pas sur `agent/sprint-14`, crée-la :
   ```bash
   git checkout -b agent/sprint-14
   ```

2. Vérifie l'état du dépôt :
   ```bash
   npm run verify
   ```
   Tout doit passer (typecheck, lint, tests, coverage > 80%).

3. Lis les documents de référence :
   - `docs/blueprint/Docs/roadmap/sprints/SPRINT-14.md`
   - `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-01.md`
   - `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-02.md`
   - `docs/blueprint/Docs/roadmap/sprints/SPRINT-14-03.md`
   - `docs/ROADMAP.md` (section Sprint 14)

## Étape 2 — Implémentation

### Sous-sprint 14-1 (3 jours) : Timeline + Trend Detection

**Tâches :**
1. Créer `src/timeline/timeline.types.ts` — Définition des types
2. Créer `src/timeline/timeline-analyzer.ts` — Analyse de timeline
3. Créer `src/timeline/trend-detector.ts` — Détection de tendances
4. Créer `tests/timeline/timeline-analyzer.test.ts` — Tests
5. Créer `tests/timeline/trend-detector.test.ts` — Tests

**Vérifications :**
```bash
npm run typecheck
npm run lint
npm test -- tests/timeline/
```

**Rapport :** Créer `SPRINT-14-01-RESULTAT.md` avec :
- Fichiers créés/modifiés
- Tests exécutés et résultats
- Couverture de tests
- Décisions prises
- Problèmes rencontrés

### Sous-sprint 14-2 (3 jours) : Alert Manager + Chart Generator

**Tâches :**
1. Créer migration pour table `alerts`
2. Créer `src/timeline/alert-manager.ts` — Gestion des alertes
3. Créer `src/timeline/chart-generator.ts` — Génération de graphiques
4. Créer `tests/timeline/alert-manager.test.ts` — Tests
5. Créer `tests/timeline/chart-generator.test.ts` — Tests

**Vérifications :**
```bash
npm run typecheck
npm run lint
npm test -- tests/timeline/
```

**Rapport :** Créer `SPRINT-14-02-RESULTAT.md`

### Sous-sprint 14-3 (4 jours) : CLI + MCP + Tests + Documentation

**Tâches :**
1. Créer `src/cli/commands/timeline.ts` — Commande CLI
2. Créer `src/mcp/tools/get-timeline.ts` — Outil MCP
3. Créer `tests/cli/timeline.test.ts` — Tests CLI
4. Créer `tests/mcp/tools/get-timeline.test.ts` — Tests MCP
5. Créer `docs/guides/TIMELINE.md` — Guide utilisateur
6. Mettre à jour `docs/CLI.md` — Ajout commande timeline
7. Mettre à jour `docs/MCP.md` — Ajout outil get_timeline
8. Mettre à jour `docs/API_REFERENCE.md` — Ajout API timeline
9. Tests d'intégration complets

**Vérifications :**
```bash
npm run verify
```
Doit passer sans erreur (typecheck, lint, format, build, tests, coverage > 80%).

**Rapport final :** Créer `SPRINT-14-RESULTAT.md` avec :
- Liste de tous les fichiers créés/modifiés
- Résultats de tous les tests
- Couverture finale
- Documentation livrée
- Décisions prises
- Problèmes rencontrés et solutions
- Recommandations pour le Sprint 15

## Étape 3 — Validation

1. Vérifie que tous les critères d'acceptation sont satisfaits (C14.1 à C14.15)
2. Vérifie que `npm run verify` passe
3. Vérifie que la couverture est > 80%
4. Vérifie que la documentation est complète
5. Pousse ta branche :
   ```bash
   git add .
   git commit -m "feat(sprint-14): suivi temporel des projets"
   git push origin agent/sprint-14
   ```

## Étape 4 — Rapport

Rédige un rapport final résumant :
- Ce qui a été implémenté
- Les tests réalisés
- La documentation produite
- Les décisions prises
- Les problèmes rencontrés
- Les recommandations pour la suite

**Arrête-toi et attends le feu vert pour le Sprint 15.**
```

---

## 8. Résumé exécutif

### 8.1 Objectif

Permettre le suivi temporel de l'évolution des projets via timeline, graphiques, détection de tendances et alertes automatiques.

### 8.2 Durée

2 semaines (10 jours ouvrables)

### 8.3 Sous-sprints

- **Sprint 14-1** (3 jours) : Timeline + Trend Detection
- **Sprint 14-2** (3 jours) : Alert Manager + Chart Generator
- **Sprint 14-3** (4 jours) : CLI + MCP + Tests + Documentation

### 8.4 Livrables principaux

- Module `TimelineAnalyzer` (analyse d'évolution)
- Module `TrendDetector` (détection de tendances)
- Module `AlertManager` (gestion des alertes)
- Module `ChartGenerator` (graphiques)
- Commande CLI `ekts timeline`
- Outil MCP `get_timeline`
- Guide utilisateur `TIMELINE.md`
- Documentation API mise à jour

### 8.5 Critères de validation

15 critères obligatoires (fonctionnels, techniques, qualité)

### 8.6 Prochaine étape

**Sprint 15 — Capitalisation des Connaissances** (après approbation Sprint 14)

---

**Document rédigé le 25 octobre 2026 — Sprint 14 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 14 prêt pour approbation**
