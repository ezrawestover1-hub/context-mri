import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { ContextItem } from '../src/types.js';
import { defaultDiagnosticProject, findDiagnosticProject, type DiagnosticProjectId } from '../src/projects.js';
import { checkContextGuard, isContextGuard } from './context-guard.js';
import { fixtureReport, liveSuiteRunCount, runExperimentSuite, runLiveContractExperimentSuite, runLiveExperimentSuite } from './experiment-engine.js';
import { createJudgeLabContract, parseJudgeLabInput } from './judge-lab.js';

dotenv.config({ path: '.env.local', override: false });

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function validContexts(value: unknown): value is ContextItem[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 12) return false;
  const ids = new Set<string>();
  return value.every(item => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ContextItem>;
    const valid = typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 64 &&
      typeof candidate.name === 'string' && candidate.name.length > 0 && candidate.name.length <= 160 &&
      typeof candidate.content === 'string' && candidate.content.length <= 20_000 &&
      typeof candidate.tokens === 'number' && Number.isFinite(candidate.tokens) && candidate.tokens >= 0;
    if (!valid || ids.has(candidate.id!)) return false;
    ids.add(candidate.id!);
    return true;
  });
}

function validProjectId(value: unknown): value is DiagnosticProjectId {
  return Boolean(findDiagnosticProject(value));
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  model: 'gpt-5.6-sol',
  keyConfigured: Boolean(process.env.OPENAI_API_KEY),
  experimentEngine: 'v3',
}));

app.get('/api/live-status', (_req, res) => res.json({
  available: Boolean(process.env.OPENAI_API_KEY),
  model: 'gpt-5.6-sol',
  suiteRuns: liveSuiteRunCount(defaultDiagnosticProject.contexts, defaultDiagnosticProject),
  reason: process.env.OPENAI_API_KEY
    ? 'A server-side API key is configured. The first model call is a quota probe; a failed probe never becomes fixture output.'
    : 'No server-side API key is configured. Add funded API quota locally to run fresh traces.',
}));

app.post('/api/experiments', async (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  const projectId = req.body?.projectId ?? defaultDiagnosticProject.id;
  if (!validProjectId(projectId)) return res.status(400).json({ error: 'Supply a supported diagnostic project id.' });
  try {
    const report = await runExperimentSuite(req.body.contexts, process.env.OPENAI_API_KEY, projectId);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown experiment error';
    console.error('Experiment suite failed:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/live/experiments', async (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  const projectId = req.body?.projectId ?? defaultDiagnosticProject.id;
  if (!validProjectId(projectId)) return res.status(400).json({ error: 'Supply a supported diagnostic project id.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Fresh live runs require a funded server-side API project. This endpoint never substitutes fixture output.' });
  try {
    const report = await runLiveExperimentSuite(req.body.contexts, process.env.OPENAI_API_KEY, projectId);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown live experiment error';
    const quotaError = message.includes('429') || message.toLowerCase().includes('quota');
    console.error('Live experiment suite failed:', message);
    res.status(quotaError ? 402 : 500).json({ error: quotaError
      ? 'Fresh live evidence was not generated because this API project has no available quota. No fixture replay was substituted.'
      : message });
  }
});

app.post('/api/judge-lab/experiments', async (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  const lab = parseJudgeLabInput(req.body?.lab);
  if (!lab) return res.status(400).json({ error: 'Supply a task, success answer, conflicting instruction, and source labels within the stated limits.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Judge Lab runs only as a fresh local evaluation with a funded server-side API project. It never substitutes fixture output.' });
  try {
    const contract = createJudgeLabContract(lab, req.body.contexts);
    res.json(await runLiveContractExperimentSuite(req.body.contexts, process.env.OPENAI_API_KEY, contract));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Judge Lab error';
    const quotaError = message.includes('429') || message.toLowerCase().includes('quota');
    console.error('Judge Lab suite failed:', message);
    res.status(quotaError ? 402 : 500).json({ error: quotaError
      ? 'Judge Lab did not generate live evidence because this API project has no available quota. No fixture replay was substituted.'
      : message });
  }
});

app.post('/api/fixture', (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  const projectId = req.body?.projectId ?? defaultDiagnosticProject.id;
  if (!validProjectId(projectId)) return res.status(400).json({ error: 'Supply a supported diagnostic project id.' });
  res.json(fixtureReport(req.body.contexts, projectId));
});

app.post('/api/guard/check', async (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  if (!isContextGuard(req.body?.guard)) return res.status(400).json({ error: 'Supply a valid Context Guard created by Context MRI.' });
  try {
    res.json(await checkContextGuard(req.body.guard, req.body.contexts));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Context Guard check failed.';
    res.status(400).json({ error: message });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Context MRI API listening on http://localhost:${port}`));
