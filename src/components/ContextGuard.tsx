import { Check, Download, Play, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { ContextGuard as ContextGuardType, ContextGuardCheck } from '../types';

type LiveEvidenceSummary = {
  generatedAt: string;
  report: { model: string; totalRuns: number; baselineScore: number; optimizedScore: number };
  reportFingerprint: string;
};

type ContextGuardProps = {
  guard: ContextGuardType | null;
  check: ContextGuardCheck | null;
  running: boolean;
  answerLabel: string;
  disallowedTerm: string;
  onCreate: () => void;
  onCheckRecommended: () => void;
  onCheckOriginal: () => void;
  onDownload: () => void;
  liveEvidence: LiveEvidenceSummary | null;
};

export function ContextGuard({ guard, check, running, answerLabel, disallowedTerm, onCreate, onCheckRecommended, onCheckOriginal, onDownload, liveEvidence }: ContextGuardProps) {
  return <section className="context-guard" id="context-guard" aria-labelledby="context-guard-title">
    <div className="guard-heading">
      <div className="guard-kicker"><ShieldCheck size={15} /> Regression handoff</div>
      <h2 id="context-guard-title">Find it once. Keep it out.</h2>
      <p>Turn this result into a portable, task-specific guard. It blocks the stale instruction Context MRI found and catches a score drop before the same context bundle reaches your agent.</p>
    </div>

    {guard === null ? <div className="guard-empty">
      <div><strong>Create a Context Guard from this report</strong><span>It will require at least 80/100 and block <code>{disallowedTerm}</code>.</span></div>
      <button className="guard-primary" onClick={onCreate}><ShieldCheck size={17} /> Create regression guard</button>
    </div> : <>
      <div className="guard-details">
        <div><small>Gate</small><strong>{guard.minimumScore}/100 minimum</strong></div>
        <div><small>Blocks</small><code>{guard.blockedTerms.join(', ')}</code></div>
        <div><small>Protects</small><span>{answerLabel}: {guard.expectedAnswer}</span></div>
        <div><small>Source</small><span>{guard.sourceReportId}</span></div>
        <div><small>Integrity</small><span>SHA-256 contract + pack</span></div>
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
        <small className="guard-integrity">Integrity: {check.integrity.contract && check.integrity.artifact && check.integrity.recommendedPack ? 'verified' : 'mismatch detected'}</small>
      </div>}
    </>}
    {liveEvidence ? <aside className="live-evidence" aria-label="Published live GPT-5.6 evidence">
      <div><ShieldCheck size={17} /><span><strong>Published live GPT-5.6 evidence</strong><small>{liveEvidence.report.totalRuns} traces · {liveEvidence.report.baselineScore}→{liveEvidence.report.optimizedScore}/100 · generated {new Date(liveEvidence.generatedAt).toLocaleDateString()}</small></span></div>
      <a href="/evidence/live-gpt-5.6.json" target="_blank" rel="noreferrer">Inspect raw artifact</a>
    </aside> : null}
    <p className="guard-honesty">This demo runs a deterministic, task-specific guard. Before making it a production CI gate, pair it with representative live evaluations and human-calibrated success criteria.</p>
  </section>;
}
