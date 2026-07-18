import { readFileSync } from 'node:fs';
import { checkContextGuard, isContextGuard } from '../server/context-guard.js';
import type { ContextItem } from '../src/types.js';
import { fingerprintContextBundle, fingerprintReport } from '../src/provenance.js';

type EvidenceExport = { inputContexts?: unknown; decision?: { activeContextIds?: unknown }; report?: unknown };

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function asContexts(value: unknown): ContextItem[] | null {
  const exportValue = value as EvidenceExport | null;
  const inputContexts = Array.isArray(value) ? value : exportValue?.inputContexts;
  const activeIds = exportValue?.decision?.activeContextIds;
  const candidate = Array.isArray(inputContexts) && Array.isArray(activeIds) && activeIds.every(id => typeof id === 'string')
    ? inputContexts.filter(item => {
      const id = item && typeof item === 'object' ? (item as Partial<ContextItem>).id : undefined;
      return typeof id === 'string' && activeIds.includes(id);
    })
    : inputContexts;
  if (!Array.isArray(candidate) || candidate.length < 2 || candidate.length > 12) return null;
  const ids = new Set<string>();
  const valid = candidate.every(item => {
    if (!item || typeof item !== 'object') return false;
    const context = item as Partial<ContextItem>;
    const usable = typeof context.id === 'string' && context.id.length > 0 &&
      typeof context.name === 'string' && context.name.length > 0 &&
      typeof context.content === 'string' &&
      typeof context.tokens === 'number' && Number.isFinite(context.tokens) && context.tokens >= 0;
    if (!usable || ids.has(context.id!)) return false;
    ids.add(context.id!);
    return true;
  });
  return valid ? candidate as ContextItem[] : null;
}

const guardPath = valueAfter('--guard');
const contextPath = valueAfter('--context');

if (!guardPath || !contextPath) {
  console.error('Usage: npm run guard:check -- --guard path/to/context-mri-guard.json --context path/to/context-mri-evidence.json');
  process.exitCode = 2;
} else {
  try {
    const guard = readJson(guardPath);
    const evidence = readJson(contextPath);
    const contexts = asContexts(evidence);
    if (!isContextGuard(guard)) throw new Error('The guard file is not a complete Context MRI Context Guard.');
    if (!contexts) throw new Error('The context file must be an evidence export with inputContexts or a JSON ContextItem array (2–12 items).');
    const exportValue = evidence as EvidenceExport;
    if (Array.isArray(exportValue.inputContexts) && exportValue.report) {
      const sourceContexts = asContexts({ inputContexts: exportValue.inputContexts });
      if (!sourceContexts) throw new Error('The evidence export contains an invalid original context bundle.');
      if (await fingerprintContextBundle(sourceContexts) !== guard.sourceContextFingerprint) throw new Error('Evidence export source bundle does not match the Context Guard provenance fingerprint.');
      if (await fingerprintReport(exportValue.report as import('../src/types.js').ExperimentReport) !== guard.sourceReportFingerprint) throw new Error('Evidence export report does not match the Context Guard provenance fingerprint.');
    }
    const result = await checkContextGuard(guard, contexts);
    console.log(JSON.stringify({ guard: guard.id, projectId: guard.projectId, result }, null, 2));
    if (result.status === 'blocked') process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Context Guard check failed.');
    process.exitCode = 2;
  }
}
