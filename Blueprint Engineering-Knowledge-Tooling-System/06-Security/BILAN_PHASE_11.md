# Phase 11 — Bilan : Sécurité, Permissions et Gouvernance

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminée  
**Durée :** 1 semaine  
**Fichiers créés :** 3

---

## 1. Résumé exécutif

La Phase 11 a établi un framework de sécurité complet pour EKTS, couvrant les menaces spécifiques aux systèmes d'ingénierie assistés par IA avec intégration MCP. Le modèle de menace identifie 38 vecteurs d'attaque réels (incidents 2025-2026) et la politique de sécurité définit des contrôles proportionnés pour 4 niveaux de maturité (MVP → production critique).

**Résultats clés** :
- **38 vecteurs d'attaque** documentés avec incidents réels
- **4 niveaux de sécurité** définis (Level 1-4)
- **11 domaines de sécurité** couverts avec règles MVP et Production
- **Checklists vérifiables** pour chaque domaine
- **Roadmap sécurité** : MVP (mois 1-3) → Production (mois 6-12)

---

## 2. Livrables

### 2.1 Modèle de menace EKTS

**Fichier** : `11_MODELE_DE_MENACE.md`  
**Taille** : ~32 KB  
**Sections** : 15

**Contenu principal** :
- Framework STRIDE adapté MCP/agents IA
- 11 domaines de menaces identifiés
- 38 vecteurs d'attaque documentés
- Incidents réels 2025-2026 (CVE-2026-0755, STDIO flaw, Deadbugz, etc.)
- Matrice de risques MVP vs Production
- Contrôles recommandés (P0, P1, P2, P3)

**Points clés** :
- Prompt injection indirect : menace #1 (GitHub MCP Data Heist, Supabase MCP)
- Supply chain attacks : 1.2M+ packages npm malveillants cumulés
- STDIO design flaw : ~200K serveurs MCP exposés (Avril 2026)
- Capability attestation absente dans MCP (vulnérabilité architecturale)

### 2.2 Politique de permissions et sécurité

**Fichier** : `11_POLITIQUE_PERMISSIONS_ET_SECURITE.md`  
**Taille** : ~45 KB  
**Sections** : 20

**Contenu principal** :
- 4 niveaux de sécurité (Level 1-4)
- 11 domaines avec règles MVP et Production
- Exemples de code pour chaque règle
- Configuration centralisée (ekts-security.config.ts)
- Roadmap implémentation

**Domaines couverts** :
1. **Moindre privilège** : Permissions read-only par défaut, short-lived credentials, secret injection per-task
2. **Isolation des processus** : Docker MVP → Firecracker microVMs Production
3. **Liste de domaines autorisés** : Default-deny egress, block metadata endpoints
4. **Contrôle des chemins de fichiers** : Workspace isolation, path validation
5. **Secrets et variables d'environnement** : .env MVP → Vault Production
6. **Limites de volume et durée** : Rate limiting, circuit breakers
7. **Validation humaine** : Confirmation utilisateur MVP → Approval gates Production
8. **Prompt injection** : Sanitization basique MVP → LlamaFirewall Production
9. **Logs et données personnelles** : Anonymisation, GDPR compliance
10. **Sauvegardes et mises à jour** : Backups quotidiens, patch management
11. **Supply chain** : npm ci, SBOM, provenance attestation

### 2.3 Bilan Phase 11

**Fichier** : `BILAN_PHASE_11.md`  
**Taille** : ~18 KB  
**Sections** : 12

**Contenu** :
- Résumé exécutif
- Analyse des recherches 2026
- Décisions prises
- Intégration avec autres phases
- Résultats obtenus
- Limites et questions ouvertes
- Prochaines étapes

---

## 3. Recherches effectuées

### 3.1 Sécurité MCP 2026

**Sources analysées** :
- **arXiv 2601.17549** : Breaking the Protocol (Jan 2026) — 3 vulnérabilités MCP fondamentales
- **arXiv 2603.22489** : MCP Threat Modeling (Mar 2026) — 72.8% attack success rate
- **arXiv 2603.18063** : MCP-38 Threat Taxonomy (Mar 2026) — 38 catégories de menaces
- **OWASP MCP Top 10** (2025) : Tool poisoning, indirect prompt injection, etc.
- **Coalition for Secure AI** : Model Context Protocol Security (Mar 2026)
- **NSA** : MCP Security Guide (Mai 2026)

**Incidents réels identifiés** :
- **Supabase MCP Lethal Trifecta** (mi-2025) : SQL injection via support tickets
- **GitHub MCP Data Heist** (2025) : Prompt injection via GitHub Issues
- **Gemini MCP Tool 0-day** (Jan 2026, CVE-2026-0755, CVSS 9.8)
- **STDIO Design Flaw** (Avr 2026, OX Security) : ~200K servers exposed
- **DuneSlide** (Mai 2026, CVE-2026-50548/50549, CVSS 9.8) : Sandbox escape
- **Deadbugz campaign** (Août 2026) : Malicious MCP server via GitHub PRs

### 3.2 Sécurité agents IA 2026

**Sources analysées** :
- **OWASP AI Agent Security Cheat Sheet** : Tool security, least privilege
- **Microsoft AI Agent Security Guidance** (Juil 2026) : Per-agent identity
- **NVIDIA AI Red Team** (Mars 2026) : Sandboxing mandatory controls
- **ISACA** : Cybersecurity Recommendations for Securing AI Agents (Sep 2026)
- **Checkmarx** : 11 Emerging AI Security Risks with MCP (Oct 2026)
- **Authzed** : Timeline of MCP Security Breaches (Nov 2025)

**Bonnes pratiques identifiées** :
- **Least privilege** : Dedicated agent identity, short-lived credentials
- **Sandboxing** : Firecracker microVMs (strongest), gVisor (syscall-level)
- **Network controls** : Default-deny egress, explicit allowlists
- **Secrets management** : Per-task injection, outside model context
- **Human-in-the-loop** : Approval gates for irreversible actions
- **Logging** : Every tool call, authorization decision, external side effect

### 3.3 Supply chain security 2026

**Sources analysées** :
- **CISA 2026 Minimum Elements for SBOM** (Juil 2026) : Remplace NTIA 2021
- **OWASP Software Component Verification Standard** (SCVS)
- **npm Supply Chain Attacks** : 1.2M+ malicious packages cumulés
- **keyv/cacheable attack** (Août 2026) : Self-propagating worm

**Standards identifiés** :
- **SBOM formats** : CycloneDX 1.6+, SPDX 2.3+
- **Elements obligatoires** : Component hash, license, transitive dependencies
- **Outils** : Syft, CycloneDX npm plugin, Trivy, npm audit
- **Provenance** : npm publish --provenance (Sigstore-based)

---

## 4. Décisions prises

### 4.1 Architecture sécurité

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **4 niveaux de sécurité** | Progression réaliste MVP → Production | 2 niveaux → pas assez granulaire |
| **11 domaines de sécurité** | Couverture complète (moindre privilège → supply chain) | 5 domaines → pas assez complet |
| **STRIDE adapté MCP** | Framework reconnu + spécificités MCP/agents | Framework custom → pas de référence |
| **Default-deny network** | Fermer la plupart des routes d'exfiltration | Default-allow → trop permissif |
| **Firecracker pour Production** | Hardware isolation, ~125ms boot | Docker → pas assez isolé |
| **SBOM obligatoire Production** | CISA 2026 compliance, supply chain transparency | Pas de SBOM → pas de visibilité |
| **Secret injection per-task** | Principe NVIDIA, éviter inherit full host environment | Secrets globaux → trop permissif |
| **Approval gates Production** | OWASP guidance, irreversible actions require human | Auto-approval → trop risqué |

### 4.2 Compromis acceptés

- **Complexité vs sécurité** : Politique très détaillée mais peut être difficile à implémenter
- **Performance vs contrôles** : Security middleware peut ralentir le système
- **False positives** : Classifiers prompt injection peuvent bloquer contenu légitime
- **Maintenance** : SBOM et dependency scanning nécessitent maintenance continue
- **Coût** : Firecracker, Vault, LlamaFirewall ont un coût infrastructure

---

## 5. Intégration avec autres phases

### 5.1 Phases amont

| Phase | Contribution à Phase 11 |
|-------|-------------------------|
| **Phase 02-03** (MCP, Outils) | Menaces MCP spécifiques (tool poisoning, STDIO flaw) |
| **Phase 04-05** (Navigateur, Scraping) | Menaces scraping, SSRF, path traversal |
| **Phase 06-07** (Stockage, RAG) | Menaces données, prompt injection via RAG, GDPR |
| **Phase 08** (Analyse expérience) | Menaces logs, données personnelles |
| **Phase 09** (Bibliothèque créative) | Menaces supply chain (dépendances npm) |
| **Phase 10** (Capitalisation) | Menaces secrets, post-mortems sécurité |

### 5.2 Phases aval

| Phase | Apport de Phase 11 |
|-------|-------------------|
| **Phase 12** (Comparatif IA) | Contrôles sécurité pour benchmarking IA |
| **Phase 13** (Architecture) | Architecture sécurisée (sandboxing, network policies) |
| **Phase 14** (Audit) | Validation des contrôles sécurité |

### 5.3 Flux de données sécurité

```
Modèle de menace (11 domaines)
    ↓
Politique de sécurité (règles MVP + Production)
    ↓
Configuration centralisée (ekts-security.config.ts)
    ↓
Middleware sécurité (securityMiddleware.ts)
    ↓
Implémentation (Docker, Firecracker, Vault, LlamaFirewall)
    ↓
Monitoring (logs, audit trails, alerts)
    ↓
Incident response (freeze, preserve, revoke, re-provision)
```

---

## 6. Résultats obtenus

### 6.1 Métriques

**Couverture** :
- 11 domaines de sécurité couverts
- 38 vecteurs d'attaque documentés
- 4 niveaux de sécurité définis
- 100+ règles de sécurité (MVP + Production)

**Incidents réels** :
- 6 incidents majeurs 2025-2026 analysés
- 5 CVEs documentés (CVSS 9.8)
- 3 recherches académiques intégrées

**Contrôles** :
- 50+ règles MVP (Level 1)
- 50+ règles Production (Level 3)
- 20+ exemples de code
- 10+ outils recommandés

### 6.2 Menaces critiques identifiées

**P0 (Critique, Production obligatoire)** :
1. **Prompt injection indirect** : Via contenu externe (pages, documents, emails)
2. **Sandbox escape** : Accès au système hôte depuis sandbox
3. **Supply chain attack** : Packages npm malveillants
4. **Secrets exposure** : Dans contexte modèle ou variables d'environnement
5. **Multi-tenant data leakage** : Isolation insuffisante entre tenants

**P1 (Élevé, Production recommandé)** :
6. **SSRF / metadata access** : Accès aux métadonnées cloud
7. **Tool poisoning** : Instructions malveillantes dans tool descriptions
8. **Elevation of privilege** : Capability attestation absente dans MCP

### 6.3 Outils recommandés

**Secrets management** :
- **Vault** (HashiCorp) : Secrets management centralisé
- **AWS Secrets Manager** : Intégration cloud AWS
- **dotenv** : Variables d'environnement locales

**Sandboxing** :
- **Firecracker** : MicroVMs hardware-isolated (AWS Lambda)
- **gVisor** : Syscall interception (Google)
- **Docker** : Container isolation (baseline)

**Dependency scanning** :
- **Snyk** : Vulnerability scanning + SBOM
- **Socket** : Supply chain security
- **npm audit** : Built-in npm scanning

**SBOM generation** :
- **Syft** : Open source, CycloneDX + SPDX
- **CycloneDX npm plugin** : npm SBOM generation
- **Trivy** : Vulnerability scanning + SBOM

**Prompt injection defense** :
- **LlamaFirewall** : Input/output classifiers
- **Rebuff** : Prompt injection detection
- **Custom sanitization** : Strip HTML/scripts

---

## 7. Limites et questions ouvertes

### 7.1 Limites identifiées

1. **Évolution rapide** : Menaces MCP évoluent rapidement (nouveaux vecteurs chaque mois)
2. **Complexité** : Politique très détaillée peut être difficile à implémenter
3. **Performance** : Contrôles de sécurité peuvent ralentir le système
4. **False positives** : Classifiers prompt injection peuvent bloquer contenu légitime
5. **Coût** : Firecracker, Vault, LlamaFirewall ont un coût infrastructure
6. **Maintenance** : SBOM et dependency scanning nécessitent maintenance continue

### 7.2 Questions ouvertes

1. **Maturity MCP** : Quand capability attestation sera-t-elle disponible dans MCP ?
2. **Sandboxing optimal** : Firecracker vs gVisor vs V8 Isolates pour quel use case ?
3. **Prompt injection defense** : Existe-t-il une défense fiable contre prompt injection ?
4. **Multi-tenant isolation** : Quelle architecture pour isolation multi-utilisateur ?
5. **Compliance** : Quelles réglementations s'appliquent (GDPR, Cyber Resilience Act EU 2024/2847) ?
6. **Incident response** : Comment détecter et répondre aux incidents de sécurité ?
7. **Security testing** : Quels outils pour adversarial testing (red teaming) ?
8. **Niveau de sécurité** : Quel niveau pour quel use case EKTS ?
9. **Secrets management** : Vault vs AWS Secrets Manager vs autre ?
10. **False positives** : Comment minimiser les faux positifs des classifiers ?

---

## 8. Prochaines étapes

### 8.1 Phase 12 : Comparatif des outils IA (à venir)

La Phase 12 va construire sur la Phase 11 pour :
- Comparer les outils IA (LLMs, agents, frameworks)
- Intégrer les contrôles de sécurité dans le benchmarking
- Évaluer la maturité sécurité des outils
- Recommander les outils les plus sûrs

### 8.2 Améliorations court terme

1. **Implémenter contrôles MVP** : Rules Level 1 pour EKTS
2. **Testing manuel** : Audits sécurité manuels
3. **Documentation** : Guides sécurité pour développeurs
4. **Formation** : Former l'équipe aux menaces MCP
5. **Monitoring** : Mettre en place logs et alerts

### 8.3 Améliorations long terme

1. **Implémenter contrôles Production** : Rules Level 3 pour EKTS
2. **Automatisation** : Security testing automatisé en CI/CD
3. **Audit externe** : Audit sécurité par tierce partie
4. **Incident response** : Plan de réponse aux incidents
5. **Compliance** : Certification GDPR, Cyber Resilience Act

---

## 9. Conclusion

La Phase 11 a établi un framework de sécurité complet et proportionné pour EKTS. Le modèle de menace identifie les menaces réelles (incidents 2025-2026) et la politique de sécurité définit des contrôles vérifiables pour 4 niveaux de maturité.

**Points forts** :
- Basé sur recherches 2026 (OWASP, Microsoft, NVIDIA, CISA)
- Incidents réels analysés (CVEs, campaigns)
- Contrôles proportionnés (MVP → Production)
- Exemples de code prêts à l'emploi
- Configuration centralisée
- Roadmap claire (mois 1-3, 3-6, 6-12)

**Points d'amélioration** :
- Complexité de l'implémentation
- Coût infrastructure (Firecracker, Vault)
- Évolution rapide des menaces
- False positives des classifiers

**Valeur apportée** :
- Visibilité complète des menaces MCP/agents IA
- Contrôles de sécurité actionnables
- Compliance standards 2026 (CISA SBOM, GDPR)
- Protection contre attaques réelles (prompt injection, supply chain)
- Foundation pour phases suivantes (12-14)

La Phase 11 fournit les bases de sécurité nécessaires pour les phases suivantes (comparatif IA, architecture, audit) et garantit que EKTS sera sécurisé dès le MVP et renforcé pour la production.

---

## 10. Annexes

### 10.1 Glossaire

| Terme | Définition |
|-------|------------|
| **MCP** | Model Context Protocol — Protocole pour intégration LLM avec outils externes |
| **Prompt injection** | Attaque injectant des instructions malveillantes dans le contexte du modèle |
| **Tool poisoning** | Instructions malveillantes cachées dans descriptions d'outils MCP |
| **Sandbox** | Environnement d'exécution isolé limitant les capacités d'un processus |
| **Least privilege** | Principe accordant uniquement les permissions minimales nécessaires |
| **SBOM** | Software Bill of Materials — Inventaire complet des composants logiciels |
| **STRIDE** | Framework de modélisation de menaces (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) |
| **Firecracker** | Technologie de microVMs développée par AWS pour isolation hardware |
| **gVisor** | Sandbox de conteneurs développé par Google avec interception syscall |
| **LlamaFirewall** | Outil de défense contre prompt injection avec classifiers input/output |

### 10.2 Ressources

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OWASP Top 10 for Agentic Applications](https://owasp.org/www-project-top-10-for-agentic-applications/)
- [CISA 2026 SBOM Minimum Elements](https://www.cisa.gov/sbom)
- [Microsoft AI Agent Security Guidance](https://www.microsoft.com/security/blog/2026/07/16/least-privilege-for-ai-agents/)
- [NVIDIA AI Red Team Guidance](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows/)
- [arXiv 2601.17549 : Breaking the Protocol](https://arxiv.org/abs/2601.17549)
- [arXiv 2603.22489 : MCP Threat Modeling](https://arxiv.org/abs/2603.22489)
- [arXiv 2603.18063 : MCP-38 Threat Taxonomy](https://arxiv.org/abs/2603.18063)

---

## 11. Références

### 11.1 Documents EKTS

- **Phase 02** : `02-MCP-INTEGRATION.md` — Intégration MCP
- **Phase 03** : `03-OUTILS-SERVICES.md` — Conception outils et services
- **Phase 06** : `06-STOCKAGE-CONNAISSANCES.md` — Stockage et connaissances
- **Phase 07** : `07-RAG-RECHERCHE-SEMANTIQUE.md` — RAG et recherche sémantique
- **Phase 09** : `09-BIBLIOTHEQUE-CREATIVE.md` — Bibliothèque créative

### 11.2 Standards externes

- **OWASP** : Open Web Application Security Project
- **CISA** : Cybersecurity and Infrastructure Security Agency (USA)
- **NIST** : National Institute of Standards and Technology
- **GDPR** : General Data Protection Regulation (EU)
- **Cyber Resilience Act** : Regulation (EU) 2024/2847

---

**Document rédigé le 21 octobre 2026 — Phase 11 du projet EKTS**
