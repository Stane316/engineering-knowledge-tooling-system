import type Database from 'better-sqlite3';

import type { ProjectRepository } from '../data/repositories/project-repository.js';

import type {
  ApplyTemplateInput,
  ApplyTemplateResult,
  ProjectTemplate,
  TemplateConfig,
  TemplateOverrides,
  ValidationResult,
} from './template.types.js';

/**
 * Applicateur de templates (Sprint 17-02) — applique un template à un
 * projet avec personnalisation optionnelle (ADR-041).
 *
 * Étapes de {@link TemplateApplier.apply} :
 * 1. **projet** créé via `ProjectRepository.create` (overrides priorires :
 *    nom, description, `url` en métadonnées) ;
 * 2. **config** fusionnée (merge des sous-objets, tags concaténés,
 *    `priorityDimensions` remplacées) et persistée dans `project_config`
 *    (migration 008) ;
 * 3. **bonnes pratiques** du template associées : `source_project_ids`
 *    enrichi du nouveau projet (dédupliqué) ;
 * 4. **règles** : comptées (créées au seed des builtins, voir plus bas).
 *
 * **Écarts P3 (spec vs code)** :
 * - `projects` n'a pas de colonne `url` → stockée dans `metadata.url` ;
 * - la spec laissait `rulesCreated = 0` en attendant « le TemplateService
 *   avec le RecommendationEngine » — ici le champ compte les règles du
 *   template **réellement présentes et actives** dans `recommendation_rules`
 *   (les builtins sont semés avec leurs règles : `007_templates` ne crée
 *   que le schéma) ;
 * - `projectRepo` : chemin maison `src/data/repositories/` (spec :
 *   `../storage/`) ; `RecommendationEngine` non injecté (inutilisé dans
 *   le spec).
 *
 * Performance (C17.13) : opérations SQL bornées (1 insert projet, 1 upsert
 * config, N updates BP) — ms et non secondes.
 *
 * @example
 * ```ts
 * const applier = new TemplateApplier(db, projectRepo);
 * const result = applier.apply(template, { templateId: template.id, projectName: 'Boutique', projectUrl: 'https://x.co' });
 * ```
 */
export class TemplateApplier {
  /**
   * @param db - Connexion SQLite (tables `project_config`, `best_practices`).
   * @param projectRepo - Dépôt de projets (création de l'étape 1).
   */
  constructor(
    private readonly db: Database.Database,
    private readonly projectRepo: ProjectRepository,
  ) {}

  /**
   * Applique un template pour créer un projet (C17.3).
   *
   * @param template - Template appliqué (déjà résolu par le service).
   * @param input - Projet à créer + overrides optionnels (C17.4).
   * @returns Projet créé, template, comptages et durée (ms).
   * @throws {Error} Projet invalide (`ProjectRepository.create`) — le
   *   service valide l'existence du template avant l'appel.
   */
  apply(template: ProjectTemplate, input: ApplyTemplateInput): ApplyTemplateResult {
    const startTime = Date.now();

    // 1. Projet (overrides prioritaires ; url en métadonnées — P3).
    const projectUrl = input.overrides?.projectUrl ?? input.projectUrl;
    const metadata: Record<string, unknown> = {};
    if (projectUrl) {
      metadata.url = projectUrl;
    }
    const project = this.projectRepo.create({
      name: input.overrides?.projectName ?? input.projectName,
      description:
        input.overrides?.projectDescription ?? input.projectDescription ?? template.description,
      metadata,
    });

    // 2. Configuration fusionnée → table project_config (migration 008).
    const config = this.mergeConfig(template.config, input.overrides);
    this.db
      .prepare(
        `INSERT INTO project_config (project_id, config, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(project_id) DO UPDATE SET
           config = excluded.config, updated_at = excluded.updated_at`,
      )
      .run(project.id, JSON.stringify(config), new Date().toISOString());

    // 3. Bonnes pratiques associées (+ ajouts des overrides, ADR-041).
    const bestPracticeIds = [
      ...new Set([
        ...template.bestPracticeIds,
        ...(input.overrides?.additionalBestPracticeIds ?? []),
      ]),
    ];
    const bestPracticesAssociated = bestPracticeIds.length
      ? this.associateBestPractices(project.id, bestPracticeIds)
      : 0;

    // 4. Règles du template réellement présentes et actives (P3 : les
    //    builtins sont semés avec leurs règles, rien à créer ici).
    const ruleIds = [
      ...new Set([
        ...template.recommendationRuleIds,
        ...(input.overrides?.additionalRuleIds ?? []),
      ]),
    ];
    const rulesCreated = this.countActiveRules(ruleIds);

    return {
      projectId: project.id,
      projectName: project.name,
      templateId: template.id,
      bestPracticesAssociated,
      rulesCreated,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Fusionne la config du template avec les overrides (ADR-041) :
   * sous-objets fusionnés clé par clé, tableaux (`priorityDimensions`)
   * remplacés, `tags` concaténés.
   *
   * @param base - Config du template.
   * @param overrides - Overrides partiels fournis à l'application.
   * @returns Nouvelle config fusionnée (jamais mutée).
   */
  mergeConfig(base: TemplateConfig, overrides?: TemplateOverrides): TemplateConfig {
    const config: TemplateConfig = {
      ...base,
      ...(base.alertThresholds && overrides?.config?.alertThresholds
        ? { alertThresholds: { ...base.alertThresholds, ...overrides.config.alertThresholds } }
        : overrides?.config?.alertThresholds
          ? { alertThresholds: overrides.config.alertThresholds }
          : {}),
      ...(base.extractionCriteria && overrides?.config?.extractionCriteria
        ? {
            extractionCriteria: {
              ...base.extractionCriteria,
              ...overrides.config.extractionCriteria,
            },
          }
        : overrides?.config?.extractionCriteria
          ? { extractionCriteria: overrides.config.extractionCriteria }
          : {}),
      ...(base.recommendationOptions && overrides?.config?.recommendationOptions
        ? {
            recommendationOptions: {
              ...base.recommendationOptions,
              ...overrides.config.recommendationOptions,
            },
          }
        : overrides?.config?.recommendationOptions
          ? { recommendationOptions: overrides.config.recommendationOptions }
          : {}),
      ...(overrides?.config?.priorityDimensions
        ? { priorityDimensions: overrides.config.priorityDimensions }
        : {}),
      ...(overrides?.config?.tags
        ? { tags: [...(base.tags ?? []), ...overrides.config.tags] }
        : {}),
      ...(overrides?.config?.author ? { author: overrides.config.author } : {}),
      ...(overrides?.config?.version ? { version: overrides.config.version } : {}),
    };
    return config;
  }

  /**
   * Valide un template avant application (C17.20).
   *
   * Erreurs bloquantes : nom/description manquants, `minScore` hors
   * [0, 100] (template ou override). Avertissements : seuil de régression
   * inhabituel, bonnes pratiques absentes (ignorées à l'application).
   *
   * @param template - Template à valider.
   * @param overrides - Overrides optionnels (minScore contrôlé aussi).
   * @returns `{valid, errors, warnings}`.
   */
  validate(template: ProjectTemplate, overrides?: TemplateOverrides): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Le nom du template est requis');
    }
    if (!template.description || template.description.trim().length === 0) {
      errors.push('La description du template est requise');
    }

    if (template.config.alertThresholds) {
      const { regressionPoints, minScore } = template.config.alertThresholds;
      if (regressionPoints !== undefined && (regressionPoints < 1 || regressionPoints > 50)) {
        warnings.push(`Seuil de régression inhabituel (${regressionPoints})`);
      }
      if (minScore !== undefined && (minScore < 0 || minScore > 100)) {
        errors.push(`Le score plancher (${minScore}) doit être compris entre 0 et 100`);
      }
    }

    for (const bpId of template.bestPracticeIds) {
      const bp = this.db.prepare('SELECT id FROM best_practices WHERE id = ?').get(bpId);
      if (!bp) {
        warnings.push(`Bonne pratique ${bpId} introuvable (elle sera ignorée)`);
      }
    }

    if (overrides?.config?.alertThresholds?.minScore !== undefined) {
      const score = overrides.config.alertThresholds.minScore;
      if (score < 0 || score > 100) {
        errors.push(`L'override du score plancher (${score}) doit être compris entre 0 et 100`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Enrichit `source_project_ids` de chaque bonne pratique du projet
   * (dédupliqué) et compte les associations effectives.
   *
   * @param projectId - Projet créé.
   * @param bestPracticeIds - IDs de bonnes pratiques à associer.
   * @returns Nombre de BP réellement mises à jour (les absentes sont
   *   ignorées — warning au `validate`).
   */
  private associateBestPractices(projectId: string, bestPracticeIds: string[]): number {
    let count = 0;
    const now = new Date().toISOString();

    for (const bpId of bestPracticeIds) {
      const bp = this.db
        .prepare('SELECT source_project_ids FROM best_practices WHERE id = ?')
        .get(bpId) as { source_project_ids: string } | undefined;
      if (!bp) {
        continue;
      }
      const projectIds = JSON.parse(bp.source_project_ids || '[]') as string[];
      if (!projectIds.includes(projectId)) {
        projectIds.push(projectId);
        this.db
          .prepare('UPDATE best_practices SET source_project_ids = ?, updated_at = ? WHERE id = ?')
          .run(JSON.stringify(projectIds), now, bpId);
        count++;
      }
    }

    return count;
  }

  /**
   * Compte les règles du template présentes et actives.
   *
   * @param ruleIds - IDs de règles liées au template.
   * @returns Nombre de règles actives.
   */
  private countActiveRules(ruleIds: string[]): number {
    if (ruleIds.length === 0) {
      return 0;
    }
    const placeholders = ruleIds.map(() => '?').join(', ');
    const row = this.db
      .prepare(
        `SELECT COUNT(*) AS count FROM recommendation_rules
         WHERE id IN (${placeholders}) AND is_active = 1`,
      )
      .get(...ruleIds) as { count: number };
    return row.count;
  }
}
