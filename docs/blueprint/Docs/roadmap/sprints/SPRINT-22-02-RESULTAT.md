# SPRINT-22-02 — Identité et conservation des versions — résultat

**Sprint parent :** [SPRINT-22](SPRINT-22.md) · **Sous-sprint :** [SPRINT-22-02](SPRINT-22-02.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `49d0f98` · **Commit d'implémentation :** `0bdc1ce`
**Statut :** ✅ **C-R03 satisfait** (volets **I** et **P**) · ⚠️ **C-R04 : volet I vérifié, volet H (revue humaine) à conduire par le propriétaire** — 3 écarts déclarés (§ 8), dont un incident de manipulation Git (§ 6).

## 0. Référence de commit

> **Référence de commit mise à jour le 31/10/2026.** Le clone de travail a été
> recréé et l'historique local non poussé a été perdu ; le contenu de ce
> sous-sprint a été reconstitué à l'identique depuis l'arbre de travail, ce qui
> produit un **hash différent** de celui consigné lors de la première exécution.
> Le hash ci-dessus est celui qui existe réellement sur la branche distante.

## 1. Point de départ et décision implicite assumée

Le manifeste du corpus (`docs/audit/produit/scenario-comparatif/manifeste-corpus.json`)
fixe lui-même la règle d'identité :

> « bytes UTF-8 sans BOM et fins de ligne LF, SHA-256 sur octets exacts des fichiers »

Aucune décision humaine supplémentaire n'était donc nécessaire pour la portée du
hachage. En revanche, le critère C-R04 exige d'« interdire d'associer une
ancienne empreinte au nouveau texte » : cela **impose** une vérification à
l'écriture, absente après 22-01 (l'empreinte y était seulement stockée). Le
design retenu est le plus étroit qui satisfasse les deux critères :

| Règle implémentée | Critère |
| --- | --- |
| Empreinte calculée sur les **octets UTF-8 exacts** du contenu, sans normalisation | C-R03 |
| Empreinte déclarée ≠ contenu fourni ⇒ **refus** (code 4) | C-R03 |
| Contenu modifié sous une empreinte enregistrée ⇒ **refus** si aucune nouvelle empreinte | C-R04 |
| Nouvelle empreinte fausse sur le nouveau texte ⇒ **refus** | C-R04 |
| Contenu effacé sous une empreinte ⇒ **refus** | C-R04 (conservation de la preuve) |
| Empreinte sans copie conservée ⇒ état **`unverifiable`** affiché (« non reconstructible ») | C-R04 (dernier alinéa) |

## 2. Tests écrits avant le code

| Fichier | Niveau | Cas | Rôle |
| --- | --- | ---: | --- |
| `tests/integration/corpus-identity.test.ts` | I | 7 | Manifeste ↔ fichiers ↔ base (C-R03) |
| `tests/integration/version-identity.test.ts` | I | 6 | Deux états, refus du rétroactif (C-R04) |
| `tests/unit/fingerprint.test.ts` | U | 16 | Logique pure (**GREEN initial**, § 5) |
| `tests/cli/fingerprint.test.ts` | E2E | 4 | Champ `verification` sur le binaire |

### 2.1 RED comportemental (verbatim)

```text
npx vitest run tests/integration/corpus-identity.test.ts tests/integration/version-identity.test.ts
→ × refuse une empreinte qui ne correspond pas au contenu fourni
  × refuse un contenu dont les fins de ligne ont été converties en CRLF
  × refuse de laisser l’ancienne empreinte associée au nouveau texte (2/2 états)
  × refuse une nouvelle empreinte qui ne correspond pas au nouveau texte
  AssertionError: promise resolved "{ …(8) }" instead of rejecting
  Tests  4 failed | 9 passed (13)
```

Les quatre échecs portent sur le **comportement** : le manager acceptait une
empreinte qui ne décrivait pas les octets écrits. Aucune erreur d'import.

Les neuf cas déjà verts sont des constats **mesurés**, pas des suppositions :
manifeste 6/6 conforme, mapping ID↔UUID↔SHA-256 complet, accents préservés.

### 2.2 GREEN

```text
tests/integration/corpus-identity.test.ts → 7 passed
tests/integration/version-identity.test.ts → 6 passed
tests/unit/fingerprint.test.ts             → 16 passed
tests/cli/fingerprint.test.ts              → 4 passed
suite complète                             → 1 898 passed | 38 skipped (160 fichiers)
```

## 3. C-R03 — identité des contenus : ✅ 6/6 (I + P)

Le critère est de type **I/P** : le volet intégration est ci-dessous, le volet
preuve opérationnelle est au § 3.2.

| Élément du critère | Mesure |
| --- | --- |
| Manifeste ↔ fichiers | **6/6** : taille, absence de BOM, fins LF, UTF-8 valide, SHA-256 identique |
| Contenu relu (B) ↔ copie directe (C) | comparaison **octet par octet** (`Buffer.equals`) pour les 6 ressources |
| Mapping ID ↔ UUID ↔ SHA-256 | **6 UUID distincts**, tous relus, empreinte = valeur du manifeste |
| « aucune réussite si normalisation » | un contenu altéré d'un seul espace est **refusé** ; un contenu converti en CRLF est **refusé** |
| Aucune donnée réelle | les six fichiers sont ceux du corpus **synthétique** déclaré par le manifeste |

### 3.2 Preuve opérationnelle (P)

```text
python3 -c "hashlib.sha256(...)" sur les 8 entrées du manifeste
→ R01 898 o · R02 1 233 o · R03 847 o · R04 620 o · R05 1 228 o · R06 786 o
  V01 362 o · V02 432 o
→ 8/8 empreintes identiques au manifeste · aucun BOM · aucun CRLF · UTF-8 valide
```

Le manifeste est versionné (`docs/audit/produit/scenario-comparatif/manifeste-corpus.json`)
et constitue la référence figée : les valeurs ci-dessus sont recalculées à
chaque exécution, jamais recopiées du manifeste.

## 4. C-R04 — version après modification : volet I ✅ 2/2 états · volet H ⏳

Le critère est de type **I/H**. Le volet **I** est mesuré ci-dessous ; le volet
**H** (revue humaine avec feuille et références) **reste à conduire par le
propriétaire** : il n'est ni simulé ni coché ici. Selon la règle de dénominateur
du document 22, C-R04 ne peut donc pas être déclaré « réussi » par cette seule
exécution.

| État | Mesure |
| --- | --- |
| (1) Version autorisée conservée | contenu V1, empreinte H1, relu à l'identique |
| (2) Texte modifié | H2 ≠ H1, vérifié explicitement |
| Preuve rétroactive | modification du contenu **sans** nouvelle empreinte ⇒ **refus** ; l'état conservé reste V1/H1 |
| Ancienne empreinte réutilisée | H1 déclarée sur V2 ⇒ **refus** |
| Nouvelle empreinte correcte | V2 + H2 ⇒ accepté, **même UUID**, empreinte mise à jour |
| Version non reconstructible | empreinte sans contenu ⇒ `verification = "unverifiable"`, mention « non reconstructible » dans la sortie humaine |

## 5. GREEN initiaux et sensibilité prouvée par mutation

`tests/unit/fingerprint.test.ts` et `tests/cli/fingerprint.test.ts` ont été
écrits après le module : ils ne peuvent pas être des RED (une erreur d'import
n'en est pas un). Le RED du sous-sprint est celui du § 2.1.

Sensibilité prouvée par mutation **propre** (copie de sauvegarde, mutation,
restauration, re-vérification) :

```text
Mutation : `if (false && actual !== provenance.fingerprint.sha256)` dans assertFingerprintMatches()
→ × refuse une empreinte qui ne décrit pas les octets                (unitaire)
  × refuse l’ancienne empreinte réutilisée sur le nouveau texte       (unitaire)
  × refuse une empreinte qui ne correspond pas au contenu fourni      (intégration)
  × refuse un contenu dont les fins de ligne ont été converties       (intégration)
  Tests  4 failed | 19 passed (23)
→ restauration : 0 occurrence de `false &&`, puis 29 passed (29)
```

## 6. Incident de manipulation Git, déclaré (E22-8)

La **première** restauration de mutation a utilisé `git checkout -- src/shared/provenance.ts`.
Le fichier était suivi depuis le commit `70c6971`, mais il portait aussi des
ajouts **non commités** de 22-02 : `git checkout` a donc ramené la version
committée et **effacé le travail du jour**. Symptôme immédiat : `Tests no tests`
(les tests importaient des fonctions disparues).

Traitement : bloc réappliqué à l'identique, `tsc --noEmit` propre, 22/22 sur les
suites concernées, puis mutation refaite avec **copie de sauvegarde** au lieu de
Git. Aucune perte de données ni de décision ; l'incident est consigné parce
qu'il change la procédure : **une mutation ne se restaure pas par Git sur un
arbre sale**.

## 7. Mesures finales

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests     : 1 898 passed | 38 skipped (1 936)
  fichiers  : 160 passed | 6 skipped (166)
  couverture: statements 95,87 % · branches 89,21 % · fonctions 97,24 % · lignes 96,00 %
```

## 8. Fichiers (10 hors ce rapport) et écarts

**Production (3)** : `src/shared/provenance.ts` (+ 4 fonctions : `sha256OfUtf8`,
`verifyFingerprint`, `assertFingerprintMatches`, `assertVersionIdentity`),
`src/business/knowledge-manager.ts`, `src/cli/commands/get.ts`.

**Tests (6)** : `tests/integration/corpus-identity.test.ts`,
`tests/integration/version-identity.test.ts`, `tests/unit/fingerprint.test.ts`,
`tests/cli/fingerprint.test.ts` (**nouveaux**) ; `tests/integration/provenance-write.test.ts`
et `tests/cli/provenance.test.ts` (fixtures ajustées, voir E22-7).

**Documentation (1)** : `docs/CLI.md` (§ 3.2.1 : vérification d'empreinte, tableau
des états `verification`).

| # | Écart | Traitement |
| --- | --- | --- |
| **E22-7** | Deux fichiers de tests de **22-01** ont été ajustés : leur empreinte était une constante arbitraire, désormais refusée par la vérification | Les **assertions** de 22-01 sont inchangées ; seules les fixtures calculent l'empreinte du contenu qu'elles écrivent. Déclaré, et 22-01 repasse 9/9 et 12/12 |
| **E22-8** | `git checkout` a effacé des ajouts non commités (§ 6) | Incident déclaré, restauration vérifiée |
| **E22-9** | Règles ajoutées non explicitement écrites dans les critères : refus d'effacer un contenu sous une empreinte ; `verification` exposé dans `get` | Interprétation directe de C-R04 (« aucune preuve rétroactive ») et de son dernier alinéa (« qualifier la version non reconstructible »). **À valider par le propriétaire** ; aucune autre voie ne satisfaisait les deux critères |

## 9. Limites et non-prouvé

- **Six ressources synthétiques**, pas de données réelles : C-R03 est prouvé sur
  le corpus du manifeste, pas sur un corpus utilisateur.
- **B et C sont sur le même poste** : la comparaison octet par octet prouve la
  fidélité de l'ingestion, pas une indépendance de supports ou de machines.
- `verification = "mismatch"` est **défensif** : l'écriture le refuse en amont,
  l'état ne devrait donc jamais apparaître.
- **Aucune vérification de signature** : une empreinte atteste des octets, pas
  l'authenticité ni le droit d'usage.
- **CI distante** non observée ; **38 cas** navigateur/PDF toujours ignorés.

## 10. Commandes exactes

```powershell
npx vitest run tests/integration/corpus-identity.test.ts
npx vitest run tests/integration/version-identity.test.ts
npx vitest run tests/unit/fingerprint.test.ts
npm run build
npx vitest run tests/cli/fingerprint.test.ts
npx vitest run tests/integration/provenance-write.test.ts tests/cli/provenance.test.ts
npm run verify
```

## 11. Suite

**22-03** (C-R06, C-R07, C-R08, C-O07) : les huit requêtes figées (7 positives,
1 négative, limite 5), les états d'erreur distincts et le repli explicite.
Prérequis : 22-02 livré et critères vérifiés — **satisfaits**.
