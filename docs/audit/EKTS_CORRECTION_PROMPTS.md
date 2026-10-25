# EKTS — PROMPTS DE CORRECTION POUR L'AGENT DE DÉVELOPPEMENT

**Date :** 25 octobre 2026  
**Audit :** Phase 1 — Sprints 1 à 12  
**Statut :** ⏸️ En attente d'approbation utilisateur

---

## Prompt 1 — Clarifier et documenter le périmètre MVP-3

**Écarts traités :** EKTS-AUDIT-001  
**Priorité :** 🔴 Bloquant — à exécuter APRÈS décision utilisateur

### Contexte

Le MVP-3 est décrit de manière contradictoire dans deux documents du dépôt :
- `docs/ROADMAP.md` (25/10/2026) : Multi-Projets → Timeline → BestPractice → Recommandations → Templates → Tests
- `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md` §4 : Workflow 8 étapes + post-mortems + sécurité secrets

### Fichiers concernés

- `docs/ROADMAP.md`
- `docs/blueprint/07-Architecture-and-Roadmap/13_SPECIFICATION_MVP.md`
- `docs/blueprint/05-Creative-Engineering/10_WORKFLOW_CAPITALISATION.md`
- `docs/blueprint/05-Creative-Engineering/10_TEMPLATE_POSTMORTEM_PROJET.md`
- `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` (ajouter ADR)

### Comportement attendu

**Si l'utilisateur choisit la nouvelle roadmap (ROADMAP.md) :**

1. Créer un ADR dans `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` :
   - ID : ADR-021 (ou prochain disponible)
   - Titre : "Redéfinition du MVP-3 — Capitalisation projets par multi-projets et bonnes pratiques"
   - Statut : VALIDÉ
   - Contexte : Le blueprint original prévoyait un workflow 8 étapes de capitalisation. Après implémentation des MVP-1 et MVP-2, le périmètre a été redéfini pour exploiter les composants existants (AuditRepository, table projects, recherche hybride) et proposer une capitalisation progressive par projets.
   - Décision : Le MVP-3 suit `docs/ROADMAP.md` — 6 sprints : Multi-Projets, Suivi Temporel, Capitalisation Connaissances, Recommandations, Templates, Tests+Validation.
   - Conséquences : Les documents du blueprint (13_SPECIFICATION_MVP.md §4, 10_WORKFLOW_CAPITALISATION.md, 10_TEMPLATE_POSTMORTEM_PROJET.md) restent comme références historiques mais ne sont plus la spécification active du MVP-3.

2. Annoter les documents du blueprint avec un avertissement :
   ```markdown
   > **Note :** Ce document décrit le périmètre initial du MVP-3 (Phase 13).
   > Le périmètre actif est défini dans [`docs/ROADMAP.md`](../../ROADMAP.md).
   > Ce document est conservé comme référence historique.
   ```

3. Ne PAS modifier les documents `10_WORKFLOW_CAPITALISATION.md` et `10_TEMPLATE_POSTMORTEM_PROJET.md` — ils restent comme références utiles pour la capitalisation des connaissances (Sprint 15).

**Si l'utilisateur choisit le blueprint original :**

1. Réécrire `docs/ROADMAP.md` §MVP-3 pour retrouver le périmètre du blueprint
2. Supprimer les sections Multi-Projets, Timeline, BestPractice, Recommandations, Templates

**Si l'utilisateur choisit l'option hybride :**

1. Rédiger un nouveau ROADMAP.md qui combine :
   - Sprints 13-14 de la nouvelle roadmap (Multi-Projets, Timeline)
   - Sprints 15-18 du blueprint (workflow 8 étapes réparti sur 4 sprints)

### Critères d'acceptation

- Un seul périmètre MVP-3 fait autorité
- L'ADR correspondant est créé
- Les documents contradictoires sont annotés
- Aucun code n'est modifié

### Vérifications

- `grep -r "MVP-3" docs/ROADMAP.md docs/blueprint/` → tous les documents pointent vers la même source
- L'ADR est référencé dans le registre

### Ne doit PAS modifier

- Le code source (`src/`)
- Les tests (`tests/`)
- La structure du dépôt
- Les sprints 1-12 (terminés)

---

## Prompt 2 — Clarifier le statut de Firebase

**Écarts traités :** EKTS-AUDIT-010  
**Priorité :** 🟡 Important

### Contexte

La directive utilisateur mentionne des éléments Firebase créés. Après inspection exhaustive du dépôt (108 fichiers source, 99 fichiers de test, 183 fichiers de documentation), **aucun élément Firebase n'a été trouvé**.

### Vérifications effectuées

```bash
grep -ri "firebase" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" -l
# → 4 résultats uniquement dans docs/blueprint/Docs/Référence/dri/ (catalogues de ressources)

grep -ri "firebase" --include="*.ts" src/
# → 0 résultat

grep -ri "firebase" package.json package-lock.json .env.example
# → 0 résultat
```

### Fichiers vérifiés

- `src/` — 108 fichiers TypeScript, 0 import Firebase
- `package.json` — 0 dépendance Firebase
- `.env.example` — 0 variable Firebase
- `.github/workflows/ci.yml` — 0 job Firebase
- `docs/` — 0 documentation Firebase
- `tests/` — 0 test Firebase

### Comportement attendu

**Si Firebase n'est pas pertinent pour EKTS :**
- Aucune action. Documenter dans l'ADR que le stockage est 100% local (SQLite).

**Si Firebase est reporté à un MVP ultérieur :**
- Ajouter une note dans `docs/ROADMAP.md` §Horizon long : "Firebase pourrait être introduit pour le stockage distant, la synchronisation multi-appareils ou l'authentification — à évaluer pour MVP-5+."

**Si Firebase a été remplacé par SQLite local :**
- Documenter dans un ADR : "Décision d'utiliser SQLite local-first plutôt que Firebase pour le stockage, la recherche et la synchronisation."

### Critères d'acceptation

- Le statut de Firebase est explicitement documenté (absent, reporté ou abandonné)
- Aucune ambiguity ne subsiste

### Ne doit PAS

- Ajouter du code Firebase sans décision explicite
- Supprimer des éléments existants

---

## Prompt 3 — Nettoyer les doublons REGISTRE-AVANCEMENT.md

**Écarts traités :** EKTS-AUDIT-011  
**Priorité :** 🟢 Basse

### Contexte

Le fichier `docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md` contient des doublons dans le tableau de détail (§3). Les sprints 9 à 12 apparaissent deux fois : une première avec statut ✅ et une seconde avec statut ⏳.

### Fichier

`docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md`

### Comportement attendu

1. Identifier les lignes dupliquées dans le tableau §3
2. Supprimer la seconde occurrence (celle avec statut ⏳) de chaque sprint 9-12
3. Vérifier que la première occurrence (✅) est correcte et correspond à l'historique Git
4. Mettre à jour le total en §2 si nécessaire

### Critères d'acceptation

- Chaque sprint et sous-sprint apparaît exactement une fois dans §3
- Les statuts sont cohérents avec l'historique Git
- Le total "implémenté" en §2 reflète la réalité

### Vérifications

```bash
# Vérifier le nombre d'occurrences par sprint
grep "Sprint 9" docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md | wc -l
# Devrait être 2 (1 ligne 9-1 + 1 ligne dossier parent), pas 4

grep "Sprint 10" docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md | wc -l
# Devrait être 4 (10-1, 10-2, 10-3, dossier parent), pas 8

grep "Sprint 11" docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md | wc -l
# Devrait être 4, pas 8

grep "Sprint 12" docs/blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md | wc -l
# Devrait être 4, pas 8
```

### Ne doit PAS

- Modifier les statuts des sprints 1-8 (corrects)
- Supprimer la première occurrence (celle avec ✅)
- Modifier l'historique Git

---

## Résumé de l'ordre d'exécution

| Priorité | Prompt | Dépend de | Bloque Sprint 13 ? |
|----------|--------|-----------|---------------------|
| 🔴 1 | Prompt 1 — Périmètre MVP-3 | Décision utilisateur | **OUI** |
| 🟡 2 | Prompt 2 — Firebase | Décision utilisateur | Non |
| 🟢 3 | Prompt 3 — Doublons | Aucun | Non |

---

*Prompts rédigés le 25 octobre 2026 — Phase 1 de l'audit*  
**Statut : ⏸️ EN ATTENTE D'APPROBATION**
