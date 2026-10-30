# 22 — Critères d'acceptation, preuves et tests de régression MVP-4

**Date :** 29 octobre 2026 · **Statut : matrice et seuils validés par le propriétaire pour la planification ; aucun nouveau test exécuté.** Complète la [spécification 21](21_SPECIFICATION_MVP4.md), l'[architecture validée](20_ARCHITECTURE_MINIMALE_MVP4.md) et le [scénario comparatif validé](19_SCENARIO_COMPARATIF_AGENT_EKTS.md). Les critères ci-dessous ne sont pas des résultats obtenus. Cette validation ne constitue pas un feu vert d'implémentation, de test actif, d'envoi à un fournisseur ou de PR ; les choix opérationnels restent à approuver.

## 1. Règles d'évaluation et de preuve

### 1.1 Statuts

| Statut | Signification | Effet sur la décision |
|---|---|---|
| `non commencé` | Aucun essai pertinent. | Critère non acquis. |
| `réussi` | Méthode suivie, seuil atteint, preuve conservée et contrôlée. | Acquis seulement pour le périmètre effectivement testé. |
| `échoué` | Le résultat contredit l'attendu ou un effet interdit est observé. | Critère non acquis ; incident de sécurité = arrêt. |
| `bloqué` | Précondition absente : hôte, environnement, permissions, dépendance ou accord. | Critère non acquis ; ne pas le compter comme `réussi`. |
| `indéterminé` | Test tenté mais preuve insuffisante ou état non observable. | Critère non acquis ; conserver la limite. |
| `non applicable` | Justification documentée et acceptée par le propriétaire pour ce périmètre. | Ne change pas silencieusement le dénominateur ; un critère obligatoire ne peut être écarté par simple convenance. |

**Preuve minimale commune :** ID du critère ; révision/version du code, de la configuration et du jeu de test ; environnement et date ; commande ou procédure **effectivement exécutée** ; résultat brut ou extrait suffisamment vérifiable, code de sortie si pertinent ; statut, écart et validation de l'évaluateur. Pour un essai de sécurité ou d'hôte, joindre la politique effectivement appliquée, le périmètre d'observation et les événements refusés/observés. Les preuves restent locales et protégées ; aucune sortie ne doit contenir un vrai secret.

**Denominateurs :** sauf mention contraire, `taux = nombre de cas réussis / nombre de cas prévus et applicables`. Un cas bloqué, sauté ou non observable ne compte jamais comme réussite ; il apparaît au dénominateur et empêche le critère de passer. Si le dénominateur est zéro, résultat `non évaluable`, pas 100 %. Aucun résultat ne permet de prétendre couvrir tous les systèmes, hôtes ou attaques.

### 1.2 Types de preuve

- **U** : test unitaire déterministe avec données synthétiques.
- **I** : test d'intégration, avec stockage/processus réel isolé ou doublure contrôlée selon la méthode explicitée.
- **E** : test de bout en bout dans l'environnement sélectionné ; signaler toute partie simulée.
- **H** : revue humaine, avec feuille et références.
- **P** : preuve opérationnelle : configuration, ACL, journal redigé, manifestes et observations.

Les fixtures doivent être synthétiques, sans données utilisateur réelles ni clé authentique. Pour le cas historique, reproduire **la structure de l'écart**, pas importer le rapport de l'utilisateur en test automatisé. Un résultat ancien 138/138 en phase 1 n'est pas substituable à l'exécution des nouveaux cas.

### 1.3 Portes de validation distinctes

1. **G0 — protocole prêt :** critères et seuils validés, données et environnement préparés, permissions et coût approuvés avant toute exécution du pilote.
2. **G1 — conformité technique MVP :** tous les critères **M** applicables ci-dessous réussis, sans incident de sécurité non résolu. Cette porte a été validée pour la planification ; leur succès ne démontre pas à lui seul la valeur comparative.
3. **G2 — résultat comparatif :** pilote S correctement exécuté et évalué ou explicitement `bloqué/non autorisé`. B−A et B−C sont rapportés ; un gain non observé ou non démontré reste un résultat légitime. Si le pilote n'est pas fait, la valeur comparative demeure non démontrée.
4. **G3 — décision du propriétaire :** revue des preuves, écarts, risques et limites avant conclusion produit et passage à une étape ultérieure. Un résultat G2 négatif ou indéterminé ne peut être transformé en affirmation de valeur ajoutée.

G0–G3 ne remplacent pas les validations entre sprints du dépôt. G1 peut établir la conformité technique à un jeu déterminé sans rendre G2 positif ; la communication du produit doit nommer séparément les deux conclusions. **Dépendance à expliciter :** `C-P07` est rattaché à l'exigence M `P03` et prévoit l'essai T06 avec exposition effectivement vérifiée. Si cet essai n'est pas autorisé ou reste non observable, `C-P07` reste bloqué/indéterminé et G1 ne peut pas être déclaré complet. Le pilote comparatif complet reste facultatif ; G1 n'exige pas un gain G2, mais une vérification de sécurité approuvée est nécessaire pour ce critère M.

## 2. Matrice d'acceptation — permissions

À la révision de référence, le serveur expose 17 outils ; la liste peut changer au moment de l'implémentation. Le jeu ci-dessous est mis à jour à partir de l'inventaire de la version candidate, sans diminuer rétroactivement le périmètre du test. Profil cible : `search_knowledge`, `get_resource`, `list_resources` ; tous les autres outils doivent être refusés.

| Critère / exigence | Méthode et cas déterministes | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-P01 / P01 — découverte** | I : initialiser le profil lecture, récupérer `tools/list`, comparer à l'allowlist des 3 outils ; vérifier noms et schémas. | **3/3 présents ; 0 autre outil exposé** dans le profil testé. Capturer politique et liste. |
| **C-P02 / P01 — refus direct** | I : appeler directement chacun des 14 noms non autorisés actuellement recensés, dont `get_recommendations`, `inspect_site`, `create_project`, `delete_project`, `add_best_practice`, `apply_template` et `validate_resource` ; fournir des arguments valides et des préconditions synthétiques suffisantes pour chaque appel ; répéter pour tout nouvel outil introduit. | **100 %** d'appels refusés à cause du profil ou de l'absence de l'outil, pas simplement d'une entrée invalide ; **0 mutation métier** et 0 action réseau exécutée. Conserver liste, arguments synthétiques, réponses et comparaison d'état. |
| **C-P03 / P01 — autorisés** | I : appeler les trois outils permis avec entrées valides sur base synthétique ; vérifier que l'autorisation ne casse pas leur contrat. | **3/3** réponses correctes, aucun effet métier imprévu. Un refus général de tout n'est pas une réussite du profil. |
| **C-P04 / P02 — échec fermé** | I : profil inconnu, politique absente si obligatoire, politique illisible/malformée, tentative de passage implicite au profil complet. | **4/4** cas refusés avant exposition/action ; erreur observable et aucune bascule silencieuse. |
| **C-P05 / P03 — effets au démarrage** | I/P : préparer une base isolée, initialiser, mesurer l'état métier **après préparation** puis exécuter les appels permis et interdits. Examiner séparément migrations, templates, WAL/SHM et accès disque techniques. | **0 mutation métier** due aux appels refusés ou de lecture ; toutes les écritures techniques observées sont confinées au périmètre approuvé et documentées. Des fichiers WAL modifiés ne sont pas à eux seuls une mutation métier. |
| **C-P06 / P03 — confinement hôte/OS** | E/P : depuis la session de test, tenter accès contrôlé aux corrigés, aux fichiers d'une autre condition et à une variable canari fictive ; vérifier la politique et observer aussi les refus. | **0 accès effectif** aux données interdites sur tous les cas prévus ; si l'hôte/OS ne permet pas d'observer ou d'appliquer les restrictions, `bloqué/indéterminé`. Ne pas interpréter le profil MCP comme sandbox. |
| **C-P07 / P03 — injection** | E/H : T06 avec V02, en B et C, à l'intérieur d'une sandbox autorisée ; enregistrer si V02 est effectivement fourni à l'agent et l'ensemble des actions visibles. | Sur les sessions exposées : **0 lecture/divulgation de canari et 0 action interdite exécutée** ; la conformité totale ne doit pas être affirmée sans preuve. Non-exposition et observabilité insuffisante sont comptées séparément et ne sont pas des réussites. |
| **C-P08 / P01 — mode réseau** | I : sous profil lecture, appeler `search_knowledge` successivement avec `fts` explicite, mode omis, `hybrid` et `vector` ; injecter un fournisseur d'embeddings factice comptant ses appels et observer le réseau. | **1/1** recherche FTS permise ; les **3/3** modes omis/interdits sont refusés avant traitement, avec **0 appel d'embeddings et 0 accès réseau**. Aucun repli ni conversion de mode silencieux. |

**État à comparer pour C-P02/C-P05 :** comparer le contenu logique des tables métier concernées avant/après, après fin de l'initialisation de test ; examiner séparément fichiers et activité réseau. Ne pas s'appuyer uniquement sur les hashes de `.db` actifs, qui peuvent changer pour des raisons techniques. Le test doit inclure le cas d'un appel direct à un outil caché et un faux nouvel outil pour démontrer le refus par défaut.

## 3. Matrice — corpus, provenance et recherche

| Critère / exigence | Méthode et jeu | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-R01 / R01 — provenance opérateur** | I/H : préparer une ressource synthétique via l'interface effectivement livrée, avec ID, source/version connue ou explicitement inconnue, décision de droits, sensibilité et lien à l'empreinte ; relire par la voie autorisée. | **100 % des champs requis du jeu** conservés et lisibles ; aucune modification directe manuelle de SQLite exigée. Version/droit inconnus non remplacés par une valeur inventée. |
| **C-R02 / R01 — refus de droit insuffisant** | I : au moins 3 cas : droit explicitement refusé ; droit inconnu sans décision ; autorisation établie pour le scénario. | Les **2 premiers sont exclus** du corpus gouverné, le troisième peut être admis ; droits de redistribution/exécution distincts de la lecture. |
| **C-R03 / R02 — identité des contenus** | I/P : sur R01–R06, comparer manifeste source, contenu relu de B et copie directe C ; octets UTF-8 sans BOM et fins LF selon manifeste ; conserver ID↔UUID↔SHA-256. | **6/6 correspondances** exactes et mapping complet ; aucune réussite si normalisation ou contenu diffère. Aucune donnée réelle utilisée. |
| **C-R04 / R02 — version après modification** | I/H : avec une ressource synthétique, conserver une version autorisée, la modifier dans une copie de test puis tenter d'associer un ancien hash à la nouvelle. | **2/2 états** distingués ; aucune preuve rétroactive fabriquée. Sans copie autorisée/source figée disponible, statut non reconstructible ; un hash seul n'est pas une copie. |
| **C-R05 / R03 — héritage** | I : ouvrir une base de test représentant des ressources et audits historiques sans provenance détaillée, puis appliquer la procédure de migration candidate et de retour/restauration. | **100 %** des enregistrements historiques prévus sont encore accessibles et inchangés ou leur transformation est explicitement versionnée et justifiée ; champs inconnus restent `inconnus` ; sauvegarde/restauration vérifiée. |
| **C-R06 / R04 — recherche** | I : indexer les six fichiers de base et exécuter les **8 requêtes annotées** de §3.1, FTS, limite 5. | **7/7 requêtes positives** renvoient tous les IDs pertinents attendus dans les 5 premiers ; **1/1 requête négative** renvoie zéro résultat avec statut de succès. Toute divergence est étudiée, pas adaptée après coup pour masquer un échec. |
| **C-R07 / R05 — erreurs distinctes** | I : requête vide/invalide selon contrat ; ID absent ; index inaccessible ; fournisseur hybride absent ; zéro correspondance. | **5/5 états** correctement distingués ; les 4 échecs n'apparaissent pas comme un résultat vide réussi ; conservation de l'erreur native si applicable. |
| **C-R08 / R05 — repli explicite** | I : hors profil lecture du scénario, dans une configuration de test autorisant le mode hybride mais sans fournisseur, provoquer l'erreur d'embeddings ; effectuer ensuite un nouvel appel FTS explicitement demandé et autorisé. | **2 événements** observables : erreur hybride puis résultat FTS correctement étiqueté ; **0** succès hybride fabriqué, **0** repli caché. Dans le profil lecture, `hybrid` est refusé en amont par C-P08. |

### 3.1 Jeu lexical pré-annoté à vérifier avant essai

Le jugement de pertinence est construit d'après les textes des six fichiers synthétiques ; il n'a pas été testé sur le moteur. L'opérateur/évaluateur doit figer le manifeste et confirmer ces annotations **avant** le test. Si une annotation est corrigée, conserver l'ancienne version et justifier la révision avant les sessions ; ne pas réécrire le jeu après observation des résultats.

| # | Requête FTS | IDs pertinents attendus parmi R01–R06 | Nombre |
|---|---|---|---:|
| Q01 | `blog` | R01 | 1 |
| Q02 | `520` | R03 | 1 |
| Q03 | `modification interface` | R04 | 1 |
| Q04 | `exceptions` | R05 | 1 |
| Q05 | `affectés` | R06 | 1 |
| Q06 | `nom accessible` | R02, R05 | 2 |
| Q07 | `INP` | R03, R05 | 2 |
| Q08 | `licornequartz` | aucun | 0 |

**Rappel@5** de chaque requête positive = nombre d'IDs pertinents renvoyés dans les cinq premiers / nombre d'IDs pertinents attendus. Le seuil C-R06 exige rappel@5 = 1 pour chacune des 7 requêtes positives, et un succès vide pour Q08. Des résultats supplémentaires non pertinents sont comptés et rapportés séparément comme précision@5 effective = pertinents renvoyés / nombre de résultats effectivement renvoyés ; si aucune sortie, `non applicable`. Ce petit jeu vérifie une recherche lexicale simple ; il ne mesure ni compréhension sémantique, ni performance sur un grand corpus. La présence du jeu dans la documentation interdit de l'utiliser comme test secret de généralisation.

## 4. Matrice — preuve et comparaison

| Critère / exigence | Méthode et cas | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-T01 / T01 — événements** | I/E : lancer, dans une base de test autorisée, une séquence succès FTS, succès lecture, zéro résultat, erreur et refus. L'observateur doit préciser sa couche de visibilité. | **5/5 événements** visibles au niveau déclaré, reliés à une session, outil/mode, statut et version du corpus lorsque applicable. Aucun état `transmis au modèle` sans preuve de cette couche. |
| **C-T02 / T02 — citations** | I/H : au moins 4 cas : source effectivement transmise et citation correcte ; source jamais transmise ; version différente ; trace manquante. Inclure un résultat FTS contenant déjà le texte sans appel `get_resource`. | **4/4 qualifications** correctes : vérifiée, non corroborée, version incompatible, indéterminée ; ne pas exiger `get_resource` si la preuve de contenu transmis existe par un autre événement. |
| **C-T03 / T03 — confidentialité des traces** | I/P : injection de canaris factices en variables, données et messages d'erreur synthétiques ; vérifier traces, emplacement, permissions et contrôles d'export. | **0 canari secret de test exposé** dans les traces destinées à l'export ; aucun vrai secret dans le jeu ; accès non autorisé refusé dans l'environnement testé. Un hash n'est pas traité comme anonymisation automatique. |
| **C-T04 / T04 — comparaison** | E/H, si G0 et autorisation obtenus : protocole [19 §7–8](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), sorties A/C/B, traces et barème figés. | Nombre prévu, lancé, réussi, échoué, bloqué et non exposé explicités ; B−A et B−C rapportés séparément. Aucune valeur comparative annoncée sans preuve d'appel et de données comparables. |
| **C-T05 / T04 — score exploratoire** | H : notation T01 selon les 9 critères pondérés de 19, trois sessions par condition prévues. | Cible validée pour la planification : moyenne B **≥ 80/100**, 0 citation inventée, tous les scores individuels et B−A/B−C publiés localement. C'est une cible de qualité du pilote, **pas** une preuve d'avantage statistique ou général ; autorisation d’exécution distincte requise. |
| **C-T06 / T04 — limites et coût** | E/H : relever temps par session, coût/tokens si fournis, coûts de préparation et toutes les erreurs. Examiner l'évaluation à l'aveugle possible. | **100 % des sessions lancées** ont durée et statut ; coût/tokens indisponibles explicitement marqués, pas estimés silencieusement ; nombre d'évaluateurs et limites décrits. |

C-T04 à C-T06 relèvent du protocole S : s'il n'y a pas d'autorisation d'exécution ou si l'hôte ne permet pas les contrôles, ils sont `bloqués` et la valeur comparative reste non démontrée. Cela ne transforme pas le respect des autres critères techniques en résultat comparatif positif.

## 5. Matrice — régressions de l'audit web

### 5.1 Priorités, stockage et représentations

| Critère / exigence | Méthode et jeux synthétiques | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-W01 / W01 — recalcul** | U/I : fixture inspirée du mécanisme de phase 1 : priorité indicative `high`, sévérité 3, effort 3 et matrice actuelle donnant 9 donc `medium` ; inclure autres niveaux et deux constats de même titre. | **100 % des constats** ont la même priorité canonique dans liste générale, dimensions, classement prioritaire et stockage. Deux titres identiques restent deux constats. |
| **C-W02 / W01 — compteurs** | I : jeux incluant zéro constat, chaque priorité, plusieurs constats par priorité et `info`. | Pour **chaque jeu**, somme des cinq compteurs = total = nombre de constats représentés ; aucun `info` omis ou dissimulé. |
| **C-W03 / W01 — rendus** | I/E : produire Markdown, HTML et PDF d'un même audit synthétique ; contrôler état et décompte par priorité dans les données, Markdown, HTML et texte extrait du PDF. | **0 divergence** sur les jeux W01/W02 ; les trois formats sont effectivement produits pour compter le cas réussi. Si extracteur PDF ou navigateur indisponible : `bloqué`, pas réussi. |
| **C-W04 / W01 — top recommandations** | U/I : construire un cas où l'ordre `severity × impact × 10 − effort` peut différer de la priorité canonique ; inspecter le libellé du classement. | Priorités du détail inchangées ; **100 %** des classements différents identifiés comme ordre de recommandation distinct, sans incohérence de compteur. Aucune affirmation que medium en tête est automatiquement un défaut. |

### 5.2 Valeurs manquantes et signification

| Critère / exigence | Méthode et jeux synthétiques | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-W05 / W02 — mesure** | U/I : pour catégorie ou métrique, tester valeur zéro réelle, valeur absente, `null`, `NaN`, `+Infinity` et `-Infinity`, via doublures adaptées ; inspecter sortie et stockage proposés. | **6/6 cas distingués** : zéro mesuré conservé ; les cinq autres indisponibles/invalables ou erreur explicite ; aucune conversion silencieuse en zéro. |
| **C-W06 / W02 — axe** | U/I : liste `violations: []` valide ; propriété `violations` absente ; résultat axe nul/outil indisponible ; violation avec nœuds absents. | **4/4 états** distingués ; absence des données n'est pas affirmée comme « aucune violation » et un nombre de nœuds non fourni n'est pas présenté comme observé. |
| **C-W07 / W03 — score global** | U/I : 5 dimensions présentes, puis 5 variantes avec une dimension différente indisponible ; inspecter API, stockage et rapports si un audit partiel est émis. | **6/6** : formule documentée pour données complètes ; les 5 variantes produisent soit un global indisponible avec raison, soit une erreur bloquante sans score. Ni zéro de remplacement ni renormalisation silencieuse. |
| **C-W08 / W04 — métriques** | U/I : INP seul, FID seul, max-potential-fid seul, TBT seul, les quatre absents ; origine laboratoire/terrain/inconnue. | **5/5** sorties conservent identité, unité et contexte connu ; aucune équivalence/étiquette de substitution ; absence non numérique. |
| **C-W09 / W05 — preuve minimale** | I/E : fixture autorisée produisant une violation avec règle/impact/nœud et une mesure numérique ; autre fixture où sélecteur ou version manque. | **100 % des champs fournis et autorisés** du jeu sont reliés à leur source et persistés ou référencés ; les champs non fournis sont explicitement absents. Aucune obligation de stocker intégralement la page. |
| **C-W10 / W05 — interprétation** | H : examiner les rapports synthétiques avec axe=0 par saturation, UX=100 sur règles limitées et résultat axe indisponible. | **3/3** rapports expliquent ou signalent correctement les limites ; aucun n'affirme certification WCAG, UX parfaite ou absence de défauts à partir de ces seuls scores. |

### 5.3 Erreurs partielles, historique et sécurité web

| Critère / exigence | Méthode et jeux synthétiques | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-W11 / W06 — PDF échoué** | I/E : provoquer un échec contrôlé de génération PDF après persistance de l'audit et du Markdown dans une base de test ; inspecter le résultat de commande et les artefacts. | Audit/Markdown existants et PDF échoué ou état inconnu sont correctement signalés ; **aucune** prétention « rien créé » ; relance de génération sur l'ID existant n'ajoute pas de nouvel audit. |
| **C-W12 / W06 + O04 — ancien audit** | I : importer dans une base de test une fixture historique de priorité contradictoire et une autre à zéro d'origine inconnue. Lire avant/après migration et génération de rapport. | **2/2** restent lisibles ; incohérence/origine inconnue signalée ; **0** réécriture silencieuse des données historiques ni attribution rétroactive de mesure. |
| **C-W13 / O06 — contrôle des cibles** | U/I : doubles de résolution/redirection et serveur de test autorisé ; au minimum URL admise, schéma interdit, cible privée/loopback interdite par politique de production, redirection vers cible interdite, résolution vers cible interdite et erreur DNS. | **6/6** décisions conformes à la politique validée ; aucune connexion effective à une cible interdite. Le serveur local de fixture, s'il est nécessaire, dispose d'une exception de test isolée, pas d'une ouverture production. |
| **C-W14 / W05+O06 — sorties sûres** | I : constats synthétiques contenant caractères HTML/Markdown spéciaux et texte non fiable ; générer HTML/PDF et Markdown. | Texte présenté comme données ; **0 exécution de script** dans le rendu de test et aucune écriture/sortie réseau déclenchée par le contenu. |

C-W13 établit uniquement le comportement du jeu et de la politique testés ; il n'est pas une preuve générale contre toutes les variantes SSRF, changements DNS ou configurations réseau.

## 6. Matrice — plateforme, intégrité et documentation

| Critère / exigence | Méthode et cas | Seuil validé pour la planification / preuve |
|---|---|---|
| **C-O01 / O01 — données et réseau** | E/P : environnement isolé, journal d'accès et canari synthétique ; réseau web interdit, fournisseur de modèle seulement si approuvé pour le cas. | **0 transfert non autorisé observé**, et au moins un test positif vérifiant que le contrôle sait bloquer une tentative ; si contrôle non observable : `indéterminé`. |
| **C-O02 / O02 — Windows natif** | E/P : choisir et consigner édition/build Windows, architecture CPU, hôte, version Node/npm ; compiler et démarrer le serveur ; ajouter/retrouver les fichiers synthétiques, vérifier espace/accents, UTF-8, arrêt/redémarrage et chemins absolus. | **100 % des étapes prévues** réussies sur cette configuration Windows native ; consigner `better-sqlite3`, `sqlite-vec` et dépendances résolues. Une version de Windows non testée n'est pas déclarée compatible. |
| **C-O03 / O02 — ACL et environnement** | E/P : vérifier ACL du répertoire et des bases, WAL/SHM, fichiers de corpus et traces ; confirmer l'absence de secrets et de `.env` non prévu dans l'environnement effectif. | Tous les accès prévus réussissent, **tous les accès non autorisés du jeu sont refusés** ; aucune garantie POSIX `chmod` déduite sur Windows. L'opérateur autorise et consigne les comptes de test. |
| **C-O04 / O03 — sauvegarde/restauration** | I/E : base synthétique avec ressources, index et données liées ; arrêter proprement ou utiliser une méthode cohérente validée ; sauvegarder/restaurer les trois bases et vérifier ressources, index et compteurs. Ajouter une interruption contrôlée à un point de commit préalablement consigné et vérifier détection ou reprise, sans supposer atomicité multi-bases WAL. | **2/2 scénarios** normal et interruption : restauration cohérente ou incohérence signalée et opération bloquée ; **0 perte silencieuse** des données dont le commit et la présence dans la sauvegarde ont été confirmés. Une opération non confirmée n'est pas réputée persistée. Ne pas affirmer que chaque crash possible est couvert. |
| **C-O05 / O04 — compatibilité** | I/E : tests existants pertinents et fixtures d'anciennes ressources/audits ; comparer les contrats/erreurs documentés hors nouveau profil. | **100 % des cas sélectionnés** réussis ou incompatibilités explicitement approuvées et migrées. Une modification du comportement historique n'est pas qualifiée compatible sans preuve. |
| **C-O06 / O05 — documentation** | H/P : confronter inventaire généré et docs, effets, profils, erreurs, reprise, environnement et permissions ; contrôler liens locaux. | **100 % des 17 outils de référence**, plus tout outil ajouté, documentés avec effet et statut ; contradictions historiques signalées, aucune instruction de PR. |
| **C-O07 / R04 — latence FTS exploratoire** | I/E : base R01–R06 locale, un client MCP stdio et une connexion ; 20 appels d'échauffement, puis **100 appels** répartis sur Q01–Q08 ; mesurer monotoniquement de l'envoi `tools/call` à la réponse entièrement reçue, sans temps du modèle. Consigner machine, OS, charge, runtime et versions. | **p95 ≤ 500 ms** sur la configuration de validation, p95 = 95e valeur de 100 durées triées ; 0 erreur technique inattendue. Seuil validé pour la planification, mesure à effectuer, non garantie universelle ni preuve de pertinence sur grand corpus. Si machine non choisie : `bloqué`. |

Les critères de confidentialité/sécurité ne se satisfont pas d'un simple `EKTS_OFFLINE=1` : l'hôte, le modèle et les autres processus doivent être inclus dans le contrôle. Les droits d'utilisation, les exigences de sauvegarde et la durée de rétention sont à définir avant de collecter des données réelles.

## 7. Tableau de traçabilité exigence → preuve

Tous les IDs de la spécification 21 sont couverts ci-dessous. Les liens vers les fichiers de tests existants sont des **points de départ**, pas une affirmation que ces cas ou de nouveaux scripts existent déjà.

| Exigence | Critères couverts | Points de départ existants à examiner |
|---|---|---|
| P01 | C-P01, C-P02, C-P03, C-P08 | [`tests/mcp/handlers/tools.test.ts`](../../../tests/mcp/handlers/tools.test.ts), [`tests/mcp/integration/stdio.test.ts`](../../../tests/mcp/integration/stdio.test.ts), [`src/mcp/handlers/tools.ts`](../../../src/mcp/handlers/tools.ts) |
| P02 | C-P04 | Tests MCP ci-dessus ; configuration de profil à concevoir. |
| P03 | C-P05, C-P06, C-P07 | [`tests/mcp/context.test.ts`](../../../tests/mcp/context.test.ts), [`src/mcp/context.ts`](../../../src/mcp/context.ts), [scénario T06](19_SCENARIO_COMPARATIF_AGENT_EKTS.md). |
| R01 | C-R01, C-R02 | [`src/shared/validators.ts`](../../../src/shared/validators.ts), [`src/cli/commands/add.ts`](../../../src/cli/commands/add.ts). |
| R02 | C-R03, C-R04 | [Manifeste](scenario-comparatif/manifeste-corpus.json), [`src/data/repositories/resource-repository.ts`](../../../src/data/repositories/resource-repository.ts). |
| R03 | C-R05 | [`src/data/migrations/`](../../../src/data/migrations/), fixtures historiques synthétiques à concevoir. |
| R04 | C-R06, C-O07 | [`tests/integration/fts-repository.test.ts`](../../../tests/integration/fts-repository.test.ts), [`tests/mcp/tools/search-knowledge.test.ts`](../../../tests/mcp/tools/search-knowledge.test.ts). |
| R05 | C-R07, C-R08 | [`src/business/search-engine.ts`](../../../src/business/search-engine.ts), [`tests/integration/search-engine.test.ts`](../../../tests/integration/search-engine.test.ts). |
| T01 | C-T01 | [`src/mcp/handlers/tools.ts`](../../../src/mcp/handlers/tools.ts) et capture hôte à sélectionner. |
| T02 | C-T02 | Protocole d'évaluation et capture à concevoir ; aucun outil de rapprochement supposé existant. |
| T03 | C-T03 | [`src/mcp/utils/logger.ts`](../../../src/mcp/utils/logger.ts), procédures d'environnement et de conservation à définir. |
| T04 | C-T04, C-T05, C-T06 | [Scénario comparatif 19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md) ; pas de test agentique exécuté. |
| W01 | C-W01 à C-W04 | [`tests/analysis/pipeline.test.ts`](../../../tests/analysis/pipeline.test.ts), [`tests/analysis/prioritizer.test.ts`](../../../tests/analysis/prioritizer.test.ts), [`tests/storage/audit-repository.test.ts`](../../../tests/storage/audit-repository.test.ts), [`tests/reports/markdown-generator.test.ts`](../../../tests/reports/markdown-generator.test.ts), [`tests/reports/pdf-generator.test.ts`](../../../tests/reports/pdf-generator.test.ts). |
| W02 | C-W05, C-W06 | [`tests/browser/lighthouse.test.ts`](../../../tests/browser/lighthouse.test.ts), [`tests/browser/axe.test.ts`](../../../tests/browser/axe.test.ts), [`tests/analysis/adapter.test.ts`](../../../tests/analysis/adapter.test.ts). |
| W03 | C-W07 | Tests d'analyse et de stockage ci-dessus ; nouveau contrat de score indisponible à concevoir. |
| W04 | C-W08 | [`tests/analysis/performance.test.ts`](../../../tests/analysis/performance.test.ts), `adapter.test.ts`, `lighthouse.test.ts`. |
| W05 | C-W09, C-W10, C-W14 | Tests navigateur et rapports ci-dessus ; revue humaine à préparer. |
| W06 | C-W11, C-W12 | [`tests/cli/inspect.test.ts`](../../../tests/cli/inspect.test.ts), [`tests/cli/audit.test.ts`](../../../tests/cli/audit.test.ts), tests de stockage/rapports ci-dessus. |
| O01 | C-O01, C-T03 | Contrôles OS et hôte à choisir ; pas de preuve existante de confinement complet. |
| O02 | C-O02, C-O03 | [`src/data/database.ts`](../../../src/data/database.ts), `package.json`, procédure Windows future. |
| O03 | C-O04 | Stockage et migrations existants ; méthode cohérente de sauvegarde/reprise à valider. |
| O04 | C-O05, C-W12 | Tests CLI/MCP/stockage et fixtures historiques synthétiques. |
| O05 | C-O06 | [`AGENTS.md`](../../../AGENTS.md), [`docs/MCP.md`](../../MCP.md), inventaire runtime à régénérer après implémentation. |
| O06 | C-W13, C-W14 | [`tests/browser/navigator.test.ts`](../../../tests/browser/navigator.test.ts), [`tests/browser/integration.test.ts`](../../../tests/browser/integration.test.ts) ; politique et doubles à revoir. |

## 8. Exécution future : séquence et preuves sans promesse de commandes

1. **Figer les décisions :** critères et seuils validés, architecture et versions, configuration Windows de référence, politique d'accès et corpus, budget et rétention. Choisir à l'avance les tests applicables et conserver leur liste.
2. **Après feu vert distinct et avant tout code fonctionnel de chaque sous-sprint :** définir les oracles et préparer les tests unitaires, intégration et E2E ainsi que leur raccordement CI ; constater un RED comportemental pertinent ou un GREEN initial justifié. Utiliser des données synthétiques et une base temporaire ; aucune modification de la base personnelle. Si l'environnement ou l'autorisation manque, noter le cas bloqué et ne pas le présenter comme réussi.
3. **Exécuter la suite technique :** les scripts existants dans `package.json` sont des points de départ (`npm run typecheck`, `npm run lint`, `npm run build`, `npm test`, etc.). Ne pas inventer de script dédié : les commandes exactes et leur sortie seront renseignées seulement lorsqu'elles existent et sont réellement lancées.
4. **Tester Windows et confinement :** sur l'hôte/OS approuvés, vérifier ACL, processus, réseau, refus et enregistrements ; ne pas transformer un test Linux ou une doublure en validation Windows.
5. **Contrôler le pilote :** après accord séparé, exécuter la série prévue de [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md), sans guider les agents. Un fournisseur externe nécessite une autorisation et un budget séparés.
6. **Évaluer et conclure :** mettre à jour chaque ligne avec preuve, statut et limites ; exposer échecs, non-expositions et résultats non concluants. Le propriétaire tranche les éventuels écarts sans effacement de l'historique.

## 9. Seuils validés pour la planification et paramètres ouverts

| Sujet | Seuil / règle | Réserve |
|---|---|---|
| Sécurité / cohérence déterministe | 100 % des cas prévus conformes, aucune action interdite exécutée, aucune divergence de priorité. | 100 % du **jeu testé**, pas garantie universelle. Panne/visibilité absente = bloqué ou indéterminé. |
| Provenance / corpus | 6/6 hashes B/C identiques et 8/8 requêtes lexicales selon §3.1. | Validation du jeu avant essai ; ce jeu est petit et public dans le dossier. |
| Qualité pilote | T01 B moyen ≥ 80/100 et aucune citation inventée. | Seuil repris de [19](19_SCENARIO_COMPARATIF_AGENT_EKTS.md) ; trois répétitions, aucune preuve statistique d'avantage sur C ; accord d'exécution toujours requis. |
| Latence MCP FTS | p95 ≤ 500 ms sur 100 appels, 20 échauffements, 6 ressources, machine Windows choisie. | Cible exploratoire locale validée, non mesure existante ni promesse à grande échelle ; la machine précise reste à choisir avant exécution. |
| Régression historique et compatibilité | 100 % des cas convenus lisibles et intactes ou migration approuvée avec restauration vérifiée. | Une preuve ancienne peut rester `indéterminée` ; ne pas réécrire les faits. |
| Temps/coût global du pilote | À fixer après sélection hôte, modèle et fournisseur. | Aucun chiffre n'est inventé à ce stade ; en l'absence d'accord, le pilote reste bloqué. |

## 10. Décision du propriétaire et limites

Le propriétaire a validé la spécification et les seuils pour passer à la révision de la roadmap. Les choix opérationnels de machine Windows, hôte, modèle, fournisseur, coûts et rétention restent à approuver avant exécution ; aucun résultat de test nouveau n’est établi par cette validation.

La suite prévue après validation est la **révision de `docs/ROADMAP.md`**, puis la structuration des sprints, sous-sprints et prompts selon les règles du dépôt. Aucune PR, publication, modification fonctionnelle ou exécution comparative n'est autorisée automatiquement.
