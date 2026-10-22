# BLUEPRINT — Système personnel d’ingénierie augmenté par l’IA

**Version :** 1.0  
**Date :** 21 octobre 2026  
**Statut :** Document de cadrage initial — à valider par la recherche  
**Nom de travail :** Engineering Knowledge & Tooling System (EKTS)

---

## 0. Comment lire ce document

Ce document transforme une idée encore partiellement observée en une vision technique exploitable. Il ne prétend pas connaître l’architecture interne de l’outil développé par les aînés : celui-ci n’est pas publiquement accessible et sa documentation n’a pas été fournie. Les fonctionnalités décrites comme venant de cet outil sont donc des **observations rapportées par l’utilisateur**, et non des faits vérifiés indépendamment.

Trois niveaux sont distingués :

- **Vision rapportée** : capacités que l’utilisateur a observées ou comprises en présentant l’outil.
- **Proposition d’architecture** : manière possible de construire un système comparable, sans supposer que l’outil de référence l’implémente ainsi.
- **À vérifier** : choix qui doivent être tranchés par la recherche technique et des prototypes.

Ce blueprint n’est ni une spécification finale ni un ordre d’utiliser une technologie particulière. Il définit le problème, les domaines à maîtriser et la méthode pour aboutir à des décisions fondées.

## 1. Vision du produit

### 1.1 Problème à résoudre

À chaque nouveau projet, un développeur ou un agent IA perd du temps à retrouver les mêmes ressources, réexpliquer les mêmes standards, rechercher des composants, reconstruire des scripts, refaire des analyses visuelles et répéter des solutions déjà découvertes. Les connaissances restent dispersées entre favoris, dépôts, documents, captures, prompts, bibliothèques et projets passés.

Un agent de code peut être puissant, mais il ne possède pas automatiquement le contexte spécialisé, les outils locaux, les références approuvées ni l’historique de décisions nécessaires pour produire systématiquement un résultat de haute qualité.

### 1.2 Vision

Construire un environnement personnel, local-first lorsque c’est pertinent, qui centralise et organise :

1. **Connaissances** — méthodes, normes, tutoriels, décisions, notes et documentation.
2. **Ressources** — bibliothèques, composants, modèles, exemples, outils et services.
3. **Capacités exécutables** — scripts, services, CLI, API, automatisations et outils MCP.
4. **Observation** — inspection de sites, captures, parcours utilisateur, mesures et tests.
5. **Mémoire de projet** — contexte, décisions, composants réutilisés, résultats, problèmes et leçons.
6. **Accès agentique** — interface standardisée pour qu’un agent puisse découvrir les ressources, appeler les outils autorisés et rendre compte de ses actions.
7. **Amélioration continue** — chaque réalisation peut enrichir une bibliothèque de références après vérification humaine.

L’objectif n’est pas que l’outil « rende automatiquement tout beau ». Il doit réduire le travail répété, rendre les bonnes pratiques accessibles, améliorer l’observabilité et faciliter des décisions techniques de qualité.

### 1.3 Proposition de valeur

> « Ne pas repartir de zéro : retrouver, comprendre, exécuter, vérifier et capitaliser sur ce qui a déjà été appris ou construit. »

### 1.4 Ce que le produit n’est pas

- Pas seulement une bibliothèque de prompts.
- Pas uniquement un agrégateur de liens.
- Pas un clone de navigateur ou de scraper.
- Pas un agent autonome ayant accès sans contrôle à tout le poste.
- Pas une collection de composants qui impose le même design à chaque projet.
- Pas une promesse de reproduction exacte de n’importe quel site.
- Pas un système qui archive automatiquement toute sortie comme si elle était validée.

## 2. Principes de conception

1. **Réutiliser avant de reconstruire** : chercher dans le patrimoine existant avant d’inventer une nouvelle solution.
2. **Connaissance vérifiable** : conserver les sources, la date de consultation, la licence, le contexte et le niveau de confiance.
3. **Outils composables** : préférer des capacités petites, testables et combinables à un service monolithique.
4. **L’agent découvre les capacités** : les outils doivent être décrits clairement avec leurs entrées, sorties, limites et erreurs.
5. **Humain responsable des décisions** : revue obligatoire pour les actions destructrices, l’extraction massive, les déploiements, les achats et les opérations sensibles.
6. **La qualité est mesurée** : tester l’exactitude, l’accessibilité, la performance, la sécurité, la fidélité des observations et la maintenabilité.
7. **Pas de technologie pour l’effet** : retenir l’outil le plus simple qui satisfait le besoin. Cette règle rejoint les principes des documents Digital Experience existants.
8. **Séparation des préoccupations** : connaissances, exécution, orchestration, stockage et interface ne doivent pas être confondus.
9. **Capitalisation contrôlée** : les projets terminés deviennent des références après nettoyage, annotation et validation.
10. **Évolutivité sans dépendance excessive** : formats exportables, interfaces documentées, sauvegardes et possibilité de remplacer un fournisseur.

## 3. Modèle mental : les couches du système

```text
Utilisateur
   │
   ▼
Agent de code (Claude Code, Codex ou autre)
   │
   │ protocole d'accès
   ▼
Couche d'intégration agentique (MCP / CLI / API / skills)
   │
   ▼
Orchestrateur et politiques d'exécution
   ├── Recherche et récupération de connaissances
   ├── Inspection navigateur et capture
   ├── Analyse visuelle et comparaison
   ├── Accès au dépôt / fichiers / terminal
   ├── Tests, mesure et validation
   ├── Génération et gestion des références
   └── Archivage et recherche des projets
   │
   ▼
Services spécialisés et adaptateurs
   ├── Navigateur automatisé
   ├── Scraping autorisé
   ├── Rendu / captures / vidéo
   ├── Analyse d'images et de structure
   ├── Indexation / recherche sémantique
   └── Outils de design, motion, 3D, mathématiques
   │
   ▼
Stockage
   ├── Documents et sources
   ├── Métadonnées et base relationnelle
   ├── Fichiers médias / captures / vidéos
   ├── Index de recherche
   ├── Historique d'exécution
   └── Artefacts de projets validés
```

Ce schéma est conceptuel. Il faudra décider, au fil de la recherche, quelles couches méritent un processus séparé et lesquelles peuvent rester des modules d’une seule application.

## 4. Démystification des notions essentielles

### 4.1 Node.js et npm

- **Node.js** : environnement permettant d’exécuter JavaScript hors du navigateur. Il peut faire tourner une CLI, un serveur local, un service d’intégration ou un orchestrateur.
- **npm** : gestionnaire de paquets et scripts associé à l’écosystème Node.js. `npm run dev` exécute simplement un script nommé `dev` défini dans `package.json`.
- **À retenir** : voir `npm run dev` ne prouve pas que tout le produit est « fait en Node.js ». Il peut lancer un serveur web, un service MCP, une interface et/ou plusieurs processus.

À maîtriser : installation, `package.json`, scripts, dépendances, variables d’environnement, modules, logs, gestion des erreurs, processus et débogage.

### 4.2 CLI — Command-Line Interface

Une CLI est une interface en ligne de commande. Elle permet d’exécuter une action avec des arguments et options, par exemple inspecter une URL, indexer un dossier ou lancer un test.

Une bonne CLI définit :
- commandes et sous-commandes ;
- options et valeurs par défaut ;
- validation des entrées ;
- codes de sortie ;
- messages d’erreur compréhensibles ;
- modes interactif et automatisable ;
- configuration et journalisation.

**Pourquoi c’est utile :** les humains peuvent piloter le système depuis le terminal, et les agents peuvent l’appeler de façon déterministe. Une CLI ne remplace pas MCP ; elle peut constituer l’interface exécutable sous-jacente d’un outil MCP.

### 4.3 Service, API, bibliothèque et outil

- **Bibliothèque** : code importé par un autre programme.
- **CLI** : programme lancé par une commande.
- **API** : interface permettant à un programme d’en appeler un autre, souvent via HTTP.
- **Service** : processus ou système qui fournit une capacité, localement ou à distance.
- **MCP server** : composant qui expose des outils, ressources ou prompts selon le protocole MCP.
- **Agent** : système qui planifie et choisit des actions en fonction d’un objectif et du contexte.
- **Orchestrateur** : composant qui coordonne plusieurs étapes, outils et états d’exécution.

Un même produit peut exposer la même capacité sous plusieurs formes : fonction de bibliothèque, commande CLI, API et outil MCP. Il faut toutefois éviter de créer toutes ces interfaces sans besoin concret.

### 4.4 MCP — Model Context Protocol

MCP est un protocole standardisé permettant à un client compatible de découvrir et d’utiliser des capacités exposées par un serveur. Selon l’implémentation, ces capacités peuvent inclure :

- **Tools** : actions exécutables, avec schéma d’entrée et résultat.
- **Resources** : contenus ou données que le client peut lire.
- **Prompts** : modèles de consignes exposés par le serveur.
- **Transport** : mécanisme de communication entre client et serveur, par exemple processus local via stdio ou transport distant pris en charge par les versions et clients concernés.

MCP ne rend pas un agent automatiquement compétent, ne garantit pas la sécurité et ne donne pas accès à toutes les fonctions d’une application. Le client doit prendre en charge le protocole et l’utilisateur doit autoriser/configurer la connexion.

À apprendre : client/serveur, découverte des outils, schémas d’entrée, sorties structurées, erreurs, transport, configuration client, permissions, authentification pour les connexions distantes, timeouts, journalisation et tests.

**Règle de décision :** utiliser MCP quand un agent compatible doit découvrir et appeler des capacités structurées. Garder une CLI/API ordinaire pour les scripts, l’intégration CI ou les usages sans agent.

### 4.5 Agents de code et permissions

Claude Code, Codex et d’autres agents peuvent différer sur leur prise en charge de MCP, leur configuration, leurs permissions et leurs mécanismes d’approbation. Ne pas supposer qu’une configuration est universelle.

Le système doit :
- exposer uniquement les outils nécessaires ;
- séparer lecture et écriture ;
- exiger une confirmation pour les opérations à risque ;
- restreindre les chemins de fichiers ;
- éviter de transmettre des secrets dans les logs ;
- définir des limites de durée, taille et fréquence ;
- garder une trace de l’outil appelé, de ses arguments utiles et de son résultat.

### 4.6 Scraping, crawling et automatisation du navigateur

Ces termes sont proches, mais ne désignent pas la même opération :

- **Crawling** : découvrir et parcourir des URL.
- **Scraping** : extraire des données ciblées depuis des pages ou réponses.
- **Browser automation** : interagir avec un navigateur comme un utilisateur (clics, formulaires, navigation, attente d’états).
- **Screenshot** : capture d’un état visuel à un instant donné.
- **Video/trace** : enregistrement d’une séquence d’actions, d’images ou d’événements.
- **Inspection DOM/accessibilité** : examiner la structure rendue, les éléments interactifs et éventuellement l’arbre d’accessibilité.
- **Reverse engineering UX** : reconstruire un modèle observable d’une expérience à partir d’indices visuels et comportementaux ; cela ne révèle pas automatiquement le code source ni l’architecture interne réelle du site.

Pour une analyse de site sérieuse, il faut combiner plusieurs signaux : captures, DOM, événements, URLs, états, mesures, erreurs console/réseau et parcours testés. Les captures seules peuvent manquer les causes, les états cachés et les éléments hors écran.

#### Limites à prévoir

- pages protégées par authentification ou CAPTCHA ;
- contenu rendu tardivement, lazy loading et infinite scroll ;
- variations selon viewport, locale, cookies ou session ;
- restrictions contractuelles, robots.txt, droits d’auteur et conditions d’utilisation ;
- limitations de débit, blocages, coûts et stabilité ;
- contenu dynamique, canvas/WebGL, vidéo et interactions difficiles à interpréter ;
- risque d’extraire des données personnelles ;
- confusion entre observation et déduction.

Le système doit respecter les conditions d’accès, les règles applicables et les autorisations. Il ne doit pas contourner les contrôles d’accès ni provoquer une charge excessive. Prévoir limites de débit, budget de pages, domaines autorisés, arrêt d’urgence et journalisation.

### 4.7 Captures à grande échelle : prudence sur les promesses

La capacité rapportée de « centaines de captures à la seconde » doit être vérifiée : parle-t-on de captures déjà enregistrées, d’images extraites d’une vidéo, de pages statiques, de plusieurs navigateurs, ou de vraies navigations interactives ? Ces opérations n’ont pas du tout le même coût.

Le système devra mesurer :
- pages réellement naviguées par seconde ;
- captures utilisables par minute ;
- temps moyen par page ;
- taux d’échec ;
- consommation CPU/RAM ;
- stockage généré ;
- coût réseau/API ;
- proportion d’images redondantes ;
- couverture réelle des états et parcours.

La bonne cible n’est pas le plus grand nombre d’images, mais la meilleure couverture utile à un coût acceptable.

### 4.8 Recherche documentaire et base de connaissances

Le système doit distinguer :
- **source originale** : documentation officielle, dépôt, article, exemple ;
- **fiche ressource** : résumé et usages ;
- **connaissance normalisée** : explication interne, limites et décisions ;
- **artefact** : code, capture, test, composant ou résultat ;
- **décision** : pourquoi une option a été choisie ou écartée.

Une base de connaissances n’est pas automatiquement une base vectorielle. Commencer par des fichiers bien structurés, des métadonnées, une recherche textuelle et des liens. Ajouter la recherche sémantique/vectorielle si des essais démontrent un gain. Prévoir provenance, version, fraîcheur, licence, tags et possibilité de retirer une référence devenue obsolète.

### 4.9 RAG et embeddings

- **RAG (Retrieval-Augmented Generation)** : retrouver des documents pertinents puis les fournir comme contexte à un modèle.
- **Embedding** : représentation numérique d’un contenu utilisée notamment pour rechercher des éléments sémantiquement proches.
- **Vector store** : stockage/index facilitant la recherche par similarité.

Ces techniques peuvent améliorer la récupération de connaissances, mais ne remplacent ni l’indexation propre, ni la recherche par mots-clés, ni les citations de sources. Un système hybride est souvent à comparer : recherche exacte + recherche plein texte + recherche sémantique + filtres de métadonnées.

### 4.10 Stockage, base de données et fichiers

Ne pas mettre tous les types de données dans un seul stockage sans analyse :
- documents et code : système de fichiers / Git ;
- métadonnées, états de jobs, utilisateurs et relations : base relationnelle ;
- captures, vidéos et fichiers volumineux : stockage objet ou fichiers structurés ;
- recherche : index textuel et, si utile, index vectoriel ;
- historique : logs d’exécution et journaux d’audit.

À comparer selon le besoin : SQLite pour un prototype local simple, PostgreSQL pour des relations et usages plus riches, stockage objet pour les médias, Git pour les artefacts versionnés. Le choix final dépend du déploiement, du volume, des sauvegardes, des requêtes et de la complexité opérationnelle.

### 4.11 Qualité logicielle, tests et observabilité

Le système lui-même doit être testable :
- tests unitaires pour la logique ;
- tests d’intégration pour les services ;
- tests de contrat pour les interfaces MCP/API ;
- tests end-to-end pour les parcours ;
- jeux de données de référence pour comparer les analyses ;
- logs structurés, métriques et traces ;
- gestion des erreurs et reprise ;
- versions des outils et configuration reproductible.

Un outil de capture doit être évalué sur des sites de test connus et des parcours répétables, pas uniquement sur une démonstration impressionnante.

## 5. Domaines fonctionnels à couvrir

### Domaine A — Bibliothèque de connaissances et ressources
Centraliser les références officielles, ressources gratuites, licences, plans étudiants, exemples, composants, scripts et notes.

Fonctions possibles :
- ajout manuel ou import contrôlé ;
- extraction de métadonnées ;
- classification par domaine et usage ;
- recherche textuelle et sémantique ;
- détection des doublons ;
- vérification périodique des liens ;
- suivi des versions et licences ;
- classement par qualité, coût, accessibilité et maturité.

### Domaine B — Inspection de sites et parcours
Permettre de décrire un site cible, choisir des pages et scénarios, exécuter des parcours, enregistrer les états et produire un dossier d’observation.

Sorties possibles :
- liste des pages ;
- captures par viewport ;
- vidéo/trace d’un parcours ;
- inventaire des interactions ;
- DOM et données d’accessibilité lorsque disponibles ;
- console et erreurs ;
- temps de chargement et métriques ;
- rapport de limites et zones non observées.

### Domaine C — Analyse et décomposition d’expériences
Transformer les observations en éléments structurés :
- architecture des pages et sections ;
- inventaire de composants et patterns ;
- états d’interaction ;
- séquences de motion ;
- comportements responsive ;
- hypothèses sur les mécanismes visuels ;
- références d’implémentation possibles ;
- degré de confiance de chaque conclusion.

Chaque constat doit être marqué comme **observé**, **inféré** ou **inconnu**. Ne pas présenter une supposition sur le code interne d’un site comme un fait.

### Domaine D — Bibliothèque de capacités exécutables
Créer et maintenir des outils internes réutilisables :
- commandes CLI ;
- scripts ;
- services locaux ;
- adaptateurs vers des bibliothèques ou APIs ;
- outils MCP ;
- validations automatiques ;
- générateurs de rapports.

Chaque outil doit posséder une fiche : objectif, prérequis, entrées, sorties, exemples, limites, erreurs, sécurité, tests, version et statut de maintenance.

### Domaine E — Design, web créatif, motion, 3D et mathématiques
Ce domaine prolonge les références Digital Experience déjà disponibles :
- Design System : tokens, composants, patterns et gouvernance ;
- UX & Quality : parcours, états, accessibilité, feedback et contrôle utilisateur ;
- 3D & Motion Engineering : scènes, transitions, timing, easing, scroll-driven motion, WebGL, Three.js, React Three Fiber et shaders.

À ajouter au besoin : génération procédurale, géométrie, algorithmes, visualisation scientifique, simulations physiques, optimisation de rendu, tests visuels et accessibilité des animations.

Le système ne doit pas imposer WebGL ou la 3D à chaque projet. Il doit recommander la technique adaptée : HTML/CSS, SVG, Canvas, WebGL, vidéo ou autre.

### Domaine F — Mémoire des projets et capitalisation
À la fin d’un projet, générer un dossier de clôture contenant :
- objectif et contraintes ;
- décisions architecturales ;
- versions de l’environnement ;
- outils et ressources employés ;
- composants réutilisables ;
- problèmes rencontrés et solutions ;
- résultats des tests et mesures ;
- limites connues ;
- captures et démonstrations ;
- licences et provenance ;
- éléments à ne pas réutiliser ;
- résumé destiné à la recherche future.

Une réalisation n’entre dans la bibliothèque de référence qu’après revue. Un projet raté peut aussi être utile s’il documente précisément les causes d’échec.

### Domaine G — Intégration aux agents
Les agents doivent pouvoir :
1. découvrir les outils disponibles ;
2. lire les règles et références pertinentes ;
3. lancer une inspection ou un test ;
4. récupérer les résultats structurés ;
5. citer les sources utilisées ;
6. proposer des changements ;
7. demander une approbation lorsque nécessaire ;
8. produire un rapport final et préparer la capitalisation.

### Domaine H — Gouvernance et sécurité
Prévoir :
- permissions minimales ;
- listes de domaines autorisés ;
- limites de volume et de durée ;
- gestion des secrets ;
- consentement pour les actions sensibles ;
- séparation des données personnelles et de démonstration ;
- sauvegardes ;
- journaux d’audit ;
- gestion de licence et attribution ;
- protection contre les instructions malveillantes trouvées dans les pages web ou documents.

Les pages et documents consultés sont des données non fiables : ils peuvent contenir des instructions hostiles. Un agent ne doit pas traiter le contenu d’une page comme une autorisation de modifier ses règles ou d’exécuter des actions hors périmètre.

## 6. Architecture logique recommandée pour l’étude

Il est préférable de rechercher et prototyper des couches indépendantes plutôt que de tout développer en même temps.

| Couche | Responsabilité | Question principale |
|---|---|---|
| Interface utilisateur | Configuration, visualisation, validation humaine | Une interface est-elle nécessaire dès le MVP, ou une CLI suffit-elle ? |
| CLI | Commandes déterministes | Quelles tâches doivent être exécutables sans agent ? |
| Adaptateur MCP | Exposer des capacités aux agents | Quels outils ont une vraie valeur agentique ? |
| Orchestrateur | Enchaîner les étapes, gérer les états et reprises | Quel workflow doit être fiable et observable ? |
| Services spécialisés | Navigateur, extraction, rendu, analyse, tests | Quelles capacités doivent être séparées ? |
| Couche de connaissance | Recherche, métadonnées, provenance | Comment retrouver la bonne référence avec confiance ? |
| Stockage | Documents, médias, métadonnées, historiques | Quel stockage pour chaque type de donnée ? |
| Gouvernance | Permissions, budgets, audit, validation | Comment éviter les actions non désirées ? |

### Architecture d’un outil individuel

Chaque outil devrait suivre un contrat cohérent :

- **Identifiant et version**
- **But**
- **Cas d’usage et non-objectifs**
- **Schéma d’entrée**
- **Validation**
- **Permissions nécessaires**
- **Limites de volume, durée et coût**
- **Résultat structuré**
- **Erreurs typées et reprise**
- **Logs**
- **Tests**
- **Exemple CLI**
- **Exemple MCP si pertinent**
- **Documentation**
- **Critères d’acceptation**

## 7. Compétences à acquérir, dans l’ordre

L’ordre proposé vise à permettre de comprendre les mécanismes avant de construire une architecture complexe.

### Niveau 1 — Fondations obligatoires
1. Terminal et système de fichiers : chemins, processus, variables d’environnement, permissions, logs.
2. JavaScript/TypeScript et Node.js : modules, async/await, erreurs, packages, scripts npm.
3. HTTP et web : requêtes, réponses, headers, cookies, sessions, JSON, HTML, DOM.
4. Git : commits, branches, diff, historique, versionnement des outils et artefacts.
5. JSON et validation de données : schémas, types, données invalides et sérialisation.
6. Tests de base et débogage.

### Niveau 2 — Construction d’outils
7. Concevoir une CLI.
8. Créer une API locale simple.
9. Comprendre processus, ports, timeouts et concurrence.
10. Utiliser Playwright ou un outil comparable pour automatiser un navigateur.
11. Capturer des pages, attendre les états, manipuler le DOM et gérer les erreurs.
12. Stocker des fichiers, métadonnées et journaux.

### Niveau 3 — Intégration agentique
13. Comprendre le modèle client/serveur MCP.
14. Créer un premier serveur MCP minimal avec un seul outil en lecture seule.
15. Configurer un client agent et tester la découverte et l’appel de l’outil.
16. Ajouter validation, permissions, erreurs, timeouts et tests de contrat.
17. Comparer MCP avec l’appel direct d’une CLI ou d’une API.

### Niveau 4 — Recherche et capitalisation
18. Modéliser les ressources et leurs métadonnées.
19. Créer un index de recherche textuelle.
20. Évaluer le RAG et la recherche vectorielle seulement si nécessaire.
21. Concevoir un pipeline d’ingestion avec déduplication et provenance.
22. Versionner les artefacts et produire un dossier de clôture de projet.

### Niveau 5 — Système robuste
23. Orchestration de jobs, reprise, files d’attente si la charge l’exige.
24. Sécurité, permissions, gestion des secrets et isolation.
25. Observabilité et mesures de performance.
26. Tests end-to-end et benchmarks reproductibles.
27. Déploiement, sauvegarde, mises à jour et maintenance.

### Niveau 6 — Capacités spécialisées
28. Analyse visuelle et comparaison d’images.
29. Extraction des comportements et états UX.
30. Enregistrement de traces et vidéos.
31. Motion, Canvas/WebGL, 3D et génération procédurale.
32. Analyse mathématique ou physique lorsque le projet le justifie.
33. Optimisation de coût, latence, mémoire et volume de données.

**Critère de maîtrise :** être capable d’expliquer le rôle d’un composant, de l’exécuter seul, de diagnostiquer un échec, de tester ses limites et de décider s’il mérite d’être intégré au système.

## 8. Services et familles d’outils à comparer

Cette section définit des familles à rechercher, pas un classement définitif. La recherche dédiée devra vérifier la situation actuelle, les licences, les plans gratuits, les quotas, les conditions d’usage et la compatibilité avec le poste Windows de l’utilisateur.

### 8.1 Automatisation de navigateur et inspection

À comparer :
- Playwright ;
- Puppeteer ;
- Selenium ;
- services hébergés de navigateur/automatisation ;
- outils d’inspection visuelle et de parcours utilisateur.

Critères :
- navigateur réel et rendu JavaScript ;
- captures plein écran et par élément ;
- vidéo, traces et snapshots ;
- DOM et accessibilité ;
- contrôle des interactions ;
- multi-viewport et responsive ;
- sessions/authentification ;
- stabilité et répétabilité ;
- consommation RAM/CPU ;
- parallélisme et limites ;
- facilité d’exposition via CLI/API/MCP ;
- coût et conditions d’utilisation.

### 8.2 Scraping et extraction

À comparer selon les pages ciblées :
- extraction HTML/DOM avec bibliothèques HTTP ;
- parsing HTML ;
- navigateur automatisé pour les pages dynamiques ;
- plateformes de scraping hébergées ;
- extraction spécialisée par API officielle lorsque disponible.

Ne pas choisir un outil « populaire » par défaut. Pour les sites statiques, une requête HTTP et un parseur peuvent être plus fiables et légers. Pour les interactions et le rendu client, un navigateur automatisé peut être nécessaire. Les API officielles sont à privilégier quand elles fournissent les données légitimement requises.

### 8.3 Indexation et recherche

À comparer :
- recherche par fichiers et tags ;
- recherche plein texte ;
- moteur de recherche dédié ;
- recherche sémantique/vectorielle ;
- approche hybride.

Évaluer la qualité de récupération sur un jeu de questions réel : bonne source retrouvée, source pertinente, fraîcheur, provenance et taux de faux positifs.

### 8.4 Services d’IA et agents

Comparer les agents et modèles sur :
- prise en charge réelle de MCP ;
- qualité de raisonnement et de code ;
- contexte disponible ;
- contrôle des outils et confirmations ;
- coût, quotas et limites ;
- confidentialité et conservation des données ;
- fonctionnement local ou distant ;
- facilité d’intégration à une CLI/API ;
- capacité à exploiter des sorties structurées.

Ne pas confondre modèle de langage, application agentique, fournisseur de modèle, protocole MCP et service d’exécution : ce sont des couches différentes.

### 8.5 Design et web créatif

Inventorier :
- bibliothèques de composants ;
- bibliothèques d’animations ;
- systèmes 3D et shaders ;
- ressources de design et d’inspiration ;
- outils de génération procédurale ;
- outils de test visuel ;
- documentation et exemples de code.

Pour chaque ressource, enregistrer licence, attribution, compatibilité, version, coût, niveau de maintenance, qualité des exemples et possibilité de réutilisation commerciale.

## 9. Stratégie de capitalisation des réalisations

### 9.1 Cycle de vie

```text
Projet réalisé
   ↓
Collecte des artefacts
   ↓
Nettoyage des secrets et données sensibles
   ↓
Documentation des choix et limites
   ↓
Tests et vérification de la licence
   ↓
Revue humaine
   ↓
Publication dans la bibliothèque interne
   ↓
Indexation et versionnement
   ↓
Réutilisation dans de futurs projets
   ↓
Retour d’expérience et mise à jour
```

### 9.2 Ce qui doit être conservé

- composants génériques et réellement réutilisables ;
- exemples minimaux reproductibles ;
- scripts de build, test ou inspection ;
- captures représentatives et scénarios ;
- mesures avant/après ;
- explications des choix ;
- références externes avec provenance ;
- problèmes connus et conditions de validité.

### 9.3 Ce qui ne doit pas être conservé automatiquement

- secrets, clés API, cookies et tokens ;
- données personnelles sans nécessité ;
- code tiers sans droits de réutilisation ;
- code client confidentiel ;
- copies complètes de sites sans autorisation ;
- artefacts non vérifiés présentés comme solutions approuvées ;
- captures redondantes sans valeur documentaire.

### 9.4 Fiche standard d’une référence

```yaml
id: "unique-id"
title: "Nom de la ressource ou du pattern"
type: "component | pattern | tool | workflow | case-study | article"
domain: ["web", "motion", "3d"]
source_url: "URL originale si disponible"
source_type: "official-docs | repository | article | internal"
retrieved_at: "YYYY-MM-DD"
version: "version connue ou inconnue"
license: "licence vérifiée ou unknown"
status: "candidate | reviewed | approved | deprecated"
confidence: "high | medium | low"
use_cases: []
constraints: []
dependencies: []
examples: []
related_projects: []
review_notes: ""
```

Ce schéma est indicatif : le stockage réel pourra utiliser JSON, YAML ou une base de données.

## 10. MVP proposé

Le premier MVP doit prouver une boucle complète, sans essayer de construire tout l’écosystème.

### MVP-1 — Bibliothèque + recherche + premier outil agentique

Capacités :
1. Une bibliothèque locale de ressources en Markdown/JSON.
2. Métadonnées, provenance et statut de validation.
3. Recherche textuelle et filtres simples.
4. Une CLI avec des commandes `search`, `show`, `add` et `validate`.
5. Un serveur MCP local en lecture seule exposant la recherche et la lecture d’une fiche.
6. Des tests, des logs et un guide d’installation.
7. Un exemple d’utilisation par un agent compatible.

**Critère de réussite :** l’agent peut retrouver une référence pertinente et en restituer la provenance sans devoir relire manuellement tout le dépôt.

### MVP-2 — Inspection navigateur reproductible

Ajouter un workflow limité :
1. entrée d’une URL autorisée ;
2. liste de pages et viewport ;
3. capture et métadonnées ;
4. parcours d’interaction prédéfini ;
5. rapport des résultats et erreurs ;
6. sauvegarde des artefacts dans un dossier de projet ;
7. limite de pages, durée et concurrence.

**Critère de réussite :** une inspection identique peut être répétée et comparée, avec un taux d’échec connu.

### MVP-3 — Capitalisation de projet

Ajouter un générateur de dossier de clôture, une revue humaine et l’indexation des artefacts approuvés.

### MVP-4 — Analyse avancée

Comparer ensuite l’analyse visuelle, les rapports de motion, les différences entre captures, la recherche sémantique et les outils 3D spécialisés. Ces fonctionnalités ne doivent entrer dans le produit que si un cas d’usage concret et une mesure de qualité les justifient.

## 11. Indicateurs de réussite

| Indicateur | Ce qu’il mesure |
|---|---|
| Temps pour retrouver une référence | Réduction du travail de recherche répétitif |
| Taux de récupération pertinente | Qualité de la recherche documentaire |
| Taux de réussite d’un workflow | Fiabilité des outils |
| Reproductibilité | Capacité à retrouver un résultat comparable |
| Taux d’artefacts validés | Qualité du patrimoine accumulé |
| Réutilisation réelle | Nombre de projets qui réemploient les ressources |
| Temps d’intégration d’un nouvel outil | Facilité d’extension du système |
| Taux d’erreurs non récupérées | Robustesse |
| Coût par inspection réussie | Efficacité opérationnelle |
| Incidents de sécurité | Risque et qualité des contrôles |

Les valeurs cibles doivent être établies après mesure d’une baseline, pas inventées à l’avance.

## 12. Risques et réponses

- **Surarchitecture précoce** : commencer par une CLI et une bibliothèque locale avant de multiplier les services.
- **MCP partout** : ne l’utiliser que là où l’accès agentique apporte un bénéfice.
- **Accumulation de liens inutiles** : imposer provenance, tags, statut et critères de validation.
- **Dépendance à un fournisseur** : interfaces séparées et formats exportables.
- **Scraping trop agressif** : limites, autorisations, contrôle de débit et journalisation.
- **Fausse certitude de l’IA** : séparer observations, inférences et inconnues.
- **Archive qui se dégrade** : vérification des liens, versions, dépréciation et revue.
- **Coûts inattendus** : quotas, budgets par job, cache et limites de parallélisme.
- **Fuite de secrets** : nettoyage des artefacts et gestion dédiée des secrets.
- **Bibliothèque de composants incohérente** : gouvernance, tests, versions et règles de contribution.
- **Confusion entre inspiration et copie** : apprendre les mécanismes, respecter les licences et concevoir des réalisations originales.

## 13. Décisions à prendre après les recherches

Aucune décision ci-dessous ne doit être considérée comme définitive avant comparaison :

1. Local-first, cloud-first ou architecture hybride.
2. JavaScript/TypeScript seul ou ajout de Python pour certains traitements.
3. Playwright, Puppeteer, Selenium ou service hébergé pour le navigateur.
4. CLI seule au départ ou interface web dès le MVP.
5. Stockage de fichiers, SQLite ou PostgreSQL selon le besoin.
6. Recherche textuelle seule ou moteur hybride avec embeddings.
7. Nombre de serveurs MCP et séparation des capacités.
8. Traitement des vidéos : capture native, traces ou extraction de frames.
9. Niveau d’automatisation de l’archivage et de validation humaine.
10. Priorité entre web créatif, design, 3D, motion, recherche et capacités générales.

## 14. Références et limites du document

Ce blueprint s’appuie sur :
- la description orale fournie de l’outil de référence ;
- les principes des documents de travail existants **DIGITAL EXPERIENCE DESIGN SYSTEM**, **DIGITAL EXPERIENCE UX & QUALITY SYSTEM** et **DIGITAL EXPERIENCE 3D & MOTION ENGINEERING SYSTEM** ;
- des principes généraux d’ingénierie logicielle présentés ici comme cadre de conception, à vérifier et compléter par une recherche documentaire actualisée.

Ce document ne prétend pas avoir vérifié les fonctionnalités actuelles, les tarifs, les quotas ou les licences des produits tiers. Le prompt de recherche associé demande de vérifier ces éléments avec des sources officielles et de distinguer les faits, les hypothèses et les recommandations.

## 15. Prochaine étape

Utiliser le fichier `Prompt_Recherche_Systeme_Ingenierie_IA.md` avec l’outil spécialisé de recherche/scraping. Il doit construire un programme de recherche en phases indépendantes, produire des livrables traçables et attendre la validation avant de passer à l’implémentation.
