import { createHash, randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import type {
  ContextEvidence,
  ContextItem,
  ContextStatus,
  ExperimentMode,
  ExperimentReport,
  ExperimentRun,
  ScoreBreakdown,
  VariantResult,
} from '../src/types.js';

const MODEL = 'gpt-5.6-sol';
const REPEATS = 3;
const PASS_THRESHOLD = 80;

type AgentAnswer = {
  recommendedEndpoint: string;
  currentEndpointIdentified: boolean;
  legacyEndpointRejected: boolean;
  conflictExplained: boolean;
  explanation: string;
};

type Variant = {
  id: string;
  label: string;
  omittedContextId: string | null;
  includedContextIds?: string[];
};

function hashPrompt(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
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

function activeContexts(contexts: ContextItem[], variant: Variant) {
  if (variant.includedContextIds) {
    const included = new Set(variant.includedContextIds);
    return contexts.filter(item => included.has(item.id));
  }
  return contexts.filter(item => item.id !== variant.omittedContextId);
}

export function scoreAnswer(answer: AgentAnswer): { score: number; breakdown: ScoreBreakdown } {
  const normalized = answer.recommendedEndpoint.trim().replace(/\/$/, '').toLowerCase();
  const breakdown: ScoreBreakdown = {
    endpointAccuracy: normalized === '/v1/responses' || normalized.endsWith('/v1/responses') ? 50 : 0,
    recencyReasoning: answer.currentEndpointIdentified ? 20 : 0,
    legacyRejection: answer.legacyEndpointRejected ? 15 : 0,
    conflictExplanation: answer.conflictExplained ? 10 : 0,
    schemaValidity: 5,
  };
  return { score: Object.values(breakdown).reduce((sum, value) => sum + value, 0), breakdown };
}

function fixtureBreakdown(score: number): ScoreBreakdown {
  const weighted: Array<[keyof ScoreBreakdown, number]> = [
    ['endpointAccuracy', 50],
    ['recencyReasoning', 20],
    ['legacyRejection', 15],
    ['conflictExplanation', 10],
  ];
  for (let mask = 0; mask < 2 ** weighted.length; mask += 1) {
    const result: ScoreBreakdown = { endpointAccuracy: 0, recencyReasoning: 0, legacyRejection: 0, conflictExplanation: 0, schemaValidity: 5 };
    weighted.forEach(([key, points], index) => { if (mask & (1 << index)) result[key] = points; });
    if (Object.values(result).reduce((sum, value) => sum + value, 0) === score) return result;
  }
  throw new Error(`Fixture score ${score} cannot be produced by the evaluator rubric.`);
}

function fixtureRole(item: ContextItem): ContextStatus {
  const value = `${item.name}\n${item.content}`.toLowerCase();
  if (value.includes('/v1/chat/completions')) return 'harmful';
  if (item.id === 'legacy') return 'redundant';
  if (value.includes('tool-schema') || value.includes('"path"') || value.includes('verify the endpoint') || value.includes('you are a support agent')) return 'required';
  if (value.includes('prefer the newest') || value.includes('never invent endpoints') || value.includes('machine-readable')) return 'useful';
  return 'redundant';
}

function fixtureScores(contexts: ContextItem[], variant: Variant): number[] {
  const originalHasStale = contexts.some(item => item.content.toLowerCase().includes('/v1/chat/completions'));
  const active = activeContexts(contexts, variant);
  const activeHasStale = active.some(item => item.content.toLowerCase().includes('/v1/chat/completions'));
  const omitted = contexts.find(item => item.id === variant.omittedContextId);

  if (!activeHasStale) {
    if (originalHasStale) return [85, 90, 100];
    if (omitted) {
      const role = fixtureRole(omitted);
      if (role === 'required') return omitted.id === 'schema' ? [5, 15, 15] : [5, 5, 15];
      if (role === 'useful') return [70, 70, 75];
    }
    return [85, 90, 100];
  }

  if (!omitted) return [35, 40, 55];
  const role = fixtureRole(omitted);
  if (role === 'required') return omitted.id === 'schema' ? [5, 15, 15] : [5, 5, 15];
  if (role === 'useful') return [30, 30, 35];
  return [35, 40, 55];
}

function fixtureRun(contexts: ContextItem[], variant: Variant, repeat: number, score: number): ExperimentRun {
  const active = activeContexts(contexts, variant);
  const breakdown = fixtureBreakdown(score);
  const passed = score >= PASS_THRESHOLD;
  const correctEndpoint = breakdown.endpointAccuracy === 50;
  const recommendedEndpoint = correctEndpoint ? '/v1/responses' : '/v1/chat/completions';
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
    output: passed
      ? 'Recommend POST /v1/responses. It is the current endpoint in the tool schema; the chat completions note is archived.'
      : correctEndpoint
        ? 'Recommend POST /v1/responses, but the answer does not reliably identify source recency or explain the conflicting legacy instruction.'
        : 'The tool schema appears newer, but the archived quickstart calls /v1/chat/completions required, so I recommend the archived endpoint.',
    recommendedEndpoint,
    durationMs: 680 + repeat * 73 + variant.id.length * 13,
    inputTokens: active.reduce((sum, item) => sum + item.tokens, 0) + 180,
    outputTokens: passed ? 46 : 31,
    promptHash: hashPrompt(`${variant.id}:${promptSource}:repeat-${repeat}`),
    source: 'fixture-replay',
    breakdown,
  };
}

function fixtureVariant(contexts: ContextItem[], variant: Variant): VariantResult {
  const runs = fixtureScores(contexts, variant).map((score, index) => fixtureRun(contexts, variant, index + 1, score));
  return {
    ...variant,
    runs,
    mean: Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length),
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
  const oldEndpoint = contexts.some(item => item.content.includes('/v1/chat/completions')) ? 'POST /v1/chat/completions' : '';
  const currentEndpoint = contexts.some(item => item.content.includes('/v1/responses')) ? 'POST /v1/responses' : 'Current endpoint not present in the bundle';
  const repeatAgreement = harmfulDetected ? `${harmful.pairedWins}/${REPEATS} paired repeats` : `${REPEATS}/${REPEATS} pack verification runs`;

  return {
    id: `${mode === 'live' ? 'mri' : 'fixture'}-${randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    mode,
    model: MODEL,
    reasoningEffort: 'medium',
    repeats: REPEATS,
    totalRuns: variants.reduce((sum, variant) => sum + variant.runs.length, 0) + packVerification.runs.length,
    baselineScore: baseline.mean,
    optimizedScore: packVerification.mean,
    tokenReduction: originalTokens ? Math.round((1 - optimizedTokens / originalTokens) * 100) : 0,
    originalTokens,
    optimizedTokens,
    variants,
    packVerification,
    contextEvidence,
    diagnosis: {
      finding: harmfulDetected
        ? `${harmful.name} is pulling the agent toward an obsolete instruction.`
        : 'No harmful context remains in this bundle.',
      explanation: harmfulDetected
        ? `Removing it improved ${harmful.pairedWins}/${REPEATS} paired runs; the recommended pack then scored ${packVerification.mean}/100.`
        : `The recommended pack scored ${packVerification.mean}/100 across ${REPEATS} verification runs.`,
      harmfulItem: harmfulDetected ? harmful.name : '',
      oldInstruction: harmfulDetected ? oldEndpoint : '',
      currentInstruction: currentEndpoint,
      repeatAgreement,
    },
    recommendedContextIds,
    minimalContextIds: recommendedContextIds,
    provenance: {
      dataset: contexts.some(item => item.id === 'legacy') ? 'support-api-migration-v1' : 'custom-context-bundle',
      evaluator: 'Five-part deterministic rubric (endpoint, recency, legacy handling, conflict, schema)',
      passThreshold: PASS_THRESHOLD,
      ...(mode === 'fixture-replay'
        ? { fixtureNote: 'Deterministic fixture simulation. Add API quota to generate fresh GPT-5.6 traces for custom context.' }
        : {}),
    },
  };
}

export function fixtureReport(contexts: ContextItem[]) {
  const variants = variantsFor(contexts).map(variant => fixtureVariant(contexts, variant));
  const evidence = deriveContextEvidence(contexts, variants);
  const recommendedContextIds = recommendedIdsFor(evidence);
  const packVariant: Variant = {
    id: 'recommended-pack',
    label: 'Recommended pack',
    omittedContextId: null,
    includedContextIds: recommendedContextIds,
  };
  return buildReport(contexts, variants, fixtureVariant(contexts, packVariant), 'fixture-replay');
}

async function runLiveCell(client: OpenAI, contexts: ContextItem[], variant: Variant, repeat: number): Promise<ExperimentRun> {
  const active = activeContexts(contexts, variant);
  const bundle = active.map(item => `### ${item.name}\n${item.content}`).join('\n\n');
  const prompt = `TASK\nA developer is migrating an integration. Recommend the single current endpoint they should call.\n\nCONTEXT BUNDLE\n${bundle}\n\nUse only the supplied context. Identify conflicts and prefer current machine-readable schemas over archived prose.`;
  const startedAt = Date.now();
  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: 'medium' },
    input: [
      { role: 'developer', content: 'Act as the support agent under test. Follow the supplied context exactly. Do not use outside knowledge.' },
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
            recommendedEndpoint: { type: 'string' },
            currentEndpointIdentified: { type: 'boolean' },
            legacyEndpointRejected: { type: 'boolean' },
            conflictExplained: { type: 'boolean' },
            explanation: { type: 'string' },
          },
          required: ['recommendedEndpoint', 'currentEndpointIdentified', 'legacyEndpointRejected', 'conflictExplained', 'explanation'],
        },
      },
    },
    max_output_tokens: 300,
  });
  const answer = JSON.parse(response.output_text) as AgentAnswer;
  const { score, breakdown } = scoreAnswer(answer);
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
    recommendedEndpoint: answer.recommendedEndpoint,
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

async function liveReport(contexts: ContextItem[], apiKey: string) {
  const client = new OpenAI({ apiKey });
  const variants = variantsFor(contexts);
  const jobs = variants.flatMap(variant => Array.from({ length: REPEATS }, (_, index) => ({ variant, repeat: index + 1 })));

  // Use one request as a quota probe before starting the concurrent suite.
  const first = await runLiveCell(client, contexts, jobs[0].variant, jobs[0].repeat);
  const remaining = await mapWithConcurrency(jobs.slice(1), 4, job => runLiveCell(client, contexts, job.variant, job.repeat));
  const variantResults = groupRuns(variants, [first, ...remaining]);
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
    repeat => runLiveCell(client, contexts, packVariant, repeat),
  );
  const packVerification = groupRuns([packVariant], packRuns)[0];
  return buildReport(contexts, variantResults, packVerification, 'live');
}

export async function runExperimentSuite(contexts: ContextItem[], apiKey?: string): Promise<ExperimentReport> {
  if (!apiKey) return fixtureReport(contexts);
  try {
    return await liveReport(contexts, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('429') || message.toLowerCase().includes('quota')) return fixtureReport(contexts);
    throw error;
  }
}
