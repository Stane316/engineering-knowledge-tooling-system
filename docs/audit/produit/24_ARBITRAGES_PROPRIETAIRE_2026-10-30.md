# 24 — Arbitrages du propriétaire — 30 octobre 2026

> **Objet** : enregistrer les décisions rendues par le propriétaire à la suite
> du rapport de prise de connaissance MVP-4 du 30 octobre 2026 et de ses
> questions ouvertes (§8 du rapport).
>
> **Statut** : décisions du propriétaire. Ce ne sont ni des recommandations
> d'agent, ni des propositions : elles tranchent les questions listées dans
> [`10_PRODUCT_DECISIONS_REQUIRED.md`](10_PRODUCT_DECISIONS_REQUIRED.md) et
> lèvent la contradiction documentaire signalée entre `DEC-04` et
> [`docs/ROADMAP.md`](../../ROADMAP.md).

---

## 1. Décisions rendues

| # | Question ouverte | Décision du propriétaire | Conséquence retenue |
| - | ---------------- | ------------------------ | ------------------- |
| 1 | Alignement de branche (`develop` / branche de session) | **Option A — fusion de `develop` dans la branche Arena** | Fusion effectuée, pas d'avance rapide, conflits prédits nuls et vérifiés |
| 2 | Ordre des travaux | **Alignement d'abord, sprint 19 ensuite** | Aucun code avant la fusion et sa vérification |
| 3 | `C-W03` — les trois formats | **Revu : les trois formats doivent être effectivement produits** | Ne pas se limiter à un constat `bloqué` : l'environnement est préparé pour produire réellement Markdown, HTML et PDF |
| 4 | Contrat `C-W07` — score global | **`null` + raison**, et **structuration renforcée** | Le score indisponible porte une raison exploitable, pas un simple `null` nu |
| 5 | Compteur `info` des lignes historiques | **`0` mesuré** | Aucun `NULL`, aucune valeur « non mesuré » : le compteur est toujours numérique |
| 6 | `DEC-04` — cap du produit | **MVP-4** (roadmap de `develop`) | `DEC-04` est tranchée en faveur de l'option B ; la roadmap de `develop` devient la référence |
| 7 | Commits et push pendant l'implémentation | **Autorisés** | Un commit par sous-sprint, `npm run verify` = 0 avant chaque push, sur la branche de session uniquement |

## 2. Portée de l'autorisation

- **Sprint 19 uniquement**, sous-sprint par sous-sprint (`19-01` → `19-02` →
  `19-03`), dans cet ordre et sans sauter d'étape.
- Un `C-W03` ne peut être déclaré réussi que si les trois formats sont
  produits pour de bon ; un échec d'environnement se rapporte comme tel, sans
  installation implicite non annoncée.
- Aucune pull request, aucun push sur `main`, aucune fusion vers `develop` :
  le propriétaire reste seul à intégrer.

## 3. Conséquences techniques actées

### 3.1 `C-W07` — contrat du score indisponible

Le score global devient une **union discriminée** plutôt qu'un nombre nu :

- état mesuré : valeur numérique conservée à l'identique (aucune régression de
  contrat pour les audits complets) ;
- état indisponible : valeur `null` **et** raison structurée (statut, code de
  raison, dimensions manquantes), pour que l'API, le stockage et les rapports
  puissent expliquer l'absence sans jamais afficher `0`.

Aucune renormalisation silencieuse, aucun zéro de remplacement.

### 3.2 `C-W03` — production réelle des trois formats

Markdown, HTML et PDF sont produits et contrôlés sur un audit synthétique ; le
décompte par priorité est vérifié dans les données **et** dans le texte extrait
du PDF. Le prérequis navigateur est installé explicitement et documenté, pas
contourné.

### 3.3 Compteur `info` et données historiques

- Nouvelle colonne additive `info_findings` (`NOT NULL DEFAULT 0`) : les
  audits antérieurs restent lisibles, aucune autre colonne n'est réécrite.
- Les constats étant persistés dans `audit_findings` avec leur priorité, le
  compteur `info` d'une ligne historique est **recalculé depuis ces constats**
  lorsqu'ils existent, et vaut `0` sinon : la valeur reste une observation,
  jamais une attribution rétroactive inventée.
- `C-W02` exige la somme des **cinq** compteurs = total des constats : c'est
  cette égalité qui fait foi, pas la seule présence d'une colonne.

## 4. Points laissés sous surveillance

- **`DEC-04` vs `docs/ROADMAP.md`** : la décision tranche pour MVP-4 ; la
  roadmap de `develop` est donc cohérente avec elle. Le document
  `10_PRODUCT_DECISIONS_REQUIRED.md` conserve `DEC-04` en historique et
  renvoie ici pour l'arbitrage rendu.
- **Double série S17** du registre d'avancement : non tranchée par ces
  arbitrages, elle reste un avertissement documenté.
- **CI distante bloquée pour facturation** : aucun job exécuté, donc aucune
  preuve automatisée distante ; seul `npm run verify` local fait foi.

## 5. Traçabilité

- Rapport de prise de connaissance : réponse du 30 octobre 2026 (session
  Arena), §1 à §10, non persisté dans le dépôt.
- Fusion d'alignement : commit de fusion `5dd02a7`, parents `861a07d`
  (branche de session) et `398df3e` (`origin/develop`), contenu identique à
  `develop`, `src/`, `tests/`, `scripts/`, `package.json` et
  `vitest.config.ts` inchangés.
- Vérification de la fusion : `npm run verify` = 0, 1 656 tests réussis,
  34 ignorés, couverture 96,4 %.
