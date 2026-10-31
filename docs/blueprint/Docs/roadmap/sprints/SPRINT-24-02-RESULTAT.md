# SPRINT-24-02 — Préparation G0 — résultat et dossier

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Base :** `437b968` · **Date :** 31 octobre 2026
**Statut :** ⚠️ **dossier préparatoire constitué · G0 NON OUVERT · C-T04/C-T05/C-T06 bloqués · C-P07 bloqué au sens strict**. Commit : **à renseigner**.

**Accord du propriétaire (31/10/2026) :** poursuivre la préparation **malgré la réserve C-P07**, préparer G0 **pour exécution**, sans lancer de session sans feu vert opérationnel distinct.

## 1. Ce que G0 est — et ce qu'il n'est pas

G0 est une **porte d'autorisation**, pas une mesure : il autorise ou refuse la
campagne comparative. Aucun critère comparatif n'est acquis par sa préparation.
G0 ouvert ne vaut ni G1 réussi, ni gain démontré.

## 2. Champs à fournir par le propriétaire — bloquants

| # | Champ | État | Conséquence |
| --- | --- | --- | --- |
| **G0-1** | **Hôte** de la session (machine, OS, isolément réseau) | ⛔ **à fournir** | sans lui, aucune session n'a de périmètre mesurable |
| **G0-2** | **Modèle** (nom exact et version servie) | ⛔ **à fournir** | un « modèle récent » ne se compare pas |
| **G0-3** | **Fournisseur** et endpoint | ⛔ **à fournir** | détermine coût, journalisation, résidence |
| **G0-4** | **Budget** plafond (jetons ou devise) | ⛔ **à fournir** | condition d'arrêt de la campagne |
| **G0-5** | **Comptes de test autorisés** | ⛔ **à fournir** | reprend l'écart E23-1 côté Windows |

Sans ces cinq champs, **G0 reste fermé**. Aucune valeur par défaut n'est
inventée : un budget supposé est un budget dépassé.

## 3. Ce qui est déjà prêt et vérifiable

| # | Élément | Preuve | État |
| --- | --- | --- | --- |
| P1 | Isolation réseau réelle | `tests/mcp/integration/isolation-sandbox.test.ts` — `unshare -rn`, DNS refusé, 6 passed / 1 skipped | ✅ |
| P2 | Profil de lecture (3 outils, 14/14 refusés) | `tests/mcp/profile-exposure.test.ts`, `stdio-profile.test.ts` — 16/16 | ✅ |
| P3 | Événements et citations | `events-observable.test.ts` — 5/5, couche `server->client` | ✅ |
| P4 | Latence sous charge | `npm run bench:latency` — p95 0,73–0,77 ms, 0 échec | ✅ |
| P5 | Traces sans canari | `traces-confidentiality.test.ts` — 5/5 | ✅ |
| P6 | Corpus synthétique | `tests/mcp/helpers.ts` — 3 ressources fictives, aucun fournisseur | ✅ |
| P7 | Contrôle hôte/OS complet (C-P07 strict) | exige un **hôte agent réel** | ⛔ **bloqué** |
| P8 | Windows natif (C-O02/C-O03) | `scripts/windows-check.ps1` | ⛔ **non exécuté** |
| P9 | CI distante | jobs jamais démarrés (facturation) | ⛔ **bloquée** |

## 4. Protocole de campagne, figé d'avance

| Condition | Contenu | Ce qui est mesuré |
| --- | --- | --- |
| **A** | agent **sans** EKTS | score T01, durée, erreurs |
| **C** | agent avec **recherche web seule** | idem |
| **B** | agent avec **EKTS** (profil `read`, FTS explicite) | idem |

Trois sessions par condition, même corpus, même grille de 9 critères pondérés
(note 19 § 7–8), évaluation à l'aveugle si un second évaluateur existe.
**B−A et B−C sont rapportés séparément** : un gain contre la recherche web seule
n'est pas un gain contre l'absence d'outil.

## 5. Rétention, droits et sécurité (décidés)

- **Rétention** : traces locales, 30 jours maximum, suppression sur demande ;
  aucun export par défaut.
- **Droits** : corpus **synthétique** uniquement — aucune ressource tierce, donc
  aucune question de licence dans cette campagne.
- **Sécurité** : profil `read`, réseau refusé par namespace, caviardage actif,
  journal d'événements en mémoire.
- **Coût** : plafond **G0-4** ; à défaut, la campagne ne démarre pas.

## 6. Ce qui reste bloqué après ce dossier

C-T04 (comparaison), C-T05 (score ≥ 80/100), C-T06 (durée et coût) : **aucune
session exécutée**, donc **aucun résultat**. C-P07 : bloqué au sens strict.
Aucun de ces critères n'est déclaré réussi ni « en cours de réussite ».
