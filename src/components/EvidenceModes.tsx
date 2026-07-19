import { FileSearch, FlaskConical, Play, Radio } from 'lucide-react';

export type LiveRunnerStatus = {
  available: boolean;
  model: string;
  suiteRuns: number;
  reason: string;
};

type EvidenceModesProps = {
  running: boolean;
  liveStatus: LiveRunnerStatus | null;
  hasPublishedLiveEvidence: boolean;
  onFixture: () => void;
  onLive: () => void;
  onInspectContract: () => void;
  onOpenJudgeLab: () => void;
};

export function EvidenceModes({ running, liveStatus, hasPublishedLiveEvidence, onFixture, onLive, onInspectContract, onOpenJudgeLab }: EvidenceModesProps) {
  const liveAvailable = Boolean(liveStatus?.available);
  const liveNote = hasPublishedLiveEvidence
    ? 'A separate live artifact is published below. Inspect it before treating any result as general evidence.'
    : liveStatus?.available
      ? `This server can run ${liveStatus.suiteRuns} fresh ${liveStatus.model} traces. It never falls back to replay.`
      : liveStatus?.reason ?? 'Loading live-run availability…';

  return <section className="evidence-modes" aria-labelledby="evidence-modes-title">
    <div className="evidence-modes-heading">
      <div><h2 id="evidence-modes-title">The complete judge path is free.</h2><p>Replay demonstrates diagnosis, trace inspection, repair, pack verification, and the CI guard without an account or credit. Fresh API runs remain optional and are never faked.</p></div>
      <div className="evidence-mode-actions"><button className="inspect-contract" onClick={onInspectContract}><FileSearch size={16} /> Inspect evaluator</button><button className="inspect-contract" onClick={onOpenJudgeLab} disabled={!liveAvailable || running} title={liveAvailable ? 'Open the fresh-only local Judge Lab' : 'Judge Lab is available only when the local fresh runner is configured'}><Radio size={16} /> Judge Lab {liveAvailable ? '' : '(local)'}</button></div>
    </div>
    <div className="evidence-mode-grid">
      <article className="evidence-mode fixture-mode">
        <FlaskConical size={22} aria-hidden="true" />
        <div><small>Recommended · deterministic replay</small><h3>Run the full free product loop</h3><p>Rebuild the bundled experiment, inspect all 21 traces, verify the repaired pack, and prove the Context Guard blocks the original.</p></div>
        <button onClick={onFixture} disabled={running}><Play size={16} fill="currentColor" /> {running ? 'Running…' : 'Run complete replay'}</button>
      </article>
      <article className={`evidence-mode live-mode ${liveStatus?.available ? 'available' : 'unavailable'}`}>
        <Radio size={22} aria-hidden="true" />
        <div><small>Optional · local/funded runner</small><h3>Run a fresh model audit</h3><p>{liveNote}</p></div>
        <button onClick={onLive} disabled={running || !liveAvailable}><Play size={16} fill="currentColor" /> {running ? 'Running…' : liveAvailable ? 'Run fresh audit' : 'Local runner only'}</button>
      </article>
    </div>
  </section>;
}
