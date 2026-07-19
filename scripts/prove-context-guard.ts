import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { checkContextGuard, isContextGuard } from '../server/context-guard.js';
import type { ContextGuard, ContextGuardCheck, ContextItem } from '../src/types.js';

type EvidenceExport = {
  inputContexts?: unknown;
  decision?: { activeContextIds?: unknown };
};

type Assertion = {
  id: string;
  passed: boolean;
  evidence: string;
};

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function contextsFromEvidence(path: string): ContextItem[] {
  const evidence = readJson(path) as EvidenceExport;
  if (!Array.isArray(evidence.inputContexts) || !Array.isArray(evidence.decision?.activeContextIds)) {
    throw new Error(`${path} is not a Context MRI evidence export.`);
  }
  const activeIds = new Set(evidence.decision.activeContextIds.filter((id): id is string => typeof id === 'string'));
  const contexts = evidence.inputContexts.filter((item): item is ContextItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ContextItem>;
    return typeof candidate.id === 'string' && activeIds.has(candidate.id) &&
      typeof candidate.name === 'string' && typeof candidate.content === 'string' &&
      typeof candidate.tokens === 'number' && Number.isFinite(candidate.tokens);
  });
  if (contexts.length !== activeIds.size || contexts.length < 2) throw new Error(`${path} has an invalid active context pack.`);
  return contexts;
}

function integrityVerified(check: ContextGuardCheck) {
  return check.integrity.contract && check.integrity.artifact && check.integrity.recommendedPack;
}

function stableOutcome(check: ContextGuardCheck) {
  return {
    status: check.status,
    score: check.score,
    minimumScore: check.minimumScore,
    expectedAnswer: check.expectedAnswer,
    flaggedFiles: check.flaggedFiles,
    reasons: check.reasons,
    integrity: check.integrity,
  };
}

const guardPath = valueAfter('--guard') ?? 'samples/context-guard/support-api-migration.guard.json';
const originalPath = valueAfter('--original') ?? 'samples/context-guard/support-api-migration-original.evidence.json';
const repairedPath = valueAfter('--repaired') ?? 'samples/context-guard/support-api-migration-repaired.evidence.json';
const outputPath = valueAfter('--output');

const guardValue = readJson(guardPath);
if (!isContextGuard(guardValue)) throw new Error(`${guardPath} is not a complete Context MRI guard.`);
const guard: ContextGuard = guardValue;

const original = await checkContextGuard(guard, contextsFromEvidence(originalPath), '2026-07-18T20:01:00.000Z');
const repaired = await checkContextGuard(guard, contextsFromEvidence(repairedPath), '2026-07-18T20:02:00.000Z');

const assertions: Assertion[] = [
  { id: 'original-is-blocked', passed: original.status === 'blocked', evidence: `status=${original.status}` },
  { id: 'original-score-is-43', passed: original.score === 43, evidence: `score=${original.score}` },
  { id: 'legacy-file-is-flagged', passed: original.flaggedFiles.some(file => file.name === 'legacy-api.md'), evidence: `flagged=${original.flaggedFiles.map(file => file.name).join(',')}` },
  { id: 'original-integrity-is-verified', passed: integrityVerified(original), evidence: JSON.stringify(original.integrity) },
  { id: 'repaired-pack-passes', passed: repaired.status === 'pass', evidence: `status=${repaired.status}` },
  { id: 'repaired-score-is-92', passed: repaired.score === 92, evidence: `score=${repaired.score}` },
  { id: 'repaired-integrity-is-verified', passed: integrityVerified(repaired), evidence: JSON.stringify(repaired.integrity) },
];

const failed = assertions.filter(assertion => !assertion.passed);
const proof = {
  schemaVersion: '1.0',
  proofType: 'context-mri/deterministic-context-guard-ci',
  noApiKeyOrPaidServiceRequired: true,
  guard: {
    id: guard.id,
    projectId: guard.projectId,
    guardFingerprint: guard.guardFingerprint,
    contractFingerprint: guard.contractFingerprint,
    recommendedPackFingerprint: guard.recommendedPackFingerprint,
  },
  original: stableOutcome(original),
  repaired: stableOutcome(repaired),
  assertions,
  summary: { total: assertions.length, passed: assertions.length - failed.length, failed: failed.length },
};

const serialized = `${JSON.stringify(proof, null, 2)}\n`;
process.stdout.write(serialized);
if (outputPath) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, serialized);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## Context Guard proof',
    '',
    '| Pack | Expected | Actual | Score | Integrity |',
    '| --- | --- | --- | ---: | --- |',
    `| Original five-file bundle | blocked | ${original.status} | ${original.score}/100 | ${integrityVerified(original) ? 'verified' : 'failed'} |`,
    `| Repaired three-file bundle | pass | ${repaired.status} | ${repaired.score}/100 | ${integrityVerified(repaired) ? 'verified' : 'failed'} |`,
    '',
    `Guard fingerprint: \`${guard.guardFingerprint}\``,
    '',
  ].join('\n'));
}

if (failed.length) {
  console.error(`Context Guard proof failed: ${failed.map(assertion => assertion.id).join(', ')}`);
  process.exitCode = 1;
}
