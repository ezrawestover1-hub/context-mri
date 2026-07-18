import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { ContextItem } from '../src/types.js';
import { fixtureReport, runExperimentSuite } from './experiment-engine.js';

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

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  model: 'gpt-5.6-sol',
  keyConfigured: Boolean(process.env.OPENAI_API_KEY),
  experimentEngine: 'v3',
}));

app.post('/api/experiments', async (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  try {
    const report = await runExperimentSuite(req.body.contexts, process.env.OPENAI_API_KEY);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown experiment error';
    console.error('Experiment suite failed:', message);
    res.status(500).json({ error: message });
  }
});

app.post('/api/fixture', (req, res) => {
  if (!validContexts(req.body?.contexts)) return res.status(400).json({ error: 'Supply 2–12 valid context items.' });
  res.json(fixtureReport(req.body.contexts));
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Context MRI API listening on http://localhost:${port}`));
