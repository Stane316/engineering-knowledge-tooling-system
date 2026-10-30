# 13 — Analyse du rapport web transmis par l'utilisateur

**Date d'analyse :** 29 octobre 2026 · **Statut :** analyse documentaire et statique, non reproduction de l'audit.  
**Rapport source :** `/home/user/uploads/audit-1-2026-10-28T23-59-31-484Z.md`, SHA-256 `9b315eadfeb222c53db9289a16898c4e50711062241decaa7994ee3b4c2902db`.  
**Site :** https://www.simeonamoussou.com/ · **Révision de code de comparaison :** `c0610ae9825808bf88a309513bbdc00e2bc7e367` (`develop` cloné). La correspondance avec le commit ayant généré le rapport n'est pas établie.

## 1. Nature des preuves

- **[RAPPORT]** Le fichier fourni est un rapport Markdown, daté `2026-10-28 23:59 UTC`, audit `#1`. Sa lecture prouve son contenu, pas la validité des mesures ni la version du logiciel qui l'a produit.
- **[CODE]** Lecture du code cité, pas d'exécution de ce code sur l'audit.
- **[SITE]** Une consultation non intrusive de la page publique le 29 octobre a renvoyé du contenu descriptif, notamment un portfolio et des services. Elle ne constitue ni une inspection de navigateur contrôlée, ni une preuve de l'état exact au moment de l'audit, ni une vérification des violations ou performances.
- **[MANQUANT]** Sorties Lighthouse et axe complètes, nombres de nœuds, captures, configuration, navigateur, version d'EKTS et environnement de l'essai. Aucun nouveau score n'a été mesuré. Node 20.20.2/npm 10.8.2 dans la sandbox sont inférieurs aux exigences du `package.json` ; aucune reproduction n'a été présentée comme exécutée.

## 2. Résultats contenus dans le fichier

| Indicateur | Rapport transmis | Interprétation établie |
|---|---:|---|
| Performance | 71/100 | Score affiché ; le premier signalement mentionnait 10, qui n'est **pas** la valeur de ce fichier. D'autres essais peuvent exister, non fournis ici. |
| Accessibilité | 0/100 | Quatre types de constats affichés ; le fichier ne fournit ni nombres de nœuds ni pénalités exactes. |
| SEO | 100/100 | Zéro constat affiché, non une garantie de qualité SEO complète. |
| UX | 100/100 | Zéro constat affiché, non une validation complète des parcours. |
| Contenu | 70/100 | Deux constats : contenu insuffisant et lisibilité faible. |
| Global | 63/100 | Cohérent arithmétiquement avec les poids de `AnalysisPipeline` : `round(71×0,25 + 0×0,25 + 100×0,20 + 100×0,15 + 70×0,15) = round(63,25) = 63`. Cohérence de l'addition ≠ validité des composantes. |
| Priorités | Résumé : 0 critiques, **4 hautes**, **3 moyennes**, 0 basses ; détails : **5 hautes**, **2 moyennes** | **Contradiction certaine dans le document** ; les deux sommes valent sept mais les catégories ne concordent pas. |

Le texte est **mixte** : structure majoritairement française, mais priorités et les quatre libellés/recommandations axe en anglais. Il serait inexact de dire que toutes les sections sont en anglais.

## 3. Pourquoi les priorités peuvent diverger

**[CODE]** [`AnalysisPipeline`](../../../src/analysis/pipeline.ts) calcule `priorityFindings` à partir des constats originaux, calcule les compteurs du résumé sur cette liste recalculée, mais renvoie aussi `findings: allFindings`. [`FindingPrioritizer`](../../../src/analysis/prioritizer.ts) crée de nouveaux objets, sans modifier les originaux. [`AuditRepository.store`](../../../src/storage/audit-repository.ts) stocke les compteurs du résumé et les priorités de `report.findings`, c'est-à-dire les originales. Le [template Markdown](../../../src/reports/templates/markdown.ts) affiche les compteurs stockés d'un côté et regroupe les constats stockés par priorité de l'autre.

**[DÉDUCTION VÉRIFIABLE STATIQUEMENT]** Pour le constat « Contenu insuffisant », le [code](../../../src/analysis/content.ts) attribue `severity=3`, `effort=3`, priorité originale `high`. La [matrice](../../../src/analysis/severity.ts) recalcule `3 × (6 − 3) = 9`, donc `medium` (seuil `high` : 12). La double représentation est une cause plausible et précisément cohérente avec la différence d'un constat entre les deux répartitions. **Le lien causal pour cet audit précis reste à confirmer** car sa version et ses données sources ne sont pas connues. Un test de non-régression doit vérifier que résumé, listes, stockage et exports utilisent une même décision canonique, y compris la catégorie `info`.

Le « top 5 » suit encore un autre tri (`severity × impact × 10 − effort`) dans le template, et pas directement le regroupement par priorité. Cela explique pourquoi sa première recommandation peut venir d'un constat classé `MEDIUM` ; le classement n'est pas expliqué au lecteur. Cela ne prouve pas, à lui seul, qu'il est incorrect.

## 4. Valeur et limites des conclusions de cet audit

### Accessibilité à 0

[`scoreViolations`](../../../src/browser/axe.ts) additionne, pour chaque type, `poids impact × max(1, nombre de nœuds)` avec poids 1/3/5/10, puis calcule `max(0, 100 − pénalité)`. Un zéro peut donc résulter d'une pénalité cumulée ≥100 ; quatre constats désignent quatre types, pas nécessairement quatre éléments. **Sans résultats axe et nœuds, impossible de vérifier le calcul pour ce site ou d'infirmer les problèmes remontés.** Les quatre catégories — contraste, noms accessibles, SVG, taille des cibles — justifient une vérification manuelle ciblée et contextualisée, non une conclusion globale automatique de non-conformité.

### SEO et UX à 100

Le SEO provient de la catégorie Lighthouse sélectionnée, pas d'une analyse exhaustive de référencement. L'UX est un indicateur limité aux signaux DOM de [`analyseUx`](../../../src/browser/inspection/ux.ts), sans parcours utilisateur complet. `100` signifie absence des problèmes retenus par cette méthode, pas qualité parfaite du site.

### Performance et FID

Le rapport signale « First Input Delay à améliorer » sans exposer la valeur, le type de mesure ou ses conditions. Le [code actuel](../../../src/browser/lighthouse.ts) privilégie une valeur INP si présente puis `max-potential-fid`, et l'[adaptateur](../../../src/analysis/adapter.ts) la transmet sous `fid` à l'[analyseur](../../../src/analysis/performance.ts). Ces grandeurs ne sont pas équivalentes : le libellé rapporté et l'interprétation doivent être vérifiés avec les données brutes et la version utilisée, sans conclure à une métrique précise pour cet essai.

### Contenu

Le rapport conseille de viser 600 mots « pour un article de blog » alors que le site consulté se présente comme un portfolio. La [règle](../../../src/analysis/content.ts) applique cette formulation à une quantité sous 300 mots ; l'adéquation à ce type de page est donc discutable. Le nombre de mots effectivement observé n'est pas affiché. Le [snapshot](../../../src/browser/inspection/snapshot.ts) limite le texte à 20 000 caractères ; l'état, la temporalité, la visibilité et les animations de la page peuvent affecter l'observation — effets non mesurés ici. La formule de lisibilité française est une approximation, pas un jugement de pertinence éditoriale.

### Explication et diagnostic

Le fichier énumère les intitulés et recommandations, mais ne contient pas les sélecteurs, extraits de nœuds, valeurs chiffrées et seuils, conditions d'essai, liens et limites nécessaires à une correction vérifiable. [`AuditRepository`](../../../src/storage/audit-repository.ts) conserve titre, description, gravité, effort, impact, priorité et recommandation ; la conversion lue ne persiste pas l'objet métrique ni les références du `Finding`. Le template Markdown affiche principalement les titres. La perte ou non de chaque détail dans d'autres supports n'a pas été entièrement cartographiée.

### Français et nommage

Les [constats axe](../../../src/analysis/accessibility.ts) réutilisent `description` et `help` reçus, et le [template](../../../src/reports/templates/markdown.ts) les imprime sans traduction ; cela correspond aux phrases anglaises présentes, sans preuve autonome de la chaîne d'exécution exacte du fichier. Il faut un rendu en français incluant les contenus externes et un moyen de conserver le texte original et les liens, sans traduction trompeuse.

La CLI [`inspect <url>`](../../../src/cli/commands/inspect.ts) ne demande aucun nom de rapport et le titre Markdown inclut l'URL. L'interface qui a demandé nom du site et nom du rapport reste à identifier. Proposer un titre automatique cohérent à partir du nom choisi ou, à défaut, du domaine, avec option de modification seulement si elle répond au parcours réel.

## 5. Reproduction et critères d'amélioration proposés

Avant de modifier le produit, préparer une reproduction sur le site autorisé et sur des fixtures synthétiques :

1. Relever commit/version, méthode de lancement, date, URL finale, navigateur, viewport, réseau, état des consentements et options Lighthouse/axe ; conserver les avertissements et résultats bruts sans secrets ni données personnelles.
2. Comparer les catégories Lighthouse brutes aux scores EKTS ; distinguer absence, échec et valeur réellement nulle ; répéter les mesures et documenter leur variabilité.
3. Vérifier pour axe les règles, impacts, nombre d'éléments et calcul exact ; contrôler des exemples dans le navigateur et noter les tests manuels non couverts.
4. Reproduire les signaux UX et les métriques de contenu sur le DOM effectivement mesuré ; évaluer le contexte portfolio plutôt que supposer un article.
5. Vérifier les sept constats, les deux répartitions et le top 5 à toutes les étapes ; ajouter des cas de tests où les priorités originales et recalculées diffèrent.
6. Contrôler les erreurs d'outils et les champs absents, rapports français, conservation de la provenance, nommage automatique et stabilité des anciens audits.

Ces points constituent des critères candidats, pas une modification autorisée ni un classement final P0/P1. La fiabilité est prioritaire avant tout enrichissement superficiel. Le module peut devenir une capacité réutilisable parmi d'autres ; sa place dans MVP-4 reste à arbitrer après choix du scénario de référence.
