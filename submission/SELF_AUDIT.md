# Context MRI dogfooding audit

Context MRI's final release pass audited its own submission context and CI handoff. This is a **deterministic repository-context audit, not a fresh model evaluation** and not evidence that the ablation engine generalizes to every task.

## What it found

The audit found two real release-context inconsistencies:

1. `submission/DEMO_SCRIPT.md` identified `context-mri-demo-winner-pass.mp4` as the preferred upload, while `submission/JUDGE_CHECKLIST.md` still directed the builder to upload the older `context-mri-demo.mp4`.
2. The committed GitHub Actions workflow checked that the repaired context passed, but did not independently assert the matching headline claim that the original context was blocked.

## What changed

- The release checklist now points to the same winner-pass video as the demo script.
- A committed original-bundle evidence fixture lets CI exercise the regression, not just the successful repair.
- `npm run guard:prove` requires the original five-file bundle to be blocked at 43/100 and the repaired three-file bundle to pass at 92/100, with contract, artifact, and recommended-pack integrity verified for both.
- `npm run audit:self` checks the release-document handoff, free judge path, fixture honesty boundary, public proof links, and dual-sided CI workflow. It fingerprints every audited file with SHA-256.
- GitHub Actions reruns the evaluator tests, production build, self-audit, and Context Guard proof without an API key or paid service, then publishes the JSON proof artifacts.

## Reproduce it

```bash
npm ci
npm run audit:self
npm run guard:prove
```

- [Public GitHub Actions proof](https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml)
- [Context Guard workflow source](https://github.com/ezrawestover1-hub/context-mri/blob/main/.github/workflows/context-guard.yml)

## Trust boundary

This audit proves that Context MRI's release instructions agree with each other and that its committed guard blocks the measured original bundle while passing the measured repair. It does not turn deterministic fixture evidence into fresh GPT-5.6 traces, and it does not replace representative production evaluations or human-calibrated success criteria.
