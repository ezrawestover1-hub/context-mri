import { ArrowDown, ArrowRight, Check, FileJson, FileText, Play, RefreshCw, Sparkles, Upload } from 'lucide-react';
import type { ExperimentReport } from '../types';

type HeroIntroProps = {
  running: boolean;
  stage: string;
  onRun: () => void;
  onAddContext: () => void;
};

export function HeroIntro({ running, stage, onRun, onAddContext }: HeroIntroProps) {
  return <section className="hero-intro" aria-labelledby="hero-title">
    <div className="hero-copy">
      <h1 id="hero-title">Find the one file making your agent worse.</h1>
      <p>Give Context MRI the task your agent must complete and the files it reads. It tests each file, shows what helps or hurts, and builds a smaller context pack you can verify.</p>
      <div className="hero-actions">
        <button className="hero-primary" onClick={onRun} disabled={running}>
          {running ? <Sparkles size={18} /> : <Play size={18} fill="currentColor" />}
          {running ? stage : 'Run the included example'}
        </button>
        <button className="hero-secondary" onClick={onAddContext}><Upload size={17} /> Add my context files</button>
      </div>
      <p className="hero-note">No account, API key, or setup required for the included example.</p>
    </div>

    <div className="workflow-preview" aria-label="Context MRI input, experiment, and output">
      <WorkflowPanel title="Task + context files">
        <code className="workflow-task">Answer a support question<br />using the current API</code>
        <div className="workflow-files">
          <span><FileText size={15} /> system-prompt.md</span>
          <span><FileJson size={15} /> tool-schema.json</span>
          <span className="harmful-file"><FileText size={15} /> legacy-api.md</span>
        </div>
      </WorkflowPanel>
      <ArrowRight className="workflow-arrow" aria-hidden="true" />
      <WorkflowPanel title="Remove one at a time">
        <code>system-prompt.md <b className="good">+35 pp</b></code>
        <code>tool-schema.json <b className="good">+31 pp</b></code>
        <code>legacy-api.md <b className="bad">−49 pp</b></code>
        <code>examples.md <b>0 pp</b></code>
      </WorkflowPanel>
      <ArrowRight className="workflow-arrow" aria-hidden="true" />
      <WorkflowPanel title="Evidence-backed plan">
        <strong>Remove <code>legacy-api.md</code></strong>
        <small>The agent improves by 49 points without it.</small>
        <div className="workflow-pack"><Check size={15} /> Smaller verified pack</div>
      </WorkflowPanel>
    </div>

    <a className="continue-cue" href="#before-run"><span>See what goes in</span><ArrowDown size={17} /></a>
  </section>;
}

function WorkflowPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="workflow-panel"><h2>{title}</h2><div>{children}</div></div>;
}

export function BeforeRun() {
  return <section className="before-run" id="before-run" aria-labelledby="before-run-title">
    <div className="section-heading">
      <h2 id="before-run-title">Before you run</h2>
      <p>The included experiment is already loaded. These are the three things every useful context test needs.</p>
    </div>
    <ol className="input-guide">
      <li><span>1</span><div><h3>Define the task</h3><p>“Which API endpoint should a support agent recommend when the sources conflict?”</p></div></li>
      <li><span>2</span><div><h3>Add the context</h3><p>The <code>.md</code>, <code>.json</code>, or <code>.txt</code> files your agent reads before answering.</p></div></li>
      <li><span>3</span><div><h3>Know what success means</h3><p>The independent evaluator checks the returned endpoint and explanation for source recency, legacy risk, conflict handling, and schema validity.</p></div></li>
    </ol>
    <div className="loaded-note"><Check size={18} /><span><strong>Ready now:</strong> a completed sample result is shown below. Run the example to watch Context MRI rebuild it from the loaded task, five files, and scoring rubric.</span></div>
    <div className="upload-guidance">
      <strong>Using your own files?</strong>
      <span>Add up to seven <code>.md</code>, <code>.json</code>, or <code>.txt</code> files, each under 20,000 characters. They stay in this browser tab. The public demo measures them against the included support task so every comparison uses the same success criteria.</span>
    </div>
  </section>;
}

const resultDefinitions = [
  { status: 'required', title: 'Required', copy: 'Removing it makes the agent worse. Keep it.' },
  { status: 'useful', title: 'Useful', copy: 'It measurably helps the task. Keep it.' },
  { status: 'redundant', title: 'Redundant', copy: 'No measurable lift on this task. Optional.' },
  { status: 'harmful', title: 'Harmful', copy: 'The agent improves without it. Remove or rewrite it.' },
];

export function ResultGuide() {
  return <section className="result-guide" aria-labelledby="result-guide-title">
    <div className="section-heading compact"><h2 id="result-guide-title">How to read the result</h2><p>Each label comes from the measured score change—not from the filename.</p></div>
    <div className="result-definitions">{resultDefinitions.map(item => <div className={`result-definition ${item.status}`} key={item.status}>
      <strong>{item.title}</strong><span>{item.copy}</span>
    </div>)}</div>
  </section>;
}

type NextStepsProps = {
  report: ExperimentReport;
  running: boolean;
  recommendationApplied: boolean;
  appliedVerification: ExperimentReport | null;
  onApply: () => void;
  onRewrite: () => void;
  onRun: () => void;
  onRestore: () => void;
};

export function NextSteps({ report, running, recommendationApplied, appliedVerification, onApply, onRewrite, onRun, onRestore }: NextStepsProps) {
  const harmfulFile = report.diagnosis.harmfulItem || 'the harmful file';
  const verified = Boolean(appliedVerification);
  return <section className="next-steps" aria-labelledby="next-steps-title">
    <div className="next-step-heading"><h2 id="next-steps-title">What to do next</h2><p>The result is useful only if it changes your context—and the change survives another test.</p></div>
    <ol>
      <li><span>1</span><p>Remove or rewrite <code>{harmfulFile}</code>.</p></li>
      <li><span>2</span><p>Apply the <strong>{report.optimizedTokens.toLocaleString()}-token</strong> recommended pack.</p></li>
      <li><span>3</span><p>Run Context MRI again. Trust the change only if the score recovers.</p></li>
    </ol>
    <div className="next-step-actions">
      <button className="next-primary" onClick={onApply} disabled={recommendationApplied}><Check size={17} /> {recommendationApplied ? 'Recommended pack staged' : 'Apply recommended pack'}</button>
      {report.diagnosis.harmfulItem ? <button onClick={onRewrite}><Sparkles size={17} /> Preview safe rewrite</button> : null}
      <button onClick={onRun} disabled={running || !recommendationApplied}><RefreshCw size={17} /> {running ? stageLabel(report.mode) : verified ? 'Verify applied pack again' : recommendationApplied ? 'Run applied pack to verify' : 'Apply pack before verification'}</button>
      {recommendationApplied ? <button onClick={onRestore}>Restore full context</button> : null}
    </div>
    {appliedVerification ? <div className="verification-proof" role="status">
      <Check size={18} />
      <div><strong>Applied pack verified as the new baseline: {appliedVerification.baselineScore}/100</strong><span>{appliedVerification.variants[0].runs.length} independent rerun traces · {appliedVerification.mode === 'live' ? 'fresh GPT-5.6 evidence' : 'clearly labeled fixture replay'} · report {appliedVerification.id}</span></div>
    </div> : null}
    <p className="fixture-honesty">{report.mode === 'fixture-replay' ? 'This public demo is a deterministic fixture replay. Fresh claims require live GPT-5.6 traces.' : 'This result comes from fresh GPT-5.6 traces. Run IDs and prompt hashes are available in every score.'}</p>
  </section>;
}

function stageLabel(mode: ExperimentReport['mode']) {
  return mode === 'live' ? 'Testing the applied pack live…' : 'Replaying the applied pack…';
}
