# Recommandations selon Scénarios - Octobre 2026

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Objectif :** Guide de décision pour choisir les outils IA selon le contexte

---

## 1. Introduction

### 1.1 Objectif du document

Ce document fournit des recommandations concrètes pour choisir les outils IA selon :
- **Profil utilisateur** (étudiant, freelance, entreprise, etc.)
- **Type de projet** (web, mobile, data science, etc.)
- **Contraintes** (budget, confidentialité, performance, etc.)
- **Niveau d'expérience** (débutant, intermédiaire, expert)

### 1.2 Méthodologie

**Approche :**
1. Identifier le scénario d'usage
2. Lister les contraintes principales
3. Appliquer la matrice de décision
4. Recommander la stack optimale
5. Fournir alternatives et budget

**Sources :**
- Comparatif 12_COMPARATIF_AGENTS_IA.md (qualité, MCP, pricing)
- Plans gratuits 12_PLANS_GRATUITS_ET_ETUDIANTS.md (54 services)
- Recherches web Octobre 2026 (benchmarks, pricing actualisés)

---

## 2. Matrice de décision rapide

### 2.1 Tableau de sélection

| Scénario | Budget | Performance | Confidentialité | Recommandation | Coût/mois |
|----------|--------|-------------|-----------------|----------------|-----------|
| **Étudiant débutant** | $0 | Moyen | Moyen | GitHub Student Pack + Copilot | $0 |
| **Étudiant avancé** | $0-20 | Élevé | Moyen | Student Pack + Claude Code | $0-20 |
| **Freelance web** | $10-40 | Élevé | Moyen | Copilot Pro ou Cursor Pro | $10-20 |
| **Développeur pro** | $20-100 | Très élevé | Moyen | Claude Code Pro/Max | $20-200 |
| **Équipe startup** | $19-40/user | Élevé | Élevé | Copilot Business ou Cursor Teams | $19-40/user |
| **Enterprise** | $39+/user | Élevé | Très élevé | Copilot Enterprise + Claude Code | $39+/user + $20-200 |
| **Confidentialité max** | Variable | Variable | Très élevé | Cline + BYOK (Ollama local) | Variable |
| **Usage local offline** | $0 (hardware) | Moyen | Très élevé | Continue.dev + Ollama | $0 (hardware) |
| **Data science** | $0-20 | Élevé | Moyen | Kaggle + Copilot ou Claude Code | $0-20 |
| **Prototypage rapide** | $0-20 | Moyen | Moyen | Cursor Hobby/Pro | $0-20 |

---

## 3. Scénarios détaillés

### 3.1 Étudiant en informatique

#### Profil
- **Niveau** : Débutant à intermédiaire
- **Budget** : $0-20/mois
- **Besoins** : Apprentissage, projets académiques, portfolio
- **Contraintes** : Budget limité, besoin d'outils professionnels

#### Recommandation principale : GitHub Student Pack + Copilot

**Stack optimale (coût $0) :**

| Outil | Usage | Accès | Valeur/an |
|-------|-------|-------|-----------|
| **GitHub Student Pack** | 80+ outils | Gratuit | ~$2,000 |
| **GitHub Copilot** | IA de codage | Via Student Pack | $120 |
| **JetBrains** | IDE professionnels | Via Student Pack | $249 |
| **Azure for Students** | Cloud + crédits | Email institutionnel | $100 + services |
| **Vercel Education** | Hébergement | Email institutionnel | $240 |
| **Figma Education** | Design UI/UX | Email institutionnel | $180 |
| **Notion Education** | Productivité | Email institutionnel | $120 |
| **Kaggle** | ML + GPU | Gratuit | GPU gratuits |

**Total :** $0 (valeur ~$3,000+/an)

**Pourquoi cette stack :**
- ✅ **100% gratuit** pour étudiants éligibles
- ✅ **Outils professionnels** (JetBrains, Figma, Copilot)
- ✅ **Cloud inclus** (Azure $100, Vercel illimité)
- ✅ **Apprentissage complet** (IDE, IA, cloud, design, ML)

**Alternatives si budget $20/mois :**
- Remplacer Copilot par **Claude Code Pro** ($20/mois)
- Meilleure performance pour codebases complexes

**Actions immédiates :**
1. Postuler GitHub Student Pack : https://education.github.com/pack
2. Activer GitHub Copilot (inclus)
3. Activer Azure for Students
4. Télécharger JetBrains (IntelliJ/WebStorm)
5. Activer Figma Education

---

### 3.2 Développeur freelance web

#### Profil
- **Niveau** : Intermédiaire à expert
- **Budget** : $10-40/mois
- **Besoins** : Productivité, qualité code, rapidité
- **Contraintes** : ROI rapide, outils fiables

#### Recommandation principale : GitHub Copilot Pro

**Stack optimale ($10-20/mois) :**

| Outil | Usage | Coût/mois | Raison |
|-------|-------|-----------|--------|
| **GitHub Copilot Pro** | IA de codage | $10 | Meilleur rapport qualité/prix |
| **VS Code** | IDE | $0 | Standard industrie |
| **Cursor** (optionnel) | IDE alternatif | $0-20 | Pour multi-fichiers |
| **Vercel Pro** | Hébergement | $20 | Déploiement rapide |

**Total :** $10-30/mois

**Pourquoi Copilot Pro :**
- ✅ **$10/mois** seulement (ROI rapide)
- ✅ **Multi-IDE** (VS Code, JetBrains, Neovim)
- ✅ **2,000 complétions/mois** + 50 chats/mois
- ✅ **MCP natif** (v1.101+)
- ✅ **Intégration GitHub** (PR reviews, issues)

**Alternative si besoin performance :**
- **Claude Code Pro** ($20/mois) pour projets complexes
- Meilleure performance (80.8% SWE-bench)
- 1M tokens contexte

**Stack premium ($40-60/mois) :**
- Claude Code Pro ($20) + Cursor Pro ($20)
- Meilleure IA + meilleur IDE

**Conseils freelance :**
- Commencer par Copilot Pro ($10) → excellent ROI
- Upgrader vers Claude Code si projets complexes
- Utiliser Vercel pour déploiement rapide
- MCP pour intégration outils externes

---

### 3.3 Développeur professionnel (senior)

#### Profil
- **Niveau** : Expert
- **Budget** : $20-200/mois
- **Besoins** : Performance maximale, grandes codebases, automatisation
- **Contraintes** : Qualité code, rapidité, fonctionnalités avancées

#### Recommandation principale : Claude Code Pro/Max

**Stack optimale ($20-200/mois) :**

| Outil | Usage | Coût/mois | Raison |
|-------|-------|-----------|--------|
| **Claude Code Pro** | IA principale | $20 | Meilleure performance |
| **Claude Code Max** (si besoin) | Usage intensif | $100-200 | Agent Teams, headless |
| **Cursor Pro** (optionnel) | IDE alternatif | $20 | Multi-fichiers |
| **VS Code + Copilot** | Complément | $10 | Review, suggestions |

**Total :** $20-250/mois

**Pourquoi Claude Code :**
- ✅ **Meilleure performance** (80.8% SWE-bench)
- ✅ **1M tokens contexte** (grandes codebases)
- ✅ **Agent Teams** (16+ agents parallèles sur Max)
- ✅ **Mode headless** (automatisation, scripts)
- ✅ **MCP natif OAuth** (intégration robuste)
- ✅ **Zero retention** (confidentialité API)

**Quand choisir Max ($100-200) :**
- Codebases > 1M lignes
- Besoin d'Agent Teams (tâches parallèles)
- Automatisation headless (CI/CD, scripts)
- Usage intensif (>4h/jour)

**Stack enterprise ($250-500/mois) :**
- Claude Code Max ($200) + GitHub Copilot Business ($19/user)
- Meilleure IA + collaboration équipe

**Conseils pro :**
- Commencer par Claude Code Pro ($20) → excellente performance
- Upgrader vers Max si usage intensif
- Utiliser mode headless pour automatisation
- MCP pour intégrer outils externes

---

### 3.4 Équipe startup (5-20 développeurs)

#### Profil
- **Niveau** : Mixte (junior à senior)
- **Budget** : $19-40/user/mois
- **Besoins** : Collaboration, productivité, conformité
- **Contraintes** : Budget par utilisateur, onboarding rapide

#### Recommandation principale : GitHub Copilot Business

**Stack optimale ($19-40/user/mois) :**

| Outil | Usage | Coût/user/mois | Raison |
|-------|-------|----------------|--------|
| **GitHub Copilot Business** | IA équipe | $19 | Collaboration, audit |
| **VS Code** | IDE standard | $0 | Gratuit, universel |
| **Claude Code Team** (optionnel) | Projets critiques | $25/user | Performance Max |

**Total :** $19-44/user/mois

**Pourquoi Copilot Business :**
- ✅ **$19/user/mois** (budget contrôlé)
- ✅ **Audit logs** (conformité)
- ✅ **SSO + SCIM** (gestion identités)
- ✅ **Policy management** (contrôle usage)
- ✅ **IP indemnity** (protection juridique)
- ✅ **Multi-IDE** (VS Code, JetBrains, etc.)

**Alternative si besoin performance :**
- **Claude Code Team** ($25/user) pour projets critiques
- Meilleure performance + Agent Teams

**Stack mixte ($44/user/mois) :**
- Copilot Business ($19) + Claude Code Team ($25)
- IA quotidienne + projets critiques

**Conseils startup :**
- Commencer par Copilot Business ($19/user) → ROI immédiat
- Ajouter Claude Code pour équipe senior/projets critiques
- Utiliser audit logs pour conformité
- Politique claire : Copilot pour quotidien, Claude pour critique

---

### 3.5 Enterprise (50+ développeurs)

#### Profil
- **Niveau** : Équipes mixtes
- **Budget** : $39+/user/mois
- **Besoins** : Conformité, sécurité, contrôle, support
- **Contraintes** : RGPD, audit, gouvernance

#### Recommandation principale : GitHub Copilot Enterprise

**Stack optimale ($39+/user/mois) :**

| Outil | Usage | Coût/user/mois | Raison |
|-------|-------|----------------|--------|
| **GitHub Copilot Enterprise** | IA équipe | $39 | Conformité max, support |
| **Claude Code Team/Max** | Projets critiques | $25-200 | Performance |
| **On-premise solutions** (si requis) | Confidentialité max | Variable | Cline, Aider, Continue |

**Total :** $39-239/user/mois

**Pourquoi Copilot Enterprise :**
- ✅ **$39/user/mois** (enterprise-grade)
- ✅ **Knowledge bases** (codebase indexing)
- ✅ **Fine-tuned models** (adaptés à votre code)
- ✅ **Audit logs complets** (conformité RGPD)
- ✅ **SSO + SCIM + RBAC** (gestion identités avancée)
- ✅ **IP indemnity** (protection juridique)
- ✅ **Support prioritaire** (SLA)
- ✅ **On-premise option** (si requis)

**Stack enterprise complet ($64-239/user/mois) :**
- Copilot Enterprise ($39) + Claude Code ($25-200)
- Meilleure conformité + meilleure performance

**Alternative confidentialité maximale :**
- **Cline + BYOK** (modèles locaux ou API zero-retention)
- **Aider + Ollama** (100% local, offline)
- **Continue.dev + BYOK** (multi-IDE, flexible)

**Conseils enterprise :**
- Copilot Enterprise pour conformité + support
- Claude Code pour équipes senior/projets critiques
- Solutions BYOK pour données sensibles
- Politique claire : Enterprise pour quotidien, Claude pour critique, BYOK pour sensible

---

### 3.6 Confidentialité maximale

#### Profil
- **Niveau** : Expert
- **Budget** : Variable
- **Besoins** : Contrôle total, zéro rétention, offline possible
- **Contraintes** : Données sensibles, conformité stricte

#### Recommandation principale : Cline + BYOK

**Stack optimale (variable) :**

| Outil | Usage | Coût | Raison |
|-------|-------|------|--------|
| **Cline** (VS Code) | IA contrôlée | Gratuit | BYOK, open-source |
| **Ollama** | Modèles locaux | $0 (hardware) | 100% offline |
| **Anthropic API** | Cloud zero-retention | Variable | Zero data retention |
| **OpenAI API** | Cloud zero-retention | Variable | Zero data retention |

**Total :** Variable (hardware + API)

**Pourquoi Cline + BYOK :**
- ✅ **Bring Your Own Key** (choisir provider)
- ✅ **Modèles locaux** (Ollama, LM Studio)
- ✅ **Zero retention** (Anthropic, OpenAI API)
- ✅ **Open-source** (auditabilité)
- ✅ **100% offline possible** (modèles locaux)
- ✅ **Multi-provider** (flexibilité)

**Configurations possibles :**

**Option 1 : 100% local (offline)**
- Cline + Ollama + Llama 3.1 70B
- Coût : Hardware GPU (RTX 3090/4090, ~$1,500-2,000)
- Performance : Moyenne (inférieure au cloud)
- Confidentialité : Maximale

**Option 2 : Cloud zero-retention**
- Cline + Anthropic API (Claude)
- Coût : ~$3-15/1M tokens (input/output)
- Performance : Excellente (Claude Opus 4.5/4.6)
- Confidentialité : Très élevée (zero retention)

**Option 3 : Hybride**
- Cline + Ollama (local) + Anthropic API (cloud)
- Coût : Hardware + API usage
- Performance : Mixte
- Confidentialité : Maximale (local) + Excellente (cloud)

**Alternatives :**
- **Aider + BYOK** (CLI, multi-provider)
- **Continue.dev + BYOK** (multi-IDE)

**Conseils confidentialité :**
- Modèles locaux pour données ultra-sensibles
- API zero-retention pour usage cloud
- Politique claire : local pour sensible, cloud zero-retention pour reste
- Audit régulier des configurations

---

### 3.7 Data Science et Machine Learning

#### Profil
- **Niveau** : Intermédiaire à expert
- **Budget** : $0-50/mois
- **Besoins** : GPU, notebooks, datasets, expérimentation
- **Contraintes** : Coût GPU, temps de calcul

#### Recommandation principale : Kaggle + GitHub Copilot

**Stack optimale ($0-20/mois) :**

| Outil | Usage | Coût/mois | Raison |
|-------|-------|-----------|--------|
| **Kaggle** | GPU + notebooks | $0 | 30h GPU/semaine gratuit |
| **GitHub Copilot** | IA code | $0 (student) / $10 | Aide au code |
| **Google Colab** | GPU alternatif | $0 (base) / $10-50 (Pro) | Alternative Kaggle |
| **Claude Code** (optionnel) | Analyse complexe | $20 | Grandes codebases |

**Total :** $0-30/mois

**Pourquoi Kaggle :**
- ✅ **GPU gratuits** (30h/semaine P100, 20h/semaine T4)
- ✅ **Datasets** (milliers de datasets publics)
- ✅ **Notebooks** (Jupyter intégré)
- ✅ **Compétitions** (apprentissage)
- ✅ **Communauté** (support, partage)

**Stack data science complet ($20-70/mois) :**
- Kaggle (gratuit) + Copilot ($10) + Claude Code ($20) + Colab Pro ($10)
- GPU + IA + analyse + expérimentation

**Alternatives :**
- **Google Colab Pro** ($10-50/mois) : GPU supplémentaires
- **Claude Code** ($20/mois) : Analyse grandes codebases
- **Azure ML** (via Azure for Students) : Cloud ML

**Conseils data science :**
- Kaggle pour GPU gratuits + apprentissage
- Colab Pro si besoin GPU supplémentaires
- Claude Code pour analyse codebases ML complexes
- Copilot pour code quotidien

---

### 3.8 Prototypage rapide

#### Profil
- **Niveau** : Débutant à intermédiaire
- **Budget** : $0-20/mois
- **Besoins** : Rapidité, itération, multi-fichiers
- **Contraintes** : Temps, simplicité

#### Recommandation principale : Cursor

**Stack optimale ($0-20/mois) :**

| Outil | Usage | Coût/mois | Raison |
|-------|-------|-----------|--------|
| **Cursor Hobby** | IDE + IA | $0 | Limité mais suffisant |
| **Cursor Pro** | IDE + IA complet | $20 | Multi-fichiers, rapide |
| **Vercel** | Déploiement | $0 (Hobby) | Rapide, gratuit |

**Total :** $0-20/mois

**Pourquoi Cursor :**
- ✅ **IDE natif AI-first** (conçu pour IA)
- ✅ **Multi-fichiers** (Composer mode)
- ✅ **Rapide** (itération rapide)
- ✅ **VS Code-based** (familier)
- ✅ **Free tier** (Hobby, 2,000 complétions/mois)

**Alternative si besoin performance :**
- **Claude Code** ($20/mois) pour codebases complexes
- Meilleure performance, mais pas d'IDE natif

**Stack prototypage complet ($20-40/mois) :**
- Cursor Pro ($20) + Claude Code ($20)
- Meilleur IDE + meilleure IA

**Conseils prototypage :**
- Cursor Hobby pour commencer (gratuit)
- Upgrader vers Pro si besoin multi-fichiers
- Vercel pour déploiement rapide
- Claude Code si codebase devient complexe

---

## 4. Tableaux de décision

### 4.1 Selon budget

| Budget/mois | Recommandation | Outils inclus | Performance |
|-------------|----------------|---------------|-------------|
| **$0** | GitHub Student Pack | Copilot, JetBrains, Azure, etc. | Moyen |
| **$10** | GitHub Copilot Pro | Copilot + IDE | Bon |
| **$20** | Claude Code Pro | Claude Code + IDE | Très bon |
| **$40** | Claude Code Pro + Cursor | Claude Code + Cursor | Excellent |
| **$100-200** | Claude Code Max | Claude Code Max (Agent Teams) | Maximal |
| **$39+/user** | Copilot Enterprise | Enterprise features + support | Entreprise |

### 4.2 Selon type de projet

| Type projet | Recommandation | Pourquoi | Coût |
|-------------|----------------|----------|------|
| **Web app simple** | Copilot Pro | Intégration IDE, rapide | $10/mois |
| **Grande codebase** | Claude Code Pro/Max | 1M tokens contexte | $20-200/mois |
| **Multi-fichiers** | Cursor Pro | Composer mode | $20/mois |
| **Automatisation** | Claude Code headless | Agent Teams, scripts | $100-200/mois |
| **Data science** | Kaggle + Copilot | GPU gratuits + IA | $0-10/mois |
| **Mobile** | Copilot Pro + Claude Code | Multi-IDE + performance | $30/mois |
| **Enterprise** | Copilot Enterprise | Conformité, audit | $39+/user/mois |
| **Open-source** | Aider + BYOK | Flexibilité, contrôle | Variable |
| **Prototypage** | Cursor Hobby/Pro | Rapide, itératif | $0-20/mois |
| **ML/AI** | Kaggle + Claude Code | GPU + analyse | $20/mois |

### 4.3 Selon contraintes

| Contrainte | Recommandation | Pourquoi | Coût |
|------------|----------------|----------|------|
| **Budget $0** | GitHub Student Pack + Kaggle | Gratuit, outils pro | $0 |
| **Confidentialité max** | Cline + BYOK (Ollama) | 100% local, offline | Hardware |
| **Performance max** | Claude Code Max | 80.8% SWE-bench | $100-200/mois |
| **Usage offline** | Continue.dev + Ollama | 100% local | Hardware |
| **Multi-IDE** | Copilot Pro | VS Code, JetBrains, Neovim | $10/mois |
| **Équipe** | Copilot Business/Enterprise | Audit, SSO, policy | $19-39/user/mois |
| **RGPD** | Copilot Enterprise + Claude Code | Conformité + zero retention | $39+/user + $20-200 |
| **Rapidité** | Cursor Pro | IDE natif AI-first | $20/mois |
| **Grand contexte** | Claude Code Pro | 1M tokens | $20/mois |
| **Automatisation** | Claude Code headless | Agent Teams, scripts | $100-200/mois |

---

## 5. Stacks recommandées par profil

### 5.1 Stack étudiant complet

**Profil :** Étudiant en informatique  
**Budget :** $0  
**Valeur :** ~$3,000+/an

```
GitHub Student Pack (gratuit)
├── GitHub Copilot (IA)
├── JetBrains (IDE)
├── Azure for Students (cloud $100)
├── CodeSandbox (IDE cloud)
├── Replit (IDE cloud)
├── GitKraken (Git)
├── Termius (SSH)
└── 80+ autres outils

+ Azure for Students (email institutionnel)
+ Vercel Education (hébergement)
+ Figma Education (design)
+ Notion Education (productivité)
+ Kaggle (ML + GPU)
```

**Coût total :** $0  
**Valeur totale :** ~$3,000+/an

### 5.2 Stack freelance web

**Profil :** Développeur freelance  
**Budget :** $10-30/mois  
**ROI :** Rapide

```
GitHub Copilot Pro ($10/mois)
├── VS Code (gratuit)
├── Vercel Pro ($20/mois)
└── GitHub Projects (gratuit)

Total : $30/mois
```

**Alternative premium :**
```
Claude Code Pro ($20/mois)
├── Cursor Pro ($20/mois)
└── Vercel Pro ($20/mois)

Total : $60/mois
```

### 5.3 Stack développeur pro

**Profil :** Développeur senior  
**Budget :** $20-200/mois  
**Performance :** Maximale

```
Claude Code Pro ($20/mois)
├── VS Code + Copilot ($10/mois)
└── Cursor Pro ($20/mois, optionnel)

Total : $30-50/mois
```

**Version intensive :**
```
Claude Code Max ($100-200/mois)
├── Agent Teams (16+ agents)
├── Mode headless (automatisation)
└── 1M tokens contexte

Total : $100-200/mois
```

### 5.4 Stack startup

**Profil :** Équipe 5-20 devs  
**Budget :** $19-44/user/mois  
**Conformité :** Business

```
GitHub Copilot Business ($19/user/mois)
├── VS Code (gratuit)
├── GitHub Projects (gratuit)
└── Claude Code Team ($25/user, optionnel)

Total : $19-44/user/mois
```

### 5.5 Stack enterprise

**Profil :** Équipe 50+ devs  
**Budget :** $39-239/user/mois  
**Conformité :** Enterprise-grade

```
GitHub Copilot Enterprise ($39/user/mois)
├── Knowledge bases
├── Audit logs complets
├── SSO + SCIM + RBAC
└── Claude Code Team ($25-200/user, optionnel)

Total : $39-239/user/mois
```

### 5.6 Stack confidentialité

**Profil :** Données sensibles  
**Budget :** Variable (hardware + API)  
**Confidentialité :** Maximale

```
Cline + BYOK (VS Code)
├── Ollama (modèles locaux)
├── Llama 3.1 70B (local)
└── Anthropic API (zero retention, cloud)

Total : Hardware (~$1,500-2,000) + API usage
```

---

## 6. Guide d'implémentation

### 6.1 Par où commencer

**Étape 1 : Identifier son profil**
- Étudiant ? → Stack étudiant ($0)
- Freelance ? → Stack freelance ($10-30/mois)
- Pro ? → Stack pro ($20-200/mois)
- Équipe ? → Stack startup/enterprise ($19-239/user/mois)

**Étape 2 : Choisir la stack**
- Voir section 5 (stacks recommandées)
- Adapter selon budget et besoins

**Étape 3 : Activer les outils**
- GitHub Student Pack (si étudiant) : https://education.github.com/pack
- GitHub Copilot : https://github.com/features/copilot
- Claude Code : https://claude.ai/code
- Cursor : https://cursor.com

**Étape 4 : Configurer MCP**
- Voir Phase 02-03 (MCP integration)
- Configurer serveurs MCP pour outils externes

**Étape 5 : Itérer**
- Commencer avec stack minimale
- Upgrader selon besoins
- Mesurer ROI

### 6.2 Erreurs à éviter

**À éviter :**
- ❌ Payer pour outils disponibles gratuitement via Student Pack
- ❌ Utiliser Cursor si besoin multi-IDE (Copilot meilleur)
- ❌ Claude Code si budget $0 (pas de free tier)
- ❌ Solutions locales si besoin performance (cloud meilleur)
- ❌ Enterprise si < 50 devs (Business suffit)

**À faire :**
- ✅ Maximiser gratuit (Student Pack, Kaggle, etc.)
- ✅ Commencer petit, upgrader si besoin
- ✅ Mesurer ROI avant d'investir
- ✅ Choisir selon contraintes (budget, confidentialité, performance)
- ✅ Utiliser MCP pour intégration outils

---

## 7. Comparaison des scenarios

### 7.1 Tableau récapitulatif

| Scenario | Stack | Coût/mois | Performance | Confidentialité | Complexité |
|----------|-------|-----------|-------------|-----------------|------------|
| **Étudiant** | Student Pack + Copilot | $0 | Moyen | Moyen | Faible |
| **Freelance** | Copilot Pro | $10 | Bon | Moyen | Faible |
| **Pro** | Claude Code Pro | $20 | Très bon | Moyen | Moyen |
| **Startup** | Copilot Business | $19/user | Bon | Élevé | Moyen |
| **Enterprise** | Copilot Enterprise | $39/user | Bon | Très élevé | Élevé |
| **Confidentialité** | Cline + BYOK | Variable | Variable | Très élevé | Élevé |
| **Data science** | Kaggle + Copilot | $0-10 | Bon | Moyen | Faible |
| **Prototypage** | Cursor Hobby/Pro | $0-20 | Moyen | Moyen | Faible |

### 7.2 Matrice de décision finale

**Questions clés :**

1. **Êtes-vous étudiant ?**
   - Oui → GitHub Student Pack ($0)
   - Non → Continuer

2. **Budget disponible ?**
   - $0 → GitHub Copilot Free (2K complétions/mois)
   - $10 → GitHub Copilot Pro
   - $20 → Claude Code Pro
   - $100-200 → Claude Code Max
   - $19-39/user → Copilot Business/Enterprise

3. **Besoin confidentialité maximale ?**
   - Oui → Cline + BYOK (Ollama local)
   - Non → Continuer

4. **Type de projet ?**
   - Web simple → Copilot Pro
   - Grande codebase → Claude Code Pro/Max
   - Multi-fichiers → Cursor Pro
   - Data science → Kaggle + Copilot
   - Automatisation → Claude Code headless

5. **Équipe ?**
   - Solo → Stack individuel
   - 5-20 → Copilot Business
   - 50+ → Copilot Enterprise

---

## 8. Recommandations finales EKTS

### 8.1 Pour EKTS (projet personnel/académique)

**Recommandation :** Stack étudiant/pro (selon statut)

**Si étudiant :**
```
GitHub Student Pack (gratuit)
├── GitHub Copilot (IA)
├── JetBrains (IDE)
├── Azure for Students (cloud)
└── Claude Code Pro ($20/mois, si budget)

Coût : $0-20/mois
```

**Si pro :**
```
Claude Code Pro ($20/mois)
├── VS Code + Copilot ($10/mois)
└── Cursor Pro ($20/mois, optionnel)

Coût : $30-50/mois
```

### 8.2 Pour projets EKTS futurs

**Recommandations :**
1. **Développement quotidien** : GitHub Copilot Pro ($10/mois)
2. **Projets complexes** : Claude Code Pro/Max ($20-200/mois)
3. **Confidentialité** : Cline + BYOK (variable)
4. **Équipe** : Copilot Business ($19/user/mois)
5. **Automatisation** : Claude Code headless + MCP servers

### 8.3 Optimisation des coûts

**Stratégie :**
1. **Maximiser gratuit** : Student Pack, Kaggle, etc.
2. **ROI rapide** : Copilot Pro ($10) → excellent ROI
3. **Performance si besoin** : Claude Code ($20-200)
4. **Équipe** : Copilot Business ($19/user) → conformité
5. **Confidentialité** : BYOK → contrôle total

---

## 9. Sources et références

### 9.1 Documents EKTS connexes

- **12_COMPARATIF_AGENTS_IA.md** : Comparatif détaillé des outils
- **12_PLANS_GRATUITS_ET_ETUDIANTS.md** : 54 services gratuits/étudiants
- **Phase 02-03** : Intégration MCP
- **Phase 11** : Sécurité et gouvernance

### 9.2 Sources externes

- **GitHub Student Pack** : https://education.github.com/pack
- **GitHub Copilot** : https://github.com/features/copilot
- **Claude Code** : https://claude.ai/code
- **Cursor** : https://cursor.com
- **MCP Specification** : https://modelcontextprotocol.io

### 9.3 Benchmarks

- **SWE-bench Verified** : https://swe-bench.com
- **Terminal-Bench** : https://terminal-bench.com
- **Stack Overflow Survey 2026** : Octobre 2026

---

## 10. Conclusion

### 10.1 Synthèse

**Meilleures recommandations selon scenario :**

| Scenario | Recommandation | Coût | Pourquoi |
|----------|----------------|------|----------|
| **Étudiant** | GitHub Student Pack | $0 | 80+ outils gratuits |
| **Freelance** | GitHub Copilot Pro | $10/mois | Meilleur ROI |
| **Pro** | Claude Code Pro | $20/mois | Meilleure performance |
| **Startup** | Copilot Business | $19/user/mois | Conformité + collaboration |
| **Enterprise** | Copilot Enterprise | $39/user/mois | Enterprise-grade |
| **Confidentialité** | Cline + BYOK | Variable | Contrôle total |

### 10.2 Actions immédiates

1. **Étudiant** : Postuler GitHub Student Pack → https://education.github.com/pack
2. **Freelance** : Activer Copilot Pro → $10/mois
3. **Pro** : Essayer Claude Code Pro → $20/mois
4. **Équipe** : Évaluer Copilot Business → $19/user/mois
5. **Confidentialité** : Configurer Cline + BYOK

### 10.3 Recommandation finale EKTS

**Stack optimale EKTS (Octobre 2026) :**

```
GitHub Copilot Pro ($10/mois)
├── Usage quotidien
├── Multi-IDE (VS Code, JetBrains)
├── MCP natif
└── Excellent ROI

+ Claude Code Pro ($20/mois, si projets complexes)
├── Meilleure performance (80.8% SWE-bench)
├── 1M tokens contexte
└── Agent Teams (si Max)

Total : $10-30/mois
```

**Pour étudiants :** GitHub Student Pack ($0) + Copilot gratuit

---

**Document rédigé le 21 octobre 2026 — Phase 12 du projet EKTS**
