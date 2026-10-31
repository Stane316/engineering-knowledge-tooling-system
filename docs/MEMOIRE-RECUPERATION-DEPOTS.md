# Mémoire de récupération des dépôts externes

**Objet :** conserver, pour chaque source retenue, **l'URL exacte, la ref figée et
la licence**, afin qu'une phase d'intégration puisse réellement récupérer le
travail sans le rechercher à nouveau.

**Date :** 31 octobre 2026 · **Statut :** ✅ **mémoire établie** · ⏳ récupération
non autorisée à ce stade

---

## 1. Pourquoi ce document

Le propriétaire a demandé qu'« à un moment, il faudrait réellement récupérer »
le contenu des dépôts par URL. Sans ce mémoire, chaque phase d'intégration
rejouerait la recherche — et surtout, **sans ref figée, elle lirait un contenu
différent à chaque fois**, ce qui détruit la reproductibilité que le sprint 22 a
construite.

**Règle :** on ne récupère jamais « la branche `main` ». On récupère un
**commit précis**, dont l'empreinte est vérifiable.

## 2. Ce que « récupérer » veut dire, par ordre de permission

| Étape | Acte | Autorisation |
| --- | --- | --- |
| 1 | **lire** un fichier à une ref figée (API GitHub, `raw.githubusercontent.com`) | couverte par l'option E (note 28), à implémenter en S25 |
| 2 | **référencer** (URL + SHA + date + licence) dans le corpus | idem |
| 3 | **copier** le texte dans le corpus local | seulement si `droits.statut = 'verifiee'` et licence compatible |
| 4 | **installer** le package | 🚫 hors périmètre |
| 5 | **exécuter** script, skill, hook | 🚫 hors périmètre |
| 6 | **scanner** activement une cible | 🚫 hors périmètre, accord explicite |

## 3. Sources prioritaires (R1) et secondaires (R2/R3)

Détail complet, chemins et limites : `docs/audit/produit/18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md`.
Les refs ci-dessous sont celles du catalogue audité le 29/10/2026.

| Priorité | Dépôt | Ref figée | Licence racine | Usage prévu |
| --- | --- | --- | --- | --- |
| **R1** | `bytedance/deer-flow` | `81e1ab8dcc86` | MIT | recherche + chargement progressif de skills |
| **R1** | `NousResearch/hermes-agent` | `fcc26fbd9f16` | MIT (dépôt) | citations sourcées, `SKILL.md` |
| **R1** | `affaan-m/ECC` | `25278e7d7b6c` | MIT | méthodologie de vérification |
| **R1** | `anomalyco/opencode` | `d9ecbbc874de` | MIT | **hôte de référence** (S26) |
| **R2** | `QwenLM/Qwen-Agent` | `31a4d36d1236` | Apache-2.0 | hôte Python, patterns RAG |
| **R2** | `morluto/rea` | `c0c3902207d6` | à vérifier | observation passive |
| **R2** | `danielmiessler/fabric` | `bf8dcf728e5f` | MIT | patterns à l'unité |
| **R2** | `nextlevelbuilder/ui-ux-pro-max-skill` | `28b3b8dee8c9` | MIT | heuristiques UI |
| **R2** | `cloudflare/security-audit-skill` | `c1c8a8c14710` | MIT | validation de constats |
| **R2** | `open-jarvis/OpenJarvis` | `336a68ac3b62` | Apache-2.0 | hôte local alternatif |
| **R2** | `github/spec-kit` | à confirmer | à vérifier | inspiration des critères |
| **R3** | `debpalash/VoiceStudio` | voir note 18 | **AGPL-3.0** | audio futur, obligations à instruire |
| **R3** | `code-yeongyu/oh-my-openagent` | `97ae220dcfdd` | **SUL 1.0 restrictive** | concepts seulement |
| **R3** | `deepbeepmeep/WanGP` | voir note 18 | **restrictive** | hors corpus |
| **R3** | `usestrix/strix` | voir note 18 | à vérifier | tests actifs : exclu sans accord |
| **R3** | `Atoll92/agent-standup` | voir note 18 | à vérifier | visualisation facultative |
| **R3** | `awesomedata/awesome-public-datasets` | voir note 18 | index | licences par jeu de données |
| **R3** | `cheaper-inference/OmniRoute` | voir note 18 | à vérifier | passerelle, coûts/secrets |
| **R3** | `paperclipai/paperclip` | voir note 18 | à vérifier | orchestration + budgets |

> **Lacune déclarée :** `TierFlow` et `Quen Agents` n'ont **pas d'identité
> confirmée** dans le catalogue. Je ne leur attribue aucune URL. Une décision du
> propriétaire est nécessaire (V2 de la révision).

## 4. Protocole de récupération proposé (par phase dédiée)

Chaque phase est un sous-sprint, avec commit + push et rapport.

| Phase | Objet | Prérequis | Critère de sortie |
| --- | --- | --- | --- |
| **P0** | mémoire gelée (ce document) | aucune | 90 refs consignées ✅ |
| **P1** | lecture seule d'un fichier à ref figée (S25-01) | option E validée (E1) | LC-01→LC-07 verts |
| **P2** | qualification licence → refus (S25-02) | P1 | LC-08/LC-09 verts |
| **P3** | import gouverné + démonstration (S25-03) | P2 | corpus réel admis, 0 ressource sans droits |
| **P4** | connexion OpenCode (S26) | P3 | 3/3 outils visibles, 14/14 refusés |
| **P5** | Hermes + corpus de skills (S27) | P3 | `SKILL.md` identifiables |
| **P6** | validation de valeur G2/G3 (S28) | P4, P5 | B−A et B−C rapportés |

## 5. Procédure technique de récupération (à titre de référence)

Lecture d'un fichier à une ref figée, sans clé, sans installation :

```powershell
# GitHub : contenu brut d'un fichier à un commit précis
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/NousResearch/hermes-agent/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/skills/research/grounded-citations/SKILL.md" -OutFile ".\skill.md"

# Vérification d'empreinte (le manifeste du sprint 22 sait le faire)
# -> la ressource est refusée si le SHA-256 ne correspond pas
```

**Ne pas** utiliser `git clone` d'un dépôt entier dans le corpus : cela copie du
code sans qualification de licence et sans borne de périmètre.

## 6. État des récupérations

| Dépôt | Récupéré | Empreinte vérifiée | Admis au corpus |
| --- | --- | --- | --- |
| *aucun* | — | — | — |

**Zéro récupération à ce jour.** Ce document prépare ; il n'exécute pas. La
récupération commence à P1, après validation de E1.

---

## Annexe — les 90 dépôts audités et leur ref figée

Sources : `docs/audit/produit/18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md` et
`recherche-open-source-2026-10-29/`. Les SHA sont tronqués à 12 caractères pour
la lisibilité ; les 40 caractères complets figurent dans le catalogue.

| Dépôt | Ref figée (12 car.) | URL de lecture |
| --- | --- | --- |
| `All-Hands-AI/OpenHands` | `76ed10527eaf` | https://github.com/All-Hands-AI/OpenHands/blob/76ed10527eaf8ef8e106368d5fc3df94d6242497/README.md |
| `D4Vinci/Scrapling` | `26dc85a4fa30` | https://github.com/D4Vinci/Scrapling/blob/26dc85a4fa307257fb5c669c80aa44b15acb84c4/README.md |
| `GoogleChrome/lighthouse` | `772c9e2781f7` | https://github.com/GoogleChrome/lighthouse/blob/772c9e2781f7db0c0c8ff79567ee84e0a57b1bf6/README.md |
| `GoogleChrome/lighthouse-ci` | `dae03de65737` | https://github.com/GoogleChrome/lighthouse-ci/blob/dae03de65737f639a43636099d4c4c63af1d7834/README.md |
| `GoogleChrome/web-vitals` | `e773747b90f0` | https://github.com/GoogleChrome/web-vitals/blob/e773747b90f0e8763aed02ba5a74358d628a828c/README.md |
| `HKUDS/LightRAG` | `aaebfe1bb8d5` | https://github.com/HKUDS/LightRAG/blob/aaebfe1bb8d55deb6a4304d357a3bf4c92fcd40a/README.md |
| `LottieFiles/motion-design-skill` | `f9a8a041b851` | https://github.com/LottieFiles/motion-design-skill/blob/f9a8a041b85185ee4881b3471d3415e939aac772/README.md |
| `NVIDIA/SkillSpector` | `54921c8c7c23` | https://github.com/NVIDIA/SkillSpector/blob/54921c8c7c23008c8af2328d5ab492a904b6ece4/README.md |
| `NousResearch/hermes-agent` | `fcc26fbd9f16` | https://github.com/NousResearch/hermes-agent/blob/fcc26fbd9f1641755e49793d7ed608f3b7214c3d/README.md |
| `OWASP/ASVS` | `9ccce0e3cf47` | https://github.com/OWASP/ASVS/blob/9ccce0e3cf47abd6a412fc8a8deadd7fd6da501f/README.md |
| `OWASP/www-project-top-10-for-large-language-model-applications` | `99f4395589bd` | https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/blob/99f4395589bdbd120ae961f9cd179e79d7f9b27f/README.md |
| `PrefectHQ/fastmcp` | `a7842bed8373` | https://github.com/PrefectHQ/fastmcp/blob/a7842bed837359d03254f28781a645466d737be1/README.md |
| `QwenLM/Qwen-Agent` | `31a4d36d1236` | https://github.com/QwenLM/Qwen-Agent/blob/31a4d36d123688581a9e9744427272b33ce940e0/README.md |
| `SWE-bench/SWE-bench` | `02e7a74ffd0b` | https://github.com/SWE-bench/SWE-bench/blob/02e7a74ffd0b707aab73d203fe87bdc7c76afc8e/README.md |
| `ShishirPatil/gorilla` | `6ea57973c7a6` | https://github.com/ShishirPatil/gorilla/blob/6ea57973c7a6097fd7c5915698c54c17c5b1b6c8/README.md |
| `THUDM/AgentBench` | `d1e4a10db08c` | https://github.com/THUDM/AgentBench/blob/d1e4a10db08c87075c78972e48ecc182be03e2d5/README.md |
| `WICG/inert` | `1cf31ea7b5bb` | https://github.com/WICG/inert/blob/1cf31ea7b5bba1d77295b8aeb03243cc5ec11c9e/README.md |
| `adbar/trafilatura` | `5e5292fffe30` | https://github.com/adbar/trafilatura/blob/5e5292fffe3009f218021575b05c2d2dcf6afc64/README.md |
| `affaan-m/ECC` | `25278e7d7b6c` | https://github.com/affaan-m/ECC/blob/25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b/README.md |
| `anchore/syft` | `1998095808aa` | https://github.com/anchore/syft/blob/1998095808aad98fb3ec6e9a9ba55c170f126ec1/README.md |
| `anomalyco/opencode` | `d9ecbbc874de` | https://github.com/anomalyco/opencode/blob/d9ecbbc874dea02f0efffb4251b4095c0c490f9b/README.md |
| `anthropics/skills` | `ca45fc496a34` | https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/README.md |
| `arize-ai/phoenix` | `57f93291eb40` | https://github.com/arize-ai/phoenix/blob/57f93291eb40cfb14e89ba6fc7e5c11402ba7a6f/README.md |
| `asg017/sqlite-vec` | `04d28bd21773` | https://github.com/asg017/sqlite-vec/blob/04d28bd21773981e2d266bbf6aa4efbd011eb4f6/README.md |
| `atoll92/agent-standup` | `0c4d6dd15d23` | https://github.com/atoll92/agent-standup/blob/0c4d6dd15d23e80103943e0bda23c91dd42cf36c/README.md |
| `awesomedata/awesome-public-datasets` | `e06679a8f04b` | https://github.com/awesomedata/awesome-public-datasets/blob/e06679a8f04bc66c649da52f067bb92fd1614c88/README.md |
| `block/goose` | `361003ea3263` | https://github.com/block/goose/blob/361003ea3263587f4241a0f906affdcc0d5c9c1f/README.md |
| `browser-use/browser-use` | `2cc71890e650` | https://github.com/browser-use/browser-use/blob/2cc71890e65056b67fdb29d98bb407749c15bb08/README.md |
| `bytedance/deer-flow` | `81e1ab8dcc86` | https://github.com/bytedance/deer-flow/blob/81e1ab8dcc86574cfac0ecdfe3636b775a08c567/README.md |
| `cheaper-inference/OmniRoute` | `689b1eb573e2` | https://github.com/cheaper-inference/OmniRoute/blob/689b1eb573e21ea1bac4467c2ccfd9b8aaa7c518/README.md |
| `chroma-core/chroma` | `52ce8448cb38` | https://github.com/chroma-core/chroma/blob/52ce8448cb38a498f1660d55ea80df25b78f000a/README.md |
| `cloudflare/security-audit-skill` | `c1c8a8c14710` | https://github.com/cloudflare/security-audit-skill/blob/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8/README.md |
| `code-yeongyu/oh-my-openagent` | `97ae220dcfdd` | https://github.com/code-yeongyu/oh-my-openagent/blob/97ae220dcfddbd8f31afbd388a07b01d2c1723eb/README.md |
| `confident-ai/deepeval` | `90e230cbe916` | https://github.com/confident-ai/deepeval/blob/90e230cbe916c73240a48312c494065a39bf52d1/README.md |
| `crewAIInc/crewAI` | `97bbfb648117` | https://github.com/crewAIInc/crewAI/blob/97bbfb64811775a965304bda45c8ec0e8e4ef3a2/README.md |
| `danielmiessler/fabric` | `bf8dcf728e5f` | https://github.com/danielmiessler/fabric/blob/bf8dcf728e5f39ec5b93958b667d678b3d3e7f1c/README.md |
| `danielsogl/lighthouse-mcp-server` | `62614f323c7b` | https://github.com/danielsogl/lighthouse-mcp-server/blob/62614f323c7bf457cc694387649fccb35acc46d9/README.md |
| `debpalash/VoiceStudio` | `eb6268449413` | https://github.com/debpalash/VoiceStudio/blob/eb62684494132a4536b1b46823f90bce089b3217/README.md |
| `deepbeepmeep/WanGP` | `2e16ef7d1b9d` | https://github.com/deepbeepmeep/WanGP/blob/2e16ef7d1b9d84b646f6db8b767a4b386b5f0a5c/README.md |
| `deepset-ai/haystack` | `4b5dd70fde2a` | https://github.com/deepset-ai/haystack/blob/4b5dd70fde2a53f1913b6856d77c6f9c1def6720/README.md |
| `dequelabs/axe-core` | `6b52b841461b` | https://github.com/dequelabs/axe-core/blob/6b52b841461bd23345970b91ec75fdaff6bad31a/README.md |
| `diegoperezg7/evalsmith-mcp` | `c8401ba81865` | https://github.com/diegoperezg7/evalsmith-mcp/blob/c8401ba81865732082aee5cea29724644d92ba6d/README.md |
| `ethz-spylab/agentdojo` | `089ed468cf3e` | https://github.com/ethz-spylab/agentdojo/blob/089ed468cf3ed0322acc66b0211f26d9d90dbf60/README.md |
| `explodinggradients/ragas` | `298b68274234` | https://github.com/explodinggradients/ragas/blob/298b68274234c060deacab3cf5fb52aa3a20e885/README.md |
| `firecrawl/firecrawl` | `33f295dc1f09` | https://github.com/firecrawl/firecrawl/blob/33f295dc1f09133c02fc1e096d6685abda3464a7/README.md |
| `github/github-mcp-server` | `f2a07cd13243` | https://github.com/github/github-mcp-server/blob/f2a07cd13243ea9773a0ef42692e5b0e156f0951/README.md |
| `github/spec-kit` | `03bba71b025d` | https://github.com/github/spec-kit/blob/03bba71b025ded8507c5e1451bdceab988bdebef/README.md |
| `google-gemini/gemini-cli` | `718e97c2448e` | https://github.com/google-gemini/gemini-cli/blob/718e97c2448e0384cb582409cf4e479437bf50fe/README.md |
| `iflytek/skillhub` | `6c276d38fc77` | https://github.com/iflytek/skillhub/blob/6c276d38fc770deedd881d26b0e2e11798cb332a/README.md |
| `infiniflow/ragflow` | `a609e62d05d8` | https://github.com/infiniflow/ragflow/blob/a609e62d05d8d077d7698d3760dba2f1472d5c1c/README.md |
| `jina-ai/reader` | `1574bfd380d2` | https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/README.md |
| `langchain-ai/langgraph` | `ffc3336367e8` | https://github.com/langchain-ai/langgraph/blob/ffc3336367e8139668d11e5f0b0e6def57e7c762/README.md |
| `langfuse/langfuse` | `71ddcb9094f5` | https://github.com/langfuse/langfuse/blob/71ddcb9094f53d19176a262f107871d8b2950fb0/README.md |
| `lyonzin/knowledge-rag` | `c28772eec31f` | https://github.com/lyonzin/knowledge-rag/blob/c28772eec31f6bb407918f497767965df0a9c2c4/README.md |
| `microsoft/autogen` | `d07c667a3239` | https://github.com/microsoft/autogen/blob/d07c667a3239ea4ab7af62a53b0f4ff205a1f23d/README.md |
| `microsoft/graphrag` | `c600ff80b77b` | https://github.com/microsoft/graphrag/blob/c600ff80b77b9b62c47d539a3ac9569e95d8949b/README.md |
| `microsoft/playwright` | `38fb53bf4c18` | https://github.com/microsoft/playwright/blob/38fb53bf4c181abb91f1ca2a2ab741983c5d177c/README.md |
| `microsoft/playwright-mcp` | `0c4107acbecb` | https://github.com/microsoft/playwright-mcp/blob/0c4107acbecb75472b23c05c0e42471a0011874f/README.md |
| `modelcontextprotocol/inspector` | `e3217388c859` | https://github.com/modelcontextprotocol/inspector/blob/e3217388c8590bcf6796fd8d0528a875ade1ac1f/README.md |
| `modelcontextprotocol/registry` | `e1c5d4e009b8` | https://github.com/modelcontextprotocol/registry/blob/e1c5d4e009b8ee671ce796226fb1659cacce485f/README.md |
| `modelcontextprotocol/servers` | `194cc86e3ae6` | https://github.com/modelcontextprotocol/servers/blob/194cc86e3ae6400958555bd4116849d822d69263/README.md |
| `morluto/rea` | `c0c3902207d6` | https://github.com/morluto/rea/blob/c0c3902207d6b1a33709e42b80c7e570da7db964/README.md |
| `mozilla/readability` | `ab4027a8b376` | https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/README.md |
| `muratcankoylan/Agent-Skills-for-Context-Engineering` | `9ff0c99108b3` | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/blob/9ff0c99108b36d3b886defd825d8ac1f47dba374/README.md |
| `nextlevelbuilder/ui-ux-pro-max-skill` | `28b3b8dee8c9` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/28b3b8dee8c976df4fa3e94aed4e092ad43fcb03/README.md |
| `obra/superpowers` | `2ce8aa15d05b` | https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/README.md |
| `open-jarvis/OpenJarvis` | `336a68ac3b62` | https://github.com/open-jarvis/OpenJarvis/blob/336a68ac3b6206e3f3037c5c6d9d40722c4ab4cb/README.md |
| `open-webui/open-webui` | `f7ac7ee10962` | https://github.com/open-webui/open-webui/blob/f7ac7ee10962ddec0017f5c29b6740d9b9c5faca/README.md |
| `openclaw/clawscan` | `e14f9960cc29` | https://github.com/openclaw/clawscan/blob/e14f9960cc290d47f99fd3416b0589bbc0080f24/README.md |
| `ossf/criticality_score` | `0e76c6a99d86` | https://github.com/ossf/criticality_score/blob/0e76c6a99d865dddcbd89dff4117f0a54b1abfb8/README.md |
| `ossf/scorecard` | `2ef237f4e967` | https://github.com/ossf/scorecard/blob/2ef237f4e967d18e600e71aa36ab3be640314650/README.md |
| `pa11y/pa11y` | `aede96f5c68c` | https://github.com/pa11y/pa11y/blob/aede96f5c68c478b9354de3c838212a9dbe5c10e/README.md |
| `pbpyrojust/universal-accessibility-audit` | `a63c1d07b12a` | https://github.com/pbpyrojust/universal-accessibility-audit/blob/a63c1d07b12a5e5a81098c9b419b14a4a198e500/README.md |
| `pipelab-org/pipelock` | `b3b8a88ea49f` | https://github.com/pipelab-org/pipelock/blob/b3b8a88ea49f95dfb785557ddde50ed988d3b8e4/README.md |
| `promptfoo/promptfoo` | `1b4dff170a58` | https://github.com/promptfoo/promptfoo/blob/1b4dff170a589a31bbd57d4878e1abc59ef80655/README.md |
| `qalvinahmad/WCAG-mcp` | `d5e365c23b3f` | https://github.com/qalvinahmad/WCAG-mcp/blob/d5e365c23b3f576682087f68f92cb1211c5ed241/README.md |
| `qdrant/qdrant` | `222b2e44ab1c` | https://github.com/qdrant/qdrant/blob/222b2e44ab1c3f17e8246396ead6558e45041df7/README.md |
| `remotion-dev/remotion` | `6d3de5bc4b3f` | https://github.com/remotion-dev/remotion/blob/6d3de5bc4b3fc4a176679dd1b478d6d86485a00c/README.md |
| `run-llama/llama_index` | `619d74664e84` | https://github.com/run-llama/llama_index/blob/619d74664e8404612038bc15a1a40c686037277c/README.md |
| `snyk/agent-scan` | `a69e1c354ad0` | https://github.com/snyk/agent-scan/blob/a69e1c354ad0812c13da15dc64770e1c21786841/README.md |
| `sqlite/sqlite` | `ad32a29d05e5` | https://github.com/sqlite/sqlite/blob/ad32a29d05e5a4610d842d0ccfc99af373b0a709/README.md |
| `squirrelscan/squirrelscan` | `f89af3718f3e` | https://github.com/squirrelscan/squirrelscan/blob/f89af3718f3e8d379248b4d2c7afbc0c62ca3344/README.md |
| `tech-artist92/open-skill-registry` | `e2a51792132e` | https://github.com/tech-artist92/open-skill-registry/blob/e2a51792132ec8311479e02de003d0e6dcaacd33/README.md |
| `theatre-js/theatre` | `6ea82b938ea4` | https://github.com/theatre-js/theatre/blob/6ea82b938ea49609489f6377ded693ccc6ee8f5b/README.md |
| `trailofbits/skills` | `2be6433b39e0` | https://github.com/trailofbits/skills/blob/2be6433b39e009cd2b6fd3be1895f6b1faa5af9a/README.md |
| `unclecode/crawl4ai` | `888299fb5f0b` | https://github.com/unclecode/crawl4ai/blob/888299fb5f0b82181897dc0e61bfb4b036f0aea5/README.md |
| `upstash/context7` | `eabe36965ec6` | https://github.com/upstash/context7/blob/eabe36965ec69b2f3487c4eb329c448dd60b817c/README.md |
| `usestrix/strix` | `6b7ae2ebe4d4` | https://github.com/usestrix/strix/blob/6b7ae2ebe4d47037a927aade23265ff4e4f27e84/README.md |
| `vercel-labs/agent-skills` | `1a2c79d4e6c4` | https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/README.md |
| `vercel-labs/skills` | `92a9a34ac3bf` | https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/README.md |
