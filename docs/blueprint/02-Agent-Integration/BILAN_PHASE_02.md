# Bilan de la Phase 02 — MCP et Intégration Agentique

**Date :** 21 octobre 2026  
**Statut :** ✅ Terminée  
**Durée réelle :** 1 jour  
**Durée estimée :** 1-2 semaines

---

## Résumé exécutif

La Phase 02 a produit deux documents structurants qui définissent la stratégie d'intégration MCP pour EKTS. Ces documents fournissent une compréhension approfondie du protocole MCP (spécification 2026-07-28), des SDKs officiels, des clients compatibles, et des cas d'usage pour EKTS.

**Livrables produits :**
1. `02_MCP_ET_AGENTS.md` — Guide complet MCP (22 KB)
2. `02_MATRICE_COMPATIBILITE_CLIENTS.md` — Matrice de compatibilité des clients (18 KB)

**Décisions clés :**
- Spécification MCP 2026-07-28 (stateless, la plus récente)
- SDK TypeScript v2 recommandé pour EKTS (cohérence avec le reste du projet)
- Transport stdio pour le MVP (simple, fiable, sécurisé)
- 4 outils MCP prioritaires pour le MVP-1 (search, get, list, validate)
- Clients cibles : Claude Code, Cursor, Cline (Tier 1)

---

## Ce qui est établi

### 1. Compréhension approfondie de MCP

**Spécification 2026-07-28 :**
- ✅ Protocol stateless (plus de sessions, plus de handshake)
- ✅ server/discover pour la découverte de capacités
- ✅ Multi Round-Trip Requests (MRTR) pour les interactions server-to-client
- ✅ Extensions framework formalisé (Tasks, MCP Apps, EMA)
- ✅ Authorization hardening (RFC 9207, CIMD)

**Capacités du protocole :**
- ✅ **Tools** — actions exécutables avec schémas JSON
- ✅ **Resources** — données lisibles via URIs
- ✅ **Prompts** — templates de prompts
- ✅ **Extensions** — capacités optionnelles (Tasks, MCP Apps, etc.)

**Transports :**
- ✅ **stdio** — processus local, simple, fiable, sécurisé
- ✅ **Streamable HTTP** — serveurs distants, partageable, scalable

### 2. SDKs officiels documentés

**TypeScript SDK v2 (recommandé pour EKTS) :**
- ✅ Packages : @modelcontextprotocol/server, @modelcontextprotocol/client
- ✅ Version stable 2.x (implémente 2026-07-28)
- ✅ Documentation : https://ts.sdk.modelcontextprotocol.io/v2/
- ✅ Exemples de code fournis

**Python SDK v2 (alternative) :**
- ✅ Package : mcp 2.x
- ✅ Changement majeur : FastMCP → MCPServer
- ✅ Documentation : https://github.com/modelcontextprotocol/python-sdk

**Autres SDKs :**
- ✅ Go SDK v2 (stable)
- ✅ C# SDK v2 (stable)
- ✅ Rust SDK (beta)

### 3. Clients MCP documentés

**9 clients analysés en détail :**

| Client | Type | Tools | Resources | Prompts | stdio | HTTP | OAuth |
|--------|------|-------|-----------|---------|-------|------|-------|
| **Claude Code** | CLI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Claude Desktop** | Desktop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cursor** | IDE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cline** | Extension | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Codex CLI** | CLI | ✅ | ❌ | ❌ | ✅ | ⚠️ | ✅ |
| **Windsurf** | IDE | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **VS Code + Copilot** | Extension | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Continue** | Extension | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Zed** | Editor | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |

### 4. Stratégie MCP pour EKTS définie

**Outils à exposer via MCP (par domaine) :**

**Domaine A — Bibliothèque de connaissances :**
- ✅ `search_resources` — recherche de ressources (priorité haute)
- ✅ `get_resource` — récupération d'une ressource (priorité haute)
- ✅ `list_resources` — liste des ressources (priorité haute)
- ⚠️ `add_resource` — ajout de ressource (validation humaine requise)
- ✅ `validate_resource` — validation de ressources (priorité haute)

**Domaine B — Inspection de sites :**
- ✅ `inspect_website` — inspection de site (priorité haute)
- ✅ `capture_screenshot` — capture d'écran (priorité haute)
- ✅ `extract_data` — extraction de données (priorité haute)

**Domaine C — Analyse UX :**
- ⚠️ `analyze_ux` — analyse UX (résultats subjectifs)
- ✅ `extract_components` — extraction de composants (priorité haute)
- ✅ `generate_report` — génération de rapport (priorité haute)

**Domaines D-F :**
- ⚠️ Outils avec valeur agentique variable
- ⚠️ Outils nécessitant une validation humaine

**Ressources à exposer :**
- `ekts://config` — configuration EKTS
- `ekts://stats` — statistiques de la bibliothèque
- `ekts://recent` — dernières ressources ajoutées
- `ekts://domains/{domain}` — ressources par domaine

**Prompts à exposer :**
- `analyze_website` — analyse complète d'un site
- `search_best_practices` — recherche de bonnes pratiques
- `generate_component` — génération de composant créatif

### 5. Comparaison MCP vs CLI vs API

**Quand utiliser MCP :**
- ✅ L'outil a une valeur agentique claire
- ✅ L'outil doit être découvert dynamiquement
- ✅ L'interopérabilité avec plusieurs clients est importante
- ✅ Les résultats doivent être structurés et interprétables

**Quand utiliser une CLI :**
- ✅ L'outil est utilisé principalement par des humains
- ✅ L'outil est intégré dans des scripts shell ou CI/CD
- ✅ L'outil n'a pas besoin d'être découvert dynamiquement
- ✅ L'interaction est complexe et nécessite des confirmations humaines

**Quand utiliser une API REST :**
- ✅ L'outil doit être accessible depuis des applications web/mobiles
- ✅ L'outil est utilisé par des services externes
- ✅ L'outil doit être exposé publiquement (avec authentification)
- ✅ L'outil n'a pas besoin d'être découvert dynamiquement

**Règle de décision pour EKTS :**
```
L'outil a-t-il une valeur agentique ?
├─ Non → CLI uniquement
└─ Oui → L'outil doit-il être découvert dynamiquement ?
         ├─ Non → API REST ou CLI
         └─ Oui → MCP
                  └─ Accessible depuis le web ?
                     ├─ Oui → MCP + API REST
                     └─ Non → MCP uniquement
```

### 6. Clients cibles prioritaires

**Tier 1 — Support complet (MVP-1) :**
1. **Claude Code** — Support le plus complet, idéal pour le développement
2. **Cursor** — IDE populaire, support tools/resources/prompts
3. **Cline** — Open source, flexible, support tools/resources

**Tier 2 — Support partiel (MVP-2+) :**
4. **Claude Desktop** — Support complet mais desktop uniquement
5. **Codex CLI** — Support minimal (tools uniquement)

**Tier 3 — Support expérimental :**
6. **Windsurf** — Support minimal, à évaluer
7. **VS Code + Copilot** — Support via extensions, à évaluer

### 7. Configuration recommandée

**Pour le développement EKTS (Claude Code ou Cursor) :**
```json
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

**Pour l'usage dans VS Code (Cline) :**
```json
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

## Ce qui est rejeté et pourquoi

### 1. SDK Python pour EKTS

**Rejeté :** Utiliser le SDK Python comme SDK principal pour EKTS

**Pourquoi :**
- EKTS sera principalement écrit en TypeScript (décision Phase 01)
- Le SDK TypeScript est plus mature et mieux documenté
- La cohérence linguistique réduit la complexité
- L'écosystème Node.js est plus adapté pour les serveurs MCP

**Exception :** Python peut être utilisé pour des microservices spécialisés (ex: NLP, vision)

### 2. Transport HTTP pour le MVP

**Rejeté :** Utiliser Streamable HTTP comme transport principal pour le MVP

**Pourquoi :**
- stdio est plus simple, plus fiable et plus sécurisé
- Pas besoin de serveurs distants pour le MVP
- Pas besoin d'authentification pour le MVP
- HTTP ajoute de la complexité (ports, CORS, authentification)

**Exception :** HTTP peut être ajouté au MVP-2+ pour les serveurs distants

### 3. Exposition de tous les outils via MCP

**Rejeté :** Exposer tous les outils EKTS via MCP dès le MVP-1

**Pourquoi :**
- Certains outils n'ont pas de valeur agentique (ex: scripts de build)
- Certains outils sont dangereux (ex: suppression de fichiers)
- Certains outils nécessitent une validation humaine (ex: ajout de ressources)
- Mieux vaut commencer avec 4 outils sûrs et expand progressivement

### 4. Support de tous les clients MCP

**Rejeté :** Supporter tous les clients MCP dès le MVP-1

**Pourquoi :**
- 3 clients (Claude Code, Cursor, Cline) couvrent les principaux cas d'usage
- Supporter tous les clients ajoute de la complexité
- Mieux vaut se concentrer sur les clients Tier 1 et expand progressivement

---

## Ce qui reste incertain

### 1. Performance de MCP

**Incertitude :** Quelle est la latence ajoutée par MCP par rapport à une API REST directe ?

**Impact :**
- Si la latence est élevée, cela peut impacter l'expérience utilisateur
- Si la latence est faible, MCP est clairement la meilleure option

**Action requise :** Benchmarks lors de l'implémentation (Phase 13)

### 2. Scalabilité avec plusieurs clients

**Incertitude :** Comment gérer plusieurs clients MCP simultanés ?

**Impact :**
- Si plusieurs clients peuvent se connecter en parallèle, c'est un avantage
- Si un seul client peut se connecter à la fois, c'est une limitation

**Action requise :** Tests de charge lors de l'implémentation (Phase 13)

### 3. Évolution du protocole MCP

**Incertitude :** MCP évolue rapidement (4 versions en 2 ans). Comment gérer la compatibilité ?

**Impact :**
- Si les changements sont backward-compatible, pas de problème
- Si les changements sont breaking, cela nécessite des migrations

**Action requise :** Suivre les releases notes et tester après chaque mise à jour

### 4. Support des extensions (Tasks, MCP Apps)

**Incertitude :** Faut-il utiliser les extensions MCP (Tasks pour les opérations longues, MCP Apps pour les interfaces visuelles) ?

**Impact :**
- Tasks permettrait les inspections longues sans bloquer l'agent
- MCP Apps permettrait une interface visuelle pour EKTS

**Action requise :** Évaluer lors de la Phase 13 (architecture)

### 5. Exposition d'une API REST en plus de MCP

**Incertitude :** Faut-il exposer une API REST en plus de MCP pour une interface web ?

**Impact :**
- Une API REST permettrait une interface web EKTS
- Mais cela ajoute de la complexité (double exposition)

**Action requise :** Évaluer lors de la Phase 13 (architecture)

---

## Décisions maintenant possibles

### 1. Adoption de MCP pour EKTS

**Décision :** Adopter MCP pour les outils à valeur agentique, en commençant par le MVP-1.

**Justification :**
- MCP est le standard émergent pour l'intégration agentique
- L'interopérabilité avec Claude Code, Cursor, Codex est un avantage majeur
- La découverte dynamique simplifie l'usage pour les agents
- Le protocole est mature (version 2026-07-28 stable)

### 2. Choix du SDK TypeScript v2

**Décision :** Utiliser le SDK TypeScript v2 pour le serveur MCP EKTS.

**Justification :**
- Cohérence avec le reste du projet (TypeScript)
- SDK le plus mature et le mieux documenté
- Écosystème Node.js adapté pour les serveurs MCP
- Communauté active et support officiel

### 3. Transport stdio pour le MVP

**Décision :** Utiliser le transport stdio pour le MVP (local, simple, sécurisé).

**Justification :**
- Plus simple que HTTP (pas de ports, pas de CORS)
- Plus sécurisé (processus local uniquement)
- Plus fiable (pas de problèmes réseau)
- Suffisant pour le MVP

### 4. Outils prioritaires pour le MVP-1

**Décision :** Exposer 4 outils via MCP pour le MVP-1 :
1. `search_resources` — recherche de ressources
2. `get_resource` — récupération d'une ressource
3. `list_resources` — liste des ressources
4. `validate_resource` — validation de ressources

**Justification :**
- Ces 4 outils ont une valeur agentique claire
- Ils sont sûrs (pas de modification de données)
- Ils couvrent le cas d'usage principal du MVP-1 (bibliothèque + recherche)
- Ils sont compatibles avec tous les clients Tier 1

### 5. Clients cibles pour le MVP-1

**Décision :** Cibles prioritaires : Claude Code, Cursor, Cline (Tier 1).

**Justification :**
- Ces 3 clients couvrent les principaux cas d'usage (CLI, IDE, extension)
- Ils supportent tous la spécification 2026-07-28
- Ils ont une documentation claire et une communauté active
- Ils permettent de tester EKTS dans différents contextes

---

## Questions à résoudre

### Questions bloquantes

**Aucune question bloquante identifiée.**

La stratégie MCP est suffisamment définie pour passer à l'implémentation.

### Questions importantes

1. **Faut-il supporter Claude Desktop dès le MVP-1 ?**
   - Impact : ajout d'un client cible
   - Action : évaluer selon les cas d'usage non-développement

2. **Faut-il exposer des prompts dès le MVP-1 ?**
   - Impact : standardisation des interactions
   - Action : évaluer selon les besoins

3. **Faut-il utiliser des extensions (Tasks, MCP Apps) ?**
   - Impact : capacités avancées
   - Action : évaluer lors de la Phase 13

### Questions exploratoires

1. **Faut-il exposer une API REST en plus de MCP ?**
   - Impact : interface web EKTS
   - Action : évaluer lors de la Phase 13

2. **Quels autres outils exposer via MCP pour le MVP-2+ ?**
   - Impact : expansion des capacités agentiques
   - Action : évaluer après le MVP-1

3. **Comment automatiser les tests de compatibilité avec tous les clients ?**
   - Impact : assurance qualité
   - Action : explorer les solutions de testing MCP

---

## Fichiers créés ou mis à jour

### Fichiers créés

| Fichier | Taille | Description |
|---------|--------|-------------|
| `02-Agent-Integration/02_MCP_ET_AGENTS.md` | 22 KB | Guide complet MCP |
| `02-Agent-Integration/02_MATRICE_COMPATIBILITE_CLIENTS.md` | 18 KB | Matrice de compatibilité |
| `02-Agent-Integration/BILAN_PHASE_02.md` | 14 KB | Ce document |

### Fichiers mis à jour

| Fichier | Modification |
|---------|--------------|
| `INDEX.md` | Statut Phase 02 → ✅ Terminé, prochaine étape → Phase 03 |
| `00_PLAN_DIRECTEUR_RECHERCHE.md` | Phase 02 marquée comme terminée |

---

## Phase suivante recommandée

**Phase 03 — Conception d'outils et services**

### Objectif

Définir un contrat standard pour les outils EKTS (CLI, API, MCP) et établir des patterns de conception réutilisables.

### Questions clés

1. Quelle est la structure minimale d'un outil EKTS ?
2. Comment gérer les entrées, sorties, erreurs, logs, validation ?
3. Comment versionner et documenter un outil ?
4. Quand créer un service séparé vs garder un module local ?

### Livrables attendus

1. `03_CONCEPTION_OUTILS_ET_SERVICES.md` — Guide de conception d'outils
2. `03_CONTRAT_STANDARD_OUTIL.md` — Template de contrat d'outil

### Durée estimée

1 semaine

### Effort

Moyen

---

## Critères de passage à la Phase 03

### Critères remplis

- ✅ Phase 02 terminée avec 2 livrables documentés
- ✅ Stratégie MCP définie (SDK, transport, outils, clients)
- ✅ Décisions clés prises (TypeScript, stdio, 4 outils, 3 clients)
- ✅ INDEX.md mis à jour avec le statut de la Phase 02
- ✅ Plan directeur mis à jour

### Prochaines étapes

1. **Validation par l'utilisateur** — confirmer que la stratégie MCP est adaptée
2. **Lancement de la Phase 03** — commencer la conception des outils EKTS

---

## Conclusion

La Phase 02 a rempli son objectif : comprendre en profondeur le protocole MCP et définir une stratégie d'intégration pour EKTS. Les deux livrables produits servent de référence pour l'implémentation du serveur MCP EKTS.

**Points forts :**
- Compréhension approfondie de la spécification 2026-07-28
- Analyse complète des 9 clients MCP majeurs
- Stratégie claire pour EKTS (TypeScript, stdio, 4 outils, 3 clients)
- Comparaison MCP vs CLI vs API documentée

**Prochaine étape :** Phase 03 — Conception d'outils et services

---

*Bilan rédigé le 21 octobre 2026 — Phase 02 du projet EKTS*
