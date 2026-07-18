import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { contexts } from '../src/data.js';
import { runLiveExperimentSuite } from '../server/experiment-engine.js';

dotenv.config({ path: '.env.local', override: false });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('No usable OPENAI_API_KEY was found in .env.local or the process environment.');

const report = await runLiveExperimentSuite(contexts, apiKey);
if (report.mode !== 'live') throw new Error(`Expected live evidence but received ${report.mode}.`);

const artifact = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  claim: 'Authentic GPT-5.6 Sol Responses API evidence generated from the bundled support-agent context experiment.',
  evaluatorPolicy: 'Scores are computed by independent deterministic assertions over the returned endpoint and explanation. The subject model does not report grading booleans.',
  inputContexts: contexts,
  report,
};

const outputPath = resolve('public/evidence/live-gpt-5.6.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  ok: true,
  outputPath,
  reportId: report.id,
  model: report.model,
  totalRuns: report.totalRuns,
  baselineScore: report.baselineScore,
  optimizedScore: report.optimizedScore,
}));
