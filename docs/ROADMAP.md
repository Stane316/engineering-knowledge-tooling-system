# Roadmap — Engineering Knowledge Tooling System

> Périmètre, avancement et planification · dernière mise à jour :
> **30 octobre 2026** — révision de trajectoire validée par le propriétaire.


> **Lecture de cette roadmap :** les sections MVP-1/2/3 et les chiffres de qualité associés conservent les déclarations historiques ; ils ne constituent pas une nouvelle campagne de validation. La section MVP-4 ci-dessous et le calendrier courant portent la trajectoire validée par le propriétaire ; l’ancien plan de collaboration et l’ancien calendrier restent visibles comme instantanés. Le [registre](blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md) suit l’avancement, cette page reste la seule roadmap de trajectoire. Les validations de spécification et de seuils n’autorisent ni développement, ni pilote, ni publication.

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

## MVP-3 — Capitalisation Projets ✅ Terminé

**Durée réelle :** sprints 13–18 livrés le 26 octobre 2026
**Statut :** ✅ **Validé — 97/97 lignes-critères** ([`docs/MVP3_VALIDATION.md`](MVP3_VALIDATION.md))
**Objectif :** Capitaliser les connaissances et bonnes pratiques entre projets

> **Résultat** : 5 fonctionnalités (multi-projets, suivi temporel, bonnes
> pratiques, recommandations, templates), 16 modules/commandes CLI de plus,
> catalogue MCP à **17 outils**, migrations 003→008, 1 656 tests
> (couverture 96,40 %), E2E MVP-3 **29,8 s** (< 120 s), guides
> `docs/MVP3_*.md`. Détail : [`SPRINT-18-RESULTAT.md`](blueprint/Docs/roadmap/sprints/SPRINT-18-RESULTAT.md).

### Vision

Permettre aux équipes de :

- Gérer plusieurs projets simultanément
- Suivre l'évolution des audits dans le temps
- Capitaliser les bonnes pratiques extraites des audits réussis
- Partager les connaissances entre projets
- Générer des recommandations contextuelles

> **Validation explicite appliquée** : chaque sprint MVP-3 a fait l'objet
> d'un feu vert utilisateur (S13→S18, dernier le 26/10/2026) — règle maison
> maintenue pour MVP-4.

### Sprints (tous livrés ✅)

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

## MVP-4 — Fiabilité et connaissances agentiques traçables

**Statut :** périmètre, architecture, spécification et seuils **validés pour la planification**. **Aucune implémentation n'existait au moment de cette rédaction** ; un développement a depuis été autorisé par feu vert distinct et le **sprint 19-01** (W01 — priorités et comptage) est terminé (`ad5cd35`, complément E2E `693fced`, rapport `SPRINT-19-01-RESULTAT.md`). Les autres sous-sprints restent non commencés ; cette page ne vaut pas autorisation : voir le [registre](blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md). La révision de cette roadmap et la décomposition documentaire des Sprints 19–24 ont été validées par le propriétaire le 30 octobre 2026. Le détail reste à vérifier avant chaque lancement ; les durées ne sont pas engagées et les feux verts de développement sont distincts. Les anciens S19–S22 « collaboration » sont conservés comme historique ; leur numérotation est réutilisée pour le nouveau périmètre validé.

**Objectif produit :** permettre à un agent de découvrir et consulter des connaissances autorisées, de produire un résultat sourcé et de rendre son utilisation vérifiable, tout en fiabilisant les audits web existants et en contrôlant effectivement les permissions.

**Références approuvées :** [scénario comparatif](audit/produit/19_SCENARIO_COMPARATIF_AGENT_EKTS.md), [architecture](audit/produit/20_ARCHITECTURE_MINIMALE_MVP4.md), [spécification](audit/produit/21_SPECIFICATION_MVP4.md), [43 critères et tests](audit/produit/22_CRITERES_ET_TESTS_MVP4.md). Les ID `P`, `R`, `T`, `W`, `O` et `C-*` ci-dessous renvoient à ces documents. Ils décrivent une cible, pas un résultat nouveau.

### 1. Décisions et arbitrages

| Sujet | Décision pour cette révision | Motif, condition ou conséquence |
|---|---|---|
| Socle local SQLite/FTS, CLI et serveur MCP existant | **Conservé** comme base d'architecture. | FTS explicite pour le pilote ; ne pas annoncer que les trois bases ou `sqlite-vec` ont été supprimées. La recherche hybride existante reste disponible dans son périmètre historique. |
| MVP-4 « collaboration d'abord » | **Modifié** : MVP-4 est recentré sur fiabilité, connaissances, traçabilité et permissions. | L'ancienne recommandation, sa durée et les S19–S22 sont conservés dans l'historique ci-dessous ; ce changement n'efface pas les validations MVP-3. |
| Partage d'équipes, comptes, commentaires et notifications | **Reportés**, non abandonnés. | Horizon non daté et non affecté à un futur numéro de MVP ; nouvelle décision et étude sécurité/backend nécessaires. Ne pas confondre contrôle local d'outils et authentification multi-utilisateur. |
| Profil local de lecture côté EKTS | **Ajouté à la cible indispensable**. | `P01–P03` ; contrôle des noms **et des arguments** : dans ce profil, `mode: fts` explicite ; mode omis, hybride et vectoriel refusés avant appel d'embeddings. Un contrôle externe vérifié peut suffire au seul pilote préliminaire. |
| Provenance, droits et preuve locale | **Ajoutés à la cible indispensable**. | `R01–R03`, `T01–T03` ; conserver les anciennes ressources à statut inconnu et ne pas copier des contenus sans droit. Les traces prouvent les événements observables, pas le raisonnement interne. |
| Fiabilité du module web | **Priorité maintenue et précisée**. | `W01–W06` : priorités cohérentes, valeurs absentes, score global indisponible ou erreur, métriques non confondues, preuves et reprise d'échec partiel. Les corrections restent à faire. |
| Intégration historique des recommandations dans les rapports | **Écart conservé et décision reportée**, pas déclaré résolu. | Les documents MVP-3 signalent `C16.6/C16.7` : sections présentes, moteur non injecté dans les chemins de rapport examinés. Leur intégration éventuelle ne doit pas être promise comme livrée ; voir [validation MVP-3](MVP3_VALIDATION.md) et [audit](audit/produit/15_PHASE1_MATRICE_ET_VALIDATION.md). |
| Nommage simplifié, français complet, corpus enrichi | **Reportés derrière les blocages structurels**. | Préférences maintenues, à traiter après fiabilité, traçabilité et permissions ; aucune intégration globale de skills. |
| Client MCP sortant dans EKTS, orchestrateur multi-agent, backend distant, marketplace | **Écartés du périmètre minimal actuel**, sans interdiction définitive. | Un hôte peut connecter EKTS et, si autorisé, un outil séparé ; réexaminer seulement sur besoin prouvé et décision distincte. |
| Firebase | **Abandon confirmé dans la trajectoire historique**. | Supabase ou alternative n'est **pas imposé** au MVP-4 local ; un éventuel besoin ultérieur de synchronisation exige une nouvelle comparaison. |
| Hôte/modèle, coût, fournisseur, isolement effectif, rétention | **À décider avant opération**. | L'architecture et les seuils sont validés ; cela n'autorise pas un fournisseur, un transfert, une exécution ou une dépense. Windows natif est la cible de validation retenue ; machine et hôte précis restent à sélectionner. |

### 2. Chantiers prioritaires et critères de sortie

Les codes ci-dessous sont des **lots de planification**, pas des sprints existants. Les chiffres de [22](audit/produit/22_CRITERES_ET_TESTS_MVP4.md) sont des seuils validés pour la planification, pas des résultats observés.

| Lot / priorité | Portée et dépendances | Critères d'acceptation et preuves attendues |
|---|---|---|
| **L0-W — P0 fiabilité web** | Priorités, valeurs absentes, score global, identité INP/FID/max-potential-FID/TBT, preuves minimales, échec partiel et lecture historique. Analyse des cibles autorisées et des redirections. Peut être spécifié parallèlement au lot permissions ; à livrer avant d'annoncer la fiabilité web MVP-4. | `W01–W06`, `O06` ; `C-W01–C-W14`. Zéro divergence sur les jeux prévus, cinq priorités et compteurs cohérents ; cas manquants distingués d'un zéro ; preuve des formats et de la reprise ; sécurité limitée aux cas effectivement testés. |
| **L0-P — P0 permissions et confidentialité** | Inventaire des effets, profil serveur de lecture, contrôle FTS explicite, refus fermé des autres outils/modes ; isolation hôte/OS et politique réseau. Les trois outils retenus ne rendent pas les autres processus sûrs. | `P01–P03`, `O01`, `O06` ; `C-P01–C-P08`, `C-O01`, `C-W13/W14`. Appels interdits directement testés et refusés, aucune action interdite exécutée dans le jeu ; états non observables bloqués/indéterminés. |
| **L1-R — P1 corpus et provenance** | Dépend de l'accès gouverné et d'une base isolée : contenu autorisé, source/version/état des droits, empreinte, correspondance ID↔UUID, préservation des ressources anciennes. | `R01–R03`, `O04` ; `C-R01–C-R05`, `C-O05`. Six contenus synthétiques identiques B/C et droits vérifiés ; informations inconnues non inventées ; ancienne base lisible ou migration approuvée/restauration vérifiée. |
| **L1-F — P1 recherche et erreurs** | Réutiliser FTS, conserver la compatibilité historique hors profil, distinguer résultat vide, erreur, mode indisponible et ressource absente ; pas de repli caché. | `R04/R05` ; `C-R06–C-R08`, `C-O07`. Sur le jeu figé, 7/7 requêtes positives au rappel@5 requis et 1/1 requête négative ; p95 local ≤ 500 ms sur la configuration retenue, selon la méthode de 22. |
| **L1-T — P1 preuve et traçabilité** | Dépend d'une capture hôte ou EKTS effectivement observable, du manifeste/version et d'une politique de rétention ; pas de service distant requis. | `T01–T03` ; `C-T01–C-T03`. Appels/résultats et citations rapprochés quand visibles ; donnée manquante = indéterminé ; minimisation et permissions des traces. |
| **L1-O — P1 compatibilité, Windows et reprise** | Environnement Windows natif de validation à choisir ; dépendances natives, chemins/UTF-8, ACL, bases et WAL ; lecture des données historiques et documentation des effets. | `O02–O05` ; `C-O02–C-O06` et `C-W12`. Étapes prévues exécutées sur la configuration choisie, sauvegarde/restauration ou incohérence détectée, aucun historique réécrit silencieusement. |
| **L2-E — P2 évaluation comparative** | Après contrôles G0, accord explicite et préparation : même agent seul, avec fichiers et avec EKTS ; corpus B/C identique et conditions isolées. Peut être bloqué si l'hôte ou les restrictions ne sont pas vérifiables. | `T04` ; `C-T04–C-T06`, protocole [19](audit/produit/19_SCENARIO_COMPARATIF_AGENT_EKTS.md). T01 B moyen ≥ 80/100 et 0 citation inventée : cible de qualité validée, à mesurer. Rapporter séparément B−A et B−C ; un score ≥ 80 ne démontre pas un avantage sur C. |

**P0 ≠ sprints séquentiels imposés :** les lots web et permissions peuvent être préparés en parallèle, mais leurs écarts ne sont pas déclarés résolus par la présente planification. Le nommage et l'enrichissement ne passent pas devant eux. Un pilote synthétique préliminaire, avec confinement externe réellement contrôlé et accord distinct, peut être envisagé avant certains correctifs web ; il ne constitue pas la validation du produit web.

### 2.1 Décomposition documentaire validée — Sprints 19 à 24

> Créée et validée par le propriétaire le 30/10/2026, sans durée engagée ni feu vert de développement. Les anciens S19–S22 de collaboration restent conservés comme historique ; la numérotation ci-dessous est réutilisée pour le nouveau périmètre, sans en reprendre le contenu.

| Sprint | Périmètre | Justification du découpage |
|---|---|---|
| [19 — Priorités et scores web](blueprint/Docs/roadmap/sprints/SPRINT-19.md) | `W01–W03` et lecture historique | Corriger en premier les contradictions de priorité et les mesures manquantes. |
| [20 — Métriques, preuves et sécurité web](blueprint/Docs/roadmap/sprints/SPRINT-20.md) | `W04–W06`, `O06` | Compléter la fiabilité web avec identité des métriques, reprise et cibles contrôlées. |
| [21 — Permissions et confinement](blueprint/Docs/roadmap/sprints/SPRINT-21.md) | `P01–P03`, `O01` | Autre priorité P0, préparables en parallèle du web ; l'isolation hôte et le serveur restent distincts. |
| [22 — Provenance et FTS](blueprint/Docs/roadmap/sprints/SPRINT-22.md) | `R01–R05` | Fonder corpus et recherche sur des ressources autorisées et une interface gouvernée. |
| [23 — Preuves et exploitation](blueprint/Docs/roadmap/sprints/SPRINT-23.md) | `T01–T03`, `O02–O05` | Vérifier les traces, la compatibilité Windows, les données historiques et la reprise. |
| [24 — Validation et décision pilote](blueprint/Docs/roadmap/sprints/SPRINT-24.md) | Régressions M, `T04` facultatif, G0–G3 | Consolider les preuves et préparer une décision sans confondre conformité et valeur comparative. |

Six sprints ont été retenus pour couvrir les lots validés et leurs dépendances ; aucun sprint 25–30 n'est créé artificiellement. Chaque sprint comporte un parent, trois sous-sprints et un prompt futur. Pour chaque sous-sprint, **tests unitaires, intégration, E2E et raccordement CI sont préparés avant le code** ; si un environnement ou une autorisation manque, le cas est bloqué et non présenté comme réussi. Les validations humaines, l'exécution de l'expérience et les éventuels commits sont explicitement distingués. Tout changement ultérieur du découpage suit une décision humaine.

### 3. Dépendances et portes de décision

```text
Vision + audit + scénario + architecture + spec/critères validés
                             │
              révision roadmap → validation humaine acquise
                             │
          ┌──────────────────┴───────────────────────┐
          │                                          │
 Dossiers / sprints / prompts                  Pilote préliminaire facultatif
 décomposition validée ; revue                  contrôle externe vérifié
 détaillée avant chaque sprint
          │                                    + corpus / traces / G0
 Feu vert séparé pour développement           + autorisation opérationnelle
          │                                          │
 L0-W web    L0-P permissions                     L2-E → G2
     │           │                         (ne valide pas le produit)
     │           └→ L1-R/F/T ressources, recherche, preuves
     │                         │
     └──────────────┬──────────┘
              L1-O compatibilité / reprise
                        │
            tous critères M applicables → G1
                        │
           G1 + G2 et leurs limites → G3
```

Les flèches indiquent des **prérequis de validation et d'intégration**, pas une planification jour par jour. La préparation documentaire et des tests de lots indépendants peut se faire en parallèle. Avant L2-E, les contrôles de corpus, permissions et traces doivent être effectivement vérifiés ; L0-W complet n'est pas un prérequis technique du seul scénario synthétique mais reste obligatoire pour la conformité web du MVP produit.

- **G0 — pilote prêt :** scénario, restrictions, données, hôte/modèle, budget et rétention approuvés ; absence d'accès ou de preuve suffisante = bloqué.
- **G1 — conformité technique :** tous les critères **M applicables** de [21](audit/produit/21_SPECIFICATION_MVP4.md) et [22](audit/produit/22_CRITERES_ET_TESTS_MVP4.md) réussis, avec preuves ; aucun incident de sécurité non résolu. `bloqué`, `sauté` ou `indéterminé` n'est pas `réussi`. En particulier, `C-P07` exige une exposition T06 effectivement observable : si elle n'est pas autorisée ou ne peut être vérifiée, G1 reste bloqué, même si le pilote comparatif complet demeure facultatif.
- **G2 — valeur comparative :** résultats A/C/B effectivement obtenus ou statut bloqué ; distinguer B−A (corpus + EKTS) de B−C (interfaces avec même corpus), coûts et limites. Une absence de gain est un résultat légitime ; en l'absence d'essai, la valeur ajoutée comparative demeure **non démontrée**.
- **G3 — décision produit :** le propriétaire examine G1, G2, risques et preuves. Une conformité technique ne transforme pas une comparaison négative ou absente en gain démontré.

**Paramètres non encore choisis :** machine Windows native de validation, hôte/modèle et leurs versions, isolement effectif, fournisseur éventuel, coût maximal et durée de conservation. Les critères chiffrés ont été validés pour la planification ; les configurations et toute dépense restent à approuver avant utilisation.

### 4. Contradictions et limites documentaires à traiter sans effacement

| Sujet | Constat et références | Traitement prévu |
|---|---|---|
| **Registre Sprint 17** | Le [registre](blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md) comporte deux séries `17-1/2/3` et parent : l'une « livré/validé », l'autre « non commencé ». Le [résultat S17](blueprint/Docs/roadmap/sprints/SPRINT-17-RESULTAT.md) déclare 3/3 terminés ; cet état n'est pas une preuve que toutes les capacités fonctionnent aujourd'hui. | Un avertissement est ajouté dans le registre, sans supprimer les lignes ni trancher silencieusement leur origine ; réconciliation documentaire lors de la planification, avec date et décision humaine. |
| **Calendrier MVP-3** | L'ancien calendrier ci-dessous disait encore « planifié », alors que la section MVP-3 et [validation](MVP3_VALIDATION.md) rapportent clôture le 26/10/2026. | Calendrier courant corrigé avec la réserve des preuves historiques ; ancien calendrier conservé dans l'historique. Les 97/97 sont **97 lignes-critères**, dont des réserves/écarts documentés, pas 97 comportements indépendamment rejoués. |
| **Recommandations des rapports** | `C16.6/C16.7` : sections de génération présentes mais moteur non injecté dans les parcours de rapport examinés. | Écart tracé et non requalifié « livré en parcours produit » ; arbitrage d'intégration distinct. |
| **Documentation MCP** | [`AGENTS.md`](../AGENTS.md) décrit quatre outils en lecture seule, [`docs/MCP.md`](MCP.md) annonce onze outils ; l'essai de phase 1 et le code de référence en exposent 17, dont des mutations. | Mise en cohérence prévue avec `O05/C-O06`, sans modifier les règles de gouvernance ni présenter le serveur actuel comme globalement en lecture seule. |
| **README et version** | Le README racine comporte encore des références MVP-2/0.1.0 alors que `package.json` indique 0.2.0 et que la clôture MVP-3 est documentée. | Actualisation documentaire à planifier, en conservant les références et sans annoncer de nouvelle version non publiée. |
| **Préparation MVP-4 / ADR-044** | [Préparation historique](MVP4_PREPARATION.md) recommandait la collaboration et disait attendre une décision avant spécification ; les nouvelles validations confirment un autre objectif local. | Bannière de révision et lien vers cette roadmap ; préserver le texte historique et reporter la réconciliation formelle du registre des décisions au dossier directeur. |
| **Sécurité et métriques historiques** | Les chiffres de tests, couverture, audit de dépendances et « aucun secret » ci-dessus sont des déclarations datées ; ils n'ont pas tous été rejoués dans cette mission. | Les présenter comme historiques, pas comme état de sécurité actuel. Aucun scan complet des secrets ou de l'historique n'a été effectué ici. |

### 5. Historique conservé — proposition MVP-4 du 25–26 octobre

> Le texte ci-dessous est préservé pour comprendre l'ancienne trajectoire. Il **ne définit plus le périmètre courant** et n'engage ni ses sprints, ni sa durée, ni une infrastructure distante.

#### MVP-4 — Collaboration (optionnel, non engagé) — texte historique

**Durée estimée :** 8 semaines (Sprints 19–22)  
**Objectif :** partager, commenter, assigner, notifier.
**Condition :** feu vert explicite après MVP-3.

> **Note synchronisation distante (ADR-032, 25/10/2026) :**
> Firebase est abandonné. Supabase (ou alternative similaire : Neon, Turso,
> PlanetScale) est envisagé pour les MVP-4/5 si la synchronisation
> multi-appareils devient nécessaire. L'architecture actuelle reste
> 100% locale (SQLite WAL, 3 bases). Aucun code distant n'est prévu
> pour le MVP-3.

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

> **Lecture actuelle :** méthode historique, non autorisation d'implémenter ou de pousser ; les consignes de la mission interdisent toute PR, publication ou modification fonctionnelle sans autorisation distincte.

1. Lire la spec du sprint + les docs d'architecture concernées.
2. Audit de véracité des modèles de spec **avant** toute écriture.
3. Implémenter le périmètre strict ; écarts → soumission P3.
4. Boucle de correction : échecs identifiés → causes racines → fixes →
   re-exécution jusqu'à **zéro échec**, y compris sur le poste développeur.
5. `npm run verify` code 0, commits atomiques, push, CI 7/7.
6. Statut + rapport `SPRINT-XX-YY-RESULTAT.md` puis passage de relais.

---

## Horizon long — prévisions historiques non engagées

Les thèmes et numéros ci-dessous sont conservés comme historique, sans affectation automatique de la collaboration ni priorité ou durée réapprouvée.

| MVP | Thème | Contenu indicative |
|-----|-------|--------------------|
| **MVP-5** | Intégrations | Slack/Teams, Jira/Trello, GitHub/GitLab, CI/CD |
| **MVP-6** | Intelligence artificielle | détection de patterns, prédiction de régressions, assistant IA |
| **MVP-7** | Marketplace | plugins communautaires, templates partagés, intégrations tierces |

Aucun de ces horizons n'est engagé : ils suivent la règle de feu vert
par MVP.

---

## Calendrier global — état courant, sans dates nouvelles engagées

| Phase | État à la révision du 30/10/2026 |
|-------|----------------------------------|
| MVP-1 | Terminé selon le registre historique ; chiffres non rejoués pour cette révision. |
| MVP-2 | Validation historique 88/88 déclarée, non rejouée intégralement ici. |
| MVP-3 | Clôture documentaire le 26/10/2026, 97/97 lignes-critères déclarées, avec écarts P3 et réserves de parcours rapport ; voir [validation](MVP3_VALIDATION.md). |
| MVP-4 | Vision, architecture, spécification, seuils, roadmap et décomposition documentaire 19–24 validés ; développement et expérience non autorisés. Aucune durée ni démarrage opérationnel de sprint n'est engagé. |
| Horizons suivants | Options historiques non engagées ; collaboration reportée sans numérotation ni calendrier fixé. |

### Instantané du calendrier antérieur — conservé pour traçabilité

> Tableau historique contradictoire avec la clôture MVP-3 et la trajectoire courante ; ses durées et ses statuts MVP-3/MVP-4 ne sont plus la planification active.

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

**Révision de la roadmap :** 30 octobre 2026 · **Ancien pied conservé :** version 0.1.0 (MVP-2 validé), dernière mise à jour 25 octobre 2026. Le numéro historique ne déclare pas une version actuelle du produit.
