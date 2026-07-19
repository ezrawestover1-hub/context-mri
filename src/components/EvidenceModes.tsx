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
};

export function EvidenceModes({ running, liveStatus, hasPublishedLiveEvidence, onFixture, onLive, onInspectContract }: EvidenceModesProps) {
  const liveNote = hasPublishedLiveEvidence
    ? 'A separate live artifact is published below. Inspect it before treating any result as general evidence.'
    : liveStatus?.available
      ? `This server can run ${liveStatus.suiteRuns} fresh ${liveStatus.model} traces. It never falls back to replay.`
      : liveStatus?.reason ?? 'Loading live-run availability…';

  return <section className="evidence-modes" aria-labelledby="evidence-modes-title">
    <div className="evidence-modes-heading">
      <div><h2 id="evidence-modes-title">Choose the evidence you are looking at.</h2><p>Replay is useful for inspecting the product. A live audit is the only path that can support a fresh model claim.</p></div>
      <button className="inspect-contract" onClick={onInspectContract}><FileSearch size={16} /> Inspect evaluator</button>
    </div>
    <div className="evidence-mode-grid">
      <article className="evidence-mode fixture-mode">
        <FlaskConical size={22} aria-hidden="true" />
        <div><small>Deterministic fixture replay</small><h3>Explore the no-key judge path</h3><p>Rebuild the bundled experiment, traces, pack, and guard without calling a model or spending a credit.</p></div>
        <button onClick={onFixture} disabled={running}><Play size={16} fill="currentColor" /> {running ? 'Running…' : 'Explore replay'}</button>
      </article>
      <article className={`evidence-mode live-mode ${liveStatus?.available ? 'available' : 'unavailable'}`}>
        <Radio size={22} aria-hidden="true" />
        <div><small>Fresh live evaluation</small><h3>Run a new model audit</h3><p>{liveNote}</p></div>
        <button onClick={onLive} disabled={running}><Play size={16} fill="currentColor" /> {running ? 'Running…' : 'Run fresh audit'}</button>
      </article>
    </div>
  </section>;
}
