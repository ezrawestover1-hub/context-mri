import type { ContextGuard, ContextItem, EvaluationContractSummary, ExperimentReport } from './types';

type FingerprintContext = Pick<ContextItem, 'id' | 'name' | 'tokens' | 'content'>;

function serialize(value: unknown) {
  return JSON.stringify(value);
}

async function sha256(value: unknown) {
  const bytes = new TextEncoder().encode(serialize(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function normalizedContexts(contexts: ContextItem[]): FingerprintContext[] {
  return contexts
    .map(({ id, name, tokens, content }) => ({ id, name, tokens, content }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function contractPayload(contract: EvaluationContractSummary) {
  return {
    id: contract.id,
    label: contract.label,
    task: contract.task,
    answerLabel: contract.answerLabel,
    expectedAnswer: contract.expectedAnswer,
    disallowedTerms: [...contract.disallowedTerms].sort(),
    currentSourceLabel: contract.currentSourceLabel,
    legacySourceLabel: contract.legacySourceLabel,
    rubric: contract.rubric.map(({ id, label, maximum, description }) => ({ id, label, maximum, description })),
  };
}

export async function fingerprintContextBundle(contexts: ContextItem[]) {
  return sha256({ schema: 'context-mri/context-bundle-v1', contexts: normalizedContexts(contexts) });
}

export async function fingerprintContract(contract: EvaluationContractSummary) {
  return sha256({ schema: 'context-mri/evaluation-contract-v1', contract: contractPayload(contract) });
}

export async function fingerprintReport(report: ExperimentReport) {
  return sha256({
    schema: 'context-mri/report-v1',
    id: report.id,
    mode: report.mode,
    model: report.model,
    reasoningEffort: report.reasoningEffort,
    repeats: report.repeats,
    totalRuns: report.totalRuns,
    baselineScore: report.baselineScore,
    optimizedScore: report.optimizedScore,
    tokenReduction: report.tokenReduction,
    recommendedContextIds: [...report.recommendedContextIds].sort(),
    evaluationContract: contractPayload(report.evaluationContract),
    provenance: report.provenance,
  });
}

export async function fingerprintGuard(guard: Omit<ContextGuard, 'guardFingerprint'>) {
  return sha256({
    schema: 'context-mri/context-guard-v1',
    ...guard,
    recommendedContextIds: [...guard.recommendedContextIds].sort(),
    blockedTerms: [...guard.blockedTerms].sort(),
  });
}
