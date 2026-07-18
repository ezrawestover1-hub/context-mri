import { Braces, FileCode2, FileText, Plus } from 'lucide-react';
import type { ContextEvidence, ContextItem } from '../types';

export function FileIcon({ name, size = 18 }: { name: string; size?: number }) {
  if (name.endsWith('.json')) return <Braces size={size} />;
  if (name.endsWith('.md')) return <FileText size={size} />;
  return <FileCode2 size={size} />;
}

type InventoryProps = {
  items: ContextItem[];
  evidence: ContextEvidence[];
  selected: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

export function Inventory({ items, evidence, selected, onSelect, onAdd }: InventoryProps) {
  const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0);
  const evidenceById = new Map(evidence.map(item => [item.contextId, item]));

  return <aside className="inventory panel">
    <div className="panel-heading inventory-heading">
      <div><span>CONTEXT INVENTORY</span><small>{items.length} items in library</small></div>
      <button className="text-action" onClick={onAdd}><Plus size={16} /> Add context</button>
    </div>

    <div className="context-list">
      {items.map(item => {
        const result = evidenceById.get(item.id);
        const status = result?.status ?? 'unmeasured';
        return <button
          key={item.id}
          className={`context-row ${selected === item.id ? 'selected' : ''} status-${status}`}
          onClick={() => onSelect(item.id)}
          aria-pressed={selected === item.id}
        >
          <span className="file-icon"><FileIcon name={item.name} /></span>
          <span className="file-copy"><code>{item.name}</code><small>{item.tokens.toLocaleString()} tokens</small></span>
          <span className={`status-tag ${status}`}>{status.toUpperCase()}</span>
        </button>;
      })}
    </div>

    <div className="inventory-total"><span>Total library tokens</span><strong>{totalTokens.toLocaleString()}</strong></div>
  </aside>;
}
