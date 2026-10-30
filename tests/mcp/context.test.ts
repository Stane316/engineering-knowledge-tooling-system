import { describe, expect, it, vi } from 'vitest';

import type { AnalysisReport } from '../../src/analysis/types.js';
import type {
  AxeAnalysis,
  ContentAnalysis,
  LighthouseAnalysis,
  UxAnalysis,
} from '../../src/browser/inspection/types.js';
import { openMcpServices } from '../../src/mcp/context.js';
import { ValidationError } from '../../src/shared/errors.js';
import { createDataDir, removeDataDir } from '../cli/helpers.js';
import { openTestServices } from './helpers.js';

/**
 * Le corps de `inspectAndAudit` est exercé sans réseau : seule l'étape
 * navigateur (l'unique appel sortant) est remplacée par une fixture L3 ;
 * conversion, analyse, stockage et indexation restent réels.
 */
const { inspectMock, analyzeMock } = vi.hoisted(() => ({
  inspectMock: vi.fn(),
  analyzeMock: vi.fn(),
}));

vi.mock('../../src/browser/inspection/inspector.js', () => ({
  Inspector: class {
    readonly inspect = inspectMock;
  },
}));

vi.mock('../../src/analysis/pipeline.js', () => ({
  AnalysisPipeline: class {
    readonly analyze = analyzeMock;
  },
}));

describe('openMcpServices', () => {
  it('ouvre une base vide sans fournisseur et la ferme', async () => {
    const dataDir = createDataDir();
    const services = openMcpServices({ dataDir, env: {} });

    try {
      expect(services.dataDir).toBe(dataDir);
      expect(services.embeddingsAvailable).toBe(false);
      await expect(services.manager.listResources()).resolves.toEqual([]);
    } finally {
      services.close();
      // Fermeture idempotente : un second appel ne lève pas.
      services.close();
      removeDataDir(dataDir);
    }
  });

  it('déduit le répertoire de données de l’environnement', () => {
    const dataDir = createDataDir();
    const services = openMcpServices({ env: { EKTS_DATA_DIR: dataDir } });

    try {
      expect(services.dataDir).toBe(dataDir);
    } finally {
      services.close();
      removeDataDir(dataDir);
    }
  });

  it('expose les embeddings quand un fournisseur est injecté', async () => {
    const fixture = openTestServices({ embeddings: true });

    try {
      expect(fixture.services.embeddingsAvailable).toBe(true);

      await fixture.services.manager.addResource({ type: 'article', title: 'Avec vecteurs' });

      const results = await fixture.services.search.search('vecteurs', { mode: 'vector' });

      expect(results).toHaveLength(1);
    } finally {
      fixture.cleanup();
    }
  });
});

/** Rapport d'analyse minimal produit par le double du pipeline. */
function makeReport(url: string): AnalysisReport {
  const dim = (name: 'performance' | 'accessibility' | 'seo' | 'ux' | 'content') => ({
    dimension: name,
    score: 78,
    status: 'measured' as const,
    findings: [],
    summary: `Score ${name} : 78/100.`,
  });
  return {
    url,
    timestamp: '2026-10-25T00:00:00.000Z',
    dimensions: {
      performance: dim('performance'),
      accessibility: dim('accessibility'),
      seo: dim('seo'),
      ux: dim('ux'),
      content: dim('content'),
    },
    findings: [],
    priorityFindings: [],
    summary: {
      totalFindings: 0,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      infoFindings: 0,
      overallScore: { status: 'measured' as const, value: 78 },
    },
  };
}

/** Blocs d'analyse d'une inspection L3 valide. */
const lighthouseFixture: LighthouseAnalysis = {
  performance: {
    score: 100,
    metrics: { lcp: 220, inp: 36, cls: 0.004, ttfb: 92, fcp: 180, speedIndex: 260 },
  },
  seo: { score: 80, issues: [] },
  url: 'https://example.com/',
  version: '13.5.0',
  duration: 4200,
};
const axeFixture: AxeAnalysis = {
  violations: [],
  score: 73,
  passCount: 11,
  inapplicableCount: 40,
  duration: 300,
};
const uxFixture: UxAnalysis = {
  score: 85,
  heuristics: [
    {
      id: 'status',
      name: 'Visibility of system status',
      score: 60,
      issues: ['Pas de progression'],
    },
  ],
};
const contentFixture: ContentAnalysis = {
  score: 55,
  wordCount: 133,
  readingTime: 1,
  readabilityScore: 77,
  structure: { paragraphs: 4, lists: 0, tables: 0, headings: 2 },
};

describe('audits.inspectAndAudit', () => {
  it('exige le niveau L3 avant toute navigation', async () => {
    const fixture = openTestServices();

    try {
      await expect(
        fixture.services.audits.inspectAndAudit({ url: 'https://example.com', level: 'L1' }),
      ).rejects.toThrow(ValidationError);
      await expect(
        fixture.services.audits.inspectAndAudit({ url: 'https://example.com', level: 'L1' }),
      ).rejects.toThrow(/L3/);
      expect(inspectMock).not.toHaveBeenCalled();
    } finally {
      fixture.cleanup();
    }
  });

  it("inspecte, analyse, stocke et indexe l'audit puis le renvoie", async () => {
    const url = 'https://example.com';
    inspectMock.mockResolvedValue({
      url,
      timestamp: '2026-10-25T00:00:00.000Z',
      duration: 420,
      budget: 3000,
      level: 'L3',
      lighthouse: lighthouseFixture,
      axe: axeFixture,
      ux: uxFixture,
      content: contentFixture,
    });
    analyzeMock.mockResolvedValue(makeReport(url));
    const fixture = openTestServices();

    try {
      const { audit, report } = await fixture.services.audits.inspectAndAudit({
        url,
        level: 'L3',
      });

      expect(report.summary.overallScore).toEqual({ status: 'measured', value: 78 });
      expect(audit.metadata.url).toBe(url);
      expect(audit.metadata.id).toBeGreaterThan(0);
      expect(fixture.services.audits.repository.findById(audit.metadata.id!)).not.toBeNull();
      expect(inspectMock).toHaveBeenCalledWith({ url, level: 'L3' });
      expect(analyzeMock).toHaveBeenCalledTimes(1);
    } finally {
      fixture.cleanup();
    }
  });

  it("signale une inspection retournée d'un niveau inattendu", async () => {
    inspectMock.mockResolvedValue({
      url: 'https://example.com',
      timestamp: '2026-10-25T00:00:00.000Z',
      duration: 90,
      budget: 2000,
      level: 'L1',
    });
    const fixture = openTestServices();

    try {
      await expect(
        fixture.services.audits.inspectAndAudit({ url: 'https://example.com', level: 'L3' }),
      ).rejects.toThrow(/inspection inattendue/);
    } finally {
      fixture.cleanup();
    }
  });
});
