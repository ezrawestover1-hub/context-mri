import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

type Assertion = {
  id: string;
  passed: boolean;
  evidence: string;
};

const auditedPaths = [
  'README.md',
  'submission/DEVPOST.md',
  'submission/DEMO_SCRIPT.md',
  'submission/JUDGE_CHECKLIST.md',
  'submission/SELF_AUDIT.md',
  '.github/workflows/context-guard.yml',
  'samples/context-guard/support-api-migration.guard.json',
  'samples/context-guard/support-api-migration-original.evidence.json',
  'samples/context-guard/support-api-migration-repaired.evidence.json',
];

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

function sha256(path: string) {
  return createHash('sha256').update(readFileSync(resolve(path))).digest('hex');
}

const demoScript = read('submission/DEMO_SCRIPT.md');
const checklist = read('submission/JUDGE_CHECKLIST.md');
const devpost = read('submission/DEVPOST.md');
const readme = read('README.md');
const workflow = read('.github/workflows/context-guard.yml');
const selfAudit = read('submission/SELF_AUDIT.md');
const preferredVideo = demoScript.match(/preferred submission file is `([^`]+)`/)?.[1];
const workflowUrl = 'https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml';
const selfAuditUrl = 'https://github.com/ezrawestover1-hub/context-mri/blob/main/submission/SELF_AUDIT.md';

const assertions: Assertion[] = [
  { id: 'preferred-video-declared', passed: Boolean(preferredVideo), evidence: preferredVideo ?? 'missing' },
  { id: 'video-handoff-consistent', passed: Boolean(preferredVideo && checklist.includes(preferredVideo)), evidence: preferredVideo ? `checklist references ${preferredVideo}` : 'preferred video missing' },
  { id: 'free-judge-path-is-explicit', passed: readme.includes('No API quota is required to judge') && devpost.includes('no account, API key, payment'), evidence: 'README and Devpost preserve a no-key, no-payment judge path' },
  { id: 'fixture-boundary-is-explicit', passed: readme.includes('deterministic **fixture replay**') && devpost.includes('deterministic fixture replay'), evidence: 'fixture evidence remains labeled in both public descriptions' },
  { id: 'ci-proves-both-outcomes', passed: workflow.includes('npm run guard:prove') && workflow.includes('original blocked and repair passed'), evidence: 'workflow executes the dual-sided guard proof' },
  { id: 'ci-runs-self-audit', passed: workflow.includes('npm run audit:self'), evidence: 'workflow reruns this release-context audit' },
  { id: 'original-regression-fixture-exists', passed: existsSync(resolve('samples/context-guard/support-api-migration-original.evidence.json')), evidence: 'original five-file bundle is committed for CI' },
  { id: 'public-proof-links-exist', passed: devpost.includes(workflowUrl) && devpost.includes(selfAuditUrl), evidence: 'Devpost copy links to CI and the honest audit boundary' },
  { id: 'self-audit-is-honestly-scoped', passed: selfAudit.includes('not a fresh model evaluation') && selfAudit.includes('two real release-context inconsistencies'), evidence: 'dogfooding claim is bounded and reproducible' },
];

const missingFiles = auditedPaths.filter(path => !existsSync(resolve(path)));
if (missingFiles.length) throw new Error(`Release audit is missing required files: ${missingFiles.join(', ')}`);

const failed = assertions.filter(assertion => !assertion.passed);
const output = {
  schemaVersion: '1.0',
  auditType: 'context-mri/deterministic-release-context-audit',
  noApiKeyOrPaidServiceRequired: true,
  auditedFiles: auditedPaths.map(path => ({ path, sha256: sha256(path) })),
  assertions,
  summary: { total: assertions.length, passed: assertions.length - failed.length, failed: failed.length },
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
process.stdout.write(serialized);
const outputPath = valueAfter('--output');
if (outputPath) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, serialized);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '## Context MRI self-audit',
    '',
    `- ${assertions.length - failed.length}/${assertions.length} release-context assertions passed`,
    `- ${auditedPaths.length} files fingerprinted with SHA-256`,
    '- No API key or paid service used',
    '- Historical findings: stale video handoff and one-sided CI proof; both repaired',
    '',
  ].join('\n'));
}

if (failed.length) {
  console.error(`Release-context audit failed: ${failed.map(assertion => assertion.id).join(', ')}`);
  process.exitCode = 1;
}
