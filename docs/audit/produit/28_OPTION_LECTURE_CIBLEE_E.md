# 28 — Lecture ciblée de dépôts, plateformes et packages : instruction de l'option E

**Sprint :** transversal · **Date :** 31 octobre 2026
**Statut :** ✅ **instruite et recommandée** · ⏳ **non implémentée** (feu vert distinct requis)
**Décision du propriétaire :** « l'option E pour la lecture ciblée est instruite
maintenant » (31/10/2026).

> **Note de méthode.** La note 26 (`26_SYNTHESE_LACUNES_ET_LECTURE_CIBLEE.md`)
> et la note 25 (`25_CARTOGRAPHIE_RESSOURCES_ET_DEPOTS.md`) **ne sont pas
> disponibles** dans cet environnement : leur transfert n'est pas possible. Cette
> instruction est donc reconstruite depuis les notes **17** (recherche open
> source), **18** (catalogue, 90 dépôts à SHA figé, 42 `SKILL.md`) et **22**
> (critères), plus le code réel. Les critères **LC-01 à LC-10** proposés
> ci-dessous sont les miens : ils **ne reprennent pas** ceux de la note 26, dont
> je n'ai pas connaissance, et ne doivent pas être présentés comme tels.

---

## 1. Le besoin, reformulé sans ambiguïté

Un catalogue statique ne suffit pas. EKTS doit pouvoir, **à la demande** :

1. désigner une source précise (`dépôt`, `fichier`, `package`, `version`) ;
2. en obtenir une **référence vérifiable** (commit, empreinte, date) ;
3. en extraire **une portion bornée** (un fichier, un extrait de métadonnées) ;
4. qualifier ses **droits** avant toute conservation ;
5. **refuser** ce qui n'est pas autorisé, avec un motif.

Ce que ce besoin **n'est pas** — et ne sera jamais dans cette instruction :

| Acte | Statut |
| --- | --- |
| lire un fichier texte public et le **référencer** | ✅ objet de l'option E |
| **copier** le contenu dans le corpus local | ⚠️ seulement si droits vérifiés |
| **installer** un package | 🚫 hors périmètre |
| **exécuter** un script, une skill, un hook | 🚫 hors périmètre |
| **scanner** activement une cible (test offensif) | 🚫 hors périmètre, accord explicite requis |
| **cloner** un dépôt entier pour l'exploiter | 🚫 hors périmètre de E (c'est de l'import, S25) |

## 2. Comparaison des trois options

| Critère | **H** — l'hôte lit | **E** — adaptateurs HTTPS dans EKTS | **O** — import hors ligne |
| --- | --- | --- | --- |
| Qui possède la lecture | L'hôte agent | **EKTS** | L'opérateur |
| Traçabilité de la source | dépend de l'hôte | **native** (ref figée + empreinte) | native (manifeste) |
| Reproductibilité | faible | **forte** | forte |
| Empreinte vérifiable | non | **oui** (SHA-256 déjà implémenté) | oui |
| Droits qualifiés avant conservation | non | **oui** (C-R10 déjà implémenté) | oui |
| Surface d'attaque réseau | nulle côté EKTS | **à concevoir** (SSRF, quotas) | nulle |
| Répond au besoin **dynamique** | oui | **oui** | non |
| Coût de maintenance | nul pour EKTS | réel (API tierces) | faible |

**Verdict : E est recommandée.** H ne peut pas prouver ce qu'EKTS doit prouver :
si l'hôte fournit le texte, EKTS ne peut ni recalculer l'empreinte ni attester
la ref. La valeur centrale du produit — *provenance vérifiable* — serait
concédée au client.

**Mais E n'est retenue que sous conditions** (§ 4). Sans elles, H reste
préférable : un adaptateur réseau mal cloisonné est pire qu'une absence
d'adaptateur.

**O reste nécessaire en complément** : le pilote A/C/B et les tests doivent
pouvoir tourner sans réseau.

## 3. Contrat proposé

### 3.1 Entrée

```text
{ source: 'github'|'gitlab'|'npm'|'pypi',
  identifiant: 'owner/repo' | 'package',
  ref: '<commit forty-hexades>' | '<version>',
  chemin?: 'docs/x.md',            // dépôts uniquement
  limites: { octetsMax, fichiersMax, delaiMs } }
```

La **ref doit être figée** en production. Une branche mobile est acceptée en
exploration, avec `etat: 'non-fige'` explicite dans la sortie.

### 3.2 Sortie

```text
{ etat: 'complet' | 'partiel' | 'refus' | 'limite' | 'absent' | 'erreur',
  sourceCanonique: 'https://github.com/owner/repo',
  ref: '<sha>',  date: '<ISO>',
  plage: 'lignes 1-40' | 'entier' | 'métadonnées',
  empreinte: 'sha256:…',
  droits: { licence, statut: 'verifiee'|'inconnue'|'refusee', source },
  motif?: 'refus par licence' | 'quota' | … }
```

**Distinctions obligatoires** — c'est l'exigence la plus importante :

| Situation | Ne doit **jamais** être confondue avec |
| --- | --- |
| `absent` (le fichier n'existe pas) | une erreur réseau |
| `limite` (quota, plage trop large) | une absence |
| `erreur` (5xx, DNS) | un résultat vide |
| `refus` (licence) | une incapacité technique |

## 4. Conditions de sécurité (non négociables)

| # | Contrôle | Raison |
| --- | --- | --- |
| S1 | **Liste de domaines fermée** (`api.github.com`, `raw.githubusercontent.com`, `registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`…) | toute autre destination est refusée avant la requête |
| S2 | **Refus des IP privées, loopback, lien-local et du service de métadonnées** (`169.254.169.254`) après **résolution**, pas seulement sur le nom | SSRF |
| S3 | **Pas de redirection suivie** par défaut ; si suivie, re-validation de la destination | contournement par 302 |
| S4 | **Quotas** : octets, nombre de fichiers, durée, profondeur de pagination | déni de service, coût |
| S5 | **Aucun identifiant transmis** entre origines ; jetons jamais journalisés | fuite de secrets |
| S6 | **Contenu tiers = donnée**, jamais instruction ; pas d'interprétation de frontmatter comme directive | injection indirecte (cf. `docs/ISOLATION.md`) |
| S7 | **Pas de symlink suivi, pas de sous-module** | évasion de périmètre |
| S8 | **Formats non textuels refusés** explicitement | binaire déguisé |
| S9 | Toute lecture est **journalisée** (source, ref, octets, empreinte, décision) | traçabilité C-T01 |

Les contrôles S2 et S3 sont les deux plus souvent oubliés dans les
implémentations réelles ; ils doivent être **testés**, pas seulement écrits.

## 5. Critères de test proposés (LC-01 → LC-10)

Ces identifiants sont **proposés par l'agent** pour cette instruction ; ils ne
remplacent pas la note 26 et ne valent pas validation.

| ID | Cas | Attendu |
| --- | --- | --- |
| **LC-01** | lecture d'un fichier public à ref figée | `etat: complet`, empreinte recalculée = empreinte serveur |
| **LC-02** | fichier inexistant | `etat: absent`, **pas** `erreur`, pas de texte vide |
| **LC-03** | ref inexistante | `etat: absent`, motif explicite |
| **LC-04** | domaine hors liste | `refus` **avant** toute requête réseau (vérifiable : 0 connexion) |
| **LC-05** | URL résolvant vers une IP privée | `refus` après résolution |
| **LC-06** | redirection vers un hôte hors liste | `refus`, aucune requête vers la cible |
| **LC-07** | dépassement de quota (octets) | `limite`, troncature signalée, jamais silencieuse |
| **LC-08** | licence restrictive détectée | `refus`, **aucune** conservation |
| **LC-09** | licence inconnue | `droits.statut: 'inconnue'`, conservation **interdite** |
| **LC-10** | contenu hostile (V02) dans un fichier lu | restitué comme donnée, aucune instruction exécutée |

**Dénominateur : 10/10.** Un cas non exécutable est `bloqué`, pas réussi.

## 6. Où cela vit-il ?

**Recommandation : nouveau sprint dédié, pas d'ajout silencieux à S23/S24.**
Placement proposé : **S25 — Ingestion et lecture gouvernée**, avant les
intégrations d'hôtes (S26 OpenCode, S27 Hermes), parce qu'un hôte sans corpus
n'a rien à lire.

Découpage indicatif :

| Sous-sprint | Objet |
| --- | --- |
| 25-01 | contrat, liste de domaines, garde-fous S1–S5, tests LC-01→LC-07 |
| 25-02 | qualification des droits et des licences, tests LC-08/LC-09 |
| 25-03 | import gouverné, idempotence, empreinte, démonstration LC-10 |

## 7. Ce qui reste à décider

| # | Décision | Impact |
| --- | --- | --- |
| **E1** | Valider E et son placement en S25 | sans cela, rien n'est implémenté |
| **E2** | Plateformes prioritaires : GitHub seul d'abord, ou GitHub + npm ? | périmètre de S25-01 |
| **E3** | Sources privées autorisées ? Avec quels jetons ? | ajoute une gestion de secrets, hors périmètre actuel |
| **E4** | Politique de conservation : références seules, ou extraits + empreinte ? | détermine le volume du corpus et les obligations de licence |
| **E5** | Durée de rétention des journaux de lecture | vie privée, coût |
| **E6** | Valider ou renommer les critères LC-01→LC-10 | sinon ils restent des propositions |

**Aucune ligne de code n'est écrite tant que E1 n'est pas tranchée.**
