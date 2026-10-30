# 21 — Spécification fonctionnelle et technique MVP-4

**Date :** 29 octobre 2026 · **Référence examinée :** `c0610ae9825808bf88a309513bbdc00e2bc7e367` · **Statut : spécification et seuils validés par le propriétaire ; non implémentés.** Les conclusions de phase 1, la recherche, le scénario comparatif et les cinq décisions de l'[architecture](20_ARCHITECTURE_MINIMALE_MVP4.md) ont également été validés. La révision de la roadmap est autorisée ; aucune exécution du scénario, modification fonctionnelle, PR ou publication ne l'est implicitement.

Les **exigences** ci-dessous décrivent des comportements cibles, non des fonctionnalités déjà livrées. Les [critères, méthodes et seuils de vérification](22_CRITERES_ET_TESTS_MVP4.md) ont été validés pour la planification ; aucun seuil n'est un résultat obtenu. Les choix opérationnels de machine, hôte, modèle, fournisseur, budget et rétention restent à approuver avant exécution.

## 1. Finalité, périmètre et décision de produit

### 1.1 Finalité

Permettre à une personne de préparer des connaissances autorisées, de les rendre découvrables par un agent à travers EKTS et d'obtenir une réponse accompagnée de preuves vérifiables, tout en rendant le module d'audit web plus fiable et en conservant le contrôle des permissions.

Parcours cible : **demande → recherche → consultation → utilisation → résultat → preuve**, avec erreurs et limites explicites à chaque étape. La valeur ajoutée est examinée par le [protocole A/C/B](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), pas présumée.

### 1.2 Décisions d'architecture déjà validées

1. Socle local existant : SQLite/FTS et serveur MCP EKTS ; FTS explicite pour le pilote. Aucun backend distant ni client MCP sortant imposé.
2. Profil de lecture réellement contrôlé **côté EKTS** comme cible produit ; un contrôle externe vérifié peut suffire au pilote préliminaire, sans implémentation immédiate.
3. Provenance minimale et preuve locale ; ressources historiques conservées à statut inconnu ; aucune obligation de stocker une copie non autorisée.
4. Fiabilité du module web prioritaire pour le produit, même si le pilote synthétique n'effectue pas d'audit web.
5. Hôte, modèle, isolement effectif, durée de rétention et budget à décider avant opération ; ni Windows/WSL ni fournisseur ne sont choisis automatiquement.

L'environnement utilisateur documenté est Windows/PowerShell. La validation d'une cible Windows native est retenue pour la livraison ; le choix éventuel de WSL ou d'un hôte ne doit pas être présumé et une exécution Linux ne prouve pas la compatibilité Windows.

### 1.3 Indispensable, améliorations et exclusions

| Classe | Signification | Contenu |
|---|---|---|
| **M — indispensable au MVP produit** | Obligatoire pour présenter les fonctionnalités correspondantes comme validées. | Fiabilité web W01–W06 ; permissions P01–P03 ; corpus et provenance R01–R03 ; recherche R04–R05 ; preuves T01–T03 ; confidentialité, plateforme, compatibilité, gouvernance et contrôle des cibles web O01–O06. |
| **S — protocole expérimental** | Nécessaire à la validité du pilote **s'il est exécuté** ; une expérience bloquée n'est pas un échec silencieux ni une preuve de valeur. | Sessions A/C/B, contrôle du corpus, restrictions, cas d'échec, traçabilité et analyse de [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md). |
| **A — amélioration ultérieure** | Souhaitable mais non bloquante pour le socle M, sauf nouvel arbitrage. | Nommage simplifié du rapport, harmonisation complète du français, sélection de skills supplémentaires, meilleures métriques de recherche, automatisation avancée des preuves. Les préférences de nommage ne passent pas avant les défauts structurels. |
| **H — hors périmètre par défaut** | Ne devient pas une dépendance ou obligation par cette spécification. | Marketplace, multi-agent, exécution automatique de scripts de skills, ajout systématique d'outils externes, backend cloud, collaboration distante, nouveau moteur vectoriel et client MCP sortant. La roadmap historique sera arbitrée séparément, non supprimée. |

**Deux décisions distinctes :** (a) la conformité technique du MVP selon les critères M ; (b) une décision produit sur l'utilité comparative. Un pilote peut montrer une absence de gain : il faut rapporter ce résultat honnêtement. Un produit ne doit pas être présenté comme ayant une valeur ajoutée **démontrée** si B−A ou B−C n'a pas été évalué ou si les preuves sont insuffisantes.

### 1.4 Situation de départ prouvée et non prouvée

- **Observé :** création d'une ressource synthétique et recherche FTS par CLI/MCP ; processus MCP réel exposant 17 outils ; `hybrid` sans embeddings a renvoyé `EMBEDDINGS_FAILED` ; 15 fichiers / 138 tests ciblés réussis pendant la phase 1.
- **Observé :** sur la reproduction #2, compteur de priorités et détail diffèrent ; la cause a été reliée au pipeline, au stockage et au rapport. L'essai historique du propriétaire avait une version et des bruts inconnus.
- **Non démontré :** raccordement à un hôte agent réel, profil serveur de lecture, provenance obligatoire, preuve d'utilisation de ressource, correction de l'audit web, test comparatif et compatibilité Windows native à la révision proposée.
- **À conserver :** capacités et données historiques ; les validations antérieures ne valent pas preuve de conformité aux nouvelles exigences.

Références : [matrice phase 1](15_PHASE1_MATRICE_ET_VALIDATION.md), [ressources et MCP](16_RESSOURCES_ET_ACCES_AGENTIQUE.md), [architecture](20_ARCHITECTURE_MINIMALE_MVP4.md).

## 2. Acteurs et frontières

| Acteur / composant | Responsabilité cible | Ne peut pas être supposé |
|---|---|---|
| Propriétaire | Autoriser corpus, cible, fournisseur, coût, rétention, permissions et passage de phase. | L'approbation du document n'autorise ni envoi de données, ni essai actif, ni implémentation. |
| Opérateur | Préparer une base dédiée, documenter les provenances, vérifier les versions et les restrictions. | Il ne modifie pas la base personnelle pour un test et ne partage pas les traces par défaut. |
| Agent / modèle | Choisir et utiliser les outils autorisés, produire réponse et citations, signaler l'incertitude. | Le contenu d'une ressource n'a pas autorité sur les règles du système ou les permissions. |
| Hôte | Brancher le serveur MCP, appliquer ses propres restrictions et, si disponible, collecter les événements. | La compatibilité, l'isolation et la fidélité des traces ne sont pas prouvées avant test. |
| EKTS | Stocker et retrouver les ressources, appliquer le profil serveur cible, renvoyer statuts et erreurs, produire les audits retenus. | EKTS ne garantit pas la sécurité de l'hôte, du modèle, de l'OS ou d'un autre processus. |
| Évaluateur / dispositif de preuve | Rapprocher sources, appels et réponses et noter les résultats selon un protocole figé. | Une source transmise ou citée ne prouve pas le raisonnement interne ni à elle seule un lien causal. |

## 3. Cas d'usage et parcours

| ID / priorité | Acteur, déclencheur et préconditions | Parcours nominal | Résultat et alternatives |
|---|---|---|---|
| **UC01 M — Préparer un corpus gouverné** | Opérateur autorisé ; répertoire de test séparé ; droits et données examinés. | Choisir les six ressources de [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), enregistrer provenance et empreintes, importer dans la base de test, relire et comparer aux originaux. | Mapping ID corpus/UUID/version ; si droit inconnu ou hash différent, la ressource n'entre pas dans le corpus gouverné. Les données historiques ne sont pas effacées. |
| **UC02 M — Recherche et consultation** | Agent via hôte/serveur ; profil de lecture confirmé ; corpus accessible. | `search_knowledge` mode FTS explicite, puis lecture du contenu retourné ou `get_resource` ; `list_resources` si nécessaire. | Identifiants, contenu disponible et statut ; aucun résultat n'est distinct d'une erreur. `search_knowledge` et `list_resources` peuvent déjà transmettre le contenu : ne pas imposer un appel `get_resource` artificiel. |
| **UC03 M — Réponse avec preuve** | Trace et corpus autorisés, demande claire. | L'agent répond, cite les passages réellement accessibles et signale hypothèses et lacunes ; un évaluateur rapproche preuve, ressource et réponse. | Réponse et dossier de preuve local ; preuve manquante = `indéterminé`, pas preuve fabriquée. |
| **UC04 M — Action interdite ou contenu hostile** | Profil lecture ; source potentiellement non fiable. | L'agent reçoit une instruction non autorisée ; le contrôle serveur et/ou la couche OS refusent l'action hors profil. | Aucun effet interdit ; tentative et observabilité rapportées selon politique. L'absence d'exposition à l'injection n'est pas une réussite du test. |
| **UC05 M — Défaillance / résultat absent** | Ressource non retrouvée, index inaccessible, serveur arrêté ou fournisseur d'embeddings absent. | Restituer l'état et sa cause observable ; proposer, si permis, une recherche FTS distincte. | Erreur ≠ corpus vide ; aucun repli hybride→FTS silencieux ; aucun réindexage destructif automatique. |
| **UC06 M — Audit web fiable** | Site ou fixture explicitement autorisé, inspection L3 dans un environnement consigné. | Observer, analyser, appliquer une priorité canonique, stocker, puis générer les formats autorisés. | Résumé et détails cohérents ; valeurs absentes visibles ; preuve minimale disponible sans affirmer une conformité globale. |
| **UC07 M — Échec partiel et reprise** | Exemple : audit stocké mais génération PDF échouée. | Signaler l'ID existant et l'état de chaque artefact, si connus ; l'opérateur vérifie l'état et relance uniquement la génération voulue. | Pas de prétention que rien n'a été écrit ; pas de duplication automatique d'audit. |
| **UC08 S — Comparer A/C/B** | Autorisation d'exécution séparée, hôte/modèle/coût et confinement effectivement contrôlés. | Exécuter T01–T06 selon [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), puis évaluer l'ensemble des sorties. | B−A mesure corpus+EKTS ; B−C compare interfaces à corpus équivalent. Un score ou avantage non démontré reste non démontré. |
| **UC09 M — Consulter un audit historique** | Ancien audit conservé, éventuellement sans métadonnées fines. | Lire l'état d'origine, indiquer les limites de version et de provenance, détecter une incohérence observable. | Ne pas attribuer rétroactivement une mesure ou une priorité corrigée ; aucun écrasement silencieux de l'historique. |

## 4. Contrats d'entrée, sortie et états

Les tableaux sont **conceptuels** : les étiquettes ci-dessous ne sont pas des noms d'API, options CLI ou codes d'erreur déjà existants. La spécification d'implémentation devra choisir les noms, transport et migrations en préservant les contrats existants. Les erreurs MCP existantes doivent rester de vraies erreurs (`isError` ou erreur protocolaire explicite selon le cas), pas une réponse de succès vide.

### 4.1 Préparer et ingérer une ressource gouvernée

| Entrée | Contrôle / sortie attendue |
|---|---|
| Identifiant de corpus stable ; type existant compatible ; titre ; contenu ou référence utilisable | Validation avant écriture ; création ou association contrôlée avec UUID EKTS ; toute référence locale doit être soumise aux permissions et à un chemin autorisé. |
| Origine/chemin ou URL ; révision/date connue ou explicitement inconnue | Conserver la provenance disponible et l'état `inconnu` quand une donnée n'existe pas ; `createdAt` EKTS ne remplace pas la date source. |
| Licence/droits et décision d'utilisation pour le scénario ; sensibilité et destination autorisée | Sans droit d'utilisation approuvé, refuser l'admission au corpus gouverné ; ne pas inférer une permission de redistribution, de copie ou d'exécution. |
| Contenu figé et SHA-256 si la copie est autorisée | Calculer ou comparer l'empreinte selon l'encodage déclaré ; contrôler le contenu relu. L'empreinte atteste des octets comparés, pas leur authenticité ou légalité. |
| Ressource existante sans provenance | Conserver et présenter comme historique/inconnue ; ne pas l'admettre automatiquement au corpus gouverné. Pas de suppression ou classification inventée. |

**Compatibilité :** les métadonnées libres existantes sont l'emplacement candidat d'un contrat versionné. La CLI `add` actuelle ne permet pas de renseigner des métadonnées arbitraires par une option démontrée : il faut définir un mécanisme opérateur, validé et testable, sans exiger de modification manuelle de SQLite. Le mécanisme exact reste à concevoir pendant l'implémentation autorisée. Les anciennes ressources et autres parcours ne sont pas invalidés automatiquement. Les permissions du profil lecture ne couvrent pas l'ingestion opérateur.

Une source inconnue ou une date inconnue peut être enregistrée comme telle ; **l'utilisation gouvernée** exige une décision humaine documentée et des preuves suffisantes pour le cas, pas une valeur inventée. Si l'origine, le contenu ou les droits nécessaires à la vérification restent inaccessibles, la ressource est exclue du corpus gouverné jusqu'à décision et ne devient pas « sûre » par défaut.

### 4.2 Recherche et consultation

| Entrée | Sortie attendue | Échec / règle |
|---|---|---|
| Requête non vide, mode FTS explicite, limite positive, filtres autorisés | Liste ordonnée d'identifiants et d'éléments effectivement retournés, mode réel et nombre ; les données de provenance connues restent disponibles. | Aucun résultat = recherche réussie à 0 correspondance pour cette requête et ce périmètre ; ne pas conclure à l'absence générale de connaissance. |
| Requête invalide ou limites hors contrat | Erreur de validation identifiable, sans modification. | Ne pas transformer en résultat vide. |
| Index indisponible/incohérent | Erreur explicite, pas de réponse fabriquée. | Pas de suppression ni réindexage automatique de la base personnelle. |
| Mode hybride/vectoriel sans fournisseur | Erreur explicite ; l'appelant peut effectuer ensuite un **nouvel** appel FTS autorisé. | Pas de changement de mode caché ; ne pas étiqueter FTS comme hybride. |
| ID de ressource valide mais introuvable | Erreur identifiable et action de vérification possible. | Ne pas substituer un autre contenu ou affirmer qu'une ancienne version a été consultée. |

Le moteur actuel joint les termes FTS par `AND`. Les tests de contrat lexical ne démontrent pas une recherche sémantique ni une bonne pertinence générale. Les filtres et plafonds de l'interface réelle sont à respecter et documenter ; pas de promesse d'isolation par `project_id` dans le schéma MCP actuel.

### 4.3 Résultat et preuve locale

Une réponse du scénario doit séparer **faits sourcés**, **hypothèses**, **informations absentes/contradictoires** et **actions de vérification**. Une référence factuelle doit viser un identifiant et un passage identifiables, reliés au contenu transmis et à sa version lorsqu'ils sont observables. Si aucune source n'est disponible, une abstention ou recommandation conditionnelle est valide ; une source inventée est un échec.

Un événement de preuve minimal et sa relation aux autres contiennent, lorsque disponibles et autorisés : ID de session/cas/condition ; versions d'EKTS, de l'hôte/modèle et du protocole ; corpus/version/politique ; outil/mode ; statut, durée et identifiants de ressources transmises ; référence de version/empreinte ; référence à la réponse et évaluation. **Transmis à l'hôte**, **transmis au modèle**, **lu explicitement**, **cité** et **vérifié par un évaluateur** sont des niveaux distincts : ne les étiqueter que si la capture les établit.

Les requêtes, extraits, chemins, identifiants et hashes peuvent être sensibles ; journaliser le minimum autorisé. La trace doit rester locale, séparée de l'espace agent et consultable par l'opérateur autorisé. Aucune chaîne de pensée privée ni copie de contenu interdite ne sont exigées. Si capture ou accès à la version source insuffisants : résultat de preuve `indéterminé` et limite explicite.

### 4.4 Inspection, rapport et état partiel

**Entrées :** URL ou fixture explicitement autorisée, niveau d'inspection approprié, conditions de navigateur et de réseau connues ou déclarées inconnues, destination d'artefacts approuvée.

**Sortie d'audit cible :** identifiant, horodatage et contexte disponibles ; dimensions ; constats avec priorité canonique ; compteurs cohérents ; données/éléments de preuve disponibles ou statut d'indisponibilité ; erreurs et avertissements pertinents ; résumé et détails dont les limites sont lisibles. Le format Markdown et le chemin HTML/PDF existants doivent rester cohérents sur les priorités et les disponibilités des données.

**États d'artefacts à distinguer :** non tenté, créé/confirmé, échec connu, état inconnu. Si l'audit a été stocké mais qu'un PDF échoue, retourner l'ID de l'audit et les artefacts confirmés lorsque connus ; ne pas dire qu'aucun effet n'a eu lieu. Si une panne empêche de connaître l'état, le signaler et demander une vérification avant relance. Ces états sont des exigences conceptuelles ; aucun nouveau code de sortie précis n'est présumé.

## 5. Exigences détaillées

### 5.1 P — Permissions et confinement

| ID | Exigence cible | Statut initial / priorité |
|---|---|---|
| **P01** | Un profil explicitement sélectionné expose `search_knowledge`, `get_resource` et `list_resources` pour le scénario. Dans ce profil, `search_knowledge` n'accepte que `mode: fts` **explicitement fourni** : mode omis, `hybrid` et `vector` sont refusés avant tout appel d'embeddings ou accès réseau. Tout autre outil est refusé à l'invocation même si le nom est connu ; un nouvel outil futur est refusé tant qu'il n'est pas explicitement autorisé. | M ; **à construire** côté serveur. |
| **P02** | Profil inconnu, politique invalide ou absence du contrôle obligatoire : refuser le démarrage/la session ou l'appel, sans retour silencieux au profil complet. Le comportement historique hors profil doit rester explicite et compatible après décision de migration. | M ; à construire/vérifier. |
| **P03** | Le profil de lecture n'autorise aucune mutation métier, aucune inspection de site, exécution de script ou accès réseau supplémentaire. Les écritures techniques d'initialisation/WAL, si nécessaires, sont documentées, bornées à la base isolée et distinctes des actions agent. L'hôte et l'OS restent responsables de l'isolation hors serveur. | M ; à vérifier et compléter. |

Le serveur expose 17 outils dans la révision examinée : le cas de référence autorise 3 noms et refuse les 14 autres, y compris `get_recommendations`, même s'il est annoté `readOnlyHint`. **Les arguments comptent aussi :** dans le code actuel, omettre `mode` choisit `hybrid`, qui peut solliciter un fournisseur. Dans le profil cible du scénario, une recherche sans `mode: fts` explicite est donc refusée avant traitement ; aucune conversion silencieuse ni requête d'embedding n'est permise. La validation devra distinguer l'argument réellement omis avant que la valeur par défaut actuelle ne soit injectée, par exemple au moyen d'un schéma spécifique au profil ou d'un contrôle équivalent ; conserver le contrat historique hors profil. La politique ne repose ni sur une annotation ni sur un simple masquage dans une interface. Un appel direct doit échouer avant la mutation. Si un contrôle hors serveur contourne l'application, il ne démontre pas l'isolation de l'OS.

### 5.2 R — Ressources, provenance et recherche

| ID | Exigence cible | Statut initial / priorité |
|---|---|---|
| **R01** | L'opérateur peut enregistrer des ressources et les métadonnées nécessaires au corpus gouverné sans modifier directement SQLite ; origine/version connues ou explicitement inconnues, droits d'utilisation approuvés, sensibilité et identifiant conservés. Une ressource sans décision suffisante est exclue de ce corpus mais non supprimée. | M ; contenu/tags existants, contrat et mécanisme de provenance non démontrés. |
| **R02** | Pour un contenu dont la copie est autorisée, identifier la version par ID et SHA-256 du contenu au format déclaré, contrôler l'identité lors de l'import et de la relecture. Les versions historiques incertaines et copies interdites restent explicitement non reconstructibles si aucune source figée accessible n'existe. | M ; manifeste expérimental existant, automatisation non démontrée. |
| **R03** | Préserver les ressources historiques lors de l'évolution du contrat ; les informations inconnues sont visibles et aucune licence, origine ou mesure n'est fabriquée. Toute migration doit être réversible ou disposer d'une restauration vérifiée, sans suppression silencieuse. | M ; comportement futur à vérifier. |
| **R04** | Rechercher en FTS explicite dans un corpus dédié, retourner les résultats et les identifiants, préserver le contenu consultable. Le corpus du pilote B correspond aux mêmes octets que C. | M ; FTS sur une ressource testé, corpus complet non testé. |
| **R05** | Distinguer succès vide, erreur d'index, mode/fournisseur indisponible et ressource absente. Tout repli vers FTS est un appel distinct, explicite et traçable. | M ; certaines erreurs existent, contrat complet à vérifier. |

### 5.3 T — Traces et comparaison

| ID | Exigence cible | Statut initial / priorité |
|---|---|---|
| **T01** | L'exécution autorisée rend traçables session, mode, appels effectivement observés, statuts et ressources/versions transmises lorsque la couche de capture le permet ; le niveau d'observation est explicite. | M ; journal actuel insuffisant pour établir seul ces éléments. |
| **T02** | Le dispositif rapproche les citations de la réponse avec une ressource effectivement transmise et la version disponible ; marque toute preuve absente/non observable `indéterminée`, sans recopier des données interdites. | M ; à concevoir/tester, rapprochement humain admis. |
| **T03** | Traces, extraits et snapshots sont locaux, séparés de l'espace agent, minimisés et protégés ; durée, copie et partage nécessitent une politique décidée. Aucun secret réel n'est utilisé dans les fixtures. | M ; paramètres d'exploitation à valider. |
| **T04** | Appliquer le protocole A/C/B validé et rapporter B−A et B−C séparément, les non-expositions, indisponibilités, limites et coût si observable. | S ; aucun essai agent réel encore réalisé. |

### 5.4 W — Fiabilité de l'audit web

| ID | Exigence cible | Statut initial / priorité |
|---|---|---|
| **W01 — priorité canonique** | Pour un nouvel audit, la priorité affichée d'un constat est la même dans le résultat d'analyse, les dimensions, les compteurs, le stockage, la consultation, Markdown et HTML/PDF. Les cinq priorités `critical/high/medium/low/info` sont prises en compte ; leur somme et le total correspondent aux constats représentés. Un éventuel top de recommandations a son propre ordre expliqué et ne modifie pas la priorité. | M ; incohérence reproduite sur phase 1. |
| **W02 — données absentes** | Une mesure, une catégorie ou un résultat d'outil absent/non fini est marqué indisponible ou l'opération échoue explicitement ; il ne devient jamais un zéro mesuré ni une liste de violations vide présentée comme réelle. La valeur numérique zéro réellement observée reste zéro. | M ; risque confirmé dans le code, cause du rapport historique non prouvée. |
| **W03 — score global** | Si une dimension requise est indisponible, un audit partiel éventuellement émis indique le score global **indisponible**, avec raison ; l'alternative est de bloquer l'audit avec une erreur explicite, sans émettre de score global. Aucune valeur de remplacement ni renormalisation implicite. Les scores partiels réellement disponibles restent étiquetés comme tels. | M ; contrat cible proposé, changement de schéma à anticiper. |
| **W04 — métriques distinctes** | INP, FID et `max-potential-fid` ne sont pas interchangeables. Conserver l'identité de l'audit, la valeur, l'unité, l'origine et le contexte laboratoire/terrain si connus, sinon `inconnu`. TBT reste distinct ; absence ≠ zéro. | M ; mappage actuel INP/repli vers `fid` constaté dans le code. |
| **W05 — preuve et interprétation** | Conserver les éléments minimaux réellement disponibles et autorisés : règle/source et version si connue, impact, nombre de nœuds, cible/sélecteur si fourni et autorisé, valeur/unité/contexte pour une mesure ; sinon statut manquant. Expliquer limites du score axe et des heuristiques UX ; ne pas annoncer conformité WCAG ou UX parfaite. | M ; données brutes non conservées dans les reproductions. Ne pas exiger une copie brute si droits/confidentialité s'y opposent. |
| **W06 — échec partiel et historique** | Signaler audit et artefacts créés, échoués ou d'état inconnu ; reprise explicite sans duplication automatique. Les audits historiques restent lisibles et ne sont ni recalculés ni écrasés silencieusement ; signaler l'incohérence ou l'incertitude détectable. | M ; persistance avant échec PDF observée. |

Pour W01, les constats `info` doivent être inclus dans la somme, ou indiqués séparément sans ambiguïté. Les doublons de titres doivent rester deux constats distincts ; une solution de correspondance stable est nécessaire, sans imposer ici une migration précise d'identifiant. Le cas synthétique de régression de sévérité 3 et effort 3, recalculé `medium` selon la matrice actuelle, doit rester cohérent jusqu'aux sorties. Il ne prouve pas la cause du rapport initial de version inconnue.

### 5.5 O — Opérations, plateforme et gouvernance

| ID | Exigence cible | Statut initial / priorité |
|---|---|---|
| **O01 — confidentialité** | Séparer base et traces du poste personnel ; appliquer permissions fichiers/ACL et politique réseau vérifiée ; signaler tout envoi à un fournisseur et obtenir son approbation préalable. Les métadonnées de sensibilité seules ne sont pas une barrière. | M ; aucune isolation hôte n'est démontrée. |
| **O02 — Windows et portabilité** | Sur une configuration Windows native choisie pour la validation : build/démarrage, binaires natifs, chemins absolus avec espaces et accents, UTF-8, ACL, WAL, arrêt et réouverture testés. WSL ou autre environnement fait l'objet d'une validation distincte s'il est retenu. | M ; non testé en phase 1, seuils §22. |
| **O03 — intégrité / restauration** | Vérifier la cohérence base principale/index, sauvegarde et restauration d'un jeu isolé avec gestion adaptée des trois bases et fichiers WAL/SHM ; signaler la limite d'atomicité des bases attachées en WAL. Aucun nettoyage destructif automatique. | M ; stratégie à spécifier et vérifier. |
| **O04 — compatibilité** | Maintenir les usages existants documentés ou expliciter une migration et ses impacts ; tests des clients/commandes et lecture d'anciens audits. Ne pas présumer qu'un ancien zéro est une vraie mesure ou réécrire les anciens résultats. | M ; à préciser et tester. |
| **O05 — documentation et gouvernance** | Documenter l'inventaire réel d'outils, leurs effets, le profil, les limites, la procédure de reprise, les versions et les preuves ; identifier les différences avec les documents historiques. Pas de PR ni de publication. | M ; `AGENTS.md` et `docs/MCP.md` sont partiellement périmés sur le nombre/les effets des outils. |
| **O06 — contrôle des cibles web** | Toute future inspection active exige une cible et une portée autorisées, des restrictions réseau testées, et un échec explicite sur les cas interdits. Les redirections et résolutions doivent être prises en compte dans la modélisation de menace ; ne pas supposer les garde-fous actuels suffisants. | M pour les parcours d'inspection conservés ; analyse de sécurité complète et garanties précises à vérifier avant spécification de mise en œuvre. |

## 6. Contrats de sécurité et de données

### 6.1 Flux et permissions

- **Préparation opérateur :** ajout de ressources et métadonnées dans une base de test par une personne autorisée ; aucune autorisation automatique de mutation pour l'agent.
- **Session agent gouvernée :** lecture/recherche des seules ressources du périmètre, sous contrôle effectivement appliqué. Le champ projet et les tags ne sont pas une isolation de sécurité MCP démontrée ; utiliser un périmètre de stockage et des permissions OS adaptés.
- **Source externe ou skill :** contenu non fiable ; ni instruction prioritaire ni autorisation d'exécution. Accès, scripts, téléchargement, appels réseau et modifications sont interdits par défaut dans le scénario.
- **Fournisseur :** aucun envoi de données sans décision explicite ; un processus EKTS local ne rend pas le modèle ou l'hôte hors ligne. Aucun secret réel en fixture, prompt ou journal.
- **Copies et traces :** uniquement si les droits le permettent ; accès et durée décidés avant utilisation. Une empreinte ne rend pas une donnée automatiquement anonyme.

### 6.2 Historique et compatibilité des mesures

Les anciens audits peuvent avoir un zéro sans indication permettant de savoir s'il représente une valeur observée ou un remplacement. Le contrat impose `historique : origine indéterminée` quand c'est le cas ; il n'autorise ni à inventer l'information manquante ni à changer silencieusement le score d'origine. Pour les nouveaux audits, les états `mesuré`, `indisponible` et `invalide` doivent être représentables et différenciés par les interfaces exposées.

La politique proposée pour un nouveau score global est explicite : **cinq dimensions disponibles → calcul selon la formule en vigueur et documentée ; dimension requise indisponible → score global indisponible, ou audit bloqué avec erreur explicite et sans score**. Modifier les pondérations ou recalculer les audits historiques exige un arbitrage distinct. Ce choix de sortie peut affecter les schémas et consommateurs ; il faudra prévoir versionnement, migration et tests, pas convertir l'indisponible en `0` pour préserver artificiellement une signature numérique.

### 6.3 Démarrage et arrêt

Démarrer MCP peut ouvrir ou initialiser les trois bases et ensemencer des templates ; le profil d'outils lecture ne promet donc pas un processus sans écriture système. La validation compare les **données métier** après initialisation préparée puis après appels et contrôle séparément les écritures techniques autorisées. Éviter de comparer uniquement les hashes de fichiers SQLite actifs, qui peuvent changer avec WAL. Utiliser une base dédiée, des instantanés cohérents et des contrôles de contenu.

## 7. Dépendances et limites assumées

- Réutiliser les dépendances présentes dans `package.json` et les capacités locales existantes. FTS n'exige pas d'embeddings, mais l'ouverture actuelle charge/attache `sqlite-vec` et son fichier par défaut : pas d'affirmation de suppression.
- Un hôte et un modèle sont nécessaires au test agentique, sans imposer leur fournisseur. Choisir versions, configuration et coûts avant exécution ; le modèle hébergé peut recevoir le contenu consulté.
- Les règles, quotas, conditions contractuelles, droits sur documents et licences de logiciels restent à examiner pour chaque réutilisation ou diffusion. La recherche de sources tierces n'est pas une autorisation d'exécution.
- WAL, bases attachées et sauvegarde/restauration exigent des essais. La [documentation SQLite](https://www.sqlite.org/wal.html#overview) indique que l'atomicité d'une transaction entre plusieurs bases attachées en WAL n'est pas garantie pour l'ensemble en cas d'incident.
- Les recommandations C16.6/C16.7 non intégrées aux chemins d'audit examinés restent un **écart historique distinct** : ce MVP ne prétend pas les avoir corrigées, et une éventuelle intégration du moteur de recommandations nécessite un arbitrage ultérieur.

## 8. Critères et preuves : vue d'ensemble

La [matrice détaillée 22](22_CRITERES_ET_TESTS_MVP4.md) attribue à chaque exigence des critères avec méthode, jeux d'essai, seuil et preuve. Résumé des catégories :

| Groupe | Conditions proposées de passage |
|---|---|
| **Sécurité** | Tous les appels hors profil testés sont refusés sans mutation métier ; configuration invalide échoue fermée ; confinement et réseau vérifiés dans l'environnement retenu. Un incident interdit invalide le test concerné. |
| **Ressources** | Six contenus de référence identiques après import/relecture ; historique conservé ; provenance et droits inconnus non inventés ; jeu lexical annoté communiqué en 22. |
| **Fiabilité web** | Aucune divergence de priorité/compteur sur les fixtures ; zéro réel distinct d'une donnée absente ; pas de confusion INP/FID ; états d'échec et limitations visibles. |
| **Preuve** | Tous les événements requis et observables du jeu de test sont reliables ; les absences de visibilité sont déclarées indéterminées. Pas de prétention sur des appels non observés. |
| **Plateforme** | Validation sur une configuration Windows native choisie et documentée, sans extrapolation ; sauvegarde/restauration et dépendances testées. |
| **Valeur** | Les résultats du protocole A/C/B sont rapportés honnêtement ; seuil 80/100 de T01 validé pour la planification reste à mesurer lors du pilote, pas preuve d'avantage sur C. |

**Statuts de validation :** `non commencé`, `réussi`, `échoué`, `bloqué`, `non applicable` avec justification et approbation, ou `indéterminé` lorsque la preuve manque. Un test ignoré, une dépendance absente ou une méthode non observable n'est pas un succès. Un critère M applicable mais bloqué empêche de déclarer la conformité technique complète du MVP ; un pilote facultatif non autorisé laisse la valeur comparative non démontrée.

## 9. Risques, décisions encore ouvertes et étape suivante

| Sujet | Risque / décision encore ouverte |
|---|---|
| Hôte / modèle | Choix et version, conditions, éventuels coûts, compatibilité Windows et possibilité d'allowlist réellement appliquée. |
| Isolation | Mécanisme OS et hôte, supervision des appels, absence d'accès aux corrigés et autres bases ; un profil serveur seul n'est pas une sandbox. |
| Schémas / migration | Représentation des mesures manquantes, `info`, provenance et ancienne donnée ; versionnement, sauvegarde et compatibilité. |
| Preuve et rétention | Niveau de capture réellement possible, stockage des données sensibles, durée, suppression et consentement ; aucune durée n'est imposée ici. |
| Réseau web | Mesures précises contre cibles interdites, redirections et DNS à documenter selon l'architecture et à tester sans solliciter de cible réelle non autorisée. |
| Qualité | Taille limitée du corpus et variabilité des modèles ; le protocole pilote ne démontre pas la généralité. |
| Roadmap | Révisée et validée, avec collaboration reportée et ancien plan conservé ; [préparation historique](../../MVP4_PREPARATION.md) conserve ADR-044. La réconciliation formelle du registre des décisions reste à traiter sans effacement ni document concurrent. |

**Décision du propriétaire :** la spécification, ses priorités et les seuils de [22](22_CRITERES_ET_TESTS_MVP4.md) ont été validés pour passer à la révision de la [roadmap officielle](../../ROADMAP.md). La configuration Windows précise, l'hôte, le modèle, le fournisseur, le budget et les modalités de rétention restent à approuver avant exécution. La planification de sprints et tout développement suivent des validations distinctes ; aucune PR, publication ou expérience agentique n'est autorisée par cette décision.
