# 16 — Ressources réellement utilisables et accès agentique

**Date :** 29 octobre 2026 · **Révision :** `c0610ae9825808bf88a309513bbdc00e2bc7e367` · **Statut :** inventaire factuel ciblé pour validation de phase 1. Il distingue contenu, découverte, permissions et exécution ; ce n'est ni une étude exhaustive des dépôts tiers ni un plan d'implémentation.

## 1. Chaîne de valeur et niveaux de preuve

1. **Référence documentaire** : un lien, un nom de projet ou une recommandation existe dans un document. Cela ne garantit ni disponibilité, ni licence du contenu, ni compatibilité.
2. **Ressource persistée** : un enregistrement a été introduit dans SQLite. Il peut n'avoir que titre/type, sans contenu, licence ou source obligatoire.
3. **Ressource découvrable et lisible par un agent** : l'index et le serveur exposent ce contenu et l'hôte peut réellement le récupérer. Une ressource inconnue de l'index ou une URL seule ne suffisent pas à produire ses instructions.
4. **Capacité exécutable** : outil, script ou service disponible, compatible, autorisé et contrôlé. Un texte qui décrit une commande n'établit ni son installation ni l'autorisation de l'exécuter.
5. **Valeur démontrée** : l'agent a utilisé la ressource sur une tâche et un protocole indépendant montre l'effet sur le résultat. Aucun test fait ici ne démontre ce dernier niveau.

## 2. Inventaire

| Objet | Ce qui existe / preuve | Ce que l'essai établit | Ce qui manque |
|---|---|---|---|
| Ressources de connaissances | [Schéma](../../../src/shared/validators.ts) : `article`, `video`, `tutorial`, `tool`, `other`, titre, URL et contenu optionnels, tags et métadonnées libres ; [CLI add](../../../src/cli/commands/add.ts), [gestionnaire](../../../src/business/knowledge-manager.ts). | Base neuve `init` : **0 ressource**. Ajout d'un texte synthétique avec type `tutorial`, tags et contenu ; `vectorIndexed:false` ; FTS retourne cet enregistrement. | Aucune conclusion sur une base personnelle existante. Type skill, licence et provenance ne sont pas obligatoires dans ce schéma ; les métadonnées libres peuvent les porter sans contrat uniforme. |
| Index et recherche | [Moteur](../../../src/business/search-engine.ts), [index](../../../src/business/indexer.ts), [schémas MCP](../../../src/mcp/schemas/tool-schemas.ts). | Recherche lexicale CLI et MCP réussie pour `boutons accessibles` sur 1 ressource synthétique. Hybride par défaut a échoué explicitement sans fournisseur d'embeddings. | Un exemple n'évalue ni rappel/précision ni corpus réel. Vectoriel/hybride et fournisseurs configurés non évalués. Recherche MCP n'expose pas de filtre `project_id` dans son schéma, contrairement au moteur et à la CLI ; ne pas supposer l'isolation projet à cette interface. |
| Documents blueprint et catalogue créatif | [Index](../../blueprint/INDEX.md), [catalogue créatif](../../blueprint/05-Creative-Engineering/09_CATALOGUE_OUTILS_ET_REFERENCES.md). | Documentation versionnée consultable dans le dépôt. | Aucune démonstration d'indexation automatique de tous ces documents dans la base vierge ni d'usage automatique par un hôte ; les droits des ressources citées doivent être vérifiés individuellement. |
| Skills et instructions | Recherche des chemins versionnés et fichiers `SKILL.md` dans l'arbre ciblé hors `.git`, `node_modules`, `dist` ; [schéma](../../../src/shared/validators.ts). | Aucun fichier nommé `SKILL.md` trouvé dans cet inventaire ; on peut stocker du texte comme `other` ou autre type accepté. | Cela ne prouve pas l'impossibilité de stocker des skills ailleurs, ni l'absence d'un format alternatif. Aucun parseur, registre, installation ou activation d'un skill par un hôte réel n'a été démontré ici. Les scripts associés exigeraient un contrôle distinct. |
| Templates projet et règles | [10 templates et règles intégrées](../../../src/templates/builtin-templates.ts) ; [service](../../../src/templates/template-service.ts) ; [applicateur](../../../src/templates/template-applier.ts). | Définitions de projet et règles présentes ; tests MVP-3 ciblés réussis. Le service ensemence les builtins, et l'application crée un projet/config et associe ou compte des éléments. | Ce n'est pas une bibliothèque générique de compétences ou un ensemble d'outils externes exécutés ; l'utilité d'un modèle pour une tâche agent reste à évaluer. |
| Bonnes pratiques et recommandations | [Services](../../../src/best-practices/best-practice-service.ts), [moteur](../../../src/recommendations/recommendation-engine.ts), outils MCP correspondants. | Code disponible et tests ciblés réussis ; MCP sait exposer des opérations de recherche et création ainsi que génération. | Pas de démonstration d'un corpus préchargé, de pertinence experte ou d'injection effective dans les rapports des parcours vérifiés. |
| Audit web | [Inspect CLI](../../../src/cli/commands/inspect.ts), [inspect MCP](../../../src/mcp/tools/inspect-site.ts), [reproduction](15_PHASE1_MATRICE_ET_VALIDATION.md). | Exécution CLI de deux inspections ; stockage, rapports et variabilité observés ; problème de cohérence reproduit. | Inspection MCP du site par hôte réel non exécutée ; défauts et limites de traçabilité web restent ouverts. |
| Dépôts et bibliothèques externes | [Repérage](14_REPERAGE_ECOSYSTEME_MVP4_PROVISOIRE.md), métadonnées et documentations de sources primaires, 29 octobre. | Liens et licences déclarées recensés à titre initial. | Ni installation, ni compatibilité effective, ni droits des données/modèles, ni qualité mesurée. La recherche approfondie est une phase ultérieure. |

La recherche de noms versionnés `git ls-files` ne donne pas la taille ou la composition de toute base sur un poste personnel, ni d'une archive fournie ultérieurement. La base vierge observée n'autorise pas à dire que l'utilisateur ne possède aucune ressource.

## 3. Essai effectif CLI → index → MCP

Environnement et limites : [rapport de phase 1 §4](15_PHASE1_MATRICE_ET_VALIDATION.md). Base isolée neuve, Node 22.19.0, version CLI `0.2.0`, pas de fournisseur d'embeddings configuré. La ressource test est exclusivement synthétique ; aucune donnée du propriétaire n'a été importée.

```text
init --json                         → schemaVersion 8, resources 0
add --type tutorial --title "Exemple synthétique boutons accessibles phase1"
    --content "Vérifier le nom accessible et le contraste des boutons de formulaire"
    --tags accessibilite,test --json → créé, vectorIndexed false
search "boutons accessibles" -m fts --json → count 1, contenu retourné
```

Un client JSON-RPC artisanal a lancé `node dist/mcp/server.js` sur la même base et effectué `initialize`, `notifications/initialized`, `tools/list`, puis `tools/call` :

- `search_knowledge` avec `{query: "boutons accessibles", mode: "fts"}` a retourné une ressource, son texte et `source: "fts"`.
- Le même appel sans mode utilise `hybrid` par défaut et a retourné `isError: true`, raison `EMBEDDINGS_FAILED`, indiquant que `fts` reste disponible.
- Handshake `2025-11-25`, 17 outils dans `tools/list`, fermeture normale du serveur. Ce client n'est pas un véritable hôte agent : aucun modèle, aucune exécution de skill et aucun résultat comparatif ne sont en jeu.

La [recherche hybride](../../../src/business/search-engine.ts) exécute les deux branches et ne bascule pas silencieusement vers FTS quand l'une échoue ; c'est une propriété de transparence, mais l'hôte doit choisir FTS en l'absence d'embeddings. Les coûts, réseau, confidentialité, modèle d'embedding et migration d'index ne sont pas évalués ici.

## 4. Surface MCP et effets de bord

Inventaire issu du `tools/list` du processus compilé, rapproché de [handlers/tools.ts](../../../src/mcp/handlers/tools.ts). Les annotations sont des indices fournis au client, **pas** une autorisation ou un contrôle d'accès démontré.

| Outils | Intention et effets constatés dans le code | Annotation observée |
|---|---|---|
| `search_knowledge`, `get_resource`, `list_resources`, `validate_resource` | Recherche, lecture et validation sans création de ressource. Il n'y a pas d'outil MCP `add_resource` dans cette liste ; la CLI sait ajouter. | `readOnlyHint: true` |
| `inspect_site` | Navigation réseau et stockage/indexation d'un audit. | `readOnlyHint: false`, `openWorldHint: true` |
| `audit_history`, `audit_report` | Consultation historique ; rapport Markdown/text renvoyé par MCP. | `readOnlyHint: true` |
| `create_project`, `delete_project` | Écriture / suppression projet. Le schéma précise que la suppression détache les audits et ressources, sans confirmation interactive dans l'entrée MCP. | `readOnlyHint: false` |
| `list_projects`, `get_project`, `get_timeline` | Lecture et analyse des informations projet. | `readOnlyHint: true` |
| `search_best_practices`, `add_best_practice` | Recherche / création d'une bonne pratique. | Respectivement `true` / `false` |
| `get_recommendations` | [Génère et persiste](../../../src/mcp/tools/get-recommendations.ts) des recommandations, avec purge préalable selon son commentaire et le moteur. | **`readOnlyHint: true` malgré l'écriture locale** ; ne pas utiliser cette annotation comme garantie de non-modification. |
| `list_templates`, `apply_template` | Liste / application d'un modèle créant un projet et configuration. | Respectivement `true` / `false` |

L'ancien [AGENTS.md](../../../AGENTS.md) affirme quatre outils en lecture seule : cette description ne reflète pas la surface actuelle de 17 outils. Les règles de gouvernance du même fichier restent applicables ; seule la description technique est périmée. Il faut vérifier le contrôle des permissions au niveau du client/hôte et du déploiement, pas seulement lire les annotations.

### Frontière navigateur

[playwright-mcp.ts](../../../src/browser/playwright-mcp.ts) définit un serveur navigateur **séparé** avec cinq outils et un contrôle sur certains hôtes privés et chemins d'artefacts ; les appels de construction repérés ne prouvent pas son raccordement au serveur stdio principal. La chaîne `inspect_site` / `Inspector` examinée suit une autre voie ; on ne peut lui attribuer automatiquement les protections de cet autre serveur. Le contrôle des redirections, résolutions DNS, plages spéciales, sous-ressources et contenus non fiables n'a pas été audité exhaustivement ; aucune exploitation SSRF n'a été tentée. Revoir ces frontières avant tout déploiement multi-utilisateur ou à confiance réduite.

## 5. Conclusions et décisions ouvertes

- **Fait exécuté :** une ressource textuelle ajoutée manuellement est recherchable en FTS et lisible via un vrai processus MCP, par un client de test.
- **Fait exécuté :** une base vierge démarre avec zéro ressource de connaissances ; cela ne décrit pas les bases de l'utilisateur.
- **Fait de code :** templates, règles et bonnes pratiques sont des objets distincts des ressources et des skills ; certaines opérations MCP écrivent, parfois malgré une annotation de lecture seule.
- **Non démontré :** découverte de compétences préinstallées par un hôte, ingestion automatique de dépôts, exécution autorisée d'outils tiers, pertinence de recherche à l'échelle, amélioration mesurée d'une tâche.
- **À arbitrer après validation :** hôte agent et périmètre d'accès, jeu initial de ressources, traçabilité/licence et droits des dépendances, politique d'exécution et de consentement, protocole comparatif et métriques. Ne pas confondre ces sujets avec une architecture ou une implémentation déjà approuvées.
