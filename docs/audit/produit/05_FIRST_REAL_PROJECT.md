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
4. `npx playwright install chromium` (minimum ; `browsers:install` pour les 3).
5. `npx puppeteer browsers install chrome` (pour le PDF — LIM-14).
6. `npm run check:env` puis `npm run doctor` → **0 anomalie bloquante**.
7. Option : `.env` avec une clé d'embeddings pour la recherche sémantique
   (guide `docs/guides/PROVIDERS.md`) — **non requis** pour ce scénario.
8. Répertoire de données : laisser le défaut `data/` (projet dédié) ou fixer
   `EKTS_DATA_DIR`.

## 4. Parcours complet d'utilisation

| #   | Commande                                                          | Résultat attendu                       | Critère de réussite                                                                                       |
| --- | ----------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | `npm run check:env`                                               | liste des OK                           | EXIT 0                                                                                                    |
| 2   | `ekts init`                                                       | 3 bases créées                         | EXIT 0, chemins affichés                                                                                  |
| 3   | `ekts project create --name "mon-site" --url <URL>`               | projet UUID                            | EXIT 0                                                                                                    |
| 4   | `ekts inspect <URL>`                                              | score 0–100 + N constats, audit stocké | EXIT 0 ; `score ≥ 0` ; ≥ 1 finding **ou** score élevé justifié                                            |
| 5   | `ekts audit list --json`                                          | 1 audit pour l'URL                     | `count ≥ 1`                                                                                               |
| 6   | `ekts audit report <id>` (MD) + `--format pdf`                    | fichiers générés                       | fichiers non vides, MD contient score + sections 5 dimensions                                             |
| 7   | *Bonus capitalisation* : `ekts bp extract` puis `ekts search "…"` | bonnes pratiques listées               | EXIT 0                                                                                                    |
| 8   | **Corrections sur le site** (humain)                              | site déployé                           | déploiement fait                                                                                          |
| 9   | `ekts inspect <URL>` (2ᵉ)                                         | 2ᵉ audit                               | EXIT 0                                                                                                    |
| 10  | `ekts audit compare <id1> <id2>`                                  | deltas + recommandations               | **2ᵉ score ≥ 1ᵉr score − bruit** ET le rapport cite des deltas non nuls si des corrections ont été faites |
| 11  | Archivage                                                         | rapports + comparaison conservés       | revue humaine finale                                                                                      |

## 5. Critères de qualité mesurables du livrable

| #   | Critère                                                                                                       | Mesure            | Seuil                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| Q1  | Le rapport mentionne les 5 dimensions                                                                         | grep sections MD  | 5/5                                                                                               |
| Q2  | Le score est dans la plage                                                                                    | lecture           | 0 ≤ score ≤ 100                                                                                   |
| Q3  | **Justesse indicative** : parmi les 3 premiers constats, ≥ 2 sont réellement observables sur la page (humain) | revue             | ≥ 2/3                                                                                             |
| Q4  | Le PDF s'ouvre et contient le même score que le MD                                                            | lecture           | identique                                                                                         |
| Q5  | La comparaison affiche au moins un delta explicable                                                           | lecture           | ≥ 1 delta lié aux corrections                                                                     |
| Q6  | Temps d'audit L3 (page publique simple)                                                                       | chronomètre       | ≤ 120 s (budgets E2E observés : 16–35 s en local — EV-24 ; marge volontaire pour réseau variable) |
| Q7  | Reprise en cas d'erreur de saisie                                                                             | commande invalide | code 2/4 + message actionnable (EV-09)                                                            |

## 6. Erreurs acceptables vs bloquantes

| Type | Exemple | Acceptable ? | Action |
|---|---|---|---|
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
