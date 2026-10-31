# SPRINT-23-01 — Événements et citations observables

**Sprint parent :** [SPRINT-23](SPRINT-23.md) · **Statut :** ✅ **exécuté le 31/10/2026 — C-T01 et C-T02 satisfaits, limites déclarées. Résultat : [SPRINT-23-01-RESULTAT](SPRINT-23-01-RESULTAT.md)**

## 1. Objectif, exigences et prérequis

**Objectif :** Enregistrer ou rapprocher au niveau observable cinq événements : FTS, lecture, zéro résultat, erreur et refus, avec session, outil/mode, statut et version pertinente.

**Exigences :** T01, T02. **Critères et seuils applicables :** C-T01, C-T02, avec détails et dénominateurs dans [22](../../../../audit/produit/22_CRITERES_ET_TESTS_MVP4.md). Feu vert distinct de développement, parent et références lus ; état du dépôt et prérequis du sprint vérifiés. Les résultats historiques ne valent pas preuve pour ces nouveaux critères.

## 2. Fichiers à auditer

Chemins existants à la référence, **inspection prévue, modification non présumée** :

- `src/mcp/handlers/tools.ts`
- `src/mcp/utils/logger.ts`
- `src/mcp/transport.ts`
- `tests/mcp/handlers/tools.test.ts`
- `tests/mcp/utils/logger.test.ts`
- `tests/mcp/integration/stdio.test.ts`

Tout fichier nouveau de test, fixture ou implémentation doit être proposé après inspection ; aucun chemin hypothétique n'est présenté comme existant. Respecter la configuration effective et les contrats actuels.

## 3. Tâches et architecture

Enregistrer ou rapprocher au niveau observable cinq événements : FTS, lecture, zéro résultat, erreur et refus, avec session, outil/mode, statut et version pertinente. Qualifier quatre cas de citation : vérifiée, non corroborée, version incompatible, indéterminée. Une sortie FTS peut déjà contenir le texte ; ne pas exiger get_resource artificiellement.

Avant choix de conception, vérifier type et provenance des données, frontières entre composants, effets d'entrée/sortie et consommateurs. Indiquer la procédure de migration/reprise ou l'absence de migration lorsque pertinent. Si une alternative ou une nouvelle dépendance dépasse le contrat validé, interrompre et soumettre à décision ; ne pas inventer d'ADR accepté.

## 4. Tests à définir et mettre en place avant le code

U : règles de qualification des quatre cas ; I : cinq événements locaux sur base synthétique ; E2E : séquence stdio et rapprochement indépendant des preuves ; CI : traces fictives minimisées. Ne jamais affirmer transmission au modèle sans observation de cette couche.

## Principe directeur : tests avant code

La rédaction de ce dossier n'autorise **aucune exécution, modification de tests ou code, commit, push, PR, publication ou visite**. Après feu vert distinct de développement : pour **chaque sous-sprint**, définir tous les cas et oracles U/I/E2E et leur raccordement CI avant le code fonctionnel ; mettre en place les tests et la configuration de CI nécessaires d'abord ; exécuter la baseline isolée et conserver les résultats. Un test de régression RED doit échouer pour le **comportement attendu**, avec message/assertion identifiable : erreur d'import, fixture cassée ou environnement manquant ne constituent pas une preuve RED. Les cas déjà conformes peuvent être GREEN et doivent le rester. Les cas E2E ou CI impossibles à exécuter faute d'environnement/autorisation sont **bloqués**, sans les désactiver ni prétendre qu'ils passent ; demander décision avant de clôturer. Ne pas écrire des tests a posteriori pour épouser l'implémentation.

Utiliser exclusivement des fixtures fictives, bases temporaires isolées et canaris non secrets ; aucun site ou fournisseur externe par défaut. Conserver les mêmes assertions pendant RED → correction minimale → GREEN ; une modification de l'oracle requiert justification et accord, non contournement. Rejouer les tests ciblés puis les régressions pertinentes. `npm run verify` existe à la référence : il ne prouve pas à lui seul tous les E2E ni la CI distante. Tests Windows, navigateurs, PDF ou isolation requièrent leurs prérequis effectifs ; une étape ignorée n'est pas réussie.

## 5. Séquence opérationnelle future

1. Vérifier autorisations, prérequis, version et état Git ; lire les sources. Choisir une base temporaire isolée et préparer la traçabilité.
2. Avant tout changement fonctionnel, formaliser les cas positifs, négatifs, limites, effets interdits et dénominateurs ; préparer tests unitaires, intégration, E2E et raccordement CI applicables. Faire constater le RED comportemental ou le GREEN initial et noter les blocages d'environnement.
3. Après feu vert opérationnel nécessaire, modifier le minimum permettant de satisfaire les mêmes assertions ; documenter tout écart et arrêter si risque ou changement de contrat non approuvé.
4. Rejouer tests et régressions, relever commandes exactes, statut, dates, versions, fichiers et preuves ; aucun fournisseur ou réseau externe non autorisé.
5. Si tous les critères de ce sous-sprint sont satisfaits et les commits couverts par l'autorisation : produire `SPRINT-23-01-RESULTAT.md`, préparer le registre sans inventer le hash à venir et faire un commit local atomique limité au travail autorisé. Relever ensuite son hash réel et le consigner au registre dans un commit documentaire distinct si nécessaire. Sinon rapporter `bloqué` et demander arbitrage. Aucune PR ni push.

## 6. Risques et critères de fin

**Risque et mitigation :** Un journal d’appel ne démontre pas la réception par le modèle ou son raisonnement ; marquer cette frontière explicitement.

**Clôture :** tous les critères C-T01, C-T02 applicables sont vérifiés selon 22 et rattachés à une preuve ; les quatre niveaux de tests sont préparés avant code, exécutés lorsque possible et tout blocage remonté ; aucune divergence de sécurité non résolue ; compatibilité et documentation vérifiées ; rapport factuel et validation humaine aux points requis. Un cas sauté ou non observable n'est pas un succès. Ne pas annoncer la réussite complète du sprint parent avant ses trois sous-sprints.
