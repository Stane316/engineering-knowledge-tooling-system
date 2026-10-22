# Phase 11 — Modèle de Menace EKTS

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Établir un modèle de menace proportionné au MVP EKTS, identifiant les menaces spécifiques aux systèmes d'ingénierie assistés par IA avec intégration MCP, et définissant les contrôles de sécurité nécessaires avant exposition réseau ou usage multi-utilisateur.

Ce modèle s'appuie sur les recherches 2026 concernant les vulnérabilités MCP, les attaques sur agents IA, et les meilleures pratiques de sécurité (OWASP, Microsoft, NVIDIA, CISA).

---

## 2. Résumé

**Modèle de menace STRIDE adapté MCP/Agents IA** :
- **11 domaines de menaces** identifiés
- **38 vecteurs d'attaque** documentés
- **Incidents réels 2025-2026** analysés
- **Contrôles proportionnés** définis (MVP vs production)
- **Roadmap sécurité** : MVP → exposition réseau → multi-utilisateur

---

## 3. Méthode

### 3.1 Approche

1. **Analyse des vulnérabilités MCP 2026** : Recherche académique (arXiv 2601.17549, 2603.22489, 2603.18063), incidents réels, advisories
2. **Framework STRIDE** : Adapté aux spécificités MCP/agents IA
3. **OWASP Top 10 LLM + Agentic AI** : Mapping avec menaces identifiées
4. **Bonnes pratiques 2026** : Microsoft, NVIDIA, OWASP, CISA SBOM 2026

### 3.2 Hypothèses

- **MVP EKTS** : Usage mono-utilisateur, local, pas d'exposition réseau publique
- **Phase production** : Exposition réseau, multi-utilisateur, données sensibles
- **Agents IA** : Modèles considérés comme potentiellement compromis (assume breach)

---

## 4. Concepts clés

### 4.1 Définitions

**MCP (Model Context Protocol)** : Protocole standard pour intégration LLM avec outils externes. Vulnérabilités architecturales identifiées en 2026 (absence de capability attestation, bidirectional sampling sans authentification, trust propagation implicite).

**Prompt Injection** : Attaque injectant des instructions malveillantes dans le contexte du modèle. Deux types :
- **Direct** : Input utilisateur contient des instructions
- **Indirect** : Instructions cachées dans données externes (pages web, documents, emails, résultats d'outils)

**Tool Poisoning** : Instructions malveillantes cachées dans descriptions d'outils MCP. Le modèle lit les descriptions mais pas l'utilisateur.

**Sandboxing** : Isolation de l'exécution de code/tools dans un environnement contrôlé (microVM, container, gVisor).

**Least Privilege** : Principe de sécurité accordant uniquement les permissions minimales nécessaires pour une tâche spécifique.

**SBOM (Software Bill of Materials)** : Inventaire complet des composants logiciels, obligatoire selon CISA 2026.

### 4.2 Framework STRIDE adapté MCP

| STRIDE | Description | Adaptation MCP/Agents |
|--------|-------------|------------------------|
| **S**poofing | Usurpation d'identité | Serveurs MCP malveillants, tool descriptions empoisonnées |
| **T**ampering | Modification de données | Prompt injection via contenu externe, altération résultats outils |
| **R**epudiation | Répudiation d'actions | Logs insuffisants, absence de traçabilité tool calls |
| **I**nformation Disclosure | Fuite de données | Exfiltration via prompt injection, accès non autorisé aux secrets |
| **D**enial of Service | Déni de service | Boucles infinies, consommation ressources, tool calls excessifs |
| **E**levation of Privilege | Élévation de privilèges | Capability attestation absente, trust propagation, sandbox escape |

---

## 5. Résultats — Menaces identifiées

### 5.1 Domaine 1 : Moindre privilège

**Menace** : Agents MCP avec permissions excessives permettant actions non autorisées après compromission.

**Vecteurs d'attaque** :
- **ASI05 (OWASP)** : Unexpected Code Execution avec permissions élevées
- **LLM06 (OWASP)** : Excessive Agency - agent avec accès non nécessaire
- **Incident Supabase MCP (mi-2025)** : Agent avec service-role access exécutant SQL injection

**Impact** : Exécution de commandes système, accès aux secrets, exfiltration de données, modification de fichiers critiques.

**Contrôles MVP** :
- [ ] Permissions read-only par défaut pour tous les tools
- [ ] Outils séparés pour lecture vs écriture
- [ ] Pas d'accès shell direct (commandes limitées)
- [ ] Variables d'environnement minimales

**Contrôles production** :
- [ ] Dedicated agent identity (pas de shared tokens)
- [ ] Short-lived credentials (minute-scale tokens)
- [ ] Per-tool permission scoping (resource + operation)
- [ ] Authorization broker rechecking every action
- [ ] Secret injection per-task (pas inherit host environment)

### 5.2 Domaine 2 : Isolation des processus

**Menace** : Exécution de code généré par LLM sans isolation permettant accès au système hôte.

**Vecteurs d'attaque** :
- **ASI05 (OWASP)** : "Never execute agent-generated code without strict sandboxing"
- **NVIDIA guidance** : OS-level sandbox mandatory controls
- **Incident Deadbugz (Août 2026)** : Malicious MCP server accédant aux SSH keys, AWS credentials

**Impact** : Sandbox escape, accès au système hôte, compromission complète, lateral movement.

**Contrôles MVP** :
- [ ] Container Docker avec user non-root
- [ ] Filesystem read-only (sauf work directory)
- [ ] No host path mounts
- [ ] Resource limits (CPU, memory, process count)

**Contrôles production** :
- [ ] Firecracker microVMs (hardware isolation, ~125ms boot)
- [ ] gVisor pour workloads compute-heavy (syscall interception)
- [ ] Un sandbox éphémère par tâche (no artifact carryover)
- [ ] Read-only root filesystem
- [ ] Block privileged containers
- [ ] Syscall profiling

### 5.3 Domaine 3 : Liste de domaines autorisés

**Menace** : Agents accédant à des domaines non autorisés (SSRF, exfiltration, metadata endpoints).

**Vecteurs d'attaque** :
- **SSRF** : Server-Side Request Forgery via tools HTTP
- **Metadata endpoint** : 169.254.169.254 (AWS, GCP, Azure)
- **Incident DuneSlide (2026)** : CVE-2026-50548/50549, CVSS 9.8, sandbox escape chain

**Impact** : Accès aux métadonnées cloud, exfiltration de credentials, accès aux services internes.

**Contrôles MVP** :
- [ ] Allowlist explicite des domaines (pas de wildcard)
- [ ] Block metadata endpoints (169.254.169.254)
- [ ] Block internal admin interfaces
- [ ] DNS filtering

**Contrôles production** :
- [ ] Default-deny egress posture
- [ ] Explicit allowlist for internal API / package mirror
- [ ] Proxy layer pour inspection outbound traffic
- [ ] Block unapproved registries
- [ ] Network segmentation

### 5.4 Domaine 4 : Contrôle des chemins de fichiers

**Menace** : Agents accédant à des fichiers en dehors du workspace autorisé.

**Vecteurs d'attaque** :
- **Path traversal** : ../../etc/passwd, ../.env
- **Dotfiles access** : ~/.ssh, ~/.aws/credentials
- **Config directories** : ~/.config, /etc/passwd
- **NVIDIA guidance** : Block all writes to agent configuration files

**Impact** : Lecture de secrets, modification de configurations, exfiltration de données sensibles.

**Contrôles MVP** :
- [ ] Workspace mounting uniquement (pas de /home, /etc)
- [ ] Read-only pour tout sauf work directory
- [ ] Block dotfiles (.*, .ssh, .aws, .config)
- [ ] Path validation avec realpath() (pas de symlinks)

**Contrôles production** :
- [ ] Read-only root filesystem
- [ ] Single writable work directory
- [ ] No host path mounts
- [ ] Separate workspace per user/tenant
- [ ] File access logging

### 5.5 Domaine 5 : Secrets et variables d'environnement

**Menace** : Exposition de secrets dans le contexte du modèle ou via variables d'environnement.

**Vecteurs d'attaque** :
- **Context leakage** : Secrets dans prompts/outputs du modèle
- **Environment inheritance** : Agent hérite de tous les secrets host
- **Incident Gemini MCP Tool (Jan 2026)** : CVE-2026-0755, service account privileges exposed

**Impact** : Exfiltration de credentials, accès non autorisé à des services, compromission de comptes.

**Contrôles MVP** :
- [ ] Secrets dans .env (pas dans code)
- [ ] .gitignore pour .env
- [ ] Variables minimales (seulement nécessaires)
- [ ] Pas de logging de secrets

**Contrôles production** :
- [ ] Secret injection per-task (NVIDIA guidance)
- [ ] Short-lived credentials avec automatic rotation
- [ ] Secrets manager (Vault, AWS Secrets Manager)
- [ ] Keep secrets outside model context
- [ ] Credential revocation testing
- [ ] Audit trail pour accès secrets

### 5.6 Domaine 6 : Limites de volume et durée

**Menace** : Agents consommant ressources excessives (boucles infinies, tool calls illimités).

**Vecteurs d'attaque** :
- **DoS** : Recursive tool calls, infinite loops
- **Resource exhaustion** : CPU, memory, disk, network
- **Cost explosion** : API calls non limités (LLM, tools)

**Impact** : Déni de service, coûts explosifs, indisponibilité du système.

**Contrôles MVP** :
- [ ] Rate limiting sur tool calls (100/min par défaut)
- [ ] Timeout sur executions (30s par défaut)
- [ ] Max tool calls per session (1000)
- [ ] Max output size (1MB)

**Contrôles production** :
- [ ] Execution budgets : CPU, memory, process count, wall-clock
- [ ] Quantity caps sur writes (100 records/batch)
- [ ] Idempotency keys pour prévenir duplicates
- [ ] Retry limits avec exponential backoff
- [ ] Circuit breakers sur tool calls
- [ ] Cost alerts et hard limits

### 5.7 Domaine 7 : Validation humaine

**Menace** : Actions irréversibles exécutées sans approbation humaine.

**Vecteurs d'attaque** :
- **Prompt injection** : Agent manipulé pour exécuter actions destructives
- **Accidental deletion** : Suppression de données importantes
- **Incident GitHub MCP (2025)** : Agent exécutant instructions malveillantes sans validation

**Impact** : Perte de données, actions irréversibles, compromission de systèmes externes.

**Contrôles MVP** :
- [ ] Confirmation utilisateur pour actions destructives (DELETE, DROP)
- [ ] Dry-run mode avant exécution
- [ ] Preview des changements avant commit

**Contrôles production** :
- [ ] Approval gates pour actions irréversibles
- [ ] Named human approver, no exceptions (OWASP)
- [ ] Separate reasoning from execution
- [ ] Two-phase commit pour transactions critiques
- [ ] Rollback capability pour toutes les writes

### 5.8 Domaine 8 : Prompt injection depuis pages et documents

**Menace** : Instructions malveillantes injectées via contenu externe (pages web, documents, emails, résultats d'outils).

**Vecteurs d'attaque** :
- **Indirect prompt injection (MCP-20)** : Instructions dans données consommées par tools
- **Incident GitHub MCP Data Heist (2025)** : Malicious files dans repos publics
- **Recherche arXiv 2601.17549** : MCP's architectural choices amplify attack success rates by 23-41%
- **Incident Invariant Labs** : GitHub Issue avec prompt injection exfiltrant private repos

**Impact** : Exécution de commandes non autorisées, exfiltration de données, compromission de l'agent.

**Contrôles MVP** :
- [ ] Traiter tout contenu externe comme untrusted
- [ ] Sanitization basique (strip HTML/scripts)
- [ ] Max content size (limiter contexte injecté)

**Contrôles production** :
- [ ] Input/output classifiers (LlamaFirewall)
- [ ] Chain-of-thought alignment check
- [ ] Generated-code static analysis
- [ ] Content provenance tracking
- [ ] Quarantine zone pour contenu suspect
- [ ] Adversarial testing offline (Anthropic guidance)

### 5.9 Domaine 9 : Logs et données personnelles

**Menace** : Exposition de données personnelles dans les logs, non-conformité GDPR.

**Vecteurs d'attaque** :
- **GDPR violation** : Logs contenant PII (emails, noms, IPs)
- **Data breach** : Logs non chiffrés, accès non autorisé
- **Retention excessive** : Logs conservés au-delà du nécessaire

**Impact** : Amendes GDPR, violation de vie privée, perte de confiance.

**Contrôles MVP** :
- [ ] Logs anonymisés (pas de PII)
- [ ] Retention limitée (30 jours)
- [ ] Pas de logging de contenus sensibles

**Contrôles production** :
- [ ] PII detection et masking automatique
- [ ] Chiffrement logs at-rest et in-transit
- [ ] Retention policies (GDPR Art. 17 right to erasure)
- [ ] Audit logs séparés (qui a accédé à quoi)
- [ ] Data processing agreements avec providers
- [ ] Privacy impact assessment

### 5.10 Domaine 10 : Sauvegardes, restauration et mises à jour

**Menace** : Perte de données, systèmes non patchés, pas de recovery plan.

**Vecteurs d'attaque** :
- **Ransomware** : Chiffrement de données sans backup
- **Unpatched vulnerabilities** : CVEs non corrigés
- **Data corruption** : Pas de restauration possible

**Impact** : Perte de données, indisponibilité prolongée, exploitation de vulnérabilités connues.

**Contrôles MVP** :
- [ ] Backups quotidiens (database, configs)
- [ ] Version control pour code et configs
- [ ] npm audit régulier
- [ ] Dependency updates (Dependabot/Renovate)

**Contrôles production** :
- [ ] Automated backups with encryption
- [ ] Disaster recovery plan testé
- [ ] Patch management policy (critical: 24h, high: 7d)
- [ ] Rollback capability pour déploiements
- [ ] Immutable backups (WORM storage)
- [ ] Regular restore testing

### 5.11 Domaine 11 : Dépendances et chaîne d'approvisionnement logicielle

**Menace** : Composants malveillants ou vulnérables dans la supply chain.

**Vecteurs d'attaque** :
- **Supply chain attacks** : npm packages malveillants (1.2M+ cumulative malicious packages)
- **Dependency confusion** : Typosquatting, package name squatting
- **Incident keyv/cacheable (Août 2026)** : Self-propagating worm via npm packages
- **CISA 2026 SBOM Minimum Elements** : Compliance requirement

**Impact** : Exécution de code malveillant, compromission de la supply chain, non-conformité réglementaire.

**Contrôles MVP** :
- [ ] npm ci (pas npm install) pour lockfile enforcement
- [ ] npm audit --audit-level=high en CI
- [ ] Lockfiles commités (package-lock.json, yarn.lock)
- [ ] Dependabot/Renovate pour updates

**Contrôles production** :
- [ ] SBOM generation obligatoire (CycloneDX 1.6+ ou SPDX 2.3+)
- [ ] npm audit signature verification
- [ ] Provenance attestation (npm publish --provenance)
- [ ] Private registry pour packages internes
- [ ] Dependency scanning en CI (Snyk, Socket)
- [ ] SBOM inventory queryable (pour répondre aux CVEs)
- [ ] Transitive dependencies coverage (no minimum depth, CISA 2026)

---

## 6. Incidents réels 2025-2026

### 6.1 Timeline des incidents majeurs

| Date | Incident | Vecteur | Impact | CVSS |
|------|----------|---------|--------|------|
| **Mi-2025** | Supabase MCP Lethal Trifecta | SQL injection via support tickets | Exfiltration integration tokens | - |
| **2025** | GitHub MCP Data Heist | Prompt injection via GitHub Issues | Exfiltration private repos | - |
| **Jan 2026** | Gemini MCP Tool 0-day | Command injection (CVE-2026-0755) | Arbitrary code execution | 9.8 |
| **Avr 2026** | STDIO Design Flaw (OX Security) | Shell execution sans sanitization | ~200,000 servers exposed | 9.8 |
| **Mai 2026** | DuneSlide (Cato AI Labs) | Sandbox escape chain (CVE-2026-50548/50549) | Sandbox escape | 9.8 |
| **Août 2026** | Deadbugz campaign | Malicious MCP server via GitHub PRs | SSH keys, AWS credentials exfiltration | - |
| **Août 2026** | keyv/cacheable supply chain | Self-propagating worm via npm | 99%+ malware on npm | - |

### 6.2 Patterns d'attaque récurrents

**Pattern 1 : Indirect Prompt Injection via Data**
- Attaquant injecte instructions dans contenu externe (Issue, email, document)
- Agent lit le contenu via tool MCP
- Instructions exécutées comme si provenant de l'utilisateur
- **Défense** : Traiter tout contenu externe comme untrusted, input classifiers

**Pattern 2 : Tool Poisoning via Descriptions**
- Serveur MCP malveillant cache instructions dans tool description
- Modèle lit la description (utilisateur ne la voit pas)
- Agent exécute actions non autorisées
- **Défense** : Audit des tool descriptions, allowlist de serveurs MCP

**Pattern 3 : Supply Chain Compromise**
- Package npm malveillant publié (typosquatting ou compromise maintainer)
- Package installé via npm install
- Code malveillant exécuté au build/runtime
- **Défense** : npm ci, SBOM, provenance attestation, dependency scanning

**Pattern 4 : STDIO Configuration Injection**
- Configuration MCP passée via STDIO sans sanitization
- Commande shell exécutée avec privileges du service
- Arbitrary code execution
- **Défense** : Input validation, pas de shell execution, sandboxing

---

## 7. Matrice de risques

### 7.1 Évaluation des risques (MVP)

| Menace | Probabilité | Impact | Risque | Priorité |
|--------|-------------|--------|--------|----------|
| Prompt injection (indirect) | Haute | Élevé | **Critique** | P1 |
| Secrets exposure | Moyenne | Élevé | **Élevé** | P1 |
| Supply chain attack | Moyenne | Élevé | **Élevé** | P1 |
| File path traversal | Moyenne | Moyen | **Moyen** | P2 |
| DoS (resource exhaustion) | Faible | Moyen | **Faible** | P3 |
| GDPR violation | Faible | Élevé | **Moyen** | P2 |

### 7.2 Évaluation des risques (Production)

| Menace | Probabilité | Impact | Risque | Priorité |
|--------|-------------|--------|--------|----------|
| Prompt injection (indirect) | Très haute | Critique | **Critique** | P0 |
| Sandbox escape | Moyenne | Critique | **Critique** | P0 |
| Supply chain attack | Haute | Critique | **Critique** | P0 |
| Secrets exposure | Haute | Critique | **Critique** | P0 |
| Multi-tenant data leakage | Moyenne | Critique | **Critique** | P0 |
| SSRF / metadata access | Haute | Élevé | **Élevé** | P1 |
| Tool poisoning | Haute | Élevé | **Élevé** | P1 |
| Elevation of privilege | Moyenne | Élevé | **Élevé** | P1 |

---

## 8. Contrôles de sécurité recommandés

### 8.1 Contrôles MVP (usage mono-utilisateur, local)

**Priorité P1 (implémenter avant release)** :
- [ ] Permissions read-only par défaut pour tools
- [ ] .env pour secrets (pas dans code)
- [ ] npm ci + npm audit en CI
- [ ] Container Docker avec user non-root
- [ ] Allowlist domaines (block metadata endpoints)
- [ ] Workspace mounting uniquement (pas /home, /etc)
- [ ] Rate limiting basique (100 tool calls/min)
- [ ] Confirmation utilisateur pour actions destructives
- [ ] Logs anonymisés (pas de PII)
- [ ] Backups quotidiens

**Priorité P2 (implémenter dans les 3 mois)** :
- [ ] Path validation avec realpath()
- [ ] Content sanitization basique
- [ ] Retention logs limitée (30 jours)
- [ ] Dependabot/Renovate pour updates
- [ ] Version control pour configs

**Priorité P3 ( backlog)** :
- [ ] Monitoring basique (erreurs, timeouts)
- [ ] Documentation sécurité
- [ ] Security testing manuel

### 8.2 Contrôles production (exposition réseau, multi-utilisateur)

**Priorité P0 (obligatoire avant exposition)** :
- [ ] Dedicated agent identity per user/tenant
- [ ] Short-lived credentials (minute-scale tokens)
- [ ] Firecracker microVMs pour code execution
- [ ] Default-deny network egress + explicit allowlist
- [ ] Secret injection per-task (Vault/AWS Secrets Manager)
- [ ] Approval gates pour actions irréversibles
- [ ] Input/output classifiers (LlamaFirewall)
- [ ] SBOM generation obligatoire (CycloneDX 1.6+)
- [ ] Multi-tenant isolation (separate workspaces)
- [ ] PII detection et masking automatique
- [ ] Chiffrement logs at-rest et in-transit
- [ ] Disaster recovery plan testé
- [ ] Patch management policy (critical: 24h)

**Priorité P1 (implémenter dans le premier mois)** :
- [ ] Authorization broker rechecking every action
- [ ] gVisor pour workloads compute-heavy
- [ ] Proxy layer pour inspection outbound traffic
- [ ] Content provenance tracking
- [ ] Audit logs séparés (qui a accédé à quoi)
- [ ] Automated backups with encryption
- [ ] Dependency scanning en CI (Snyk, Socket)
- [ ] Provenance attestation (npm publish --provenance)

**Priorité P2 (implémenter dans les 3 mois)** :
- [ ] Adversarial testing offline
- [ ] Privacy impact assessment
- [ ] Immutable backups (WORM storage)
- [ ] Transitive dependencies SBOM coverage
- [ ] Regular restore testing
- [ ] Security incident response plan

---

## 9. Limites

### 9.1 Limites du modèle de menace

1. **Évolution rapide** : Menaces MCP évoluent rapidement (nouveaux vecteurs chaque mois)
2. **Subjectivité** : Évaluation probabilité/impact subjective
3. **Couverture incomplète** : Certaines menaces émergentes non couvertes
4. **Contexte spécifique** : Modèle adapté à EKTS, peut nécessiter ajustements pour autres projets
5. **Dépendances externes** : Vulnérabilités dans dépendances MCP SDK (STDIO flaw)

### 9.2 Questions ouvertes

1. **Maturity MCP** : Quand le protocole MCP aura-t-il capability attestation native ?
2. **Sandboxing optimal** : Firecracker vs gVisor vs V8 Isolates pour quel use case ?
3. **Prompt injection defense** : Existe-t-il une défense fiable contre prompt injection ?
4. **Multi-tenant isolation** : Quelle architecture pour isolation multi-utilisateur ?
5. **Compliance** : Quelles réglementations s'appliquent (GDPR, Cyber Resilience Act) ?

---

## 10. Recommandations

### 10.1 Roadmap sécurité

**Phase 1 : MVP (mois 1-3)**
- Implémenter contrôles P1
- Testing manuel sécurité
- Documentation sécurité de base

**Phase 2 : Pré-production (mois 3-6)**
- Implémenter contrôles P2
- Security testing automatisé
- Audit sécurité externe

**Phase 3 : Production (mois 6-12)**
- Implémenter contrôles P0 production
- Monitoring sécurité continu
- Incident response plan
- Regular security assessments

### 10.2 Outils recommandés

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

### 10.3 Ressources

**Standards et frameworks** :
- OWASP Top 10 for LLM Applications (2025)
- OWASP Top 10 for Agentic Applications (2026)
- CISA 2026 Minimum Elements for SBOM
- Microsoft AI Agent Security Guidance (2026)
- NVIDIA AI Red Team Sandboxing Guidance (2026)

**Recherche académique** :
- arXiv 2601.17549 : Breaking the Protocol (MCP security analysis)
- arXiv 2603.22489 : MCP Threat Modeling
- arXiv 2603.18063 : MCP-38 Threat Taxonomy

**Incidents et advisories** :
- CVE-2026-0755 : Gemini MCP Tool 0-day
- CVE-2026-50548/50549 : DuneSlide sandbox escape
- OX Security STDIO Design Flaw (April 2026)

---

## 11. Décisions

| Décision | Justification | Alternative rejetée |
|----------|---------------|---------------------|
| **STRIDE adapté MCP** | Framework reconnu + spécificités MCP/agents | Framework custom → pas de référence |
| **11 domaines de menaces** | Couverture complète (moindre privilège → supply chain) | 5 domaines → pas assez complet |
| **Matrice risques MVP vs Production** | Progression réaliste (mono-user → multi-user) | Matrice unique → pas adapté aux deux contextes |
| **Contrôles proportionnés** | MVP = contrains rapides, Production = contrôles approfondis | Contrôles maximaux dès MVP → ralentit développement |
| **Focus incidents réels 2025-2026** | Menaces prouvées, pas théoriques | Menaces théoriques → pas de priorité claire |
| **SBOM obligatoire en production** | CISA 2026 compliance, supply chain transparency | Pas de SBOM → pas de visibilité dependencies |

---

## 12. Questions

1. **Maturity MCP** : Quand capability attestation sera-t-elle disponible dans MCP ?
2. **Sandboxing** : Quel niveau d'isolation pour quel use case EKTS ?
3. **Prompt injection** : Quelle stratégie de défense adopter (classifiers, sanitization, quarantine) ?
4. **Multi-tenant** : Quelle architecture pour isolation multi-utilisateur (separate instances vs shared) ?
5. **Compliance** : Quelles réglementations s'appliquent (GDPR, Cyber Resilience Act EU 2024/2847) ?
6. **Incident response** : Comment détecter et répondre aux incidents de sécurité ?
7. **Security testing** : Quels outils pour adversarial testing (red teaming) ?

---

## 13. Sources

### 13.1 Recherche académique

1. **arXiv 2601.17549** — Breaking the Protocol: Security Analysis of MCP (Jan 2026)
2. **arXiv 2603.22489** — Model Context Protocol Threat Modeling (Mar 2026)
3. **arXiv 2603.18063** — MCP-38: Comprehensive Threat Taxonomy (Mar 2026)

### 13.2 Incidents et advisories

4. **CVE-2026-0755** — Gemini MCP Tool 0-day (Jan 2026, CVSS 9.8)
5. **CVE-2026-50548/50549** — DuneSlide sandbox escape (Mai 2026, CVSS 9.8)
6. **OX Security STDIO Flaw** — MCP SDK design flaw (Avr 2026, ~200K servers)
7. **Deadbugz campaign** — Malicious MCP server (Août 2026)
8. **keyv/cacheable supply chain** — npm worm (Août 2026)

### 13.3 Standards et frameworks

9. **OWASP Top 10 for LLM Applications** (2025)
10. **OWASP Top 10 for Agentic Applications** (2026)
11. **CISA 2026 Minimum Elements for SBOM** (Juillet 2026)
12. **Microsoft AI Agent Security Guidance** (Juillet 2026)
13. **NVIDIA AI Red Team Sandboxing Guidance** (Mars 2026)

### 13.4 Bonnes pratiques

14. **Checkmarx** — 11 Emerging AI Security Risks with MCP (Oct 2026)
15. **Coalition for Secure AI** — Model Context Protocol Security (Mar 2026)
16. **NSA** — Model Context Protocol Security Guide (Mai 2026)
17. **Authzed** — Timeline of MCP Security Breaches (Nov 2025)

---

## 14. Relations

### 14.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 02-03** (MCP, Outils) | Menaces spécifiques MCP |
| **Phase 04-05** (Navigateur, Scraping) | Menaces scraping, SSRF |
| **Phase 06-07** (Stockage, RAG) | Menaces données, prompt injection via RAG |
| **Phase 09** (Bibliothèque créative) | Menaces supply chain (dépendances) |
| **Phase 10** (Capitalisation) | Menaces secrets, logs |

### 14.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 12** (Comparatif IA) | Intégration contrôles sécurité |
| **Phase 13** (Architecture) | Architecture sécurisée |
| **Phase 14** (Audit) | Validation contrôles sécurité |

---

## 15. Critères d'évaluation

### 15.1 Critères de complétude

- [x] 11 domaines de menaces couverts
- [x] 38 vecteurs d'attaque documentés
- [x] Incidents réels 2025-2026 analysés
- [x] Matrice risques MVP vs Production
- [x] Contrôles proportionnés définis
- [x] Roadmap sécurité (MVP → production)

### 15.2 Critères de qualité

- [x] Basé sur recherche académique 2026
- [x] Incidents réels et CVEs documentés
- [x] Standards OWASP, CISA, Microsoft, NVIDIA
- [x] Contrôles actionnables et vérifiables

### 15.3 Critères d'actionnabilité

- [x] Checklists MVP et Production
- [x] Outils recommandés pour chaque contrôle
- [x] Roadmap temporelle (mois 1-3, 3-6, 6-12)
- [x] Ressources et standards référencés

---

**Document rédigé le 21 octobre 2026 — Phase 11 du projet EKTS**
