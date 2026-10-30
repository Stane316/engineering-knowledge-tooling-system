# 18 — Catalogue ciblé de dépôts et de skills

**Date :** 29 octobre 2026 · **Statut :** inventaire d’étude, pas un catalogue d’installations approuvées. Voir [analyse et recommandations](17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md).

La sélection contient **90 tentatives initiales** : 87 README lus à un SHA ; trois identités incorrectes corrigées plus bas (3 README supplémentaires). Les descriptions sont des résumés de repérage ou proviennent des métadonnées GitHub lorsqu’elles figurent dans la collecte ; elles peuvent reprendre la formulation du projet et ne sont pas une évaluation indépendante. Les chiffres, noms et licences évoluent.

† Licence issue d’une reconnaissance textuelle grossière du fichier racine, non validation juridique et non applicable automatiquement à tous les fichiers, données, modèles et dépendances. * Revue ciblée ou réserve explicite. Voir [observations détaillées](recherche-open-source-2026-10-29/licences-racine-observations.json), et **vérifier le fichier concerné avant toute réutilisation**. Trois faux positifs de la reconnaissance automatique ont été corrigés manuellement ; celle-ci peut en contenir d’autres. Aucun outil n’a été installé ou exécuté dans cette phase.

## Hôtes et agents

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [anomalyco/opencode](https://github.com/anomalyco/opencode/blob/d9ecbbc874dea02f0efffb4251b4095c0c490f9b/README.md) | Hôte agentique pour programmation, skills et serveurs MCP. | MIT† |
| [bytedance/deer-flow](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/README.md) | Harness agentique de recherche et de programmation ; sous-agents, outils et mémoire selon le dépôt. | MIT† |
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/README.md) | Agent et catalogue de skills ; sources et automatisation. | MIT† |
| [QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent/blob/31a4d36d123688581a9e9744427272b33ce940e0/README.md) | Framework d’agents Qwen avec fonctions, MCP et RAG selon le dépôt. | Apache-2.0† |
| [open-jarvis/OpenJarvis](https://github.com/open-jarvis/OpenJarvis/blob/336a68ac3b6206e3f3037c5c6d9d40722c4ab4cb/README.md) | Agents et IA personnelle sur appareils locaux. | Apache-2.0† |
| [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli/blob/718e97c2448e0384cb582409cf4e479437bf50fe/README.md) | Agent Gemini utilisable depuis un terminal. | Apache-2.0† |
| [block/goose](https://github.com/block/goose/blob/361003ea3263587f4241a0f906affdcc0d5c9c1f/README.md) | Agent de développement extensible avec outils. | Apache-2.0† |
| [All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands/blob/76ed10527eaf8ef8e106368d5fc3df94d6242497/README.md) | Plateforme d'agents pour travaux de développement. | MIT† |
| [microsoft/autogen](https://github.com/microsoft/autogen/blob/d07c667a3239ea4ab7af62a53b0f4ff205a1f23d/README.md) | Cadre d'agents et workflows multi-agents. | Doc CC BY 4.0 ; code MIT* |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph/blob/ffc3336367e8139668d11e5f0b0e6def57e7c762/README.md) | Orchestration de workflows et d'agents avec états. | MIT† |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI/blob/97bbfb64811775a965304bda45c8ec0e8e4ef3a2/README.md) | Framework d’orchestration multi-agent. | MIT† |

## Skills et corpus

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/README.md) | Skill et données de conseil pour conception UI/UX. | MIT† |
| [affaan-m/ECC](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/README.md) | Corpus de skills, workflows, mémoire et contrôles pour agents de code. | MIT† |
| [danielmiessler/fabric](https://github.com/danielmiessler/fabric/blob/bf8dcf728e5f39ec5b93958b667d678b3d3e7f1c/README.md) | Patterns réutilisables pour tâches assistées par modèle. | MIT† |
| [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent/blob/97ae220dcfddbd8f31afbd388a07b01d2c1723eb/README.md) | Orchestration et extension de l'hôte OpenCode. | SUL 1.0, restrictions* |
| [anthropics/skills](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/README.md) | Catalogue de skills ; licences différentes selon le fichier. | Par skill : mixte* |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/README.md) | Corpus de skills, notamment frontend et performances React. | MIT déclaré README ; racine absente* |
| [vercel-labs/skills](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/README.md) | Outil de découverte et de gestion de skills pour agents. | MIT† |
| [trailofbits/skills](https://github.com/trailofbits/skills/blob/2be6433b39e009cd2b6fd3be1895f6b1faa5af9a/README.md) | Corpus de skills orientées sécurité logicielle. | CC BY-SA 4.0, détails à vérifier* |
| [obra/superpowers](https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/README.md) | Méthode et framework de skills pour développement assisté. | MIT† |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill/blob/f9a8a041b85185ee4881b3471d3415e939aac772/README.md) | Principes de motion design : durée, easing et chorégraphie. | MIT† |
| [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/blob/9ff0c99108b36d3b886defd825d8ac1f47dba374/README.md) | Skills pour ingénierie du contexte et systèmes multi-agents. | MIT† |
| [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/README.md) | Skill de revue de sécurité ; contraintes d’isolation documentées. | MIT† |

## MCP, navigateurs et registres

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [morluto/rea](https://github.com/morluto/rea/blob/c0c3902207d6b1a33709e42b80c7e570da7db964/README.md) | Rétro-ingénierie et inspection d'artefacts et d'applications. | MIT† |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp/blob/0c4107acbecb75472b23c05c0e42471a0011874f/README.md) | Serveur MCP pour automatisation navigateur avec Playwright. | Apache-2.0† |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/blob/194cc86e3ae6400958555bd4116849d822d69263/README.md) | Exemples et serveurs de référence MCP. | Apache-2.0† |
| [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry/blob/e1c5d4e009b8ee671ce796226fb1659cacce485f/README.md) | Registre de métadonnées MCP, en preview. | Mixte MIT/Apache/CC BY* |
| [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector/blob/e3217388c8590bcf6796fd8d0528a875ade1ac1f/README.md) | Outils d’inspection et de test des serveurs MCP. | Apache-2.0† |
| [github/github-mcp-server](https://github.com/github/github-mcp-server/blob/f2a07cd13243ea9773a0ef42692e5b0e156f0951/README.md) | Serveur MCP officiel donnant accès aux fonctionnalités GitHub. | MIT† |
| [browser-use/browser-use](https://github.com/browser-use/browser-use/blob/2cc71890e65056b67fdb29d98bb407749c15bb08/README.md) | Automatisation navigateur pour agents. | MIT† |
| [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp/blob/a7842bed837359d03254f28781a645466d737be1/README.md) | Framework Python pour serveurs et clients MCP. | Apache-2.0† |
| [upstash/context7](https://github.com/upstash/context7/blob/eabe36965ec69b2f3487c4eb329c448dd60b817c/README.md) | Documentation de bibliothèques et frameworks pour agents. | MIT† |
| [open-webui/open-webui](https://github.com/open-webui/open-webui/blob/f7ac7ee10962ddec0017f5c29b6740d9b9c5faca/README.md) | Interface web pour modèles et outils d'IA. | BSD, variante à confirmer† |
| [tech-artist92/open-skill-registry](https://github.com/tech-artist92/open-skill-registry/blob/e2a51792132ec8311479e02de003d0e6dcaacd33/README.md) | Registre de skills : piste de découverte à qualifier. | Apache-2.0† |
| [iflytek/skillhub](https://github.com/iflytek/skillhub/blob/6c276d38fc770deedd881d26b0e2e11798cb332a/README.md) | Catalogue de skills : piste de découverte à qualifier. | Apache-2.0† |
| [lyonzin/knowledge-rag](https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/README.md) | Recherche sur connaissances et skills de citation et d'évaluation. | MIT† |

## Recherche, indexation et collecte

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [deepset-ai/haystack](https://github.com/deepset-ai/haystack/blob/4b5dd70fde2a53f1913b6856d77c6f9c1def6720/README.md) | Framework de recherche, RAG et orchestration. | Apache-2.0† |
| [run-llama/llama_index](https://github.com/run-llama/llama_index/blob/619d74664e8404612038bc15a1a40c686037277c/README.md) | Framework d'indexation et de recherche de données pour agents. | MIT† |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow/blob/a609e62d05d8d077d7698d3760dba2f1472d5c1c/README.md) | Moteur RAG et fonctions agentiques. | Apache-2.0† |
| [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG/blob/aaebfe1bb8d55deb6a4304d357a3bf4c92fcd40a/README.md) | Approche RAG avec structures de connaissances ; à évaluer. | MIT† |
| [microsoft/graphrag](https://github.com/microsoft/graphrag/blob/c600ff80b77b9b62c47d539a3ac9569e95d8949b/README.md) | Système RAG fondé sur graphes et indexation. | MIT† |
| [qdrant/qdrant](https://github.com/qdrant/qdrant/blob/222b2e44ab1c3f17e8246396ead6558e45041df7/README.md) | Base de données et moteur de recherche vectorielle. | Apache-2.0† |
| [chroma-core/chroma](https://github.com/chroma-core/chroma/blob/52ce8448cb38a498f1660d55ea80df25b78f000a/README.md) | Base et outils de recherche vectorielle. | Apache-2.0† |
| [sqlite/sqlite](https://github.com/sqlite/sqlite/blob/ad32a29d05e5a4610d842d0ccfc99af373b0a709/README.md) | Moteur de base de données relationnelle embarqué. | À vérifier |
| [sqliteai/sqlite-vec](https://github.com/sqliteai/sqlite-vec) | Identité initiale non résolue ; voir correction sqlite-vec plus bas. | À vérifier |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl/blob/33f295dc1f09133c02fc1e096d6685abda3464a7/README.md) | Collecte et extraction de contenu web pour agents. | AGPL, version à confirmer† |
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai/blob/888299fb5f0b82181897dc0e61bfb4b036f0aea5/README.md) | Crawler et extracteur web, y compris sortie adaptée aux modèles. | Apache-2.0† |
| [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling/blob/26dc85a4fa307257fb5c669c80aa44b15acb84c4/README.md) | Framework d’extraction et de parcours web ; accès et autorisations à examiner. | BSD, variante à confirmer† |
| [trafilatura/trafilatura](https://github.com/trafilatura/trafilatura) | Identité initiale non résolue ; voir correction Trafilatura plus bas. | À vérifier |
| [mozilla/readability](https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/README.md) | Extraction du contenu lisible d'une page. | Apache-2.0† |
| [jina-ai/reader](https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/README.md) | Service et outils d'extraction de contenu web ; analyser la confidentialité. | Apache-2.0† |

## Évaluation et observabilité

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [ethz-spylab/agentdojo](https://github.com/ethz-spylab/agentdojo/blob/089ed468cf3ed0322acc66b0211f26d9d90dbf60/README.md) | Benchmark d'agents et d'injections dans les résultats d'outils. | MIT† |
| [THUDM/AgentBench](https://github.com/THUDM/AgentBench/blob/d1e4a10db08c87075c78972e48ecc182be03e2d5/README.md) | Benchmark de tâches d'agents dans divers environnements. | Apache-2.0† |
| [SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench/blob/02e7a74ffd0b707aab73d203fe87bdc7c76afc8e/README.md) | Évaluation sur tâches de résolution de problèmes logiciels. | MIT† |
| [explodinggradients/ragas](https://github.com/explodinggradients/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/README.md) | Évaluation de systèmes RAG et d'applications d'IA. | Apache-2.0† |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo/blob/1b4dff170a589a31bbd57d4878e1abc59ef80655/README.md) | Évaluations et tests de sécurité d'applications utilisant des modèles. | MIT† |
| [confident-ai/deepeval](https://github.com/confident-ai/deepeval/blob/90e230cbe916c73240a48312c494065a39bf52d1/README.md) | Framework d’évaluation d’applications de modèles. | Apache-2.0† |
| [arize-ai/phoenix](https://github.com/arize-ai/phoenix/blob/57f93291eb40cfb14e89ba6fc7e5c11402ba7a6f/README.md) | Observabilité et évaluation d'applications IA ; licence restrictive. | Elastic 2.0, restrictions* |
| [langfuse/langfuse](https://github.com/langfuse/langfuse/blob/71ddcb9094f53d19176a262f107871d8b2950fb0/README.md) | Traces et évaluation d'applications de modèles. | MIT† |
| [diegoperezg7/evalsmith-mcp](https://github.com/diegoperezg7/evalsmith-mcp/blob/c8401ba81865732082aee5cea29724644d92ba6d/README.md) | Piste MCP pour évaluation ; fonctions et maturité à valider. | MIT† |
| [berkeley-function-calling-leaderboard/berkeley-function-calling-leaderboard](https://github.com/berkeley-function-calling-leaderboard/berkeley-function-calling-leaderboard) | Identité initiale non résolue ; BFCL se trouve dans Gorilla, voir plus bas. | À vérifier |

## Web et accessibilité

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse/blob/772c9e2781f7db0c0c8ff79567ee84e0a57b1bf6/readme.md) | Audits automatisés web, y compris performance et accessibilité. | Apache-2.0† |
| [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci/blob/dae03de65737f639a43636099d4c4c63af1d7834/README.md) | Exécution et suivi de mesures Lighthouse en CI. | Apache-2.0† |
| [dequelabs/axe-core](https://github.com/dequelabs/axe-core/blob/6b52b841461bd23345970b91ec75fdaff6bad31a/README.md) | Moteur de règles d'accessibilité web automatisées. | MPL-2.0* |
| [microsoft/playwright](https://github.com/microsoft/playwright/blob/38fb53bf4c181abb91f1ca2a2ab741983c5d177c/README.md) | Automatisation et tests de navigateurs. | Apache-2.0† |
| [pa11y/pa11y](https://github.com/pa11y/pa11y/blob/aede96f5c68c478b9354de3c838212a9dbe5c10e/README.md) | Outil de tests automatisés d'accessibilité. | LGPL v3, détails à vérifier* |
| [GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals/blob/e773747b90f0e8763aed02ba5a74358d628a828c/README.md) | Bibliothèque de mesure des indicateurs web réels. | Apache-2.0† |
| [WICG/inert](https://github.com/WICG/inert/blob/1cf31ea7b5bba1d77295b8aeb03243cc5ec11c9e/README.md) | Référence historique concernant inert et focus web. | À vérifier |
| [pbpyrojust/universal-accessibility-audit](https://github.com/pbpyrojust/universal-accessibility-audit/blob/a63c1d07b12a5e5a81098c9b419b14a4a198e500/README.md) | Piste d'audit d'accessibilité à qualifier indépendamment. | MIT† |
| [qalvinahmad/WCAG-mcp](https://github.com/qalvinahmad/WCAG-mcp/blob/d5e365c23b3f576682087f68f92cb1211c5ed241/README.md) | Piste de serveur MCP d'accessibilité à qualifier indépendamment. | MIT† |
| [squirrelscan/squirrelscan](https://github.com/squirrelscan/squirrelscan/blob/f89af3718f3e8d379248b4d2c7afbc0c62ca3344/README.md) | Piste d’audit web multipropriété ; règles et validation à examiner. | MIT† |
| [danielsogl/lighthouse-mcp-server](https://github.com/danielsogl/lighthouse-mcp-server/blob/62614f323c7bf457cc694387649fccb35acc46d9/README.md) | Piste de serveur MCP exposant des audits Lighthouse. | MIT† |

## Sécurité et chaîne logicielle

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [snyk/agent-scan](https://github.com/snyk/agent-scan/blob/a69e1c354ad0812c13da15dc64770e1c21786841/README.md) | Scanner de sécurité annoncé pour agents, serveurs MCP et skills. | Apache-2.0† |
| [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector/blob/54921c8c7c23008c8af2328d5ab492a904b6ece4/README.md) | Scanner de risques annoncé pour skills d’agents ; efficacité à mesurer. | Apache-2.0† |
| [openclaw/clawscan](https://github.com/openclaw/clawscan/blob/e14f9960cc290d47f99fd3416b0589bbc0080f24/README.md) | Piste d'inspection de sécurité d'agents/skills à qualifier. | MIT† |
| [pipelab-org/pipelock](https://github.com/pipelab-org/pipelock/blob/b3b8a88ea49f95dfb785557ddde50ed988d3b8e4/README.md) | Piste de sécurité d'agents et de contrôle réseau à qualifier. | Apache-2.0† |
| [usestrix/strix](https://github.com/usestrix/strix/blob/6b7ae2ebe4d47037a927aade23265ff4e4f27e84/README.md) | Tests de sécurité actifs par agents ; exigent une autorisation spécifique. | Apache-2.0† |
| [OWASP/ASVS](https://github.com/OWASP/ASVS/blob/9ccce0e3cf47abd6a412fc8a8deadd7fd6da501f/README.md) | Référentiel de vérification de sécurité applicative. | À vérifier |
| [OWASP/www-project-top-10-for-large-language-model-applications](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/blob/99f4395589bdbd120ae961f9cd179e79d7f9b27f/README.md) | Référentiel de risques pour applications utilisant des modèles. | À vérifier |
| [ossf/scorecard](https://github.com/ossf/scorecard/blob/2ef237f4e967d18e600e71aa36ab3be640314650/README.md) | Indicateurs de pratiques de sécurité des projets open source. | Apache-2.0† |
| [ossf/criticality_score](https://github.com/ossf/criticality_score/blob/0e76c6a99d865dddcbd89dff4117f0a54b1abfb8/README.md) | Indicateurs de criticité de projets open source. | Apache-2.0† |
| [anchore/syft](https://github.com/anchore/syft/blob/1998095808aad98fb3ec6e9a9ba55c170f126ec1/README.md) | Génération d'inventaires de composants logiciels, SBOM. | Apache-2.0† |

## Création, audio et autres

| Dépôt et README figé | Description de découverte | Licence racine / statut |
|---|---|---|
| [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio/blob/eb62684494132a4536b1b46823f90bce089b3217/README.md) | Studio local voix, transcription et doublage ; droits et consentement séparés. | AGPL, version à confirmer† |
| [deepbeepmeep/WanGP](https://github.com/deepbeepmeep/WanGP/blob/2e16ef7d1b9d84b646f6db8b767a4b386b5f0a5c/README.md) | Génération vidéo et multimédia locale ; licence communautaire restrictive. | WanGP Community 2.0, restrictions* |
| [theatre-js/theatre](https://github.com/theatre-js/theatre/blob/6ea82b938ea49609489f6377ded693ccc6ee8f5b/README.md) | Éditeur et outils de motion design pour le web. | Apache-2.0* |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion/blob/6d3de5bc4b3fc4a176679dd1b478d6d86485a00c/README.md) | Création programmatique de vidéos avec React ; licence restrictive. | Licence Remotion, restrictions* |
| [atoll92/agent-standup](https://github.com/atoll92/agent-standup/blob/0c4d6dd15d23e80103943e0bda23c91dd42cf36c/README.md) | Visualisation de sessions d'agents ; utilité à démontrer. | MIT† |
| [github/spec-kit](https://github.com/github/spec-kit/blob/03bba71b025ded8507c5e1451bdceab988bdebef/README.md) | Développement guidé par spécifications et tâches. | MIT† |
| [awesomedata/awesome-public-datasets](https://github.com/awesomedata/awesome-public-datasets/blob/e06679a8f04bc66c649da52f067bb92fd1614c88/README.rst) | Index de jeux de données aux licences individuelles. | MIT† |
| [cheaper-inference/OmniRoute](https://github.com/cheaper-inference/OmniRoute/blob/689b1eb573e21ea1bac4467c2ccfd9b8aaa7c518/README.md) | Passerelle multi-fournisseurs pour modèles ; sécurité des secrets à examiner. | MIT† |

## Corrections d’identité

| Tentative initiale non résolue | Source vérifiée | Observation |
|---|---|---|
| `sqliteai/sqlite-vec` | [asg017/sqlite-vec](https://github.com/asg017/sqlite-vec/blob/04d28bd21773981e2d266bbf6aa4efbd011eb4f6/README.md) | README lu au SHA `04d28bd21773` ; licence à vérifier au fichier et à la version. |
| `trafilatura/trafilatura` | [adbar/trafilatura](https://github.com/adbar/trafilatura/blob/5e5292fffe3009f218021575b05c2d2dcf6afc64/README.md) | README lu au SHA `5e5292fffe30` ; licence à vérifier au fichier et à la version. |
| `berkeley-function-calling-leaderboard/berkeley-function-calling-leaderboard` | [ShishirPatil/gorilla](https://github.com/ShishirPatil/gorilla/blob/6ea57973c7a6097fd7c5915698c54c17c5b1b6c8/README.md) | README lu au SHA `6ea57973c7a6` ; licence à vérifier au fichier et à la version. |

## 42 fichiers `SKILL.md` lus individuellement

Fichiers ciblés au commit décrit dans chaque lien. Le nom et la description ci-dessous proviennent du frontmatter et sont des **déclarations de la source** ; ne démontrent ni déclenchement par un agent, ni qualité, ni sécurité. Licences déclarées dans le fichier : `non indiquée` ne signifie pas « sans licence » ; les droits applicables peuvent être définis ailleurs. Les signaux réseau/scripts/terminal, la taille et les empreintes figurent dans [skills-selection.json](recherche-open-source-2026-10-29/skills-selection.json).

| Dépôt / fichier figé | Nom ou description (extrait) | Licence déclarée dans frontmatter |
|---|---|---|
| [bytedance/deer-flow · skills/public/deep-research/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/deep-research/SKILL.md) | Use this skill instead of WebSearch for ANY question requiring web research. Trigger on queries like "what is X", "explain X", "compare X and Y", "res | non indiquée |
| [bytedance/deer-flow · skills/public/github-deep-research/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/github-deep-research/SKILL.md) | Conduct multi-round deep research on any GitHub Repo. Use when users request comprehensive analysis, timeline reconstruction, competitive analysis, or | non indiquée |
| [bytedance/deer-flow · skills/public/code-documentation/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/code-documentation/SKILL.md) | Use this skill when the user requests to generate, create, or improve documentation for code, APIs, libraries, repositories, or software projects. Sup | non indiquée |
| [bytedance/deer-flow · skills/public/frontend-design/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/frontend-design/SKILL.md) | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, a | Complete terms in LICENSE.txt |
| [bytedance/deer-flow · skills/public/skill-reviewer/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/skill-reviewer/SKILL.md) | Reviews DeerFlow skill packages for readiness, triggers, safety boundaries, resources, and evidence. Invoke when users ask to audit, grade, or product | non indiquée |
| [bytedance/deer-flow · skills/public/find-skills/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/find-skills/SKILL.md) | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or e | non indiquée |
| [bytedance/deer-flow · skills/public/web-design-guidelines/SKILL.md](https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/skills/public/web-design-guidelines/SKILL.md) | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "chec | non indiquée |
| [NousResearch/hermes-agent · skills/research/grounded-citations/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/skills/research/grounded-citations/SKILL.md) | Ground answers and documents in cited, verifiable sources. | MIT |
| [NousResearch/hermes-agent · skills/software-development/github/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/skills/software-development/github/SKILL.md) | GitHub via gh CLI: PRs, issues, reviews, repos, auth. | MIT |
| [NousResearch/hermes-agent · optional-skills/research/scrapling/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/optional-skills/research/scrapling/SKILL.md) | Scrape sites with stealth browsing and Cloudflare bypass. | MIT |
| [NousResearch/hermes-agent · optional-skills/security/oss-forensics/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/optional-skills/security/oss-forensics/SKILL.md) | GitHub supply-chain forensics: recovery, IOCs, reporting. | MIT |
| [NousResearch/hermes-agent · optional-skills/dogfood/adversarial-ux-test/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/optional-skills/dogfood/adversarial-ux-test/SKILL.md) | Roleplay a hostile user to find and triage UX pain points. | MIT |
| [NousResearch/hermes-agent · optional-skills/web-development/scrollcraft/SKILL.md](https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/optional-skills/web-development/scrollcraft/SKILL.md) | Premium scroll-driven landing pages; scroll = timeline. | MIT |
| [affaan-m/ECC · skills/accessibility/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/accessibility/SKILL.md) | Design, implement, and audit accessible UI to WCAG 2.2 Level AA across Web, iOS, and Android — semantic ARIA roles and labels, accessibility traits an | non indiquée |
| [affaan-m/ECC · skills/deep-research/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/deep-research/SKILL.md) | Produce cited research reports from multiple web sources using firecrawl and exa MCP tools — plan sub-questions, search and deep-read sources, then sy | non indiquée |
| [affaan-m/ECC · skills/documentation-lookup/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/documentation-lookup/SKILL.md) | Use up-to-date library and framework docs via Context7 MCP instead of training data. Activates for setup questions, API references, code examples, or  | non indiquée |
| [affaan-m/ECC · skills/e2e-testing/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/e2e-testing/SKILL.md) | Playwright E2E testing patterns, Page Object Model, configuration, CI/CD integration, artifact management, and flaky test strategies. Use when writing | non indiquée |
| [affaan-m/ECC · skills/frontend-a11y/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/frontend-a11y/SKILL.md) | Accessibility patterns for React and Next.js — semantic HTML, ARIA attributes, form labeling, keyboard navigation, focus management, and screen reader | non indiquée |
| [affaan-m/ECC · skills/security-review/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/security-review/SKILL.md) | Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive featur | non indiquée |
| [affaan-m/ECC · skills/verification-loop/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/verification-loop/SKILL.md) | Run a six-phase verification of a Claude Code session's work — build, type check, lint, tests with coverage, security grep, and diff review — then pro | MIT |
| [affaan-m/ECC · skills/context-and-decisions/SKILL.md](https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/skills/context-and-decisions/SKILL.md) | Govern stable domain context with a narrowly scoped CONTEXT.md when needed, and route hard-to-reverse decisions to ECC's existing architecture-decisio | non indiquée |
| [nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/ui-ux-pro-max/SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/.claude/skills/ui-ux-pro-max/SKILL.md) | UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including | non indiquée |
| [nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/design-system/SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/.claude/skills/design-system/SKILL.md) | Token architecture, component specifications, and slide generation. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typograp | MIT |
| [nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/ui-styling/SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/.claude/skills/ui-styling/SKILL.md) | Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling, and canvas- | MIT |
| [morluto/rea · .agents/skills/reverse-engineer-anything/SKILL.md](https://github.com/morluto/rea/blob/c0c3902207d6b1a33709e42b80c7e570da7db964/.agents/skills/reverse-engineer-anything/SKILL.md) | Reverse engineer native, managed, Electron/JavaScript, packaged, firmware, and browser targets with REA, and build agent environments (AgentEnv bundle | non indiquée |
| [anthropics/skills · skills/webapp-testing/SKILL.md](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/webapp-testing/SKILL.md) | Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, ca | Complete terms in LICENSE.txt |
| [anthropics/skills · skills/pdf/SKILL.md](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/pdf/SKILL.md) | Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging  | Proprietary. LICENSE.txt has complete terms |
| [anthropics/skills · skills/frontend-design/SKILL.md](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/frontend-design/SKILL.md) | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and | Complete terms in LICENSE.txt |
| [anthropics/skills · skills/mcp-builder/SKILL.md](https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/skills/mcp-builder/SKILL.md) | Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.  | Complete terms in LICENSE.txt |
| [vercel-labs/agent-skills · skills/react-best-practices/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/react-best-practices/SKILL.md) | React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React | MIT |
| [vercel-labs/agent-skills · skills/web-design-guidelines/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines/SKILL.md) | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "chec | non indiquée |
| [vercel-labs/agent-skills · skills/deploy-to-vercel/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/deploy-to-vercel/SKILL.md) | Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push t | non indiquée |
| [vercel-labs/agent-skills · skills/composition-patterns/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/composition-patterns/SKILL.md) | React composition patterns that scale. Use when refactoring components with boolean prop proliferation, building flexible component libraries, or desi | MIT |
| [LottieFiles/motion-design-skill · skills/motion-design/SKILL.md](https://github.com/LottieFiles/motion-design-skill/blob/f9a8a041b85185ee4881b3471d3415e939aac772/skills/motion-design/SKILL.md) | Applies motion design principles to create emotionally-driven, technically sound animations and transitions. Provides timing, easing, choreography, an | MIT |
| [cloudflare/security-audit-skill · skills/security-audit/SKILL.md](https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/skills/security-audit/SKILL.md) | Security guidance and vulnerability review for codebases, APIs, services, CLI tools, libraries, and daemons. Use for security questions, focused revie | non indiquée |
| [lyonzin/knowledge-rag · skills/foundation/rag-check-first/SKILL.md](https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/skills/foundation/rag-check-first/SKILL.md) | Before answering any technical question, code request, architecture decision, or factual claim, call search_knowledge to check the local corpus. Trigg | non indiquée |
| [lyonzin/knowledge-rag · skills/foundation/rag-cite-sources/SKILL.md](https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/skills/foundation/rag-cite-sources/SKILL.md) | Every technical claim drawn from the local corpus must ship with a source citation formatted as path:line or path:section. Trigger whenever the respon | non indiquée |
| [lyonzin/knowledge-rag · skills/maintenance/rag-evaluate-quality/SKILL.md](https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/skills/maintenance/rag-evaluate-quality/SKILL.md) | Measure retrieval quality using evaluate_retrieval (MRR@5 and Recall@5) and get_index_stats. Use after ingestion, a model or configuration change, or  | non indiquée |
| [lyonzin/knowledge-rag · skills/workflow/rag-web-fallback/SKILL.md](https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/skills/workflow/rag-web-fallback/SKILL.md) | Only reach for external web search when the local corpus comes back empty or clearly insufficient. Forces the agent to try knowledge-rag first, then e | non indiquée |
| [debpalash/VoiceStudio · skills/voicestudio/SKILL.md](https://github.com/debpalash/VoiceStudio/blob/eb62684494132a4536b1b46823f90bce089b3217/skills/voicestudio/SKILL.md) | Generate local speech with saved or designed voices, transcribe audio, and automate dubbing or narration workflows through VoiceStudio's REST API or M | non indiquée |
| [deepbeepmeep/WanGP · shared/deepy/skills/web-research/SKILL.md](https://github.com/deepbeepmeep/WanGP/blob/2e16ef7d1b9d84b646f6db8b767a4b386b5f0a5c/shared/deepy/skills/web-research/SKILL.md) | Use before the first web search of a session, when a request needs facts, dates, names, current events, references, documentation or reference files t | non indiquée |
| [deepbeepmeep/WanGP · shared/deepy/skills/music-video/SKILL.md](https://github.com/deepbeepmeep/WanGP/blob/2e16ef7d1b9d84b646f6db8b767a4b386b5f0a5c/shared/deepy/skills/music-video/SKILL.md) | Make a music video - an original song, shots of a singer lip-synced to exact slices of it, edited so the song plays without skips, lyric subtitles and | non indiquée |

## Contrôles préalables à une réutilisation

1. Identifier fichier exact, SHA, source d’origine, modèle/dataset et licence ; conserver les notices applicables et examiner les éventuels droits d’auteur, de marque ou de voix.
2. Contrôler les instructions, scripts, dépendances, accès réseau, secrets et effets de bord ; ne pas activer globalement un ensemble découvert.
3. Décrire les conditions d’entrée/sortie, l’hôte et ses permissions ; conduire un test local isolé et tracer l’appel effectif.
4. Écarter tout projet ou usage dont les droits restent incertains ; obtenir un avis compétent pour les licences restrictives ou scénarios commerciaux.
