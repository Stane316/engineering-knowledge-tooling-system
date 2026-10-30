# 14 — Repérage initial de l'écosystème pour MVP-4

**Date :** 29 octobre 2026 · **Statut : repérage initial, étude comparative non terminée.** Aucun outil ci-dessous n'a été installé, appelé ou intégré à EKTS ; l'interopérabilité, les dépendances transitives et les versions à figer restent à tester. La liste n'est pas une recommandation d'installation. Elle complète l'[audit préliminaire](12_REALIGNEMENT_MVP4_AUDIT_PRELIMINAIRE.md).

**Méthode :** fiches GitHub officielles et métadonnées API des dépôts ; lectures ciblées des README et documentations indiqués. La colonne licence reprend la licence déclarée en métadonnées GitHub au 29/10/2026 : elle n'établit pas la licence de chaque fichier, compétence, modèle, jeu de données ou dépendance. Les dates correspondent au champ `pushed_at`, pas à une preuve de qualité, de sortie ou de maintenance garantie. `NOASSERTION` signifie que GitHub ne fournit pas d'identifiant SPDX reconnu, non que les droits sont libres.

L'utilisateur a confirmé : « TierFlow » désigne **DeerFlow**, « File Studio » désigne **VoiceStudio** et REA désigne **morluto/rea**. Il a demandé l'examen des autres dépôts ci-dessous.

## 1. Capacités agentiques prioritaires à étudier

| Solution et source officielle | Fonction revendiquée / intérêt à investiguer | Licence déclarée ; dernière activité | Stratégie candidate et réserves |
|---|---|---|---|
| [OpenCode](https://github.com/anomalyco/opencode) · [MCP](https://opencode.ai/docs/mcp-servers/) · [skills](https://opencode.ai/docs/skills/) | Agent de développement ; configuration de serveurs MCP locaux/distants, découverte de `SKILL.md`, permissions de chargement et chargement à la demande. | MIT ; 29/10/2026 | **Hôte candidat** : enregistrer EKTS et, si le scénario le justifie, un serveur d'outil indépendant dans le même agent. Pas encore testé avec EKTS ni sous Windows. Un grand catalogue MCP coûte du contexte. |
| [DeerFlow](https://github.com/bytedance/deer-flow) · [API](https://github.com/bytedance/deer-flow/blob/main/backend/docs/API.md) | Harness Python/Node documentant skills progressives, mémoire, sous-agents, sandbox et outils MCP. | MIT ; 29/10/2026 | Référence de gestion des métadonnées et de chargement progressif ; connexion possible via interfaces documentées, non testée. Déployer un harness complet serait probablement plus lourd qu'un hôte MCP simple pour une première démonstration : hypothèse à comparer, pas décision. |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) · [skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) · [catalogue officiel](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/optional-skills-catalog.md) | Agent et skills `SKILL.md`, sources externes, chargement progressif et catalogue optionnel ; le catalogue agrège aussi des contenus en amont. | MIT au dépôt ; 29/10/2026 | Référence pour installation/inspection d'une skill et sa provenance ; hôte alternatif éventuel. Vérifier séparément la licence et les dépendances de **chaque** skill, y compris les contenus tiers. Aucun échange EKTS/Hermes testé. |
| [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) · [documentation du dépôt](https://github.com/QwenLM/Qwen-Agent/tree/main/qwen-agent-docs) | Framework d'agents Python : appels de fonctions, MCP, interpréteur de code, RAG et extension navigateur selon le dépôt. | Apache-2.0 ; 04/03/2026 | Alternative pour intégration et patterns RAG ; processus séparé possible plutôt qu'import Python dans EKTS TypeScript. Comparer maintenance, modèles, coûts et environnement avant adoption ; pas testé. |
| [REA](https://github.com/morluto/rea) · [contrats MCP](https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md) | Analyse de sites, de JS/Electron et de binaires avec outils dédiés et preuves ; certaines catégories exigent des moteurs supplémentaires. | MIT ; 29/10/2026 | Candidate **optionnelle** via serveur MCP géré par l'hôte, si une tâche de rétro-ingénierie autorisée est retenue. Site public ≠ source du dépôt ≠ analyse dynamique d'applications ≠ droit de réutiliser des ressources. Examiner permissions, exécution et versions. |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Alternative officielle pour navigation et actions navigateur via MCP ; non équivalente à REA ni à un audit Lighthouse/axe. | Licence à vérifier directement avant usage ; activité constatée 22/10/2026 | Candidat si le scénario requiert réellement des interactions visibles. Comparer au navigateur EKTS et à REA, isoler données et traiter la page comme entrée non fiable. Aucune intégration testée. |
| [Agent Skills](https://agentskills.io/specification) | Spécification d'un répertoire `SKILL.md` avec frontmatter `name` et `description` obligatoires, fichiers additionnels optionnels et divulgation progressive. | Standard documentaire ; licence des ressources individuelles à déterminer séparément. | Référence de format, pas moteur d'exécution ni autorisation de lancer les scripts. Vérifier les différences réelles des clients avant d'annoncer une compatibilité. |

## 2. Autres dépôts indiqués par l'utilisateur

La qualification ci-dessous est un **tri initial**, pas une revue juridique ou technique complète ; toutes les options restent susceptibles d'évoluer en fonction du scénario approuvé.

| Source officielle | Capacité pertinente / rôle éventuel | Licence racine déclarée ; activité | Orientation préliminaire |
|---|---|---|---|
| [Fabric](https://github.com/danielmiessler/fabric) | Patterns et prompts réutilisables ; idées de catalogage et sélection. | MIT ; 26/10 | Examiner des patterns précis et leur provenance ; éviter l'import global sans contrôle. |
| [Oh My OpenAgent](https://github.com/code-yeongyu/oh-my-openagent) | Extension agentique et orchestration OpenCode. | `NOASSERTION` ; 29/10 | **Attention :** [licence SUL 1.0](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/LICENSE.md), restrictions notamment sur usage/distribution et licences tierces distinctes. Ne pas qualifier automatiquement de licence open source permissive ni copier ; analyse juridique avant tout usage. |
| [UI UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Compétence et données d'aide à la conception UI/UX. | MIT ; 26/10 | Candidate de corpus pour scénario frontend ; vérifier licence de chaque ressource, versions, prérequis, utilité et exemples avant toute adaptation. |
| [ECC](https://github.com/affaan-m/ECC) | Compétences, workflows, mémoire et contrôles pour agents de code selon le README. | MIT ; 26/10 | Sélection ciblée possible pour un workflow vérifiable ; valider les fichiers et dépendances concernés. |
| [Cloudflare security-audit-skill](https://github.com/cloudflare/security-audit-skill) | Skill d'audit de sécurité multi-phase, avec validation indépendante des constats. | MIT ; 14/09 | Référence de preuves et d'évaluation ; audit de sécurité seulement si besoin et autorisation. Ne pas assimiler au test d'accessibilité. |
| [Strix](https://github.com/usestrix/strix) | Agents de tests de pénétration actifs, susceptibles d'exécuter des preuves de concept. | Apache-2.0 ; 29/10 | Hors scénario initial sans besoin prouvé, permission explicite et environnement isolé ; aucun scan engagé. |
| [VoiceStudio](https://github.com/debpalash/VoiceStudio) | Studio vocal local ; README décrit API locale, MCP et recettes. | AGPL-3.0 ; 29/10 | Piste audio créative future si un cas utilisateur existe ; modèles/voix et données ont leurs propres licences et consentements. Étudier obligations AGPL selon le mode réel de distribution/service ; une interface séparée ne dispense pas automatiquement d'analyse. |
| [WanGP](https://github.com/deepbeepmeep/WanGP) | Génération multimédia locale avec modèles et GPU. | `NOASSERTION` ; 26/10 | Futur créatif éventuel ; analyser les termes effectifs du projet, des modèles et les ressources matérielles avant réutilisation. Ne pas déduire des droits du seul caractère « gratuit ». |
| [Agent Standup](https://github.com/Atoll92/agent-standup) | Visualisation locale de sessions et statuts d'agents. | MIT ; 28/10 | Observation/UX multi-agent éventuelle, pas démonstration de pertinence des ressources. |
| [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) | Agents et IA sur appareils personnels ; projet documente notamment des skills. | Apache-2.0 ; 28/10 | Alternative d'hôte local éventuelle ; dépendances et matériel à examiner, pas nécessaire par défaut. |
| [Spec Kit](https://github.com/github/spec-kit) | Outils de développement guidé par spécifications. | MIT ; 28/10 | Source de patterns d'acceptation, sans remplacer les conventions EKTS existantes. |
| [Awesome Public Datasets](https://github.com/awesomedata/awesome-public-datasets) | Index de jeux de données publics. | MIT pour l'index ; 28/10 | Les données liées ont chacune leurs conditions : ne pas inférer une licence de données depuis celle du catalogue. Peu pertinent sans jeu d'évaluation précis. |
| [OmniRoute](https://github.com/cheaper-inference/OmniRoute) | Passerelle de modèles/fournisseurs, API et interfaces indiquées dans le README. | MIT ; 29/10 | Alternative de routage éventuelle ; risque supplémentaire de secrets, dépendances et disponibilité. Comparer avec le routage déjà présent dans EKTS ; pas de besoin établi pour MVP-4. |
| [Topic motion-design](https://github.com/topics/motion-design) | Page thématique GitHub, **pas un dépôt unique** ni une licence commune. | Sans objet | Sélectionner au cas par cas les dépôts et leurs licences si un scénario motion le justifie. |

Pour les horodatages et licences racine, la source primaire est l'API officielle `https://api.github.com/repos/<propriétaire>/<dépôt>` ; les pages de chaque dépôt ci-dessus permettent aussi de consulter ses fichiers et son historique. Les README de certains projets ont changé rapidement ; figer un commit et relire les licences avant toute décision de réutilisation.

## 3. Comparaison initiale des modes d'intégration

| Option | Avantage potentiel | Limites et conditions |
|---|---|---|
| Bibliothèque/SDK | Contrats intégrés, sans processus supplémentaire. | Compatibilité runtime et licences transitive à établir ; Python → TypeScript potentiellement coûteux. |
| Skill/workflow sélectionné | Réutilisation de consignes et d'artefacts précis. | Licence par fichier, scripts non fiables, prérequis, provenance/version, prompt injection et revue humaine. |
| CLI | Isolation par processus et sortie structurée possible. | Versions installées, chemins Windows, permissions, timeouts, données et codes de sortie à vérifier. |
| API | Séparation et remplacement du fournisseur. | Authentification, disponibilité, coût, confidentialité, version et egress. |
| MCP via hôte | L'hôte peut connecter EKTS et un autre serveur sans qu'EKTS devienne lui-même client MCP ; réduit un développement potentiel. | Réellement tester l'hôte, les contrats, permissions, disponibilité et traçabilité de chaque appel ; plusieurs catalogues peuvent saturer le contexte. |
| Adaptateur EKTS | Cohérence et gouvernance si un besoin démontré l'exige. | Développement, maintenance et surface d'attaque supplémentaires ; ne pas l'imposer par principe. |
| Service externe | Pas de copie de code dans EKTS. | Un service n'efface ni conditions contractuelles ni risques de données et de disponibilité. |
| S'inspirer des concepts | Évite de copier des éléments non compatibles. | Ne pas reproduire des expressions, données ou éléments protégés sans droits ; documenter origine et décision. |

**Hypothèse à évaluer :** OpenCode comme hôte de référence, EKTS comme serveur de connaissances, et seulement si nécessaire un second serveur d'outils sous contrôle du même hôte. Cette architecture est documentée comme possible côté OpenCode, mais **n'est pas encore validée avec EKTS**. La valeur distinctive doit venir d'un corpus sélectionné, exploité et évalué, pas seulement d'un branchement MCP.

## 4. Recherche approfondie restante

- Lire, pour chaque candidat retenu par le scénario, documentation officielle détaillée, fichiers de licence et de dépendances, releases, exemples et limites ; enregistrer versions/commits vérifiés et alternatives.
- Examiner les catalogues de skills Hermes, DeerFlow, Fabric et ECC à l'échelle de **ressources précises**, pas d'un dépôt entier ; attribuer provenance, licence, compatibilité, entrées/sorties et permissions.
- Comparer en conditions réelles un hôte seul, un hôte avec EKTS, puis éventuellement un outil externe ; vérifier que les traces établissent l'utilisation effective des ressources.
- Évaluer les protocoles, droits, sécurité, coûts, restrictions de redistribution et configuration Windows. Identifier explicitement ce qui est impossible à vérifier.
- Intégrer ces conclusions à la roadmap officielle et aux sprints seulement après audit et contrôles humains. Ne copier aucun fichier tiers avant validation des droits.
