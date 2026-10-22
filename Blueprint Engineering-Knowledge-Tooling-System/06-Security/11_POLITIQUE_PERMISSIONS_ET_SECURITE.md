# Phase 11 — Politique de Permissions et Sécurité EKTS

**Date de création :** 21 octobre 2026  
**Statut :** ✅ Terminé  
**Auteur :** Agent EKTS  
**Version :** 1.0

---

## 1. Objectif

Définir la politique de sécurité complète pour EKTS, couvrant les 11 domaines évalués dans le modèle de menace. Cette politique établit les règles, contrôles et procédures pour sécuriser le système EKTS en contexte MVP puis production.

---

## 2. Résumé

**Politique en 11 domaines** :
1. Moindre privilège — Permissions minimales par défaut
2. Isolation des processus — Sandboxing obligatoire
3. Liste de domaines autorisés — Default-deny network egress
4. Contrôle des chemins de fichiers — Workspace isolation
5. Secrets et variables d'environnement — Gestion sécurisée
6. Limites de volume et durée — Rate limiting et quotas
7. Validation humaine — Approval gates pour actions critiques
8. Prompt injection — Défense en profondeur
9. Logs et données personnelles — GDPR compliance
10. Sauvegardes et mises à jour — Recovery et patch management
11. Supply chain — SBOM et dependency scanning

---

## 3. Niveaux de sécurité

| Niveau | Contexte | Contrôles | Exposition |
|--------|----------|-----------|------------|
| **Level 1** | MVP, développement | Contrôles basiques | Local, mono-user |
| **Level 2** | Pré-production | Contrôles intermédiaires | Test, staging |
| **Level 3** | Production | Contrôles avancés | Réseau publique, multi-user |
| **Level 4** | Critique | Contrôles maximaux | Données sensibles, réglementé |

---

## 4. Domaine 1 : Moindre privilège

### 4.1 Règles MVP (Level 1)

**Règle 1.1** : Permissions read-only par défaut
```typescript
const defaultPermissions = {
  read: true,
  write: false,
  delete: false,
  execute: false
};
```

**Règle 1.2** : Outils séparés pour lecture vs écriture
```typescript
const readTool = {
  name: 'read_file',
  permissions: ['read'],
  paths: ['/workspace/**']
};

const writeTool = {
  name: 'write_file',
  permissions: ['write'],
  paths: ['/workspace/**'],
  requiresApproval: true
};
```

**Règle 1.3** : Pas d'accès shell direct
```bash
# INTERDIT
agent.execute('rm -rf /')

# AUTORISÉ (commandes limitées)
agent.execute('ls', { allowedCommands: ['ls', 'cat', 'grep'] })
```

**Règle 1.4** : Variables d'environnement minimales
```bash
# Seules variables nécessaires
ENVIRONMENT=production
DATABASE_URL=postgresql://...
API_KEY=xxx
```

### 4.2 Règles Production (Level 3)

**Règle 1.5** : Dedicated agent identity
```typescript
const agentIdentity = {
  id: 'agent-uuid-123',
  name: 'research-agent',
  owner: 'user@example.com',
  purpose: 'Research and analysis',
  roles: ['researcher'],
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-12-31T23:59:59Z'
};
```

**Règle 1.6** : Short-lived credentials
```typescript
const credential = {
  type: 'bearer',
  token: 'eyJhbGc...',
  issuedAt: '2026-10-21T10:00:00Z',
  expiresAt: '2026-10-21T10:15:00Z', // 15 minutes
  scope: 'read:files write:workspace',
  resourceId: 'workspace-uuid-456'
};
```

**Règle 1.7** : Per-tool permission scoping
```typescript
const toolPermissions = {
  'read_file': {
    resources: ['/workspace/**'],
    operations: ['read'],
    maxFileSize: '10MB'
  },
  'write_file': {
    resources: ['/workspace/output/**'],
    operations: ['write'],
    requiresApproval: true,
    maxFileSize: '5MB'
  }
};
```

**Règle 1.8** : Secret injection per-task
```typescript
async function executeTask(task, agent) {
  const secrets = await getSecretsForTask(task);
  
  const result = await sandbox.execute(task, {
    env: secrets,
    timeout: task.timeout
  });
  
  await revokeSecrets(secrets);
  
  return result;
}
```

---

## 5. Domaine 2 : Isolation des processus

### 5.1 Règles MVP (Level 1)

**Règle 2.1** : Container Docker avec user non-root
```dockerfile
FROM node:20-alpine

RUN addgroup -g 1001 -S ekts && \
    adduser -S ekts -u 1001 -G ekts

USER ekts
WORKDIR /workspace
```

**Règle 2.2** : Filesystem read-only
```yaml
services:
  ekts:
    image: ekts:latest
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - ./workspace:/workspace:rw
```

**Règle 2.3** : Resource limits
```yaml
services:
  ekts:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

### 5.2 Règles Production (Level 3)

**Règle 2.4** : Firecracker microVMs
```typescript
import { FirecrackerVM } from '@ekts/sandbox';

async function executeCode(code, context) {
  const vm = new FirecrackerVM({
    vcpuCount: 2,
    memoryMB: 512,
    rootfs: 'ekts-sandbox.ext4',
    timeout: 30000
  });
  
  await vm.start();
  
  try {
    return await vm.execute(code);
  } finally {
    await vm.destroy();
  }
}
```

**Règle 2.5** : Un sandbox éphémère par tâche
```typescript
async function processTask(task) {
  const sandbox = await createEphemeralSandbox({
    image: 'ekts-sandbox:latest',
    network: 'none',
    workDir: '/workspace'
  });
  
  try {
    return await sandbox.execute(task);
  } finally {
    await sandbox.destroy();
  }
}
```

---

## 6. Domaine 3 : Liste de domaines autorisés

### 6.1 Règles MVP (Level 1)

**Règle 3.1** : Allowlist explicite des domaines
```typescript
const networkConfig = {
  allowedDomains: [
    'api.openai.com',
    'api.anthropic.com',
    'registry.npmjs.org'
  ],
  blockedDomains: [
    '169.254.169.254', // AWS metadata
    'metadata.google.internal', // GCP metadata
    '168.63.129.16' // Azure metadata
  ]
};
```

**Règle 3.2** : Block metadata endpoints
```bash
iptables -A OUTPUT -d 169.254.169.254 -j DROP
iptables -A OUTPUT -d 168.63.129.16 -j DROP
```

### 6.2 Règles Production (Level 3)

**Règle 3.3** : Default-deny egress posture
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ekts-egress-deny
spec:
  podSelector:
    matchLabels:
      app: ekts
  policyTypes:
  - Egress
  egress: [] # Deny all by default
```

**Règle 3.4** : Explicit allowlist
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ekts-egress-allow
spec:
  podSelector:
    matchLabels:
      app: ekts
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 104.18.37.141/32 # api.openai.com
    ports:
    - protocol: TCP
      port: 443
```

---

## 7. Domaine 4 : Contrôle des chemins de fichiers

### 7.1 Règles MVP (Level 1)

**Règle 4.1** : Workspace mounting uniquement
```typescript
const filesystemConfig = {
  allowedPaths: ['/workspace/**'],
  blockedPaths: ['/home/**', '/etc/**', '/var/**', '/root/**']
};
```

**Règle 4.2** : Block dotfiles
```typescript
function validatePath(path) {
  const blocked = ['.ssh', '.aws', '.config', '.env', '.git/config'];
  
  for (const pattern of blocked) {
    if (path.includes(pattern)) {
      throw new Error(`Access denied: ${pattern}`);
    }
  }
  
  return true;
}
```

**Règle 4.3** : Path validation avec realpath()
```typescript
import { realpath } from 'fs/promises';

async function validatePath(inputPath, basePath) {
  const resolvedPath = await realpath(inputPath);
  const resolvedBase = await realpath(basePath);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }
  
  return resolvedPath;
}
```

### 7.2 Règles Production (Level 3)

**Règle 4.4** : Separate workspace per user/tenant
```typescript
async function getWorkspacePath(userId, tenantId) {
  return `/workspaces/${tenantId}/${userId}`;
}
```

**Règle 4.5** : File access logging
```typescript
async function logFileAccess(userId, path, operation) {
  await db.fileAccessLogs.insert({
    userId,
    path,
    operation,
    timestamp: new Date(),
    ip: getClientIP()
  });
}
```

---

## 8. Domaine 5 : Secrets et variables d'environnement

### 8.1 Règles MVP (Level 1)

**Règle 5.1** : Secrets dans .env
```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/ekts
API_KEY=sk-xxx

# .gitignore
.env
.env.local
*.key
*.pem
```

**Règle 5.2** : Pas de logging de secrets
```typescript
// INTERDIT
console.log('API Key:', process.env.API_KEY); // ❌

// AUTORISÉ
console.log('API Key:', maskSecret(process.env.API_KEY)); // ✅

function maskSecret(secret) {
  if (!secret) return '';
  return secret.substring(0, 4) + '***';
}
```

### 8.2 Règles Production (Level 3)

**Règle 5.3** : Secrets manager (Vault)
```typescript
import Vault from 'node-vault';

const vault = Vault({
  apiVersion: 'v1',
  endpoint: 'https://vault.ekts.internal'
});

async function getSecret(path) {
  const secret = await vault.read(path);
  return secret.data;
}
```

**Règle 5.4** : Keep secrets outside model context
```typescript
// INTERDIT : Secrets dans le prompt
const prompt = `Use this API key: ${process.env.API_KEY}`; // ❌

// AUTORISÉ : Secrets dans l'environnement du sandbox
const sandbox = await createSandbox({
  env: { API_KEY: process.env.API_KEY }
});

const prompt = `Use the API_KEY environment variable`; // ✅
```

---

## 9. Domaine 6 : Limites de volume et durée

### 9.1 Règles MVP (Level 1)

**Règle 6.1** : Rate limiting sur tool calls
```typescript
const rateLimiter = {
  maxCalls: 100,
  windowMs: 60 * 1000,
  calls: new Map()
};

function checkRateLimit(userId) {
  const now = Date.now();
  const userCalls = rateLimiter.calls.get(userId) || [];
  const recentCalls = userCalls.filter(t => now - t < rateLimiter.windowMs);
  
  if (recentCalls.length >= rateLimiter.maxCalls) {
    throw new Error('Rate limit exceeded');
  }
  
  recentCalls.push(now);
  rateLimiter.calls.set(userId, recentCalls);
}
```

**Règle 6.2** : Timeout sur executions
```typescript
async function executeWithTimeout(fn, timeoutMs = 30000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

**Règle 6.3** : Max tool calls per session
```typescript
const sessionLimits = {
  maxToolCalls: 1000,
  maxDuration: 3600000 // 1 hour
};
```

### 9.2 Règles Production (Level 3)

**Règle 6.4** : Execution budgets
```typescript
const executionBudgets = {
  cpu: 2.0,
  memory: 512 * 1024 * 1024,
  processes: 10,
  wallClock: 60000
};
```

**Règle 6.5** : Circuit breakers
```typescript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.lastFailure = 0;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## 10. Domaine 7 : Validation humaine

### 10.1 Règles MVP (Level 1)

**Règle 7.1** : Confirmation utilisateur pour actions destructives
```typescript
const destructiveActions = ['DELETE', 'DROP', 'TRUNCATE', 'rm -rf'];

async function executeAction(action) {
  if (destructiveActions.some(da => action.includes(da))) {
    const confirmed = await promptUser(
      `Are you sure you want to execute: ${action}? (yes/no)`
    );
    
    if (confirmed !== 'yes') {
      throw new Error('Action cancelled by user');
    }
  }
  
  return await execute(action);
}
```

**Règle 7.2** : Dry-run mode
```typescript
async function executeWithDryRun(action, dryRun = false) {
  if (dryRun) {
    console.log('Dry run:', action);
    return { success: true, dryRun: true };
  }
  
  return await execute(action);
}
```

### 10.2 Règles Production (Level 3)

**Règle 7.3** : Approval gates
```typescript
async function executeIrreversibleAction(action, approver) {
  const approvalRequest = await db.approvalRequests.insert({
    action,
    requestedBy: getCurrentUser(),
    approver,
    status: 'PENDING',
    createdAt: new Date()
  });
  
  await notifyApprover(approver, approvalRequest);
  
  const approval = await waitForApproval(approvalRequest.id);
  
  if (approval.status !== 'APPROVED') {
    throw new Error('Action not approved');
  }
  
  return await execute(action);
}
```

**Règle 7.4** : Separate reasoning from execution
```typescript
class SecureAgent {
  async reason(task) {
    const plan = await llm.generatePlan(task);
    return plan;
  }
  
  async execute(plan) {
    for (const step of plan.steps) {
      await validateStep(step);
      await requireApprovalIfIrreversible(step);
      await executeStep(step);
    }
  }
}
```

---

## 11. Domaine 8 : Prompt injection

### 11.1 Règles MVP (Level 1)

**Règle 8.1** : Traiter contenu externe comme untrusted
```typescript
async function processExternalContent(content) {
  const sanitized = content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
  
  return sanitized;
}
```

**Règle 8.2** : Max content size
```typescript
const maxContentSize = 10000; // 10KB

function validateContentSize(content) {
  if (content.length > maxContentSize) {
    throw new Error('Content too large');
  }
}
```

### 11.2 Règles Production (Level 3)

**Règle 8.3** : Input/output classifiers
```typescript
import { LlamaFirewall } from '@ekts/security';

const firewall = new LlamaFirewall({
  inputClassifier: 'prompt-injection-detector',
  outputClassifier: 'data-leakage-detector'
});

async function processWithFirewall(input) {
  const inputRisk = await firewall.classifyInput(input);
  
  if (inputRisk.score > 0.7) {
    throw new Error('Potential prompt injection detected');
  }
  
  const output = await process(input);
  
  const outputRisk = await firewall.classifyOutput(output);
  
  if (outputRisk.score > 0.7) {
    throw new Error('Potential data leakage detected');
  }
  
  return output;
}
```

**Règle 8.4** : Content provenance tracking
```typescript
async function processContentWithProvenance(content, source) {
  const provenance = {
    source,
    timestamp: new Date(),
    trusted: isTrustedSource(source),
    sanitized: false
  };
  
  if (!provenance.trusted) {
    content = await sanitize(content);
    provenance.sanitized = true;
  }
  
  return { content, provenance };
}
```

---

## 12. Domaine 9 : Logs et données personnelles

### 12.1 Règles MVP (Level 1)

**Règle 9.1** : Logs anonymisés
```typescript
function logAction(userId, action) {
  const anonymizedUserId = hashUserId(userId);
  
  console.log({
    userId: anonymizedUserId,
    action,
    timestamp: new Date()
  });
}

function hashUserId(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
}
```

**Règle 9.2** : Retention limitée
```typescript
const retentionDays = 30;

async function cleanupOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  await db.logs.delete({
    timestamp: { $lt: cutoffDate }
  });
}

setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
```

### 12.2 Règles Production (Level 3)

**Règle 9.3** : PII detection et masking
```typescript
import { PIIDetector } from '@ekts/security';

const piiDetector = new PIIDetector();

async function maskPII(text) {
  const detections = await piiDetector.detect(text);
  
  for (const detection of detections) {
    text = text.replace(detection.value, detection.type.toUpperCase());
  }
  
  return text;
}
```

**Règle 9.4** : Chiffrement logs
```typescript
import { encrypt } from '@ekts/crypto';

async function logEncrypted(data) {
  const encrypted = await encrypt(JSON.stringify(data));
  
  await db.logs.insert({
    data: encrypted,
    timestamp: new Date()
  });
}
```

**Règle 9.5** : GDPR Art. 17 right to erasure
```typescript
async function eraseUserData(userId) {
  await db.users.delete({ id: userId });
  await db.logs.delete({ userId });
  await db.sessions.delete({ userId });
  
  await db.erasureRequests.insert({
    userId,
    timestamp: new Date(),
    status: 'COMPLETED'
  });
}
```

---

## 13. Domaine 10 : Sauvegardes et mises à jour

### 13.1 Règles MVP (Level 1)

**Règle 10.1** : Backups quotidiens
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/$DATE"

mkdir -p $BACKUP_DIR
pg_dump ekts > $BACKUP_DIR/ekts.sql
tar -czf $BACKUP_DIR/configs.tar.gz /etc/ekts/
tar -czf /backups/ekts-$DATE.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
find /backups -name "ekts-*.tar.gz" -mtime +30 -delete
```

**Règle 10.2** : npm audit régulier
```bash
npm audit --audit-level=high
npm audit fix
```

**Règle 10.3** : Dependency updates
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 13.2 Règles Production (Level 3)

**Règle 10.4** : Automated backups avec chiffrement
```typescript
import { backup, encrypt } from '@ekts/backup';

async function automatedBackup() {
  const backupData = await backup({
    database: true,
    files: ['/workspace', '/configs']
  });
  
  const encrypted = await encrypt(backupData, getEncryptionKey());
  
  await uploadToS3(encrypted, {
    bucket: 'ekts-backups',
    key: `backups/${Date.now()}.enc`
  });
}

setInterval(automatedBackup, 60 * 60 * 1000);
```

**Règle 10.5** : Patch management policy
```typescript
const patchPolicy = {
  critical: 24 * 60 * 60 * 1000, // 24h
  high: 7 * 24 * 60 * 60 * 1000, // 7j
  medium: 30 * 24 * 60 * 60 * 1000, // 30j
  low: 90 * 24 * 60 * 60 * 1000 // 90j
};
```

---

## 14. Domaine 11 : Supply chain

### 14.1 Règles MVP (Level 1)

**Règle 11.1** : npm ci pour lockfile enforcement
```bash
# INTERDIT
npm install # ❌

# AUTORISÉ
npm ci # ✅
```

**Règle 11.2** : npm audit en CI
```yaml
# .github/workflows/security.yml
name: Security
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high
```

**Règle 11.3** : Lockfiles commités
```bash
git add package-lock.json
git commit -m "Update dependencies"
```

### 14.2 Règles Production (Level 3)

**Règle 11.4** : SBOM generation obligatoire
```bash
npm install -g @cyclonedx/cyclonedx-npm
cyclonedx-npm --output-format json --output-file sbom.json
```

**Règle 11.5** : Provenance attestation
```yaml
# .github/workflows/publish.yml
name: Publish
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm publish --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Règle 11.6** : Dependency scanning en CI
```yaml
name: Security
on: [push, pull_request]
jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 15. Configuration centralisée

```typescript
// ekts-security.config.ts
export const securityConfig = {
  level: process.env.SECURITY_LEVEL || 'level-1',
  
  leastPrivilege: {
    defaultPermissions: ['read'],
    shortLivedCredentials: true,
    credentialTTL: '15m'
  },
  
  isolation: {
    sandbox: 'docker',
    readOnlyRoot: true,
    ephemeralPerTask: true
  },
  
  network: {
    defaultDeny: true,
    allowedDomains: ['api.openai.com', 'api.anthropic.com'],
    blockedIPs: ['169.254.169.254']
  },
  
  filesystem: {
    allowedPaths: ['/workspace/**'],
    blockedPaths: ['/home/**', '/etc/**'],
    readOnlyExcept: ['/workspace']
  },
  
  secrets: {
    manager: 'vault',
    injectPerTask: true,
    rotationInterval: '10m'
  },
  
  limits: {
    rateLimit: 100,
    timeout: 30000,
    maxToolCalls: 1000,
    maxOutputSize: 1024 * 1024
  },
  
  humanValidation: {
    requireApproval: true,
    approvers: ['admin@example.com']
  },
  
  promptInjection: {
    classifier: 'llama-firewall',
    threshold: 0.7
  },
  
  logs: {
    anonymize: true,
    retention: '30d',
    encrypt: true
  },
  
  backups: {
    frequency: '1h',
    encryption: true,
    retention: '90d'
  },
  
  supplyChain: {
    sbom: true,
    scanning: 'snyk',
    provenance: true
  }
};
```

---

## 16. Limites

### 16.1 Limites identifiées

1. **Complexité** : Politique très détaillée peut être difficile à implémenter
2. **Évolution** : Menaces évoluent rapidement, politique doit être mise à jour
3. **Performance** : Contrôles de sécurité peuvent ralentir le système
4. **False positives** : Classifiers prompt injection peuvent bloquer contenu légitime
5. **Maintenance** : SBOM et dependency scanning nécessitent maintenance continue

### 16.2 Questions ouvertes

1. **Niveau de sécurité** : Quel niveau pour quel use case EKTS ?
2. **Sandboxing** : Docker vs Firecracker vs gVisor pour quel contexte ?
3. **Prompt injection** : Quel classifier utiliser (LlamaFirewall, Rebuff, custom) ?
4. **Secrets management** : Vault vs AWS Secrets Manager vs autre ?
5. **Compliance** : Quelles réglementations s'appliquent (GDPR, Cyber Resilience Act) ?

---

## 17. Recommandations

### 17.1 Roadmap implémentation

**Phase 1 : MVP (mois 1-3)**
- Implémenter règles Level 1
- Tests manuels sécurité
- Documentation sécurité

**Phase 2 : Pré-production (mois 3-6)**
- Implémenter règles Level 2
- Security testing automatisé
- Audit sécurité externe

**Phase 3 : Production (mois 6-12)**
- Implémenter règles Level 3
- Monitoring sécurité continu
- Incident response plan

### 17.2 Outils recommandés

**Secrets management** :
- **Vault** (HashiCorp) : Secrets management centralisé
- **AWS Secrets Manager** : Intégration cloud AWS

**Sandboxing** :
- **Firecracker** : MicroVMs hardware-isolated
- **gVisor** : Syscall interception
- **Docker** : Container isolation (baseline)

**Dependency scanning** :
- **Snyk** : Vulnerability scanning + SBOM
- **Socket** : Supply chain security
- **npm audit** : Built-in npm scanning

**Prompt injection defense** :
- **LlamaFirewall** : Input/output classifiers
- **Rebuff** : Prompt injection detection

---

## 18. Sources

### 18.1 Standards et frameworks

1. **OWASP Top 10 for LLM Applications** (2025)
2. **OWASP Top 10 for Agentic Applications** (2026)
3. **CISA 2026 Minimum Elements for SBOM**
4. **Microsoft AI Agent Security Guidance** (2026)
5. **NVIDIA AI Red Team Sandboxing Guidance** (2026)

### 18.2 Documentation technique

6. **Docker Security Best Practices**
7. **Kubernetes Network Policies**
8. **HashiCorp Vault Documentation**
9. **Firecracker MicroVMs Documentation**
10. **gVisor Documentation**

---

## 19. Relations

### 19.1 Phases amont

| Phase | Relation |
|-------|----------|
| **Phase 11** (Modèle de menace) | 11 domaines évalués |
| **Phase 02-03** (MCP, Outils) | Menaces MCP spécifiques |
| **Phase 06-07** (Stockage, RAG) | Menaces données |
| **Phase 09** (Bibliothèque) | Menaces supply chain |

### 19.2 Phases aval

| Phase | Relation |
|-------|----------|
| **Phase 12** (Comparatif IA) | Intégration contrôles sécurité |
| **Phase 13** (Architecture) | Architecture sécurisée |
| **Phase 14** (Audit) | Validation contrôles |

---

## 20. Critères d'évaluation

### 20.1 Critères de complétude

- [x] 11 domaines couverts
- [x] Règles MVP et Production définies
- [x] Exemples de code pour chaque règle
- [x] Configuration centralisée
- [x] Roadmap implémentation

### 20.2 Critères de qualité

- [x] Basé sur standards 2026 (OWASP, Microsoft, NVIDIA, CISA)
- [x] Exemples concrets et actionnables
- [x] Progression MVP → Production
- [x] Outils recommandés

### 20.3 Critères d'actionnabilité

- [x] Checklists vérifiables
- [x] Code prêt à l'emploi
- [x] Configuration centralisée
- [x] Roadmap temporelle

---

**Document rédigé le 21 octobre 2026 — Phase 11 du projet EKTS**
