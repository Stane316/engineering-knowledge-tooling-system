#!/usr/bin/env node
/**
 * Inspection d'une URL depuis la ligne de commande.
 *
 * Sert à **valider les budgets sur le poste réel** : les budgets L1/L2/L3
 * (10 s / 30 s / 60 s) ne peuvent être mesurés que là où les binaires
 * Playwright sont installés. Aucune logique métier ici : le script traduit des
 * arguments, appelle `Inspector` et affiche un résumé lisible.
 *
 * Usage :
 *   npm run inspect -- https://exemple.fr
 *   npm run inspect -- https://exemple.fr L2
 *   npm run inspect -- https://exemple.fr L3 --save
 *
 * Prérequis : `npm run build` (le script consomme `dist/`, comme la CLI).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

const LEVELS = new Set(['L1', 'L2', 'L3']);
const EXIT_USAGE = 2;
const EXIT_FAILURE = 1;

/** Affiche l'aide et sort avec le code d'usage. */
function usage(message) {
  if (message !== undefined) {
    console.error(`Erreur : ${message}`);
  }

  console.error('Usage : npm run inspect -- <url> [L1|L2|L3] [--save] [--dir <dossier>]');
  process.exit(EXIT_USAGE);
}

/** Lit les arguments de la ligne de commande. */
function parseArguments(argv) {
  const positional = [];
  let save = false;
  let dir;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--save') {
      save = true;
    } else if (argument === '--dir') {
      dir = argv[index + 1];
      index += 1;

      if (dir === undefined) {
        usage('--dir attend un chemin.');
      }
    } else if (argument.startsWith('--')) {
      usage(`option inconnue « ${argument} »`);
    } else {
      positional.push(argument);
    }
  }

  const [url, rawLevel] = positional;

  if (url === undefined) {
    usage('URL manquante.');
  }

  const level = (rawLevel ?? 'L1').toUpperCase();

  if (!LEVELS.has(level)) {
    usage(`niveau « ${rawLevel} » inconnu (attendu : L1, L2 ou L3).`);
  }

  try {
    const parsed = new globalThis.URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      usage('seules les URL http et https sont acceptées.');
    }
  } catch {
    usage(`URL invalide « ${url} ».`);
  }

  return { url, level, save, dir };
}

/** Résume une analyse Lighthouse. */
function describeLighthouse(lighthouse) {
  if (lighthouse === null) {
    return 'Lighthouse     : non exécuté';
  }

  const { metrics } = lighthouse.performance;

  return [
    `Lighthouse     : performance ${lighthouse.performance.score}/100, SEO ${lighthouse.seo.score}/100`,
    `Core Web Vitals: LCP ${Math.round(metrics.lcp)} ms · INP ${Math.round(metrics.inp)} ms · CLS ${metrics.cls.toFixed(3)} · TTFB ${Math.round(metrics.ttfb)} ms`,
  ].join('\n');
}

/** Résume une analyse axe-core. */
function describeAxe(axe) {
  if (axe === null) {
    return 'axe-core       : non exécuté';
  }

  const ruleCount = axe.violations.length;

  return `axe-core       : ${axe.score}/100, ${ruleCount} règle(s) en échec, ${axe.passCount} règle(s) respectée(s)`;
}

/** Affiche le rapport sous une forme lisible. */
function printReport(result) {
  const lines = [
    '',
    `Inspection ${result.level} — ${result.metadata.url}`,
    `Titre          : ${result.metadata.title || '(aucun)'}`,
    `Durée          : ${(result.duration / 1000).toFixed(2)} s (budget ${(result.budget / 1000).toFixed(0)} s) ${result.withinBudget ? '✅' : '⚠️ dépassement'}`,
    `Accessibilité  : arbre ARIA ${result.accessibility.nodeCount} nœuds, ${result.accessibility.violations.length} violation(s)`,
    `              minor ${result.accessibility.counts.minor} · moderate ${result.accessibility.counts.moderate} · serious ${result.accessibility.counts.serious} · critical ${result.accessibility.counts.critical}`,
    describeLighthouse(result.lighthouse ?? null),
    describeAxe(result.axe ?? null),
  ];

  if (result.seo !== undefined) {
    lines.push(`SEO (DOM)      : ${result.seo.score}/100, ${result.seo.issues.length} constat(s)`);
  }

  if (result.ux !== undefined) {
    lines.push(`UX (Nielsen)   : ${result.ux.score}/100`);
  }

  if (result.content !== undefined) {
    lines.push(
      `Contenu        : ${result.content.score}/100 · ${result.content.wordCount} mots · ${result.content.readingTime} min · lisibilité ${result.content.readabilityScore}/100`,
    );
  }

  if (Object.keys(result.artifacts).length > 0) {
    lines.push(`Artefacts      : ${Object.keys(result.artifacts).join(', ')}`);
  }

  if (result.warnings.length > 0) {
    lines.push('Avertissements :');

    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  console.log(lines.join('\n'));
}

/** Attendu : `dist/` a été construit. */
function ensureBuild() {
  const entry = join(process.cwd(), 'dist', 'browser', 'inspection', 'inspector.js');

  if (!existsSync(entry)) {
    console.error('Erreur : dist/ est absent. Lancez d’abord « npm run build ».');
    process.exit(EXIT_FAILURE);
  }
}

ensureBuild();

const options = parseArguments(process.argv.slice(2));
const { Inspector } = await import('../dist/browser/inspection/inspector.js');

const inspector = new Inspector();

try {
  if (options.save) {
    const { result, reportPath } = await inspector.inspectAndSave({
      url: options.url,
      level: options.level,
      ...(options.dir === undefined ? {} : { outputDir: options.dir }),
    });

    printReport(result);
    console.log(`Rapport JSON   : ${reportPath}`);
  } else {
    const result = await inspector.inspect({ url: options.url, level: options.level });

    printReport(result);
  }
} catch (error) {
  console.error(
    `Inspection impossible : ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(EXIT_FAILURE);
}
