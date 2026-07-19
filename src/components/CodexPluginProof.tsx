import { useState } from 'react';
import { Check, Copy, ExternalLink, ScanSearch, ShieldCheck, Terminal, Wrench } from 'lucide-react';

const starterPrompt = 'Use Context MRI to run the bundled Security Release diagnostic. Explain the evidence, propose the smallest safe repair, verify that the original pack remains blocked, and verify that the recommended pack passes.';

const workflow = [
  {
    icon: ScanSearch,
    number: '01',
    title: 'Diagnose in the conversation',
    body: 'Codex sends only the task and context you choose. Context MRI measures each file and returns the finding, evidence, scope, and limits.',
  },
  {
    icon: Wrench,
    number: '02',
    title: 'Repair with normal approval',
    body: 'Codex proposes the smallest evidence-backed change. The plugin is read-only, so it cannot silently edit a repository or your instructions.',
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'Verify before you trust it',
    body: 'Context MRI reruns the guard: the repaired pack must pass while the original remains blocked. Before and after stay visibly separate.',
  },
];

export function CodexPluginProof() {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(starterPrompt);
    } catch {
      const area = document.createElement('textarea');
      area.value = starterPrompt;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <section className="codex-plugin-proof" id="codex-plugin" aria-labelledby="codex-plugin-title">
    <div className="plugin-proof-heading">
      <div>
        <span className="plugin-kicker"><Terminal size={15} /> CONTEXT MRI FOR CODEX · FREE LOCAL BETA</span>
        <h2 id="codex-plugin-title">Find the bad context without leaving the coding workflow.</h2>
      </div>
      <p>Ask Codex why an agent failed. The Context MRI plugin diagnoses the supplied pack, Codex proposes a minimal repair, and the same guard verifies the result—inside one conversation.</p>
    </div>

    <div className="plugin-proof-grid">
      <ol className="plugin-workflow" aria-label="Codex plugin workflow">
        {workflow.map(step => {
          const Icon = step.icon;
          return <li key={step.number}>
            <div className="plugin-step-icon"><Icon size={18} /><small>{step.number}</small></div>
            <div><strong>{step.title}</strong><p>{step.body}</p></div>
          </li>;
        })}
      </ol>

      <div className="plugin-transcript" aria-label="Verified Codex plugin example">
        <div className="plugin-terminal-bar"><span /><span /><span /><strong>VERIFIED FRESH CODEX TASK</strong></div>
        <div className="plugin-terminal-body">
          <p><b>YOU</b><span>Why did my release agent choose an unsafe credential procedure?</span></p>
          <p><b>CODEX</b><span>Running Context MRI on the Security Release example…</span></p>
          <div className="plugin-call"><small>CONTEXT MRI · DIAGNOSIS</small><strong><em>emergency-release-runbook.md</em> has the largest observed negative single-file effect for this task.</strong><span>Baseline <b>53</b> <i>→</i> recommended pack <b>100</b> · 3 representative traces</span></div>
          <p><b>CODEX</b><span>I can remove or rewrite that instruction after your approval.</span></p>
          <div className="plugin-verification"><span><Check size={14} /> REPAIRED PACK PASSED · 100/100</span><span>ORIGINAL BLOCKED · 53/100</span></div>
        </div>
      </div>
    </div>

    <div className="plugin-proof-footer">
      <dl>
        <div><dt>3</dt><dd>read-only tools</dd></div>
        <div><dt>0</dt><dd>network requests</dd></div>
        <div><dt>0</dt><dd>retained files</dd></div>
        <div><dt>1</dt><dd>diagnose → repair → verify loop</dd></div>
      </dl>
      <div className="plugin-actions">
        <button type="button" onClick={() => void copyPrompt()} aria-live="polite">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Prompt copied' : 'Copy judge prompt'}</button>
        <a href="https://github.com/ezrawestover1-hub/context-mri/tree/main/plugins/context-mri" target="_blank" rel="noreferrer">Inspect plugin source <ExternalLink size={14} /></a>
      </div>
      <p className="plugin-privacy-note"><ShieldCheck size={14} /> Local stdio process · no account, API key, billing, repository crawl, or chat-history access. Only explicitly supplied context is analyzed. These are plugin boundaries; Codex follows its own configured service settings. The bundled result is controlled, task-specific ablation evidence, not a universal claim.</p>
    </div>
  </section>;
}
