import { findDiagnosticProject, type DiagnosticProjectId } from '../src/projects.js';
import type { ContextGuard, ContextGuardCheck, ContextItem, ExperimentReport, GuardFlaggedFile } from '../src/types.js';
import { createContextGuard } from '../src/context-guard.js';
import { fixtureReport } from './experiment-engine.js';
import { fingerprintContextBundle, fingerprintContract, fingerprintGuard } from '../src/provenance.js';

const GUARD_SCHEMA_VERSION = '1.1' as const;

export { createContextGuard } from '../src/context-guard.js';

function normalized(value: string) {
  return value.toLowerCase();
}

function fileMatches(item: ContextItem, blockedTerms: string[]): GuardFlaggedFile | null {
  const searchable = normalized(`${item.name}\n${item.content}`);
  const terms = blockedTerms.filter(term => searchable.includes(normalized(term)));
  return terms.length ? { contextId: item.id, name: item.name, terms } : null;
}

function sameValues(left: string[], right: string[]) {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.length === sortedRight.length && sortedLeft.every((value, index) => value === sortedRight[index]);
}

function fingerprint(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function isContextGuard(value: unknown): value is ContextGuard {
  if (!value || typeof value !== 'object') return false;
  const guard = value as Partial<ContextGuard>;
  return guard.schemaVersion === GUARD_SCHEMA_VERSION &&
    typeof guard.id === 'string' && guard.id.length > 0 &&
    typeof guard.label === 'string' && guard.label.length > 0 &&
    typeof guard.createdAt === 'string' &&
    typeof guard.sourceReportId === 'string' && guard.sourceReportId.length > 0 &&
    (guard.sourceMode === 'live' || guard.sourceMode === 'fixture-replay') &&
    typeof guard.projectId === 'string' && Boolean(findDiagnosticProject(guard.projectId)) &&
    typeof guard.task === 'string' && guard.task.length > 0 &&
    typeof guard.expectedEndpoint === 'string' && guard.expectedEndpoint.length > 0 &&
    typeof guard.minimumScore === 'number' && Number.isFinite(guard.minimumScore) && guard.minimumScore >= 0 && guard.minimumScore <= 100 &&
    Array.isArray(guard.recommendedContextIds) && guard.recommendedContextIds.every(id => typeof id === 'string') &&
    Array.isArray(guard.blockedTerms) && guard.blockedTerms.length > 0 && guard.blockedTerms.every(term => typeof term === 'string' && term.length > 0) &&
    fingerprint(guard.contractFingerprint) && fingerprint(guard.sourceReportFingerprint) &&
    fingerprint(guard.sourceContextFingerprint) && fingerprint(guard.recommendedPackFingerprint) && fingerprint(guard.guardFingerprint);
}

export async function checkContextGuard(guard: ContextGuard, contexts: ContextItem[], checkedAt = new Date().toISOString()): Promise<ContextGuardCheck> {
  const project = findDiagnosticProject(guard.projectId);
  if (!project) throw new Error(`Unknown guard project: ${guard.projectId}`);

  const report = fixtureReport(contexts, project.id as DiagnosticProjectId);
  const expectedContractFingerprint = await fingerprintContract(project);
  const expectedGuardFingerprint = await fingerprintGuard(({ ...guard, guardFingerprint: undefined } as Omit<ContextGuard, 'guardFingerprint'>));
  const recommendedPack = contexts.filter(context => guard.recommendedContextIds.includes(context.id));
  const recommendedPackFingerprint = recommendedPack.length === guard.recommendedContextIds.length
    ? await fingerprintContextBundle(recommendedPack)
    : '';
  const integrity = {
    contract: guard.contractFingerprint === expectedContractFingerprint &&
      guard.expectedEndpoint === project.expectedEndpoint &&
      guard.task === project.task &&
      sameValues(guard.blockedTerms, project.legacyEndpoints),
    artifact: guard.guardFingerprint === expectedGuardFingerprint,
    recommendedPack: recommendedPackFingerprint === guard.recommendedPackFingerprint,
  };
  const flaggedFiles = contexts
    .map(item => fileMatches(item, guard.blockedTerms))
    .filter((item): item is GuardFlaggedFile => item !== null);
  const reasons: string[] = [];

  if (!integrity.artifact) reasons.push('Guard artifact fingerprint does not match its contents. Regenerate the downloaded guard.');
  if (!integrity.contract) reasons.push('Guard contract does not match the canonical project endpoint and legacy-instruction policy.');
  if (!integrity.recommendedPack) reasons.push('One or more required recommended context files changed, are missing, or do not match the pack fingerprint.');
  if (flaggedFiles.length) {
    const details = flaggedFiles.map(file => `${file.name} (${file.terms.join(', ')})`).join('; ');
    reasons.push(`Blocked legacy instruction found in ${details}.`);
  }
  if (report.baselineScore < guard.minimumScore) {
    reasons.push(`Bundle scored ${report.baselineScore}/100, below the required ${guard.minimumScore}/100.`);
  }
  if (!reasons.length) reasons.push(`Bundle clears the ${guard.minimumScore}/100 threshold, contains no blocked legacy instruction, and matches the Context Guard fingerprints.`);

  return {
    status: reasons.length === 1 && reasons[0].startsWith('Bundle clears') ? 'pass' : 'blocked',
    checkedAt,
    reportId: report.id,
    mode: report.mode,
    score: report.baselineScore,
    minimumScore: guard.minimumScore,
    expectedEndpoint: guard.expectedEndpoint,
    flaggedFiles,
    reasons,
    integrity,
  };
}
