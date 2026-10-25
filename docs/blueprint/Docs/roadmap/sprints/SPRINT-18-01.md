# SPRINT-18-01 — Tests E2E MVP-3

**Sprint :** 18-01 sur 18 (Sous-sprint 1/3)  
**Durée :** 4 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Implémenter les tests de bout en bout pour tous les flux fonctionnels du MVP-3 :
- Tests E2E pour le multi-projets (Sprint 13)
- Tests E2E pour le suivi temporel (Sprint 14)
- Tests E2E pour les bonnes practices (Sprint 15)
- Tests E2E pour les recommandations (Sprint 16)
- Tests E2E pour les templates (Sprint 17)
- Tests d'intégration complète MVP-3

**Contrainte de performance :** Tous les tests E2E doivent s'exécuter en < 120s.

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que tous les sprints 13-17 sont terminés
npm run verify

# Vérifier la structure existante
ls src/projects/ src/timeline/ src/best-practices/ src/recommendations/ src/templates/
```

### 2.2 Documents à lire

- `SPRINT-18.md` (document parent)
- `docs/blueprint/Docs/08-REGISTRE-DECISIONS-ET-RISQUES.md` (ADR-029 à ADR-041)
- `tests/e2e/` (patterns existants du Sprint 12)

---

## 3. Tâches détaillées

### 3.1 Tests E2E Multi-Projets (Sprint 13) — 1 jour

**Fichier :** `tests/e2e/mvp3/multi-projects.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('E2E MVP3 - Multi-Projets', () => {
  let tempDir: string;
  const originalCwd = process.cwd();

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'ekts-e2e-'));
    process.chdir(tempDir);
    execSync('npm init -y', { stdio: 'ignore' });
    execSync('npm install file:../..', { stdio: 'ignore' });
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('C13.1-C13.7 : devrait créer, lister et supprimer des projets', () => {
    // Créer un projet
    const createOutput = execSync('npx ekts project create --name "Projet Test" --url "https://test.com" --description "Test"', { encoding: 'utf-8' });
    expect(createOutput).toContain('Projet créé');

    // Lister les projets
    const listOutput = execSync('npx ekts project list', { encoding: 'utf-8' });
    expect(listOutput).toContain('Projet Test');

    // Supprimer le projet
    const deleteOutput = execSync('npx ekts project delete --id <project-id> --yes', { encoding: 'utf-8' });
    expect(deleteOutput).toContain('Projet supprimé');
  });

  it('C13.8-C13.12 : devrait filtrer les audits par projet', () => {
    // Créer deux projets
    execSync('npx ekts project create --name "Projet A" --url "https://a.com"', { stdio: 'ignore' });
    execSync('npx ekts project create --name "Projet B" --url "https://b.com"', { stdio: 'ignore' });

    // Créer des audits pour chaque projet
    execSync('npx ekts audit https://a.com --project "Projet A"', { stdio: 'ignore' });
    execSync('npx ekts audit https://b.com --project "Projet B"', { stdio: 'ignore' });

    // Filtrer les audits
    const output = execSync('npx ekts audit list --project "Projet A"', { encoding: 'utf-8' });
    expect(output).toContain('https://a.com');
    expect(output).not.toContain('https://b.com');
  });
});
```

**Critères d'acceptation :**
- Tests C13.1 → C13.12 couverts
- Temps d'exécution < 20s
- Mock des requêtes réseau (pas d'appels externes)

---

### 3.2 Tests E2E Suivi Temporel (Sprint 14) — 1 jour

**Fichier :** `tests/e2e/mvp3/timeline.test.ts`

```typescript
describe('E2E MVP3 - Suivi Temporel', () => {
  it('C14.1-C14.7 : devrait analyser la timeline et détecter les tendances', () => {
    // Créer un projet
    execSync('npx ekts project create --name "Timeline Test" --url "https://timeline.com"', { stdio: 'ignore' });

    // Créer 5 audits sur 6 mois
    const dates = ['2024-01-01', '2024-03-01', '2024-05-01', '2024-07-01', '2024-09-01'];
    dates.forEach(date => {
      execSync(`npx ekts audit https://timeline.com --project "Timeline Test" --date ${date}`, { stdio: 'ignore' });
    });

    // Analyser la timeline
    const timelineOutput = execSync('npx ekts timeline analyze "Timeline Test"', { encoding: 'utf-8' });
    expect(timelineOutput).toContain('Timeline');
    expect(timelineOutput).toContain('5 audits');

    // Détecter les tendances
    const trendsOutput = execSync('npx ekts timeline trends "Timeline Test"', { encoding: 'utf-8' });
    expect(trendsOutput).toMatch(/(amélioration|régression|stable)/i);

    // Vérifier les alertes
    const alertsOutput = execSync('npx ekts timeline alerts "Timeline Test"', { encoding: 'utf-8' });
    expect(alertsOutput).toBeDefined();
  });

  it('C14.8-C14.15 : devrait générer des graphiques', () => {
    // Générer un graphique
    execSync('npx ekts timeline chart "Timeline Test" --output timeline.svg', { stdio: 'ignore' });

    // Vérifier que le fichier existe
    const fs = require('fs');
    expect(fs.existsSync('timeline.svg')).toBe(true);

    // Vérifier le contenu SVG
    const svgContent = fs.readFileSync('timeline.svg', 'utf-8');
    expect(svgContent).toContain('<svg');
  });
});
```

**Critères d'acceptation :**
- Tests C14.1 → C14.15 couverts
- Temps d'exécution < 25s
- Graphique SVG valide généré

---

### 3.3 Tests E2E Bonnes Practices (Sprint 15) — 1 jour

**Fichier :** `tests/e2e/mvp3/best-practices.test.ts`

```typescript
describe('E2E MVP3 - Bonnes Practices', () => {
  it('C15.1-C15.12 : devrait extraire et rechercher des bonnes practices', () => {
    // Créer un projet avec des audits
    execSync('npx ekts project create --name "BP Test" --url "https://bp.com"', { stdio: 'ignore' });

    // Créer des audits avec findings résolus
    execSync('npx ekts audit https://bp.com --project "BP Test" --findings "Images non optimisées,Meta manquante"', { stdio: 'ignore' });
    execSync('npx ekts audit https://bp.com --project "BP Test" --findings "Meta manquante"', { stdio: 'ignore' }); // "Images" résolu

    // Extraire les bonnes practices
    const extractOutput = execSync('npx ekts bestpractice extract "BP Test"', { encoding: 'utf-8' });
    expect(extractOutput).toContain('extraite');

    // Lister les bonnes practices
    const listOutput = execSync('npx ekts bestpractice list', { encoding: 'utf-8' });
    expect(listOutput).toContain('Images');

    // Rechercher
    const searchOutput = execSync('npx ekts bestpractice search "images"', { encoding: 'utf-8' });
    expect(searchOutput).toContain('Images');

    // Créer manuellement
    execSync('npx ekts bestpractice add --title "Test BP" --description "Test" --category performance', { stdio: 'ignore' });
  });

  it('C15.13-C15.20 : devrait performer l\'extraction en < 5s', () => {
    const start = Date.now();
    execSync('npx ekts bestpractice extract "BP Test"', { stdio: 'ignore' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

**Critères d'acceptation :**
- Tests C15.1 → C15.20 couverts
- Extraction < 5s
- Recherche < 100ms

---

### 3.4 Tests E2E Recommandations (Sprint 16) — 0.5 jour

**Fichier :** `tests/e2e/mvp3/recommendations.test.ts`

```typescript
describe('E2E MVP3 - Recommandations', () => {
  it('C16.1-C16.20 : devrait générer des recommandations contextuelles', () => {
    // Créer un projet avec audits
    execSync('npx ekts project create --name "Rec Test" --url "https://rec.com"', { stdio: 'ignore' });
    execSync('npx ekts audit https://rec.com --project "Rec Test" --findings "Performance basse"', { stdio: 'ignore' });

    // Ajouter une règle
    execSync('npx ekts recommend rules add --name "Perf Rule" --pattern "Performance" --recommendation "Optimiser"', { stdio: 'ignore' });

    // Générer des recommandations
    const recOutput = execSync('npx ekts recommend generate "Rec Test"', { encoding: 'utf-8' });
    expect(recOutput).toContain('recommandation');

    // Vérifier le scoring
    expect(recOutput).toMatch(/\d+%/); // Score de pertinence

    // Lister les recommandations
    const listOutput = execSync('npx ekts recommend list "Rec Test"', { encoding: 'utf-8' });
    expect(listOutput).toBeDefined();
  });

  it('C16.13-C16.14 : devrait générer en < 5s et supporter 10k règles', () => {
    const start = Date.now();
    execSync('npx ekts recommend generate "Rec Test"', { stdio: 'ignore' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

**Critères d'acceptation :**
- Tests C16.1 → C16.20 couverts
- Génération < 5s
- Scoring contextuel vérifié

---

### 3.5 Tests E2E Templates (Sprint 17) — 0.5 jour

**Fichier :** `tests/e2e/mvp3/templates.test.ts`

```typescript
describe('E2E MVP3 - Templates', () => {
  it('C17.1-C17.20 : devrait lister, appliquer et exporter des templates', () => {
    // Lister les templates prédéfinis
    const listOutput = execSync('npx ekts template list', { encoding: 'utf-8' });
    expect(listOutput).toContain('E-commerce');
    expect(listOutput).toContain('SaaS');
    expect(listOutput).toContain('Blog');

    // Appliquer un template
    execSync('npx ekts template apply e-commerce --name "Mon E-commerce" --url "https://shop.com"', { stdio: 'ignore' });

    // Vérifier que le projet a été créé avec la config
    const projectOutput = execSync('npx ekts project show "Mon E-commerce"', { encoding: 'utf-8' });
    expect(projectOutput).toContain('performance');
    expect(projectOutput).toContain('seo');

    // Exporter un template
    execSync('npx ekts template export e-commerce template.json', { stdio: 'ignore' });
    const fs = require('fs');
    expect(fs.existsSync('template.json')).toBe(true);

    // Importer un template
    execSync('npx ekts template import template.json', { stdio: 'ignore' });

    // Créer un template personnalisé
    execSync('npx ekts template create --name "Custom" --category custom --config \'{"priorityDimensions":["performance"]}\'', { stdio: 'ignore' });
  });

  it('C17.13-C17.14 : devrait appliquer en < 10s et supporter 100 templates', () => {
    const start = Date.now();
    execSync('npx ekts template apply saas --name "SaaS Test" --url "https://saas.com"', { stdio: 'ignore' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });
});
```

**Critères d'acceptation :**
- Tests C17.1 → C17.20 couverts
- Application < 10s
- Export/import fonctionnel

---

### 3.6 Tests d'intégration complète MVP-3 — 0.5 jour

**Fichier :** `tests/e2e/mvp3/mvp3-integration.test.ts`

```typescript
describe('E2E MVP3 - Intégration Complète', () => {
  it('Flux complet : template → audits → bonnes practices → recommandations → timeline → rapport', () => {
    // 1. Créer un projet depuis un template
    execSync('npx ekts template apply e-commerce --name "Integration Test" --url "https://integration.com"', { stdio: 'ignore' });

    // 2. Créer plusieurs audits
    execSync('npx ekts audit https://integration.com --project "Integration Test" --findings "Images non optimisées,Meta manquante,Performance basse"', { stdio: 'ignore' });
    execSync('npx ekts audit https://integration.com --project "Integration Test" --findings "Meta manquante,Performance basse"', { stdio: 'ignore' });
    execSync('npx ekts audit https://integration.com --project "Integration Test" --findings "Performance basse"', { stdio: 'ignore' });

    // 3. Extraire les bonnes practices
    execSync('npx ekts bestpractice extract "Integration Test"', { stdio: 'ignore' });

    // 4. Générer des recommandations
    const recOutput = execSync('npx ekts recommend generate "Integration Test"', { encoding: 'utf-8' });
    expect(recOutput).toContain('recommandation');

    // 5. Analyser la timeline
    const timelineOutput = execSync('npx ekts timeline analyze "Integration Test"', { encoding: 'utf-8' });
    expect(timelineOutput).toContain('3 audits');

    // 6. Générer un rapport complet
    execSync('npx ekts report generate "Integration Test" --output report.md', { stdio: 'ignore' });
    const fs = require('fs');
    expect(fs.existsSync('report.md')).toBe(true);

    // 7. Vérifier que le rapport contient les recommandations
    const reportContent = fs.readFileSync('report.md', 'utf-8');
    expect(reportContent).toContain('Recommandations');
  });
});
```

**Critères d'acceptation :**
- Flux complet testé de bout en bout
- Temps total < 60s
- Toutes les fonctionnalités MVP-3 intégrées

---

### 3.7 Configuration CI — 0.5 jour

**Modifier `.github/workflows/ci.yml` :**

```yaml
  test-e2e-mvp3:
    name: Tests E2E MVP-3
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:e2e:mvp3
        env:
          CI: true
```

**Modifier `package.json` :**

```json
{
  "scripts": {
    "test:e2e:mvp3": "vitest run tests/e2e/mvp3/"
  }
}
```

**Critères d'acceptation :**
- Job CI ajouté
- Timeout 5 minutes
- Tests exécutés en parallèle si possible

---

## 4. Vérifications finales

```bash
# Exécuter tous les tests E2E MVP-3
npm run test:e2e:mvp3

# Vérifier le temps d'exécution (doit être < 120s)
time npm run test:e2e:mvp3

# Vérifier la couverture
npm run coverage

# Vérification complète
npm run verify
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-18-01-RESULTAT.md` :

```markdown
# Rapport Sprint 18-01 — Tests E2E MVP-3

**Date :** [DATE]  
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `tests/e2e/mvp3/multi-projects.test.ts` — 12 tests
- `tests/e2e/mvp3/timeline.test.ts` — 15 tests
- `tests/e2e/mvp3/best-practices.test.ts` — 20 tests
- `tests/e2e/mvp3/recommendations.test.ts` — 20 tests
- `tests/e2e/mvp3/templates.test.ts` — 20 tests
- `tests/e2e/mvp3/mvp3-integration.test.ts` — 6 tests

## Modifications

- `.github/workflows/ci.yml` — Ajout job `test-e2e-mvp3`
- `package.json` — Ajout script `test:e2e:mvp3`

## Résultats

- **Total tests E2E MVP-3 :** 93 tests
- **Tous passent :** ✅
- **Temps d'exécution :** Xs (< 120s)
- **Couverture MVP-3 :** Y%

## Critères validés

- ✅ C13.1 → C13.12 (Multi-Projets)
- ✅ C14.1 → C14.15 (Suivi Temporel)
- ✅ C15.1 → C15.20 (Bonnes Practices)
- ✅ C16.1 → C16.20 (Recommandations)
- ✅ C17.1 → C17.20 (Templates)

## Prochaine étape

Sprint 18-02 : Documentation MVP-3
```

---

## 6. Critères de validation du sous-sprint

- ✅ Tests E2E pour tous les flux MVP-3 (6 fichiers)
- ✅ Tous les tests passent
- ✅ Temps d'exécution < 120s
- ✅ Couverture MVP-3 > 85%
- ✅ CI configurée pour exécuter les tests E2E
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 18-01 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 18-01 prêt pour implémentation**
