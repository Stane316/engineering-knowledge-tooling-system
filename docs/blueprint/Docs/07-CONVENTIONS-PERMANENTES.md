# 07 — Conventions permanentes de travail EKTS

**Version :** 1.0 · **Date :** 31 octobre 2026 · **Statut :** ✅ **en vigueur**
**Autorité :** directive permanente du propriétaire du projet, qui prime sur les
consignes ponctuelles des dossiers de sprint antérieurs.

Ce document rassemble les conventions qui s'appliquent **à tout sprint, tout
sous-sprint, tout commit et tout rapport**, jusqu'à la fin du projet. Il est
référencé par [`AGENTS.md`](../../../AGENTS.md) — le fichier que lit tout agent
avant de travailler — afin que ces règles ne dépendent pas du contexte d'une
conversation.

> **Règle de lecture :** en cas de contradiction entre un dossier de sprint
> (rédigé avant cette directive) et ce document, **ce document l'emporte**.
> La contradiction doit néanmoins être signalée et le dossier corrigé, jamais
> ignoré en silence.

---

## 1. Convention Git — commit et push couplés

### 1.1 Règle

**Chaque commit est immédiatement suivi de son push.** Un commit local n'est pas
une livraison.

Séquence obligatoire :

1. Modifier.
2. Vérifier (`npm run verify` ou l'équivalent défini pour le sprint).
3. `git add <chemins exacts>` — jamais `git add -A` par défaut.
4. `git commit`.
5. `git push origin <branche>` **dans la même action**.
6. Vérifier que le commit est présent sur le distant.
7. Ne poursuivre qu'après vérification.

### 1.2 Conséquences pratiques

- **Interdit** : accumuler des commits locaux « en attente ».
- **Interdit** : `git reset --hard`, `git clean`, `git push --force`.
- **Interdit** : pousser sur `main` (règle AGENTS.md antérieure, conservée).
- **Interdit** : créer une pull request sans autorisation explicite.
- Un push qui échoue **n'autorise pas** à réécrire l'historique : diagnostiquer,
  conserver les commits, exposer la cause, proposer une résolution.

### 1.3 Correction de la règle antérieure

Les dossiers des sprints 20 à 22 imposaient « aucune PR, **aucun push**,
publication, fusion ou pilote sans autorisation distincte ». Cette clause est
**remplacée** par la présente convention pour ce qui concerne le push : le push
de la branche de travail devient obligatoire. Les autres interdictions (PR,
fusion, publication, pilote, dépense) restent soumises à autorisation distincte.

### 1.4 Cas particulier : perte de l'historique local

Un clone de travail peut être recréé sans préavis (incident du 31/10/2026,
E22-15). La procédure est alors :

1. **Ne rien détruire** : constater, ne pas lancer de commande de nettoyage.
2. Vérifier l'intégrité de l'arbre de travail (fichiers présents, `typecheck`,
   `build`, tests ciblés).
3. Reconstituer les commits **à partir de l'arbre**, en conservant leur
   découpage logique.
4. **Ne pas réutiliser ni inventer les anciens hashs** : les corriger partout
   (rapports, registre) et déclarer la reconstruction dans le message de commit.

---

## 2. Convention de rapport de livraison

Tout sprint — et tout sous-sprint significatif — produit un rapport
`SPRINT-XX-RESULTAT.md` structuré selon les **treize sections** suivantes,
telles qu'exigées par le propriétaire. Un simple récit ou une liste de fichiers
est insuffisant.

| Section | Contenu obligatoire |
| --- | --- |
| **A — Résumé exécutif** | numéro et nom, objectif initial, statut final, réalisations principales, écarts, blocages, résultat concret |
| **B — Avant / après** | tableau par capacité : fonctionnalité, comportement, limitation, intégration, qualité — état avant, état après ; réponse explicite à « qu'est-ce qui n'existait pas avant ? » |
| **C — Réalisations détaillées** | pour chacune : problème initial, objectif, solution, fonctionnement concret, fichiers, capacités, dépendances, vérifications, résultat, limites |
| **D — Fonctionnalités** | distinction : nouvelles / améliorées / corrigées / stabilisées / documentées seulement / partielles / reportées ; **exemple d'usage concret** |
| **E — Technique et intégrations** | architecture, modules, dépendances, interfaces, CLI, API, MCP, connecteurs, plugins, scripts, configuration, stockage, sécurité, tests — avec l'impact **utilisateur** |
| **F — Vérifications de l'agent** | tableau : vérification, commande réellement exécutée, résultat, statut, limites. Statuts : réussite / échec / non exécuté / bloqué / non applicable / réussite partielle |
| **G — Vérifications par le propriétaire** | **obligatoire** : objectif, prérequis, commande exacte, répertoire, étapes, résultat attendu, critère de réussite, erreurs possibles, quoi transmettre en cas d'écart |
| **H — Commandes de validation** | uniquement des commandes **vérifiées présentes** dans `package.json` / configs ; fonction, prérequis, emplacement, caractère obligatoire, résultat attendu, effets secondaires |
| **I — Synchronisation Git** | branche, état de l'arbre, commits non poussés, synchronisation distante, hash du dernier commit |
| **J — Résultats attendus et interprétation** | tableau étape / résultat attendu / conduite si le résultat diffère |
| **K — Points de vigilance** | anomalies, limites, tests non réalisés, risques, comportements inattendus, points nécessitant une décision |
| **L — Préparation du sprint suivant** | terminé, restant, reporté, dépendances, prochaines tâches, décisions nécessaires, conditions de démarrage |
| **M — Livrables et historique** | chemins exacts des documents créés/modifiés, rôle, commits, pushes, modifications non livrées |

**Interdits absolus dans un rapport :**

- déclarer réussi un test non exécuté ;
- annoncer un hash de commit qui n'existe pas ;
- présenter un `bloqué` ou un `indéterminé` comme un succès ;
- omettre un test ignoré ou une limite connue.

---

## 3. Protocole de validation utilisateur

### 3.1 Répartition des responsabilités

**L'agent** exécute ce que son environnement permet : inspection, tests
automatisés, typecheck, lint, build, intégration, cohérence, Git, documentation.

**Le propriétaire** exécute ce qui dépend de son poste : Windows natif, clés
d'API, interfaces graphiques, serveurs, outils externes, validations humaines et
jugements de valeur.

### 3.2 Format obligatoire d'une vérification utilisateur

Chaque vérification fournie comporte :

1. objectif ;
2. prérequis ;
3. **commande exacte**, en **PowerShell 5.1** (pas de `&&`, `||`, `cat`,
   `rm -rf`, `2>/dev/null`) ;
4. répertoire d'exécution ;
5. étapes ;
6. résultat attendu ;
7. critère de réussite ;
8. erreurs possibles ;
9. les éléments à transmettre en cas d'écart (commande, sortie complète,
   résultat attendu, contexte).

### 3.3 Statut d'un sprint

Un sprint n'est **pas** validé tant que des vérifications utilisateur
obligatoires sont en attente. Le rapport doit distinguer explicitement :
« vérifié par l'agent » et « à vérifier par le propriétaire ».

---

## 4. Stratégie d'intégration open source

### 4.1 Principe : réutilisation avant reconstruction

Pour tout besoin, examiner dans cet ordre :

1. existe-t-il déjà dans EKTS ?
2. existe-t-il sous forme réutilisable dans un dépôt open source ?
3. existe-t-il une bibliothèque, un SDK, un script ou une compétence qui y
   répond ?
4. peut-on l'intégrer via une interface existante ?
5. peut-on l'adapter à coût raisonnable ?
6. faut-il développer une solution propre à EKTS ?

**Ne pas reconstruire ce qui existe et peut être réutilisé proprement.** La
réutilisation reste conditionnée à la licence, la sécurité, la maintenance et
la compatibilité d'architecture.

### 4.2 Ce que « intégré » veut dire

Une intégration n'est **pas** terminée par un clone, un lien ou une copie de
fichiers. Le cycle complet comporte treize étapes :

1. recherche et identification ;
2. audit du dépôt ;
3. sélection des capacités ;
4. analyse de compatibilité et de licence ;
5. extraction ou réutilisation ;
6. adaptation éventuelle ;
7. intégration dans EKTS ;
8. **connexion au registre / système de ressources d'EKTS** ;
9. vérification des interfaces et dépendances ;
10. tests d'utilisation ;
11. documentation ;
12. **démonstration d'un cas d'usage réel** ;
13. commit, push et rapport.

Les étapes 8, 10 et 12 sont celles qui distinguent une intégration d'une
apparence d'intégration.

### 4.3 Interdits

Sont explicitement **refusés** comme preuve d'intégration : un simple lien, une
documentation externe sans mécanisme d'exploitation, une copie sans adaptation,
un clone non utilisé par le produit, un composant inaccessible depuis les
interfaces d'EKTS, un outil non testable, une compétence non identifiable, une
intégration MCP non vérifiée, une dépendance ajoutée sans justification.

### 4.4 Base existante

La recherche est **déjà faite** et ne doit pas être refaite à l'aveugle :

- [`14_REPERAGE_ECOSYSTEME_MVP4_PROVISOIRE.md`](../audit/produit/14_REPERAGE_ECOSYSTEME_MVP4_PROVISOIRE.md) — 18 références repérées ;
- [`17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md`](../audit/produit/17_RECHERCHE_OPEN_SOURCE_APPROFONDIE.md) — shortlist, licences, risques ;
- [`18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md`](../audit/produit/18_CATALOGUE_OPEN_SOURCE_ET_SKILLS.md) — catalogue, SHA, **42 `SKILL.md` lus individuellement** ;
- `docs/audit/produit/recherche-open-source-2026-10-29/` — données brutes (JSON).

### 4.5 Licences : prudence par défaut

- **MIT / Apache-2.0** : réutilisation possible, attribution conservée.
- **AGPL-3.0** (ex. VoiceStudio) : vérifier les obligations réelles avant tout
  déploiement ou distribution ; un processus séparé ne les annule pas par
  défaut.
- **Licences restrictives / propriétaires** (ex. WanGP) : exclues du corpus
  distribué sauf décision explicite.
- **Contenus tiers** (modèles, voix, données, skills agrégées) : licence
  **distincte** du dépôt hôte, à vérifier individuellement.

Aucune ressource ne peut être admise dans le corpus gouverné sans
`provenance.rights` renseigné — c'est précisément ce que le sprint 22-01 a
construit.

---

## 5. Direction produit MVP-4

La définition de la cible, le scénario de référence et les critères de réussite
figurent dans [`REVISION-MVP4-2026-10-31.md`](roadmap/REVISION-MVP4-2026-10-31.md).
Ce document est une **proposition soumise au propriétaire** : il n'est pas
applicable tant qu'il n'a pas été approuvé.

**Énoncé de la vision retenue :**

> EKTS est un écosystème centralisé et exploitable de connaissances, de
> compétences, de composants, de scripts, de scénarios et d'outils, enrichi par
> la réutilisation maîtrisée de projets open source, et capable d'améliorer
> concrètement le travail d'un agent de développement.

Toute tâche de sprint doit pouvoir être rattachée à cet énoncé. Une tâche qui
n'y contribue pas doit être justifiée ou reportée.

---

## 6. Gouvernance des sprints

1. **Un sprint ne démarre qu'après feu vert explicite** du propriétaire.
2. **Un sous-sprint ne démarre pas** si les critères du précédent ne sont pas
   vérifiés.
3. **Tests avant code** : les cas U/I/E2E sont définis avant l'implémentation ;
   un RED doit échouer pour le comportement attendu, pas sur une erreur
   d'import.
4. **Aucun test affaibli, ignoré ou supprimé** pour faire passer une suite.
5. **Les écarts sont déclarés**, jamais corrigés en silence — y compris les
   écarts de procédure de l'agent lui-même.
6. **Arrêt et décision humaine** si manque une validation d'oracle,
   d'architecture, de migration, de droits, de fournisseur, de coût ou de
   sécurité.
7. **Un sprint se termine** par : commit + push, rapport détaillé (§ 2),
   protocole de vérification (§ 3), mise à jour du registre, et **attente de
   validation**.

### 6.1 Suivi de l'avancement

Le registre [`roadmap/REGISTRE-AVANCEMENT.md`](roadmap/REGISTRE-AVANCEMENT.md)
reste la source de vérité : une ligne par sous-sprint, une entrée de journal
datée par événement, avec commit réel.

---

## 7. Application et contrôle

Ces conventions sont **vérifiables**. À chaque rapport :

| Contrôle | Preuve attendue |
| --- | --- |
| commit poussé | `git rev-list --count origin/<branche>..HEAD` = 0 |
| rapport complet | les 13 sections A–M présentes |
| commandes réelles | chaque commande du § H existe dans `package.json` |
| vérifications utilisateur | § G renseigné avec commandes PowerShell |
| intégration open source | les 13 étapes du § 4.2 tracées |
| écarts | liste explicite, y compris ceux de l'agent |

Un rapport qui ne satisfait pas ce tableau est **incomplet**, indépendamment de
la qualité du code livré.
