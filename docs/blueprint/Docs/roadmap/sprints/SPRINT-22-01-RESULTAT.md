# SPRINT-22-01 — Provenance et autorisation des ressources — résultat

**Sprint parent :** [SPRINT-22](SPRINT-22.md) · **Sous-sprint :** [SPRINT-22-01](SPRINT-22-01.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `47bdca4` · **Commit d'implémentation :** `70c6971`
**Statut :** ✅ **C-R01, C-R02 et C-R05 satisfaits** ; 3 écarts de méthode déclarés (§ 7).

## 1. Décisions humaines reçues avant le code (30/10/2026)

Le contrat de provenance n'était fixé nulle part : l'architecture 20 § 5.1 déclare
elle-même que ces champs « ne sont pas tous imposés aujourd'hui », et la
spécification 21 énonce les exigences sans nommer les champs. Trois décisions ont
donc été demandées et obtenues **avant** d'écrire le premier test.

| # | Question | Réponse retenue |
| --- | --- | --- |
| 1 | Où stocker la provenance ? | **`metadata.provenance`**, JSON validé — **aucune migration** |
| 2 | Vocabulaire et règle d'admission | `rights.{read,redistribute,execute}` ∈ `granted\|refused\|unknown` ; `review.status` ∈ `pending\|authorized\|refused\|unknown` ; `sensitivity` ∈ `synthetic\|internal\|sensitive` ; admission ⇔ **`review.status = authorized` ET `rights.read = granted`** |
| 3 | Interface opérateur | **`ekts add --provenance <fichier.json>`** |

## 2. Contrat implémenté

Un bloc **strict** (aucune clé inconnue acceptée), dont **tous les champs sont
obligatoires** : le rédacteur doit dire ce qu'il ignore.

| Champ | Type | Règle |
| --- | --- | --- |
| `source` | texte ou `null` | `null` = explicitement inconnue |
| `sourceVersion` | texte ou `null` | idem |
| `rights.read` / `.redistribute` / `.execute` | `granted`, `refused`, `unknown` | **trois axes indépendants** |
| `sensitivity` | `synthetic`, `internal`, `sensitive` | étiquette de gouvernance, pas un contrôle d'accès |
| `fingerprint` | `{ sha256 }` ou `null` | 64 caractères hexadécimaux ; `null` = non calculée |
| `review.status` | `pending`, `authorized`, `refused`, `unknown` | décision humaine |
| `review.decidedAt` / `.decidedBy` | date ISO / texte, ou `null` | idem |

**Admission.** `authorized` **et** `granted` ⇒ admise. Sinon exclue, avec motif
lisible (`droit de lecture refusé`, `droit de lecture inconnu (aucune décision)`,
`revue non autorisée (statut : …)`, `provenance absente`). Une ressource exclue
n'est **pas** supprimée — c'est exactement la distinction de C-R02.

**Protection.** Une mise à jour ne peut pas retirer un bloc de provenance
existant (elle peut le réviser) : `metadata` est remplacé en bloc, donc sans
cette garde un simple `update` effacerait la décision de droits.

## 3. Tests écrits avant le code

| Fichier | Niveau | Cas | Rôle |
| --- | --- | ---: | --- |
| `tests/integration/provenance-write.test.ts` | I | 12 | Écriture/relecture, refus, historique, sauvegarde/restauration |
| `tests/cli/provenance.test.ts` | E2E | 9 | Parcours opérateur réel sur le binaire compilé |
| `tests/unit/provenance.test.ts` | U | 21 | Logique pure du module (**GREEN initial**, § 5) |

Aucun fournisseur, aucune clé, aucune donnée réelle : empreintes et contenus
sont synthétiques, répertoires temporaires isolés.

### 3.1 RED comportemental (verbatim)

```text
npx vitest run tests/integration/provenance-write.test.ts
→ × refuse une décision de droit hors vocabulaire
  × refuse une provenance à laquelle il manque un axe de droit
  × refuse une empreinte qui n’est pas un SHA-256 hexadécimal
  × refuse une sensibilité hors vocabulaire
  × refuse une mise à jour qui effacerait la provenance enregistrée
  × refuse une mise à jour qui remplacerait la provenance par un bloc invalide
  AssertionError: promise resolved "{ …(8) }" instead of rejecting
  Tests  6 failed | 5 passed (11)

npx vitest run tests/cli/provenance.test.ts     (avant durcissement de l'oracle)
→ 7 failed | 2 passed (9)
  AssertionError: expected 'error: unknown option \'--provenance\'…' to be ''
  AssertionError: expected 2 to be +0
```

Les échecs sont **comportementaux** : le manager acceptait n'importe quelle
métadonnée, et le binaire ignorait l'option. Aucun échec par import cassé.

### 3.2 Corrections d'oracle, déclarées

Deux cas E2E (`refuse un fichier de provenance invalide`, `… illisible`)
passaient **pour la mauvaise raison** : le binaire rejetait l'option inconnue
`--provenance`, et le message `unknown option '--provenance'` contenait le mot
« provenance » recherché. L'oracle a été durci **avant implémentation**
(`expect(stderr).not.toMatch(/unknown option/i)`), ce qui a fait tomber ces deux
cas dans le RED : **9 failed (9)**. Sans ce durcissement, le sous-sprint
aurait présenté deux faux succès.

### 3.3 GREEN

```text
tests/integration/provenance-write.test.ts → 12 passed (12)
tests/cli/provenance.test.ts               →  9 passed (9)
tests/unit/provenance.test.ts              → 21 passed (21)
npm run verify                             → EXIT 0, 1 865 passed | 38 skipped
```

## 4. Critères

### C-R01 — provenance opérable : ✅

| Exigence du critère | Preuve |
| --- | --- |
| Champs requis conservés et lisibles | `metadata.provenance` relu **à l'identique** (`toEqual`) via `ekts get --json` et via le manager |
| Sans édition manuelle de SQLite | Trois cas E2E utilisent uniquement `ekts add` / `ekts get` ; aucun test n'écrit en SQL |
| ID conservé | UUID rendu par `add`, accepté par `get` |
| Version/droit inconnus non inventés | `null` reste `null` ; un champ obligatoire manquant est **refusé**, pas complété |
| Provenance invalide refusée | 5 vocabulaires fautifs testés, tous rejetés avec le chemin fautif (`provenance.rights.redistribute : …`) |

### C-R02 — refus de droit insuffisant : ✅ 3/3

| Cas | Résultat observé |
| --- | --- |
| Droit explicitement refusé (`read: refused`) | exclue, motif `droit de lecture refusé`, **ressource conservée** |
| Droit inconnu sans décision (`read: unknown`) | exclue, motif `droit de lecture inconnu (aucune décision)` |
| Autorisation établie (`read: granted` + `authorized`) | **admise** |

Cas complémentaires : revue `pending`/`refused`/`unknown` ⇒ exclue (4 variantes) ;
`redistribute: refused` avec `read: granted` ⇒ **admise**, les trois axes restant
enregistrés séparément — c'est la distinction « droits de redistribution/
exécution distincts de la lecture ».

### C-R05 — héritage des ressources historiques : ✅

| Exigence | Preuve |
| --- | --- |
| Enregistrements historiques accessibles et inchangés | ressource créée sans provenance : titre, contenu et `metadata = {}` relus à l'identique |
| Champs inconnus restent inconnus | aucun bloc de provenance n'est fabriqué ; le statut affiché est « historique », non admis |
| Aucune transformation silencieuse | aucune migration, aucun `UPDATE` de rattrapage : les lignes existantes ne sont pas touchées |
| Sauvegarde/restauration vérifiée | fermeture propre, copie des **trois** fichiers `.db`, suppression, restauration, réouverture : ressource et métadonnées **identiques** |

## 5. GREEN initial du test unitaire, et sa sensibilité

`tests/unit/provenance.test.ts` a été écrit **après** la création du module — il
ne peut donc pas être un RED (une erreur d'import n'est pas une preuve). Le RED
du sous-sprint est celui du § 3.1, mesuré sur les points d'entrée existants.

Sa sensibilité a été prouvée par **mutation temporaire** :

```text
Mutation : suppression du garde-fou « droits de lecture refusés » dans assessAdmission()
→ npx vitest run tests/unit/provenance.test.ts
   × exclut une lecture refusée
   AssertionError: expected true to be false // Object.is equality
   Tests  1 failed | 20 passed (21)
```

**Incident de restauration, déclaré** (E22-2) : `git checkout -- src/shared/provenance.ts`
a échoué — le fichier est **non suivi**, Git ne peut pas le restaurer. Le bloc a
été remis à la main, puis vérifié par la suite complète (21/21) et par `verify`.
Leçon retenue : une mutation sur un fichier non encore indexé doit être annulée
par réécriture, pas par Git.

## 6. Mesures finales

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests     : 1 865 passed | 38 skipped (1 903)
  fichiers  : 156 passed | 6 skipped (162)
  couverture: statements 95,93 % · branches 89,22 % · fonctions 97,30 % · lignes 96,06 %
```

## 7. Fichiers (7)

**Production (4)** : `src/shared/provenance.ts` (**nouveau**, 203 lignes),
`src/business/knowledge-manager.ts`, `src/cli/commands/add.ts`,
`src/cli/commands/get.ts`.

**Tests (3)** : `tests/unit/provenance.test.ts` (**nouveau**),
`tests/integration/provenance-write.test.ts` (**nouveau**),
`tests/cli/provenance.test.ts` (**nouveau**).

**Documentation (1)** : `docs/CLI.md` (§ 3.2.1 provenance et corpus gouverné,
option `--provenance`, affichage dans `get`).

**Aucune migration, aucune dépendance ajoutée, aucun changement de schéma.**

## 8. Écarts et limites

| # | Écart | Traitement |
| --- | --- | --- |
| **E22-1** | `docs/ROADMAP.md` l. 346 décrit encore « Sprint 22 — Notifications + rapports d'équipe » | **Contradiction déclarée, non corrigée** : la section historique de la roadmap relève d'un arbitrage séparé (même racine que E21-5) |
| **E22-2** | Restauration d'une mutation impossible par `git checkout` sur un fichier non suivi | Incident déclaré, restauration manuelle vérifiée (§ 5) |
| **E22-3** | Deux cas E2E passaient pour la mauvaise raison | Oracle durci avant implémentation (§ 3.2) |
| **E22-4** | `update` remplace `metadata` en bloc : seule la **suppression de provenance** est gardée | Comportement historique conservé et déclaré ; les autres clés peuvent encore être perdues par une mise à jour, comme avant ce sprint |
| **E22-5** | Sauvegarde/restauration vérifiée **fichier par fichier, après fermeture propre** | Ce n'est pas une sauvegarde à chaud ni une atomicité multi-bases en cas de panne — limite déjà signalée par le dossier 22-01 (§ 6) |
| **E22-6** | La provenance est aussi lisible via MCP (`get_resource` renvoie `metadata`), mais aucun cas MCP ne le vérifie | Déclaré ; C-R01 vise le parcours opérateur, couvert par la CLI |

## 9. Limites et non-prouvé

- **Une provenance n'est pas un contrôle d'accès.** `sensitivity` est une
  étiquette ; elle n'empêche ni lecture, ni copie, ni envoi.
- **L'empreinte n'authentifie rien** : elle atteste des octets comparés, pas leur
  origine ni le droit de les utiliser.
- **Aucune vérification de copie** (C-R03) : elle relève de 22-02.
- **CI distante** non observée ; les nouveaux tests entrent dans le job `npm test`.
- **38 cas** navigateur/PDF toujours ignorés, inchangés.

## 10. Commandes exactes

```powershell
npx vitest run tests/integration/provenance-write.test.ts
npx vitest run tests/cli/provenance.test.ts
npx vitest run tests/unit/provenance.test.ts
npm run build
npm run verify
```

## 11. Suite

**22-02** (C-R03, C-R04) : identité des octets UTF-8/LF, correspondances
ID↔UUID↔SHA-256 sur les six ressources du manifeste, distinction des deux états
d'une version modifiée, refus d'associer une ancienne empreinte au nouveau texte.
Prérequis : 22-01 livré et critères vérifiés — **satisfaits**.
