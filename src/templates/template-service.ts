import type Database from 'better-sqlite3';

import type {
  CreateTemplateInput,
  ProjectTemplate,
  TemplateFilters,
  UpdateTemplateInput,
} from './template.types.js';
import { TemplateRepository } from './template-repository.js';

/**
 * Orchestrateur des templates (Sprint 17-01) — façade sur
 * {@link TemplateRepository}.
 *
 * **Découpage (écart P3 vs spec)** : la spec 17-01 §3.4 montrait déjà le
 * service complet avec `TemplateApplier` (dont l'implémentation est
 * assignée au Sprint 17-02, et dont le projet dépend — ordre inverse).
 * Respect du découpage du prompt : en 17-01, seuls CRUD/filtres/export/
 * import/count sont exposés ; **`applyTemplate`/`validateTemplate`/
 * `seedBuiltins` seront ajoutés en 17-02** avec l'applier (tests
 * d'application déplacés dans ce sous-sprint).
 *
 * @example
 * ```ts
 * const service = new TemplateService(db);
 * const t = service.createTemplate({ name: 'Perso', description: '', category: 'custom' });
 * const all = service.listTemplates({ isBuiltin: false });
 * ```
 */
export class TemplateService {
  /** Dépôt des templates. */
  private readonly repo: TemplateRepository;

  /**
   * @param db - Connexion ouverte (migrations appliquées).
   */
  constructor(private readonly db: Database.Database) {
    this.repo = new TemplateRepository(db);
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
   * Connexion sous-jacente — exposée pour les prochaines états (seed
   * builtins, applier) sans changer le constructeur dans 17-02.
   *
   * @returns La connexion SQLite du service.
   */
  get connection(): Database.Database {
    return this.db;
  }
}
