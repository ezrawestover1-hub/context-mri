import type { ExperimentReport } from '../types';

const steps = [
  { number: 1, title: 'Run the agent', copy: 'Establish a baseline with every file in context.' },
  { number: 2, title: 'Remove one file at a time', copy: 'Repeat the task and measure what changes.' },
  { number: 3, title: 'Keep only what helps', copy: 'Build a smaller pack from measured evidence.' },
];

export function Explainer() {
  return <section className="explainer">
    <h1 className="sr-only">Find the context that is quietly breaking your agent</h1>
    <ol className="method-steps">{steps.map((step, index) => <li key={step.number}>
      <span>{step.number}</span><div><strong>{step.title}</strong><small>{step.copy}</small></div>{index < steps.length - 1 ? <i /> : null}
    </li>)}</ol>
  </section>;
}

export function DiagnosisBand({ report }: { report: ExperimentReport }) {
  const improvement = report.optimizedScore - report.baselineScore;
  const hasHarm = Boolean(report.diagnosis.harmfulItem);
  return <section className={`diagnosis-band ${hasHarm ? 'has-harm' : 'verified'}`}>
    <div className="diagnosis-copy"><span>HERE IS WHAT CONTEXT MRI FOUND</span><h2>{hasHarm ? <><em>{report.diagnosis.harmfulItem}</em> is pulling the agent toward a conflicting or unsafe instruction.</> : <>The recommended context pack is <em>clean and verified.</em></>}</h2></div>
    <div className="diagnosis-metrics">
      <div className="score-pair"><span><small>BASELINE</small><strong className={report.baselineScore >= report.provenance.passThreshold ? 'good' : 'bad'}>{report.baselineScore}<i>/100</i></strong></span><b>→</b><span><small>RECOMMENDED PACK</small><strong className="good">{report.optimizedScore}<i>/100</i></strong></span></div>
      <Metric label="IMPROVEMENT" value={`${improvement >= 0 ? '+' : ''}${improvement}`} detail="points" accent={improvement > 0} />
      <Metric label="PAIRED RUNS" value={report.diagnosis.repeatAgreement.split(' ')[0]} detail={hasHarm ? 'paired runs improve' : 'pack checks'} />
      <Metric label="TOKEN IMPACT" value={`${report.tokenReduction}%`} detail="fewer context tokens" />
    </div>
  </section>;
}

function Metric({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="diagnosis-metric"><small>{label}</small><strong className={accent ? 'accent' : ''}>{value}</strong><span>{detail}</span></div>;
}
