# Bilan Phase 07 — RAG et Recherche Sémantique

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Durée estimée :** 1-2 semaines  
**Durée réelle :** ~1 jour

---

## 1. Résumé

La Phase 07 a établi les fondations pour un système RAG (Retrieval-Augmented Generation) dans EKTS, couvrant les stratégies de chunking, les modèles d'embedding, l'intégration avec les LLMs, et l'évaluation de la qualité.

### Décisions clés

- ✅ **Chunking par défaut** : Recursive character splitting (512 tokens, 10% overlap)
- ✅ **Modèle embedding MVP** : OpenAI text-embedding-3-small ($0.02/1M tokens, MTEB 62.3)
- ✅ **Recherche hybride** : Dense (sqlite-vec) + BM25 (FTS5) avec RRF fusion
- ✅ **Pipeline RAG** : Retrieval → Reranking (optionnel) → LLM avec citations
- ✅ **Évaluation** : Recall@5 (≥0.75), Faithfulness (≥0.80), Answer Relevance (≥0.75)

---

## 2. Livrables produits

| # | Fichier | Taille | Description |
|---|---------|--------|-------------|
| 1 | `07_ETUDE_RAG_RECHERCHE_SEMANTIQUE.md` | ~25 KB | Stratégies chunking, modèles embedding, pipeline RAG |
| 2 | `07_JEU_TEST_RECUPERATION.md` | ~20 KB | Jeu de test 100 questions, protocoles, métriques |
| 3 | `BILAN_PHASE_07.md` | ~12 KB | Ce document |

---

## 3. Ce qui est établi

### 3.1 Stratégies de chunking

**Recommandations par type de contenu :**
- **Par défaut** : Recursive character splitting (512 tokens, 10% overlap)
- **Documentation** : Structure-aware (sur headings ##)
- **Code** : AST-aware (par fonction/classe)
- **Upgrade si besoin** : Contextual retrieval (prépendre contexte avant embedding)

**Constat clé (étude 2026) :**
- Overlap ne fournit **pas de bénéfice mesurable**
- Context cliff à ~2,500 tokens
- Sentence chunking ≈ semantic chunking jusqu'à 5,000 tokens

### 3.2 Modèles d'embedding

**MVP : OpenAI text-embedding-3-small**
- MTEB : 62.3 (retrieval : 51.7)
- Coût : $0.02/1M tokens
- Latence : 45-60ms (p50)
- Dimensions : 1,536
- Contexte : 8,191 tokens

**Alternatives :**
- **Haute qualité** : text-embedding-3-large ($0.13/1M, MTEB 64.6)
- **Self-hosted** : BGE-M3 (MIT, 1024 dims) ou GTE-Large-EN-v1.5 (MTEB 65.4)
- **Long context** : Voyage-3-large (32K tokens, MTEB 67.4)

**Coût EKTS estimé :** ~$0.022/mois pour 50K ressources

### 3.3 Pipeline RAG

**Architecture 2026 :**
```
Query → Query rewrite (optionnel)
  ↓
Hybrid retrieval (dense top-50 + BM25 top-50, RRF)
  ↓
Reranker (Cohere/Voyage) → top 5-8
  ↓
Context builder (metadata + citations)
  ↓
LLM avec structured output → Response avec sources
```

**Implémentation EKTS :**
- Hybrid search : FTS5 + sqlite-vec avec RRF
- Reranking : Cohere rerank-v3.5 (optionnel)
- Génération : GPT-4o-mini avec prompt structuré
- Citations : [Source N] dans la réponse

### 3.4 Évaluation de la qualité

**Métriques de retrieval :**
- Recall@5 ≥0.75
- Precision@5 ≥0.70
- MRR ≥0.75

**Métriques de génération :**
- Faithfulness ≥0.80
- Answer Relevance ≥0.75
- Hallucination Rate <0.05

**Jeu de test :**
- 100 questions golden (30 factuelles, 30 conceptuelles, 20 procédurales, 10 comparatives, 10 multi-sources)
- 5,000 chunks indexés
- Baselines : BM25 seul, Vector seul, Hybride, Hybride + Rerank

---

## 4. Ce qui est rejeté

- ❌ **Overlap systématique** — pas de bénéfice mesurable (étude 2026)
- ❌ **Semantic chunking par défaut** — coûteux, pas meilleur que sentence chunking
- ❌ **Modèles embedding locaux pour MVP** — infrastructure GPU nécessaire
- ❌ **Late chunking** — nécessite modèle long-context, complexité élevée
- ❌ **Agentic chunking** — coût LLM prohibitif pour corpus large

---

## 5. Questions résolues

| Question | Réponse |
|----------|---------|
| Quelle stratégie de chunking ? | Recursive character splitting (512 tokens, 10% overlap) |
| Quel modèle d'embedding ? | OpenAI text-embedding-3-small (MVP), upgrade vers -large si besoin |
| Comment intégrer avec LLMs ? | Pipeline Retrieval → Reranking → LLM avec citations |
| Comment évaluer la qualité ? | Recall@5, Faithfulness, Answer Relevance avec seuils |
| Comment construire le jeu de test ? | 100 questions golden, 5K chunks, baselines comparatives |

---

## 6. Questions ouvertes

1. **Qualité retrieval sur corpus EKTS réel ?** — À valider avec benchmark
2. **Impact du reranking (Cohere/Voyage) ?** — Coût vs qualité à évaluer
3. **Performance sqlite-vec sur >100K vectors ?** — Benchmark nécessaire
4. **Fine-tuning modèle embedding sur corpus EKTS ?** — Si qualité insuffisante

---

## 7. Incertitudes

### Zones techniques

- **Reranking** — coût supplémentaire vs amélioration qualité
- **Contextual retrieval** — bénéfice réel sur corpus EKTS
- **Late chunking** — nécessite modèle long-context (Voyage 32K)
- **Self-hosted embeddings** — qualité vs infrastructure GPU

### Évolution

- **Modèles embedding** — évoluent rapidement (Qwen3-8B MTEB 70.6)
- **Techniques chunking** — nouvelles approches (agentic, late)
- **Évaluation RAG** — métriques et outils en développement

---

## 8. Progression globale

| Lot | Phases | Statut |
|-----|--------|--------|
| Lot 1 | 01-03 | ✅ Terminé (Fondations, MCP, Conception) |
| Lot 2 | 04-05, 08 | 🔄 En cours (04 ✅, 05 ✅, 08 ⏳) |
| Lot 3 | 06-07, 09 | 🔄 En cours (06 ✅, 07 ✅, 09 ⏳) |
| Lot 4 | 10-12 | ⏳ À venir |
| Lot 5 | 13-14 | ⏳ À venir |

**Total livrables :** 23 terminés sur 37 (62%)

---

## 9. Phase suivante recommandée

**Phase 08 — Analyse de l'Expérience et Rapports d'Inspection**

### Objectif
Définir comment analyser et rapporter les inspections de sites (Phase 04) pour en extraire des insights actionnables.

### Questions clés
- Comment structurer un rapport d'inspection ?
- Quelles métriques extraire et comparer ?
- Comment détecter les patterns et anomalies ?
- Comment intégrer avec le RAG (Phase 07) ?

### Livrables attendus
1. `08_METHODE_ANALYSE_EXPERIENCE.md` — Méthodologie d'analyse
2. `08_SCHEMA_RAPPORT_INSPECTION.md` — Structure des rapports

### Durée estimée
1 semaine

### Dépendances
- ✅ Phase 04 terminée — Playwright, niveaux d'inspection L1-L4
- ✅ Phase 07 terminée — RAG, recherche hybride

---

## 10. Décisions architecturales pour la suite

### Impact sur Phase 08 (Analyse)

Les décisions de Phase 07 impactent directement l'analyse :

- **RAG** — peut utiliser les inspections indexées pour répondre aux questions
- **Recherche hybride** — FTS5 + vector pour trouver des patterns similaires
- **Embeddings** — similarité sémantique entre inspections

### Impact sur Phase 09 (Créatif)

- **Ressources créatives** — peuvent être indexées avec embeddings
- **Recherche sémantique** — trouver des ressources similaires
- **RAG** — répondre aux questions sur le design, motion, 3D

### Impact sur Phase 13 (Architecture)

- **RAG pipeline** — composant clé de l'architecture EKTS
- **Modèle embedding** — choix impacte l'infrastructure
- **Évaluation continue** — monitoring qualité retrieval

---

## 11. Annexes

### A. Configuration RAG recommandée

```typescript
// Chunking
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50,
  separators: ['\n\n', '\n', '. ', ' ', '']
});

// Embedding
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const embeddingModel = 'text-embedding-3-small';

// Retrieval
const searchConfig = {
  hybrid: true,
  ftsLimit: 50,
  vectorLimit: 50,
  rrfK: 60,
  rerank: false,  // Optionnel
  topK: 8
};

// Generation
const llmConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 1000,
  responseFormat: { type: 'json_object' }
};
```

### B. Métriques de monitoring

| Métrique | Seuil d'alerte | Action |
|----------|----------------|--------|
| Recall@5 | <0.65 | Vérifier chunking, embedding |
| Faithfulness | <0.70 | Améliorer prompt, augmenter top-K |
| Hallucination Rate | >0.10 | Prompt plus strict, réduire temperature |
| P95 Latency | >500ms | Vérifier index size, modèle embedding |

### C. Coûts estimés EKTS

**Hypothèses :**
- 50,000 ressources
- 10,000 requêtes/mois
- text-embedding-3-small

**Coûts mensuels :**
- Embeddings : ~$0.022
- LLM (GPT-4o-mini) : ~$0.50
- **Total** : ~$0.52/mois

---

## 12. Sources

### Chunking
- **arXiv 2601.14123** : Systematic Analysis of Chunking Strategies (janvier 2026)
- **Anthropic** : Contextual Retrieval
- **Jina AI** : Late Chunking (arXiv 2409.04701)

### Embeddings
- **MTEB leaderboard** : https://huggingface.co/spaces/mteb/leaderboard
- **OpenAI** : text-embedding-3 documentation
- **localaimaster.com** : Local vs OpenAI Embeddings (avril 2026)

### RAG Evaluation
- **DeepEval** : https://deepeval.com
- **RAGAS** : https://github.com/explodinggradients/ragas
- **BEIR** : NeurIPS 2021

---

**Bilan rédigé le 21 octobre 2026 — Phase 07 du projet EKTS**
