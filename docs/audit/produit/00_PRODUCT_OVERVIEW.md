# 00 — Vue d'ensemble produit (EKTS)

> **Mission** : audit produit, cartographie des capacités, feuille de route.
> Date : 26 octobre 2026 · Commit audité : `3156147` · Branche : `arena/079e2f26-engineering-knowledge-tooling`
> Statut de ce document : **constat, pas proposition**. Les preuves citées sont
> identifiées `EV-xx` et détaillées dans [`09_EVIDENCE_REGISTER.md`](09_EVIDENCE_REGISTER.md).

---

## 1. Résumé exécutif

**EKTS (Engineering Knowledge & Tooling System)** est un outil **local** (aucun
serveur applicatif, bases SQLite en fichiers) qui fait trois choses :

1. **Auditer la qualité d'une page web** : ouvrir une URL dans un navigateur,
   la mesurer (performance, accessibilité, SEO, UX, contenu), lui attribuer un
   score 0–100 avec des constats priorisés, et produire des rapports
   Markdown et PDF — y compris la comparaison de deux audits dans le temps.
2. **Mémoriser** : ressources de connaissance, audits, bonnes pratiques,
   recommandations, dans 3 bases SQLite indexées (plein texte BM25 +
   vecteurs optionnels).
3. **Se donner à des humains et à des agents** : une CLI de 15 commandes et un
   serveur MCP de 17 outils, tous deux testés dans cet audit (EV-07, EV-04).

**État actuel en une phrase** : le produit est une **MVP-3 validée sur le
plan technique** (1 690 tests verts, CI 8/8, couverture 96–97 % — EV-01,
EV-02, EV-03) dont **tous les composants existent et fonctionnent en
laboratoire**, mais qui **n'a jamais été consolidé en un « premier projet
réel » unique, exécutable de bout en bout par un nouvel utilisateur à partir
d'un dépôt vierge** — et dont deux surfaces d'intégration sont incomplètes
(distribution npm absente, second serveur MCP non câblé, cf. `04`).

---

## 2. Finalité et problème résolu

| Dimension | Constat (source) |
|---|---|
| **Problème** | « Ne pas repartir de zéro » : capitaliser connaissances, audits, bonnes pratiques et décisions d'un projet à l'autre (README §1) |
| **Double usage** | (a) **contrôle qualité web local** d'une page URL ; (b) **base de connaissances interrogeable** par un humain ou un agent |
| **Public cible** | Développeur ou petite équipe travaillant localement, souhaitant auditer des sites et capitaliser entre projets (persona déduit des guides `docs/guides/*` et de la côte « mono-poste, 100 % locale » — inférence) |
| **Utilisateurs directs** | Humain via terminal (CLI) ; agent IA via serveur MCP (`.mcp.json`, EV-13) |
| **Systèmes consommateurs** | Tout hôte MCP stdio compatible (Claude Code et équivalents sont les exemples documentés — EV-15) ; scripts (`--json`) |
| **Scénario principal** | Auditer une URL → lire le score et les constats → générer MD/PDF → corriger → ré-auditer et **comparer** → capitaliser (bonnes pratiques, recommandations) |
| **Scénarios secondaires** | Base de connaissances (ajouter/rechercher des ressources) ; pilotage multi-projets ; suivi temporel (tendances, alertes, graphiques) ; application de templates de projet |
| **Entrées** | URL de page ; textes/titres/tags de ressources ; identifiants de projet/audit ; requêtes de recherche |
| **Traitements** | Navigation Playwright (Chromium/Firefox/WebKit), Lighthouse, axe-core ; analyse 5 dimensions (poids 25/25/20/15/15) ; indexation FTS5/vecteurs ; règles + statistiques pour les recommandations |
| **Sorties** | Score 0–100 + constats priorisés ; rapports Markdown/PDF ; comparaisons d'audits ; recommandations ; graphiques SVG/PNG ; réponses JSON structurées (CLI `--json`, MCP) |
| **Hors périmètre assumé** | Crawl multi-pages (L4) — décision explicite (CHANGELOG 0.1.0, `types.ts`) ; collaboration/comptes ; intégrations tierces (Slack, Jira…) — reportés « MVP-4+ » (`docs/MVP4_PREPARATION.md`, ADR-044 : non implémentés) |
| **Critères « réellement utilisable »** | Formalisés dans [`08_ACCEPTANCE_CRITERIA.md`](08_ACCEPTANCE_CRITERIA.md) |

### À quoi sert ce produit, concrètement ?

> « Vous lui donnez l'adresse d'une page web. Il vous rend un rapport (score
> /100, liste de problèmes classés par gravité, recommandations) en Markdown
> et PDF, garde le tout en base, et vous montre l'évolution quand vous
> corrigez. Vous pouvez aussi lui poser des questions sur vos notes
> techniques (« qu'est-ce qu'on a appris sur SQLite ? ») depuis un terminal
> ou depuis un agent IA branché en MCP. »

Ce que vous **ne pouvez pas** lui demander : explorer un site entier page à
page, remplir des formulaires, se connecter à un site protégé, ou vous
répondre en conversation (il n'a pas d'assistant LLM intégré) — voir
[`03_PRODUCT_LIMITATIONS.md`](03_PRODUCT_LIMITATIONS.md).

---

## 3. Modes d'utilisation actuellement disponibles

| Mode | Verdict (détail dans `04`) | Preuve principale |
|---|---|---|
| CLI (`ekts`) | ✅ **Disponible et validé** — 15 commandes, codes 0/2/3/4 vérifiés en exécution réelle pendant l'audit | EV-07, EV-08, EV-09 |
| Serveur MCP — connaissance (17 outils) | ✅ **Disponible et validé** — handshake + `tools/list` + `tools/call` exécutés pendant l'audit | EV-04, EV-05, EV-06 |
| Serveur MCP — navigateur (5 outils `browser_*`) | ⚠️ **Code + tests, sans commande de lancement** (fonction exportée, jamais câblée dans un bin/script) | EV-27 |
| Utilisation autonome (humain sans agent) | ✅ Via CLI, sous réserve des prérequis navigateur/chrome | EV-08, EV-25 |
| API/bibliothèque npm | ❌ **Absente** : pas d'`exports`, paquet `ekts` non publié (404 registry) | EV-14 |
| Consommation de MCP externes par EKTS | ❌ Aucun appel sortant vers un serveur MCP tiers n'a été trouvé dans `src/` | EV-26b (voir `04`) |
| Installation par `npm install -g` | ❌ Impossible aujourd'hui (clone + `npm ci` + `build`) | EV-14 |

---

## 4. Capacités les plus importantes (aperçu)

Catalogue complet : [`02_CURRENT_CAPABILITIES.md`](02_CURRENT_CAPABILITIES.md).

| Domaine | Capacité phare | Statut |
|---|---|---|
| Audit web | Inspection L1–L3 d'une URL, score 0–100, constats | **Confirmé et validé** (E2E + CI) — non rejouable dans la sandbox de cet audit (pas de navigateur : EV-28) |
| Rapports | Markdown, PDF, **comparaison de 2 audits** | **Confirmé et validé** |
| Connaissances | Ajouter/rechercher (FTS) des ressources | **Confirmé et validé** (exécution réelle audit : EV-06/EV-08) |
| Recherche hybride | BM25 + vecteurs + RRF | **Partiellement** : FTS validé sans clé ; vecteur **bloqué par configuration** (clé embeddings, EV-20) |
| Projets | Multi-projets, filtres transversaux | **Confirmé et validé** |
| Capitalisation | Timeline, bonnes pratiques, recommandations, 10 templates | **Confirmé et validé** (E2E MVP-3 26/26, EV-24) |
| Agents | MCP 17 outils, erreurs structurées | **Confirmé et validé** au protocole ; **non vérifié avec un hôte réel** (Claude Code non instrumenté pendant cet audit — EV-15 = documentation d'exemples, pas test d'hôte) |

---

## 5. Limites majeures (aperçu)

Détail et gravités : [`03_PRODUCT_LIMITATIONS.md`](03_PRODUCT_LIMITATIONS.md).

1. **LIM-01 — Distribution** : installation uniquement par clone (paquet npm
   inexistant) ; pas d'`exports` de bibliothèque.
2. **LIM-03 — Second MCP non câblé** : `createBrowserMcpServer` (5 outils
   navigateur) n'a **aucun point d'entrée exécutable** (EV-27).
3. **LIM-06 — Pas d'interaction ni de crawl** : aucune ligne `click`/`fill`/
   `scroll` dans `src/browser/` (EV-26) ; L4 hors périmètre assumé.
4. **LIM-04 — Recherche vectorielle inerte sans clé** : sans
   `OPENAI_EMBEDDING_MODEL`-équivalent, le mode `hybrid` retombe en FTS
   (comportement constaté `embeddings: false` dans les logs MCP : EV-20).
5. **LIM-07 — Documents d'entrée périmés** : README affiche encore
   « MVP-2 validé — 0.1.0 » alors que la version réelle est **0.2.0 / MVP-3**
   (EV-17) ; USER_GUIDE en-tête « version 2.0.0 ». Premier contact
   utilisateur trompeur.
6. **LIM-12 — Justesse métier non mesurée** : les E2E vérifient la
   **structure** des scores (0–100) et la présence des composants, pas la
   justesse des constats contre une référence experte (jeu d'or absent —
   EV-31).

---

## 6. Niveau de maturité actuel

Cadre d'évaluation de la mission (§6) appliqué — détails dans
[`11_AUDIT_SUMMARY.md`](11_AUDIT_SUMMARY.md) :

| Catégories | Retenue | Justification courte |
|---|---|---|
| Prototype démontrable | ✅ dépassé | Parcours complets automatisés, pas de manipulation cachée |
| MVP techniquement exécutable | ✅ atteint | verify 0, CI 8/8, E2E 54/54 chez l'utilisateur (EV-01…03, EV-24) |
| **MVP utilisable sur un premier projet** | ⚠️ **à confirmer par le runbook** | Tous les morceaux sont prouvés ; le scénario unique premier projet (`05`) **n'a pas été exécuté comme tel** — c'est l'objet des chantiers P0 |
| Produit intégrable | ⚠️ partiel | CLI + MCP connaissance prouvés ; npm absent, MCP navigateur non câblé, hôte réel non instrumenté |
| Prêt à diffusion large | ❌ non | Mono-poste, doc d'entrée périmée, aucun package, veille spec à faire |

---

## 7. Statut de préparation à une première utilisation réelle

- **Ce qui est prêt** : installation documentée (`docs/guides/SETUP.md`),
  prérequis vérifiables (`npm run check:env`, `doctor`, `doctor:browsers` —
  exécutés avec succès sur le poste utilisateur : EV-25), CLI et MCP
  fonctionnels, critères de qualité proposés (`08`).
- **Ce qui manque (blocages réels, pas d'imagination)** :
  1. **B1** : un **runbook premier projet** exécuté et validé une fois de
     bout en bout proprement (le parcours existe en morceaux prouvés —
     c'est le chantier P0-1, `07`).
  2. **B2** : **réconciliation des documents d'entrée** (README/User_GUIDE
     affichent de vieilles versions — P0-2).
  3. **B3** : **arbitrage de distribution** (clone suffisant ? npm ? —
     DEC-01, `10`).
  4. **B4** : si le premier projet cible un **agent**, le choix de la
     surface (CLI vs MCP connaissance) et la **validation sur hôte réel**
     (P1-3).

---

## 8. Prochain objectif produit recommandé

> **Ne pas démarrer une « MVP-4 » de fonctionnalités.** Les preuves montrent
> un produit dont les briques valent plus que son **fil conducteur** :
> recommandé = **« EKTS 0.2.x — Version d'usage »** : consolider
> l'utilisation réelle (runbook premier projet validé, docs d'entrée
> réconciliées, intégration agent vérifiée sur hôte) avant toute nouvelle
> fonctionnalité. Décision de nommage soumise (DEC-04, `10`).

---

**Documents de la série** : [01 MVP](01_MVP_EVOLUTION.md) ·
[02 Capacités](02_CURRENT_CAPABILITIES.md) · [03 Limites](03_PRODUCT_LIMITATIONS.md) ·
[04 Intégrabilité](04_INTEGRATION_READINESS.md) · [05 Premier projet](05_FIRST_REAL_PROJECT.md) ·
[06 Écarts](06_GAP_ANALYSIS.md) · [07 Feuille de route](07_ROADMAP_TO_USABLE_PRODUCT.md) ·
[08 Critères](08_ACCEPTANCE_CRITERIA.md) · [09 Preuves](09_EVIDENCE_REGISTER.md) ·
[10 Décisions](10_PRODUCT_DECISIONS_REQUIRED.md) · [11 Synthèse](11_AUDIT_SUMMARY.md)
