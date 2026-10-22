import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { PROVIDERS, mergeProviders } from '../../src/shared/providers/catalog.js';
import {
  DEFAULT_PROVIDERS_FILE,
  PROVIDERS_FILE_ENV,
  loadCustomProviders,
  loadProviderRegistry,
  resolveProvidersFile,
} from '../../src/shared/providers/custom-providers.js';
import { ValidationError } from '../../src/shared/errors.js';
import type { ProviderDescriptor } from '../../src/shared/providers/types.js';

/** Fichier temporaire propre, supprimé après chaque test (portable Windows). */
function temporaryFile(content?: string): { directory: string; file: string } {
  const directory = mkdtempSync(join(tmpdir(), 'ekts-providers-'));
  const file = join(directory, 'providers.custom.json');

  if (content !== undefined) {
    writeFileSync(file, content, 'utf8');
  }

  return { directory, file };
}

const directories: string[] = [];

afterEach(() => {
  while (directories.length > 0) {
    rmSync(directories.pop() as string, { recursive: true, force: true });
  }
});

/** Crée un fichier de déclaration et enregistre son dossier pour nettoyage. */
function declaration(content: string): string {
  const { directory, file } = temporaryFile(content);
  directories.push(directory);
  return file;
}

const mistral = {
  id: 'mistral',
  label: 'Mistral',
  envKeys: ['MISTRAL_API_KEY'],
  baseUrl: 'https://api.mistral.ai/v1/',
  protocol: 'openai-compatible',
  capabilities: ['chat'],
  chat: [{ model: 'mistral-large-latest', free: false }],
};

describe('resolveProvidersFile', () => {
  it('retombe sur le fichier par défaut du répertoire courant', () => {
    expect(resolveProvidersFile({ env: {}, cwd: '/base' })).toBe(
      join('/base', DEFAULT_PROVIDERS_FILE),
    );
  });

  it('suit EKTS_PROVIDERS_FILE', () => {
    const resolved = resolveProvidersFile({
      env: { [PROVIDERS_FILE_ENV]: 'config/providers.json' },
      cwd: '/base',
    });

    expect(resolved).toBe(join('/base', 'config', 'providers.json'));
  });

  it('ignore une variable vide et privilégie le chemin explicite', () => {
    expect(resolveProvidersFile({ env: { [PROVIDERS_FILE_ENV]: '   ' }, cwd: '/base' })).toBe(
      join('/base', DEFAULT_PROVIDERS_FILE),
    );
    expect(resolveProvidersFile({ env: {}, file: 'autre.json', cwd: '/base' })).toBe(
      join('/base', 'autre.json'),
    );
  });
});

describe('loadCustomProviders', () => {
  it('renvoie une liste vide quand le fichier est absent', () => {
    const { directory, file } = temporaryFile();
    directories.push(directory);

    expect(loadCustomProviders({ file })).toEqual([]);
  });

  it('lit une déclaration valide et la convertit en descripteur', () => {
    const file = declaration(JSON.stringify([mistral]));
    const [provider] = loadCustomProviders({ file });

    expect(provider).toMatchObject({
      id: 'mistral',
      label: 'Mistral',
      envKeys: ['MISTRAL_API_KEY'],
      baseUrl: 'https://api.mistral.ai/v1',
      protocol: 'openai-compatible',
      capabilities: ['chat'],
      status: 'verified',
      docsUrl: 'https://api.mistral.ai/v1',
    });
    expect(provider?.chat).toEqual([{ model: 'mistral-large-latest', free: false }]);
  });

  it('conserve les champs optionnels d’un fournisseur complet', () => {
    const file = declaration(
      JSON.stringify([
        {
          ...mistral,
          docsUrl: 'https://docs.mistral.ai',
          note: 'Palier gratuit limité',
          headers: { 'x-custom': '1' },
          embeddingExtra: { input_type: 'passage' },
          embeddings: [
            {
              model: 'mistral-embed',
              space: 'mistral/mistral-embed',
              dimensions: 1024,
              free: true,
              asymmetric: true,
              note: 'Complété par zéros',
            },
          ],
          capabilities: ['embedding', 'chat'],
        },
      ]),
    );
    const [provider] = loadCustomProviders({ file });

    expect(provider?.docsUrl).toBe('https://docs.mistral.ai');
    expect(provider?.note).toBe('Palier gratuit limité');
    expect(provider?.headers).toEqual({ 'x-custom': '1' });
    expect(provider?.embeddingExtra).toEqual({ input_type: 'passage' });
    expect(provider?.embeddings?.[0]).toMatchObject({
      dimensions: 1024,
      free: true,
      asymmetric: true,
      note: 'Complété par zéros',
    });
  });

  it('accepte un fournisseur sans modèle de chat (recherche seule)', () => {
    const search = {
      id: 'searchbox',
      label: 'Searchbox',
      envKeys: ['SEARCHBOX_API_KEY'],
      baseUrl: 'https://api.searchbox.example.com',
      protocol: 'tavily',
      capabilities: ['web-search'],
    };
    const file = declaration(JSON.stringify([search]));
    const [provider] = loadCustomProviders({ file });

    expect(provider?.capabilities).toEqual(['web-search']);
    expect(provider?.chat).toBeUndefined();
    expect(provider?.embeddings).toBeUndefined();
    expect(provider?.note).toBeUndefined();
  });

  it('refuse un JSON invalide', () => {
    const file = declaration('{ pas du json');

    expect(() => loadCustomProviders({ file })).toThrow(ValidationError);
    expect(() => loadCustomProviders({ file })).toThrow(/JSON invalide/);
  });

  it('refuse un document qui n’est pas un tableau', () => {
    const file = declaration(JSON.stringify({ providers: [] }));

    expect(() => loadCustomProviders({ file })).toThrow(/\(racine\)/);
  });

  it('refuse une base URL en clair', () => {
    const file = declaration(JSON.stringify([{ ...mistral, baseUrl: 'http://api.mistral.ai' }]));

    expect(() => loadCustomProviders({ file })).toThrow(/HTTPS obligatoire/);
  });

  it('refuse une clé écrite en dur dans les en-têtes', () => {
    const file = declaration(
      JSON.stringify([{ ...mistral, headers: { Authorization: 'Bearer secret' } }]),
    );

    expect(() => loadCustomProviders({ file })).toThrow(/authorization/);
  });

  it('refuse une capacité sans modèle', () => {
    const file = declaration(
      JSON.stringify([{ ...mistral, capabilities: ['embedding', 'chat'], chat: undefined }]),
    );

    expect(() => loadCustomProviders({ file })).toThrow(/« embedding » déclarée sans modèle/);
    expect(() => loadCustomProviders({ file })).toThrow(/« chat » déclarée sans modèle/);
  });

  it('signale un chemin illisible sans le confondre avec une absence', () => {
    const { directory } = temporaryFile();
    directories.push(directory);

    // Un dossier à la place d'un fichier : EISDIR sous Linux, EPERM/EISDIR sous
    // Windows — dans tous les cas autre chose que ENOENT.
    expect(() => loadCustomProviders({ file: directory })).toThrow(/lecture impossible/);
  });
});

describe('mergeProviders', () => {
  const custom = (id: string, label = id): ProviderDescriptor => ({
    id,
    label,
    envKeys: [`${id.toUpperCase()}_API_KEY`],
    baseUrl: `https://${id}.example.com`,
    protocol: 'openai-compatible',
    capabilities: ['chat'],
    docsUrl: `https://${id}.example.com`,
    status: 'verified',
    chat: [{ model: 'modele', free: false }],
  });

  it('ajoute un fournisseur inconnu en fin de registre', () => {
    const merged = mergeProviders([custom('zetia')]);

    expect(merged).toHaveLength(PROVIDERS.length + 1);
    expect(merged.at(-1)?.id).toBe('zetia');
  });

  it('remplace un fournisseur livré sans changer sa position', () => {
    const position = PROVIDERS.findIndex((provider) => provider.id === 'zai');
    const merged = mergeProviders([custom('zai', 'Z.ai (plan coding)')]);

    expect(merged).toHaveLength(PROVIDERS.length);
    expect(merged[position]?.label).toBe('Z.ai (plan coding)');
  });

  it('refuse un identifiant déclaré deux fois', () => {
    expect(() => mergeProviders([custom('zetia'), custom('zetia')])).toThrow(/déclaré deux fois/);
  });
});

describe('fichier d’exemple versionné', () => {
  it('reste valide (garde-fou contre la dérive de la documentation)', () => {
    const example = join(process.cwd(), 'providers.custom.example.json');
    const providers = loadCustomProviders({ file: example });

    expect(providers.length).toBeGreaterThan(0);
    expect(providers.every((provider) => provider.baseUrl.startsWith('https://'))).toBe(true);
  });
});

describe('loadProviderRegistry', () => {
  it('renvoie le catalogue livré en l’absence de fichier', () => {
    const { directory, file } = temporaryFile();
    directories.push(directory);

    expect(loadProviderRegistry({ file })).toBe(PROVIDERS);
  });

  it('fusionne le fichier avec le catalogue', () => {
    const file = declaration(JSON.stringify([mistral]));
    const registry = loadProviderRegistry({ file });

    expect(registry.map((provider) => provider.id)).toContain('mistral');
    expect(registry).toHaveLength(PROVIDERS.length + 1);
  });
});
