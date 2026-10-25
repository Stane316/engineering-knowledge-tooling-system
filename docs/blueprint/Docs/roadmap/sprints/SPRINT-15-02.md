# SPRINT-15-02 — BestPracticeExtractor, BestPracticeService et Associations

**Sprint :** 15-02 sur 15 (Sous-sprint 2/3)  
**Durée :** 3 jours  
**Statut :** ⏳ NON COMMENCÉ

---

## 1. Objectif du sous-sprint

Implémenter le moteur d'extraction automatique et l'orchestrateur :
- **BestPracticeExtractor** : Détection des patterns de constats résolus dans les audits d'un projet, création automatique de bonnes pratiques
- **BestPracticeService** : Orchestrateur (facade) qui expose les opérations de haut niveau (extraire, rechercher, lier)
- **Associations** : Lien automatique entre les findings courants et les bonnes pratiques existantes

---

## 2. Prérequis

### 2.1 État du dépôt

Avant de commencer :
```bash
# Vérifier que Sprint 15-01 est terminé
npm run verify
# Doit passer sans erreur

# Vérifier que les modules 15-01 existent
ls src/best-practices/
# Doit afficher : best-practice.types.ts, best-practice-repository.ts, best-practice-search.ts
```

### 2.2 Documents à lire

- `SPRINT-15.md` (document parent)
- `SPRINT-15-01-RESULTAT.md` (résultats du sous-sprint 1)
- `src/storage/audit-repository.ts` (lecture des audits et findings)
- `src/storage/statistics.ts` (AuditStatisticsManager)
- `src/analysis/types.ts` (types Finding, AnalysisDimension)

---

## 3. Tâches détaillées

### 3.1 Implémenter BestPracticeExtractor (7h)

**Fichier :** `src/best-practices/best-practice-extractor.ts`

```typescript
import type { Database } from 'better-sqlite3';
import type { AnalysisDimension } from '../analysis/types.js';
import type { AuditFinding, AuditMetadata } from '../storage/types.js';
import type {
  BestPractice,
  BestPracticeCategory,
  ExtractionReport,
} from './best-practice.types.js';
import { BestPracticeRepository } from './best-practice-repository.js';

/**
 * Critères minimum pour extraire une bonne pratique.
 */
export interface ExtractionCriteria {
  /** Nombre minimum d'occurrences du finding (défaut: 2). */
  minOccurrences: number;
  /** Nombre minimum d'audits du projet pour analyse (défaut: 2). */
  minAudits: number;
  /** Score minimum de confiance pour l'association (défaut: 0.5). */
  minConfidence: number;
}

const DEFAULT_CRITERIA: ExtractionCriteria = {
  minOccurrences: 2,
  minAudits: 2,
  minConfidence: 0.5,
};

/**
 * Compteur de findings regroupés.
 */
interface FindingGroup {
  /** Titre normalisé. */
  normalizedTitle: string;
  /** Titre original (premier rencontré). */
  originalTitle: string;
  /** Dimension. */
  dimension: AnalysisDimension;
  /** Nombre d'occurrences. */
  count: number;
  /** IDs des audits où le finding apparaît. */
  auditIds: number[];
  /** IDs des projets où le finding apparaît. */
  projectIds: string[];
  /** Recommandation la plus fréquente. */
  recommendation: string;
  /** Sévérité moyenne. */
  avgSeverity: number;
}

/**
 * Extracteur automatique de bonnes pratiques depuis les audits (Sprint 15).
 *
 * Algorithme :
 * 1. Collecter tous les findings des audits d'un projet
 * 2. Regrouper par (titre normalisé, dimension)
 * 3. Détecter les constats résolus : un finding disparaît entre 2 audits
 *    consécutifs ET le score de la dimension s'améliore
 * 4. Pour chaque finding résolu avec ≥ minOccurrences occurrences :
 *    créer une bonne pratique avec le titre et la recommandation
 * 5. Dédupliquer (même titre normalisé = fusion)
 * 6. Lier les findings courants aux bonnes pratiques correspondantes
 */
export class BestPracticeExtractor {
  private repo: BestPracticeRepository;
  private db: Database.Database;
  private criteria: ExtractionCriteria;

  constructor(
    db: Database.Database,
    repo: BestPracticeRepository,
    criteria?: Partial<ExtractionCriteria>,
  ) {
    this.db = db;
    this.repo = repo;
    this.criteria = { ...DEFAULT_CRITERIA, ...criteria };
  }

  /**
   * Extraire les bonnes pratiques depuis les audits d'un projet.
   */
  extractFromProject(projectId: string): ExtractionReport {
    const startTime = Date.now();

    // 1. Récupérer tous les audits du projet (triés par date)
    const audits = this.getProjectAudits(projectId);

    if (audits.length < this.criteria.minAudits) {
      return {
        auditsAnalyzed: audits.length,
        practicesExtracted: 0,
        practicesMerged: 0,
        linksCreated: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Collecter tous les findings
    const allFindings = this.getAllFindings(audits.map(a => a.id!));

    // 3. Regrouper les findings par (titre normalisé, dimension)
    const groups = this.groupFindings(allFindings, audits);

    // 4. Détecter les constats résolus
    const resolvedFindings = this.detectResolvedFindings(audits, allFindings);

    // 5. Filtrer les groupes avec suffisamment d'occurrences ET résolution
    const extractable = groups.filter(g =>
      g.count >= this.criteria.minOccurrences &&
      resolvedFindings.has(`${g.normalizedTitle}|${g.dimension}`)
    );

    // 6. Créer les bonnes pratiques
    let practicesExtracted = 0;
    let practicesMerged = 0;

    for (const group of extractable) {
      const existing = this.findExistingPractice(group.normalizedTitle, group.dimension);

      if (existing) {
        // Fusionner avec l'existant
        this.repo.incrementOccurrence(existing.id, projectId);
        practicesMerged++;
      } else {
        // Créer une nouvelle bonne pratique
        this.repo.create({
          title: group.originalTitle,
          description: group.recommendation || `Résoudre le constat : ${group.originalTitle}`,
          category: group.dimension as BestPracticeCategory,
          tags: this.extractTags(group),
          sourceProjectIds: group.projectIds,
          sourceAuditIds: group.auditIds,
          isManual: false,
        });
        practicesExtracted++;
      }
    }

    // 7. Lier les findings courants aux bonnes pratiques
    const linksCreated = this.linkCurrentFindingsToPractices(allFindings);

    return {
      auditsAnalyzed: audits.length,
      practicesExtracted,
      practicesMerged,
      linksCreated,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Récupérer les audits d'un projet triés par date.
   */
  private getProjectAudits(projectId: string): AuditMetadata[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_metadata
      WHERE project_id = ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(projectId) as AuditMetadata[];
  }

  /**
   * Récupérer tous les findings des audits donnés.
   */
  private getAllFindings(auditIds: number[]): AuditFinding[] {
    if (auditIds.length === 0) return [];

    const placeholders = auditIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM audit_findings WHERE audit_id IN (${placeholders})
    `);

    return stmt.all(...auditIds) as AuditFinding[];
  }

  /**
   * Regrouper les findings par (titre normalisé, dimension).
   */
  private groupFindings(findings: AuditFinding[], audits: AuditMetadata[]): FindingGroup[] {
    const auditProjectMap = new Map<number, string>();
    for (const audit of audits) {
      auditProjectMap.set(audit.id!, audit.project_id ?? '');
    }

    const groups = new Map<string, FindingGroup>();

    for (const finding of findings) {
      const normalized = this.normalizeTitle(finding.title);
      const key = `${normalized}|${finding.dimension}`;

      if (!groups.has(key)) {
        groups.set(key, {
          normalizedTitle: normalized,
          originalTitle: finding.title,
          dimension: finding.dimension,
          count: 0,
          auditIds: [],
          projectIds: [],
          recommendation: finding.recommendation ?? '',
          avgSeverity: 0,
        });
      }

      const group = groups.get(key)!;
      group.count++;

      if (!group.auditIds.includes(finding.auditId)) {
        group.auditIds.push(finding.auditId);
      }

      const projectId = auditProjectMap.get(finding.auditId);
      if (projectId && !group.projectIds.includes(projectId)) {
        group.projectIds.push(projectId);
      }

      // Accumuler la sévérité pour la moyenne
      group.avgSeverity = (group.avgSeverity * (group.count - 1) + finding.severity) / group.count;

      // Garder la recommandation la plus longue (plus détaillée)
      if (finding.recommendation && finding.recommendation.length > group.recommendation.length) {
        group.recommendation = finding.recommendation;
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Détecter les constats résolus :
   * Un finding est "résolu" s'il apparaît dans l'audit N mais disparaît
   * dans l'audit N+1, ET le score de la dimension s'améliore.
   */
  private detectResolvedFindings(
    audits: AuditMetadata[],
    findings: AuditFinding[],
  ): Set<string> {
    const resolved = new Set<string>();

    // Grouper les findings par audit
    const findingsByAudit = new Map<number, AuditFinding[]>();
    for (const f of findings) {
      if (!findingsByAudit.has(f.auditId)) {
        findingsByAudit.set(f.auditId, []);
      }
      findingsByAudit.get(f.auditId)!.push(f);
    }

    // Comparer les audits consécutifs
    for (let i = 0; i < audits.length - 1; i++) {
      const currentAudit = audits[i];
      const nextAudit = audits[i + 1];

      const currentFindings = findingsByAudit.get(currentAudit.id!) ?? [];
      const nextFindings = findingsByAudit.get(nextAudit.id!) ?? [];

      // Normaliser les titres du prochain audit
      const nextTitles = new Set(
        nextFindings.map(f => `${this.normalizeTitle(f.title)}|${f.dimension}`)
      );

      // Vérifier si les findings courants ont disparu dans le prochain audit
      for (const finding of currentFindings) {
        const key = `${this.normalizeTitle(finding.title)}|${finding.dimension}`;

        if (!nextTitles.has(key)) {
          // Le finding a disparu — vérifier l'amélioration du score
          const scoreImproved = this.checkScoreImprovement(
            currentAudit.id!,
            nextAudit.id!,
            finding.dimension,
          );

          if (scoreImproved) {
            resolved.add(key);
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Vérifier si le score d'une dimension s'est amélioré entre 2 audits.
   */
  private checkScoreImprovement(
    auditIdFrom: number,
    auditIdTo: number,
    dimension: AnalysisDimension,
  ): boolean {
    const stmt = this.db.prepare(`
      SELECT score FROM audit_dimensions
      WHERE audit_id = ? AND dimension = ?
    `);

    const from = stmt.get(auditIdFrom, dimension) as { score: number } | undefined;
    const to = stmt.get(auditIdTo, dimension) as { score: number } | undefined;

    if (!from || !to) return false;

    // Amélioration = score augmente
    return to.score > from.score;
  }

  /**
   * Trouver une bonne pratique existante par titre normalisé et dimension.
   */
  private findExistingPractice(normalizedTitle: string, dimension: AnalysisDimension): BestPractice | null {
    const all = this.repo.list({ category: dimension as BestPracticeCategory, limit: 1000 });

    for (const bp of all) {
      if (this.normalizeTitle(bp.title) === normalizedTitle && bp.category === dimension) {
        return bp;
      }
    }

    return null;
  }

  /**
   * Lier les findings courants aux bonnes pratiques correspondantes.
   */
  private linkCurrentFindingsToPractices(findings: AuditFinding[]): number {
    let linksCreated = 0;

    // Grouper les findings uniques par (titre, dimension)
    const uniqueFindings = new Map<string, AuditFinding>();
    for (const f of findings) {
      const key = `${this.normalizeTitle(f.title)}|${f.dimension}`;
      if (!uniqueFindings.has(key)) {
        uniqueFindings.set(key, f);
      }
    }

    for (const [key, finding] of uniqueFindings) {
      const practices = this.repo.findByFinding(finding.title, finding.dimension);

      if (practices.length > 0) {
        // Déjà lié — skip
        continue;
      }

      // Chercher les bonnes pratiques correspondantes
      const matchingPractices = this.findMatchingPractices(finding);

      for (const practice of matchingPractices) {
        const confidence = this.calculateConfidence(finding, practice);
        if (confidence >= this.criteria.minConfidence) {
          this.repo.linkToFinding(practice.id, finding.title, finding.dimension, confidence);
          linksCreated++;
        }
      }
    }

    return linksCreated;
  }

  /**
   * Trouver les bonnes pratiques qui correspondent à un finding.
   */
  private findMatchingPractices(finding: AuditFinding): BestPractice[] {
    const normalized = this.normalizeTitle(finding.title);
    const all = this.repo.list({ category: finding.dimension as BestPracticeCategory, limit: 1000 });

    return all.filter(bp => this.normalizeTitle(bp.title) === normalized);
  }

  /**
   * Calculer la confiance d'une association finding ↔ bonne pratique.
   */
  private calculateConfidence(finding: AuditFinding, practice: BestPractice): number {
    let confidence = 0.5; // Base

    // Plus la bonne pratique a d'occurrences, plus la confiance est haute
    confidence += Math.min(0.3, practice.occurrenceCount * 0.05);

    // Plus la sévérité est élevée, plus la confiance est haute
    confidence += finding.severity * 0.05;

    return Math.min(1.0, confidence);
  }

  /**
   * Normaliser un titre de finding pour le regroupement.
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extraire des tags depuis un groupe de findings.
   */
  private extractTags(group: FindingGroup): string[] {
    const tags: string[] = [group.dimension];

    // Extraire des mots-clés du titre
    const words = group.originalTitle
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3);

    if (words.length > 0) {
      tags.push(words[0]);
    }

    if (group.avgSeverity >= 3) {
      tags.push('high-severity');
    }

    return [...new Set(tags)];
  }
}
```

**Critères d'acceptation :**
- Extraction automatique depuis les audits d'un projet
- Détection des constats résolus (disparition + amélioration score)
- Regroupement par titre normalisé
- Déduplication (fusion si même titre normalisé)
- Compteur d'occurrences incrémenté pour les fusions
- Association automatique findings ↔ bonnes pratiques
- Score de confiance calculé
- Critères configurables (minOccurrences, minAudits, minConfidence)
- Rapport d'extraction (auditsAnalyzed, practicesExtracted, etc.)
- Gestion des cas limites (0 audit, 1 audit, aucun finding résolu)

---

### 3.2 Implémenter BestPracticeService (4h)

**Fichier :** `src/best-practices/best-practice-service.ts`

```typescript
import type { Database } from 'better-sqlite3';
import type { AnalysisDimension } from '../analysis/types.js';

import type {
  BestPractice,
  BestPracticeFilters,
  BestPracticeSearchOptions,
  BestPracticeSearchResult,
  CreateBestPracticeInput,
  ExtractionReport,
  UpdateBestPracticeInput,
} from './best-practice.types.js';
import { BestPracticeExtractor, type ExtractionCriteria } from './best-practice-extractor.js';
import { BestPracticeRepository } from './best-practice-repository.js';
import { BestPracticeSearch } from './best-practice-search.js';

/**
 * Orchestrateur des bonnes pratiques (Sprint 15).
 *
 * Expose les opérations de haut niveau :
 * - CRUD des bonnes pratiques
 * - Recherche hybride
 * - Extraction automatique
 * - Gestion des associations
 */
export class BestPracticeService {
  private repo: BestPracticeRepository;
  private search: BestPracticeSearch;
  private extractor: BestPracticeExtractor;

  constructor(db: Database.Database, criteria?: Partial<ExtractionCriteria>) {
    this.repo = new BestPracticeRepository(db);
    this.search = new BestPracticeSearch(db, this.repo);
    this.extractor = new BestPracticeExtractor(db, this.repo, criteria);
  }

  // --- CRUD ---

  /**
   * Créer une bonne pratique manuellement.
   */
  create(input: CreateBestPracticeInput): BestPractice {
    return this.repo.create({ ...input, isManual: true });
  }

  /**
   * Récupérer une bonne pratique par ID.
   */
  getById(id: string): BestPractice | null {
    return this.repo.getById(id);
  }

  /**
   * Lister les bonnes pratiques avec filtres.
   */
  list(filters?: BestPracticeFilters): BestPractice[] {
    return this.repo.list(filters);
  }

  /**
   * Mettre à jour une bonne pratique.
   */
  update(id: string, input: UpdateBestPracticeInput): BestPractice {
    return this.repo.update(id, input);
  }

  /**
   * Supprimer une bonne pratique.
   */
  delete(id: string): void {
    this.repo.delete(id);
  }

  /**
   * Compter les bonnes pratiques.
   */
  count(filters?: BestPracticeFilters): number {
    return this.repo.count(filters);
  }

  // --- Recherche ---

  /**
   * Rechercher des bonnes pratiques (hybride ou filtrée).
   */
  searchPractices(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    return this.search.search(options);
  }

  // --- Extraction ---

  /**
   * Extraire les bonnes pratiques depuis les audits d'un projet.
   */
  extractFromProject(projectId: string): ExtractionReport {
    return this.extractor.extractFromProject(projectId);
  }

  // --- Associations ---

  /**
   * Lier manuellement un finding à une bonne pratique.
   */
  linkToFinding(bestPracticeId: string, findingTitle: string, dimension: AnalysisDimension, confidence?: number): void {
    this.repo.linkToFinding(bestPracticeId, findingTitle, dimension, confidence);
  }

  /**
   * Délier un finding d'une bonne pratique.
   */
  unlinkFromFinding(bestPracticeId: string, findingTitle: string, dimension: AnalysisDimension): void {
    this.repo.unlinkFromFinding(bestPracticeId, findingTitle, dimension);
  }

  /**
   * Trouver les bonnes pratiques associées à un finding.
   */
  findByFinding(findingTitle: string, dimension: AnalysisDimension): BestPractice[] {
    return this.repo.findByFinding(findingTitle, dimension);
  }

  /**
   * Trouver les findings associés à une bonne pratique.
   */
  findLinkedFindings(bestPracticeId: string) {
    return this.repo.findLinkedFindings(bestPracticeId);
  }
}
```

**Critères d'acceptation :**
- API de haut niveau (facade) simplifiant l'utilisation
- CRUD complet délégué au repository
- Recherche déléguée au search
- Extraction déléguée à l'extractor
- Gestion des associations
- Instanciation en une ligne (`new BestPracticeService(db)`)

---

### 3.3 Tests unitaires BestPracticeExtractor (6h)

**Fichier :** `tests/best-practices/best-practice-extractor.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

import { BestPracticeExtractor } from '../../src/best-practices/best-practice-extractor.js';
import { BestPracticeRepository } from '../../src/best-practices/best-practice-repository.js';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';

describe('BestPracticeExtractor', () => {
  let db: Database.Database;
  let repo: BestPracticeRepository;
  let extractor: BestPracticeExtractor;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');

    // Créer le schéma complet
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT,
        created_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        url TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        overall_score REAL NOT NULL DEFAULT 0,
        total_findings INTEGER NOT NULL DEFAULT 0,
        critical_findings INTEGER NOT NULL DEFAULT 0,
        high_findings INTEGER NOT NULL DEFAULT 0,
        medium_findings INTEGER NOT NULL DEFAULT 0,
        low_findings INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_dimensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL,
        score INTEGER NOT NULL,
        findings_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id INTEGER NOT NULL,
        dimension TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        severity INTEGER NOT NULL DEFAULT 0,
        effort INTEGER NOT NULL DEFAULT 1,
        impact INTEGER NOT NULL DEFAULT 1,
        priority TEXT NOT NULL DEFAULT 'low',
        recommendation TEXT,
        FOREIGN KEY (audit_id) REFERENCES audit_metadata(id)
      )
    `);

    migration006CreateBestPractices(db);

    // Insérer un projet
    db.prepare('INSERT INTO projects (id, name, url, created_at) VALUES (?, ?, ?, ?)')
      .run('proj-1', 'Projet Test', 'https://example.com', new Date().toISOString());

    repo = new BestPracticeRepository(db);
    extractor = new BestPracticeExtractor(db, repo);
  });

  afterEach(() => {
    db.close();
  });

  function insertAudit(projectId: string, timestamp: string, scores: Record<string, number>): number {
    const result = db.prepare(`
      INSERT INTO audit_metadata (project_id, url, timestamp)
      VALUES (?, ?, ?)
    `).run(projectId, 'https://example.com', timestamp);
    const auditId = Number(result.lastInsertRowid);

    for (const [dimension, score] of Object.entries(scores)) {
      db.prepare(`
        INSERT INTO audit_dimensions (audit_id, dimension, score, findings_count)
        VALUES (?, ?, ?, 0)
      `).run(auditId, dimension, score);
    }

    return auditId;
  }

  function insertFinding(auditId: number, dimension: string, title: string, severity: number, recommendation?: string): void {
    db.prepare(`
      INSERT INTO audit_findings (audit_id, dimension, title, severity, recommendation)
      VALUES (?, ?, ?, ?, ?)
    `).run(auditId, dimension, title, severity, recommendation ?? `Fix: ${title}`);
  }

  it('ne devrait rien extraire avec < 2 audits', () => {
    const auditId = insertAudit('proj-1', '2024-01-01', { performance: 80 });
    insertFinding(auditId, 'performance', 'Images non optimisées', 2);

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0);
    expect(report.auditsAnalyzed).toBe(1);
  });

  it('devrait extraire un finding résolu récurrent', () => {
    // Audit 1 : finding présent, score 70
    const audit1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);

    // Audit 2 : finding présent à nouveau (2e occurrence)
    const audit2 = insertAudit('proj-1', '2024-02-01', { performance: 72 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);

    // Audit 3 : finding disparu + score amélioré → résolu
    const audit3 = insertAudit('proj-1', '2024-03-01', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(1);
    expect(report.auditsAnalyzed).toBe(3);

    // Vérifier que la bonne pratique a été créée
    const practices = repo.list({ category: 'performance' });
    expect(practices).toHaveLength(1);
    expect(practices[0].title).toBe('Images non optimisées');
    expect(practices[0].isManual).toBe(false);
  });

  it('ne devrait pas extraire si le score ne s\'améliore pas', () => {
    const audit1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);

    const audit2 = insertAudit('proj-1', '2024-02-01', { performance: 72 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);

    // Audit 3 : finding disparu mais score identique
    insertAudit('proj-1', '2024-03-01', { performance: 72 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0);
  });

  it('devrait fusionner avec une bonne pratique existante', () => {
    // Créer une bonne pratique existante
    repo.create({
      title: 'Images non optimisées',
      description: 'Optimiser les images',
      category: 'performance',
      isManual: true,
    });

    const audit1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(audit1, 'performance', 'Images non optimisées', 2);

    const audit2 = insertAudit('proj-1', '2024-02-01', { performance: 75 });
    insertFinding(audit2, 'performance', 'Images non optimisées', 2);

    insertAudit('proj-1', '2024-03-01', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0); // Pas de nouvelle
    expect(report.practicesMerged).toBe(1); // Fusion

    const practices = repo.list({ category: 'performance' });
    expect(practices).toHaveLength(1);
    expect(practices[0].occurrenceCount).toBe(2); // Incrémenté
  });

  it('ne devrait pas extraire si le finding n\'apparaît qu\'une fois', () => {
    const audit1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(audit1, 'performance', 'Rare finding', 2);

    const audit2 = insertAudit('proj-1', '2024-02-01', { performance: 80 });
    // Pas de finding dans audit 2

    const report = extractor.extractFromProject('proj-1');
    expect(report.practicesExtracted).toBe(0);
  });

  it('devrait mesurer la durée d\'exécution', () => {
    const audit1 = insertAudit('proj-1', '2024-01-01', { performance: 70 });
    insertFinding(audit1, 'performance', 'Test', 2);
    const audit2 = insertAudit('proj-1', '2024-02-01', { performance: 80 });
    insertFinding(audit2, 'performance', 'Test', 2);
    insertAudit('proj-1', '2024-03-01', { performance: 85 });

    const report = extractor.extractFromProject('proj-1');
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
    expect(report.durationMs).toBeLessThan(5000);
  });
});
```

**Critères d'acceptance :**
- Tests extraction avec ≥ 2 audits
- Tests détection constats résolus (disparition + amélioration)
- Tests non-extraction si score ne s'améliore pas
- Tests fusion avec bonne pratique existante
- Tests non-extraction si finding apparaît < 2 fois
- Tests durée d'exécution
- Couverture > 80%

---

### 3.4 Tests unitaires BestPracticeService (3h)

**Fichier :** `tests/best-practices/best-practice-service.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

import { BestPracticeService } from '../../src/best-practices/best-practice-service.js';
import { migration006CreateBestPractices } from '../../src/storage/migrations/006_create_best_practices.js';

describe('BestPracticeService', () => {
  let db: Database.Database;
  let service: BestPracticeService;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    migration006CreateBestPractices(db);
    service = new BestPracticeService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('CRUD', () => {
    it('devrait créer une bonne pratique manuelle', () => {
      const bp = service.create({
        title: 'Test BP',
        description: 'Description',
        category: 'performance',
        tags: ['test'],
      });

      expect(bp.isManual).toBe(true);
      expect(bp.title).toBe('Test BP');
    });

    it('devrait lister, récupérer, mettre à jour, supprimer', () => {
      const bp = service.create({ title: 'BP1', description: 'D', category: 'seo' });

      expect(service.list()).toHaveLength(1);
      expect(service.getById(bp.id)?.title).toBe('BP1');

      service.update(bp.id, { title: 'Updated' });
      expect(service.getById(bp.id)?.title).toBe('Updated');

      service.delete(bp.id);
      expect(service.getById(bp.id)).toBeNull();
    });
  });

  describe('Recherche', () => {
    it('devrait rechercher par texte', () => {
      service.create({
        title: 'Optimiser les images',
        description: 'Convertir en WebP',
        category: 'performance',
      });

      const results = service.searchPractices({ query: 'images' });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait lister sans requête', () => {
      service.create({ title: 'BP1', description: 'D', category: 'seo' });
      service.create({ title: 'BP2', description: 'D', category: 'performance' });

      const results = service.searchPractices({});
      expect(results).toHaveLength(2);
    });
  });

  describe('Associations', () => {
    it('devrait lier et retrouver', () => {
      const bp = service.create({ title: 'BP', description: 'D', category: 'performance' });

      service.linkToFinding(bp.id, 'perf-lcp-slow', 'performance', 0.9);

      const found = service.findByFinding('perf-lcp-slow', 'performance');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(bp.id);
    });

    it('devrait délier', () => {
      const bp = service.create({ title: 'BP', description: 'D', category: 'performance' });

      service.linkToFinding(bp.id, 'perf-lcp-slow', 'performance');
      service.unlinkFromFinding(bp.id, 'perf-lcp-slow', 'performance');

      const found = service.findByFinding('perf-lcp-slow', 'performance');
      expect(found).toHaveLength(0);
    });
  });

  describe('Comptage', () => {
    it('devrait compter toutes les bonnes pratiques', () => {
      service.create({ title: 'BP1', description: 'D', category: 'seo' });
      service.create({ title: 'BP2', description: 'D', category: 'performance' });

      expect(service.count()).toBe(2);
      expect(service.count({ category: 'seo' })).toBe(1);
    });
  });
});
```

**Critères d'acceptance :**
- Tests CRUD via le service
- Tests recherche
- Tests associations
- Tests comptage
- Couverture > 85%

---

## 4. Vérifications finales

### 4.1 Compilation et lint

```bash
npm run typecheck
npm run lint
```

### 4.2 Tests

```bash
npm test -- tests/best-practices/
```

### 4.3 Couverture

```bash
npm run coverage -- tests/best-practices/
```

---

## 5. Rapport de sous-sprint

Créer `SPRINT-15-02-RESULTAT.md` avec :

```markdown
# Rapport Sprint 15-02 — Extractor + Service

**Date :** [DATE]
**Statut :** ✅ TERMINÉ

## Fichiers créés

- `src/best-practices/best-practice-extractor.ts`
- `src/best-practices/best-practice-service.ts`
- `tests/best-practices/best-practice-extractor.test.ts`
- `tests/best-practices/best-practice-service.test.ts`

## Tests exécutés

- BestPracticeExtractor : X tests ✅
- BestPracticeService : Y tests ✅
- Couverture : Z%

## Décisions prises

1. [Décision 1]
2. [Décision 2]

## Problèmes rencontrés

1. [Problème 1] → [Solution]

## Prochaine étape

Sprint 15-03 : CLI + MCP + Tests intégration + Documentation
```

---

## 6. Critères de validation du sous-sprint

- ✅ `BestPracticeExtractor` implémenté (détection constats résolus, extraction, déduplication)
- ✅ `BestPracticeService` implémenté (facade avec CRUD + recherche + extraction + associations)
- ✅ Critères d'extraction configurables
- ✅ Rapport d'extraction (auditsAnalyzed, practicesExtracted, etc.)
- ✅ Tests unitaires complets
- ✅ Couverture > 80%
- ✅ `npm run verify` passe
- ✅ Rapport de sous-sprint rédigé

---

**Document rédigé le 25 octobre 2026 — Sprint 15-02 du projet EKTS**  
**Statut : ⏳ Dossier Sprint 15-02 prêt pour implémentation**
