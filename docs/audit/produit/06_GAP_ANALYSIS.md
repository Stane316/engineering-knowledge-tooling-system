# 06 — Analyse des écarts (état actuel → état cible)

> **État cible de référence** : « EKTS 0.2.x — Version d'usage » :
> un nouvel utilisateur (humain ou agent) obtient, sans manipulation cachée,
> un résultat de qualité sur le scénario `05`, avec des interfaces dont la
> disponibilité est **prouvée**, pas supposée.
> **Légende** : nature = **[C] confirmé** (preuve) · **[H] hypothèse** ·
> **[D] décision non tranchée** (→ `10`).

| ID | État actuel | État cible | Capacité manquante | Écart | Preuve | Cause | Priorité | Solution envisagée | Dépendances | Critère d'acceptation |
|---|---|---|---|---|---|---|---|---|---|---|
| GAP-01 | Parcours premier projet prouvé « en morceaux » (EV-04…09, EV-24) | Un runbook unique exécuté et validé de bout en bout | Fidélité d'usage consolidée | **[C]** Aucun document n'a été exécuté comme tel en clean-room | `05` ; absence de run d'acceptation global dans les preuves | Priorité historique aux briques + validations par domaine | **P0** | Exécuter `05` §4 intégralement, consigner sorties dans un PV (CH-P0-1) | CH-P0-2 (docs) | PV avec 11/11 étapes + Q1–Q7 |
| GAP-02 | README = « MVP-2 / 0.1.0 » ; USER_GUIDE = « 2.0.0 » | Documents d'entrée = version/statut réels (0.2.0, MVP-3 validé) | Confiance et orientation du nouvel arrivant | **[C]** incohérence vérifiable | EV-17 | Mise à jour sélective des docs à chaque MVP (bandeau oublié) | **P0** | Réconciliation du bandeau README + en-tête USER_GUIDE + grep de cohérence (CH-P0-2) | Aucune | `grep -E "0\.1\.0|MVP-2 validé" README.md` vide ; version = package.json |
| GAP-03 | Serveur navigateur : code + 53 tests, **0 point d'entrée** (LIM-03) | `npm run mcp:browser` (ou équivalent) lançable | Exposition des 5 outils `browser_*` aux agents | **[C]** grep négatif | EV-27 | Câblage jamais fait (surface connaissance câblée, navigateur non) | **P1** (ou **abandon explicite** — DEC-03) | Script d'entrée + doc, **ou** décision « on s'appuie sur `@playwright/mcp` externe », **ou** « on retire la surface » | DEC-03 | Soit commande verte + `tools/list`=5, soit décision tranchée et doc alignée |
| GAP-04 | Exemples MCP réels mais **aucun hôte instrumenté** (NV-3) | Validation sur ≥ 1 hôte réel | Preuve d'intégration agent de bout en bout | **[C]** non fait dans l'audit ni dans les tests du dépôt | EV-15, `04` C.1 | Coût/accès aux hœtes | **P1** | Exécuter `04` §scénario minimal sur Claude Code (ou équivalent), capturer log | Hôte côté utilisateur | 8 étapes vertes + preuve archivée |
| GAP-05 | CLI non installable globalement (LIM-01) | Canal d'installation décidé | Distribution | **[D]** jamais arbitré | EV-14 | Projet solo privé | **P1** (si diffusion) / **P3** (si usage local) | DEC-01 : `npm publish` vs « clone uniquement » documenté comme définitif | DEC-01 | Soit `npm view ekts` = 0.2.0+, soit doc « installation par clone » explicite |
| GAP-06 | Spec MCP `2025-11-25` vs courante `2026-07-28` (LIM-08) | SDK à jour + handshake vérifié sur spec courante | Veille protocole | **[C]** écart de version constaté | EV-18, EV-19 | Cadence du SDK | **P1 léger** | Monter `^1.32.2`, re-test `tools/list`, relever `protocolVersion` | Rien | Log handshake à jour + tests verts |
| GAP-07 | Recherche vectorielle inerte sans clé (LIM-04) | Soit « mode FTS assumé » documenté, soit un premier fournisseur gratuit validé en live | Pleine valeur du moteur hybride | **[C]** `embeddings:false` observé | EV-20 | Design BYO-key | **P2** | Guide « premier fournisseur gratuit » + test live opt-in, ou texte « hybride = FTS par défaut » clair dans le README | DEC-06 | Soit test live vert en CI manuelle, soit doc affirmée |
| GAP-08 | Justesse des audits non mesurée (LIM-12) | Jeu de référence (pages annotées) en CI | Confiance dans le résultat métier | **[C]** aucune fixture or | EV-31 | Non priorisé | **P2** | 5–10 pages locales + attentes bornées (CH-P2-1) | Rien | 100 % attentes franchies |
| GAP-09 | Codes 1 (refus) et parcours MCP chaînés non rejoués dans l'audit | Couverture de preuves intégrale du contrat | Traçabilité | **[C]** lacunes d'exécution de l'audit | EV-09, NV-3 | Périmètre d'exécution | **P2** | Rejouer 2–3 scénarios résiduels dans le PV du CH-P0-1 | CH-P0-1 | PV incluant code 1 + chaîne 3 appels |
| GAP-10 | Pas de sauvegarde/restore documentées (opérationnel) | Procédure backup 3 bases | Récupération après incident | **[C]** absente des docs | `[DOC]` grep guides : pas de section dédiée (constat d'absence dans USER_GUIDE TOC) | Périmètre solo | **P2** | Section « Sauvegarde » : arrêt + copie `data/` (10 lignes doc) | — | Procédure présente et testée à froid |
| GAP-11 | Concurrence multi-écritures non caractérisée (LIM-10) | Comportement documenté ou testé | Robustesse opérationnelle | **[H]** risque `SQLITE_BUSY` hypothétique (NV-4) | NV-4 | Non testé | **P2** | Test 2 processus concurrents OU mention « usage simultané non supporté » | — | Test vert ou doc écrite |
| GAP-12 | Chantier « distribution/documentation » vs « nouvelles fonctions » | Décision de cap | Feuille de route | **[D]** MVP-4 options vs consolidation | ADR-044, `MVP4_PREPARATION.md` | Arbitrage produit attendu | **P0 décisionnel** | DEC-04 | `10` | Décision écrite par le propriétaire |

## Écarts explicitement NON retenus (pour ne pas les confondre avec des oublis)

| Sujet | Décision d'audit | Raison |
|---|---|---|
| L4 crawl | **Non un écart** : périmètre abandonné volontairement (CHANGELOG, types) | Rappelé en ⚪ LIM-06 ; réintroduction = décision produit majeure (voir `10` DEC-05) |
| Interaction navigateur (click/fill) | Idem : jamais spécifiée | Ne devient un écart **que** si le premier projet l'exige |
| Assistant conversationnel intégré | Hors périmètre produit (outil, pas agent) — reste hors | Ne pas construire un chat pour « faire de l'IA » sans besoin démontré |
| Multi-équipiers / cloud | Option MVP-4 = rupture architecture (documentée) | DEC-04 |
| Publication des clés / sécurité | **Aucun écart critique** — posture conforme (EV-29) | Gitleaks + CI + `.env` ignoré |
