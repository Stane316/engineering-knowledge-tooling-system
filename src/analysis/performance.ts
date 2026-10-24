import type { DimensionScore, Finding, LighthouseResults } from './types.js';

/**
 * Seuils de performance (Core Web Vitals).
 *
 * Bornes « bon / à améliorer » de web.dev, reprises par la spécification du
 * Sprint 9 (C9.1) : LCP et FID en millisecondes, CLS sans unité.
 */
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  ttfb: { good: 800, needsImprovement: 1800 },
} as const;

/**
 * Analyseur de performance.
 *
 * Transforme les métriques Lighthouse en constats gradués : chaque métrique
 * hors du « bon » produit un `Finding` portant sa valeur, son seuil franchi et
 * une recommandation directement applicable.
 *
 * Les priorités des constats sont déclarées à côté de leur sévérité pour
 * refléter l'urgence perçue (CLS critique = mise en page instable, priorité
 * haute) ; le `FindingPrioritizer` les recalcule uniformément avec la matrice
 * avant le rapport final.
 *
 * @example
 * ```ts
 * const analyzer = new PerformanceAnalyzer();
 * const score = analyzer.analyze(lighthouseResults);
 * console.log(score.summary);
 * ```
 */
export class PerformanceAnalyzer {
  /**
   * Analyse les résultats Lighthouse.
   *
   * @param results - Métriques et score performance.
   * @returns Score, constats et résumé de la dimension performance.
   */
  analyze(results: LighthouseResults): DimensionScore {
    const findings: Finding[] = [];

    findings.push(...this.analyzeLCP(results.performance.metrics.lcp));
    findings.push(...this.analyzeFID(results.performance.metrics.fid));
    findings.push(...this.analyzeCLS(results.performance.metrics.cls));
    findings.push(...this.analyzeTTFB(results.performance.metrics.ttfb));

    const score = results.performance.score;
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'performance',
      score,
      findings,
      summary,
    };
  }

  /**
   * Analyse le Largest Contentful Paint (LCP).
   *
   * @param lcp - LCP en millisecondes.
   * @returns Constat critique ou d'amélioration, liste vide si le seuil est tenu.
   */
  private analyzeLCP(lcp: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.lcp;

    if (lcp > needsImprovement) {
      findings.push({
        id: 'perf-lcp-critical',
        dimension: 'performance',
        title: 'Largest Contentful Paint critique',
        description: `Le LCP est de ${lcp}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation:
          "Optimiser le chargement de l'élément principal : utiliser lazy loading, optimiser les images, réduire le CSS critique.",
        references: ['https://web.dev/lcp/', 'https://web.dev/vitals/'],
        metric: {
          name: 'LCP',
          value: lcp,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (lcp > good) {
      findings.push({
        id: 'perf-lcp-warning',
        dimension: 'performance',
        title: 'Largest Contentful Paint à améliorer',
        description: `Le LCP est de ${lcp}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Améliorer le chargement de l’élément principal : optimiser les images, précharger les ressources critiques.',
        references: ['https://web.dev/lcp/'],
        metric: {
          name: 'LCP',
          value: lcp,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le First Input Delay (FID).
   *
   * La valeur provient d'INP (successeur du FID) depuis le Sprint 8 ; les
   * seuils 100/300 ms sont ceux de la spécification (C9.1).
   *
   * @param fid - FID en millisecondes.
   * @returns Constat critique ou d'amélioration, liste vide si le seuil est tenu.
   */
  private analyzeFID(fid: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.fid;

    if (fid > needsImprovement) {
      findings.push({
        id: 'perf-fid-critical',
        dimension: 'performance',
        title: 'First Input Delay critique',
        description: `Le FID est de ${fid}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation:
          'Réduire le travail JavaScript : découper le code, charger en async, utiliser web workers.',
        references: ['https://web.dev/fid/'],
        metric: {
          name: 'FID',
          value: fid,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (fid > good) {
      findings.push({
        id: 'perf-fid-warning',
        dimension: 'performance',
        title: 'First Input Delay à améliorer',
        description: `Le FID est de ${fid}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          "Optimiser l'exécution JavaScript : réduire le temps de traitement, defer les scripts non critiques.",
        references: ['https://web.dev/fid/'],
        metric: {
          name: 'FID',
          value: fid,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le Cumulative Layout Shift (CLS).
   *
   * @param cls - CLS sans unité.
   * @returns Constat critique ou d'amélioration, liste vide si le seuil est tenu.
   */
  private analyzeCLS(cls: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.cls;

    if (cls > needsImprovement) {
      findings.push({
        id: 'perf-cls-critical',
        dimension: 'performance',
        title: 'Cumulative Layout Shift critique',
        description: `Le CLS est de ${cls.toFixed(3)}, ce qui est très instable (> ${needsImprovement}).`,
        severity: 4,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation:
          'Stabiliser la mise en page : définir les dimensions des images/vidéos, réserver les espaces publicitaires, éviter les insertions dynamiques.',
        references: ['https://web.dev/cls/'],
        metric: {
          name: 'CLS',
          value: cls,
          threshold: needsImprovement,
        },
      });
    } else if (cls > good) {
      findings.push({
        id: 'perf-cls-warning',
        dimension: 'performance',
        title: 'Cumulative Layout Shift à améliorer',
        description: `Le CLS est de ${cls.toFixed(3)}, ce qui est moyen (${good}-${needsImprovement}).`,
        severity: 2,
        effort: 1,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Améliorer la stabilité : définir les dimensions des médias, éviter les changements de layout inattendus.',
        references: ['https://web.dev/cls/'],
        metric: {
          name: 'CLS',
          value: cls,
          threshold: good,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le Time to First Byte (TTFB).
   *
   * @param ttfb - TTFB en millisecondes.
   * @returns Constat critique ou d'amélioration, liste vide si le seuil est tenu.
   */
  private analyzeTTFB(ttfb: number): Finding[] {
    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.ttfb;

    if (ttfb > needsImprovement) {
      findings.push({
        id: 'perf-ttfb-critical',
        dimension: 'performance',
        title: 'Time to First Byte critique',
        description: `Le TTFB est de ${ttfb}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 3,
        effort: 3,
        impact: 4,
        priority: 'high',
        recommendation:
          'Optimiser le serveur : utiliser un CDN, activer le cache, optimiser les requêtes base de données.',
        references: ['https://web.dev/ttfb/'],
        metric: {
          name: 'TTFB',
          value: ttfb,
          threshold: needsImprovement,
          unit: 'ms',
        },
      });
    } else if (ttfb > good) {
      findings.push({
        id: 'perf-ttfb-warning',
        dimension: 'performance',
        title: 'Time to First Byte à améliorer',
        description: `Le TTFB est de ${ttfb}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Améliorer le temps de réponse serveur : activer le cache, optimiser les requêtes.',
        references: ['https://web.dev/ttfb/'],
        metric: {
          name: 'TTFB',
          value: ttfb,
          threshold: good,
          unit: 'ms',
        },
      });
    }

    return findings;
  }

  /**
   * Génère un résumé de l'analyse.
   *
   * Les comptes suivent la **sévérité** des constats (4 = critique,
   * 3 = important, 2 = moyen), comme pour les autres dimensions : c'est la
   * gravité qui est lisible pour l'utilisateur, la priorité finale étant
   * recalculée par le `FindingPrioritizer`.
   *
   * @param findings - Constats de la dimension.
   * @param score - Score performance (0-100).
   * @returns Résumé en une phrase.
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter((f) => f.severity === 4).length;
    const highCount = findings.filter((f) => f.severity === 3).length;
    const mediumCount = findings.filter((f) => f.severity === 2).length;

    let summary = `Score performance : ${score}/100. `;

    if (criticalCount > 0) {
      summary += `${criticalCount} problème(s) critique(s) identifié(s). `;
    }

    if (highCount > 0) {
      summary += `${highCount} problème(s) important(s) identifié(s). `;
    }

    if (mediumCount > 0) {
      summary += `${mediumCount} problème(s) moyen(s) identifié(s). `;
    }

    if (findings.length === 0) {
      summary += 'Aucun problème de performance majeur détecté.';
    }

    return summary;
  }
}
