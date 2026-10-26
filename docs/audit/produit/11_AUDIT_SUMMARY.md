# 11 — Synthèse de l'audit (AUDIT SUMMARY)

> Mission audit produit · 26 octobre 2026 · commit `3156147` ·
> documents `[00]` à `[10]` de ce dossier. Chaque réponse cite ses preuves
> (`EV-xx` → [09](09_EVIDENCE_REGISTER.md)).

---

### 1. Qu'est-ce que le produit est aujourd'hui ?

**EKTS** = outil **local** (CLI 15 commandes + serveur MCP 17 outils + 3
bases SQLite) qui audite la qualité d'une page web (score/100, constats
priorisés, rapports MD/PDF, comparaison dans le temps) et capitalise entre
projets (connaissances, bonnes pratiques, recommandations, templates).
**MVP-3 close** : version 0.2.0, 3 MVP **cumulatives** sur un même produit
(EV-10), aucune ligne de code fantôme (verify 0 = 1 690 tests, CI 8/8 :
EV-01/02/03). Ce n'est ni un SaaS, ni un agent, ni un crawler.
`[00]`

### 2. Quelles sont ses capacités confirmées ?

Confirmées **par exécution pendant l'audit** : parcours CLI complet
(init→add→search→status, codes 0/2/3/4) (EV-08/09) ; serveur MCP complet
(handshake, 17 outils, appel succès, appel erreur structurée) (EV-04/05/06)
; qualité logicielle (verify 0, CI 8/8) (EV-01/03).
Confirmées **par preuves produit/CI** : inspection L1–L3, rapports MD/PDF,
comparaison, multi-projets, timeline, bonnes pratiques, recommandations,
templates — **E2E 54/54 sur poste équipé + job CI dédié** (EV-24/03) ;
validations MVP-2 88/88 et MVP-3 97/97 à méthodes de preuves documentées
(EV-11/12). Catalogue complet : `[02]`.

### 3. Que permettait la MVP 1 (0.0.1, 23/10) ?

Base de connaissances : ressources validées, recherche hybride (FTS+
vecteurs+RRF), 14+ fournisseurs, CLI 7 commandes, MCP 4 outils, socle
qualité (TS strict, tests, CI). **Réserve d'historique** : aucune fiche de
validation N/N critères n'existe pour MVP-1 — « livrée », pas « validée
comme les suivantes » (H-01). `[01]`

### 4. Qu'a apporté la MVP 2 (0.1.0, validée 25/10) ?

Le cœur valeur : **inspecter un site** (Playwright + Lighthouse + axe,
L1–L3, L4 hors périmètre assumé), **analyser 5 dimensions** avec score et
recommandations, **stocker/chercher les audits**, **rapporter MD/PDF +
comparaison** ; CLI 7→10, MCP 4→7, 5 E2E ; validation **88/88** (lecture de
preuves). `[01]`

### 5. Qu'a apporté la MVP 3 (0.2.0, validée 26/10) ?

La **capitalisation entre projets** : multi-projets, suivi temporel
(tendances/alertes/graphiques), bonnes pratiques extraites des audits,
recommandations contextuelles (règles+statistiques), 10 templates ;
CLI 10→15, MCP 7→**17**, migrations 003→008 ; validation **97/97** sur
sorties réelles (3 réserves P3 ouvertes). `[01]`

### 6. Quelles sont les limites les plus importantes ?

1. **LIM-07 🔴** documents d'entrée périmés (README « MVP-2 / 0.1.0 »).
2. **GAP-01** aucun runbook premier projet exécuté comme tel.
3. **LIM-03 🟠** serveur MCP navigateur non lançable.
4. **NV-3 🟠** intégration hôte MCP réelle non instrumentée.
5. **LIM-12 🟠** justesse des audits non mesurée (pas de jeu d'or).
6. **LIM-01 🟠** aucune distribution npm ; **LIM-06 ⚪** pas de
   crawl/interaction (périmètre assumé) ; **LIM-04** hybride inerte sans clé.
   `[03]`

### 7. Peut-on l'utiliser aujourd'hui sur un vrai projet ?

**Oui, sous conditions** : le scénario recommandé (auditer puis corriger
une page publique, en CLI — `[05]`) n'exige **aucun développement** et
s'appuie uniquement sur des composants déjà prouvés. Ce qui manque = **la
preuve d'exécution unique de bout en bout** (C5/C7 à 0) et la réconciliation
des documents d'entrée (C11/C12). En d'autres termes : **matériel prêt,
feuille de route à exécuter, pas de faux bloquant technique identifié.**

### 8. Peut-on le connecter via CLI ?

**Oui — verdict le plus solide.** 15 commandes réelles, aide intégrée,
`--json` stable, codes 0/1/2/3/4, isolation par `EKTS_DATA_DIR` : tout
exécuté ou vérifié dans l'audit (EV-07/08/09). Seule réserve : le mode
installation (clone, DEC-01).

### 9. Peut-on l'exposer via MCP ?

**Oui pour la surface connaissance** : démontré en exécution réelle
(17 outils, appel + erreur structurés, `.mcp.json` prêt) — **mais jamais
avec un vrai hôte** (NV-3 : à faire, CH-P1-2). **Partiellement pour la
surface navigateur** : 5 outils écrits et testés, **invocables nulle part**
(LIM-03 → DEC-03). **Non pour « EKTS consomme des MCP externes »** — non
pertinent aujourd'hui (EV-26b).

### 10. Peut-il être intégré à un agent / écosystème d'agents ?

**Oui, au protocole** : découverte, schémas, exécution, erreurs,
persistance sont prouvées (EV-04→06) ; le mode « agent via CLI » est déjà
pratiqué par les propres E2E. **Partiel en conditions réelles** : chaînage
piloté par hôte et vérification qualité côté agent restent à démontrer
(`[04]` §E).

### 11. Premier scénario recommandé ?

**A. CLI — deux audits d'une page réelle avec comparaison** (scénario
complet, critères Q1–Q7 : `[05]`), puis **B. variante MCP** sur hôte réel
(cycle 2, `[04]`). Rejeté pour l'instant : crawl L4, MVP-4 features,
assistant conversationnel (périmètre ou non pertinent).

### 12. Qu'est-ce qui bloque sa réalisation ?

**Aucun bloquant technique dur.** Blocages = (i) exécution manquante du
runbook (CH-P0-1), (ii) docs d'entrée faux (CH-P0-2), (iii) 4 décisions
non tranchées (DEC-04 cap, DEC-03 surface navigateur, DEC-01 distribution,
DEC-05 périmètre), (iv) hôte MCP non testé (CH-P1-2). `[06] [10]`

### 13. Quels sont les travaux prioritaires ?

**P0** : CH-P0-2 (docs 30 min) → CH-P0-1 (runbook `05` + PV) → CH-P0-3
(cap arbitré).
**P1** : CH-P1-1 (surface navigateur selon DEC-03), CH-P1-2 (hôte réel),
CH-P1-3 (distribution selon DEC-01), CH-P1-4 (SDK MCP), CH-P1-5 (doctor
PDF).
**P2** : jeu d'or de justesse, score FTS lisible, backup/concurrence, mode
vectoriel documenté, preuves résiduelles. **P3** : L4, interactions,
bibliothèque, intégrations tierces. `[07]`

### 14. Quel résultat permet de déclarer le produit utilisable ?

> Un utilisateur de zéro, **en une session**, obtient sur une page qu'il
> possède les 2 rapports + la comparaison (`05` : 11/11 étapes, Q1–Q7
> verts) ; un agent exécute le scénario `04` sur un hôte réel ; les
> documents d'entrée affichent la version vraie ; aucune limite 🔴 active.
> C'est le cap **« EKTS 0.2.x — Version d'usage »** (`07` §objectif).

---

## Verdict final (nuancé, sans note-arraire)

**Le produit est un MVP techniquement solide et honnêtement validé**, dont
la **qualité d'ingénierie dépasse nettement la qualité de sa présentation
et de son usage consolidé**. Sur le plan technique, tout ce qui est
annoncé dans le catalogue `[02]` tient debout sous preuve ; les surfaces
CLI et MCP « connaissance » sont **réellement opérationnelles** — c'est
rare et vérifiable. Sur le plan produit, trois choses empêchent encore de
dire « utilisable » sans réserve : la **première utilisation n'a jamais été
jouée en une fois**, les **documents d'entrée racontent une version
antérieure**, et **deux surfaces d'intégration restent en chantier ou en
décision** (navigateur MCP, distribution). Aucune de ces lacunes n'exige
une refonte : elles demandent de l'exécution, de la doc et **6 décisions**
(`[10]`), pas du développement lourd.

**Catégories de maturité** : MVP techniquement exécutable ✅ · MVP
utilisable sur un premier projet = **atteignable sans code, à prouver par
le runbook** · produit intégrable = **partiel (CLI ✅, MCP 🟡)** · prêt à
diffusion large ❌ (après P1+P2).

**« Si je l'utilisais aujourd'hui sur un premier projet réel »** :
je pourrais auditer une page publique, obtenir rapports et comparaison, et
piloter le tout en CLI ou en MCP — **en suivant `05` avec les prérequis de
§3** ; ce qui m'en empêcherait encore : la **certitude** que le runbook
passe (non encore exécuté comme tel), un README qui me donnerait une fausse
idée du produit, et si mon site est privé/crawlé : un périmètre volontaire
réduit. **Prochaines étapes utiles, dans l'ordre** : réconcilier les docs
(30 min) → exécuter `05` et archiver le PV → trancher DEC-04/03/01 →
valider l'hôte MCP → puis seulement envisager des fonctionnalités nouvelles.
