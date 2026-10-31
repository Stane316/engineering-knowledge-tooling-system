# SPRINT-23-02 — Confidentialité et Windows natif — résultat

**Sprint parent :** [SPRINT-23](SPRINT-23.md) · **Sous-sprint :** [SPRINT-23-02](SPRINT-23-02.md)
**Date d'exécution :** 31 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `f8bb772` · **Statut :** ⚠️ **C-T03 satisfait sur le volet canaris, partiel sur le volet accès · C-O02 et C-O03 BLOQUÉS** (machine Windows du propriétaire) — sous-sprint **non clôturable comme pleinement réussi**.

## 1. Ce qui devait être prouvé

| Critère | Méthode du dossier 22 | Seuil |
| --- | --- | --- |
| **C-T03** | I/P : canaris fictifs injectés en variables, données et messages d'erreur synthétiques ; vérifier traces, emplacement, permissions et contrôles d'export | **0 canari** dans les traces exportables ; aucun vrai secret dans le jeu ; **accès non autorisé refusé** dans l'environnement testé ; un hash n'est pas une anonymisation |
| **C-O02** | E/P sur Windows natif : édition/build, CPU, Node/npm, dépendances natives, chemins, accents, UTF-8, arrêt/redémarrage | **100 % des étapes** réussies sur **cette** configuration Windows ; une version non testée n'est pas déclarée compatible |
| **C-O03** | E/P : ACL du répertoire, des bases, WAL/SHM, corpus et traces ; absence de `.env` non prévu | Tous les accès prévus réussissent, **tous les accès non autorisés du jeu sont refusés** ; aucune garantie POSIX déduite sur Windows |

## 2. Ce qui a été construit

| Fichier | Rôle |
| --- | --- |
| `src/mcp/utils/redaction.ts` | Caviardeur : valeurs sensibles de l'environnement + formes reconnaissables (`sk-`, `ghp_`, `xoxb-`, `AIza…`, `Bearer`) ; marqueur **fixe** |
| `src/mcp/utils/logger.ts` | Le caviardage s'applique au message, au message d'erreur et récursivement aux données, **avant** sérialisation |
| `tests/mcp/utils/redaction.test.ts` | 10 cas unitaires |
| `tests/mcp/integration/traces-confidentiality.test.ts` | 5 cas : canari d'environnement, forme reconnaissable, canari de données, garde d'export statique, permissions POSIX |
| `scripts/windows-check.ps1` | Protocole **O2-B** exécutable par le propriétaire (PowerShell 5.1, UTF-8 BOM), verdict PASS/FAIL/BLOCKED par étape et rapport JSON |

### 2.1 Trois décisions

1. **Deux sources de vérité.** Une variable d'environnement dont le nom désigne un
   secret (`…_KEY`, `…_TOKEN`, `…_SECRET`, `…_PASSWORD`, `AUTH…`) et une valeur
   d'au moins 8 caractères est caviardée **où qu'elle apparaisse** ; les formes
   reconnaissables (préfixes publics de fournisseurs, `Bearer`) le sont même
   quand aucun nom de variable ne les annonce.
2. **Le marqueur est constant, pas une empreinte.** Un hash de clé se casse hors
   ligne et reste corrélable d'une trace à l'autre : le remplacement par
   `[caviardé]` ne permet ni de retrouver le secret ni de le suivre. Le test
   vérifie explicitement qu'aucune empreinte n'apparaît à la place.
3. **Le caviardage est un filet, pas une permission.** Il ne couvre ni un secret
   découpé, ni un encodage base64 : la discipline reste de ne journaliser ni
   contenu utilisateur ni identifiant d'authentification. C'est écrit dans le
   module pour que la revue ne s'y trompe pas.

## 3. Résultats mesurés

### 3.1 C-T03 — volet canaris : ✅ 0 exposé

| Injection | Chemin | Constat |
| --- | --- | --- |
| **Variable** `EKTS_EMBEDDINGS_API_KEY` = canari | message d'erreur de fournisseur recopiant la clé | canari **absent**, `[caviardé]` présent, **aucun fragment** de la clé (ni 6 derniers caractères) |
| **Forme** `Bearer sk-proj-…` | erreur synthétique | secret **absent**, marqueur présent |
| **Donnée** titre, contenu et `metadata` porteurs du canari | `search_knowledge`, `get_resource`, `get_resource` en erreur | canari **absent** de toutes les lignes de trace |

**Preuve RED comportementale** (avant implémentation, avec l'API existante
seule) :

```
AssertionError: expected '{"level":"error","message":"Appel fou…' not to contain 'canari-trace-…'
AssertionError: expected '{"level":"error","message":"Réponse i…' not to contain 'sk-proj-abcdefghijklmnop42'
AssertionError: expected '{"level":"info","message":"mcp.event"…' not to contain 'canari-trace-…'
```

La troisième ligne est instructive : la fuite passait par le **journal
d'événements** de 23-01, dont le message d'erreur reprend l'identifiant fourni
par le client. Le caviardage s'applique donc aussi à ce canal.

### 3.2 C-T03 — contrôle d'export : ✅ aucun fichier de trace

Garde statique sur `src/mcp` : interdiction de `writeFile`, `writeFileSync`,
`appendFile`, `appendFileSync`, `createWriteStream`. La trace reste un **flux**
`stderr` ; il n'existe dans ce dépôt aucun export de traces vers un fichier, donc
aucun chemin d'export non contrôlé. Si un jour un fichier de trace est
introduit, ce test échoue et force une revue des droits.

### 3.3 C-T03 / C-O03 — volet accès : ⚠️ **partiel, non mesuré**

| Élément | Constat |
| --- | --- |
| Mode du répertoire de données | **0700** (mesuré, test intégré) |
| Mode des trois bases | **0600** (mesuré, test intégré) |
| Accès par un **second compte non autorisé** | ❌ **non mesuré** — `su` exige un mot de passe dans cet environnement ; aucun compte de test n'a été autorisé par l'opérateur |
| ACL Windows | ❌ **non mesurées** — machine du propriétaire |
| `.env` non prévu dans l'environnement | non constaté (l'environnement de test est injecté vide) |

**Conséquence assumée :** le seuil « tous les accès non autorisés du jeu sont
refusés » **n'est pas atteint** ici. Les droits sont vérifiés **en mode**, ce qui
n'est pas la même chose qu'un refus effectif : `root` ignore les modes, et un
système de fichiers monté sans permissions POSIX les ignore aussi. Je ne
déclare donc **pas** C-O03 réussi.

### 3.4 C-O02 et C-O03 — Windows natif : ⛔ **bloqués**

Aucune mesure n'a été faite sur Windows dans cette session. Le sous-sprint
fournit le protocole exécutable, pas un résultat.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-check.ps1
```

Douze étapes, chacune avec verdict `PASS`, `FAIL` ou `BLOCKED` :

| # | Étape | Ce qui est consigné |
| --- | --- | --- |
| 1 | système | édition, version, build, architecture, CPU, mémoire |
| 2 | outils | Node, npm, commit |
| 3 | dépendances natives | versions résolues de `better-sqlite3` et `sqlite-vec` |
| 4 | `npm ci` | installation reproductible (sautable par `-SkipInstall`) |
| 5 | build | durée et code de sortie |
| 6 | `npm run doctor` | diagnostic du projet |
| 7 | init | base temporaire isolée |
| 8 | accents et UTF-8 | ajout d'un titre et d'un contenu accentués |
| 9 | recherche | le texte accentué est retrouvé |
| 10 | redémarrage | persistance dans un **nouveau** processus |
| 11 | ACL | `icacls` du répertoire et de chaque base — **conclusion `BLOCKED`** sans second compte |
| 12 | latence | protocole C-O07 (`npm run bench:latency`) |

Le script écrit `windows-check-<horodatage>.json` et sort en code 1 si une étape
échoue. **Les étapes 11 et 12 ne peuvent pas conclure seules :** l'ACL exige un
compte non autorisé, et la latence doit être comparée au seuil de 500 ms.

## 4. Traçabilité des tests

| Niveau | Commande | Résultat |
| --- | --- | --- |
| U | `npx vitest run tests/mcp/utils/redaction.test.ts` | **10 passed** |
| I | `npx vitest run tests/mcp/integration/traces-confidentiality.test.ts` | **5 passed** |
| Régressions | `npm run verify` | voir § 5 |

## 5. État Git

`npm run verify` exécuté avant commit ; commit et push annoncés au registre
d'avancement.

## 6. Écarts et décisions restant au propriétaire

| # | Écart | Ce qu'il faut |
| --- | --- | --- |
| **E23-1** | Accès non autorisé **mesuré sur POSIX le 31/10/2026** | compte `ekts-probe` créé ; `cat /tmp/ekts-acl/ekts.db` ⇒ **Permission denied (code 1)** ; contrôle : le même compte lit une copie `0644` (**code 0**) ⇒ le refus vient bien des permissions. ACL **Windows toujours non mesurées** (E23-2) |
| **E23-2** | Windows **mesuré le 31/10/2026** | Windows 11 Pro build 26300 : **11 PASS / 0 FAIL / 1 BLOCKED** ⇒ **C-O02 satisfait** sur cette configuration ; détail dans [SPRINT-24-02-RESULTAT](SPRINT-24-02-RESULTAT.md) § 9 |
| **E23-3** | Aucune rétention ni export de traces | Si un export est souhaité (O03/O04), il devra porter un contrôle de droits explicite — décision de conception, pas un ajout silencieux |
