# Phase 07 — Livrable 07.1 : Étude RAG et Recherche Sémantique

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Élevé (recherche approfondie sur l'état de l'art)

---

## 1. Objectif

Étudier les meilleures pratiques pour implémenter un système RAG (Retrieval-Augmented Generation) dans EKTS, couvrant les stratégies de chunking, les modèles d'embedding, l'intégration avec les LLMs, et l'évaluation de la qualité.

---

## 2. Résumé exécutif

### Recommandations clés pour EKTS

**Chunking :**
- **Stratégie par défaut** : Recursive character splitting (512 tokens, 10-20% overlap)
- **Pour documentation** : Structure-aware splitting (sur les headings ##)
- **Pour code** : AST-aware splitting (par fonction/classe)
- **Upgrade si besoin** : Contextual retrieval (prépendre contexte avant embedding)

**Modèles d'embedding :**
- **Par défaut** : OpenAI text-embedding-3-small ($0.02/1M tokens, MTEB 62.3)
- **Haute qualité** : OpenAI text-embedding-3-large ($0.13/1M tokens, MTEB 64.6)
- **Local/open-source** : BGE-M3 (MIT, 1024 dims, multilingue) ou GTE-Large-EN-v1.5 (MTEB 65.4)

**Recherche :**
- **Hybride** : Dense (vector) + BM25 (FTS5) avec RRF fusion
- **Reranking** : Cohere ou Voyage AI pour top-5 → top-5
- **Pipeline** : Query → Hybrid retrieval → Reranker → LLM avec citations

**Évaluation :**
- **Retrieval** : Recall@5, MRR, nDCG@10
- **Génération** : Faithfulness (≥0.8), Answer Relevance (≥0.75)
- **Production** : Monitoring continu avec alertes

---

## 3. Stratégies de chunking

### 3.1 Vue d'ensemble

Le chunking est **le facteur le plus impactant** sur la qualité du RAG. Une étude de janvier 2026 a identifié :

- **Context cliff** : dégradation de la qualité au-delà de ~2,500 tokens
- **Overlap** : ne fournit **pas de bénéfice mesurable** et augmente les coûts
- **Sentence chunking** : performe aussi bien que semantic chunking jusqu'à ~5,000 tokens

### 3.2 Stratégies comparées

| Stratégie | Complexité | Taille typique | Vitesse | Rappel | Meilleur pour |
|-----------|------------|----------------|---------|--------|---------------|
| **Recursive character** | Faible | 256-1024 tok | Rapide | ★★★ | Général, prose mixte |
| **Fixed-size** | Faible | 256-512 tok | Rapide | ★★☆ | Prototypes, texte uniforme |
| **Sentence-based** | Faible | 1-5 phrases | Rapide | ★★★ | Q&A, texte court |
| **Semantic** | Moyen | Variable | ~14x lent | ★★★★ | Documents multi-thèmes |
| **Hierarchical (parent-child)** | Moyen | [2048, 512, 128] | Modéré | ★★★★ | Docs longs structurés |
| **Contextual retrieval** | Élevé | Chunk + 50-100 tok | Lent | ★★★★ | Haute précision retrieval |
| **Late chunking** | Moyen | Post-embedding | Modéré | ★★★★ | Longs docs avec cross-refs |
| **Agentic/LLM-based** | Élevé | Décidé par LLM | Lent | ★★★★★ | Contenu haute valeur |

### 3.3 Recommandations EKTS

#### Stratégie par défaut : Recursive character splitting

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,        // tokens
  chunkOverlap: 50,      // 10% overlap
  separators: ['\n\n', '\n', '. ', ' ', ''],
  lengthFunction: (text) => text.split(/\s+/).length
});

const chunks = await splitter.splitText(documentContent);
```

**Pourquoi :**
- Simple et rapide
- Respecte les limites naturelles (paragraphes, phrases)
- Performance 69% accuracy (Vecta benchmark 2026)
- Bon point de départ pour itérer

#### Pour documentation technique : Structure-aware

```typescript
function splitOnHeadings(markdown: string): Chunk[] {
  const sections = markdown.split(/^##\s+/m);
  
  return sections.map(section => {
    const [heading, ...content] = section.split('\n');
    return {
      content: content.join('\n'),
      metadata: {
        heading: heading?.trim(),
        path: extractHeadingPath(section)  // H1 > H2 > H3
      }
    };
  });
}
```

**Pourquoi :**
- Respecte la structure du document
- Préserve le contexte hiérarchique
- Idéal pour docs Markdown, wikis, manuels

#### Pour code : AST-aware splitting

```typescript
function splitCodeByFunction(code: string, language: string): Chunk[] {
  // Utiliser un parser AST (tree-sitter, babel, etc.)
  const ast = parseCode(code, language);
  
  return extractFunctionsAndClasses(ast).map(node => ({
    content: node.source,
    metadata: {
      type: node.type,  // 'function', 'class', 'method'
      name: node.name,
      startLine: node.loc.start.line,
      endLine: node.loc.end.line
    }
  }));
}
```

**Pourquoi :**
- Garde les fonctions/classes intactes
- Métadonnées riches (nom, type, lignes)
- Évite les coupures mid-function

#### Upgrade : Contextual retrieval (si précision critique)

```typescript
async function addContextToChunk(
  document: string,
  chunk: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `
${document.slice(0, 3000)}

---

${chunk}

---

Écris un contexte bref (2-3 phrases) expliquant où ce chunk apparaît 
dans le document et de quoi il parle. Sois concis.`
    }],
    max_tokens: 100
  });
  
  const context = response.choices[0].message.content;
  return `${context}\n\n${chunk}`;
}
```

**Pourquoi :**
- Réduit les échecs de retrieval top-20 de ~67% (Anthropic)
- Coût : ~$1.02/1M tokens de documentation
- Utile pour docs où les chunks perdent leur référent

### 3.4 Taille des chunks par type de requête

| Type de requête | Taille optimale | Stratégie recommandée |
|-----------------|-----------------|----------------------|
| **Factuelle/lookup** | 64-256 tokens | Sentence ou sentence-window |
| **Analytique/raisonnement** | 512-1024 tokens | Recursive ou hierarchical |
| **Résumé/synthèse** | 1024+ tokens | Hierarchical (small-to-big) |
| **Code/référence technique** | Fonction/bloc | CodeSplitter (AST-aware) |
| **Légal/contrat** | Clause-alignée | Adaptive/boundary-aware |
| **Narratif long** | 512-1024 tokens | Late chunking |

---

## 4. Modèles d'embedding

### 4.1 Vue d'ensemble du marché 2026

| Modèle | Provider | Dimensions | Coût/1M tokens | Contexte | MTEB | Meilleur pour |
|--------|----------|------------|----------------|----------|------|---------------|
| **text-embedding-3-small** | OpenAI | 1,536 | $0.02 | 8,191 | 62.3 | Production cost-conscious |
| **text-embedding-3-large** | OpenAI | 3,072 | $0.13 | 8,191 | 64.6 | Max qualité API |
| **BGE-M3** | BAAI (open-source) | 1,024 | Self-hosted | 8,192 | 63.2 | Self-hosted, hybride |
| **GTE-Large-EN-v1.5** | Alibaba (open-source) | 1,024 | Self-hosted | 8,192 | 65.4 | Self-hosted qualité |
| **Cohere embed-v4** | Cohere | 1,024 | $0.12 | 8,192 | 65.1 | Multilingue |
| **Voyage-3-large** | Voyage AI | 1,024 | $0.18 | 32,000 | 67.4 | Long context, retrieval |
| **Qwen3-Embedding-8B** | Alibaba (open-source) | 4,096 | Self-hosted | 32,000 | 70.6 | SOTA open-source |

### 4.2 Comparaison détaillée

#### API models (cloud)

**OpenAI text-embedding-3-small**
- **MTEB** : 62.3 (retrieval : 51.7)
- **Coût** : $0.02/1M tokens
- **Latence** : 45-60ms (p50)
- **Dimensions** : 1,536 (réductible via Matryoshka)
- **Contexte** : 8,191 tokens
- **Usage** : Par défaut pour EKTS (cost-effective)

**OpenAI text-embedding-3-large**
- **MTEB** : 64.6 (retrieval : 55.4)
- **Coût** : $0.13/1M tokens
- **Latence** : 80-120ms (p50)
- **Dimensions** : 3,072 (réductible)
- **Contexte** : 8,191 tokens
- **Usage** : Quand la qualité prime sur le coût

**Voyage-3-large**
- **MTEB** : 67.4 (retrieval : 58.1)
- **Coût** : $0.18/1M tokens
- **Latence** : 180ms (p50)
- **Dimensions** : 1,024
- **Contexte** : 32,000 tokens
- **Usage** : Long documents, retrieval critique

#### Self-hosted models

**BGE-M3**
- **MTEB** : 63.2 (retrieval : 58.4)
- **Coût** : Compute uniquement
- **Latence** : 28ms (GPU), 150ms+ (CPU)
- **Dimensions** : 1,024
- **Contexte** : 8,192 tokens
- **Licence** : MIT
- **Usage** : Self-hosted, hybride (dense + sparse)

**GTE-Large-EN-v1.5**
- **MTEB** : 65.4
- **Coût** : Compute uniquement
- **Latence** : 30-40ms (GPU)
- **Dimensions** : 1,024
- **Contexte** : 8,192 tokens
- **Licence** : Apache 2.0
- **Usage** : Meilleur rapport qualité/coût self-hosted

**Qwen3-Embedding-8B**
- **MTEB** : 70.6 (SOTA open-source)
- **Coût** : Compute uniquement (nécessite ~16GB VRAM)
- **Latence** : 50-80ms (GPU haute performance)
- **Dimensions** : 4,096
- **Contexte** : 32,000 tokens
- **Licence** : Apache 2.0
- **Usage** : Qualité maximale, infrastructure GPU

### 4.3 Recommandations EKTS

#### MVP (Phase 07)

**Choix : OpenAI text-embedding-3-small**

**Pourquoi :**
- Coût minimal ($0.02/1M tokens)
- Performance suffisante (MTEB 62.3)
- Intégration simple (API REST)
- Pas d'infrastructure GPU nécessaire

**Implémentation :**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536
  });
  
  return response.data[0].embedding;
}

async function batchGenerateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536
  });
  
  return response.data.map(d => d.embedding);
}
```

#### Production (si qualité critique)

**Upgrade : OpenAI text-embedding-3-large**

**Quand upgrader :**
- Retrieval accuracy < 0.75 sur le jeu de test
- Requêtes complexes (multi-concepts)
- Documents techniques denses

**Coût supplémentaire :**
- 6.5x plus cher ($0.13 vs $0.02)
- Pour 100K chunks : ~$2.60 vs ~$0.40
- Justifié si amélioration retrieval significative

#### Alternative self-hosted (si infrastructure GPU)

**Choix : BGE-M3 ou GTE-Large-EN-v1.5**

**Avantages :**
- Pas de coût récurrent (compute uniquement)
- Pas de dépendance API externe
- Latence plus faible (28-40ms vs 45-120ms)
- Contrôle total sur les données

**Inconvénients :**
- Nécessite GPU (8-16GB VRAM)
- Maintenance infrastructure
- Mises à jour manuelles

### 4.4 Estimation des coûts EKTS

**Hypothèses :**
- 50,000 ressources à indexer
- ~500 tokens par chunk (après chunking)
- 10,000 requêtes/mois

**Calcul :**
- Indexation : 50K × 500 = 25M tokens
- Requêtes : 10K × 100 = 1M tokens/mois
- **Total mensuel** : ~1.1M tokens

**Coûts :**
- **text-embedding-3-small** : $0.02 × 1.1 = **$0.022/mois**
- **text-embedding-3-large** : $0.13 × 1.1 = **$0.143/mois**

**Conclusion :** Coût négligeable pour EKTS (usage personnel)

---

## 5. Pipeline RAG complet

### 5.1 Architecture 2026

```
Query
  ↓
Query rewrite (optionnel, aide multi-turn)
  ↓
Hybrid retrieval (dense top-50 + BM25 top-50, RRF fused)
  ↓
Reranker (Cohere ou Voyage) → top 5-8
  ↓
Context builder (avec metadata + citations)
  ↓
LLM avec structured output pour citations
  ↓
Response avec sources
```

### 5.2 Implémentation EKTS

```typescript
interface RAGPipeline {
  retrieve(query: string): Promise<RetrievalResult>;
  generate(query: string, context: Chunk[]): Promise<GenerationResult>;
}

class EKTSRAGPipeline implements RAGPipeline {
  async retrieve(query: string): Promise<RetrievalResult> {
    // 1. Hybrid search (FTS5 + sqlite-vec)
    const ftsResults = await fts5Search(query, { limit: 50 });
    const vectorResults = await vectorSearch(query, { limit: 50 });
    
    // 2. RRF fusion
    const fused = reciprocalRankFusion(ftsResults, vectorResults);
    
    // 3. Reranking (optionnel, si API disponible)
    const reranked = await this.rerank(query, fused.slice(0, 20));
    
    return {
      chunks: reranked.slice(0, 8),
      scores: reranked.slice(0, 8).map(r => r.score)
    };
  }
  
  async generate(query: string, context: Chunk[]): Promise<GenerationResult> {
    // Construire le prompt
    const prompt = this.buildPrompt(query, context);
    
    // Appel LLM
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  private buildPrompt(query: string, context: Chunk[]): string {
    const contextText = context
      .map((chunk, i) => `[Source ${i + 1}] ${chunk.metadata.title}\n${chunk.content}`)
      .join('\n\n');
    
    return `
Contexte :
${contextText}

---

Question : ${query}

---

Instructions :
1. Réponds UNIQUEMENT en te basant sur le contexte fourni
2. Cite tes sources avec [Source N]
3. Si la réponse n'est pas dans le contexte, dis "Je ne sais pas"
4. Format JSON : { "answer": "...", "sources": [1, 2, ...] }
`;
  }
  
  private async rerank(query: string, chunks: Chunk[]): Promise<Chunk[]> {
    // Utiliser Cohere Rerank ou Voyage Rerank
    const response = await cohere.rerank({
      query,
      documents: chunks.map(c => c.content),
      topN: 8,
      model: 'rerank-v3.5'
    });
    
    return response.results.map(r => ({
      ...chunks[r.index],
      score: r.relevance_score
    }));
  }
}
```

### 5.3 Intégration MCP

```typescript
// Tool MCP : rag_search
{
  name: 'rag_search',
  description: 'Recherche sémantique dans EKTS avec génération de réponse',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Question ou requête' },
      top_k: { type: 'number', default: 5, description: 'Nombre de chunks à récupérer' },
      include_sources: { type: 'boolean', default: true, description: 'Inclure les sources' }
    },
    required: ['query']
  },
  handler: async (input) => {
    const pipeline = new EKTSRAGPipeline();
    const result = await pipeline.retrieve(input.query);
    const generation = await pipeline.generate(input.query, result.chunks);
    
    return {
      success: true,
      answer: generation.answer,
      sources: input.include_sources ? result.chunks.map(c => ({
        title: c.metadata.title,
        url: c.metadata.url,
        snippet: c.content.slice(0, 200)
      })) : [],
      confidence: result.scores[0] || 0
    };
  }
}
```

---

## 6. Évaluation de la qualité

### 6.1 Métriques de retrieval

| Métrique | Mesure | Seuil recommandé | Quand utiliser |
|----------|--------|------------------|----------------|
| **Recall@k** | Fraction des docs pertinents dans top-k | ≥0.75 | Quand ne rien manquer est critique |
| **Precision@k** | Pourcentage du top-k qui est pertinent | ≥0.70 | Quand context window limité |
| **MRR** | Moyenne de 1/rank du premier doc pertinent | ≥0.75 | Quand utilisateurs regardent top-1/top-3 |
| **nDCG@k** | Gain pondéré par position avec grades | ≥0.65 | Standard retrieval avec grades |

### 6.2 Métriques de génération

| Métrique | Mesure | Seuil recommandé | Ce qu'elle détecte |
|----------|--------|------------------|-------------------|
| **Faithfulness** | Réponse ancrée dans le contexte | ≥0.80 | Fabrication vs contexte |
| **Answer Relevance** | Réponse pertinente à la question | ≥0.75 | Réponses hors-sujet |
| **Context Precision** | Chunks récupérés pertinents | ≥0.70 | Retrieval bruyant |
| **Context Recall** | Retrieval a trouvé toute l'info nécessaire | ≥0.75 | Chunks trop petits ou top-K trop bas |
| **Hallucination Rate** | Claims non supportés par contexte | <5% | Invention de faits |

### 6.3 Outils d'évaluation

**DeepEval (open-source)**

```typescript
import { DeepEval } from 'deepeval';

const deepeval = new DeepEval();

// Évaluer un pipeline RAG
const results = await deepeval.evaluate({
  questions: testQuestions,
  pipeline: ragPipeline,
  metrics: [
    'context_precision',
    'context_recall',
    'faithfulness',
    'answer_relevancy'
  ]
});

console.log(results);
// {
//   context_precision: 0.78,
//   context_recall: 0.82,
//   faithfulness: 0.85,
//   answer_relevancy: 0.89
// }
```

**RAGAS (open-source)**

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

results = evaluate(
    dataset=test_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)

print(results)
```

### 6.4 Monitoring production

| Métrique | Seuil d'alerte | Action |
|----------|----------------|--------|
| Faithfulness (sampled) | <0.75 | Vérifier qualité ingestion docs |
| Answer Relevance (sampled) | <0.70 | Vérifier distribution requêtes |
| Hallucination Rate | >5% | Vérifier couverture retrieval |
| P95 Retrieval Latency | >500ms | Vérifier taille index, modèle embedding |
| Context Utilization | <40% | Vérifier chunk size, overlap |
| User Negative Feedback | >10% | Audit complet |

---

## 7. Limites et incertitudes

### 7.1 Limites techniques

**Chunking :**
- Overlap ne fournit pas de bénéfice mesurable (étude 2026)
- Context cliff à ~2,500 tokens
- Sentence chunking ≈ semantic chunking jusqu'à 5,000 tokens

**Embeddings :**
- Modèles API limités à 8,191 tokens de contexte (sauf Voyage 32K)
- Modèles self-hosted nécessitent GPU (8-32GB VRAM)
- Qualité retrieval dépend de l'alignement modèle-corpus

**RAG :**
- Retrieval accuracy explique seulement 60% de la variance end-to-end
- 40% restant = qualité de génération (comment le LLM utilise le contexte)
- Hallucinations difficiles à éliminer complètement

### 7.2 Incertitudes EKTS

**À valider avec benchmarks :**
- Qualité retrieval sur corpus EKTS spécifique (documentation technique, code)
- Impact du chunking structure-aware vs recursive
- Coût/bénéfice du reranking (Cohere/Voyage)
- Performance sqlite-vec sur >100K vectors

**Décisions reportées :**
- Late chunking (nécessite modèle long-context)
- Agentic chunking (coût LLM élevé)
- Fine-tuning modèle embedding sur corpus EKTS

---

## 8. Décisions

### Décisions prises

1. **Chunking par défaut** : Recursive character splitting (512 tokens, 10% overlap)
2. **Modèle embedding MVP** : OpenAI text-embedding-3-small ($0.02/1M tokens)
3. **Recherche hybride** : Dense (sqlite-vec) + BM25 (FTS5) avec RRF
4. **Pipeline RAG** : Retrieval → Reranking (optionnel) → LLM avec citations
5. **Évaluation** : Recall@5, Faithfulness, Answer Relevance avec seuils

### Décisions reportées

- **Reranking** : À évaluer après benchmark initial (coût vs qualité)
- **Contextual retrieval** : À tester si retrieval accuracy < 0.75
- **Modèle embedding upgrade** : text-embedding-3-large si qualité insuffisante
- **Self-hosted embeddings** : Si infrastructure GPU disponible

---

## 9. Sources

### Chunking strategies
- **arXiv 2601.14123** : "A Systematic Analysis of Chunking Strategies for Reliable Question Answering" (janvier 2026)
- **Vecta benchmark** : 7 stratégies, 50 papiers académiques (février 2026)
- **Anthropic** : Contextual Retrieval (réduction 67% échecs retrieval)
- **Jina AI** : Late Chunking (arXiv 2409.04701)

### Embedding models
- **MTEB leaderboard** : https://huggingface.co/spaces/mteb/leaderboard
- **OpenAI** : text-embedding-3 documentation (janvier 2024, mis à jour 2026)
- **localaimaster.com** : "Local vs OpenAI Embeddings: RAG Quality Benchmark" (avril 2026)
- **surrealdb.com** : "Embedding models comparison" (septembre 2026)

### RAG evaluation
- **DeepEval** : https://deepeval.com/guides/guides-rag-evaluation
- **RAGAS** : https://github.com/explodinggradients/ragas
- **futureagi.com** : "RAG Evaluation Metrics 2026" (août 2026)
- **BEIR benchmark** : Thakur et al., NeurIPS 2021

### Best practices
- **lushbinary.com** : "RAG Production Guide 2026" (avril 2026)
- **stackai.com** : "RAG Best Practices for Enterprise AI" (mars 2026)
- **redis.io** : "10 Techniques to Improve RAG Accuracy" (mai 2026)

---

**Livrable rédigé le 21 octobre 2026 — Phase 07 du projet EKTS**
