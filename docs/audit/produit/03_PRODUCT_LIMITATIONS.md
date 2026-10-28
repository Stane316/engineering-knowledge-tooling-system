# 03 — Limites réelles du produit

> Chaque limite a un identifiant stable `LIM-xx`, une cause identifiée ou
> explicitement marquée « à confirmer », une gravité :
> 🔴 **bloquant première utilisation** · 🟠 **majeur** · 🟡 **mineur** ·
> ⚪ **hors périmètre assumé** (choix documenté, pas un défaut).
> Catégories : F = fonctionnelle · Q = qualité · I = intégration ·
> O = opérationnelle · S = sécurité · E = environnement externe.

---

## Limites fonctionnelles

### LIM-03 — Serveur MCP navigateur non câblé (I) 🟠
- **Description** : `createBrowserMcpServer` (5 outils `browser_*`) existe,
  est testé (53 tests) et documenté (`docs/PLAYWRIGHT.md` §8), mais **aucune
  commande, aucun script npm ni aucun bin ne le lance**.
- **Conséquence** : un agent ne peut pas ouvrir/capturer une page via ce
  serveur sans que l'utilisateur écrive lui-même le script d'assemblage
  (6 lignes d'import, doc à l'appui).
- **Scénario affecté** : intégration agent « visionneuse navigateur ».
- **Cause** : probablement un oubli de câblage (le serveur connaissance a eu
  son `dist/mcp/server.js`, lui non) — **hypothèse forte**, à confirmer par
  décision produit (DEC-03).
- **Statut** : confirmé par `[NEG]` grep (EV-27).
- **Contournement** : écrire le petit script (non recommandé : code non
  versionné = dette) **ou** utiliser un MCP navigateur externe (voir `06`).
- **Travail pour lever** : 1 point d'entrée (script `mcp:browser` ou
  option CLI) + test de fumée + doc d'installation. ≈ 0,5 jour.
- **Critère de résolution** : `npm run mcp:browser` démarre, handshake OK,
  `tools/list` = 5 outils sur un client standard.

### LIM-06 — Aucune interaction ni exploration multi-pages (F) ⚪/🟠
- **Description** : le navigateur se limite à `goto` + mesures + captures ;
  **zéro** `click`/`fill`/`scroll` (EV-26). Le crawl L4 (site entier) est
  **hors périmètre explicite** depuis MVP-2 (CHANGELOG, `types.ts`).
- **Conséquence** : impossible de tester un parcours utilisateur (login,
  formulaire, panier) ou d'auditer un site page à page automatiquement.
- **Cause** : choix de périmètre documenté (L4), puis extension jamais
  ouverte. Interaction = jamais spécifiée.
- **Statut** : L4 = ⚪ assumé ; interaction = ❌ non spécifiée (à
  réintroduire seulement si le premier projet réel l'exige — DEC-05).
- **Contournement** : auditer page par page (URLs fournies à la main).
- **Travail** (si besoin) : crawling = exploration frontière + budget +
  politeness (gros chantier, voir `07` §P3) ; interactions = Playwright
  `locator` + scénarios (moyen).

### LIM-05 — Sites authentifiés non supportés (F) 🟠
- **Description** : aucun mécanisme de cookies/session/login (EV-26) ;
  l'URL est ouverte « vierge » dans un navigateur neuf.
- **Conséquence** : les pages derrière authentification rendent une erreur
  de navigation ou un contenu public partiel — **non testé** (NV-1).
- **Cause** : non spécifié.
- **Critère** : si le premier projet cible un site privé, ajouter
  `storageState` Playwright + test dédié (décision DEC-05).

## Limites de qualité

### LIM-12 — Justesse des audits non mesurée contre une référence (Q) 🟠
- **Description** : les tests valident la **structure** (score ∈ [0,100],
  composants non nuls) mais **aucun jeu d'or expert** (pages annotées +
  scores attendus) n'existe (EV-31).
- **Conséquence** : on sait que l'audit *tourne* et *rend quelque chose de
  bien formé* ; on ne sait pas si les scores/constats sont **justes** pour
  un auditeur humain expérimenté.
- **Cause** : priorité historique à l'exécution (correct) avant à la vérité
  métier.
- **Solution** : jeu de 5–10 pages de référence (locales) avec attentes
  bornées (ex. « page sans alt → ≥ 1 finding accessibilité grave »).
- **Travail** : ≈ 1–2 jours, aucune dépendance. **P2** (voir `07`).
- **Critère** : 100 % des attentes du jeu d'or atteintes dans CI.

### LIM-13 — Score de recherche FTS peu lisible (Q) 🟡
- **Description** : score BM25 affiché **négatif** (ex. `-3.5e-06`,
  constaté EV-08) — interne à la fusion, inexploitable pour un humain.
- **Conséquence** : l'utilisateur ne peut pas interpréter la pertinence.
- **Cause** : normalisation BM25 interne exposée telle quelle en JSON.
- **Travail** : normaliser en `[0,1]` ou documenter la signification
  (≈ 1 h + tests). **P2**.

### LIM-15 — Espaces d'embeddings figés une fois remplis (Q/S) 🟡
- **Description** : changer de modèle impose `reindex --force` (purge de
  l'index vectoriel) — ADR-016 et tests de non-mélange.
- **Conséquence** : migration de modèle coûteuse (ré-indexation complète).
- **Cause** : choix d'intégrité (mélanger deux espaces = résultats faux).
- **Statut** : comportement assumé et testé — pas un défaut, une contrainte
  à connaître. Documenté dans `docs/guides/SEARCH_ENGINE.md`.

## Limites d'intégration

### LIM-01 — Aucune distribution npm (I) 🟠
- **Description** : `npm view ekts` = 404 ; installation = clone + `npm ci`
  + `npm run build` (EV-14).
- **Conséquence** : pas d'`npm install -g ekts`, pas de versioning de
  consommation, mise à jour = `git pull` + rebuild.
- **Cause** : jamais entrepris (projet privé mono-user) — à arbitrer
  (DEC-01).
- **Travail** : publication (nom libre), `files`, smoke test post-publish.
  ≈ 1 jour. **P1 si distribution souhaitée, sinon P3.**

### LIM-02 — Pas d'API/bibliothèque publique (I) 🟡
- **Description** : `package.json` sans `exports`/`main` ; `src/` est en
  ESM TS non consommable tel quel par un tiers (EV-14).
- **Conséquence** : impossible d'intégrer EKTS **dans** un autre logiciel
  (import `AuditRepository`…) sans copier le code.
- **Cause** : périmètre produit = outil, pas librairie.
- **Alternative actuelle** : CLI `--json` (scriptable) + MCP (agent) —
  couvrent 90 % des besoins d'intégration réels.
- **Travail** si souhaité : `exports` + build types + contrat sémantique
  versionné ≈ 2–3 jours + maintenance. **P3**, décision DEC-02.

### LIM-08 — Protocole MCP aligné sur `2025-11-25`, spec courante `2026-07-28` (I) 🟡
- **Description** : handshake réel de l'audit = `2025-11-25` (EV-19) ;
  dernière spec publiée = tag GitHub `2026-07-28` (source : dépôt
  `modelcontextprotocol/modelcontextprotocol`, consulté 26/10).
- **Conséquence** : les clients récents négocieront généralement une
  version commune ; un client exigeant `2026-07-28` **seul** pourrait
  refuser — **non observé, à tester** (risque théorique).
- **Cause** : SDK `1.32.1` (lock) vs latest `1.32.2` (EV-18) — la
  compatibilité dépend du SDK.
- **Travail** : montée `^1.32.2` + test handshake avec un client récent ≈
  0,5 jour. **P1 léger** (chantier CH-P1-4).

### LIM-03b — Intégration hôte réel non instrumentée (I) 🟠
- **Description** : le dépôt contient des exemples MCP réels
  (`MCP-EXAMPLES.md`, EV-15) et des tests **mémoire** du protocole, mais
  **aucun test exécutant un vrai hôte** (Claude Code, VSCode…) ; cet audit
  non plus (NV-3).
- **Conséquence** : l'étape « agent découvre → choisit → appelle →
  enchaîne » est prouvée **au protocole**, pas **dans un produit hôte**.
- **Cause** : tests d'hôte coûteux (dépendance externe, jetons).
- **Travail** : scénario minimal « hôte + 3 appels » manuel documenté, ou
  test `npx @modelcontextprotocol/inspector` automatisé ≈ 0,5–1 jour.
  **P1** (chantier CH-P1-3).

## Limites opérationnelles

### LIM-07 — Documents d'entrée périmés (O) 🔴 (pour l'adoption)
- **Description** : README affiche **« MVP-2 validé — 88/88 » et
  « Version 0.1.0 »** alors que le produit est 0.2.0/MVP-3 (EV-17) ;
  USER_GUIDE en-tête « version 2.0.0 » ; ROADMAP renvoie à un chemin de
  résultat de sprint `blueprint/…` à vérifier.
- **Conséquence** : un nouvel utilisateur croit à un produit plus ancien et
  moins riche ; confiance entamée dès la page d'accueil.
- **Cause** : statuts mis à jour dans les docs MVP mais pas le bandeau du
  README (les deux MVP précédents ont eu le même soin — régression
  d'attention).
- **Travail** : réconciliation 30 min + checklist doc au moment du
  versionnement. **P0** (chantier CH-P0-2) car c'est le **premier
  contact**.
- **Critère** : `grep "0.1.0\|MVP-2 validé" README.md` → rien de périmé ;
  version affichée = `package.json`.

### LIM-09 — Observabilité limitée aux logs JSON (O) 🟡
- **Description** : pino JSON sur stderr MCP, pas de métriques, pas de
  « durée d'audit P95 » côté utilisateur (les budgets vivent dans les
  tests/CI).
- **Conséquence** : en usage prolongé, difficile de savoir « pourquoi c'est
  lent » sans re-lancer les tests.
- **Cause** : périmètre mono-poste assumé.
- **Travail** : `--verbose` unifié + durée par commande en `--json`
  (existe partiellement : `elapsedMs` sur search). **P2**.

### LIM-10 — Modèle mono-poste, pas de concurrence multi-processus (O) 🟡
- **Description** : 3 bases SQLite fichiers (WAL) — conception locale, non
  testée en écritures concurrentes (NV-4).
- **Conséquence** : deux EKTS simultanés sur les mêmes fichiers = risque de
  verrou/`SQLITE_BUSY` non caractérisé.
- **Cause** : choix architecture « 100 % locale » (MVP-4 option collaboration
  noterait cela).
- **Critère** : documenter « un EKTS à la fois par jeu de bases » (doc
  simple) tant que non testé. **P2**.

### LIM-11 — Secrets gérés par fichier `.env` sans coffre (S) 🟡
- **Description** : clés en clair sur disque local ; `.env` bien ignoré,
  rotation documentée (incident 23/10 refermé — CHANGELOG), mais pas de
  gestion par OS keychain.
- **Conséquence** : acceptable en local, rédhibitoire en équipe.
- **Cause** : choix initial + périmètre solo.
- **Travail** : lecture keychain (Electron/`keytar`-like) = optionnel.
  **P3**. La posture actuelle est **conforme à son périmètre** (EV-29).

### LIM-14 — PDF = dépendance Chrome externe (E) 🟡
- **Description** : Puppeteer résout Chrome par chemins multiples ;
  sans Chrome, les rapports PDF échouent (résolution documentée :
  chemin imposé → variables → Chrome embarqué → Chromium Playwright →
  système).
- **Conséquence** : `npx puppeteer browsers install chrome` = prérequis
  souvent oublié.
- **Cause** : dépendance assumée (Puppeteer).
- **Travail** : vérification proactive dans `check:env`/`doctor`
  (probablement déjà partiellement) + message d'action. **P1 doc**.

## Limites dues à l'environnement externe

### LIM-04 — Recherche vectorielle inerte sans clé API (E) 🟠 (contexte)
- **Description** : sans clé d'embeddings, `embeddings: false` (log réel
  EV-20) et le mode hybride retombe en FTS — comportement propre
  (documenté), mais la **valeur « recherche sémantique »** est alors
  absente.
- **Conséquence** : sur un poste vierge, la moitié du « moteur hybride »
  n'est pas active.
- **Cause** : dépendance à un fournisseur externe payant/gratuit selon clés
  (EV-16).
- **Le scénario premier projet recommandé (`05`) s'en passe
  volontairement** : FTS suffit à l'usage décrit.
- **Travail si vectoriel exigé** : guide « premier fournisseur gratuit »
  (Novita/OpenRouter cités dans les docs) ≈ 1 h doc + 1 test live opt-in.
  **P2**.

### LIM-16 — Dépendance à 14+ fournisseurs tiers (E) 🟡
- **Description** : la valeur des modes embeddings/chat/search dépend de la
  disponibilité et des tarifs des API listées (EV-16) ; les coûts sont
  variables selon fournisseur (politique maison `quality|free|cost`).
- **Conséquence** : latence/coupure = dégradation mode vectoriel seul
  (FTS offline reste).
- **Cause** : conception « BYO-key » assumée.

### LIM-12b (audit) — Environnement de cet audit sans navigateurs (E)
- **Description** : la sandbox d'audit n'a pas de Playwright
  (`~/.cache/ms-playwright` absent) → inspection L3 et E2E navigateur
  **non rejoués ici** (EV-28) ; ils sont prouvés par les runs utilisateur
  (EV-24) et la CI (EV-03).
- **Statut** : **limite de l'audit, pas du produit** — notée pour
  honnêteté (la mission l'exige).

### LIM-17 — `npm run cli -- … --json` pollue stdout (I) 🟡
- **Description** : via npm, la bannière `> ekts@0.2.0 cli` + `> node
  dist/cli/index.js …` est écrite **sur stdout** avant le JSON ; `jq`,
  `ConvertFrom-Json` ou un parseur d'agent reçoivent alors un flux invalide.
- **Conséquence** : un script qui appelle la CLI par `npm run cli` casse en
  mode `--json` ; seul `node dist/cli/index.js` (ou `npm run --silent cli --`)
  produit un JSON pur.
- **Cause** : comportement standard de npm (bannière sur stdout) — **ce
  n'est pas un défaut d'EKTS** : le piège est déjà documenté côté produit
  (`docs/CLI.md` §2) ; il manquait seulement dans la v1.0 du runbook `05`.
- **Contournement** : invocation directe `node dist/cli/index.js`.
- **Travail pour lever** : aligner le runbook sur `docs/CLI.md` §2
  (**fait le 26/10**) ; option P2 : script dédié sans bannière.
- **Critère de résolution** : doc présente + exemple `--json` exécutable.
- **Preuves** : EV-35.

### LIM-18 — Les rapports par défaut (`./reports`) ne sont pas ignorés (O) 🟡
- **Description** : `inspect`/`audit report` écrivent par défaut dans
  `./reports`, dossier **non ignoré** par `.gitignore` ; `doctor` comptant
  aussi les fichiers non suivis, l'arbre paraît « modifié » après chaque
  audit.
- **Conséquence** : bruit dans `git status`, risque de commit accidentel de
  livrables générés.
- **Cause** : `.gitignore` couvre `/data/` et `/artifacts/` mais pas
  `/reports/`.
- **Contournement immédiat (documenté)** : `-o artifacts/reports`
  (`/artifacts/` est ignoré) — utilisé dans `05` §4.
- **Travail pour lever** : une ligne `reports/` dans `.gitignore` (ou
  changer le défaut) — **proposé, non appliqué** (modification hors audit,
  à valider par le propriétaire).
- **Critère de résolution** : `git status` propre après un runbook complet.
- **Preuves** : EV-35.

---

**Synthèse des gravités** 🔴 1 (LIM-07 doc d'entrée) · 🟠 6 (LIM-03,
LIM-05, LIM-12, LIM-01, LIM-03b, LIM-04 contexte) · 🟡 10 · ⚪ 2 (L4,
interaction — périmètre assumé).
**Aucune limite de sécurité bloquante** n'a été identifiée : garde-fous URL
testés, secrets absents du dépôt, gitleaks+CI verts (EV-29, CAP-46/47).
