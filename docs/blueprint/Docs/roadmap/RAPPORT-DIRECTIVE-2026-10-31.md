# Rapport de livraison — application de la directive permanente (31/10/2026)

**Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Période :** 31 octobre 2026
**Objet :** appliquer la directive permanente de gouvernance, de livraison et de
réalignement des sprints 22–24.

---

## A — Résumé exécutif

| | |
| --- | --- |
| **Sprint** | Transition de gouvernance (entre 22 et 23), sans nouveau périmètre fonctionnel |
| **Objectif initial** | Rendre permanentes les conventions de travail, synchroniser Git, auditer la roadmap 22–24, proposer un réalignement vers la vision produit |
| **Statut final** | ✅ **Étapes 1 à 6 exécutées** · ⏸ **Étape 7 : arrêt volontaire en attente d'arbitrage** (5 décisions, § K) |
| **Réalisations** | Git resynchronisé après incident · 6 conventions inscrites dans le dépôt · audit de la roadmap et diagnostic d'un écart structurel · **proposition de révision** documentée |
| **Écart avec le périmètre initial** | Un **incident grave** est survenu avant l'exécution : perte de l'historique local (E22-15). Il est déclaré, traité et documenté |
| **Blocage** | Aucun blocage technique. Un **blocage de décision** : la révision de la roadmap ne peut pas être appliquée sans accord (V1) |
| **Résultat concret** | Le dépôt porte désormais des règles opposables ; la roadmap actuelle est identifiée comme **incapable de produire la valeur annoncée** ; une trajectoire corrigée est chiffrée et soumise |

---

## B — État du produit avant et après

| Élément | Avant | Après |
| --- | --- | --- |
| **Fonctionnalité** | Aucune convention durable ; règles dispersées dans des dossiers de sprint contradictoires | `07-CONVENTIONS-PERMANENTES.md` + `AGENTS.md` v1.1 : règles opposables et vérifiables |
| **Comportement** | Push laissé à l'appréciation, contradiction avec la directive | **Commit + push couplés**, vérifiés à chaque livraison (`origin/branche..HEAD` vide) |
| **Limitation** | Rapports synthétiques, non rejouables par le propriétaire | Format **A–M obligatoire** avec protocole de vérification PowerShell |
| **Intégration** | Recherche open source (18 dépôts, 42 `SKILL.md`) sans lien avec le plan | Base documentaire **promue** en fondement de l'ingestion (sprints 24–26 proposés) |
| **Qualité** | Historique local détruit, hashs de rapports faux | Historique reconstitué, **hashs corrigés partout**, incident tracé |
| **Produit** | Corpus limité à 6 fichiers synthétiques, aucune acquisition | Révision proposée : import gouverné de corpus externes |

**Réponse explicite : « qu'est-ce qui n'existait pas avant ? »**
Avant ce jour, EKTS n'avait **aucune règle opposable de livraison** et **aucun
plan** pour acquérir un corpus. Le produit savait stocker ce qu'on lui donnait ;
il ne savait pas se nourrir. Le dépôt sait désormais exiger la preuve, et
dispose d'une trajectoire documentée pour combler l'écart — sous réserve
d'accord.

---

## C — Réalisations détaillées

### C1 — Récupération de l'historique après incident (E22-15)

1. **Problème initial.** Le clone de travail a été recréé le 31/10 à 15:02 ; la
   branche `arena/…` a été reposée sur `main` (`c46cc18`) et non sur le distant.
   **Quatre commits non poussés ont été détruits** avec l'ancien `.git`.
2. **Objectif.** Récupérer le travail **sans rien détruire**.
3. **Solution.** Constat par `git log`, `reflog`, `fsck` : aucun objet
   récupérable. Vérification de l'intégrité de l'arbre (17 fichiers critiques
   présents, marqueurs de contenu), sauvegarde `tar.gz` (12 Mo), puis
   `git reset --mixed` vers `origin/…` (avancement simple, aucun écrasement de
   l'arbre de travail — `reset --hard` **interdit et non utilisé**).
4. **Fonctionnement.** Le contenu validé (`typecheck` 0, `build` 0, 42/42 tests)
   a été re-commité en conservant le découpage logique d'origine : 22-02 puis
   22-03.
5. **Fichiers.** `src/shared/provenance.ts`, `knowledge-manager.ts`, `get.ts`,
   `search.ts`, 10 fichiers de tests, 3 rapports, `docs/CLI.md`,
   `docs/guides/SEARCH_ENGINE.md`, registre.
6. **Capacités.** Aucune capacité nouvelle : **maintien** de l'acquis.
7. **Dépendances.** `npm ci` (installation reproductible, `ignore-scripts=true`).
8. **Vérifications.** `typecheck` 0 ; `build` 0 ; 42/42 tests ciblés ;
   `npm run verify` **EXIT 0**.
9. **Résultat.** `0bdc1ce` et `4d6e120` **poussés**.
10. **Limites.** Les hashs d'origine (`6340d73`, `7a9ea77`) n'existent plus :
    toute vérification doit utiliser les nouveaux.

### C2 — Conventions permanentes

1. **Problème.** Les règles dépendaient de la conversation ; deux dossiers de
   sprint se contredisaient sur le push.
2. **Objectif.** Rendre les règles durables et vérifiables.
3. **Solution.** Un document normatif de 7 sections + amendement d'`AGENTS.md`.
4. **Fonctionnement.** Les six conventions : Git couplé, rapport A–M, protocole
   de vérification utilisateur, stratégie open source (13 étapes, licences,
   interdits), direction produit, gouvernance des sprints. Un tableau de
   contrôle final rend chaque règle **auditable**.
5. **Fichiers.** `docs/blueprint/Docs/07-CONVENTIONS-PERMANENTES.md` (nouveau),
   `AGENTS.md` (v1.1).
6. **Capacités.** Une règle peut désormais être **violée de façon démontrable**,
   donc corrigée.
7. **Dépendances.** Aucune.
8. **Vérifications.** Prettier conforme ; `verify` EXIT 0 ; commit poussé.
9. **Résultat.** `d0cd30e`.
10. **Limites.** Une convention n'est appliquée que si l'agent la lit ; d'où le
    pointeur en tête d'`AGENTS.md`.

### C3 — Audit et révision de la roadmap

1. **Problème.** Le plan 19–24 ne contient **aucune acquisition de corpus**.
2. **Objectif.** Confronter le plan à la vision et proposer une trajectoire.
3. **Solution.** Diagnostic D1–D5 documenté + découpage révisé + critères
   proposés.
4. **Fonctionnement.** Sprints 19–23 conservés ; 24 devient ingestion ; 25
   OpenCode ; 26 Hermes ; 27 reprend **intégralement** l'ancien 24 (validation).
5. **Fichiers.** `REVISION-MVP4-2026-10-31.md` (nouveau), `docs/ROADMAP.md`,
   registre.
6. **Capacités.** Une trajectoire **chiffrable et critiquable** existe.
7. **Dépendances.** Accord V1 du propriétaire.
8. **Vérifications.** `verify` EXIT 0 ; liens internes cohérents.
9. **Résultat.** `2c6efd8`.
10. **Limites.** **Proposition non appliquée** ; nouveaux critères non validés.

---

## D — Fonctionnalités

| Catégorie | Élément |
| --- | --- |
| **Nouvelles** | Convention de livraison opposable ; format de rapport A–M ; stratégie d'intégration open source formalisée |
| **Améliorées** | Définition de « terminé » dans `AGENTS.md` (push vérifié + vérifications utilisateur distinguées) |
| **Corrigées** | Hashs de commit faux dans 3 rapports et le registre ; contradiction E22-1 (ligne historique 346) |
| **Stabilisées** | Historique Git reconstitué et poussé |
| **Documentées seulement** | Sprints 24–26 proposés ; critères C-R09–C-R11, C-T07–C-T08 |
| **Partielles** | Sprint 21 (C-P06/C-P07 toujours bloqués) ; sprint 22 (volets H, C-O07) |
| **Reportées** | TierFlow, Quen, Paperclip, Voice Studio — identités non confirmées |

**Exemple d'usage concret (convention de livraison) :**

```powershell
git add src/shared/provenance.ts
git commit -m "feat(provenance): ..."
git push origin arena/079e2f26-engineering-knowledge-tooling
git rev-list --count origin/arena/079e2f26-engineering-knowledge-tooling..HEAD
# attendu : 0
```

---

## E — Modifications techniques et intégrations

| Domaine | Changement | Impact utilisateur |
| --- | --- | --- |
| Gouvernance | `07-CONVENTIONS-PERMANENTES.md` | Le propriétaire sait ce qu'il peut exiger et comment le contrôler |
| Instructions agent | `AGENTS.md` v1.1 | Tout agent lit les règles avant d'agir |
| Roadmap | Bandeau + renvoi + annotation historique | Plus de sprint fantôme « notifications » attribué à 22 |
| Registre | 3 entrées datées | Traçabilité de l'incident et des décisions |
| Code de production | **aucun changement** | Comportement produit identique |
| Dépendances | **aucune ajoutée** | Aucun risque de licence ou de maintenance |
| Base de données | **aucune migration** | `user_version` inchangé (11) |

---

## F — Tests et vérifications réalisés par l'agent

| Vérification | Commande réellement exécutée | Résultat | Statut | Limites |
| --- | --- | --- | --- | --- |
| Installation | `npm ci` | EXIT 0, lockfile respecté | ✅ réussite | 46 s, réseau requis |
| Types | `npm run typecheck` | EXIT 0 | ✅ réussite | — |
| Build | `npm run build` | EXIT 0 | ✅ réussite | — |
| Tests ciblés 22 | `npx vitest run tests/integration/corpus-identity.test.ts …` | 42/42 | ✅ réussite | 6 fichiers seulement |
| Suite complète | `npm run verify` | **1 918 passés / 38 ignorés (165 fichiers)**, couverture 95,87 / 89,22 / 97,24 / 96,00 | ✅ réussite | 38 cas navigateur/PDF ignorés |
| Format | inclus dans `verify` | conforme | ✅ réussite | — |
| Lint | inclus dans `verify` | 0 erreur | ✅ réussite | — |
| Récupération Git | `git fsck --no-reflogs`, `git reflog` | 0 objet récupérable | ⚠️ échec attendu | ancien `.git` supprimé |
| Synchronisation | `git rev-list --left-right --count` | `0 0` | ✅ réussite | — |

**Non exécuté / non applicable :** tests navigateur Playwright (binaires non
installés), CI distante (non observable), tests Windows (poste indisponible).

---

## G — Vérifications à effectuer par vous-même

### G1 — Le dépôt est synchronisé

- **Objectif :** confirmer qu'aucun commit ne reste local.
- **Prérequis :** clone à jour, droits de lecture sur `origin`.
- **Répertoire :** racine du dépôt.
- **Commande :**

```powershell
git fetch origin
git log --oneline -6
git rev-list --count origin/arena/079e2f26-engineering-knowledge-tooling..HEAD
```

- **Attendu :** `0` sur la dernière commande ; les 6 commits ci-dessous visibles.
- **Réussi si :** le compteur vaut `0`.
- **Erreurs possibles :** dépôt non cloné ; réseau ; mauvaise branche.
- **À me transmettre si différent :** sortie complète des trois commandes.

### G2 — Les conventions sont réellement dans le dépôt

```powershell
Get-Content AGENTS.md -TotalCount 15
Test-Path docs/blueprint/Docs/07-CONVENTIONS-PERMANENTES.md
```

- **Attendu :** la mention « Version : 1.1 — 31 octobre 2026 » et le pointeur
  vers le document ; `True`.
- **Réussi si :** les deux éléments apparaissent.

### G3 — La suite de tests passe sur votre poste

```powershell
npm ci
npm run verify
```

- **Attendu :** `EXIT 0` ; `1 918 passed | 38 skipped` ; couverture ≥ 95 %.
- **Réussi si :** aucun test en échec.
- **Erreurs possibles :** `node_modules` absent, Node < 22, antivirus bloquant.
- **À me transmettre :** le nom du premier test en échec et sa sortie.

### G4 — Le produit fonctionne réellement (bout en bout)

```powershell
$env:EKTS_DATA_DIR = ".\data-verif"
node dist/cli/index.js init
node dist/cli/index.js add --type article --title "Test" --content "corpus"
node dist/cli/index.js search "corpus" --mode fts --json
node dist/cli/index.js search "xyzxyz" --mode fts --json
```

- **Attendu :** `count: 1` puis `count: 0` avec code de sortie 0.
- **Réussi si :** les deux sorties JSON sont cohérentes.
- **Effets secondaires :** crée `.\data-verif` (à supprimer ensuite :
  `Remove-Item -Recurse -Force .\data-verif`).

### G5 — La proposition de révision est lisible

```powershell
Get-Content docs/blueprint/Docs/roadmap/REVISION-MVP4-2026-10-31.md -TotalCount 40
```

- **Attendu :** statut « PROPOSITION — non applicable sans accord ».
- **Réussi si :** vous pouvez statuer sur les décisions V1–V5 (§ K).

---

## H — Commandes de validation (vérifiées dans `package.json`)

| Commande | Fonction | Prérequis | Emplacement | Obligatoire | Attendu |
| --- | --- | --- | --- | --- | --- |
| `npm ci` | installe le lockfile | réseau | racine | oui (1re fois) | EXIT 0 |
| `npm run setup` | hooks Git + env | après `npm ci` | racine | recommandé | EXIT 0 |
| `npm run typecheck` | `tsc --noEmit` | `npm ci` | racine | oui | 0 erreur |
| `npm run lint` | ESLint flat config | `npm ci` | racine | oui | 0 erreur |
| `npm run format:check` | Prettier | `npm ci` | racine | oui | conforme |
| `npm run build` | compile dans `dist/` | `npm ci` | racine | oui | EXIT 0 |
| `npm test` | Vitest complet | `npm ci` | racine | oui | 1 918 passés |
| `npm run coverage` | couverture, seuils 80 % | `npm ci` | racine | oui | ≥ 95 % |
| `npm run verify` | enchaîne les cinq ci-dessus | `npm ci` | racine | **oui** | EXIT 0 |
| `npm run cli -- search …` | CLI compilée | `npm run build` | racine | facultatif | voir G4 |
| `npm run mcp` | serveur MCP stdio | `npm run build` | racine | facultatif | démarre |
| `npm run test:e2e` | Playwright, 3 moteurs | `npm run browsers:install` | racine | facultatif | 12 scénarios |

**Non utilisées, car inapplicables ici :** `nx`, `cypress` (absents du projet),
`npm run test:benchmark` (hors périmètre de cette livraison).

---

## I — Synchronisation et livraison Git

```powershell
git branch --show-current
git status --short
git log --oneline -6
git fetch origin
git rev-list --left-right --count origin/arena/079e2f26-engineering-knowledge-tooling...HEAD
git rev-parse HEAD
```

État constaté au moment du rapport : branche
`arena/079e2f26-engineering-knowledge-tooling`, arbre **propre**, compteur
**`0 0`**, HEAD sur le commit de ce rapport.

| Commit | Objet | Sur le distant |
| --- | --- | --- |
| `0bdc1ce` | implémentation 22-02 (reconstituée) | ✅ |
| `4d6e120` | implémentation 22-03 | ✅ |
| `f2c655a` | bilan série 22 + E22-15 | ✅ |
| `d0cd30e` | conventions permanentes + AGENTS v1.1 | ✅ |
| `2c6efd8` | proposition de révision MVP-4 | ✅ |
| *(ce rapport)* | rapport de livraison | ✅ |

---

## J — Résultats attendus et interprétation

| Étape | Résultat attendu | Si le résultat diffère |
| --- | --- | --- |
| `git rev-list --count org..HEAD` | `0` | ne pas forcer le push ; me transmettre la sortie |
| `npm ci` | EXIT 0 | vérifier Node ≥ 22, réseau, `npm.cmd` |
| `npm run verify` | EXIT 0, 1 918 passés | transmettre le premier échec et sa sortie |
| `npm run build` | `dist/` créé | transmettre l'erreur TypeScript |
| `search` sur ressource existante | `count: 1` | vérifier `EKTS_DATA_DIR` |
| `search` sur terme absent | `count: 0`, code 0 | vérifier que ce n'est pas une erreur (code ≠ 0) |
| `status --short` | vide | signaler tout fichier modifié inattendu |

---

## K — Points de vigilance

1. **Incident E22-15 :** l'historique local peut être détruit par un reclone.
   **Toujours pousser** — c'est désormais la règle.
2. **Hashs historiques invalides :** `6340d73`, `4daa3a5`, `7a9ea77`,
   `5bef4f8` **n'existent plus**. Les références valides sont `0bdc1ce` et
   `4d6e120`.
3. **Sprint 21 incomplet :** C-P06/C-P07 bloqués, G1 inaccessible.
4. **Sprint 22 incomplet :** C-R04 volet H (revue humaine), C-O07 machine de
   validation, arbitrages E22-9 et E22-10.
5. **Révision non appliquée :** aucun sprint 24–26 n'est engagé.
6. **Identités non confirmées :** TierFlow, Quen Agents, Paperclip, Voice
   Studio n'apparaissent pas sous ces noms dans le catalogue audité.
7. **38 tests ignorés** (navigateur/PDF) restent non exécutés.
8. **CI distante non observée.**

**Décisions nécessaires :**

| # | Décision |
| --- | --- |
| V1 | Approuver / amender / refuser la révision de la roadmap |
| V2 | Fournir les URL exactes de TierFlow, Quen Agents, Paperclip, Voice Studio |
| V3 | Choisir le premier corpus à importer |
| V4 | Politique de licence : copyleft et restrictives admises ? |
| V5 | Valider les identifiants C-R09–C-R11 et C-T07–C-T08 |
| V6 | Trancher les arbitrages hérités : E22-9, E22-10, machine C-O07, revues H |

---

## L — Préparation du sprint suivant

**Terminé :** sprint 22 exécuté et livré ; gouvernance inscrite ; audit de la
roadmap achevé ; proposition de révision écrite.

**Reste à terminer :** sprint 23 (traces T01–T03, compatibilité O02–O05).

**Reporté :** intégrations TierFlow/Quen/Paperclip/Voice Studio ; C-P06/C-P07
(sécurité hôte).

**Dépendances :** accord V1 avant tout sprint 24+ ; machine Windows pour O02–O05.

**Conditions de démarrage du sprint 23 :** feu vert explicite + réponse à V6
(l'absence de machine rendrait O02–O05 `bloqué`, ce qui doit être assumé
d'avance).

---

## M — Livrables et historique

| Chemin | Rôle | Commit |
| --- | --- | --- |
| `docs/blueprint/Docs/07-CONVENTIONS-PERMANENTES.md` | 6 conventions durables, contrôle d'application | `d0cd30e` |
| `AGENTS.md` | v1.1 : pointeur, règles 6–7, « terminé » durci | `d0cd30e` |
| `docs/blueprint/Docs/roadmap/REVISION-MVP4-2026-10-31.md` | proposition de révision, diagnostic, critères | `2c6efd8` |
| `docs/ROADMAP.md` | bandeau d'arbitrage, renvoi, E22-1 annoté | `2c6efd8` |
| `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` | 3 entrées du 31/10 | `2c6efd8` |
| `SPRINT-22-02-RESULTAT.md` / `SPRINT-22-03-RESULTAT.md` | hashs corrigés + note de reconstruction | `f2c655a` |
| `SPRINT-22-RESULTAT.md` | bilan série 22 + incident E22-15 | `f2c655a` |
| `docs/blueprint/Docs/roadmap/RAPPORT-DIRECTIVE-2026-10-31.md` | ce rapport | *ce commit* |

**Modifications non livrées :** aucune.
