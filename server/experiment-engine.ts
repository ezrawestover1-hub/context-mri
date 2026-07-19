import type OpenAI from 'openai';
import type {
  ContextEvidence,
  ContextItem,
  ContextStatus,
  ExperimentMode,
  ExperimentReport,
  ExperimentRun,
  InteractionCheck,
  ScoreBreakdown,
  VariantResult,
} from '../src/types.js';
import {
  defaultDiagnosticProject,
  findDiagnosticProject,
  type DiagnosticProjectId,
  type EvaluationContract,
} from '../src/projects.js';

const MODEL = 'gpt-5.6-sol';
const REPEATS = 3;
const PASS_THRESHOLD = 80;
const DEFAULT_CONTRACT = defaultDiagnosticProject;

type AgentAnswer = {
  recommendedAnswer: string;
  explanation: string;
};

type Variant = {
  id: string;
  label: string;
  omittedContextId: string | null;
  includedContextIds?: string[];
};

function hashPrompt(value: string) {
  let primary = 0x811c9dc5;
  let secondary = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    primary = Math.imul(primary ^ code, 0x01000193);
    secondary = Math.imul(secondary ^ code, 0x85ebca6b);
  }
  return `${(primary >>> 0).toString(16).padStart(8, '0')}${(secondary >>> 0).toString(16).padStart(8, '0')}`.slice(0, 12);
}

function titleFromContext(item: ContextItem) {
  const known: Record<string, string> = {
    system: 'System',
    schema: 'Schema',
    legacy: 'Legacy API',
    rules: 'Rules',
    examples: 'Examples',
  };
  if (known[item.id]) return known[item.id];
  const base = item.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base.length > 16 ? `${base.slice(0, 15)}…` : base.replace(/\b\w/g, character => character.toUpperCase());
}

function variantsFor(contexts: ContextItem[]): Variant[] {
  return [
    { id: 'baseline', label: 'Baseline', omittedContextId: null },
    ...contexts.map(item => ({ id: `omit-${item.id}`, label: `−${titleFromContext(item)}`, omittedContextId: item.id })),
  ];
}

function interactionVariantFor(contexts: ContextItem[], contract: EvaluationContract): Variant | null {
  const spec = contract.interaction;
  if (!spec || !spec.contextIds.every(id => contexts.some(item => item.id === id))) return null;
  const omitted = new Set(spec.contextIds);
  return {
    id: `interaction-${spec.id}`,
    label: `−${spec.label}`,
    omittedContextId: null,
    includedContextIds: contexts.filter(item => !omitted.has(item.id)).map(item => item.id),
  };
}

function activeContexts(contexts: ContextItem[], variant: Variant) {
  if (variant.includedContextIds) {
    const included = new Set(variant.includedContextIds);
    return contexts.filter(item => included.has(item.id));
  }
  return contexts.filter(item => item.id !== variant.omittedContextId);
}

function normalizeEvidenceText(value: string) {
  return value.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

function includesAny(value: string, terms: string[]) {
  return terms.some(term => value.includes(term.toLowerCase()));
}

function evaluateExplanation(explanation: string, contract: EvaluationContract) {
  const normalized = normalizeEvidenceText(explanation);
  const statements = normalized.split(/[.!?;]+/).map(statement => statement.trim()).filter(Boolean);
  const expectedAnswer = contract.expectedAnswer.toLowerCase();
  const disallowedTerms = contract.disallowedTerms.map(endpoint => endpoint.toLowerCase());
  const mentionsCurrentAnywhere = normalized.includes(expectedAnswer);
  const identifiesCurrentSource = statements.some(statement => {
    const hasRecency = /\b(current|latest|newest|approved|source of truth)\b/.test(statement);
    const hasSchema = /\b(schema|machine-readable|tool definition|tool spec|tool specification|policy|control|standard|procedure)\b/.test(statement);
    const hasPositiveRelation = /\b(is|specifies|defines|provides|requires|source of truth)\b/.test(statement);
    const negatesClaim = /\b(?:is|does|do)\s+not\b/.test(statement) || /\bnot\s+(?:the\s+)?(?:current|latest|newest)\b/.test(statement);
    return hasRecency && hasSchema && hasPositiveRelation && !negatesClaim;
  });
  const rejectsLegacySource = statements.some(statement => {
    const mentionsLegacyEndpoint = includesAny(statement, disallowedTerms);
    const labelsLegacy = /\b(?:is|was|appears|looks)\s+(?:like\s+|to\s+be\s+)?(?:an?\s+)?(?:archived|legacy|obsolete|stale|deprecated|outdated)\b/.test(statement) ||
      /\b(?:archived|legacy|obsolete|stale|deprecated|outdated|unsafe|prohibited)\s+[^.]*\b(?:guide|instruction|endpoint|source|procedure|shortcut)\b/.test(statement);
    const rejectsUse = /\b(?:should not|do not|must not|cannot)\s+(?:be\s+)?used?\b/.test(statement) ||
      /\b(?:avoid|reject|ignore|never)\b/.test(statement);
    const negatesLegacy = /\bnot\s+(?:archived|legacy|obsolete|stale|deprecated|outdated|unsafe|prohibited)\b/.test(statement);
    return mentionsLegacyEndpoint && (labelsLegacy || rejectsUse) && !negatesLegacy;
  });
  const explainsConflict = statements.some(statement => {
    const mentionsCurrentEndpoint = statement.includes(expectedAnswer);
    const mentionsLegacyEndpoint = includesAny(statement, disallowedTerms);
    const namesRelation = /\b(conflict|conflicts|contradict|contradicts|disagree|disagrees|instead of|rather than)\b/.test(statement);
    const relatesToPriorSource = mentionsCurrentAnywhere && /\b(?:conflict|conflicts|contradict|contradicts|disagree|disagrees)\s+with\s+(?:it|that)\b/.test(statement);
    const negatesRelation = /\b(?:do|does|did|are|is)\s+not\s+(?:conflict|conflicting|contradict|contradictory|disagree)\b/.test(statement);
    return mentionsLegacyEndpoint && namesRelation && (mentionsCurrentEndpoint || relatesToPriorSource) && !negatesRelation;
  });

  return { identifiesCurrentSource, rejectsLegacySource, explainsConflict };
}

export function scoreAnswer(answer: AgentAnswer, contract: EvaluationContract = DEFAULT_CONTRACT): { score: number; breakdown: ScoreBreakdown } {
  const normalized = answer.recommendedAnswer.trim().replace(/\/$/, '').toLowerCase();
  const evidence = evaluateExplanation(answer.explanation, contract);
  const breakdown: ScoreBreakdown = {
    answerAccuracy: normalized === contract.expectedAnswer.toLowerCase() || normalized.endsWith(contract.expectedAnswer.toLowerCase()) ? 50 : 0,
    authoritativeSourceReasoning: evidence.identifiesCurrentSource ? 20 : 0,
    unsafeInstructionRejection: evidence.rejectsLegacySource ? 15 : 0,
    conflictExplanation: evidence.explainsConflict ? 10 : 0,
    structuredOutputValidity: 5,
  };
  return { score: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

function fixtureBreakdown(score: number): ScoreBreakdown {
  const weighted: Array<[keyof ScoreBreakdown, number]> = [
    ['answerAccuracy', 50],
    ['authoritativeSourceReasoning', 20],
    ['unsafeInstructionRejection', 15],
    ['conflictExplanation', 10],
  ];
  for (let mask = 0; mask < 2 ** weighted.length; mask += 1) {
    const result: ScoreBreakdown = { answerAccuracy: 0, authoritativeSourceReasoning: 0, unsafeInstructionRejection: 0, conflictExplanation: 0, structuredOutputValidity: 5 };
    weighted.forEach(([key, points], index) => { if (mask & (1 << index)) result[key] = points; });
    if (Object.values(result).reduce((sum, value) => sum + value, 0) === score) return result;
  }
  throw new Error(`Fixture score ${score} cannot be produced by the evaluator rubric.`);
}

function fixtureRole(item: ContextItem, contract: EvaluationContract): ContextStatus {
  const value = `${item.name}\n${item.content}`.toLowerCase();
  if (includesAny(value, contract.disallowedTerms)) return 'harmful';
  if (item.id === 'legacy') return 'redundant';
  if (value.includes(contract.expectedAnswer) || value.includes('"path"') || value.includes('verify the endpoint') || /you are a .+ agent/.test(value)) return 'required';
  if (value.includes('prefer the newest') || value.includes('never invent endpoints') || value.includes('machine-readable') || value.includes('never place') || value.includes('ephemeral') || value.includes('scoped')) return 'useful';
  return 'redundant';
}

function fixtureScores(contexts: ContextItem[], variant: Variant, contract: EvaluationContract): number[] {
  const originalHasStale = contexts.some(item => includesAny(item.content.toLowerCase(), contract.disallowedTerms));
  const active = activeContexts(contexts, variant);
  const activeHasStale = active.some(item => includesAny(item.content.toLowerCase(), contract.disallowedTerms));
  const omitted = contexts.find(item => item.id === variant.omittedContextId);

  if (contract.fixtureProfile === 'security-release') {
    if (!activeHasStale) return [100, 100, 100];
    if (!omitted) return [50, 55, 55];
    const role = fixtureRole(omitted, contract);
    if (role === 'required') return omitted.id === 'policy' ? [5, 15, 15] : [5, 5, 15];
    if (role === 'useful') return [40, 40, 40];
    return [50, 55, 55];
  }

  if (!activeHasStale) {
    if (originalHasStale) return [85, 90, 100];
    if (omitted) {
      const role = fixtureRole(omitted, contract);
      if (role === 'required') return omitted.id === 'schema' ? [5, 15, 15] : [5, 5, 15];
      if (role === 'useful') return [70, 70, 75];
    }
    return [85, 90, 100];
  }

  if (!omitted) return [35, 40, 55];
  const role = fixtureRole(omitted, contract);
  if (role === 'required') return omitted.id === 'schema' ? [5, 15, 15] : [5, 5, 15];
  if (role === 'useful') return [30, 30, 35];
  return [35, 40, 55];
}

function presentAnswer(contract: EvaluationContract, answer: string) {
  if (contract.fixtureProfile === 'api-migration') return `POST ${answer}`;
  return answer === contract.expectedAnswer ? `Use ${answer}` : answer;
}

function fixtureRun(contexts: ContextItem[], variant: Variant, repeat: number, score: number, contract: EvaluationContract): ExperimentRun {
  const active = activeContexts(contexts, variant);
  const breakdown = fixtureBreakdown(score);
  const passed = score >= PASS_THRESHOLD;
  const correctAnswer = breakdown.answerAccuracy === 50;
  const recommendedAnswer = correctAnswer ? contract.expectedAnswer : contract.disallowedTerms[0];
  const explanationParts = [contract.fixtureProfile === 'api-migration'
    ? `Recommend ${presentAnswer(contract, recommendedAnswer)}.`
    : `${presentAnswer(contract, recommendedAnswer)}.`];
  if (breakdown.authoritativeSourceReasoning) explanationParts.push(`The ${contract.currentSourceLabel} is the source of truth.`);
  if (breakdown.unsafeInstructionRejection) explanationParts.push(contract.fixtureProfile === 'api-migration'
    ? `The ${contract.disallowedTerms[0]} guide is archived and should not be used.`
    : `The instruction to ${contract.disallowedTerms[0]} is unsafe and must not be used.`);
  if (breakdown.conflictExplanation) explanationParts.push(`${presentAnswer(contract, contract.expectedAnswer)} and ${contract.disallowedTerms[0]} conflict.`);
  const output = explanationParts.join(' ');
  const independentlyScored = scoreAnswer({ recommendedAnswer, explanation: output }, contract);
  if (independentlyScored.score !== score) {
    throw new Error(`Fixture output scored ${independentlyScored.score}, expected ${score}.`);
  }
  const promptSource = active.map(item => `${item.name}:${item.content}`).join('\n');
  return {
    id: `fx-${variant.id}-r${repeat}`,
    variantId: variant.id,
    variantLabel: variant.label,
    omittedContextId: variant.omittedContextId,
    includedContextIds: variant.includedContextIds,
    repeat,
    score,
    passed,
    output,
    recommendedAnswer,
    durationMs: 680 + repeat * 73 + variant.id.length * 13,
    inputTokens: active.reduce((sum, item) => sum + item.tokens, 0) + 180,
    outputTokens: passed ? 46 : 31,
    promptHash: hashPrompt(`${variant.id}:${promptSource}:repeat-${repeat}`),
    source: 'fixture-replay',
    breakdown,
  };
}

function fixtureVariant(contexts: ContextItem[], variant: Variant, contract: EvaluationContract): VariantResult {
  const runs = fixtureScores(contexts, variant, contract).map((score, index) => fixtureRun(contexts, variant, index + 1, score, contract));
  return {
    ...variant,
    runs,
    mean: Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length),
  };
}

function buildInteractionCheck(
  contract: EvaluationContract,
  contexts: ContextItem[],
  variants: VariantResult[],
  interactionVariant: Variant,
  runs: ExperimentRun[],
): InteractionCheck {
  const spec = contract.interaction;
  if (!spec) throw new Error('Cannot build an interaction check without a registered interaction spec.');
  const baseline = variants.find(variant => variant.id === 'baseline');
  const first = variants.find(variant => variant.omittedContextId === spec.contextIds[0]);
  const second = variants.find(variant => variant.omittedContextId === spec.contextIds[1]);
  if (!baseline || !first || !second || !runs.length) throw new Error('Interaction check requires baseline and both single-file conditions.');
  const mean = Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length);
  const individualLosses: [number, number] = [baseline.mean - first.mean, baseline.mean - second.mean];
  const combinedLoss = baseline.mean - mean;
  const additiveLoss = individualLosses[0] + individualLosses[1];
  return {
    ...spec,
    includedContextIds: interactionVariant.includedContextIds ?? contexts.map(item => item.id),
    runs,
    mean,
    individualLosses,
    combinedLoss,
    additiveLoss,
    overlap: additiveLoss - combinedLoss,
  };
}

function classifyContext(contribution: number): ContextStatus {
  if (contribution >= 20) return 'required';
  if (contribution >= 5) return 'useful';
  if (contribution <= -5) return 'harmful';
  return 'redundant';
}

function recommendationFor(status: ContextStatus, pairedWins: number) {
  if (status === 'required') return 'Keep — removing it breaks the task.';
  if (status === 'useful') return 'Keep — it measurably improves this task.';
  if (status === 'harmful') return `Remove or rewrite — ${pairedWins}/${REPEATS} paired runs improve without it.`;
  return 'Optional — no measurable lift on this task.';
}

function deriveContextEvidence(contexts: ContextItem[], variants: VariantResult[]): ContextEvidence[] {
  const baseline = variants[0];
  return contexts.map(item => {
    const omission = variants.find(variant => variant.omittedContextId === item.id) ?? baseline;
    const contribution = baseline.mean - omission.mean;
    const pairedWins = omission.runs.filter((run, index) => run.score > baseline.runs[index].score).length;
    const status = classifyContext(contribution);
    return {
      contextId: item.id,
      name: item.name,
      status,
      contribution,
      omissionMean: omission.mean,
      pairedWins,
      recommendation: recommendationFor(status, pairedWins),
    };
  });
}

function recommendedIdsFor(evidence: ContextEvidence[]) {
  const recommended = evidence.filter(item => item.status === 'required' || item.status === 'useful').map(item => item.contextId);
  if (recommended.length) return recommended;
  const strongest = [...evidence].sort((a, b) => b.contribution - a.contribution)[0];
  return strongest ? [strongest.contextId] : [];
}

function buildReport(
  contexts: ContextItem[],
  variants: VariantResult[],
  packVerification: VariantResult,
  mode: ExperimentMode,
  contract: EvaluationContract,
  interaction?: InteractionCheck,
): ExperimentReport {
  const baseline = variants[0];
  const contextEvidence = deriveContextEvidence(contexts, variants);
  const recommendedContextIds = recommendedIdsFor(contextEvidence);
  const harmful = [...contextEvidence].sort((a, b) => a.contribution - b.contribution)[0];
  const harmfulDetected = Boolean(harmful && harmful.status === 'harmful');
  const harmfulVariant = harmfulDetected
    ? variants.find(variant => variant.omittedContextId === harmful.contextId) ?? baseline
    : baseline;
  const originalTokens = contexts.reduce((sum, item) => sum + item.tokens, 0);
  const recommendedSet = new Set(recommendedContextIds);
  const optimizedTokens = contexts.filter(item => recommendedSet.has(item.id)).reduce((sum, item) => sum + item.tokens, 0);
  const disallowedTerm = contract.disallowedTerms.find(term => contexts.some(item => item.content.includes(term)));
  const oldAnswer = disallowedTerm ? presentAnswer(contract, disallowedTerm) : '';
  const expectedAnswer = contexts.some(item => item.content.includes(contract.expectedAnswer)) ? presentAnswer(contract, contract.expectedAnswer) : 'Expected answer not present in the bundle';
  const repeatAgreement = harmfulDetected ? `${harmful.pairedWins}/${REPEATS} paired repeats` : `${REPEATS}/${REPEATS} pack verification runs`;

  return {
    id: `${mode === 'live' ? 'mri' : 'fixture'}-${globalThis.crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    mode,
    model: MODEL,
    reasoningEffort: 'medium',
    repeats: REPEATS,
    totalRuns: variants.reduce((sum, variant) => sum + variant.runs.length, 0) + packVerification.runs.length + (interaction?.runs.length ?? 0),
    baselineScore: baseline.mean,
    optimizedScore: packVerification.mean,
    tokenReduction: originalTokens ? Math.round((1 - optimizedTokens / originalTokens) * 100) : 0,
    originalTokens,
    optimizedTokens,
    variants,
    packVerification,
    contextEvidence,
    ...(interaction ? { interaction } : {}),
    evaluationContract: {
      id: contract.id,
      label: contract.label,
      task: contract.task,
      answerLabel: contract.answerLabel,
      expectedAnswer: contract.expectedAnswer,
      disallowedTerms: contract.disallowedTerms,
      currentSourceLabel: contract.currentSourceLabel,
      legacySourceLabel: contract.legacySourceLabel,
      rubric: contract.rubric,
      ...(contract.interaction ? { interaction: contract.interaction } : {}),
    },
    diagnosis: {
      finding: harmfulDetected
        ? `${harmful.name} is pulling the agent toward a conflicting or unsafe instruction.`
        : 'No harmful context remains in this bundle.',
      explanation: harmfulDetected
        ? `Removing it improved ${harmful.pairedWins}/${REPEATS} paired runs; the recommended pack then scored ${packVerification.mean}/100.`
        : `The recommended pack scored ${packVerification.mean}/100 across ${REPEATS} verification runs.`,
      harmfulItem: harmfulDetected ? harmful.name : '',
      oldInstruction: harmfulDetected ? oldAnswer : '',
      currentInstruction: expectedAnswer,
      repeatAgreement,
    },
    recommendedContextIds,
    minimalContextIds: recommendedContextIds,
    provenance: {
      dataset: contract.dataset,
      evaluator: 'Independent deterministic assertions over the returned answer and explanation; no model-reported grading fields',
      passThreshold: PASS_THRESHOLD,
      ...(mode === 'fixture-replay'
        ? { fixtureNote: `Deterministic fixture simulation for the ${contract.label} contract. A funded API project can generate fresh GPT-5.6 traces for this same contract.` }
        : {}),
    },
  };
}

function contractFor(id: DiagnosticProjectId = DEFAULT_CONTRACT.id) {
  const contract = findDiagnosticProject(id);
  if (!contract) throw new Error(`Unknown diagnostic project: ${id}`);
  return contract;
}

export function fixtureReport(contexts: ContextItem[], contractId: DiagnosticProjectId = DEFAULT_CONTRACT.id) {
  const contract = contractFor(contractId);
  if (contract.fixtureProfile === 'judge-lab') throw new Error('Judge Lab contracts can only run as fresh live evaluations.');
  const variants = variantsFor(contexts).map(variant => fixtureVariant(contexts, variant, contract));
  const evidence = deriveContextEvidence(contexts, variants);
  const recommendedContextIds = recommendedIdsFor(evidence);
  const packVariant: Variant = {
    id: 'recommended-pack',
    label: 'Recommended pack',
    omittedContextId: null,
    includedContextIds: recommendedContextIds,
  };
  return buildReport(contexts, variants, fixtureVariant(contexts, packVariant, contract), 'fixture-replay', contract);
}

async function runLiveCell(client: OpenAI, contexts: ContextItem[], variant: Variant, repeat: number, contract: EvaluationContract): Promise<ExperimentRun> {
  const active = activeContexts(contexts, variant);
  const bundle = active.map(item => `### ${item.name}\n${item.content}`).join('\n\n');
  const prompt = `TASK\n${contract.task}\n\nCONTEXT BUNDLE\n${bundle}\n\nUse only the supplied context. Identify conflicts and prefer the current authoritative source over a stale or unsafe instruction.`;
  const startedAt = Date.now();
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: 'medium' },
    input: [
      { role: 'developer', content: 'Act as the agent under test. Follow the supplied context exactly. Do not use outside knowledge. Return a concise answer and explanation. When sources disagree, explicitly name the current source, the unsafe or stale risk, and the conflicting instructions.' },
      { role: 'user', content: prompt },
    ],
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'context_mri_agent_answer',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            recommendedAnswer: { type: 'string' },
            explanation: { type: 'string' },
          },
          required: ['recommendedAnswer', 'explanation'],
        },
      },
    },
    max_output_tokens: 300,
  });
  const answer = JSON.parse(response.output_text) as AgentAnswer;
  const { score, breakdown } = scoreAnswer(answer, contract);
  return {
    id: response.id,
    variantId: variant.id,
    variantLabel: variant.label,
    omittedContextId: variant.omittedContextId,
    includedContextIds: variant.includedContextIds,
    repeat,
    score,
    passed: score >= PASS_THRESHOLD,
    output: answer.explanation,
    recommendedAnswer: answer.recommendedAnswer,
    durationMs: Date.now() - startedAt,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    promptHash: hashPrompt(prompt),
    source: 'live',
    breakdown,
  };
}

async function mapWithConcurrency<T, R>(values: T[], limit: number, worker: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let next = 0;
  async function consume() {
    while (next < values.length) {
      const index = next++;
      results[index] = await worker(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, consume));
  return results;
}

function groupRuns(variants: Variant[], runs: ExperimentRun[]): VariantResult[] {
  return variants.map(variant => {
    const variantRuns = runs.filter(run => run.variantId === variant.id);
    return {
      ...variant,
      runs: variantRuns,
      mean: Math.round(variantRuns.reduce((sum, run) => sum + run.score, 0) / variantRuns.length),
    };
  });
}

async function liveReport(contexts: ContextItem[], apiKey: string, contract: EvaluationContract) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey });
  const variants = variantsFor(contexts);
  const jobs = variants.flatMap(variant => Array.from({ length: REPEATS }, (_, index) => ({ variant, repeat: index + 1 })));

  // Use one request as a quota probe before starting the concurrent suite.
  const first = await runLiveCell(client, contexts, jobs[0].variant, jobs[0].repeat, contract);
  const remaining = await mapWithConcurrency(jobs.slice(1), 4, job => runLiveCell(client, contexts, job.variant, job.repeat, contract));
  const variantResults = groupRuns(variants, [first, ...remaining]);
  const interactionVariant = interactionVariantFor(contexts, contract);
  const interactionRuns = interactionVariant
    ? await mapWithConcurrency(Array.from({ length: REPEATS }, (_, index) => index + 1), 3, repeat => runLiveCell(client, contexts, interactionVariant, repeat, contract))
    : [];
  const recommendedContextIds = recommendedIdsFor(deriveContextEvidence(contexts, variantResults));
  const packVariant: Variant = {
    id: 'recommended-pack',
    label: 'Recommended pack',
    omittedContextId: null,
    includedContextIds: recommendedContextIds,
  };
  const packRuns = await mapWithConcurrency(
    Array.from({ length: REPEATS }, (_, index) => index + 1),
    3,
    repeat => runLiveCell(client, contexts, packVariant, repeat, contract),
  );
  const packVerification = groupRuns([packVariant], packRuns)[0];
  const interaction = interactionVariant
    ? buildInteractionCheck(contract, contexts, variantResults, interactionVariant, interactionRuns)
    : undefined;
  return buildReport(contexts, variantResults, packVerification, 'live', contract, interaction);
}

export function liveSuiteRunCount(contexts: ContextItem[], contract: EvaluationContract = DEFAULT_CONTRACT) {
  return (variantsFor(contexts).length + 1 + (interactionVariantFor(contexts, contract) ? 1 : 0)) * REPEATS;
}

export async function runLiveExperimentSuite(contexts: ContextItem[], apiKey: string, contractId: DiagnosticProjectId = DEFAULT_CONTRACT.id): Promise<ExperimentReport> {
  if (!apiKey) throw new Error('A usable OPENAI_API_KEY is required for live evidence generation.');
  return liveReport(contexts, apiKey, contractFor(contractId));
}

export async function runLiveContractExperimentSuite(contexts: ContextItem[], apiKey: string, contract: EvaluationContract): Promise<ExperimentReport> {
  if (!apiKey) throw new Error('A usable OPENAI_API_KEY is required for live evidence generation.');
  return liveReport(contexts, apiKey, contract);
}

export async function runExperimentSuite(contexts: ContextItem[], apiKey?: string, contractId: DiagnosticProjectId = DEFAULT_CONTRACT.id): Promise<ExperimentReport> {
  const contract = contractFor(contractId);
  if (!apiKey) return fixtureReport(contexts, contract.id);
  try {
    return await liveReport(contexts, apiKey, contract);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('429') || message.toLowerCase().includes('quota')) return fixtureReport(contexts, contract.id);
    throw error;
  }
}
