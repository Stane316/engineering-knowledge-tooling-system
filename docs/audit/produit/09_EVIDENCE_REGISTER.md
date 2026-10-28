# 09 — Registre des preuves (EVIDENCE REGISTER)

> **Rôle** : tracer chaque affirmation importante des documents 00–11 vers sa
> preuve, avec les limites de cette preuve. Types : **[EXÉC]** exécution
> réelle pendant l'audit (26/10/2026, sandbox Linux, commit `3156147`) ·
> **[CODE]** lecture de code/config · **[DOC]** document versionné ·
> **[CI]** exécution GitHub Actions · **[EXT]** source externe · **[NEG]**
> preuve d'absence (grep ciblé).
> **Règle** : aucune capacité des documents 02/04 n'est affirmée sans EV ou
> réserve explicite.

| ID | Affirmation soutenue | Source | Type | Résultat constaté | Limites de la preuve |
|---|---|---|---|---|---|
| EV-01 | La chaîne qualité complète passe (typecheck+lint+format+build+tests+couverture) | `npm run verify` exécuté pendant l'audit, sortie `/tmp` | EXÉC | **EXIT 0** — 133 fichiers (129 pass + 4 skip), couverture All files **96.40 \| 90.92 \| 97.70 \| 96.62** | Sandbox sans navigateurs : 4 fichiers E2E skippés |
| EV-02 | Même chaîne complète **avec navigateurs** passe sur le poste utilisateur | Copie utilisateur du 26/10 (run `coverage` : 133/133 fichiers, **1688 pass + 2 skip, 0 fail**) + agrégat **97.04 \| 91.73 \| 97.99 \| 97.24** (tableau texte + capture) | EXÉC (poste tiers) | Conforme, agrégat ≥ 80 partout | Rapporté par l'utilisateur, non reproduit dans l'audit |
| EV-03 | La CI valide chaque push | `gh run view 40359300133` (26/10) | CI | **success 8/8 jobs** : secrets, audit deps, qualité ×4 (Ubuntu/Windows × Node 22/24), benchmark 100K, E2E MVP-3 | Un seul run inspecté en détail (les précédents du jour aussi `success`) |
| EV-04 | Le serveur MCP démarre et expose **17 outils** avec schémas | Échange JSON-RPC réel : `initialize` + `tools/list` sur `dist/mcp/server.js` | EXÉC | `serverInfo: ekts 0.2.0` ; 17 outils listés avec `inputSchema.properties` ; log serveur `protocolVersion 2025-11-25`, `tools 17`, `embeddings false` | Pas de client hôte (stdin contrôlé par l'audit) |
| EV-05 | Un appel d'outil aboutit à un résultat structuré | `tools/call list_templates {"limit":3}` | EXÉC | `isError` absent, JSON `{count:3, templates:[…builtin…]}` | Un seul outil testé en appel (les autres : schémas + tests maison) |
| EV-06 | Les erreurs MCP sont structurées (code + contexte) | `tools/call get_resource {"id":"not-a-uuid"}` | EXÉC | `isError: true`, `code -32000`, message FR + `data.resourceId` | Idem |
| EV-07 | CLI de 15 commandes racine, options globales `--json`/`--no-colors` | `node dist/cli/index.js --help` | EXÉC | 15 commandes listées (init…timeline) | Aide seule |
| EV-08 | Parcours autonome de base : init → add → list → search → status | Séquence exécutée avec `EKTS_DATA_DIR=/tmp/ekts-audit/data` | EXÉC | **EXIT 0** à chaque étape ; ressource créée (UUID), `search fts` → `count: 1` retrouvé, `status` → 3 bases | Mode **FTS** uniquement (pas de clé dans la sandbox) |
| EV-09 | Codes de sortie contractuels 2/3/4 respectés | `add` sans option requise → **2** ; `delete` UUID inexistant → **3** ; `add --type practice` (enum invalide) → **4** + JSON `VALIDATION_FAILED` | EXÉC | Conforme à la matrice documentée (CLI.md) | 3 codes testés sur 5 (0 = parcours EV-08 ; 1 non testé ici) |
| EV-10 | Trois versions produit datées : 0.0.1 (MVP-1, 23/10), 0.1.0 (MVP-2, 25/10), 0.2.0 (MVP-3, 26/10) | `docs/CHANGELOG.md` (3 sections complètes) | DOC | Cohérent avec `package.json` = 0.2.0 | — |
| EV-11 | MVP-2 validée 88/88 avec méthode de preuves | `docs/MVP2_VALIDATION.md` | DOC | Méthode : lecture de chaque témoin (fichier/test/mesure) ; 7 écarts des modèles de spec corrigés et listés | Validation par relecture, non rejouée pendant cet audit |
| EV-12 | MVP-3 validée 97/97 sur sorties réelles | `docs/MVP3_VALIDATION.md` | DOC | 91 ✅ + 3 réserves + 3 ⚠️ P3, 0 rejet ; note de comptage 87→97 documentée | Idem (non rejouée ; les E2E correspondants tournent en CI : EV-03) |
| EV-13 | Config prête pour hôte MCP local | `.mcp.json` (commande `node dist/mcp/server.js`) | CODE | Présent, cohérent avec le build | Format d'hôte type Claude/VSCode — **non consommé par un vrai hôte pendant l'audit** |
| EV-14 | Aucune publication npm ; installation = clone | `npm view ekts` → **404** (26/10) ; `package.json` sans `exports`, `bin: ekts` | EXT+CODE | Paquet inconnu du registry ; `npm i -g ekts` impossible | Le nom étant libre, une publication future reste possible (DEC-01) |
| EV-15 | Exemples d'intégration client MCP documentés sur sorties réelles | `docs/MCP-EXAMPLES.md` (SDK 1.32.1, réponses du vrai serveur) | DOC | Exemples Claude Code avec JSON réel | **Documentation** : aucun test automatisé « hôte réel » (Claude Code/VSCode) dans le dépôt |
| EV-16 | Dépendances externes réelles : 14+ clés fournisseurs + modèles | `.env.example` (noms de variables uniquement) | CODE | OPENAI, OPENROUTER, GEMINI, NOVITA, DEEPSEEK, ZAI, NVIDIA, STEPFUN, MINIMAX, TAVILY, SERPER, SERPAPI, SOFYA, E2B + `OPENAI_EMBEDDING_MODEL`, `EMBEDDING_DIMENSION` | Aucune valeur de secret lue (conforme) |
| EV-17 | Documents d'entrée désalignés | `README.md` lignes « Statut : MVP-2 validé — 88/88 » et « Version : 0.1.0 » alors que le même README liste MVP-3 ✅ et que `package.json` = 0.2.0 | CODE/DOC | Incohérence confirmée | — |
| EV-18 | SDK MCP à jour quasi immédiat | `package-lock.json` → `@modelcontextprotocol/sdk` **1.32.1** ; `npm view` → latest **1.32.2** (modifié 23/10/2026) | CODE+EXT | Écart de micro-version, mainteneur actif | — |
| EV-19 | Négociation de protocole : `2025-11-25` | Réponse `initialize` du serveur (EV-04) ; dernière spec GitHub `modelcontextprotocol` = tag **2026-07-28** (api.github.com, 26/10) | EXÉC+EXT | Serveur aligné sur l'avant-dernière spec publiée | Interop avec clients réclamant `2026-07-28` **non testée** (voir LIM-08) |
| EV-20 | Recherche vectorielle inerte sans clé d'embeddings | Log MCP d'exécution : `"embeddings": false` ; config `src/shared/config.ts` (clés via env) | EXÉC+CODE | Sans clé : mode hybride retombe en FTS (comportement documenté README/CLI) | Un cas de figure de déploiement vierge (le scénario recommandé s'en passe — `05`) |
| EV-21 | Base de tests : 133 fichiers de test répartis sur 16 domaines | `find tests -name "*.test.ts"` | CODE | analysis 10, browser 12, cli 14, e2e 11, integration 19, mcp 22, unit 20, … | — |
| EV-22 | Aucun point de detournement codé en dur | `grep -rn "TODO\|FIXME\|HACK" src/ tests/` | NEG | **0 occurrence** | Absence de TODO ≠ absence de dette technique ; signale seulement l'absence de marquage |
| EV-23 | Avancement tracé par un registre unique et des ADR | `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` (MAJ 26/10) ; registre ADR 001→044 | DOC | Statuts sprints + décisions tracées | — |
| EV-24 | Les E2E navigateur passent sur un poste équipé | Runs utilisateur du 26/10 : inspection 3/3, mcp-flow 4/4, cli-flow 5/5, comparison 2/2, full-workflow 2/2, mvp3 26/26, Playwright 12/12 (**54/54**) | EXÉC (poste tiers) | 0 échec après correction des budgets (commit `c5da3ef`) | Non reproduit dans la sandbox (pas de navigateurs : EV-28) ; CI = job E2E MVP-3 uniquement (EV-03) |
| EV-25 | Outils de santé poste fonctionnels | Sorties utilisateur 26/10 : `check:env` **0**, `doctor` **0** (arbre propre), `doctor:browsers` **0** (Firefox sandbox → repli OK) | EXÉC (poste tiers) | Conforme au contrat révisé (`5bf0002`) | — |
| EV-26 | **Aucune interaction pilotée** (click/fill/press/scroll) dans le code navigateur | `grep -rn "click(\|fill(\|press(\|scroll" src/browser/` | NEG | **0 occurrence** ; `goto` + `screenshot` seulement ; aucune trace cookie/login | Périmètre `src/browser/` inspecté intégralement |
| EV-26b | EKTS ne consomme aucun MCP externe sortant | `grep` sur `src/` : uniquement `McpServer` (côté serveur) ; aucun client sortant vers un serveur tiers | NEG | Consommation MCP externe = **absente** | — |
| EV-27 | Second serveur MCP navigateur **non câblé** | `grep createBrowserMcpServer` : référencé par `tests/browser/playwright-mcp.test.ts` et un extrait `docs/PLAYWRIGHT.md` §8 ; **0** occurrence dans `src/cli/`, `src/mcp/`, `scripts/`, scripts npm | NEG+DOC | Fonction testée (53 tests) mais **invocable uniquement en import programmatique** | — |
| EV-28 | L'inspection L3 (Lighthouse+axe) n'est pas rejouable dans la sandbox de l'audit | `~/.cache/ms-playwright` absent → `probeEngines` échoue → `describe.skipIf` sur `inspection-flow`/`mcp-flow` | EXÉC | 2 fichiers skippés dans EV-01 | **Limite d'environnement d'audit** : non exécution ≠ défaut produit (cf. EV-03/EV-24) |
| EV-29 | Sécurité : aucun secret en dépôt, audit dépendances propre | Dernier run utilisateur : `npm audit` 0 vuln, gitleaks **0** (`8.30.1`, `no leaks found`) ; CI job secrets ✓ (EV-03) | EXÉC+CI | Conforme | `.env` local non inspecté (hors périmètre, volontairement) |
| EV-30 | Historique MVP-1 documenté par des specs sprint complètes | `docs/blueprint/Docs/roadmap/sprints/SPRINT-01…06*.md` présents | DOC | Specs disponibles pour reconstitution | Specs ≠ exécution (cf. H-05) |
| EV-31 | La **justesse** des audits n'est pas mesurée contre une référence experte | E2E inspection : assertions structurelles (`score ∈ [0,100]`, non-null, `wordCount > 0`) — `tests/e2e/inspection-flow.test.ts` L102–128 | CODE | Structure validée, valeur métier non golden | Pas de jeu de référence expert dans `tests/` (fixtures = JSON erreurs npm, pas de pages « or » annotées) |
| EV-32 | Écosystème outillage maison complet | `package.json` scripts (27) : `verify`, `doctor`, `check:env`, `browsers:install`, `security:secrets`, `db:*`, `providers`… | CODE | Disponibles et utilisés pendant l'audit | — |
| EV-33 | CI : 8 jobs (évolution du « 7/7 » documenté en MVP-2) | Récap `gh run view 40359300133` (EV-03) | CI | 8/8 dont `Tests E2E MVP-3` ajouté au Sprint 18-01 | — |
| EV-34 | Benchmark de performance en CI | Job `Benchmark recherche (100K documents)` vert (EV-03) ; métriques maison (0,89 ms/audit, 2,7 ms/10 k) documentées | CI+DOC | Budgets tenus dans CI | Métriques précises non relues dans cet audit (documentées, pas re-mesurées) |
| EV-35 | Les commandes du runbook 05 ont été **exécutées** et corrigées (révision du 26/10) | Exécutions sandbox : `node dist/cli/index.js --version` (0.2.0), `init` (3 bases), `project create "mon-site"` (UUID), `audit list --json`, `bp extract <pid>` ; et contre-épreuves : `ekts` → **127/not found**, `npx playwright browsers:install` → *unknown command*, `project create --name` → **EXIT 2** | EXÉC | **4 défauts documentaires** trouvés dans `05` v1.0 : binaire non global, script npm confondu avec commande Playwright, `project create` positionnel sans `--url`, `bp extract` à exécuter après 2 audits — **corrigés** ; `npm run cli -- … --json` ajoute une bannière sur stdout — piège **déjà documenté** dans `docs/CLI.md` §2 (LIM-17, défaut d'audit) ; `npx --no-install ekts …` vérifié : JSON pur (`{"count":0,…}`) ; `./reports` non ignoré (LIM-18) | Sandbox sans navigateurs : `inspect`/`audit compare` non rejoués (EV-28) |

**Affirmations explicitement NON vérifiées pendant l'audit** (aucune n'est
présentée comme vraie ailleurs) :
**NV-1** comportement sur site nécessitant une authentification (jamais de
test) · **NV-2** durée/vraisemblance économique d'un audit L3 en conditions
réelles non re-mesurée ici (budgets : EV-24) · **NV-3** intégration avec un
hôte MCP réel (Claude Code/VSCode/Cursor) non instrumentée (EV-15) ·
**NV-4** comportement multi-processus concurrent sur les 3 bases (non testé)
· **NV-5** rendu PDF qualité imprimable non évalué « à l'œil » dans cet
audit (tests : structure + temps) · **NV-6** Windows/macOS des scripts
d'installation vierges (seul le parcours utilisateur du 26/10 est observé).
