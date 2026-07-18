import type { ContextEvidence, ContextItem, ExperimentReport, ExperimentRun, ScoreBreakdown, VariantResult } from './types';

export const contexts: ContextItem[] = [
  { id: 'system', name: 'system-prompt.md', tokens: 482, content: 'You are a support agent. Resolve API migration issues using the supplied current tool schema. Verify the endpoint before answering.' },
  { id: 'schema', name: 'tool-schema.json', tokens: 611, content: '{ "create_response": { "method": "POST", "path": "/v1/responses", "description": "Current endpoint for model responses" } }' },
  { id: 'legacy', name: 'legacy-api.md', tokens: 934, content: 'API Quickstart (archived): Send all generation requests with POST /v1/chat/completions. This is the required endpoint.' },
  { id: 'rules', name: 'product-rules.md', tokens: 509, content: 'Never invent endpoints. Prefer the newest machine-readable tool schema when prose documentation conflicts.' },
  { id: 'examples', name: 'examples.md', tokens: 304, content: 'Example: explain an authentication error in plain language.' },
];

const variantSeeds = [
  { id: 'baseline', label: 'Baseline', omittedContextId: null, scores: [35, 40, 55] },
  { id: 'omit-system', label: '−System', omittedContextId: 'system', scores: [5, 5, 15] },
  { id: 'omit-schema', label: '−Schema', omittedContextId: 'schema', scores: [5, 15, 15] },
  { id: 'omit-legacy', label: '−Legacy API', omittedContextId: 'legacy', scores: [85, 90, 100] },
  { id: 'omit-rules', label: '−Rules', omittedContextId: 'rules', scores: [30, 30, 35] },
  { id: 'omit-examples', label: '−Examples', omittedContextId: 'examples', scores: [35, 40, 55] },
] as const;

function breakdown(score: number): ScoreBreakdown {
  const entries: Array<[keyof ScoreBreakdown, number]> = [['endpointAccuracy', 50], ['recencyReasoning', 20], ['legacyRejection', 15], ['conflictExplanation', 10]];
  for (let mask = 0; mask < 2 ** entries.length; mask += 1) {
    const value: ScoreBreakdown = { endpointAccuracy: 0, recencyReasoning: 0, legacyRejection: 0, conflictExplanation: 0, schemaValidity: 5 };
    entries.forEach(([key, points], index) => { if (mask & (1 << index)) value[key] = points; });
    if (Object.values(value).reduce((sum, points) => sum + points, 0) === score) return value;
  }
  throw new Error(`Invalid fixture score: ${score}`);
}

function makeRun(seed: { id: string; label: string; omittedContextId: string | null }, score: number, index: number): ExperimentRun {
  const passed = score >= 80;
  const scoreBreakdown = breakdown(score);
  const correctEndpoint = scoreBreakdown.endpointAccuracy === 50;
  return {
    id: `fx-${seed.id}-r${index + 1}`,
    variantId: seed.id,
    variantLabel: seed.label,
    omittedContextId: seed.omittedContextId,
    repeat: index + 1,
    score,
    passed,
    output: passed ? 'Recommend POST /v1/responses. The chat completions note is archived.' : correctEndpoint ? 'Recommend POST /v1/responses, but source recency and the conflict are not fully explained.' : 'The schema appears newer, but the archived quickstart calls chat completions required, so I recommend the archived endpoint.',
    recommendedEndpoint: correctEndpoint ? '/v1/responses' : '/v1/chat/completions',
    durationMs: 824 + index * 71,
    inputTokens: 932 - (seed.omittedContextId ? 120 : 0),
    outputTokens: passed ? 46 : 31,
    promptHash: `fixture-${seed.id.slice(0, 8)}`,
    source: 'fixture-replay',
    breakdown: scoreBreakdown,
  };
}

const variants: VariantResult[] = variantSeeds.map(seed => {
  const runs = seed.scores.map((score, index) => makeRun(seed, score, index));
  return { id: seed.id, label: seed.label, omittedContextId: seed.omittedContextId, runs, mean: Math.round(runs.reduce((sum, run) => sum + run.score, 0) / runs.length) };
});

const contextEvidence: ContextEvidence[] = [
  { contextId: 'system', name: 'system-prompt.md', status: 'required', contribution: 35, omissionMean: 8, pairedWins: 0, recommendation: 'Keep — removing it breaks task framing.' },
  { contextId: 'schema', name: 'tool-schema.json', status: 'required', contribution: 31, omissionMean: 12, pairedWins: 0, recommendation: 'Keep — it is the current source of truth.' },
  { contextId: 'legacy', name: 'legacy-api.md', status: 'harmful', contribution: -49, omissionMean: 92, pairedWins: 3, recommendation: 'Remove or rewrite — every paired run improves without it.' },
  { contextId: 'rules', name: 'product-rules.md', status: 'useful', contribution: 11, omissionMean: 32, pairedWins: 0, recommendation: 'Keep — it improves conflict handling.' },
  { contextId: 'examples', name: 'examples.md', status: 'redundant', contribution: 0, omissionMean: 43, pairedWins: 1, recommendation: 'Optional — no measurable lift on this task.' },
];

const packSeed = { id: 'recommended-pack', label: 'Recommended pack', omittedContextId: null, scores: [85, 90, 100] } as const;
const packRuns = packSeed.scores.map((score, index) => makeRun(packSeed, score, index));
const packVerification: VariantResult = { ...packSeed, runs: packRuns, mean: 92 };

export const seedReport: ExperimentReport = {
  id: 'fixture-preview',
  createdAt: '2026-07-17T00:00:00.000Z',
  mode: 'fixture-replay',
  model: 'gpt-5.6-sol',
  reasoningEffort: 'medium',
  repeats: 3,
  totalRuns: 21,
  baselineScore: 43,
  optimizedScore: 92,
  tokenReduction: 44,
  originalTokens: 2840,
  optimizedTokens: 1602,
  variants,
  packVerification,
  contextEvidence,
  diagnosis: {
    finding: 'Removing legacy-api.md raises the rubric score by 49 percentage points.',
    explanation: 'The improvement appeared in 3/3 paired repeats.',
    harmfulItem: 'legacy-api.md',
    oldInstruction: 'Use POST /v1/chat/completions',
    currentInstruction: 'POST /v1/responses',
    repeatAgreement: '3/3 paired repeats',
  },
  recommendedContextIds: ['system', 'schema', 'rules'],
  minimalContextIds: ['system', 'schema', 'rules'],
  provenance: {
    dataset: 'support-api-migration-v1',
    evaluator: 'Five-part deterministic rubric (endpoint, recency, legacy handling, conflict, schema)',
    passThreshold: 80,
    fixtureNote: 'Deterministic fixture simulation. Add API quota to generate fresh GPT-5.6 traces for custom context.',
  },
};
