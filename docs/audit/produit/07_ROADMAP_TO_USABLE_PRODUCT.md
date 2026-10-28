# 07 — Feuille de route vers un produit réellement utilisable

> **Cap proposé** : **« EKTS 0.2.x — Version d'usage »** (nommage justifié
> §6) : aucune nouvelle fonctionnalité métier tant que les chantiers P0/P1
> ne sont pas clos. Ce n'est **pas** une MVP-4 de features (cf. DEC-04).
> Règle : un chantier n'a de sens que s'il lever un blocage identifié dans
> `06` et qu'il a un critère de fin vérifiable.

---

## P0 — Bloquant (empêche la première utilisation réelle ou trompe l'utilisateur)

### CH-P0-1 — Runbook premier projet exécuté et validé
- **Problème** : GAP-01 — chaque morceau est prouvé, le fil complet ne l'est
  pas comme tel.
- **Capacité manquante** : « j'ai obtenu un résultat complet, une fois ».
- **Preuves** : `05` ; prouvé en morceaux (EV-04…09, EV-24).
- **Résultat attendu** : PV d'exécution du scénario `05` (11 étapes, Q1–Q7).
- **Changements nécessaires** : **0 ligne de code** — exécution + PV.
- **Dépendances** : CH-P0-2 d'abord ; poste avec navigateurs (poste
  utilisateur = OK, EV-24/25).
- **Risques** : Q3 (justesse) peut échouer → **c'est une information**, pas
  un échec du chantier (alimenter CH-P2-1).
- **Critère d'acceptation** : PV archivé (dossier `docs/audit/produit/` ou
  `artifacts/`), 11/11 étapes, Q1/Q2/Q4/Q5/Q6/Q7 verts.
- **Vérification finale** : relecture du PV par le propriétaire.
- **Condition de passage au suivant** : PV exists + limite éventuelle
  remontée en GAP.

### CH-P0-2 — Réconciliation des documents d'entrée
- **Problème** : GAP-02 / LIM-07 (🔴) — README et USER_GUIDE affichent des
  versions antérieures.
- **Capacité manquante** : un nouvel arrivant identifie le bon produit.
- **Preuves** : EV-17.
- **Résultat** : bandeau README = « MVP-3 validé — 0.2.0 » ; USER_GUIDE
  en-tête aligné ; liens de la ROADMAP testés.
- **Changements** : 2–3 fichiers doc uniquement (pas de code).
- **Critère** : `grep -E "0\.1\.0|MVP-2 validé" README.md` → vide ;
  `grep "2.0.0" docs/USER_GUIDE.md` → vide ; CI verte (doc only).
- **Durée** : ~30 min.

### CH-P0-3 — Arbitrage de cap (décisionnel)
- **Problème** : GAP-12 / DEC-04 — sans cap écrit, tout chantier est
  réversible par principe.
- **Critère** : décision tranchée consignée dans `10` (par le propriétaire).
- **Condition** : bloque l'ordonnancement de tout le reste.

---

## P1 — Indispensable à la première intégration (si intégration agent visée)

### CH-P1-1 — Câblage ou abandon de la surface navigateur MCP
- **Problème** : GAP-03 (LIM-03).
- **Options** : (a) script `mcp:browser` maison (~0,5 j) · (b) s'appuyer sur
  `@playwright/mcp` officiel (vérifié : `0.0.83`, npm, 28/09/2026) et
  documenter « EKTS expose la connaissance, le navigateur se branche de
  l'extérieur » · (c) retirer la surface (code mort assumé).
- **Recommandation** : **(a)** si la valeur « tout-en-un » compte pour les
  agents ; **(b)** si la simplicité prime — **décision DEC-03**.
- **Dépendances** : DEC-03.
- **Critère** : soit commande verte + `tools/list` = 5 sur inspector, soit
  décision écrite + docs `PLAYWRIGHT.md` §8 reformulé (« import
  programmatique assumé »).

### CH-P1-2 — Exécution du scénario d'intégration minimal sur hôte réel
- **Problème** : GAP-04 (NV-3).
- **Résultat** : PV « hôte + 8 étapes » (scénario de `04`).
- **Changements** : 0 code (sauf fix si bug révélé — à soumettre alors
  séparément, règle maison).
- **Dépendances** : CH-P0-1 (savoir utiliser le produit d'abord).
- **Critère** : PV + capture, `tools/list`=17, chaîne 3 appels + erreur
  gérée.

### CH-P1-3 — Installation & distribution décidées
- **Problème** : GAP-05 (LIM-01).
- **Options** : `npm publish` (nom libre, EV-14) · ou doc « clone seulement »
  assumée. **DEC-01**.
- **Critère** : soit `npm view ekts` → 0.2.x + `npx ekts --help` vert, soit
  section README « Installation : par clone uniquement » + justification.

### CH-P1-4 — Mise à niveau SDK MCP + re-handshake
- **Problème** : GAP-06 (LIM-08).
- **Changements** : `package-lock` `^1.32.2` + log de handshake.
- **Critère** : tests MCP verts + nouveau `protocolVersion` relevé dans le
  PV d'intégration.

### CH-P1-5 — Prérequis PDF/Chrome dans la santé système
- **Problème** : LIM-14 (régression d'expérience possible sur poste neuf).
- **Changements** : `check:env`/`doctor` signalent Chrome/Puppeteer manquant
  avec la commande exacte.
- **Critère** : poste sans Chrome → `doctor` sort avec un conseil **et le
  scénario `05` échoue avec un message actionnable** (test de fumée
  documenté).

---

## P2 — Améliorations importantes (qualité/robustesse, sans bloquer le premier scénario)

| Chantier | Problème | Résultat attendu | Critère de fin |
|---|---|---|---|
| **CH-P2-1** Jeu de justesse (GAP-08) | LIM-12 | 5–10 pages locales annotées + expectations en CI | 100 % franchies en CI |
| **CH-P2-2** Lisible score FTS (LIM-13) | score BM25 négatif exposé | normalisation ou doc dans `API_REFERENCE` | doc + test contrat JSON |
| **CH-P2-3** Procédures opérationnelles (GAP-10, GAP-11) | backup + concurrence | 2 sections doc (+option test concurrent) | doc présente, test si retenu |
| **CH-P2-4** Mode vectoriel : guide fournisseur gratuit + test live opt-in (GAP-07) | LIM-04 | parcours « 1 clé gratuite → hybride actif » | test live vert (manuel) OU doc « FTS par défaut » affirmée |
| **CH-P2-5** Rejouer les preuves résiduelles (GAP-09) | codes 1 + chaîne MCP | intégrées au PV CH-P0-1 | PV complété |
| **CH-P2-6** Documentation des écarts MVP-3 restants | C16.6/C16.7/C17.12 (H-04) | soit clos, soit report explicite dans `MVP3_VALIDATION` | statut mis à jour |
| **CH-P2-7** Exactitude exécutable des runbooks (GAP-13) | 4 commandes fausses dans `05` v1.0 | Chaque commande documentée est **exécutée** avant publication | `05` v1.1 sans erreur de syntaxe (EV-35) — fait ; règle : test avant doc |
| **CH-P2-8** Hygiène de sortie CLI (GAP-14) | Bannière npm (LIM-17), `reports/` non ignoré (LIM-18) | `--json` pur quel que soit le lanceur ; livrables hors git | Doc en place ; `.gitignore` +`reports/` **à valider** par le propriétaire |


## P3 — Évolution future (après la « version d'usage »)

| Sujet | Condition d'entrée |
|---|---|
| L4 crawling (site entier) | Premier projet réel **exige** l'exploration multi-pages + capacité de juger la politeness |
| Interactions (fill/click) | Scénario authentifié identique dans le premier projet réel |
| API/bibliothèque npm (DEC-02) | Demandes réelles d'encastrage |
| Intégrations tierces (Slack/Jira) | Option MVP-4-2 retenue (DEC-04) |
| ML de détection de patterns | Option MVP-4-3 + données capitalisées suffisantes |
| Collaboration/comptes | Option MVP-4-1 (rupture SQLite locale assumée) |

---

## Dépendances et ordre réel

```
CH-P0-2 (docs)  ──► CH-P0-1 (runbook) ──► CH-P1-2 (hôte réel) ──► (usage agent)
        │                    │
        └──► CH-P0-3 (cap) ──┴──► CH-P1-1 (surface navigateur : DEC-03)
                                 CH-P1-3 (distribution : DEC-01)
                                 CH-P1-4 (SDK)        [indépendants]
                                 CH-P1-5 (doctor PDF) [indépendant]
        P0 clos ──► P2 (qualité) ; P3 seulement après premiers usages réels
```

## Pourquoi cette trajectoire plutôt que les alternatives

| Alternative étudiée | Pourquoi écartée |
|---|---|
| **Démarrer une MVP-4 de features** (collab/IA/marketplace) | Étendrait un produit dont le fil d'usage premier n'est pas encore prouvé ni présenté correctement (GAP-01/02) — risque d'accumuler du non-vérifié (position conforme à l'ADR-044 maison et à la règle « feu vert ») |
| **Refonte architecture / découpage en services** | Aucune preuve d'un problème de maintenabilité (153 fichiers, tests 96 %+ ; EV-01/21) — refonte sans symptôme = coût sans capacité gagnée |
| **Ajouter MCP externe `@playwright/mcp` d'emblée** | Résout LIM-03 mais ajoute une dépendance mouvante (0.0.x) **avant** d'avoir tranché si la surface maison a une valeur (DEC-03) |
| **Publier npm tout de suite** | Sans scénario premier projet validé, on distribuerait une expérience non consolidée (et le README fausserait la perception — GAP-02) |

## Objectif final vérifiable

> **« Un utilisateur de zéro, en une session, sur une page qu'il possède,
> obtient les 2 rapports + la comparaison du scénario `05`, avec Q1–Q7
> verts ; un agent, en une session, exécute le scénario `04` sur un hôte
> réel ; les documents d'entrée affichent la bonne version. »**

Ce seuil définit la **« Version d'usage » (0.2.x)**. Au-delà : diffusion
large (critères `08` §B) puis MVP-4 arbitrée.
