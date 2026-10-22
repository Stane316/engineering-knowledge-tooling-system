# Phase 07 — Livrable 07.2 : Jeu de Test pour Benchmark Retrieval EKTS

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Effort :** Moyen (définition de protocoles de test)

---

## 1. Objectif

Définir un jeu de test reproductible pour évaluer la qualité du retrieval dans EKTS, couvrant la construction du dataset, les métriques, les protocoles de test, et l'interprétation des résultats.

---

## 2. Résumé exécutif

### Structure du jeu de test

**Composition :**
- **100 questions golden** avec réponses de référence
- **5,000 chunks** indexés provenant de documentation technique
- **Métriques** : Recall@5, MRR, nDCG@10, Faithfulness
- **Seuils cibles** : Recall@5 ≥0.75, Faithfulness ≥0.80

**Catégories de questions :**
1. **Factuelles** (30%) — lookup simple (dates, noms, versions)
2. **Conceptuelles** (30%) — explications, définitions
3. **Procédurales** (20%) — comment faire, étapes
4. **Comparatives** (10%) — A vs B, avantages/inconvénients
5. **Multi-sources** (10%) — nécessite synthèse de plusieurs chunks

**Protocole :**
1. Indexer le corpus de test
2. Exécuter les 100 questions
3. Calculer les métriques de retrieval
4. Évaluer la génération (faithfulness, relevance)
5. Comparer avec baseline (BM25 seul, vector seul)

---

## 3. Construction du jeu de test

### 3.1 Corpus de référence

**Source : Documentation technique EKTS**

```
ekts-test-corpus/
├── sources/
│   ├── playwright-docs/          # ~50 pages Markdown
│   ├── mcp-spec/                 # ~30 pages
│   ├── sqlite-docs/              # ~40 pages
│   ├── scraping-best-practices/  # ~20 pages
│   └── code-examples/            # ~30 fichiers code commentés
├── chunks/
│   ├── indexed.json              # Chunks indexés avec metadata
│   └── ground-truth.json         # Mapping question → chunks pertinents
└── questions/
    ├── factual.json              # 30 questions factuelles
    ├── conceptual.json           # 30 questions conceptuelles
    ├── procedural.json           # 20 questions procédurales
    ├── comparative.json          # 10 questions comparatives
    └── multi-source.json         # 10 questions multi-sources
```

**Taille estimée :**
- ~170 documents sources
- ~5,000 chunks après chunking (512 tokens/chunk)
- ~100 questions golden

### 3.2 Format des questions golden

```typescript
interface GoldenQuestion {
  id: string;
  category: 'factual' | 'conceptual' | 'procedural' | 'comparative' | 'multi-source';
  question: string;
  expected_answer: string;
  relevant_chunk_ids: string[];  // Chunks contenant la réponse
  difficulty: 'easy' | 'medium' | 'hard';
  source_documents: string[];    // Documents sources
}

// Exemple
{
  id: 'factual-001',
  category: 'factual',
  question: 'Quelle est la version actuelle de Playwright en octobre 2026 ?',
  expected_answer: 'Playwright v1.64.1 est la version actuelle en octobre 2026.',
  relevant_chunk_ids: ['chunk-playwright-042', 'chunk-playwright-087'],
  difficulty: 'easy',
  source_documents: ['playwright-docs/releases.md']
}
```

### 3.3 Génération de questions

**Méthode 1 : Manuelle (haute qualité)**

```typescript
// Écrire 100 questions à la main
const questions: GoldenQuestion[] = [
  {
    id: 'conceptual-001',
    category: 'conceptual',
    question: 'Qu\'est-ce que le auto-waiting dans Playwright et pourquoi est-ce important ?',
    expected_answer: 'Le auto-waiting est un mécanisme qui attend automatiquement qu\'un élément soit actionnable avant d\'interagir avec. C\'est important car cela élimine les sleeps explicites et réduit la flakiness des tests de 60-90%.',
    relevant_chunk_ids: ['chunk-playwright-015'],
    difficulty: 'medium',
    source_documents: ['playwright-docs/auto-waiting.md']
  }
];
```

**Méthode 2 : Semi-automatique (LLM-assisted)**

```typescript
async function generateQuestionsFromChunk(
  chunk: Chunk,
  numQuestions: number = 3
): Promise<GoldenQuestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `
Voici un chunk de documentation :

${chunk.content}

---

Génère ${numQuestions} questions de test qui pourraient être répondues 
en utilisant ce chunk. Pour chaque question :
1. La question doit être naturelle (comme un utilisateur la poserait)
2. Fournis la réponse attendue (2-3 phrases)
3. Indique la catégorie : factual, conceptual, procedural, comparative

Format JSON :
[
  {
    "question": "...",
    "expected_answer": "...",
    "category": "..."
  }
]
`
    }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content).map((q, i) => ({
    id: `generated-${chunk.id}-${i}`,
    category: q.category,
    question: q.question,
    expected_answer: q.expected_answer,
    relevant_chunk_ids: [chunk.id],
    difficulty: 'medium',
    source_documents: [chunk.metadata.source]
  }));
}
```

**Méthode 3 : Outils spécialisés (RAGAS, ARES)**

```python
from ragas.testset import TestsetGenerator
from ragas.testset.evolutions import simple, reasoning, multi_context

generator = TestsetGenerator.with_openai()

testset = generator.generate_with_langchain_docs(
    documents=langchain_docs,
    test_size=100,
    distributions={simple: 0.3, reasoning: 0.4, multi_context: 0.3}
)

# Exporter au format EKTS
golden_questions = [
    {
        'id': f'ragas-{i}',
        'question': q.question,
        'expected_answer': q.answer,
        'relevant_chunk_ids': q.ground_truth,
        'category': infer_category(q.question)
    }
    for i, q in enumerate(testset.questions)
]
```

### 3.4 Distribution recommandée

| Catégorie | Nombre | Pourcentage | Difficulté |
|-----------|--------|-------------|------------|
| **Factuel** | 30 | 30% | 50% easy, 30% medium, 20% hard |
| **Conceptuel** | 30 | 30% | 20% easy, 50% medium, 30% hard |
| **Procédural** | 20 | 20% | 30% easy, 50% medium, 20% hard |
| **Comparatif** | 10 | 10% | 20% medium, 80% hard |
| **Multi-source** | 10 | 10% | 50% medium, 50% hard |
| **Total** | 100 | 100% | — |

---

## 4. Protocole de test

### 4.1 Étape 1 : Indexation du corpus

```typescript
async function indexTestCorpus(): Promise<void> {
  const corpusPath = 'ekts-test-corpus/sources';
  const documents = await loadDocuments(corpusPath);
  
  // Chunking
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50
  });
  
  const chunks = [];
  for (const doc of documents) {
    const docChunks = await splitter.splitText(doc.content);
    chunks.push(...docChunks.map((content, i) => ({
      id: `chunk-${doc.id}-${i}`,
      content,
      metadata: {
        source: doc.path,
        title: doc.title,
        chunkIndex: i,
        totalChunks: docChunks.length
      }
    })));
  }
  
  // Génération embeddings
  const embeddings = await batchGenerateEmbeddings(chunks.map(c => c.content));
  
  // Indexation SQLite
  for (let i = 0; i < chunks.length; i++) {
    db.prepare(`
      INSERT INTO chunks (id, content, metadata)
      VALUES (?, ?, ?)
    `).run(chunks[i].id, chunks[i].content, JSON.stringify(chunks[i].metadata));
    
    db.prepare(`
      INSERT INTO chunk_embeddings (chunk_id, embedding)
      VALUES (?, ?)
    `).run(chunks[i].id, Buffer.from(new Float32Array(embeddings[i]).buffer));
  }
  
  console.log(`Indexed ${chunks.length} chunks`);
}
```

### 4.2 Étape 2 : Exécution des tests

```typescript
interface TestResult {
  question_id: string;
  retrieved_chunks: string[];
  relevant_chunks: string[];
  scores: {
    recall@1: number;
    recall@5: number;
    recall@10: number;
    precision@5: number;
    mrr: number;
  };
}

async function runRetrievalTest(): Promise<TestResult[]> {
  const questions = await loadGoldenQuestions();
  const results: TestResult[] = [];
  
  for (const q of questions) {
    // Retrieval
    const retrieved = await hybridSearch(q.question, { limit: 10 });
    const retrievedIds = retrieved.map(r => r.id);
    
    // Calcul métriques
    const relevantIds = new Set(q.relevant_chunk_ids);
    
    const recallAt1 = retrievedIds.slice(0, 1).filter(id => relevantIds.has(id)).length / relevantIds.size;
    const recallAt5 = retrievedIds.slice(0, 5).filter(id => relevantIds.has(id)).length / relevantIds.size;
    const recallAt10 = retrievedIds.filter(id => relevantIds.has(id)).length / relevantIds.size;
    
    const relevantInTop5 = retrievedIds.slice(0, 5).filter(id => relevantIds.has(id)).length;
    const precisionAt5 = relevantInTop5 / 5;
    
    const firstRelevantRank = retrievedIds.findIndex(id => relevantIds.has(id)) + 1;
    const mrr = firstRelevantRank > 0 ? 1 / firstRelevantRank : 0;
    
    results.push({
      question_id: q.id,
      retrieved_chunks: retrievedIds,
      relevant_chunks: q.relevant_chunk_ids,
      scores: {
        recall@1: recallAt1,
        recall@5: recallAt5,
        recall@10: recallAt10,
        precision@5: precisionAt5,
        mrr: mrr
      }
    });
  }
  
  return results;
}
```

### 4.3 Étape 3 : Évaluation de la génération

```typescript
interface GenerationResult {
  question_id: string;
  answer: string;
  sources: number[];
  metrics: {
    faithfulness: number;
    answer_relevancy: number;
    hallucination_rate: number;
  };
}

async function evaluateGeneration(results: TestResult[]): Promise<GenerationResult[]> {
  const questions = await loadGoldenQuestions();
  const generationResults: GenerationResult[] = [];
  
  for (const result of results) {
    const question = questions.find(q => q.id === result.question_id);
    if (!question) continue;
    
    // Récupérer les chunks
    const chunks = result.retrieved_chunks.slice(0, 5).map(id => 
      db.prepare('SELECT * FROM chunks WHERE id = ?').get(id)
    );
    
    // Génération
    const pipeline = new EKTSRAGPipeline();
    const generation = await pipeline.generate(question.question, chunks);
    
    // Évaluation avec LLM
    const evalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `
Question : ${question.question}

Réponse attendue : ${question.expected_answer}

Réponse générée : ${generation.answer}

---

Évalue la réponse générée sur ces critères (0-1) :
1. Faithfulness : La réponse est-elle ancrée dans le contexte fourni ?
2. Answer Relevancy : La réponse est-elle pertinente à la question ?
3. Hallucination Rate : Y a-t-il des informations inventées (0 = aucune, 1 = beaucoup) ?

Format JSON : { "faithfulness": 0.X, "answer_relevancy": 0.X, "hallucination_rate": 0.X }
`
      }],
      response_format: { type: 'json_object' }
    });
    
    const metrics = JSON.parse(evalResponse.choices[0].message.content);
    
    generationResults.push({
      question_id: question.id,
      answer: generation.answer,
      sources: generation.sources,
      metrics
    });
  }
  
  return generationResults;
}
```

### 4.4 Étape 4 : Agrégation des résultats

```typescript
interface AggregatedMetrics {
  retrieval: {
    recall@1: number;
    recall@5: number;
    recall@10: number;
    precision@5: number;
    mrr: number;
  };
  generation: {
    faithfulness: number;
    answer_relevancy: number;
    hallucination_rate: number;
  };
  by_category: {
    [category: string]: {
      recall@5: number;
      faithfulness: number;
    };
  };
}

function aggregateResults(
  retrievalResults: TestResult[],
  generationResults: GenerationResult[]
): AggregatedMetrics {
  // Moyennes retrieval
  const avgRetrieval = {
    'recall@1': mean(retrievalResults.map(r => r.scores['recall@1'])),
    'recall@5': mean(retrievalResults.map(r => r.scores['recall@5'])),
    'recall@10': mean(retrievalResults.map(r => r.scores['recall@10'])),
    'precision@5': mean(retrievalResults.map(r => r.scores['precision@5'])),
    'mrr': mean(retrievalResults.map(r => r.scores['mrr']))
  };
  
  // Moyennes génération
  const avgGeneration = {
    faithfulness: mean(generationResults.map(r => r.metrics.faithfulness)),
    answer_relevancy: mean(generationResults.map(r => r.metrics.answer_relevancy)),
    hallucination_rate: mean(generationResults.map(r => r.metrics.hallucination_rate))
  };
  
  // Par catégorie
  const byCategory = {};
  const categories = ['factual', 'conceptual', 'procedural', 'comparative', 'multi-source'];
  
  for (const cat of categories) {
    const catRetrieval = retrievalResults.filter(r => r.question_id.startsWith(cat));
    const catGeneration = generationResults.filter(r => r.question_id.startsWith(cat));
    
    byCategory[cat] = {
      'recall@5': mean(catRetrieval.map(r => r.scores['recall@5'])),
      faithfulness: mean(catGeneration.map(r => r.metrics.faithfulness))
    };
  }
  
  return {
    retrieval: avgRetrieval,
    generation: avgGeneration,
    by_category: byCategory
  };
}
```

---

## 5. Benchmarks de référence

### 5.1 Baselines à comparer

| Configuration | Description | Objectif |
|---------------|-------------|----------|
| **BM25 seul** | FTS5 sans vector | Baseline lexical |
| **Vector seul** | sqlite-vec sans FTS5 | Baseline sémantique |
| **Hybride (RRF)** | FTS5 + sqlite-vec avec RRF | Amélioration attendue |
| **Hybride + Rerank** | Hybride + Cohere/Voyage reranker | Meilleure qualité |

### 5.2 Seuils cibles

| Métrique | Seuil minimum | Seuil cible | Seuil excellent |
|----------|---------------|-------------|-----------------|
| **Recall@5** | ≥0.65 | ≥0.75 | ≥0.85 |
| **Precision@5** | ≥0.60 | ≥0.70 | ≥0.80 |
| **MRR** | ≥0.65 | ≥0.75 | ≥0.85 |
| **Faithfulness** | ≥0.70 | ≥0.80 | ≥0.90 |
| **Answer Relevance** | ≥0.65 | ≥0.75 | ≥0.85 |
| **Hallucination Rate** | <0.10 | <0.05 | <0.02 |

### 5.3 Résultats attendus (basés sur benchmarks publics)

| Configuration | Recall@5 | Faithfulness | Latence P95 |
|---------------|----------|--------------|-------------|
| **BM25 seul** | 0.60-0.70 | 0.75 | 50ms |
| **Vector seul** | 0.70-0.80 | 0.78 | 100ms |
| **Hybride (RRF)** | 0.75-0.85 | 0.82 | 150ms |
| **Hybride + Rerank** | 0.80-0.90 | 0.85 | 300ms |

---

## 6. Interprétation des résultats

### 6.1 Diagnostic des problèmes

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| **Recall@5 faible (<0.65)** | Chunks trop petits ou embedding inadéquat | Augmenter chunk size, changer modèle embedding |
| **Precision@5 faible (<0.60)** | Retrieval bruyant, trop de chunks non pertinents | Ajouter reranking, ajuster RRF weights |
| **MRR faible (<0.65)** | Premier résultat pertinent mal classé | Reranking, ajuster stratégie de recherche |
| **Faithfulness faible (<0.70)** | LLM invente, contexte insuffisant | Améliorer prompt, augmenter top-K |
| **Answer Relevance faible (<0.65)** | Réponse hors-sujet | Améliorer prompt, vérifier retrieval quality |
| **Hallucination Rate élevé (>0.10)** | LLM fabrique des faits | Prompt plus strict, réduire temperature |

### 6.2 Actions correctives

**Si Recall@5 < 0.75 :**
1. Vérifier chunking : chunks trop petits ? → augmenter à 512-1024 tokens
2. Vérifier embedding : modèle inadéquat ? → tester text-embedding-3-large
3. Vérifier recherche : hybride activé ? → s'assurer FTS5 + vector actifs

**Si Faithfulness < 0.80 :**
1. Améliorer prompt : instructions plus strictes sur citations
2. Augmenter top-K : plus de contexte pour le LLM
3. Vérifier chunks : metadata complète (titre, source)

**Si Hallucination Rate > 0.05 :**
1. Prompt : "Si la réponse n'est pas dans le contexte, dis 'Je ne sais pas'"
2. Temperature : réduire à 0.3-0.5
3. Vérifier retrieval : chunks pertinents récupérés ?

---

## 7. Maintenance du jeu de test

### 7.1 Versioning

```bash
ekts-test-corpus/
├── versions/
│   ├── v1.0.0/           # Version initiale
│   │   ├── corpus.json
│   │   ├── questions.json
│   │   └── results.json
│   ├── v1.1.0/           # Ajout de 20 questions
│   └── v2.0.0/           # Nouveau corpus (breaking change)
└── current -> v1.1.0/    # Symlink vers version active
```

### 7.2 Mise à jour

**Quand mettre à jour :**
- Ajout de nouvelles sources de documentation
- Changement de stratégie de chunking
- Changement de modèle embedding
- Baisse de qualité détectée en production

**Process :**
1. Créer nouvelle version (v1.2.0)
2. Ajouter/modifier questions
3. Ré-indexer corpus si nécessaire
4. Exécuter tests complets
5. Comparer avec version précédente
6. Valider amélioration ou stabilité

### 7.3 CI/CD

```yaml
# .github/workflows/rag-benchmark.yml
name: RAG Benchmark

on:
  push:
    paths:
      - 'ekts-test-corpus/**'
      - 'src/rag/**'
  schedule:
    - cron: '0 0 * * 1'  # Weekly

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Index corpus
        run: npm run rag:index-test-corpus
      
      - name: Run retrieval tests
        run: npm run rag:benchmark-retrieval
      
      - name: Run generation tests
        run: npm run rag:benchmark-generation
      
      - name: Check thresholds
        run: |
          node scripts/check-thresholds.js \
            --recall@5=0.75 \
            --faithfulness=0.80
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: rag-benchmark-results
          path: results/
```

---

## 8. Limites et incertitudes

### 8.1 Limites du jeu de test

- **100 questions** : taille limitée, peut ne pas couvrir tous les cas
- **Corpus statique** : ne reflète pas l'évolution du contenu EKTS
- **Évaluation LLM** : faithfulness évaluée par LLM (biais possible)
- **Catégories fixes** : distribution artificielle vs requêtes réelles

### 8.2 Non vérifié

- Qualité des questions générées automatiquement vs manuelles
- Corrélation entre scores benchmark et satisfaction utilisateur réelle
- Stabilité des métriques dans le temps (dérive du corpus)

---

## 9. Décisions

### Décisions prises

1. **100 questions golden** : 30 factuelles, 30 conceptuelles, 20 procédurales, 10 comparatives, 10 multi-sources
2. **Corpus de test** : ~5,000 chunks de documentation technique EKTS
3. **Métriques** : Recall@5 (≥0.75), Faithfulness (≥0.80), Answer Relevance (≥0.75)
4. **Baselines** : BM25 seul, Vector seul, Hybride (RRF), Hybride + Rerank
5. **CI/CD** : benchmark hebdomadaire avec check de seuils

### Décisions reportées

- Génération automatique de questions (RAGAS) — à évaluer après benchmark manuel
- Fine-tuning modèle embedding sur corpus EKTS — si qualité insuffisante
- Expansion du jeu de test à 500 questions — si nécessaire pour production

---

## 10. Sources

### Benchmarks RAG
- **BEIR** : Thakur et al., NeurIPS 2021 (zero-shot retrieval)
- **MTEB** : Massive Text Embedding Benchmark
- **RAGAS** : https://github.com/explodinggradients/ragas
- **ARES** : Automated RAG Evaluation System

### Outils
- **DeepEval** : https://deepeval.com
- **RAGAS** : https://github.com/explodinggradients/ragas
- **LangChain** : Text splitters, retrievers

### Métriques
- **Recall@k, Precision@k** : Information retrieval standard
- **MRR** : Mean Reciprocal Rank
- **nDCG** : Normalized Discounted Cumulative Gain
- **Faithfulness, Relevancy** : RAG-specific metrics

---

**Livrable rédigé le 21 octobre 2026 — Phase 07 du projet EKTS**
