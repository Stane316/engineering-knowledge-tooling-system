# Guide d'installation et de configuration — EKTS

| Champ | Valeur |
|-------|--------|
| **Objectif** | Installer, vérifier et configurer un poste de développement EKTS |
| **Responsable** | Développeur du projet (poste local) / mainteneur (CI) |
| **Prérequis** | Droits d'installation locale, accès réseau à npm et GitHub |
| **Emplacement** | Racine du dépôt `engineering-knowledge-tooling-system` |
| **Dernière mise à jour** | 2026-10-22 (portabilité Windows : tests, encodage, PowerShell) |

---

## 1. Prérequis système

| Outil | Version minimale | Vérification | Résultat attendu |
|-------|------------------|--------------|------------------|
| Node.js | 22.12.0 (LTS) | `node --version` | `v22.12.0` ou supérieur |
| npm | 10.9.0 | `npm --version` | `10.9.0` ou supérieur |
| Git | 2.40 | `git --version` | `git version 2.40` ou supérieur |
| Gitleaks (optionnel) | 8.30.1 | `gitleaks version` | `8.30.1` |

> Node 22 LTS est la **baseline officielle** (ADR-011). Node 24 est testé en CI comme version de
> compatibilité ascendante. Node 20 n'est plus supporté.

### 1.1 Installer Node 22

```bash
# nvm (macOS / Linux)
nvm install 22
nvm use 22          # .nvmrc est présent à la racine
```

```powershell
# nvm-windows (PowerShell)
nvm install 22.12.0
nvm use 22.12.0
```

Node 24 fonctionne également (testé en CI). Éviter les versions impaires et les versions
antérieures à 22.12.

### 1.2 Chaîne de compilation : **non requise**

`better-sqlite3` 13 embarque ses binaires précompilés pour `linux`, `darwin` et `win32`
(x64 et arm64), et `sqlite-vec` fournit des paquets plateforme. **Aucun compilateur C++,
aucun Python et aucun Visual Studio ne sont nécessaires.**

Le dépôt neutralise donc les scripts de cycle de vie npm via `.npmrc` (`ignore-scripts=true`) :
c'est ce qui garantit que `npm ci` ne tente jamais de recompiler quoi que ce soit (voir §6.1).

### 1.3 Installer Gitleaks (recommandé)

```bash
# Linux x64
curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz \
  | tar -xz -C /tmp
sudo install -m 0755 /tmp/gitleaks /usr/local/bin/gitleaks

# macOS
brew install gitleaks

# Vérification
gitleaks version   # → 8.30.1
```

```powershell
# Windows (PowerShell, sans droits administrateur)
Invoke-WebRequest -Uri "https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_windows_x64.zip" -OutFile "$env:TEMP\gitleaks.zip"
Expand-Archive "$env:TEMP\gitleaks.zip" -DestinationPath "$env:LOCALAPPDATA\gitleaks" -Force
$env:Path += ";$env:LOCALAPPDATA\gitleaks"
gitleaks version
```

Sans Gitleaks, le hook `pre-commit` affiche un avertissement et laisse passer le commit ; la CI
reste bloquante.

---

## 2. Installation du projet

### 2.1 Cloner

```bash
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system
```

> **Windows :** éviter un dossier synchronisé (OneDrive, Dropbox) ou surveillé par un antivirus.
> `C:\Users\<nom>\Downloads` est synchronisé par OneDrive chez beaucoup d'utilisateurs, ce qui
> provoque des erreurs `EPERM` pendant l'installation (voir §6.9). Préférer `C:\dev\`.

### 2.2 Installer les dépendances

```bash
npm ci
```

`npm ci` est **obligatoire** (et non `npm install`) : il installe exactement les versions de
`package-lock.json`, qui est versionné.

**Résultat attendu :** `added 169 packages` sans erreur et sans aucune ligne `node-gyp`.

### 2.3 Installer les hooks Git et vérifier l'environnement

```bash
npm run setup
```

Cette commande installe les hooks Husky (le script `prepare` n'est plus exécuté à cause de
`ignore-scripts`) puis lance `scripts/check-env.mjs` :

```
OK   Dépendances installées
OK   Version de Node — 22.22.3 (minimum 22.12)
OK   better-sqlite3 — SQLite 3.53.4 (binaire précompilé)
OK   sqlite-vec — v0.1.9
OK   Outils de développement — tsc, vitest, eslint et prettier disponibles
OK   Hooks Git — installés
```

Si une ligne est en `FAIL`, voir §6.

### 2.4 Compiler

```bash
npm run build
```

**Résultat attendu :** création de `dist/index.js`, `dist/shared/version.js` et des fichiers `.d.ts`.

---

## 3. Vérification complète

| # | Commande | Résultat attendu |
|---|----------|------------------|
| 1 | `npm run check:env` | 6 lignes `OK` |
| 2 | `npm run typecheck` | aucune sortie après l'en-tête du script |
| 3 | `npm run lint` | aucune sortie |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm test` | `Tests 240 passed (240)` |
| 6 | `npm run coverage` | `All files 100 %` |
| 7 | `npm run db:inspect` | 3 fichiers, `journal_mode=wal`, `user_version = 1` |
| 8 | `npm run test:benchmark` | `OK - seuils respectes` (Recall@5, Faithfulness, p95) |
| 9 | `npm start` | `{"msg":"EKTS v0.1.0 - squelette initialise (Sprint 1)"}` |

**Raccourci** (typecheck + lint + format + build + couverture) :

```bash
npm run verify
```

**Vérification du code de sortie :**

```powershell
echo $LASTEXITCODE   # PowerShell
```

```bash
echo $?              # bash / zsh
```

> **PowerShell.** Ces commandes sont des scripts npm : elles s'exécutent à l'identique. En revanche
> `2>/dev/null`, `||`, `&&` (Windows PowerShell 5.1) et `ls -la` **ne fonctionnent pas** : utiliser
> `npm run check:env` et `npm run db:inspect` plutôt que des commandes `node -e "…"` multi-lignes.

---

## 4. Configuration

### 4.1 Variables d'environnement

| Variable | Valeurs | Défaut | Effet |
|----------|---------|--------|-------|
| `NODE_ENV` | `development`, `test`, `production` | `development` | Profil d'exécution ; toute autre valeur retombe sur `development` |
| `EKTS_DATA_DIR` | chemin relatif ou absolu | `data` | Répertoire des bases SQLite, résolu en absolu |
| `LOG_LEVEL` | `trace`…`fatal`, `silent` | `info` | Verbosité Pino |
| `OPENAI_API_KEY` | `sk-…` | — | Embeddings OpenAI (une clé parmi d'autres, voir §4.4) |
| `GEMINI_API_KEY` | chaîne | — | Embeddings Gemini (palier gratuit) |
| `OPENROUTER_API_KEY` | `sk-or-…` | — | Embeddings/chat OpenRouter (même espace qu'OpenAI) |
| `NOVITA_API_KEY` | chaîne | — | Embeddings `baai/bge-m3` (gratuit) |
| `TAVILY_API_KEY`, `SERPER_API_KEY`, `SERPAPI_API_KEY` | chaîne | — | Recherche web |
| `SOFYA_API_KEY` | `ay_live_…` | — | Recherche (`/v1/search`) et lecture d'URL en markdown (`/v1/fetch`) |
| `DEEPSEEK_API_KEY`, `ZAI_API_KEY`, `NVIDIA_API_KEY`, `STEPFUN_API_KEY`, `MINIMAX_API_KEY` | chaîne | — | Chat (Sprint 6) |
| `E2B_API_KEY` | chaîne | — | Bac à sable (Sprint 8) |
| `EKTS_PROVIDER_POLICY` | `quality`, `free`, `cost` | `quality` | Politique de sélection des fournisseurs |
| `EKTS_PROVIDERS_FILE` | chemin | `providers.custom.json` | Fournisseurs déclarés par l'utilisateur (voir §4.6) |
| `EKTS_EMBEDDING_SPACE` | `éditeur/modèle` | — | Espace d'embedding imposé (dépannage) |
| `OPENAI_EMBEDDING_MODEL` | nom de modèle | `text-embedding-3-small` | Doit produire 1536 dimensions |
| `EMBEDDING_DIMENSION` | entier | `1536` | Doit rester 1536 (schéma `float[1536]`) |

```bash
# bash / zsh
EKTS_DATA_DIR="$HOME/.local/share/ekts" LOG_LEVEL=debug npm start
```

```powershell
# PowerShell
$env:EKTS_DATA_DIR = "$env:LOCALAPPDATA\ekts"; $env:LOG_LEVEL = "debug"; npm start
```

### 4.2 Fichier `.env`

Depuis le Sprint 4.5, la génération d'embeddings accepte **plusieurs fournisseurs**
(OpenAI, OpenRouter, Gemini, Novita). Créez `.env` à partir du modèle versionné :

```powershell
Copy-Item .env.example .env
notepad .env      # renseigner au moins une clé d'embedding
```

```bash
cp .env.example .env
```

`.env` est **ignoré par Git**, par Gitleaks et par le hook pre-commit ; ne jamais forcer son
ajout (`git add -f`). Les tests et le benchmark n'ont **pas** besoin de clé : ils utilisent un
fournisseur d'embeddings local et déterministe.

### 4.4 Plusieurs clés par fournisseur

Un même fournisseur accepte jusqu'à huit clés, suffixées `_2` à `_8` :

```dotenv
OPENAI_API_KEY=sk-premiere-cle
OPENAI_API_KEY_2=sk-seconde-cle
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...
```

Les clés tournent à chaque appel réussi : deux comptes gratuits doublent le quota
disponible. Si une clé est refusée, la suivante est essayée dans le même appel.
Limite : les clés d'un même fournisseur doivent donner accès **au même modèle**,
sinon l'espace d'embedding devient ambigu.

Le mécanisme s'applique à **tous** les fournisseurs, livrés ou déclarés :
`ZAI_API_KEY`, `ZAI_API_KEY_2`, `ZAI_API_KEY_3`… fonctionnent sans configuration
supplémentaire.

### 4.6 Déclarer un fournisseur absent du catalogue

Copiez le modèle versionné, puis adaptez-le :

```powershell
Copy-Item providers.custom.example.json providers.custom.json
notepad providers.custom.json
```

Le fichier ne contient **jamais** de clé, seulement le nom de la variable qui la
portera dans `.env`. Il est ignoré par Git. Validation au chargement : HTTPS
obligatoire, protocole connu, pas d'en-tête `authorization`, identifiants
uniques. Voir [`PROVIDERS.md`](PROVIDERS.md) §9.

### 4.5 Vérifier la configuration

```powershell
npm run build
npm run providers
```

Aucun appel réseau, aucun coût : la commande affiche les clés détectées (masquées),
les capacités par fournisseur, les espaces d'embedding disponibles et la chaîne
d'appel résolue. C'est le premier réflexe en cas de « aucun fournisseur disponible ».

Mode d'emploi complet : [`docs/guides/PROVIDERS.md`](PROVIDERS.md).

### 4.3 Chemins des bases

| Base | Fichier | Rôle |
|------|---------|------|
| Principale | `data/ekts.db` | Ressources, projets, audits |
| FTS | `data/ekts-fts.db` | Index plein texte FTS5 |
| Vecteurs | `data/ekts-vectors.db` | Embeddings `sqlite-vec` (1536 dimensions) |

Créées à la première ouverture, permissions `600` (POSIX), jamais versionnées.

---

## 5. Hooks Git

### 5.1 Hook `pre-commit`

Fichier versionné : `.husky/pre-commit`.

```sh
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks git --pre-commit --staged --redact --config .gitleaks.toml
else
  echo "[pre-commit] gitleaks absent : scan local ignoré (la CI applique le contrôle)."
fi
```

- Gitleaks présent → commit bloqué si un secret est détecté dans les fichiers indexés.
- Gitleaks absent → avertissement, commit autorisé, CI bloquante.

### 5.2 Installer ou réinstaller les hooks

```bash
npm run setup
```

`npm run prepare` reste disponible mais n'est **pas** exécuté automatiquement
(`ignore-scripts=true`).

### 5.3 Contournement volontaire

```bash
git commit --no-verify -m "..."
```

Uniquement pour un commit documentaire relu, jamais pour un fichier contenant un secret.

---

## 6. Dépannage

### 6.1 `node-gyp` / Visual Studio / `gyp ERR!` pendant `npm ci`

**Symptômes (Windows) :**

```
npm error command sh -c node-gyp rebuild
gyp ERR! find VS You need to install the latest version of Visual Studio
gyp ERR! find VS including the "Desktop development with C++" workload.
```

**Symptômes (Linux/macOS) :**

```
gyp http GET https://nodejs.org/download/release/vX/node-vX-headers.tar.gz ... ECONNRESET
gyp ERR! configure error
```

**Cause exacte.** `better-sqlite3` 13 embarque ses binaires (`prebuilds/`) et déclare
`gypfile: false` : **aucune compilation n'est nécessaire**. Mais le lockfile ne conserve pas ce
champ ; `npm ci` (ainsi que `npm install` en présence d'un lockfile) voit `binding.gyp`, en déduit
un module natif et lance `node-gyp rebuild`. Sur une machine sans Visual Studio (Windows) ou sans
chaîne de compilation, l'installation échoue alors que le binaire précompilé était déjà là.

**Correctif (intégré au dépôt).** `.npmrc` contient `ignore-scripts=true`. Un `npm ci` normal
n'essaie donc jamais de compiler :

```bash
npm ci
npm run setup
```

**Ne pas installer Visual Studio pour ce projet.** Si un `node-gyp rebuild` apparaît malgré tout,
c'est que `.npmrc` a été supprimé ou contourné : le restaurer (`git checkout -- .npmrc`) puis
relancer l'installation après avoir supprimé `node_modules`.

**Vérification:**

```bash
node -e "const D=require('better-sqlite3');const d=new D(':memory:');console.log(d.prepare('select sqlite_version() v').get())"
# → { v: '3.53.4' }
```

### 6.2 `npm ci` échoue après un `node_modules` incomplet

Dans 90 % des cas, l'échec vient d'un `node_modules` partiellement supprimé (voir §6.9) ou d'un
`package-lock.json` désynchronisé.

```bash
# 1. Restaurer le lockfile versionné
git checkout -- package-lock.json

# 2. Repartir d'un dossier de dépendances propre (voir §6.9 sur Windows)
rm -rf node_modules
npm ci
npm run setup
```

Si le décalage est volontaire (dépendance ajoutée), régénérer le lockfile **dans un commit dédié** :

```bash
npm install <paquet>
git add package.json package-lock.json
```

### 6.3 Husky ne s'installe pas

**Symptôme :** `.git can't be found` ou hooks absents après `npm ci`.

**Cause :** `ignore-scripts=true` empêche l'exécution de `prepare`, et l'installation peut se faire
hors dépôt Git (archive, sous-répertoire).

**Procédure :**

```bash
npm run setup     # installe les hooks
```

Hors dépôt Git, cette étape est sans objet.

### 6.4 `npm run format:check` échoue

```bash
npx prettier --write .
npm run format:check
```

Ne jamais modifier `.prettierrc` pour contourner un échec isolé.

### 6.5 Gitleaks signale un faux positif

1. Vérifier que la chaîne n'est **pas** un secret réel (historique inclus : `git log -S"<chaîne>"`).
2. Si c'est un exemple documentaire, ajouter le chemin dans `[[allowlists]]` de `.gitleaks.toml`.
3. Ne jamais allowlister une valeur réelle : révoquer la clé, puis la remplacer par une variable
   d'environnement.

### 6.6 `npm start` : `Cannot find module '.../dist/index.js'`

```bash
npm run build && npm start
```

`npm start` ne compile pas : il exécute le build existant.

### 6.7 `ERR_MODULE_NOT_FOUND` sur un import `.js`

Le projet est en ESM (`"type": "module"`, `moduleResolution: NodeNext`) : **tous les imports
relatifs portent l'extension `.js`**, même depuis un fichier `.ts`.

```ts
import { logger } from './shared/logger.js';   // ✅
import { logger } from './shared/logger';      // ❌
```

### 6.8 CI rouge sur Node 24 uniquement

Node 24 est une version de **compatibilité**. Un échec spécifique indique une API dépréciée ou un
comportement différent : ouvrir une issue, ne pas retirer la matrice sans décision tracée (ADR/RISQ).

### 6.9 Windows : `EPERM: operation not permitted, rmdir ...node_modules\...`

**Symptômes :**

```
npm warn cleanup Failed to remove some directories [...node_modules\zod\src] {
npm warn cleanup   [Error: EPERM: operation not permitted, rmdir ...]
```

**Causes :** fichiers verrouillés par un processus (terminal, VS Code, watcher `tsx`,
antivirus) ou synchronisation OneDrive d'un dossier sous `Downloads`.

**Procédure :**

```powershell
# 1. Fermer les terminaux, VS Code, watchers
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Supprimer le dossier de dépendances
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 3. Si la suppression échoue encore : redémarrer, ou déplacer le projet hors de OneDrive
#    Exemple : C:\dev\engineering-knowledge-tooling-system

# 4. Réinstaller
npm cache verify
npm ci
npm run setup
```

**Prévention :** travailler dans `C:\dev\...` (hors OneDrive) et exclure le dossier du scan
temps réel de l'antivirus si les lenteurs persistent.

### 6.10 Windows : `npm.ps1 cannot be loaded because running scripts is disabled`

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Alternative immédiate, sans changer la politique système :

```powershell
npm.cmd ci
```

---

## 7. Windows — séquence complète (PowerShell)

```powershell
# 1. Se placer dans un dossier non synchronisé
cd C:\dev
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system

# 2. Installer (aucune compilation, aucun Visual Studio)
npm ci

# 3. Hooks + vérification de l'environnement
npm run setup

# 4. Vérifier
npm run verify
npm start
```

Sortie attendue à l'étape 3 :

```
OK   better-sqlite3 — SQLite 3.53.4 (binaire précompilé)
OK   sqlite-vec — v0.1.9
OK   Hooks Git — installés
```

Si `node-gyp` apparaît à l'étape 2 : `.npmrc` est absent (`git status`), le restaurer puis
recommencer après `Remove-Item -Recurse -Force node_modules` (§6.1 et §6.9).

---

### 7.4 Accents et tirets illisibles (`ÔÇö`, `├®`) dans la console

**Symptôme :**

```
{"level":30,"msg":"EKTS v0.1.0 ÔÇö squelette initialis├® (Sprint 1)"}
```

**Cause :** Node écrit les journaux en UTF-8, mais la console Windows utilise par défaut une page de
codes OEM (CP437/CP850). Les octets UTF-8 d'un tiret cadratin ou d'un `é` y apparaissent décomposés.

**Deux mesures :**

1. **Les journaux d'exécution sont désormais en ASCII** (`src/index.ts`) : `npm start` reste lisible
   sur n'importe quelle console, quelle que soit la page de codes. C'est une contrainte des
   *sorties techniques*, pas de la documentation ni du code, qui restent en UTF-8.
2. **Passer la console en UTF-8** si d'autres sorties affichent des accents :

```powershell
chcp 65001
npm start
```

Pour rendre le réglage permanent dans le profil PowerShell :

```powershell
Add-Content $PROFILE 'chcp 65001 > $null'
```

**Vérification :** `npm start` doit afficher
`{"level":30,...,"msg":"EKTS v0.1.0 - squelette initialise (Sprint 1)"}`.

## 8. Sécurité

| Règle | Application |
|-------|-------------|
| Aucun secret dans le dépôt | `.gitignore` + Gitleaks pre-commit + job CI `secrets` |
| Secrets locaux | `.env` (ignoré) uniquement |
| Secrets CI | GitHub Secrets (jamais en clair dans les workflows) |
| Historique | Scan complet `gitleaks git . --log-opts="--all"` en CI |
| Révocation | Toute clé exposée est révoquée **avant** d'être retirée du code |
| Dépendances | `npm ci` depuis le lockfile ; scripts de cycle de vie désactivés (`.npmrc`) |

---

## 9. Procédure de récupération rapide

```bash
git clean -xdf          # ⚠️ supprime les fichiers non suivis (dont .env local)
git checkout -- .
npm ci
npm run setup
npm run verify
```

`git clean -xdf` détruit les fichiers ignorés : sauvegarder `.env` et `data/` avant exécution.

---

## 10. Références

- [README](../../README.md)
- [Data Layer](DATA_LAYER.md)
- [Architecture](../blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)
- [Sécurité](../blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md)
- [Guide Git](../blueprint/Docs/06-GUIDE-GIT-GITHUB.md)
- [ADR et risques](../blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md)
