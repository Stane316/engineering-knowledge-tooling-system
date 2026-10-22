# DRI — Digital Resource Intelligence
### Bibliothèque mondiale, structurée et vérifiée des ressources numériques réutilisables
**Phase 2 · clôture du 5 octobre 2026** · Langue : français · Seeds : les 5 plateformes de la phase 1 (non ré-auditées)

---

## Les 9 documents

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **01** | `01-global-resource-map.md` | Carte d'entrée : méthode, 16 familles, Tiers, densités, gaps, par où commencer | vous découvrez le système |
| **02** | `02-taxonomy.md` | 30 natures, règles de distinction, scores (AI-readiness 0–5, Réutilisabilité 1–5, Discovery Value 6 axes), grappes & fusions, méthodes de récupération, classes de licence, relations typées | vous voulez classer ou noter une ressource |
| **03** | `03-platform-directory.md` | Fiches des **plateformes/écosystèmes** (inspiration, registries, 3D, data, assets, IA, infra, apprentissage) Tier A/B/C | vous cherchez *où* chercher |
| **04** | `04-resource-catalog.md` | Catalogue des **ressources individuelles** (packages, SDK, CLI, templates, assets) avec preuves et scores | vous cherchez *quoi* installer |
| **05** | `05-technology-map.md` | Matrices : frameworks/langages, rendu/perf, runtimes/cibles, IA, 48 besoins, 10 phases, licences, no-code | votre stack est contrainte |
| **06** | `06-ai-resource-map.md` | Kits IA, **MCP** (outils, install, clients, permissions, risques, licence, maintenance), **Skills**, orchestrateurs, observabilité, agents de code, builders | vous automatisez avec des agents |
| **07** | `07-use-case-index.md` | 11 blocs de besoins → 1er choix / alternative / pépite / récupération / licence / coût / piège / USE-UNDERSTAND-ADAPT | vous partez d'un besoin concret |
| **08** | `08-decision-matrix.md` | Decision Engine à 8 canaux, arbres de décision, matrices par phase, anti-patterns, réponse complète chiffrée | vous devez trancher entre options |
| **09** | `09-resource-stack.md` | Stacks Essential / Strong / Specialized / Experimental / AI-native, 3 stacks types, protocole de maintenance, limites, **Coverage achieved / Remaining gaps** | vous voulez la synthèse actionnable |
| **10** | `10-verticals.md` | **6 verticaux métier** : e-commerce, éducation, SaaS B2B, agence web, studio créatif, média. Pour chacun : contraintes, stack, Tiers A/B/C, besoins, coûts, pièges, USE→UNDERSTAND→ADAPT | votre projet a un métier précis |
| **11** | `11-cost-at-scale.md` | **Coût total à l'échelle** (10 K / 100 K / 1 M utilisateurs) pour les 6 services structurants : hébergement, base, auth, e-mail, stockage, IA. Modèles chiffrés + stratégies de réduction | vous anticipez la croissance |
| **12** | `12-student-plans.md` | **Plans étudiants** : 54 services catalogués avec éligibilité Bénin, liens directs, valeur, vérification. GitHub Pack, JetBrains, Google AI Plus, Azure, Mistral, Notion, Figma, Adobe, Kaggle… | vous êtes étudiant ou formez des étudiants |
| **12a** | `12a-student-catalog.md` | **Catalogue détaillé** : fiches complètes des 54 services étudiants (tarifs, durée, vérification, notes) | vous voulez les détails d'un service spécifique |
| **12b** | `12b-student-africa.md` | **Focus Afrique** : éligibilité par pays (Bénin, Côte d'Ivoire, Sénégal, Togo, Burkina Faso, Cameroun, Nigeria, Ghana, Kenya, Afrique du Sud) | vous êtes dans un pays africain |

**Annexes** : 
- `catalogue-dri.csv` — 177 ressources consolidées (nature, Tier, famille, URL, classe de licence, méthode de récupération, AI-readiness, réutilisabilité, techno, preuve, note)
- `catalogue-student.csv` — 54 services étudiants (catégorie, prix standard/étudiant, réduction, durée, vérification, éligibilité Bénin, URLs, notes)

---


---

## Extension : Projet HarnAI (Harness IA)

| Doc | Fichier | Contenu | À lire si… |
|---|---|---|---|
| **MOC** | `harnai-moc.md` | Map of Content HarnAI — point d'entrée du projet | vous découvrez HarnAI |
| **13** | `13-harnai/13-harnai-overview.md` | Vue d'ensemble : méthodologie, 7 familles, 28 outils | vous découvrez le projet |
| **13a** | `13-harnai/13a-harnai-catalog.md` | Catalogue complet des 28 outils (fiches courtes) | vous cherchez un outil spécifique |
| **13b** | `13-harnai/13b-harnai-mcp.md` | Focus MCP : compatibilité, création, registries | vous automatisez avec MCP |
| **13c** | `13-harnai/13c-harnai-asia.md` | Focus écosystèmes asiatiques (Chine, Japon, Corée, Inde) | vous explorez l'Asie |
| **13d** | `13-harnai/13d-harnai-comparisons.md` | Comparaisons par catégorie, Top 10, benchmarks | vous comparez des outils |
| **14** | `14-harnai-recommendations.md` | Recommandations pour créer votre MCP custom | vous voulez des conseils |
| **15** | `15-harnai-custom-mcp.md` | Guide complet de création de votre MCP custom | vous implémentez votre MCP |

**Annexe HarnAI** :
- `catalogue-harnai.csv` — 28 outils (nom, repo, famille, score, stars, MCP, scraping, memory, skills, etc.)
- `data/harnai/` — Données JSON brutes (fiches, analyses MCP, écosystèmes asiatiques)

**Connexions** : HarnAI complète le DRI principal — voir [[06-ai-resource-map]] §6.2 (MCP), [[09-resource-stack]] (stacks), [[12-student-plans]] (plans étudiants).

## Labels de confiance (utilisés partout)

| Label | Sens |
|---|---|
| **[API-gh]** | métadonnée GitHub lue le 5 oct. 2026 (étoiles, licence SPDX, dernière poussée) |
| **[API-npm]** | téléchargements npm du mois écoulé (2026-09-05 → 2026-10-04) |
| **[V]** | URL vérifiée HTTP 200 le 5 oct. 2026 |
| **[V⚠]** | site vivant mais protégé anti-bot (403/429) — non vérifié par script |
| **[S]** | vérifié en phase 1 (`cartographie-creation-numerique.md`) |
| **[W]** | source Web 2026 citée |
| **[?]** | **à vérifier à la source** — jamais présenté comme un fait |

## Règles permanentes appliquées
- Aucune ressource inventée ; aucun prix, licence ou compteur affirmé sans source.
- « Accessible gratuitement » ≠ « libre d'usage commercial ».
- Aucune exhaustivité revendiquée : **« Catalogue partiellement accessible avec les outils disponibles »**.
- Tier C (pépites) traité comme un livrable, pas comme un reste.
- Un code généré par IA n'est jamais présenté comme garanti fonctionnel.

## Base de preuves (workspace)
`data/gh/gh_search.json` (1 164 dépôts) · `data/gh_repos_direct.json` (50 dépôts) · `data/npm_downloads.json` (164 packages) · `data/npm_search.json` · `data/url_status.json` (**464 URLs en 200**) · `data/urls_to_check*.txt` · `gh_search.py`, `npm_probe.py` (relançables).
