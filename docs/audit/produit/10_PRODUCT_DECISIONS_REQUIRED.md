# 10 — Décisions nécessitant un arbitrage produit

> **Règle** : une décision technique qui change la **portée**, le
> **positionnement** ou la **proposition de valeur** est remontée ici, pas
> tranchée silencieusement. Recommandation ≠ décision : c'est au
> propriétaire de valider.
>
> **Arbitrages rendus** : voir
> [`24_ARBITRAGES_PROPRIETAIRE_2026-10-30.md`](24_ARBITRAGES_PROPRIETAIRE_2026-10-30.md).
> `DEC-04` y est tranchée en faveur de l'option **B — MVP-4**. Les sections
> ci-dessous sont conservées telles quelles à titre d'historique de la
> question posée.

---

## DEC-01 — Canal de distribution : npm public ou « clone assumé » ?

- **Question** : le produit doit-il s'installer par `npm install -g ekts`,
  ou rester un outil à cloner ?
- **Contexte** : le nom `ekts` est **libre** sur le registry (404 — EV-14) ;
  `bin` déjà déclaré ; pas de `exports` de bibliothèque.
- **Options** :
  - **A. Publication npm** : − friction d'installation, + nom à défendre, +
    obligation de release rigoureuse (sécurité : le paquet expose une CLI qui
    lance un serveur MCP local), + compatibilité Node à documenter.
  - **B. Clone assumé** : 0 coût, déjà le mode réel du projet privé, doc
    « installation par clone » simplement assumée comme définitive.
- **Recommandation** : **B court terme** (après CH-P0), **A seulement après**
  le premier projet validé — publier avant = diffuser une expérience non
  consolidée (GAP-01/02).
- **Coût du report** : nul tant que l'usage est solo ; friction pour tout
  nouvel utilisateur hors dépôt.
- **Éléments pour décider** : souhaitez-vous que d'autres personnes
  l'utilisent dans le mois ? (oui → préparer A ; non → écrire B).
- **Dépendances** : DEC-04 (cap global), CH-P0-1.

## DEC-02 — Exposer EKTS comme bibliothèque importable ?

- **Question** : faut-il un contrat `exports` npm pour encastrer EKTS dans
  d'autres logiciels ?
- **Contexte** : aujourd'hui = outil (CLI/MCP). LIM-02.
- **Conséquences** : **A. Oui** = surface publique à versionner semver
  strictement (ruptures = coûts), tests de compat, ~2–3 j + maintenance.
  **B. Non** = les intégrations passent par CLI `--json` et MCP, qui
  couvrent les usages observés.
- **Recommandation** : **B** ; réexaminer à la première demande externe
  réelle d'encastrage.
- **Report** : un besoin exprimé serait contraint ; sinon coût nul.

## DEC-03 — Surface MCP navigateur : câbler, déléguer, ou retirer ?

- **Question** : que faire de `createBrowserMcpServer` (5 outils testés,
  non lançables — LIM-03/EV-27) ?
- **Options** :
  - **A. Câbler** (`npm run mcp:browser` + doc) : ~0,5 j, garde le
    « tout-en-un » ; garantit les garde-fous URL/chemins maison (CAP-47).
  - **B. Déléguer à `@playwright/mcp`** (externe, `0.0.83` actif au
    28/09/2026, source npm) : 0 code maison ; dépendance en version 0.0.x,
    garde-fous maison **contournés** (à réévaluer), surface EKTS =
    connaissance uniquement.
  - **C. Retirer** : moins de code à maintenir ; perte du testé CAP-47.
- **Recommandation** : **A** — l'investissement est mince, la capacité est
  déjà écrite et testée, et la sécurité embarquée est un vrai atout pour
  des agents tiers ; B seulement si vous refusez de maintenir une surface
  navigateur.
- **Coût du report** : agents qui veulent « ouvrir une page » aujourd'hui
  ne le peuvent pas via EKTS (ou alors en écrivant un script non
  versionné = dette).
- **Dépendances** : aucune ; CH-P1-1 l'applique.

## DEC-04 — Cap : « Version d'usage » (consolidation) ou MVP-4 de features ?

- **Question** : prochain cycle = stabilisation/premier usage, ou
  développement (collaboration / intégrations / IA / marketplace — options
  de `MVP4_PREPARATION.md`, ADR-044 « non implémenté sans feu vert ») ?
- **Contexte** : tout le socle est validé (EV-01/03/11/12) mais les GAP-01,
  02, 04 restent ouverts : le produit **vaut mieux qu'il n'est présenté et
  qu'il n'a été utilisé en fil complet**.
- **Options** :
  - **A. Version d'usage (0.2.x)** : P0+P1 ci-contre, ~semaine de
    travail ciblé, **aucune nouvelle fonction**.
  - **B. MVP-4 directe** : démarrer une option (1 = collab ~8 sem., 2 =
    intégrations ~6, 3 = IA ~8, 4 = marketplace ~10 — estimations du
    dépôt) sur la base actuelle.
  - **C. Mixte** : consolidation + une feature MVP-4 en parallèle.
- **Recommandation** : **A**, puis B (choix de l'option) en nouveau feu vert.
  La consolidation transforme un gisement de preuves éparses en argument
  produit fiable ; sans elle, toute feature MVP-4 s'appuie sur un premier
  usage jamais fait (risque de construire sur un usage imaginaire).
- **Coût du report de B** : retard de calendrier sur l'option choisie
  (évalué en semaines, pas en jours) ; coût du report d'A : rien (les
  briques existent).
- **Éléments pour décider** : quel est le prochain besoin **réel** exprimé
  (le vôtre ou celui d'un futur utilisateur) ?

## DEC-05 — Périmètre navigateur : pages publiques seules, ou auth + interaction ?

- **Question** : le premier projet réel a-t-il besoin de sites
  authentifiés, de clics/formulaires ou de crawl L4 ?
- **Contexte** : aujourd'hui = URL publiques, mono-page, aucune interaction
  (EV-26, LIM-05/06, ⚪ assumé).
- **Options** : **A. Maintenir** le périmètre actuel (documenter clairement
  « pages publiques ») · **B. Ajouter l'auth** (storageState Playwright, ~1
  j + tests) · **C. Interactions** (scénarios ~jours) · **D. L4 crawl**
  (gros chantier : frontier, budget, politeness — semaines).
- **Recommandation** : **A** pour la version d'usage ; ouvrir B/C/D
  **uniquement** si le scénario `05` révèle le besoin (la mission impose de
  ne pas devancer la démonstration).
- **Coût du report** : si votre premier projet cible une zone privée, B
  devient P1 bloquant — **question à répondre avec DEC-04**.

## DEC-06 — Stratégie recherche hybride : FTS « suffisant » ou exigence de clé ?

- **Question** : la valeur affichée est-elle « recherche hybride » (donc
  clé requise au premier usage) ou « recherche locale fiable + hybride en
  option » ?
- **Contexte** : sans clé = FTS opérationnel, vectoriel inerte (EV-20) ;
  14+ fournisseurs disponibles (EV-16).
- **Options** : **A. Positionner FTS par défaut** (zéro clé = zéro friction,
  mode hybride documenté comme optionnel) · **B. Exiger une clé gratuite au
  setup** (guide « premier fournisseur » + test live).
- **Recommandation** : **A**, avec un guide optionnel type B en annexe
  (le scénario `05` choisit déjà A).
- **Coût du report** : un utilisateur pourrait croire que « hybride » est
  actif par défaut → désillusion ; doc seule suffit à lever.

---

**Synthèse** : 6 décisions · **immédiates pour le cap** : DEC-04 puis
DEC-03/DEC-01 · **structurantes** : DEC-05 (périmètre), DEC-02 (librairie) ·
**documentaires** : DEC-06.
Aucune décision n'a été prise silencieusement dans les documents 00–09.
