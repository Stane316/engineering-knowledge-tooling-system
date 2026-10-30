# Audit produit EKTS — dossier de référence

> **Mission** : audit produit complet, cartographie des capacités et feuille
> de route vers une version réellement utilisable.
> **Date** : 26 octobre 2026 · **Commit audité** : `3156147` (branche
> `arena/079e2f26-engineering-knowledge-tooling`) · **Version produit** :
> `ekts` 0.2.0 (MVP-3 validée le 26/10).
> **Portée** : lecture, exécution contrôlée et analyse — **aucun changement
> fonctionnel** n'a été effectué (les seules écritures sont ces documents).

## Réalignement MVP-4 (nouvelle mission)

Le [complément d'audit préliminaire du 29 octobre 2026](12_REALIGNEMENT_MVP4_AUDIT_PRELIMINAIRE.md) examine une révision plus récente et la vision agentique demandée. Il est provisoire ; il ne remplace ni cet audit historique ni les validations de phase à venir.

- [Analyse du rapport web transmis](13_ANALYSE_RAPPORT_SITE_UTILISATEUR.md) : chiffres, incohérence de priorités et limites de preuve.
- [Repérage initial de l'écosystème](14_REPERAGE_ECOSYSTEME_MVP4_PROVISOIRE.md) : projets indiqués, sources et licences déclarées, à approfondir.
- [Phase 1 — matrice, reproduction et validation](15_PHASE1_MATRICE_ET_VALIDATION.md) : conclusions sourcées et limites, point de décision humaine.
- [Ressources et accès agentique](16_RESSOURCES_ET_ACCES_AGENTIQUE.md) : inventaire et essai CLI → FTS → MCP.
- [Recherche open source approfondie](17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md) : méthode, shortlist priorisée, licences, sécurité, stratégies et expériences proposées.
- [Catalogue de dépôts et skills](18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md) : sources figées et 42 fichiers `SKILL.md` étudiés, sans recommandation d'installation globale.
- [Scénario comparatif agent / EKTS](19_SCENARIO_COMPARATIF_AGENT_EKTS.md) : trois conditions et protocole validés ; aucune expérience agentique exécutée.
- [Architecture minimale MVP-4](20_ARCHITECTURE_MINIMALE_MVP4.md) : architecture et cinq décisions validées ; aucune implémentation.
- [Spécification MVP-4](21_SPECIFICATION_MVP4.md) : cas d'usage, contrats, permissions et exigences validés pour la planification.
- [Critères et tests MVP-4](22_CRITERES_ET_TESTS_MVP4.md) : seuils validés, preuves, régressions et traçabilité ; aucun nouveau test exécuté.
- [Contrôle global de la planification](23_CONTROLE_COHERENCE_PLANIFICATION.md) : traçabilité des exigences, écarts corrigés, risques et décisions restant ouvertes ; aucune implémentation.
- [Arbitrages du propriétaire — 30 octobre 2026](24_ARBITRAGES_PROPRIETAIRE_2026-10-30.md) : alignement de branche, portée du sprint 19, contrat du score indisponible, compteur `info` et tranche de `DEC-04`.
- [Corpus synthétique et manifeste](scenario-comparatif/) : six ressources fictives, deux variantes et leurs empreintes ; ne pas confondre avec les rapports du site réel.
- [Données de recherche et traçabilité](recherche-open-source-2026-10-29/) : requêtes, 640 candidats, révisions, arbres, licences et corrections ; les niveaux d'examen sont distincts.
- [Preuves de reproduction](preuves-phase1/) : deux rapports Markdown et extraction des données persistées ; contenus locaux à examiner avant tout partage.

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
4. **Limites d’environnement de l’audit historique du 26 octobre** : cette séquence ne disposait pas de navigateurs Playwright et n’avait pas rejoué L3 (EV-28). Une nouvelle reproduction séparée a depuis été réalisée sur un autre commit : voir [15](15_PHASE1_MATRICE_ET_VALIDATION.md). Les conclusions historiques restent datées et distinctes.

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
