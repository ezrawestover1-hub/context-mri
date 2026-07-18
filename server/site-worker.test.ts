import assert from 'node:assert/strict';
import test from 'node:test';
import { contexts } from '../src/data.js';
import { diagnosticProjects } from '../src/projects.js';
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
    experimentEngine: 'v3',
    deploymentMode: 'public-fixture',
  });
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
  const report = await supported.json() as { evaluationContract: { id: string; expectedEndpoint: string } };
  assert.equal(supported.status, 200);
  assert.equal(report.evaluationContract.id, billing.id);
  assert.equal(report.evaluationContract.expectedEndpoint, '/v2/invoices');

  const rejected = await worker.fetch(new Request('https://context-mri.test/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contexts, projectId: 'unknown-project' }),
  }), noAssets);
  assert.equal(rejected.status, 400);
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
