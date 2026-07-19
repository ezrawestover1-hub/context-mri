# Context MRI robustness boundary

## What this test proves

`npm run robustness:prove` runs two deterministic checks against the bundled Security Release evaluator.

The **lexical robustness check** changes the context ID, filename, and surrounding prose while retaining the evaluator's configured blocked phrase. Context MRI still identifies the renamed file as the largest observed negative single-file ablation effect for this task, and the score moves from **53/100 to 100/100** when it is omitted. The result is stable across all three fixture repeats.

This is configured-term robustness. It is not a full semantic holdout and does not establish broad unseen-context generalization.

## Explicit negative control and limitation

The **semantic-paraphrase negative control** replaces the configured blocked phrase with meaning-preserving language. Under the deterministic fixture evaluator, the full pack and omission both score **100/100**, so the paraphrased instruction is not detected.

That miss is expected and intentionally public. It defines the current beta's boundary: the fixture engine is content-aware for its configured contract, but it is not a semantic classifier for every possible paraphrase.

## Claim language

Use:

> For this task under this evaluator, Context MRI found the largest observed negative single-file ablation effect.

Or:

> Context MRI provides controlled, task-specific ablation evidence.

Do not claim that Context MRI proves a file caused failures everywhere.

## Reproduce it

```bash
npm install
npm run robustness:prove
```

The command exits nonzero if either boundary assertion changes. GitHub Actions also runs it and uploads `context-mri-robustness-proof.json`. The artifact contains assertion metadata and hashes, not raw context.
