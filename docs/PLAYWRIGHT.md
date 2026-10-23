# Playwright — inspection navigateur

**Version :** 1.0
**Date :** 23 octobre 2026
**Sprint :** 7 (Playwright Setup)
**Bibliothèque :** `playwright` 1.64.1 (installée avec `@playwright/test` 1.64.1)
**Moteurs :** Chromium, Firefox, WebKit

---

## 1. Objectif

Le module `src/browser/` fournit le socle d'inspection du MVP-2 :

| Capacité | Fichier | Utilisée par |
| --- | --- | --- |
| Ouvrir une page, la capturer, tracer, imprimer | `navigator.ts` | Sprints 8 à 11 |
| Extraire et analyser l'accessibility tree | `accessibility.ts` | Sprint 9 (accessibilité) |
| Lire les dimensions d'une image, compter les pages d'un PDF | `media.ts` | Sprint 11 (rapport) |
| Exposer le navigateur à un agent (MCP) | `playwright-mcp.ts` | agents IA |
| Contrats et interfaces | `types.ts`, `errors.ts` | tout le module |

Le module **n'analyse rien** : il produit des artefacts et des structures de
données. Les niveaux L1-L3, Lighthouse et axe-core arrivent aux Sprints 8-9.

---

## 2. Prérequis

| Élément | Exigence | Vérification |
| --- | --- | --- |
| Node.js | ≥ 22.12 | `node --version` |
| Dépendances | `npm ci` | `npm ls @playwright/test` |
| Binaires de navigateur | ~760 Mo (Chromium ≈ 280, Firefox ≈ 260, WebKit ≈ 220) | `npx playwright install --list` |
| Espace disque | ≥ 2 Go libres avant installation | `Get-PSDrive C` |

Les binaires ne sont **pas** téléchargés par `npm ci` : Playwright les récupère
depuis `cdn.playwright.dev` uniquement sur commande. Un environnement sans accès
à ce CDN (CI restreinte, conteneur) peut installer la bibliothèque et exécuter
les tests unitaires, mais pas naviguer.

---

## 3. Installation

```powershell
cd C:\dev\engineering-knowledge-tooling-system
npm ci
npm run browsers:install          # Chromium + Firefox + WebKit
npx playwright install --list     # vérifie les trois binaires
```

`npm run browsers:install` équivaut à
`npx playwright install chromium firefox webkit`. L'installation demande
plusieurs minutes et se place dans `%USERPROFILE%\AppData\Local\ms-playwright`.

Pour un seul moteur (gain de place) :

```powershell
npx playwright install chromium
```

Les tests d'intégration des moteurs absents sont marqués « skipped », ils ne
font pas échouer la suite.

---

## 4. Configuration

### 4.1 `playwright.config.ts`

| Paramètre | Valeur | Raison |
| --- | --- | --- |
| `testDir` | `./tests/browser/e2e` | Seuls les fichiers `*.spec.ts` sont exécutés par Playwright Test |
| `testMatch` | `**/*.spec.ts` | Les `*.test.ts` restent la propriété de Vitest |
| `timeout` | 30 s | Marge pour un premier lancement de navigateur |
| `expect.timeout` | 5 s | Assertions rapides |
| `use.headless` | `true` | Plus rapide, aucune fenêtre |
| `use.screenshot` | `only-on-failure` | Un échec laisse une image, un succès n'écrit rien |
| `use.trace` | `on-first-retry` | Trace uniquement quand un test est rejoué |
| `projects` | chromium, firefox, webkit | Couverture des trois moteurs |

### 4.2 Variables d'environnement

| Variable | Effet | Valeur par défaut |
| --- | --- | --- |
| `EKTS_BROWSER_ONLINE` | `1` active le test réseau `example.com` | désactivé |
| `CI` | Réduit à un worker et rejoue deux fois un test en échec | absent |

Le module ne lit aucune variable pour fonctionner : le moteur, le dossier
d'artefacts et la politique réseau sont des **paramètres de code**
(`BrowserMcpOptions`), pas de la configuration implicite.

---

## 5. Architecture

```
src/browser/
├── types.ts          Contrats + sous-ensemble structurel de Playwright
├── errors.ts         BrowserError et ses sous-classes (codes stables)
├── media.ts          Dimensions PNG/JPEG, nombre de pages PDF (pur)
├── navigator.ts      Navigator + BrowserLauncher + checkBrowserAvailability
├── accessibility.ts  Normalisation ARIA, recherche, violations
└── playwright-mcp.ts Serveur MCP (5 outils) + politique d'URL et de chemins
```

**Flux d'une inspection :**

```
Navigator.start(kind)
   └─ BrowserLauncher.launch(kind)  →  playwright[kind].launch({headless})
        └─ browser.newContext() → context.newPage() → page

Navigator.goto({url}) ────────────────► NavigationResult
Navigator.screenshot({path}) ─────────► PNG/JPEG + dimensions lues dans l'en-tête
Navigator.startTrace() … stopTrace() ─► trace.zip
Navigator.pdf({path}) ────────────────► PDF (Chromium)
Accessibility(navigator).extract() ───► AccessibilityResult
```

Deux principes structurent le code :

1. **Le lancement est une dépendance, pas un appel direct.** `Navigator` reçoit
   un `BrowserLauncher` ; `createPlaywrightLauncher()` est l'implémentation
   réelle. Les tests injectent une doublure et s'exécutent sans binaire.
2. **Le cœur est pur.** `media.ts`, la normalisation ARIA et le calcul des
   violations ne touchent ni au réseau ni au DOM : ils s'appliquent à des
   structures et se testent hors ligne.

---

## 6. API `Navigator`

```ts
import { Navigator } from './src/browser/navigator.js';

const navigator = new Navigator();
await navigator.start('chromium');          // défaut : chromium, headless

const page = await navigator.goto({ url: 'https://example.com' });
// { url, title, status, loadTime, redirected }

await navigator.screenshot({ path: 'artifacts/example.png', fullPage: true });
// { path, size, type, dimensions: { width, height }, duration }

await navigator.startTrace({ title: 'inspection' });
await navigator.goto({ url: 'https://example.com' });
await navigator.stopTrace({ path: 'artifacts/trace.zip' });
// { path, size, duration }

await navigator.pdf({ path: 'artifacts/page.pdf', format: 'A4' });
// { path, size, pages, duration }

await navigator.stop();
```

| Méthode | Rôle | Erreur si… |
| --- | --- | --- |
| `start(kind?, options?)` | Ouvre navigateur, contexte et page | session déjà ouverte (`BROWSER_ALREADY_STARTED`), binaire absent (`BROWSER_UNAVAILABLE`) |
| `stop()` | Ferme page → contexte → navigateur, borne à 10 s, force l'arrêt si besoin | **jamais** : un nettoyage ne lève pas (voir §6.2) |
| `goto(options)` | Ouvre une URL | réseau, DNS, certificat, délai (`NAVIGATION_FAILED`) |
| `screenshot(options)` | Écrit une image | capture ou écriture impossible (`ARTIFACT_FAILED`) |
| `startTrace()` / `stopTrace()` | Enregistre une trace | trace déjà en cours / absente (`TRACE_*`) |
| `pdf(options)` | Imprime en PDF | moteur ≠ Chromium (`UNSUPPORTED_OPERATION`) |
| `setContent(html)` | Charge du HTML sans réseau | session absente |
| `evaluate(expression)` | Exécute du JavaScript dans la page | session absente |
| `getUrl()`, `getTitle()`, `getPage()` | Lecture | session absente (`BROWSER_NOT_STARTED`) |

**Valeurs par défaut :** délai 30 s, `waitUntil: 'load'`, marge PDF 10 mm,
`printBackground: true`, `headless: true`.

**Détail utile :** les dimensions d'une capture ne sont pas devinées. Elles
sont lues dans l'en-tête PNG (chunk IHDR) ou JPEG (segment `SOFn`), ce qui reste
exact en capture pleine page, là où `window.innerHeight` ne vaut que la fenêtre.

### 6.1 Vérifier la disponibilité d'un moteur

```ts
import { checkBrowserAvailability } from './src/browser/navigator.js';

const { installed, executablePath } = await checkBrowserAvailability('firefox');
// installed: false → message d'installation déjà prêt dans BrowserUnavailableError
```

`installed` ne regarde que la **présence du binaire** : un moteur installé peut
mourir à l'ouverture de la première page. Pour ce cas, `npm run
doctor:browsers` (§14.1) ouvre réellement une page.

### 6.2 Pourquoi `stop()` ne lève jamais

La signature est `Promise<void>` et l'appel se termine toujours, même quand le
moteur a planté. Trois raisons, apprises d'un `npm run verify` rouge sur
Windows :

1. **Un nettoyage ne doit pas masquer la cause.** Un `afterAll` qui échoue
   transforme un fichier de tests verts en « Failed Suite » : le vrai message
   (`Target crashed`) disparaît derrière `Fermeture du navigateur expirée`.
2. **L'ordre compte.** `page.close()` → `context.close()` → `browser.close()`.
   Fermer le navigateur d'abord laisse Playwright attendre ses pages ; sous
   Windows, sur une machine chargée, ce chemin dépassait les 10 s.
3. **Un moteur mort ne répond pas.** Après le délai (`closeTimeoutMs`, 10 s par
   défaut), le processus est tué via `browser.process()?.kill('SIGKILL')` ;
   sinon il survit, retient des fichiers et bloque la relance.

### 6.3 Lancement avec préférences Firefox

```ts
await navigator.start('firefox', {
  firefoxUserPrefs: { 'security.sandbox.content.level': 0 },
});
```

Ces préférences sont transmises telles quelles à `firefox.launch()` et ignorées
par Chromium et WebKit. Elles servent aux postes où le bac à sable du processus
de contenu est incompatible (voir §14.1).

---

## 7. Accessibility tree

### 7.1 Extraction

```ts
import { Accessibility } from './src/browser/accessibility.js';

const accessibility = new Accessibility(navigator);
const tree = await accessibility.extract({ maxDepth: 20, maxNodes: 2_000 });
// { root, nodeCount, maxDepth, extractionTime, url, title, truncated }
```

L'arbre est celui de `page.ariaSnapshotJSON()` — le remplacement officiel de
`page.accessibility.snapshot()`, supprimée de Playwright (§12, E7-1).

```json
{
  "role": "WebArea",
  "name": "Page de référence EKTS",
  "children": [
    { "role": "heading", "name": "Inspection navigateur", "level": 1 },
    { "role": "link", "name": "Lien correct", "url": "https://exemple.fr/valide" },
    { "role": "img" },
    "texte libre"
  ]
}
```

Deux garde-fous évitent qu'une page pathologique ne sature la mémoire :
`maxDepth` (défaut 64) et `maxNodes` (défaut 20 000). `truncated` vaut `true`
dès qu'un des deux a mordu — un rapport doit alors le mentionner.

### 7.2 Recherche

| Méthode | Effet |
| --- | --- |
| `findByRole('heading')` | Tous les nœuds d'un rôle (insensible à la casse) |
| `findByName('logo')` | Nœuds dont le nom accessible contient le texte |
| `isAccessible(selector)` | Vrai si l'élément existe **et** porte un nom accessible |

`isAccessible` exécute une expression dans la page : `aria-label`,
`aria-labelledby` résolu, `alt`, `title`, puis texte visible. Un `role` seul ne
suffit pas — `<div role="button"></div>` reste invisible pour un lecteur
d'écran. Le sélecteur est sérialisé en JSON, jamais concaténé brut.

### 7.3 Violations

Règles implémentées, calculées **hors navigateur** :

| Règle | Gravité | Condition |
| --- | --- | --- |
| `image-alt` | serious | `img` sans nom accessible |
| `button-name` | serious | `button` sans nom ni texte |
| `link-name` | serious | `link` sans nom |
| `form-label` | serious | champ (`textbox`, `checkbox`…) sans étiquette |
| `heading-order` | moderate | titre qui saute plus d'un niveau |
| `document-title` | moderate | `WebArea`/`document` sans nom |

```ts
const report = await accessibility.getViolations();
// { url, title, nodeCount, violations[], summary: { minor, moderate, serious, critical } }
```

Ce jeu de règles est **volontairement partiel** : il ne remplace pas axe-core
(Sprint 9) et ne prétend pas couvrir WCAG 2.2 AA. Il détecte les défauts les
plus fréquents sur l'arbre déjà extrait, sans coût supplémentaire.

---

## 8. Serveur MCP navigateur

```ts
import { createBrowserMcpServer } from './src/browser/playwright-mcp.js';
import { Navigator } from './src/browser/navigator.js';
import { createLogger } from './src/mcp/utils/logger.js';

const server = createBrowserMcpServer({
  session: new Navigator(),
  logger: createLogger({ level: 'info' }),
  artifactsDir: 'artifacts/browser',
  browserKind: 'chromium',
  allowPrivateHosts: false,
});
await server.connect(stdioTransport);
```

| Outil | Entrée principale | Sortie |
| --- | --- | --- |
| `browser_navigate` | `url` (http/https), `waitUntil`, `timeoutMs` | URL finale, titre, statut, durée, moteur |
| `browser_screenshot` | `path?`, `fullPage`, `type`, `quality` | chemin, taille, dimensions |
| `browser_accessibility` | `role?`, `name?`, `maxDepth`, `maxNodes`, `includeTree`, `includeViolations` | arbre, correspondances, violations, résumé |
| `browser_pdf` | `path?`, `format`, `landscape` | chemin, taille, pages (Chromium) |
| `browser_close` | — | `{ closed: true }` |

Le navigateur démarre au premier `browser_navigate`. `browser_close` libère les
ressources ; il est sans effet si rien n'est ouvert.

**Mode (défaut) :** Chromium, headless, dossier `artifacts/browser`.

---

## 9. Sécurité

Un agent ne doit pouvoir ni lire le disque local, ni atteindre le réseau
interne. Trois barrières :

1. **Schéma** : seuls `http` et `https` sont acceptés. `file://`,
   `javascript:`, `data:` et `ftp://` sont refusés avant tout appel.
2. **Réseau privé** : `localhost`, `10/8`, `172.16/12`, `192.168/16`,
   `169.254/16`, `127/8`, `::1`, `fc00::/7` et `fe80::/10` sont bloqués par
   défaut. `allowPrivateHosts: true` les autorise explicitement (inspection
   d'un serveur de développement local).
3. **Artefacts** : tout chemin est confiné dans `artifactsDir`. Un chemin
   absolu, un `..` ou un caractère nul est **rejeté**, jamais corrigé en
   silence. Les noms générés ne contiennent pas de `:` (interdit sous Windows).

Les identifiants embarqués (`https://user:pass@…`) sont refusés : ils
finiraient dans les journaux.

Le journal JSON est écrit sur `stderr` uniquement ; `stdout` reste réservé au
protocole MCP.

---

## 10. Performance

| Opération | Cible | Mesure |
| --- | --- | --- |
| Navigation d'une page locale | < 3 s | `NavigationResult.loadTime` |
| Capture d'écran | < 1 s | `ScreenshotResult.duration` |
| Accessibility tree | < 1 s | `AccessibilityResult.extractionTime` |
| PDF | < 3 s | `PdfResult.duration` |
| Trace | < 2 s | `TraceResult.duration` |

Les tests d'intégration vérifient les trois premières cibles sur un serveur
local, donc sans latence réseau. Ces mesures ne préjugent pas d'un site distant
lent : la cible porte sur le **coût du navigateur**, pas sur la qualité du
réseau.

**Optimisations appliquées :** mode headless, un seul contexte par session,
téléchargement des images laissé à `false` n'est **pas** activé (il fausserait
l'analyse visuelle du Sprint 9) ; Playwright charge à la demande
(`import('playwright')`), donc la CLI et le serveur MCP de connaissances ne
paient pas son initialisation.

---

## 11. Tests

| Niveau | Fichier | Exécution | Navigateur requis |
| --- | --- | --- | --- |
| Unitaire | `tests/browser/{media,navigator,accessibility,playwright-mcp}.test.ts` | `npm run test:browser` | non (doublures) |
| Intégration | `tests/browser/integration.test.ts` | `npm test` | oui, sinon « skipped » |
| Bout en bout | `tests/browser/e2e/basic.spec.ts` | `npm run test:e2e` | oui, 3 moteurs |

```powershell
npm run doctor:browsers   # ouvre une page dans chaque moteur, explique chaque échec
npm run test:browser      # 180 tests, sans navigateur
npm run test:e2e          # 12 tests (4 × 3 moteurs) — après browsers:install
npm run coverage          # suite complète
```

### 11.1 Sonde d'état et mode strict

Avant de lancer la suite, chaque moteur est sondé une fois
(`tests/browser/engine-health.ts`) : présence du binaire **et** ouverture
réelle d'une page. Un moteur qui ouvre une page est testé ; un moteur qui plante
est ignoré, avec sa raison dans le nom de la suite :

```
moteur firefox — ignoré : browserContext.newPage: Target crashed
```

Pourquoi ce choix : sans sonde, l'échec se produit dans le `beforeAll`, Vitest
déclare le fichier en « Failed Suite » et les résultats des deux autres moteurs
deviennent illisibles. Le saut est **explicite**, jamais un test vert à tort :
`npm run doctor:browsers` sort en erreur et nomme la cause.

```powershell
$env:EKTS_BROWSER_STRICT = "1"   # un moteur cassé fait échouer la suite
npm test
Remove-Item Env:\EKTS_BROWSER_STRICT
```

Le mode strict est celui d'une CI qui possède des binaires sains : elle ne doit
accepter aucun saut. En local, le mode tolérant permet de travailler sur les
deux autres moteurs pendant qu'on répare le troisième.

Les tests d'intégration utilisent une page servie sur `127.0.0.1` : ils sont
déterministes et fonctionnent hors ligne. Le seul test qui sort sur Internet
(`https://example.com`) est désactivé par défaut :

```powershell
$env:EKTS_BROWSER_ONLINE = "1"
npm run test:browser
Remove-Item Env:\EKTS_BROWSER_ONLINE
```

---

## 12. Écarts entre le dossier Sprint 7 et le code livré

| # | Dossier | Livré | Raison |
| --- | --- | --- | --- |
| E7-1 | `page.accessibility.snapshot()` | `page.ariaSnapshotJSON()` | API **supprimée** de Playwright (absente de la 1.64) ; l'arbre ARIA est le remplacement officiel |
| E7-2 | `startTrace({ path })` | `startTrace({ ... })` puis `stopTrace({ path })` | Playwright n'écrit le ZIP qu'à l'arrêt : connaître le chemin au départ n'aurait aucun effet |
| E7-3 | `new Navigator()` sans dépendance | `new Navigator({ launcher })` possible | Sans injection, aucun test ne peut s'exécuter sans binaire |
| E7-4 | Tests sur `example.com` | Page locale servie sur `127.0.0.1` | Un test réseau n'est ni déterministe ni exécutable hors ligne ; `example.com` reste en test facultatif |
| E7-5 | `use.outputDir` | `outputDir` (option racine) | Cette clé n'existe pas dans `use` |
| E7-6 | `screenshot: 'on'` | `only-on-failure` | Capturer 3 moteurs à chaque test produit des centaines de fichiers inutiles |
| E7-7 | `pdf()` sur les 3 moteurs | Chromium uniquement, erreur explicite ailleurs | Firefox et WebKit n'implémentent pas l'impression PDF |
| E7-8 | « Playwright MCP » implicite | `createBrowserMcpServer` (5 outils) | Le dossier ne décrit pas la surface MCP ; elle est définie ici et isolée de `src/mcp/` |
| E7-9 | `pages` d'un PDF estimé par la taille | Comptage des objets `/Type /Page` | Une estimation `taille / 50 000` est fausse dès la deuxième page |
| E7-10 | `@playwright/test` seul | `src/browser` importe `playwright` | `playwright` est la dépendance de `@playwright/test` (même version, même tarball) ; c'est elle qui expose les moteurs |
| E7-11 | Aucune politique pour un moteur cassé | Sonde + saut explicite, mode strict | Un moteur installé peut planter au premier `newPage` ; sans sonde, la suite entière échoue et masque les autres moteurs (§11.1) |
| E7-12 | Fermeture = `browser.close()` | Page, contexte, puis navigateur ; arrêt forcé après délai | `stop()` qui lève transforme un `afterAll` vert en « Failed Suite » (§6.2) |

---

## 13. Critères d'acceptation (C7.1 à C7.17)

| # | Critère | Validé par | État |
| --- | --- | --- | --- |
| C7.1 | Playwright installé avec 3 moteurs | `npm run doctor:browsers` (ouverture réelle d'une page) + `npm run test:e2e` | ⏳ poste (CDN indisponible en CI) |
| C7.2 | Configuration fonctionnelle | `npx playwright test --list` → 12 tests | ✅ |
| C7.3 | « Playwright MCP » fonctionne | `tests/browser/playwright-mcp.test.ts` (53 tests, transport mémoire) | ✅ |
| C7.4 | Navigation basique | `Navigator.goto` + intégration locale | ✅ (local) |
| C7.5 | Captures | PNG/JPEG écrits, dimensions lues | ✅ |
| C7.6 | Traces | ZIP écrit (`stopTrace`) | ✅ |
| C7.7 | PDF | Chromium, pages comptées | ✅ |
| C7.8 | Accessibility tree | `extract()` + `ariaSnapshotJSON` | ✅ |
| C7.9 | Couverture > 80 % | `src/browser/**` à 100 % | ✅ |
| C7.10 | Tests d'intégration | `npm test` (15 tests conditionnels) | ✅ poste, ⏭ sinon |
| C7.11 | Compilation TypeScript | `npm run build` | ✅ |
| C7.12 | Linting | `npm run lint` | ✅ |
| C7.13 | Documentation | ce fichier | ✅ |
| C7.14 | Navigation < 3 s | test d'intégration local | ✅ poste |
| C7.15 | Capture < 1 s | test d'intégration local | ✅ poste |
| C7.16 | JSDoc et lisibilité | revue, JSDoc sur les fonctions publiques | ✅ |
| C7.17 | Gestion d'erreurs | `tests/browser/navigator.test.ts` (erreurs, délais, artefacts, arrêt forcé) | ✅ |

« ✅ poste » signifie : le code est en place et testé, mais la validation
matérielle exige les binaires Playwright sur un poste connecté au CDN.
`npm run test:browser` reste vert même sans binaire : les 15 tests concernés
sont marqués « skipped », jamais « passed » à tort.

---

## 14. Dépannage

| Symptôme | Cause | Solution |
| --- | --- | --- |
| `Navigateur « chromium » introuvable` | binaires non installés | `npm run browsers:install` |
| `Executable doesn't exist at …` | version de Playwright mise à jour | `npx playwright install --force` |
| Timeout au premier lancement | poste lent, antivirus | augmenter `timeoutMs`, exclure `%LOCALAPPDATA%\ms-playwright` |
| `libnss3.so` introuvable (Linux) | dépendances système absentes | `npx playwright install-deps` |
| `URL refusée … hôte privé` | politique par défaut | `allowPrivateHosts: true` |
| `Artefact … doit rester dans` | chemin hors du dossier | utiliser un chemin relatif à `artifactsDir` |
| `pdf n'est pas disponible dans firefox` | PDF = Chromium | `start('chromium')` |
| `Aucune trace en cours` | `stopTrace` sans `startTrace` | appeler `startTrace` d'abord |
| `EBUSY` sous Windows | fichier ouvert par un autre processus | fermer le lecteur PDF/visionneuse, relancer |
| Tests d'intégration tous « skipped » | pas de binaires | `npm run browsers:install` |
| `expected 'D:\…' to be '\…'` (Windows) | attente composée avec `join` sur une racine sans lettre de lecteur | composer l'attente avec `resolve('/tmp/artefacts')` : `resolveArtifactPath` renvoie toujours un chemin absolu |
| `browserContext.newPage: Target crashed` | processus de contenu mort (binaire incomplet, antivirus, bac à sable) | `npm run doctor:browsers`, puis §14.1 |
| `moteur firefox — ignoré : …` | sonde en échec : le moteur ne s'ouvre pas sur ce poste | réparer avec §14.1 ; `EKTS_BROWSER_STRICT=1` pour exiger l'échec |
| `Fermeture du navigateur expirée` (ancien comportement) | `close()` bloqué | corrigé : `stop()` ferme page et contexte d'abord, puis tue le processus (§6.2) |

### 14.1 Moteur qui plante à l'ouverture d'une page (« Target crashed »)

**Symptôme.** Chromium et WebKit passent, Firefox échoue. `npm test` rapporte
`FAIL tests/browser/integration.test.ts > moteur firefox`, `npm run test:e2e`
échoue sur 3 tests Firefox, toujours avec la même ligne :

```
BrowserLaunchError: Lancement de « firefox » impossible : browserContext.newPage: Target crashed
```

**Ce que dit ce message.** Le navigateur a démarré (le lancement aurait sinon
échoué avant), mais le **processus de contenu** est mort au moment de créer la
page. Aucune page n'a été chargée : ni le HTML, ni le réseau, ni le code du
projet ne sont en cause. Playwright ne transmet pas la raison ; il faut la
chercher côté poste.

**Diagnostic.**

```powershell
npm run doctor:browsers
```

Le script ouvre une page dans chaque moteur, puis, pour un moteur en échec,
exécute le binaire lui-même (`--version`, rendu `--headless`) et rejoue le
lancement sans bac à sable. Il écrit `artifacts/browser-doctor.json` et sort
avec le code 1. Quatre causes possibles, dans l'ordre de fréquence :

| Constat du diagnostic | Cause | Remède |
| --- | --- | --- |
| le binaire ne répond pas à `--version` | installation incomplète (téléchargement interrompu) | `npx playwright install --force firefox` |
| `--version` échoue avec une erreur de DLL | runtime C++ absent | installer *Microsoft Visual C++ Redistributable 2015-2022 x64* |
| le rendu hors Playwright échoue aussi | antivirus ou stratégie Windows | exclure `%LOCALAPPDATA%\ms-playwright` de l'antivirus et de la *Protection contre les exploits* |
| « sans bac à sable : page ouverte » | bac à sable incompatible | `firefoxUserPrefs: { 'security.sandbox.content.level': 0 }` (§6.3) |

**Réparation type.**

```powershell
npx playwright install --force firefox
npm run doctor:browsers
npm run test:browser
```

Puis, si le diagnostic désigne le bac à sable, dans le test ou le script
concerné :

```ts
await navigator.start('firefox', {
  firefoxUserPrefs: { 'security.sandbox.content.level': 0 },
});
```

**Après réparation.** `npm run test:e2e` doit afficher 12 tests passés, et
`npm test` ne doit plus ignorer que les tests conditionnels du réseau.

---

## 15. Références

- Playwright — documentation officielle : <https://playwright.dev>
- Aria snapshots : <https://playwright.dev/docs/aria-snapshots>
- `BrowserType.launch` : <https://playwright.dev/docs/api/class-browsertype>
- WCAG 2.2 : <https://www.w3.org/TR/WCAG22/>
- ARIA 1.2 : <https://www.w3.org/TR/wai-aria-1.2/>
- axe-core (règles reprises au Sprint 9) : <https://github.com/dequelabs/axe-core>
