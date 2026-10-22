#!/usr/bin/env node
/**
 * Affiche l'état du registre de fournisseurs : clés détectées, capacités
 * couvertes, espaces d'embedding disponibles et chaîne d'appel résolue.
 *
 * Aucun appel réseau, aucun coût : seules les métadonnées du catalogue et la
 * présence des variables d'environnement sont examinées. Les clés sont
 * masquées.
 *
 * Prérequis : `npm run build` (le script consomme le code compilé de `dist/`).
 * Usage : `npm run providers`
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadEnvFile } from '../dist/shared/env-file.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const compiledEntry = join(root, 'dist', 'shared', 'providers', 'catalog.js');

if (!existsSync(compiledEntry)) {
  console.error('dist/shared/providers/catalog.js est absent — exécuter `npm run build`.');
  process.exit(1);
}

const loadedEnv = loadEnvFile(join(root, '.env'));

const { PROVIDERS, allCapabilities, usableProviders } = await import(
  pathToFileURL(compiledEntry).href
);
const { loadKeyring, maskKey } = await import(
  pathToFileURL(join(root, 'dist', 'shared', 'providers', 'env.js')).href
);
const { planRoutes, availableSpaces } = await import(
  pathToFileURL(join(root, 'dist', 'business', 'providers', 'routing.js')).href
);

const keyring = loadKeyring(process.env);
const capabilities = allCapabilities();
const totalKeys = [...keyring.values()].reduce((sum, keys) => sum + keys.length, 0);

const line = '='.repeat(78);
const dash = '-'.repeat(78);

console.log(line);
console.log('EKTS — fournisseurs d’API (Sprint 4.5)');
console.log(line);
console.log(`Fichier .env          : ${loadedEnv ? 'chargé' : 'absent ou vide'}`);
console.log(`Fournisseurs connus   : ${PROVIDERS.length}`);
console.log(`Fournisseurs avec clé : ${keyring.size}`);
console.log(`Clés détectées        : ${totalKeys}`);
console.log(`Capacités             : ${capabilities.join(', ')}`);
console.log(line);

// --- Tableau des fournisseurs -------------------------------------------------
const pad = (text, width) => String(text).padEnd(width).slice(0, width);

console.log(
  `${pad('Fournisseur', 22)}${pad('Capacités', 30)}${pad('Clés', 6)}${pad('État', 13)}Clé (masquée)`,
);
console.log(dash);

for (const provider of PROVIDERS) {
  const keys = keyring.get(provider.id) ?? [];
  const status =
    keys.length === 0 ? 'sans clé' : provider.status === 'unverified' ? 'non vérifié' : 'prêt';
  const masked = keys.length === 0 ? '—' : keys.map((key) => maskKey(key)).join(', ');

  console.log(
    `${pad(provider.label, 22)}${pad(provider.capabilities.join(', ') || 'aucune', 30)}${pad(keys.length, 6)}${pad(status, 13)}${masked}`,
  );
}

// --- Espaces d'embedding ------------------------------------------------------
console.log(line);
console.log(
  'Espaces d’embedding configurés (des vecteurs de modèles différents ne sont pas comparables)',
);
console.log(dash);

const spaces = availableSpaces(keyring);

if (spaces.length === 0) {
  console.log('  aucun : renseignez au moins une clé OPENAI / GEMINI / OPENROUTER / NOVITA');
} else {
  for (const space of spaces) {
    const providers = space.providers.map((provider) => provider.id).join(', ');
    const native =
      space.dimensions === 1536 ? '1536 stockés' : `natif ${space.dimensions} → 1536 stockés`;
    console.log(
      `  ${pad(space.space, 34)}${pad(native, 28)}${space.free ? 'gratuit' : 'payant '}  via ${providers}`,
    );
  }
}

// --- Chaîne d'appel -----------------------------------------------------------
const policy = process.env.EKTS_PROVIDER_POLICY?.trim() || 'quality';
const forcedSpace = process.env.EKTS_EMBEDDING_SPACE?.trim() || undefined;

console.log(line);
console.log(
  `Chaîne d’appel résolue (politique : ${policy}${forcedSpace ? `, espace imposé : ${forcedSpace}` : ''})`,
);
console.log(dash);

for (const capability of capabilities) {
  const routes = planRoutes({
    capability,
    keyring,
    policy,
    ...(forcedSpace === undefined ? {} : { space: forcedSpace }),
  });

  if (routes.length === 0) {
    console.log(`  ${pad(capability, 12)} aucun fournisseur`);
    continue;
  }

  const chain = [
    ...new Set(
      routes.map((route) => `${route.provider.id}${route.model === '' ? '' : `/${route.model}`}`),
    ),
  ]
    .slice(0, 6)
    .join(' → ');

  const extra = routes.length > 6 ? ` (+${routes.length - 6})` : '';
  console.log(`  ${pad(capability, 12)} ${chain}${extra}`);
}

// --- Avertissements -----------------------------------------------------------
const warnings = [];

if (totalKeys === 0) {
  warnings.push('aucune clé détectée : copiez .env.example en .env et renseignez-en au moins une');
}

for (const provider of PROVIDERS) {
  if (provider.status === 'unverified' && (keyring.get(provider.id)?.length ?? 0) > 0) {
    warnings.push(
      `${provider.label} : protocole non confirmé — la clé est collectée mais aucun appel ne sera effectué`,
    );
  }
}

for (const provider of usableProviders('embedding')) {
  if (provider.embeddings.length === 0) {
    warnings.push(`${provider.id} : déclaré « embedding » sans modèle`);
  }
}

if (spaces.length > 1) {
  warnings.push(
    `${spaces.length} espaces d’embedding possibles : l’index se lie au premier disponible. Imposez le vôtre avec EKTS_EMBEDDING_SPACE`,
  );
}

if (warnings.length > 0) {
  console.log(line);
  console.log('Points d’attention');

  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

console.log(line);
