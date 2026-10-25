# Guide Utilisateur — Engineering Knowledge Tooling System

> MVP-2 — version 2.0.0 · [TOC](#sommaire)

## Sommaire

1. [Qu'est-ce qu'EKTS ?](#quest-ce-qu-ekts-)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Configuration initiale](#configuration-initiale)
5. [Utilisation CLI — inspect](#utilisation-cli--inspect)
6. [Utilisation CLI — audit](#utilisation-cli--audit)
7. [Base de connaissances (ressources)](#base-de-connaissances-ressources)
8. [Utilisation MCP](#utilisation-mcp)
9. [Scénarios types](#scénarios-types)
10. [Lecture des résultats](#lecture-des-résultats)
11. [Rapports et comparaisons](#rapports-et-comparaisons)
12. [Variables d'environnement](#variables-d-environnement)
13. [FAQ](#faq)
14. [Documentation associée](#documentation-associée)
15. [Support](#support)

---

## Qu'est-ce qu'EKTS ?

EKTS (Engineering Knowledge Tooling System) est un outil local de contrôle qualité web qui permet de :

- **Inspecter** des sites web aux 4 niveaux L1-L3 (performance, accessibilité, SEO, UX, contenu)
- **Analyser** les résultats sur 5 dimensions avec un score global 0-100 et des constats priorisés
- **Stocker** les audits dans SQLite (FTS5 + index vectoriel) et les retrouver par recherche hybride
- **Générer** des rapports professionnels Markdown et PDF, y compris des comparaisons d'évolution
- **Piloter** le tout par CLI (`ekts`) ou par serveur MCP pour agents IA

Tout s'exécute en local : seules vos inspections ciblent le réseau (le site audité).

## Prérequis

- **Node.js ≥ 22.19.0** et **npm ≥ 10.9.0** (cf. `engines` du projet)
- 2 Go de RAM, ~500 Mo d'espace disque
- Un terminal (PowerShell, bash, zsh)
- Navigateurs Playwright **optionnels** pour les tests d'intégration et certains rendus
  (`npm run browsers:install`), Chrome pour Puppeteer **optionnel** pour les rapports PDF
  (`npx puppeteer browsers install chrome`)

## Installation

### 1. Cloner et compiler

```bash
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system
npm ci
npm run build
```

> `.npmrc` définit `ignore-scripts=true` : aucun script de cycle de vie ne tourne
> à l'installation. C'est volontaire (meilleure reproductibilité) ; lancez
> `npm run browsers:install` et `npx puppeteer browsers install chrome` si vous
> voulez les moteurs de rendu.

### 2. Vérifier

```bash
node dist/cli/index.js --version
npm run doctor
```

### 3. Installation globale (optionnel)

```bash
npm install -g .
ekts --version
```

La binérité `ekts` pointe vers `dist/cli/index.js` (déclarée dans `package.json`).

## Configuration initiale

```bash
# Initialiser les bases (répertoire ./data par défaut)
node dist/cli/index.js init

# État des bases, ressources, index
node dist/cli/index.js status

# Contrôle d'environnement complet (moteurs, bases, clés)
npm run check:env
```

Le répertoire de données se définit par la variable `EKTS_DATA_DIR`
(défaut : `data/` relatif au répertoire courant).

## Utilisation CLI — inspect

```bash
node dist/cli/index.js inspect <url> [options]
```

**Important :** la chaîne analyse → audit n'existe qu'au niveau **L3**
(valeur par défaut). `--level L1` ou `L2` sont explicitement refusés pour
l'audit (les entrées d'analyse seraient incomplètes) ; utilisez L1/L2 via
l'API TypeScript si vous n'avez besoin que d'une inspection.

| Option | Défaut | Description |
|--------|--------|-------------|
| `-l, --level <L1\|L2\|L3>` | `L3` | Niveau d'inspection (audit : L3 obligatoire) |
| `-o, --output <path>` | `./reports` | Dossier des rapports |
| `-f, --format <md\|pdf\|both>` | `both` | Format(s) de rapport |
| `--json` | — | Sortie JSON (scripts, `jq`) |
| `--no-colors` | — | Désactive les couleurs |

```bash
# Audit complet Markdown dans ./rapports
node dist/cli/index.js inspect https://mon-site.com --format md --output ./rapports

# Sortie JSON pour un pipeline
node dist/cli/index.js inspect https://mon-site.com --json
```

La sortie humaine affiche la durée d'inspection, le score global, l'identifiant
d'audit stocké (avec l'état de l'index FTS) puis chaque rapport généré.

## Utilisation CLI — audit

Sous-commandes de consultation des audits stockés :

```bash
node dist/cli/index.js audit list
node dist/cli/index.js audit list --limit 10 --score-min 70 --url https://mon-site.com
node dist/cli/index.js audit show 1
node dist/cli/index.js audit report 1 --format md --output ./rapports
node dist/cli/index.js audit compare 1 2 --format both
```

| Sous-commande | Options utiles |
|---------------|----------------|
| `list` | `--limit <n>` (déf. 20), `--url`, `--score-min`, `--score-max` |
| `show <id>` | — |
| `report <id>` | `--format <md\|pdf\|both>`, `--output <path>` |
| `compare <id1> <id2>` | `--format`, `--output` |

Toutes les commandes acceptent `--json` placé **avant** `audit`
(ex. `ekts --json audit list`).

Exemple de sortie humaine :

```text
→ Audit #12 — https://mon-site.com/
  Score global : 78/100
  Performance 80 · Accessibilité 70 · SEO 85 · UX 75 · Contenu 82
  4 constats (0 critiques · 1 élevés)
  Rapports : ./rapports/audit-12.md · ./rapports/audit-12.pdf
```

Exemple de sortie structurée (`node dist/cli/index.js --json inspect …`) :

```json
{
  "url": "https://mon-site.com/",
  "level": "L3",
  "auditId": 12,
  "score": 78,
  "totalFindings": 4,
  "reports": ["./rapports/audit-12.md", "./rapports/audit-12.pdf"],
  "durationMs": 18240
}
```

Codes de sortie : `0` succès · `1` erreur inattendue · `2` usage ·
`3` ressource introuvable · `4` validation.

## Base de connaissances (ressources)

Parallèlement aux audits, EKTS stocke des **ressources** (articles, vidéos,
documents) avec indexation vectorielle :

```bash
node dist/cli/index.js add --type article --title "SQLite en pratique" --tags sqlite,base --content "..."
node dist/cli/index.js search "indexation hybride"
node dist/cli/index.js list --type article
node dist/cli/index.js get <id>
node dist/cli/index.js delete <id> --yes
node dist/cli/index.js reindex
node dist/cli/index.js reindex --force   # changement d'espace d'embedding
```

Voir `docs/CLI.md` pour le détail de chaque option.

## Utilisation MCP

EKTS expose 7 outils via le Model Context Protocol (stdio). Configuration type
d'un client (Claude Desktop, Cursor, etc.) :

```json
{
  "mcpServers": {
    "ekts": {
      "command": "node",
      "args": ["/chemin/absolu/dist/mcp/server.js"],
      "env": { "EKTS_DATA_DIR": "/chemin/absolu/data" }
    }
  }
}
```

Le serveur démarre avec `npm run mcp` (après `npm run build`).

Appel/réponse typique (`audit_history`) :

```json
→ { "url": "https://mon-site.com/", "limit": 5 }
← { "audits": [ { "id": 12, "overall_score": 78,
     "timestamp": "2026-10-25T10:00:00.000Z" } ] }
```

Seul `inspect_site` (et seulement lorsque vous l'invoquez) ouvre le réseau :
les six autres outils agissent sur la base locale — un agent peut donc
rechercher, lire, valider et comparer sans jamais partir sur Internet.

### Outils disponibles

| Outil | Rôle | Annotation |
|-------|------|-----------|
| `search_knowledge` | Recherche hybride (fts/vector/hybride) dans les ressources | lecture |
| `get_resource` | Ressource par identifiant | lecture |
| `list_resources` | Liste filtrée (type, tags, limite) | lecture |
| `validate_resource` | Valide une ressource sans l'écrire | lecture |
| `inspect_site` | **Action** : inspection L3 complète → audit | écriture (`readOnlyHint: false`) |
| `audit_history` | Historique des audits + filtres (url, scores, limite) | lecture |
| `audit_report` | Rapport Markdown d'un audit | lecture |

Exemple `inspect_site` (entrée/sortie réelles) :

```json
{ "tool": "inspect_site", "arguments": { "url": "https://example.com", "level": "L3" } }
```

```json
{
  "inspection_url": "https://example.com/",
  "level": "L3",
  "score": 78,
  "total_findings": 4,
  "critical_findings": 0,
  "high_findings": 1,
  "audit_id": 12,
  "timestamp": "2026-10-25T10:00:00.000Z",
  "dimensions": { "performance": 80, "accessibility": 70, "seo": 85, "ux": 75, "content": 82 }
}
```

Détail complet : `docs/MCP.md` et `docs/MCP-EXAMPLES.md`.

## Scénarios types

### 1. Audit ponctuel

```bash
node dist/cli/index.js inspect https://mon-site.com
# → Audit #1 stocké + audit-1-*.md et audit-1-*.pdf dans ./reports/
```

### 2. Suivi dans le temps

```bash
node dist/cli/index.js inspect https://mon-site.com          # Audit #1
# ... améliorations ...
node dist/cli/index.js inspect https://mon-site.com          # Audit #2
node dist/cli/index.js audit compare 1 2 --format md         # évolution, deltas, recommandations
```

### 3. Recherche dans l'historique

```bash
node dist/cli/index.js audit list --url https://mon-site.com
node dist/cli/index.js audit list --score-min 80
node dist/cli/index.js --json audit list | jq '.audits[].id'
```

## Lecture des résultats

### Score global

Moyenne pondérée des 5 dimensions (`src/analysis/pipeline.ts`) :

| Dimension | Poids |
|-----------|------:|
| Performance | 25 % |
| Accessibilité | 25 % |
| SEO | 20 % |
| UX | 15 % |
| Contenu | 15 % |

Paliers de lecture : **90-100 excellent · 70-89 bon · 50-69 moyen · < 50 à améliorer**.

### Niveaux d'inspection

| Niveau | Budget cible | Contenu |
|--------|-------------:|---------|
| L1 | 10 s | Navigation rapide |
| L2 | 30 s | + Lighthouse et SEO DOM |
| L3 | 60 s | + axe-core, UX et contenu (entrées d'analyse complètes) |

### Priorités des constats

- 🔴 **critical** — à corriger immédiatement
- 🟠 **high** — à corriger rapidement
- 🟡 **medium** — à planifier
- 🟢 **low** — correction optionnelle
- ⚪ **info** — information

Chaque constat porte `severity` (0-4), `effort` (1-5), `impact` (1-5) et une
recommandation opérationnelle.

## Rapports et comparaisons

- **Markdown** : lecture directe, versionnable, toujours disponible
- **PDF** : rendu Puppeteer, nécessite un Chrome résolvable
  (`PUPPETEER_EXECUTABLE_PATH`, Chrome embarqué ou Chromium Playwright ;
  sinon erreur explicite « aucun Chrome résolvable »)
- **Comparaison** : scores A/B, deltas par dimension, constats nouveaux/résolus,
  tendance (`improving` / `stable` / `declining`, seuil ±5 points),
  recommandations

Formats détaillés : `docs/REPORTS.md`.

## Variables d'environnement

| Variable | Rôle |
|----------|------|
| `EKTS_DATA_DIR` | Répertoire des bases (défaut `data/`) |
| `EKTS_OFFLINE` | Mode hors ligne : bloque les appels réseau d'embeddings |
| `EKTS_LOG_LEVEL` | Niveau de journalisation |
| `OPENAI_API_KEY` (+ variantes `_2`, `_3`…) | Clés fournisseurs (jamais versionnées) |
| `PUPPETEER_EXECUTABLE_PATH` / `EKTS_CHROME_PATH` | Chrome imposé pour le PDF |
| `PLAYWRIGHT_BROWSERS_PATH` | Racine des moteurs Playwright |

Jamais de clé dans le dépôt : `.env` est ignoré, Gitleaks protège commits et CI.

## FAQ

**Combien de temps prend une inspection ?** Le budget L3 cible 60 s
(site et machine conditions). Les budgets sont des cibles mesurées, pas des
coupures.

**Où sont stockés les audits ?** Fichiers SQLite du répertoire `EKTS_DATA_DIR`
(défaut `./data`) : sauvegardez-les comme n'importe quels fichiers.

**Les tests PDF sautent chez moi ?** Normal sans Chrome résolvable
(`skipIf`) : installez-le avec `npx puppeteer browsers install chrome`.

**Comment mettre à jour ?**

```bash
git pull
npm ci
npm run build
```

**Hors ligne ?** Oui : seule l'inspection cible le réseau ; `EKTS_OFFLINE=1`
garantit zéro appel sortant (utilisé par les tests).

**Pourquoi un score diffère-t-il d'une exécution à l'autre ?** Les
inspecteurs mesurent un site vivant (charge, animations, tiers) : les
budgets (L1 10 s · L2 30 s · L3 60 s) sont des cibles mesurées et les
blocs indisponibles dégradent en avertissements — comparez des audits
rapprochés via `audit compare` plutôt qu'une exécution isolée.

**Comment vérifier l'installation ?** `npm run doctor` (environnement),
`ekts status` (bases, version, Node), puis `node dist/cli/index.js --version`
(doit afficher `2.0.0`).

## Documentation associée

- `docs/CLI.md` — référence complète des commandes
- `docs/MCP.md` · `docs/MCP-EXAMPLES.md` — serveur et outils MCP
- `docs/INSPECTOR.md` · `docs/ANALYSIS.md` · `docs/STORAGE.md` · `docs/REPORTS.md` — étages métier
- `docs/USER_GUIDE.md` (ce document) · `docs/API_REFERENCE.md` · `docs/TROUBLESHOOTING.md`
- `docs/DEVELOPER_GUIDE.md` · `docs/CONTRIBUTING.md`
- `docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md` — vue d'ensemble

## Support

1. Consultez `docs/TROUBLESHOOTING.md` (20+ cas répertoriés)
2. `npm run doctor` et `npm run check:env` diagnostiquent l'environnement
3. Ouvrez une issue GitHub avec OS, version Node et sortie de `npm run check:env`

---

**Version :** 0.1.0 (MVP-2) · **Dernière mise à jour :** 25 octobre 2026
