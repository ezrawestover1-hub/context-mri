import { Check, Download, Play, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ContextGuard as ContextGuardType, ContextGuardCheck } from '../types';

type ContextGuardProps = {
  guard: ContextGuardType | null;
  check: ContextGuardCheck | null;
  running: boolean;
  legacyEndpoint: string;
  onCreate: () => void;
  onCheckRecommended: () => void;
  onCheckOriginal: () => void;
  onDownload: () => void;
};

export function ContextGuard({ guard, check, running, legacyEndpoint, onCreate, onCheckRecommended, onCheckOriginal, onDownload }: ContextGuardProps) {
  return <section className="context-guard" aria-labelledby="context-guard-title">
    <div className="guard-heading">
      <div className="guard-kicker"><ShieldCheck size={15} /> Regression handoff</div>
      <h2 id="context-guard-title">Find it once. Keep it out.</h2>
      <p>Turn this result into a portable, task-specific guard. It blocks the stale instruction Context MRI found and catches a score drop before the same context bundle reaches your agent.</p>
    </div>

    {guard === null ? <div className="guard-empty">
      <div><strong>Create a Context Guard from this report</strong><span>It will require at least 80/100 and block <code>{legacyEndpoint}</code>.</span></div>
      <button className="guard-primary" onClick={onCreate}><ShieldCheck size={17} /> Create regression guard</button>
    </div> : <>
      <div className="guard-details">
        <div><small>Gate</small><strong>{guard.minimumScore}/100 minimum</strong></div>
        <div><small>Blocks</small><code>{guard.blockedTerms.join(', ')}</code></div>
        <div><small>Protects</small><span>{guard.expectedEndpoint}</span></div>
        <div><small>Source</small><span>{guard.sourceReportId}</span></div>
      </div>
      <div className="guard-actions">
        <button className="guard-primary" onClick={onCheckRecommended} disabled={running}><Play size={16} fill="currentColor" /> Test recommended pack</button>
        <button onClick={onCheckOriginal} disabled={running}><ShieldAlert size={16} /> Test original library</button>
        <button onClick={onDownload}><Download size={16} /> Download CI guard</button>
      </div>
      {check === null ? null : <div className={`guard-result ${check.status}`} role="status">
        {check.status === 'pass' ? <Check size={20} /> : <ShieldAlert size={20} />}
        <div><strong>{check.status === 'pass' ? 'Guard passed — the repaired pack is clear.' : 'Guard blocked this bundle before it could ship.'}</strong><span>{check.reasons.join(' ')}</span></div>
        <b>{check.score}/100</b>
      </div>}
    </>}
    <p className="guard-honesty">This demo runs a deterministic, task-specific guard. Before making it a production CI gate, pair it with representative live evaluations and human-calibrated success criteria.</p>
  </section>;
}
