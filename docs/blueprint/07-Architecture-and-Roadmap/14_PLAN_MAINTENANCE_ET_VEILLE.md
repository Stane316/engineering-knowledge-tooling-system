# Plan de Maintenance et Veille — Phase 14

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Objectif :** Définir la stratégie de maintenance et veille technologique pour EKTS

---

## 1. Introduction

### 1.1 Contexte

**Projet EKTS :** Engineering Knowledge & Tooling System  
**Statut :** Phases 00-13 terminées (44 livrables)  
**Phase actuelle :** Phase 14 (Audit final + Plan maintenance)  
**Prochaine étape :** Implémentation MVP-1 (Mois 1-3)

### 1.2 Objectif du document

**Définir une stratégie complète de maintenance et veille couvrant :**
- ✅ Maintenance du code (qualité, tests, documentation)
- ✅ Maintenance des données (backups, migration, intégrité)
- ✅ Maintenance des dépendances (sécurité, mises à jour)
- ✅ Veille technologique (MCP, outils IA, benchmarks)
- ✅ Veille concurrentielle (nouveaux outils, pricing)
- ✅ Veille réglementaire (GDPR, compliance)
- ✅ Métriques de santé du système
- ✅ Processus d'évolution (nouvelles fonctionnalités)
- ✅ Gestion de la communauté (contributeurs, feedback)
- ✅ Budget maintenance (temps, coûts)

---

## 2. Maintenance du code

### 2.1 Qualité du code

**Standards :**
- ✅ **TypeScript strict mode** : Pas de `any`, types explicites
- ✅ **ESLint + Prettier** : Formatage automatique, règles strictes
- ✅ **Couverture tests > 80%** : Mesurée par c8 (Istanbul)
- ✅ **Pas de secrets dans le code** : Gitleaks pre-commit hook
- ✅ **Documentation JSDoc** : Toutes les fonctions publiques documentées

**Outils :**
```bash
# Qualité code
npm run lint          # ESLint
npm run format        # Prettier
npm run type-check    # TypeScript compiler
npm run coverage      # c8 (couverture tests)

# Sécurité
npm audit             # Vulnérabilités dépendances
npm run secrets       # Gitleaks + TruffleHog
```

**Fréquence :**
- ✅ **Continue** : À chaque commit (pre-commit hooks)
- ✅ **Hebdomadaire** : Review code qualité
- ✅ **Mensuelle** : Audit complet (lint, coverage, security)

### 2.2 Tests

**Pyramide de tests :**
```
        /  E2E  \          ← 5% (tests manuels MCP)
       /----------\
      / Integration \      ← 25% (CLI, MCP, workflows)
     /----------------\
    /   Unit Tests     \   ← 70% (> 80% couverture)
   /----------------------\
```

**Types de tests :**
- ✅ **Tests unitaires** : Vitest, couverture > 80%
- ✅ **Tests d'intégration** : CLI, MCP, workflows
- ✅ **Tests E2E** : Manuels (compatibilité MCP agents)
- ✅ **Benchmarks** : Recall@5, Faithfulness, latence

**Fréquence :**
- ✅ **Continue** : À chaque commit (CI GitHub Actions)
- ✅ **Hebdomadaire** : Review résultats tests
- ✅ **Mensuelle** : Ajout nouveaux tests si coverage < 80%
- ✅ **Trimestrielle** : Review stratégie tests

### 2.3 Documentation

**Types de documentation :**
- ✅ **API documentation** : JSDoc, générée automatiquement (TypeDoc)
- ✅ **Guides utilisateurs** : README.md, docs/SETUP.md, docs/CLI.md
- ✅ **Guides développeurs** : docs/ARCHITECTURE.md, docs/CONTRIBUTING.md
- ✅ **Changelog** : CHANGELOG.md (à chaque release)
- ✅ **ADR** : docs/adr/ (Architecture Decision Records)

**Fréquence :**
- ✅ **Continue** : À chaque changement de code
- ✅ **Hebdomadaire** : Review documentation
- ✅ **Mensuelle** : Mise à jour guides si nécessaire
- ✅ **Trimestrielle** : Audit documentation complète

---

## 3. Maintenance des données

### 3.1 Backups

**Stratégie de backup :**
- ✅ **Fréquence** : Quotidienne (cron job)
- ✅ **Rétention** : 30 jours (glissant)
- ✅ **Localisation** : 3-2-1 rule (3 copies, 2 médias, 1 hors-site)
- ✅ **Format** : Fichiers SQLite (*.db) + dumps SQL (.sql)
- ✅ **Chiffrement** : AES-256 pour backups hors-site

**Script backup :**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/ekts/$DATE"

mkdir -p $BACKUP_DIR

# Backup SQLite databases
cp /data/ekts.db $BACKUP_DIR/
cp /data/ekts-fts.db $BACKUP_DIR/
cp /data/ekts-vectors.db $BACKUP_DIR/

# SQL dump
sqlite3 /data/ekts.db ".dump" > $BACKUP_DIR/ekts-dump.sql

# Compression
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload hors-site (optionnel)
# rclone copy $BACKUP_DIR.tar.gz remote:backups/

# Nettoyage anciens backups (> 30 jours)
find /backups/ekts -type f -mtime +30 -delete
```

**Fréquence :**
- ✅ **Quotidienne** : Backup automatique (cron)
- ✅ **Hebdomadaire** : Vérification intégrité backups
- ✅ **Mensuelle** : Test restauration backup

### 3.2 Migration de données

**Stratégie de migration :**
- ✅ **Versioning schéma** : Fichiers de migration numérotés (001_init.sql, 002_add_tags.sql)
- ✅ **Migration automatique** : Script migrate.js (applied migrations tracking)
- ✅ **Rollback** : Script rollback.js (down migrations)
- ✅ **Backup avant migration** : Automatique avant chaque migration

**Outils :**
- ✅ **SQLite migrations** : Custom script (pas d'ORM lourd)
- ✅ **Versioning** : Table `migrations` (id, name, applied_at)

**Fréquence :**
- ✅ **À chaque changement de schéma** : Migration automatique
- ✅ **Trimestrielle** : Review schéma, optimisations

### 3.3 Intégrité des données

**Vérifications :**
- ✅ **Foreign keys** : PRAGMA foreign_keys = ON
- ✅ **Transactions** : BEGIN/COMMIT/ROLLBACK
- ✅ **Constraints** : NOT NULL, UNIQUE, CHECK
- ✅ **Vacuum** : PRAGMA optimize (quotidien), VACUUM (mensuel)

**Script intégrité :**
```bash
#!/bin/bash
# integrity-check.sh

# Check foreign keys
sqlite3 /data/ekts.db "PRAGMA foreign_key_check;"

# Check integrity
sqlite3 /data/ekts.db "PRAGMA integrity_check;"

# Optimize
sqlite3 /data/ekts.db "PRAGMA optimize;"
```

**Fréquence :**
- ✅ **Quotidienne** : PRAGMA optimize
- ✅ **Hebdomadaire** : foreign_key_check, integrity_check
- ✅ **Mensuelle** : VACUUM (réorganisation physique)

---

## 4. Maintenance des dépendances

### 4.1 Sécurité des dépendances

**Outils :**
- ✅ **npm audit** : Vulnérabilités connues
- ✅ **Snyk** : Analyse continue (optionnel)
- ✅ **Dependabot** : Pull requests automatiques (GitHub)
- ✅ **Gitleaks** : Secrets dans code
- ✅ **TruffleHog** : Secrets actifs

**Fréquence :**
- ✅ **Continue** : Dependabot (à chaque vulnérabilité)
- ✅ **Hebdomadaire** : npm audit
- ✅ **Mensuelle** : Review dépendances obsolètes
- ✅ **Trimestrielle** : Audit sécurité complet

**Processus mise à jour sécurité :**
1. Dependabot crée PR (vulnérabilité détectée)
2. Review PR (changelog, breaking changes)
3. Tests CI (lint, test, coverage)
4. Merge si OK
5. Release patch (semver)

### 4.2 Mises à jour fonctionnelles

**Stratégie :**
- ✅ **Semver** : Major.Minor.Patch (breaking.minor.patch)
- ✅ **Lock file** : package-lock.json (versions exactes)
- ✅ **Range strategies** : ^major (compatible) pour dépendances stables
- ✅ **Pinning** : Versions exactes pour dépendances critiques (SQLite, MCP SDK)

**Fréquence :**
- ✅ **Mensuelle** : Review mises à jour disponibles
- ✅ **Trimestrielle** : Mise à jour dépendances stables
- ✅ **Annuelle** : Review dépendances critiques (breaking changes)

**Processus mise à jour fonctionnelle :**
1. Review changelog (breaking changes)
2. Test en environnement de dev
3. Tests CI (lint, test, coverage)
4. Review manuel (fonctionnalités impactées)
5. Merge si OK
6. Release minor/major (semver)

### 4.3 Dépendances critiques

**Dépendances à surveiller particulièrement :**

| Dépendance | Version actuelle | Criticité | Fréquence review |
|------------|------------------|-----------|------------------|
| **better-sqlite3** | 11.x | Haute (SQLite) | Mensuelle |
| **@modelcontextprotocol/sdk** | 2.x | Haute (MCP) | Mensuelle |
| **playwright** | 1.x | Haute (MVP-2) | Mensuelle |
| **commander** | 12.x | Moyenne (CLI) | Trimestrielle |
| **zod** | 3.x | Moyenne (validation) | Trimestrielle |
| **pino** | 9.x | Moyenne (logs) | Trimestrielle |
| **vitest** | 2.x | Moyenne (tests) | Trimestrielle |

---

## 5. Veille technologique

### 5.1 Veille MCP (Model Context Protocol)

**Objet :**
- ✅ Évolutions spec MCP (Linux Foundation)
- ✅ Nouveaux SDKs (TypeScript, Python, Go, C#, Rust)
- ✅ Nouveaux agents Tier 1 (OAuth natif)
- ✅ Nouveaux serveurs MCP (outils publics)
- ✅ Best practices (patterns, anti-patterns)

**Sources :**
- ✅ **Site officiel** : https://modelcontextprotocol.io
- ✅ **GitHub** : https://github.com/modelcontextprotocol
- ✅ **Linux Foundation** : https://lfx.linuxfoundation.org
- ✅ **Blog** : https://modelcontextprotocol.io/blog
- ✅ **Discord** : Communauté MCP

**Fréquence :**
- ✅ **Mensuelle** : Review spec updates, nouveaux SDKs
- ✅ **Trimestrielle** : Review nouveaux agents Tier 1
- ✅ **Semestrielle** : Audit complet écosystème MCP

**Processus :**
1. Monitor sources (RSS, GitHub notifications)
2. Évaluer impact sur EKTS (breaking changes, nouvelles fonctionnalités)
3. Documenter dans ADR (Architecture Decision Record)
4. Implémenter si pertinent (PR, tests, documentation)
5. Mettre à jour documentation EKTS

### 5.2 Veille outils IA

**Objet :**
- ✅ Nouveaux modèles (Claude, GPT, Gemini, etc.)
- ✅ Évolutions pricing (gratuit, pro, enterprise)
- ✅ Nouveaux benchmarks (SWE-bench, Terminal-Bench)
- ✅ Nouveaux outils (IDE, CLI, agents)
- ✅ Évolutions offres étudiantes

**Sources :**
- ✅ **Benchmarks** : https://swe-bench.com, https://terminal-bench.com
- ✅ **Pricing** : Sites officiels (Anthropic, OpenAI, Google, GitHub)
- ✅ **News** : Hacker News, Reddit r/LocalLLaMA, Twitter/X
- ✅ **Papers** : arXiv (cs.AI, cs.CL)
- ✅ **Community** : Discord, forums officiels

**Fréquence :**
- ✅ **Mensuelle** : Review news, pricing changes
- ✅ **Trimestrielle** : Review benchmarks (SWE-bench, Terminal-Bench)
- ✅ **Semestrielle** : Audit complet outils IA (comparatif)

**Processus :**
1. Monitor sources (RSS, newsletters)
2. Évaluer impact sur EKTS (nouvel outil pertinent ?)
3. Tester si pertinent (proof of concept)
4. Documenter dans ADR
5. Mettre à jour 12_COMPARATIF_AGENTS_IA.md si nécessaire

### 5.3 Veille benchmarks

**Objet :**
- ✅ Évolutions SWE-bench Verified (scores modèles)
- ✅ Évolutions Terminal-Bench (scores agents)
- ✅ Nouveaux benchmarks (émergents)
- ✅ Méthodologies évaluation (reproductibilité)

**Sources :**
- ✅ **SWE-bench** : https://swe-bench.com
- ✅ **Terminal-Bench** : https://terminal-bench.com
- ✅ **Papers** : arXiv (benchmark methodology)
- ✅ **Community** : Discussions benchmarks

**Fréquence :**
- ✅ **Trimestrielle** : Review SWE-bench, Terminal-Bench updates
- ✅ **Semestrielle** : Audit complet benchmarks
- ✅ **Annuelle** : Évaluation méthodologies

**Processus :**
1. Monitor benchmarks (updates, new versions)
2. Re-tester outils EKTS (Claude Code, Copilot, etc.)
3. Mettre à jour 12_COMPARATIF_AGENTS_IA.md
4. Réévaluer recommandations si nécessaire

---

## 6. Veille concurrentielle

### 6.1 Outils similaires

**Objet :**
- ✅ Nouveaux outils de gestion connaissances (similar to EKTS)
- ✅ Évolutions outils existants (Notion, Obsidian, etc.)
- ✅ Features intéressantes (à implémenter dans EKTS)
- ✅ Pricing, positionnement marché

**Concurrents directs :**
- ✅ **Notion** : Productivité, wikis, bases de données
- ✅ **Obsidian** : Notes locales, Markdown, graphes
- ✅ **Logseq** : Notes locales, outliner, open-source
- ✅ **Tana** : Notes structurées, ontologies
- ✅ **Capacities** : Notes objet, typage

**Concurrents indirects :**
- ✅ **GitBook** : Documentation, wikis
- ✅ **Confluence** : Enterprise wikis
- ✅ **Docusaurus** : Documentation sites
- ✅ **MkDocs** : Documentation sites (Markdown)

**Fréquence :**
- ✅ **Trimestrielle** : Review concurrents directs
- ✅ **Semestrielle** : Audit complet marché
- ✅ **Annuelle** : Évolution positionnement EKTS

**Processus :**
1. Monitor concurrents (news, releases)
2. Évaluer features intéressantes (pertinence pour EKTS)
3. Documenter dans ADR (competitive analysis)
4. Implémenter si pertinent (PR, tests, documentation)

### 6.2 Positionnement EKTS

**Proposition de valeur unique :**
- ✅ **Système personnel d'ingénierie augmenté par l'IA**
- ✅ **Centralise connaissances, ressources, capacités exécutables**
- ✅ **Interface agentique standardisée (MCP)**
- ✅ **Local-first, privacy-by-design**
- ✅ **Open-source, extensible**

**Différenciateurs :**
- ✅ **MCP natif** : Interface agents IA (pas de concurrent direct)
- ✅ **Recherche hybride** : FTS + Vector + RRF (qualité supérieure)
- ✅ **Inspection navigateur** : Playwright intégré (automation)
- ✅ **Capitalisation projets** : Workflow structuré (post-mortem)
- ✅ **Local-first** : Pas de cloud requis (privacy)

**Fréquence :**
- ✅ **Semestrielle** : Review positionnement
- ✅ **Annuelle** : Évolution stratégie

---

## 7. Veille réglementaire

### 7.1 GDPR (Europe)

**Objet :**
- ✅ Évolutions réglementation GDPR
- ✅ Guidelines EDPB (European Data Protection Board)
- ✅ Décisions autorités nationales (CNIL, etc.)
- ✅ Best practices compliance

**Sources :**
- ✅ **GDPR text** : https://gdpr-info.eu
- ✅ **EDPB** : https://www.edpb.europa.eu
- ✅ **CNIL** : https://www.cnil.fr (France)
- ✅ **IAPP** : https://iapp.org (International Association of Privacy Professionals)

**Fréquence :**
- ✅ **Trimestrielle** : Review guidelines EDPB
- ✅ **Semestrielle** : Audit compliance GDPR
- ✅ **Annuelle** : Review politique privacy EKTS

**Processus :**
1. Monitor sources (newsletters, updates)
2. Évaluer impact sur EKTS (nouvelles obligations)
3. Documenter dans ADR (compliance decision)
4. Implémenter si nécessaire (PR, tests, documentation)
5. Mettre à jour 11_POLITIQUE_PERMISSIONS_ET_SECURITE.md

### 7.2 Autres réglementations

**Objet :**
- ✅ CCPA/CPRA (California Privacy Rights Act)
- ✅ LGPD (Brazilian General Data Protection Law)
- ✅ PIPL (China Personal Information Protection Law)
- ✅ Sector-specific regulations (HIPAA, PCI-DSS, etc.)

**Sources :**
- ✅ **IAPP** : https://iapp.org (global privacy laws)
- ✅ **DLA Piper** : https://www.dlapiperdataprotection.com (country-by-country)
- ✅ **Legal blogs** : Privacy Law Blog, Future of Privacy Forum

**Fréquence :**
- ✅ **Semestrielle** : Review réglementations pertinentes
- ✅ **Annuelle** : Audit compliance global

**Processus :**
1. Monitor sources (newsletters, updates)
2. Évaluer impact sur EKTS (si applicable)
3. Documenter dans ADR
4. Implémenter si nécessaire

---

## 8. Métriques de santé du système

### 8.1 Métriques code

**Métriques suivies :**

| Métrique | Objectif | Fréquence | Outil |
|----------|----------|-----------|-------|
| **Couverture tests** | > 80% | Continue | c8 (Istanbul) |
| **Lint errors** | 0 | Continue | ESLint |
| **Type errors** | 0 | Continue | TypeScript |
| **Vulnérabilités** | 0 critiques | Hebdomadaire | npm audit |
| **Secrets détectés** | 0 | Continue | Gitleaks |
| **Documentation coverage** | > 90% | Mensuelle | TypeDoc |

### 8.2 Métriques performance

**Métriques suivies :**

| Métrique | Objectif | Fréquence | Outil |
|----------|----------|-----------|-------|
| **Latence CLI** | < 200ms | Continue | Benchmark custom |
| **Latence recherche** | < 500ms (100K docs) | Continue | Benchmark custom |
| **Recall@5** | ≥ 0.75 | Trimestrielle | Benchmark custom |
| **Faithfulness** | ≥ 0.80 | Trimestrielle | Benchmark custom |
| **Inspection L1** | < 10s | Continue | Benchmark custom |
| **Inspection L2** | < 30s | Continue | Benchmark custom |
| **Inspection L3** | < 60s | Continue | Benchmark custom |

### 8.3 Métriques usage

**Métriques suivies :**

| Métrique | Objectif | Fréquence | Outil |
|----------|----------|-----------|-------|
| **Nombre ressources** | Croissance régulière | Mensuelle | SQLite count |
| **Nombre audits** | Croissance régulière | Mensuelle | SQLite count |
| **Nombre projets** | Croissance régulière | Mensuelle | SQLite count |
| **Nombre requêtes MCP** | Croissance régulière | Mensuelle | Logs MCP |
| **Temps moyen recherche** | < 500ms | Mensuelle | Logs |

### 8.4 Dashboard santé

**Outils :**
- ✅ **Grafana** : Dashboard métriques (optionnel, Production)
- ✅ **Prometheus** : Collecte métriques (optionnel, Production)
- ✅ **Custom scripts** : Scripts bash/Node.js pour métriques simples (MVP)

**Fréquence :**
- ✅ **Continue** : Métriques automatiques (CI, logs)
- ✅ **Hebdomadaire** : Review dashboard
- ✅ **Mensuelle** : Report santé (PDF)
- ✅ **Trimestrielle** : Audit performance complet

---

## 9. Processus d'évolution

### 9.1 Nouvelles fonctionnalités

**Processus :**
1. **Idée** : Issue GitHub (feature request)
2. **Discussion** : GitHub Discussions (communauté)
3. **ADR** : Architecture Decision Record (documentation)
4. **Spec** : Spécification technique (document)
5. **Implémentation** : PR (code, tests, documentation)
6. **Review** : Code review (mainteneur)
7. **Merge** : Si OK (CI verte)
8. **Release** : Tag Git, changelog

**Critères acceptance :**
- ✅ Pertinence pour EKTS (alignement vision)
- ✅ Faisabilité technique (complexité raisonnable)
- ✅ Impact performance (pas de régression)
- ✅ Documentation (guides, API docs)
- ✅ Tests (couverture > 80%)

### 9.2 Bugs

**Processus :**
1. **Report** : Issue GitHub (bug report)
2. **Triaging** : Label (priority, severity)
3. **Reproduction** : Steps to reproduce
4. **Fix** : PR (code, tests)
5. **Review** : Code review
6. **Merge** : Si OK
7. **Release** : Patch version (semver)

**Priorités :**
- 🔴 **P0 (Critical)** : Blocker, fix immédiat (< 24h)
- 🟠 **P1 (High)** : Major impact, fix rapide (< 1 semaine)
- 🟡 **P2 (Medium)** : Minor impact, fix normal (< 1 mois)
- 🟢 **P3 (Low)** : Cosmetic, fix planifié (< 3 mois)

### 9.3 Breaking changes

**Processus :**
1. **Discussion** : GitHub Discussions (communauté)
2. **ADR** : Architecture Decision Record
3. **Migration guide** : Documentation migration
4. **Deprecation period** : 6 mois minimum
5. **Implémentation** : PR (code, tests, documentation)
6. **Release** : Major version (semver)

**Communication :**
- ✅ **Changelog** : CHANGELOG.md (détaillé)
- ✅ **Release notes** : GitHub Releases
- ✅ **Migration guide** : docs/migrations/vX.md
- ✅ **Newsletter** : Email subscribers (si applicable)

---

## 10. Gestion de la communauté

### 10.1 Contributeurs

**Types de contributions :**
- ✅ **Code** : Pull requests (features, bug fixes)
- ✅ **Documentation** : Guides, API docs, translations
- ✅ **Tests** : Tests unitaires, intégration, E2E
- ✅ **Design** : UI/UX, logos, illustrations
- ✅ **Community** : Answers, tutorials, blog posts

**Processus contribution :**
1. **Fork** : Fork du repository
2. **Branch** : Créer branche (feature/xyz)
3. **Develop** : Implémenter (code, tests, docs)
4. **PR** : Pull request (description détaillée)
5. **Review** : Code review (mainteneur)
6. **Merge** : Si OK
7. **Credit** : Contributeur listé dans CONTRIBUTORS.md

**Guidelines :**
- ✅ **CONTRIBUTING.md** : Guide contributeurs
- ✅ **CODE_OF_CONDUCT.md** : Code de conduite
- ✅ **STYLE_GUIDE.md** : Style guide code
- ✅ **PR_TEMPLATE.md** : Template pull request

### 10.2 Feedback

**Canaux feedback :**
- ✅ **GitHub Issues** : Bugs, features
- ✅ **GitHub Discussions** : Questions, idées
- ✅ **Discord** : Chat communauté (optionnel)
- ✅ **Twitter/X** : Social media (optionnel)
- ✅ **Email** : Contact direct (optionnel)

**Processus feedback :**
1. **Collecte** : Issues, Discussions, social media
2. **Triaging** : Label, categorize
3. **Analysis** : Patterns, tendances
4. **Prioritization** : Roadmap update
5. **Communication** : Response publique
6. **Implementation** : Si pertinent

**Fréquence :**
- ✅ **Continue** : Collecte feedback
- ✅ **Hebdomadaire** : Triaging
- ✅ **Mensuelle** : Analysis, prioritization
- ✅ **Trimestrielle** : Review roadmap

---

## 11. Plan de communication

### 11.1 Releases

**Fréquence :**
- ✅ **Patch** : Dès que nécessaire (bugs, sécurité)
- ✅ **Minor** : Mensuelle (features, improvements)
- ✅ **Major** : Trimestrielle (breaking changes)

**Processus release :**
1. **Changelog** : Mise à jour CHANGELOG.md
2. **Version bump** : package.json (semver)
3. **Tag** : Git tag (vX.Y.Z)
4. **Release notes** : GitHub Releases
5. **Announce** : Social media, newsletter (si applicable)

### 11.2 Communication externe

**Canaux :**
- ✅ **GitHub Releases** : Release notes
- ✅ **Blog** : Articles techniques (optionnel)
- ✅ **Twitter/X** : Annonces (optionnel)
- ✅ **Newsletter** : Email subscribers (optionnel)
- ✅ **Conference** : Talks, workshops (optionnel)

**Fréquence :**
- ✅ **À chaque release** : GitHub Releases
- ✅ **Mensuelle** : Blog post (si pertinent)
- ✅ **Trimestrielle** : Newsletter (si applicable)

---

## 12. Budget maintenance

### 12.1 Temps maintenance

**Estimation temps maintenance :**

| Activité | Fréquence | Temps | Temps annuel |
|----------|-----------|-------|--------------|
| **Code review** | Hebdomadaire | 2h | 104h |
| **Tests review** | Hebdomadaire | 1h | 52h |
| **Documentation** | Hebdomadaire | 2h | 104h |
| **Dependencies update** | Mensuelle | 4h | 48h |
| **Security audit** | Mensuelle | 4h | 48h |
| **Performance review** | Trimestrielle | 8h | 32h |
| **Backup verification** | Hebdomadaire | 1h | 52h |
| **Veille technologique** | Mensuelle | 8h | 96h |
| **Community management** | Hebdomadaire | 2h | 104h |
| **TOTAL** | | | **640h/an** |

**Équivalent :** ~0.4 ETP (Full-Time Equivalent)

### 12.2 Coûts infrastructure

**Coûts mensuels estimés :**

| Poste | Coût/mois | Coût annuel | Notes |
|-------|-----------|-------------|-------|
| **GitHub** | $0 | $0 | Public repository |
| **GitHub Actions** | $0 | $0 | 2,000 minutes/mois gratuit |
| **Domaine** | $10 | $120 | ekts.dev (optionnel) |
| **Hosting docs** | $0 | $0 | GitHub Pages |
| **Email newsletter** | $0 | $0 | Mailchimp free tier |
| **Monitoring** | $0 | $0 | Self-hosted (MVP) |
| **Backup storage** | $5 | $60 | 100GB (Backblaze B2) |
| **TOTAL** | **$15** | **$180** | |

### 12.3 Coûts outils IA (optionnel)

**Coûts mensuels estimés :**

| Outil | Coût/mois | Coût annuel | Notes |
|-------|-----------|-------------|-------|
| **Claude Code Pro** | $20 | $240 | Usage personnel |
| **GitHub Copilot Pro** | $10 | $120 | Usage personnel |
| **OpenAI API** | $5 | $60 | Embeddings (1M tokens/mois) |
| **TOTAL** | **$35** | **$420** | |

**Budget total maintenance :**
- ✅ **Temps** : 640h/an (~0.4 ETP)
- ✅ **Infrastructure** : $180/an
- ✅ **Outils IA** : $420/an (optionnel)
- ✅ **TOTAL** : $600/an + 640h/an

---

## 13. Calendrier maintenance

### 13.1 Calendrier hebdomadaire

| Jour | Activité | Temps |
|------|----------|-------|
| **Lundi** | Review PRs, code review | 2h |
| **Mardi** | Tests review, documentation | 2h |
| **Mercredi** | Community management (Issues, Discussions) | 2h |
| **Jeudi** | Dependencies update, security audit | 2h |
| **Vendredi** | Veille technologique, backup verification | 2h |
| **TOTAL** | | **10h/semaine** |

### 13.2 Calendrier mensuel

| Semaine | Activité | Temps |
|---------|----------|-------|
| **Semaine 1** | Release minor (si pertinent), changelog | 4h |
| **Semaine 2** | Performance review, optimization | 4h |
| **Semaine 3** | Documentation audit, update guides | 4h |
| **Semaine 4** | Veille approfondie, roadmap review | 4h |
| **TOTAL** | | **16h/mois** |

### 13.3 Calendrier trimestriel

| Mois | Activité | Temps |
|------|----------|-------|
| **Mois 1** | Audit sécurité complet, penetration test | 8h |
| **Mois 2** | Audit performance complet, benchmarks | 8h |
| **Mois 3** | Audit documentation complet, roadmap update | 8h |
| **TOTAL** | | **24h/trimestre** |

### 13.4 Calendrier annuel

| Trimestre | Activité | Temps |
|-----------|----------|-------|
| **Q1** | Audit compliance GDPR, politique privacy | 8h |
| **Q2** | Audit concurrentiel, positionnement | 8h |
| **Q3** | Audit technologique, outils IA | 8h |
| **Q4** | Audit global, roadmap annuelle | 8h |
| **TOTAL** | | **32h/an** |

---

## 14. Responsabilités

### 14.1 Rôles

**Mainteneur principal :**
- ✅ **Responsabilités** : Code review, merges, releases, communication
- ✅ **Temps** : 10h/semaine (0.25 ETP)
- ✅ **Compétences** : TypeScript, Node.js, SQLite, MCP, sécurité

**Contributeurs :**
- ✅ **Responsabilités** : Pull requests, tests, documentation
- ✅ **Temps** : Variable (2-10h/mois)
- ✅ **Compétences** : Variables (selon contribution)

**Communauté :**
- ✅ **Responsabilités** : Feedback, bug reports, feature requests
- ✅ **Temps** : Variable (occasionnel)
- ✅ **Compétences** : Aucune requise

### 14.2 Matrice RACI

| Activité | Mainteneur | Contributeurs | Communauté |
|----------|------------|---------------|------------|
| **Code review** | R/A | C | I |
| **Merge PR** | R/A | I | I |
| **Release** | R/A | C | I |
| **Documentation** | R | C | I |
| **Tests** | R | C | I |
| **Bug reports** | A | R | C |
| **Feature requests** | A | C | R |
| **Veille technologique** | R | C | I |
| **Communication** | R | C | I |

**Légende :**
- **R** : Responsible (fait le travail)
- **A** : Accountable (validateur final)
- **C** : Consulted (consulté avant décision)
- **I** : Informed (informé après décision)

---

## 15. Outils de suivi

### 15.1 GitHub

**Outils GitHub :**
- ✅ **Issues** : Bugs, features, questions
- ✅ **Projects** : Roadmap, sprints, kanban
- ✅ **Discussions** : Questions, idées, communauté
- ✅ **Actions** : CI/CD, automatisation
- ✅ **Wiki** : Documentation (optionnel)
- ✅ **Releases** : Tags, changelog, binaries

### 15.2 Documentation

**Outils documentation :**
- ✅ **TypeDoc** : API documentation (auto-générée)
- ✅ **Docusaurus** : Documentation site (optionnel)
- ✅ **Markdown** : README.md, guides, ADR
- ✅ **Diagrams.net** : Diagrammes architecture

### 15.3 Communication

**Outils communication :**
- ✅ **GitHub Notifications** : Emails, web notifications
- ✅ **Discord** : Chat communauté (optionnel)
- ✅ **Twitter/X** : Annonces (optionnel)
- ✅ **Mailchimp** : Newsletter (optionnel)

### 15.4 Monitoring

**Outils monitoring :**
- ✅ **GitHub Actions** : CI/CD, tests automatiques
- ✅ **Dependabot** : Vulnerability alerts
- ✅ **Snyk** : Security scanning (optionnel)
- ✅ **Grafana** : Dashboard métriques (optionnel, Production)
- ✅ **Prometheus** : Collecte métriques (optionnel, Production)

---

## 16. Conclusion

### 16.1 Synthèse

**Plan de maintenance et veille défini avec succès.**

**Couverture :**
- ✅ **Maintenance code** : Qualité, tests, documentation
- ✅ **Maintenance données** : Backups, migration, intégrité
- ✅ **Maintenance dépendances** : Sécurité, mises à jour
- ✅ **Veille technologique** : MCP, outils IA, benchmarks
- ✅ **Veille concurrentielle** : Outils similaires, positionnement
- ✅ **Veille réglementaire** : GDPR, compliance
- ✅ **Métriques santé** : Code, performance, usage
- ✅ **Processus évolution** : Features, bugs, breaking changes
- ✅ **Gestion communauté** : Contributeurs, feedback
- ✅ **Plan communication** : Releases, annonces
- ✅ **Budget maintenance** : Temps, coûts
- ✅ **Calendrier maintenance** : Hebdomadaire, mensuel, trimestriel, annuel
- ✅ **Responsabilités** : Rôles, RACI
- ✅ **Outils suivi** : GitHub, documentation, communication, monitoring

### 16.2 Prochaines étapes

**Implémentation MVP-1 (Mois 1-3) :**
1. Démarrer Sprint 1 (setup projet)
2. Suivre roadmap (18 sprints)
3. Appliquer plan maintenance (dès départ)
4. Points de contrôle humains réguliers

**Phase 14 — Fin :**
- ✅ `14_AUDIT_COHERENCE_FINAL.md` — Audit cohérence global
- ✅ `14_PLAN_MAINTENANCE_ET_VEILLE.md` — Plan maintenance et veille (ce document)
- Mettre à jour INDEX.md (46/46 livrables)

**Après Phase 14 :**
- ✅ Projet EKTS 100% documenté et prêt pour implémentation
- ✅ Démarrer MVP-1 (Mois 1)
- ✅ Suivre plan maintenance (continu)
- ✅ Re-vérifier pricing dans 6 mois (Avril 2027)

---

**Document rédigé le 21 octobre 2026 — Phase 14 du projet EKTS**
