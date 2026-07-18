import { readFileSync } from 'node:fs';
import { checkContextGuard, isContextGuard } from '../server/context-guard.js';
import type { ContextItem } from '../src/types.js';

type EvidenceExport = { inputContexts?: unknown; decision?: { activeContextIds?: unknown } };

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
    ? inputContexts.filter(item => item && typeof item === 'object' && activeIds.includes((item as Partial<ContextItem>).id))
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
    const contexts = asContexts(readJson(contextPath));
    if (!isContextGuard(guard)) throw new Error('The guard file is not a complete Context MRI Context Guard.');
    if (!contexts) throw new Error('The context file must be an evidence export with inputContexts or a JSON ContextItem array (2–12 items).');
    const result = checkContextGuard(guard, contexts);
    console.log(JSON.stringify({ guard: guard.id, projectId: guard.projectId, result }, null, 2));
    if (result.status === 'blocked') process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Context Guard check failed.');
    process.exitCode = 2;
  }
}
