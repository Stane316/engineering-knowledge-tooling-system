# DRI 06 — AI RESOURCE MAP
### Kits IA, MCP, Skills, prompts, orchestrateurs, observabilité, agents de code et builders
**5 octobre 2026** · Natures N20–N25 (doc 02) · Indexation spéciale imposée : outils exposés, install, clients compatibles, permissions, risques, licence, maintenance, popularité, dernière activité

> **Avertissement structurel** : la couche IA est **la plus mouvante du Web en 2026** — rachats, archivages, renommages et fusions d'outils sont documentés sur la période (Cursor/Continue, Gemini CLI → Antigravity, renommage de Vercel AI Chatbot, arrêt de mises à jour de Chatbot UI depuis 2024, Aider « dormant » selon une source) [W]. **Aucune décision d'architecture ne devrait reposer sur un seul outil de cette famille sans plan de sortie.**

---

# 6.1 Couche 1 — Kits et composants UI pour produits IA

| Ressource | Nature | Ce qu'elle fournit | Install | Licence | Preuves | AI-readiness |
|---|---|---|---|---|---|---|
| **AI Elements (Vercel)** | N20 | conversation, message, prompt input, **reasoning**, **sources/citations**, tool calls, workflows, voix — sur shadcn/ui + AI SDK | `npx shadcn add` (registry) | Apache-2.0 annoncé [W] | [W] | 4 |
| **assistant-ui** | N20 | primitives headless + **runtime** (streaming, threads, branching, pièces jointes, tool calls) + adaptateurs AI SDK / LangGraph Cloud / LangChain / Mastra ; React Native | `npm i` | MIT [W] | dépôt **12 410★**, poussée 2026-10-05 [API-gh] | 3 |
| **CopilotKit** | N20 | copilotes **dans l'application** : actions frontend, partage d'état, orchestration d'agents | `npm i` | MIT [W] | **37 765★**, poussée 2026-10-05 [API-gh] | 3 |
| **prompt-kit** | N20 | briques chat/prompt (container, markdown, reasoning, sources, MCP, chaîne de pensée) | copie/registry | MIT [W] | [W] | 4 |
| **Ant Design X** | N20 | composants IA d'Ant Design | npm | MIT [W] | [W] | 3 |
| **Chainlit** | N20 | UI de chat depuis un backend **Python** | `pip install` | Apache-2.0 [W] | [W] | 3 |
| **Vercel AI SDK** | N18/N20 | couche d'abstraction modèles + streaming + outils + RSC ; **AI Gateway** multi-fournisseurs | `npm i ai` | licence du dépôt : **NOASSERTION** [API-gh] → vérifier ; paquet publié sous Apache/MIT selon docs [?] | dépôt **27 128★**, poussée 2026-10-05 [API-gh] | 4 |
| **LibreChat / Open WebUI / LobeHub / Chatbot UI** | N24 (app complète) | chats auto-hébergés multi-modèles | docker | MIT / custom / community [W] | **Chatbot UI : plus de mise à jour depuis 2024** ; LobeHub = licence communautaire [W] | 3 |
| **scrimui / ElevenLabs UI / shadcn-chat / NLUX / Deep Chat** | N20 | pépite Tier C : composants IA (68 items), audio/voix/agents, chat shadcn, web-component agnostique | registry/npm | OSS [W/V] | [V] | 3–4 |

**Guide de choix rapide** : *chat complet à forker* → Vercel Chatbot (Apache-2.0 annoncé, 20 990★ [API-gh]) ; *composants shadcn* → AI Elements ou prompt-kit ; *chat dans une app existante sans shadcn* → assistant-ui ; *l'IA doit agir dans le produit* → CopilotKit ; *backend Python* → Chainlit.

---

# 6.2 Couche 2 — MCP (Model Context Protocol)

### 6.2.1 L'écosystème en chiffres (2026)
| Élément | Donnée vérifiée |
|---|---|
| Registre officiel | `registry.modelcontextprotocol.io` — **gratuit, sans revue**, publication via CLI `mcp-publisher` + `server.json`, espaces de noms **vérifiés par DNS**, support des serveurs **remote** (`remotes`) [W] |
| Effet de réseau | Publier dans le registre officiel suffit à apparaître sur Glama, mcp.directory et PulseMCP (crawl automatique) [W] |
| Directories | mcp.so ≈ 20 222 serveurs (avril 2026) · Glama ≈ 21 K · PulseMCP 11 K+ · Smithery 7 K+ · mcpservers.org 9 800+ · ClaudePluginHub 65 K plugins · **PulseMCP en pause jusqu'à mi-août 2026** [W] |
| Serveurs **remote** officiels listés | **1 322** (Notion, Linear, Sentry, Stripe, Netlify, Credit Karma, ContentStudio, AWS Marketplace…) [W] |
| Transport dominant | **59 % des builders MCP utilisent Streamable HTTP** vs 34 % stdio (enquête Zuplo, déc. 2025) [W] |
| Liste curatée de référence | punkpeye/awesome-mcp-servers — **95 845★, MIT** [API-gh] ; PR accélérées pour agents [W] |
| Curation vs collection | Les listes « best-of » (~400 serveurs triés sur 34 catégories) sont plus utiles que les index bruts [W] |

### 6.2.2 Fiches MCP (format imposé)

| Serveur | Outils / ressources exposés | Install | Clients compatibles | Permissions | Risques | Licence | Maintenance / popularité |
|---|---|---|---|---|---|---|---|
| **GitHub MCP (officiel)** | dépôts, issues, PR, CI | remote HTTP + stdio | Claude Code, Cursor, VS Code, autres | **lecture/écriture sur dépôts** | actions destructrices sur code ; fuite de code privé | propriétaire (service) | officiel, transport stdio+HTTP [W] |
| **Playwright MCP (Microsoft)** | navigation, formulaires, assertions, captures via **arbre d'accessibilité** | `npx @playwright/mcp` (stdio) | Claude Code, Cursor | pilote un **navigateur réel**, sessions/cookies | accès à des pages authentifiées ; exfiltration de contenu | **Apache-2.0** | **37 836★**, poussée 2026-09-28 [API-gh] |
| **Chrome DevTools MCP** | Console, Network, **Performance Profiler** (diagnostic LCP, erreurs) | `npx` stdio | agents locaux | inspection de page, profils | données de navigation, contenus | **Apache-2.0** | **53 002★**, poussée 2026-10-05 [API-gh] |
| **Filesystem MCP (référence)** | accès fichier sandboxé | stdio | agents locaux | lecture/écriture sur chemins autorisés | **le plus sensible** si mal périmétré | officiel/reference [W] | maintenu avec la spec [W] |
| **Context7** | documentation **à jour, versionnée**, d'après les dépôts | `npx`/remote | tous | lecture de docs (public) | faible | **MIT** | **62 716★**, poussée 2026-10-05 [API-gh] |
| **Figma Dev Mode MCP** | structure de la sélection : hiérarchie, auto-layout, variants, styles, **tokens**, Code Connect | local (app Figma) | Claude, Cursor, Windsurf | accès aux fichiers de design de l'utilisateur | **siège Figma payant requis** [W] ; propriété intellectuelle des maquettes | propriétaire | officiel Figma [W] |
| **Framelink Figma MCP** | Figma→code via API REST (alternative sans Dev Mode) | `npx figma-developer-mcp --figma-api-key=…` | tous | clé API Figma ; lecture de fichiers | clé à protéger | OSS (communauté) [W] | communautaire [W] |
| **shadcn MCP** | parcourir, inspecter (**interfaces TS exactes**), exemples, **installer** des composants depuis le registry | `claude mcp add --transport http shadcn https://www.shadcn.io/api/mcp` ou JSON client | Claude Code, Cursor | écrit dans votre dépôt ; accès réseau au registry | code tiers non revu installé automatiquement | OSS (service) [W] | service actif [W] |
| **Magic UI MCP** | composants React + Tailwind (marquee, blur-fade…) | MCP | Claude, Cursor | lecture de catalogue | faible | OSS [W] | [W] |
| **Supabase MCP** | Postgres, auth, storage | remote OAuth | tous | **accès base de données** | fuite de données si périmètre large | propriétaire (service) | officiel [W] |
| **Sentry MCP** | erreurs, traces | remote HTTP | agents de triage | lecture d'incidents | données applicatives | propriétaire | officiel [W] |
| **Stripe MCP / PayPal Agent Toolkit** | API paiement via function calling | MCP | agents | **toucher à l'argent** | **le plus critique** : à limiter en lecture/test | propriétaire | officiels [W] |
| **Vercel / Netlify MCP** | créer, builder, déployer, gérer | remote | tous | déploiements de production | publication accidentelle | propriétaire | officiels [W] |
| **Rube (Composio)** | 500+ applications (Gmail, Slack, GitHub, Notion) via un seul serveur | install unique + OAuth | agents | **très large** : une clé pour 500 apps | surface d'attaque maximale ; à auditer app par app | propriétaire/OSS partiel [W] | [W] |
| **MCPJungle** | **registry + proxy auto-hébergé** pour agents d'entreprise | self-host | entreprises | centralise les accès (bon point) | dépend de votre exploitation | OSS [W] | [W] |
| **DesignRevision MCP** | découvrir/inspecter/**installer** des composants shadcn de production | MCP | Claude Code, Cursor, VS Code | écrit dans le dépôt | freemium : *browsing/installation* gratuits [W] | freemium | [W] |
| **Kubernetes MCP** | kubectl via MCP | stdio/HTTP | agents plateforme | **contrôle d'infrastructure** | risque d'indisponibilité si mal borné | communautaire [W] | [W] |
| **Exa / Firecrawl / Brave Search MCP** | recherche web, crawl, extraction | MCP + clé API | agents | requêtes sortantes payantes | coût en boucle ; contenu non fiable (injection) | F**irecrawl = AGPL-3.0** [API-gh] | Firecrawl **188 876★**, poussée 2026-10-05 [API-gh] |

### 6.2.3 Checklist de sécurité MCP (à appliquer avant chaque installation)
1. **Que lit-il ?** (dépôt, fichiers, base, e-mails) → périmètre minimal.
2. **Que peut-il écrire/déclencher ?** (commit, déploiement, paiement, suppression).
3. **Quel identifiant l'autorise, et comment je le révoque ?** (OAuth > clé longue durée).
4. **Quelles données sortent ?** (prompts, contenus clients, secrets) → conformité RGPD si données personnelles.
5. **Coût en boucle ?** (recherche/crawl génèrent des appels payants).
6. **Qui le maintient, et quand a-t-il bougé pour la dernière fois ?** (voir la colonne « maintenance » ci-dessus).
7. **Peut-il être compromis par injection de prompt ?** (contenu web = entrée non fiable, surtout avec un serveur qui a des droits d'écriture).
8. **Dois-je l'exposer en remote ou le garder en local ?** (59 % des implémentations passent en HTTP : plus pratique, plus exposé).

---

# 6.3 Couche 3 — Skills (Agent Skills)

### 6.3.1 Le format et la distribution
- **Anatomie** : un **dossier** contenant `SKILL.md` (+ fichiers annexes : scripts, templates, ressources). Claude (ou un autre agent compatible) **charge la Skill quand la description correspond à la tâche** [W].
- **Installation (3 voies)** : (1) déposer dans `~/.claude/skills/` ; (2) ` /plugin marketplace add` (marketplace.json) ; (3) uploader des bundles via l'API Skills [W].
- **Il n'existe pas de store unique** : « le marketplace » = union du dépôt officiel + primitive de marketplace de Claude Code + catalogues tiers + longue traîne de dépôts GitHub [W].
- **Compatibilité** : le format `SKILL.md` est présenté comme un **standard ouvert** utilisé par Claude Code, Codex CLI et ChatGPT ; les catalogues revendiquent la compatibilité avec Cursor [W].

| Ressource | Nature | Contenu | Installation | Licence | Popularité / fraîcheur |
|---|---|---|---|---|---|
| **anthropics/skills** | N23 (source officielle) | docx, pdf, pptx, xlsx, brand guidelines, slack-formatter, **skill-creator** (méta-skill) | clone/plugin | dépôt **sans licence SPDX** [API-gh] → vérifier | **179 777★**, poussée 2026-10-05 [API-gh] |
| **ComposioHQ/awesome-claude-skills** | N03 | liste curatée de Skills, ressources, outils | — | dépôt sans SPDX [API-gh] | 76 548★ [API-gh] |
| **SkillsMP** | N04 | 1,2 M+ skills indexés (revendiqué) ; aperçu du `SKILL.md`, ZIP, CLI pour ceux qui ont `marketplace.json` [W] | web/CLI | index (pas d'hébergement) | revendiqué 2026 [W] |
| **agent-skills.cc** | N04 | 63 000+ skills indexés, **1 000+ curatés**, filtres newest/hot/installs [W] | web (copie) | index | [W] |
| **skills.sh** | N04 | ~2 000 skills, install orienté **ligne de commande** [W] | CLI | index | [W] |
| **ClaudeSkills.info** | N04 | 658+ skills gratuits, community + officiels [W] | web | index | [W] |
| **claudemarketplaces.com** | N04 | directory **curaté et voté** de plugins, skills, MCP [W] | web | index | [W] |
| **Agensi** | N28 (payante) | 200+ skills, **scan sécurité 8 points** (injection de prompt, exfiltration, secrets, commandes dangereuses, obfuscation, appels externes, accès identifiants, escalade de privilèges), Pro 9 $/mois, partage créateur [W] | achat | commercial | [W] |
| **gsap-skills** | N23 (éditeur) | Skill officielle GSAP | plugin/clone | **MIT** | 15 960★ [API-gh] |
| **LottieFiles/motion-design-skill** | N23 | Skill de motion design | clone | MIT | 1 K★ [API-gh] |
| **addyosmani/agent-skills** | N03 | sélection curatée (qualité > quantité) [W] | clone | OSS | [W] |
| **Règles d'agent** (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `copilot-instructions`) | N21 | contexte projet : conventions, interdits, commandes | fichier dans le dépôt | libre | **wshobson/agents** 40 K★ MIT · flyeric0212/cursor-rules 1 K★ [API-gh] |

**Règle d'or (2026)** : la quasi-totalité des catalogues **ne scannent pas** le contenu — « vous devez auditer chaque skill vous-même avant de l'installer » [W]. Seul Agensi revendique un scan automatisé. Installer une Skill = accorder à un agent une procédure écrite : à traiter comme du code tiers.

---

# 6.4 Couche 4 — Orchestrateurs, RAG et outils d'agent

| Ressource | Nature | Rôle | Licence | Preuves | Tier |
|---|---|---|---|---|---|
| **LangChain / LangGraph** | N25 | orchestration, graphes d'états, outils, mémoire | MIT | 147 475★, poussée 2026-10-05 [API-gh] | A |
| **CrewAI / Mastra / Pydantic AI / smolagents / Agno** | N25 | multi-agents (Python/TS), typage, agents minimalistes | MIT/Apache [?] | [W] | B |
| **n8n** | N25 | automatisation visuelle, 400+ intégrations, auto-hébergeable | dépôt NOASSERTION [API-gh] (fair-code) | 206 724★ [API-gh] | A |
| **Dify** | N25 | plateforme LLMOps (RAG + agents + UI) | NOASSERTION [API-gh] | 157 894★ [API-gh] | A |
| **Flowise / Langflow** | N25 | constructeurs low-code de flux IA | OSS | Langflow 155 K★ [API-gh] | B |
| **LlamaIndex** | N25 | indexation et RAG | MIT [?] | [W] | A |
| **Vectoriel** : pgvector, Qdrant, Chroma, LanceDB, Weaviate | N25 | recherche sémantique ; **pgvector = dans Postgres (moins de lock-in)** | OSS/variées → **[?]** à vérifier par dépôt | — | A/B |
| **Observabilité** : Langfuse | N25 | traces, évals, coûts, datasets ; self-host ou cloud | MIT/OSS [?] | [V] | A |
| **Gateways** : OpenRouter, Vercel AI Gateway, Together, Groq, Replicate, fal, Hugging Face | N18/N25 | accès multi-modèles, coûts, fallback | propriétaire | [V]/[W] | A/B |
| **Local** : Ollama, llama.cpp, LM Studio, vLLM | N25 | exécution locale, données qui ne sortent pas | MIT | Ollama 182 254★ [API-gh] | A |
| **Recherche/extraction** : Firecrawl, Exa, Tavily, Brave Search | N18/N25 | matières premières d'agents (web) | **AGPL-3.0** (Firecrawl) / propriétaire | 188 876★ [API-gh] | A/B |
| **Cookbooks / guides** : openai-cookbook, anthropic cookbook, dair-ai Prompt Engineering Guide, microsoft/generative-ai-for-beginners, prompts.chat, learnprompting.org | N21/N26 | apprendre en faisant | MIT/OSS | 76 357★ (openai-cookbook) [API-gh] | A |

**Anti-pattern majeur** : « installer plus de six serveurs MCP à la fois » est explicitement déconseillé par les listes curatées — le contexte de l'agent se dilue et les permissions explosent [W]. La bonne unité n'est pas le serveur, c'est **la boucle de travail** : *installer un composant → vérifier dans un navigateur → corriger → committer* se satisfait de 3 serveurs (registry, navigateur, dépôt).

---

# 6.5 Couche 5 — Agents de code et builders IA

## 6.5.1 Agents de code (état au 5 octobre 2026, très mouvant)
| Outil | Type | Modèle par défaut rapporté | Prix de départ rapporté | Open source | Signal 2026 |
|---|---|---|---|---|---|
| **Claude Code** | CLI (+ éditeur) | Claude Opus 4.x | 20 $/mois (Pro) → 200 $ (Max) | non | cité comme leader du SWE-bench Verified (88,6 % sur Opus 4.8 selon une source) [?] ; sous-agents parallèles [W] |
| **Codex CLI (OpenAI)** | CLI + cloud | GPT-5.x | inclus ChatGPT Plus 20 $ → 100 $+ | oui (dépôt) | cité leader Terminal-Bench ; efficacité en tokens ; Codex Remote [W] |
| **Cursor** | IDE (fork VS Code) | Composer 2.5 | gratuit → 20 $ → 40/200 $ | non | **rachat/consolidation mentionnés** (Continue.dev acquis puis archivé) [W] → risque de continuité |
| **OpenCode** | CLI | BYO (75+ modèles) | gratuit (BYOK) / PAYG | oui | le plus étoilé du segment selon une source (~180 K★ revendiqués) ; gateway Zen [W] |
| **Aider** | CLI git-natif | BYOK | gratuit (coût API) | oui (Apache-2.0) | historique du commit automatique ; **une source le dit dormant depuis août 2025** [?] |
| **Cline** | extension VS Code | BYOK (30+ fournisseurs) | gratuit ou 9,99 $ hébergé | oui (Apache-2.0) | agent autonome dans l'IDE [W] |
| **Gemini CLI** | CLI | Gemini | gratuit (1 000 requêtes/jour rapportées) | oui | **fusion annoncée dans Antigravity** selon une source [?] |
| **GitHub Copilot** | IDE | multi | 19 $/siège (Business) | non | intégration GitHub profonde [W] |
| **Windsurf / Trae / Antigravity** | IDE/CLI | propres + multi | 15 $ / 0–10 $ / aperçu gratuit | non | segment en recomposition [W] |

**Lecture DRI** : ce marché se sépare en **deux familles durables** — (a) **BYOK open source** (coût = tokens, portabilité, vous contrôlez le modèle) ; (b) **abonnements intégrés** (qualité et confort supérieurs, lock-in réel, prix qui bougent). Stratégie recommandée pour un projet : un agent BYOK pour les tâches routinières + un abonnement pour les refactorings lourds, **et vos règles d'équipe écrites dans le dépôt** (`AGENTS.md`/`CLAUDE.md`) pour survivre au changement d'outil.

## 6.5.2 Builders prompt→app
| Outil | Nature | Gratuit (vérifié 2026) | Payant | Force | Limite |
|---|---|---|---|---|---|
| **v0 (Vercel)** | N24 | ~5 $ de crédits/mois | Premium 20 $, Team 30 $/utilisateur, Business 100 $ | qualité UI React/Next + shadcn, import Figma | **pas de backend**, limité à l'écosystème Vercel [W] |
| **Bolt.new** | N24 | 1 M tokens/mois (plafond 300 K/jour) | Pro 25 $, Teams 30 $/utilisateur | **exécute le code dans le navigateur** (WebContainers), multi-frameworks (React, Vue, Svelte, Angular, Expo) | coût en tokens, branding sur gratuit [W] |
| **Lovable** | N24 | 5 crédits/jour, projets publics | Pro 25 $, Business 50 $ | produit poli pour non-développeurs, Supabase natif | crédits, backend limité, modèle masqué [W] |
| **dyad / bolt.diy** | N24 | **auto-hébergés, illimités** | — | souveraineté, fork de Bolt | vous exploitez, qualité variable [W] |
| **Replit / Base44 / Bubble / Glide / Emergent / Zite** | N24 | offres limitées | 20 → 249 $ | non-développeurs, interne | portabilité faible [W] |

**Règle non négociable** : un code généré n'est **pas** un code vérifié. Avant toute mise en production : lire le code, exécuter les tests, contrôler les secrets, vérifier les licences des extraits et l'accessibilité. (Cohérent avec la consigne permanente : « ne jamais présenter une génération IA comme garantie de code fonctionnel ».)

---

# 6.6 Coûts : comment raisonner (au lieu de « c'est gratuit »)

| Modèle | Exemples | Ce qu'il faut surveiller | Verdict DRI |
|---|---|---|---|
| **Crédits mensuels** | v0 (~5 $), Lovable (5/jour) | épuisement en une session de travail | bon pour explorer, pas pour produire |
| **Tokens** | Bolt (1 M/mois gratuit, 300 K/jour) | débogage = consommation explosive | mesurer avant de s'engager |
| **Abonnement par siège** | Claude Code 20–200 $, Cursor 20 $+, Copilot 19 $ | coût d'équipe linéaire ; hausses | standard en entreprise |
| **BYOK (apportez votre clé)** | Aider, Cline, OpenCode, dyad | coût réel = appels API, non plafonné | le plus prévisible si instrumenté |
| **Self-host** | Ollama, llama.cpp, n8n, Langfuse, MCPJungle | temps d'exploitation + GPU/CPU | vrai coût caché = maintenance |
| **Free tier de service** | Supabase/Appwrite (pause si inactif), Firebase (coupure au dépassement) | **modes de défaillance en production** | jamais pour de la production sans plan payant [W] |

---

# 6.7 Ce qui manque encore (AI Resource Map)
1. **Pas de recensement exhaustif des serveurs MCP** : 20 K+ existants ; nous documentons les **catégories** et les serveurs à enjeu (dépôt, navigateur, design, base, paiement, recherche) — pas 20 000 entrées.
2. **Qualité des Skills non auditable à distance** : les catalogues ne scannent pas ; notre recommandation est donc **procédurale** (checklist §6.2.3 + audit du `SKILL.md`).
3. **Prix des agents et builders à re-vérifier à chaque décision** : le marché a bougé plusieurs fois en 2026 ; les montants ci-dessus sont **datés du 5 octobre 2026**.
4. **Aucun banc d'essai exécuté ici** : les affirmations de performance (SWE-bench, Terminal-Bench) sont **rapportées**, non reproduites — traiter comme des indices, pas comme des mesures.


---

> **Projet connexe** : [[harnai-moc|HarnAI (Harness IA)]] — cartographie de 28 outils harness IA avec support MCP. Voir [[13b-harnai-mcp]] pour l'écosystème MCP et [[15-harnai-custom-mcp]] pour créer un MCP custom.
