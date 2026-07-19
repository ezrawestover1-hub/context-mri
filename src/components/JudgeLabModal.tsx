import { FlaskConical, Radio, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { JudgeLabInput } from '../types';

type JudgeLabModalProps = {
  available: boolean;
  running: boolean;
  contextCount: number;
  onClose: () => void;
  onRun: (input: JudgeLabInput) => void;
};

const initialInput: JudgeLabInput = {
  task: '',
  expectedAnswer: '',
  disallowedInstruction: '',
  currentSourceLabel: 'current policy or source of truth',
  legacySourceLabel: 'older conflicting source',
};

export function JudgeLabModal({ available, running, contextCount, onClose, onRun }: JudgeLabModalProps) {
  const [input, setInput] = useState<JudgeLabInput>(initialInput);

  function update<Key extends keyof JudgeLabInput>(key: Key, value: JudgeLabInput[Key]) {
    setInput(current => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRun({
      task: input.task.trim(),
      expectedAnswer: input.expectedAnswer.trim(),
      disallowedInstruction: input.disallowedInstruction.trim(),
      currentSourceLabel: input.currentSourceLabel.trim(),
      legacySourceLabel: input.legacySourceLabel.trim(),
    });
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal judge-lab-modal" role="dialog" aria-modal="true" aria-label="Local Judge Lab" aria-describedby="judge-lab-description">
      <header><div><span>LOCAL JUDGE LAB</span><h2>Test a new task without faking a fixture.</h2></div><button onClick={onClose} aria-label="Close Judge Lab"><X size={19} /></button></header>
      <p className="modal-intro" id="judge-lab-description">Set the task and the exact success contract. Context MRI will send the {contextCount}-file library currently loaded in this browser through a fresh, local GPT-5.6 evaluation. It does not invent a result or send your files to this public host.</p>
      <form className="judge-lab-form" onSubmit={submit}>
        <label><span>Task</span><textarea required minLength={8} maxLength={2000} value={input.task} onChange={event => update('task', event.target.value)} placeholder="What must the agent decide or produce?" /></label>
        <div className="judge-lab-two-up">
          <label><span>Success answer</span><input required maxLength={360} value={input.expectedAnswer} onChange={event => update('expectedAnswer', event.target.value)} placeholder="The expected answer" /></label>
          <label><span>Conflicting instruction</span><input required maxLength={600} value={input.disallowedInstruction} onChange={event => update('disallowedInstruction', event.target.value)} placeholder="An answer or instruction that must be rejected" /></label>
        </div>
        <div className="judge-lab-two-up">
          <label><span>Authoritative source label</span><input required maxLength={160} value={input.currentSourceLabel} onChange={event => update('currentSourceLabel', event.target.value)} /></label>
          <label><span>Conflicting source label</span><input required maxLength={160} value={input.legacySourceLabel} onChange={event => update('legacySourceLabel', event.target.value)} /></label>
        </div>
        <div className={`judge-lab-live-note ${available ? 'ready' : ''}`}>
          {available ? <Radio size={18} /> : <FlaskConical size={18} />}
          <span><strong>{available ? 'A local API key is configured.' : 'Fresh live mode is unavailable on this host.'}</strong><small>{available ? 'The first request checks quota; this custom contract runs only against your local API project. No fixture fallback exists.' : 'The deployed public demo stores no API key. Clone or run this repository locally with funded API quota to enable the button.'}</small></span>
        </div>
        <footer><span>Expected suite: {contextCount >= 2 ? (contextCount + 2) * 3 : '—'} fresh traces · task-specific evaluator</span><button className="apply-rewrite" type="submit" disabled={!available || running}><Radio size={15} /> {running ? 'Running…' : 'Run live Judge Lab'}</button></footer>
      </form>
    </section>
  </div>;
}
