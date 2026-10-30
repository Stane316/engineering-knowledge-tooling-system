/**
 * Politique d'exposition MCP — cas unitaires (Sprint 21-01).
 *
 * Ces cas complètent `profile-exposure.test.ts`, qui prouve le comportement de
 * bout en bout. Ils couvrent les branches internes de la résolution (espaces,
 * casse, nom d'outil inexistant, ordre d'exposition) que l'intégration
 * n'atteint pas.
 *
 * Ils ont été ajoutés **après** la création du module : ce sont des GREEN
 * initiaux, pas un RED — le RED comportemental de ce sous-sprint est consigné
 * dans `SPRINT-21-01-RESULTAT.md`.
 */

import { describe, expect, it } from 'vitest';

import {
  allowedTools,
  assertValidPolicy,
  isToolAllowed,
  MCP_PROFILES,
  READ_TOOL_NAMES,
  resolveProfile,
} from '../../src/mcp/profiles.js';
import { TOOL_NAMES } from '../../src/mcp/schemas/tool-schemas.js';

describe('resolveProfile — sélection et échec fermé', () => {
  it('sans variable, conserve le profil complet historique', () => {
    const profile = resolveProfile(undefined);

    expect(profile.name).toBe('full');
    expect(profile.tools).toEqual([...TOOL_NAMES]);
    expect(profile.requireExplicitFtsMode).toBe(false);
  });

  it('« read » expose exactement les trois outils et exige le mode explicite', () => {
    const profile = resolveProfile('read');

    expect(profile.tools).toEqual([...READ_TOOL_NAMES]);
    expect(profile.requireExplicitFtsMode).toBe(true);
  });

  it('tolère les espaces de bord sans changer de profil', () => {
    expect(resolveProfile('  read  ').name).toBe('read');
  });

  it('refuse un nom inconnu plutôt que de retomber sur le profil complet', () => {
    expect(() => resolveProfile('administrateur')).toThrow(/profil MCP inconnu/i);
  });

  it('refuse la casse inattendue : aucun profil n’est deviné', () => {
    expect(() => resolveProfile('READ')).toThrow(/profil MCP inconnu/i);
  });

  it('refuse une valeur vide sans la confondre avec l’absence', () => {
    expect(() => resolveProfile('')).toThrow(/vide ou malformé/i);
    expect(() => resolveProfile('   ')).toThrow(/vide ou malformé/i);
  });
});

describe('assertValidPolicy — une politique inutilisable ne démarre pas', () => {
  it('refuse une politique sans outil autorisé', () => {
    expect(() =>
      assertValidPolicy({ name: 'read', tools: [], requireExplicitFtsMode: true }),
    ).toThrow(/politique du profil « read » vide/i);
  });

  it('refuse un nom d’outil inexistant (faute de frappe)', () => {
    expect(() =>
      assertValidPolicy({
        name: 'test',
        tools: ['search_knowledge', 'outil_fantome'],
        requireExplicitFtsMode: false,
      }),
    ).toThrow(/outil inconnu « outil_fantome »/i);
  });

  it('accepte les politiques livrées', () => {
    expect(() => assertValidPolicy(MCP_PROFILES.read)).not.toThrow();
    expect(() => assertValidPolicy(MCP_PROFILES.full)).not.toThrow();
  });
});

describe('isToolAllowed / allowedTools', () => {
  const read = MCP_PROFILES.read;

  it('autorise les trois noms et refuse les autres', () => {
    expect(isToolAllowed(read, 'search_knowledge')).toBe(true);
    expect(isToolAllowed(read, 'inspect_site')).toBe(false);
    expect(isToolAllowed(read, 'create_project')).toBe(false);
  });

  it('conserve l’ordre de la politique dans l’exposition filtrée', () => {
    const filtered = allowedTools(
      {
        name: 'test',
        tools: ['list_resources', 'search_knowledge'],
        requireExplicitFtsMode: false,
      },
      [{ name: 'search_knowledge' }, { name: 'get_resource' }, { name: 'list_resources' }],
    );

    expect(filtered.map((tool) => tool.name)).toEqual(['list_resources', 'search_knowledge']);
  });

  it('ignore un nom demandé qui n’a pas de définition (pas d’invention)', () => {
    const filtered = allowedTools(
      { name: 'test', tools: ['search_knowledge', 'disparu'], requireExplicitFtsMode: false },
      [{ name: 'search_knowledge' }],
    );

    expect(filtered).toHaveLength(1);
  });
});
