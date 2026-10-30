# SPRINT-21 — Profil d'exposition MCP et échec fermé — résultat

**Sprint :** [SPRINT-21](SPRINT-21.md) · **Exigences :** P01, P02, P03, O01
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `3eceac0` · **Commits :** `3370912`, `64abd6e`, `28df509`, `0dbf037`, puis le présent bilan
**Statut :** ⚠️ **NON CLÔTURABLE COMME RÉUSSI** — 6 critères satisfaits, 1 partiel, 2 bloqués (P3).

## 1. Périmètre livré

| Sous-sprint | Livré | Commit |
| --- | --- | --- |
| [21-01](SPRINT-21-01-RESULTAT.md) — inventaire et exposition | ✅ | `3370912` |
| [21-02](SPRINT-21-02-RESULTAT.md) — noms et arguments | ✅ | `28df509` |
| [21-03](SPRINT-21-03-RESULTAT.md) — effets, isolation, attaque | ⚠️ partiel (2 bloqués) | présent commit |

**Ce qui existe désormais** : une politique d'exposition déclarative
(`src/mcp/profiles.ts`), sélectionnée par `EKTS_MCP_PROFILE` (`read` / `full`,
absence = `full`), appliquée à la **découverte** et à l'**exécution**, avec échec
fermé sur toute valeur invalide ; et, sous profil `read`, l'obligation d'un
`mode: "fts"` fourni **explicitement**, refusé avant le défaut Zod, le
fournisseur d'embeddings et le réseau.

## 2. Critères — état réel

| Critère | Statut | Preuve |
| --- | --- | --- |
| **C-P01** exposition | ✅ **3/3** | `profile-exposure.test.ts` 1/3, `stdio-profile.test.ts` (binaire) |
| **C-P04** échec fermé | ✅ **4/4** | profil inconnu, valeur vide, politique vide, bascule implicite : tous refusés |
| **C-P02** refus direct | ✅ **14/14** | 14 noms + 1 faux, arguments valides, préconditions réelles, état inchangé |
| **C-P03** outils autorisés | ✅ **3/3** | contrat identique sous `read` et `full` |
| **C-P08** mode réseau | ✅ **1/1 + 3/3** | `fts` permis ; omis/`hybrid`/`vector` refusés ; 0 embeddings, 0 réseau |
| **C-P05** effets au démarrage | ✅ | 11 migrations, 10 templates, 9 fichiers ; 0 ligne métier modifiée par 3 appels permis + 15 refusés |
| **C-O01** données et réseau | ⚠️ **partiel** | 0 requête applicative ; test positif de blocage avec canari ; **isolation OS non observable** |
| **C-P06** confinement hôte/OS | 🚫 **BLOQUÉ** | aucune session isolée ni observation des refus OS ; report Sprint 24 (accord du 30/10) |
| **C-P07** injection T06/V02 | 🚫 **BLOQUÉ** | aucune sandbox ni exposition agent vérifiée ; aucune conformité affirmée |

**Dénominateur** : 9 critères — 6 satisfaits, 1 partiel, 2 bloqués.

## 3. Ce que ces tests ne prouvent pas

- **Le profil n'est pas une sandbox.** Il limite ce que le serveur expose et
  exécute ; il ne limite ni les fichiers, ni le réseau, ni les processus de
  l'agent. Un agent qui lirait un fichier hors EKTS ne serait pas arrêté par ce
  mécanisme.
- **`0 requête`** est une mesure **applicative** (`fetch` instrumenté). Ce n'est
  pas une capture réseau au niveau de l'OS.
- **C-P06/C-P07 n'ont aucune mesure réelle.** Les deux critères restent ouverts
  au Sprint 24, après G0 et autorisation distincte.
- **CI distante** non observée ; les nouveaux tests entrent dans le job
  `npm test` existant, sans clé ni fournisseur.
- **38 cas** navigateur/PDF restent ignorés, comme avant le sprint.

## 4. Mesures finales reproductibles

```text
npm ci
npm run build
npm run verify
```

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests     : 1 823 passed | 38 skipped (1 861)
  fichiers  : 153 passed | 6 skipped (159)
  couverture: statements 96,04 % · branches 89,44 % · fonctions 97,42 % · lignes 96,18 %
```

Détail par sous-sprint :

```powershell
npx vitest run tests/mcp/profile-exposure.test.ts          # 7
npx vitest run tests/mcp/profiles.test.ts                  # 12
npx vitest run tests/mcp/integration/stdio-profile.test.ts # 9
npx vitest run tests/mcp/profile-refusals.test.ts          # 8
npx vitest run tests/mcp/profile-fts-mode.test.ts          # 8
npx vitest run tests/mcp/startup-effects.test.ts           # 6
npx vitest run tests/mcp/network-control.test.ts           # 4
npx vitest run tests/mcp                                  # 223
```

## 5. Fichiers touchés (11)

**Production (4)** : `src/mcp/profiles.ts` (**nouveau**), `src/mcp/server.ts`,
`src/mcp/handlers/tools.ts`, `src/mcp/utils/errors.ts`.
**Tests (7)** : `tests/mcp/profile-exposure.test.ts`, `tests/mcp/profiles.test.ts`,
`tests/mcp/profile-refusals.test.ts`, `tests/mcp/profile-fts-mode.test.ts`,
`tests/mcp/startup-effects.test.ts`, `tests/mcp/network-control.test.ts`,
`tests/mcp/integration/stdio-profile.test.ts` (**nouveaux**) ; `tests/mcp/helpers.ts` (modifié).
**Documentation (3)** : `docs/MCP.md`, `AGENTS.md`, `REGISTRE-AVANCEMENT.md`.

Aucune migration, aucune dépendance ajoutée, aucun changement de schéma.

## 6. Écarts (P3) — récapitulatif

| # | Écart | Statut |
| --- | --- | --- |
| **E21-1** | Au protocole, un outil masqué renvoie `-32602 « Tool not found »` (SDK) ; le `-32601` décidé par le propriétaire s'applique au chemin direct | **Accepté tel quel** (décision du 30/10) |
| **E21-2** | Nom connu masqué et nom inexistant rendent la même réponse protocole | Conséquence d'E21-1 |
| **E21-3** | `audit_report` appelé sans audit existant (précondition volontairement absente) | Déclaré |
| **E21-4** | Compteur d'embeddings remis à zéro après semis | Correctif de mesure |
| **E21-5** | Oracle E2E corrigé sur la forme de la réponse (résultat `isError` et non objet `error`) | Déclaré, assertions inchangées |
| **E21-6** | **C-P06 et C-P07 bloqués** | Report Sprint 24 accepté |
| **E21-7** | C-O01 mesuré au niveau applicatif | Compté partiel |
| **E21-8** | Aucun RED sur 21-03 (cas déjà conformes) | Sensibilité prouvée par mutation |
| **E21-9** | Tailles de `-wal` non comparées | Conforme au critère |
| **E21-10** | Écritures hors `dataDir` non observées | Déclaré |

## 7. Risques résiduels

1. **Confiance dans une garde non observée au niveau OS** : un lecteur pourrait
   prendre le profil `read` pour une barrière de sécurité. `docs/MCP.md` § 1.1
   le dit explicitement « le profil n'est pas une sandbox ».
2. **Dérive du SDK** : si `@modelcontextprotocol/sdk` change la gestion des
   outils non enregistrés, le code d'erreur protocole peut changer sans que nos
   tests le voient (ils mesurent « remplaçable », pas la version).
3. **`-32602` vs `-32601`** : un client qui distingue strictement les codes peut
   traiter différemment un outil masqué et un outil inexistant, alors que la
   sémantique est la même.
4. **G1 reste inaccessible** tant que C-P06/C-P07 ne sont pas vérifiés.

## 8. Checklist de clôture réelle

- [x] Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code.
- [x] Tests U/I/E2E et raccordement CI préparés avant chaque implémentation ;
      RED pertinent (21-01, 21-02) ou GREEN initial justifié et **prouvé
      sensible par mutation** (21-03).
- [x] Critères évalués selon 22 ; **blocages, partiels et skips explicités**
      (§ 2, § 3).
- [x] Contrats, migrations, sécurité et docs vérifiés dans leur périmètre ;
      aucune migration, aucune donnée historique modifiée.
- [x] Rapports et commits réels traçables ; registre à jour avec date et hash.
- [ ] **Bilan transmis et validation humaine obtenue avant le sprint suivant** —
      en attente de votre accord. **Le sprint 22 n'est pas engagé.**

## 9. Suite proposée

1. **Vous** vérifiez ce bilan et les commandes du § 4 sur votre poste.
2. **Sprint 24** (après G0, sur autorisation distincte) : vérification réelle de
   C-P06 et C-P07, puis C-O01 au niveau OS.
3. **Sprint 22** seulement après votre accord explicite.

> **Contrat de reproduction.** Les commandes du § 4 ont été exécutées ici dans
> l'ordre indiqué, sur Node 22 et une base temporaire isolée. Les valeurs
> attendues sont celles du bloc de sortie : `EXIT=0`, **1 823** tests passés,
> **38** ignorés, **153** fichiers passés, **6** ignorés. Un écart chez vous est
> un défaut à corriger, pas une variante acceptable.
