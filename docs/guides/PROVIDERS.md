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
| Fournisseurs déclarés | 13 (dont 1 non vérifié) |
| Capacités | `embedding`, `chat`, `web-search`, `sandbox` |
| Protocoles filaires | 6 (dont 1 « inconnu ») |
| Dépendance ajoutée | **aucune** (`fetch` natif Node 22) |
| Tests | 391 au total, couverture 100 % |

---

## 1. Ce que chaque clé débloque réellement

Toutes les clés sont **facultatives**. Sans aucune clé, le projet fonctionne en
recherche lexicale (BM25) ; l'indexation vectorielle est simplement indisponible.

| Fournisseur | Variable(s) | Embedding | Chat | Web | Sandbox |
|---|---|:--:|:--:|:--:|:--:|
| OpenAI | `OPENAI_API_KEY` | ✅ 1536 | ✅ | — | — |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ 1536 / 1024 | ✅ | — | — |
| Google Gemini | `GEMINI_API_KEY`, `GOOGLE_API_KEY` | ✅ 3072 → 1536 | ✅ | — | — |
| DeepSeek | `DEEPSEEK_API_KEY` | — | ✅ | — | — |
| Z.ai (GLM) | `ZAI_API_KEY`, `Z_AI_API_KEY` | — | ✅ | — | — |
| NVIDIA NIM | `NVIDIA_API_KEY`, `NVIDIA_NIM_API_KEY` | — | ✅ | — | — |
| Novita | `NOVITA_API_KEY` | ✅ 1024 → 1536 | ✅ | — | — |
| StepFun | `STEPFUN_API_KEY`, `STEP_API_KEY` | — | ✅ | — | — |
| Tavily | `TAVILY_API_KEY` | — | — | ✅ | — |
| Serper | `SERPER_API_KEY` | — | — | ✅ | — |
| SerpApi | `SERPAPI_API_KEY`, `SERPLY_API_KEY` | — | — | ✅ | — |
| E2B | `E2B_API_KEY` | — | — | — | ✅ (Sprint 8) |
| Sofya | `SOFYA_API_KEY` | — | — | — | — |

**Pourquoi si peu de fournisseurs d'embedding ?** Une clé d'embedding n'est
utilisable que si le modèle produit des vecteurs **comparables à ceux déjà
stockés**. DeepSeek, Z.ai, NVIDIA et StepFun n'exposent pas d'API d'embedding ou
seulement des modèles hors schéma (1024/4096 dimensions, asymétriques avec
`input_type`) : les accepter reviendrait à corrompre silencieusement l'index.

Les fournisseurs sans embedding restent utiles : le chat servira au Sprint 6
(synthèse RAG, juge de fidélité), la recherche web à la veille, E2B au Sprint 8.

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
| Tavily | `https://api.tavily.com/search` | `docs.tavily.com` |
| Serper | `https://google.serper.dev/search` | `serper.dev` |
| SerpApi | `https://serpapi.com/search.json` | `serpapi.com/search-api` |

Deux points valent d'être notés :

- **Gemini** : l'API native (`:embedContent`) attend `outputDimensionality`,
  mais l'endpoint **compatible OpenAI** attend `dimensions` — envoyer le premier
  provoque `400 Unknown name`. Le catalogue utilise l'endpoint compatible et le
  paramètre `dimensions`, vérifié côté fournisseur (3072 → 1536 sans perte).
- **NVIDIA** : la documentation confirme des modèles 1024 (`nv-embedqa-e5-v5`,
  asymétrique) et 4096 (`nv-embed-v1`) ; aucun ne s'aligne sur 1536 sans perte.
  Seul le chat est donc déclaré.

---

## 3. Architecture

```text
                     ┌──────────────────────────────────────────┐
  besoin métier      │            ProviderGateway               │
  « embedding »  ───►│  plan() → routes → clés → disjoncteur    │
  « chat »       ───►│                                          │
  « web-search » ───►└───────┬──────────────────────┬───────────┘
                             │                      │
                  ┌──────────▼─────────┐   ┌────────▼──────────┐
                  │      routing       │   │       http        │
                  │ capacité, espace,  │   │ timeout, retries, │
                  │ politique, santé   │   │ Retry-After, 5xx  │
                  └──────────┬─────────┘   └────────┬──────────┘
                             │                      │
                  ┌──────────▼─────────┐   ┌────────▼──────────┐
                  │      catalog       │   │     adapters      │
                  │ 13 fournisseurs,   │   │ OpenAI-compatible │
                  │ modèles, espaces   │   │ Tavily/Serper/…   │
                  └────────────────────┘   └───────────────────┘
```

| Fichier | Rôle | Lignes |
|---|---|---|
| `src/shared/providers/types.ts` | Types purs : `Capability`, `ProviderDescriptor`, `ResolvedRoute` | — |
| `src/shared/providers/catalog.ts` | Les 13 fournisseurs, leurs modèles, espaces et notes | ~330 |
| `src/shared/providers/env.ts` | Trousseau multi-clés, masquage, rédaction | ~120 |
| `src/business/providers/routing.ts` | Chaîne d'appel : capacité → espace → politique → santé | ~160 |
| `src/business/providers/health.ts` | Disjoncteur par fournisseur | ~110 |
| `src/business/providers/http.ts` | Client JSON : timeout, reprises, erreurs typées | ~230 |
| `src/business/providers/adapters.ts` | 6 protocoles, alignement 1536 | ~250 |
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

Le curseur tourne à chaque succès : deux clés doublent le débit d'un palier
gratuit. Si une clé est refusée (401), la suivante est essayée immédiatement.

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
Fournisseur           Capacités                     Clés  État         Clé (masquée)
OpenAI                embedding, chat               1     prêt         ********************cdef
Google Gemini         embedding, chat               1     prêt         ***************4321
Sofya                 aucune                        1     non vérifié  ******************fya1

Espaces d'embedding configurés
  openai/text-embedding-3-small     1536 stockés                payant   via openai
  google/gemini-embedding-001       natif 3072 → 1536 stockés   gratuit  via gemini

Chaîne d'appel résolue (politique : quality)
  embedding    openai/text-embedding-3-small
  chat         openai/gpt-4o-mini → gemini/gemini-2.5-flash
  web-search   aucun fournisseur
```

Aucun appel réseau, aucun coût. En cas d'oubli, la commande signale :
« aucune clé détectée », un espace multiple, ou un fournisseur non vérifié.

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

## 9. Ajouter un fournisseur

1. **Cataloguer** — ajouter une entrée à `PROVIDERS` (`id`, `label`, `envKeys`,
   `baseUrl`, `protocol`, `capabilities`, modèles, `docsUrl`, `status`).
2. **Vérifier le protocole** — s'il est compatible OpenAI, aucun code à écrire :
   le protocole `openai-compatible` couvre déjà 8 fournisseurs. Sinon, ajouter
   une fonction à `adapters.ts` et un cas à `searchWith()`.
3. **Tester** — `tests/unit/providers-catalog.test.ts` vérifie automatiquement
   les invariants (URL, capacité, modèle, espace).
4. **Documenter** — ajouter la ligne dans le tableau §1 et la source §2.

Aucun autre fichier n'a besoin d'être touché : c'est précisément le point de
l'architecture.

---

## 10. Limites connues

1. **Pas de streaming** ni de sortie structurée : le chat n'expose que le texte.
2. **Pas de comptage de tokens** avant appel : un texte trop long est refusé par
   le fournisseur, pas préventivement.
3. **Coût non suivi** : la passerelle ne totalise pas les tokens consommés.
4. **Sofya** reste non vérifiée : la clé est collectée et affichée, jamais utilisée.
5. **NVIDIA et DeepSeek** n'apportent que du chat ; les déclarer « embedding »
   exigerait un schéma de dimensions multiples (hors périmètre du Sprint 4).
6. **`EKTS_PROVIDER_POLICY=free`** ne garantit pas la gratuité : elle filtre sur
   le drapeau `free` du catalogue, qui reflète l'offre au 22/10/2026.

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
