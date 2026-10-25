# Roadmap — Engineering Knowledge Tooling System

> Périmètre, avancement et planification · dernière mise à jour :
> **25 octobre 2026**

## MVP-2 — Terminé ✅

**Planifié :** 12 semaines (Sprints 7–12) · **Réalisé :** Sprints 7–12 livrés
sur le dépôt (23 → 25 octobre 2026, historique git vérifiable)
**Statut :** ✅ **Validé — 88/88 critères** (`docs/MVP2_VALIDATION.md`)

### Fonctionnalités livrées

- ✅ **Inspection 3 niveaux L1–L3** (Playwright, Lighthouse, axe-core) —
  L4 (crawling) hors périmètre par décision explicite
- ✅ **Analyse 5 dimensions** : performance, accessibilité, SEO, UX, contenu
  (poids 25/25/20/15/15, matrice sévérité × effort × impact)
- ✅ **Stockage SQLite** : schéma audits + ressources, FTS5, vecteurs
  (sqlite-vec), migrations, WAL
- ✅ **Recherche hybride** : BM25 (FTS5) + cosine + fusion RRF (k = 60),
  plafonds `MAX_SEARCH_LIMIT` 100 / `MAX_LIST_LIMIT` 1000
- ✅ **Rapports** : Markdown, PDF (Puppeteer 25, Chrome résolu multi-chemins),
  comparaison d'audits (évolution, deltas, recommandations)
- ✅ **CLI complète — 10 commandes** : `init`, `add`, `get`, `search`,
  `list`, `delete`, `status`, `reindex`, `inspect`, `audit`
  (`list`/`show`/`report`/`compare`) · codes de sortie 0/1/2/3/4
- ✅ **MCP complet — 7 outils** : `search_knowledge`, `get_resource`,
  `list_resources`, `validate_resource`, `inspect_site`, `audit_history`,
  `audit_report`
- ✅ **Tests E2E** : 5 flux (inspection, CLI, MCP, comparaison, workflow
  complet), zéro réseau externe, budgets < 60 s mesurés en boucle S12-1
- ✅ **Documentation** : 19 fichiers dans `docs/` (**5 081 lignes**), dont
  USER_GUIDE, DEVELOPER_GUIDE, API_REFERENCE, TROUBLESHOOTING, CONTRIBUTING

### Métriques finales MVP-2

| Indicateur | Valeur |
|------------|--------|
| Code source TypeScript | **19 776 lignes** (`src/`) |
| Tests | 1 260 · couverture **97,06 %** lignes / 93,06 % branches |
| Documentation `docs/` | 5 081 lignes (hors blueprint) |
| CI | 7/7 jobs verts par push (qualité ×4, secrets, audit deps, benchmark) |
| Performance | budgets : stockage 0,89 ms/audit · recherche 2,74 ms/10 k audits · PDF 2–4 s |
| Sécurité | Gitleaks pre-commit + CI · `npm audit` 0 vuln · aucun secret en dépôt |

---

## MVP-3 — Capitalisation Projets (planifié)

**Durée estimée :** 12 semaines (Sprints 13–18)
**Objectif :** Capitaliser les connaissances et bonnes pratiques entre projets

### Vision

Permettre aux équipes de :

- Gérer plusieurs projets simultanément
- Suivre l'évolution des audits dans le temps
- Capitaliser les bonnes pratiques extraites des audits réussis
- Partager les connaissances entre projets
- Générer des recommandations contextuelles

> **Validation explicite requise** : chaque sprint MVP-3 fera l'objet d'un
> feu vert (règle maison) avant démarrage, comme pour MVP-2.

### Sprints planifiés

#### Sprint 13 — Gestion Multi-Projets (2 semaines)

**Objectif :** plusieurs projets coexistant dans une même instance.

- Modèle `Project` (id, name, description, url, createdAt)
- Association audits ↔ projets (clé étrangère + migration)
- CLI `ekts project create/list/show/delete` (extension naturelle du
  runtime Commander existant)
- MCP `create_project`, `list_projects` (schémas Zod + handlers déclarés,
  comme les 7 outils actuels)
- Filtre `--project` transversal à `list`/`audit list`/`search`

**Critères :** stockage < 50 ms/projet · recherche < 50 ms · support
100 projets · documentation mise à jour (CLI, MCP, API_REFERENCE).

#### Sprint 14 — Suivi Temporel (2 semaines)

**Objectif :** lire l'évolution d'un projet dans le temps.

- Timeline des audits par projet (réutilise `AuditStatisticsManager.getTrend`)
- Graphiques d'évolution des scores (rendu HTML embarqué ou export)
- Détection de tendances amélioration/régression
- Alertes automatiques (régression de score > 10 points entre audits)
- CLI `ekts timeline <project>` · MCP `get_timeline`

**Critères :** timeline < 2 s (50 audits) · détection de tendances < 1 s ·
graphiques lisibles hors ligne · documentation.

#### Sprint 15 — Capitalisation Connaissances (2 semaines)

**Objectif :** transformer les constats réussis en capital réutilisable.

- Modèle `BestPractice` (titre, description, catégorie, tags, projets)
- Extraction automatique depuis audits (patterns de constats résolus)
- Recherche sémantique des bonnes pratiques (moteur hybride existant)
- Associations findings ↔ bonnes pratiques
- CLI `ekts bestpractice list/search/add` · MCP `search_best_practices`,
  `add_best_practice`

**Critères :** extraction < 5 s (100 audits) · recherche < 100 ms ·
support 1 000 bonnes pratiques · documentation.

#### Sprint 16 — Recommandations Contextuelles (2 semaines)

**Objectif :** recommander en fonction du projet et de son historique.

- Moteur de recommandations (règles + scoring, sans ML obligatoire)
- Analyse des patterns récurrents (corpus d'audits + bonnes pratiques)
- Suggestions personnalisées et score de pertinence
- Intégration dans les rapports Markdown/PDF (générateurs existants)
- CLI `ekts recommend <project>` · MCP `get_recommendations`

**Critères :** génération < 5 s · pertinence > 80 % (validation humaine) ·
support 10 000 règles · documentation.
**Risque maître :** complexité du moteur → prototype imposé avant engagement.

#### Sprint 17 — Templates Projets (2 semaines)

**Objectif :** initialiser rapidement des projets typés.

- Modèle `ProjectTemplate` (name, description, config, bestPractices)
- Templates prédéfinis (e-commerce, SaaS, blog, …)
- Création d'un projet depuis un template + personnalisation
- CLI `ekts template list/create/apply` · MCP `list_templates`,
  `apply_template`

**Critères :** 10 templates prédéfinis · application < 10 s ·
personnalisation flexible · documentation.

#### Sprint 18 — Tests + Documentation MVP-3 (2 semaines)

**Objectif :** valider et documenter MVP-3, préparer MVP-4.

- Tests E2E MVP-3 (budget < 120 s, héritage des patterns Sprint 12)
- Couverture > 85 % (aujourd'hui 97 %, seuil maison 80 %)
- Guides MVP-3 (utilisateur + développeur + API)
- Validation des critères MVP-3 · mise à jour README + CHANGELOG
- Préparation MVP-4 (optionnel) sous réserve de feu vert

### Détail des livrables MVP-2 par sprint

| Sprint | Livrables principaux | Témoins vérifiables |
|--------|----------------------|---------------------|
| 7 | Socle Playwright, bac à sable Windows, budgets | `src/browser/navigator.ts`, `docs/PLAYWRIGHT.md` |
| 8 | Inspecteur L1–L3, Lighthouse, axe, dégradations | `src/browser/inspection/level-{1,2,3}.ts`, `docs/INSPECTOR.md` |
| 9 | 5 analyseurs, sévérité, priorisation, pont | `src/analysis/*.ts`, `docs/ANALYSIS.md` |
| 10 | Schéma audits, FTS5, vecteurs, RRF, stats | `src/storage/*.ts`, `docs/STORAGE.md` |
| 11 | Markdown/PDF/comparaison, CLI 10 commandes, MCP 7 outils | `src/reports/`, `src/cli/`, `src/mcp/`, `docs/REPORTS.md` |
| 12 | 5 E2E, 5 guides, validation 88/88, roadmap | `tests/e2e/`, `docs/USER_GUIDE.md`…, `MVP2_VALIDATION.md` |

### Options techniques pour le moteur de recommandations (Sprint 16)

1. **Règles explicites (recommandé en ouverture)** : table de règles
   `(dimension, sévérité, contexte projet) → recommandation`, testable sans
   dépendance IA, explicable dans les rapports.
2. **Scoring statistique** : fréquence des constats récurrents × impact ×
   adéquation du projet (réutilise `AuditStatisticsManager`).
3. **Embeddings contextuels** (optionnel) : similarité projet ↔ bonnes
   pratiques via l'espace d'embedding existant — sous réserve d'une clé,
   jamais requis pour démarrer (règle « pas de clé pour démarrer »).

Le prototype du Sprint 16 comparera 1 et 2 avant tout engagement sur 3.

### Estimation de critères MVP-3

La spec MVP-3 vise **~100 critères** (vs 88 en MVP-2) ; la grille par
sprint reprendra le modèle validé ici : critères fonctionnels, techniques
(budgets mesurés), qualité (couverture, docs, CI) — avec audit de véracité
des modèles avant exécution.

| Sprint | Dépend de |
|--------|-----------|
| 13 | aucun (point de départ) |
| 14 | 13 (projets) |
| 15 | 13 (projets) |
| 16 | 15 (bonnes pratiques) |
| 17 | 13 (projets) |
| 18 | 13 → 17 |

### Métriques cibles MVP-3

| Métrique | Objectif |
|----------|----------|
| Lignes de code ajoutées | ~10 000–15 000 |
| Couverture tests | > 85 % |
| Documentation ajoutée | ~2 500 lignes |
| Stockage projet | < 50 ms |
| Timeline (50 audits) | < 2 s |
| Recherche bonnes pratiques | < 100 ms |
| Recommandations | < 5 s |
| Templates | < 10 s |

### Risques MVP-3

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Complexité du moteur de recommandations | Élevé | Moyen | Prototype obligatoire au Sprint 16 avant engagement |
| Performance timeline (nombreux audits) | Moyen | Faible | Pagination + cache ; budgets existants |
| Adoption des bonnes pratiques | Élevé | Moyen | UX soignée + documentation (spécificité S18) |
| Templates trop rigides | Moyen | Faible | Personnalisation par configuration, jamais de code figé |
| Dérive de périmètre hors MVP-3 | Moyen | Moyen | Règle P3 : tout écart soumis avant implémentation |

---

## MVP-4 — Collaboration (optionnel, non engagé)

**Durée estimée :** 8 semaines (Sprints 19–22)
**Objectif :** partager, commenter, assigner, notifier.
**Condition :** feu vert explicite après MVP-3.

- Sprint 19 — Authentification + autorisations
- Sprint 20 — Partage de projets
- Sprint 21 — Commentaires + actions sur les constats
- Sprint 22 — Notifications + rapports d'équipe

*Détails à définir après validation MVP-3.*

---

## Capitaux réutilisables en MVP-3

Le MVP-3 part de l'existant, **sans refonte** (contrainte de périmètre) :

| Capital MVP-2 | Réutilisation MVP-3 |
|---------------|---------------------|
| `AuditRepository` + migrations | association audits ↔ projets (clé étrangère) |
| `AuditSearch` (FTS5 + vecteurs + RRF) | recherche de bonnes pratiques (Sprint 15) |
| `AuditStatisticsManager.getTrend` | timeline et alertes (Sprint 14) |
| `MarkdownReportGenerator` / PDF | intégration des recommandations (Sprint 16) |
| Runtime CLI (`execute`, `exitCodeFor`) | nouvelles commandes `project`, `timeline`, … |
| Schémas Zod + handlers MCP | outils MCP MVP-3 sans nouvelle mécanique |
| Patterns E2E (serveur local, `skipIf`, binaire compilé) | E2E MVP-3 (Sprint 18) |
| Feuille de route et registres | statuts/risques mis à jour à chaque sprint |

### Prérequis d'ouverture du Sprint 13

- [ ] Feu vert explicite pour MVP-3 (règle maison, comme Sprint 12).
- [ ] Audit préalable des fichiers concernés (règle S9+).
- [ ] `npm run verify` code 0 et CI verte sur le dernier état MVP-2.
- [ ] Registre des décisions/risques à jour (SPRINT-12-03-RESULTAT.md).

### Méthode de livraison (héritée, inchangée)

1. Lire la spec du sprint + les docs d'architecture concernées.
2. Audit de véracité des modèles de spec **avant** toute écriture.
3. Implémenter le périmètre strict ; écarts → soumission P3.
4. Boucle de correction : échecs identifiés → causes racines → fixes →
   re-exécution jusqu'à **zéro échec**, y compris sur le poste développeur.
5. `npm run verify` code 0, commits atomiques, push, CI 7/7.
6. Statut + rapport `SPRINT-XX-YY-RESULTAT.md` puis passage de relais.

---

## Horizon long

| MVP | Thème | Contenu indicative |
|-----|-------|--------------------|
| **MVP-5** | Intégrations | Slack/Teams, Jira/Trello, GitHub/GitLab, CI/CD |
| **MVP-6** | Intelligence artificielle | détection de patterns, prédiction de régressions, assistant IA |
| **MVP-7** | Marketplace | plugins communautaires, templates partagés, intégrations tierces |

Aucun de ces horizons n'est engagé : ils suivent la règle de feu vert
par MVP.

---

## Calendrier global

| Phase | Durée planifiée | Statut |
|-------|-----------------|--------|
| MVP-1 (base : connaissances, recherche, CLI, MCP) — Sprints 1–6 | 6 semaines | ✅ Terminé (dépôt : 21–23/10/2026) |
| MVP-2 (inspection, analyse, rapports) — Sprints 7–12 | 12 semaines | ✅ **Validé 88/88** (dépôt : 23–25/10/2026) |
| MVP-3 (capitalisation projets) — Sprints 13–18 | 12 semaines | 🔄 Planifié (feu vert requis par sprint) |
| MVP-4 (collaboration) — Sprints 19–22 | 8 semaines | ⏳ Optionnel |
| MVP-5 (intégrations) | 6 semaines | ⏳ Horizon |
| MVP-6 (IA) | 8 semaines | ⏳ Horizon |
| MVP-7 (marketplace) | 10 semaines | ⏳ Horizon |

---

## Règles de navigation de la roadmap

1. **Feu vert par MVP/sprint** : rien ne démarre sans validation explicite.
2. **Audit avant modification** : état des lieux à chaque nouveau sprint.
3. **P3 — écarts soumis** : toute dérive de périmètre est soumise avec
   explications avant implémentation.
4. **Zéro modification silencieuse** : les statuts (REGISTRE-AVANCEMENT,
   fiches sprint, RESULTAT) sont mis à jour à chaque clôture.
5. **Qualité non négociable** : `npm run verify` code 0, CI 7/7, seuils de
   couverture 80 %, `npm audit` sans haute sévérité.

---

## Contribution

Voir `docs/CONTRIBUTING.md` · guides : `docs/DOCS.md` ·
avancement détaillé : `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`.

---

**Version :** 0.1.0 (MVP-2 validé) · **Dernière mise à jour :** 25 octobre 2026
