# SPRINT-23-01 — Événements et citations observables — résultat

**Sprint parent :** [SPRINT-23](SPRINT-23.md) · **Sous-sprint :** [SPRINT-23-01](SPRINT-23-01.md)
**Date d'exécution :** 31 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `2cf77a3` · **Commit d'implémentation :** voir § 8
**Statut :** ✅ **C-T01 satisfait (5/5, couche déclarée) · ✅ C-T02 satisfait (4/4 + le cas FTS sans `get_resource`)** — avec deux limites déclarées en § 6.

## 1. Ce qui devait être prouvé

| Critère | Méthode du dossier 22 | Seuil |
| --- | --- | --- |
| **C-T01** | I/E : séquence succès FTS, succès lecture, zéro résultat, erreur et refus, dans une base de test autorisée ; l'observateur précise sa couche de visibilité | **5/5 événements** visibles au niveau déclaré, reliés à session, outil/mode, statut et version ; aucun « transmis au modèle » sans preuve de cette couche |
| **C-T02** | I/H : quatre cas au moins, dont un résultat FTS contenant déjà le texte, **sans** appel `get_resource` | **4/4 qualifications** correctes : vérifiée, non corroborée, version incompatible, indéterminée |

## 2. Couche de visibilité déclarée

**`server->client`.** Un événement est produit au moment où le serveur écrit sa
réponse vers le client. Entre cette écriture et ce que voit le modèle, il y a un
client, un hôte, une fenêtre de contexte et une troncature que ce processus
n'observe pas. **Aucun état « transmis au modèle » n'est affirmé nulle part** —
ni dans le code, ni dans les traces, ni dans ce rapport.

La trace est lisible par l'exploitant : une ligne JSON Lines sur `stderr`, au
niveau `info`, avec `message = "mcp.event"`.

## 3. Ce qui a été construit

| Fichier | Rôle |
| --- | --- |
| `src/mcp/observability/event-journal.ts` | Journal de session, classification des appels, empreintes de fenêtres, qualification des citations |
| `src/mcp/handlers/tools.ts` | `dispatchTool` devient le **point d'enregistrement unique** : succès et échecs, y compris les appels directs qui ne traversent pas le serveur |
| `src/mcp/server.ts` | Crée le journal et le recopie sur le journal structuré (`stderr`), sauf journal muet |
| `src/mcp/context.ts` | `observability?` facultatif dans `McpToolContext` ; un contexte sans journal se comporte exactement comme avant |
| `tests/mcp/observability/event-journal.test.ts` | 22 cas unitaires (empreintes, version, classification, troncature, qualification) |
| `tests/mcp/integration/events-observable.test.ts` | 5 cas d'intégration (séquence, refus, canari, citation FTS, quatre verdicts) |
| `tests/mcp/integration/stdio-observability.test.ts` | 1 cas sur le **binaire** : événements sur `stderr`, `stdout` en JSON-RPC pur |

### 3.1 Trois décisions de conception

1. **Un seul point d'enregistrement.** Le premier essai plaçait l'enregistrement
   dans l'enveloppe d'affichage (`run`) : un appel direct à `dispatchTool`
   — chemin utilisé par les tests et par la garde de profil — n'émettrait alors
   aucun événement. Le point unique est `dispatchTool`, en amont de toute
   enveloppe.
2. **Des empreintes, jamais du texte.** Le rapprochement d'une citation exige de
   savoir si le texte cité figurait dans ce qui a été servi. Recopier le contenu
   créerait une seconde copie exportable du corpus — ce que C-T03 interdit. Le
   journal ne conserve que des **empreintes de fenêtres de cinq mots**
   (SHA-256 tronqué à 16 caractères), soit assez pour prouver une couverture au
   mot près, trop peu pour reconstituer une phrase.
3. **La troncature se déclare.** Au-delà de 500 événements en mémoire ou de 400
   fenêtres par source, la trace est **incomplète** : l'absence de preuve n'est
   alors pas une preuve d'absence, et la qualification devient `indéterminée`
   au lieu de `non corroborée`.

### 3.2 Version d'une ressource

`metadata.provenance.sourceVersion` (version de la source d'origine) prime ;
`updatedAt` est la révision persistée à défaut ; sinon **`inconnue`** — jamais une
valeur inventée, jamais la date du jour.

## 4. Résultats mesurés

### 4.1 C-T01 — 5/5 événements

| # | Événement | Déclencheur du test | Constat |
| --- | --- | --- | --- |
| 1 | `fts` | `search_knowledge` (mode `hybrid`) | `status ok`, `mode hybrid`, `resultCount ≥ 1`, sources servies décrites par empreintes |
| 2 | `read` | `get_resource` | `status ok`, `version` égale à `updatedAt` de la ressource |
| 3 | `zero_result` | `search_knowledge` mode `fts`, terme absent | `status empty`, `resultCount 0` |
| 4 | `error` | `get_resource` identifiant inconnu | `status error`, `errorCode` présent |
| 5 | `refusal` | `create_project` sous profil `read` | `status refused`, `errorCode -32601`, **même session** que les autres |

Session unique et séquence strictement croissante (`1…5`), `layer` constante,
horodatage sur chaque événement. Sur le binaire, la séquence `fts` → `zero_result`
sort bien par `stderr` et `stdout` ne contient que des réponses JSON-RPC
(`jsonrpc: "2.0"`, aucun `message`) : le protocole n'est pas corrompu.

### 4.2 C-T02 — 4/4 qualifications

| Cas | Entrée | Verdict | Motif |
| --- | --- | --- | --- |
| Source servie, citation exacte | texte de la ressource lue | **`verifiee`** | `couverture_exacte`, `evidenceSeq = 1` |
| **Résultat FTS portant déjà le texte, sans `get_resource`** | extrait servi par `search_knowledge` | **`verifiee`** | `couverture_exacte` — aucun appel `get_resource` n'est exigé |
| Source jamais servie | ressource absente du journal | **`non_corroboree`** | `aucun_evenement` |
| Version affirmée différente de celle servie | citation datée d'une autre révision | **`version_incompatible`** | `version_divergente` |
| Trace manquante (journal tronqué) | citation après éviction | **`indeterminee`** | `trace_incomplete` |
| Source servie, texte cité absent | citation embellie | **`non_corroboree`** | `citation_non_couverte` |

## 5. Traçabilité des tests

| Niveau | Commande | Résultat |
| --- | --- | --- |
| U | `npx vitest run tests/mcp/observability/event-journal.test.ts` | **22 passed** |
| I | `npx vitest run tests/mcp/integration/events-observable.test.ts` | **5 passed** |
| E2E | `npx vitest run tests/mcp/integration/stdio-observability.test.ts` | **1 passed** |
| Régressions | `npm run verify` | **EXIT 0** — 169 fichiers passés, 6 sautés ; **1 952 passed**, 39 sautés ; couverture 95,84 / 89,09 / 97,22 / 95,96 |

### 5.1 Preuve RED et sa limite déclarée

- **Cas mémoire (4 événements serveur) : RED comportemental.** Avant code, le
  test a échoué avec `AssertionError: expected [] to deeply equal ['fts', 'read', 'zero_result', 'error']` :
  zéro événement alors que les quatre appels réussissaient. Ce n'est pas une
  erreur d'import.
- **Cas du refus, du canari et de la qualification : API inexistante.** Ces cas
  importent le module à créer ; leur RED est l'absence de l'API. Ce n'est **pas**
  une preuve RED recevable au sens du dossier 23 : elle est déclarée comme
  telle, et la preuve est le GREEN avec oracles figés **avant** écriture du code.
  Le risque de test écrit a posteriori est borné par le fait que deux cas ont
  réellement échoué après implémentation et ont conduit à corriger le code, pas
  l'oracle : le déplacement du point d'enregistrement de `run` vers
  `dispatchTool`, et la reprise du journal déjà attaché au contexte par
  `createEktsServer`.

## 6. Limites déclarées — ce qui n'est **pas** prouvé

| # | Limite | Conséquence |
| --- | --- | --- |
| 1 | La couche s'arrête à la réponse du serveur | Rien n'est affirmé sur ce que le modèle reçoit ; C-T01 est satisfait « au niveau déclaré », pas au-delà |
| 2 | Le refus n'est pas atteignable par le serveur sous profil restreint | Un outil masqué n'étant pas enregistré, le client reçoit « outil inconnu » ; le refus est prouvé par le chemin d'exécution direct, qui est aussi celui qui refuse réellement |
| 3 | `MCP_LOG_LEVEL=error` rend les événements invisibles | Comportement voulu d'un journal muet, à documenter en exploitation ; la trace d'événements n'est pas un audit inaltérable |
| 4 | Le journal est en mémoire (500 événements) | Pas de persistance ni d'export signé : l'historique long et la rétention relèvent de O03/O04 (23-03) |
| 5 | Une citation de moins de cinq mots est `indéterminée` | Choix explicite : sans cela, citer « le » suffirait à obtenir « vérifiée » |

## 7. Incidents et corrections en cours de route

| # | Incident | Correction |
| --- | --- | --- |
| 1 | Enregistrement placé dans `run` : les appels directs à `dispatchTool` n'émettaient rien (`expected [] to deeply equal ['fts','read']`) | Enregistrement déplacé dans `dispatchTool`, point d'exécution unique |
| 2 | `createEktsServer` créait un second journal et perdait celui du contexte (deux sessions, `expected 2 to be 1`) | Le journal du contexte est réutilisé en priorité |
| 3 | `qualifyCitation` recevait les événements seuls et perdait l'information de troncature | La fonction accepte le journal **ou** ses événements ; le journal porte la troncature |
| 4 | Un modèle de test cherchait `results` en mode `hybrid` avec embeddings factices : le zéro résultat ne se produisait pas | Le cas de zéro résultat utilise le mode `fts`, qui respecte réellement l'absence du terme |

## 8. État Git

`npm run verify` = **EXIT 0** avant commit. Commit d'implémentation et de
documentation : annoncés au registre d'avancement au moment du push.
