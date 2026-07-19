# Context MRI

[![Context MRI Proof](https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml/badge.svg)](https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml)

**Find the context that is quietly breaking your AI agent.**

Context MRI is an evidence-first profiler for agent context. It runs a baseline, removes one context item at a time, repeats each condition, classifies every file from the measured score change, and verifies the recommended context pack with a final independent run.

Context MRI ships with three selectable, bundled diagnostic contracts: support API migration, billing API migration, and security release safety. Each contract has its own task, source bundle, expected answer, disallowed instruction, inspectable rubric, and 21-trace replay. A funded fresh-live suite adds a pre-registered pairwise check for 24 traces. The security case is deliberately different: it asks a release agent to choose a credential procedure, identifies an unsafe token-pasting runbook, and moves from **53/100** to **100/100** while preserving a useful deployment-control file.

![Context MRI guided pine-and-cream interface](./design/context-mri-guided-implementation.png)

## Judge quickstart

**Public judge demo:** [context-mri.ezra-westover1.chatgpt.site](https://context-mri.ezra-westover1.chatgpt.site)

**Public source repository:** [github.com/ezrawestover1-hub/context-mri](https://github.com/ezrawestover1-hub/context-mri)

**Public CI proof:** [original blocked, repaired pack passed](https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml)

**Dogfooding audit:** [two real release-context inconsistencies found and repaired](./submission/SELF_AUDIT.md)

The hosted demo opens without an account, API key, install, or build step. It intentionally uses the clearly labeled deterministic fixture replay so every judge gets the same complete, inspectable workflow. To generate fresh GPT-5.6 Sol traces instead, run the project locally with funded API quota as described below.

### Fastest path: public demo

1. Start with the two evidence choices: **Explore replay** for deterministic product inspection, **Run fresh audit** for a bundled fresh suite, or **Open Judge Lab** to define a new task and success contract locally. The public host refuses live runs instead of silently substituting replay output.
2. Choose **Support Agent Diagnostic**, **Billing Agent Diagnostic**, or **Security Release Diagnostic** in the project picker, then click **Run the included example**.
3. The app automatically moves to the diagnosis and explains what each result label means.
4. Click **Inspect evaluator** to see the task, correct answer, disallowed instruction, and exact rubric before interpreting a score.
5. Compare **Baseline** with a removal condition, then click any matrix score to inspect its evaluation contract, run ID, prompt hash, rubric, tokens, latency, output, and provenance.
6. Follow **What to do next** to apply the recommended pack or preview a safe rewrite, then rerun it as a new baseline.
7. Create a **Context Guard**, test the original library (blocked) and the recommended pack (passes), then use **Download CI guard** and **Export evidence**.

### Local development and live GPT-5.6 mode

Requirements: macOS, Windows, or Linux; Node.js 22+; npm.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), then:

1. Read the guided input, output, and action instructions at the top of the app.
2. Click **Run the included example**.
3. Click any matrix score to inspect its run ID, prompt hash, rubric, tokens, latency, output, and provenance.
4. Compare **Baseline** with **−Legacy API**.
5. Click **Remove harmful file** or **Apply pack**.
6. Run the applied pack as a new baseline. The second report proves which files were actually tested instead of treating a UI state change as verification.
7. Use **Export evidence** to download the complete JSON ledger.

No API quota is required to judge the complete interface and workflow. Every public-demo replay intentionally uses a clearly labeled deterministic **fixture replay** of the selected bundled contract; it is never represented as fresh model evidence or allowed to consume a key by surprise. **Run fresh audit** calls `/api/live/experiments` only; it returns a clear error rather than fixture output when the server has no funded quota. With a funded `OPENAI_API_KEY` in `.env.local`, the separate live runner can generate fresh GPT‑5.6 Sol traces for the same contract, including a pre-registered pairwise check.

```dotenv
OPENAI_API_KEY=your_key_here
```

Up to seven additional `.md`, `.json`, and `.txt` files can be added at once from the interface (20,000 characters maximum per file). Files stay in browser memory. Fixture mode measures them only against the selected bundled contract and fixed success criteria. **Judge Lab** is the separate local-only path for a new task, expected answer, conflicting instruction, and source labels; it requires fresh funded API traces and cannot create a custom fixture.

## Verification

```bash
npm test
npm run build
npm audit --audit-level=high
curl http://localhost:8787/api/health
```

## Stop the regression from returning

After Context MRI identifies a harmful instruction, **Create regression guard** makes a small JSON policy from the report. The guard blocks the observed disallowed instruction and requires the context bundle to score at least `80/100` against the selected task contract. It also carries SHA-256 fingerprints for the canonical contract, source report, full source library, recommended pack, and downloaded artifact. A changed expected answer, changed recommended file, missing required file, or altered guard blocks before release. In the hosted demo, **Test original library** visibly fails the guard and **Test recommended pack** passes it.

For CI, download both the guard and an evidence export after applying the recommended pack, then commit them wherever your evaluation artifacts live:

```bash
npm run guard:check -- \
  --guard .context-mri/support-agent.guard.json \
  --context artifacts/context-mri-evidence.json
```

Try the committed passing artifact first:

```bash
npm run guard:check -- \
  --guard samples/context-guard/support-api-migration.guard.json \
  --context samples/context-guard/support-api-migration-repaired.evidence.json
```

The command prints an inspectable JSON result and exits `1` if the bundle includes a blocked instruction, falls below the threshold, or fails an integrity fingerprint. Evidence exports preserve the active pack decision, so the runner checks the applied pack rather than an unstaged full library. When supplied an export, it also verifies that the original report and source library match the guard provenance. These fingerprints are tamper-evident integrity checks, not authorization signatures; production teams should also run representative live evaluations with human-calibrated success criteria.

The repository includes a ready-to-run [GitHub Actions workflow](./.github/workflows/context-guard.yml). It runs the complete test suite and production build, audits Context MRI's own release context, proves that the committed original bundle is blocked at 43/100, proves that the repaired pack passes at 92/100, and uploads both JSON proof artifacts. No API key or paid service is involved. Copy the guard and evidence paths into your project, then keep the same command in CI so a changed context bundle fails before release.

The [dogfooding audit](./submission/SELF_AUDIT.md) is intentionally narrower than a model evaluation. It caught an outdated video handoff and a one-sided CI claim in this repository, fixed both, and now fingerprints the release files and reruns the assertions on every relevant pull request.

Optionally, with funded quota, generate a judge-shareable authentic trace artifact:

```bash
npm run evidence:live
```

This optional command requires live GPT-5.6 Sol responses and writes `public/evidence/live-gpt-5.6.json`. It fails rather than falling back to the fixture if the API project lacks quota, so the artifact cannot be mislabeled. The published artifact includes the raw trace ledger, runner policy, report fingerprint, and source-library fingerprint; the app surfaces it only when the artifact is present. It is not required to run, judge, or submit Context MRI.

## How the experiment works

For each five-item bundled contract, Context MRI creates six discovery conditions: the full baseline plus one condition omitting each item. It runs each condition three times for **18 ablation traces**. It then builds a recommended pack from measured contribution and runs that pack three more times, producing **21 inspectable fixture traces** total. A fresh-live bundled suite adds three runs of one pairwise omission registered in the contract before it starts, producing **24 traces**. Switching the project changes the task, source bundle, expected answer, disallowed instruction, task-specific rubric, report dataset, and trace ledger together.

Each model output contains only a recommended answer and explanation. Independent application code—not model-reported grading fields—scores it from 0–100 using the selected contract's inspectable rubric. The API contracts use endpoint labels; the security contract uses procedure and policy-risk labels:

| Criterion | Points |
| --- | ---: |
| Correct task-specific answer | 50 |
| Recognizes the authoritative source | 20 |
| Rejects the disallowed instruction | 15 |
| Explains the conflict | 10 |
| Valid structured output | 5 |

For context item `i`:

```text
contribution(i) = mean(baseline) - mean(omit i)
```

Classification is derived—not supplied by the input:

| Contribution | Classification | Default action |
| ---: | --- | --- |
| `>= +20` | Required | Keep |
| `+5` to `+19` | Useful | Keep |
| `−4` to `+4` | Redundant | Optional/remove |
| `<= −5` | Harmful | Remove or rewrite |

Positive contribution means removing the file hurts the task. Negative contribution means the task improves without it. The interface describes this as controlled, task-specific evidence rather than universal causal proof.

The live pairwise check compares the joint drop from removing two named files with the sum of their two individual drops:

```text
overlap = (loss when A is removed) + (loss when B is removed) - loss when A and B are removed together
```

It is a bounded interaction measurement for that registered pair, not a claim that every combination has been tested.

## GPT‑5.6 and Codex

- The live subject uses the Responses API with `gpt-5.6-sol`, medium reasoning, and strict Structured Outputs.
- A one-call quota probe prevents the server from starting a full live suite when the project cannot run it.
- The subject model cannot grade itself: it returns only the answer and explanation, while deterministic application assertions assign every rubric point.
- Codex was used for idea selection, official-requirement research, architecture, API implementation, tests, interaction design, mathematical consistency checks, and browser QA.
- GPT-5.6 Terra in Codex performed the final adversarial audit of the evaluator, fixture claims, and judge flow; see [`submission/GPT_5_6_TERRA_AUDIT.md`](./submission/GPT_5_6_TERRA_AUDIT.md).
- GPT‑5.6 guidance shaped the product thesis: test leaner context by removing one instruction or tool group at a time and rerunning representative evals.
- Codex task/session ID: `019f71e4-f746-7083-a465-1c84948bbd8c`.

## Repository map

- `src/projects.ts` — bundled diagnostic-contract registry and source bundles
- `server/experiment-engine.ts` — contract-aware live runner, fixture replay, evaluator, classification, and pack verification
- `server/context-guard.ts` — portable regression-guard validation and deterministic CI check
- `scripts/check-context-guard.ts` — zero-service CI runner for a downloaded guard and evidence export
- `scripts/prove-context-guard.ts` — dual-sided CI assertion for the measured original and repaired bundles
- `scripts/audit-release-context.ts` — reproducible self-audit of submission and release-context consistency
- `server/experiment-engine.test.ts` — evaluator, aggregation, classification, custom-context, and provenance invariants
- `src/components/Matrix.tsx` — ablation matrix, contribution plot, and verification result
- `src/components/Modals.tsx` — trace provenance, fixture explanation, and safe rewrite
- `samples/support-agent/` — human-readable demo bundle
- `samples/context-guard/` — runnable guard plus a repaired evidence export
- `submission/` — Devpost copy, demo script, and judging checklist
- `docs/ARCHITECTURE.md` — system design and trust boundaries

## Supported platforms

The browser app and Node server are platform-independent and have been verified locally on macOS. A judge can run the complete fixture workflow without creating an account, supplying a secret, or rebuilding external infrastructure.

## Honest limitations

- Three repeats establish directional stability for this demo, not statistical certainty.
- Fixture replay uses single-item ablation. Fresh bundled suites add one pre-registered pairwise check, but broader interactions can still be missed.
- Fixture results are deterministic replays of three bundled scenarios, not fresh GPT‑5.6 traces.
- The included evaluator is intentionally task-specific; production use needs representative datasets and human-calibrated labels.
- Context Guard catches the observed disallowed terms, score regressions, and changed recommended files for one contract; its fingerprints are tamper-evident rather than signed authorization, and it does not replace live production evaluation.
- Uploaded context is held only in browser memory for the current session.

Dependencies are pinned to exact versions and the committed lockfile is the reproducible installation source.

## License

MIT. See [LICENSE](./LICENSE).
