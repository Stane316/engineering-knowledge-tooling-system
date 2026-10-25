import { AlertRepository } from '../storage/alert-repository.js';
import type { Alert, AlertFilters } from '../storage/types.js';
import type { Regression, TrendReport } from './timeline.types.js';

/** Configuration d'alerte (Sprint 14). */
export interface AlertManagerConfig {
  /** Points perdus minimaux pour créer une alerte (défaut 10, C14.4). */
  regressionThreshold: number;
}

/**
 * Gestionnaire des alertes de régression (Sprint 14).
 *
 * Politique (C14.14) : alertes **non bloquantes** — jamais d'exception de
 * workflow, uniquement de la persistance. Une alerte est créée pour chaque
 * régression fournie (seuil contrôlé à l'appel par `TrendDetector
 * .detectRegressions`) dont la dimension est `overall` ou classée
 * `declining` par le rapport de tendances. Les doublons actifs (même paire
 * d'audits + même dimension) sont ignorés pour rester idempotents.
 */
export class AlertManager {
  private readonly alertRepo: AlertRepository;
  private readonly config: AlertManagerConfig;

  /**
   * @param alertRepo - Repository des alertes.
   * @param config - Surcharge de `regressionThreshold` (≥ 1).
   */
  constructor(alertRepo: AlertRepository, config?: Partial<AlertManagerConfig>) {
    this.alertRepo = alertRepo;
    const threshold = config?.regressionThreshold ?? 10;
    if (!Number.isInteger(threshold) || threshold < 1) {
      throw new RangeError(
        `regressionThreshold invalide : ${String(threshold)} (entier ≥ 1 attendu)`,
      );
    }
    this.config = { regressionThreshold: threshold };
  }

  /**
   * Crée les alertes manquantes pour les régressions détectées.
   *
   * @param report - Rapport de tendances (filtre `declining`).
   * @param regressions - Régressions fournies par `TrendDetector.detectRegressions`
   *   (avec le seuil de configuration : la méthode ne recalcule pas).
   * @returns Alertes **créées** (les doublons actifs sont ignorés).
   */
  async checkAndCreateAlerts(
    report: TrendReport,
    regressions: readonly Regression[],
  ): Promise<Alert[]> {
    const created: Alert[] = [];

    for (const regression of regressions) {
      if (regression.regressionPoints < this.config.regressionThreshold) {
        continue;
      }
      if (regression.dimension !== 'overall') {
        const trend = report.trends.get(regression.dimension);
        if (trend?.direction !== 'declining') {
          continue;
        }
      }
      if (this.hasActiveDuplicate(regression)) {
        continue;
      }

      created.push(
        this.alertRepo.create({
          projectId: regression.projectId,
          auditIdFrom: regression.auditIdFrom,
          auditIdTo: regression.auditIdTo,
          dimension: regression.dimension,
          scoreBefore: regression.scoreBefore,
          scoreAfter: regression.scoreAfter,
          regressionPoints: regression.regressionPoints,
        }),
      );
    }

    return created;
  }

  /**
   * Alertes actives (non résolues), créées d'abord.
   *
   * @param projectId - Filtre projet optionnel.
   * @returns Alertes actives correspondantes.
   */
  async getActiveAlerts(projectId?: string): Promise<Alert[]> {
    return this.alertRepo.list({
      resolved: false,
      ...(projectId === undefined ? {} : { projectId }),
    });
  }

  /**
   * Toutes les alertes correspondant aux filtres.
   *
   * @param filters - Filtres `projectId`, `resolved`, `dimension`, `limit`.
   * @returns Alertes correspondantes.
   */
  async getAllAlerts(filters?: AlertFilters): Promise<Alert[]> {
    return this.alertRepo.list(filters);
  }

  /**
   * Résout une alerte active.
   *
   * @param alertId - Identifiant UUID.
   * @throws {ValidationError} Alerte absente ou déjà résolue.
   */
  async resolveAlert(alertId: string): Promise<void> {
    this.alertRepo.markAsResolved(alertId);
  }

  /**
   * Supprime une alerte.
   *
   * @param alertId - Identifiant UUID.
   * @returns `true` si l'alerte existait.
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    return this.alertRepo.delete(alertId);
  }

  /** `true` si une alerte active identique (paire d'audits + dimension) existe. */
  private hasActiveDuplicate(regression: Regression): boolean {
    return this.alertRepo
      .list({ projectId: regression.projectId, dimension: regression.dimension, resolved: false })
      .some(
        (alert) =>
          alert.auditIdFrom === regression.auditIdFrom && alert.auditIdTo === regression.auditIdTo,
      );
  }
}
