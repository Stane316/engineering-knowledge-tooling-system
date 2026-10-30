import { measuredValueOf, vitalsMeasurements } from './measurement.js';
import type { MetricReading } from './measurement.js';
import type { DimensionScore, Finding, LighthouseResults } from './types.js';

/**
 * Seuils de performance, **par métrique** (Sprint 20-01, W04 / C-W08).
 *
 * Le défaut corrigé : les seuils du FID (100/300 ms) étaient appliqués à une
 * valeur d'INP, dont les bornes officielles sont 200/500 ms. Un même nombre
 * change donc de sens selon la métrique qui le porte.
 *
 * Bornes « bon / à améliorer » de web.dev. `max-potential-fid` n'a pas de
 * seuil public : il est lu et exposé, mais ne produit aucun constat.
 */
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  inp: { good: 200, needsImprovement: 500 },
  fid: { good: 100, needsImprovement: 300 },
  tbt: { good: 200, needsImprovement: 600 },
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
    const metrics = results.performance.metrics;

    // Sprint 20-01 (W04 / C-W08) : chaque constat dérive de la lecture de sa
    // **propre** métrique. INP, FID, max-potential-fid et TBT ne se
    // substituent jamais l'un à l'autre ; `measuredValueOf` renvoie
    // `undefined` pour une mesure absente et aucun constat n'est alors produit
    // (C-W05 : un constat ne se dérive pas d'une mesure inventée).
    findings.push(...this.analyzeLCP(metrics.lcp));
    findings.push(...this.analyzeINP(metrics.inp));
    findings.push(...this.analyzeFID(metrics.fid));
    findings.push(...this.analyzeTBT(metrics.tbt));
    findings.push(...this.analyzeCLS(metrics.cls));
    findings.push(...this.analyzeTTFB(metrics.ttfb));

    const score = results.performance.score;
    // Les neuf lectures sont conservées, y compris indisponibles : la
    // provenance (identité, unité, origine) reste portée par `MetricReading`.
    const measurements = vitalsMeasurements(metrics);

    // Le score est absent : la dimension est déclarée indisponible, sans
    // estimation de remplacement (C-W07).
    if (score === null) {
      return {
        dimension: 'performance',
        score: null,
        status: 'unavailable',
        unavailableReason: 'score-absent',
        findings,
        summary:
          `${String(findings.length)} constat(s) de performance relevé(s), mais aucun score ` +
          "n'a été fourni par Lighthouse : le score reste indisponible.",
        measurements,
      };
    }

    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'performance',
      score,
      status: 'measured',
      findings,
      summary,
      measurements,
    };
  }

  /**
   * Analyse le Largest Contentful Paint (LCP).
   *
   * @param lcp - LCP en millisecondes.
   * @returns Constat critique ou d'amélioration, liste vide si le seuil est tenu.
   */
  private analyzeLCP(reading: MetricReading): Finding[] {
    const lcp = measuredValueOf(reading.measurement);

    if (lcp === undefined) {
      return [];
    }

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
          unit: reading.unit,
          origin: reading.origin,
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
          unit: reading.unit,
          origin: reading.origin,
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
  private analyzeFID(reading: MetricReading): Finding[] {
    const fid = measuredValueOf(reading.measurement);

    if (fid === undefined) {
      return [];
    }

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
          unit: reading.unit,
          origin: reading.origin,
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
          unit: reading.unit,
          origin: reading.origin,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse l'Interaction to Next Paint (INP).
   *
   * Sprint 20-01 (W04) : l'INP cesse d'être présenté comme un FID. Ses bornes
   * officielles (200/500 ms) diffèrent de celles du FID (100/300 ms).
   *
   * @param reading - Lecture INP (identité, unité, origine et mesure).
   * @returns Constat critique ou d'amélioration, liste vide si la mesure est
   * absente ou si le seuil est tenu.
   */
  private analyzeINP(reading: MetricReading): Finding[] {
    const inp = measuredValueOf(reading.measurement);

    if (inp === undefined) {
      return [];
    }

    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.inp;

    if (inp > needsImprovement) {
      findings.push({
        id: 'perf-inp-critical',
        dimension: 'performance',
        title: 'Interaction to Next Paint critique',
        description: `L'INP est de ${inp}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation:
          'Réduire le travail JavaScript par interaction : découper les tâches longues, différer les scripts non critiques, alléger les gestionnaires d’événements.',
        references: ['https://web.dev/articles/inp'],
        metric: {
          name: 'INP',
          value: inp,
          threshold: needsImprovement,
          unit: reading.unit,
          origin: reading.origin,
        },
      });
    } else if (inp > good) {
      findings.push({
        id: 'perf-inp-warning',
        dimension: 'performance',
        title: 'Interaction to Next Paint à améliorer',
        description: `L'INP est de ${inp}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Surveiller les interactions les plus lentes et réduire le temps de traitement des gestionnaires d’événements.',
        references: ['https://web.dev/articles/inp'],
        metric: {
          name: 'INP',
          value: inp,
          threshold: good,
          unit: reading.unit,
          origin: reading.origin,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le Total Blocking Time (TBT).
   *
   * Sprint 20-01 (W04) : le TBT était totalement absent du produit. Il reste
   * distinct de l'INP — mesure de laboratoire du blocage du fil principal, et
   * non délai d'interaction observé.
   *
   * @param reading - Lecture TBT.
   * @returns Constat critique ou d'amélioration, liste vide si la mesure est
   * absente ou si le seuil est tenu.
   */
  private analyzeTBT(reading: MetricReading): Finding[] {
    const tbt = measuredValueOf(reading.measurement);

    if (tbt === undefined) {
      return [];
    }

    const findings: Finding[] = [];
    const { good, needsImprovement } = PERFORMANCE_THRESHOLDS.tbt;

    if (tbt > needsImprovement) {
      findings.push({
        id: 'perf-tbt-critical',
        dimension: 'performance',
        title: 'Total Blocking Time critique',
        description: `Le TBT est de ${tbt}ms, ce qui est très lent (> ${needsImprovement}ms).`,
        severity: 4,
        effort: 3,
        impact: 4,
        priority: 'critical',
        recommendation:
          'Découper les tâches longues JavaScript, charger les scripts en différé et réduire le travail exécuté avant l’interactivité.',
        references: ['https://web.dev/articles/tbt'],
        metric: {
          name: 'TBT',
          value: tbt,
          threshold: needsImprovement,
          unit: reading.unit,
          origin: reading.origin,
        },
      });
    } else if (tbt > good) {
      findings.push({
        id: 'perf-tbt-warning',
        dimension: 'performance',
        title: 'Total Blocking Time à améliorer',
        description: `Le TBT est de ${tbt}ms, ce qui est moyen (${good}-${needsImprovement}ms).`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Réduire les tâches longues du fil principal : découpage du bundle, hydratation progressive.',
        references: ['https://web.dev/articles/tbt'],
        metric: {
          name: 'TBT',
          value: tbt,
          threshold: good,
          unit: reading.unit,
          origin: reading.origin,
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
  private analyzeCLS(reading: MetricReading): Finding[] {
    const cls = measuredValueOf(reading.measurement);

    if (cls === undefined) {
      return [];
    }

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
          unit: reading.unit,
          origin: reading.origin,
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
          unit: reading.unit,
          origin: reading.origin,
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
  private analyzeTTFB(reading: MetricReading): Finding[] {
    const ttfb = measuredValueOf(reading.measurement);

    if (ttfb === undefined) {
      return [];
    }

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
          unit: reading.unit,
          origin: reading.origin,
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
          unit: reading.unit,
          origin: reading.origin,
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
