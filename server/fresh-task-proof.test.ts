import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const proofUrl = new URL('../submission/FRESH_CODEX_TASK_PROOF.json', import.meta.url);
const handoffUrl = new URL('../submission/FRESH_CODEX_TASK_PROOF.md', import.meta.url);

const sorted = (value: Record<string, unknown>) => Object.keys(value).sort();

test('publishes only allowlisted metadata for the five fresh Codex tasks', () => {
  const raw = readFileSync(proofUrl, 'utf8');
  const proof = JSON.parse(raw) as Record<string, any>;

  assert.deepEqual(sorted(proof), [
    'acceptanceContract', 'claim', 'model', 'pluginVersion', 'proofType', 'recordedAt',
    'runs', 'sandbox', 'sanitization', 'schemaVersion', 'summary',
  ].sort());
  assert.deepEqual(proof.summary, { total: 5, passed: 5, failed: 0 });
  assert.match(proof.claim, /orchestration reliability/);
  assert.match(proof.claim, /do not prove broad model causation or semantic generalization/);

  assert.deepEqual(sorted(proof.acceptanceContract), [
    'freshEphemeralTaskPerRun', 'guardHandoff', 'intactFingerprintsRequired',
    'oneDiagnosis', 'originalExpected', 'pluginNetworkRequestsExpected',
    'repairedExpected', 'twoGuardVerifications',
  ].sort());
  assert.deepEqual(sorted(proof.sanitization), [
    'accountDataPublished', 'fullPromptsPublished', 'fullTranscriptsPublished',
    'includedFields', 'rawContextPublished', 'sourceFilesPublished', 'usageMetadataPublished',
  ].sort());
  for (const [key, value] of Object.entries(proof.sanitization)) {
    if (key !== 'includedFields') assert.equal(value, false, `${key} must remain false`);
  }

  const expectedRunKeys = [
    'baselineScore', 'completedAt', 'diagnoseCalls', 'evidenceMode', 'guardFingerprint',
    'guardHandoff', 'harmfulItem', 'optimizedScore', 'original', 'outcome',
    'pluginNetworkUsed', 'repaired', 'reportId', 'representativePromptHashes',
    'run', 'startedAt', 'tools', 'verifyCalls',
  ].sort();
  const allowedTools = new Set(['describe_evaluators', 'diagnose_context_pack', 'verify_context_pack']);

  for (const [index, run] of proof.runs.entries()) {
    assert.deepEqual(sorted(run), expectedRunKeys);
    assert.equal(run.run, index + 1);
    assert.equal(run.outcome, 'pass');
    assert.equal(run.diagnoseCalls, 1);
    assert.equal(run.verifyCalls, 2);
    assert.equal(run.guardHandoff, 'ephemeral-guard-ref');
    assert.equal(run.evidenceMode, 'deterministic-fixture');
    assert.equal(run.pluginNetworkUsed, false);
    assert.match(run.startedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.match(run.completedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.match(run.reportId, /^fixture-[a-f0-9]{8}$/);
    assert.match(run.guardFingerprint, /^[a-f0-9]{64}$/);
    assert.ok(run.tools.every((tool: string) => allowedTools.has(tool)));
    assert.ok(run.representativePromptHashes.every((hash: string) => /^[a-f0-9]{12}$/.test(hash)));

    for (const side of ['original', 'repaired']) {
      assert.deepEqual(sorted(run[side]), ['integrity', 'status']);
      assert.deepEqual(sorted(run[side].integrity), ['artifact', 'contract', 'recommendedPack']);
      assert.deepEqual(run[side].integrity, { contract: true, artifact: true, recommendedPack: true });
    }
    assert.equal(run.original.status, 'blocked');
    assert.equal(run.repaired.status, 'pass');
  }

  const sha256 = createHash('sha256').update(raw).digest('hex');
  const handoff = readFileSync(handoffUrl, 'utf8');
  assert.ok(handoff.includes(sha256), 'The documented SHA-256 must match the sanitized artifact.');
});
