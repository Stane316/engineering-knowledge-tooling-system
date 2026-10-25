# LIVRABLE DOCUMENTAIRE — SPRINT 17 (Templates Projets)

**Date :** 25 octobre 2026  
**Auteur :** Agent documentaire (Arena.ai)  
**Statut :** ✅ TERMINÉ — Dossier documentaire complet prêt pour implémentation

---

## 1. Récapitulatif des livrables

### 1.1 Documents créés

| # | Fichier | Lignes | Taille | Contenu |
|---|---------|--------|--------|---------|
| 1 | `SPRINT-17.md` | ~380 | ~14 KB | Document principal : contexte, objectifs, 10 templates, architecture, ADR, risques, prompt exécution |
| 2 | `SPRINT-17-01.md` | ~400 | ~15 KB | Sous-sprint 1 : Types + Migration + TemplateRepository + TemplateService + tests |
| 3 | `SPRINT-17-02.md` | ~520 | ~19 KB | Sous-sprint 2 : 10 templates prédéfinis + TemplateApplier + Overrides + tests |
| 4 | `SPRINT-17-03.md` | ~480 | ~17 KB | Sous-sprint 3 : CLI (7 sous-commandes) + MCP (2 outils) + Export/Import + Tests + Documentation |

**Total : 4 documents, ~1 780 lignes, ~65 KB**

### 1.2 Emplacement

```
docs/blueprint/Docs/roadmap/sprints/
├── SPRINT-17.md              (document principal)
├── SPRINT-17-01.md           (sous-sprint 1 : Repository + Service)
├── SPRINT-17-02.md           (sous-sprint 2 : Templates + Applier)
└── SPRINT-17-03.md           (sous-sprint 3 : CLI + MCP + Docs)
```

---

## 2. Structure du Sprint 17

### 2.1 Décomposition en sous-sprints

| Sous-sprint | Durée | Composants | Fichiers à créer |
|-------------|-------|-----------|-----------------|
| **17-01** | 3 jours | Types, Migration, TemplateRepository, TemplateService | 6 fichiers (types, migration, 2 modules, 2 tests) |
| **17-02** | 3 jours | 10 templates prédéfinis, TemplateApplier | 4 fichiers (templates, applier, 2 tests) |
| **17-03** | 3 jours | CLI, MCP, Export/Import, Documentation | 5 fichiers code + 1 doc + 4 tests + 1 rapport |

### 2.2 Dépendances

```
SPRINT-13 (Multi-Projets) + SPRINT-15 (Bonnes Practices) + SPRINT-16 (Recommandations)
  │
  ▼
SPRINT-17-01 (Repository + Service)
  │
  ▼
SPRINT-17-02 (Templates prédéfinis + Applier)
  │
  ▼
SPRINT-17-03 (CLI + MCP + Export/Import + Docs)
  │
  ▼
SPRINT-18 (Tests + Documentation MVP-3)
```

### 2.3 Architecture cible

```
src/templates/
├── template.types.ts           (17-01)
├── template-repository.ts      (17-01)
├── template-service.ts         (17-01)
├── template-applier.ts         (17-02)
└── builtin-templates.ts        (17-02)

src/storage/
└── migrations/
    └── 008_create_templates.ts (17-01)

src/cli/commands/
└── template.ts                 (17-03)

src/mcp/tools/
├── list-templates.ts           (17-03)
└── apply-template.ts           (17-03)

docs/user/
└── TEMPLATES.md                (17-03)
```

---

## 3. Fichiers à créer par sous-sprint

### 3.1 Sprint 17-01 (Repository + Service)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/templates/template.types.ts` | Nouveau | Types partagés (Template, Config, Overrides, Export) |
| `src/storage/migrations/008_create_templates.ts` | Nouveau | Migration table project_templates |
| `src/templates/template-repository.ts` | Nouveau | CRUD templates + protection builtin + export/import |
| `src/templates/template-service.ts` | Nouveau | Orchestrateur (create, apply, validate) |
| `tests/templates/template-repository.test.ts` | Nouveau | Tests Repository |
| `tests/templates/template-service.test.ts` | Nouveau | Tests Service |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/storage/migrations/migration-registry.ts` | Ajout migration 008 |

### 3.2 Sprint 17-02 (Templates + Applier)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/templates/builtin-templates.ts` | Nouveau | 10 templates prédéfinis avec règles |
| `src/templates/template-applier.ts` | Nouveau | Application + personnalisation + validation |
| `tests/templates/template-applier.test.ts` | Nouveau | Tests Applier |
| `tests/templates/builtin-templates.test.ts` | Nouveau | Tests templates prédéfinis |

### 3.3 Sprint 17-03 (CLI + MCP + Docs)

| Fichier | Type | Description |
|---------|------|-------------|
| `src/cli/commands/template.ts` | Nouveau | Commande `ekts template` (7 sous-commandes) |
| `src/mcp/tools/list-templates.ts` | Nouveau | Outil MCP list_templates |
| `src/mcp/tools/apply-template.ts` | Nouveau | Outil MCP apply_template |
| `tests/cli/template.test.ts` | Nouveau | Tests CLI |
| `tests/mcp/tools/list-templates.test.ts` | Nouveau | Tests MCP list |
| `tests/mcp/tools/apply-template.test.ts` | Nouveau | Tests MCP apply |
| `tests/integration/templates-integration.test.ts` | Nouveau | Tests d'intégration |
| `docs/user/TEMPLATES.md` | Nouveau | Guide utilisateur |

**Modifications :**
| Fichier | Modification |
|---------|-------------|
| `src/cli/index.ts` | Enregistrement commande template |
| `src/mcp/tools/index.ts` | Enregistrement 2 outils MCP |
| `docs/reference/CLI_REFERENCE.md` | Section `ekts template` |
| `docs/reference/MCP_REFERENCE.md` | Sections `list_templates`, `apply_template` |

**Rapport final :**
| Fichier | Type | Description |
|---------|------|-------------|
| `docs/blueprint/Docs/roadmap/sprints/SPRINT-17-RESULTAT.md` | Nouveau | Rapport de clôture |

---

## 4. Plan de présentation à l'agent de développement

### 4.1 Ordre de lecture

1. **`SPRINT-17.md`** — Vue d'ensemble, 10 templates, architecture, ADR
2. **`SPRINT-17-01.md`** — Repository + Service
3. **`SPRINT-17-01-RESULTAT.md`** — Résultats
4. **`SPRINT-17-02.md`** — Templates prédéfinis + Applier
5. **`SPRINT-17-02-RESULTAT.md`** — Résultats
6. **`SPRINT-17-03.md`** — CLI + MCP + Docs
7. **`SPRINT-17-RESULTAT.md`** — Rapport final

### 4.2 Prompt d'exécution

```markdown
**CONTEXTE :** Sprint 17 — Templates Projets, branche `develop`,
prérequis Sprints 13-16 terminés.

**INSTRUCTIONS :**
1. Lire les 4 documents de spécification
2. Implémenter 17-01 (Types + Migration + Repository + Service)
3. Implémenter 17-02 (10 templates prédéfinis + Applier)
4. Implémenter 17-03 (CLI 7 sous-commandes + MCP 2 outils + Export/Import + Docs)
5. Tester à chaque sous-sprint avec `npm run verify`
6. Rédiger SPRINT-17-RESULTAT.md

**CONTRAINTES :**
- 10 templates prédéfinis réalistes
- Protection des templates builtin (immuables)
- Overrides partiels (merge profond)
- Export/import JSON
- Couverture > 80%, pas de breaking changes

**LIVRABLES :**
- Code source + 10 templates + Tests + Documentation + Rapport
- `npm run verify` passe
```

---

## 5. Récapitulatif des ADR

### ADR-039 : Configuration stockée en JSON

**Décision :** Champ `config` JSON plutôt que colonnes dédiées.

**Justification :** Flexibilité, pas de migration pour évolutions, export/import facile.

### ADR-040 : Templates prédéfinis immuables

**Décision :** `is_builtin = 1` → pas de modification/suppression.

**Justification :** Référence stable, toujours disponibles, utilisateurs créent des copies.

### ADR-041 : Application avec overrides partiels

**Décision :** Overrides optionnels avec merge profond.

**Justification :** Personnalisation sans réécrire tout le template, API claire.

---

## 6. Récapitulatif des risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Templates trop génériques | Moyenne | Moyen | Validation sur cas réels, feedback itératif |
| Application trop rigide | Faible | Moyen | Overrides partiels, personnalisation post-création |
| Export/import incompatible | Faible | Faible | Versioning JSON, validation à l'import |
| Conflits de noms | Faible | Faible | Vérification unicité, suffixe auto |

---

## 7. Les 10 templates prédéfinis

| # | Catégorie | Nom | Dimensions prioritaires | Règles |
|---|-----------|-----|------------------------|--------|
| 1 | e-commerce | E-commerce | performance, seo, ux | 5 règles |
| 2 | saas | SaaS / Application web | performance, accessibility, ux | 4 règles |
| 3 | blog | Blog / CMS | seo, content, performance | 4 règles |
| 4 | portfolio | Portfolio | ux, performance, content | 3 règles |
| 5 | corporate | Site corporate | accessibility, seo, ux | 4 règles |
| 6 | landing | Landing page | performance, seo, ux | 3 règles |
| 7 | documentation | Documentation | accessibility, content, seo | 3 règles |
| 8 | marketplace | Marketplace | performance, seo, ux | 4 règles |
| 9 | news | Site d'actualités | performance, seo, content | 3 règles |
| 10 | agency | Site d'agence | ux, performance, content | 3 règles |

---

## 8. Chemins complets des fichiers

### 8.1 Documents de spécification

```
docs/blueprint/Docs/roadmap/sprints/SPRINT-17.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-17-01.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-17-02.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-17-03.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-17-LIVRABLE-DOCUMENTAIRE.md  (ce document)
```

### 8.2 Fichiers à créer (code source)

**Sprint 17-01 :**
```
src/templates/template.types.ts
src/templates/template-repository.ts
src/templates/template-service.ts
src/storage/migrations/008_create_templates.ts
tests/templates/template-repository.test.ts
tests/templates/template-service.test.ts
```

**Sprint 17-02 :**
```
src/templates/builtin-templates.ts
src/templates/template-applier.ts
tests/templates/template-applier.test.ts
tests/templates/builtin-templates.test.ts
```

**Sprint 17-03 :**
```
src/cli/commands/template.ts
src/mcp/tools/list-templates.ts
src/mcp/tools/apply-template.ts
tests/cli/template.test.ts
tests/mcp/tools/list-templates.test.ts
tests/mcp/tools/apply-template.test.ts
tests/integration/templates-integration.test.ts
docs/user/TEMPLATES.md
docs/blueprint/Docs/roadmap/sprints/SPRINT-17-RESULTAT.md
```

### 8.3 Fichiers à modifier

```
src/storage/migrations/migration-registry.ts    (17-01 : migration 008)
src/cli/index.ts                                (17-03 : commande template)
src/mcp/tools/index.ts                          (17-03 : 2 outils MCP)
docs/reference/CLI_REFERENCE.md                 (17-03 : section template)
docs/reference/MCP_REFERENCE.md                 (17-03 : sections MCP)
```

---

## 9. Checklist de validation

### 9.1 Validation documentaire

- ✅ Document principal rédigé
- ✅ 3 sous-sprints rédigés
- ✅ Rapport de livraison rédigé
- ✅ Prompt d'exécution fourni
- ✅ ADR rédigés (ADR-039, ADR-040, ADR-041)
- ✅ Risques identifiés
- ✅ 10 templates décrits

### 9.2 Validation technique (après implémentation)

- 🔲 `npm run verify` passe
- 🔲 10 templates prédéfinis disponibles
- 🔲 CRUD templates fonctionnel
- 🔲 Application avec overrides
- 🔲 Protection builtin
- 🔲 Export/import JSON
- 🔲 CLI 7 sous-commandes
- 🔲 MCP 2 outils
- 🔲 Documentation complète

---

## 10. Statistiques

| Métrique | Valeur |
|----------|--------|
| Documents créés | 4 |
| Lignes totales | ~1 780 |
| Taille totale | ~65 KB |
| Fichiers code à créer | 17 |
| Fichiers code à modifier | 5 |
| ADR rédigés | 3 (ADR-039 à ADR-041) |
| Risques identifiés | 4 |
| Critères d'acceptation | 20 (C17.1 à C17.20) |
| Templates prédéfinis | 10 |
| Sous-commandes CLI | 7 (list, show, apply, create, delete, export, import) |
| Outils MCP | 2 (list_templates, apply_template) |

---

**Document rédigé le 25 octobre 2026**  
**Sprint 17 — Dossier documentaire complet**  
**Statut : ✅ PRÊT POUR IMPLÉMENTATION**

---

*Fin du livrable documentaire Sprint 17*
