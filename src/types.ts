export type ContextStatus = 'required' | 'useful' | 'redundant' | 'harmful';
export type ExperimentMode = 'live' | 'fixture-replay';

export interface ContextItem {
  id: string;
  name: string;
  tokens: number;
  content: string;
}

export interface ContextEvidence {
  contextId: string;
  name: string;
  status: ContextStatus;
  contribution: number;
  omissionMean: number;
  pairedWins: number;
  recommendation: string;
}

export interface ScoreBreakdown {
  endpointAccuracy: number;
  recencyReasoning: number;
  legacyRejection: number;
  conflictExplanation: number;
  schemaValidity: number;
}

export interface ExperimentRun {
  id: string;
  variantId: string;
  variantLabel: string;
  omittedContextId: string | null;
  includedContextIds?: string[];
  repeat: number;
  score: number;
  passed: boolean;
  output: string;
  recommendedEndpoint: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  promptHash: string;
  source: ExperimentMode;
  breakdown: ScoreBreakdown;
}

export interface VariantResult {
  id: string;
  label: string;
  omittedContextId: string | null;
  includedContextIds?: string[];
  mean: number;
  runs: ExperimentRun[];
}

export interface Diagnosis {
  finding: string;
  explanation: string;
  harmfulItem: string;
  oldInstruction: string;
  currentInstruction: string;
  repeatAgreement: string;
}

export interface EvaluationContractSummary {
  id: string;
  label: string;
  task: string;
  expectedEndpoint: string;
  legacyEndpoints: string[];
  currentSourceLabel: string;
  legacySourceLabel: string;
}

/** A portable, task-specific gate created from a completed Context MRI report. */
export interface ContextGuard {
  schemaVersion: '1.0';
  id: string;
  label: string;
  createdAt: string;
  sourceReportId: string;
  sourceMode: ExperimentMode;
  projectId: string;
  task: string;
  expectedEndpoint: string;
  minimumScore: number;
  recommendedContextIds: string[];
  blockedTerms: string[];
}

export interface GuardFlaggedFile {
  contextId: string;
  name: string;
  terms: string[];
}

export interface ContextGuardCheck {
  status: 'pass' | 'blocked';
  checkedAt: string;
  reportId: string;
  mode: ExperimentMode;
  score: number;
  minimumScore: number;
  expectedEndpoint: string;
  flaggedFiles: GuardFlaggedFile[];
  reasons: string[];
}

export interface ExperimentReport {
  id: string;
  createdAt: string;
  mode: ExperimentMode;
  model: string;
  reasoningEffort: 'medium';
  repeats: number;
  totalRuns: number;
  baselineScore: number;
  optimizedScore: number;
  tokenReduction: number;
  originalTokens: number;
  optimizedTokens: number;
  variants: VariantResult[];
  packVerification: VariantResult;
  contextEvidence: ContextEvidence[];
  diagnosis: Diagnosis;
  evaluationContract: EvaluationContractSummary;
  recommendedContextIds: string[];
  /** Backwards-compatible alias for recommendedContextIds. */
  minimalContextIds: string[];
  provenance: {
    dataset: string;
    evaluator: string;
    passThreshold: number;
    fixtureNote?: string;
  };
}
