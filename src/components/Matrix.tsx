import { Search } from 'lucide-react';
import type { ContextEvidence, ExperimentReport, ExperimentRun } from '../types';

type MatrixProps = {
  report: ExperimentReport;
  selectedContextId: string;
  running: boolean;
  onOpenTrace: (run: ExperimentRun) => void;
};

export function Matrix({ report, selectedContextId, running, onOpenTrace }: MatrixProps) {
  const selectedVariant = report.variants.find(variant => variant.omittedContextId === selectedContextId) ?? report.variants[0];
  const firstTrace = selectedVariant.runs[0] ?? report.variants[0]?.runs[0];

  return <section className="analysis panel">
    <div className="panel-heading analysis-heading">
      <div><span>HOW WE KNOW</span><small>Each column removes exactly one file. Green means the agent passed.</small></div>
      <button className="inspect-score" onClick={() => firstTrace && onOpenTrace(firstTrace)} disabled={!firstTrace}>
        <Search size={15} /> Inspect any score
      </button>
    </div>

    <div className="matrix-scroll">
      <div className={`matrix ${running ? 'running' : ''}`} style={{ gridTemplateColumns: `76px repeat(${report.variants.length}, minmax(74px, 1fr))` }}>
        <div className="matrix-corner">RUN</div>
        {report.variants.map(variant => <div key={variant.id} className={`matrix-header ${variant.id === selectedVariant.id ? 'selected-col' : ''}`}>
          <span>{variant.label}</span>
          <small>{variant.omittedContextId ? `(${variant.omittedContextId})` : '(full context)'}</small>
        </div>)}

        {Array.from({ length: report.repeats }, (_, runIndex) => <div className="matrix-row" key={runIndex}>
          <div className="run-label">Run {runIndex + 1}</div>
          {report.variants.map((variant, variantIndex) => {
            const run = variant.runs[runIndex];
            return <div className={`matrix-cell ${variant.id === selectedVariant.id ? 'selected-col' : ''}`} key={variant.id}>
              <button
                className={`score-cell ${run.passed ? 'pass' : 'fail'}`}
                onClick={() => onOpenTrace(run)}
                aria-label={`Open ${variant.label} run ${runIndex + 1} trace, score ${run.score}`}
                title={`Score ${run.score} · open trace`}
                style={{ animationDelay: `${(runIndex * report.variants.length + variantIndex) * 45}ms` }}
              >{run.score}</button>
            </div>;
          })}
        </div>)}

        <div className="matrix-row mean-row">
          <div className="run-label"><span>MEAN</span><small>pass score</small></div>
          {report.variants.map(variant => <div className={`matrix-cell mean ${variant.id === selectedVariant.id ? 'selected-col' : ''}`} key={variant.id}>
            <strong className={variant.mean >= report.provenance.passThreshold ? 'good' : 'bad'}>{variant.mean}</strong>
          </div>)}
        </div>
      </div>
    </div>

    <Contribution evidence={report.contextEvidence} />
    <div className="pack-proof">
      <span>PACK VERIFICATION</span>
      <strong>{report.packVerification.mean}/100</strong>
      <small>{report.packVerification.runs.map(run => run.score).join(' · ')} across {report.repeats} fresh checks</small>
    </div>
  </section>;
}

function Contribution({ evidence }: { evidence: ContextEvidence[] }) {
  const maximum = Math.max(55, ...evidence.map(item => Math.abs(item.contribution)));
  return <div className="contribution">
    <div className="plot-title"><span>CONTRIBUTION</span><small>Change in pass score when each file is removed</small></div>
    <div className="bars">{evidence.map(item => {
      const value = item.contribution;
      const width = Math.abs(value) / maximum * 46;
      return <div className="bar-row" key={item.contextId}>
        <code>{item.name}</code>
        <div className="bar-space">
          <i className="zero" />
          <span className={value < 0 ? 'negative' : value === 0 ? 'neutral' : 'positive'} style={value < 0 ? { width: `${width}%`, right: '50%' } : { width: `${Math.max(width, value === 0 ? .5 : 0)}%`, left: '50%' }} />
          <em className={value < 0 ? 'left-value' : 'right-value'} style={value < 0 ? { right: `${51 + width}%` } : { left: `${51 + width}%` }}>{value > 0 ? '+' : ''}{value} pp</em>
        </div>
      </div>;
    })}</div>
    <div className="axis"><span>hurts the task</span><span>0</span><span>helps the task</span></div>
  </div>;
}
