# SPRINT-24-02 — Préparation G0 et scénario facultatif

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Statut :** ⚠️ **exécuté le 31/10/2026 — dossier G0 constitué, G0 FERMÉE (5 champs manquants), C-T04/T05/T06 bloqués. Résultat : [SPRINT-24-02-RESULTAT](SPRINT-24-02-RESULTAT.md)**

## 1. Objectif, exigences et prérequis

**Objectif :** Constituer uniquement le dossier préparatoire : choisir ou laisser bloqués machine, modèle, fournisseur, budget, rétention, contrôle hôte/OS, droits et validation du corpus.

**Exigences :** T04, P03. **Critères et seuils applicables :** C-T04, C-T05, C-T06, C-P06, C-P07, avec détails et dénominateurs dans [22](../../../../audit/produit/22_CRITERES_ET_TESTS_MVP4.md). Feu vert du sprint couvrant ce sous-sprint ; 24-01 terminé, critères et rapport vérifiés ; résoudre toute divergence avant de continuer. Les résultats historiques ne valent pas preuve pour ces nouveaux critères.

## 2. Fichiers à auditer

Chemins existants à la référence, **inspection prévue, modification non présumée** :

- `docs/audit/produit/19_SCENARIO_COMPARATIF_AGENT_EKTS.md`
- `docs/audit/produit/22_CRITERES_ET_TESTS_MVP4.md`
- `docs/audit/produit/scenario-comparatif/manifeste-corpus.json`

Tout fichier nouveau de test, fixture ou implémentation doit être proposé après inspection ; aucun chemin hypothétique n'est présenté comme existant. Respecter la configuration effective et les contrats actuels.

## 3. Tâches et architecture

Constituer uniquement le dossier préparatoire : choisir ou laisser bloqués machine, modèle, fournisseur, budget, rétention, contrôle hôte/OS, droits et validation du corpus. Préparer sorties et barème figés A/C/B, tests négatifs, règles de visibilité et d’injection ; n’exécuter aucune session agent avant une autorisation explicite distincte et G0 documenté.

Avant choix de conception, vérifier type et provenance des données, frontières entre composants, effets d'entrée/sortie et consommateurs. Indiquer la procédure de migration/reprise ou l'absence de migration lorsque pertinent. Si une alternative ou une nouvelle dépendance dépasse le contrat validé, interrompre et soumettre à décision ; ne pas inventer d'ADR accepté.

## 4. Tests à définir et mettre en place avant le code

U/I : valider l’intégrité et les tableaux sur fixtures fictives ; E2E de pilote uniquement sous autorisation G0 ; CI : contrôles locaux sans modèle externe. Si exécuté : 27 T01–T03, 12 T04/T06, 3 T05 maximum ; rapporter exposés/non exposés, 0 citation inventée et moyenne B ≥ 80 sans prétendre gain B−C.

## Principe directeur : tests avant code

La rédaction de ce dossier n'autorise **aucune exécution, modification de tests ou code, commit, push, PR, publication ou visite**. Après feu vert distinct de développement : pour **chaque sous-sprint**, définir tous les cas et oracles U/I/E2E et leur raccordement CI avant le code fonctionnel ; mettre en place les tests et la configuration de CI nécessaires d'abord ; exécuter la baseline isolée et conserver les résultats. Un test de régression RED doit échouer pour le **comportement attendu**, avec message/assertion identifiable : erreur d'import, fixture cassée ou environnement manquant ne constituent pas une preuve RED. Les cas déjà conformes peuvent être GREEN et doivent le rester. Les cas E2E ou CI impossibles à exécuter faute d'environnement/autorisation sont **bloqués**, sans les désactiver ni prétendre qu'ils passent ; demander décision avant de clôturer. Ne pas écrire des tests a posteriori pour épouser l'implémentation.

Utiliser exclusivement des fixtures fictives, bases temporaires isolées et canaris non secrets ; aucun site ou fournisseur externe par défaut. Conserver les mêmes assertions pendant RED → correction minimale → GREEN ; une modification de l'oracle requiert justification et accord, non contournement. Rejouer les tests ciblés puis les régressions pertinentes. `npm run verify` existe à la référence : il ne prouve pas à lui seul tous les E2E ni la CI distante. Tests Windows, navigateurs, PDF ou isolation requièrent leurs prérequis effectifs ; une étape ignorée n'est pas réussie.

## 5. Séquence opérationnelle future

1. Vérifier autorisations, prérequis, version et état Git ; lire les sources. Choisir une base temporaire isolée et préparer la traçabilité.
2. Avant tout changement fonctionnel, formaliser les cas positifs, négatifs, limites, effets interdits et dénominateurs ; préparer tests unitaires, intégration, E2E et raccordement CI applicables. Faire constater le RED comportemental ou le GREEN initial et noter les blocages d'environnement.
3. Après feu vert opérationnel nécessaire, modifier le minimum permettant de satisfaire les mêmes assertions ; documenter tout écart et arrêter si risque ou changement de contrat non approuvé.
4. Rejouer tests et régressions, relever commandes exactes, statut, dates, versions, fichiers et preuves ; aucun fournisseur ou réseau externe non autorisé.
5. Si tous les critères de ce sous-sprint sont satisfaits et les commits couverts par l'autorisation : produire `SPRINT-24-02-RESULTAT.md`, préparer le registre sans inventer le hash à venir et faire un commit local atomique limité au travail autorisé. Relever ensuite son hash réel et le consigner au registre dans un commit documentaire distinct si nécessaire. Sinon rapporter `bloqué` et demander arbitrage. Aucune PR ni push.

## 6. Risques et critères de fin

**Risque et mitigation :** La comparaison peut être bloquée ou négative. Ne pas tester le site réel ni transmettre ses rapports sans consentement et autorisation distincts ; aucun modèle ni dépense implicites.

**Clôture :** tous les critères C-T04, C-T05, C-T06, C-P06, C-P07 applicables sont vérifiés selon 22 et rattachés à une preuve ; les quatre niveaux de tests sont préparés avant code, exécutés lorsque possible et tout blocage remonté ; aucune divergence de sécurité non résolue ; compatibilité et documentation vérifiées ; rapport factuel et validation humaine aux points requis. Un cas sauté ou non observable n'est pas un succès. Ne pas annoncer la réussite complète du sprint parent avant ses trois sous-sprints.
