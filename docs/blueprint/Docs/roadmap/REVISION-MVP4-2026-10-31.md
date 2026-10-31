# Révision de la MVP-4 — proposition du 31 octobre 2026

**Statut :** 📄 **PROPOSITION — non applicable sans accord du propriétaire.**
**Remplace :** la décomposition « Sprints 19 → 24 » de la [roadmap](../../../../ROADMAP.md)
**§ 2.1**, qui reste conservée comme historique.
**Complète :** [conventions permanentes](../07-CONVENTIONS-PERMANENTES.md).

---

## 1. Pourquoi cette révision

Le sprint 22 vient de livrer la gouvernance du corpus (provenance, empreinte,
recherche, états d'erreur). Ces briques sont solides, mais elles gouvernent un
corpus **vide par construction** : EKTS sait stocker une ressource qu'on lui
donne à la main, il ne sait pas encore **acquérir** un corpus.

Autrement dit, à l'issue du sprint 22 :

- la **traçabilité** est outillée ;
- l'**exploitabilité** ne l'est pas : il n'existe aucun moyen d'importer les
  compétences, scripts et composants que la vision désigne comme la valeur
  centrale du produit.

Poursuivre mécaniquement 23 → 24 produirait un produit conforme et vide : un
système qui prouve parfaitement l'origine de six fichiers synthétiques. Ce n'est
pas la vision énoncée par le propriétaire.

## 2. Vision de référence

> EKTS est un écosystème **centralisé et exploitable** de connaissances, de
> compétences, de composants, de scripts, de scénarios et d'outils, enrichi par
> la réutilisation **maîtrisée** de projets open source, et capable d'améliorer
> **concrètement** le travail d'un agent de développement.

Trois mots portent la contrainte : *centralisé* (un point d'accès),
*exploitable* (un agent s'en sert réellement), *maîtrisé* (licence, provenance,
droits, empreinte — ce que 22-01/22-02 ont construit).

## 3. État réel au 31 octobre 2026

| Sprint | Périmètre initial | État vérifié |
| --- | --- | --- |
| 19 | W01–W03, lecture historique | ✅ livré |
| 20 | W04–W06, O06 | ✅ livré |
| 21 | P01–P03, O01 | ⚠️ partiel — **C-P06/C-P07 bloqués** (ni hôte isolé ni sandbox) |
| 22 | R01–R05 | ✅ exécuté — C-R03/C-R06/C-R07/C-R08 prouvés ; C-R04 volet H, C-O07 machine et arbitrages E22-9/E22-10 en attente |
| 23 | T01–T03, O02–O05 | ⏳ non commencé |
| 24 | Régressions M, T04, G0–G3 | ⏳ non commencé |

**Constat :** 4 sprints sur 6 exécutés ou partiels ; aucun ne porte sur
l'acquisition de connaissances.

## 4. Diagnostic de l'écart

| # | Écart constaté | Preuve |
| --- | --- | --- |
| **D1** | **Aucun chemin d'ingestion** d'un corpus existant. `ekts add` prend un contenu unitaire ou un fichier de provenance ; rien ne lit un dépôt. | `src/cli/commands/add.ts` |
| **D2** | La recherche a été validée sur **6 fichiers synthétiques** ; aucune mesure sur un corpus réel de plusieurs centaines de ressources. | rapport 22-03 § 10 |
| **D3** | La recherche open source **existe déjà et est de bonne qualité** (18 références, 42 `SKILL.md`, licences, SHA) mais **n'entre dans aucun sprint**. | docs 17 et 18, absents du plan 19–24 |
| **D4** | Le critère de fin (G2 « valeur comparative ») serait évalué sur un corpus non représentatif : il mesurerait l'outillage, pas la valeur. | doc 22 § C-T04 à C-T06 |
| **D5** | Les écosystèmes nommés par le propriétaire (TierFlow, Quen Agents, Paperclip, Voice Studio) ne figurent pas sous ces noms dans le catalogue audité. | doc 18 § « Corrections d'identité » — à confirmer |

## 5. Définition explicite de la MVP-4 révisée

**À la fin de la MVP-4, EKTS doit permettre ceci :**

1. **Constituer** un corpus de connaissances à partir de sources externes
   identifiées (dépôts open source audités), sans ressaisie manuelle.
2. **Qualifier** chaque ressource : origine, version, licence, empreinte
   SHA-256, droits d'usage, sensibilité — et **refuser** celles dont les droits
   sont insuffisants ou inconnus.
3. **Retrouver** une ressource par recherche lexicale, avec des états d'erreur
   distincts et sans repli silencieux.
4. **Servir** ce corpus à un agent via MCP, sous profil `read` à trois outils.
5. **Prouver** l'usage : ce qui a été cherché, lu, cité — et ce qui ne l'a pas
   été.
6. **Démontrer** la valeur sur un scénario réel, avec une comparaison honnête
   (agent seul / agent + EKTS), y compris si le gain est nul.

**Ce que l'utilisateur peut faire concrètement :**

```powershell
# 1. Importer un corpus externe audité (à construire au sprint 24)
node dist/cli/index.js import --source <dépôt> --manifest <fichier> --data-dir data

# 2. Vérifier ce qui a été admis et ce qui a été refusé, et pourquoi
node dist/cli/index.js list --json
node dist/cli/index.js get <uuid> --json

# 3. Chercher (existe déjà)
node dist/cli/index.js search "accessibilité" --mode fts

# 4. Connecter un agent (existe déjà)
#    .mcp.json + EKTS_MCP_PROFILE=read -> 3 outils
```

**Ce que la MVP-4 ne fait pas** (reporté, non abandonné) : marketplace, comptes
multi-utilisateurs, collaboration distante, exécution de scripts non fiables,
client MCP sortant, synchronisation cloud.

## 6. Découpage proposé

> Les sprints **19 à 23 restent inchangés**. Le sprint 24 initial (validation)
> est **décalé**, pas supprimé : il devient 27, avec son contenu intact.

| Sprint | Titre | Objet | Critères |
| --- | --- | --- | --- |
| **23** | *(inchangé)* Preuves, compatibilité, exploitation | T01–T03, O02–O05 | C-T01–C-T03, C-O02–C-O06 |
| **24** | **Ingestion gouvernée de ressources externes** *(nouveau)* | chaîne dépôt → ressource qualifiée → index ; refus des droits insuffisants ; manifeste d'import | **C-R09, C-R10** *(proposés)* |
| **25** | **Intégration OpenCode** *(nouveau)* | hôte de référence : connexion MCP, skills, permissions ; démonstration | **C-T07** *(proposé)* |
| **26** | **Intégration Hermes + corpus de skills** *(nouveau)* | skills au standard `SKILL.md`, citations sourcées, catalogue interne | **C-R11, C-T08** *(proposés)* |
| **27** | *(ex-24, contenu intact)* Validation transversale et décision | régressions M, G0–G3, T04 facultatif | C-T04–C-T06, G0–G3 |
| **28+** | *optionnel, sur décision* | écosystèmes additionnels (TierFlow, Quen, Paperclip, Voice Studio) | à définir après identification |

### 6.1 Sous-sprints proposés pour le sprint 24 (le chaînon manquant)

| Sous-sprint | Objet | Livrable vérifiable |
| --- | --- | --- |
| **24-01** | Lecture d'un corpus source et manifeste d'import | lecture d'un répertoire, extraction des métadonnées, SHA-256 recalculé, aucune écriture |
| **24-02** | Qualification et admission | provenance construite depuis la licence et la source ; **refus** explicite si droits inconnus ou licence restrictive ; empreinte vérifiée par 22-02 |
| **24-03** | Import, idempotence et rejeu | import reproductible, déduplication par empreinte, rapport avant/après chiffré |

### 6.2 Critères proposés (à valider — ils n'existent pas encore)

| ID | Critère | Seuil |
| --- | --- | --- |
| **C-R09** | Import d'un corpus externe | **N/N** ressources du manifeste importées, empreinte et provenance conformes ; **0** ressource sans droits ; rejeu idempotent (0 doublon) |
| **C-R10** | Refus motivé | **100 %** des ressources à licence restrictive ou inconnue refusées avec un motif lisible ; aucune n'est importée « pour voir » |
| **C-R11** | Corpus de skills au standard `SKILL.md` | **100 %** des skills du corpus de test identifiables par nom, description et origine ; 0 skill ambiguë |
| **C-T07** | Intégration d'un hôte réel | connexion MCP établie, **3/3** outils visibles sous profil `read`, **14/14** autres refusés, 0 effet métier indésirable |
| **C-T08** | Démonstration de valeur | scénario joué, résultat et citations conservés, **B−A et B−C rapportés séparément**, y compris en cas d'absence de gain |

Ces identifiants sont **proposés** et n'engagent rien : ils doivent être
arbitrés avant d'être ajoutés au document 22.

## 7. Ce qui est conservé, modifié, reporté

| Élément | Sort |
| --- | --- |
| Sprints 19, 20, 21, 22 | **conservés** — exécutés |
| Sprint 23 (T01–T03, O02–O05) | **conservé à l'identique** — la traçabilité reste un pilier de la valeur |
| Sprint 24 initial (validation G0–G3) | **conservé intégralement**, **décalé en 27** — le valider avant l'ingestion mesurerait l'outillage, pas la valeur (D4) |
| Documentation 14/17/18 et données JSON | **promues** : de « recherche » à « base de l'ingestion » |
| Intégrations TierFlow / Quen / Paperclip / Voice Studio | **reportées en 28+** — identité exacte non confirmée (D5) |
| Marketplace, multi-utilisateur, collaboration | **inchangés** : hors périmètre |
| Critères C-P06 / C-P07 (sécurité hôte) | **inchangés** : toujours bloqués, reportés au sprint 24 de l'ancienne numérotation → relèvent de 27 |

**Rien n'est supprimé.** Le décalage de 24 → 27 est explicite et justifié au § 4 (D4).

## 8. Dépendances

```text
22 (provenance + empreinte + FTS) ✅
        │
        ├──► 23 (traces T01-T03) ──────────────┐
        │                                      │
        └──► 24 (ingestion) ──► 25 (OpenCode) ──┼──► 27 (validation G0-G3)
                     │              │          │
                     └──► 26 (Hermes) ─────────┘
                                      │
                                      └──► 28+ (écosystèmes additionnels)
```

- **24 dépend de 22** : sans provenance ni empreinte, importer reviendrait à
  copier sans preuve.
- **25 et 26 dépendent de 24** : on n'intègre pas un hôte autour d'un corpus
  vide.
- **27 dépend de 23, 25 et 26** : la validation exige un corpus réel et des
  traces.

## 9. Critères de réussite de la MVP-4

La MVP-4 est déclarée réussie si et seulement si :

1. le corpus contient des ressources **externes réelles** admises avec
   provenance, licence et empreinte (C-R09, C-R10, C-R11) ;
2. un agent connecté en MCP trouve et lit ces ressources (C-T07) ;
3. les événements sont traçables (C-T01–C-T03) ;
4. une démonstration chiffrée existe, **même si le gain est nul** (C-T08) ;
5. les critères M applicables sont `réussi` ; tout `bloqué` laisse la porte
   ouverte et n'est pas compté comme succès ;
6. les limites sont écrites noir sur blanc.

## 10. Impacts

| Domaine | Impact |
| --- | --- |
| Durée | **+3 sprints minimum** (24, 25, 26) avant validation. Aucune date n'est engagée. |
| Code | Nouvelle commande d'import, nouveau module de qualification ; réutilisation de `provenance.ts`, `knowledge-manager`, `FTSRepository` — **aucune nouvelle infrastructure de stockage** |
| Données | Le corpus cesse d'être synthétique : les licences et l'attribution deviennent des données de production |
| Sécurité | Nouveau risque : importer du contenu hostile. Traité par le refus de droits, l'absence d'exécution et la traçabilité |
| Documentation | Docs 17/18 deviennent des documents d'exploitation, pas seulement d'étude |
| Registre | Une ligne par nouveau sous-sprint |

## 11. Décisions demandées

| # | Décision | Options |
| --- | --- | --- |
| **V1** | Approuver la révision (sprints 24–26 insérés, 24 initial décalé en 27) | approuver / amender / refuser |
| **V2** | Identifier précisément **TierFlow**, **Quen Agents**, **Paperclip**, **Voice Studio** | fournir les URL exactes |
| **V3** | Choisir le **premier corpus** à importer (dépôt et périmètre) | OpenCode / Hermes / corpus de skills / autre |
| **V4** | Politique de licence : AGPL et restrictives admises dans le corpus ? | oui / non / au cas par cas |
| **V5** | Valider les identifiants de critères proposés (C-R09, C-R10, C-R11, C-T07, C-T08) | oui / renommer / redéfinir |

Tant que **V1** n'est pas tranchée, aucun des sprints 24 à 26 n'est engagé.
