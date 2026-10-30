# 23 — Contrôle de cohérence globale de la planification MVP-4

**Date :** 30 octobre 2026 · **Révision de code examinée :** `c0610ae9825808bf88a309513bbdc00e2bc7e367` · **Branche :** `arena/mvp4-audit-20261029` · **Statut : contrôle documentaire terminé ; bilan soumis au propriétaire.** Les fichiers de mission et de sprints restent non commités. Aucune validation fonctionnelle, expérience comparative ou autorisation de développement ne découle de ce contrôle.

## 1. Périmètre et méthode

Contrôle de la vision (notes [12](12_REALIGNEMENT_MVP4_AUDIT_PRELIMINAIRE.md), [15](15_PHASE1_MATRICE_ET_VALIDATION.md), [16](16_RESSOURCES_ET_ACCES_AGENTIQUE.md)), du [scénario 19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), de l'[architecture 20](20_ARCHITECTURE_MINIMALE_MVP4.md), de la [spécification 21](21_SPECIFICATION_MVP4.md), des [critères 22](22_CRITERES_ET_TESTS_MVP4.md), de la [roadmap](../../ROADMAP.md), du [registre](../../blueprint/Docs/roadmap/REGISTRE-AVANCEMENT.md), des 24 fichiers de sprint 19–24, des recherches [17](17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md) et [18](18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md), et des règles [`AGENTS.md`](../../../AGENTS.md).

Ce contrôle compare les intentions et références documentaires, compte les IDs et vérifie l'existence des chemins locaux ; il ne démontre ni la bonne conception de chaque test futur, ni la validité des liens externes et ancres, ni la conformité produit. Il ne rejoue pas la suite logicielle, la CI, les performances, un hôte agentique ou une analyse de licences de toutes les dépendances installées. Les résultats de phase 1 sont historiques et ne sont pas de nouveaux résultats de sprint.

## 2. Cohérence de la chaîne de décision

| Maillon | Ce qui est validé | Limite opérationnelle |
|---|---|---|
| Vision et phase 1 | Fiabilité web, traçabilité, permissions puis enrichissement ; écarts observés dans les chemins examinés. | Les mesures antérieures sont ponctuelles ; aucun correctif n'est réalisé. |
| Scénario | A sans corpus, C avec fichiers identiques, B avec EKTS ; méthode et seuils validés pour la planification. | Aucun hôte connecté, import des six ressources ni session agent exécuté ; B−A et B−C restent à mesurer séparément. |
| Architecture | Local + serveur MCP existant + FTS explicite ; profil serveur cible, contrôle externe vérifié possible pour pilote préliminaire ; provenance et preuves locales. | Profil produit et garanties non implémentés ; un profil MCP n'est pas une sandbox hôte/OS. |
| Spécification et critères | 24 exigences, dont T04 expérimental ; 43 critères, méthodes et seuils validés. | Un seuil est une cible, jamais un résultat. G1 et G2 sont distincts ; `bloqué` n'est pas `réussi`. |
| Roadmap | Collaboration distante reportée sans échéance ; fiabilité et permissions P0, puis ressources, preuves, compatibilité et évaluation. | Aucun choix de backend distant, de durée ni d'engagement de sprint opérationnel. |
| Décomposition | Le propriétaire a validé l'organisation en sprints 19–24, parent et trois sous-sprints chacun. | Avant chaque sprint, revue des détails et feu vert distinct ; aucune autorisation de développer ou de lancer un pilote. |

### Sécurité `C-P07` : dépendance importante

`P03` est de classe M et son critère `C-P07` prévoit l'essai T06 avec exposition contrôlée et observable. **Si cet essai n'est pas autorisé, n'expose pas effectivement l'agent à la variante, ou ne peut pas être observé, ce critère est bloqué ou indéterminé et G1 ne peut pas être déclaré complet.** La comparaison A/C/B complète reste facultative, mais la validation de ce critère de sécurité demeure requise tant que la spécification n'est pas modifiée par une décision humaine. Le propriétaire pourra autoriser une vérification de sécurité ciblée selon le protocole ou décider d'une révision formelle ; aucune équivalence ni dérogation n'est décidée ici. Les sprints 21 et 24 documentent comment poursuivre avec une réserve explicite, sans déclarer 21 ou G1 réussis.

## 3. Traçabilité exigences → critères → sous-sprints

Les critères ci-dessous sont **ceux à vérifier**, pas des réussites. Pour chaque exigence, la colonne sprints indique les dossiers qui citent au moins l'un de ses critères ; le Sprint 24 comporte des revérifications transversales. `C-W12` couvre W06 et O04 ; `C-W14` couvre W05 et O06. En complément, la table de traçabilité de [22 §7](22_CRITERES_ET_TESTS_MVP4.md) relie aussi `C-T03` à O01 pour la confidentialité ; il figure en 23-02. Les critères `C-T04–C-T06` portent sur T04 de classe S : ils ne sont pas tous requis pour la conformité M, contrairement à `C-P07`.

| Exigence | Critères directement associés dans la matrice | Sous-sprints citant ces critères |
|---|---|---|
| P01 | `C-P01`, `C-P02`, `C-P03`, `C-P08` | [21-01](../../blueprint/Docs/roadmap/sprints/SPRINT-21-01.md), [21-02](../../blueprint/Docs/roadmap/sprints/SPRINT-21-02.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md) |
| P02 | `C-P04` | [21-01](../../blueprint/Docs/roadmap/sprints/SPRINT-21-01.md) |
| P03 | `C-P05`, `C-P06`, `C-P07` | [21-03](../../blueprint/Docs/roadmap/sprints/SPRINT-21-03.md), [24-02](../../blueprint/Docs/roadmap/sprints/SPRINT-24-02.md) |
| R01 | `C-R01`, `C-R02` | [22-01](../../blueprint/Docs/roadmap/sprints/SPRINT-22-01.md) |
| R02 | `C-R03`, `C-R04` | [22-02](../../blueprint/Docs/roadmap/sprints/SPRINT-22-02.md) |
| R03 | `C-R05` | [22-01](../../blueprint/Docs/roadmap/sprints/SPRINT-22-01.md) |
| R04 | `C-R06`, `C-O07` | [22-03](../../blueprint/Docs/roadmap/sprints/SPRINT-22-03.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md) |
| R05 | `C-R07`, `C-R08` | [22-03](../../blueprint/Docs/roadmap/sprints/SPRINT-22-03.md) |
| T01 | `C-T01` | [23-01](../../blueprint/Docs/roadmap/sprints/SPRINT-23-01.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md) |
| T02 | `C-T02` | [23-01](../../blueprint/Docs/roadmap/sprints/SPRINT-23-01.md) |
| T03 | `C-T03` | [23-02](../../blueprint/Docs/roadmap/sprints/SPRINT-23-02.md) |
| T04 | `C-T04`, `C-T05`, `C-T06` | [24-02](../../blueprint/Docs/roadmap/sprints/SPRINT-24-02.md), [24-03](../../blueprint/Docs/roadmap/sprints/SPRINT-24-03.md) |
| W01 | `C-W01`, `C-W02`, `C-W03`, `C-W04` | [19-01](../../blueprint/Docs/roadmap/sprints/SPRINT-19-01.md), [19-02](../../blueprint/Docs/roadmap/sprints/SPRINT-19-02.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md) |
| W02 | `C-W05`, `C-W06` | [19-03](../../blueprint/Docs/roadmap/sprints/SPRINT-19-03.md) |
| W03 | `C-W07` | [19-03](../../blueprint/Docs/roadmap/sprints/SPRINT-19-03.md) |
| W04 | `C-W08` | [20-01](../../blueprint/Docs/roadmap/sprints/SPRINT-20-01.md) |
| W05 | `C-W09`, `C-W10`, `C-W14` | [20-01](../../blueprint/Docs/roadmap/sprints/SPRINT-20-01.md), [20-02](../../blueprint/Docs/roadmap/sprints/SPRINT-20-02.md), [20-03](../../blueprint/Docs/roadmap/sprints/SPRINT-20-03.md) |
| W06 | `C-W11`, `C-W12` | [19-02](../../blueprint/Docs/roadmap/sprints/SPRINT-19-02.md), [20-02](../../blueprint/Docs/roadmap/sprints/SPRINT-20-02.md), [23-03](../../blueprint/Docs/roadmap/sprints/SPRINT-23-03.md) |
| O01 | `C-O01` | [21-03](../../blueprint/Docs/roadmap/sprints/SPRINT-21-03.md) |
| O02 | `C-O02`, `C-O03` | [23-02](../../blueprint/Docs/roadmap/sprints/SPRINT-23-02.md) |
| O03 | `C-O04` | [23-03](../../blueprint/Docs/roadmap/sprints/SPRINT-23-03.md) |
| O04 | `C-W12`, `C-O05` | [19-02](../../blueprint/Docs/roadmap/sprints/SPRINT-19-02.md), [20-02](../../blueprint/Docs/roadmap/sprints/SPRINT-20-02.md), [23-03](../../blueprint/Docs/roadmap/sprints/SPRINT-23-03.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md) |
| O05 | `C-O06` | [23-03](../../blueprint/Docs/roadmap/sprints/SPRINT-23-03.md), [24-01](../../blueprint/Docs/roadmap/sprints/SPRINT-24-01.md), [24-03](../../blueprint/Docs/roadmap/sprints/SPRINT-24-03.md) |
| O06 | `C-W13`, `C-W14` | [20-03](../../blueprint/Docs/roadmap/sprints/SPRINT-20-03.md) |

**Contrôle documentaire :** 24/24 exigences ont au moins un critère et un sous-sprint associé ; les 43 IDs de critères sont distincts et apparaissent dans les dossiers. Les 45 couples exigence–critère directs tiennent compte des deux rattachements doubles de C-W12 et C-W14. Ce comptage ne démontre pas que chaque cas sera correctement implémenté ou exécuté. Les méthodes, dénominateurs, seuils, exclusions et statuts de [22](22_CRITERES_ET_TESTS_MVP4.md) font foi.

## 4. Contradictions et corrections documentaires

| Constat | Traitement dans ce contrôle | État restant |
|---|---|---|
| Anciennes mentions « architecture / seuils proposés » et étapes ultérieures à préparer dans 19/20 | Actualisation des statuts, de FTS explicitement requis et des trois outils du profil ; anciennes décisions initiales identifiées comme historiques. | Les garanties restent à implémenter ; paramètres opérationnels ouverts. |
| `22 §8` disait écrire les tests pendant l'implémentation ; les sprints exigent test avant code | Ordre corrigé : U/I/E2E et raccordement CI préparés avant tout code fonctionnel ; cas non exécutables indiqués bloqués. | Les tests et jobs n'ont pas été écrits ni exécutés dans cette étape. |
| Décomposition affichée comme proposée après validation par le propriétaire | Statuts synchronisés dans la roadmap, le registre, le registre des décisions et les 24 fichiers. | Validation de la décomposition ≠ validation de réalisation ou feu vert. |
| T06 facultatif au titre de la comparaison, mais `C-P07` M pour G1 | Dépendance explicitée dans 22 et la roadmap ; portée et blocage conservés. | Choix opérationnel d'un essai autorisé ou révision formelle à décider, sans changer le seuil maintenant. |
| Ancienne formulation du seuil de citations limitée aux sessions B | Formulation alignée sur `C-T05` : zéro citation inventée dans les sessions évaluées, sans modifier le seuil B ≥ 80. | Résultats non mesurés. |
| Lignes S17 du registre « livré/validé » et « non commencé » en doublon | Avertissement déjà ajouté, historique conservé ; rapports S17/S18 et validation MVP-3 cités. | Origine et réconciliation officielle encore non tranchées. |
| Rapports C16.6/C16.7, descriptions MCP 4/11/17, README/version et ancien calendrier | Écarts visibles dans la roadmap, avec statut historique ; aucune affirmation de résolution dans le code. | Mise en cohérence active et décision sur injection des recommandations à programmer ; ne pas altérer silencieusement `AGENTS.md`. |
| Ancien ADR-044 / recommandation collaboration | Préparation d'origine conservée avec note de révision ; registre des décisions annoté sans nouvel ADR inventé. | Réconciliation formelle selon processus ADR et décision du propriétaire. |

## 5. Risques, dépendances et licences

| Sujet | Fait ou décision | Point ouvert / précaution |
|---|---|---|
| Code et plateforme | `package.json` indique Node ≥ 22.19, npm ≥ 10.9, SQLite local, `better-sqlite3`, `sqlite-vec`, MCP SDK et autres dépendances ; lockfile présent. | Version du runtime effectif, binaires natifs, Playwright/PDF, plateformes et CI à vérifier lors d'un lancement autorisé. FTS sans embeddings n'élimine pas automatiquement `sqlite-vec` ni les trois bases. |
| Licence EKTS | Le manifeste du projet déclare MIT. | Ce libellé ne couvre pas automatiquement toutes les dépendances, contenus, modèles et poids ; aucun audit exhaustif de licences de l'arbre de dépendances n'a été effectué ici. |
| Recherche tierce | Les notes 17/18 documentent des projets et licences à titre de recherche ; aucun ajout n'est imposé au MVP-4. | Vérifier à la révision et pour l'usage réels : WanGP Community License, Oh My OpenAgent SUL, VoiceStudio AGPL, restrictions Remotion/Phoenix, licences individuelles de skills et modèles. Analyse documentaire antérieure, pas avis juridique ni autorisation d'intégration. |
| Contenus et confidentialité | Corpus fictif local avec manifeste ; droits inconnus des ressources anciennes conservés comme inconnus. | Sources externes, copies, partage, licences et données personnelles exigent contrôle et accord ; les rapports réels nécessitent consentement distinct et peuvent contenir l'URL du site. |
| Sécurité | Certains outils MCP modifient l'état ; une annotation seule ne prouve pas la lecture seule. | Allowlist serveur et arguments, effets au démarrage, isolation hôte/OS, réseau, redirections et canaris restent à vérifier réellement. |
| Stockage et migration | Bases SQLite attachées en WAL ; données historiques à préserver. | Établir schéma, sauvegarde et reprise ; ne pas promettre d'atomicité inter-fichiers en panne ni réécrire des données sans décision. |
| Coûts et fournisseur | Aucun fournisseur, hôte, modèle ou budget n'est imposé. | Choisir et autoriser explicitement avant transmission, session ou dépense ; vérifier conservation et conditions du fournisseur. |
| Windows et environnement | Windows natif est la cible de validation produit retenue. | Édition/build, machine, ACL, dépendances et hôte à choisir ; ne pas supposer WSL ni généraliser un test Linux. Le choix de l'hôte du pilote est distinct. |
| Rapport web | Priorités, données absentes, métriques, sécurité des sorties et reprise sont prioritaires. | Sélectionner entre sortie partielle sans score global et erreur bloquante selon le contrat validé ; migration et compatibilité restent à concevoir. |
| Comparaison | Corpus volontairement petit et 3 répétitions par condition. | Effets d'interface et variabilité non contrôlés entièrement ; B ≥ 80 ne démontre pas un gain sur C ni une utilité générale. |
| État Git | Branche locale et HEAD inchangés ; documents et données de recherche non commités. | Ne pas les perdre ni les indexer automatiquement avec un futur sprint ; décider séparément de leur conservation et des éventuels commits. Aucun scan complet des secrets ou de l'historique n'a été exécuté. |

## 6. Contrôles de liens, fichiers et règles

- 24 nouveaux documents de sprint existent : six parents et 18 sous-sprints ; les noms et numéros historiques du Sprint 18 ne sont pas écrasés.
- Les liens Markdown relatifs des documents examinés sont vérifiés par existence de leur cible locale ; URLs externes et ancres ne sont pas revérifiées par cette opération.
- Les huit fichiers du corpus synthétique correspondent à leur SHA-256 et à leur taille dans le manifeste ; cela ne signifie pas qu'ils ont été importés ni que les copies B/C ont été testées.
- Les chemins de code et tests cités comme points d'inspection dans les sous-sprints existent à la révision examinée ; les rapports de résultats et éventuels nouveaux tests sont explicitement futurs.
- `git diff --check` est utilisé pour les fichiers suivis ; les fichiers Markdown non suivis sont aussi vérifiés pour les espaces de fin suspects. Aucun test produit ou CI n'est exécuté dans ce contrôle.
- Les modifications de la mission sont documentaires ; aucun code source, script, dépendance ou fichier de test fonctionnel n'a été modifié. Le mode exécutable historique du hook `.husky/pre-commit`, altéré par la restauration de l'espace de travail, a été rétabli sans changement de contenu.
- **Aucune PR, aucun push, aucune publication, aucun changement de visibilité ni modification fonctionnelle.** Aucun commit n'est créé pour cette étape.

## 7. Ordre recommandé et décisions humaines

1. Examiner et valider ce bilan, puis conserver explicitement la documentation non commitée. Cette étape ne lance aucun sprint.
2. Avant tout développement, donner un **feu vert distinct pour le Sprint 19**, confirmer sa portée, les accès, l'environnement et les conditions de commit ; relire ses trois sous-sprints et vérifier l'état Git.
3. Pour chaque sous-sprint autorisé : oracles et tests U/I/E2E/CI avant code, baseline et RED comportemental ou GREEN justifié, correctif minimal, régressions, rapport factuel ; demander arbitrage en cas de blocage. Les commits locaux ne sont faits que s'ils sont explicitement couverts par l'autorisation.
4. Poursuivre selon les points de contrôle : Sprint 20 fiabilité web, Sprint 21 permissions (préparation parallèle possible), puis 22 provenance/FTS et 23 traces/compatibilité, si leurs prérequis et validations sont remplis.
5. Sprint 24 : consolider G1 et décider du cadre G0 ; la vérification `C-P07` a besoin d'une autorisation et d'une exposition observable même si la comparaison complète reste facultative. Ne lancer aucune session, ne transmettre aucune donnée et n'engager aucune dépense sans accord distinct.
6. Examiner les preuves et les limites de G1, puis un éventuel G2. Une comparaison négative ou absente ne devient pas une démonstration de valeur. Décision G3 par le propriétaire.

**Conclusion :** la chaîne documentaire et la traçabilité sont établies après correction des incohérences relevées. La planification peut être soumise à validation finale avec les décisions ouvertes ci-dessus ; elle ne démontre ni conformité technique MVP-4, ni sécurité générale, ni avantage comparatif.
