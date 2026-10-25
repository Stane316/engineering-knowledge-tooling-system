import type Database from 'better-sqlite3';

import type { IEmbeddingsService } from '../business/embeddings.js';
import type { IKnowledgeManager } from '../business/knowledge-manager.types.js';
import type { ISearchEngine } from '../business/search-engine.types.js';
import { AnalysisPipeline } from '../analysis/pipeline.js';
import type { AnalysisReport } from '../analysis/types.js';
import { fromInspection } from '../analysis/adapter.js';
import { Inspector } from '../browser/inspection/inspector.js';
import type { InspectionLevel, L3InspectionResult } from '../browser/inspection/types.js';
import { createSearchEngine, openCliServices, type CliServices } from '../cli/services.js';
import { BestPracticeService } from '../best-practices/best-practice-service.js';
import { RecommendationContext } from '../recommendations/recommendation-context.js';
import { RecommendationEngine } from '../recommendations/recommendation-engine.js';
import { AlertManager } from '../timeline/alert-manager.js';
import { ChartGenerator } from '../timeline/chart-generator.js';
import { TimelineAnalyzer } from '../timeline/timeline-analyzer.js';
import { TrendDetector } from '../timeline/trend-detector.js';
import { loadConfig } from '../shared/config.js';
import { ValidationError } from '../shared/errors.js';
import type { IProjectManager } from '../business/project-manager.types.js';
import type { Audit } from '../storage/types.js';
import { AuditRepository } from '../storage/audit-repository.js';
import { AlertRepository } from '../storage/alert-repository.js';
import { AuditSchema } from '../storage/schema.js';
import { AuditSearch } from '../storage/search.js';
import { AuditStatisticsManager } from '../storage/statistics.js';
import { AuditIndexer } from '../storage/indexing.js';

/**
 * Services des outils d'inspection et d'audits (Sprint 11-3).
 *
 * `inspectAndAudit` concentre la chaîne navigation → analyse → stockage ;
 * il est **remplaçable** dans les tests (aucune navigation réseau dans les
 * tests unitaires), comme les autres dépendances du contexte.
 */
export interface AuditToolServices {
  /** Lecture des audits stockés. */
  readonly repository: AuditRepository;
  /** Recherche/filtrage paginé des audits (FTS sans réseau). */
  readonly search: AuditSearch;
  /** Statistiques agrégées. */
  readonly statistics: AuditStatisticsManager;
  /** Indexation FTS des constats. */
  readonly indexer: AuditIndexer;
  /**
   * Inspection complète (navigateur) → analyse → audit persisté + indexé.
   *
   * @param input - URL et niveau (`L3` requis : seuls L3 fournit les
   *                entrées `lighthouse`/`axe`/`ux`/`content`).
   * @returns Audit stocké et rapport d'analyse d'origine.
   * @throws {ValidationError} Niveau insuffisant ou inspection inattendue.
   */
  inspectAndAudit(input: {
    readonly url: string;
    readonly level: InspectionLevel;
    /**
     * Projet auquel l'audit est assigné (Sprint 13) ; omis ou `null` :
     * audit sans projet.
     */
    readonly projectId?: string | null;
  }): Promise<{ readonly audit: Audit; readonly report: AnalysisReport }>;
}

/**
 * Contexte d'exécution des outils MCP.
 *
 * Les outils ignorent **comment** les services sont construits : ils reçoivent
 * ce contrat minimal, ce qui permet de les tester sur une base SQLite réelle
 * temporaire, sans maquette ni variable globale.
 */
/** Services de suivi temporel (Sprint 14). */
export interface TimelineToolServices {
  /** Séries chronologiques par projet. */
  readonly analyzer: TimelineAnalyzer;
  /** Détection de tendances et de régressions. */
  readonly detector: TrendDetector;
  /** Alertes persistées (table `alerts`, migration 004). */
  readonly alertRepository: AlertRepository;
  /** Cycle de vie des alertes (création idempotente, résolution). */
  readonly alertManager: AlertManager;
  /** Graphiques SVG/PNG des timelines. */
  readonly chartGenerator: ChartGenerator;
}

/** Instancie les services de timeline sur la connexion ouverte. */
function buildTimelineServices(connection: Database.Database): TimelineToolServices {
  const alertRepository = new AlertRepository(connection);
  return {
    analyzer: new TimelineAnalyzer(connection),
    detector: new TrendDetector(),
    alertRepository,
    alertManager: new AlertManager(alertRepository),
    chartGenerator: new ChartGenerator(),
  };
}

export interface McpToolContext {
  /** Lecture des ressources (Sprint 3). */
  readonly manager: IKnowledgeManager;
  /** Recherche lexicale, vectorielle et hybride (Sprint 4). */
  readonly search: ISearchEngine;
  /** Audits, inspection et rapports (Sprint 11). */
  readonly audits: AuditToolServices;
  /** Gestion des projets (Sprint 13). */
  readonly projects: IProjectManager;
  /** Suivi temporel (Sprint 14). */
  readonly timeline: TimelineToolServices;
  /** Capitalisation des bonnes pratiques (Sprint 15). */
  readonly bestPractices: BestPracticeService;
  /** Moteur de recommandations contextuelles (Sprint 16). */
  readonly recommendations: RecommendationEngine;
}

/** Contexte complet, avec la fermeture des ressources ouvertes. */
export interface McpServices extends McpToolContext {
  /** Répertoire des trois bases (journalisé au démarrage). */
  readonly dataDir: string;
  /** Un fournisseur d'embeddings est-il disponible ? */
  readonly embeddingsAvailable: boolean;
  /** Ferme la connexion SQLite (idempotent). */
  close(): void;
}

export interface OpenMcpOptions {
  /** Répertoire des bases (défaut : `EKTS_DATA_DIR` ou `./data`). */
  readonly dataDir?: string;
  /** Environnement (tests : objet explicite, jamais le `.env` du poste). */
  readonly env?: NodeJS.ProcessEnv;
  /** Service d'embeddings injecté (tests). */
  readonly embeddings?: IEmbeddingsService;
}

/**
 * Ouvre les services partagés par les quatre outils.
 *
 * Réutilise `openCliServices` (ADR-019) : MCP et CLI voient donc les mêmes
 * bases et les mêmes fournisseurs, sans duplication de câblage. Le mode
 * `auto` est volontaire — un serveur MCP doit démarrer sans clé d'API, les
 * outils `fts` restant utilisables.
 *
 * @param options - Répertoire, environnement et service d'embeddings.
 */
export function openMcpServices(options: OpenMcpOptions = {}): McpServices {
  const dataDir = options.dataDir ?? loadConfig(options.env).dataDir;
  const services: CliServices = openCliServices({
    dataDir,
    embeddingsMode: 'auto',
    // `undefined` conserve le comportement de production : la passerelle lit
    // `.env` et `providers.custom.json`. Un objet explicite coupe ces lectures.
    env: options.env,
    embeddings: options.embeddings,
  });

  const { connection } = services.database;
  new AuditSchema(connection).createSchema();
  const repository = new AuditRepository(connection);
  const indexer = new AuditIndexer(connection);

  const audits: AuditToolServices = {
    repository,
    search: new AuditSearch(connection, repository),
    statistics: new AuditStatisticsManager(connection),
    indexer,
    inspectAndAudit: async ({ url, level, projectId }) => {
      if (level !== 'L3') {
        throw new ValidationError([
          `le niveau ${level} ne produit pas les entrées d'analyse complètes ; utilisez le niveau L3`,
        ]);
      }

      const inspection = await new Inspector().inspect({ url, level });
      if (inspection.level !== 'L3') {
        throw new ValidationError([`inspection inattendue de niveau ${inspection.level}`]);
      }

      const inputs = fromInspection(inspection as L3InspectionResult);
      const report = await new AnalysisPipeline().analyze(
        url,
        inputs.lighthouse,
        inputs.axe,
        inputs.ux,
        inputs.content,
      );
      const audit = repository.store(report, { projectId: projectId ?? null });
      await indexer.indexAudit(audit);

      return { audit, report };
    },
  };

  const bestPracticeService = new BestPracticeService(connection);

  return {
    manager: services.manager,
    search: createSearchEngine(connection, services.embeddings),
    audits,
    projects: services.projects,
    timeline: buildTimelineServices(connection),
    bestPractices: bestPracticeService,
    recommendations: new RecommendationEngine(
      connection,
      new RecommendationContext(connection, bestPracticeService),
      bestPracticeService,
    ),
    dataDir,
    embeddingsAvailable: services.embeddings !== undefined,
    close: services.close,
  };
}
