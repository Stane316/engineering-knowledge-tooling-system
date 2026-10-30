# SPRINT-21-01 — Inventaire et exposition du profil

**Sprint parent :** [SPRINT-21](SPRINT-21.md) · **Statut :** 📄 décomposition validée, contenu à vérifier avant exécution ; ⏳ implémentation non commencée · **Durée :** non engagée.

## 1. Objectif, exigences et prérequis

**Objectif :** Inventorier les outils et leurs effets réels à la version candidate : 17 observés à la référence, chiffre à vérifier.

**Exigences :** P01, P02. **Critères et seuils applicables :** C-P01, C-P04, avec détails et dénominateurs dans [22](../../../../audit/produit/22_CRITERES_ET_TESTS_MVP4.md). Feu vert distinct de développement, parent et références lus ; état du dépôt et prérequis du sprint vérifiés. Les résultats historiques ne valent pas preuve pour ces nouveaux critères.

## 2. Fichiers à auditer

Chemins existants à la référence, **inspection prévue, modification non présumée** :

- `src/mcp/server.ts`
- `src/mcp/handlers/tools.ts`
- `src/mcp/context.ts`
- `src/mcp/schemas/tool-schemas.ts`
- `tests/mcp/server.test.ts`
- `tests/mcp/handlers/tools.test.ts`
- `tests/mcp/integration/stdio.test.ts`

Tout fichier nouveau de test, fixture ou implémentation doit être proposé après inspection ; aucun chemin hypothétique n'est présenté comme existant. Respecter la configuration effective et les contrats actuels.

## 3. Tâches et architecture

Inventorier les outils et leurs effets réels à la version candidate : 17 observés à la référence, chiffre à vérifier. Établir un profil déclaratif séparé du profil historique ; exposer uniquement search_knowledge, get_resource, list_resources ; configuration absente, illisible, malformée ou profil inconnu : refuser avant exposition/action, sans bascule silencieuse. Ne pas déduire sécurité de readOnlyHint.

Avant choix de conception, vérifier type et provenance des données, frontières entre composants, effets d'entrée/sortie et consommateurs. Indiquer la procédure de migration/reprise ou l'absence de migration lorsque pertinent. Si une alternative ou une nouvelle dépendance dépasse le contrat validé, interrompre et soumettre à décision ; ne pas inventer d'ADR accepté.

## 4. Tests à définir et mettre en place avant le code

U : politique et quatre cas d’échec fermé ; I : tools/list et initialisation du serveur ; E2E : client JSON-RPC stdio réel sur base isolée ; CI : jobs locaux sans fournisseur. Vérifier la compatibilité du profil historique explicitement, sans faire du refus global une réussite.

## Principe directeur : tests avant code

La rédaction de ce dossier n'autorise **aucune exécution, modification de tests ou code, commit, push, PR, publication ou visite**. Après feu vert distinct de développement : pour **chaque sous-sprint**, définir tous les cas et oracles U/I/E2E et leur raccordement CI avant le code fonctionnel ; mettre en place les tests et la configuration de CI nécessaires d'abord ; exécuter la baseline isolée et conserver les résultats. Un test de régression RED doit échouer pour le **comportement attendu**, avec message/assertion identifiable : erreur d'import, fixture cassée ou environnement manquant ne constituent pas une preuve RED. Les cas déjà conformes peuvent être GREEN et doivent le rester. Les cas E2E ou CI impossibles à exécuter faute d'environnement/autorisation sont **bloqués**, sans les désactiver ni prétendre qu'ils passent ; demander décision avant de clôturer. Ne pas écrire des tests a posteriori pour épouser l'implémentation.

Utiliser exclusivement des fixtures fictives, bases temporaires isolées et canaris non secrets ; aucun site ou fournisseur externe par défaut. Conserver les mêmes assertions pendant RED → correction minimale → GREEN ; une modification de l'oracle requiert justification et accord, non contournement. Rejouer les tests ciblés puis les régressions pertinentes. `npm run verify` existe à la référence : il ne prouve pas à lui seul tous les E2E ni la CI distante. Tests Windows, navigateurs, PDF ou isolation requièrent leurs prérequis effectifs ; une étape ignorée n'est pas réussie.

## 5. Séquence opérationnelle future

1. Vérifier autorisations, prérequis, version et état Git ; lire les sources. Choisir une base temporaire isolée et préparer la traçabilité.
2. Avant tout changement fonctionnel, formaliser les cas positifs, négatifs, limites, effets interdits et dénominateurs ; préparer tests unitaires, intégration, E2E et raccordement CI applicables. Faire constater le RED comportemental ou le GREEN initial et noter les blocages d'environnement.
3. Après feu vert opérationnel nécessaire, modifier le minimum permettant de satisfaire les mêmes assertions ; documenter tout écart et arrêter si risque ou changement de contrat non approuvé.
4. Rejouer tests et régressions, relever commandes exactes, statut, dates, versions, fichiers et preuves ; aucun fournisseur ou réseau externe non autorisé.
5. Si tous les critères de ce sous-sprint sont satisfaits et les commits couverts par l'autorisation : produire `SPRINT-21-01-RESULTAT.md`, préparer le registre sans inventer le hash à venir et faire un commit local atomique limité au travail autorisé. Relever ensuite son hash réel et le consigner au registre dans un commit documentaire distinct si nécessaire. Sinon rapporter `bloqué` et demander arbitrage. Aucune PR ni push.

## 6. Risques et critères de fin

**Risque et mitigation :** Un profil appliqué à la découverte seulement n’empêche pas les appels directs. L’initialisation des templates peut écrire avant tout appel ; le mesurer séparément.

**Clôture :** tous les critères C-P01, C-P04 applicables sont vérifiés selon 22 et rattachés à une preuve ; les quatre niveaux de tests sont préparés avant code, exécutés lorsque possible et tout blocage remonté ; aucune divergence de sécurité non résolue ; compatibilité et documentation vérifiées ; rapport factuel et validation humaine aux points requis. Un cas sauté ou non observable n'est pas un succès. Ne pas annoncer la réussite complète du sprint parent avant ses trois sous-sprints.
