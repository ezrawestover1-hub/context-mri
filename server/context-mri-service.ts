import { createContextGuard, isContextGuard, checkContextGuard } from './context-guard.js';
import { fixtureReport } from './experiment-engine.js';
import {
  diagnosticProjects,
  findDiagnosticProject,
  type DiagnosticProject,
  type DiagnosticProjectId,
} from '../src/projects.js';
import type {
  ContextGuard,
  ContextItem,
  ExperimentReport,
  ExperimentRun,
  ScoreBreakdown,
} from '../src/types.js';

export const CONTEXT_LIMITS = {
  minimumFiles: 2,
  maximumFiles: 12,
  maximumIdLength: 64,
  maximumNameLength: 160,
  maximumContentLength: 20_000,
} as const;

const PASS_THRESHOLD = 80;
const EVIDENCE_MODE = 'deterministic-fixture' as const;
const CLAIM_SCOPE = 'Controlled, task-specific single-file ablation evidence applies only to this supplied context pack and evaluator.';

export type ContextInputSource = 'bundled-example' | 'explicit-user-input';
export type VerificationInputSource = 'bundled-original' | 'bundled-recommended' | 'explicit-user-input';

export type ContextMriPrivacy = {
  processing: 'local-only';
  networkUsed: false;
  retention: 'none';
  inputPolicy: string;
};

export type ContextMriTrace = {
  id: string;
  variantId: string;
  variantLabel: string;
  omittedContextId: string | null;
  repeat: number;
  score: number;
  passed: boolean;
  promptHash: string;
  breakdown: ScoreBreakdown;
  output: string;
};

const privacy: ContextMriPrivacy = {
  processing: 'local-only',
  networkUsed: false,
  retention: 'none',
  inputPolicy: 'Only context explicitly supplied to this tool is processed. The tool does not inspect a full chat or repository on its own.',
};

const limitations = [
  'This free beta uses deterministic, task-specific fixture evidence rather than a fresh model evaluation.',
  'A finding does not establish that a file is universally harmful across tasks, models, prompts, or evaluators.',
  'The deterministic fixture recognizes configured disallowed terms; a semantic paraphrase outside that contract may not be detected.',
  'Use representative live evaluations and human-calibrated criteria before enforcing a production gate.',
] as const;

export function validateContextItems(value: unknown): value is ContextItem[] {
  if (!Array.isArray(value) || value.length < CONTEXT_LIMITS.minimumFiles || value.length > CONTEXT_LIMITS.maximumFiles) return false;
  const ids = new Set<string>();
  return value.every(item => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ContextItem>;
    const valid = typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= CONTEXT_LIMITS.maximumIdLength &&
      /^[a-zA-Z0-9._-]+$/.test(candidate.id) &&
      typeof candidate.name === 'string' && candidate.name.trim().length > 0 && candidate.name.length <= CONTEXT_LIMITS.maximumNameLength &&
      !/[\u0000-\u001f\u007f]/.test(candidate.name) &&
      typeof candidate.content === 'string' && candidate.content.length <= CONTEXT_LIMITS.maximumContentLength &&
      typeof candidate.tokens === 'number' && Number.isInteger(candidate.tokens) && candidate.tokens >= 0;
    if (!valid || ids.has(candidate.id!)) return false;
    ids.add(candidate.id!);
    return true;
  });
}

function requireProject(projectId: unknown): DiagnosticProject {
  const project = findDiagnosticProject(projectId);
  if (!project) throw new Error('Choose one of the supported Context MRI evaluator IDs. Call describe_evaluators to inspect them.');
  return project;
}

function evaluatorDescription(project: DiagnosticProject) {
  return {
    id: project.id,
    label: project.label,
    shortLabel: project.shortLabel,
    task: project.task,
    answerLabel: project.answerLabel,
    expectedAnswer: project.expectedAnswer,
    disallowedTerms: [...project.disallowedTerms],
    currentSourceLabel: project.currentSourceLabel,
    legacySourceLabel: project.legacySourceLabel,
    rubric: project.rubric,
    passThreshold: PASS_THRESHOLD,
    repeatCount: 3,
    evidenceMode: EVIDENCE_MODE,
    bundledContextFiles: project.contexts.map(context => ({ id: context.id, name: context.name, tokens: context.tokens })),
  };
}

export function describeEvaluators(projectId?: DiagnosticProjectId) {
  const projects = projectId ? [requireProject(projectId)] : diagnosticProjects;
  return {
    freeBeta: true,
    evaluators: projects.map(evaluatorDescription),
    contextLimits: CONTEXT_LIMITS,
    claimScope: CLAIM_SCOPE,
    limitations: [...limitations],
    privacy,
  };
}

function toTrace(run: ExperimentRun): ContextMriTrace {
  return {
    id: run.id,
    variantId: run.variantId,
    variantLabel: run.variantLabel,
    omittedContextId: run.omittedContextId,
    repeat: run.repeat,
    score: run.score,
    passed: run.passed,
    promptHash: run.promptHash,
    breakdown: run.breakdown,
    output: run.output,
  };
}

function selectRepresentativeTraces(report: ExperimentReport) {
  const harmful = report.contextEvidence.find(item => item.status === 'harmful');
  const baseline = report.variants.find(variant => variant.id === 'baseline');
  const withoutHarmful = harmful
    ? report.variants.find(variant => variant.omittedContextId === harmful.contextId)
    : undefined;
  return [baseline, withoutHarmful, report.packVerification]
    .filter((variant, index, values) => variant && values.indexOf(variant) === index)
    .map(variant => toTrace(variant!.runs[0]));
}

function summarizeReport(report: ExperimentReport, guard: ContextGuard, inputSource: ContextInputSource) {
  const harmful = report.contextEvidence.find(item => item.status === 'harmful');
  const delta = report.optimizedScore - report.baselineScore;
  return {
    reportId: report.id,
    createdAt: report.createdAt,
    projectId: report.evaluationContract.id,
    projectLabel: report.evaluationContract.label,
    task: report.evaluationContract.task,
    mode: report.mode,
    evidenceMode: EVIDENCE_MODE,
    inputSource,
    headline: {
      status: harmful ? 'harmful-context-detected' as const : 'no-harmful-context-detected' as const,
      baselineScore: report.baselineScore,
      optimizedScore: report.optimizedScore,
      scoreDelta: delta,
      tokenReductionPercent: report.tokenReduction,
      harmfulItem: harmful?.name ?? '',
      finding: report.diagnosis.finding,
      explanation: report.diagnosis.explanation,
    },
    contextEvidence: report.contextEvidence,
    recommendedContextIds: report.recommendedContextIds,
    representativeTraces: selectRepresentativeTraces(report),
    traceIndex: [
      ...report.variants.flatMap(variant => variant.runs),
      ...report.packVerification.runs,
    ].map(run => ({
      id: run.id,
      variantId: run.variantId,
      variantLabel: run.variantLabel,
      omittedContextId: run.omittedContextId,
      repeat: run.repeat,
      score: run.score,
      passed: run.passed,
      promptHash: run.promptHash,
    })),
    evaluator: report.evaluationContract,
    provenance: report.provenance,
    guard,
    claimScope: CLAIM_SCOPE,
    limitations: [...limitations],
    privacy,
  };
}

export async function diagnoseContextPack(options: {
  projectId: DiagnosticProjectId;
  contexts?: ContextItem[];
  createdAt?: string;
}) {
  const project = requireProject(options.projectId);
  const sourceContexts = options.contexts ?? project.contexts;
  if (!validateContextItems(sourceContexts)) {
    throw new Error(`Supply ${CONTEXT_LIMITS.minimumFiles}-${CONTEXT_LIMITS.maximumFiles} unique context items within the documented size limits.`);
  }
  const inputSource: ContextInputSource = options.contexts ? 'explicit-user-input' : 'bundled-example';
  const report = fixtureReport(sourceContexts, project.id);
  const guard = await createContextGuard(report, sourceContexts, options.createdAt);
  return summarizeReport(report, guard, inputSource);
}

export async function verifyContextPack(options: {
  guard: ContextGuard;
  contexts?: ContextItem[];
  bundledPack?: 'original' | 'recommended';
  checkedAt?: string;
}) {
  if (!isContextGuard(options.guard)) throw new Error('Supply a complete, untampered Context Guard created by Context MRI.');
  if (options.contexts && options.bundledPack) throw new Error('Supply explicit contexts or choose a bundled pack, not both.');
  const project = requireProject(options.guard.projectId);
  const contexts = options.contexts ?? (options.bundledPack === 'original'
    ? project.contexts
    : options.bundledPack === 'recommended'
      ? project.contexts.filter(context => options.guard.recommendedContextIds.includes(context.id))
      : undefined);
  if (!contexts) throw new Error('Supply explicit repaired contexts, or choose bundledPack for a clearly labeled demonstration.');
  if (!validateContextItems(contexts)) {
    throw new Error(`Supply ${CONTEXT_LIMITS.minimumFiles}-${CONTEXT_LIMITS.maximumFiles} unique context items within the documented size limits.`);
  }
  const inputSource: VerificationInputSource = options.contexts
    ? 'explicit-user-input'
    : options.bundledPack === 'original'
      ? 'bundled-original'
      : 'bundled-recommended';
  const result = await checkContextGuard(options.guard, contexts, options.checkedAt);
  return {
    projectId: options.guard.projectId,
    inputSource,
    status: result.status,
    score: result.score,
    minimumScore: result.minimumScore,
    expectedAnswer: result.expectedAnswer,
    flaggedFiles: result.flaggedFiles,
    reasons: result.reasons,
    integrity: result.integrity,
    reportId: result.reportId,
    checkedAt: result.checkedAt,
    evidenceMode: EVIDENCE_MODE,
    claimScope: CLAIM_SCOPE,
    nextAction: result.status === 'pass'
      ? 'Keep this guard with the agent context pack and run it in CI before release.'
      : 'Inspect the reasons, repair the context pack, and verify again before release.',
    limitations: [...limitations],
    privacy,
  };
}
