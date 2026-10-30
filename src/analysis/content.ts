import type { ContentResults, DimensionScore, Finding } from './types.js';

/**
 * Seuils de qualité de contenu.
 */
const CONTENT_THRESHOLDS = {
  wordCount: {
    minimum: 300,
    good: 600,
    excellent: 1000,
  },
  readabilityScore: {
    poor: 30,
    average: 50,
    good: 60,
    excellent: 70,
  },
} as const;

/**
 * Analyseur de contenu.
 *
 * Croise trois métriques : la quantité de mots, l'indice de lisibilité (Flesch)
 * et le temps de lecture estimé. Chaque franchissement de seuil produit un
 * `Finding` portant la valeur mesurée et la cible visée.
 *
 * Les priorités déclarées sont alignées sur la sévérité (4 → critical,
 * 3 → high…) ; le `FindingPrioritizer` les recalcule uniformément avec la
 * matrice avant le rapport final.
 *
 * @example
 * ```ts
 * const analyzer = new ContentAnalyzer();
 * const score = analyzer.analyze(contentResults);
 * ```
 */
export class ContentAnalyzer {
  /**
   * Analyse les résultats de contenu.
   *
   * @param results - Score et métriques de contenu.
   * @returns Score, constats et résumé de la dimension contenu.
   */
  analyze(results: ContentResults): DimensionScore {
    const findings: Finding[] = [];

    findings.push(...this.analyzeWordCount(results.metrics.wordCount));
    findings.push(...this.analyzeReadability(results.metrics.readabilityScore));
    findings.push(...this.analyzeReadingTime(results.metrics.readingTime));

    const score = results.score;
    const summary = this.generateSummary(findings, score);

    return {
      dimension: 'content',
      score,
      status: 'measured',
      findings,
      summary,
    };
  }

  /**
   * Analyse la quantité de contenu.
   *
   * @param wordCount - Nombre de mots.
   * @returns Constats de quantité, liste vide sous les seuils.
   */
  private analyzeWordCount(wordCount: number): Finding[] {
    const findings: Finding[] = [];
    const { minimum, good } = CONTENT_THRESHOLDS.wordCount;

    if (wordCount < minimum) {
      findings.push({
        id: 'content-word-count-low',
        dimension: 'content',
        title: 'Contenu insuffisant',
        description: `Le contenu contient seulement ${wordCount} mots (minimum recommandé : ${minimum} mots).`,
        severity: 3,
        effort: 3,
        impact: 4,
        priority: 'high',
        recommendation:
          'Enrichir le contenu avec des informations pertinentes, des exemples et des détails. Viser au moins 600 mots pour un article de blog.',
        references: ['https://backlinko.com/hubspot/blog-word-count'],
        metric: {
          name: 'Word count',
          value: wordCount,
          threshold: minimum,
          unit: 'mots',
        },
      });
    } else if (wordCount < good) {
      findings.push({
        id: 'content-word-count-medium',
        dimension: 'content',
        title: 'Contenu à enrichir',
        description: `Le contenu contient ${wordCount} mots. Pour une meilleure profondeur, viser ${good}+ mots.`,
        severity: 2,
        effort: 2,
        impact: 3,
        priority: 'medium',
        recommendation:
          "Ajouter plus de détails, d'exemples et de contexte pour enrichir le contenu.",
        references: ['https://backlinko.com/hubspot/blog-word-count'],
        metric: {
          name: 'Word count',
          value: wordCount,
          threshold: good,
          unit: 'mots',
        },
      });
    }

    return findings;
  }

  /**
   * Analyse l'indice de lisibilité (Flesch).
   *
   * @param readabilityScore - Score de 0 à 100 (plus haut = plus simple).
   * @returns Constats de lisibilité, liste vide si le seuil est tenu.
   */
  private analyzeReadability(readabilityScore: number): Finding[] {
    const findings: Finding[] = [];
    const { poor, average, good } = CONTENT_THRESHOLDS.readabilityScore;

    if (readabilityScore < poor) {
      findings.push({
        id: 'content-readability-poor',
        dimension: 'content',
        title: 'Lisibilité très faible',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (très difficile à lire).`,
        severity: 4,
        effort: 3,
        impact: 5,
        priority: 'critical',
        recommendation:
          'Réécrire le contenu pour le simplifier : phrases courtes, mots simples, structure claire. Utiliser des listes et des sous-titres.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: poor,
        },
      });
    } else if (readabilityScore < average) {
      findings.push({
        id: 'content-readability-low',
        dimension: 'content',
        title: 'Lisibilité faible',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (difficile à lire).`,
        severity: 3,
        effort: 2,
        impact: 4,
        priority: 'high',
        recommendation:
          'Simplifier le contenu : raccourcir les phrases, utiliser des mots plus simples, ajouter des transitions.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: average,
        },
      });
    } else if (readabilityScore < good) {
      findings.push({
        id: 'content-readability-medium',
        dimension: 'content',
        title: 'Lisibilité moyenne',
        description: `Le score de lisibilité est de ${readabilityScore.toFixed(1)} (acceptable mais peut être amélioré).`,
        severity: 2,
        effort: 1,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Améliorer légèrement la lisibilité : varier la longueur des phrases, utiliser des mots plus familiers.',
        references: ['https://readable.com/readability/flesch-reading-ease/'],
        metric: {
          name: 'Readability score',
          value: readabilityScore,
          threshold: good,
        },
      });
    }

    return findings;
  }

  /**
   * Analyse le temps de lecture estimé.
   *
   * @param readingTime - Temps de lecture en minutes.
   * @returns Constats de durée, liste vide entre 1 et 15 minutes.
   */
  private analyzeReadingTime(readingTime: number): Finding[] {
    const findings: Finding[] = [];

    if (readingTime < 1) {
      findings.push({
        id: 'content-reading-time-short',
        dimension: 'content',
        title: 'Contenu trop court',
        description: `Le temps de lecture estimé est de ${readingTime.toFixed(1)} minute(s). Le contenu est trop superficiel.`,
        severity: 2,
        effort: 3,
        impact: 3,
        priority: 'medium',
        recommendation:
          'Développer le contenu pour atteindre au moins 3-5 minutes de lecture. Ajouter de la profondeur et des exemples.',
        references: ['https://help.medium.com/hc/en-us/articles/360002424654-Read-time'],
        metric: {
          name: 'Reading time',
          value: readingTime,
          threshold: 3,
          unit: 'min',
        },
      });
    } else if (readingTime > 15) {
      findings.push({
        id: 'content-reading-time-long',
        dimension: 'content',
        title: 'Contenu très long',
        description: `Le temps de lecture estimé est de ${readingTime.toFixed(1)} minutes. Le contenu peut être décourageant.`,
        severity: 1,
        effort: 2,
        impact: 2,
        priority: 'low',
        recommendation:
          "Envisager de diviser le contenu en plusieurs parties ou d'ajouter une table des matières pour faciliter la navigation.",
        references: ['https://help.medium.com/hc/en-us/articles/360002424654-Read-time'],
        metric: {
          name: 'Reading time',
          value: readingTime,
          threshold: 15,
          unit: 'min',
        },
      });
    }

    return findings;
  }

  /**
   * Génère un résumé de l'analyse.
   *
   * Les comptes suivent la sévérité des constats (4 = critique, 3 = important,
   * 2 = moyen, 1 = mineur).
   *
   * @param findings - Constats de la dimension.
   * @param score - Score contenu (0-100).
   * @returns Résumé en une phrase.
   */
  private generateSummary(findings: Finding[], score: number): string {
    const criticalCount = findings.filter((f) => f.severity === 4).length;
    const highCount = findings.filter((f) => f.severity === 3).length;
    const mediumCount = findings.filter((f) => f.severity === 2).length;
    const lowCount = findings.filter((f) => f.severity === 1).length;

    let summary = `Score contenu : ${score}/100. `;

    if (findings.length === 0) {
      summary += 'Excellente qualité de contenu !';

      return summary;
    }

    const parts: string[] = [];

    if (criticalCount > 0) parts.push(`${criticalCount} critique(s)`);
    if (highCount > 0) parts.push(`${highCount} important(s)`);
    if (mediumCount > 0) parts.push(`${mediumCount} moyen(s)`);
    if (lowCount > 0) parts.push(`${lowCount} mineur(s)`);

    summary += `${findings.length} problème(s) de contenu identifié(s) : ${parts.join(', ')}.`;

    return summary;
  }
}
