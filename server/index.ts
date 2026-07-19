import 'dotenv/config';
import dotenv from 'dotenv';
import express, { type ErrorRequestHandler } from 'express';
import cors, { type CorsOptions } from 'cors';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defaultDiagnosticProject, findDiagnosticProject, type DiagnosticProjectId } from '../src/projects.js';
import { checkContextGuard, isContextGuard } from './context-guard.js';
import { validateContextItems } from './context-mri-service.js';
import { fixtureReport, liveSuiteRunCount, runExperimentSuite, runLiveContractExperimentSuite, runLiveExperimentSuite } from './experiment-engine.js';
import { createJudgeLabContract, parseJudgeLabInput } from './judge-lab.js';

dotenv.config({ path: '.env.local', override: false });

const app = express();
app.disable('x-powered-by');

const configuredOrigins = new Set(
  (process.env.CONTEXT_MRI_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]' || configuredOrigins.has(url.origin)) {
        return callback(null, true);
      }
    } catch {
      // Reject malformed origins through the same controlled error path.
    }
    return callback(new Error('Origin is not allowed by the local Context MRI runner.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 600,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

function validProjectId(value: unknown): value is DiagnosticProjectId {
  return Boolean(findDiagnosticProject(value));
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  model: 'gpt-5.6-sol',
  keyConfigured: Boolean(process.env.OPENAI_API_KEY),
  experimentEngine: 'v4',
}));

app.get('/api/live-evidence', async (_req, res) => {
  try {
    const artifact = JSON.parse(await readFile(resolve('public/evidence/live-gpt-5.6.json'), 'utf8')) as unknown;
    res.json(artifact);
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return res.json(null);
    res.status(500).json({ error: 'Published live evidence is not valid JSON.' });
  }
});

app.get('/api/live-status', (_req, res) => res.json({
  available: Boolean(process.env.OPENAI_API_KEY),
  model: 'gpt-5.6-sol',
  suiteRuns: liveSuiteRunCount(defaultDiagnosticProject.contexts, defaultDiagnosticProject),
  reason: process.env.OPENAI_API_KEY
    ? 'A server-side API key is configured. The first model call is a quota probe; a failed probe never becomes fixture output.'
    : 'No server-side API key is configured. Add funded API quota locally to run fresh traces.',
}));

app.post('/api/experiments', async (req, res) => {
  if (!validateContextItems(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
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
  if (!validateContextItems(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
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
  if (!validateContextItems(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
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
  if (!validateContextItems(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  const projectId = req.body?.projectId ?? defaultDiagnosticProject.id;
  if (!validProjectId(projectId)) return res.status(400).json({ error: 'Supply a supported diagnostic project id.' });
  res.json(fixtureReport(req.body.contexts, projectId));
});

app.post('/api/guard/check', async (req, res) => {
  if (!validateContextItems(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  if (!isContextGuard(req.body?.guard)) return res.status(400).json({ error: 'Supply a valid Context Guard created by Context MRI.' });
  try {
    res.json(await checkContextGuard(req.body.guard, req.body.contexts));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Context Guard check failed.';
    res.status(400).json({ error: message });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

const apiErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const candidateStatus = typeof (error as { status?: unknown }).status === 'number'
    ? (error as { status: number }).status
    : 500;
  const status = candidateStatus >= 400 && candidateStatus < 500
    ? candidateStatus
    : error instanceof Error && error.message.includes('Origin is not allowed')
      ? 403
      : 500;
  const message = status === 403
    ? 'Origin not allowed by the local runner.'
    : status === 413
      ? 'Request body exceeds the local runner limit.'
      : 'Request failed.';
  console.error('Context MRI API request rejected:', error instanceof Error ? error.message : 'Unknown error');
  res.status(status).json({ error: message });
};
app.use(apiErrorHandler);

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => console.log(`Context MRI API listening on http://${host}:${port}`));
