/**
 * Tests de l'orchestrateur : cycle de vie, choix du niveau, artefacts, rapport.
 *
 * L'ordre compte autant que le résultat : une session non refermée retient un
 * processus et, sous Windows, ses fichiers. Chaque test vérifie donc aussi que
 * `stop()` a bien été appelé, y compris quand une étape échoue.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { AxeAnalyzer } from '../../../src/browser/axe.js';
import { LighthouseAnalyzer } from '../../../src/browser/lighthouse.js';
import {
  debuggingArgs,
  DEFAULT_VIEWPORT,
  Inspector,
  REPORT_FILENAME,
  resolveOptions,
} from '../../../src/browser/inspection/inspector.js';
import { tempDir } from '../helpers.js';
import { createAxeRunner, createInspectionSession, createLighthouseRunner } from './fixtures.js';

/** Construit un inspecteur complet, sans navigateur. */
function makeInspector(sessionOptions: Parameters<typeof createInspectionSession>[0] = {}) {
  const created = createInspectionSession(sessionOptions);
  const lighthouse = createLighthouseRunner();
  const axe = createAxeRunner();

  const inspector = new Inspector({
    navigator: created.session,
    lighthouse: new LighthouseAnalyzer(lighthouse.runner),
    axe: new AxeAnalyzer(axe.runner),
    now: () => 1_700_000_000_000,
    reservePort: async () => 9222,
  });

  return { inspector, calls: created.calls, lighthouse: lighthouse.run, axe: axe.run };
}

describe('resolveOptions', () => {
  it('applique les valeurs par défaut', () => {
    const resolved = resolveOptions({ url: 'https://exemple.fr' });

    expect(resolved).toMatchObject({
      url: 'https://exemple.fr',
      level: 'L1',
      viewport: DEFAULT_VIEWPORT,
      timeout: 30_000,
      browserKind: 'chromium',
      screenshot: true,
      trace: false,
      pdf: false,
      strict: false,
    });
    expect(resolved.outputDir).toContain('inspections');
  });

  it('refuse un niveau inconnu', () => {
    expect(() => resolveOptions({ url: 'https://exemple.fr', level: 'L9' as never })).toThrow(
      /niveau inconnu/,
    );
  });

  it('refuse une URL vide', () => {
    expect(() => resolveOptions({ url: '   ' })).toThrow(/URL vide/);
  });
});

describe('debuggingArgs', () => {
  it('ouvre le port CDP demandé', () => {
    expect(debuggingArgs(9222)).toEqual(['--remote-debugging-port=9222']);
  });
});

describe('Inspector — niveau 1', () => {
  it('ouvre une session, navigue et la referme', async () => {
    const { inspector, calls } = makeInspector();
    const result = await inspector.inspect({ url: 'https://exemple.fr/guide' });

    expect(result.level).toBe('L1');
    expect(calls.start).toHaveBeenCalledWith(
      'chromium',
      expect.objectContaining({
        headless: true,
        context: { viewport: DEFAULT_VIEWPORT },
      }),
    );
    expect(calls.goto).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://exemple.fr/guide', waitUntil: 'load' }),
    );
    expect(calls.state.stopped).toBe(true);
  });

  it('ne réserve pas de port CDP pour le niveau 1', async () => {
    const { inspector, calls } = makeInspector();

    await inspector.inspect({ url: 'https://exemple.fr/guide' });

    expect(calls.start.mock.calls[0]?.[1]).not.toHaveProperty('args');
  });

  it('transmet le viewport et le user-agent au contexte', async () => {
    const { inspector, calls } = makeInspector();

    await inspector.inspect({
      url: 'https://exemple.fr/guide',
      viewport: { width: 390, height: 844 },
      userAgent: 'EktsBot/1.0',
    });

    expect(calls.start.mock.calls[0]?.[1]).toMatchObject({
      context: { viewport: { width: 390, height: 844 }, userAgent: 'EktsBot/1.0' },
    });
  });

  it('écrit le rapport JSON quand on le demande', async () => {
    const dir = tempDir('ekts-inspector-');
    const { inspector } = makeInspector();
    const { result, reportPath } = await inspector.inspectAndSave({
      url: 'https://exemple.fr/guide',
      outputDir: dir,
    });

    expect(reportPath).toBe(join(dir, REPORT_FILENAME));
    const written: unknown = JSON.parse(await readFile(reportPath, 'utf8'));

    expect(written).toMatchObject({ level: 'L1', url: 'https://exemple.fr/guide' });
    expect(result.artifacts.screenshot).toBe(join(dir, 'screenshot.png'));
  });
});

describe('Inspector — niveau 2', () => {
  it('réserve un port CDP et le transmet au moteur', async () => {
    const { inspector, calls, lighthouse } = makeInspector();

    const result = await inspector.inspect({ url: 'https://exemple.fr/guide', level: 'L2' });

    expect(result.level).toBe('L2');
    expect(calls.start).toHaveBeenCalledWith(
      'chromium',
      expect.objectContaining({ args: ['--remote-debugging-port=9222'] }),
    );
    expect(lighthouse).toHaveBeenCalledWith(
      { url: 'https://exemple.fr/guide', port: 9222 },
      {
        timeoutMs: 30_000,
      },
    );
  });

  it('n’ouvre pas de port CDP hors Chromium', async () => {
    const { inspector, calls } = makeInspector();

    const result = await inspector.inspect({
      url: 'https://exemple.fr/guide',
      level: 'L2',
      browserKind: 'firefox',
    });

    expect(calls.start).toHaveBeenCalledWith(
      'firefox',
      expect.not.objectContaining({ args: expect.anything() }),
    );
    expect(result.level).toBe('L2');
  });
});

describe('Inspector — niveau 3', () => {
  it('exécute axe-core sur la page ouverte', async () => {
    const { inspector, axe } = makeInspector();

    const result = await inspector.inspect({ url: 'https://exemple.fr/guide', level: 'L3' });

    expect(result.level).toBe('L3');
    expect(axe).toHaveBeenCalledOnce();
    if (result.level === 'L3') {
      expect(result.axe?.score).toBe(84);
      expect(result.ux.score).toBeGreaterThan(0);
    }
  });
});

describe('Inspector — artefacts', () => {
  it('enregistre une trace quand elle est demandée', async () => {
    const dir = tempDir('ekts-trace-');
    const { inspector, calls } = makeInspector();

    const result = await inspector.inspect({
      url: 'https://exemple.fr/guide',
      outputDir: dir,
      trace: true,
    });

    expect(calls.startTrace).toHaveBeenCalledOnce();
    expect(calls.stopTrace).toHaveBeenCalledWith({ path: join(dir, 'trace.zip') });
    expect(result.artifacts.trace).toBe(join(dir, 'trace.zip'));
  });

  it('imprime un PDF en Chromium quand il est demandé', async () => {
    const dir = tempDir('ekts-pdf-');
    const { inspector, calls } = makeInspector();

    const result = await inspector.inspect({
      url: 'https://exemple.fr/guide',
      outputDir: dir,
      pdf: true,
    });

    expect(calls.pdf).toHaveBeenCalledWith({ path: join(dir, 'page.pdf') });
    expect(result.artifacts.pdf).toBe(join(dir, 'page.pdf'));
  });

  it('n’imprime pas de PDF hors Chromium', async () => {
    const dir = tempDir('ekts-pdf-');
    const { inspector, calls } = makeInspector();

    await inspector.inspect({
      url: 'https://exemple.fr/guide',
      outputDir: dir,
      pdf: true,
      browserKind: 'firefox',
    });

    expect(calls.pdf).not.toHaveBeenCalled();
  });
});

describe('Inspector — erreurs et nettoyage', () => {
  it('referme la session quand la navigation échoue', async () => {
    const created = createInspectionSession();
    const inspector = new Inspector({
      navigator: created.session,
      now: () => 0,
      reservePort: async () => 9222,
    });
    created.calls.goto.mockRejectedValueOnce(new Error('DNS introuvable'));

    await expect(inspector.inspect({ url: 'https://absent.fr' })).rejects.toThrow(
      'DNS introuvable',
    );
    expect(created.calls.state.stopped).toBe(true);
  });

  it('referme la session quand le lancement échoue', async () => {
    const { inspector, calls } = makeInspector({ startError: new Error('moteur absent') });

    await expect(inspector.inspect({ url: 'https://exemple.fr' })).rejects.toThrow('moteur absent');
    expect(calls.state.stopped).toBe(true);
  });

  it('refuse un niveau inconnu avant d’ouvrir quoi que ce soit', async () => {
    const { inspector, calls } = makeInspector();

    await expect(
      inspector.inspect({ url: 'https://exemple.fr', level: 'L4' as never }),
    ).rejects.toThrow(/niveau inconnu/);
    expect(calls.start).not.toHaveBeenCalled();
  });
});

describe('Inspector — bac à sable', () => {
  it('signale un Firefox démarré sans bac à sable', async () => {
    const { inspector } = makeInspector({ sandboxDisabled: true });

    const result = await inspector.inspect({
      url: 'https://exemple.fr/guide',
      browserKind: 'firefox',
    });

    expect(result.warnings.join(' ')).toContain('sans bac à sable de contenu');
  });
});

describe('Inspector — horloge', () => {
  it('utilise l’horloge injectée pour les dates', async () => {
    const { inspector } = makeInspector();

    const result = await inspector.inspect({ url: 'https://exemple.fr/guide' });

    expect(result.timestamp).toBe(new Date(1_700_000_000_000).toISOString());
    expect(result.duration).toBe(0);
    expect(result.withinBudget).toBe(true);
  });

  it('expose le budget théorique d’un niveau', () => {
    const { inspector } = makeInspector();

    expect(inspector.budgetFor('L1')).toBe(10_000);
    expect(inspector.budgetFor('L2')).toBe(30_000);
    expect(inspector.budgetFor('L3')).toBe(60_000);
  });
});
