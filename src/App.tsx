import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, Info, Play, Sparkles } from 'lucide-react';
import { contexts as initialContexts, seedReport } from './data';
import { defaultDiagnosticProject, diagnosticProjects, findDiagnosticProject } from './projects';
import type { ContextItem, ExperimentReport, ExperimentRun } from './types';
import { BrandMark } from './components/BrandMark';
import { ContextPack } from './components/ContextPack';
import { DiagnosisBand } from './components/Explainer';
import { Inspector } from './components/Inspector';
import { Inventory } from './components/Inventory';
import { Matrix } from './components/Matrix';
import { ProvenanceModal, RewriteModal, TraceModal } from './components/Modals';
import { BeforeRun, HeroIntro, NextSteps, ResultGuide } from './components/Onboarding';

function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function App() {
  const [contexts, setContexts] = useState<ContextItem[]>(initialContexts);
  const [projectId, setProjectId] = useState(defaultDiagnosticProject.id);
  const [report, setReport] = useState<ExperimentReport>(seedReport);
  const [selected, setSelected] = useState('legacy');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('Ready to inspect');
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [appliedVerification, setAppliedVerification] = useState<ExperimentReport | null>(null);
  const [trace, setTrace] = useState<ExperimentRun | null>(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(
    () => contexts.find(context => context.id === selected) ?? contexts[0],
    [contexts, selected],
  );
  const selectedEvidence = report.contextEvidence.find(item => item.contextId === selectedItem?.id);

  async function runMRI(scrollToResults = false, runContexts = contexts, runProjectId = projectId) {
    setRunning(true);
    setRecommendationApplied(false);
    setAppliedVerification(null);
    const stages = ['Testing full context…', 'Removing one item at a time…', 'Repeating each condition…', 'Verifying recommended pack…'];
    let index = 0;
    setStage(stages[0]);
    const timer = window.setInterval(() => {
      index = Math.min(index + 1, stages.length - 1);
      setStage(stages[index]);
    }, 750);

    try {
      // The judge-facing workflow is always a deterministic replay. Fresh model
      // evidence is generated deliberately through the separate live runner,
      // never as a surprise side effect of a public-demo click.
      const response = await fetch('/api/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexts: runContexts, projectId: runProjectId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Experiment suite failed');
      const nextReport = await response.json() as ExperimentReport;
      const mostHarmful = [...nextReport.contextEvidence].sort((a, b) => a.contribution - b.contribution)[0];
      setReport(nextReport);
      setSelected(mostHarmful?.contextId ?? runContexts[0].id);
      setStage(nextReport.mode === 'live' ? 'Complete · fresh GPT-5.6 evidence' : 'Complete · fixture replay');
      if (scrollToResults) window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (error) {
      setStage(error instanceof Error ? `Run failed · ${error.message}` : 'Run failed');
    } finally {
      window.clearInterval(timer);
      setRunning(false);
    }
  }

  function switchProject(nextProjectId: string) {
    const project = findDiagnosticProject(nextProjectId);
    if (!project || project.id === projectId) return;
    setProjectId(project.id);
    setContexts(project.contexts);
    setSelected('legacy');
    setRecommendationApplied(false);
    setAppliedVerification(null);
    setStage(`Loading ${project.shortLabel} contract…`);
    void runMRI(false, project.contexts, project.id);
  }

  function exportEvidence() {
    downloadJson(`context-mri-${report.id}.json`, {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      decision: {
        recommendationApplied,
        activeContextIds: recommendationApplied ? report.recommendedContextIds : contexts.map(context => context.id),
      },
      inputContexts: contexts,
      report,
      appliedVerification,
    });
    setStage('Complete evidence ledger exported');
  }

  async function copyManifest() {
    const recommended = new Set(report.recommendedContextIds);
    const text = contexts.filter(context => recommended.has(context.id)).map(context => context.name).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setStage('Recommended manifest copied');
  }

  async function addContexts(files: File[]) {
    const availableSlots = Math.max(0, 12 - contexts.length);
    const selectedFiles = files.slice(0, availableSlots);
    if (!selectedFiles.length) {
      setStage('Context library full · this experiment supports up to 12 files');
      return;
    }

    const acceptedExtensions = /\.(md|json|txt)$/i;
    const loaded = await Promise.all(selectedFiles.map(async file => ({ file, content: await file.text() })));
    const valid = loaded.filter(({ file, content }) => acceptedExtensions.test(file.name) && content.length <= 20_000);
    if (!valid.length) {
      setStage('No files added · use .md, .json, or .txt files under 20,000 characters');
      return;
    }

    const usedIds = new Set(contexts.map(context => context.id));
    const additions = valid.map(({ file, content }, index) => {
      const baseId = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 24) || `context-${contexts.length + index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);
      return { id, name: file.name, tokens: Math.max(1, Math.ceil(content.length / 4)), content };
    });

    setContexts(current => [...current, ...additions]);
    setSelected(additions[additions.length - 1].id);
    setRecommendationApplied(false);
    setAppliedVerification(null);
    const skipped = selectedFiles.length - valid.length + Math.max(0, files.length - selectedFiles.length);
    setStage(`${additions.length} context file${additions.length === 1 ? '' : 's'} added${skipped ? ` · ${skipped} skipped` : ''} · run MRI to measure`);
  }

  function applyRewrite() {
    const legacyEndpoint = report.evaluationContract.legacyEndpoints[0];
    const currentEndpoint = report.evaluationContract.expectedEndpoint;
    setContexts(current => current.map(context => context.id === selected
      ? {
          ...context,
          content: context.content
            .replaceAll(legacyEndpoint, currentEndpoint)
            .replace(/\(archived\)/gi, '(current)')
            .replace(/archived/gi, 'current'),
        }
      : context));
    setRewriteOpen(false);
    setRecommendationApplied(false);
    setAppliedVerification(null);
    setStage('Rewrite staged · run MRI to verify it');
  }

  function applyRecommendation() {
    setRecommendationApplied(true);
    setAppliedVerification(null);
    setStage(`Recommended pack staged · ${report.optimizedTokens.toLocaleString()} tokens · rerun to verify`);
  }

  function restoreFullContext() {
    setRecommendationApplied(false);
    setAppliedVerification(null);
    setStage('Full context restored');
  }

  async function verifyRecommendedPack() {
    const recommended = new Set(report.recommendedContextIds);
    const packContexts = contexts.filter(context => recommended.has(context.id));
    if (packContexts.length < 2) {
      setStage('Verification requires at least two files in the recommended pack');
      return;
    }

    setRunning(true);
    setStage('Rerunning with only the applied pack…');
    try {
      const response = await fetch('/api/fixture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexts: packContexts, projectId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Applied-pack verification failed');
      const verification = await response.json() as ExperimentReport;
      setAppliedVerification(verification);
      setStage(`Applied pack verified as the tested baseline · ${verification.baselineScore}/100 · ${packContexts.length} files`);
    } catch (error) {
      setStage(error instanceof Error ? `Verification failed · ${error.message}` : 'Verification failed');
    } finally {
      setRunning(false);
    }
  }

  function openHarmfulRewrite() {
    const harmful = report.contextEvidence.find(item => item.status === 'harmful');
    if (harmful) setSelected(harmful.contextId);
    setRewriteOpen(true);
  }

  return <main className="app-shell">
    <input
      ref={fileInput}
      className="hidden-input"
      type="file"
      multiple
      tabIndex={-1}
      aria-hidden="true"
      accept=".md,.json,.txt,text/plain,application/json"
      onChange={event => {
        const files = Array.from(event.target.files ?? []);
        if (files.length) void addContexts(files);
        event.target.value = '';
      }}
    />

    <header className="topbar">
      <div className="brand"><BrandMark /><strong>Context MRI</strong></div>
      <label className="project-select"><small>Project:</small><select value={projectId} onChange={event => switchProject(event.target.value)} disabled={running} aria-label="Diagnostic project">
        {diagnosticProjects.map(project => <option key={project.id} value={project.id}>{project.label}</option>)}
      </select></label>
      <div className="top-actions">
        <a className="how-link" href="#before-run">How it works</a>
        <button className="export-action" onClick={exportEvidence}><Download size={16} /> Export evidence</button>
        <button className="run-action" onClick={() => runMRI(true)} disabled={running}>{running ? <Sparkles size={17} /> : <Play size={17} fill="currentColor" />}{running ? stage : 'Run guided demo'}</button>
      </div>
    </header>

    <HeroIntro running={running} stage={stage} onRun={() => runMRI(true)} onAddContext={() => fileInput.current?.click()} task={report.evaluationContract.task} />
    <BeforeRun contract={report.evaluationContract} />

    <div className="results-anchor" ref={resultsRef}>
      <DiagnosisBand report={report} />
      <ResultGuide />
    </div>

    <div className="workspace">
      <Inventory items={contexts} evidence={report.contextEvidence} selected={selected} onSelect={setSelected} onAdd={() => fileInput.current?.click()} />
      <Matrix report={report} selectedContextId={selected} running={running} onOpenTrace={setTrace} />
      {selectedItem ? <Inspector
        item={selectedItem}
        evidence={selectedEvidence}
        report={report}
        recommendationApplied={recommendationApplied}
        onApplyRecommendation={applyRecommendation}
        onRestore={restoreFullContext}
        onRewrite={() => setRewriteOpen(true)}
      /> : null}
    </div>

    <NextSteps
      report={report}
      running={running}
      recommendationApplied={recommendationApplied}
      appliedVerification={appliedVerification}
      onApply={applyRecommendation}
      onRewrite={openHarmfulRewrite}
      onRun={verifyRecommendedPack}
      onRestore={restoreFullContext}
    />

    <ContextPack contexts={contexts} report={report} applied={recommendationApplied} verification={appliedVerification} onApply={applyRecommendation} onCopy={copyManifest} />

    <footer className="provenance-bar">
      <div><BrandMark /><span>{report.mode === 'live' ? 'Fresh GPT-5.6 run' : 'Fixture replay'} · inspectable evidence</span><Info size={14} /></div>
      {report.mode === 'fixture-replay' ? <button onClick={() => setProvenanceOpen(true)}>What is fixture replay?</button> : <span>Run IDs and prompt hashes captured</span>}
      <div className="evidence-complete"><CheckCircle2 size={14} /> {report.totalRuns} traces complete</div>
    </footer>

    <div className="status-line" role="status" aria-live="polite">{stage}</div>
    {trace ? <TraceModal run={trace} report={report} onClose={() => setTrace(null)} /> : null}
    {rewriteOpen && selectedItem ? <RewriteModal fileName={selectedItem.name} legacyEndpoint={report.evaluationContract.legacyEndpoints[0]} currentEndpoint={report.evaluationContract.expectedEndpoint} currentSourceLabel={report.evaluationContract.currentSourceLabel} onClose={() => setRewriteOpen(false)} onApply={applyRewrite} /> : null}
    {provenanceOpen ? <ProvenanceModal report={report} onClose={() => setProvenanceOpen(false)} /> : null}
  </main>;
}
