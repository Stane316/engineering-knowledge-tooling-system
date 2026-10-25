import type Database from 'better-sqlite3';

import type { AnalysisDimension } from '../analysis/types.js';

import type {
  BestPractice,
  BestPracticeFilters,
  BestPracticeSearchOptions,
  BestPracticeSearchResult,
  CreateBestPracticeInput,
  ExtractionReport,
  FindingBestPracticeLink,
  UpdateBestPracticeInput,
} from './best-practice.types.js';
import type { ExtractionCriteria } from './best-practice-extractor.js';
import { BestPracticeExtractor } from './best-practice-extractor.js';
import { BestPracticeRepository } from './best-practice-repository.js';
import { BestPracticeSearch } from './best-practice-search.js';

/**
 * Orchestrateur des bonnes pratiques (Sprint 15).
 *
 * Façade de haut niveau exposant :
 * - le CRUD (créations **manuelles** marquées `isManual`) ;
 * - la recherche hybride (FTS5 / RRF) déléguée à {@link BestPracticeSearch} ;
 * - l'extraction automatique déléguée à {@link BestPracticeExtractor} ;
 * - les associations finding ↔ pratique (ADR-035).
 *
 * Instanciation en une ligne : `new BestPracticeService(connection)`.
 * API synchrone (better-sqlite3), sans breaking change des modules existants.
 */
export class BestPracticeService {
  private readonly repo: BestPracticeRepository;
  private readonly search: BestPracticeSearch;
  private readonly extractor: BestPracticeExtractor;

  /**
   * @param db - Connexion SQLite (schéma audits + migration 005).
   * @param criteria - Critères d'extraction partiels (optionnel).
   */
  constructor(db: Database.Database, criteria?: Partial<ExtractionCriteria>) {
    this.repo = new BestPracticeRepository(db);
    this.search = new BestPracticeSearch(db, this.repo);
    this.extractor = new BestPracticeExtractor(db, this.repo, criteria);
  }

  // --- CRUD ---

  /**
   * Crée une bonne pratique **manuelle** (`isManual` forcé à `true`).
   *
   * @param input - Données de la pratique.
   * @returns La pratique persistée.
   */
  create(input: CreateBestPracticeInput): BestPractice {
    return this.repo.create({ ...input, isManual: true });
  }

  /**
   * Récupère une bonne pratique par identifiant.
   *
   * @param id - Identifiant UUID.
   * @returns La pratique ou `null`.
   */
  getById(id: string): BestPractice | null {
    return this.repo.getById(id);
  }

  /**
   * Liste les bonnes pratiques (filtres + pagination).
   *
   * @param filters - Filtres optionnels.
   * @returns Pratiques correspondantes.
   */
  list(filters?: BestPracticeFilters): BestPractice[] {
    return this.repo.list(filters);
  }

  /**
   * Met à jour une bonne pratique.
   *
   * @param id - Identifiant.
   * @param input - Champs partiels.
   * @returns La pratique mise à jour.
   * @throws {ValidationError} Pratique absente.
   */
  update(id: string, input: UpdateBestPracticeInput): BestPractice {
    return this.repo.update(id, input);
  }

  /**
   * Supprime une bonne pratique (associations en cascade).
   *
   * @param id - Identifiant.
   */
  delete(id: string): void {
    this.repo.delete(id);
  }

  /**
   * Compte les bonnes pratiques correspondant aux filtres.
   *
   * @param filters - Filtres optionnels.
   * @returns Nombre de pratiques.
   */
  count(filters?: BestPracticeFilters): number {
    return this.repo.count(filters);
  }

  // --- Recherche ---

  /**
   * Recherche hybride ou énumération filtrée.
   *
   * @param options - Requête optionnelle, filtres, limite.
   * @returns Résultats triés par pertinence.
   */
  searchPractices(options: BestPracticeSearchOptions): BestPracticeSearchResult[] {
    return this.search.search(options);
  }

  // --- Extraction ---

  /**
   * Extrait les bonnes pratiques depuis les audits d'un projet.
   *
   * @param projectId - Projet source.
   * @returns Rapport d'extraction (non bloquant).
   */
  extractFromProject(projectId: string): ExtractionReport {
    return this.extractor.extractFromProject(projectId);
  }

  // --- Associations ---

  /**
   * Lie un finding à une bonne pratique.
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @param findingTitle - Titre du finding (normalisé par le repository).
   * @param dimension - Dimension du finding.
   * @param confidence - Confiance optionnelle (défaut repository : 1).
   */
  linkToFinding(
    bestPracticeId: string,
    findingTitle: string,
    dimension: AnalysisDimension,
    confidence?: number,
  ): void {
    this.repo.linkToFinding(bestPracticeId, findingTitle, dimension, confidence);
  }

  /**
   * Délie un finding d'une bonne pratique.
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @param findingTitle - Titre du finding.
   * @param dimension - Dimension du finding.
   */
  unlinkFromFinding(
    bestPracticeId: string,
    findingTitle: string,
    dimension: AnalysisDimension,
  ): void {
    this.repo.unlinkFromFinding(bestPracticeId, findingTitle, dimension);
  }

  /**
   * Bonnes pratiques liées à un finding.
   *
   * @param findingTitle - Titre du finding.
   * @param dimension - Dimension du finding.
   * @returns Pratiques liées (confiance décroissante).
   */
  findByFinding(findingTitle: string, dimension: AnalysisDimension): BestPractice[] {
    return this.repo.findByFinding(findingTitle, dimension);
  }

  /**
   * Findings liés à une bonne pratique (sens inverse).
   *
   * @param bestPracticeId - Identifiant de la pratique.
   * @returns Liens trouvés.
   */
  findLinkedFindings(bestPracticeId: string): FindingBestPracticeLink[] {
    return this.repo.findLinkedFindings(bestPracticeId);
  }
}
