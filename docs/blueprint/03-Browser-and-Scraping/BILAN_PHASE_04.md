# Bilan de la Phase 04 — Automatisation de Navigateur et Inspection de Sites

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Durée estimée :** 2-3 semaines  
**Durée réelle :** ~1 jour

---

## 1. Résumé

La Phase 04 a abouti à 3 décisions fondamentales pour EKTS :

1. **Playwright** comme solution principale d'automatisation navigateur
2. **Patchright** comme option stealth pour les sites protégés
3. **Playwright MCP** comme interface d'intégration avec les agents IA

### Livrables produits

| # | Fichier | Taille | Description |
|---|---------|--------|-------------|
| 1 | `04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md` | ~25 KB | Comparaison Playwright/Puppeteer/Selenium |
| 2 | `04_SPEC_INSPECTION_SITE.md` | ~20 KB | Spécification du workflow d'inspection |
| 3 | `04_BENCHMARK_REPRODUCTIBLE.md` | ~15 KB | Protocole de benchmark |
| 4 | `BILAN_PHASE_04.md` | ~10 KB | Ce document |

---

## 2. Décisions prises

### 2.1 Choix de Playwright

**Score global : 96/100** (vs Puppeteer 66/100, Selenium 59/100)

| Critère | Score Playwright | Justification |
|---------|------------------|---------------|
| Intégration MCP (30%) | 100/100 | Seul avec un MCP server officiel (70+ tools) |
| Performance (20%) | 95/100 | 2-3x plus rapide que Selenium |
| Fiabilité (20%) | 95/100 | Auto-waiting, 98% success rate |
| Maintenance (15%) | 95/100 | 98k stars, 52M npm/sem, Microsoft |
| Écosystème (15%) | 90/100 | Trace Viewer, Codegen, Inspector |

### 2.2 Architecture d'inspection

- **4 niveaux** — L1 (rapide) à L4 (exhaustive/crawling)
- **4 patterns de capture** — accessibility tree, screenshot, DOM, network
- **5 étapes** — préparation, navigation, capture, analyse, stockage
- **5 outils MCP** — inspect_website, capture_screenshot, extract_structure, analyze_performance, list_inspections

### 2.3 Standard de qualité

- **Cold start** < 2000ms
- **Inspection L2** < 30000ms
- **Success rate** > 95%
- **Flakiness** < 5%
- **Mémoire (10 contextes)** < 2000MB

---

## 3. Ce qui est établi

- ✅ Playwright est la solution retenue pour EKTS
- ✅ Patchright est l'option stealth si nécessaire
- ✅ Playwright MCP est l'interface agentique
- ✅ 4 niveaux d'inspection définis et documentés
- ✅ Workflow d'inspection en 5 étapes spécifié
- ✅ Contrats TypeScript pour entrées/sorties
- ✅ Protocole de benchmark reproductible (10 tests)
- ✅ Environnement de référence défini
- ✅ Intégration CI pour monitoring continu

---

## 4. Ce qui est rejeté

- ❌ **Selenium** — trop lent, pas de MCP natif, flakiness élevé
- ❌ **Puppeteer** — pas de MCP natif, Chromium uniquement, moins d'outils
- ❌ **Cypress** — pas de support multi-navigateurs, pas de MCP
- ❌ **Camoufox** — Python uniquement, trop lent pour EKTS

---

## 5. Incertitudes

1. **Consommation tokens MCP** — les benchmarks publics montrent ~114K tokens/task en mode snapshot. Le mode CLI réduit à ~27K. À valider avec des cas d'usage EKTS réels.

2. **Patchright maintenance** — projet plus jeune (4.7k stars), doit suivre les releases Playwright. Risque de retard en cas de breaking change.

3. **Long-running sessions** — Playwright atteint 99.72% uptime sur 24h. Pour des sessions plus longues, il faudra tester.

---

## 6. Questions résolues

| Question | Réponse |
|----------|---------|
| Quelle solution d'automatisation ? | Playwright (score 96/100) |
| Comment gérer les sites protégés ? | Patchright (drop-in replacement) |
| Comment s'intégrer avec MCP ? | @playwright/mcp officiel (70+ tools) |
| Quels niveaux d'inspection ? | L1 (rapide) à L4 (exhaustive) |
| Comment benchmark de manière reproductible ? | 10 tests standard + environnement de référence |

---

## 7. Questions ouvertes

1. **Quels sites réels pour le benchmark ?** — À sélectionner selon les cas d'usage EKTS
2. **Format de stockage des inspections ?** — JSON vs SQLite, à décider en Phase 06
3. **Faut-il un système de caching ?** — À évaluer après les premiers usages
4. **Comment gérer l'authentification ?** — Pattern à définir si nécessaire

---

## 8. Phase suivante recommandée

**Phase 05 — Scraping Responsable**

### Objectif
Définir une stratégie de scraping responsable qui respecte les sites, les lois, et les bonnes pratiques éthiques.

### Livrables attendus
1. `05_STRATEGIE_SCRAPING_RESPONSABLE.md` — Cadre éthique et technique
2. `05_MATRICE_METHODES_PAR_CAS.md` — Quelle méthode selon le cas

### Questions clés
- Comment respecter robots.txt et TOS ?
- Quelle fréquence de requêtes ?
- Comment gérer les données personnelles ?
- Quelle méthode selon le type de site (statique, SPA, protégé) ?

---

## 9. Progression globale

| Lot | Phases | Statut |
|-----|--------|--------|
| Lot 1 | 01-03 | ✅ Terminé |
| Lot 2 | 04-05, 08 | 🔄 En cours (04 ✅, 05 ⏳) |
| Lot 3 | 06-07, 09 | ⏳ À venir |
| Lot 4 | 10-12 | ⏳ À venir |
| Lot 5 | 13-14 | ⏳ À venir |

**Total livrables :** 13 terminés, 24 restants

---

**Bilan rédigé le 21 octobre 2026 — Phase 04 du projet EKTS**
