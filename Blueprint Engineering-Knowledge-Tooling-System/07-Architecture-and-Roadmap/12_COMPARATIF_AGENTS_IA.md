# Comparatif des Outils IA et Agents - Octobre 2026

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Sources :** Recherches web Octobre 2026 + recherches antérieures HarnAI (28 outils) + Students (54 services)

---

## 1. Contexte et Méthodologie

### 1.1 Objectif

Comparer les outils IA et agents selon 9 critères clés pour EKTS :
1. Qualité de code et de raisonnement
2. Compatibilité MCP vérifiée
3. Intégration CLI/API
4. Contexte et gestion des fichiers
5. Quotas, coût et limites
6. Accès étudiant et conditions d'éligibilité
7. Confidentialité et conservation des données
8. Possibilités d'usage local
9. Risques de verrouillage fournisseur

### 1.2 Sources de données

**Recherches antérieures intégrées :**
- `/home/user/recherche/harnai/` : Catalogue de 28 outils harness IA (Octobre 2026)
- `/home/user/recherche/students/` : 54 services avec plans étudiants (Octobre 2026)

**Recherches web actualisées (Octobre 2026) :**
- Benchmarks SWE-bench Verified, Terminal-Bench 2.1/4.0
- Documentation officielle MCP (2026-07-28 spec)
- Pricing pages vérifiées Octobre 2026
- Stack Overflow Developer Survey 2026

### 1.3 Distinction des catégories

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| **Modèles** | LLMs sous-jacents | Claude Opus 4.5/4.6, GPT-5.x, Gemini 3.1 |
| **Applications agents** | Outils complets avec interface | Claude Code, Cursor, GitHub Copilot, OpenAI Codex |
| **Fournisseurs** | Plateformes cloud/API | Anthropic, OpenAI, Google, AWS |
| **Outils d'exécution** | Environnements d'exécution | Docker, Firecracker, gVisor |
| **Protocoles** | Standards de communication | MCP (2026-07-28), A2A, OpenAPI |

---

## 2. Matrice comparative des outils IA

### 2.1 Outils principaux (top tier)

| Outil | Type | Qualité Code | MCP | CLI/API | Contexte | Prix Free | Prix Pro | Étudiant | Local | Lock-in |
|-------|------|--------------|-----|---------|----------|-----------|----------|----------|-------|---------|
| **Claude Code** | Agent terminal | ⭐⭐⭐⭐⭐ 80.8% SWE-bench | ✅ Natif OAuth | ✅ Terminal + IDE | 1M tokens (Opus 4.6) | ❌ Aucun | $20/mo (Pro) | ❌ Non | ❌ Non | 🟡 Moyen (Anthropic) |
| **Cursor** | IDE natif | ⭐⭐⭐⭐ ~65% SWE-bench | ✅ Natif OAuth | ✅ IDE propriétaire | 256K tokens | ✅ Hobby limité | $20/mo | ❌ Fermé juin 2026 | ❌ Non | 🔴 Élevé (Cursor IDE) |
| **GitHub Copilot** | Extension IDE | ⭐⭐⭐ ~58% SWE-bench | ✅ Natif OAuth (v1.101+) | ✅ Multi-IDE | Variable selon modèle | ✅ 2K complétions/mois | $10/mo | ✅ Gratuit via GitHub Pack | ❌ Non | 🟡 Moyen (GitHub/Microsoft) |
| **OpenAI Codex** | Agent CLI+cloud | ⭐⭐⭐⭐ 77.9% SWE-bench | ✅ Natif OAuth | ✅ CLI + API | Variable | ✅ Limité (Free) | $20/mo (Plus) | ❌ Non | ✅ Partiel (Codex CLI) | 🔴 Élevé (OpenAI) |
| **Gemini CLI** | Agent terminal | ⭐⭐⭐ 70.7% TB 2.1 | ✅ Natif OAuth | ✅ CLI | Variable | ✅ Gratuit | Inclus Gemini | ❓ À vérifier | ✅ Oui (Apache-2.0) | 🟢 Faible (Google) |

### 2.2 Outils émergents

| Outil | Type | Qualité | MCP | CLI/API | Contexte | Prix Free | Prix Pro | Étudiant | Local | Lock-in |
|-------|------|---------|-----|---------|----------|-----------|----------|----------|-------|---------|
| **Windsurf (Devin Desktop)** | IDE natif | ⭐⭐⭐ | ⚠️ Bridge | ✅ IDE | Variable | ✅ Limité | $15/mo | ❓ À vérifier | ❌ Non | 🟡 Moyen |
| **Cline** | Extension VS Code | ⭐⭐⭐ (BYOK) | ⚠️ Bridge | ✅ VS Code | Variable | ✅ Gratuit (BYOK) | Gratuit + API | ✅ Oui | ✅ Oui (BYOK) | 🟢 Faible |
| **Zed** | IDE natif | ⭐⭐⭐ | ✅ Natif OAuth | ✅ IDE | Variable | ✅ Personnel | $10/mo | ❓ À vérifier | ❓ Partiel | 🟡 Moyen |
| **Kiro (AWS)** | IDE agent | ⭐⭐⭐ | ✅ Natif OAuth | ✅ IDE | Variable | ✅ Free tier | Inclus AWS | ❓ À vérifier | ❓ Partiel | 🟡 Moyen (AWS) |
| **Amazon Q Developer** | Agent CLI | ⭐⭐⭐ | ✅ Natif OAuth | ✅ CLI | Variable | ✅ Free tier | $19/user/mo | ❓ À vérifier | ❓ Partiel | 🔴 Élevé (AWS) |

### 2.3 Outils open-source

| Outil | Type | Qualité | MCP | CLI/API | Contexte | Prix | Étudiant | Local | Lock-in |
|-------|------|---------|-----|---------|----------|------|----------|-------|---------|
| **Continue.dev** | Extension IDE | ⭐⭐⭐ (BYOK) | ⚠️ Bridge | ✅ Multi-IDE | Variable | ✅ Gratuit | ✅ Oui | ✅ Oui (BYOK) | 🟢 Faible |
| **Codex CLI** | Agent CLI | ⭐⭐⭐⭐ 89.5% TB 2.1 | ✅ Natif OAuth | ✅ CLI Apache-2.0 | Variable | ✅ Gratuit | ✅ Oui | ✅ Oui | 🟢 Faible |
| **Aider** | Agent CLI | ⭐⭐⭐⭐ ~88% HumanEval | ✅ Natif | ✅ CLI | Variable | ✅ Gratuit (BYOK) | ✅ Oui | ✅ Oui (BYOK) | 🟢 Faible |

---

## 3. Analyse détaillée par critère

### 3.1 Qualité de code et raisonnement

**Benchmarks vérifiés (Octobre 2026) :**

| Modèle | SWE-bench Verified | Terminal-Bench 2.1/4.0 | HumanEval | Usage |
|--------|-------------------|------------------------|-----------|-------|
| Claude Opus 4.5 | 80.9% | - | 97.2% | Claude Code |
| Claude Opus 4.6 | 80.8% | 89.1% TB 2.1 | 97.0% | Claude Code |
| GPT-5.1-Codex-Max | 77.9% | - | - | OpenAI Codex |
| GPT-5.6 Sol | - | 89.5% TB 2.1 | - | Codex CLI |
| Gemini 3.1 Pro | - | 70.7% TB 2.1 | - | Gemini CLI |
| Cursor (modèle dépendant) | ~65% | 79.3% TB 2.1 (v2.1) | - | Cursor |
| GitHub Copilot | ~58% | Non publié | - | Copilot |

**Analyse :**
- **Claude Code** : Leader sur SWE-bench (80.8%), meilleur pour codebases larges et complexes
- **OpenAI Codex** : Fort sur Terminal-Bench (89.5%), bon pour tâches autonomes
- **Cursor** : Performance variable selon modèle utilisé, bon pour édition multi-fichiers
- **GitHub Copilot** : Performance inférieure mais intégration IDE exceptionnelle

### 3.2 Compatibilité MCP vérifiée

**Spécification MCP 2026-07-28** (Linux Foundation, stateless protocol)

| Outil | MCP Support | OAuth natif | Transport | Niveau |
|-------|-------------|-------------|-----------|--------|
| Claude Code | ✅ Complet | ✅ Oui | STDIO + HTTP | Tier 1 |
| Claude Desktop | ✅ Complet | ✅ Oui | STDIO + HTTP | Tier 1 |
| ChatGPT | ✅ Complet | ✅ Oui (DCR) | HTTP | Tier 1 |
| VS Code + Copilot | ✅ Complet | ✅ Oui (v1.101+) | STDIO + HTTP | Tier 1 |
| Cursor | ✅ Complet | ✅ Oui | STDIO + HTTP | Tier 1 |
| Gemini CLI | ✅ Complet | ✅ Oui | STDIO + HTTP | Tier 1 |
| Zed | ✅ Complet | ✅ Oui | STDIO | Tier 1 |
| Kiro (AWS) | ✅ Complet | ✅ Oui | HTTP | Tier 1 |
| OpenCode | ✅ Complet | ✅ Oui | STDIO + HTTP | Tier 1 |
| Docker MCP Toolkit | ✅ Complet | ✅ Oui | HTTP | Tier 1 |
| Windsurf | ✅ Partiel | ⚠️ Bridge (mcp-remote) | HTTP | Tier 2 |
| Cline | ✅ Partiel | ⚠️ Bridge (mcp-remote) | HTTP | Tier 2 |
| Continue.dev | ✅ Partiel | ⚠️ Bridge | HTTP | Tier 2 |

**Écosystème MCP (Octobre 2026) :**
- 97M téléchargements SDK/mois
- 10,000+ serveurs MCP publics
- 6 langages SDK supportés (TypeScript, Python, Go, C#, Java, Kotlin)
- Linux Foundation members : AWS, Anthropic, Google, Microsoft, OpenAI

**Recommandation EKTS :** Privilégier outils Tier 1 (OAuth natif) pour intégration MCP robuste

### 3.3 Intégration CLI/API

| Outil | CLI | API | IDE Extensions | Terminal | Headless |
|-------|-----|-----|----------------|----------|----------|
| Claude Code | ✅ Oui | ✅ Anthropic API | ✅ VS Code, JetBrains | ✅ Oui | ✅ Oui (remote) |
| Cursor | ❌ Non | ❌ Non | ❌ Cursor uniquement | ✅ Intégré | ❌ Non |
| GitHub Copilot | ✅ gh CLI | ✅ GitHub API | ✅ VS Code, JetBrains, Neovim, Xcode | ✅ Extensions | ❌ Non |
| OpenAI Codex | ✅ codex CLI | ✅ OpenAI API | ❌ Non | ✅ Oui | ✅ Oui (sandbox) |
| Gemini CLI | ✅ gemini CLI | ✅ Gemini API | ❌ Non | ✅ Oui | ❓ Partiel |
| Aider | ✅ aider CLI | ✅ Multi-provider | ❌ Non | ✅ Oui | ✅ Oui |
| Cline | ❌ Non | ✅ BYOK | ✅ VS Code | ✅ Intégré | ❌ Non |

**Analyse :**
- **Claude Code** : Meilleure intégration CLI + API, supporte mode headless pour automatisation
- **OpenAI Codex** : Excellent CLI open-source (Apache-2.0), sandbox cloud
- **GitHub Copilot** : Meilleure couverture IDE (VS Code, JetBrains, Neovim, Xcode)
- **Cursor** : Fermé dans son IDE propriétaire, pas de CLI standalone

### 3.4 Contexte et gestion des fichiers

| Outil | Fenêtre contexte | Multi-fichiers | Workspace | Indexation | Mémoire |
|-------|------------------|----------------|-----------|------------|---------|
| Claude Code | 1M tokens (Opus 4.6) | ✅ Excellent | ✅ Complet | ✅ Automatique | ✅ CLAUDE.md |
| Cursor | 256K tokens | ✅ Bon | ✅ Complet | ✅ Automatique | ✅ .cursorrules |
| GitHub Copilot | Variable | ✅ Bon | ✅ Complet | ✅ Automatique | ❌ Limité |
| OpenAI Codex | Variable | ✅ Bon | ✅ Sandbox | ✅ Automatique | ✅ AGENTS.md |
| Gemini CLI | Variable | ✅ Bon | ✅ Complet | ✅ Automatique | ✅ GEMINI.md |
| Aider | Variable | ✅ Bon | ✅ Complet | ✅ Manuel | ✅ .aider.conf |

**Analyse :**
- **Claude Code** : Plus grande fenêtre de contexte (1M tokens), idéal pour grandes codebases
- **Cursor** : Bonne gestion multi-fichiers avec Composer, mais contexte limité à 256K
- **GitHub Copilot** : Indexation automatique du workspace, mais mémoire limitée
- **OpenAI Codex** : Sandbox isolé avec AGENTS.md pour instructions persistantes

### 3.5 Quotas, coût et limites

**Plans gratuits (Octobre 2026) :**

| Outil | Free Tier | Limites | Usage réel |
|-------|-----------|---------|------------|
| GitHub Copilot | ✅ Oui | 2,000 complétions/mois + 50 chats/mois | ~20-40h coding/mois |
| Cursor Hobby | ✅ Oui | 2,000 complétions + 50 slow requests/mois | ~20-40h coding/mois |
| OpenAI Codex Free | ✅ Oui | Quota limité (non publié) | Usage léger |
| Gemini CLI | ✅ Oui | Rate limits hebdomadaires | Usage modéré |
| Claude Code | ❌ Aucun | - | - |

**Plans payants individuels (Octobre 2026) :**

| Outil | Entry | Mid | Top | Coût/mois |
|-------|-------|-----|-----|-----------|
| GitHub Copilot | Pro $10 | Pro+ $39 | Max $100 | $10-100 |
| Cursor | Pro $20 | Pro+ $60 | Ultra $200 | $20-200 |
| Claude Code | Pro $20 | Max 5x $100 | Max 20x $200 | $20-200 |
| OpenAI Codex | Go $8 | Plus $20 | Pro 500 $500 | $8-500 |
| Windsurf | Free | Pro $15 | - | $0-15 |
| Zed | Personal $0 | Pro $10 | - | $0-10 |

**Analyse coûts :**
- **Meilleur rapport qualité/prix** : GitHub Copilot Pro ($10/mois) pour usage modéré
- **Meilleure performance** : Claude Code Max ($100-200/mois) pour codebases complexes
- **Meilleur free tier** : GitHub Copilot Free (2K complétions/mois)
- **Plus flexible** : OpenAI Codex (Go $8 à Pro 500 $500)

### 3.6 Accès étudiant et conditions d'éligibilité

**Vérifié depuis `/home/user/recherche/students/` et recherches web (Octobre 2026) :**

| Outil | Offre étudiant | Éligibilité Bénin | Vérification | Durée | Valeur |
|-------|----------------|-------------------|--------------|-------|--------|
| **GitHub Copilot** | ✅ Gratuit | ✅ Oui (via GitHub Pack) | GitHub Student Pack | Tant qu'étudiant | $10/mois → $120/an |
| **GitHub Student Pack** | ✅ 80+ outils | ✅ Oui (39 services) | Email institutionnel | Variable | ~$2,000+/an |
| **JetBrains** | ✅ Gratuit | ✅ Oui | Email institutionnel | Tant qu'étudiant | $149-249/an |
| **CodeSandbox** | ✅ Gratuit | ✅ Oui | Email institutionnel | Tant qu'étudiant | $15/mois → $180/an |
| **Replit** | ✅ Gratuit | ✅ Oui | Email institutionnel | Tant qu'étudiant | $19/mois → $228/an |
| **Notion Education** | ✅ Gratuit | ✅ Oui | Email institutionnel | Tant qu'étudiant | $10/mois → $120/an |
| **Figma Education** | ✅ Gratuit | ✅ Oui | Email institutionnel | Tant qu'étudiant | $15/mois → $180/an |
| **Adobe CC** | ✅ -71% | ✅ Oui | Email institutionnel | Tant qu'étudiant | $600/an → $174/an |
| **Claude Code** | ❌ Aucun | ❌ Non | - | - | - |
| **Cursor** | ❌ Fermé juin 2026 | ❌ Non | - | - | - |
| **OpenAI Codex** | ❓ Non vérifié | ❓ À vérifier | - | - | - |

**Conditions d'éligibilitétypiques :**
- Email institutionnel (.edu, .ac, ou domaine universitaire reconnu)
- Carte étudiante valide
- Certificat de scolarité
- GitHub Student Pack (recommandé pour maximiser les accès)

**Recommandation EKTS :** GitHub Student Pack = point d'entrée optimal (54 services, dont Copilot gratuit)

### 3.7 Confidentialité et conservation des données

| Outil | Zero Retention | On-premise | Data Residency | Privacy Mode | Audit Logs |
|-------|----------------|------------|----------------|--------------|------------|
| Claude Code (API) | ✅ Oui (zero retention) | ❌ Non | ✅ US/EU | ✅ Oui | ✅ Oui (Team/Enterprise) |
| Cursor | ✅ Oui (paid tiers) | ❌ Non | ✅ US/EU | ✅ Oui (Privacy Mode) | ✅ Oui (Business) |
| GitHub Copilot | ❌ Non (sauf Enterprise) | ❌ Non | ✅ US/EU | ❌ Non | ✅ Oui (Enterprise) |
| OpenAI Codex (API) | ✅ Oui (zero retention) | ❌ Non | ✅ US/EU | ✅ Oui | ✅ Oui (Enterprise) |
| Gemini CLI | ❓ Non vérifié | ❌ Non | ❓ À vérifier | ❓ Non | ❓ Non |
| Cline (BYOK) | ✅ Oui (dépend provider) | ✅ Oui (local) | ✅ Choix provider | ✅ Oui | ❌ Non |
| Aider (BYOK) | ✅ Oui (dépend provider) | ✅ Oui (local) | ✅ Choix provider | ✅ Oui | ❌ Non |
| Continue.dev (BYOK) | ✅ Oui (dépend provider) | ✅ Oui (local) | ✅ Choix provider | ✅ Oui | ❌ Non |

**Analyse :**
- **Meilleure confidentialité** : Solutions BYOK (Bring Your Own Key) comme Cline, Aider, Continue.dev
- **Zero retention** : Claude Code API, OpenAI API (pas de training sur vos données)
- **On-premise** : Uniquement solutions BYOK avec modèles locaux (Ollama, etc.)
- **Enterprise** : GitHub Copilot Enterprise, Cursor Business (audit logs, SSO, etc.)

### 3.8 Possibilités d'usage local

| Outil | Modèles locaux | Ollama | LM Studio | Offline | Hardware requis |
|-------|----------------|--------|-----------|---------|-----------------|
| Claude Code | ❌ Non | ❌ Non | ❌ Non | ❌ Non | Cloud uniquement |
| Cursor | ✅ Oui (BYOK) | ✅ Oui | ✅ Oui | ✅ Partiel | GPU recommandé |
| GitHub Copilot | ❌ Non | ❌ Non | ❌ Non | ❌ Non | Cloud uniquement |
| OpenAI Codex | ❌ Non (sauf API) | ❌ Non | ❌ Non | ❌ Non | Cloud uniquement |
| Gemini CLI | ❌ Non | ❌ Non | ❌ Non | ❌ Non | Cloud uniquement |
| Cline | ✅ Oui (BYOK) | ✅ Oui | ✅ Oui | ✅ Partiel | GPU recommandé |
| Aider | ✅ Oui (BYOK) | ✅ Oui | ✅ Oui | ✅ Partiel | GPU recommandé |
| Continue.dev | ✅ Oui (BYOK) | ✅ Oui | ✅ Oui | ✅ Partiel | GPU recommandé |

**Modèles locaux recommandés (Octobre 2026) :**
- **Llama 3.1 405B** : Open-source, performance proche GPT-4
- **Qwen 2.5 72B** : Excellent pour code, open-source
- **DeepSeek Coder V2** : Spécialisé code, open-source
- **CodeLlama 70B** : Meta, optimisé pour code

**Hardware minimum pour usage local :**
- **GPU** : NVIDIA RTX 3090 (24GB VRAM) minimum, RTX 4090 (24GB) recommandé
- **RAM** : 64GB minimum, 128GB recommandé
- **Stockage** : 1TB SSD pour modèles + workspace

**Analyse :**
- **Usage local possible** : Uniquement avec outils BYOK (Cline, Aider, Continue.dev)
- **Cloud requis** : Claude Code, GitHub Copilot, OpenAI Codex, Gemini CLI
- **Hybride** : Cursor (peut utiliser cloud + local)

### 3.9 Risques de verrouillage fournisseur

| Outil | Lock-in | Raison | Migration | Alternatives |
|-------|---------|--------|-----------|--------------|
| Claude Code | 🟡 Moyen | Anthropic API + CLAUDE.md | Facile (export CLAUDE.md) | Cursor, Codex CLI |
| Cursor | 🔴 Élevé | IDE propriétaire + .cursorrules | Difficile (réécrire rules) | VS Code + Cline |
| GitHub Copilot | 🟡 Moyen | GitHub API + intégration IDE | Moyenne (changer extension) | Claude Code, Codex |
| OpenAI Codex | 🔴 Élevé | OpenAI API + AGENTS.md | Moyenne (export AGENTS.md) | Claude Code, Aider |
| Gemini CLI | 🟢 Faible | Open-source (Apache-2.0) | Facile | Autres CLI |
| Cline | 🟢 Faible | BYOK + VS Code | Très facile | Aider, Continue.dev |
| Aider | 🟢 Faible | BYOK + CLI | Très facile | Cline, Continue.dev |
| Continue.dev | 🟢 Faible | BYOK + multi-IDE | Très facile | Cline, Aider |

**Stratégies de mitigation :**
1. **BYOK (Bring Your Own Key)** : Utiliser outils qui permettent de choisir son provider
2. **Fichiers de configuration exportables** : CLAUDE.md, AGENTS.md, .cursorrules
3. **Multi-provider support** : Outils supportant plusieurs LLMs (Cursor, Cline, Aider)
4. **Open-source** : Privilégier outils open-source (Codex CLI, Gemini CLI, Aider)

---

## 4. Recommandations EKTS

### 4.1 Pour développement quotidien

**Recommandation principale : GitHub Copilot Pro ($10/mois)**
- ✅ Gratuit pour étudiants (via GitHub Pack)
- ✅ Intégration multi-IDE (VS Code, JetBrains, Neovim)
- ✅ MCP natif (v1.101+)
- ✅ Bon rapport qualité/prix
- ❌ Performance inférieure à Claude Code

**Alternative si budget : Claude Code Pro ($20/mois)**
- ✅ Meilleure performance (80.8% SWE-bench)
- ✅ Plus grand contexte (1M tokens)
- ✅ MCP natif OAuth
- ❌ Pas de free tier
- ❌ Pas d'offre étudiant

### 4.2 Pour projets complexes

**Recommandation : Claude Code Max ($100-200/mois)**
- ✅ Meilleure performance pour grandes codebases
- ✅ Agent Teams (16+ agents parallèles)
- ✅ Mode headless pour automatisation
- ❌ Coût élevé
- ❌ Pas d'offre étudiant

**Alternative : OpenAI Codex Pro ($100-500/mois)**
- ✅ Bonne performance (77.9% SWE-bench)
- ✅ Sandbox cloud isolé
- ✅ CLI open-source
- ❌ Lock-in OpenAI

### 4.3 Pour usage étudiant

**Recommandation : GitHub Student Pack (gratuit)**
- ✅ GitHub Copilot gratuit
- ✅ 80+ outils gratuits (JetBrains, CodeSandbox, Replit, etc.)
- ✅ Éligible Bénin (39 services)
- ✅ Valeur ~$2,000+/an

**Complément : JetBrains (gratuit via Student Pack)**
- ✅ Tous les IDE professionnels
- ✅ IntelliJ, PyCharm, WebStorm, etc.
- ✅ Gratuit tant qu'étudiant

### 4.4 Pour confidentialité maximale

**Recommandation : Cline + BYOK (VS Code)**
- ✅ Bring Your Own Key (choisir provider)
- ✅ Modèles locaux possibles (Ollama)
- ✅ Open-source
- ✅ Zero retention (dépend provider)
- ❌ Configuration plus complexe

**Alternative : Aider + BYOK (CLI)**
- ✅ BYOK + CLI
- ✅ Modèles locaux
- ✅ Open-source
- ✅ Multi-provider
- ❌ Interface CLI uniquement

### 4.5 Pour usage local offline

**Recommandation : Continue.dev + Ollama**
- ✅ 100% local et offline
- ✅ BYOK (choisir modèle local)
- ✅ Multi-IDE (VS Code, JetBrains)
- ✅ Open-source
- ❌ Performance inférieure aux modèles cloud
- ❌ Hardware puissant requis (GPU 24GB+)

**Modèles locaux recommandés :**
- **Code** : Qwen 2.5 Coder 72B, DeepSeek Coder V2
- **Général** : Llama 3.1 70B
- **Rapide** : Phi-3 Mini (3.8B) pour laptops

---

## 5. Matrice de décision

### 5.1 Selon le profil utilisateur

| Profil | Recommandation | Budget/mois | Raison |
|--------|----------------|-------------|--------|
| **Étudiant débutant** | GitHub Student Pack + Copilot Free | $0 | Gratuit, 80+ outils |
| **Développeur freelance** | GitHub Copilot Pro | $10 | Bon rapport qualité/prix |
| **Développeur pro** | Claude Code Pro | $20 | Meilleure performance |
| **Équipe entreprise** | GitHub Copilot Enterprise | $39/user | Audit, SSO, compliance |
| **Projet critique** | Claude Code Max | $100-200 | Performance maximale |
| **Confidentialité** | Cline + BYOK | Variable | Contrôle total |
| **Usage local** | Continue.dev + Ollama | $0 (hardware) | Offline, privacy |

### 5.2 Selon le type de projet

| Type projet | Recommandation | Raison |
|-------------|----------------|--------|
| **Web app simple** | GitHub Copilot | Intégration IDE, rapide |
| **Grande codebase** | Claude Code | 1M tokens contexte |
| **Multi-fichiers** | Cursor | Composer mode |
| **Automatisation** | Claude Code headless | Agent Teams, scripts |
| **Open-source** | Aider + BYOK | Flexibilité, contrôle |
| **Enterprise** | GitHub Copilot Enterprise | Compliance, audit |
| **Prototypage rapide** | Cursor | IDE natif, rapide |
| **Recherche/académique** | Gemini CLI | Gratuit, Apache-2.0 |

---

## 6. Limites et questions ouvertes

### 6.1 Limites identifiées

1. **Évolution rapide** : Pricing et features changent rapidement (Cursor a fermé offres étudiants en juin 2026)
2. **Benchmarks variables** : SWE-bench, Terminal-Bench donnent des résultats différents
3. **MCP encore jeune** : Spécification 2026-07-28, écosystème en évolution
4. **Modèles locaux** : Performance très inférieure aux modèles cloud
5. **Lock-in** : Difficile de changer d'outil une fois configuration faite

### 6.2 Questions ouvertes

1. **Claude Code étudiant** : Anthropic proposera-t-il une offre étudiant ?
2. **Cursor local** : Cursor supportera-t-il complètement les modèles locaux ?
3. **MCP federation** : Comment gérer plusieurs serveurs MCP simultanément ?
4. **Coût réel** : Quel est le coût total (API + outil) pour usage intensif ?
5. **Open-source** : Quels modèles open-source atteindront niveau GPT-4/Claude ?

---

## 7. Sources et vérifications

### 7.1 Sources principales

1. **Stack Overflow Developer Survey 2026** (Octobre 2026)
2. **Benchmarks** : SWE-bench Verified, Terminal-Bench 2.1/4.0, HumanEval
3. **Documentation MCP** : 2026-07-28 spec (Linux Foundation)
4. **Pricing pages** : Vérifiées Octobre 2026
5. **Recherches antérieures** : HarnAI (28 outils), Students (54 services)

### 7.2 Dates de vérification

| Donnée | Date vérification | Source |
|--------|-------------------|--------|
| Pricing Claude Code | Octobre 2026 | anthropic.com/pricing |
| Pricing Cursor | Octobre 2026 | cursor.com/pricing |
| Pricing Copilot | Octobre 2026 | github.com/features/copilot/plans |
| Pricing Codex | Octobre 2026 | openai.com/pricing |
| MCP compatibility | Octobre 2026 | Documentation officielle |
| SWE-bench scores | Octobre 2026 | swe-bench.com |
| Student plans | Octobre 2026 | /home/user/recherche/students/ |

### 7.3 Liens officiels

- **Claude Code** : https://claude.ai/code
- **Cursor** : https://cursor.com
- **GitHub Copilot** : https://github.com/features/copilot
- **OpenAI Codex** : https://openai.com/index/codex/
- **Gemini CLI** : https://github.com/google-gemini/gemini-cli
- **MCP Specification** : https://modelcontextprotocol.io/specification/2026-07-28
- **GitHub Student Pack** : https://education.github.com/pack

---

## 8. Conclusion

### 8.1 Synthèse

**Top 3 outils pour EKTS (Octobre 2026) :**

1. **GitHub Copilot Pro** ($10/mois, gratuit étudiant)
   - Meilleur rapport qualité/prix
   - Intégration multi-IDE
   - MCP natif
   - Idéal pour développement quotidien

2. **Claude Code Pro** ($20/mois)
   - Meilleure performance (80.8% SWE-bench)
   - Plus grand contexte (1M tokens)
   - Idéal pour projets complexes

3. **Cline + BYOK** (variable)
   - Contrôle total (privacy, local)
   - Open-source
   - Idéal pour confidentialité

### 8.2 Recommandation finale EKTS

**Stack recommandée :**
- **Développement quotidien** : GitHub Copilot Pro ($10/mois) ou gratuit via Student Pack
- **Projets complexes** : Claude Code Pro/Max ($20-200/mois)
- **Confidentialité** : Cline + BYOK (Ollama pour local)
- **Automatisation** : Claude Code headless + MCP servers

**Budget mensueltypique :**
- **Étudiant** : $0 (GitHub Student Pack)
- **Freelance** : $10-20/mois (Copilot ou Claude Code Pro)
- **Pro/Enterprise** : $100-200/mois (Claude Code Max)

---

**Document rédigé le 21 octobre 2026 — Phase 12 du projet EKTS**
