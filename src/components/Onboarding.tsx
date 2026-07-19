import { ArrowDown, ArrowRight, Check, ExternalLink, FileCheck2, FileJson, FileText, GitPullRequest, Play, RefreshCw, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import type { ContextEvidence, ContextItem, EvaluationContractSummary, ExperimentReport } from '../types';

type HeroIntroProps = {
  running: boolean;
  stage: string;
  onRun: () => void;
  onAddContext: () => void;
  contexts: ContextItem[];
  report: ExperimentReport;
};

function contributionLabel(item: ContextEvidence) {
  const sign = item.contribution > 0 ? '+' : item.contribution < 0 ? '−' : '';
  return `${sign}${Math.abs(item.contribution)} pp`;
}

function ContextFileIcon({ name }: { name: string }) {
  return name.endsWith('.json') ? <FileJson size={15} /> : <FileText size={15} />;
}

export function HeroIntro({ running, stage, onRun, onAddContext, contexts, report }: HeroIntroProps) {
  const harmful = report.contextEvidence.find(item => item.status === 'harmful');
  const strongestHelpful = [...report.contextEvidence]
    .filter(item => item.contextId !== harmful?.contextId)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);
  const inputPreviewIds = new Set([...strongestHelpful.map(item => item.contextId), harmful?.contextId].filter(Boolean));
  const inputPreview = contexts.filter(item => inputPreviewIds.has(item.id));
  const scoreLift = report.optimizedScore - report.baselineScore;

  return <section className="hero-intro" aria-labelledby="hero-title">
    <div className="hero-copy">
      <h1 id="hero-title">Find the one file making your agent worse.</h1>
      <p>Most evals tell you an agent failed. Context MRI shows which context file changes the result for a stated task, verifies the repaired pack, and creates a CI guard so the regression cannot return.</p>
      <div className="hero-actions">
        <button className="hero-primary" onClick={onRun} disabled={running}>
          {running ? <Sparkles size={18} /> : <Play size={18} fill="currentColor" />}
          {running ? stage : 'Run the free 30-second demo'}
        </button>
        <button className="hero-secondary" onClick={onAddContext}><Upload size={17} /> Add my context files</button>
      </div>
      <p className="hero-note">Complete judge path · no account, API key, payment, or setup required.</p>
      <div className="judge-path" aria-label="Thirty-second judge path">
        <strong>Try this in 30 seconds</strong>
        <ol>
          <li><span>1</span><a href="#results">Run the free sample <small>See why removing one file reaches {report.optimizedScore}</small></a></li>
          <li><span>2</span><a href="#next-steps">Apply and verify the smaller pack <small>Confirm the repair with a new run</small></a></li>
          <li><span>3</span><a href="#context-guard">Create the guard <small>Block the same regression in CI</small></a></li>
        </ol>
      </div>
    </div>

    <div className="workflow-preview" aria-label="Context MRI input, experiment, and output">
      <WorkflowPanel title="Task + context files">
        <code className="workflow-task">{report.evaluationContract.task}</code>
        <div className="workflow-files">
          {inputPreview.map(item => <span className={item.id === harmful?.contextId ? 'harmful-file' : undefined} key={item.id}>
            <ContextFileIcon name={item.name} /> {item.name}
          </span>)}
        </div>
      </WorkflowPanel>
      <ArrowRight className="workflow-arrow" aria-hidden="true" />
      <WorkflowPanel title="Remove one at a time">
        {report.contextEvidence.map(item => <code key={item.contextId}>{item.name} <b className={item.contribution > 0 ? 'good' : item.contribution < 0 ? 'bad' : undefined}>{contributionLabel(item)}</b></code>)}
      </WorkflowPanel>
      <ArrowRight className="workflow-arrow" aria-hidden="true" />
      <WorkflowPanel title="Repair + regression guard">
        <strong>{harmful ? <>Remove <code>{harmful.name}</code></> : 'Keep the verified context pack'}</strong>
        <small>{harmful ? `The agent improves by ${scoreLift} points without it.` : 'No harmful context was detected for this task.'}</small>
        <div className="workflow-pack"><Check size={15} /> {report.optimizedScore}-point pack verified</div>
        <div className="workflow-guard"><ShieldCheck size={15} /> Original pack blocked in CI</div>
      </WorkflowPanel>
    </div>

    <a className="continue-cue" href="#judge-proof"><span>See the technical proof</span><ArrowDown size={17} /></a>
  </section>;
}

function WorkflowPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="workflow-panel"><h2>{title}</h2><div>{children}</div></div>;
}

const proofPoints = [
  { value: '21', label: 'inspectable trace records per free scenario' },
  { value: '3', label: 'separate task and rubric contracts' },
  { value: '44%', label: 'less context in the included Support repair' },
  { value: 'CI', label: 'original blocked; repaired pack passed' },
];

export function JudgeProof() {
  return <section className="judge-proof" id="judge-proof" aria-labelledby="judge-proof-title">
    <div className="judge-proof-copy">
      <span>WHY THIS IS DIFFERENT</span>
      <h2 id="judge-proof-title">A complete context-debugging loop—not another pass/fail score.</h2>
      <p>Tracing tools show what an agent did. Context MRI experimentally tests which supplied context changes the result, then verifies the repair.</p>
    </div>
    <dl>{proofPoints.map(point => <div key={point.value}>
      <dt>{point.value}</dt>
      <dd>{point.label}</dd>
    </div>)}</dl>
    <div className="proof-links" aria-label="Independent repository proof">
      <a href="https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml" target="_blank" rel="noreferrer">
        <GitPullRequest size={18} />
        <span><strong>Watch the public CI proof</strong><small>Original bundle blocked at 43 · repaired pack passed at 92</small></span>
        <ExternalLink size={15} />
      </a>
      <a href="https://github.com/ezrawestover1-hub/context-mri/blob/main/submission/SELF_AUDIT.md" target="_blank" rel="noreferrer">
        <FileCheck2 size={18} />
        <span><strong>Read the dogfooding audit</strong><small>Two real release-context inconsistencies found and repaired</small></span>
        <ExternalLink size={15} />
      </a>
      <a href="https://github.com/ezrawestover1-hub/context-mri/blob/main/submission/FRESH_CODEX_TASK_PROOF.md" target="_blank" rel="noreferrer">
        <GitPullRequest size={18} />
        <span><strong>Inspect five fresh Codex tasks</strong><small>5/5 install-and-orchestrate runs passed · sanitized metadata only</small></span>
        <ExternalLink size={15} />
      </a>
      <a href="https://github.com/ezrawestover1-hub/context-mri/blob/main/submission/ROBUSTNESS_BOUNDARY.md" target="_blank" rel="noreferrer">
        <FileCheck2 size={18} />
        <span><strong>See the robustness boundary</strong><small>Lexical check passed · semantic paraphrase is a disclosed negative control</small></span>
        <ExternalLink size={15} />
      </a>
    </div>
    <p className="engineering-proof">Independent evaluator · 5/5 fresh Codex tasks · lexical boundary tested · SHA-256 provenance · 35 automated tests · zero-secret CI</p>
  </section>;
}

export function BeforeRun({ contract }: { contract: EvaluationContractSummary }) {
  return <section className="before-run" id="before-run" aria-labelledby="before-run-title">
    <div className="section-heading">
      <h2 id="before-run-title">Before you run</h2>
      <p>The included experiment is already loaded. These are the three things every useful context test needs.</p>
    </div>
    <ol className="input-guide">
      <li><span>1</span><div><h3>Define the task</h3><p>“{contract.task}”</p></div></li>
      <li><span>2</span><div><h3>Add the context</h3><p>The <code>.md</code>, <code>.json</code>, or <code>.txt</code> files your agent reads before answering.</p></div></li>
      <li><span>3</span><div><h3>Know what success means</h3><p>The independent <code>{contract.id}</code> evaluator checks the returned {contract.answerLabel} and explanation against an inspectable rubric for source authority, instruction risk, conflict handling, and response validity.</p></div></li>
    </ol>
    <div className="loaded-note"><Check size={18} /><span><strong>Ready now:</strong> a completed sample result is shown below. Run the example to watch Context MRI rebuild it from the loaded task, five files, and scoring rubric.</span></div>
    <div className="upload-guidance">
      <strong>Using your own files?</strong>
      <span>Add up to seven <code>.md</code>, <code>.json</code>, or <code>.txt</code> files, each under 20,000 characters. They stay in this browser tab. The public replay measures them only against the selected bundled contract; it does not claim to invent a new evaluator for arbitrary tasks.</span>
    </div>
  </section>;
}

const resultDefinitions = [
  { status: 'required', title: 'Required', copy: 'Removing it makes the agent worse. Keep it.' },
  { status: 'useful', title: 'Useful', copy: 'It measurably helps the task. Keep it.' },
  { status: 'redundant', title: 'Redundant', copy: 'No measurable lift on this task. Optional.' },
  { status: 'harmful', title: 'Harmful here', copy: 'The agent improves without it for this task and evaluator. Remove or rewrite it, then retest.' },
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
  return <section className="next-steps" id="next-steps" aria-labelledby="next-steps-title">
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
