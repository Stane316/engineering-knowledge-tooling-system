# Phase 01 — Parcours d'Apprentissage Structuré

**Statut :** 🔄 En cours (Phase 01)  
**Date :** 21 octobre 2026  
**Version :** 1.0

---

## 1. Objectif

Ce document propose un parcours d'apprentissage progressif pour maîtriser les compétences techniques nécessaires à la construction d'EKTS. Contrairement au document `01_FONDATIONS_ET_PREREQUIS.md` qui liste les compétences, ce document définit **comment les acquérir concrètement** avec des ressources, des exercices et des validations.

**Public cible :** Développeur avec des bases en programmation (variables, fonctions, boucles) mais peu d'expérience avec Node.js, TypeScript, et l'écosystème web moderne.

**Durée totale estimée :** 12-19 semaines (3-5 mois) à temps partiel (10-15h/semaine)

---

## 2. Philosophie du parcours

### 2.1 Apprentissage par la pratique

Chaque étape comprend :
- **Théorie minimale** (20% du temps) — concepts clés, pas de cours exhaustif
- **Pratique intensive** (60% du temps) — exercices, mini-projets
- **Validation** (20% du temps) — tests, critères observables

### 2.2 Projets fil rouge

Le parcours utilise des mini-projets liés à EKTS pour contextualiser l'apprentissage :
- **Projet A** (Niveau 1) : CLI de gestion de fichiers Markdown
- **Projet B** (Niveau 2) : Scraper de ressources web avec stockage JSON
- **Projet C** (Niveau 3) : Serveur MCP exposant une bibliothèque de ressources
- **Projet D** (Niveau 4) : Recherche textuelle et sémantique
- **Projet E** (Niveau 5) : Workflow d'inspection de site avec rapports
- **Projet F** (Niveau 6) : Analyse visuelle et comparaison de captures

### 2.3 Validation continue

Chaque étape se termine par :
- Un exercice pratique validé
- Un mini-projet fonctionnel
- Une auto-évaluation avec critères observables
- Une checklist de compétences acquises

---

## 3. Niveau 1 — Fondations (2-4 semaines)

### Étape 1.1 : Terminal et système de fichiers (3 jours)

**Objectif :** Être à l'aise avec le terminal pour naviguer, manipuler des fichiers et exécuter des scripts.

**Ressources :**
- [The Linux Command Line](https://linuxcommand.org/tlcl.php) — chapitres 1-8 (gratuit)
- [MDN - Command Line](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Understanding_client-side_tools/Command_line) — introduction

**Exercices :**
1. Créer une arborescence de dossiers : `mkdir -p ekts/{resources,tools,tests}`
2. Copier, déplacer, renommer des fichiers dans cette structure
3. Changer les permissions d'un fichier : `chmod 755 script.sh`
4. Utiliser des variables d'environnement : `export EKTS_HOME=~/ekts`
5. Rediriger la sortie d'une commande vers un fichier : `ls > files.txt`

**Validation :**
- [ ] Je peux naviguer dans l'arborescence sans hésiter
- [ ] Je comprends les permissions et peux les modifier
- [ ] Je sais utiliser des variables d'environnement
- [ ] Je peux enchaîner des commandes avec des pipes

**Mini-projet :** Créer un script bash qui liste tous les fichiers Markdown d'un dossier et compte le nombre de lignes.

---

### Étape 1.2 : JavaScript moderne (1 semaine)

**Objectif :** Maîtriser les bases de JavaScript : types, fonctions, objets, async/await.

**Ressources :**
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) — sections 1-10
- [JavaScript.info](https://javascript.info/) — parties 1-2 (gratuit)
- [freeCodeCamp - JavaScript Basics](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/) — certification gratuite

**Exercices :**
1. Manipuler des types primitifs (string, number, boolean, null, undefined)
2. Créer des objets et des tableaux, accéder aux propriétés
3. Écrire des fonctions fléchées avec paramètres et valeurs par défaut
4. Utiliser destructuring et spread operator
5. Gérer l'asynchrone avec async/await et Promises
6. Parser et sérialiser du JSON

**Validation :**
- [ ] Je comprends la différence entre `let`, `const`, et `var`
- [ ] Je sais utiliser async/await pour des opérations asynchrones
- [ ] Je peux manipuler des objets et des tableaux de manière fluide
- [ ] Je comprends les closures et le scope

**Mini-projet :** Créer un script qui lit un fichier JSON, transforme les données (filtrage, mapping), et écrit le résultat dans un autre fichier.

---

### Étape 1.3 : TypeScript (5 jours)

**Objectif :** Comprendre le système de types de TypeScript et l'utiliser pour écrire du code plus sûr.

**Ressources :**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — sections "The Basics" à "Object Types"
- [TypeScript Playground](https://www.typescriptlang.org/play) — experimentation interactive

**Exercices :**
1. Définir des types de base (string, number, boolean, array, object)
2. Créer des interfaces pour des structures de données
3. Utiliser les generics pour des fonctions polymorphiques
4. Comprendre l'inférence de types et le type narrowing
5. Configurer un projet TypeScript avec `tsconfig.json`
6. Compiler et exécuter du code TypeScript

**Validation :**
- [ ] Je peux définir des interfaces pour des objets complexes
- [ ] Je comprends les generics et sais les utiliser
- [ ] Je sais configurer un projet TypeScript
- [ ] Je comprends la différence entre types et interfaces

**Mini-projet :** Convertir le script JSON de l'étape 1.2 en TypeScript avec des types stricts pour les données.

---

### Étape 1.4 : HTTP et APIs (3 jours)

**Objectif :** Comprendre le protocole HTTP et savoir faire des requêtes vers des APIs.

**Ressources :**
- [MDN HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — vue d'ensemble
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) — requêtes HTTP en JS
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) — API de test gratuite

**Exercices :**
1. Faire une requête GET vers une API publique (JSONPlaceholder)
2. Parser la réponse JSON et extraire des données
3. Faire une requête POST avec un corps JSON
4. Gérer les erreurs HTTP (404, 500)
5. Comprendre les headers (Content-Type, Authorization)

**Validation :**
- [ ] Je comprends la différence entre GET, POST, PUT, DELETE
- [ ] Je sais faire des requêtes HTTP avec fetch ou axios
- [ ] Je peux gérer les erreurs et les status codes
- [ ] Je comprends les headers et leur rôle

**Mini-projet :** Créer un script qui récupère une liste de posts depuis JSONPlaceholder, filtre ceux qui contiennent un mot clé, et affiche le résultat.

---

### Étape 1.5 : Node.js et npm (4 jours)

**Objectif :** Maîtriser Node.js pour exécuter du JavaScript hors du navigateur et gérer des packages avec npm.

**Ressources :**
- [Node.js Official Learn](https://nodejs.org/learn) — tutoriels officiels
- [Node.js API Docs](https://nodejs.org/api/) — référence
- [npm Documentation](https://docs.npmjs.com/) — gestion de packages

**Exercices :**
1. Installer Node.js avec nvm ou fnm
2. Créer un `package.json` avec `npm init`
3. Installer des dépendances avec `npm install`
4. Écrire des scripts dans `package.json`
5. Utiliser les modules Node.js (fs, path, etc.)
6. Lire et écrire des fichiers avec `fs.promises`

**Validation :**
- [ ] Je sais créer et configurer un projet Node.js
- [ ] Je comprends le système de modules (CommonJS vs ES modules)
- [ ] Je peux utiliser les modules built-in (fs, path)
- [ ] Je sais gérer les dépendances avec npm

**Mini-projet (Projet A) :** Créer une CLI Node.js qui :
- Liste tous les fichiers Markdown d'un dossier
- Affiche des statistiques (nombre de fichiers, taille totale)
- Permet de rechercher un mot dans les fichiers
- Utilise des arguments en ligne de commande

**Livrable :** Un package Node.js avec un script exécutable `node cli.js list --path ./docs`

---

### Étape 1.6 : Git et versionnement (3 jours)

**Objectif :** Maîtriser Git pour versionner son code et collaborer.

**Ressources :**
- [Pro Git Book](https://git-scm.com/book/en/v2) — chapitres 1-3 (gratuit)
- [Learn Git Branching](https://learngitbranching.js.org/) — jeu interactif
- [GitHub Guides](https://guides.github.com/) — tutoriels GitHub

**Exercices :**
1. Initialiser un dépôt Git avec `git init`
2. Faire des commits avec des messages clairs
3. Créer et utiliser des branches
4. Fusionner des branches et résoudre des conflits
5. Créer des tags pour marquer des versions
6. Pousser vers GitHub

**Validation :**
- [ ] Je comprends le modèle de branches de Git
- [ ] Je sais résoudre des conflits de fusion
- [ ] Je peux utiliser des tags pour versionner
- [ ] Je sais pousser du code vers un dépôt distant

**Mini-projet :** Versionner le Projet A avec Git, créer une branche pour une nouvelle fonctionnalité, fusionner, et pousser vers GitHub.

---

### Étape 1.7 : Tests et débogage (3 jours)

**Objectif :** Savoir écrire des tests unitaires et déboguer du code Node.js.

**Ressources :**
- [Node.js Test Runner](https://nodejs.org/api/test.html) — documentation officielle
- [MDN Debugging](https://developer.mozilla.org/en-US/docs/Mozilla/Debugging/Debugging_JavaScript) — débogage JS
- [Vitest Documentation](https://vitest.dev/) — framework de test moderne

**Exercices :**
1. Écrire un test unitaire avec le Node.js test runner
2. Utiliser des assertions (assert, expect)
3. Déboguer avec `console.log`, `debugger`, et VS Code
4. Mock des fonctions et des modules
5. Mesurer la couverture de tests

**Validation :**
- [ ] Je sais écrire des tests unitaires
- [ ] Je comprends les assertions et les mocks
- [ ] Je peux déboguer un script avec des breakpoints
- [ ] Je sais exécuter des tests et interpréter les résultats

**Mini-projet :** Ajouter des tests au Projet A pour valider le fonctionnement de la CLI.

---

### ✅ Validation du Niveau 1

**Critères de réussite :**
- [ ] Je peux créer un projet Node.js avec TypeScript
- [ ] Je sais utiliser le terminal pour manipuler des fichiers
- [ ] Je peux faire des requêtes HTTP et parser du JSON
- [ ] Je versionne mon code avec Git
- [ ] J'écris des tests pour valider mon code

**Projet validé :** Projet A — CLI de gestion de fichiers Markdown

**Durée estimée :** 2-4 semaines

---

## 4. Niveau 2 — Construction d'outils (2-3 semaines)

### Étape 2.1 : Conception d'une CLI robuste (4 jours)

**Objectif :** Créer des CLI professionnelles avec validation d'entrées, aide, et gestion d'erreurs.

**Ressources :**
- [Commander.js Documentation](https://github.com/tj/commander.js) — bibliothèque CLI
- [CLI Guide](https://clig.dev/) — bonnes pratiques de conception
- [oclif](https://oclif.io/) — framework CLI avancé

**Exercices :**
1. Créer une CLI avec Commander.js
2. Définir des commandes et sous-commandes
3. Ajouter des options et des arguments
4. Valider les entrées avec Zod
5. Afficher de l'aide avec `--help`
6. Gérer les erreurs avec des messages clairs

**Validation :**
- [ ] Je sais concevoir une CLI avec une interface claire
- [ ] Je valide les entrées avec des schémas
- [ ] Je gère les erreurs de manière appropriée
- [ ] Je fournis de l'aide et de la documentation

**Mini-projet :** Améliorer le Projet A avec Commander.js, ajouter des sous-commandes (`list`, `search`, `stats`), valider les entrées, et afficher de l'aide.

---

### Étape 2.2 : Création d'une API locale (4 jours)

**Objectif :** Créer une API REST simple avec Express.js pour exposer des fonctionnalités.

**Ressources :**
- [Express.js Documentation](https://expressjs.com/) — framework HTTP
- [Express Guide](https://expressjs.com/en/starter/installation.html) — démarrage rapide
- [Postman](https://www.postman.com/) — test d'APIs

**Exercices :**
1. Créer un serveur Express avec des routes
2. Gérer des requêtes GET, POST, PUT, DELETE
3. Utiliser des middlewares (parsing JSON, logs, erreurs)
4. Valider les entrées avec Zod
5. Retourner des réponses JSON structurées
6. Gérer les erreurs HTTP (404, 500)

**Validation :**
- [ ] Je sais créer une API REST avec Express
- [ ] Je comprends les middlewares et leur rôle
- [ ] Je valide les entrées et gère les erreurs
- [ ] Je peux tester mon API avec Postman ou curl

**Mini-projet :** Créer une API REST qui expose une liste de ressources (titres, descriptions, URLs) avec des endpoints CRUD.

---

### Étape 2.3 : Processus et concurrence (3 jours)

**Objectif :** Comprendre les processus Node.js et gérer la concurrence.

**Ressources :**
- [Node.js Child Process](https://nodejs.org/api/child_process.html) — documentation
- [Worker Threads](https://nodejs.org/api/worker_threads.html) — documentation
- [Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) — tutoriel

**Exercices :**
1. Lancer un processus enfant avec `child_process`
2. Communiquer entre processus (stdin, stdout)
3. Utiliser des worker threads pour du parallélisme
4. Gérer des timeouts et des interruptions
5. Comprendre l'event loop et l'asynchrone

**Validation :**
- [ ] Je comprends la différence entre processus et threads
- [ ] Je sais lancer des processus enfants
- [ ] Je gère les timeouts et les erreurs
- [ ] Je comprends l'event loop de Node.js

**Mini-projet :** Créer un script qui lance plusieurs tâches en parallèle (ex: téléchargement de fichiers) et attend la fin de toutes.

---

### Étape 2.4 : Automatisation de navigateur avec Playwright (5 jours)

**Objectif :** Maîtriser Playwright pour automatiser un navigateur, capturer des pages et extraire des données.

**Ressources :**
- [Playwright Documentation](https://playwright.dev/docs/intro) — officiel
- [Playwright API](https://playwright.dev/docs/api/class-playwright) — référence
- [Playwright Examples](https://playwright.dev/docs/writing-tests) — exemples

**Exercices :**
1. Installer Playwright et les navigateurs
2. Lancer un navigateur et naviguer vers une URL
3. Attendre des éléments (waitForSelector, waitForLoadState)
4. Interagir avec la page (clics, formulaires)
5. Capturer des screenshots (viewport, full page)
6. Extraire du texte et des attributs
7. Gérer les erreurs et les timeouts

**Validation :**
- [ ] Je sais lancer un navigateur avec Playwright
- [ ] Je peux attendre des éléments et interagir avec la page
- [ ] Je capture des screenshots à différents viewports
- [ ] J'extrais des données du DOM
- [ ] Je gère les erreurs et les timeouts

**Mini-projet (Projet B) :** Créer un scraper qui :
- Navigue vers un site de ressources (ex: producthunt.com)
- Extrait les noms, descriptions et URLs des produits
- Capture des screenshots des pages
- Stocke les données dans un fichier JSON

**Livrable :** Un script Playwright qui scrape un site et génère un rapport JSON + screenshots.

---

### Étape 2.5 : Stockage et métadonnées (3 jours)

**Objectif :** Organiser le stockage de fichiers avec des métadonnées structurées.

**Ressources :**
- [Node.js File System](https://nodejs.org/api/fs.html) — documentation
- [YAML Specification](https://yaml.org/spec/) — format YAML
- [gray-matter](https://github.com/jonschlinkert/gray-matter) — frontmatter YAML

**Exercices :**
1. Organiser des fichiers dans une structure de dossiers
2. Ajouter des métadonnées en frontmatter YAML
3. Lire et écrire des fichiers JSON et YAML
4. Valider les métadonnées avec Zod
5. Générer des index et des sommaires

**Validation :**
- [ ] Je sais organiser des fichiers avec des métadonnées
- [ ] Je comprends le frontmatter YAML
- [ ] Je valide les métadonnées avec des schémas
- [ ] Je génère des index de fichiers

**Mini-projet :** Améliorer le Projet B en ajoutant des métadonnées (date d'extraction, source, licence) et en générant un index Markdown.

---

### ✅ Validation du Niveau 2

**Critères de réussite :**
- [ ] Je sais créer une CLI robuste avec validation d'entrées
- [ ] Je peux créer une API REST avec Express
- [ ] Je comprends les processus et la concurrence
- [ ] Je maîtrise Playwright pour l'automatisation de navigateur
- [ ] Je stocke des fichiers avec des métadonnées structurées

**Projet validé :** Projet B — Scraper de ressources web avec stockage JSON et métadonnées

**Durée estimée :** 2-3 semaines

---

## 5. Niveau 3 — Intégration agentique (1-2 semaines)

### Étape 3.1 : Modèle client/serveur MCP (3 jours)

**Objectif :** Comprendre le protocole MCP et son architecture client/serveur.

**Ressources :**
- [MCP Specification](https://modelcontextprotocol.io/specification) — spécification officielle
- [MCP Documentation](https://modelcontextprotocol.io/) — documentation
- [MCP GitHub](https://github.com/modelcontextprotocol) — dépôts officiels

**Exercices :**
1. Lire la spécification MCP et comprendre les concepts clés
2. Identifier les types de capacités : tools, resources, prompts
3. Comprendre les transports : stdio, HTTP
4. Dessiner l'architecture client/serveur
5. Lister les cas d'usage pour EKTS

**Validation :**
- [ ] Je comprends l'architecture client/serveur MCP
- [ ] Je sais différencier tools, resources, et prompts
- [ ] Je comprends les transports et leurs usages
- [ ] Je peux expliquer MCP à quelqu'un d'autre

**Mini-projet :** Rédiger un document expliquant MCP et son application à EKTS.

---

### Étape 3.2 : Création d'un serveur MCP (5 jours)

**Objectif :** Créer un serveur MCP minimal avec le SDK TypeScript et l'exposer à un client.

**Ressources :**
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — dépôt officiel
- [MCP Examples](https://github.com/modelcontextprotocol/examples) — exemples
- [MCP Quickstart](https://modelcontextprotocol.io/quickstart) — démarrage rapide

**Exercices :**
1. Installer le SDK MCP TypeScript
2. Créer un serveur MCP avec un tool simple (echo)
3. Définir des schémas d'entrée et de sortie avec Zod
4. Implémenter le transport stdio
5. Ajouter des logs et une gestion d'erreurs
6. Tester avec le MCP Inspector

**Validation :**
- [ ] Je sais créer un serveur MCP avec le SDK TypeScript
- [ ] Je définis des tools avec des schémas Zod
- [ ] J'implémente le transport stdio
- [ ] Je teste mon serveur avec le MCP Inspector

**Mini-projet :** Créer un serveur MCP qui expose un tool "list_resources" qui retourne une liste de ressources depuis un fichier JSON.

---

### Étape 3.3 : Configuration client MCP (3 jours)

**Objectif :** Configurer un client agent (Claude Code, Codex) pour utiliser le serveur MCP.

**Ressources :**
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) — documentation officielle
- [MCP Client Configuration](https://modelcontextprotocol.io/quickstart/user) — configuration
- [Codex Documentation](https://platform.openai.com/docs/guides/codex) — documentation OpenAI

**Exercices :**
1. Configurer Claude Code pour utiliser le serveur MCP local
2. Découvrir les outils exposés
3. Appeler un tool et interpréter le résultat
4. Gérer les erreurs et les permissions
5. Tester avec différents clients

**Validation :**
- [ ] Je sais configurer un client MCP
- [ ] Je peux appeler des tools depuis un agent
- [ ] Je comprends les permissions et les confirmations
- [ ] Je gère les erreurs de connexion

**Mini-projet (Projet C) :** Créer un serveur MCP complet qui expose :
- Un tool "search_resources" pour rechercher des ressources
- Un tool "get_resource" pour récupérer une ressource par ID
- Une resource "resources://list" pour lister toutes les ressources
- Configurer Claude Code pour utiliser ce serveur

**Livrable :** Un serveur MCP fonctionnel connecté à Claude Code.

---

### ✅ Validation du Niveau 3

**Critères de réussite :**
- [ ] Je comprends le protocole MCP en profondeur
- [ ] Je sais créer un serveur MCP avec le SDK TypeScript
- [ ] Je configure un client agent pour utiliser mon serveur
- [ ] J'expose des tools et resources fonctionnels

**Projet validé :** Projet C — Serveur MCP exposant une bibliothèque de ressources

**Durée estimée :** 1-2 semaines

---

## 6. Niveaux 4-6 — Résumé (non détaillé)

Les niveaux 4 à 6 suivent la même structure mais ne sont pas détaillés ici pour rester concise. Voici un résumé :

### Niveau 4 — Recherche et capitalisation (2-3 semaines)
- Modélisation de données pour les ressources
- Indexation et recherche textuelle avec MiniSearch
- RAG et recherche vectorielle avec Qdrant
- Workflow de capitalisation des projets

**Projet D :** Système de recherche textuelle et sémantique pour EKTS

### Niveau 5 — Système robuste (2-3 semaines)
- Orchestration de workflows avec Bull
- Sécurité et permissions (moindre privilège, listes blanches)
- Observabilité avec logs structurés (Pino)
- Tests end-to-end et benchmarks

**Projet E :** Workflow d'inspection de site avec rapports structurés

### Niveau 6 — Capacités spécialisées (3-4 semaines)
- Analyse visuelle avec Sharp et pixelmatch
- Motion et animations avec Motion et Anime.js
- 3D et WebGL avec Three.js et React Three Fiber
- Mathématiques et génération procédurale

**Projet F :** Analyse visuelle et comparaison de captures de sites

---

## 7. Ressources complémentaires

### 7.1 Cours et certifications gratuits

| Ressource | Sujet | Durée | Lien |
|-----------|-------|-------|------|
| **freeCodeCamp - JavaScript** | JavaScript et algorithmes | ~300h | [freecodecamp.org](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/) |
| **freeCodeCamp - Back End** | Node.js, Express, MongoDB | ~300h | [freecodecamp.org](https://www.freecodecamp.org/learn/back-end-development-and-apis/) |
| **The Odin Project** | Full-stack JavaScript | ~600h | [theodinproject.com](https://www.theodinproject.com/) |
| **MDN Learning Area** | Web development | Variable | [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Learn) |

### 7.2 Livres gratuits

| Livre | Sujet | Lien |
|-------|-------|------|
| **The Linux Command Line** | Terminal Linux | [linuxcommand.org](https://linuxcommand.org/tlcl.php) |
| **Pro Git** | Git et versionnement | [git-scm.com](https://git-scm.com/book/en/v2) |
| **The Nature of Code** | Simulation et génération | [natureofcode.com](https://natureofcode.com/) |
| **The Book of Shaders** | Shaders et graphisme | [thebookofshaders.com](https://thebookofshaders.com/) |
| **Information Retrieval** | Recherche d'information | [nlp.stanford.edu](https://nlp.stanford.edu/IR-book/) |

### 7.3 Documentation officielle

| Technologie | Documentation | Lien |
|-------------|---------------|------|
| **Node.js** | API et tutoriels | [nodejs.org](https://nodejs.org/learn) |
| **TypeScript** | Handbook et référence | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| **Playwright** | Automatisation navigateur | [playwright.dev](https://playwright.dev/docs/) |
| **MCP** | Protocole agentique | [modelcontextprotocol.io](https://modelcontextprotocol.io/) |
| **MDN** | Web technologies | [developer.mozilla.org](https://developer.mozilla.org/) |

---

## 8. Conseils pour réussir

### 8.1 Gestion du temps

- **Régularité > intensité** : 1-2h par jour vaut mieux que 10h le weekend
- **Projets concrets** : chaque étape doit produire quelque chose de tangible
- **Documentation** : noter ce qu'on apprend pour consolider
- **Pause** : prendre des pauses régulières pour éviter le burnout

### 8.2 Méthode d'apprentissage

- **Comprendre avant de mémoriser** : chercher à comprendre le "pourquoi"
- **Pratiquer activement** : coder, pas juste lire
- **Enseigner aux autres** : expliquer ce qu'on apprend consolide la compréhension
- **Accepter l'erreur** : les erreurs font partie de l'apprentissage

### 8.3 Outils recommandés

- **Éditeur** : VS Code avec extensions TypeScript, ESLint, Prettier
- **Terminal** : Windows Terminal ou iTerm2 (Mac)
- **Git** : GitHub Desktop ou CLI
- **Notes** : Obsidian ou Notion pour documenter l'apprentissage
- **Communauté** : Stack Overflow, Reddit, Discord pour poser des questions

---

## 9. Questions ouvertes

1. **Rythme d'apprentissage** : quel est le rythme optimal pour l'utilisateur ?
2. **Niveau initial** : quel est le niveau réel de l'utilisateur en JavaScript/TypeScript ?
3. **Priorités** : quels niveaux sont les plus critiques pour commencer EKTS ?
4. **Ressources supplémentaires** : quelles autres ressources seraient pertinentes ?

---

## Sources et date de consultation

| Ressource | URL | Date |
|-----------|-----|------|
| freeCodeCamp | https://www.freecodecamp.org/ | 21 octobre 2026 |
| MDN Web Docs | https://developer.mozilla.org/ | 21 octobre 2026 |
| Node.js Documentation | https://nodejs.org/learn | 21 octobre 2026 |
| TypeScript Handbook | https://www.typescriptlang.org/docs/handbook/ | 21 octobre 2026 |
| Playwright Documentation | https://playwright.dev/docs/ | 21 octobre 2026 |
| MCP Specification | https://modelcontextprotocol.io/ | 21 octobre 2026 |

---

*Document créé le 21 octobre 2026 — Phase 01 du projet EKTS*
