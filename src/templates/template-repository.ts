import { randomUUID } from 'node:crypto';

import type Database from 'better-sqlite3';

import { ValidationError } from '../shared/errors.js';

import type {
  CreateTemplateInput,
  ProjectTemplate,
  TemplateConfig,
  TemplateExport,
  TemplateFilters,
  TemplateCategory,
  UpdateTemplateInput,
} from './template.types.js';
import { TEMPLATE_CATEGORIES } from './template.types.js';

/**
 * Dépôt des templates de projets (Sprint 17-01) — table
 * `project_templates` (migration 007).
 *
 * Points de la spec (SPRINT-17-01.md §3.3) :
 * - CRUD complet (create, getById, list, update, delete, count) ;
 * - **protection des builtins** (ADR-040) : `update`/`delete` sur un
 *   template `isBuiltin` lèvent une erreur — en écart avec la spec (qui
 *   lève `Error` brut), ici `ValidationError` → code CLI 4 (cf. §Codes) ;
 * - export/import JSON (`TemplateExport`, C17.5) : l'import crée un
 *   **nouveau** template dans `custom` — jamais de remplacement silencieux ;
 * - filtres (category, isBuiltin, tags, limit/offset, tri
 *   builtins→nom) — `tags` filtrés **côté application** (ADR-039 : pas de
 *   requête SQL sur le JSON `config`).
 *
 * **Écarts P3 vs spec** :
 * - erreurs maison `ValidationError` (code 4) au lieu d'`Error` générique ;
 * - types en `row as` bien typés et validations d'entrée (name/catégorie)
 *   ajoutées (conventions maison) ;
 * - `tags` : post-filtre SQL → tri/filtre de mémoire (la spec ignorait
 *   `filters.tags`).
 *
 * @example
 * ```ts
 * const repo = new TemplateRepository(db);
 * const t = repo.create({ name: 'Mon template', description: 'Perso', category: 'custom' });
 * ```
 */
export class TemplateRepository {
  /** Connexion SQLite (better-sqlite3, synchrone). */
  private readonly db: Database.Database;

  /**
   * @param db - Connexion ouverte (migrations déjà appliquées).
   */
  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Crée un template (jamais builtin : `isBuiltin = 0` forcé ici, les
   * prédéfinis passent par `seedBuiltins` — 17-02).
   *
   * @param input - Données du template (config/listes défaillent à `[]`/`{}`).
   * @returns Le template créé (UUID + horodatages).
   * @throws {ValidationError} Nom vide ou catégorie inconnue.
   */
  create(input: CreateTemplateInput): ProjectTemplate {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new ValidationError(['name ne peut pas être vide']);
    }
    this.assertCategory(input.category);

    const now = new Date().toISOString();
    const id = randomUUID();

    this.db
      .prepare(
        `INSERT INTO project_templates (
           id, name, description, category, config,
           best_practice_ids, recommendation_rule_ids, is_builtin,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .run(
        id,
        name,
        input.description,
        input.category,
        JSON.stringify(input.config ?? {}),
        JSON.stringify(input.bestPracticeIds ?? []),
        JSON.stringify(input.recommendationRuleIds ?? []),
        now,
        now,
      );

    return this.getById(id)!;
  }

  /**
   * @param id - UUID du template.
   * @returns Le template, ou `null` si absent.
   */
  getById(id: string): ProjectTemplate | null {
    const row = this.db.prepare('SELECT * FROM project_templates WHERE id = ?').get(id) as
      Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : null;
  }

  /**
   * Liste les templates (tri : builtins d'abord, puis nom).
   *
   * @param filters - Filtres optionnels (category, isBuiltin, tags, pagination).
   * @returns Jusqu'à `limit` templates (défaut 100).
   */
  list(filters: TemplateFilters = {}): ProjectTemplate[] {
    let query = 'SELECT * FROM project_templates WHERE 1=1';
    const params: unknown[] = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.isBuiltin !== undefined) {
      query += ' AND is_builtin = ?';
      params.push(filters.isBuiltin ? 1 : 0);
    }

    query += ' ORDER BY is_builtin DESC, name ASC';

    // Pagination SQL uniquement sans tags (tags = post-filtre mémoire —
    // la limite s'applique donc APRES filtrage pour rester correcte).
    const postFilter = filters.tags !== undefined && filters.tags.length > 0;
    if (!postFilter) {
      query += ' LIMIT ? OFFSET ?';
      params.push(filters.limit ?? 100);
      params.push(filters.offset ?? 0);
    }

    let rows = (this.db.prepare(query).all(...params) as Record<string, unknown>[]).map((r) =>
      this.mapRow(r),
    );

    if (postFilter) {
      const tags = filters.tags!;
      rows = rows.filter((t) => {
        const templateTags = t.config.tags ?? [];
        return tags.every((tag) => templateTags.includes(tag));
      });
      const offset = filters.offset ?? 0;
      rows = rows.slice(offset, offset + (filters.limit ?? 100));
    }

    return rows;
  }

  /**
   * Met à jour un template (patch : seuls les champs fournis changent).
   *
   * @param id - UUID du template.
   * @param input - Champs à remplacer.
   * @returns Le template mis à jour.
   * @throws {ValidationError} Template absent, **builtin immuable**
   *   (ADR-040), ou entrée invalide (nom vide / catégorie inconnue).
   */
  update(id: string, input: UpdateTemplateInput): ProjectTemplate {
    const existing = this.getById(id);
    if (!existing) {
      throw new ValidationError([`Template introuvable : ${id}`]);
    }
    if (existing.isBuiltin) {
      throw new ValidationError([
        `Le template builtin « ${existing.name} » est immuable (ADR-040) — dupliquez-le en custom pour le modifier`,
      ]);
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new ValidationError(['name ne peut pas être vide']);
    }
    if (input.category !== undefined) {
      this.assertCategory(input.category);
    }

    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      params.push(input.name.trim());
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description);
    }
    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category);
    }
    if (input.config !== undefined) {
      fields.push('config = ?');
      params.push(JSON.stringify(input.config));
    }
    if (input.bestPracticeIds !== undefined) {
      fields.push('best_practice_ids = ?');
      params.push(JSON.stringify(input.bestPracticeIds));
    }
    if (input.recommendationRuleIds !== undefined) {
      fields.push('recommendation_rule_ids = ?');
      params.push(JSON.stringify(input.recommendationRuleIds));
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db
      .prepare(`UPDATE project_templates SET ${fields.join(', ')} WHERE id = ?`)
      .run(...params);
    return this.getById(id)!;
  }

  /**
   * Supprime un template.
   *
   * @param id - UUID du template.
   * @throws {ValidationError} Template absent ou **builtin immuable** (ADR-040).
   */
  delete(id: string): void {
    const existing = this.getById(id);
    if (!existing) {
      throw new ValidationError([`Template introuvable : ${id}`]);
    }
    if (existing.isBuiltin) {
      throw new ValidationError([
        `Le template builtin « ${existing.name} » est immuable (ADR-040) — suppression refusée`,
      ]);
    }
    this.db.prepare('DELETE FROM project_templates WHERE id = ?').run(id);
  }

  /**
   * Exporte un template au format JSON (C17.5) : sans `id`, dates ni
   * `isBuiltin` — l'import recrée un template vierge dans `custom`.
   *
   * @param id - UUID du template.
   * @returns JSON indenté (`TemplateExport`, version `1.0.0`).
   * @throws {ValidationError} Template absent.
   */
  exportToJson(id: string): string {
    const template = this.getById(id);
    if (!template) {
      throw new ValidationError([`Template introuvable : ${id}`]);
    }

    const exportData: TemplateExport = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      template: {
        name: template.name,
        description: template.description,
        category: template.category,
        config: template.config,
        bestPracticeIds: template.bestPracticeIds,
        recommendationRuleIds: template.recommendationRuleIds,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importe un template depuis un export JSON (C17.5) : crée un
   * **nouveau** template (UUID + `isBuiltin = 0`, catégorie d'origine
   * conservée).
   *
   * @param json - Chaîne d'export (`TemplateExport`).
   * @returns Le template importé.
   * @throws {ValidationError} JSON invalide, format inconnu, ou entrée
   *   invalide (nom/catégorie).
   */
  importFromJson(json: string): ProjectTemplate {
    let data: TemplateExport;
    try {
      data = JSON.parse(json) as TemplateExport;
    } catch {
      throw new ValidationError(['JSON invalide']);
    }

    if (!data.version || !data.template || typeof data.template !== 'object') {
      throw new ValidationError(["format d'export invalide (version/template manquants)"]);
    }

    return this.create({
      name: data.template.name,
      description: data.template.description,
      category: data.template.category,
      config: data.template.config,
      bestPracticeIds: data.template.bestPracticeIds,
      recommendationRuleIds: data.template.recommendationRuleIds,
    });
  }

  /**
   * Compte les templates correspondant aux filtres (hors pagination/tags).
   *
   * @param filters - Filtres optionnels (category, isBuiltin).
   * @returns Nombre total de templates.
   */
  count(filters?: TemplateFilters): number {
    let query = 'SELECT COUNT(*) AS count FROM project_templates WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.isBuiltin !== undefined) {
      query += ' AND is_builtin = ?';
      params.push(filters.isBuiltin ? 1 : 0);
    }

    const row = this.db.prepare(query).get(...params) as { count: number };
    return row.count;
  }

  /**
   * Vérifie qu'une catégorie fait partie de la liste blanche.
   *
   * @param category - Catégorie à valider.
   * @throws {ValidationError} Catégorie inconnue.
   */
  private assertCategory(category: TemplateCategory): void {
    if (!TEMPLATE_CATEGORIES.includes(category)) {
      throw new ValidationError([
        `Catégorie inconnue : ${String(category)} — attendu : ${TEMPLATE_CATEGORIES.join(', ')}`,
      ]);
    }
  }

  /**
   * Convertit une ligne SQL en `ProjectTemplate` (parse JSON + cast).
   *
   * @param row - Ligne brute (`SELECT *`).
   * @returns Objet de domaine typé.
   */
  private mapRow(row: Record<string, unknown>): ProjectTemplate {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as TemplateCategory,
      config: JSON.parse(row.config as string) as TemplateConfig,
      bestPracticeIds: JSON.parse(row.best_practice_ids as string) as string[],
      recommendationRuleIds: JSON.parse(row.recommendation_rule_ids as string) as string[],
      isBuiltin: (row.is_builtin as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
