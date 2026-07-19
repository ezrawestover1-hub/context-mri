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
      <div><span>ABLATION MATRIX</span><small>Each column removes one file. Select any score to inspect the exact trace.</small></div>
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
    {report.interaction ? <InteractionPanel report={report} onOpenTrace={onOpenTrace} /> : null}
    <div className="pack-proof">
      <span>PACK VERIFICATION</span>
      <strong>{report.packVerification.mean}/100</strong>
      <small>{report.packVerification.runs.map(run => run.score).join(' · ')} across {report.repeats} {report.mode === 'live' ? 'fresh GPT-5.6 checks' : 'fixture checks'}</small>
    </div>
  </section>;
}

function InteractionPanel({ report, onOpenTrace }: Pick<MatrixProps, 'report' | 'onOpenTrace'>) {
  const interaction = report.interaction!;
  const overlapWord = interaction.overlap > 0 ? 'overlap' : interaction.overlap < 0 ? 'amplify each other' : 'add independently';
  return <section className="interaction-panel" aria-label="Pairwise interaction check">
    <div className="interaction-heading"><span>PRE-REGISTERED PAIR CHECK</span><strong>{interaction.label}</strong><small>{interaction.question}</small></div>
    <div className="interaction-metrics">
      <div><small>Individual losses</small><strong>{interaction.individualLosses[0]} + {interaction.individualLosses[1]} pp</strong></div>
      <div><small>Joint loss</small><strong>{interaction.combinedLoss} pp</strong></div>
      <div><small>Interaction</small><strong>{Math.abs(interaction.overlap)} pp {overlapWord}</strong></div>
    </div>
    <p>The joint-removal result is compared with the sum of the two leave-one-out drops. This measures this registered pair only; it does not prove every file interaction.</p>
    <div className="interaction-traces"><span>TRACE SCORES</span>{interaction.runs.map(run => <button key={run.id} className={`score-cell ${run.passed ? 'pass' : 'fail'}`} onClick={() => onOpenTrace(run)} aria-label={`Open ${interaction.label} run ${run.repeat} trace, score ${run.score}`}>{run.score}</button>)}</div>
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
