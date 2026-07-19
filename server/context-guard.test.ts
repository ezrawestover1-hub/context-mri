import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticProjects } from '../src/projects.js';
import { checkContextGuard, createContextGuard, isContextGuard } from './context-guard.js';
import { fixtureReport } from './experiment-engine.js';

test('creates a portable guard from evidence and blocks the original stale billing library', async () => {
  const billing = diagnosticProjects.find(project => project.id === 'billing-api-migration')!;
  const guard = await createContextGuard(fixtureReport(billing.contexts, billing.id), billing.contexts, '2026-07-18T20:00:00.000Z');
  const result = await checkContextGuard(guard, billing.contexts, '2026-07-18T20:01:00.000Z');

  assert.equal(guard.projectId, billing.id);
  assert.equal(guard.minimumScore, 80);
  assert.deepEqual(guard.blockedTerms, ['/v1/charges']);
  assert.equal(result.status, 'blocked');
  assert.equal(result.score, 43);
  assert.deepEqual(result.flaggedFiles, [{ contextId: 'legacy', name: 'charges-quickstart.md', terms: ['/v1/charges'] }]);
  assert.match(result.reasons.join(' '), /below the required 80/);
});

test('allows the measured recommended pack to pass the matching regression guard', async () => {
  const support = diagnosticProjects.find(project => project.id === 'support-api-migration')!;
  const report = fixtureReport(support.contexts, support.id);
  const guard = await createContextGuard(report, support.contexts, '2026-07-18T20:00:00.000Z');
  const recommended = support.contexts.filter(context => report.recommendedContextIds.includes(context.id));
  const result = await checkContextGuard(guard, recommended, '2026-07-18T20:01:00.000Z');

  assert.equal(result.status, 'pass');
  assert.equal(result.score, 92);
  assert.equal(result.flaggedFiles.length, 0);
  assert.match(result.reasons[0], /clears the 80\/100 threshold/);
});

test('accepts only a complete supported Context Guard payload', async () => {
  const report = fixtureReport(diagnosticProjects[0].contexts);
  const guard = await createContextGuard(report, diagnosticProjects[0].contexts);
  assert.equal(isContextGuard(guard), true);
  assert.equal(isContextGuard({ ...guard, projectId: 'not-a-contract' }), false);
  assert.equal(isContextGuard({ ...guard, blockedTerms: [] }), false);
});

test('blocks a guard with a changed expected answer or changed recommended source file', async () => {
  const support = diagnosticProjects[0];
  const report = fixtureReport(support.contexts, support.id);
  const guard = await createContextGuard(report, support.contexts, '2026-07-18T20:00:00.000Z');
  const tamperedGuard = { ...guard, expectedAnswer: '/v1/chat/completions' };
  const tamperedGuardResult = await checkContextGuard(tamperedGuard, support.contexts, '2026-07-18T20:01:00.000Z');
  assert.equal(tamperedGuardResult.status, 'blocked');
  assert.equal(tamperedGuardResult.integrity.contract, false);
  assert.equal(tamperedGuardResult.integrity.artifact, false);

  const changedRecommended = support.contexts.map(context => context.id === 'schema' ? { ...context, content: `${context.content}\nChanged after guard creation.` } : context);
  const changedPackResult = await checkContextGuard(guard, changedRecommended, '2026-07-18T20:01:00.000Z');
  assert.equal(changedPackResult.status, 'blocked');
  assert.equal(changedPackResult.integrity.recommendedPack, false);
});

test('creates a procedure-specific guard for the security release contract', async () => {
  const security = diagnosticProjects.find(project => project.id === 'security-release-safety')!;
  const report = fixtureReport(security.contexts, security.id);
  const guard = await createContextGuard(report, security.contexts, '2026-07-18T20:00:00.000Z');
  const recommended = security.contexts.filter(context => report.recommendedContextIds.includes(context.id));
  const result = await checkContextGuard(guard, recommended, '2026-07-18T20:01:00.000Z');

  assert.equal(guard.schemaVersion, '1.2');
  assert.equal(guard.expectedAnswer, 'the short-lived credential broker');
  assert.deepEqual(guard.blockedTerms, ['paste the production token into the CI environment']);
  assert.equal(result.status, 'pass');
  assert.equal(result.score, 100);
});
