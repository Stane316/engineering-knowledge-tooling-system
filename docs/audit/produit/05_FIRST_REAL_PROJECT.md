# 05 — Premier projet réel recommandé

> **Objectif** : passer de « tout marche en morceaux » à « j'ai obtenu un
> résultat utile, une fois, de bout en bout, sur mon propre site ».
> Ce document est un **runbook exécutable**, pas un vœu.

---

## 1. Pourquoi ce scénario (et pas un autre)

**Scénario retenu : auditer et corriger une page web que l'utilisateur
possède déjà (landing page, blog, doc publique), en CLI, sur deux passages.**

| Scénario envisagé | Verdict | Raison |
|---|---|---|
| **A. Audit 2 passages d'une page réelle (CLI)** | ✅ **Retenu** | Vérifie la chaîne de valeur complète (inspect → rapport → correction → **comparaison** = le différenciateur MVP-2) ; prérequis minimaux (navigateurs déjà gérés) ; résultat jugable par un humain en 10 min |
| B. Base de connaissances perso (ajout/recherche de notes) | Secondaire | Trop léger pour prouver la valeur « audit » ; inclus en bonus (étape 7) |
| C. Intégration agent MCP d'emblée | Reporté au 2ᵉ cycle | Exige un hôte réel + le runbook A déjà maîtrisé (dépendance : le produit doit d'abord convaincre **l'humain**) — voir CH-P1-3 |
| D. Multi-projets / timeline / templates (MVP-3) | Reporté | N'a de sens qu'**après** quelques audits accumulés (second cycle) |
| E. Crawl d'un site entier (L4) | Impossible | Hors périmètre (LIM-06) |

---

## 2. Fiche du scénario

| Champ | Valeur |
|---|---|
| **Profil utilisateur** | Développeur solo ou lead technique, à l'aise en terminal, propriétaire d'au moins une page web publique |
| **Projet d'accueil** | Ex. : page d'accueil personnelle, README site GitHub Pages, landing de side-project — **une URL publique réelle** |
| **Problème à résoudre** | « Je ne sais pas où en est la qualité de cette page (perf, a11y, SEO, UX) et je veux un plan d'action concret, puis constater l'effet de mes corrections » |
| **Entrée fournie** | 1 URL + (option) 1–2 clés libres pour la recherche sémantique (non requises) |
| **Mode d'intégration retenu** | **CLI** (`ekts`) — justification : chemin le plus court et le plus prouvé (EV-07/08/09) ; MCP répété au 2ᵉ cycle (déjà câblé, `04`) |
| **Opérations** | Voir §4 |
| **Résultat attendu** | 2 rapports MD (+1 PDF) : audit n°1, audit n°2, **comparaison avec deltas** ; liste de corrections priorisées |
| **Interventions humaines** | (1) choisir l'URL (2) installer les prérequis (3) **corriger le site** entre les deux audits (le produit ne corrige pas le site pour vous) (4) juger la justesse des constats (LIM-12) |

## 3. Prérequis et configuration

1. Node ≥ 22.19 et npm ≥ 10 (`node --version`).
2. Clone du dépôt, branche à jour (`develop` ou tag de release).
3. `npm ci` → `npm run build` (EXIT 0 attendu).
4. Navigateurs : `npx playwright install chromium` (minimum) ou
   **`npm run browsers:install`** pour les 3 (Chromium, Firefox, WebKit).
   > ⚠️ `browsers:install` est un **script npm**, pas une commande
   > Playwright : `npx playwright browsers:install` renvoie
   > `error: unknown command`. Écrire `npm run browsers:install`.
5. `npx puppeteer browsers install chrome` (pour le PDF — LIM-14).
6. `npm run check:env` puis `npm run doctor` → **0 anomalie bloquante**.
7. Option : `.env` avec une clé d'embeddings pour la recherche sémantique
   (guide `docs/guides/PROVIDERS.md`) — **non requis** pour ce scénario.
8. Répertoire de données : laisser le défaut `data/` (projet dédié) ou fixer
   `EKTS_DATA_DIR`.

## 3.1 Invocation de la CLI (prérequis indispensable)

`ekts` **n'est pas** un exécutable présent sur le PATH après un simple
clone : le paquet n'est pas publié sur npm (LIM-01 / DEC-01) et `npm ci`
n'installe pas de binaire global. Taper `ekts init` produit donc
`Le terme « ekts » n'est pas reconnu…`. Trois façons correctes
(les trois sont testées, EV-35) :

| Moyen | Commande type | Quand l'utiliser |
|---|---|---|
| **A. Recommandé — node direct** | `node dist/cli/index.js init` | Toujours ; **stdout propre**, indispensable avec `--json` |
| **B. Via npm** | `npm run cli -- init` | Acceptable ; **`npm run --silent cli -- init`** pour un stdout propre |
| **C. Via npx, sans installation** | `npx --no-install ekts init` | Utilise le champ `bin` du paquet ; **stdout pur**, aucune installation globale |
| **D. Lien global local** | `npm link` → ensuite `ekts init` | Si vous voulez le `ekts` des exemples partout ; réversible par `npm unlink -g ekts` |

> ⚠️ Avec la forme B sans `--silent`, npm écrit `> ekts@0.2.0 cli` et
> `> node dist/cli/index.js …` **sur stdout** : le JSON de `--json` est
> alors précédé de deux lignes et `ConvertFrom-Json` / `jq` échoue
> (constaté, EV-35 → LIM-17).

Dans la suite du runbook, la forme **A** est utilisée ; les commandes
peuvent être préfixées par `node dist/cli/index.js` ou remplacées par
`npm run --silent cli --`.

## 4. Parcours complet d'utilisation

> Les commandes sont données pour la forme **A** (§3.1). Les chemins de
> `<URL>`, `<projectId>`, `<auditId>` sont des valeurs à remplacer.
> `-o artifacts/reports` garde les livrables dans un dossier **déjà
> ignoré par git** (LIM-18).

| # | Commande (réelle, testée) | Résultat attendu | Critère de réussite |
|---|---|---|---|
| 1 | `npm run check:env` | liste des OK | EXIT 0 |
| 2 | `node dist/cli/index.js init` | 3 bases créées | EXIT 0, chemins affichés |
| 3 | `node dist/cli/index.js project create "mon-site" --description "audit page perso" --json` | **UUID** du projet | EXIT 0 ; récupérer `id` |
| 4 | `node dist/cli/index.js inspect <URL> -p <projectId> -o artifacts/reports` | score 0–100 + N constats, audit stocké, rapport(s) écrit(s) | EXIT 0 ; `score ≥ 0` ; ≥ 1 finding **ou** score élevé justifié |
| 5 | `node dist/cli/index.js audit list --json --url <URL>` | 1 audit pour l'URL | `count ≥ 1` ; récupérer `audits[0].id` |
| 6 | `node dist/cli/index.js audit report <auditId> -f both -o artifacts/reports` | fichiers MD **et** PDF | fichiers non vides ; MD contient score + 5 dimensions |
| 7 | **Corrections sur le site** (humain) | site déployé | déploiement fait |
| 8 | `node dist/cli/index.js inspect <URL> -p <projectId> -o artifacts/reports` (2ᵉ) | 2ᵉ audit | EXIT 0 |
| 9 | `node dist/cli/index.js audit compare <auditId1> <auditId2> -o artifacts/reports` | deltas + recommandations | **2ᵉ score ≥ 1ᵉr − bruit** ET deltas non nuls si corrections |
| 10 | *Bonus capitalisation* : `node dist/cli/index.js bp extract <projectId> --json` puis `node dist/cli/index.js bp search "performance"` | bonnes pratiques extraites | `practicesExtracted ≥ 1` **si** ≥ 2 audits du projet (défaut `--min-audits 2`) ; sinon `0` **sans erreur** |
| 11 | Archivage | rapports + comparaison conservés | revue humaine finale |

**Notes de syntaxe vérifiées (EV-35)** :
- `project create` prend le **nom en positionnel** — il n'existe **ni
  `--name` ni `--url`** (`error: unknown option '--name'`, EXIT 2) ; le lien
  avec l'URL se fait par `inspect -p <projectId>`.
- `-f/--format` accepte `md`, `pdf` ou `both` (défaut `both`).
- `bp extract` exige **`--min-audits 2`** par défaut : lancé avec un seul
  audit, il répond `{"auditsAnalyzed":1,"practicesExtracted":0}` en EXIT 0
  (résultat vide, pas d'erreur).

## 5. Critères de qualité mesurables du livrable

| # | Critère | Mesure | Seuil |
|---|---|---|---|
| Q1 | Le rapport mentionne les 5 dimensions | grep sections MD | 5/5 |
| Q2 | Le score est dans la plage | lecture | 0 ≤ score ≤ 100 |
| Q3 | **Justesse indicative** : parmi les 3 premiers constats, ≥ 2 sont réellement observables sur la page (humain) | revue | ≥ 2/3 |
| Q4 | Le PDF s'ouvre et contient le même score que le MD | lecture | identique |
| Q5 | La comparaison affiche au moins un delta explicable | lecture | ≥ 1 delta lié aux corrections |
| Q6 | Temps d'audit L3 (page publique simple) | chronomètre | ≤ 120 s (budgets E2E observés : 16–35 s en local — EV-24 ; marge volontaire pour réseau variable) |
| Q7 | Reprise en cas d'erreur de saisie | commande invalide | code 2/4 + message actionnable (EV-09) |

## 6. Erreurs acceptables vs bloquantes

| Type | Exemple | Acceptable ? | Action |
|---|---|---|---|
| **Commande CLI introuvable** | `ekts : Le terme « ekts » n'est pas reconnu` | ✅ **attendu** | La CLI n'est pas installée globalement → §3.1 (forme A/B/C) |
| **Script npm confondu avec une commande Playwright** | `npx playwright browsers:install` → `unknown command` | ✅ **attendu** | `npm run browsers:install` |
| **Option inexistante** | `project create --name "x"` → `unknown option '--name'` (EXIT 2) | ✅ **attendu** | Nom en positionnel : `project create "x"` (prérequis 3) |
| **JSON non parsable** | `npm run cli -- … --json` + `ConvertFrom-Json` | ⚠️ piège connu (LIM-17) | `node dist/cli/index.js … --json` ou `npm run --silent cli -- …` |
| Réseau | site en 503 le temps de l'audit | ✅ | Relancer (message d'erreur + code retour ≠ 0) |
| Lighthouse lent | > 60 s sous charge | ✅ dans les bornes 180 s | Réduire la charge ou relancer |
| Chrome absent | PDF impossible | ⚠️ | `npx puppeteer browsers install chrome` (prérequis 5) |
| Firefox crash sandbox | repli automatique | ✅ | Aucune (EV-25) |
| **Aucun finding alors que la page est manifestement dégradée** | | ❌ **Bloquant qualité** | Signaler (LIM-12 — le scénario sert aussi à tester cela) |
| Score/constats absents du rapport | | ❌ Bloquant | Bug : ouvrir issue |

## 7. Conditions de réussite globales (« premier projet réussi »)

Le scénario est déclaré réussi si, **en une session** :
- les 11 étapes s'exécutent sans correction de code ni manipulation cachue ;
- Q1–Q7 sont atteints ;
- l'utilisateur juge le rapport **utile pour prioriser au moins 3
  corrections** (test de valeur final, bref entretien auto-évalué) ;
- **aucune** limite des catégories 🔴 de `03` n'est rencontrée (doc d'entrée
  réconciliée = CH-P0-2 préalable).

## 8. Risques du scénario

| Risque | Impact | Atténuation |
|---|---|---|
| Page trop simple (déjà optimisée) | Peu de constats → démonstration fade | Choisir une page réelle perfectible (auditor avant/après visible) |
| Hébergeur anti-bot | Échec navigation | Essayer une page locale (`npm run dev` du site) — E2E le fait déjà |
| LIM-12 (justesse) | Confiance entamée | Résultat de l'étape Q3 = donnée d'entrée pour CH-P2-1 |
| Oubli des prérequis Chrome | PDF absent | `doctor` + runbook §3 |

## 9. Intégration agent — variante B (cycle 2)

Une fois le scénario A réussi : reprendre `04` §scénario minimal (hôte réel,
3 appels MCP liés : projet → inspect → audit_report). **Même runbook, mode
MCP** : conditions = `.mcp.json` + hôte installé + CH-P1-3 exécuté.
