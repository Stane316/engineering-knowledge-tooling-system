# Dépannage — Engineering Knowledge Tooling System

> MVP-2 — cas courants avec commande exacte · Diagnostic global : `npm run doctor`

## Symptômes courants

### 1. `npm ci` échoue — `EPERM … vec0.dll` / fichier verrouillé

**Cause :** processus Node résiduel détient les binaires SQLite.

**Correctif (PowerShell) :**

```powershell
Stop-Process node -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force   # seulement si le lock est invalide
npm ci
```

### 2. `vitest : command not found` / prompt npx

**Cause :** `npm ci` interrompu ou fichier `.bin` de base manquant.

**Correctif :** `npm ci` (surveillance du code de sortie) puis
`npx vitest run` via le script maison `npm test`.

### 3. Tests navigateur skippés (`⏭`)

**Cause :** navigateurs Playwright non installés (contexte hors ligne, CDN
bloqué).

**Correctif :** `npm run browsers:install` (validité réseau), ou ignoré en
dév si les tests unitaires/intégration suffisent. En CI, scripts de cycle de
vie désactivés (`ignore-scripts=true`) : les sauts sont attendus.

### 4. Échec des rendus PDF — « aucun Chrome résolvable »

**Cause :** pas de Chrome système détectable et embarquages absents.

**Étapes :** installer Chrome/Chromium, ou définir `PUPPETEER_EXECUTABLE_PATH`
ou `EKTS_CHROME_PATH` ; vérifier avec `npm run doctor`.

### 5. `PDFReportGenerator.generate` timeout

**Cause :** machine chargée (le rendu peut dépasser 15 s en charge).

**États connus :** budget de test 30 s + warm-up dans `tests/reports/` ;
vérifier que la fenêtre de test n'exécute pas d'autres suites lourdes en
parallèle (`npm test` limite les workers). Relancer seul :
`npm test -- pdf-generator`.

### 6. CLI — code de sortie 3 (ressource introuvable)

**Cause :** identifiant inexistant ou base vide.

**Étapes :** `ekts status` (ressources/audits), `ekts list`,
`ekts audit list` ; vérifier `EKTS_DATA_DIR` (défaut `data/`).

### 7. CLI — code 4 (validation)

**Causes typiques :** `inspect` en L1/L2 pour un audit (L3 requis) ; `--format`
hors valeurs acceptées ; `--limit` nul/négatif ou non entier.

**Correctif :** reprendre la commande d'après `docs/CLI.md`.

### 8. CLI — code 2 (usage)

**Cause :** commande ou option inconnue.

**Correctif :** `ekts --help` puis `ekts <commande> --help`.

### 9. Inspects/audits intègres mais scores à zéro

**Cause :** blocs d'inspection `null` (dégradation L3) consommés par l'analyse
sans pont `fromInspection`.

**Étapes :** afficher `warnings[]` du résultat d'inspection ; re-lancer en
hors heures chargées ; seul le pont d'analyse (Sprint 9) restaure la chaîne.

### 10. MCP — le serveur ne démarre pas

**Étapes :** `npm run build` (binaire `dist/mcp/server.js`), lancer
`npm run mcp` ; vérifier la config client (commande + args exacts) ;
le serveur ne requiert aucune variable secrète.

### 11. MCP — erreur `-32602` (paramètres invalides)

**Cause :** champ manquant/hors bornes (limit 1..100, format markdown|text…).

**Correctif :** corriger l'appel d'après `docs/API_REFERENCE.md`.

### 12. MCP — erreur `-32000` (ressource)

**Cause :** `get_resource`/`audit_report` sur identifiant inexistant.

**Correctif :** `audit_history` pour lister les ids valides.

### 13. Recherche vectorielle indisponible

**Étapes :** `ekts status` → informations des embeddings ; redémarrer la
session (le mode se fige après la première recherche) ; `ekts reindex`
après changement de modèle ou d'espace (`--force` si espace différent).

### 14. Firefox plante au lancement (Windows)

**Cause fréquente :** runtime **Microsoft Visual C++ Redistributable
2015-2022 x64** manquant/corrompu (vcruntime140_1.dll).

**Étapes :** installer/réparer le VC++ Redistributable, redémarrer, relancer
`npx playwright test --project=firefox` ; en cas de persistance, tester
chromium/webkit et ouvrir une issue avec la sortie de `DEBUG=pw:browser`.

### 15. `Target crashed` (Firefox 1.64+)

**Cause :** régression/amorçage signalée sur certains postes (issue
[43543](https://github.com/microsoft/playwright/issues/43543), fermée « not
planned ») — le message seul n'identifie pas la cause.

**Étapes :** diagnostic poste (`DEBUG=pw:browser`), rétrograder le navigateur
(Playwright 1.58) ou basculer les tests sur chromium.

### 16. VCRUNTIME140.dll manquant (Chrome/Firefox)

Installer le **VC++ Redistributable x64** puis redémarrer (cf. §14).

### 17. Lighthouse/Axe absents

**Cause :** chemins Lighthouse (`--chrome-flags`, environnement) ou scripts
de cycle de vie désactivés.

**Étapes :** vérifier que `dist/` est à jour (`npm run build`) ; les
blocages de sortie sont des `null` + `warnings[]`, pas un crash.

### 18. Migrations/schéma en erreur

**Cause :** version de base incohérente.

**Étapes :** `npm run db:inspect` ; en dernier recours, sauvegarder puis
supprimer le dossier `EKTS_DATA_DIR` et réinitialiser (`ekts init`,
réimport des données).

### 19. Rendu Markdown/PDF : rapport absent du dossier

**Cause :** `outputPath` invalide ou droits insuffisants.

**Étapes :** chemin absolu, droits d'écriture, code retour 0 ; message du
générateur en cas d'échec.

### 20. `--json` inaccessible dans un pipe PowerShell

Cause historique de redirection : aujourd'hui les options sont attachées
(`--json`, `--no-colors`) ; utiliser `ekts --json <commande> > fichier.json`.

### 21. Échec CI — push sans couverture/sauvegardes « binary files »

**Cause :** `.gif` de commande `code-cov` trop lourd.

**Correctif :** retirer l'image du rapport ; jamais de binaire dans un commit
de documentation.

### 22. Gitleaks bloque un commit

**Cause :** faux positif ou secret réel.

**Étapes :** vérifier le fichier listé ; **jamais** `--no-verify` sur suspicion
de secret ; rotation des clés exposées et issue immédiate.

### 23. `npm run verify` rouge — identification rapide

| Sortie | Suite concernée | Rapide |
|--------|-----------------|--------|
| typecheck | `tsc --noEmit` | message complet en tête de log |
| lint | ESLint | `npm run lint:fix` |
| format | Prettier | `npm run format` |
| build | `tsc -p` | dépendances circulaires/imports |
| coverage | Vitest + seuils 80 % | ré-exécuter la suite isolée (§5) |

---

## Collecte d'informations (avant d'ouvrir une issue)

```powershell
node --version        # >= 22.19.0 attendu
npm --version         # >= 10.9.0 attendu
npm run doctor        # diagnostic maison
git status
```

Joindre : commande exacte, code de sortie, extraits de logs,
échec reproductible en `npm test -- <fichier>`.
**Ne jamais** coller de clés ni de sorties `providers`/`.env`.

---

**Version :** 2.0.0 (MVP-2) · **Dernière mise à jour :** 25 octobre 2026
