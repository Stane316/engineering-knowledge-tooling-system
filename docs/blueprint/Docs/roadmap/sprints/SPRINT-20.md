# SPRINT-20 — Fiabilité des métriques, preuves et sécurité web

**MVP :** MVP-4 · **Lot roadmap :** L0-W · **Date de rédaction :** 30 octobre 2026  
**Statut documentaire :** 📄 rédigé ; décomposition 19–24 validée par le propriétaire, détail à vérifier avant exécution · **Implémentation :** ⏳ non commencée · **Durée :** non estimée, non engagée.

## 1. Contexte, objectif et périmètre

Rendre les métriques traçables, les sorties sûres et les échecs partiels récupérables, sur des cibles autorisées.

Sources de décision : [roadmap officielle](../../../../ROADMAP.md), [spécification 21](../../../../audit/produit/21_SPECIFICATION_MVP4.md), [critères et méthodes 22](../../../../audit/produit/22_CRITERES_ET_TESTS_MVP4.md), [architecture 20](../../../../audit/produit/20_ARCHITECTURE_MINIMALE_MVP4.md). Ces exigences et seuils sont validés mais **aucun résultat nouveau n'est établi ici**. La collaboration distante, la marketplace, un client MCP sortant, des intégrations et l'exécution automatique de scripts sont hors périmètre minimal ; pas de fournisseur imposé.

**Prérequis :** Sprint 19 validé pour l’intégration séquentielle ; les protections réseau restent un chantier P0. Les cas indépendants peuvent être préparés en parallèle après autorisation.

## 2. Architecture et frontières

Les fichiers cités dans les sous-sprints sont des **points d'inspection existants à la révision `c0610ae`**, pas une liste définitive de fichiers à modifier. Vérifier dépendances, types, sérialisation, permissions, points d'entrée et consommateurs avant d'arrêter le design ; les nouveaux fichiers éventuels sont à proposer, pas réputés exister. La spécification détaillée et ses critères priment sur les résumés ci-dessous. Tout changement de contrat ou de stockage non couvert exige décision humaine et stratégie de compatibilité avant mise en œuvre.

## 3. Sous-sprints, dépendances et critères

| Sous-sprint | Objectif | Exigences | Critères de référence |
|---|---|---|---|
| [20-01](SPRINT-20-01.md) | Identité des métriques et interprétation | W04, W05 | C-W08, C-W10 |
| [20-02](SPRINT-20-02.md) | Preuves minimales et reprise partielle | W05, W06, O04 | C-W09, C-W11, C-W12 |
| [20-03](SPRINT-20-03.md) | Cibles contrôlées et rendus non exécutables | O06, W05 | C-W13, C-W14 |

Exécution séquentielle proposée 20-01 → 20-02 → 20-03 ; les dépendances réelles de chaque dossier sont à vérifier. Les critères référencés conservent leur méthode et leur dénominateur dans 22. Les sous-sprints ne deviennent pas terminés par la seule rédaction des fichiers.

## Principe directeur : tests avant code

La rédaction de ce dossier n'autorise **aucune exécution, modification de tests ou code, commit, push, PR, publication ou visite**. Après feu vert distinct de développement : pour **chaque sous-sprint**, définir tous les cas et oracles U/I/E2E et leur raccordement CI avant le code fonctionnel ; mettre en place les tests et la configuration de CI nécessaires d'abord ; exécuter la baseline isolée et conserver les résultats. Un test de régression RED doit échouer pour le **comportement attendu**, avec message/assertion identifiable : erreur d'import, fixture cassée ou environnement manquant ne constituent pas une preuve RED. Les cas déjà conformes peuvent être GREEN et doivent le rester. Les cas E2E ou CI impossibles à exécuter faute d'environnement/autorisation sont **bloqués**, sans les désactiver ni prétendre qu'ils passent ; demander décision avant de clôturer. Ne pas écrire des tests a posteriori pour épouser l'implémentation.

Utiliser exclusivement des fixtures fictives, bases temporaires isolées et canaris non secrets ; aucun site ou fournisseur externe par défaut. Conserver les mêmes assertions pendant RED → correction minimale → GREEN ; une modification de l'oracle requiert justification et accord, non contournement. Rejouer les tests ciblés puis les régressions pertinentes. `npm run verify` existe à la référence : il ne prouve pas à lui seul tous les E2E ni la CI distante. Tests Windows, navigateurs, PDF ou isolation requièrent leurs prérequis effectifs ; une étape ignorée n'est pas réussie.

## 5. Risques et points de décision

Les risques et mitigations détaillés figurent dans chaque sous-sprint. Arrêter si un contrat historique, un droit, une migration, un accès réseau ou l'observabilité est insuffisant ; noter `bloqué` et soumettre l'écart P3 au propriétaire. Les données anciennes ne sont jamais réécrites silencieusement. Aucun résultat non observable n'est déclaré réussi.

## 6. Livrables attendus après autorisation

- [SPRINT-20-01](SPRINT-20-01.md)
- [SPRINT-20-02](SPRINT-20-02.md)
- [SPRINT-20-03](SPRINT-20-03.md)

Après réalisation et non maintenant : trois rapports `SPRINT-20-01-RESULTAT.md` à `SPRINT-20-03-RESULTAT.md`, puis `SPRINT-20-RESULTAT.md` dans ce même répertoire. Des noms prévus ne prouvent pas que ces fichiers ou des tests existent déjà. Mettre à jour les documents de référence concernés et le registre avec commit et date vérifiables ; ne pas créer de PR.

## 7. Prompt d'exécution ultérieure — non exécutable maintenant

> Tu es l'agent de développement EKTS. **Attends un feu vert explicite pour le Sprint 20** ; ces instructions documentaires ne sont pas un feu vert. Lis `AGENTS.md`, `docs/ROADMAP.md`, le registre, la spécification 21, les critères 22, l'architecture 20 et les quatre fichiers de ce sprint. Vérifie les prérequis et l'état Git réel ; ne manipule pas les travaux préexistants sans accord. Déclare toute contradiction ou chemin devenu inexact.
>
> Pour chaque sous-sprint **20-01 → 20-02 → 20-03**, applique d'abord le protocole tests U/I/E2E/CI ci-dessus, puis la correction minimale, les régressions et la documentation ; consigne les commandes réellement exécutées, résultats RED/GREEN, blocages et écarts. Ne maquille ni erreur ni test ignoré. Si validation de l'oracle, architecture, migration, droits, fournisseur, coût ou sécurité manque, **arrête et demande une décision humaine**.
>
> Après chaque sous-sprint, prépare son rapport `SPRINT-20-0X-RESULTAT.md` avec faits et liens, inspecte explicitement le diff et les fichiers à indexer, puis réalise un **commit atomique local** si l'autorisation de développement couvre les commits et si les critères sont effectivement satisfaits. Sinon arrête et demande ; n'embarque aucun travail préexistant sans autorisation. Dans le registre, ne fabrique pas le hash du commit en cours : avant ce commit, indique uniquement que sa référence est à renseigner ; après création, relève son hash réel et consigne-le dans un commit documentaire séparé si nécessaire, conformément aux règles du registre. Continue le sous-sprint suivant seulement si les prérequis et éventuelles validations humaines sont satisfaits. Les trois sous-sprints peuvent s'enchaîner dans le même feu vert si celui-ci l'autorise ; il n'autorise pas le sprint suivant.
>
> Après 20-03, crée `SPRINT-20-RESULTAT.md` à partir de faits réellement observés : périmètre, fichiers, critères, commandes et statuts, limites, écarts P3, risques résiduels, éventuels commits et suites. Mets à jour le registre selon ses règles en indiquant date et commit réels. Présente le bilan au propriétaire et **attends son accord avant le sprint suivant**. Aucune PR, aucun push, publication, fusion ou pilote sans autorisation distincte. Ne donne aucune valeur de test ou CI inventée.

## 8. Checklist de clôture réelle

- [ ] Feu vert de sprint et prérequis vérifiés ; oracle arrêté avant code.
- [ ] Tests U/I/E2E et raccordement CI préparés avant chaque implémentation ; RED pertinent ou GREEN initial justifié.
- [ ] Critères du tableau évalués selon 22 ; tous les blocages, échecs et skips explicités.
- [ ] Contrats, migrations, données historiques, sécurité et docs vérifiés dans leur périmètre.
- [ ] Rapports et éventuels commits locaux réels traçables ; registre à jour avec date et commit.
- [ ] Bilan transmis et validation humaine obtenue avant le sprint suivant.
