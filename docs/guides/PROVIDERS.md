# Fournisseurs d'API — registre, routage et rotation de clés

> **Problème résolu.** Un seul fournisseur (OpenAI) pour tous les usages est une
> dépendance unique : quota atteint, clé révoquée ou panne, et l'outil s'arrête.
> À l'inverse, traiter chaque fournisseur par un `if` dédié produit un code
> illisible qui ne survit pas au deuxième ajout.
>
> Ce module répond à trois questions, séparément : **qui sait faire quoi**
> (catalogue), **quelle clé utiliser** (trousseau et rotation), **dans quel
> ordre essayer** (routage). Aucune de ces décisions n'est codée en dur dans un
> appelant.

| Élément | Valeur |
|---|---|
| Fournisseurs déclarés | **14**, tous vérifiés |
| Fournisseurs ajoutables sans code | illimité (`providers.custom.json`) |
| Capacités | `embedding`, `chat`, `web-search`, `web-fetch`, `sandbox` |
| Protocoles filaires | 7 (dont le protocole `sofya`) |
| Clés par fournisseur | jusqu'à **8** (`_2` … `_8`) |
| Dépendance ajoutée | **aucune** (`fetch` natif Node 22) |
| Tests | 425 au total, couverture 100 % |

---

## 1. Ce que chaque clé débloque réellement

Toutes les clés sont **facultatives**. Sans aucune clé, le projet fonctionne en
recherche lexicale (BM25) ; l'indexation vectorielle est simplement indisponible.

| Fournisseur | Variable(s) | Embedding | Chat | Recherche | Lecture | Sandbox |
|---|---|:--:|:--:|:--:|:--:|:--:|
| OpenAI | `OPENAI_API_KEY` | ✅ 1536 | ✅ | — | — | — |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ 1536 / 1024 | ✅ | — | — | — |
| Google Gemini | `GEMINI_API_KEY`, `GOOGLE_API_KEY` | ✅ 3072 → 1536 | ✅ | — | — | — |
| DeepSeek | `DEEPSEEK_API_KEY` | — | ✅ | — | — | — |
| Z.ai (GLM) | `ZAI_API_KEY`, `Z_AI_API_KEY` | — | ✅ | — | — | — |
| NVIDIA NIM | `NVIDIA_API_KEY`, `NVIDIA_NIM_API_KEY` | — | ✅ | — | — | — |
| Novita | `NOVITA_API_KEY` | ✅ 1024 → 1536 | ✅ | — | — | — |
| StepFun | `STEPFUN_API_KEY`, `STEP_API_KEY` | — | ✅ | — | — | — |
| MiniMax | `MINIMAX_API_KEY` | — | ✅ | — | — | — |
| Tavily | `TAVILY_API_KEY` | — | — | ✅ | — | — |
| Serper | `SERPER_API_KEY` | — | — | ✅ | — | — |
| SerpApi | `SERPAPI_API_KEY`, `SERPLY_API_KEY` | — | — | ✅ | — | — |
| Sofya | `SOFYA_API_KEY` | — | — | ✅ | ✅ markdown | — |
| E2B | `E2B_API_KEY` | — | — | — | — | ✅ (Sprint 8) |

Chaque variable accepte jusqu'à huit clés : `ZAI_API_KEY`, `ZAI_API_KEY_2`,
`ZAI_API_KEY_3`… `_8`. Elles tournent à chaque appel réussi et une clé refusée
cède sa place à la suivante dans le même appel — c'est le moyen le moins coûteux
de doubler un quota gratuit.

**Pourquoi si peu de fournisseurs d'embedding ?** Une clé d'embedding n'est
utilisable que si le modèle produit des vecteurs **comparables à ceux déjà
stockés**. DeepSeek, Z.ai, NVIDIA, StepFun et MiniMax n'exposent pas d'API
d'embedding exploitable par la surface OpenAI, ou seulement des modèles hors
schéma (1024/4096 dimensions, asymétriques avec `input_type`) : les accepter
reviendrait à corrompre silencieusement l'index. MiniMax illustre le cas : le
modèle `embo-01` (1024 dimensions) existe encore sur l'ancienne API
`api.minimax.chat`, avec un `group_id` et un contrat qui n'est plus celui de la
plateforme actuelle — l'intégrer demanderait un adaptateur dédié pour un espace
de 1024 dimensions que rien d'autre ne sert.

Les fournisseurs sans embedding restent utiles : le chat servira au Sprint 6
(synthèse RAG, juge de fidélité), la recherche et la lecture à la veille et à
l'import de documentation, E2B au Sprint 8.

### 1.1 Deux capacités de « web », pas une

| Capacité | Question posée | Coût typique | Usage |
|---|---|---|---|
| `web-search` | « Que dit le web sur X ? » | 1–2 crédits (Sofya), quotas gratuits ailleurs | Veille, découverte de sources |
| `web-fetch` | « Donne-moi le contenu de cette URL » | 2 crédits par URL (Sofya) | Import d'un article, d'un PDF ou d'une doc dans la base |

Les confondre obligerait à chercher sur le web pour lire une URL déjà connue.
Sofya est aujourd'hui le seul fournisseur de `web-fetch` ; l'ajout d'un second
(ou d'un fournisseur local) ne demandera qu'une entrée de catalogue.

---

## 2. Sources vérifiées (22 octobre 2026)

| Fournisseur | Base URL utilisée | Référence |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `platform.openai.com/docs/api-reference` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openrouter.ai/docs/api-reference/embeddings` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `ai.google.dev/gemini-api/docs/embeddings` |
| DeepSeek | `https://api.deepseek.com` | `api-docs.deepseek.com` |
| Z.ai | `https://api.z.ai/api/paas/v4` | `docs.z.ai/api-reference/introduction` |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | `docs.api.nvidia.com/nim/reference/retrieval-apis` |
| Novita | `https://api.novita.ai/openai` | `novita.ai/docs/api-reference/api-reference-overview` |
| StepFun | `https://api.stepfun.ai/v1` | `platform.stepfun.ai/docs` |
| MiniMax | `https://api.minimax.io/v1` | `platform.minimax.io/docs/api-reference/text-chat-openai` |
| Tavily | `https://api.tavily.com/search` | `docs.tavily.com` |
| Serper | `https://google.serper.dev/search` | `serper.dev` |
| SerpApi | `https://serpapi.com/search.json` | `serpapi.com/search-api` |
| Sofya | `https://sofya.co/v1` | `sofya.co/docs` |

Trois points valent d'être notés :

- **Gemini** : l'API native (`:embedContent`) attend `outputDimensionality`,
  mais l'endpoint **compatible OpenAI** attend `dimensions` — envoyer le premier
  provoque `400 Unknown name`. Le catalogue utilise l'endpoint compatible et le
  paramètre `dimensions`, vérifié côté fournisseur (3072 → 1536 sans perte).
- **NVIDIA** : la documentation confirme des modèles 1024 (`nv-embedqa-e5-v5`,
  asymétrique) et 4096 (`nv-embed-v1`) ; aucun ne s'aligne sur 1536 sans perte.
  Seul le chat est donc déclaré.
- **Sofya** : quatre opérations, deux exposées. `POST /v1/search` renvoie le
  **contenu extrait** des pages (~12 000 caractères par résultat) et
  `POST /v1/fetch` convertit jusqu'à dix URL en markdown (PDF et DOCX inclus).
  `POST /v1/extract` (10 crédits) et `POST /v1/research` (50 crédits)
  synthétisent une réponse par LLM : ce sont des usages de Sprint 6, pas de la
  recherche documentaire, et leur coût interdit de les déclencher par mégarde
  dans une boucle. Limite de débit : 30 requêtes/s, `429` + `Retry-After`.

---

## 3. Architecture

```text
                     ┌──────────────────────────────────────────┐
  besoin métier      │            ProviderGateway               │
  « embedding »  ───►│  plan() → routes → clés → disjoncteur    │
  « chat »       ───►│                                          │
  « web-search » ───►│                                          │
  « web-fetch »  ───►└───────┬──────────────────────┬───────────┘
                             │                      │
                  ┌──────────▼─────────┐   ┌────────▼──────────┐
                  │      routing       │   │       http        │
                  │ capacité, espace,  │   │ timeout, retries, │
                  │ politique, santé   │   │ Retry-After, 5xx  │
                  └──────────┬─────────┘   └────────┬──────────┘
                             │                      │
                  ┌──────────▼─────────┐   ┌────────▼──────────┐
                  │      registry      │   │     adapters      │
                  │ 14 livrés +        │   │ OpenAI-compatible │
                  │ providers.custom   │   │ Tavily/Serper/…   │
                  └────────────────────┘   └───────────────────┘
```

| Fichier | Rôle | Lignes |
|---|---|---|
| `src/shared/providers/types.ts` | Types purs : `Capability`, `ProviderDescriptor`, `ResolvedRoute` | — |
| `src/shared/providers/catalog.ts` | Les 14 fournisseurs, leurs modèles, espaces et notes | ~360 |
| `src/shared/providers/custom-providers.ts` | Lecture validée de `providers.custom.json` (aucun secret) | ~220 |
| `src/shared/providers/env.ts` | Trousseau multi-clés, masquage, rédaction | ~130 |
| `src/business/providers/routing.ts` | Chaîne d'appel : capacité → espace → politique → santé | ~160 |
| `src/business/providers/health.ts` | Disjoncteur par fournisseur | ~110 |
| `src/business/providers/http.ts` | Client JSON : timeout, reprises, erreurs typées | ~230 |
| `src/business/providers/adapters.ts` | 7 protocoles, alignement 1536 | ~330 |
| `src/business/providers/gateway.ts` | Orchestration : rotation, repli, trace | ~310 |
| `src/business/providers/embedding-provider.ts` | `EmbeddingProvider` adossé à la passerelle | ~110 |

---

## 4. Espaces d'embedding : la contrainte qui structure tout

Deux modèles différents produisent des vecteurs **incomparables**. Mélanger
`text-embedding-3-small` et `bge-m3` dans un même index ne provoque aucune
erreur : la recherche renvoie simplement des résultats faux.

Le projet matérialise donc la notion d'**espace canonique**
(`fournisseur-éditeur/modèle`) :

| Espace | Dimensions natives | Stockage | Fournisseurs |
|---|---|---|---|
| `openai/text-embedding-3-small` | 1536 | 1536 (direct) | OpenAI, OpenRouter |
| `openai/text-embedding-3-large` | 3072 | 1536 (`dimensions`) | OpenAI |
| `google/gemini-embedding-001` | 3072 | 1536 (`dimensions`) | Gemini |
| `baai/bge-m3` | 1024 | 1536 (zéros) | Novita, OpenRouter |

Trois règles en découlent :

1. **Un seul espace par index.** `planRoutes()` épingle l'espace du premier
   candidat et écarte les autres, même s'ils ont une clé. Un repli ne se fait
   qu'entre fournisseurs **du même espace** (OpenAI ↔ OpenRouter).
2. **L'espace est enregistré** dans `main.embedding_spaces` (migration 002).
   `assertSpace()` refuse toute écriture d'un autre modèle dans un index non
   vide (`EmbeddingSpaceMismatchError`).
3. **Changer d'espace se fait explicitement** : `indexer.switchSpace(espace)`
   purge l'index puis le relie au nouveau modèle.

### Pourquoi compléter par des zéros plutôt que tronquer ?

Pour `a` et `b`, ajouter des zéros aux deux vecteurs ne change ni le produit
scalaire ni les normes : le cosinus est **exactement** préservé. Tronquer, au
contraire, détruit l'information des dimensions supprimées — sauf pour les
modèles entraînés en MRL (Matryoshka), où c'est prévu. C'est pourquoi Gemini et
`text-embedding-3-large` passent par `dimensions` (réduction côté modèle), et
`bge-m3` par complétion de zéros.

---

## 5. Routage

```ts
import { createProviderGateway } from './src/business/providers/gateway.js';

const gateway = createProviderGateway();          // lit .env

const { vectors, trace } = await gateway.embed(['texte']);
// trace = { provider: 'openai', model: 'text-embedding-3-small',
//           durationMs: 82, attempts: 0, space: 'openai/text-embedding-3-small' }

const { text } = await gateway.chat([{ role: 'user', content: 'Résume…' }]);
const { results } = await gateway.search('rrf k=60', 5);
const { pages } = await gateway.fetchPages(['https://exemple.test/article']);
```

### Politiques

| Politique | Effet | Usage |
|---|---|---|
| `quality` (défaut) | Ordre du catalogue | Résultats avant coût |
| `free` | Seuls les modèles à palier gratuit | Prototypage sans facture |
| `cost` | Gratuits d'abord, payants en secours | Budget serré |

Définie par `EKTS_PROVIDER_POLICY`.

### Rotation de clés

Plusieurs comptes d'un même fournisseur se déclarent par suffixe :

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_API_KEY_2=sk-...      # jusqu'à _8
```

```dotenv
ZAI_API_KEY=…
ZAI_API_KEY_2=…
ZAI_API_KEY_3=…
```

Le curseur tourne à chaque succès : deux clés doublent le débit d'un palier
gratuit. Si une clé est refusée (401), la suivante est essayée immédiatement,
dans le même appel : l'utilisateur ne voit aucune erreur. La limite est de huit
clés par fournisseur — au-delà, il s'agit d'un compte professionnel, pas d'un
palier gratuit.

### Repli et disjoncteur

- Repli **ordonné** : OpenAI → OpenRouter → Gemini → Novita, dans l'ordre de la
  chaîne planifiée, et seulement à l'intérieur de l'espace épinglé.
- `HttpClient` réessaie 408/409/425/429/5xx (jamais 400/401/403), respecte
  `Retry-After`, et applique une exponentielle avec gigue plafonnée à 8 s.
- Après **3 échecs consécutifs**, un fournisseur est relégué en fin de chaîne
  pendant 60 s, puis 120 s, 240 s… jusqu'à 10 min. Il n'est jamais supprimé :
  c'est le dernier recours si tous les autres tombent.
- Erreurs finales agrégées :
  `Aucun fournisseur disponible pour « embedding » (openai#1: ... ; gemini#1: ...)`.

---

## 6. Diagnostic : `npm run providers`

```powershell
npm run build
npm run providers
```

Sortie (clés masquées) :

```text
Fournisseurs connus   : 14 (14 livrés, 0 déclarés)
Fichier fournisseurs  : …/providers.custom.json (absent ou vide)

Fournisseur           Capacités                             Clés  État         Clé (masquée)
OpenAI                embedding, chat                       1     prêt         ********************cdef
Google Gemini         embedding, chat                       1     prêt         ***************4321
MiniMax               chat                                  1     prêt         ****************0000
Sofya                 web-search, web-fetch                 1     prêt         *****************0000

Espaces d'embedding configurés
  openai/text-embedding-3-small     1536 stockés                payant   via openai
  google/gemini-embedding-001       natif 3072 → 1536 stockés   gratuit  via gemini

Chaîne d'appel résolue (politique : quality)
  embedding    openai/text-embedding-3-small
  chat         openai/gpt-4o-mini → gemini/gemini-2.5-flash → minimax/MiniMax-M3
  web-search   sofya
  web-fetch    sofya
```

Aucun appel réseau, aucun coût. En cas d'oubli, la commande signale :
« aucune clé détectée », un espace multiple, un fournisseur non vérifié, ou un
fichier de déclaration invalide (elle s'arrête alors avec le message de
validation).

---

## 7. Brancher les embeddings multi-fournisseurs

```ts
import { EmbeddingsService } from './src/business/embeddings.js';
import { createProviderGateway } from './src/business/providers/gateway.js';
import { GatewayEmbeddingProvider, resolveEmbeddingSpace } from './src/business/providers/embedding-provider.js';
import { VectorIndexer, withVectorIndexing } from './src/business/vector-indexer.js';
import { VectorRepository } from './src/data/vector-repository.js';
import { createKnowledgeManager } from './src/business/knowledge-manager.js';

const gateway = createProviderGateway();
const space = resolveEmbeddingSpace(gateway);        // échoue explicitement si aucune clé
const provider = new GatewayEmbeddingProvider(gateway);
const embeddings = new EmbeddingsService({ provider }); // Sprint 4, inchangé
const vectors = new VectorRepository(connection);

const indexer = new VectorIndexer(embeddings, vectors, { space });
const manager = withVectorIndexing(createKnowledgeManager(connection).manager, indexer);
```

`EmbeddingsService` n'a pas été modifié : la passerelle se glisse derrière
l'interface `EmbeddingProvider` existante (lots, validation, erreurs typées).

---

## 8. Sécurité des clés

| Risque | Mesure |
|---|---|
| Commit accidentel | `.env` ignoré par Git, `.env.example` seul versionné, Gitleaks en pre-commit et en CI |
| Fuite dans un log | `maskKey()` (4 derniers caractères, jamais pour < 12), `redactKeys()` sur tous les messages d'erreur |
| Fuite dans une capture | `npm run providers` n'affiche que des formes masquées |
| Clé dans une URL | Seul SerpApi la place en paramètre (contrainte de l'API) ; les journaux ne contiennent jamais l'URL complète |
| Élévation de privilèges | Aucun fournisseur ne reçoit de clé d'un autre : le trousseau est indexé par fournisseur |

En cas de fuite : révoquer côté fournisseur, régénérer, puis vérifier
`npm run security:secrets`. La clé compromise doit être considérée comme
publique même si elle a été supprimée d'un commit ultérieur.

---

## 9. Déclarer un fournisseur sans toucher au code

Le catalogue couvre quatorze fournisseurs, mais il en existe des dizaines
d'autres — et de nouveaux apparaissent régulièrement, souvent avec un palier
gratuit. Attendre une version du logiciel pour brancher un service serait une
dépendance inutile.

Créez `providers.custom.json` à la racine (ignoré par Git), en partant de
`providers.custom.example.json` :

```json
[
  {
    "id": "mistral",
    "label": "Mistral",
    "envKeys": ["MISTRAL_API_KEY"],
    "baseUrl": "https://api.mistral.ai/v1",
    "protocol": "openai-compatible",
    "capabilities": ["chat"],
    "chat": [{ "model": "mistral-large-latest", "free": false }],
    "docsUrl": "https://docs.mistral.ai"
  }
]
```

Puis, dans `.env` :

```dotenv
MISTRAL_API_KEY=…
# MISTRAL_API_KEY_2=…    # la rotation multi-clés s'applique aussi
```

`npm run providers` affiche immédiatement la nouvelle ligne et sa place dans la
chaîne d'appel. Un emplacement différent se choisit avec
`EKTS_PROVIDERS_FILE=config/mes-fournisseurs.json`.

### 9.1 Ce que le fichier peut et ne peut pas faire

| Possible | Impossible (et pourquoi) |
|---|---|
| Ajouter un fournisseur compatible OpenAI, Tavily, Serper, SerpApi, Sofya ou E2B | Inventer un protocole : `unknown` est refusé, un protocole inconnu produirait un 400 systématique |
| Remplacer une entrée livrée (autre région, plan « coding », proxy) | Écrire une clé dans le fichier : seul le **nom** de la variable est accepté, l'en-tête `authorization` est refusé |
| Déclarer plusieurs modèles et leurs paliers | Utiliser `http://` : HTTPS est exigé, une clé ne voyage pas en clair |
| Utiliser les suffixes `_2`…`_8` | Déclarer deux fois le même identifiant |

Un fournisseur ajouté en fin de liste passe **après** les fournisseurs livrés :
il ne prend jamais la priorité sur un fournisseur éprouvé. Pour changer cela,
soit on modifie l'ordre du catalogue, soit on impose une politique (`free`).

### 9.2 Validation

Le fichier est validé au chargement (Zod) ; une erreur est bloquante et
explicite, avec le chemin du champ fautif :

```text
Déclaration de fournisseurs invalide : Validation échouée : providers.custom.json
→ 0.baseUrl : HTTPS obligatoire : une clé ne voyage pas en clair
```

Un fichier absent n'est pas une erreur : c'est la configuration par défaut.

### 9.3 Ajouter un fournisseur au catalogue livré

Si le fournisseur a vocation à être partagé (protocole nouveau, modèle à
maintenir), il faut passer par le code :

1. **Cataloguer** — ajouter une entrée à `PROVIDERS` (`id`, `label`, `envKeys`,
   `baseUrl`, `protocol`, `capabilities`, modèles, `docsUrl`, `status`).
2. **Vérifier le protocole** — s'il est compatible OpenAI, aucun code à écrire :
   ce protocole couvre déjà neuf fournisseurs. Sinon, ajouter une fonction à
   `adapters.ts` et un cas dans `searchWith()` ou `fetchWith()`.
3. **Tester** — `tests/unit/providers-catalog.test.ts` vérifie automatiquement
   les invariants (URL, capacité, modèle, espace).
4. **Documenter** — ajouter la ligne dans le tableau §1 et la source §2.

---

## 10. Limites connues

1. **Pas de streaming** ni de sortie structurée : le chat n'expose que le texte.
2. **Pas de comptage de tokens** avant appel : un texte trop long est refusé par
   le fournisseur, pas préventivement.
3. **Coût non suivi** : la passerelle ne totalise pas les tokens consommés.
4. **Sofya `extract` et `research` non exposés** : ces opérations synthétisent
   une réponse par LLM (10 et 50 crédits). Elles relèvent du Sprint 6, où le
   coût sera piloté, pas d'une boucle de recherche documentaire.
5. **NVIDIA, DeepSeek et MiniMax** n'apportent que du chat ; les déclarer
   « embedding » exigerait un schéma de dimensions multiples.
6. **`EKTS_PROVIDER_POLICY=free`** ne garantit pas la gratuité : elle filtre sur
   le drapeau `free` du catalogue, qui reflète l'offre au 22/10/2026. Les
   capacités sans modèle (recherche, lecture, bac à sable) y sont considérées
   comme gratuites : leur coût est à l'usage, pas au modèle.
7. **Un fournisseur déclaré n'est pas testé contre son API** : la validation est
   structurelle. Un `baseUrl` correct mais un modèle inexistant n'échoue qu'au
   premier appel — c'est pourquoi les fournisseurs livrés sont vérifiés à la
   source (§2).

---

## 11. Dépannage

| Symptôme | Cause probable | Correction |
|---|---|---|
| `Aucun fournisseur disponible pour « embedding »` | Aucune clé d'embedding | `Copy-Item .env.example .env`, renseigner une clé, `npm run providers` |
| `Espace d'embedding incompatible` | Index construit avec un autre modèle | `indexer.switchSpace(espace)` puis réindexation |
| `Fournisseur openai [HTTP 401]` | Clé révoquée | Régénérer, ou compter sur la clé `_2` |
| `PROVIDER_RATE_LIMITED` | Quota épuisé | Ajouter une clé suffixée, ou `EKTS_PROVIDER_POLICY=free` |
| `EKTS_PROVIDER_POLICY invalide` | Valeur hors `quality`/`free`/`cost` | Corriger `.env` |
| `.env` ignoré | Fichier absent ou hors du répertoire courant | `npm run providers` affiche « Fichier .env : chargé/absent » |
| `Déclaration de fournisseurs invalide` | `providers.custom.json` mal formé | Le message indique le champ fautif (chemin `0.baseUrl`, par exemple) |
| Un fournisseur déclaré n'apparaît pas | `id` en double, ou fichier hors du répertoire courant | Vérifier `EKTS_PROVIDERS_FILE` et la ligne « Fichier fournisseurs » de `npm run providers` |
| `protocole de lecture non géré` | `web-fetch` déclaré sur un protocole sans adaptateur | Seul `sofya` implémente `web-fetch` aujourd'hui |
