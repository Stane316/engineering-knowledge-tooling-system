# 02 — Catalogue des capacités actuelles

> **Question à laquelle ce document répond** : « Que puis-je demander au
> produit aujourd'hui ? »
> **Légende des statuts** (cadre de la mission §3) :
> **✅ Confirmé et validé** — parcours exécuté avec preuves suffisantes ·
> **🟡 Implémenté, validation incomplète** — code + tests, scénario complet
> non démontré ici · **🟠 Partiellement implémenté** — certaines étapes
> manquent · **⚪ Défini, non implémenté** · **❌ Absent** ·
> **🔒 Bloqué (dépendance/config)** · **❓ Non vérifiable ici**.
> Versions : **M1** = MVP-1, **M2** = MVP-2, **M3** = MVP-3.

## Domaine A — Base de connaissances

| ID | Capacité | Ce que l'utilisateur peut faire | Entrées | Résultat | Prérequis | Statut | Validation | Version | Limites | Preuves |
|---|---|---|---|---|---|---|---|---|---|---|
| CAP-01 | Ajouter une ressource | `ekts add --type tool --title … --content … --tags a,b` | type ∈ article\|video\|tutorial\|tool\|other, titre, contenu | Ressource UUID créée, indexée FTS | `npm ci` + `build` | ✅ | Exécution réelle audit | M1 (S3/S5) | Vecteur non indexé sans clé (CAP-03) | EV-08 |
| CAP-02 | Consulter / lister / supprimer | `get <id>`, `list` (filtres), `delete <id>` (+confirmation) | UUID | JSON ou table ; codes 0/3/1 | idem | ✅ | Exécution + tests 133 fichiers | M1 | — | EV-08, EV-09, EV-21 |
| CAP-03 | Recherche plein texte (FTS5/BM25) | `search "…"` / MCP `search_knowledge` mode `fts` | requête libre | Résultats triés + score + temps | aucune clé | ✅ | Exécution réelle (`count:1`) | M1 | Score BM25 affiché négatif (convention interne, peu intuitif — LIM-13) | EV-08 |
| CAP-04 | Recherche hybride vectorielle | mode `hybrid`/`vector` : BM25 + cosine + RRF k=60 | clé embeddings + modèle | Fusion des classements | **clé API + `EMBEDDING_DIMENSION`** | 🔒 | Tests unit/intégration mocks ; **non exécuté avec vrai fournisseur pendant l'audit** | M1 | Sans clé → retombe en FTS (comportement propre, documenté) | EV-16, EV-20 |
| CAP-05 | Réindexation | `reindex` (+`--force` changement d'espace) | config embeddings | vecteurs recalculés | idem CAP-04 | 🟡 | Tests maison (espaces d'embedding) | M1 | Non exécuté réellement ici (pas de clé) | EV-16 |
| CAP-06 | Validation à l'ajout | Zod sur entrées, tags normalisés, types imposés | données invalides | Code **4** + message `VALIDATION_FAILED` | — | ✅ | Exécution réelle (enum invalide) | M1 | — | EV-09 |

## Domaine B — Audit et inspection web

| ID | Capacité | Ce que l'utilisateur peut faire | Entrées | Résultat | Prérequis | Statut | Validation | Version | Limites | Preuves |
|---|---|---|---|---|---|---|---|---|---|---|
| CAP-10 | Inspection L1 (capture, ARIA, métadonnées) | `ekts inspect <url>` (niveau bas) | URL publique http(s) | Résultat structuré + warnings | Playwright installé | ✅ | E2E inspection (3/3) chez utilisateur + tests unit 19–21 | M2 | Réseau cible requis ; pas d'auth (LIM-05) | EV-24, EV-28 |
| CAP-11 | Inspection L2 (+Lighthouse, SEO DOM) | idem | idem | + Core Web Vitals, SEO | idem + Chrome/Chromium | ✅ | idem | M2 | Budgets sous charge (corrigés `c5da3ef`) | EV-24 |
| CAP-12 | Inspection L3 (+axe-core, Nielsen, contenu) | idem, niveau complet | idem | violations WCAG, heuristiques, wordCount | idem | ✅ | E2E (L3 complet : 16–21 s par exécution) | M2 | **Non rejouable dans la sandbox d'audit** (EV-28) ; L4 absent | EV-24 |
| CAP-13 | Analyse 5 dimensions + score | automatique après inspection | rapport L* | overallScore 0–100, constats priorisés (recommendation obligatoire) | — | ✅ | Tests analyse (10 fichiers) + E2E plages | M2 | **Justesse métier non golden** (EV-31) | EV-21, EV-31 |
| CAP-14 | Stockage des audits | automatique (`inspect`) ou via MCP | rapport | SQLite audits (FTS + vecteurs) | bases initialisées (`init`) | ✅ | Intégration storage + perfs (0,6–0,9 ms/audit) | M2 | — | EV-34 |
| CAP-15 | Historique / recherche d'audits | `audit list`, MCP `audit_history` (filtres score, URL, limit) | filtres | liste d'audits | bases | ✅ | Tests CLI audit (11) + MCP (5) + E2E | M2 | — | EV-21 |
| CAP-16 | Rapport Markdown | `audit report <id>` | audit ID | fichier `.md` | — | ✅ | E2E + tests reports (10) | M2 | — | EV-21, EV-24 |
| CAP-17 | Rapport PDF | `audit report --format pdf` | idem | fichier PDF (2–4 s) | **Chrome Puppeteer à installer** | ✅ | Tests PDF réels (7, rendu Puppeteer) + E2E (PDF C11.2) | M2 | Dépendance Chrome système (LIM-14) ; non « relu à l'œil » ici (NV-5) | EV-21 |
| CAP-18 | Comparaison de 2 audits | `audit compare <a> <b>` | 2 IDs | deltas + recommandations d'évolution, MD/PDF | — | ✅ | E2E comparison (2/2) + tests comparator (17) | M2 | Même URL seulement (contrat documenté) | EV-21, EV-24 |
| CAP-19 | Ouverture/fermeture navigateur | multi-moteurs Chromium/Firefox/WebKit, repli sandbox Windows | option moteur | session pilotée | `npm run browsers:install` | ✅ | 54/54 E2E utilisateur + `doctor:browsers` | M2 | Firefox sandbox = repli automatique (supporté) | EV-24, EV-25 |
| CAP-20 | Capture d'écran et PDF de page | via inspection / Navigator | URL | fichiers artefacts | idem | ✅ | Tests browser (12 fichiers, navigator screenshot/pdf) | M2 | — | EV-21 |

## Domaine C — Projets et capitalisation (MVP-3)

| ID | Capacité | Faisable concrètement | Entrées | Résultat | Statut | Validation | Version | Limites | Preuves |
|---|---|---|---|---|---|---|---|---|---|
| CAP-30 | Multi-projets | `project create/list/show/delete -f`, filtre `-p` sur commandes transversales | nom, description, URL | projets persistants (migration 003) | ✅ | E2E multi-projects 5/5 + CLI tests (18) | M3 | Pas de partage/équipe (hors périmètre) | EV-24 |
| CAP-31 | Suivi temporel | `timeline analyze/trends/alerts/chart` | période, `--lookback`, seuils | tendances, régressions, alertes, SVG/PNG | ✅ | E2E timeline 5/5 + CLI (17) + MCP `get_timeline` (7 tests) | M3 | Détection = régression linéaire (pas ML — MVP4 option 3) | EV-21, EV-24 |
| CAP-32 | Bonnes pratiques | `bestpractice extract/list/search/add/show/delete` | audits passés / saisie manuelle | constats résolus capitalisés, recherche hybride | ✅ | E2E bp 4/4 + tests bp (4 fichiers, 66 cas) | M3 | Extraction = sur audits « résolus » uniquement (choix de design documenté) | EV-24 |
| CAP-33 | Recommandations contextuelles | `recommend generate/list/rules add\|toggle\|delete` | projet + règles (0–4 sévérité) | recommandations scorées, sections MD/PDF optionnelles | ✅ | E2E rec 4/4 + tests (4 fichiers) | M3 | Qualité = règles maison + statistiques, pas ML | EV-24 |
| CAP-34 | Templates de projet | `template list/show/create/export/import/delete/apply` ; 10 builtins | template_id, projet, overrides | projet peuplé (bp + règles + config) | ✅ | E2E templates 5/5 (catalogue 10 exports) + tests (4 fichiers) | M3 | Builtin delete refusé (ADR-040, retour 4) | EV-24 |
| CAP-35 | Export/import JSON | `template export/import`, `project` export | fichier | transfert hors-ligne | ✅ | E2E (C13.13–15, C17.5–8) | M3 | — | EV-24 |

## Domaine D — Interfaces humaines et machines

| ID | Capacité | Faisable concrètement | Entrées | Résultat | Statut | Validation | Version | Limites | Preuves |
|---|---|---|---|---|---|---|---|---|---|
| CAP-40 | **CLI complète** | 15 commandes racine, alias (`bp`,`rec`,`tpl`), `--json` global, `--no-colors` — invocation `node dist/cli/index.js …` (binaire `ekts` global seulement après `npm link`) | argv | tables lisibles OU JSON ; codes **0/1/2/3/4** | ✅ | Exécution réelle (aide, parcours, 3 codes d'erreur) + 14 fichiers tests CLI + E2E | M1→M3 | Installation = clone (LIM-01) | EV-07, EV-08, EV-09 |
| CAP-41 | **Serveur MCP connaissance** | 17 outils typés (Zod), stdio, instructions handshake | client MCP | résultats JSON structurés, erreurs `-32000` contextualisées | ✅ | **Handshake + tools/list + tools/call exécutés pendant l'audit** ; 22 fichiers tests MCP ; E2E mcp-flow 4/4 | M1→M3 | Hôte réel non instrumenté (NV-3) ; spec 2025-11-25 (LIM-08) | EV-04, EV-05, EV-06, EV-24 |
| CAP-42 | Config hôte prête | `.mcp.json` (commande + args) | — | ajoutable tel quel à un hôte MCP | 🟡 | Fichier présent et cohérent ; **non consommé par un vrai hôte pendant l'audit** | M1 | Dépend du build (`dist/`) | EV-13 |
| CAP-43 | **Serveur MCP navigateur** (5 outils `browser_navigate/screenshot/pdf/accessibility/close`) | ouvrir une page pour un agent, artefacts confinés, garde-fous URL (http(s) seul, pas d'hôtes privés par défaut) | import programmatique `createBrowserMcpServer` | outils MCP navigateur | 🟠 | 53 tests unit **mais aucun point d'entrée** (pas de commande/script) | M2 (S7) | **Non lançable sans écrire le câblage** (LIM-03) | EV-27 |
| CAP-44 | Scripts santé / diagnostic | `check:env`, `doctor`, `doctor:browsers`, `security:secrets`, `db:inspect`, `db:reindex`, `providers` | — | rapports texte + `artifacts/browser-doctor.json` | ✅ | Exécutés avec succès (poste utilisateur) | M1–M2 | — | EV-25, EV-32 |
| CAP-45 | Qualité continue | `verify` (5 sections), seuils couverture 80 %, ESLint, Prettier, CI 8 jobs | push | verdicts verts | ✅ | verify 0 + CI 8/8 pendant l'audit | M1 continu | — | EV-01, EV-03 |
| CAP-46 | Sécurité des secrets | `.env` ignoré, `.env.example` sans valeurs, Gitleaks pre-commit + CI, `npm audit` | — | aucun secret en dépôt | ✅ | gitleaks `no leaks found`, CI secrets ✓ | M1 | Rotation manuelle documentée (incident connu 23/10 — CHANGELOG) | EV-16, EV-29 |
| CAP-47 | Sécurité du navigateur MCP | refus hôte privé/identifiants URL, confinement `artifactsDir` | — | `UrlNotAllowedError`/`ArtifactError` | ✅ | Tests dédiés (playwright-mcp) | M2 | Non accessible tant que LIM-03 non levée | EV-27 |
| CAP-48 | Catalogue fournisseurs IA | 14+ fournisseurs, rotation clés `_2…_8`, politiques quality/free/cost, routage | `.env` | fournisseur sélectionné selon politique | 🟡 | Tests unitaires catalog/routing/env (5 fichiers) — **appels réseau réels non exécutés ici** | M1 (4.5) | Dépend des clés utilisateur (LIM-16) | EV-16, NV-2 |
| CAP-49 | Benchmark performance | job CI 100K documents | — | budget de recherche tenu en CI | ✅ | CI job vert (EV-03) | M1 continu | — | EV-34 |

## Ce que le catalogue ne couvre pas (rappel des frontières)

- **Aucune** capacité d'interaction (click, saisie, formulaire, défilement) :
  EV-26 → voir LIM-06. **Aucune** authentification de site : NV-1.
- **Aucune** consommation de MCP tiers : EV-26b.
- **Aucune** conversation/assistant intégré : pas de boucle LLM de dialogue
  dans le code (les fournisseurs servent embeddings/chat pour la recherche et
  les modes maison — le produit ne dialogue pas) — inférence `[CODE]` sur
  `src/business/providers/*` + absence de commande de type `chat` (EV-07
  liste les 15 commandes).
- **Aucune** diffusion multi-utilisateur : 3 bases fichiers locales
  (LIM-10).
