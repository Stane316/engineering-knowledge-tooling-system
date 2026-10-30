# SPRINT-21-03 — Effets, isolation et attaque contrôlée

**Sprint parent :** [SPRINT-21](SPRINT-21.md) · **Statut :** 📄 décomposition validée, contenu à vérifier avant exécution ; ⏳ implémentation non commencée · **Durée :** non engagée.

## 1. Objectif, exigences et prérequis

**Objectif :** Mesurer l’état métier après préparation, puis les appels autorisés et refusés ; distinguer WAL/SHM et écritures techniques des mutations métier.

**Exigences :** P03, O01. **Critères et seuils applicables :** C-P05, C-P06, C-P07, C-O01, avec détails et dénominateurs dans [22](../../../../audit/produit/22_CRITERES_ET_TESTS_MVP4.md). Feu vert du sprint couvrant ce sous-sprint ; 21-02 terminé, critères et rapport vérifiés ; résoudre toute divergence avant de continuer. Les résultats historiques ne valent pas preuve pour ces nouveaux critères.

## 2. Fichiers à auditer

Chemins existants à la référence, **inspection prévue, modification non présumée** :

- `src/mcp/context.ts`
- `src/templates/template-service.ts`
- `src/mcp/utils/logger.ts`
- `tests/mcp/context.test.ts`
- `tests/mcp/integration/stdio.test.ts`
- `tests/templates`

Tout fichier nouveau de test, fixture ou implémentation doit être proposé après inspection ; aucun chemin hypothétique n'est présenté comme existant. Respecter la configuration effective et les contrats actuels.

## 3. Tâches et architecture

Mesurer l’état métier après préparation, puis les appels autorisés et refusés ; distinguer WAL/SHM et écritures techniques des mutations métier. Définir contrôle hôte/OS, canaris fictifs, accès aux corrigés et réseau ; conditionner tout scénario agent hostile à autorisation distincte, exposition vérifiée et trace observable. Ne pas interpréter le profil MCP comme sandbox.

Avant choix de conception, vérifier type et provenance des données, frontières entre composants, effets d'entrée/sortie et consommateurs. Indiquer la procédure de migration/reprise ou l'absence de migration lorsque pertinent. Si une alternative ou une nouvelle dépendance dépasse le contrat validé, interrompre et soumettre à décision ; ne pas inventer d'ADR accepté.

## 4. Tests à définir et mettre en place avant le code

U/I : états métier, seed et politique de réseau avec doubles ; E2E : refus hôte/OS et canari en environnement explicitement approuvé ; CI : simuler les contrôles portables, marquer les vérifications réelles bloquées si plateforme absente. C-P07 non exposé ou non observable n’est pas réussi.

## Principe directeur : tests avant code

La rédaction de ce dossier n'autorise **aucune exécution, modification de tests ou code, commit, push, PR, publication ou visite**. Après feu vert distinct de développement : pour **chaque sous-sprint**, définir tous les cas et oracles U/I/E2E et leur raccordement CI avant le code fonctionnel ; mettre en place les tests et la configuration de CI nécessaires d'abord ; exécuter la baseline isolée et conserver les résultats. Un test de régression RED doit échouer pour le **comportement attendu**, avec message/assertion identifiable : erreur d'import, fixture cassée ou environnement manquant ne constituent pas une preuve RED. Les cas déjà conformes peuvent être GREEN et doivent le rester. Les cas E2E ou CI impossibles à exécuter faute d'environnement/autorisation sont **bloqués**, sans les désactiver ni prétendre qu'ils passent ; demander décision avant de clôturer. Ne pas écrire des tests a posteriori pour épouser l'implémentation.

Utiliser exclusivement des fixtures fictives, bases temporaires isolées et canaris non secrets ; aucun site ou fournisseur externe par défaut. Conserver les mêmes assertions pendant RED → correction minimale → GREEN ; une modification de l'oracle requiert justification et accord, non contournement. Rejouer les tests ciblés puis les régressions pertinentes. `npm run verify` existe à la référence : il ne prouve pas à lui seul tous les E2E ni la CI distante. Tests Windows, navigateurs, PDF ou isolation requièrent leurs prérequis effectifs ; une étape ignorée n'est pas réussie.

### Si l'hôte ou l'exposition manquent

La préparation des tests locaux ne remplace pas les essais réels `C-P06/C-P07`. Les noter `bloqué` ou `indéterminé` ; ne pas clôturer le sous-sprint comme réussi ni valider G1. Avec l'accord explicite du propriétaire, leur vérification peut être suivie au Sprint 24 après préparation et autorisation de G0, tandis qu'un chantier indépendant est poursuivi avec réserves ; sans cet accord, arrêter. Un commit partiel éventuel ne constitue pas une clôture.

## 5. Séquence opérationnelle future

1. Vérifier autorisations, prérequis, version et état Git ; lire les sources. Choisir une base temporaire isolée et préparer la traçabilité.
2. Avant tout changement fonctionnel, formaliser les cas positifs, négatifs, limites, effets interdits et dénominateurs ; préparer tests unitaires, intégration, E2E et raccordement CI applicables. Faire constater le RED comportemental ou le GREEN initial et noter les blocages d'environnement.
3. Après feu vert opérationnel nécessaire, modifier le minimum permettant de satisfaire les mêmes assertions ; documenter tout écart et arrêter si risque ou changement de contrat non approuvé.
4. Rejouer tests et régressions, relever commandes exactes, statut, dates, versions, fichiers et preuves ; aucun fournisseur ou réseau externe non autorisé.
5. Si tous les critères de ce sous-sprint sont satisfaits et les commits couverts par l'autorisation : produire `SPRINT-21-03-RESULTAT.md`, préparer le registre sans inventer le hash à venir et faire un commit local atomique limité au travail autorisé. Relever ensuite son hash réel et le consigner au registre dans un commit documentaire distinct si nécessaire. Sinon rapporter `bloqué` et demander arbitrage. Aucune PR ni push.

## 6. Risques et critères de fin

**Risque et mitigation :** Une annotation ou un filtre d’outils ne restreint ni fichiers ni réseau de l’agent. G1 ne passe pas si un critère M applicable est bloqué.

**Clôture :** tous les critères C-P05, C-P06, C-P07, C-O01 applicables sont vérifiés selon 22 et rattachés à une preuve ; les quatre niveaux de tests sont préparés avant code, exécutés lorsque possible et tout blocage remonté ; aucune divergence de sécurité non résolue ; compatibilité et documentation vérifiées ; rapport factuel et validation humaine aux points requis. Un cas sauté ou non observable n'est pas un succès. Ne pas annoncer la réussite complète du sprint parent avant ses trois sous-sprints.
