import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticProjects } from '../src/projects.js';
import { checkContextGuard, createContextGuard, isContextGuard } from './context-guard.js';
import { fixtureReport } from './experiment-engine.js';

test('creates a portable guard from evidence and blocks the original stale billing library', () => {
  const billing = diagnosticProjects.find(project => project.id === 'billing-api-migration')!;
  const guard = createContextGuard(fixtureReport(billing.contexts, billing.id), '2026-07-18T20:00:00.000Z');
  const result = checkContextGuard(guard, billing.contexts, '2026-07-18T20:01:00.000Z');

  assert.equal(guard.projectId, billing.id);
  assert.equal(guard.minimumScore, 80);
  assert.deepEqual(guard.blockedTerms, ['/v1/charges']);
  assert.equal(result.status, 'blocked');
  assert.equal(result.score, 43);
  assert.deepEqual(result.flaggedFiles, [{ contextId: 'legacy', name: 'charges-quickstart.md', terms: ['/v1/charges'] }]);
  assert.match(result.reasons.join(' '), /below the required 80/);
});

test('allows the measured recommended pack to pass the matching regression guard', () => {
  const support = diagnosticProjects.find(project => project.id === 'support-api-migration')!;
  const report = fixtureReport(support.contexts, support.id);
  const guard = createContextGuard(report, '2026-07-18T20:00:00.000Z');
  const recommended = support.contexts.filter(context => report.recommendedContextIds.includes(context.id));
  const result = checkContextGuard(guard, recommended, '2026-07-18T20:01:00.000Z');

  assert.equal(result.status, 'pass');
  assert.equal(result.score, 92);
  assert.equal(result.flaggedFiles.length, 0);
  assert.match(result.reasons[0], /clears the 80\/100 threshold/);
});

test('accepts only a complete supported Context Guard payload', () => {
  const report = fixtureReport(diagnosticProjects[0].contexts);
  const guard = createContextGuard(report);
  assert.equal(isContextGuard(guard), true);
  assert.equal(isContextGuard({ ...guard, projectId: 'not-a-contract' }), false);
  assert.equal(isContextGuard({ ...guard, blockedTerms: [] }), false);
});
