# État des lieux avant démarrage — EKTS

**Date de l'audit :** 21 octobre 2026  
**Auditeur :** Agent IA (Arena.ai)  
**Commit audité :** `c46cc18` — « ajout de la documentation globale issue du blueprint du projet »  
**Branche de travail :** `arena/079e2f26-engineering-knowledge-tooling`  
**Dépôt :** `Stane316/engineering-knowledge-tooling-system` (privé)  
**Nature :** audit de démarrage — lecture seule sur l'existant, aucune ligne de code écrite  
**Règles respectées :** aucune pull request créée, aucun secret manipulé, aucun fichier du dépôt supprimé

---

## 1. Verdict en une page

La **documentation est prête et exploitable** : 15 phases de recherche, 37 livrables numérotés, 14 bilans, 48 dossiers de sprint (43 369 lignes), 10 ADR. La cohérence de fond est bonne : architecture C Hybride, SQLite WAL + FTS5 + sqlite-vec, MCP stdio, Playwright, workflow de capitalisation.

Le **dépôt est en état « documentation seule »** : 163 fichiers suivis, 0 ligne de code, aucun `package.json`, aucun test, aucun workflow CI, aucune protection de branche. C'est conforme à ce que le prompt de transfert annonce (« phase d'implémentation à démarrer »).

En revanche, **le Sprint 1 tel qu'il est rédigé ne peut pas être exécuté à l'identique** : les commandes qu'il prescrit produisent aujourd'hui des échecs certains (ESLint 10, TypeScript 7, Node 20, SDK MCP v2, Gitleaks, CI). Ces écarts ne remettent pas l'architecture en cause ; ils relèvent de la **dérive entre la documentation (rédigée à partir d'un état de l'écosystème antérieur) et les versions réellement publiées au 21 octobre 2026**.

### 1.1 Synthèse

| # | Constat | Gravité | Bloque le Sprint 1 ? |
|---|---------|---------|----------------------|
| 1 | Racine du code indéterminée (racine du dépôt vs `Blueprint Engineering-Knowledge-Tooling-System/`) | 🔴 Bloquant | Oui |
| 2 | Baseline « Node.js 20+ » incompatible avec Vitest 5, better-sqlite3 13, commander 15 | 🔴 Bloquant | Oui |
| 3 | ESLint 10 a supprimé `.eslintrc.json` et `--ext` : `npm run lint` échouera | 🔴 Bloquant | Oui |
| 4 | TypeScript 7.0.2 (latest) hors du peer range de typescript-eslint (`<6.1.0`) → `ERESOLVE` | 🔴 Bloquant | Oui |
| 5 | SDK MCP « v2 » inexistant (dernière version publiée : 1.32.1) | 🔴 Bloquant (ADR) | Non (Sprint 6) |
| 6 | `main` non protégée, aucun ruleset, 0 workflow CI | 🟠 Majeur | Non (mais critère C1.10) |
| 7 | Gitleaks : configuration incomplète, allowlist en minuscules, faux secrets dans les docs → premier scan en échec | 🟠 Majeur | Oui (critère C1.7) |
| 8 | `.gitignore` du prompt de transfert ignore `package-lock.json` alors que la CI utilise `npm ci` | 🟠 Majeur | Oui |
| 9 | Triggers CI limités à `main`/`develop` : les branches de travail ne déclenchent rien | 🟠 Majeur | Oui |
| 10 | Incohérences documentaires (chemins, comptages, statuts de sprint, libellés) | 🟠 Majeur | Non |
| 11 | Convention de branches à trois variantes, dont une impossible dans cette session | 🟠 Majeur | Non (dérogation à consigner) |
| 12 | Aucun secret réel détecté, dépôt privé, licence MIT, `.gitignore` sprint correct | ✅ Bon point | — |

### 1.2 Trois décisions à prendre avant toute écriture de code

1. **Où vivra le code ?** À la racine du dépôt (et le blueprint est déplacé sous `docs/blueprint/`) ou dans le dossier blueprint actuel ?
2. **Quelle baseline Node ?** Node 22 LTS (recommandé, aligné sur la toolchain publiée) ou Node 20 avec épinglage de versions 2024-2025 ?
3. **Que fait-on du SDK MCP « v2 » ?** Correction de l'ADR vers `@modelcontextprotocol/sdk ^1.32` (recommandé) ou maintien de la cible v2 en assumant qu'elle n'existe pas encore ?

Ces trois décisions conditionnent la première ligne de code. Deux décisions complémentaires (D4 : lot de corrections documentaires ; D5 : protection de `main`) sont détaillées en **§7**, avec le plan d'action en **§8**.

---

## 2. Méthode et périmètre

### 2.1 Ce qui a été audité

- **Dépôt GitHub** : métadonnées, branches, protection, workflows, environnements, réglages de fusion, topics, sécurité déclarative.
- **Contenu versionné** : arborescence, volumétrie, doublons (empreintes MD5), présence des documents cités.
- **Cohérence interne** : chemins référencés, comptages annoncés, statuts, versions logicielles, commandes prescrites.
- **Environnement d'exécution** : Node, npm, Git, compilateurs, binaires disponibles, accès au registre npm.
- **Faisabilité** : versions réellement publiées sur `registry.npmjs.org` et `api.github.com` au 21 octobre 2026.

### 2.2 Ce qui n'a pas pu être vérifié

| Élément | Raison | Contournement |
|---------|--------|---------------|
| Activation de GitHub Actions | `GET /actions/permissions` → **403** (jeton à portée limitée) | Vérification manuelle dans Settings → Actions |
| Secrets et variables GitHub | `GET /actions/secrets` → **403** | Vérification manuelle ; aucun besoin pour le Sprint 1 |
| Protection détaillée de `main` | L'endpoint `/protection` renvoie 403, mais `/branches/main` répond `protected: false` et `/rulesets` renvoie `[]` | Conclusion fiable : **aucune protection active** |
| Historique Git complet | Clone local **shallow** (`grafted`) | L'API GitHub indique au moins 2 commits (`c46cc18` ← `74a7063`) |
| Exécution réelle du Sprint 1 | Aucun code n'existe ; l'audit est statique | Le plan §8.2 corrige les commandes avant exécution |

### 2.3 Commandes principales utilisées

```bash
git log --all --oneline --decorate
git ls-files | wc -l
find . -path ./.git -prune -o -type f -print | wc -l
find . -type f \( -name '*.md' -o -name '*.csv' -o -name '*.pdf' \) -print0 | xargs -0 md5sum | sort
wc -l Docs/roadmap/sprints/*.md
grep -rn "..." --include="*.md" .
gh repo view ... --json ...
gh api repos/.../branches/main
gh api repos/.../rulesets
gh api repos/.../actions/workflows
npm view <paquet> version engines.node peerDependencies
```

---

## 3. État factuel du dépôt

### 3.1 Métadonnées GitHub

| Élément | Valeur observée | Commentaire |
|---------|-----------------|-------------|
| Dépôt | `Stane316/engineering-knowledge-tooling-system` | ✅ conforme |
| Visibilité | **Privée** | ✅ conforme à la recommandation |
| Licence | **MIT** | ✅ |
| Branche par défaut | `main` | ✅ |
| Création | 21 octobre 2026, 23:23 UTC | Même journée que la documentation |
| Dernier push | 21 octobre 2026, 23:53 UTC | Correspond au commit audité |
| Branches distantes | `main` uniquement | `develop` **n'existe pas** |
| Protection de `main` | **Aucune** (`protected: false`, `rulesets: []`) | ⚠️ écart avec `Docs/06` |
| Workflows GitHub Actions | **0** | ⚠️ écart avec le critère C1.10 |
| Environnements | **0** | — |
| Issues / Wiki / Projects | **Activés** | Wiki redondant avec `Docs/` |
| Discussions | Désactivées | — |
| Security policy | **Aucune** (`security_policy_url: null`) | 🟡 à ajouter |
| Topics | Aucun | 🟡 cosmétique |
| Méthodes de fusion | merge, squash, rebase toutes autorisées | À restreindre selon la convention |
| Auto-merge / suppression de branche | Désactivés | — |
| Permission du jeton | `ADMIN` mais portée fine-grained limitée | Explique les 403 Actions |

### 3.2 Contenu versionné

| Indicateur | Valeur |
|------------|--------|
| Fichiers suivis | **163** |
| Fichiers Markdown | **156** (101 179 lignes) |
| Fichiers CSV | 5 |
| Fichiers PDF | 1 (9,4 Mo) |
| Taille de l'arbre de travail | ~14 Mo (hors `.git`) |
| Taille de `.git` | ~11 Mo |
| Livrables de phase numérotés | **37** |
| Bilans de phase | **14** (Phases 01 à 14) |
| Total fichiers de phase | **51** |
| Documents de sprint | **48** (12 sprints × 4) — **43 369 lignes** |
| Documents de référence `Docs/` | 7 (00, 01, 02, 03, 05, 06, 08) |
| Documents de référence externe | DRI 12 fichiers, HarnAI 17 fichiers, Students 6 fichiers, Human-Brilliance 1 PDF |
| Code source | **0 fichier** |

### 3.3 Arborescence observée

```
engineering-knowledge-tooling-system/
├── LICENSE
├── README.md                                  ← 433 octets, placeholder
└── Blueprint Engineering-Knowledge-Tooling-System/
    ├── INDEX.md                               ← 548 lignes
    ├── AUDIT-ECOSYSTEME-AGENTIQUE.md          ← doublon strict
    ├── cartographie-creation-numerique.md     ← doublon strict
    ├── matrice-decision.csv                   ← doublon strict
    ├── 00-Strategy/            (3 fichiers)
    ├── 01-Foundations/         (2 + 1 bilan)
    ├── 02-Agent-Integration/   (4 + 2 bilans)
    ├── 03-Browser-and-Scraping/ (7 + 3 bilans)
    ├── 04-Knowledge/           (5 + 2 bilans)
    ├── 05-Creative-Engineering/ (5 + 2 bilans)
    ├── 06-Security/            (2 + 1 bilan)
    ├── 07-Architecture-and-Roadmap/ (9 + 3 bilans)
    ├── Docs/
    │   ├── 00, 01, 02, 03, 05, 06, 08      ← 04 et 07 absents
    │   ├── Référence/          (dri/, harnai/, students/, Human-Brilliance/)
    │   ├── roadmap/sprints/     ← 48 documents
    │   └── audit/               ← créé par cet audit
    └── inventaire/              (3 fichiers)
```

### 3.4 Environnement d'exécution

| Outil | Version / état | Suffisant pour le Sprint 1 ? |
|-------|----------------|------------------------------|
| Node.js | **22.22.3** | ✅ oui (satisfait Vitest 5, better-sqlite3 13, commander 15) |
| npm | 10.9.8 | ✅ oui |
| Git | 2.39.5 | ✅ oui |
| Python 3 / make / g++ | présents | ✅ oui (build natif `better-sqlite3`) |
| `tree`, `jq`, `curl`, `wget` | présents | ✅ oui |
| `gitleaks` | **absent** | ⚠️ à installer en Sprint 1 (GitHub Releases accessible) |
| `sqlite3` (CLI) | absent | 🟡 non requis (le module Node embarque SQLite) |
| Registre npm | `https://registry.npmjs.org/` accessible | ✅ oui |
| Espace disque | 20 Go libres | ✅ oui |

---

## 4. Ce qui est confirmé par l'audit

| Affirmation du prompt de transfert | Vérification |
|------------------------------------|--------------|
| 15 phases de recherche (00-14) | ✅ 8 dossiers de phase + 14 bilans |
| 12 sprints documentés | ✅ 48 fichiers `SPRINT-01` à `SPRINT-12`, 3 sous-sprints chacun |
| ~43 369 lignes de documentation de sprint | ✅ valeur exacte |
| Architecture C Hybride | ✅ ADR-005, `Docs/02`, `Docs/03` |
| SQLite WAL + FTS5 + sqlite-vec, 3 bases | ✅ ADR-001, cohérent dans les sprints 2 et 4 |
| MCP stdio, 4 outils prioritaires | ✅ ADR-002 et ADR-009 |
| Recherche hybride RRF k=60 | ✅ ADR-004 |
| Playwright, 4 niveaux d'inspection | ✅ ADR-003 (mais voir E9 sur « 4 niveaux (L1-L3) ») |
| Validation Zod | ✅ ADR-010 |
| 4 niveaux de sécurité, STRIDE | ✅ ADR-007, `06-Security/` |
| 38 vecteurs STRIDE, registre ADR | ✅ `Docs/08` |
| Aucun code, aucun test | ✅ confirmé (0 `package.json`, 0 `src/`) |
| Documents de référence listés dans le prompt | ✅ présents, sauf `Docs/04` et `Docs/07` (voir E4) |

---

## 5. Écarts et anomalies

Les identifiants **A** (architecture/racine), **B** (outillage), **C** (CI/GitHub), **D** (sécurité), **E** (documentation), **F** (gouvernance) sont utilisés dans le plan §8.

### 5.1 A — Structure et racine du projet

| ID | Gravité | Constat | Preuve | Impact |
|----|---------|---------|--------|--------|
| **A1** | 🔴 | **La racine du code n'est définie nulle part.** Toute la documentation suppose que `Docs/` est à la racine du dépôt ; en réalité tout est imbriqué dans `Blueprint Engineering-Knowledge-Tooling-System/`. | `Docs/Référence/README.md:34` : « le code source (dans `Engineering-Knowledge-Tooling-System/src/`) » ; `SPRINT-01-02.md:57` crée `docs/` à côté de `src/` | Le Sprint 1 créerait `package.json` au mauvais endroit ; les chemins des 48 docs de sprint deviendraient faux |
| **A2** | 🟠 | **Espace dans le nom du dossier** (`Blueprint Engineering-Knowledge-Tooling-System`) | Arborescence | Chaque commande doit être quotée ; scripts npm, CI et tâches VS Code fragilisés |
| **A3** | 🟠 | **Collision de casse `docs/` (créé par Sprint 1) vs `Docs/` (existant)** | `SPRINT-01-02.md:57`, `SPRINT-01-03.md` tâche 1.7 | Sur Windows/macOS (système insensible à la casse) les deux dossiers fusionneraient : documentation du projet mélangée au blueprint |
| **A4** | 🟠 | **Le README racine sera écrasé** | `SPRINT-01-03.md:196-260` réécrit `README.md` ; le README actuel fait 433 octets | Perte du seul point d'entrée actuel ; à décider explicitement |
| **A5** | 🟡 | **Trois doublons stricts** (MD5 identiques) | `AUDIT-ECOSYSTEME-AGENTIQUE.md`, `cartographie-creation-numerique.md`, `matrice-decision.csv` présents à la racine **et** dans `Docs/Référence/` | Deux sources de vérité ; corrections futures divergentes |

**Recommandation A** : retenir une racine unique et sans espaces. Option recommandée : le code vit à la **racine du dépôt** et le contenu documentaire est déplacé sous `docs/blueprint/` (voir §7, décision D1).

---

### 5.2 B — Chaîne d'outillage et versions

Instantané du registre npm le **21 octobre 2026** :

| Paquet | Dernière version | `engines.node` / peer | Ce que prescrit la documentation |
|--------|------------------|----------------------|----------------------------------|
| `eslint` | **10.13.0** | `^20.19 \|\| ^22.13 \|\| >=24` | `.eslintrc.json`, `eslint src --ext .ts` |
| `typescript` | **7.0.2** | `>=16.20` | « TypeScript 5+ » sans borne haute |
| `typescript-eslint` | **8.72.0** | TS `>=4.8.4 <6.1.0` | — |
| `vitest` | **5.0.5** | `^22.12 \|\| ^24 \|\| >=26` | Node 20+ / matrice CI 20.x |
| `@vitest/coverage-v8` | 5.0.5 | peer `vitest@5.0.5` | + `c8` (redondant) |
| `better-sqlite3` | **13.0.3** | `>=22` | Node 20+ |
| `commander` | **15.0.0** | `>=22.12.0` | Node 20+ |
| `zod` | 4.6.7 | — | non épinglé |
| `pino` | 10.4.0 | — | non épinglé |
| `@modelcontextprotocol/sdk` | **1.32.1** | `>=18` | « **v2** » |
| `sqlite-vec` | 0.1.9 | binaires linux/darwin/win | non épinglé |
| `@playwright/test` | 1.64.1 | `>=20` | non épinglé |
| `c8` | 12.0.0 | `^20.19 \|\| ^22.12 \|\| >=23` | installé **en plus** de coverage-v8 |
| `prettier` | 3.9.10 | `>=14` | non épinglé |
| `gitleaks` (binaire) | **v8.30.1** | — | **v8.18.0** |

| ID | Gravité | Constat | Preuve | Impact |
|----|---------|---------|--------|--------|
| **B1** | 🔴 | **Baseline Node incohérente.** Vitest 5 exige `^22.12`, better-sqlite3 13 exige `>=22`, commander 15 exige `>=22.12`. La matrice CI `[20.x, 22.x]` et le prérequis « Node.js 20+ » ne tiennent plus. | `Docs/03-STACK…:37` (« Node.js 20+ LTS »), `SPRINT-01-01.md:29`, `SPRINT-01-03.md:621` | Le job Node 20.x échouera dès `npm ci` ; l'utilisateur sur Node 20 ne pourra pas installer |
| **B2** | 🔴 | **Configuration ESLint obsolète.** ESLint 10.0.0 (février 2026) a **supprimé** le système `eslintrc` : `.eslintrc.json`, `.eslintignore`, `--ext`, `--env` ne sont plus honorés. | `SPRINT-01-01.md:108-176` ; [ESLint v10 release notes](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) | `npm run lint` échoue immédiatement |
| **B3** | 🔴 | **TypeScript 7 hors peer range.** `npm i -D typescript` installe 7.0.2, alors que `typescript-eslint@8.72` déclare `<6.1.0` → `ERESOLVE`. | `npm view typescript-eslint peerDependencies` | Échec d'installation ou nécessité de `--legacy-peer-deps` (à éviter) |
| **B4** | 🔴 | **« SDK MCP v2 » n'existe pas.** Le registre ne publie qu'une ligne 1.x (`latest = 1.32.1`). Les docs exigent pourtant v2 dans l'ADR, `Docs/02`, `Docs/03`, `SPRINT-06.md`, et vérifient `@2.x.x`. | `npm view @modelcontextprotocol/sdk dist-tags` ; `SPRINT-06-01.md:91` | Sprint 6 non exécutable tel quel ; décision ADR à corriger |
| **B5** | 🟠 | **`c8` en doublon de `@vitest/coverage-v8`.** | `SPRINT-01-01.md:218` | Dépendance inutile, deux rapports concurrents |
| **B6** | 🟠 | **Gitleaks 8.18.0 (2024) alors que 8.30.1 est publié.** Les versions ≥ 8.19 proposent `gitleaks git` / `gitleaks dir` ; la compatibilité de `detect --staged` dépend donc de la version installée. | `SPRINT-01-03.md:52-53`, `:99` | Comportement non déterministe selon la version installée |
| **B7** | 🟡 | **Aucune version n'est épinglée** dans les commandes (`npm install` sans `@x.y.z`). | Tous les sprints | Builds non reproductibles, dérive silencieuse |

**Recommandation B** : figer une **matrice de versions** dans `package.json` (versions exactes + `engines`), adopter la baseline **Node 22 LTS**, ESLint **flat config**, Vitest **5** + `coverage-v8` seul, TypeScript **5.9.x** en attendant la compatibilité de l'outillage avec TS 7, SDK MCP **1.32.x**.

---

### 5.3 C — CI/CD et réglages GitHub

| ID | Gravité | Constat | Preuve | Impact |
|----|---------|---------|--------|--------|
| **C1** | 🔴 | **Aucun workflow versionné** alors que le Sprint 1 exige une CI verte. | `actions/workflows` → `total_count: 0` | Critère C1.10 non satisfait ; aucun garde-fou automatique |
| **C2** | 🔴 | **Triggers inopérants** : `push.branches: [main, develop]`. `develop` n'existe pas et les branches de travail (`sprint/*`, `agent/*`, `arena/*`) ne déclenchent **rien**. | `SPRINT-01-03.md:606-612` | La CI ne tournerait jamais sur les branches de l'agent : aucun retour avant fusion |
| **C3** | 🟠 | **`on: pull_request` alors que les PR sont interdites.** | `SPRINT-01-03.md:611` | Configuration sans objet, source de confusion |
| **C4** | 🟠 | **Contradiction lockfile** : la CI utilise `npm ci` (qui exige `package-lock.json`) alors que le `.gitignore` du prompt de transfert ignore ce fichier. Le `.gitignore` de `SPRINT-01-03` est, lui, correct. | `SPRINT-01-03.md:634` ; prompt de transfert §Sécurité | `npm ci` échoue si le lockfile n'est pas commité ; builds non reproductibles |
| **C5** | 🟠 | **`main` n'est pas protégée** alors que `Docs/06` l'exige (push direct interdit, revue requise). | `branches/main` → `protected: false` ; `rulesets: []` | Aucun garde-fou ; risque d'écrasement |
| **C6** | 🟠 | **Contradiction de gouvernance** : « merge via revue uniquement » + « PR interdites » ne peuvent coexister sans procédure de fusion locale explicite. | `Docs/06-GUIDE…:55`, `:323` | Blocage procédural au moment de l'intégration |
| **C7** | 🟡 | `codecov/codecov-action@v3` (obsolète), token requis pour un dépôt privé, `fail_ci_if_error: false`. | `SPRINT-01-03.md:650` | Étape décorative ; préférer un artefact de couverture |
| **C8** | 🟡 | `actions/checkout@v4`, `actions/setup-node@v4` : versions à revalider (majeures plus récentes disponibles). | idem | Maintenance |
| **C9** | 🟡 | Wiki, Projects et Issues activés sans usage défini ; Wiki crée une seconde documentation non versionnée. | Métadonnées GitHub | Divergence documentaire |

**Recommandation C** : workflow unique `ci.yml` déclenché sur **toutes les branches** (`push: branches: ['**']`), sans `pull_request`, matrice `[22.x]` (ou `[22.x, 24.x]`), `npm ci`, lint + build + test + couverture, artefact de couverture ; ruleset `main` sans exigence de PR (checks requis, force-push interdit, historique linéaire).

---

### 5.4 D — Sécurité

| ID | Gravité | Constat | Preuve | Impact |
|----|---------|---------|--------|--------|
| **D1** | 🟠 | **La configuration Gitleaks remplace les règles par défaut** : trois regex custom, sans `[extend] useDefault = true`. | `SPRINT-01-03.md:60-92` | Couverture très inférieure à Gitleaks standard (clés AWS, Stripe, etc. non détectées) |
| **D2** | 🟠 | **Allowlist `docs` (minuscule) ne couvre pas `Docs/`** (majuscule) dans la disposition actuelle ; trois faux secrets `sk-…` figurent dans la documentation. | allowlist `SPRINT-01-03.md:82-91` ; faux secrets `:158`, `:177`, `:774` | Risque élevé que le premier `gitleaks detect` **échoue** à cause des exemples de documentation |
| **D3** | 🟠 | **Hook dans `.git/hooks/pre-commit` non versionné** : il n'existera jamais chez l'utilisateur ni dans un autre clone. | `SPRINT-01-03.md:96-107` | Fausse sécurité : la protection ne s'applique qu'au sandbox |
| **D4** | 🟡 | Aucune analyse de secrets en CI (uniquement un hook local). | — | Contournement trivial (`--no-verify`) |
| **D5** | 🟡 | Pas de `SECURITY.md`, pas de `dependabot.yml`, pas de `CODEOWNERS`. | Métadonnées | Hygiène à compléter |
| **D6** | ✅ | **Aucun secret réel détecté** dans les 163 fichiers (scan regex : `sk-`, `ghp_`, `github_pat_`, `AKIA`, `xox*`, clés privées). Les 6 occurrences trouvées sont des exemples ou des placeholders. | Scan du 21/10/2026 | Bon point |
| **D7** | ✅ | Dépôt privé, `.env` ignoré, bases `*.db` ignorées, PDF exempt de secret. | — | Bon point |

**Recommandation D** : `[extend] useDefault = true`, allowlist ciblée sur `Blueprint .*/Docs/roadmap/sprints/` (ou remplacement des faux secrets par `sk-EXAMPLE…`), solution de hook versionnée (`husky` ou `lefthook`), job Gitleaks en CI, `dependabot.yml`, `SECURITY.md`.

---

### 5.5 E — Cohérence documentaire

| ID | Gravité | Constat | Preuve | Correction proposée |
|----|---------|---------|--------|---------------------|
| **E1** | 🟠 | `INDEX.md` décrit un dossier `Sources/` **inexistant** (les références sont dans `Docs/Référence/`). | `INDEX.md:95`, `:165` | Remplacer par `Docs/Référence/` |
| **E2** | 🟠 | Titre « Phases 02-14 — À venir ⏳ » alors que tout est terminé. | `INDEX.md:141` | Renommer « Phases 02-14 — Terminées ✅ » |
| **E3** | 🟠 | « 47 livrables » alors qu'il existe **37 livrables numérotés + 14 bilans = 51 fichiers**. | `INDEX.md:159` ; comptage §3.2 | Corriger le total et expliciter la définition |
| **E4** | 🟠 | `Docs/00` marque comme ⏳ des documents **déjà écrits** (01, 02, 03, 05, 06, 08) et liste deux documents réellement absents (`04-FLUX-OPERATIONNELS`, `07-CONFIGURATIONS-EXTERNES`). | `Docs/00…:996-1004` | Mettre à jour les statuts ; décider création ou abandon de 04/07 |
| **E5** | 🟠 | Chemins erronés dans les documents de sprint : `Docs/04-Knowledge/…` alors que le dossier est `04-Knowledge/…` ; `07_ETUDE_RAG_ET_RECHERCHE_SEMANTIQUE.md` alors que le fichier est `07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md`. | `SPRINT-02.md:25-26`, `SPRINT-02-03.md:464`, `Docs/00…:338` | Corriger le préfixe et le nom |
| **E6** | 🟠 | Chemins absolus obsolètes `/home/user/uploads/…`, `/home/user/recherche/…`, `/home/user/matrice-decision.csv`. | `Docs/00…:979-990` | Remplacer par les chemins relatifs du dépôt |
| **E7** | 🟠 | Comptages de références faux : HarnAI annoncé à 9 ou 15 documents (réel : **17 fichiers**) ; Students à 3 (réel : **6 fichiers**). | `INDEX.md:170-171`, `Docs/Référence/00-README.md:13-15`, prompt §Références | Aligner sur le contenu réel |
| **E8** | 🟠 | **Statuts de sprint hétérogènes** : 8 « ⏳ NON COMMENCÉ », 17 « 🟡 Documenté — En attente approbation », **23 sans en-tête de statut**. Un gabarit affiche « ✅ Validé (88/88) ». | `grep` sur les 48 fichiers ; `SPRINT-12-03.md:559` | Unifier la convention (voir F3) ; marquer les gabarits |
| **E9** | 🟠 | Contradictions internes : « 4 niveaux d'inspection (L1-L3) » ; « 12 sprints » vs 18 ; « 17 sprints suivants » ; « 15 phases (14 exécutées) ». | `13_ROADMAP…:280`, `SPRINT-08.md:1-4`, `INDEX.md:458`, `SPRINT-01.md:16`, `Docs/01…:17` | Trancher : 4 niveaux (L1-L4) ou 3 (L1-L3) ; 18 sprints partout |
| **E10** | 🟡 | Deux index concurrents dans `Docs/Référence` (`README.md` et `00-README.md`) avec des comptages différents ; `harnai/README.md` est cité mais **absent** ; liens Obsidian `[[…]]` non rendus par GitHub. | `Docs/Référence/` ; `README.md` du dossier `harnai/` | Fusionner en un index unique en liens relatifs |
| **E11** | 🟡 | `Docs/roadmap/ROADMAP-GLOBALE.md` et `REGISTRE-AVANCEMENT.md` toujours listés « à créer ». | `Docs/00…:1007-1009` | Créer le registre d'avancement |
| **E12** | ✅ | ADR-001 à ADR-010 complets, sourcés, avec alternatives et conséquences ; 3 ADR à trancher (T01-T03) et 3 points de veille (V01-V03) correctement identifiés. | `Docs/08` | Bon point |
| **E13** | ✅ | Les 48 dossiers de sprint sont détaillés (tâches atomiques, critères, dépannage, récupération, sécurité). | 43 369 lignes | Bon point |

---

### 5.6 F — Gouvernance et workflow

| ID | Gravité | Constat | Preuve | Impact |
|----|---------|---------|--------|--------|
| **F1** | 🔴 | **Trois conventions de branches** : `agent/sprint-XX-XX` (prompt), `sprint/{numero}/{description}` (`Docs/06`), et la branche de session imposée `arena/079e2f26-…`. Cette session **ne peut pas** créer d'autre branche. | prompt §Workflow ; `Docs/06:171` ; consigne de session | Dérogation nécessaire, à documenter pour éviter un faux historique |
| **F2** | 🟠 | Procédure de fusion incompatible avec l'interdiction de PR (voir C6). | `Docs/06:323-393` | Il faut un runbook « fusion locale ff-only » sans PR |
| **F3** | 🟠 | Aucun registre d'avancement ; statuts hétérogènes (E8). | `Docs/roadmap/` | Impossible de savoir en un coup d'œil ce qui est fait |
| **F4** | 🟡 | Les règles critiques (pas de PR, pas de secrets, conventions) ne vivent que dans un prompt externe. | — | Un nouveau clone ne les connaît pas ; ajouter `AGENTS.md` versionné |
| **F5** | ✅ | L'interdiction de PR est explicite, répétée et cohérente dans le prompt et dans `Docs/06`. | 28 mentions | Bon point |

---

## 6. Prérequis manquants (interventions utilisateur)

| # | Prérequis | Pourquoi | Procédure | Vérification |
|---|-----------|----------|-----------|--------------|
| P1 | **Activer/vérifier GitHub Actions** | L'API renvoie 403 ; 0 workflow | GitHub → Settings → Actions → General → « Allow all actions » | L'onglet Actions affiche « Get started with GitHub Actions » |
| P2 | **Décider la protection de `main`** | `main` est ouverte aux pushes directs | Settings → Rules → New ruleset (voir §8.3) | `gh api repos/…/rulesets` renvoie le ruleset |
| P3 | **Choisir la racine du code** | Décision D1 (§7) | Réponse à donner à l'agent | Arborescence cible validée |
| P4 | **Choisir la baseline Node** | Décision D2 (§7) | Réponse à donner à l'agent | `engines` et CI alignés |
| P5 | **Arbitrer le SDK MCP** | Décision D3 (§7) | Mise à jour ADR | ADR-009/`Docs/03` cohérents |
| P6 | **Autoriser (ou non) le lot de corrections documentaires** | Décision D4 (§7) | Réponse à donner à l'agent | Commit `docs(audit): …` |
| P7 | **Confirmer l'absence de secrets GitHub nécessaires** | Le Sprint 1 n'en a aucun | Aucune action | — |
| P8 | **Installer Gitleaks en local (VS Code)** | Le hook ne protège que le sandbox | `winget install gitleaks` / `brew install gitleaks` / binaire GitHub | `gitleaks version` ≥ 8.30 |

**Aucun compte API externe, aucune clé, aucun serveur MCP n'est requis pour le Sprint 1.**

---

## 7. Décisions demandées

### D1 — Emplacement de la racine du code

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A (recommandée)** | Code à la **racine du dépôt** ; blueprint déplacé sous `docs/blueprint/` (renommage sans espaces) | Chemins des docs corrects après un seul `git mv` ; CI, `package.json`, `src/` au standard ; pas de collision `Docs`/`docs` | Un commit de déplacement massif (163 fichiers) ; l'historique reste suivi par Git |
| **B** | Code dans le dossier actuel, renommé `ekts/` | Aucun déplacement de la documentation | Nom de dossier non standard ; collision `Docs/` vs `docs/` à résoudre ; chemins npm fragiles |
| **C** | Code dans un sous-dossier `code/` | Séparation nette docs/code | Troisième niveau ; les 48 docs restent faux ; CI à configurer avec `working-directory` |

**Recommandation : A.** Coût estimé : un commit de renommage + mise à jour des chemins dans `INDEX.md`, `Docs/00`, `Docs/06`, `Docs/Référence/README.md`.

### D2 — Baseline Node

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A (recommandée)** | **Node 22 LTS minimum**, CI `[22.x, 24.x]`, versions courantes épinglées | Aligné sur Vitest 5, better-sqlite3 13, commander 15, ESLint 10 ; environnement déjà en 22.22.3 ; support jusqu'en 2027 | Écarte Node 20, déjà en fin de vie |
| **B** | Rester Node 20 et épingler `vitest@3`, `better-sqlite3@12`, `commander@14`, `eslint@9`, `typescript@5.9` | Compatibilité maximale avec le matériel ancien | Dette immédiate ; ESLint 9 est déjà en maintenance (v10 publiée en février 2026) ; deux ans de retards |

**Recommandation : A.** Ajouter `"engines": { "node": ">=22.12.0" }` et un `.nvmrc` (`22`).

### D3 — SDK MCP

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A (recommandée)** | Corriger la cible vers `@modelcontextprotocol/sdk ^1.32` et adapter l'ADR | Réalité du registre ; API `McpServer` déjà utilisée dans `SPRINT-11-03` | Nécessite une correction ADR + 6 documents |
| **B** | Maintenir « v2 » comme cible et attendre sa publication | Fidélité au document | Sprint 6 bloqué ; `npm install` installe 1.32 de toute façon |
| **C** | Épingler 1.32 aujourd'hui, tracer « migration v2 » comme veille | Exécution immédiate + veille | Ajoute une ligne au registre des risques |

**Recommandation : A ou C** (équivalent à l'exécution ; C est plus prudent).

### D4 — Lot de corrections documentaires avant le Sprint 1

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A (recommandée)** | Un commit `docs(audit)` corrigeant E1-E7, E9-E11 + addenda ADR (D2, D3) | Les 48 docs redeviennent fiables avant d'écrire du code | ~1 session ; risque de toucher beaucoup de fichiers |
| **B** | Commencer le Sprint 1 et corriger au fil de l'eau | Vitesse apparente | Un agent futur lira des documents faux ; dette immédiate |
| **C** | Corriger uniquement les points bloquants (E1, E4, E5, E6) | Compromis | Les comptages et statuts restent faux |

**Recommandation : A**, avec un périmètre limité aux documents listés en §8.1.

### D5 — Protection de `main`

| Option | Description |
|--------|-------------|
| **A (recommandée)** | Ruleset : `required_status_checks` (CI), `non_fast_forward`, `required_linear_history`, **sans** « require pull request » |
| **B** | Aucune protection (statu quo) |
| **C** | Protection complète avec PR obligatoire — **incompatible avec l'interdiction de PR** |

---

## 8. Plan d'action proposé

### 8.1 Sprint 0 — Hygiène documentaire et décisions (1 session)

Objectif : rendre la documentation exploitable et les décisions traçables, **sans écrire de code**.

| Tâche | Fichiers | Critère d'acceptation |
|-------|----------|-----------------------|
| 0.1 Appliquer D1 (racine du code) | `mkdir -p docs && git mv "Blueprint Engineering-Knowledge-Tooling-System" docs/blueprint` (option A) | `git status` propre, cible conforme à l'arborescence ci-dessous |
| 0.2 Corriger `INDEX.md` (E1-E3, E7) | `INDEX.md` | Plus de `Sources/`, total exact, comptages DRI/HarnAI/Students exacts |
| 0.3 Corriger `Docs/00` (E4-E6) | `Docs/00-REFERENCE…` | Statuts réels, chemins relatifs, décision sur 04/07 |
| 0.4 Corriger les chemins de sprint (E5) | `SPRINT-02*.md` | `04-Knowledge/…` sans préfixe `Docs/` |
| 0.5 Unifier les statuts (E8) et créer le registre | `Docs/roadmap/REGISTRE-AVANCEMENT.md` | 48 lignes avec un statut unique par sprint |
| 0.6 Addenda ADR (D2, D3) | `Docs/08`, `Docs/03`, `Docs/00`, `SPRINT-06*` | « Node 22 LTS », « SDK 1.32.x », veille v2 tracée |
| 0.7 Note de dérogation branches (F1) | `Docs/06` | Convention `arena/*` documentée comme exception de session |
| 0.8 `AGENTS.md` versionné (F4) | `AGENTS.md` | Règles critiques reprises (pas de PR, pas de secrets, statuts) |
| 0.9 Supprimer les doublons (A5) | 3 doublons à la racine du blueprint | Une seule copie, dans `Docs/Référence/` |

**Arborescence cible de l'option D1-A**

```
engineering-knowledge-tooling-system/
├── package.json / tsconfig.json / eslint.config.js / vitest.config.ts
├── .github/workflows/ci.yml
├── src/{cli,mcp,business,data,shared}/
├── tests/{unit,integration,benchmark}/
├── migrations/
├── docs/
│   ├── blueprint/    ← ex-« Blueprint Engineering-Knowledge-Tooling-System » (inchangé à l'intérieur)
│   ├── guides/       ← SETUP.md, DATA_LAYER.md, CLI.md… produits par les sprints
│   └── audit/        ← ce rapport (déplacé depuis `docs/blueprint/Docs/audit/` en 0.1)
└── README.md         ← réécrit par le Sprint 1
```

Les références internes au blueprint (`Docs/02-ARCHITECTURE-TECHNIQUE.md`, `Docs/roadmap/…`) restent valides **relativement à `docs/blueprint/`** ; `INDEX.md` doit indiquer cette règle en tête.

### 8.2 Sprint 1 adapté — Setup projet (2 à 3 sessions)

Correspondance avec les tâches d'origine :

| Tâche d'origine | Version corrigée | Écarts |
|-----------------|------------------|--------|
| 1.1 `npm init` + TypeScript | `package.json` (type module, `engines.node >=22.12`, version `0.1.0`), `typescript@~5.9`, `tsconfig` NodeNext/ES2022 strict | TypeScript épinglé 5.9 (B3) |
| 1.2 ESLint + Prettier | `eslint.config.js` (flat config) + `typescript-eslint@8.72` + `eslint-config-prettier` + `prettier@3.9` ; scripts `lint`, `format` | Flat config obligatoire (B2) ; suppression d'`eslint-plugin-prettier` (déconseillé) |
| 1.3 Vitest | `vitest@5` + `@vitest/coverage-v8@5` uniquement ; `vitest.config.ts` avec seuils 80 % | Suppression de `c8` (B5) |
| 1.4 Structure dossiers | `src/{cli,mcp,business,data/{repositories,schemas,migrations},shared}`, `tests/{unit,integration,benchmark}`, `migrations/` | `docs/` du projet déplacé sous `docs/guides/` pour éviter la collision (A3) |
| 1.5 Dépendances | `better-sqlite3@13`, `commander@15`, `zod@4.6`, `pino@10` + `@types/better-sqlite3` + `tsx` | Versions épinglées (B1, B7) |
| 1.6 Gitleaks | Gitleaks **8.30.1** (binaire), `[extend] useDefault = true`, allowlist ciblée, `husky` (ou `lefthook`) + job CI | D1-D4 |
| 1.7 README + SETUP | `README.md` racine réécrit, `docs/guides/SETUP.md` | Décision A4 explicite |
| 1.8 CI | `ci.yml` sur `push: ['**']`, sans `pull_request`, matrice `[22.x]`, `npm ci`, artefact de couverture | C1-C4, C7-C8 |

**Critères d'acceptation du Sprint 1 (révisés)**

| # | Critère | Commande de vérification |
|---|---------|--------------------------|
| C1.1 | `npm ci` sans erreur sur Node 22 | `npm ci` |
| C1.2 | Build TypeScript strict | `npm run build` |
| C1.3 | Lint flat config | `npm run lint` |
| C1.4 | Tests Vitest (0 test toléré) | `npm test` |
| C1.5 | Structure conforme | `tree -L 3 -I node_modules` |
| C1.6 | `.gitignore` (sans ignorer le lockfile) | `grep -c package-lock .gitignore` → 0 |
| C1.7 | Gitleaks détecte un faux secret **et** ne bloque pas sur les docs | test manuel + `gitleaks dir .` |
| C1.8 | README complet | relecture |
| C1.9 | SETUP complet | relecture |
| C1.10 | CI verte sur la branche de session | onglet Actions |
| C1.11 | Couverture ≥ 80 % configurée (seuils) | `npm run coverage` |

**Hors périmètre du Sprint 1** : aucune donnée utilisateur, aucun appel réseau applicatif, aucun secret, aucun serveur MCP.

### 8.3 Configuration GitHub recommandée

```text
Ruleset "main-protection"
  target: branch main
  rules:
    - required_status_checks: CI / test (si activé)
    - non_fast_forward
    - required_linear_history
  bypass: repository admin (utilisateur)
  (pas de "require pull request" — incompatible avec la règle du projet)
```

Actions recommandées :
- désactiver le Wiki (redondant avec `Docs/`) ;
- ajouter `SECURITY.md`, `.github/dependabot.yml`, `CODEOWNERS` ;
- ajouter les topics `typescript`, `sqlite`, `mcp`, `knowledge-management`.

---

## 9. Risques résiduels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Le déplacement du blueprint (D1-A) casse des liens | Moyenne | Moyen | Commit dédié + script de vérification des liens avant/après |
| L'utilisateur travaille sous Windows avec `Docs/`/`docs/` | Élevée | Élevé | D1-A + `docs/guides/` explicite |
| TypeScript 7 publié, outillage en retard | Certaine | Faible | Épingler 5.9, veille mensuelle |
| SDK MCP 2 publié en cours de projet | Moyenne | Moyen | Veille tracée (ADR-V04 proposé) |
| CI non activée côté GitHub | Moyenne | Moyen | Vérification manuelle P1 |
| Divergence documentation/code dès le Sprint 2 | Élevée | Moyen | Registre d'avancement + règle « doc mise à jour dans le même commit » |

---

## 10. Annexes

### A1 — Matrice des versions (npm, 21/10/2026)

```text
eslint                     10.13.0   node ^20.19 || ^22.13 || >=24
typescript                  7.0.2    node >=16.20
typescript-eslint           8.72.0   peer TS >=4.8.4 <6.1.0
vitest                      5.0.5    node ^22.12 || ^24 || >=26
@vitest/coverage-v8         5.0.5    peer vitest 5.0.5
better-sqlite3             13.0.3    node >=22
commander                  15.0.0    node >=22.12.0
zod                         4.6.7
pino                       10.4.0
@modelcontextprotocol/sdk   1.32.1   node >=18
sqlite-vec                  0.1.9    binaires linux/darwin/windows
@playwright/test          1.64.1    node >=20
c8                         12.0.0
prettier                    3.9.10
gitleaks (binaire)         8.30.1
```

### A2 — Statuts des 48 documents de sprint

| Statut observé | Nombre | Fichiers |
|----------------|--------|----------|
| `⏳ NON COMMENCÉ` | 8 | groupes 01 et 02 |
| `🟡 Documenté — En attente approbation` | 17 | `SPRINT-03` à `SPRINT-05`, `SPRINT-06.md`, `SPRINT-07` |
| Aucun en-tête de statut | 23 | `SPRINT-06-01/02/03`, groupes 08 à 12 |
| Statut de gabarit `✅ Validé (88/88)` | 1 occurrence | `SPRINT-12-03.md:559` (exemple, pas un état réel) |

### A3 — Inventaire des documents de référence

| Dossier | Markdown | CSV | Remarque |
|---------|----------|-----|----------|
| `Docs/Référence/dri/` | 12 | 1 | 177 ressources |
| `Docs/Référence/harnai/` | 17 | 1 | dont `13-harnai/` (5 docs) |
| `Docs/Référence/students/` | 6 | 1 | 54 services |
| `Docs/Référence/Human-Brilliance/` | 1 | 0 | PDF 9,4 Mo |

### A4 — Checklist de démarrage du prompt de transfert

| Point de la checklist | Statut |
|-----------------------|--------|
| Dépôt GitHub créé et accessible | ✅ (privé, admin) |
| Structure conforme à la documentation | ❌ (racine indéterminée, A1) |
| Documents de référence lus et compris | ✅ (7 documents `Docs/`) |
| Architecture C Hybride validée | ✅ |
| Stack technique validée | ⚠️ (versions à réviser, B1-B7) |
| Règles opérationnelles comprises (pas de PR) | ✅ |
| Workflow de collaboration compris | ⚠️ (3 conventions de branches, F1) |
| Convention de nommage comprise | ❌ (F1) |
| Procédure de documentation des commandes comprise | ✅ |
| Procédure de suivi documentaire comprise | ⚠️ (pas de registre, F3) |
| Prérequis techniques (Node, npm, Git) | ✅ (Node 22.22.3) |
| Accès au dépôt GitHub confirmé | ✅ |
| Instructions de l'utilisateur obtenues | ⏳ **en attente** |

### A5 — Commandes de reproduction de l'audit

```bash
cd /home/user/engineering-knowledge-tooling-system

# Dépôt
git log --all --oneline --decorate
git ls-files | wc -l
git remote -v

# Volumétrie
find . -path ./.git -prune -o -type f -print | wc -l
du -sh --exclude=.git .

# Doublons
find . -type f \( -name '*.md' -o -name '*.csv' \) -print0 \
  | xargs -0 md5sum | sort | uniq -w32 -D

# Documentation
wc -l "Blueprint Engineering-Knowledge-Tooling-System/Docs/roadmap/sprints/"*.md

# Versions
for p in eslint typescript typescript-eslint vitest better-sqlite3 \
         commander @modelcontextprotocol/sdk gitleaks; do
  npm view "$p" version 2>/dev/null || echo "$p: binaire"
done

# GitHub
gh repo view Stane316/engineering-knowledge-tooling-system \
  --json isPrivate,defaultBranchRef,licenseInfo,hasIssuesEnabled
gh api repos/Stane316/engineering-knowledge-tooling-system/branches/main \
  --jq '{protected, protection}'
gh api repos/Stane316/engineering-knowledge-tooling-system/rulesets
gh api repos/Stane316/engineering-knowledge-tooling-system/actions/workflows
```

---

## 11. Conclusion et prochaine action

L'audit **ne révèle aucun blocage de fond** : l'architecture, les décisions et la documentation sont cohérentes et d'une densité rare (101 179 lignes de Markdown). Les 12 points majeurs relèvent de **l'écart entre une documentation rédigée en amont et l'état réel de la toolchain au 21 octobre 2026**, ainsi que de quelques lacunes d'hygiène (protection de branche, CI, Gitleaks, comptages).

**Prochaine action attendue :** réponse aux décisions **D1 à D4**. Dès réception :

1. si D4 = A, exécution du **Sprint 0** (corrections documentaires, un commit dédié) ;
2. puis **Sprint 1 adapté**, en trois commits atomiques (initialisation, structure/dépendances, CI/sécurité/documentation) ;
3. rapport de fin de sprint et **arrêt** en attente de validation, conformément aux règles du projet.

**Aucune pull request ne sera créée.** Le travail sera poussé sur la branche de session `arena/079e2f26-engineering-knowledge-tooling`, puis récupéré et validé dans VS Code par l'utilisateur.

---

*Rapport rédigé le 21 octobre 2026 — audit de démarrage EKTS, version 1.0.*
