# Phase 01 — Fondations et Prérequis Techniques

**Statut :** 🔄 En cours (Phase 01)  
**Date :** 21 octobre 2026  
**Version :** 1.0

---

## 1. Objectif

Ce document définit les compétences techniques minimales requises pour construire et maintenir le système EKTS (Engineering Knowledge & Tooling System). Il ne s'agit pas d'un cours généraliste, mais d'une liste ciblée des notions nécessaires pour chaque couche du système.

Chaque compétence est présentée avec :
- **Ce qu'il faut comprendre** — concepts clés
- **Pourquoi c'est nécessaire** — lien avec EKTS
- **Comment valider la maîtrise** — exercice ou critère observable

---

## 2. Structure en 6 niveaux

Les compétences sont organisées en 6 niveaux progressifs. Chaque niveau construit sur le précédent.

| Niveau | Thème | Durée estimée | Prérequis |
|--------|-------|---------------|-----------|
| **1** | Fondations obligatoires | 2-4 semaines | Aucun |
| **2** | Construction d'outils | 2-3 semaines | Niveau 1 |
| **3** | Intégration agentique | 1-2 semaines | Niveau 2 |
| **4** | Recherche et capitalisation | 2-3 semaines | Niveau 2 |
| **5** | Système robuste | 2-3 semaines | Niveaux 1-4 |
| **6** | Capacités spécialisées | 3-4 semaines | Niveaux 1-4 |

**Durée totale estimée :** 12-19 semaines (3-5 mois) pour un développeur partant de zéro.

---

## 3. Niveau 1 — Fondations obligatoires

### 3.1 Terminal et système de fichiers

**Ce qu'il faut comprendre :**
- Navigation dans l'arborescence (`cd`, `pwd`, `ls`)
- Manipulation de fichiers et dossiers (`cp`, `mv`, `rm`, `mkdir`)
- Permissions (`chmod`, `chown`)
- Variables d'environnement (`export`, `$PATH`)
- Processus (`ps`, `kill`, `&`, `|`, `>`)
- Flux d'entrée/sortie (stdin, stdout, stderr)

**Pourquoi c'est nécessaire pour EKTS :**
- Toutes les CLI d'EKTS s'exécutent depuis le terminal
- La gestion des fichiers et permissions est critique pour le stockage des ressources
- Les variables d'environnement contiennent les secrets et configurations
- La compréhension des processus est nécessaire pour les services et l'orchestration

**Comment valider la maîtrise :**
- Exercice : créer une arborescence de dossiers, copier/déplacer des fichiers, changer les permissions
- Critère : être capable d'exécuter `chmod`, `export`, et rediriger des flux sans hésiter

**Ressources recommandées :**
- [The Linux Command Line (livre gratuit)](https://linuxcommand.org/tlcl.php) — chapitres 1-10
- [MDN - Command Line](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Command_line) — introduction
- Pratique quotidienne : utiliser le terminal pour toutes les opérations de fichiers

---

### 3.2 JavaScript et TypeScript

**Ce qu'il faut comprendre :**

**JavaScript :**
- Types primitifs (string, number, boolean, null, undefined, symbol)
- Objets, tableaux, fonctions
- Scope, closures, hoisting
- Async/await, Promises, event loop
- Modules (import/export)
- Gestion des erreurs (try/catch, Error)
- JSON (sérialisation, parsing)

**TypeScript :**
- Types de base (string, number, boolean, array, object)
- Interfaces et types
- Generics
- Type inference et type narrowing
- Utility types (Partial, Required, Pick, etc.)
- Compilation et configuration (tsconfig.json)

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS sera principalement écrit en TypeScript (pour la sécurité des types)
- Les outils MCP utilisent TypeScript ou Python
- La compréhension de async/await est critique pour les opérations I/O (scraping, API)
- JSON est le format d'échange standard pour MCP, API, stockage

**Comment valider la maîtrise :**
- Exercice : écrire un script qui lit un fichier JSON, transforme les données, et écrit le résultat
- Critère : être capable d'écrire une fonction async avec gestion d'erreurs et types TypeScript corrects

**Ressources recommandées :**
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) — complet et gratuit
- [MDN JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) — référence exhaustive
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — officiel et gratuit
- [freeCodeCamp - JavaScript Algorithms and Data Structures](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/) — certification gratuite (~300h)
- [JavaScript.info](https://javascript.info/) — tutoriel moderne et complet

**Ordre d'apprentissage suggéré :**
1. MDN JavaScript Guide (bases)
2. freeCodeCamp (pratique)
3. TypeScript Handbook (types)
4. Projets personnels (application)

---

### 3.3 HTTP et web

**Ce qu'il faut comprendre :**
- Requêtes et réponses HTTP (méthodes GET, POST, PUT, DELETE, etc.)
- Headers, cookies, sessions
- Status codes (200, 404, 500, etc.)
- JSON et content-types
- HTML et DOM (structure, sélection, manipulation)
- CORS et sécurité
- APIs REST (concepts, pas nécessairement implémentation)

**Pourquoi c'est nécessaire pour EKTS :**
- Le scraping utilise HTTP pour récupérer des pages
- Les APIs sont utilisées pour accéder à des services externes
- Le DOM est manipulé pour l'extraction de données
- La compréhension des cookies/sessions est nécessaire pour l'authentification
- CORS impacte les requêtes cross-origin

**Comment valider la maîtrise :**
- Exercice : faire une requête HTTP vers une API publique (ex: JSONPlaceholder), parser la réponse JSON
- Critère : être capable d'expliquer la différence entre GET et POST, et d'utiliser `fetch` ou `axios`

**Ressources recommandées :**
- [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — documentation complète
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — requêtes HTTP en JS
- [MDN DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) — manipulation du DOM
- [HTTP Tutorial](https://developer.mozilla.org/en-US/docs/Web/HTTP/Tutorial) — tutoriel pas à pas

---

### 3.4 Node.js et npm

**Ce qu'il faut comprendre :**
- Installation et gestion des versions (nvm, fnm)
- `package.json` (dépendances, scripts, metadata)
- `npm install`, `npm run`, `npm publish`
- Modules Node.js (fs, path, http, etc.)
- Variables d'environnement (process.env, dotenv)
- Création de scripts CLI
- Gestion des erreurs et logs

**Pourquoi c'est nécessaire pour EKTS :**
- Les outils EKTS seront des packages Node.js
- npm est utilisé pour gérer les dépendances
- Les scripts CLI seront écrits en Node.js
- La manipulation de fichiers (fs) est omniprésente

**Comment valider la maîtrise :**
- Exercice : créer un package Node.js avec un script CLI qui lit un fichier et affiche son contenu
- Critère : être capable de créer un `package.json`, ajouter des dépendances, et écrire un script exécutable

**Ressources recommandées :**
- [Node.js Official Documentation](https://nodejs.org/learn) — tutoriels officiels
- [Node.js API Reference](https://nodejs.org/api/) — référence exhaustive
- [MDN - Server-side web development](https://developer.mozilla.org/en-US/docs/Learn/Server-side) — introduction

---

### 3.5 Git et versionnement

**Ce qu'il faut comprendre :**
- Concepts : repository, commit, branch, merge, conflict
- Commandes de base : `init`, `add`, `commit`, `push`, `pull`, `status`, `log`
- Branches : `branch`, `checkout`, `merge`
- Résolution de conflits
- Tags et releases
- `.gitignore`
- GitHub/GitLab (forks, pull requests, issues)

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS sera versionné avec Git
- Les ressources et artefacts seront suivis
- Les collaborations et contributions utilisent Git
- Les releases marquent les versions stables

**Comment valider la maîtrise :**
- Exercice : créer un dépôt Git, faire plusieurs commits, créer une branche, fusionner
- Critère : être capable de gérer un projet Git sans aide extérieure

**Ressources recommandées :**
- [Pro Git Book (gratuit)](https://git-scm.com/book/en/v2) — livre complet
- [GitHub Guides](https://guides.github.com/) — tutoriels GitHub
- [Learn Git Branching (jeu interactif)](https://learngitbranching.js.org/) — visualisation des branches

---

### 3.6 Tests et débogage

**Ce qu'il faut comprendre :**
- Types de tests : unitaire, intégration, end-to-end
- Frameworks de test : Node.js test runner, Jest, Vitest
- Assertions et expectations
- Mocks et stubs
- Debugging : `console.log`, `debugger`, breakpoints
- Logging structuré (niveaux : info, warn, error)
- Gestion des erreurs et exceptions

**Pourquoi c'est nécessaire pour EKTS :**
- Les outils EKTS doivent être testables
- Le debugging est nécessaire pour diagnostiquer les problèmes
- Les logs structurés permettent l'observabilité
- Les tests garantissent la fiabilité

**Comment valider la maîtrise :**
- Exercice : écrire un test unitaire pour une fonction, déboguer un code avec des breakpoints
- Critère : être capable d'écrire des tests et de déboguer un script Node.js

**Ressources recommandées :**
- [Node.js Test Runner](https://nodejs.org/api/test.html) — documentation officielle
- [MDN Debugging](https://developer.mozilla.org/en-US/docs/Mozilla/Debugging/Debugging_JavaScript) — débogage JS
- [Jest Documentation](https://jestjs.io/docs/getting-started) — framework de test populaire

---

### 3.7 JSON et validation de données

**Ce qu'il faut comprendre :**
- Syntaxe JSON (objets, tableaux, types)
- Sérialisation et parsing (`JSON.stringify`, `JSON.parse`)
- Schémas JSON (JSON Schema)
- Validation avec Zod, Joi, ou Ajv
- Gestion des données invalides
- Types TypeScript pour JSON

**Pourquoi c'est nécessaire pour EKTS :**
- JSON est le format d'échange standard (MCP, API, stockage)
- La validation des entrées est critique pour la sécurité
- Les schémas JSON définissent les contrats d'outils MCP
- Les types TypeScript améliorent la fiabilité

**Comment valider la maîtrise :**
- Exercice : définir un schéma JSON avec Zod, valider des données, gérer les erreurs
- Critère : être capable de définir un schéma de validation et de l'utiliser dans un script

**Ressources recommandées :**
- [JSON.org](https://www.json.org/json-en.html) — spécification officielle
- [Zod Documentation](https://zod.dev/) — validation TypeScript
- [JSON Schema](https://json-schema.org/learn/getting-started-step-by-step) — schémas JSON

---

## 4. Niveau 2 — Construction d'outils

### 4.1 Conception d'une CLI

**Ce qu'il faut comprendre :**
- Structure d'une CLI (commandes, options, arguments)
- Bibliothèques : Commander.js, Yargs, oclif
- Validation des entrées
- Codes de sortie (0 = succès, autre = erreur)
- Messages d'erreur clairs
- Aide et documentation (`--help`)
- Mode interactif vs automatisable

**Pourquoi c'est nécessaire pour EKTS :**
- Les outils EKTS seront utilisables en CLI
- Une bonne CLI est essentielle pour l'automatisation
- Les agents peuvent appeler des CLI de manière déterministe

**Comment valider la maîtrise :**
- Exercice : créer une CLI avec Commander.js qui prend des arguments et options, valide les entrées, et affiche de l'aide
- Critère : être capable de concevoir une CLI avec une interface claire et des messages d'erreur utiles

**Ressources recommandées :**
- [Commander.js Documentation](https://github.com/tj/commander.js) — bibliothèque populaire
- [Building a CLI with Node.js](https://clig.dev/) — guide de conception
- [oclif](https://oclif.io/) — framework CLI robuste

---

### 4.2 Création d'une API locale

**Ce qu'il faut comprendre :**
- Serveur HTTP avec Express.js ou Fastify
- Routes et handlers
- Middleware
- Requêtes et réponses
- Gestion des erreurs
- CORS
- Documentation (OpenAPI/Swagger)

**Pourquoi c'est nécessaire pour EKTS :**
- Certains outils EKTS peuvent être exposés via API
- Une API locale permet l'intégration avec d'autres services
- La compréhension des APIs est nécessaire pour l'intégration

**Comment valider la maîtrise :**
- Exercice : créer une API REST simple avec Express qui expose des endpoints CRUD
- Critère : être capable de créer une API avec des routes, des middlewares, et une gestion d'erreurs

**Ressources recommandées :**
- [Express.js Documentation](https://expressjs.com/) — framework HTTP
- [Fastify Documentation](https://www.fastify.io/) — alternative performante
- [OpenAPI Specification](https://swagger.io/specification/) — documentation d'API

---

### 4.3 Processus, ports et concurrence

**Ce qu'il faut comprendre :**
- Processus Node.js (child_process, worker_threads)
- Ports et sockets
- Concurrence et parallélisme
- Timeouts et retries
- Gestion des ressources (mémoire, CPU)
- Signal handling (SIGINT, SIGTERM)

**Pourquoi c'est nécessaire pour EKTS :**
- Les services EKTS tournent comme processus
- La gestion des ports est nécessaire pour les APIs et serveurs MCP
- Le parallélisme est utilisé pour le scraping et les inspections
- Les timeouts et retries sont critiques pour la fiabilité

**Comment valider la maîtrise :**
- Exercice : créer un script qui lance plusieurs processus en parallèle, gère les timeouts et les erreurs
- Critère : être capable d'expliquer la différence entre processus et threads, et de gérer la concurrence

**Ressources recommandées :**
- [Node.js Child Process](https://nodejs.org/api/child_process.html) — documentation officielle
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html) — documentation officielle
- [Concurrency in Node.js](https://nodejs.org/en/learn/asynchronous-work/concurrency-architecture-and-event-loop) — tutoriel

---

### 4.4 Automatisation de navigateur avec Playwright

**Ce qu'il faut comprendre :**
- Installation et configuration
- Lancement de navigateurs (Chromium, Firefox, WebKit)
- Navigation et interactions (clics, formulaires, etc.)
- Attente de conditions (waitForSelector, waitForLoadState)
- Captures d'écran (viewport, full page, élément)
- Extraction de données (textContent, getAttribute, etc.)
- Gestion des erreurs et timeouts
- Multi-viewport et responsive

**Pourquoi c'est nécessaire pour EKTS :**
- L'inspection de sites utilise Playwright
- Les captures et l'extraction de données sont des capacités clés
- La compréhension du DOM est nécessaire pour l'analyse

**Comment valider la maîtrise :**
- Exercice : créer un script qui navigue vers un site, attend un élément, capture une screenshot, et extrait du texte
- Critère : être capable d'automatiser un parcours utilisateur simple et de gérer les erreurs

**Ressources recommandées :**
- [Playwright Documentation](https://playwright.dev/docs/intro) — officiel et complet
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright) — référence
- [Playwright Examples](https://playwright.dev/docs/writing-tests) — exemples de tests

---

### 4.5 Stockage de fichiers et métadonnées

**Ce qu'il faut comprendre :**
- Système de fichiers Node.js (fs, path)
- Lecture/écriture de fichiers (JSON, YAML, Markdown)
- Organisation de dossiers
- Métadonnées (frontmatter YAML, JSON sidecar)
- Gestion des versions de fichiers
- Sauvegarde et export

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS stocke des ressources sous forme de fichiers
- Les métadonnées sont essentielles pour la recherche et la gouvernance
- La sauvegarde et l'export sont nécessaires pour la pérennité

**Comment valider la maîtrise :**
- Exercice : créer un script qui lit un fichier JSON, ajoute des métadonnées, et écrit le résultat
- Critère : être capable de manipuler des fichiers et des métadonnées de manière fiable

**Ressources recommandées :**
- [Node.js File System](https://nodejs.org/api/fs.html) — documentation officielle
- [Node.js Path](https://nodejs.org/api/path.html) — documentation officielle
- [YAML Specification](https://yaml.org/spec/) — format YAML

---

## 5. Niveau 3 — Intégration agentique

### 5.1 Modèle client/serveur MCP

**Ce qu'il faut comprendre :**
- Architecture client/serveur
- Tools, resources, prompts
- Schémas d'entrée et de sortie
- Transports (stdio, HTTP)
- Découverte des outils
- Permissions et sécurité

**Pourquoi c'est nécessaire pour EKTS :**
- MCP est le protocole d'intégration agentique
- Les outils EKTS seront exposés via MCP
- La compréhension du protocole est critique pour l'interopérabilité

**Comment valider la maîtrise :**
- Exercice : expliquer le modèle client/serveur MCP, les types de capacités (tools, resources, prompts)
- Critère : être capable de dessiner l'architecture MCP et d'expliquer chaque composant

**Ressources recommandées :**
- [MCP Specification](https://modelcontextprotocol.io/specification) — spécification officielle
- [MCP Documentation](https://modelcontextprotocol.io/) — documentation
- [MCP GitHub](https://github.com/modelcontextprotocol) — dépôts officiels

---

### 5.2 Création d'un serveur MCP

**Ce qu'il faut comprendre :**
- SDK TypeScript MCP
- Définition de tools (schémas, handlers)
- Définition de resources
- Transport stdio
- Tests et validation
- Logs et erreurs

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS exposera des outils via MCP
- Un serveur MCP minimal est le premier MVP agentique
- La maîtrise du SDK est nécessaire pour l'extension

**Comment valider la maîtrise :**
- Exercice : créer un serveur MCP avec un tool simple (ex: echo), le tester avec un client
- Critère : être capable de créer un serveur MCP fonctionnel et de le connecter à un client

**Ressources recommandées :**
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — dépôt officiel
- [MCP Examples](https://github.com/modelcontextprotocol/examples) — exemples
- [MCP Tutorial](https://modelcontextprotocol.io/quickstart) — démarrage rapide

---

### 5.3 Configuration client MCP

**Ce qu'il faut comprendre :**
- Configuration dans Claude Code, Codex, etc.
- Découverte des outils
- Appel de tools
- Gestion des erreurs
- Permissions et confirmations

**Pourquoi c'est nécessaire pour EKTS :**
- Les agents doivent pouvoir utiliser les outils EKTS
- La configuration client est nécessaire pour l'intégration
- La compréhension des permissions est critique pour la sécurité

**Comment valider la maîtrise :**
- Exercice : configurer Claude Code pour utiliser un serveur MCP local, appeler un tool
- Critère : être capable de configurer un client MCP et d'appeler des outils

**Ressources recommandées :**
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) — documentation officielle
- [MCP Client Configuration](https://modelcontextprotocol.io/quickstart/user) — configuration
- [Codex Documentation](https://platform.openai.com/docs/guides/codex) — documentation OpenAI

---

## 6. Niveau 4 — Recherche et capitalisation

### 6.1 Modélisation de données

**Ce qu'il faut comprendre :**
- Schémas de données (JSON, TypeScript)
- Relations entre entités
- Identifiants uniques
- Métadonnées (provenance, licence, date)
- Normalisation et déduplication

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS stocke des ressources avec des métadonnées
- La modélisation est critique pour la recherche et la gouvernance
- Les relations entre ressources doivent être explicites

**Comment valider la maîtrise :**
- Exercice : concevoir un schéma de données pour une ressource EKTS (titre, description, tags, provenance, licence, etc.)
- Critère : être capable de concevoir un schéma cohérent et de l'implémenter en TypeScript

**Ressources recommandées :**
- [Database Design Tutorial](https://www.lucidchart.com/pages/database-diagram/database-design-tutorial) — conception de bases de données
- [JSON Schema](https://json-schema.org/learn/getting-started-step-by-step) — schémas JSON
- [TypeScript Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) — types avancés

---

### 6.2 Indexation et recherche textuelle

**Ce qu'il faut comprendre :**
- Index inversé
- Recherche plein texte
- Fuzzy matching
- Filtres et facettes
- Bibliothèques : FlexSearch, MiniSearch, Lunr.js

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS doit permettre de retrouver des ressources
- La recherche textuelle est le premier niveau de recherche
- Les filtres et facettes améliorent l'expérience

**Comment valider la maîtrise :**
- Exercice : indexer un ensemble de documents avec MiniSearch, implémenter une recherche avec filtres
- Critère : être capable de créer un index et de rechercher des documents avec des filtres

**Ressources recommandées :**
- [MiniSearch Documentation](https://lucaong.github.io/minisearch/) — bibliothèque légère
- [FlexSearch](https://github.com/nextapps-de/flexsearch) — recherche rapide
- [Information Retrieval](https://nlp.stanford.edu/IR-book/) — livre gratuit

---

### 6.3 RAG et recherche vectorielle

**Ce qu'il faut comprendre :**
- Embeddings (représentation vectorielle)
- Similarité cosinus
- Vector stores (Qdrant, ChromaDB, pgvector)
- Chunking (découpage de documents)
- Reranking
- Hybrid search (textuelle + vectorielle)

**Pourquoi c'est nécessaire pour EKTS :**
- Le RAG peut améliorer la recherche sémantique
- Les embeddings permettent de retrouver des contenus similaires
- La recherche hybride combine les avantages des deux approches

**Comment valider la maîtrise :**
- Exercice : créer des embeddings avec un modèle, les stocker dans Qdrant, rechercher des similarités
- Critère : être capable d'expliquer le RAG et de comparer recherche textuelle vs vectorielle

**Ressources recommandées :**
- [Qdrant Documentation](https://qdrant.tech/documentation/) — vector store
- [ChromaDB Documentation](https://docs.trychroma.com/) — alternative légère
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings) — documentation
- [Sentence Transformers](https://www.sbert.net/) — embeddings locaux

---

### 6.4 Versionnement et capitalisation

**Ce qu'il faut comprendre :**
- Cycle de vie d'un artefact
- Nettoyage des secrets
- Documentation des choix
- Validation humaine
- Indexation et publication
- Dépréciation

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS capitalise les projets terminés
- Le versionnement est nécessaire pour la traçabilité
- La validation humaine garantit la qualité

**Comment valider la maîtrise :**
- Exercice : définir un workflow de capitalisation pour un projet fictif
- Critère : être capable de concevoir un processus de capitalisation complet

**Ressources recommandées :**
- [Postmortem Template](https://github.com/dastergon/postmortem-templates) — templates de postmortem
- [Git Secrets](https://github.com/awslabs/git-secrets) — détection de secrets
- [Semantic Versioning](https://semver.org/) — versionnement

---

## 7. Niveau 5 — Système robuste

### 7.1 Orchestration et workflows

**Ce qu'il faut comprendre :**
- Patterns d'orchestration (pipeline, state machine)
- Gestion des états
- Reprise sur erreur
- Timeouts et retries
- Files d'attente (queues)
- Bibliothèques : Bull, Temporal

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS orchestre des workflows complexes (inspection, capitalisation)
- La fiabilité est critique pour les opérations longues
- La reprise sur erreur améliore la robustesse

**Comment valider la maîtrise :**
- Exercice : implémenter un workflow simple avec gestion d'états et retries
- Critère : être capable de concevoir un workflow fiable et observable

**Ressources recommandées :**
- [Bull Queue](https://github.com/OptimalBits/bull) — queue Node.js
- [Temporal Documentation](https://docs.temporal.io/) — orchestration distribuée
- [Workflow Patterns](https://workflowpatterns.com/) — patterns d'orchestration

---

### 7.2 Sécurité et permissions

**Ce qu'il faut comprendre :**
- Moindre privilège
- Listes blanches (domaines, chemins)
- Gestion des secrets (dotenv, vault)
- Prompt injection
- Isolation des processus
- Audit et logs

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS manipule des secrets et des données sensibles
- La sécurité est critique pour éviter les fuites
- L'audit permet la traçabilité

**Comment valider la maîtrise :**
- Exercice : implémenter une politique de permissions pour un outil EKTS
- Critère : être capable de concevoir une politique de sécurité et de l'implémenter

**Ressources recommandées :**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — risques de sécurité
- [Prompt Injection](https://simonwillison.net/2023/Apr/14/worst-that-can-happen/) — article sur les risques
- [dotenv](https://github.com/motdotla/dotenv) — gestion des variables d'environnement

---

### 7.3 Observabilité et logs

**Ce qu'il faut comprendre :**
- Logging structuré (JSON, niveaux)
- Métriques (compteurs, jauges, histogrammes)
- Traces distribuées
- Bibliothèques : Pino, Winston, OpenTelemetry
- Dashboards et alertes

**Pourquoi c'est nécessaire pour EKTS :**
- L'observabilité est nécessaire pour le debugging
- Les métriques permettent de mesurer la performance
- Les traces aident à diagnostiquer les problèmes

**Comment valider la maîtrise :**
- Exercice : implémenter des logs structurés avec Pino, créer des métriques simples
- Critère : être capable de configurer des logs et des métriques pour un service

**Ressources recommandées :**
- [Pino Documentation](https://getpino.io/) — logger rapide
- [OpenTelemetry](https://opentelemetry.io/docs/) — observabilité standard
- [Structured Logging](https://www.inngest.com/blog/structured-logging) — article

---

### 7.4 Tests end-to-end et benchmarks

**Ce qu'il faut comprendre :**
- Tests E2E avec Playwright
- Benchmarks reproductibles
- Jeux de données de référence
- Comparaison de performances
- Automatisation des tests

**Pourquoi c'est nécessaire pour EKTS :**
- Les tests E2E garantissent la fiabilité des workflows
- Les benchmarks permettent de comparer les solutions
- La reproductibilité est critique pour l'évaluation

**Comment valider la maîtrise :**
- Exercice : écrire un test E2E pour un workflow EKTS, créer un benchmark reproductible
- Critère : être capable d'écrire des tests E2E et de mesurer la performance

**Ressources recommandées :**
- [Playwright E2E](https://playwright.dev/docs/test-assertions) — documentation
- [Benchmarking Node.js](https://nodespeed.com/) — article
- [Testing Library](https://testing-library.com/) — utilities de test

---

## 8. Niveau 6 — Capacités spécialisées

### 8.1 Analyse visuelle et comparaison

**Ce qu'il faut comprendre :**
- Traitement d'images (sharp, jimp)
- Comparaison de pixels (pixelmatch, pixel-diff)
- Détection de différences
- Extraction de métriques (couleurs dominantes, contraste)
- OCR (reconnaissance de texte)

**Pourquoi c'est nécessaire pour EKTS :**
- L'analyse visuelle est utilisée pour l'inspection de sites
- La comparaison de captures permet de détecter des changements
- L'extraction de métriques aide à l'analyse UX

**Comment valider la maîtrise :**
- Exercice : comparer deux images avec pixelmatch, extraire les différences
- Critère : être capable de manipuler des images et de détecter des différences

**Ressources recommandées :**
- [Sharp Documentation](https://sharp.pixelplumbing.com/) — traitement d'images
- [Pixelmatch](https://github.com/mapbox/pixelmatch) — comparaison de pixels
- [Tesseract.js](https://tesseract.projectnaptha.com/) — OCR en JS

---

### 8.2 Motion et animations

**Ce qu'il faut comprendre :**
- CSS animations et transitions
- JavaScript animations (requestAnimationFrame)
- Bibliothèques : Motion, Anime.js, GSAP
- Scroll-driven animations
- Performances et optimisation

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS référence des composants motion
- La compréhension du motion est nécessaire pour le Domaine E
- Les animations sont utilisées dans le web créatif

**Comment valider la maîtrise :**
- Exercice : créer une animation avec Motion, implémenter une scroll-driven animation
- Critère : être capable de créer des animations performantes et accessibles

**Ressources recommandées :**
- [Motion Documentation](https://motion.dev/docs) — bibliothèque moderne
- [Anime.js Documentation](https://animejs.com/documentation/) — bibliothèque légère
- [GSAP Documentation](https://gsap.com/docs/) — bibliothèque professionnelle
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) — MDN

---

### 8.3 3D et WebGL

**Ce qu'il faut comprendre :**
- Concepts 3D (mesh, materials, lighting, cameras)
- Three.js (scène, objets, rendu)
- React Three Fiber (intégration React)
- Shaders (GLSL)
- Performances et optimisation

**Pourquoi c'est nécessaire pour EKTS :**
- EKTS référence des composants 3D
- La compréhension de la 3D est nécessaire pour le Domaine E
- WebGL est utilisé pour le web créatif avancé

**Comment valider la maîtrise :**
- Exercice : créer une scène Three.js simple avec un objet, une lumière et une caméra
- Critère : être capable de créer une scène 3D basique et de l'intégrer dans React

**Ressources recommandées :**
- [Three.js Documentation](https://threejs.org/docs/) — officiel
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) — intégration React
- [The Book of Shaders](https://thebookofshaders.com/) — introduction aux shaders
- [Discover Three.js](https://discoverthreejs.com/) — livre gratuit

---

### 8.4 Mathématiques et génération procédurale

**Ce qu'il faut comprendre :**
- Géométrie (vecteurs, matrices, transformations)
- Algorithmes de génération (bruit, fractales, L-systèmes)
- Physique simulée (particules, collisions)
- Visualisation de données
- Bibliothèques : p5.js, D3.js, three-noise

**Pourquoi c'est nécessaire pour EKTS :**
- La génération procédurale est utilisée dans le web créatif
- Les mathématiques sont nécessaires pour la 3D et les animations
- La visualisation de données est utile pour l'analyse

**Comment valider la maîtrise :**
- Exercice : implémenter un algorithme de bruit de Perlin, créer une visualisation
- Critère : être capable d'implémenter un algorithme de génération procéduelle simple

**Ressources recommandées :**
- [The Nature of Code (livre gratuit)](https://natureofcode.com/) — simulation de systèmes naturels
- [p5.js Documentation](https://p5js.org/reference/) — bibliothèque créative
- [D3.js Documentation](https://d3js.org/getting-started) — visualisation de données
- [Book of Shaders](https://thebookofshaders.com/) — shaders et génération

---

## 9. Résumé des compétences par niveau

| Niveau | Compétences clés | Durée | Outils principaux |
|--------|------------------|-------|-------------------|
| **1** | Terminal, JS/TS, HTTP, Git, JSON, tests | 2-4 sem. | Node.js, TypeScript, Git |
| **2** | CLI, API, processus, Playwright, stockage | 2-3 sem. | Commander.js, Express, Playwright |
| **3** | MCP client/serveur, configuration | 1-2 sem. | MCP SDK, Claude Code |
| **4** | Modélisation, recherche, RAG, capitalisation | 2-3 sem. | MiniSearch, Qdrant, Zod |
| **5** | Orchestration, sécurité, observabilité, tests | 2-3 sem. | Bull, Pino, Playwright |
| **6** | Analyse visuelle, motion, 3D, mathématiques | 3-4 sem. | Sharp, Motion, Three.js |

---

## 10. Questions ouvertes

1. **Ordre d'apprentissage optimal** : faut-il suivre strictement les niveaux, ou peut-on paralléliser certains ?
2. **Profondeur vs largeur** : faut-il maîtriser chaque compétence en profondeur, ou suffit-il d'une compréhension opérationnelle ?
3. **Ressources supplémentaires** : quelles autres ressources gratuites sont pertinentes ?
4. **Validation de la maîtrise** : quels exercices concrets permettent de valider chaque compétence ?

---

## Sources et date de consultation

| Ressource | URL | Date |
|-----------|-----|------|
| Node.js Documentation | https://nodejs.org/learn | 21 octobre 2026 |
| MDN Web Docs | https://developer.mozilla.org/ | 21 octobre 2026 |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/ | 21 octobre 2026 |
| Playwright Documentation | https://playwright.dev/docs/ | 21 octobre 2026 |
| freeCodeCamp | https://www.freecodecamp.org/ | 21 octobre 2026 |
| MCP Specification | https://modelcontextprotocol.io/ | 21 octobre 2026 |

---

*Document créé le 21 octobre 2026 — Phase 01 du projet EKTS*
