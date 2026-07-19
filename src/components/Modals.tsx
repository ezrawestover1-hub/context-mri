import { Check, Info, X } from 'lucide-react';
import type { ExperimentReport, ExperimentRun } from '../types';

function ModalShell({ children, label, onClose }: { children: React.ReactNode; label: string; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-label={label}>{children}</section>
  </div>;
}

export function TraceModal({ run, report, onClose }: { run: ExperimentRun; report: ExperimentReport; onClose: () => void }) {
  const rubric = new Map(report.evaluationContract.rubric.map(item => [item.id, item]));
  return <ModalShell label="Experiment trace" onClose={onClose}>
    <header><div><span>EXPERIMENT TRACE</span><h2>{run.variantLabel} · Run {String(run.repeat).padStart(2, '0')}</h2></div><button onClick={onClose} aria-label="Close trace"><X size={19} /></button></header>
    <div className="trace-summary"><strong className={run.passed ? 'good' : 'bad'}>{run.score}/100</strong><div><b>{run.passed ? 'PASS' : 'BELOW THRESHOLD'}</b><span>{report.provenance.passThreshold}-point pass threshold</span></div><span className={`run-mode ${run.source}`}>{run.source === 'live' ? 'LIVE' : 'FIXTURE REPLAY'}</span></div>
    <div className="trace-meta"><span><b>Evaluation contract</b><code>{report.evaluationContract.id}</code></span><span><b>Run ID</b><code>{run.id}</code></span><span><b>Prompt hash</b><code>{run.promptHash}</code></span><span><b>Latency</b><code>{run.durationMs} ms</code></span><span><b>Tokens</b><code>{run.inputTokens} in · {run.outputTokens} out</code></span></div>
    <h3>RUBRIC BREAKDOWN</h3>
    <div className="rubric">{Object.entries(run.breakdown).map(([key, value]) => {
      const criterion = rubric.get(key as keyof typeof run.breakdown);
      const maximum = criterion?.maximum ?? 0;
      return <div className="rubric-row" key={key}><span>{criterion?.label ?? key}</span><i><b style={{ width: `${maximum ? value / maximum * 100 : 0}%` }} /></i><code>{value}/{maximum}</code></div>;
    })}</div>
    <h3>MODEL OUTPUT</h3><pre className="model-output">{run.output}</pre>
    <footer><span>{run.includedContextIds ? `Included: ${run.includedContextIds.join(', ')}` : run.omittedContextId ? `Omitted: ${run.omittedContextId}` : 'Baseline: all context included'}</span><span>{report.model} · {report.reasoningEffort}</span></footer>
  </ModalShell>;
}

export function RewriteModal({ fileName, disallowedTerm, expectedAnswer, currentSourceLabel, onClose, onApply }: { fileName: string; disallowedTerm: string; expectedAnswer: string; currentSourceLabel: string; onClose: () => void; onApply: () => void }) {
  return <ModalShell label="Suggested rewrite" onClose={onClose}>
    <header><div><span>SUGGESTED REWRITE</span><h2>Repair {fileName}</h2></div><button onClick={onClose} aria-label="Close rewrite"><X size={19} /></button></header>
    <p className="modal-intro">Preserve any useful note while replacing the observed disallowed instruction with the task-specific correct answer.</p>
    <div className="diff"><code className="removed">− {disallowedTerm}</code><code className="added">+ {expectedAnswer}</code><code className="added">+ Source: {currentSourceLabel}</code></div>
    <footer><span>The rewrite must be re-tested before it is trusted.</span><button className="apply-rewrite" onClick={onApply}><Check size={15} /> Stage rewrite</button></footer>
  </ModalShell>;
}

export function ProvenanceModal({ report, onClose }: { report: ExperimentReport; onClose: () => void }) {
  return <ModalShell label="Fixture replay explanation" onClose={onClose}>
    <header><div><span>EVIDENCE PROVENANCE</span><h2>What “fixture replay” means</h2></div><button onClick={onClose} aria-label="Close explanation"><X size={19} /></button></header>
    <div className="provenance-copy">
      <Info size={24} />
      <p>This public screen intentionally uses a deterministic simulation of the bundled {report.evaluationContract.label} example. It exercises the same ablation, classification, trace, pack-verification, and export pipeline—but it is <strong>not presented as fresh GPT-5.6 evidence.</strong></p>
      <p>With API quota, Context MRI can replace these records with {report.totalRuns} inspectable model traces and keep the same independent evaluator. The subject model never supplies its own grading fields.</p>
    </div>
    <footer><span>{report.provenance.fixtureNote}</span><button className="apply-rewrite" onClick={onClose}>Understood</button></footer>
  </ModalShell>;
}

export function ContractModal({ report, onClose }: { report: ExperimentReport; onClose: () => void }) {
  const contract = report.evaluationContract;
  return <ModalShell label="Evaluation contract" onClose={onClose}>
    <header><div><span>EVALUATION CONTRACT</span><h2>What this experiment can prove</h2></div><button onClick={onClose} aria-label="Close evaluation contract"><X size={19} /></button></header>
    <div className="contract-copy">
      <p><strong>Task:</strong> {contract.task}</p>
      <div className="contract-values"><span><small>Correct {contract.answerLabel}</small><code>{contract.expectedAnswer}</code></span><span><small>Disallowed instruction</small><code>{contract.disallowedTerms.join(', ')}</code></span><span><small>Authoritative source</small><strong>{contract.currentSourceLabel}</strong></span></div>
      <h3>SCORING RUBRIC</h3>
      <ol className="contract-rubric">{contract.rubric.map(item => <li key={item.id}><span><strong>{item.label}</strong><small>{item.description}</small></span><b>{item.maximum}</b></li>)}</ol>
      <p className="contract-scope">A file is only “harmful” if removing it improves this specific task under this evaluator. The result is not a universal truth about the file.</p>
    </div>
    <footer><span>Contract <code>{contract.id}</code> · task-specific and inspectable</span><button className="apply-rewrite" onClick={onClose}>Understood</button></footer>
  </ModalShell>;
}
