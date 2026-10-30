import { CommanderError } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmbeddingsService } from '../../src/business/embeddings.js';
import { exitCodeFor, runCli } from '../../src/cli/program.js';
import { migrations } from '../../src/data/migrations/index.js';
import { FakeEmbeddingProvider } from '../helpers/fake-embeddings.js';

/** Version de schéma courante, dérivée de la liste des migrations. */
const SCHEMA_VERSION = migrations.reduce((max, migration) => Math.max(max, migration.version), 0);

/** Espace d'embedding distinct de celui du runtime principal. */
const OTHER_SPACE = {
  space: 'baai/bge-m3',
  provider: 'novita',
  model: 'baai/bge-m3',
  dimensions: 1536,
};
import { openDatabase } from '../../src/data/database.js';
import {
  EmbeddingsError,
  ResourceNotFoundError,
  ValidationError,
} from '../../src/shared/errors.js';
import {
  createDataDir,
  createTestRuntime,
  fakeEmbeddings,
  removeDataDir,
  type TestRuntime,
} from './helpers.js';

const run = (runtime: TestRuntime, ...argv: string[]): Promise<number> => runCli(argv, runtime);

/** Analyse la sortie standard comme un objet JSON. */
function json<T = Record<string, unknown>>(runtime: TestRuntime): T {
  return JSON.parse(runtime.output.stdout) as T;
}

describe('CLI — programme', () => {
  let dataDir: string;
  let runtime: TestRuntime;

  beforeEach(() => {
    dataDir = createDataDir();
    runtime = createTestRuntime(dataDir, { embeddings: fakeEmbeddings() });
  });

  afterEach(() => {
    removeDataDir(dataDir);
    vi.unstubAllEnvs();
  });

  describe('aide et version', () => {
    it('affiche l’aide sans argument', async () => {
      expect(await run(runtime)).toBe(0);
      expect(runtime.output.stdout).toContain('Usage: ekts');
      expect(runtime.output.stdout).toContain('search [options] <query>');
    });

    it('affiche l’aide avec --help', async () => {
      expect(await run(runtime, '--help')).toBe(0);
      expect(runtime.output.stdout).toContain('init [options]');
    });

    it('affiche la version', async () => {
      expect(await run(runtime, '--version')).toBe(0);
      expect(runtime.output.stdout).toContain('0.2.0');
    });
  });

  describe('init', () => {
    it('crée les trois bases et le signale', async () => {
      expect(await run(runtime, 'init')).toBe(0);
      expect(runtime.output.stdout).toContain('Bases créées.');
      expect(runtime.output.stdout).toContain(`schéma       v${String(SCHEMA_VERSION)}`);
    });

    it('conserve les bases existantes', async () => {
      await run(runtime, 'init');
      runtime.output.stdout = '';

      expect(await run(runtime, 'init')).toBe(0);
      expect(runtime.output.stdout).toContain('déjà présentes');
    });

    it('réinitialise avec --force', async () => {
      await run(runtime, 'init');
      runtime.output.stdout = '';

      expect(await run(runtime, 'init', '--force', '--json')).toBe(0);
      expect(json(runtime)).toMatchObject({
        existed: true,
        reinitialized: true,
        schemaVersion: SCHEMA_VERSION,
        resources: 0,
      });
    });
  });

  describe('add et get', () => {
    it('ajoute une ressource complète', async () => {
      expect(
        await run(
          runtime,
          'add',
          '--type',
          'article',
          '--title',
          'Introduction à SQLite',
          '--url',
          'https://example.com/sqlite',
          '--tags',
          'sqlite, base',
          '--content',
          'SQLite est une base légère.',
        ),
      ).toBe(0);
      expect(runtime.output.stdout).toContain('Ressource créée');
      expect(runtime.output.stdout).toContain('https://example.com/sqlite');
      expect(runtime.output.stdout).toContain('sqlite, base');
      expect(runtime.output.stdout).toContain('plein texte + vecteurs');
    });

    it('produit un JSON exploitable et indexe les vecteurs', async () => {
      expect(await run(runtime, 'add', '--type', 'tool', '--title', 'Outil', '--json')).toBe(0);

      const created = json<{ id: string; type: string; vectorIndexed: boolean }>(runtime);

      expect(created.type).toBe('tool');
      expect(created.vectorIndexed).toBe(true);

      runtime.output.stdout = '';
      expect(await run(runtime, 'get', created.id, '--json')).toBe(0);
      expect(json<{ id: string }>(runtime).id).toBe(created.id);
    });

    it('retombe sur le seul index plein texte sans fournisseur', async () => {
      // Runtime hermétique : `env` vide par défaut, donc aucune clé — même si
      // le `.env` du poste en contient seize.
      const withoutKeys = createTestRuntime(dataDir);

      expect(
        await run(withoutKeys, 'add', '--type', 'article', '--title', 'Hors ligne', '--json'),
      ).toBe(0);
      expect(json<{ vectorIndexed: boolean }>(withoutKeys).vectorIndexed).toBe(false);
    });

    it('explique l’absence de vecteurs à l’écran', async () => {
      // Runtime hermétique : `env` vide par défaut, donc aucune clé — même si
      // le `.env` du poste en contient seize.
      const withoutKeys = createTestRuntime(dataDir);

      expect(await run(withoutKeys, 'add', '--type', 'article', '--title', 'Sans clé')).toBe(0);
      expect(withoutKeys.output.stdout).toContain('plein texte seul');
      expect(withoutKeys.output.stdout).toContain('aucun fournisseur d’embeddings configuré');
    });

    it('ne perd pas la ressource quand les crédits d’embeddings sont épuisés', async () => {
      const provider = new FakeEmbeddingProvider();
      provider.failOn = 'crédits';
      const exhausted = createTestRuntime(dataDir, {
        embeddings: new EmbeddingsService({ provider }),
      });

      const code = await run(
        exhausted,
        'add',
        '--type',
        'article',
        '--title',
        'Crédits épuisés',
        '--content',
        'crédits à zéro',
      );

      expect(code).toBe(0);
      expect(exhausted.output.stdout).toContain('Ressource créée');
      expect(exhausted.output.stdout).toContain('plein texte seul');
      expect(exhausted.output.stdout).toContain('vecteurs indisponibles');
      expect(exhausted.output.stderr).toBe('');

      exhausted.output.stdout = '';
      expect(await run(exhausted, 'search', 'crédits', '--mode', 'fts')).toBe(0);
      expect(exhausted.output.stdout).toContain('Crédits épuisés');
    });

    it('expose la raison de l’échec vectoriel en JSON', async () => {
      const provider = new FakeEmbeddingProvider();
      provider.failOn = 'quota';
      const exhausted = createTestRuntime(dataDir, {
        embeddings: new EmbeddingsService({ provider }),
      });

      expect(
        await run(
          exhausted,
          'add',
          '--type',
          'article',
          '--title',
          'Quota',
          '--content',
          'quota',
          '--json',
        ),
      ).toBe(0);

      const created = json<{ vectorIndexed: boolean; vectorWarning?: string }>(exhausted);

      expect(created.vectorIndexed).toBe(false);
      expect(created.vectorWarning).toContain('panne simulée');
    });

    it('affiche une ressource sans URL ni contenu', async () => {
      await run(runtime, 'add', '--type', 'article', '--title', 'Minimal', '--json');
      const id = json<{ id: string }>(runtime).id;
      runtime.output.stdout = '';

      expect(await run(runtime, 'get', id)).toBe(0);
      expect(runtime.output.stdout).toContain('(aucun)');
    });

    it('affiche l’URL et le contenu quand ils existent', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Complète',
        '--url',
        'https://example.com',
        '--tags',
        'url,test',
        '--content',
        'Un contenu.',
        '--json',
      );
      const id = json<{ id: string }>(runtime).id;
      runtime.output.stdout = '';

      expect(await run(runtime, 'get', id)).toBe(0);
      expect(runtime.output.stdout).toContain('https://example.com');
      expect(runtime.output.stdout).toContain('url, test');
      expect(runtime.output.stdout).toContain('11 caractères');
    });

    it('renvoie 3 pour un identifiant inconnu', async () => {
      expect(await run(runtime, 'get', '00000000-0000-4000-8000-000000000000')).toBe(3);
      expect(runtime.output.stderr).toContain('Ressource introuvable');
    });

    it('renvoie 4 pour des données invalides', async () => {
      expect(await run(runtime, 'add', '--type', 'bogus', '--title', 'Test')).toBe(4);
      expect(runtime.output.stderr).toContain('Validation échouée');
    });

    it('produit une erreur JSON en mode --json', async () => {
      expect(await run(runtime, 'add', '--type', 'bogus', '--title', 'Test', '--json')).toBe(4);

      const payload = JSON.parse(runtime.output.stderr) as {
        error: { code: string; message: string };
      };

      expect(payload.error.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'SQLite en pratique',
        '--tags',
        'sqlite,base',
        '--content',
        'SQLite est une base de données légère.',
        '--json',
      );
      runtime.output.stdout = '';
      await run(
        runtime,
        'add',
        '--type',
        'tool',
        '--title',
        'Outil SQLite',
        '--tags',
        'sqlite,outil',
        '--content',
        'Un outil pour inspecter SQLite.',
        '--json',
      );
      runtime.output.stdout = '';
    });

    it('cherche en hybride et affiche un tableau', async () => {
      expect(await run(runtime, 'search', 'sqlite')).toBe(0);
      expect(runtime.output.stdout).toContain('résultat(s) pour « sqlite »');
      expect(runtime.output.stdout).toContain('SQLite');
    });

    it('accepte un mode, une limite et des filtres', async () => {
      expect(await run(runtime, 'search', 'sqlite', '--mode', 'fts', '--limit', '1')).toBe(0);
      expect(runtime.output.stdout).toContain('mode fts');

      runtime.output.stdout = '';
      expect(await run(runtime, 'search', 'sqlite', '--mode', 'vector', '--type', 'tool')).toBe(0);
      expect(runtime.output.stdout).toContain('Outil SQLite');

      runtime.output.stdout = '';
      expect(await run(runtime, 'search', 'sqlite', '--tags', 'sqlite,outil')).toBe(0);
      expect(runtime.output.stdout).toContain('Outil SQLite');
    });

    it('produit un JSON complet', async () => {
      expect(await run(runtime, 'search', 'sqlite', '--json')).toBe(0);

      const payload = json<{ query: string; mode: string; count: number; results: unknown[] }>(
        runtime,
      );

      expect(payload.query).toBe('sqlite');
      expect(payload.mode).toBe('hybrid');
      expect(payload.count).toBeGreaterThan(0);
      expect(payload.results.length).toBe(payload.count);
    });

    it('signale l’absence de résultat', async () => {
      expect(await run(runtime, 'search', 'inexistant', '--mode', 'fts')).toBe(0);
      expect(runtime.output.stdout).toContain('Aucun résultat');
    });

    it('refuse l’hybride sans configuration d’embeddings', async () => {
      // Runtime hermétique : `env` vide par défaut, donc aucune clé — même si
      // le `.env` du poste en contient seize.
      const withoutKeys = createTestRuntime(dataDir);

      expect(await run(withoutKeys, 'search', 'sqlite')).toBe(1);
      expect(withoutKeys.output.stderr).toContain('Aucun fournisseur disponible');
      expect(withoutKeys.output.stderr).toContain('OPENAI_API_KEY');
    });

    it('reste utilisable en mode fts sans clé', async () => {
      // Runtime hermétique : `env` vide par défaut, donc aucune clé — même si
      // le `.env` du poste en contient seize.
      const withoutKeys = createTestRuntime(dataDir);

      expect(await run(withoutKeys, 'search', 'sqlite', '--mode', 'fts')).toBe(0);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Article',
        '--tags',
        'sqlite',
        '--json',
      );
      runtime.output.stdout = '';
      await run(
        runtime,
        'add',
        '--type',
        'tool',
        '--title',
        'Outil',
        '--tags',
        'sqlite,outil',
        '--json',
      );
      runtime.output.stdout = '';
    });

    it('liste toutes les ressources', async () => {
      expect(await run(runtime, 'list')).toBe(0);
      expect(runtime.output.stdout).toContain('2 ressources');
      expect(runtime.output.stdout).toContain('Article');
    });

    it('filtre par type, tags et pagine', async () => {
      expect(await run(runtime, 'list', '--type', 'tool')).toBe(0);
      expect(runtime.output.stdout).toContain('1 ressource');
      expect(runtime.output.stdout).not.toContain('Article');

      runtime.output.stdout = '';
      expect(await run(runtime, 'list', '--tags', 'sqlite', '--limit', '1', '--offset', '1')).toBe(
        0,
      );
      expect(runtime.output.stdout).toContain('1 ressource');
    });

    it('produit un JSON complet', async () => {
      expect(await run(runtime, '--json', 'list')).toBe(0);

      const payload = json<{ count: number; resources: unknown[] }>(runtime);

      expect(payload.count).toBe(2);
      expect(payload.resources).toHaveLength(2);
    });

    it('signale une liste vide', async () => {
      removeDataDir(dataDir);
      dataDir = createDataDir();
      runtime = createTestRuntime(dataDir, { embeddings: fakeEmbeddings() });

      expect(await run(runtime, 'list')).toBe(0);
      expect(runtime.output.stdout).toContain('Aucune ressource.');
    });
  });

  describe('delete', () => {
    let id: string;

    beforeEach(async () => {
      await run(runtime, 'add', '--type', 'article', '--title', 'À supprimer', '--json');
      id = json<{ id: string }>(runtime).id;
      runtime.output.stdout = '';
    });

    it('supprime avec --yes', async () => {
      expect(await run(runtime, 'delete', id, '--yes', '--json')).toBe(0);
      expect(json(runtime)).toEqual({ deleted: true, cancelled: false, id });
    });

    it('supprime après confirmation', async () => {
      const confirmed = createTestRuntime(dataDir, {
        embeddings: fakeEmbeddings(),
        confirm: () => Promise.resolve(true),
      });

      expect(await run(confirmed, 'delete', id)).toBe(0);
      expect(confirmed.output.stdout).toContain('Ressource supprimée');
    });

    it('annule quand la confirmation est refusée', async () => {
      const refused = createTestRuntime(dataDir, {
        embeddings: fakeEmbeddings(),
        confirm: () => Promise.resolve(false),
      });

      expect(await run(refused, 'delete', id, '--json')).toBe(0);
      expect(JSON.parse(refused.output.stdout)).toEqual({
        deleted: false,
        cancelled: true,
        id,
      });
    });

    it('affiche l’URL et le contenu quand ils existent', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Complète',
        '--url',
        'https://example.com',
        '--tags',
        'url,test',
        '--content',
        'Un contenu.',
        '--json',
      );
      const id = json<{ id: string }>(runtime).id;
      runtime.output.stdout = '';

      expect(await run(runtime, 'get', id)).toBe(0);
      expect(runtime.output.stdout).toContain('https://example.com');
      expect(runtime.output.stdout).toContain('url, test');
      expect(runtime.output.stdout).toContain('11 caractères');
    });

    it('renvoie 3 pour un identifiant inconnu', async () => {
      expect(await run(runtime, 'delete', 'inconnu', '--yes')).toBe(3);
    });
  });

  describe('reindex', () => {
    it('explique que rien n’a été fait sans --vectors', async () => {
      expect(await run(runtime, 'reindex')).toBe(0);
      expect(runtime.output.stdout).toContain('précisez --vectors');
    });

    it('réindexe les vecteurs dans l’espace courant', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Un',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      expect(await run(runtime, 'reindex', '--vectors', '--json')).toBe(0);

      const payload = json<{ vectors: { space: string; resources: number; switched: boolean } }>(
        runtime,
      );

      expect(payload.vectors.space).toBe('openai/fake-hash-1536');
      expect(payload.vectors.resources).toBe(1);
      expect(payload.vectors.switched).toBe(false);
    });

    it('affiche un bilan lisible', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Un',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      expect(await run(runtime, 'reindex', '--vectors')).toBe(0);
      expect(runtime.output.stdout).toContain('Réindexation vectorielle');
      expect(runtime.output.stdout).toContain('Index vectoriel à jour.');
    });

    it('signale les ressources restées sans vecteur', async () => {
      const provider = new FakeEmbeddingProvider();
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Un',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      provider.failOn = 'texte';
      const broken = createTestRuntime(dataDir, {
        embeddings: new EmbeddingsService({ provider }),
      });

      expect(await run(broken, 'reindex', '--vectors')).toBe(0);
      expect(broken.output.stdout).toContain('sans vecteur');
    });

    it('refuse de changer d’espace sans --force', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Un',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      const other = createTestRuntime(dataDir, {
        embeddings: fakeEmbeddings(),
        embeddingSpace: OTHER_SPACE,
      });

      expect(await run(other, 'reindex', '--vectors')).toBe(1);
      expect(other.output.stderr).toContain("Espace d'embedding incompatible");
    });

    it('bascule d’espace avec --force', async () => {
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'Un',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      const other = createTestRuntime(dataDir, {
        embeddings: fakeEmbeddings(),
        embeddingSpace: OTHER_SPACE,
      });

      expect(await run(other, 'reindex', '--vectors', '--force')).toBe(0);
      expect(other.output.stdout).toContain('Espace changé');
    });
  });

  describe('status', () => {
    it('signale une installation incomplète', async () => {
      expect(await run(runtime, 'status')).toBe(0);
      expect(runtime.output.stdout).toContain('absente');
      expect(runtime.output.stdout).toContain('bases incomplètes');
      expect(runtime.output.stdout).toContain('indisponible');
    });

    it('décrit les bases, les ressources et les vecteurs', async () => {
      await run(runtime, 'init', '--json');
      runtime.output.stdout = '';
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'SQLite',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      expect(await run(runtime, 'status', '--json')).toBe(0);

      const payload = json<{
        databases: { exists: boolean }[];
        resources: { total: number; consistent: boolean; byType: Record<string, number> };
        vectors: { count: number; space: string | null };
      }>(runtime);

      expect(payload.databases.every((database) => database.exists)).toBe(true);
      expect(payload.resources.total).toBe(1);
      expect(payload.resources.byType).toEqual({
        article: 1,
        video: 0,
        tutorial: 0,
        tool: 0,
        other: 0,
      });
      expect(payload.resources.consistent).toBe(true);
      expect(payload.vectors.count).toBe(1);
      expect(payload.vectors.space).toBe('openai/fake-hash-1536');
    });

    it('signale un index plein texte désynchronisé', async () => {
      await run(runtime, 'init', '--json');
      runtime.output.stdout = '';
      await run(
        runtime,
        'add',
        '--type',
        'article',
        '--title',
        'SQLite',
        '--content',
        'texte',
        '--json',
      );
      runtime.output.stdout = '';

      const database = openDatabase({ dataDir });
      database.connection.exec('DELETE FROM fts.resources_fts');
      database.close();

      expect(await run(runtime, 'status')).toBe(0);
      expect(runtime.output.stdout).toContain('non (exécutez');
    });

    it('affiche un état vide sans ressource', async () => {
      await run(runtime, 'init', '--json');
      runtime.output.stdout = '';

      expect(await run(runtime, 'status')).toBe(0);
      expect(runtime.output.stdout).toContain('(aucune)');
      expect(runtime.output.stdout).toContain('(non lié)');
    });
  });

  describe('options globales et erreurs', () => {
    it('désactive les couleurs avec --no-colors', async () => {
      const colored = createTestRuntime(dataDir, { embeddings: fakeEmbeddings(), color: true });

      expect(await run(colored, 'init', '--no-colors')).toBe(0);
      expect(colored.output.stdout).not.toContain('\u001b[');
    });

    it('colore la sortie quand le runtime l’autorise', async () => {
      const colored = createTestRuntime(dataDir, { embeddings: fakeEmbeddings(), color: true });

      expect(await run(colored, 'init')).toBe(0);
      expect(colored.output.stdout).toContain('\u001b[');
    });

    it('renvoie 2 pour une option inconnue', async () => {
      expect(await run(runtime, 'list', '--inconnue')).toBe(2);
      expect(runtime.output.stderr).toContain('unknown option');
    });

    it('renvoie 2 pour une sous-commande inconnue', async () => {
      expect(await run(runtime, 'inconnue')).toBe(2);
    });

    it('formate une erreur inattendue en JSON', async () => {
      const broken = createTestRuntime(dataDir, {
        openServices: () => {
          throw new Error('boum');
        },
      });

      expect(await run(broken, 'list', '--json')).toBe(1);

      const payload = JSON.parse(broken.output.stderr) as {
        error: { code: string; message: string };
      };

      expect(payload.error).toEqual({ code: 'CLI_ERROR', message: 'boum' });
    });

    it('traite une erreur survenue hors d’une action', async () => {
      const broken = createTestRuntime(dataDir, {
        color: true,
        openServices: () => {
          throw new Error('inutilisé');
        },
      });

      broken.io.write = () => {
        throw new Error('sortie indisponible');
      };

      expect(await run(broken, '--help')).toBe(1);
      expect(broken.output.stderr).toContain('sortie indisponible');
    });

    it('formate une erreur qui n’est pas un objet Error', async () => {
      const broken = createTestRuntime(dataDir, {
        openServices: () => {
          throw 'texte brut';
        },
      });

      expect(await run(broken, 'list')).toBe(1);
      expect(broken.output.stderr).toContain('Erreur : texte brut');
    });
  });
});

describe('exitCodeFor', () => {
  it('associe un code à chaque famille d’erreur', () => {
    expect(exitCodeFor(new ResourceNotFoundError('id'))).toBe(3);
    expect(exitCodeFor(new ValidationError(['x']))).toBe(4);
    expect(exitCodeFor(new EmbeddingsError('x'))).toBe(1);
    expect(exitCodeFor(new CommanderError(0, 'commander.helpDisplayed', 'aide'))).toBe(0);
    expect(exitCodeFor(new CommanderError(1, 'commander.unknownOption', 'erreur'))).toBe(2);
    expect(exitCodeFor(new Error('inconnue'))).toBe(1);
  });

  it('accepte une valeur qui n’est pas une erreur', () => {
    expect(exitCodeFor('boom')).toBe(1);
  });
});
