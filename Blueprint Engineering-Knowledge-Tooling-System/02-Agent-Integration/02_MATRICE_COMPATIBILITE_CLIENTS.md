# Phase 02 — Matrice de Compatibilité des Clients MCP

**Statut :** ✅ Terminé  
**Date :** 21 octobre 2026  
**Version :** 1.0  
**Spécification MCP référencée :** 2026-07-28

---

## 1. Objectif et périmètre

### Objectif

Documenter la compatibilité des clients MCP disponibles en octobre 2026, leurs capacités, leurs méthodes de configuration, et leurs limites. Ce document sert de référence pour choisir les clients cibles pour EKTS et comprendre les contraintes d'intégration.

### Périmètre

Ce document couvre :
- Les clients MCP majeurs (Claude Code, Cursor, Cline, Codex, etc.)
- Leurs capacités (tools, resources, prompts, sampling, roots)
- Leurs transports supportés (stdio, Streamable HTTP)
- Leurs méthodes de configuration
- Leurs mécanismes d'authentification
- Leurs mécanismes d'approbation des outils
- Leurs limites et contraintes

### Hors périmètre

- Implémentation de serveurs MCP (voir `02_MCP_ET_AGENTS.md`)
- Configuration détaillée de chaque client (documentation officielle)
- Comparaison des modèles IA sous-jacents (Claude, GPT, etc.)

---

## 2. Résumé exécutif

### État de l'écosystème MCP (octobre 2026)

L'écosystème MCP est mature et en croissance rapide. Les principaux clients sont :

1. **Claude Code** — Client CLI officiel d'Anthropic, support complet
2. **Cursor** — IDE AI-first avec support MCP natif
3. **Cline** — Extension VS Code open source avec support MCP complet
4. **Codex CLI** — Client CLI d'OpenAI avec support MCP
5. **Claude Desktop** — Application desktop officielle
6. **Windsurf** — IDE avec support MCP
7. **VS Code + Copilot** — Support MCP via extensions
8. **Continue** — Extension IDE multi-plateforme

### Recommandation pour EKTS

**Clients cibles prioritaires :**
1. **Claude Code** — Support complet, documentation excellente, idéal pour le développement
2. **Cursor** — IDE populaire, support MCP natif, bonne UX
3. **Cline** — Open source, flexible, supporte tous les features MCP

**Justification :**
- Ces 3 clients couvrent les principaux cas d'usage (CLI, IDE, extension)
- Ils supportent tous la spécification 2026-07-28
- Ils ont une documentation claire et une communauté active
- Ils permettent de tester EKTS dans différents contextes

---

## 3. Matrice de compatibilité globale

### 3.1 Support des capacités MCP

| Client | Tools | Resources | Prompts | Sampling | Roots | Elicitation | Tasks |
|--------|-------|-----------|---------|----------|-------|-------------|-------|
| **Claude Code** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Claude Desktop** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Cursor** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cline** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Codex CLI** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Windsurf** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **VS Code + Copilot** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Continue** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Zed** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Légende :**
- ✅ Support complet
- ❌ Non supporté
- ⚠️ Support partiel ou expérimental

**Observations :**
- **Claude Code** et **Claude Desktop** ont le support le plus complet
- **Cursor** supporte tools, resources et prompts (suffisant pour EKTS)
- **Cline** ne supporte pas les prompts (limitation mineure pour EKTS)
- **Codex CLI** et **Windsurf** ont un support minimal (tools uniquement)
- **Sampling** est rarement supporté (nécessite une intégration profonde avec le modèle)

### 3.2 Support des transports

| Client | stdio | Streamable HTTP | SSE (legacy) | OAuth 2.1 |
|--------|-------|-----------------|--------------|-----------|
| **Claude Code** | ✅ | ✅ | ✅ | ✅ |
| **Claude Desktop** | ✅ | ✅ | ✅ | ✅ |
| **Cursor** | ✅ | ✅ | ✅ | ✅ |
| **Cline** | ✅ | ✅ | ✅ | ❌ |
| **Codex CLI** | ✅ | ⚠️ | ❌ | ✅ |
| **Windsurf** | ✅ | ✅ | ✅ | ✅ |
| **VS Code + Copilot** | ✅ | ✅ | ✅ | ✅ |
| **Continue** | ✅ | ✅ | ✅ | ❌ |
| **Zed** | ✅ | ✅ | ✅ | ❌ |

**Observations :**
- **stdio** est universellement supporté (recommandé pour EKTS MVP)
- **Streamable HTTP** est supporté par tous les clients majeurs
- **SSE** est en dépréciation (legacy)
- **OAuth 2.1** est supporté par les clients officiels (Anthropic, OpenAI)

---

## 4. Fiches détaillées des clients

### 4.1 Claude Code

**Type :** CLI (Command-Line Interface)  
**Éditeur :** Anthropic  
**Modèle IA :** Claude (Sonnet, Opus, Haiku)  
**Licence :** Propriétaire (gratuit avec abonnement Claude Pro/Team/Enterprise)

#### Capacités MCP

| Capacité | Support | Notes |
|----------|---------|-------|
| Tools | ✅ Complet | Découverte et appel d'outils |
| Resources | ✅ Complet | Lecture de ressources |
| Prompts | ✅ Complet | Exposition comme slash commands |
| Sampling | ❌ Non supporté | — |
| Roots | ✅ Complet | Accès au système de fichiers |
| Elicitation | ✅ Complet | Demandes d'information à l'utilisateur |
| Tasks | ✅ Complet | Tâches asynchrones longues |

#### Configuration

**Fichiers de configuration :**
- Projet : `.mcp.json` (à la racine du projet)
- Utilisateur : `~/.claude.json` (configuration globale)

**Format de configuration :**
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts-server/dist/index.js"],
      "env": {
        "EKTS_HOME": "/path/to/ekts"
      }
    }
  }
}
```

**Ajout via CLI :**
```bash
# Ajouter un serveur local (stdio)
claude mcp add ekts -- node /path/to/ekts-server/dist/index.js

# Ajouter un serveur distant (HTTP)
claude mcp add ekts --transport http --url https://ekts.example.com/mcp
```

#### Authentification

- **stdio** : Pas d'authentification (processus local)
- **HTTP** : OAuth 2.1 supporté
- **Headers personnalisés** : Supportés via configuration

#### Approbation des outils

- **Mode par défaut** : Demande d'approbation pour chaque appel d'outil
- **Auto-approbation** : Possible via configuration (`.mcp.json`)
- **Scope** : Par outil ou par serveur

**Exemple d'auto-approbation :**
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts-server/dist/index.js"],
      "autoApprove": ["search_resources", "get_resource"]
    }
  }
}
```

#### Avantages

- ✅ Support MCP le plus complet
- ✅ Documentation officielle excellente
- ✅ Intégration native avec Claude (meilleur modèle pour le code)
- ✅ Support des prompts comme slash commands
- ✅ Support de roots (accès fichiers)
- ✅ Support d'elicitation (interaction utilisateur)
- ✅ Support de tasks (opérations longues)

#### Limites

- ❌ Nécessite un abonnement Claude (Pro/Team/Enterprise)
- ❌ Pas de support sampling (limitation du client, pas du protocole)
- ❌ Interface CLI uniquement (pas d'IDE visuel)

#### Cas d'usage pour EKTS

**Recommandé pour :**
- Développement et test du serveur MCP EKTS
- Usage intensif des outils EKTS (recherche, inspection, extraction)
- Automatisation de workflows EKTS via scripts

---

### 4.2 Cursor

**Type :** IDE (AI-first code editor)  
**Éditeur :** Cursor Inc.  
**Modèle IA :** Multi-modèles (Claude, GPT-4, etc.)  
**Licence :** Freemium (gratuit avec limitations, Pro $20/mois)

#### Capacités MCP

| Capacité | Support | Notes |
|----------|---------|-------|
| Tools | ✅ Complet | Découverte et appel d'outils |
| Resources | ✅ Complet | Lecture de ressources |
| Prompts | ✅ Complet | Exposition dans l'interface |
| Sampling | ❌ Non supporté | — |
| Roots | ❌ Non supporté | — |
| Elicitation | ❌ Non supporté | — |
| Tasks | ❌ Non supporté | — |

#### Configuration

**Fichiers de configuration :**
- Projet : `.cursor/mcp.json` (à la racine du projet)
- Utilisateur : `~/.cursor/mcp.json` (configuration globale)

**Format de configuration :**
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts-server/dist/index.js"],
      "env": {
        "EKTS_HOME": "/path/to/ekts"
      }
    }
  }
}
```

**Interface de configuration :**
- Settings → Features → MCP Servers
- Interface graphique pour ajouter/gérer les serveurs

#### Authentification

- **stdio** : Pas d'authentification (processus local)
- **HTTP** : OAuth 2.1 supporté
- **Headers personnalisés** : Supportés via configuration

#### Approbation des outils

- **Mode par défaut** : Demande d'approbation pour chaque appel d'outil
- **Auto-approbation** : Possible via configuration
- **Scope** : Par outil ou par serveur
- **Interface** : Approbation via popup dans l'IDE

#### Avantages

- ✅ IDE complet avec support MCP natif
- ✅ Interface graphique pour la configuration
- ✅ Support multi-modèles (flexibilité)
- ✅ Intégration avec l'éditeur de code
- ✅ Support de tools, resources et prompts
- ✅ Auto-reload des serveurs MCP

#### Limites

- ❌ Pas de support roots (accès fichiers limité)
- ❌ Pas de support elicitation
- ❌ Pas de support tasks
- ❌ Propriétaire (pas open source)

#### Cas d'usage pour EKTS

**Recommandé pour :**
- Développement EKTS dans un IDE
- Usage des outils EKTS pendant le coding
- Intégration EKTS dans le workflow de développement

---

### 4.3 Cline

**Type :** Extension VS Code  
**Éditeur :** Cline (open source)  
**Modèle IA :** BYOK (Bring Your Own Key) — supporte OpenAI, Anthropic, etc.  
**Licence :** Open source (MIT)

#### Capacités MCP

| Capacité | Support | Notes |
|----------|---------|-------|
| Tools | ✅ Complet | Découverte et appel d'outils |
| Resources | ✅ Complet | Lecture de ressources |
| Prompts | ❌ Non supporté | — |
| Sampling | ❌ Non supporté | — |
| Roots | ❌ Non supporté | — |
| Elicitation | ❌ Non supporté | — |
| Tasks | ❌ Non supporté | — |

#### Configuration

**Fichier de configuration :**
- `~/.cline/mcp_config.json` (configuration globale)

**Format de configuration :**
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts-server/dist/index.js"],
      "env": {
        "EKTS_HOME": "/path/to/ekts"
      }
    }
  }
}
```

**Interface de configuration :**
- VS Code → Cline → Settings → MCP Servers
- Interface graphique pour ajouter/gérer les serveurs

#### Authentification

- **stdio** : Pas d'authentification (processus local)
- **HTTP** : OAuth 2.1 non supporté
- **Headers personnalisés** : Non supportés

#### Approbation des outils

- **Mode par défaut** : Demande d'approbation pour chaque appel d'outil
- **Auto-approbation** : Désactivé par défaut (recommandé de laisser ainsi)
- **Scope** : Par outil ou par serveur
- **Interface** : Approbation via popup dans VS Code

#### Avantages

- ✅ Open source (MIT)
- ✅ BYOK (flexibilité des modèles IA)
- ✅ Intégration native avec VS Code
- ✅ Support de tools et resources
- ✅ Interface de configuration graphique
- ✅ Communauté active

#### Limites

- ❌ Pas de support prompts
- ❌ Pas de support OAuth 2.1
- ❌ Pas de support roots, elicitation, tasks
- ❌ Dépend de VS Code

#### Cas d'usage pour EKTS

**Recommandé pour :**
- Usage EKTS dans VS Code
- Utilateurs qui veulent choisir leur modèle IA
- Développement open source

---

### 4.4 Codex CLI

**Type :** CLI (Command-Line Interface)  
**Éditeur :** OpenAI  
**Modèle IA :** GPT-4, o1, o3  
**Licence :** Propriétaire (gratuit avec abonnement ChatGPT Plus/Pro)

#### Capacités MCP

| Capacité | Support | Notes |
|----------|---------|-------|
| Tools | ✅ Complet | Découverte et appel d'outils |
| Resources | ❌ Non supporté | — |
| Prompts | ❌ Non supporté | — |
| Sampling | ❌ Non supporté | — |
| Roots | ❌ Non supporté | — |
| Elicitation | ❌ Non supporté | — |
| Tasks | ❌ Non supporté | — |

#### Configuration

**Fichier de configuration :**
- `~/.codex/config.toml` (configuration globale)
- `.codex/config.toml` (configuration projet)

**Format de configuration (TOML) :**
```toml
[mcp_servers.ekts]
command = "node"
args = ["/path/to/ekts-server/dist/index.js"]
env = { EKTS_HOME = "/path/to/ekts" }
```

**Ajout via CLI :**
```bash
# Ajouter un serveur local (stdio)
codex mcp add ekts -- node /path/to/ekts-server/dist/index.js

# Ajouter un serveur distant (HTTP)
codex mcp add ekts --url https://ekts.example.com/mcp
```

#### Authentification

- **stdio** : Pas d'authentification (processus local)
- **HTTP** : OAuth 2.1 supporté
- **Headers personnalisés** : Supportés via configuration

#### Approbation des outils

- **Mode par défaut** : Demande d'approbation pour chaque appel d'outil
- **Auto-approbation** : Possible via configuration
- **Scope** : Par outil ou par serveur
- **Timeout** : 60 secondes par défaut

#### Avantages

- ✅ Support officiel d'OpenAI
- ✅ Intégration avec les modèles GPT-4/o1/o3
- ✅ Configuration simple (TOML)
- ✅ Support de tools
- ✅ Auto-reload des serveurs MCP

#### Limites

- ❌ Support minimal (tools uniquement)
- ❌ Pas de support resources, prompts, roots, elicitation, tasks
- ❌ HTTP peut avoir des bugs (stdio recommandé)
- ❌ Nécessite un abonnement ChatGPT Plus/Pro
- ❌ Format TOML (moins courant que JSON)

#### Cas d'usage pour EKTS

**Recommandé pour :**
- Usage EKTS avec les modèles OpenAI
- Utilateurs de l'écosystème OpenAI
- Tests de compatibilité avec OpenAI

---

### 4.5 Claude Desktop

**Type :** Application Desktop  
**Éditeur :** Anthropic  
**Modèle IA :** Claude (Sonnet, Opus, Haiku)  
**Licence :** Propriétaire (gratuit avec abonnement Claude Pro/Team/Enterprise)

#### Capacités MCP

| Capacité | Support | Notes |
|----------|---------|-------|
| Tools | ✅ Complet | Découverte et appel d'outils |
| Resources | ✅ Complet | Lecture de ressources |
| Prompts | ✅ Complet | Exposition comme slash commands |
| Sampling | ✅ Complet | Génération de contenu par le modèle |
| Roots | ✅ Complet | Accès au système de fichiers |
| Elicitation | ✅ Complet | Demandes d'information à l'utilisateur |
| Tasks | ❌ Non supporté | — |

#### Configuration

**Fichier de configuration :**
- `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- `%APPDATA%/Claude/claude_desktop_config.json` (Windows)
- `~/.config/Claude/claude_desktop_config.json` (Linux)

**Format de configuration :**
```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts-server/dist/index.js"],
      "env": {
        "EKTS_HOME": "/path/to/ekts"
      }
    }
  }
}
```

**Interface de configuration :**
- Settings → Connectors
- Interface graphique pour ajouter/gérer les serveurs

#### Authentification

- **stdio** : Pas d'authentification (processus local)
- **HTTP** : OAuth 2.1 supporté (via Connectors)
- **Headers personnalisés** : Supportés via configuration

#### Approbation des outils

- **Mode par défaut** : Demande d'approbation pour chaque appel d'outil
- **Auto-approbation** : Non configurable (toujours demander)
- **Scope** : Par outil
- **Interface** : Approbation via popup dans l'application

#### Avantages

- ✅ Support MCP le plus complet (avec Claude Code)
- ✅ Interface graphique conviviale
- ✅ Support de sampling (génération de contenu)
- ✅ Support de roots (accès fichiers)
- ✅ Support d'elicitation (interaction utilisateur)
- ✅ 75+ connecteurs officiels disponibles

#### Limites

- ❌ Nécessite un abonnement Claude (Pro/Team/Enterprise)
- ❌ Pas de support tasks
- ❌ Interface desktop uniquement (pas d'IDE)
- ❌ Nécessite un redémarrage complet (pas juste fermer la fenêtre)

#### Cas d'usage pour EKTS

**Recommandé pour :**
- Usage EKTS dans un contexte non-développement
- Exploration et découverte des ressources EKTS
- Usage avec les connecteurs officiels (Figma, GitHub, etc.)

---

## 5. Tableau comparatif synthétique

| Critère | Claude Code | Cursor | Cline | Codex CLI | Claude Desktop |
|---------|-------------|--------|-------|-----------|----------------|
| **Type** | CLI | IDE | Extension VS Code | CLI | Desktop App |
| **Licence** | Propriétaire | Freemium | Open Source | Propriétaire | Propriétaire |
| **Modèle IA** | Claude | Multi | BYOK | GPT-4/o1/o3 | Claude |
| **Tools** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Resources** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Prompts** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Sampling** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Roots** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Elicitation** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Tasks** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **stdio** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **HTTP** | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **OAuth 2.1** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Auto-reload** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Config format** | JSON | JSON | JSON | TOML | JSON |
| **Abonnement requis** | Claude Pro+ | Optionnel | Non | ChatGPT Plus+ | Claude Pro+ |
| **Prix** | $20+/mois | Gratuit/$20/mois | Gratuit | $20+/mois | $20+/mois |

---

## 6. Recommandations pour EKTS

### 6.1 Clients cibles prioritaires

**Tier 1 — Support complet :**
1. **Claude Code** — Support le plus complet, idéal pour le développement
2. **Cursor** — IDE populaire, support tools/resources/prompts
3. **Cline** — Open source, flexible, support tools/resources

**Tier 2 — Support partiel :**
4. **Claude Desktop** — Support complet mais desktop uniquement
5. **Codex CLI** — Support minimal (tools uniquement)

**Tier 3 — Support expérimental :**
6. **Windsurf** — Support minimal, à évaluer
7. **VS Code + Copilot** — Support via extensions, à évaluer

### 6.2 Stratégie de compatibilité

**Pour le MVP-1 :**
- Cible : **Claude Code, Cursor, Cline**
- Capacités requises : **Tools, Resources**
- Transport : **stdio** (le plus simple et fiable)
- Authentification : **Aucune** (processus local)

**Pour le MVP-2+ :**
- Ajout de **Claude Desktop** pour l'usage non-développement
- Ajout de **Prompts** pour standardiser les interactions
- Évaluation de **HTTP** pour les serveurs distants

### 6.3 Outils EKTS et compatibilité clients

**Outils compatibles avec tous les clients Tier 1 :**
- ✅ `search_resources` — Tool simple, compatible avec tous
- ✅ `get_resource` — Tool simple, compatible avec tous
- ✅ `list_resources` — Tool simple, compatible avec tous

**Outils avec limitations :**
- ⚠️ `inspect_website` — Peut nécessiter des confirmations (action longue)
- ⚠️ `capture_screenshot` — Retourne une resource (pas supporté par Codex CLI)

**Outils à éviter pour le MVP :**
- ❌ Outils nécessitant **elicitation** (pas supporté par Cursor, Cline, Codex)
- ❌ Outils nécessitant **tasks** (pas supporté par Claude Desktop)

### 6.4 Configuration recommandée

**Pour le développement EKTS :**
```json
// .mcp.json (Claude Code ou Cursor)
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "EKTS_HOME": ".",
        "NODE_ENV": "development"
      },
      "autoApprove": ["search_resources", "get_resource", "list_resources"]
    }
  }
}
```

**Pour l'usage dans VS Code :**
```json
// ~/.cline/mcp_config.json (Cline)
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/path/to/ekts/dist/index.js"],
      "env": {
        "EKTS_HOME": "/path/to/ekts"
      }
    }
  }
}
```

---

## 7. Limites et risques

### 7.1 Limites techniques

1. **Fragmentation des capacités** : chaque client supporte un sous-ensemble different de capacités MCP
2. **Évolution rapide** : les clients évoluent rapidement, la compatibilité peut changer
3. **Documentation incomplète** : certains clients ont une documentation limitée
4. **Bugs potentiels** : les clients peuvent avoir des bugs (ex: Codex CLI HTTP)

### 7.2 Risques de compatibilité

1. **Breaking changes** : les mises à jour des clients peuvent casser la compatibilité
2. **Features expérimentales** : certaines fonctionnalités peuvent être retirées
3. **Dépendance aux clients** : EKTS dépend des clients pour l'exposition des outils

### 7.3 Mitigation

1. **Tester régulièrement** : vérifier la compatibilité après chaque mise à jour
2. **Supporter les capacités communes** : se concentrer sur tools et resources (supportés par tous)
3. **Documentation claire** : documenter les limites par client
4. **Fallback CLI/API** : fournir des alternatives CLI/API pour les outils MCP

---

## 8. Décisions prises / à prendre

### Décisions prises

1. ✅ **Cibles prioritaires** : Claude Code, Cursor, Cline (Tier 1)
2. ✅ **Capacités MVP** : Tools et Resources (compatibles avec tous)
3. ✅ **Transport MVP** : stdio (simple, fiable, sécurisé)
4. ✅ **Pas d'authentification MVP** : processus local uniquement

### Décisions à prendre

1. ❓ **Faut-il supporter Claude Desktop dès le MVP-1 ?** → À évaluer selon les cas d'usage
2. ❓ **Faut-il supporter HTTP dès le MVP-1 ?** → Non, reporter au MVP-2+
3. ❓ **Faut-il supporter Prompts dès le MVP-1 ?** → À évaluer selon les besoins

---

## 9. Questions non résolues

1. **Performance** : quelle est la latence ajoutée par chaque client ?
2. **Stabilité** : quels clients sont les plus stables en production ?
3. **Évolution** : quelles nouvelles capacités seront supportées dans les prochaines versions ?
4. **Tests** : comment automatiser les tests de compatibilité avec tous les clients ?

---

## 10. Sources et date de consultation

| Source | URL | Date |
|--------|-----|------|
| MCP Clients - Official Docs | https://modelcontextprotocol.io/docs/clients | 21 oct. 2026 |
| Claude Code MCP Docs | https://docs.anthropic.com/en/docs/claude-code/mcp | 21 oct. 2026 |
| Cursor MCP Docs | https://docs.cursor.com/context/model-context-protocol | 21 oct. 2026 |
| Cline Documentation | https://github.com/cline/cline | 21 oct. 2026 |
| Codex CLI MCP Docs | https://developers.openai.com/codex/mcp | 21 oct. 2026 |
| Claude Desktop Quickstart | https://modelcontextprotocol.io/quickstart/user | 21 oct. 2026 |

---

## 11. Relations avec les autres fichiers

- **→ Phase 00** : `00_AUDIT_CADRAGE.md` — contexte et objectifs EKTS
- **→ Phase 02** : `02_MCP_ET_AGENTS.md` — guide complet MCP
- **→ Phase 03** : `03_CONCEPTION_OUTILS_ET_SERVICES.md` — conception des outils EKTS
- **→ Phase 13** : `13_SPECIFICATION_MVP.md` — implémentation du serveur MCP EKTS

---

## 12. Critères de termination

Cette phase est considérée comme terminée si :

- ✅ Les principaux clients MCP sont identifiés et documentés
- ✅ La matrice de compatibilité est complète (tools, resources, prompts, etc.)
- ✅ Les méthodes de configuration sont documentées pour chaque client
- ✅ Les mécanismes d'authentification et d'approbation sont compris
- ✅ Une stratégie de compatibilité pour EKTS est définie
- ✅ Les clients cibles prioritaires sont identifiés
- ✅ Les limites et risques sont documentés

**Statut : ✅ Tous les critères remplis**

---

*Document créé le 21 octobre 2026 — Phase 02 du projet EKTS*
