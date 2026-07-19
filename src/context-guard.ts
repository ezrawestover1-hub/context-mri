import { findDiagnosticProject } from './projects';
import { fingerprintContextBundle, fingerprintContract, fingerprintGuard, fingerprintReport } from './provenance';
import type { ContextGuard, ContextItem, ExperimentReport } from './types';

const GUARD_SCHEMA_VERSION = '1.2' as const;
const MINIMUM_GUARD_SCORE = 80;

/** Creates a portable, task-specific guard from an inspectable MRI report. */
export async function createContextGuard(report: ExperimentReport, sourceContexts: ContextItem[], createdAt = new Date().toISOString()): Promise<ContextGuard> {
  const contract = report.evaluationContract;
  const project = findDiagnosticProject(contract.id);
  if (!project) throw new Error(`Cannot create a guard for an unknown contract: ${contract.id}`);
  const recommended = sourceContexts.filter(context => report.recommendedContextIds.includes(context.id));
  if (recommended.length !== report.recommendedContextIds.length) throw new Error('The source bundle is missing one or more recommended context files.');

  const unsignedGuard: Omit<ContextGuard, 'guardFingerprint'> = {
    schemaVersion: GUARD_SCHEMA_VERSION,
    id: `context-mri-${contract.id}-guard`,
    label: `${contract.label} regression guard`,
    createdAt,
    sourceReportId: report.id,
    sourceMode: report.mode,
    projectId: contract.id,
    task: contract.task,
    expectedAnswer: contract.expectedAnswer,
    minimumScore: MINIMUM_GUARD_SCORE,
    recommendedContextIds: [...report.recommendedContextIds],
    blockedTerms: [...contract.disallowedTerms],
    contractFingerprint: await fingerprintContract(project),
    sourceReportFingerprint: await fingerprintReport(report),
    sourceContextFingerprint: await fingerprintContextBundle(sourceContexts),
    recommendedPackFingerprint: await fingerprintContextBundle(recommended),
  };

  return { ...unsignedGuard, guardFingerprint: await fingerprintGuard(unsignedGuard) };
}
