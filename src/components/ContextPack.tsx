import { Check, Clipboard, FilePlus2 } from 'lucide-react';
import type { ContextItem, ExperimentReport } from '../types';
import { FileIcon } from './Inventory';

type ContextPackProps = {
  contexts: ContextItem[];
  report: ExperimentReport;
  applied: boolean;
  onApply: () => void;
  onCopy: () => void;
};

export function ContextPack({ contexts, report, applied, onApply, onCopy }: ContextPackProps) {
  const recommended = new Set(report.recommendedContextIds);
  const items = contexts.filter(context => recommended.has(context.id));
  return <section className={`context-pack ${applied ? 'applied' : ''}`}>
    <div className="pack-title"><span>RECOMMENDED CONTEXT PACK</span><small>{applied ? 'Applied to the next run' : 'Measured keep list'}</small></div>
    <div className="pack-files">{items.map(item => <span key={item.id}><FileIcon name={item.name} size={16} /><code>{item.name}</code><Check size={13} /></span>)}</div>
    <div className="pack-summary"><small>Total tokens</small><strong>{report.optimizedTokens.toLocaleString()}</strong></div>
    {applied ? <button className="pack-applied" onClick={onCopy}><Check size={15} /> Pack applied</button> : <button className="apply-pack" onClick={onApply}><FilePlus2 size={15} /> Apply pack</button>}
    <button className="copy-pack" onClick={onCopy}><Clipboard size={15} /> Copy manifest</button>
  </section>;
}
