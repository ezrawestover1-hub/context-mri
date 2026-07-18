import type { ContextGuard, ExperimentReport } from './types';

const GUARD_SCHEMA_VERSION = '1.0' as const;
const MINIMUM_GUARD_SCORE = 80;

/** Creates a portable, task-specific guard from an inspectable MRI report. */
export function createContextGuard(report: ExperimentReport, createdAt = new Date().toISOString()): ContextGuard {
  const contract = report.evaluationContract;
  return {
    schemaVersion: GUARD_SCHEMA_VERSION,
    id: `context-mri-${contract.id}-guard`,
    label: `${contract.label} regression guard`,
    createdAt,
    sourceReportId: report.id,
    sourceMode: report.mode,
    projectId: contract.id,
    task: contract.task,
    expectedEndpoint: contract.expectedEndpoint,
    minimumScore: MINIMUM_GUARD_SCORE,
    recommendedContextIds: [...report.recommendedContextIds],
    blockedTerms: [...contract.legacyEndpoints],
  };
}
