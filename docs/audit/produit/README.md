# Audit produit EKTS — dossier de référence

> **Mission** : audit produit complet, cartographie des capacités et feuille
> de route vers une version réellement utilisable.
> **Date** : 26 octobre 2026 · **Commit audité** : `3156147` (branche
> `arena/079e2f26-engineering-knowledge-tooling`) · **Version produit** :
> `ekts` 0.2.0 (MVP-3 validée le 26/10).
> **Portée** : lecture, exécution contrôlée et analyse — **aucun changement
> fonctionnel** n'a été effectué (les seules écritures sont ces documents).

## Par où commencer

| Si vous voulez… | Lisez |
|---|---|
| comprendre le produit en 5 minutes | [`00_PRODUCT_OVERVIEW.md`](00_PRODUCT_OVERVIEW.md) |
| le verdict complet et les 14 réponses | [`11_AUDIT_SUMMARY.md`](11_AUDIT_SUMMARY.md) |
| savoir ce qui est réellement utilisable | [`02_CURRENT_CAPABILITIES.md`](02_CURRENT_CAPABILITIES.md) |
| savoir ce qui ne l'est pas (et pourquoi) | [`03_PRODUCT_LIMITATIONS.md`](03_PRODUCT_LIMITATIONS.md) |
| brancher un agent (CLI / MCP) | [`04_INTEGRATION_READINESS.md`](04_INTEGRATION_READINESS.md) |
| essayer sur votre premier projet | [`05_FIRST_REAL_PROJECT.md`](05_FIRST_REAL_PROJECT.md) |
| décider de la suite | [`07_ROADMAP_TO_USABLE_PRODUCT.md`](07_ROADMAP_TO_USABLE_PRODUCT.md) + [`10_PRODUCT_DECISIONS_REQUIRED.md`](10_PRODUCT_DECISIONS_REQUIRED.md) |

## Les douze documents

| # | Fichier | Rôle |
|---|---|---|
| 00 | [`00_PRODUCT_OVERVIEW.md`](00_PRODUCT_OVERVIEW.md) | Vue d'ensemble, valeur, modes d'usage, maturité |
| 01 | [`01_MVP_EVOLUTION.md`](01_MVP_EVOLUTION.md) | Ce que chaque MVP a apporté (MVP-1 → MVP-3) + incertitudes d'historique |
| 02 | [`02_CURRENT_CAPABILITIES.md`](02_CURRENT_CAPABILITIES.md) | Catalogue CAP-01 → CAP-49 : « que puis-je demander aujourd'hui ? » |
| 03 | [`03_PRODUCT_LIMITATIONS.md`](03_PRODUCT_LIMITATIONS.md) | LIM-01 → LIM-16 classées par nature et gravité |
| 04 | [`04_INTEGRATION_READINESS.md`](04_INTEGRATION_READINESS.md) | Verdicts CLI / MCP / API / agents + scénario d'intégration minimal |
| 05 | [`05_FIRST_REAL_PROJECT.md`](05_FIRST_REAL_PROJECT.md) | Runbook du premier projet réel (2 audits d'une page + comparaison) |
| 06 | [`06_GAP_ANALYSIS.md`](06_GAP_ANALYSIS.md) | GAP-01 → GAP-12 : état actuel → état cible |
| 07 | [`07_ROADMAP_TO_USABLE_PRODUCT.md`](07_ROADMAP_TO_USABLE_PRODUCT.md) | Chantiers P0 → P3, dépendances, critères de fin |
| 08 | [`08_ACCEPTANCE_CRITERIA.md`](08_ACCEPTANCE_CRITERIA.md) | C1 → C12 (première utilisation) + B1 → B10 (diffusion) |
| 09 | [`09_EVIDENCE_REGISTER.md`](09_EVIDENCE_REGISTER.md) | EV-01 → EV-34 + NV-1 → NV-6 (non vérifié) |
| 10 | [`10_PRODUCT_DECISIONS_REQUIRED.md`](10_PRODUCT_DECISIONS_REQUIRED.md) | DEC-01 → DEC-06 à arbitrer |
| 11 | [`11_AUDIT_SUMMARY.md`](11_AUDIT_SUMMARY.md) | Synthèse + verdict final |

## Règles de lecture (honnêteté de l'audit)

1. **Un composant qui existe n'est pas une capacité** : chaque capacité de
   `02` porte un statut et une preuve (`09`).
2. **Une documentation n'est pas une preuve d'exécution** : specs du
   blueprint et validations historiques sont citées comme documents, jamais
   comme démonstrations.
3. **Distinction stricte** entre exécuté pendant l'audit (EV-01, EV-04…09),
   rapporté par le poste utilisateur (EV-02, EV-24, EV-25), CI (EV-03) et
   **non vérifié** (NV-1 → NV-6).
4. **Limites d'environnement de l'audit** : la sandbox n'a pas de
   navigateurs Playwright ; l'inspection L3 et les E2E navigateur n'y sont
   pas rejoués (EV-28) — ce sont des limites de l'audit, pas des défauts du
   produit.

## Conventions d'identifiants

`EV-xx` preuve · `NV-x` non vérifié · `CAP-xx` capacité · `LIM-xx` limite ·
`GAP-xx` écart · `CH-Px-y` chantier de la feuille de route · `DEC-xx`
décision à arbitrer · `Cx` / `Bx` critères d'acceptation · `H-xx` réserve
d'historique · `Qx` critères de qualité du runbook.

## Journal de révision

| Version | Date | Changement | Déclencheur |
|---|---|---|---|
| 1.0 | 26/10/2026 | Création des 12 documents (commit `19a4688`, CI 8/8) | Mission d'audit |
| **1.1** | 26/10/2026 | **`05` corrigé** : invocation réelle de la CLI (§3.1), `npm run browsers:install`, `project create` positionnel sans `--url`, `bp extract` après 2 audits, `-o artifacts/reports`, table de dépannage ; + LIM-17/LIM-18, GAP-13/GAP-14, EV-35 ; `02/04/08` alignés | **Exécution réelle du runbook par le propriétaire** : 3 erreurs de commandes constatées (`ekts` introuvable, `npx playwright browsers:install`, `--name`) |

> Leçon retenue (CH-P2-7) : un runbook doit être **exécuté** avant d'être
> publié — les défauts trouvés venaient de commandes rédigées de mémoire,
> pas du produit.
