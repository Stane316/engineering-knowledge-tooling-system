# Guide d'installation et de configuration — EKTS

| Champ | Valeur |
|-------|--------|
| **Objectif** | Installer, vérifier et configurer un poste de développement EKTS |
| **Responsable** | Développeur du projet (poste local) / mainteneur (CI) |
| **Prérequis** | Droits d'installation locale, accès réseau à npm et GitHub |
| **Emplacement** | Racine du dépôt `engineering-knowledge-tooling-system` |
| **Dernière mise à jour** | 2026-10-22 (Sprint 1) |

---

## 1. Prérequis système

| Outil | Version minimale | Vérification | Résultat attendu |
|-------|------------------|--------------|------------------|
| Node.js | 22.12.0 (LTS) | `node --version` | `v22.12.0` ou supérieur |
| npm | 10.9.0 | `npm --version` | `10.9.0` ou supérieur |
| Git | 2.40 | `git --version` | `git version 2.40` ou supérieur |
| Chaîne de compilation | — | `python3 --version`, `make --version` | non vides (see §6.1) |
| Gitleaks (optionnel) | 8.30.1 | `gitleaks version` | `8.30.1` |

> Node 22 LTS est la **baseline officielle** (ADR-011). Node 24 est testé en CI comme version de compatibilité ascendante. Node 20 n'est plus supporté.

### 1.1 Installer Node 22

```bash
# nvm (recommandé)
nvm install 22
nvm use 22          # .nvmrc est présent à la racine

# ou fnm
fnm install 22 && fnm use 22
```

**Vérification :** `node --version` → `v22.x.y` avec `x >= 12`.

### 1.2 Installer les outils de compilation

`better-sqlite3` publie des binaires précompilés pour les plateformes courantes ; ils sont utilisés automatiquement. La chaîne de compilation n'est nécessaire qu'en cas de repli.

```bash
# Debian / Ubuntu
sudo apt-get update && sudo apt-get install -y build-essential python3

# macOS
xcode-select --install

# Fedora / RHEL
sudo dnf groupinstall "Development Tools" && sudo dnf install -y python3
```

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

Le hook `pre-commit` détecte l'absence du binaire et **n'échoue pas** : il affiche un avertissement et laisse la CI appliquer le contrôle. Installer Gitleaks reste fortement recommandé pour un retour immédiat.

---

## 2. Installation du projet

### 2.1 Cloner

```bash
git clone https://github.com/Stane316/engineering-knowledge-tooling-system.git
cd engineering-knowledge-tooling-system
```

**Résultat attendu :** répertoire contenant `package.json`, `src/`, `docs/`.

### 2.2 Installer les dépendances

```bash
npm ci
```

`npm ci` est **obligatoire** (et non `npm install`) : il installe exactement les versions de `package-lock.json`, qui est versionné.

**Résultat attendu :** `added N packages` sans erreur, et création de `node_modules/`.

**Attention :** `npm ci` exécute le script `prepare` → `husky`, qui installe les hooks Git. Si Husky échoue parce que le dépôt n'est pas encore initialisé, voir §6.3.

### 2.3 Compiler

```bash
npm run build
```

**Résultat attendu :** création de `dist/index.js`, `dist/shared/version.js` et des fichiers `.d.ts`.

---

## 3. Vérification complète

Exécuter les commandes dans cet ordre ; chacune doit se terminer avec le code de sortie `0`.

| # | Commande | Résultat attendu |
|---|----------|------------------|
| 1 | `npm run typecheck` | aucune sortie après l'en-tête du script |
| 2 | `npm run lint` | aucune sortie après l'en-tête du script |
| 3 | `npm run format:check` | `All matched files use Prettier code style!` |
| 4 | `npm test` | `Tests  N passed (N)` |
| 5 | `npm run coverage` | tableau de couverture, `All files` ≥ 80 % |
| 6 | `npm start` | ligne JSON Pino `"msg":"EKTS v0.1.0 — squelette initialisé (Sprint 1)"` |

**Procédure rapide (une seule ligne) :**

```bash
npm run typecheck && npm run lint && npm run format:check && npm run coverage && npm start
```

**Vérification du code de sortie :**

```bash
echo $?   # → 0
```

---

## 4. Configuration

### 4.1 Variables d'environnement

| Variable | Valeurs | Défaut | Effet |
|----------|---------|--------|-------|
| `NODE_ENV` | `development`, `test`, `production` | `development` | Sélectionne le profil d'exécution ; toute autre valeur retombe sur `development` |
| `EKTS_DATA_DIR` | chemin relatif ou absolu | `data` | Répertoire des bases SQLite ; résolu en chemin absolu depuis le répertoire courant |
| `LOG_LEVEL` | `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent` | `info` | Niveau de verbosité Pino |

```bash
# Exemple : données hors du dépôt, logs détaillés
EKTS_DATA_DIR="$HOME/.local/share/ekts" LOG_LEVEL=debug npm start

# Exemple : exécution silencieuse (utile en test)
LOG_LEVEL=silent npm start
```

### 4.2 Fichier `.env`

Aucune variable n'est obligatoire au Sprint 1. Pour un usage local :

```bash
cp .env.example .env      # si le fichier existe
# sinon créer .env manuellement
```

`.env` est **ignoré par Git** (voir `.gitignore`). Ne jamais y placer de valeur réelle destinée à la production, et ne jamais forcer son ajout (`git add -f`).

### 4.3 Chemins des bases (Sprint 2+)

| Base | Fichier | Rôle |
|------|---------|------|
| Principale | `data/ekts.db` | Ressources, connaissances, projets, observations |
| FTS | `data/ekts-fts.db` | Index plein texte FTS5 |
| Vecteurs | `data/ekts-vectors.db` | Embeddings `sqlite-vec` |

Le répertoire `data/` est créé à la première utilisation et n'est **jamais** versionné.

---

## 5. Hooks Git

### 5.1 Hook `pre-commit`

Fichier : `.husky/pre-commit` (versionné).

Contenu fonctionnel :

```sh
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks git --pre-commit --staged --redact --config .gitleaks.toml
else
  echo "[pre-commit] gitleaks absent : scan local ignoré (la CI applique le contrôle)."
fi
```

Comportement :

- Gitleaks présent → blocage du commit si un secret est détecté dans les fichiers indexés.
- Gitleaks absent → avertissement, commit autorisé (la CI reste bloquante).

### 5.2 Réinstaller les hooks

```bash
npm run prepare
```

**Résultat attendu :** `.husky/_/` regénéré, aucune erreur.

### 5.3 Contournement volontaire

```bash
git commit --no-verify -m "..."
```

À n'utiliser que pour un commit documentaire dont on a vérifié le contenu, jamais pour un fichier contenant un secret.

---

## 6. Dépannage

### 6.1 `better-sqlite3` échoue à l'installation

**Symptôme :** `node-gyp` erreur, `gyp ERR! stack`, `Could not find any Python installation`.

**Causes :** prébuild absent pour la plateforme, ou compilation déclenchée à tort.

```bash
# 1. Vérifier que Node correspond à la version supportée
node --version                 # attendu : v22.x ou v24.x

# 2. Nettoyer et réinstaller sans cache
rm -rf node_modules ~/.npm/_cacache
npm ci

# 3. Si la compilation est réellement nécessaire, installer la chaîne (§1.2)
#    puis relancer
npm rebuild better-sqlite3
```

**Vérification :**

```bash
node -e "const D=require('better-sqlite3');const d=new D(':memory:');console.log(d.prepare('select 1 as ok').get())"
# → { ok: 1 }
```

**Récupération :** si le binaire reste introuvable, supprimer `node_modules/` et relancer `npm ci` après avoir mis à jour npm (`npm i -g npm@latest`).

### 6.2 `npm ci` refuse de s'exécuter

**Symptôme :** `npm ci can only install packages when your package.json and package-lock.json are in sync`.

**Procédure :**

```bash
git checkout -- package-lock.json   # restaurer la version versionnée
npm ci
```

Si le décalage est légitime (dépendance ajoutée volontairement), régénérer le lockfile **dans un commit dédié** :

```bash
npm install <paquet>
git add package.json package-lock.json
```

### 6.3 Husky ne s'installe pas

**Symptôme :** `fatal: not a git repository` pendant `npm ci`.

**Cause :** installation hors dépôt Git (archive, sous-répertoire).

**Procédure :** initialiser Git ou installer avec `HUSKY=0` :

```bash
HUSKY=0 npm ci
```

### 6.4 `npm run format:check` échoue

```bash
npx prettier --write .        # corrige tout le dépôt
npm run format:check          # vérification
```

Ne jamais modifier `.prettierrc` pour contourner un échec sur un fichier isolé.

### 6.5 `gitleaks` signale un faux positif

1. Vérifier que la chaîne n'est **pas** un secret réel (historique Git inclus : `git log -S"<chaîne>"`).
2. Si c'est un exemple documentaire, ajouter son chemin dans `[[allowlists]]` de `.gitleaks.toml`.
3. Ne jamais ajouter d'`allowlist` sur une valeur réelle : révoquer la clé et la remplacer par une variable d'environnement.

### 6.6 `npm start` échoue avec `Cannot find module '.../dist/index.js'`

```bash
npm run build && npm start
```

`npm start` ne compile pas : il exécute uniquement le build existant.

### 6.7 Erreur `ERR_MODULE_NOT_FOUND` sur un import `.js`

Le projet est en ESM (`"type": "module"`, `moduleResolution: NodeNext`) : **tous les imports relatifs doivent porter l'extension `.js`**, même depuis un fichier `.ts`.

```ts
import { logger } from './shared/logger.js';   // ✅
import { logger } from './shared/logger';      // ❌
```

### 6.8 CI rouge sur Node 24 uniquement

Node 24 est une version de **compatibilité** ; un échec spécifique indique une API dépréciée ou un binaire natif manquant. Ouvrir une issue, ne pas retirer la matrice sans décision tracée dans le registre (ADR/RISQ).

---

## 7. Sécurité

| Règle | Application |
|-------|-------------|
| Aucun secret dans le dépôt | `.gitignore` + Gitleaks pre-commit + job CI `secrets` |
| Secrets locaux | `.env` (ignoré) uniquement |
| Secrets CI | GitHub Secrets (jamais en clair dans les workflows) |
| Historique | Scan complet `gitleaks git . --log-opts="--all"` en CI |
| Révocation | Toute clé exposée est révoquée **avant** d'être retirée du code |
| Dépendances | `npm ci` depuis le lockfile versionné ; `npm audit` avant ajout d'un paquet |

---

## 8. Procédure de récupération rapide

```bash
# Repartir d'un poste propre
git clean -xdf          # ⚠️ supprime les fichiers non suivis (dont .env local)
git checkout -- .
npm ci
npm run build
npm test
```

`git clean -xdf` détruit les fichiers ignorés : sauvegarder `.env` et `data/` avant exécution.

---

## 9. Références

- [README](../../README.md)
- [Architecture](../../docs/blueprint/Docs/02-ARCHITECTURE-TECHNIQUE.md)
- [Sécurité](../../docs/blueprint/Docs/05-SECURITE-ET-GESTION-DES-SECRETS.md)
- [Guide Git](../../docs/blueprint/Docs/06-GUIDE-GIT-GITHUB.md)
- [ADR et risques](../../docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md)
