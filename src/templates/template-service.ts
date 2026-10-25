import type Database from 'better-sqlite3';

import { ProjectRepository } from '../data/repositories/project-repository.js';
import { RecommendationRepository } from '../recommendations/recommendation-repository.js';
import { ValidationError } from '../shared/errors.js';

import type {
  ApplyTemplateInput,
  ApplyTemplateResult,
  CreateTemplateInput,
  ProjectTemplate,
  TemplateFilters,
  UpdateTemplateInput,
  ValidationResult,
} from './template.types.js';
import { BUILTIN_TEMPLATES } from './builtin-templates.js';
import { TemplateApplier } from './template-applier.js';
import { TemplateRepository } from './template-repository.js';

/**
 * Orchestrateur des templates (Sprints 17-01 → 17-02) — façade sur
 * {@link TemplateRepository} et {@link TemplateApplier}.
 *
 * **Au démarrage** (constructeur), `seedBuiltins()` insère de façon
 * idempotente les **10 templates prédéfinis** (ADR-040, immuables) avec
 * leurs règles de recommandation (C17.2). En écart avec la spec (insertion
 * « lors de la migration » — voir `007_templates.ts`), le semis est au
 * code : ordre imposé 17-01 (schéma) → 17-02 (builtins).
 *
 * Étapes du sous-sprint 17-02 ajoutées : {@link TemplateService.applyTemplate}
 * (C17.3/C17.4) et {@link TemplateService.validateTemplate} (C17.20).
 *
 * @example
 * ```ts
 * const service = new TemplateService(db);
 * service.listTemplates({ isBuiltin: true }).length; // 10 au démarrage
 * const result = service.applyTemplate({ templateId, projectName: 'Boutique', projectUrl: 'https://x.co' });
 * ```
 */
export class TemplateService {
  /** Dépôt des templates. */
  private readonly repo: TemplateRepository;
  /** Applicateur (projet + config + bonnes pratiques). */
  private readonly applier: TemplateApplier;

  /**
   * @param db - Connexion ouverte (migrations appliquées) — le seed des
   *   builtins s'exécute ici, une seule fois, de façon idempotente.
   */
  constructor(private readonly db: Database.Database) {
    this.repo = new TemplateRepository(db);
    this.applier = new TemplateApplier(db, new ProjectRepository(db));
    this.seedBuiltins();
  }

  /**
   * Sème les 10 templates prédéfinis et leurs règles (C17.2) — idempotent :
   * no-op si des templates builtin existent déjà.
   *
   * Transaction : soit les 10 templates + ~37 règles sont insérés, soit
   * rien. En pratique appelé une fois par constructeur de service.
   */
  seedBuiltins(): void {
    if (this.repo.count({ isBuiltin: true }) > 0) {
      return;
    }

    const rules = new RecommendationRepository(this.db);
    const seed = this.db.transaction(() => {
      for (const def of BUILTIN_TEMPLATES) {
        const ruleIds = def.rules.map((rule) => rules.createRule(rule).id);
        this.repo.createBuiltin({ ...def.template, recommendationRuleIds: ruleIds }, ruleIds);
      }
    });
    seed();
  }

  /**
   * Crée un template personnalisé (C17.1).
   *
   * @param input - Données du template.
   * @returns Le template créé.
   * @throws {ValidationError} Nom vide ou catégorie inconnue.
   */
  createTemplate(input: CreateTemplateInput): ProjectTemplate {
    return this.repo.create(input);
  }

  /**
   * @param id - UUID du template.
   * @returns Le template, ou `null` (C17.20).
   */
  getTemplate(id: string): ProjectTemplate | null {
    return this.repo.getById(id);
  }

  /**
   * @param filters - Filtres optionnels.
   * @returns Templates correspondants (tri builtins → nom).
   */
  listTemplates(filters?: TemplateFilters): ProjectTemplate[] {
    return this.repo.list(filters);
  }

  /**
   * Met à jour un template (patch).
   *
   * @param id - UUID du template.
   * @param input - Champs à remplacer.
   * @returns Le template mis à jour.
   * @throws {ValidationError} Absent, builtin immuable (ADR-040), ou entrée invalide.
   */
  updateTemplate(id: string, input: UpdateTemplateInput): ProjectTemplate {
    return this.repo.update(id, input);
  }

  /**
   * Supprime un template.
   *
   * @param id - UUID du template.
   * @throws {ValidationError} Absent ou builtin immuable (ADR-040).
   */
  deleteTemplate(id: string): void {
    this.repo.delete(id);
  }

  /**
   * Applique un template pour créer un projet (C17.3) avec overrides
   * partiels (C17.4, merge ADR-041).
   *
   * @param input - Template, projet, overrides optionnels.
   * @returns Projet créé, comptages (BP, règles), durée (ms).
   * @throws {ValidationError} Template introuvable (C17.20, code 4).
   */
  applyTemplate(input: ApplyTemplateInput): ApplyTemplateResult {
    const template = this.repo.getById(input.templateId);
    if (!template) {
      throw new ValidationError([`Template introuvable : ${input.templateId}`]);
    }
    return this.applier.apply(template, input);
  }

  /**
   * Valide un template avant application (C17.20).
   *
   * @param id - UUID du template.
   * @param overrides - Overrides optionnels (contrôle du `minScore`).
   * @returns `{valid, errors, warnings}` — template absent = invalide.
   */
  validateTemplate(id: string): ValidationResult {
    const template = this.repo.getById(id);
    if (!template) {
      return { valid: false, errors: [`Template introuvable : ${id}`], warnings: [] };
    }
    return this.applier.validate(template);
  }

  /**
   * Exporte un template en JSON (C17.5).
   *
   * @param id - UUID du template.
   * @returns JSON indenté (`TemplateExport`).
   * @throws {ValidationError} Template absent.
   */
  exportTemplate(id: string): string {
    return this.repo.exportToJson(id);
  }

  /**
   * Importe un template depuis un export JSON (C17.5) : nouveau template
   * vierge (jamais de remplacement silencieux).
   *
   * @param json - Chaîne d'export.
   * @returns Le template importé.
   * @throws {ValidationError} JSON ou format invalide.
   */
  importTemplate(json: string): ProjectTemplate {
    return this.repo.importFromJson(json);
  }

  /**
   * Compte les templates (filtres sans pagination/tags).
   *
   * @param filters - Filtres optionnels.
   * @returns Nombre de templates.
   */
  countTemplates(filters?: TemplateFilters): number {
    return this.repo.count(filters);
  }

  /**
   * Connexion sous-jacente — exposée pour la CLI (17-03) et les tests.
   *
   * @returns La connexion SQLite du service.
   */
  get connection(): Database.Database {
    return this.db;
  }
}
