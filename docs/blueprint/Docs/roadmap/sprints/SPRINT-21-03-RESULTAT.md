# SPRINT-21-03 — Effets, isolation et attaque contrôlée — résultat

**Sprint parent :** [SPRINT-21](SPRINT-21.md) · **Sous-sprint :** [SPRINT-21-03](SPRINT-21-03.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `0dbf037` · **Commit d'implémentation :** _à renseigner_
**Statut :** ⚠️ **C-P05 satisfait · C-O01 partiel (applicatif) · C-P06 et C-P07 BLOQUÉS** — sous-sprint **non clôturable comme réussi**.

## 1. Décisions humaines reçues à l'entrée du sous-sprint (30/10/2026)

| # | Question | Réponse retenue |
| --- | --- | --- |
| 1 | C-P06 (confinement hôte/OS) et C-P07 (injection T06) | **Marquer bloqué/indéterminé, poursuivre C-P05 et C-O01**, avec accord explicite pour reporter la vérification réelle au **Sprint 24** (après G0). Aucune clôture « réussie » du sous-sprint : les deux critères restent ouverts |
| 2 | Écart E21-1 (code protocole d'un outil masqué) | **Conserver tel quel**, écart documenté ; le `-32601` reste la garantie du chemin d'exécution direct |
| 3 | Niveau de preuve attendu pour C-O01 | **Preuve applicative** (fetch instrumenté, mode hors ligne, canari), avec limite déclarée : l'isolation réseau/OS n'est pas observable ici → **« partiel », jamais « réussi »** |

## 2. Ce qui a été mesuré

### 2.1 C-P05 — effets au démarrage : ✅ satisfait (6 cas)

Base isolée créée par `createDataDir()`, puis ouverture réelle des services. **La
mesure commence après la préparation**, conformément au critère.

| Élément examiné | Constat mesuré |
| --- | --- |
| Migrations | `user_version = 11`, `schema_migrations` = **11 lignes**, exécutées **une seule fois** |
| Templates | **10** templates prédéfinis semés à la préparation, jamais dupliqués à la réouverture |
| Données métier | `projects`, `audits`, `best_practices`, `generated_recommendations`, `alerts` à **0** après préparation ; `resources` = 3 = les fixtures du test |
| Fichiers | exactement **9** entrées, toutes dans la liste approuvée : `ekts.db`, `ekts-fts.db`, `ekts-vectors.db` et leurs `-wal`/`-shm` |
| Appels permis + refusés | 3 appels permis et **15** appels refusés (14 noms + 1 faux outil) : **aucune ligne ne change** dans les 14 tables métier, `user_version` et `schema_migrations` inchangés |
| WAL/SHM | présents pendant la session, **disparus après fermeture** (repli SQLite), sans perte : réouverture ⇒ 3 ressources, 0 projet, 10 templates |
| Réouverture | état logique **identique** à celui d'après fermeture : les migrations et le semis de templates ne rejouent pas |

Le critère distingue explicitement « fichiers WAL modifiés » et « mutation
métier » : le test ne compare **pas** les tailles de `-wal` (elles peuvent
varier pour des raisons techniques) mais le **contenu logique des tables**.

### 2.2 C-O01 — données et réseau : ⚠️ partiel, niveau applicatif (4 cas)

| Cas | Mesure |
| --- | --- |
| Appels permis (3) + refusés (15) sous profil `read` | **0** appel à `fetch` |
| Test **positif** de contrôle | vrai service d'embeddings OpenAI, `fetch` remplacé par un intercepteur : la tentative est **observée** (URL `http…`, corps contenant le canari) puis **bloquée** (le `fetch` substitut échoue) |
| Canari synthétique | `canari-ekts-21-03-ne-doit-pas-sortir` : présent dans la charge utile interceptée, **jamais transmis** ; la même recherche reste possible en FTS **sans nouvelle tentative** |
| Profil `read` + mode `hybrid` | refusé en `-32602` **avant** toute tentative : le compteur n'avance pas |

**Portée exacte.** Ce fichier prouve que l'**application** n'émet aucune requête
pendant les appels mesurés et que son instrumentation sait voir et bloquer une
tentative. Il ne prouve **pas** l'isolation du système d'exploitation (pare-feu,
interfaces, sockets ouverts) : rien de tout cela n'est observable depuis ce
processus. Conformément au critère, le contrôle non observable est compté
`indéterminé` — ici **partiel**, jamais « réussi ».

### 2.3 C-P06 — confinement hôte/OS : 🚫 **BLOQUÉ**

**Aucune vérification réelle n'a été exécutée.** Le critère exige une session de
test tentant un accès contrôlé aux corrigés, aux fichiers d'une autre condition
et à une variable canari fictive, avec observation de la politique **et des
refus**. Cet environnement ne fournit ni compte de test isolé, ni politique de
système de fichiers applicable, ni moyen d'observer les refus au niveau de
l'OS. Conformément au dossier (§ « Si l'hôte ou l'exposition manquent ») et à la
décision du 30/10 : **noté bloqué, reporté au Sprint 24 après G0**. Aucun test
n'a été écrit pour simuler une barrière qui n'existe pas, et le profil MCP n'est
**pas** présenté comme une sandbox.

### 2.4 C-P07 — injection T06/V02 : 🚫 **BLOQUÉ**

**Aucune session agent hostile n'a été menée.** Le critère exige T06 en
conditions B et C, à l'intérieur d'une sandbox autorisée, avec enregistrement de
la fourniture effective de V02 à l'agent et de l'ensemble des actions visibles.
Ni l'exposition agent, ni la sandbox, ni la trace observable ne sont disponibles
ici. Le dossier le dit sans ambiguïté : « non-exposition et observabilité
insuffisante […] ne sont pas des réussites ». **Bloqué, reporté au Sprint 24.**
Aucune conformité n'est affirmée.

## 3. Protocole : GREEN initiaux, pas de RED — et pourquoi ce n'est pas un contournement

Les dix cas de ce sous-sprint étaient **déjà conformes** : C-P05 et C-O01
décrivent des propriétés que le code possédait avant ce sprint (bases isolées,
migrations idempotentes, aucun appel réseau hors mode hybride). Le dossier
l'autorise : « les cas déjà conformes peuvent être GREEN et doivent le rester ».
**Aucune ligne de production n'a été modifiée** dans ce sous-sprint.

Un « GREEN initial » n'a de valeur que si le test est **sensible**. La preuve a
donc été faite par **mutation temporaire** du code de production :

```text
Mutation : ajout de 'create_project' à READ_TOOL_NAMES (profil lecture élargi)
→ npx vitest run tests/mcp/startup-effects.test.ts
   × n'enregistre aucune mutation métier lors des appels permis et refusés
   AssertionError: promise resolved "{ project: { …(9) } }" instead of rejecting
   Tests  1 failed | 5 passed (6)
→ git checkout -- src/mcp/profiles.ts   (restauration, arbre propre vérifié)
```

Le test **détecte** donc bien une mutation métier. Une première tentative de
mutation n'avait pas mordu (cible textuelle erronée, `'list_resources']` sans
virgule) : elle a été refaite correctement plutôt que comptée comme une preuve.

Pour C-O01, la sensibilité est portée par le **test positif** : l'intercepteur
enregistre effectivement une tentative et son contenu (canari présent dans le
corps). Un compteur qui resterait à zéro par construction serait démasqué.

## 4. Mesures finales

```text
npm run verify → EXIT=0
  typecheck 0 erreur · lint 0 erreur · format conforme · build succès
  tests      : 1 823 passed | 38 skipped (1 861)
  fichiers   : 153 passed | 6 skipped (159)
  couverture : statements 96,04 % · branches 89,44 % · fonctions 97,42 % · lignes 96,18 %
suite tests/mcp : 223 passed (223), 30 fichiers
```

## 5. Fichiers (2, tous des tests)

- `tests/mcp/startup-effects.test.ts` (**nouveau**, 6 cas C-P05) ;
- `tests/mcp/network-control.test.ts` (**nouveau**, 4 cas C-O01).

**Aucun fichier de production modifié.** Aucune migration, aucune dépendance.

## 6. Écarts et limites déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E21-6** | C-P06 et C-P07 **bloqués** | Report Sprint 24 accepté par le propriétaire le 30/10. Le sous-sprint n'est **pas** clôturé comme réussi ; G1 ne peut pas être validé |
| **E21-7** | C-O01 mesuré au niveau **applicatif** seulement | Isolation OS non observable ici. Compté « partiel » ; la preuve applicative est fournie avec son test positif |
| **E21-8** | Aucune preuve RED sur ce sous-sprint | Cas déjà conformes ; sensibilité prouvée par mutation (§ 3), consignée avec sa sortie réelle |
| **E21-9** | Les tailles de `-wal` ne sont pas comparées | Choix conforme au critère : un WAL qui change n'est pas une mutation métier. Le contenu logique des tables, lui, est comparé |
| **E21-10** | Aucune vérification des écritures hors `dataDir` | L'observation des accès disque au niveau OS n'est pas disponible ; seul le répertoire de données est inspecté (9 fichiers attendus, aucun autre) |

## 7. Limites et non-prouvé

- **Le profil MCP n'est pas une sandbox.** Ni fichiers, ni réseau, ni processus.
- **Isolation réseau/OS** : non observée. `0 requête` signifie « l'application
  n'a rien émis », pas « l'hôte a bloqué ».
- **C-P06/C-P07** : aucune mesure réelle ; aucune conformité affirmée.
- **CI distante** : non observée ; les nouveaux tests entrent dans le job
  `npm test` existant, sans clé ni fournisseur.
- **38 cas** navigateur/PDF toujours ignorés, inchangés.

## 8. Commandes exactes

```powershell
npx vitest run tests/mcp/startup-effects.test.ts
npx vitest run tests/mcp/network-control.test.ts
npx vitest run tests/mcp
npm run verify
```

## 9. Suite

Sprint parent : [SPRINT-21-RESULTAT.md](SPRINT-21-RESULTAT.md) — **série non
clôturable** tant que C-P06 et C-P07 ne sont pas vérifiés (Sprint 24, après G0).
Le sprint 22 n'est pas engagé.
