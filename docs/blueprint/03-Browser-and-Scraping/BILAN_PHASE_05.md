# Bilan Phase 05 — Scraping Responsable

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Durée estimée :** 1-2 semaines  
**Durée réelle :** ~1 jour

---

## 1. Résumé

La Phase 05 a établi un cadre complet pour le scraping éthique et légal dans EKTS, avec deux livrables majeurs :

1. **Stratégie de scraping responsable** — cadre légal (CFAA, GDPR), principes éthiques, implémentation technique
2. **Matrice des méthodes par cas d'usage** — guide de décision pour choisir la bonne méthode

### Décisions clés

- ✅ **5 principes éthiques** : Transparence, Respect, Minimisation, Légalité, Responsabilité
- ✅ **Règle d'or EKTS** : "Ne scraper que ce qui est public, non-personnel, et autorisé"
- ✅ **Hiérarchie des méthodes** : API > Dataset > HTTP > Playwright > Patchright
- ✅ **Compliance middleware** : automatisation des vérifications légales/éthiques
- ✅ **LIA template** : pour collecte de données personnelles sous GDPR

---

## 2. Livrables produits

| # | Fichier | Taille | Description |
|---|---------|--------|-------------|
| 1 | `05_STRATEGIE_SCRAPING_RESPONSABLE.md` | ~20 KB | Cadre légal, éthique, technique complet |
| 2 | `05_MATRICE_METHODES_PAR_CAS.md` | ~15 KB | Guide de décision + exemples concrets |
| 3 | `BILAN_PHASE_05.md` | ~10 KB | Ce document |

---

## 3. Ce qui est établi

### 3.1 Cadre légal (2026)

**États-Unis :**
- Scraping public autorisé (hiQ v LinkedIn 2022, Van Buren 2021)
- Test "gates-up-or-down" : pas d'authentification = pas de violation CFAA
- ToS clickwrap = contrat exécutoire (risque breach of contract)

**Union Européenne :**
- GDPR s'applique même aux données publiques
- Legitimate Interest Assessment (LIA) requis pour données personnelles
- EDPB Guidelines 03/2026 : exclure sites bloquants (robots.txt, CAPTCHA)

### 3.2 Principes éthiques EKTS

1. **Transparence** — User-Agent explicite, documentation publique
2. **Respect** — robots.txt, rate limiting, horaires creux
3. **Minimisation** — uniquement données nécessaires, anonymisation
4. **Légalité** — données publiques uniquement, pas de contournement
5. **Responsabilité** — propriété humaine, audits, documentation

### 3.3 Méthodes de scraping

**Hiérarchie de préférence :**
1. **API officielle** — toujours privilégier si disponible
2. **Dataset public** — alternative au scraping direct
3. **HTTP simple** — pour sites statiques (rapide, léger)
4. **Playwright** — pour sites dynamiques (JavaScript requis)
5. **Patchright** — pour sites protégés (uniquement si justifié)

### 3.4 Compliance technique

**Middleware implémenté :**
- Vérification robots.txt automatique
- Rate limiting (30 req/min par domaine)
- Anonymisation des données personnelles
- Audit logging complet
- Pre/post scraping checks

---

## 4. Ce qui est rejeté

- ❌ **Scraping derrière authentification** — violation CFAA, risque légal élevé
- ❌ **Contournement de CAPTCHAs** — interdit éthiquement et légalement
- ❌ **Scraping de données non-publiques** — même si techniquement possible
- ❌ **Ignorer robots.txt** — manque de respect, risque légal
- ❌ **Collecte de données personnelles sans LIA** — violation GDPR
- ❌ **Patchright sans justification** — usage limité aux cas nécessaires

---

## 5. Questions résolues

| Question | Réponse |
|----------|---------|
| Le scraping est-il légal en 2026 ? | Oui, si données publiques, pas d'authentification, respect robots.txt |
| Qu'est-ce qui est autorisé par le CFAA ? | Scraping de pages publiques (gates-up) |
| Comment gérer les données personnelles ? | LIA requis, anonymisation, ou éviter |
| Quelle méthode pour quel cas ? | API > Dataset > HTTP > Playwright > Patchright |
| Faut-il respecter robots.txt ? | Oui, obligation éthique et légale (surtout EU) |
| Peut-on utiliser Patchright ? | Oui, mais uniquement si justifié (site protégé, données publiques) |

---

## 6. Questions ouvertes

1. **Exécutabilité des ToS browsewrap** — zone grise juridique, variation selon juridictions
2. **Interprétation de "legitimate interest"** — comment les régulateurs nationaux vont l'appliquer
3. **Efficacité long terme de Patchright** — les protections anti-bot évoluent rapidement
4. **EDPB Guidelines 03/2026** — encore en consultation jusqu'au 30 octobre 2026

---

## 7. Incertitudes

### Zones grises juridiques

- **Browsewrap ToS** : exécutabilité variable (Meta v Bright Data = favorable, mais pas universel)
- **APIs non documentées** : statut légal flou (public ? autorisé ?)
- **Données semi-publiques** : limite entre public et privé floue

### Évolution réglementaire

- **EDPB Guidelines** : version finale attendue fin 2026
- **EU AI Act** : nouvelles obligations de documentation pour données d'entraînement
- **Lois privacy US** : 19+ états avec des lois différentes

### Non vérifié

- Efficacité de Patchright sur toutes les protections anti-bot
- Interprétation de "legitimate interest" par les régulateurs nationaux
- Viabilité long terme des APIs gratuites (rate limits, changements)

---

## 8. Progression globale

| Lot | Phases | Statut |
|-----|--------|--------|
| Lot 1 | 01-03 | ✅ Terminé (Fondations, MCP, Conception) |
| Lot 2 | 04-05, 08 | 🔄 En cours (04 ✅, 05 ✅, 08 ⏳) |
| Lot 3 | 06-07, 09 | ⏳ À venir |
| Lot 4 | 10-12 | ⏳ À venir |
| Lot 5 | 13-14 | ⏳ À venir |

**Total livrables :** 16 terminés sur 37 (43%)

---

## 9. Phase suivante recommandée

**Phase 06 — Stockage et Connaissances**

### Objectif
Définir l'architecture de stockage pour les données collectées par EKTS (inspections, scrapes, ressources).

### Questions clés
- Quel système de stockage ? (SQLite, PostgreSQL, fichiers JSON)
- Comment structurer les données ? (schéma, relations)
- Comment indexer pour la recherche ? (full-text, vectorielle)
- Comment gérer la rétention et la suppression ?

### Livrables attendus
1. `06_ARCHITECTURE_CONNAISSANCES.md` — Architecture de stockage
2. `06_MODELE_DONNEES.md` — Schéma de données
3. `06_STRATEGIE_RECHERCHE.md` — Stratégie d'indexation et recherche

### Durée estimée
1-2 semaines

---

## 10. Décisions architecturales pour la suite

### Impact sur Phase 06 (Stockage)

Les décisions de la Phase 05 impactent directement le stockage :

- **Audit logging** — besoin de stocker les logs de compliance
- **Anonymisation** — les données personnelles doivent être anonymisées avant stockage
- **Rétention** — max 1 an avec auto-delete
- **Traçabilité** — registre des sources avec métadonnées légales

### Impact sur Phase 07 (RAG)

- **Données publiques uniquement** — pas de données personnelles dans le RAG
- **Documentation des sources** — chaque chunk doit avoir une source traçable
- **Qualité des données** — nettoyage et validation avant indexation

---

## 11. Annexes

### A. Checklist compliance EKTS

**Avant scraping :**
- [ ] API/dataset disponible ?
- [ ] Données publiques ?
- [ ] robots.txt vérifié ?
- [ ] ToS reviewés ?
- [ ] Données personnelles ? → LIA si oui
- [ ] Rate limiting configuré ?

**Pendant scraping :**
- [ ] User-Agent explicite
- [ ] Pas de surcharge
- [ ] Erreurs gérées
- [ ] Logging actif

**Après scraping :**
- [ ] Données nettoyées
- [ ] Personnelles anonymisées
- [ ] Audit log complété
- [ ] Rétention définie

### B. Templates fournis

- Legitimate Interest Assessment (LIA)
- Privacy notice
- Audit log structure
- Source registry

### C. Exemples de code

- Compliance middleware
- Rate limiter
- Robots.txt manager
- Retry avec backoff
- Scraping HTTP/Playwright/Patchright/API

---

## 12. Sources

### Décisions de justice
- hiQ Labs v. LinkedIn (Ninth Circuit, 2022)
- Van Buren v. United States (Supreme Court, 2021)
- Meta v. Bright Data (N.D. Cal., 2024)

### Réglementations
- GDPR (EU) — Articles 5, 6, 9, 14, 17
- CCPA/CPRA (California)
- EU AI Act (2025-2026)
- EDPB Guidelines 03/2026

### Bonnes pratiques
- RFC 9309 (robots.txt)
- ScrapingBee, Scrapfly, Bright Data guides (2026)

---

**Bilan rédigé le 21 octobre 2026 — Phase 05 du projet EKTS**
