# SPRINT-20-03 — Politique de cible et rendu sûr — résultat

**Sprint parent :** [SPRINT-20](SPRINT-20.md) · **Sous-sprint :** [SPRINT-20-03](SPRINT-20-03.md)
**Date d'exécution :** 30 octobre 2026 · **Branche :** `arena/079e2f26-engineering-knowledge-tooling`
**Base de départ :** `a4ef3fa` · **Commit d'implémentation :** `e2ee455` · **Statut :** ✅ C-W13 et C-W14 satisfaits et testés ; 38 cas d'environnement toujours ignorés.

## 1. Décisions humaines reçues avant code

| # | Question | Réponse retenue |
| --- | --- | --- |
| C-W13 (portée) | Où appliquer la politique de cible ? | **`cli_mcp_optin`** : CLI **et** MCP refusent les hôtes privés/loopback par défaut, avec une exception explicite (`--allow-private-hosts`, `allow_private_hosts`) |
| C-W13 (DNS) | Refuser avant ou après résolution ? | **`resolution_avant_refus`** : l'hôte est résolu, une adresse privée est refusée, un échec DNS est une erreur dédiée ; limite de rebinding déclarée |
| C-W14 | Que faire du HTML dans le Markdown ? | **`echapper`** : `<` et `>` deviennent `&lt;` / `&gt;` dans le Markdown généré |

## 2. Défauts réels constatés avant correction

| # | Défaut | Preuve |
| --- | --- | --- |
| 1 | La CLI `inspect` acceptait **n'importe quelle** URL : aucune politique dans `src/cli/` | `grep -rn "assertNavigableUrl\|isPrivateHost" src/cli/` → aucun résultat |
| 2 | L'outil MCP `inspect_site` transmettait `params.url` **brut** à `inspectAndAudit` | `src/mcp/tools/inspect-site.ts`, avant correction |
| 3 | La politique existait dans **un seul** fichier (`playwright-mcp.ts`) et ne faisait **aucune** résolution DNS | `assertNavigableUrl` synchrone, `isPrivateHost` sur l'hôte littéral seulement |
| 4 | Le Markdown généré n'échappait **rien** : `HTML échappe titres/dimensions/URL/scoreReason`, Markdown n'a aucun équivalent | `grep "private escape\|this.text" src/reports/templates/markdown.ts` → aucun résultat |

## 3. Tests écrits avant le code

### 3.1 RED (verbatim)

```text
npx vitest run tests/cli/inspect-url-policy.test.ts tests/reports/safe-render.test.ts
→ FAIL tests/cli/inspect-url-policy.test.ts > 2/6 — un schéma interdit est refusé avant toute navigation
  FAIL tests/cli/inspect-url-policy.test.ts > 3/6 — une cible privée est refusée par défaut
  FAIL tests/cli/inspect-url-policy.test.ts > 4/6 — l'exception locale explicite autorise un hôte privé
  FAIL tests/cli/inspect-url-policy.test.ts > 5/6 — un nom résolu vers une adresse privée est refusé
  FAIL tests/cli/inspect-url-policy.test.ts > 6/6 — un échec DNS est explicite et bloque la navigation
  FAIL tests/reports/safe-render.test.ts > neutralise le HTML hostile dans le rendu Markdown
  FAIL tests/reports/safe-render.test.ts > neutralise le HTML hostile dans le rendu HTML
  Tests 7 failed | 1 passed (8)

npx vitest run tests/mcp/tools/inspect-site-policy.test.ts
→ FAIL 2/4 — une cible privée est refusée par défaut
  AssertionError: expected [Function] to throw error matching /privé/i but got
  'STOP_TEST — la politique a laissé pas…'
  FAIL 4/4 — un échec DNS est explicite
  AssertionError: expected [Function] to throw error matching /DNS/i but got
  'STOP_TEST — la politique a laissé pas…'
  Tests 2 failed | 2 passed (4)

npx vitest run tests/browser/inspection/inspector.test.ts
→ FAIL Inspector — niveau 1 > refuse une cible interdite avant d'ouvrir la session (C-W13)
  Tests 1 failed | 20 passed (21)

npx vitest run tests/reports/safe-render.test.ts (après correction de l'assertion, cf. E20-11)
→ FAIL neutralise le HTML hostile dans le rendu Markdown
  AssertionError: expected '# 📊 Rapport d\'audit — https://examp…' not to contain '<script'
  Tests 1 failed | 1 passed (2)
```

Les cas « 1/6 URL publique » (CLI) et « 1/4 / 3/4 » (MCP) étaient **déjà GREEN** :
sans politique, une cible publique passe. Ils sont conservés comme gardes de
non-régression, pas comme preuve d'un correctif.

### 3.2 GREEN, par étapes

```text
1er passage après écriture de la politique (src/browser/url-policy.ts) : 8 passed (8)
  → 6/6 CLI + 2/2 rapports
MCP après branchement de l'outil : 4 passed (4)
Inspector après ajout du verrou syntaxique : 22 passed (22)
Suites complètes : 8 failed | 1758 passed (1804)
  → 4 échecs playwright-mcp (URL normalisée), 4 échecs CLI (DNS réel en test)
  → correction : seam de résolution (runtime CLI, options du serveur MCP)
Après seam : 70 passed (70) sur tests/cli/* + tests/browser/playwright-mcp.test.ts
Après garde de redirection : tests/browser/inspection/inspector.test.ts 22 passed (22)
```

Aucun test n'a été affaibli pour obtenir le vert : chaque écart est listé au § 7.

## 4. Mesures finales (exécutées)

```text
npm run verify → EXIT=0
  typecheck : 0 erreur · lint : 0 erreur · format : conforme · build : succès
  tests      : 1767 passed | 38 skipped (1805)
  fichiers   : 146 passed | 6 skipped (152)
  couverture : statements 96,01 % · branches 89,37 % · fonctions 97,39 % · lignes 96,19 %
```

## 5. Critères

| Critère | Statut | Preuve |
| --- | --- | --- |
| **C-W13 / W05+O06** | ✅ | `tests/cli/inspect-url-policy.test.ts` (6) : URL publique admise, schéma interdit, privé/loopback refusé par défaut, exception `--allow-private-hosts`, nom résolu vers une adresse privée refusé, échec DNS explicite. `tests/mcp/tools/inspect-site-policy.test.ts` (4) : mêmes décisions côté `inspect_site`, avec `allow_private_hosts`. `tests/browser/inspection/inspector.test.ts` : verrou dans le composant qui navigue + refus d'une **redirection** vers un hôte privé, session refermée |
| **C-W14 / W05+O06** | ✅ | `tests/reports/safe-render.test.ts` (2) : un constat dont titre/description/recommandation contiennent `<script>` et `<img onerror>` ne produit **aucune** balise brute, ni en Markdown ni en HTML ; la forme échappée est présente |

## 6. Fichiers (23)

**Source (10)** : `src/browser/url-policy.ts` (**nouveau**), `src/browser/errors.ts`,
`src/browser/inspection/{inspector,types}.ts`, `src/browser/playwright-mcp.ts`,
`src/cli/{runtime.ts,commands/inspect.ts}`, `src/mcp/{schemas/tool-schemas,tools/inspect-site}.ts`,
`src/reports/templates/markdown.ts`.

**Tests (9)** : `tests/cli/inspect-url-policy.test.ts` (**nouveau**),
`tests/mcp/tools/inspect-site-policy.test.ts` (**nouveau**),
`tests/reports/safe-render.test.ts` (**nouveau**), `tests/browser/inspection/inspector.test.ts`,
`tests/browser/inspection/level-{1,2,3}.test.ts`, `tests/browser/playwright-mcp.test.ts`,
`tests/cli/helpers.ts`.

**Documents (5)** : `docs/{CLI,API_REFERENCE,MCP,INSPECTOR,REPORTS}.md` + ce rapport.

## 7. Écarts déclarés

| # | Écart | Traitement |
| --- | --- | --- |
| **E20-11** | La première version de `safe-render` testait l'absence de « markup exécutable » via une expression qui comptait aussi `javascript:` en **texte** et le balisage propre du document HTML | Assertion reformulée **avant** le GREEN en `pas de balise brute issue du contenu` (`<script`, `<img`) + forme échappée présente. Le cas HTML était déjà sûr : il est conservé comme garde de non-régression, pas comme preuve d'un correctif |
| **E20-12** | Les tests utilisent le **seam** `CliRuntime.resolveHost` / `BrowserMcpOptions.resolveHost` au lieu de `vi.mock('node:dns/promises')` | Le RED a été observé avec le mock de module ; après le seam, la décision testée est exactement celle du code de production, sans dépendance à l'ordre de chargement des modules |
| **E20-13** | Deux fonctions, une politique : `assertNavigableUrl` rend l'URL **normalisée** (`https://a.fr` → `https://a.fr/`), `assertNavigableTarget` rend la **saisie** de l'utilisateur | Préserve le contrat historique du serveur navigateur (URL canonique ouverte) tout en conservant l'URL saisie dans l'audit et les rapports |
| **E20-14** | La CLI ne transmet `allowPrivateHosts` à `Inspector` que si le drapeau est posé | Conserve la forme d'appel historique (`{ url, level }`) pour les tests et les appelants existants |
| **E20-15** | `ResolvedInspectionOptions` gagne un champ **obligatoire** `allowPrivateHosts: boolean` | Trois fixtures de contexte d'inspection complétées ; aucun test affaibli |
| **E20-16** | Le refus d'une **redirection** vers un hôte privé intervient **après** la navigation | La requête est déjà émise : c'est un refus *a posteriori* (aucune analyse ni publication de la page interne). Limite écrite dans `docs/INSPECTOR.md` § 11 |

## 8. Limites et non-prouvé

- **Rebinding DNS** : la résolution précède la connexion du navigateur ; un
  changement d'enregistrement entre les deux instants n'est pas couvert.
- **Redirections** : refusées après coup (E20-16), pas interceptées.
- **Pas de résolution dans `Inspector`** : le verrou y est syntaxique par choix
  (pas d'appel réseau caché, résolveur injectable aux frontières).
- **Aucun test navigateur réel** : les 38 cas dépendant de Chromium/PDF restent
  ignorés (6 fichiers) ; la politique est prouvée sur des doublures.
- **`javascript:` en texte** : non neutralisé côté Markdown (périmètre C-W14 =
  chevrons) ; laissé au rendu final.
- **CI distante** : toujours non observée.

## 9. Commandes exactes

```powershell
npx vitest run tests/cli/inspect-url-policy.test.ts tests/reports/safe-render.test.ts
npx vitest run tests/mcp/tools/inspect-site-policy.test.ts tests/browser/inspection/inspector.test.ts
npm run build
npm run verify
```
