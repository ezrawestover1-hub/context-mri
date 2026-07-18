import { Check, Info, X } from 'lucide-react';
import type { ExperimentReport, ExperimentRun } from '../types';

const criterionLabels: Record<string, string> = {
  endpointAccuracy: 'Endpoint accuracy',
  recencyReasoning: 'Recency reasoning',
  legacyRejection: 'Legacy-risk handling',
  conflictExplanation: 'Conflict explanation',
  schemaValidity: 'Schema validity',
};

const criterionMax: Record<string, number> = {
  endpointAccuracy: 50,
  recencyReasoning: 20,
  legacyRejection: 15,
  conflictExplanation: 10,
  schemaValidity: 5,
};

function ModalShell({ children, label, onClose }: { children: React.ReactNode; label: string; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={label}>{children}</section>
  </div>;
}

export function TraceModal({ run, report, onClose }: { run: ExperimentRun; report: ExperimentReport; onClose: () => void }) {
  return <ModalShell label="Experiment trace" onClose={onClose}>
    <header><div><span>EXPERIMENT TRACE</span><h2>{run.variantLabel} · Run {String(run.repeat).padStart(2, '0')}</h2></div><button onClick={onClose} aria-label="Close trace"><X size={19} /></button></header>
    <div className="trace-summary"><strong className={run.passed ? 'good' : 'bad'}>{run.score}/100</strong><div><b>{run.passed ? 'PASS' : 'BELOW THRESHOLD'}</b><span>{report.provenance.passThreshold}-point pass threshold</span></div><span className={`run-mode ${run.source}`}>{run.source === 'live' ? 'LIVE' : 'FIXTURE REPLAY'}</span></div>
    <div className="trace-meta"><span><b>Run ID</b><code>{run.id}</code></span><span><b>Prompt hash</b><code>{run.promptHash}</code></span><span><b>Latency</b><code>{run.durationMs} ms</code></span><span><b>Tokens</b><code>{run.inputTokens} in · {run.outputTokens} out</code></span></div>
    <h3>RUBRIC BREAKDOWN</h3>
    <div className="rubric">{Object.entries(run.breakdown).map(([key, value]) => <div className="rubric-row" key={key}><span>{criterionLabels[key]}</span><i><b style={{ width: `${value / criterionMax[key] * 100}%` }} /></i><code>{value}/{criterionMax[key]}</code></div>)}</div>
    <h3>MODEL OUTPUT</h3><pre className="model-output">{run.output}</pre>
    <footer><span>{run.includedContextIds ? `Included: ${run.includedContextIds.join(', ')}` : run.omittedContextId ? `Omitted: ${run.omittedContextId}` : 'Baseline: all context included'}</span><span>{report.model} · {report.reasoningEffort}</span></footer>
  </ModalShell>;
}

export function RewriteModal({ fileName, onClose, onApply }: { fileName: string; onClose: () => void; onApply: () => void }) {
  return <ModalShell label="Suggested rewrite" onClose={onClose}>
    <header><div><span>SUGGESTED REWRITE</span><h2>Repair {fileName}</h2></div><button onClick={onClose} aria-label="Close rewrite"><X size={19} /></button></header>
    <p className="modal-intro">Preserve the useful migration note while replacing the stale endpoint and recording the current source.</p>
    <div className="diff"><code className="removed">− Use POST /v1/chat/completions</code><code className="added">+ Use POST /v1/responses</code><code className="added">+ Source: current tool schema</code></div>
    <footer><span>The rewrite must be re-tested before it is trusted.</span><button className="apply-rewrite" onClick={onApply}><Check size={15} /> Stage rewrite</button></footer>
  </ModalShell>;
}

export function ProvenanceModal({ report, onClose }: { report: ExperimentReport; onClose: () => void }) {
  return <ModalShell label="Fixture replay explanation" onClose={onClose}>
    <header><div><span>EVIDENCE PROVENANCE</span><h2>What “fixture replay” means</h2></div><button onClick={onClose} aria-label="Close explanation"><X size={19} /></button></header>
    <div className="provenance-copy">
      <Info size={24} />
      <p>This screen is using a deterministic simulation of the bundled support-agent example because the connected API project has no model quota. It exercises the same ablation, classification, trace, pack-verification, and export pipeline—but it is <strong>not presented as fresh GPT-5.6 evidence.</strong></p>
      <p>With API quota, Context MRI automatically replaces these records with {report.totalRuns} inspectable model traces and keeps the same fixed evaluator.</p>
    </div>
    <footer><span>{report.provenance.fixtureNote}</span><button className="apply-rewrite" onClick={onClose}>Understood</button></footer>
  </ModalShell>;
}
