import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { contexts } from '../src/data.js';
import { runLiveExperimentSuite } from '../server/experiment-engine.js';
import { fingerprintContextBundle, fingerprintReport } from '../src/provenance.js';
import type { ExperimentReport } from '../src/types.js';

dotenv.config({ path: '.env.local', override: false });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('No usable OPENAI_API_KEY was found in .env.local or the process environment.');

let report: ExperimentReport;
try {
  report = await runLiveExperimentSuite(contexts, apiKey);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    console.error('Live evidence was not generated: this API project has no available quota. Add API billing or switch to a funded project, then run `npm run evidence:live` again. No fixture artifact was created.');
    process.exit(1);
  }
  throw error;
}
if (report.mode !== 'live') throw new Error(`Expected live evidence but received ${report.mode}.`);

const artifact = {
  schemaVersion: '1.1',
  generatedAt: new Date().toISOString(),
  claim: 'Live GPT-5.6 Sol Responses API evidence generated from the bundled support-agent context experiment.',
  provenance: {
    runner: 'npm run evidence:live',
    noFixtureFallback: true,
    source: 'direct Responses API run from this repository',
  },
  evaluatorPolicy: 'Scores are computed by independent deterministic assertions over the returned endpoint and explanation. The subject model does not report grading booleans.',
  inputContexts: contexts,
  report,
  reportFingerprint: await fingerprintReport(report),
  sourceContextFingerprint: await fingerprintContextBundle(contexts),
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
