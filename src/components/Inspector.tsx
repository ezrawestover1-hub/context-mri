import { Check, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import type { ContextEvidence, ContextItem, ExperimentReport } from '../types';

type InspectorProps = {
  item: ContextItem;
  evidence?: ContextEvidence;
  report: ExperimentReport;
  recommendationApplied: boolean;
  onApplyRecommendation: () => void;
  onRestore: () => void;
  onRewrite: () => void;
};

export function Inspector({ item, evidence, report, recommendationApplied, onApplyRecommendation, onRestore, onRewrite }: InspectorProps) {
  if (!evidence) {
    return <aside className="inspector panel">
      <div className="panel-heading"><div><span>WHY IT MATTERS</span><small>Evidence inspector</small></div></div>
      <div className="empty-inspector">
        <Sparkles size={22} />
        <h2>This file has not been measured yet.</h2>
        <p>Run the MRI again. It will add one omission condition and three new comparison traces for <code>{item.name}</code>.</p>
      </div>
    </aside>;
  }

  const isHarmful = evidence.status === 'harmful';
  const isRecommended = report.recommendedContextIds.includes(item.id);

  return <aside className="inspector panel">
    <div className="panel-heading inspector-heading"><div><span>EVIDENCE INSPECTOR</span><small>Why this file matters</small></div><span className={`status-tag ${evidence.status}`}>{evidence.status.toUpperCase()}</span></div>
    <div className="inspector-body">
      <code className="inspector-file">{item.name}</code>

      {isHarmful ? <>
        <h2>Removing this file raises the pass score by <strong>{Math.abs(evidence.contribution)} points.</strong></h2>
        <p className="evidence-note">{evidence.pairedWins}/{report.repeats} paired repeats improved · {report.mode === 'live' ? 'fresh GPT-5.6 traces' : 'fixture simulation'}</p>

        <div className="conflict-stack">
          <div className="conflict old"><small>{item.name} says</small><code>{report.diagnosis.oldInstruction || 'Conflicting instruction detected'}</code></div>
          <div className="conflict-junction"><span>×</span></div>
          <div className="conflict current"><small>current source says</small><code>{report.diagnosis.currentInstruction}</code></div>
        </div>

        <p className="plain-explanation">The {report.evaluationContract.legacySourceLabel} conflicts with the {report.evaluationContract.currentSourceLabel}. The agent becomes reliable when that source is absent.</p>
      </> : <>
        <h2>{evidence.status === 'required' ? 'The task falls apart without this file.' : evidence.status === 'useful' ? 'This file measurably improves reliability.' : 'This file adds tokens without measurable lift.'}</h2>
        <div className="context-effect"><strong>{evidence.contribution > 0 ? '+' : ''}{evidence.contribution} pp</strong><span>contribution to baseline score</span></div>
        <p className="plain-explanation">{evidence.recommendation}</p>
        <pre className="context-preview">{item.content}</pre>
      </>}
    </div>

    <div className="inspector-actions">
      {isRecommended ? <div className="keep-decision"><Check size={17} /><span>Included in the recommended pack</span></div> : recommendationApplied ? <button className="secondary-action" onClick={onRestore}><RotateCcw size={16} /> Restore all context</button> : <button className="danger-action" onClick={onApplyRecommendation}><Trash2 size={16} /> Remove harmful file</button>}
      {isHarmful ? <button className="secondary-action" onClick={onRewrite}><Sparkles size={16} /> Preview safe rewrite</button> : null}
      <p>Controlled, task-specific ablation evidence—not a claim of universal causality.</p>
    </div>
  </aside>;
}
