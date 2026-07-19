import assert from 'node:assert/strict';
import test from 'node:test';
import { contexts } from '../src/data.js';
import { diagnosticProjects } from '../src/projects.js';
import { createContextGuard } from './context-guard.js';
import { fixtureReport } from './experiment-engine.js';
import worker, { validContexts } from './site-worker.js';

const noAssets = {
  ASSETS: {
    fetch: async () => new Response('Not found', { status: 404 }),
  },
};

test('public deployment adapter exposes an honest fixture health response', async () => {
  const response = await worker.fetch(new Request('https://context-mri.test/api/health'), noAssets);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    model: 'gpt-5.6-sol',
    keyConfigured: false,
    experimentEngine: 'v4',
    deploymentMode: 'public-fixture',
  });
});

test('public deployment adapter makes live-run availability and non-fallback behavior explicit', async () => {
  const status = await worker.fetch(new Request('https://context-mri.test/api/live-status'), noAssets);
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), {
    available: false,
    model: 'gpt-5.6-sol',
    suiteRuns: 24,
    reason: 'This public no-login demo intentionally has no stored API key. Run a funded live audit from a self-hosted copy, then publish its raw artifact separately.',
  });

  const missingEvidence = await worker.fetch(new Request('https://context-mri.test/api/live-evidence'), noAssets);
  assert.equal(missingEvidence.status, 200);
  assert.equal(await missingEvidence.json(), null);

  const publishedEvidence = {
    generatedAt: '2026-07-18T20:00:00.000Z',
    report: { mode: 'live', model: 'gpt-5.6-sol', totalRuns: 24, baselineScore: 43, optimizedScore: 92 },
    reportFingerprint: 'fixture-independent-live-proof',
  };
  const availableEvidence = await worker.fetch(new Request('https://context-mri.test/api/live-evidence'), {
    ASSETS: { fetch: async () => Response.json(publishedEvidence) },
  });
  assert.deepEqual(await availableEvidence.json(), publishedEvidence);

  const live = await worker.fetch(new Request('https://context-mri.test/api/live/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts }),
  }), noAssets);
  assert.equal(live.status, 503);
  assert.deepEqual(await live.json(), { error: 'Fresh live runs are unavailable on this public fixture host. No fixture replay was substituted.' });

  const judgeLab = await worker.fetch(new Request('https://context-mri.test/api/judge-lab/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts }),
  }), noAssets);
  assert.equal(judgeLab.status, 503);
  assert.deepEqual(await judgeLab.json(), { error: 'Judge Lab is intentionally local and fresh-live only. This public fixture host stores no API key and never substitutes replay output.' });
});

test('public deployment adapter runs the complete fixture experiment', async () => {
  const response = await worker.fetch(new Request('https://context-mri.test/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts }),
  }), noAssets);
  const report = await response.json() as { mode: string; totalRuns: number; baselineScore: number; optimizedScore: number };
  assert.equal(response.status, 200);
  assert.deepEqual(report, {
    ...report,
    mode: 'fixture-replay',
    totalRuns: 21,
    baselineScore: 43,
    optimizedScore: 92,
  });
});

test('public deployment adapter rejects malformed context bundles', () => {
  assert.equal(validContexts([]), false);
  assert.equal(validContexts([{ id: 'duplicate', name: 'a.md', content: '', tokens: 0 }, { id: 'duplicate', name: 'b.md', content: '', tokens: 0 }]), false);
});

test('public deployment adapter selects a supported diagnostic contract and rejects unknown ids', async () => {
  const billing = diagnosticProjects.find(project => project.id === 'billing-api-migration')!;
  const supported = await worker.fetch(new Request('https://context-mri.test/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts: billing.contexts, projectId: billing.id }),
  }), noAssets);
  const report = await supported.json() as { evaluationContract: { id: string; expectedAnswer: string } };
  assert.equal(supported.status, 200);
  assert.equal(report.evaluationContract.id, billing.id);
  assert.equal(report.evaluationContract.expectedAnswer, '/v2/invoices');

  const rejected = await worker.fetch(new Request('https://context-mri.test/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts, projectId: 'unknown-project' }),
  }), noAssets);
  assert.equal(rejected.status, 400);
});

test('public deployment adapter checks a downloaded Context Guard without a secret', async () => {
  const billing = diagnosticProjects.find(project => project.id === 'billing-api-migration')!;
  const guard = await createContextGuard(fixtureReport(billing.contexts, billing.id), billing.contexts, '2026-07-18T20:00:00.000Z');
  const response = await worker.fetch(new Request('https://context-mri.test/api/guard/check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ guard, contexts: billing.contexts }),
  }), noAssets);
  const result = await response.json() as { status: string; score: number; flaggedFiles: Array<{ name: string }> };

  assert.equal(response.status, 200);
  assert.equal(result.status, 'blocked');
  assert.equal(result.score, 43);
  assert.equal(result.flaggedFiles[0].name, 'charges-quickstart.md');
});

test('public deployment adapter writes an absolute social image URL into HTML', async () => {
  const response = await worker.fetch(new Request('https://context-mri.test/', {
    headers: { accept: 'text/html' },
  }), {
    ASSETS: {
      fetch: async () => new Response('<meta property="og:image" content="__CONTEXT_MRI_OG_IMAGE__">', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    },
  });
  assert.match(await response.text(), /https:\/\/context-mri\.test\/og\.png/);
});
