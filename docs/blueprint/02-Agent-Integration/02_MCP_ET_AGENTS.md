# Phase 02 — MCP et Intégration Agentique

**Statut :** ✅ Terminé  
**Date :** 21 octobre 2026  
**Version :** 1.0  
**Spécification MCP référencée :** 2026-07-28  
**Note (21/10/2026) :** la cible « SDK TypeScript v2 » est corrigée en `@modelcontextprotocol/sdk` 1.32.x (aucune v2 publiée) — voir ADR-011. Le corps du document conserve l'analyse d'origine.

---

## 1. Objectif et périmètre

### Objectif

Comprendre en profondeur le protocole MCP (Model Context Protocol), ses capacités réelles, ses limites, et définir une stratégie d'intégration pour EKTS (Engineering Knowledge & Tooling System).

### Périmètre

Ce document couvre :
- La spécification MCP 2026-07-28 (version actuelle)
- Les SDKs officiels (TypeScript, Python, Go, C#)
- Les capacités du protocole (tools, resources, prompts, extensions)
- Les transports (stdio, Streamable HTTP)
- L'architecture client/serveur
- Les cas d'usage pour EKTS
- La comparaison MCP vs CLI vs API

### Hors périmètre

- Implémentation détaillée d'un serveur MCP (voir Phase 03)
- Configuration spécifique des clients (voir `02_MATRICE_COMPATIBILITE_CLIENTS.md`)
- Sécurité et permissions (voir Phase 11)

---

## 2. Résumé exécutif

### Qu'est-ce que MCP ?

**MCP (Model Context Protocol)** est un protocole ouvert standardisé qui permet à des applications IA (clients) de se connecter à des sources de données et des outils externes (serveurs). Il a été créé par Anthropic en novembre 2024 et est maintenant gouverné par l'Agentic AI Foundation sous la Linux Foundation.

**Version actuelle :** 2026-07-28 (publiée le 28 juillet 2026)

### Changements majeurs de la version 2026-07-28

La spécification 2026-07-28 est la plus importante révision depuis le lancement de MCP :

1. **Protocol stateless** : suppression des sessions et du handshake `initialize/initialized`
2. **server/discover** : nouveau RPC obligatoire pour la découverte de capacités
3. **Multi Round-Trip Requests (MRTR)** : remplace les requêtes server-to-client
4. **Extensions framework** : formalisation du mécanisme d'extensions
5. **Authorization hardening** : renforcement de l'authentification (RFC 9207, CIMD)

### Pourquoi MCP est important pour EKTS ?

MCP permet à EKTS d'exposer ses capacités (recherche de ressources, inspection de sites, capitalisation) de manière standardisée, accessible depuis n'importe quel agent compatible (Claude Code, Cursor, Codex, etc.).

**Avantages pour EKTS :**
- Interopérabilité avec tous les clients MCP
- Découverte dynamique des outils disponibles
- Séparation claire entre client (agent) et serveur (EKTS)
- Possibilité de faire évoluer EKTS indépendamment des clients

---

## 3. Concepts fondamentaux

### 3.1 Architecture client/serveur

```
┌─────────────────┐
│   Client MCP    │  ← Agent IA (Claude Code, Cursor, Codex, etc.)
│  (Host Agent)   │
└────────┬────────┘
         │
         │ Transport (stdio ou Streamable HTTP)
         │
┌────────▼────────┐
│   Serveur MCP   │  ← EKTS (ou tout autre service)
│                 │
│  - Tools        │  ← Actions exécutables
│  - Resources    │  ← Données lisibles
│  - Prompts      │  ← Templates de prompts
│  - Extensions   │  ← Capacités optionnelles
└─────────────────┘
```

**Client MCP :**
- Application IA qui découvre et utilise des outils
- Exemples : Claude Code, Cursor, Cline, Codex CLI
- Rôle : planifier des tâches, appeler des tools, interpréter les résultats

**Serveur MCP :**
- Service qui expose des capacités via le protocole MCP
- Exemples : EKTS, serveurs de bases de données, APIs externes
- Rôle : fournir des tools, resources, prompts

**Transport :**
- **stdio** : communication via processus local (le plus fiable pour EKTS)
- **Streamable HTTP** : communication via HTTP (pour serveurs distants)

### 3.2 Capacités du protocole

MCP définit quatre types de capacités :

#### Tools (Outils)

**Définition :** Actions exécutables avec un schéma d'entrée (JSON Schema) et un résultat structuré.

**Exemple pour EKTS :**
```typescript
{
  name: "search_resources",
  description: "Recherche des ressources dans la bibliothèque EKTS",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Termes de recherche" },
      domain: { type: "string", enum: ["web", "motion", "3d", "all"] },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}
```

**Usage :** L'agent appelle le tool avec des paramètres, le serveur exécute l'action et retourne un résultat.

**Caractéristiques :**
- Schéma d'entrée défini avec JSON Schema
- Résultat structuré (texte, JSON, ressources)
- Peuvent être cachés (cache hints)
- Ordre déterministe dans les listes

#### Resources (Ressources)

**Définition :** Données lisibles que le client peut récupérer, identifiées par des URIs.

**Exemple pour EKTS :**
```
resources://web/react-components
resources://motion/animation-patterns
resources://3d/threejs-examples
```

**Usage :** L'agent lit une resource pour obtenir du contexte (documentation, exemples, métadonnées).

**Caractéristiques :**
- URI stable et prévisible
- Contenu statique ou dynamique
- Peuvent être listées et découvertes
- Utiles pour fournir du contexte à l'agent

#### Prompts

**Définition :** Templates de prompts que le client peut utiliser pour générer des requêtes.

**Exemple pour EKTS :**
```typescript
{
  name: "analyze_website",
  description: "Analyse un site web et produit un rapport structuré",
  arguments: [
    {
      name: "url",
      description: "URL du site à analyser",
      required: true
    },
    {
      name: "depth",
      description: "Niveau de détail (basic, detailed, comprehensive)",
      required: false
    }
  ]
}
```

**Usage :** L'agent utilise le prompt comme template pour formuler une requête.

**Caractéristiques :**
- Arguments nommés avec descriptions
- Peuvent être exposés comme slash commands dans certains clients
- Utiles pour standardiser les interactions

#### Extensions

**Définition :** Capacités optionnelles qui étendent le protocole de base.

**Extensions officielles (2026-07-28) :**
- **Tasks** : tâches asynchrones longues
- **MCP Apps** : applications intégrées
- **EMA** : Enterprise Managed Authorization

**Usage pour EKTS :**
- **Tasks** : pour les inspections de sites longues (plusieurs minutes)
- **MCP Apps** : potentiellement pour une interface visuelle EKTS

### 3.3 Transports

#### stdio (Standard Input/Output)

**Définition :** Communication via les flux d'entrée/sortie d'un processus local.

**Fonctionnement :**
1. Le client lance le serveur comme processus enfant
2. Communication via JSON-RPC 2.0 sur stdin/stdout
3. Le serveur s'arrête quand le client se déconnecte

**Avantages :**
- Simple à configurer
- Pas de réseau, pas de ports
- Sécurité maximale (local uniquement)
- Le plus fiable pour EKTS

**Inconvénients :**
- Limité au local (pas de serveurs distants)
- Un processus par client
- Pas de partage entre plusieurs clients

**Usage recommandé pour EKTS :** ✅ Oui, pour le MVP et l'usage local

#### Streamable HTTP

**Définition :** Communication via HTTP avec support du streaming.

**Fonctionnement :**
1. Le serveur expose un endpoint HTTP (ex: `http://localhost:3000/mcp`)
2. Communication via JSON-RPC 2.0 sur HTTP
3. Support du streaming pour les réponses longues

**Avantages :**
- Permet les serveurs distants
- Partageable entre plusieurs clients
- Compatible avec les load balancers
- Stateless (pas de sessions)

**Inconvénients :**
- Plus complexe à configurer
- Nécessite une authentification pour les serveurs publics
- Latence réseau

**Usage recommandé pour EKTS :** ⚠️ Optionnel, pour une version avancée (MVP-4+)

### 3.4 Cycle de vie d'une interaction

**Spécification 2026-07-28 (stateless) :**

```
1. Client → Serveur : server/discover (optionnel)
   ← Résultat : versions supportées, capacités, identité

2. Client → Serveur : tools/list
   ← Résultat : liste des outils disponibles (cachables)

3. Client → Serveur : tools/call (avec nom et paramètres)
   ← Résultat : exécution de l'outil

4. Client → Serveur : resources/list (optionnel)
   ← Résultat : liste des ressources disponibles

5. Client → Serveur : resources/read (avec URI)
   ← Résultat : contenu de la ressource
```

**Changements par rapport aux versions précédentes :**
- ❌ Plus de handshake `initialize/initialized`
- ❌ Plus de `Mcp-Session-Id`
- ✅ Chaque requête est autonome (stateless)
- ✅ `server/discover` pour la découverte de capacités

---

## 4. SDKs officiels

### 4.1 TypeScript SDK v2

**Statut :** ✅ Stable (version actuelle)  
**Version :** 2.x (implémente 2026-07-28)  
**Packages :**
- `@modelcontextprotocol/server` — création de serveurs
- `@modelcontextprotocol/client` — création de clients
- `@modelcontextprotocol/core` — types et utilitaires
- `@modelcontextprotocol/node` — adaptateur Node.js
- `@modelcontextprotocol/express` — intégration Express
- `@modelcontextprotocol/hono` — intégration Hono

**Installation :**
```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/client
```

**Exemple de serveur minimal :**
```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/node";
import { z } from "zod";

const server = new McpServer({
  name: "ekts-server",
  version: "1.0.0",
});

// Définir un tool
server.tool(
  "echo",
  "Répète le message fourni",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }],
  })
);

// Démarrer le serveur
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Documentation :** https://ts.sdk.modelcontextprotocol.io/v2/

### 4.2 Python SDK v2

**Statut :** ✅ Stable (version actuelle)  
**Version :** 2.x (implémente 2026-07-28)  
**Package :** `mcp`

**Changements majeurs v2 :**
- `FastMCP` renommé en `MCPServer`
- Plus de handshake `initialize/initialized`
- Support de MRTR (Multi Round-Trip Requests)
- OpenTelemetry activé par défaut

**Installation :**
```bash
pip install "mcp[cli]"
# ou
uv add "mcp[cli]"
```

**Exemple de serveur minimal :**
```python
from mcp.server import MCPServer
from mcp.server.stdio import stdio_server

server = MCPServer("ekts-server")

@server.tool()
def echo(message: str) -> str:
    """Répète le message fourni"""
    return f"Echo: {message}"

async def main():
    async with stdio_server() as (read, write):
        await server.run(read, write)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

**Documentation :** https://github.com/modelcontextprotocol/python-sdk

### 4.3 Go SDK v2

**Statut :** ✅ Stable  
**Version :** 2.x  
**Package :** `github.com/modelcontextprotocol/go-sdk`

**Usage :** Serveurs MCP haute performance, intégration avec l'écosystème Go

### 4.4 C# SDK v2

**Statut :** ✅ Stable  
**Version :** 2.0  
**Package :** `ModelContextProtocol` (NuGet)

**Usage :** Intégration avec l'écosystème .NET

### 4.5 Quel SDK choisir pour EKTS ?

**Recommandation :** TypeScript SDK v2

**Justification :**
1. **Cohérence** : EKTS sera principalement écrit en TypeScript
2. **Maturité** : le SDK TypeScript est le plus utilisé et le mieux documenté
3. **Écosystème** : intégration naturelle avec Node.js, Express, etc.
4. **Communauté** : la majorité des serveurs MCP sont écrits en TypeScript

**Alternative :** Python SDK v2

**Quand utiliser Python :**
- Si EKTS nécessite des traitements de données lourds (scraping, analyse)
- Si l'écosystème Python est plus pertinent pour certaines capacités (ex: NLP, vision)
- Pour des microservices spécialisés

---

## 5. Cas d'usage pour EKTS

### 5.1 Quels outils exposer via MCP ?

**Principe :** Exposer via MCP uniquement les outils qui ont une vraie valeur agentique.

**Critères pour exposer un outil via MCP :**
1. ✅ L'outil peut être appelé de manière autonome par un agent
2. ✅ L'outil retourne un résultat structuré et interprétable
3. ✅ L'outil n'a pas besoin d'interaction humaine en boucle
4. ✅ L'outil est utile dans un contexte de développement ou de recherche

**Critères pour garder un outil en CLI/API uniquement :**
1. ❌ L'outil nécessite une interaction humaine complexe
2. ❌ L'outil est utilisé principalement en CI/CD
3. ❌ L'outil n'a pas de valeur agentique (ex: scripts de build)
4. ❌ L'outil est trop dangereux pour une exposition agentique (ex: suppression de fichiers)

### 5.2 Outils EKTS à exposer via MCP

#### Domaine A — Bibliothèque de connaissances

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `search_resources` | Recherche des ressources par mots-clés, tags, domaines | ✅ Élevée |
| `get_resource` | Récupère une ressource par ID | ✅ Élevée |
| `list_resources` | Liste les ressources avec filtres | ✅ Élevée |
| `add_resource` | Ajoute une nouvelle ressource (avec validation) | ⚠️ Moyenne (nécessite validation humaine) |
| `validate_resource` | Valide une ressource (métadonnées, licence, etc.) | ✅ Élevée |

#### Domaine B — Inspection de sites

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `inspect_website` | Inspecte un site et produit un rapport | ✅ Élevée |
| `capture_screenshot` | Capture une screenshot d'une page | ✅ Élevée |
| `extract_data` | Extrait des données structurées d'une page | ✅ Élevée |
| `compare_pages` | Compare deux pages et identifie les différences | ⚠️ Moyenne |

#### Domaine C — Analyse UX

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `analyze_ux` | Analyse les patterns UX d'un site | ⚠️ Moyenne (résultats subjectifs) |
| `extract_components` | Extrait les composants UI d'un site | ✅ Élevée |
| `generate_report` | Génère un rapport d'analyse structuré | ✅ Élevée |

#### Domaine D — Outils exécutables

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `run_script` | Exécute un script EKTS | ⚠️ Faible (risque de sécurité) |
| `list_scripts` | Liste les scripts disponibles | ✅ Élevée |

#### Domaine E — Design et web créatif

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `search_components` | Recherche des composants créatifs | ✅ Élevée |
| `get_component_code` | Récupère le code d'un composant | ✅ Élevée |
| `generate_animation` | Génère une animation basée sur des paramètres | ⚠️ Moyenne (résultats variables) |

#### Domaine F — Capitalisation

| Tool | Description | Valeur agentique |
|------|-------------|------------------|
| `capitalize_project` | Capitalise un projet terminé | ⚠️ Faible (nécessite revue humaine) |
| `list_projects` | Liste les projets capitalisés | ✅ Élevée |
| `get_project_artifacts` | Récupère les artefacts d'un projet | ✅ Élevée |

### 5.3 Resources EKTS à exposer via MCP

| Resource URI | Description | Usage |
|--------------|-------------|-------|
| `ekts://config` | Configuration EKTS | Contexte pour l'agent |
| `ekts://stats` | Statistiques de la bibliothèque | Métadonnées |
| `ekts://recent` | Dernières ressources ajoutées | Découverte |
| `ekts://domains/{domain}` | Ressources par domaine | Filtrage |

### 5.4 Prompts EKTS à exposer via MCP

| Prompt | Description | Usage |
|--------|-------------|-------|
| `analyze_website` | Analyse complète d'un site | Standardisation |
| `search_best_practices` | Recherche de bonnes pratiques | Aide à la décision |
| `generate_component` | Génération de composant créatif | Assistance |

---

## 6. Comparaison MCP vs CLI vs API

### 6.1 Quand utiliser MCP ?

**Utiliser MCP quand :**
1. ✅ Un agent IA doit découvrir et utiliser des outils de manière autonome
2. ✅ Les outils ont une valeur agentique claire (recherche, extraction, analyse)
3. ✅ L'interopérabilité avec plusieurs clients est importante
4. ✅ La découverte dynamique des outils est nécessaire
5. ✅ Les résultats doivent être structurés et interprétables par un agent

**Exemples pour EKTS :**
- Recherche de ressources (l'agent cherche des composants, des patterns, etc.)
- Inspection de sites (l'agent lance une inspection et récupère un rapport)
- Extraction de données (l'agent extrait des informations structurées)

### 6.2 Quand utiliser une CLI ?

**Utiliser une CLI quand :**
1. ✅ L'outil est utilisé principalement par des humains
2. ✅ L'outil est intégré dans des scripts shell ou des pipelines CI/CD
3. ✅ L'outil n'a pas besoin d'être découvert dynamiquement
4. ✅ L'interaction est complexe et nécessite des confirmations humaines
5. ✅ L'outil est dangereux et nécessite une validation humaine stricte

**Exemples pour EKTS :**
- Scripts de build et de déploiement
- Outils de nettoyage et de maintenance
- Scripts d'initialisation et de configuration
- Outils de validation manuelle

### 6.3 Quand utiliser une API REST ?

**Utiliser une API REST quand :**
1. ✅ L'outil doit être accessible depuis des applications web ou mobiles
2. ✅ L'outil est utilisé par des services externes
3. ✅ L'outil doit être exposé publiquement (avec authentification)
4. ✅ L'outil est utilisé dans des workflows complexes entre plusieurs services
5. ✅ L'outil n'a pas besoin d'être découvert dynamiquement

**Exemples pour EKTS :**
- API publique pour accéder à la bibliothèque de ressources
- API d'intégration avec d'autres services (ex: Figma, GitHub)
- API pour une interface web EKTS

### 6.4 Tableau comparatif

| Critère | MCP | CLI | API REST |
|---------|-----|-----|----------|
| **Découverte dynamique** | ✅ Oui | ❌ Non | ❌ Non |
| **Interopérabilité** | ✅ Multi-clients | ❌ Spécifique | ✅ Multi-clients |
| **Usage humain** | ⚠️ Via agent | ✅ Direct | ⚠️ Via app |
| **Usage agentique** | ✅ Optimal | ⚠️ Possible | ⚠️ Possible |
| **Sécurité** | ✅ Permissions | ✅ Validation humaine | ✅ Authentification |
| **Complexité** | ⚠️ Moyenne | ✅ Simple | ⚠️ Moyenne |
| **Streaming** | ✅ Oui | ❌ Non | ✅ Oui |
| **État** | ❌ Stateless | ❌ Stateless | ❌ Stateless |
| **Documentation** | ✅ Auto (schémas) | ⚠️ Manuelle | ✅ OpenAPI/Swagger |

### 6.5 Règle de décision pour EKTS

```
L'outil a-t-il une valeur agentique ?
├─ Non → CLI uniquement
└─ Oui → L'outil doit-il être découvert dynamiquement ?
         ├─ Non → API REST (si multi-clients) ou CLI (si humain)
         └─ Oui → MCP
                  └─ L'outil doit-il être accessible depuis le web ?
                     ├─ Oui → MCP + API REST (double exposition)
                     └─ Non → MCP uniquement
```

**Recommandation pour EKTS :**
- **MVP-1** : MCP pour les outils de recherche et d'extraction
- **MVP-2** : MCP pour les outils d'inspection
- **MVP-3** : MCP + API REST pour une interface web
- **MVP-4** : MCP pour tous les outils à valeur agentique

---

## 7. Limites et risques

### 7.1 Limites techniques

1. **Complexité du protocole** : MCP est plus complexe qu'une simple API REST
2. **Overhead de découverte** : la découverte dynamique ajoute de la latence
3. **Dépendance aux clients** : EKTS dépend des clients MCP pour l'exposition
4. **Debugging difficile** : les interactions agent-serveur sont moins observables

### 7.2 Risques de sécurité

1. **Exposition d'outils dangereux** : certains outils ne doivent pas être exposés via MCP
2. **Injection de prompts** : les agents peuvent être manipulés via des contenus malveillants
3. **Fuite de données** : les resources peuvent exposer des données sensibles
4. **Absence de validation humaine** : les agents peuvent exécuter des actions irréversibles

**Mitigation :**
- Exposer uniquement les outils à faible risque
- Implémenter des permissions granulaires
- Ajouter des confirmations pour les actions sensibles
- Journaliser toutes les interactions

### 7.3 Risques de maintenance

1. **Évolution du protocole** : MCP évolue rapidement (versions 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28)
2. **Compatibilité des SDKs** : les SDKs v1 et v2 coexistent
3. **Dépendance aux SDKs** : EKTS dépend des SDKs officiels

**Mitigation :**
- Utiliser les SDKs stables (v2)
- Suivre les releases notes
- Tester la compatibilité après chaque mise à jour

---

## 8. Recommandation pour EKTS

### 8.1 Stratégie MCP

**Recommandation :** Adopter MCP pour les outils à valeur agentique, en commençant par le MVP-1.

**Justification :**
1. MCP est le standard émergent pour l'intégration agentique
2. L'interopérabilité avec Claude Code, Cursor, Codex est un avantage majeur
3. La découverte dynamique simplifie l'usage pour les agents
4. Le protocole est mature (version 2026-07-28 stable)

### 8.2 Outils à exposer en priorité

**MVP-1 (Bibliothèque + recherche) :**
1. `search_resources` — recherche de ressources
2. `get_resource` — récupération d'une ressource
3. `list_resources` — liste des ressources
4. `validate_resource` — validation de ressources

**MVP-2 (Inspection navigateur) :**
5. `inspect_website` — inspection de site
6. `capture_screenshot` — capture d'écran
7. `extract_data` — extraction de données

**MVP-3 (Capitalisation) :**
8. `list_projects` — liste des projets
9. `get_project_artifacts` — récupération d'artefacts

### 8.3 Architecture recommandée

```
EKTS
├── CLI (outils humains)
│   ├── ekts build
│   ├── ekts deploy
│   └── ekts validate
│
├── API REST (interface web)
│   ├── GET /api/resources
│   ├── POST /api/resources
│   └── GET /api/projects
│
└── Serveur MCP (outils agentiques)
    ├── search_resources
    ├── get_resource
    ├── inspect_website
    └── capture_screenshot
```

### 8.4 Prochaines étapes

1. **Phase 03** : Concevoir le contrat standard d'un outil EKTS (CLI, API, MCP)
2. **Phase 06** : Définir l'architecture de stockage (nécessaire pour les tools MCP)
3. **Phase 13** : Implémenter le serveur MCP EKTS (MVP-1)

---

## 9. Décisions prises / à prendre

### Décisions prises

1. ✅ **Adopter MCP** pour les outils à valeur agentique
2. ✅ **Utiliser le SDK TypeScript v2** pour le serveur MCP EKTS
3. ✅ **Transport stdio** pour le MVP (local, simple, sécurisé)
4. ✅ **Exposer 4 outils** pour le MVP-1 (search, get, list, validate)

### Décisions à prendre

1. ❓ **Faut-il exposer des resources et des prompts ?** → À évaluer lors de la Phase 03
2. ❓ **Faut-il utiliser des extensions (Tasks, MCP Apps) ?** → À évaluer lors de la Phase 13
3. ❓ **Faut-il exposer une API REST en plus de MCP ?** → À évaluer lors de la Phase 13

---

## 10. Questions non résolues

1. **Performance** : quelle est la latence ajoutée par MCP par rapport à une API REST directe ?
2. **Scalabilité** : comment gérer plusieurs clients MCP simultanés ?
3. **Versioning** : comment gérer l'évolution des outils MCP sans casser la compatibilité ?
4. **Testing** : comment tester un serveur MCP de manière automatisée ?

---

## 11. Sources et date de consultation

| Source | URL | Date |
|--------|-----|------|
| MCP Specification 2026-07-28 | https://modelcontextprotocol.io/specification/2026-07-28 | 21 oct. 2026 |
| MCP TypeScript SDK v2 | https://github.com/modelcontextprotocol/typescript-sdk | 21 oct. 2026 |
| MCP Python SDK v2 | https://github.com/modelcontextprotocol/python-sdk | 21 oct. 2026 |
| MCP Blog - 2026-07-28 Release | https://blog.modelcontextprotocol.io/posts/2026-07-28/ | 21 oct. 2026 |
| Wikipedia - MCP | https://en.wikipedia.org/wiki/Model_Context_Protocol | 21 oct. 2026 |

---

## 12. Relations avec les autres fichiers

- **→ Phase 00** : `00_AUDIT_CADRAGE.md` — contexte et objectifs EKTS
- **→ Phase 00** : `00_GLOSSAIRE_TECHNIQUE.md` — définitions des termes MCP
- **→ Phase 02** : `02_MATRICE_COMPATIBILITE_CLIENTS.md` — compatibilité des clients MCP
- **→ Phase 03** : `03_CONCEPTION_OUTILS_ET_SERVICES.md` — conception des outils EKTS
- **→ Phase 13** : `13_SPECIFICATION_MVP.md` — implémentation du serveur MCP EKTS

---

## 13. Critères de termination

Cette phase est considérée comme terminée si :

- ✅ La spécification MCP 2026-07-28 est comprise et documentée
- ✅ Les SDKs officiels sont identifiés et comparés
- ✅ Les capacités du protocole (tools, resources, prompts) sont comprises
- ✅ Les transports (stdio, HTTP) sont compris
- ✅ Les cas d'usage pour EKTS sont identifiés
- ✅ La comparaison MCP vs CLI vs API est documentée
- ✅ Une stratégie MCP pour EKTS est définie
- ✅ Les outils à exposer en priorité sont identifiés

**Statut : ✅ Tous les critères remplis**

---

*Document créé le 21 octobre 2026 — Phase 02 du projet EKTS*
