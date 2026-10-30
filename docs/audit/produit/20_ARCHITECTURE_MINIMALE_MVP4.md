# 20 — Architecture minimale proposée pour MVP-4

**Date :** 29 octobre 2026 · **Révision étudiée :** `c0610ae9825808bf88a309513bbdc00e2bc7e367` · **Statut : architecture et cinq décisions de §14 validées par le propriétaire ; non implémentée.** Le propriétaire a autorisé la rédaction de la spécification et des critères mesurables, pas une modification fonctionnelle, l'exécution du scénario ou une PR. L'hôte, le modèle, l'isolement effectif, la rétention et le budget restent à valider opérationnellement.

> **Orientation d'architecture validée, cible non implémentée.** Pour le cas validé, conserver EKTS local, ses ressources SQLite/FTS et son serveur MCP en stdio ; laisser l'agent et la connexion des serveurs à un hôte compatible. Ajouter seulement les garanties nécessaires à un corpus gouverné, à un accès de lecture effectivement limité et à une preuve vérifiable. Utiliser un journal local du dispositif d'évaluation, sans service de télémétrie. Ne pas ajouter de client MCP sortant dans EKTS, de backend distant, d'orchestrateur multi-agent ou de fournisseur d'embeddings obligatoire.

Cette recommandation est un **cible de conception**, non la description de ce qui fonctionne déjà. Le pilote pourra parfois être tenté avec des contrôles externes existants ; un MVP utilisable exige de rendre les garanties reproductibles et de traiter les défauts de fiabilité retenus. Les critères détaillés et l'arbitrage de la roadmap viennent aux étapes suivantes.

## 1. Périmètre, objectif et frontières

### 1.1 Résultat visé

Pour une demande donnée et un corpus autorisé, un utilisateur doit pouvoir :

1. préparer ou désigner des ressources dont la provenance est compréhensible ;
2. permettre à un agent de rechercher et lire ces ressources sans lui ouvrir automatiquement les actions de modification ;
3. obtenir une réponse qui distingue faits sourcés, hypothèses et absences d'information ;
4. reconstituer, dans la limite des traces disponibles, quels résultats et contenus ont été effectivement transmis à l'agent ;
5. comparer le résultat à ceux du même agent sans corpus et avec accès direct aux mêmes documents, selon [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md).

**Non-objectifs immédiats :** marketplace, installation globale de skills, exécution autonome de code issu des ressources, multi-agent, collaboration distante, authentification SaaS, base distante imposée, nouvelles intégrations web ou modèle génératif intégré à EKTS. Un fichier `SKILL.md` peut être une ressource textuelle ; le lire ne confère pas le droit d'exécuter ses scripts.

### 1.2 Deux paliers, deux affirmations différentes

| Palier | But | Ce qu'il faut | Ce qu'il ne démontre pas |
|---|---|---|---|
| **Palier 1 — pilote expérimental** | Déterminer si les conditions A/C/B du scénario peuvent fonctionner et être comparées. | Base de test, corpus figé, hôte réellement compatible, restrictions effectivement vérifiées, traces suffisantes et autorisations du propriétaire. Les contrôles peuvent être externes s'ils sont fiables et testés. | Ni produit MVP-4 terminé, ni gain de valeur généralisable. Le pilote peut être **bloqué** sans qu'un développement soit lancé. |
| **Palier 2 — cible MVP-4 minimale** | Rendre le parcours fiable, explicable et réutilisable sans dépendre d'une manipulation manuelle fragile. | Garanties reproductibles de profil de lecture, provenance minimale, preuve, erreurs explicites et contrôles de fiabilité convenus ; régression web prioritaire selon périmètre §9. | Ni sécurité absolue, ni adoption automatique d'un hôte ou d'un outil tiers. |

Les paliers 1/2 font partie de l'orientation validée, pas d'une autorisation de coder. L'étude comparative reste réalisable seulement si ses conditions sont respectées ; elle ne devient pas sûre parce que son corpus est fictif.

## 2. Capacités EKTS existantes et écarts

| Élément | Fait vérifié sur la révision étudiée | Limite pertinente pour l'architecture |
|---|---|---|
| Ressources | [`CreateResourceSchema`](../../../src/shared/validators.ts) accepte cinq types, dont `other`, texte optionnel, tags et métadonnées libres ; un UUID est créé par le [repository](../../../src/data/repositories/resource-repository.ts). | Provenance, droits, empreinte et version ne sont pas obligatoires ; aucune distinction de type `skill` n'est nécessaire pour le pilote. Une mise à jour remplace le contenu courant, sans historique immuable démontré. |
| Ajout/lecture | [`add`](../../../src/cli/commands/add.ts) accepte titre, contenu, type et tags ; [`get`](../../../src/cli/commands/get.ts) et les outils MCP lisent une ressource. CLI → FTS → MCP testé sur une ressource synthétique en phase 1. | CLI `add` ne présente pas d'option de métadonnées arbitraires dans le code examiné ; l'import des six ressources et l'équivalence de leurs contenus ne sont pas testés. |
| Recherche | SQLite FTS5/BM25 ; la [requête FTS](../../../src/data/fts-repository.ts) normalise les termes et les lie par `AND` ; les résultats incluent l'objet ressource. | Une phrase longue peut manquer un résultat ; zéro résultat n'établit pas l'inexistence d'une connaissance. Pertinence sur le corpus choisi et plusieurs tâches non mesurée. |
| Modes | [`search_knowledge`](../../../src/mcp/schemas/tool-schemas.ts) a `hybrid` par défaut et accepte `fts` ; essai phase 1 : FTS OK, hybride sans embeddings → erreur `EMBEDDINGS_FAILED`. | Aucun repli FTS automatique n'est démontré ni à supposer. Le repli proposé doit être explicite. |
| Serveur MCP | Serveur stdio existant, 17 outils observés en phase 1, recherche et lecture incluses. | Aucun hôte agent réel raccordé pendant cet audit. Certains outils écrivent ; `get_recommendations` est annoté lecture seule malgré des écritures. Aucune allowlist serveur effectivement démontrée. |
| Périmètre projet | Données et moteur prennent en charge des projets dans certains parcours. | Les schémas MCP de recherche et liste examinés ne disposent pas d'un `project_id`. Le champ de projet ou un tag n'est pas une frontière de sécurité pour ces outils. |
| Traces | [`run`](../../../src/mcp/handlers/tools.ts) émet au niveau `debug` le nom et la durée d'un outil réussi ; erreurs au journal, sur `stderr`. | Pas de preuve par ce seul journal des paramètres, des ressources retournées ou des citations. Des messages d'erreur peuvent contenir une requête : ne pas le supposer exempt de données sensibles. |
| Runtime / stockage | Node ≥ 22.19 dans [`package.json`](../../../package.json) ; trois fichiers SQLite, FTS et vecteurs attachés, mode WAL dans [`database.ts`](../../../src/data/database.ts). | FTS sans embeddings ne veut pas dire que la dépendance `sqlite-vec` ou le fichier vecteur disparaissent : l'ouverture actuelle les charge/attache par défaut. Démarrage et dépendances Windows non testés ici. |
| Initialisation MCP | [`context.ts`](../../../src/mcp/context.ts) ouvre les services et construit `TemplateService` ; ce [service](../../../src/templates/template-service.ts) peut ensemencer des templates et règles. | Une interface de lecture ne signifie pas que le **processus entier** n'écrit jamais au démarrage. Migrations, WAL et initialisation doivent être vérifiés sur une base isolée. |
| Fiabilité web | Phase 1 : priorités du résumé et du détail divergentes ; pertes de preuves brutes et confusion INP/FID dans le chemin examiné. | Le scénario synthétique n'a pas besoin d'inspecter un site, mais ces écarts restent des priorités produit : ils ne disparaissent pas de la cible MVP-4 sous prétexte que le pilote les contourne. |

Les observations de phase 1 sont détaillées dans [15](15_PHASE1_MATRICE_ET_VALIDATION.md) et [16](16_RESSOURCES_ET_ACCES_AGENTIQUE.md). L'ancien `AGENTS.md` parle de quatre outils en lecture seule et [`docs/MCP.md`](../../MCP.md) mentionne onze outils : ces descriptions sont périmées pour le serveur observé, même si leurs règles de gouvernance restent applicables. Les tests passés n'établissent pas la compatibilité d'un hôte particulier.

## 3. Schéma logique proposé

```text
                    UTILISATEUR / OPÉRATEUR
          choisit corpus + droits + conditions + validations
                           │
                préparation AVANT la session
         fichiers autorisés ──> CLI EKTS ──> base de test locale
                                │             (3 fichiers SQLite
                         manifeste de            et annexes WAL)
                         provenance / hashes
                           │
       ┌───────────────────┴───────────────────────────────┐
       │          sessions indépendantes du même agent     │
       │                                                   │
       │  A : aucun corpus                                 │
       │  C : fichiers identiques, accès local contrôlé     │
       │  B : serveur MCP EKTS local, outils autorisés     │
       └───────────────────┬───────────────────────────────┘
                           │
                HÔTE AGENTIQUE CONTRÔLÉ
      modèle + permissions + espaces de travail + traces d'appels
                           │ stdio MCP, uniquement condition B
                           ▼
                    SERVEUR MCP EKTS
           profil lecture proposé / vérification à l'entrée
                           │
       services existants de recherche FTS et de lecture
                           │
                 ressources locales autorisées

  OUTILS EXTERNES : absents du scénario de base ; ajout indépendant,
  soumis à un besoin, une permission et une condition de comparaison distincte.

  PREUVES : manifeste + traces locales autorisées + réponse + évaluation
             (hors de l'espace accessible à l'agent et sans publication).
```

Ce diagramme décrit des **responsabilités**, pas une multiplication de processus obligatoires : l'agent et son hôte peuvent être un seul produit ; le manifeste et les traces peuvent être des fichiers locaux. Aucun serveur de preuves séparé n'est nécessaire. Pour C, la méthode de recherche et de lecture du même corpus est documentée ; l'agent n'a pas accès aux corrigés ou à la copie B. Pour A, aucun accès à ces fichiers ni à la base de test.

### 3.1 Rôles et responsabilité de chaque composant

| Acteur/composant | Fait / responsabilité proposée | Ne doit pas être présumé |
|---|---|---|
| **Utilisateur / opérateur** | Approuve la tâche, le corpus, les droits, les coûts, les accès et la rétention ; prépare la base isolée ; peut arrêter et vérifier. | Un accord sur l'architecture n'autorise ni une exécution distante, ni une correction fonctionnelle. |
| **Agent / modèle** | Analyse la demande, choisit des recherches et consulte des résultats accessibles, produit la réponse et ses citations, signale les incertitudes. | Un modèle ne prouve pas à lui seul que sa réponse est vraie, qu'il a effectivement utilisé une ressource ou qu'il respecte les permissions. |
| **Hôte agentique** | Fournit le modèle, les outils locaux, la connexion MCP et, si disponible, des restrictions et une capture d'événements. | La documentation d'un hôte ne prouve pas que sa configuration effective isole fichiers, réseau et outils ; il faut des essais indépendants. |
| **EKTS** | Persiste et retrouve les connaissances, expose les outils et erreurs ; cible proposée : appliquer le profil et exposer une provenance contrôlable. | EKTS n'est pas supposé exécuter un agent, appeler d'autres MCP, héberger le modèle ni authentifier plusieurs utilisateurs. |
| **Outil externe** | Facultatif, connecté par l'hôte uniquement si un scénario l'exige et si autorisé. | REA, Playwright MCP, services web et skills externes ne sont pas équivalents et ne sont pas des dépendances du socle. |
| **Dispositif de preuve / évaluateur** | Capture les appels et réponses visibles, rapproche citations et sources, conserve les résultats d'évaluation. | Une trace n'est pas une explication du raisonnement interne du modèle ni une preuve automatique de causalité. |

## 4. Parcours de bout en bout et contrats logiques

Ces étapes sont des **contrats cibles**, non de nouvelles API déjà présentes. Le protocole détaillé A/B/C, les consignes exactes et les cas T01–T06 restent ceux de [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md).

### 4.1 Préparation distincte de l'exécution agentique

1. L'opérateur choisit une version figée des six ressources synthétiques R01–R06 et, selon le cas, V01 ou V02. Il vérifie le [manifeste et les empreintes](scenario-comparatif/manifeste-corpus.json).
2. Il prépare la base B dans un répertoire dédié, vide et isolé ; importe les contenus avec des outils autorisés ; consigne `ID de corpus ↔ UUID EKTS ↔ SHA-256` et contrôle le texte relu. Les éventuelles écritures de préparation ne sont pas des autorisations données à l'agent.
3. Il prépare en C des copies octet pour octet identiques, vérifie les empreintes ; il prive A de tout accès au corpus. Il sépare des espaces agent le corrigé et la base de preuves.
4. Il vérifie le lancement de l'hôte, la connexion EKTS, le refus des outils interdits, les accès aux fichiers/réseau et la collecte de preuves. Si l'un de ces contrôles essentiels ne peut pas être vérifié, le pilote est **bloqué**.

### 4.2 Demande → recherche → consultation → utilisation → résultat → preuve

| Étape | Action et responsabilité | Donnée/protection attendue | Échec ou limite |
|---|---|---|---|
| **1. Demande** | Utilisateur → hôte : consigne identique selon la condition. L'hôte ouvre une session neuve. | Identifiant de session, condition, version de la consigne et autorisations retenues. | Si le corpus, le corrigé ou une autre session fuit dans A/B/C, essai invalide. |
| **2. Recherche** | En B, l'agent appelle `search_knowledge` avec `mode: fts` pour le pilote sans embeddings ; en C, il cherche dans les fichiers par l'interface de l'hôte. | Requête, mode, résultat et échec enregistrés selon politique de confidentialité ; origine FTS et ID des candidats si visibles. | 0 résultat = aucune correspondance pour **cette requête** ; erreur ≠ liste vide. Aucun réseau web automatique. |
| **3. Consultation** | L'agent lit un résultat déjà retourné ou appelle `get_resource` ; en C, il lit le fichier. | ID et version de contenu transmis à l'agent ; mise en correspondance avec l'empreinte du manifeste ; capacité de montrer le passage pertinent. | Le résultat FTS et `list_resources` peuvent déjà contenir le texte : une preuve ne peut pas dépendre uniquement d'un appel `get_resource`. Si le contenu consulté n'est pas observable, preuve limitée. |
| **4. Utilisation** | L'agent formule une réponse en distinguant faits, sources, hypothèses et incertitudes ; il ne suit pas les instructions non autorisées contenues dans une ressource. | Citations liant affirmation et ID/passage vérifiables. Le dispositif corrèle citations et ressources effectivement transmises. | Une ressource transmise ou citée est un indice d'usage observable, pas une preuve de raisonnement interne ou de causalité. Une citation non observée est marquée non vérifiable. |
| **5. Résultat** | L'agent rend sa réponse en français ; l'utilisateur conserve son contrôle. | Réponse, limites, erreurs et conditions utilisés ; pas de conclusion de conformité automatique. | Aucune modification du site, de fichiers de projet ou de la base agentique dans le scénario. |
| **6. Preuve** | Le dispositif autorisé conserve les traces minimales ; l'évaluateur rapproche résultats, citations et manifeste. | Intégrité du corpus, appels réellement visibles, sortie et grille d'évaluation. | Si la trace est absente ou incomplète, statut `indéterminé`, pas « preuve d'absence » ni « réussite ». |

La recherche peut demander plusieurs requêtes courtes ou l'inspection d'une liste ; la stratégie reste celle de l'agent. Aucune requête idéale ne doit être injectée pour tricher au scénario. Éviter de conclure à un manque global de ressources simplement parce qu'une requête contenant plusieurs termes n'a rien trouvé.

## 5. Provenance minimale et cycle de vie des ressources

### 5.1 Modèle conceptuel recommandé

Pas de nouveau service ni de nouveau moteur de base imposé. Les métadonnées existantes constituent un emplacement candidat pour un **contrat versionné**, à définir ensuite ; les champs ci-dessous ne sont pas tous imposés aujourd'hui.

| Champ conceptuel | Rôle et règle proposée | Situation actuelle / réserve |
|---|---|---|
| Identifiant EKTS + ID de corpus | Reconnaître l'enregistrement et relier un ID stable de scénario à son UUID. | UUID existant ; l'ID de corpus et son mapping sont gérés par manifeste pour le pilote. |
| Titre, type et contenu | Permettre recherche et lecture ; séparer texte instructif et capacité exécutable. | Champs existants ; `other` suffit pour les documents du pilote. |
| Origine / localisateur | Référence source : dépôt et chemin, fichier local sous contrôle ou document propriétaire, selon le cas. | `url` est optionnelle et n'accepte que HTTP(S) en création ; ne pas inventer de `file://` compatible. Chemins sensibles : protéger ou omettre. |
| Version source | Commit, version documentaire ou date connue ; sinon `inconnue`. | Métadonnées libres possibles, non normalisées ni garanties par la CLI actuelle. |
| Empreinte de contenu | SHA-256 des octets de référence ; préciser encodage et normalisation avant comparaison. | Manifeste du corpus existant ; pas de calcul/contrôle automatique démontré dans EKTS. Une empreinte prouve l'identité des octets comparés, ni authenticité ni droit d'utilisation. |
| Date de collecte / révision | Connaître l'ancienneté et l'origine de la version ; distinguer date source et date d'import. | `createdAt`/`updatedAt` existent pour l'enregistrement et ne remplacent pas les dates de la source. |
| Droits / licence | Identifiant ou texte de référence, portée, statut d'examen et décision humaine. | Inconnu par défaut ; droit de consulter ≠ droit de redistribuer ou d'exécuter. Pas d'avis juridique automatique. |
| Sensibilité et destination | Classifier au minimum `synthétique`, `interne` ou `sensible à examiner`, puis spécifier si un service externe peut recevoir le contenu. | Proposition de gouvernance ; ces étiquettes ne constituent pas un contrôle d'accès effectif. |
| État de revue | `à examiner`, `autorisé pour le scénario`, `refusé` ou `inconnu`, avec décision et date. | Proposition ; ne pas inférer la sûreté de l'auteur, d'une licence ou d'un registre. |

**Politique de compatibilité proposée :** pour le corpus gouverné du MVP-4, les champs nécessaires ci-dessus doivent être renseignés ou explicitement déclarés inconnus avant utilisation, et les droits d'utilisation doivent être approuvés. Les anciennes ressources ne doivent être ni supprimées ni inventées ; elles restent lisibles par les parcours existants selon les permissions déjà en place et sont affichées comme provenance inconnue jusqu'à revue. Le profil gouverné ne les sélectionne pas automatiquement si les informations ou droits requis manquent. L'implémentation exacte et la compatibilité des autres parcours seront précisées dans la spécification.

### 5.2 Version, conservation et traçabilité

L'actuel `update` peut remplacer le contenu d'un même UUID. En conséquence, **UUID seul ne suffit pas** pour vérifier une citation historique. La référence d'un essai doit associer au minimum : UUID ou ID de fichier, SHA-256 du contenu effectivement reçu, source et date de capture, et correspondance vers l'extrait.

Pour le pilote, une copie figée hors de l'accès de l'agent et le manifeste suffisent si les droits de conservation le permettent. Pour un MVP réutilisable, proposer soit un snapshot local autorisé par version, soit une référence externe figée effectivement conservée et accessible : choisir selon confidentialité, coût et droits. Un hash sans conservation ni accès au contenu ne permet pas de reconstituer une preuve ; inversement, il ne faut pas recopier un contenu sans droit.

Une empreinte n'est pas automatiquement anonyme ; sur un contenu prévisible elle peut faciliter une devinette. Les extraits et localisateurs peuvent révéler des données : mêmes règles de protection que le contenu. Politique de suppression, rétention, sauvegardes et copies d'index doivent être arbitrées ; il n'y a pas de conservation infinie ni de journal prétendument « immuable » imposé ici.

## 6. Permissions et modèle de menace

### 6.1 Hypothèses et limites

**Hypothèse MVP :** poste local à utilisateur unique, hôte choisi par l'utilisateur, corpus local dédié ; l'utilisateur et l'opérateur sont autorisés, les documents consultés et sorties d'outils sont potentiellement hostiles. L'hôte, le processus EKTS, le runtime, les dépendances et le système d'exploitation doivent être configurés et vérifiés ; s'ils sont compromis, l'architecture ne prétend pas protéger les données. Un autre processus ayant les mêmes droits OS peut accéder directement aux fichiers selon les ACL : un filtre d'outils MCP ne remplace pas une isolation système.

**Menaces à couvrir pour le pilote :** exécution d'une instruction embarquée dans une ressource ; appel d'un outil de mutation ; lecture de corrigés ou d'une autre base ; fuite d'un secret ou d'un contenu au fournisseur ; confusion entre données absentes et panne ; altération du corpus ; traces insuffisantes. Risques multi-utilisateur, hébergement public et menaces réseau avancées restent hors socle mais ne sont pas déclarés résolus.

### 6.2 Profil « connaissance en lecture » proposé

**Cible produit validée :** un profil explicitement activé pour la session, qui expose exactement `search_knowledge`, `get_resource` et `list_resources` ; tout autre outil est refusé dans ce profil. L'ancienne suggestion d'inclure éventuellement un outil de validation n'est pas retenue dans ce périmètre. Le contrôle doit s'appliquer à l'enregistrement/découverte **et** à la réception/dispatch : un appel direct à un outil non autorisé doit être refusé, même si l'hôte ne l'affiche pas. Paramètres invalides, profil inconnu ou politique illisible : démarrage refusé ou accès refusé ; pas de retour silencieux au profil complet.

Cette cible ne prétend pas qu'un tel profil existe déjà. La [spécification validée](21_SPECIFICATION_MVP4.md) précise aussi le contrôle des paramètres : dans ce profil, `search_knowledge` doit n'accepter que `fts` explicitement demandé, car le défaut actuel `hybrid` peut solliciter des embeddings. Cette précision et les seuils correspondants sont validés pour la planification, non mesurés. L'option choisie devra préserver les usages historiques sans exposer par inadvertance plus d'outils dans le scénario ; les profils complets existants et leurs migrations/documentations restent à arbitrer. Une autorisation pour un outil ne vaut pas autorisation pour un accès réseau, un fichier ou un autre processus. Les détails de configuration et les noms d'options seront définis et testés ultérieurement, pas inventés ici.

**Solution de pilote sans modification fonctionnelle :** si l'hôte ou un confinement indépendant applique effectivement la même allowlist, contrôle l'espace de fichiers et permet de prouver les refus, le pilote peut utiliser ce contrôle externe après accord. Si le contrôle est seulement déclaré, reposant sur le prompt ou non vérifiable, le pilote B reste bloqué. Ajouter un proxy n'est pas obligatoire ; un proxy supplémentaire serait une surface et une dépendance à justifier.

| Action / capacité | Pilote proposé | Barrière à vérifier |
|---|---|---|
| Rechercher / lire le seul corpus autorisé | Autorisé | Allowlist effective + base isolée + accès hôte/processus aux seuls fichiers nécessaires. |
| Ajouter/modifier/supprimer connaissances et projets | Agent : refusé ; préparation par opérateur uniquement | Refus d'appel et contrôle fichier/base ; pas de confiance dans les annotations. |
| `get_recommendations`, `inspect_site`, `apply_template` et autres outils non retenus | Refusé | Le premier peut écrire malgré `readOnlyHint`; inspection a réseau et persistance ; vérifier refus explicite. |
| Shell, scripts de skills, nouvelles installations et sous-agents | Refusés pour le scénario de base | Contrôle de l'hôte et de l'OS ; ne pas traiter le texte d'une ressource comme une autorisation. |
| Internet et fournisseur de modèle | Aucun web pendant les tâches ; fournisseur uniquement sur accord explicite et selon données autorisées | Politique réseau de l'hôte **et** du fournisseur ; `EKTS_OFFLINE` ne contrôle pas tous les processus. |
| Traces et snapshots | Écriture uniquement par le dispositif de preuve approuvé dans un dossier privé distinct | Portée, durée, accès et export contrôlés ; ne pas transmettre automatiquement au modèle. |

**Écritures techniques ≠ actions de l'agent.** Le démarrage actuel peut préparer schémas, templates et fichiers WAL : une base système entièrement montée en lecture seule pourrait donc empêcher le serveur de fonctionner. Ne pas masquer ce fait en l'appelant « zéro écriture ». Utiliser une base isolée avec écritures techniques bornées, documenter et vérifier l'état avant/après, et distinguer création de données de test par l'opérateur d'une mutation métier demandée par l'agent. Si l'exigence est une base physiquement immuable, cela appelle une autre conception et des essais, non démontrés ici.

## 7. Preuve, traçabilité et limites d'observation

### 7.1 Source des événements

Le logger MCP existant fournit un diagnostic d'outil et de durée au niveau debug, mais pas le chaînage complet des résultats et citations. Deux possibilités sont à évaluer :

1. **Capture côté hôte/dispositif de test** : privilégiée si elle capture fidèlement appels, résultats, refus et accès C, sans nouveau composant ; vérifier sa fidélité et sa confidentialité.
2. **Instrumentation EKTS limitée** : envisagée si la première ne suffit pas ; ne journaliser que les métadonnées nécessaires, avec consentement, et préserver le canal `stdout` JSON-RPC. Sa conception et son activation ne sont pas encore implémentées.

Ne pas enregistrer de chaîne de pensée privée ; le but est de conserver les appels, données transmises de façon autorisée, citations et résultats observables. Une capture peut être partielle si l'hôte ne l'expose pas : déclarer le degré d'observabilité plutôt que fabriquer des événements.

### 7.2 Enregistrement minimal conceptuel

| Moment | Champs minimaux proposés | Traitement |
|---|---|---|
| Début | ID aléatoire de session, cas/condition, date, version d'EKTS et de l'hôte/modèle, identité du corpus et de la politique, version du protocole. | Local, pas de secret ; version ou valeur absente explicitement marquée inconnue. |
| Appel / résultat | ID de session et d'événement ; outil et mode ; statut succès, refus, vide ou erreur ; durée ; IDs et empreintes des ressources effectivement transmises si observables. | Ne conserver la requête ou un extrait qu'avec politique adaptée ; un hash de requête peut lui aussi être sensible. Distinguer `résultat retourné` et `lecture explicite`. |
| Réponse | Référence à la sortie conservée, citations émises, correspondance avec événements/versions disponibles. | Une citation affichée sans source transmise/consultée est non corroborée ; une source transmise mais non citée ne prouve pas son usage final. |
| Évaluation | Version de grille, notes, justification, évaluateur, cas non évaluables et éventuels incidents. | Séparé de l'espace agent. Conserver les sorties brutes uniquement si autorisées et utiles. |

**Bornes de preuve :** 1) l'appel a eu lieu ; 2) la ressource a été transmise au modèle ou à l'hôte selon visibilité ; 3) la réponse cite un passage cohérent ; 4) un évaluateur valide le support. Aucune de ces étapes, prise isolément, ne prouve que la ressource a causé l'idée ni que tout le contenu est vrai. Une comparaison contrôlée constitue un indice supplémentaire, limité par son protocole.

## 8. Interopérabilité : options et décision proposée

| Option | Avantages pour le scénario | Limites / décision |
|---|---|---|
| **Hôte → MCP EKTS en stdio** | Réutilise le serveur local et les outils observés ; pas de client MCP supplémentaire dans EKTS. Même hôte peut en principe se connecter à plusieurs serveurs. | **Voie B recommandée**, à condition de tester effectivement hôte, versions, allowlist et transport. Un serveur supplémentaire n'est pas ajouté au pilote de base. |
| **Hôte → fichiers locaux** | Pas d'EKTS requis ; lecture directe et contrôle des mêmes octets. | Condition C de contrôle, pas remplacement décidé du produit. Recherche de l'hôte et permissions à décrire. |
| **Agent → CLI EKTS** | Interface déjà présente, utile à la préparation opérateur et comme alternative d'interopérabilité. | Un shell général augmente la surface d'action ; sorties, codes, chemins, encodage et restrictions à tester. Pas la voie B de référence tant que MCP est disponible. |
| **Bibliothèque/SDK local** | Peut réduire la surcharge de transport pour un logiciel contrôlé. | Couplage et contrat public à justifier ; pas nécessaire au scénario. |
| **API/serveur distant** | Peut servir à une future collaboration ou machine séparée. | Exige authentification, chiffrement, isolation et consentement supplémentaires ; **hors minimum**. |
| **Client MCP sortant dans EKTS** | Intégration native possible si une future tâche démontre qu'EKTS doit orchestrer lui-même un outil. | Complexité, identités, permissions, sécurité et maintenance supplémentaires ; **non requis** pour que l'hôte appelle EKTS et un autre serveur. |
| **Service externe / skill** | Capacité supplémentaire ciblée, si besoin prouvé. | Licence, coût, confidentialité, scripts et effets à vérifier ; condition expérimentale distincte et autorisation explicite. |

La documentation [OpenCode permissions](https://opencode.ai/docs/permissions/) décrit `allow/ask/deny`, des valeurs par défaut souvent permissives et l'effet de `--auto`. Elle ne démontre pas une sandbox OS ni l'allowlist effective du scénario. Le choix final de l'hôte et les tests de refus restent ouverts. Les [annotations MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) sont déclaratives et doivent être traitées avec prudence ; la version de spécification citée est celle de l'essai, tandis qu'une édition plus récente existe.

## 9. Fiabilité et comportements d'échec

Les états ci-dessous sont des **contrats fonctionnels proposés**, pas des codes ou champs déjà implémentés. Conserver les erreurs réelles existantes et leur contexte ; les noms internes et la compatibilité API seront définis dans l'étape suivante.

| Situation | Comportement attendu | Donnée / action interdite |
|---|---|---|
| Aucun résultat FTS | Indiquer qu'aucune correspondance n'a été trouvée pour la requête et le mode ; permettre une reformulation ou un parcours autorisé. | Affirmer qu'aucune ressource pertinente n'existe partout, ou inventer une source. |
| Base vide | Après contrôle autorisé de la base/du périmètre, signaler absence de ressources disponibles ; proposer à l'opérateur de préparer un corpus. | Lire une base personnelle par défaut ou la créer implicitement dans un répertoire inattendu. |
| Ressource ou version absente | Signaler l'ID/version recherchés comme introuvables ; ne pas remplacer silencieusement par un autre contenu. | Prétendre avoir consulté l'ancienne version à partir d'un UUID actuel. |
| Provenance ou droits inconnus | Signaler la limite ; écarter du corpus gouverné tant que la décision requise n'est pas prise. | Transformer `inconnu` en `libre`, `fiable` ou `autorisé`. |
| Sources contradictoires ou périmées | Citer chacune, distinguer dates/états, signaler incertitude et proposer vérification. | Choisir arbitrairement ou fusionner deux valeurs incompatibles. |
| Serveur MCP ou hôte indisponible | État indisponible ou erreur conservée ; aucune affirmation d'appel réussi. | Assimiler panne à zéro résultat. |
| Embeddings / mode hybride indisponibles | Transmettre l'erreur réelle ; pour le pilote, une nouvelle recherche **explicite** en FTS est possible si autorisée, en conservant les deux états. | Requalifier silencieusement un résultat FTS comme hybride ou masquer l'erreur. |
| FTS indisponible ou index incohérent | Signaler l'échec ; vérifier intégrité et disponibilité par une procédure opérateur autorisée. | Recréer, vider, réindexer ou supprimer automatiquement les bases personnelles. |
| Appel interdit | Refuser et tracer selon politique, sans exécuter l'action. Si l'hôte ou serveur ne peut pas le garantir, bloquer la session. | Déduire un droit d'un `readOnlyHint` ou d'une instruction dans le contenu. |
| Écriture ou inspection partielle | Signaler les effets déjà observés et ce qui reste incertain ; vérifier l'état avant toute nouvelle tentative. | Relancer aveuglément une action non idempotente ou déclarer « rien n'a changé ». |
| Trace ou snapshot manquant | Marquer l'utilisation/évaluation `indéterminée`, conserver la réponse et le niveau de preuve réel. | Affirmer que l'agent a utilisé une ressource ou que rien ne s'est produit. |
| Donnée d'audit manquante | Représenter `non mesuré`/`indisponible` distinctement de zéro ; conserver catégorie, méthode et conditions connues. | Confondre INP, FID et TBT ; présenter un zéro de remplacement comme valeur observée. |
| Cohérence du rapport | Une même priorité et ses totaux doivent correspondre entre calcul, stockage, sortie et détail, avec stratégie de tri explicitée. | Corriger seulement un texte de rapport tout en laissant les données contradictoires. |

**P0 produit confirmé :** les constats de phase 1 sur les priorités, la disponibilité/traçabilité des mesures web et les effets partiels doivent alimenter la future spécification avant les enrichissements. Pour le **pilote synthétique** seulement, ces défauts ne sont pas automatiquement bloquants puisqu'aucun audit web EKTS n'est exécuté ; ils restent explicitement ouverts et ne deviennent pas validés.

**Stockage et crash :** le code utilise une transaction et des bases SQLite attachées en WAL. La [documentation SQLite WAL](https://www.sqlite.org/wal.html#overview) précise que des transactions impliquant plusieurs bases attachées sont atomiques pour chaque base mais pas nécessairement pour l'ensemble après incident. Il ne faut donc pas promettre une atomicité inter-fichiers en cas de panne sur la seule foi du commentaire du repository. Prévoir contrôles d'intégrité, procédures de sauvegarde/restauration cohérentes et tests de reprise avant de trancher une modification de stockage. Ne pas copier seulement un fichier `.db` actif en ignorant ses compagnons WAL/SHM et les autres bases. Un disque réseau multi-machine n'est pas le socle recommandé pour WAL.

## 10. Windows, confidentialité et dépendances

### 10.1 Poste Windows / PowerShell

- L'environnement utilisateur documenté est Windows avec PowerShell ; le pilote peut aussi être conçu sur une autre plateforme, mais ne démontrera pas pour autant Windows. Tester **Windows natif**, et WSL seulement si retenu explicitement ; ils ont des chemins, comptes, processus et frontières réseau différents.
- Utiliser un runtime Node compatible et une installation verrouillée ; vérifier `node`, npm et les binaires natifs `better-sqlite3` / `sqlite-vec` dans l'environnement cible. Ne pas supposer que l'installation Linux de phase 1 prouve leur disponibilité Windows.
- Fixer des chemins absolus pour le serveur et `EKTS_DATA_DIR`, gérer espaces, accents et encodage ; éviter que le répertoire courant crée une base inattendue. Le point d'entrée MCP charge un `.env` depuis le répertoire courant ([code](../../../src/shared/env-file.ts)) : utiliser un environnement et un répertoire contrôlés, sans charger des secrets par accident.
- Le code [`secureDatabaseFiles`](../../../src/data/database.ts) ignore `chmod` sur Windows ; contrôler les **ACL Windows effectives** du dossier, bases, `-wal`/`-shm`, corpus et traces. Ne pas prétendre qu'un mode POSIX assure leur protection sur Windows.
- L'ouverture existante peut activer WAL et initialiser des tables/templates. Vérifier démarrage, arrêt, permissions, fichiers annexes, verrouillage, espace disque et reprise sans toucher la base personnelle.
- La documentation opérationnelle future devra employer PowerShell compatible avec le poste ; aucune nouvelle commande ou option n'est affirmée exister ici. `npm ci` peut nécessiter accès réseau et installation de dépendances ; l'autorisation d'utiliser FTS hors ligne ne signifie pas installation hors ligne déjà possible.

### 10.2 Confidentialité

Corpus synthétique en premier ; pas de vrai jeton dans l'environnement du processus de test. Pour un modèle hébergé, l'agent peut envoyer au fournisseur la consigne et le contenu consulté : il faut un accord explicite sur ce transfert, le fournisseur, ses conditions, la localisation, le budget et les données ; le serveur EKTS en local ne rend pas tout le système local. Pour la seconde étude de [19 §2.3](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), les rapports réels et leur URL sont à relire et approuver avant import ou transmission. Extraits, index FTS, snapshots, traces, backups et fichiers temporaires sont eux aussi des copies potentiellement sensibles.

Préférer un stockage local à accès restreint, une minimisation des traces et une durée de conservation convenue ; chiffrement, purge et restauration seront spécifiés selon le contexte réel. Les métadonnées de sensibilité ne bloquent aucun transfert tant qu'un mécanisme ne les applique pas.

### 10.3 Budget de dépendances

| Élément | Décision proposée | Justification / limite |
|---|---|---|
| Node/TypeScript, SQLite, FTS5, `better-sqlite3`, SDK MCP | Réutiliser ceux déjà présents. | Vérifier les versions réellement installées, la licence et les plateformes ; aucune nouvelle dépendance ici. |
| `sqlite-vec` et fichier vecteur existants | Conserver la compatibilité du runtime existant pour le pilote. | Le mode FTS ne nécessite pas de fournisseur d'embeddings, mais l'ouverture actuelle charge l'extension par défaut ; ne pas prétendre l'avoir supprimée. |
| Fournisseur d'embeddings / réseau | Non requis pour le pilote FTS. | Les modes hybride/vectoriel gardent leurs erreurs et contrats ; pas de modification ni suppression de ces capacités. |
| Hôte agent / modèle | Un seul hôte et modèle, à choisir et figer. | Dépendance opérationnelle indispensable à l'essai, mais aucune marque/version n'a encore été validée ou testée. |
| Base distante, SaaS, conteneur, proxy ou moteur vectoriel supplémentaire | Aucun par défaut. | À introduire seulement avec un besoin, des droits et un résultat comparatif. Un conteneur peut être un moyen d'isolement, pas une garantie ni une obligation. |
| Observabilité externe | Aucun service distant imposé. | Journal local ou capture de l'hôte suffisants si leur fidélité et sécurité sont démontrées. |

La compatibilité, la taille d'installation et le coût restent à mesurer ; « pas de nouvelle dépendance » ne signifie pas « aucune dépendance ».

## 11. Alternatives de conception et arbitrages

| Choix | Option retenue pour proposition minimale | Alternative / condition de réexamen |
|---|---|---|
| Autorisation des outils | Profil de lecture réellement appliqué au serveur pour MVP ; contrôle externe vérifié possible pour le pilote. | Uniquement contrôle hôte : moins de code mais assurance dépendante de chaque hôte. Proxy indépendant : surface de maintenance supplémentaire. Aucune option ne remplace une isolation OS. |
| Stockage de provenance | Manifeste opérateur pour pilote ; contrat versionné dans les métadonnées existantes candidat pour MVP. | Nouvelles tables si historique/requêtes/droits le justifient ; ne pas migrer toutes les ressources sans plan de compatibilité. |
| Preuve | Capture locale par l'hôte/dispositif si complète, rapprochement humain possible ; instrumentation EKTS seulement si nécessaire. | Service central / télémétrie distante différés. Une absence de capture suffisante bloque une affirmation de valeur traçable. |
| Recherche | FTS explicite au départ ; modes existants conservés. | Réévaluer vectoriel/hybride ou autre moteur sur jeu annoté et besoins mesurés ; pas d'infrastructure additionnelle par défaut. |
| Documents/skills | Ressources textuelles sélectionnées, droits et provenance examinés. | Installateur, registre de skills et exécution de scripts reportés ; le catalogue de recherche n'est pas un corpus approuvé. |
| Partage | Une base isolée et locale pour le scénario. | Synchronisation, comptes et collaboration : non retenus pour ce minimum ; l'ancienne proposition dans `docs/ROADMAP.md` et ADR-044 devra être arbitrée, pas effacée silencieusement. |

Aucune décision ci-dessus n'est une modification de `docs/ROADMAP.md` : celle-ci reste la roadmap officielle jusqu'à sa révision explicite. Les arbitrages historiques et documents existants seront réconciliés à l'étape dédiée.

## 12. Ordre de réalisation proposé et points de contrôle

Ceci n'est **pas** un plan de sprints validé et ne lance aucun développement.

1. **Sécurité et fiabilité P0 à spécifier** : inventaire effectif des outils et effets ; profil borné et tests de refus ; fiabilité des priorités, données absentes et métriques web ; erreurs et effets partiels ; préciser quels correctifs sont prérequis au MVP général et lesquels seulement au parcours web réel.
2. **Corpus et provenance** : contrat minimal, compatibilité anciennes ressources, droits, méthode d'import local et vérification des empreintes ; pas d'installation automatique de skills.
3. **Interopérabilité et preuve** : essai du raccordement hôte/stdio, capture et corrélation des appels/ressources/citations, séparation des conditions A/B/C ; évaluer l'absence de capture et l'effet des permissions.
4. **Expérience Windows et confidentialité** : ACL, dépendances natives, chemins, environnement, WAL, autorisations réseau ; retours documentés et reprise sans suppression de données.
5. **Évaluation** : pilote du [scénario validé](19_SCENARIO_COMPARATIF_AGENT_EKTS.md) après accord d'exécution ; analyser séparément l'effet corpus (B−A) et l'effet de l'interface (B−C), sans promesse de résultat.
6. **Spécification, roadmap et sprints** : choisir les critères mesurables, les risques, les fichiers et les dépendances, réviser `docs/ROADMAP.md`, puis préparer dossiers et prompts ; validation humaine avant chaque passage pertinent.

Une analyse de dépendances plus fine peut conduire à préparer d'abord un pilote externe et à corriger le produit ensuite ; elle ne permet pas de décréter que les défauts web sont résolus. L'implémentation, les tests actifs et les éventuels échanges avec un fournisseur exigent leurs autorisations respectives.

## 13. Vérifications minimales à transformer en critères d'acceptation

La spécification future devra rendre ces propositions mesurables ; elles ne sont pas des tests déjà réussis :

- **Périmètre :** une session A ne peut accéder au corpus ; C et B accèdent aux mêmes octets ; corrigés et autres bases restent hors de portée.
- **Permission :** les outils autorisés répondent ; chaque outil non autorisé est refusé même en appel direct ; une configuration de profil inconnue échoue fermée ; aucune action réseau ou mutation non autorisée n'est exécutée. Tester aussi le démarrage et les écritures techniques.
- **Données :** les contenus importés et restitués correspondent à leurs empreintes ; provenance inconnue reste signalée ; une modification ultérieure n'usurpe pas une version antérieure.
- **Recherche :** distinguer résultat vide et panne ; mode FTS explicite ; erreur d'embeddings visible ; un changement de mode n'est jamais silencieux.
- **Preuve :** possibilité de rapprocher une affirmation citée, un événement visible et un contenu versionné ; signaler tout cas non observable. Les sources reçues via la recherche doivent être prises en compte même sans `get_resource`.
- **Web :** tests couvrant priorités, compteurs et sorties ; absence de métrique distincte de zéro ; INP/FID non confondus ; échecs partiels et reproduction documentés, dans le périmètre des décisions produit futures.
- **Windows :** exécution native ciblée, dépendances, ACL, chemins, encodage et reprise vérifiés ; ne pas extrapoler Linux à Windows.
- **Confidentialité :** aucun secret dans corpus/traces, destination des données approuvée, rétention et export contrôlés, aucun envoi réseau non autorisé.

La valeur finale dépendra de l'évaluation A/C/B : une connexion MCP et des tests techniques seuls ne constituent pas une démonstration d'amélioration.

## 14. Décisions confirmées par le propriétaire

Les cinq décisions ci-dessous ont d'abord été confirmées pour l'architecture. Les critères chiffrés ont ensuite été validés séparément dans [22](22_CRITERES_ET_TESTS_MVP4.md) ; aucune de ces validations n'autorise l'exécution.

1. Confirmer le principe **local + serveur MCP existant + FTS pour le pilote**, sans client MCP sortant ni backend distant imposé.
2. Confirmer que le profil de lecture contrôlé côté EKTS est une **cible produit**, tout en autorisant éventuellement un contrôle externe vérifié pour le pilote, sans implémentation immédiate.
3. Confirmer provenance minimale et preuve locale, avec maintien des ressources historiques à statut inconnu et sans exigence de stockage de copies non autorisées.
4. Confirmer que la fiabilité du module web reste prioritaire pour le MVP produit, même si le pilote synthétique ne l'exécute pas.
5. Reporter le choix de l'hôte/modèle, du niveau d'isolement effectif, de la rétention et du budget à leur validation opérationnelle ; aucune hypothèse Windows/WSL ou fournisseur n'est imposée.

**Suite initialement autorisée :** rédaction de la [spécification MVP-4](21_SPECIFICATION_MVP4.md) et de la [matrice de critères et de tests](22_CRITERES_ET_TESTS_MVP4.md). **Actualisation du 30/10/2026 :** ces documents, la [roadmap révisée](../../ROADMAP.md) et la décomposition des sprints 19–24 ont depuis été validés pour la planification. Ces validations ne constituent ni autorisation d'exécuter le scénario ni autorisation d'implémenter. Aucun push, PR, publication ou changement de visibilité.

## Sources

- EKTS : [scénario validé](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), [recherche open source](17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md), [phase 1](15_PHASE1_MATRICE_ET_VALIDATION.md), [accès agentique](16_RESSOURCES_ET_ACCES_AGENTIQUE.md), [roadmap officielle](../../ROADMAP.md) et [préparation historique MVP-4](../../MVP4_PREPARATION.md).
- Code : [serveur MCP](../../../src/mcp/server.ts), [enregistrement et dispatch](../../../src/mcp/handlers/tools.ts), [contexte](../../../src/mcp/context.ts), [schémas MCP](../../../src/mcp/schemas/tool-schemas.ts), [gestionnaire de ressources](../../../src/business/knowledge-manager.ts), [repository](../../../src/data/repositories/resource-repository.ts), [recherche](../../../src/business/search-engine.ts), [FTS](../../../src/data/fts-repository.ts), [bases](../../../src/data/database.ts), [templates](../../../src/templates/template-service.ts).
- Sources externes consultées le 29/10/2026 : [MCP tools, édition 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), [MCP sécurité, édition 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices), [permissions OpenCode](https://opencode.ai/docs/permissions/), [SQLite WAL](https://www.sqlite.org/wal.html#overview). Les documentations externes évoluent ; figer les versions effectives avant réalisation.
