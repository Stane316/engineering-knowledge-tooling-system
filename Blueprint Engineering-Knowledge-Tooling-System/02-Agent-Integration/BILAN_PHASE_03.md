# Bilan de la Phase 03 — Conception d'Outils et Services

**Date :** 2026-10-21  
**Statut :** ✅ Terminé  
**Durée estimée :** 1 semaine  
**Durée réelle :** ~1 jour

---

## 1. Résumé

La Phase 03 a établi les fondations architecturales pour tous les outils EKTS. Elle a produit deux documents de référence qui définiront la manière dont tous les outils seront conçus, développés et documentés dans le projet.

### Livrables produits

1. **`03_CONCEPTION_OUTILS_ET_SERVICES.md`** (28 KB, ~600 lignes)
   - 5 principes de conception fondamentaux
   - Architecture standard d'un outil EKTS
   - 5 patterns de conception réutilisables
   - Standards pour entrées/sorties, erreurs, logs, tests
   - Critères de décision module local vs service séparé

2. **`03_CONTRAT_STANDARD_OUTIL.md`** (22 KB, ~500 lignes)
   - Template complet de contrat d'outil (12 sections)
   - Exemple complet pour `search_resources`
   - Checklist de validation du contrat

### Objectifs atteints

✅ Définir une architecture cohérente pour tous les outils EKTS  
✅ Établir des patterns de conception réutilisables  
✅ Standardiser la gestion des entrées/sorties et des erreurs  
✅ Documenter les standards de logging et d'observabilité  
✅ Fournir un template de contrat complet et actionable  
✅ Définir les critères de décision module local vs service séparé

---

## 2. Ce qui est établi

### 2.1 Principes de conception (5 principes)

| Principe | Description | Application EKTS |
|----------|-------------|------------------|
| **Single Responsibility** | Un outil, une responsabilité | `search_resources` ≠ `process_resource` |
| **Explicit Over Implicit** | Tout doit être déclaré explicitement | Schémas Zod, types TypeScript, codes de retour |
| **Fail Fast** | Détecter les erreurs tôt | Validation avant traitement, timeouts |
| **Idempotence** | Même résultat pour mêmes entrées | Upsert au lieu d'insert, opérations de lecture |
| **Least Privilege** | Permissions minimales nécessaires | Outils de lecture sans accès écriture |

### 2.2 Architecture standard

**Structure de package :**
```
tool-name/
├── src/              # Code source
├── cli/              # Interface CLI (optionnel)
├── api/              # Interface API (optionnel)
├── mcp/              # Interface MCP (optionnel)
├── docs/             # Documentation
│   ├── README.md
│   ├── API.md
│   ├── CONTRACT.md   # ← Contrat standard
│   └── examples/
└── package.json
```

**Couches de responsabilité :**
1. Interface Layer (CLI / API / MCP)
2. Validation Layer (Zod schemas)
3. Business Logic Layer (handler)
4. Infrastructure Layer (DB, filesystem, external services)

### 2.3 Patterns de conception (5 patterns)

| Pattern | Usage | Exemple |
|---------|-------|---------|
| **Command Pattern** | Outils avec plusieurs actions | `ekts resource search`, `ekts resource validate` |
| **Pipeline Pattern** | Traitement en plusieurs étapes | validation → transformation → sauvegarde |
| **Result Pattern** | Gestion d'erreurs explicite | `Result<T, E>` au lieu d'exceptions |
| **Retry with Backoff** | Opérations externes sujettes à échec | Appels API, requêtes réseau |
| **Circuit Breaker** | Protection contre cascades d'erreurs | Service externe down |

### 2.4 Standards techniques

**Validation :**
- Bibliothèque : **Zod** (type-safe, runtime validation)
- Tous les inputs doivent être validés avant traitement
- Schémas Zod documentés dans le contrat

**Erreurs :**
- Hiérarchie d'erreurs EKTS (`EKTSError` → `ValidationError`, `NotFoundError`, etc.)
- Mapping vers codes HTTP et MCP
- Contexte structuré dans chaque erreur

**Logs :**
- Bibliothèque : **Pino** (rapide, structuré, JSON)
- 6 niveaux : fatal, error, warn, info, debug, trace
- Logs structurés avec contexte (query, duration, etc.)
- Correlation ID pour tracer les requêtes

**Tests :**
- Couverture minimale : **80%** (lignes, branches, fonctions)
- Pyramid : 70% unit, 20% integration, 10% E2E
- Framework : **Vitest** (rapide, compatible Jest)

**Versionnement :**
- **SemVer** (MAJOR.MINOR.PATCH)
- CLI : versionner l'outil complet
- API : versionner dans l'URL (`/v1/resources`)
- MCP : versionner le serveur complet

### 2.5 Décision module local vs service séparé

**Garder en module local si :**
- Utilisé uniquement dans un contexte
- Pas de besoin d'isolation
- Performance critique
- Déploiement simplifié

**Créer un service séparé si :**
- Utilisé par plusieurs applications
- Besoin d'isolation (crash, sécurité)
- Scaling indépendant nécessaire
- Stack technologique différente

**Architecture recommandée :**
```
EKTS Core (monorepo)
├── packages/           # Modules locaux
│   ├── core/
│   ├── cli/
│   ├── api/
│   └── mcp/
├── services/           # Services séparés
│   ├── inspector/      # Playwright (long, isolé)
│   ├── screenshot/     # Capture (peut crash)
│   └── external-api/   # APIs externes (retry/circuit breaker)
└── apps/
    └── web/            # Interface web (optionnel)
```

### 2.6 Template de contrat complet

**12 sections obligatoires :**
1. Informations générales
2. Description (résumé, cas d'usage, non-objectifs)
3. Interfaces (programmatique, CLI, API, MCP)
4. Validation (schémas Zod, règles)
5. Erreurs (codes, contextes, exemples)
6. Performance (métriques, optimisations, limites)
7. Sécurité (permissions, données sensibles)
8. Dépendances (internes, externes, services)
9. Tests (couverture, types requis, jeux de données)
10. Logs (niveaux, événements, exemples)
11. Déploiement (prérequis, variables, commandes)
12. Changelog

**Règle d'or :** Pas d'outil sans contrat complet.

---

## 3. Ce qui est rejeté et pourquoi

### 3.1 Approche monolithique

**Rejeté :** Tout mettre dans un seul package géant

**Pourquoi :**
- Difficile à maintenir
- Difficile à tester
- Déploiement lent
- Pas de réutilisation possible

**Alternative :** Architecture modulaire (packages + services séparés)

### 3.2 Exceptions pour le contrôle de flux

**Rejeté :** Utiliser des exceptions pour le contrôle de flux normal

**Pourquoi :**
- Moins explicite que le Result Pattern
- Performance moindre (stack trace)
- Difficile à gérer dans les interfaces asynchrones

**Alternative :** Result Pattern (`Result<T, E>`)

### 3.3 Logs non structurés

**Rejeté :** Logs en texte libre (`console.log('Search: react, 42 results')`)

**Pourquoi :**
- Difficile à parser et analyser
- Pas de contexte structuré
- Impossible à agréger dans des outils d'observabilité

**Alternative :** Logs structurés JSON avec Pino

### 3.4 Types `any` en TypeScript

**Rejeté :** Utiliser `any` pour éviter de définir des types

**Pourquoi :**
- Perte de type-safety
- Erreurs runtime au lieu de compile-time
- Documentation implicite perdu

**Alternative :** Types TypeScript explicites + Zod pour runtime validation

### 3.5 Documentation optionnelle

**Rejeté :** Outils sans documentation ou documentation minimale

**Pourquoi :**
- Impossible à utiliser correctement
- Impossible à maintenir
- Perte de temps pour les développeurs

**Alternative :** Template de contrat obligatoire + README + API.md

---

## 4. Ce qui reste incertain

### 4.1 Performance des patterns

**Incertitude :** Quel est l'overhead des patterns (Pipeline, Circuit Breaker) ?

**Impact :**
- Si l'overhead est significatif, certains patterns pourraient être évités
- Si l'overhead est négligeable, tous les patterns peuvent être utilisés

**Action requise :** Benchmarks lors de l'implémentation (Phase 04+)

### 4.2 Granularité des services séparés

**Incertitude :** Où tracer la limite entre module local et service séparé ?

**Impact :**
- Trop de services séparés = complexité opérationnelle
- Pas assez de services séparés = risques de cascades d'erreurs

**Action requise :** Évaluer au cas par cas lors de l'implémentation

### 4.3 Standardisation des contrats

**Incertitude :** Le template de contrat est-il trop lourd pour des outils simples ?

**Impact :**
- Si trop lourd, les développeurs pourraient le bypasser
- Si trop léger, manque de cohérence

**Action requise :** Feedback après les premiers outils implémentés

### 4.4 Outils de test

**Incertitude :** Vitest est-il le meilleur choix pour EKTS ?

**Impact :**
- Vitest est rapide et compatible Jest
- Mais Jest est plus mature et a plus de plugins

**Action requise :** Évaluer lors de l'implémentation du premier outil

---

## 5. Décisions maintenant possibles

### 5.1 Architecture des outils EKTS

**Décision :** Tous les outils EKTS suivront l'architecture standard définie.

**Justification :**
- Cohérence dans tout le codebase
- Facilité de maintenance
- Facilité de test
- Facilité de documentation

### 5.2 Patterns de conception

**Décision :** Les 5 patterns définis seront utilisés systématiquement.

**Justification :**
- Patterns éprouvés dans l'industrie
- Résolvent des problèmes récurrents
- Facilitent la compréhension du code

### 5.3 Standards techniques

**Décision :** Zod + Pino + Vitest + SemVer seront utilisés pour tous les outils.

**Justification :**
- Bibliothèques matures et bien maintenues
- Communautés actives
- Compatibles avec TypeScript
- Standards de l'industrie

### 5.4 Template de contrat

**Décision :** Le template de contrat est obligatoire pour tous les outils.

**Justification :**
- Garantie de documentation complète
- Facilité d'utilisation des outils
- Facilité de maintenance
- Onboarding plus rapide pour les nouveaux développeurs

### 5.5 Architecture monorepo

**Décision :** EKTS sera un monorepo avec des packages et services séparés.

**Justification :**
- Partage de code facile entre packages
- Déploiement indépendant des services
- Testing intégrés
- Gestion des dépendances simplifiée

---

## 6. Questions à résoudre

### 6.1 Questions bloquantes

**Aucune question bloquante identifiée.**

Les standards sont suffisamment définis pour commencer l'implémentation.

### 6.2 Questions importantes

1. **Comment gérer les breaking changes dans les contrats ?**
   - Impact : évolution des outils existants
   - Action : définir une politique de versionnement des contrats

2. **Comment automatiser la validation des contrats ?**
   - Impact : garantir que tous les outils ont un contrat complet
   - Action : créer un script de validation (CI/CD)

3. **Comment gérer les outils legacy sans contrat ?**
   - Impact : outils existants non conformes
   - Action : plan de migration progressif

### 6.3 Questions exploratoires

1. **Faut-il générer automatiquement la documentation à partir du contrat ?**
   - Impact : réduction de la duplication
   - Action : évaluer les outils de génération de documentation

2. **Faut-il créer un CLI pour gérer les outils EKTS ?**
   - Impact : facilité d'usage
   - Action : évaluer lors de l'implémentation du premier outil

3. **Faut-il créer un registry central pour les outils EKTS ?**
   - Impact : découverte et réutilisation
   - Action : évaluer lors de la Phase 13 (architecture)

---

## 7. Fichiers créés ou mis à jour

### Fichiers créés

| Fichier | Taille | Description |
|---------|--------|-------------|
| `03_CONCEPTION_OUTILS_ET_SERVICES.md` | 28 KB | Guide de conception d'outils |
| `03_CONTRAT_STANDARD_OUTIL.md` | 22 KB | Template de contrat d'outil |
| `BILAN_PHASE_03.md` | 12 KB | Ce document |

### Fichiers mis à jour

| Fichier | Modification |
|---------|--------------|
| `INDEX.md` | Statut Phase 03 → ✅ Terminé, prochaine étape → Phase 04 |

---

## 8. Phase suivante recommandée

**Phase 04 — Automatisation de Navigateur et Inspection de Sites**

### Objectif

Comparer les solutions d'automatisation de navigateur (Playwright, Puppeteer, Selenium) et définir une stratégie pour l'inspection de sites dans EKTS.

### Questions clés

1. Playwright vs Puppeteer vs Selenium : quel choix pour EKTS ?
2. Comment capturer des pages de manière fiable et reproductible ?
3. Comment gérer les états dynamiques, les timeouts, les erreurs ?
4. Quelles sont les limites (RAM, CPU, stabilité) ?
5. Comment exposer ces capacités via CLI/API/MCP ?

### Livrables attendus

1. `04_COMPARATIF_AUTOMATISATION_NAVIGATEUR.md` — Comparaison technique
2. `04_SPEC_INSPECTION_SITE.md` — Spécification d'un workflow d'inspection
3. `04_BENCHMARK_REPRODUCTIBLE.md` — Protocole de benchmark

### Durée estimée

2-3 semaines

### Effort

Élevé (nécessite des benchmarks et tests pratiques)

---

## 9. Critères de passage à la Phase 04

### Critères remplis

- ✅ Phase 03 terminée avec 2 livrables documentés
- ✅ Architecture standard définie pour tous les outils
- ✅ Patterns de conception identifiés et documentés
- ✅ Standards techniques établis (Zod, Pino, Vitest, SemVer)
- ✅ Template de contrat complet et actionable
- ✅ Critères de décision module local vs service séparé définis
- ✅ INDEX.md mis à jour avec le statut de la Phase 03

### Prochaines étapes

1. **Validation par l'utilisateur** — confirmer que les standards sont adaptés
2. **Lancement de la Phase 04** — commencer l'étude de l'automatisation de navigateur

---

## 10. Conclusion

La Phase 03 a rempli son objectif : établir les fondations architecturales pour tous les outils EKTS. Les deux livrables produits serviront de référence pour le développement de tous les outils du projet.

**Points forts :**
- 5 principes de conception clairs et applicables
- 5 patterns de conception réutilisables
- Standards techniques bien définis (Zod, Pino, Vitest)
- Template de contrat complet avec exemple concret
- Critères de décision module local vs service séparé

**Prochaine étape :** Phase 04 — Automatisation de Navigateur et Inspection de Sites

---

**Bilan rédigé le 2026-10-21 — Phase 03 du projet EKTS**
