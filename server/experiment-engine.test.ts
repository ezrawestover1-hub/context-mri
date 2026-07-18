import test from 'node:test';
import assert from 'node:assert/strict';
import { contexts } from '../src/data.js';
import { fixtureReport, scoreAnswer } from './experiment-engine.js';

test('scores a fully correct structured answer at 100', () => {
  const result = scoreAnswer({
    recommendedEndpoint: '/v1/responses',
    explanation: 'The current machine-readable schema specifies /v1/responses. The archived /v1/chat/completions guide conflicts with it and should not be used.',
  });
  assert.equal(result.score, 100);
});

test('independently scores the explanation instead of trusting model-reported claims', () => {
  const unsupported = scoreAnswer({
    recommendedEndpoint: '/v1/responses',
    explanation: 'Use this endpoint.',
  });

  assert.equal(unsupported.score, 55);
  assert.deepEqual(unsupported.breakdown, {
    endpointAccuracy: 50,
    recencyReasoning: 0,
    legacyRejection: 0,
    conflictExplanation: 0,
    schemaValidity: 5,
  });
});

test('does not award legacy or conflict points for keyword-free assertions', () => {
  const result = scoreAnswer({
    recommendedEndpoint: '/v1/responses',
    explanation: 'The current tool schema is the source of truth.',
  });

  assert.equal(result.score, 75);
  assert.equal(result.breakdown.legacyRejection, 0);
  assert.equal(result.breakdown.conflictExplanation, 0);
});

test('does not award semantic points for negated rubric claims', () => {
  const result = scoreAnswer({
    recommendedEndpoint: '/v1/responses',
    explanation: 'The current machine-readable schema is not the source of truth. The /v1/chat/completions guide is not archived. The /v1/responses and /v1/chat/completions instructions do not conflict.',
  });

  assert.equal(result.score, 55);
  assert.equal(result.breakdown.recencyReasoning, 0);
  assert.equal(result.breakdown.legacyRejection, 0);
  assert.equal(result.breakdown.conflictExplanation, 0);
});

test('runs three repeats for every ablation plus three pack-verification checks', () => {
  const report = fixtureReport(contexts);
  assert.equal(report.variants.length, 6);
  assert.equal(report.totalRuns, 21);
  assert.ok(report.variants.every(variant => variant.runs.length === 3));
  assert.equal(report.packVerification.runs.length, 3);
});

test('derives every headline metric and classification from run records', () => {
  const report = fixtureReport(contexts);
  const baseline = report.variants.find(variant => variant.id === 'baseline')!;
  const withoutLegacy = report.variants.find(variant => variant.omittedContextId === 'legacy')!;
  const legacyEvidence = report.contextEvidence.find(item => item.contextId === 'legacy')!;

  assert.equal(baseline.mean, 43);
  assert.equal(withoutLegacy.mean, 92);
  assert.equal(legacyEvidence.contribution, baseline.mean - withoutLegacy.mean);
  assert.equal(legacyEvidence.status, 'harmful');
  assert.equal(legacyEvidence.pairedWins, 3);
  assert.equal(report.optimizedScore, report.packVerification.mean);
  assert.equal(report.optimizedScore - report.baselineScore, 49);
  assert.equal(report.tokenReduction, 44);
  assert.deepEqual(report.recommendedContextIds, ['system', 'schema', 'rules']);
});

test('repaired legacy prose is re-evaluated and becomes redundant instead of retaining stale evidence', () => {
  const repaired = contexts.map(context => context.id === 'legacy'
    ? { ...context, content: 'Use POST /v1/responses. Source: current tool schema.' }
    : context);
  const report = fixtureReport(repaired);
  const repairedEvidence = report.contextEvidence.find(item => item.contextId === 'legacy')!;

  assert.equal(report.baselineScore, 92);
  assert.equal(report.optimizedScore, 92);
  assert.equal(report.diagnosis.harmfulItem, '');
  assert.equal(repairedEvidence.status, 'redundant');
  assert.equal(repairedEvidence.contribution, 0);
  assert.ok(!report.recommendedContextIds.includes('legacy'));
});

test('custom stale context participates in the suite and is diagnosed by content', () => {
  const custom = [
    ...contexts.filter(context => context.id !== 'legacy'),
    { id: 'old-runbook', name: 'old-runbook.txt', tokens: 120, content: 'Required endpoint: POST /v1/chat/completions' },
  ];
  const report = fixtureReport(custom);
  const customVariant = report.variants.find(variant => variant.omittedContextId === 'old-runbook');
  const customEvidence = report.contextEvidence.find(item => item.contextId === 'old-runbook');

  assert.ok(customVariant);
  assert.equal(customVariant.runs.length, 3);
  assert.equal(customEvidence?.status, 'harmful');
  assert.equal(report.diagnosis.harmfulItem, 'old-runbook.txt');
});

test('every aggregate run remains inspectable with provenance and a rubric', () => {
  const report = fixtureReport(contexts);
  const runs = [...report.variants.flatMap(variant => variant.runs), ...report.packVerification.runs];
  assert.equal(runs.length, report.totalRuns);
  assert.ok(runs.every(run => run.id && run.promptHash && run.source === report.mode));
  assert.ok(runs.every(run => Object.values(run.breakdown).reduce((sum, value) => sum + value, 0) === run.score));
  assert.ok(runs.every(run => run.breakdown.endpointAccuracy === 0 || run.breakdown.endpointAccuracy === 50));
  assert.ok(runs.every(run => run.breakdown.recencyReasoning === 0 || run.breakdown.recencyReasoning === 20));
  assert.ok(runs.every(run => run.breakdown.legacyRejection === 0 || run.breakdown.legacyRejection === 15));
  assert.ok(runs.every(run => run.breakdown.conflictExplanation === 0 || run.breakdown.conflictExplanation === 10));
});
