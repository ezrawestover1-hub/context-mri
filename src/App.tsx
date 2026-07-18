import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Download, Info, Play, Sparkles } from 'lucide-react';
import { contexts as initialContexts, seedReport } from './data';
import type { ContextItem, ExperimentReport, ExperimentRun } from './types';
import { BrandMark } from './components/BrandMark';
import { ContextPack } from './components/ContextPack';
import { DiagnosisBand, Explainer } from './components/Explainer';
import { Inspector } from './components/Inspector';
import { Inventory } from './components/Inventory';
import { Matrix } from './components/Matrix';
import { ProvenanceModal, RewriteModal, TraceModal } from './components/Modals';

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
  const [report, setReport] = useState<ExperimentReport>(seedReport);
  const [selected, setSelected] = useState('legacy');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('Ready to inspect');
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [trace, setTrace] = useState<ExperimentRun | null>(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(
    () => contexts.find(context => context.id === selected) ?? contexts[0],
    [contexts, selected],
  );
  const selectedEvidence = report.contextEvidence.find(item => item.contextId === selectedItem?.id);

  async function runMRI() {
    setRunning(true);
    setRecommendationApplied(false);
    const stages = ['Testing full context…', 'Removing one item at a time…', 'Repeating each condition…', 'Verifying recommended pack…'];
    let index = 0;
    setStage(stages[0]);
    const timer = window.setInterval(() => {
      index = Math.min(index + 1, stages.length - 1);
      setStage(stages[index]);
    }, 750);

    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexts }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Experiment suite failed');
      const nextReport = await response.json() as ExperimentReport;
      const mostHarmful = [...nextReport.contextEvidence].sort((a, b) => a.contribution - b.contribution)[0];
      setReport(nextReport);
      setSelected(mostHarmful?.contextId ?? contexts[0].id);
      setStage(nextReport.mode === 'live' ? 'Complete · fresh GPT-5.6 evidence' : 'Complete · fixture replay');
    } catch (error) {
      setStage(error instanceof Error ? `Run failed · ${error.message}` : 'Run failed');
    } finally {
      window.clearInterval(timer);
      setRunning(false);
    }
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

  function addContext(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const baseId = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 24) || `context-${contexts.length + 1}`;
      let id = baseId;
      let suffix = 2;
      while (contexts.some(context => context.id === id)) id = `${baseId}-${suffix++}`;
      setContexts(current => [...current, { id, name: file.name, tokens: Math.max(1, Math.ceil(content.length / 4)), content }]);
      setSelected(id);
      setRecommendationApplied(false);
      setStage('Context added · run MRI to measure it');
    };
    reader.readAsText(file);
  }

  function applyRewrite() {
    setContexts(current => current.map(context => context.id === selected
      ? {
          ...context,
          content: context.content
            .replaceAll('/v1/chat/completions', '/v1/responses')
            .replace(/\(archived\)/gi, '(current)')
            .replace(/archived/gi, 'current'),
        }
      : context));
    setRewriteOpen(false);
    setRecommendationApplied(false);
    setStage('Rewrite staged · run MRI to verify it');
  }

  function applyRecommendation() {
    setRecommendationApplied(true);
    setStage(`Recommended pack applied · ${report.optimizedTokens.toLocaleString()} tokens`);
  }

  return <main className="app-shell">
    <input
      ref={fileInput}
      className="hidden-input"
      type="file"
      accept=".md,.json,.txt,text/plain,application/json"
      onChange={event => {
        const file = event.target.files?.[0];
        if (file) addContext(file);
        event.target.value = '';
      }}
    />

    <header className="topbar">
      <div className="brand"><BrandMark /><strong>Context MRI</strong></div>
      <div className="project-select"><span>Support Agent · API migration</span><ChevronDown size={16} /></div>
      <div className="top-actions">
        <button className="export-action" onClick={exportEvidence}><Download size={16} /> Export evidence</button>
        <button className="run-action" onClick={runMRI} disabled={running}>{running ? <Sparkles size={17} /> : <Play size={17} fill="currentColor" />}{running ? stage : 'Run MRI'}</button>
      </div>
    </header>

    <Explainer />
    <DiagnosisBand report={report} />

    <div className="workspace">
      <Inventory items={contexts} evidence={report.contextEvidence} selected={selected} onSelect={setSelected} onAdd={() => fileInput.current?.click()} />
      <Matrix report={report} selectedContextId={selected} running={running} onOpenTrace={setTrace} />
      {selectedItem ? <Inspector
        item={selectedItem}
        evidence={selectedEvidence}
        report={report}
        recommendationApplied={recommendationApplied}
        onApplyRecommendation={applyRecommendation}
        onRestore={() => { setRecommendationApplied(false); setStage('Full context restored'); }}
        onRewrite={() => setRewriteOpen(true)}
      /> : null}
    </div>

    <ContextPack contexts={contexts} report={report} applied={recommendationApplied} onApply={applyRecommendation} onCopy={copyManifest} />

    <footer className="provenance-bar">
      <div><BrandMark /><span>{report.mode === 'live' ? 'Fresh GPT-5.6 run' : 'Fixture replay'} · inspectable evidence</span><Info size={14} /></div>
      {report.mode === 'fixture-replay' ? <button onClick={() => setProvenanceOpen(true)}>What is fixture replay?</button> : <span>Run IDs and prompt hashes captured</span>}
      <div className="evidence-complete"><CheckCircle2 size={14} /> {report.totalRuns} traces complete</div>
    </footer>

    <div className="status-line" role="status" aria-live="polite">{stage}</div>
    {trace ? <TraceModal run={trace} report={report} onClose={() => setTrace(null)} /> : null}
    {rewriteOpen && selectedItem ? <RewriteModal fileName={selectedItem.name} onClose={() => setRewriteOpen(false)} onApply={applyRewrite} /> : null}
    {provenanceOpen ? <ProvenanceModal report={report} onClose={() => setProvenanceOpen(false)} /> : null}
  </main>;
}
