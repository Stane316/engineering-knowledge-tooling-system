# Guide Multi-Projets — EKTS

**Sprint 13 (MVP-3, ADR-031)** · 25 octobre 2026

Ce guide explique la gestion multi-projets d'EKTS : regrouper audits,
ressources et inspections par projet, puis isoler le contexte avec le filtre
`--project`, côté CLI et côté MCP.

## Qu'est-ce qu'un projet ?

Un **projet** est une unité d'organisation (table `projects`, identifiant
UUIDv4). Il permet de :

- séparer les audits de différents sites web ;
- suivre un projet dans le temps (`started_at`, `completed_at`, statuts) ;
- capitaliser les ressources et bonnes pratiques d'un contexte donné.

**Modèle** (`ProjectSchema`, `src/shared/validators.ts`) :

| Champ | Type | Notes |
| --- | --- | --- |
| `id` | UUIDv4 | généré à la création |
| `name` | string 1-200 | obligatoire |
| `description` | string ≤ 2000 | optionnelle |
| `status` | `active` \| `completed` \| `archived` | défaut `active` |
| `startedAt` / `completedAt` | ISO 8601, nullables | |
| `metadata` | objet JSON | défaut `{}` ; c'est ici que range l'URL du site (pas de colonne `url` — écart documenté) |
| `createdAt` / `updatedAt` | ISO 8601 | |

## Créer un projet

### Via CLI

```bash
ekts project create "Mon Site Web" --description "Audit example.com" --status active
ekts project create "exemple.com" --json          # sortie machine
```

### Via MCP (`create_project`)

```json
{
  "name": "create_project",
  "arguments": {
    "name": "Mon Site Web",
    "description": "Audit du site example.com",
    "status": "active"
  }
}
```

## Lister les projets

```bash
ekts project list                     # tous, du plus récent au plus ancien
ekts project list --status active     # filtré par statut
ekts project list --limit 10 --json
```

MCP :

```json
{ "name": "list_projects", "arguments": { "status": "active", "limit": 50 } }
```

## Lire un projet

```bash
ekts project show 550e8400-e29b-41d4-a716-446655440000
```

- code **0** : trouvé · **3** : introuvable · **4** : argument non UUID.
- MCP `get_project` : `{ "project_id": "<uuid>" }` → `{ "project": {…} }`,
  erreur `-32000` si absent.

> **Windows (PowerShell)** : ne jamais écrire `<uuid>` en clair (`<` ouvre une
> redirection). Capturez l'identifiant produit par la création :
>
> ```powershell
> $p = npx ekts project create "Mon Site" --json | ConvertFrom-Json
> $p.id
> npx ekts project show $p.id
> ```

## Inspecter un site dans un projet

```bash
# 1. Créer le projet
ekts project create "example.com"

# 2. Inspecter en lui rattachant l'audit (vérification du projet AVANT la
#    navigation ; projet inconnu → code 3)
ekts inspect https://example.com --project $p.id

# 3. Ne voir que les audits du projet
ekts audit list --project $p.id
ekts audit show 1 --project $p.id      # refus (code 3) si audit d'un autre projet
```

MCP : `inspect_site` accepte `project_id` optionnel.

```json
{
  "name": "inspect_site",
  "arguments": { "url": "https://example.com", "level": "L3", "project_id": "550e8400-…" }
}
```

## Rattacher des ressources

```bash
# Création directe (projet inconnu → code 3)
ekts add --type article --title "Bonne pratique SEO" --content "…" --project $p.id

# Filtrer ensuite
ekts list --project $p.id
ekts search "bonnes pratiques" --mode fts --project $p.id
```

MCP : `list_resources` / `search_knowledge` ne exposent pas encore le filtre
`project_id` (seul `inspect_site` l'accepte) — utiliser la CLI pour ce filtre,
l'écart est suivi au registre (R-13.2).

## Rechercher les audits d'un projet

```bash
ekts audit list --project $p.id --json
ekts search "performance" --mode fts --project $p.id
```

## Supprimer un projet

```bash
ekts project delete $p.id             # refus (code 1) : confirmation requise
ekts project delete $p.id --force     # suppression effective
```

**Note :** les audits et ressources associés sont **conservés** — leur
`project_id` devient `NULL` (`ON DELETE SET NULL`, migration 003). Aucune
suppression en cascade n'est possible.

MCP : `delete_project` ne demande aucune confirmation (l'appel est explicite).

```json
{ "name": "delete_project", "arguments": { "project_id": "550e8400-…" } }
```

## Codes de sortie (rappel)

| Code | Cas projet |
| --- | --- |
| 0 | succès |
| 1 | suppression sans `--force` |
| 2 | UUID ou `--status` invalide (usage) |
| 3 | projet (ou audit dans le projet) introuvable |
| 4 | validation Zod métier (nom vide, nom > 200 caractères) |

## Statuts des projets

- `active` : en cours (défaut)
- `completed` : terminé
- `archived` : archivé (les audits restent consultables)

## Bonnes pratiques

1. **Un projet par site web** : chaque site inspecté a son propre projet.
2. **Descriptions claires** : elles identifient le projet dans `project list`.
3. **Archiver plutôt que supprimer** : `update` le statut en `archived` quand
   le projet est fini — les liens audits/projet sont préservés.
4. **Toujours filtrer avec `--project`** dans les scripts : les audits sans
   projet n'apparaissent jamais dans un filtre explicite.
5. **`--force` réservé aux scripts** : en interactif, relisez l'ID avant.

## Vérification rapide

```powershell
$p = npx ekts project create "Vérification" --json | ConvertFrom-Json
npx ekts project list
npx ekts add --type other --title "Rattachée" --project $p.id
npx ekts list --project $p.id --json
npx ekts project delete $p.id --force
npx ekts project show $p.id          # attendu : code 3
```
