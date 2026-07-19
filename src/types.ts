export type ContextStatus = 'required' | 'useful' | 'redundant' | 'harmful';
export type ExperimentMode = 'live' | 'fixture-replay';

export interface ContextItem {
  id: string;
  name: string;
  tokens: number;
  content: string;
}

/** Inputs for a local-only, fresh-live Judge Lab evaluation. */
export interface JudgeLabInput {
  task: string;
  expectedAnswer: string;
  disallowedInstruction: string;
  currentSourceLabel: string;
  legacySourceLabel: string;
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
  answerAccuracy: number;
  authoritativeSourceReasoning: number;
  unsafeInstructionRejection: number;
  conflictExplanation: number;
  structuredOutputValidity: number;
}

export interface RubricCriterion {
  id: keyof ScoreBreakdown;
  label: string;
  maximum: number;
  description: string;
}

/** A fixed two-file comparison registered before a fresh live suite begins. */
export interface InteractionSpec {
  id: string;
  label: string;
  question: string;
  contextIds: [string, string];
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
  recommendedAnswer: string;
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

export interface InteractionCheck extends InteractionSpec {
  includedContextIds: string[];
  runs: ExperimentRun[];
  mean: number;
  individualLosses: [number, number];
  combinedLoss: number;
  additiveLoss: number;
  /** Positive means the two individual losses overlap rather than add cleanly. */
  overlap: number;
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
  answerLabel: string;
  expectedAnswer: string;
  disallowedTerms: string[];
  currentSourceLabel: string;
  legacySourceLabel: string;
  rubric: RubricCriterion[];
  interaction?: InteractionSpec;
}

/** A portable, task-specific gate created from a completed Context MRI report. */
export interface ContextGuard {
  schemaVersion: '1.2';
  id: string;
  label: string;
  createdAt: string;
  sourceReportId: string;
  sourceMode: ExperimentMode;
  projectId: string;
  task: string;
  expectedAnswer: string;
  minimumScore: number;
  recommendedContextIds: string[];
  blockedTerms: string[];
  /** SHA-256 fingerprint of the canonical task contract. */
  contractFingerprint: string;
  /** SHA-256 fingerprint of the report that produced this gate. */
  sourceReportFingerprint: string;
  /** SHA-256 fingerprint of the complete source library. */
  sourceContextFingerprint: string;
  /** SHA-256 fingerprint of the recommended context files this guard expects. */
  recommendedPackFingerprint: string;
  /** SHA-256 fingerprint of this portable artifact, excluding this field. */
  guardFingerprint: string;
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
  expectedAnswer: string;
  flaggedFiles: GuardFlaggedFile[];
  reasons: string[];
  integrity: {
    contract: boolean;
    artifact: boolean;
    recommendedPack: boolean;
  };
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
  /** Present only for a fresh suite whose contract pre-registers a pairwise check. */
  interaction?: InteractionCheck;
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
