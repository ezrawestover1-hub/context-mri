# Devpost submission copy

## Project name

Context MRI

## Tagline

Find the context file that broke your agent. Verify the repair. Block its return.

## Track

Developer Tools

## Short description

Most evaluations tell you that an agent failed. Context MRI finds which context file changed the result, helps Codex stage the smallest evidence-backed repair, verifies the repaired pack, and exports a CI guard so the regression cannot return.

## Try it

Public no-login demo: https://context-mri.ezra-westover1.chatgpt.site

Public source repository: https://github.com/ezrawestover1-hub/context-mri

Public CI proof: https://github.com/ezrawestover1-hub/context-mri/actions/workflows/context-guard.yml

Reproducible self-audit: https://github.com/ezrawestover1-hub/context-mri/blob/main/submission/SELF_AUDIT.md

Installable Codex plugin: https://github.com/ezrawestover1-hub/context-mri/tree/main/plugins/context-mri

The complete hosted judge path is free: no account, API key, payment, or external setup. Its deterministic fixture replay demonstrates the entire diagnosis → trace inspection → repair → pack verification → Context Guard workflow and is explicitly labeled as replay evidence.

The free local Codex plugin brings that loop into the coding conversation. Its three read-only MCP tools diagnose only the task and files explicitly supplied, propose evidence for a normal user-approved repair, and verify the repaired pack. It makes zero network requests, retains no files, and never edits a repository itself.

## 60-second judge path

1. Click **Run the free 30-second demo** and watch the full bundle score 43 while the repaired pack reaches 92 with 44% fewer context tokens.
2. Open any score to inspect its run ID, prompt hash, model output, token use, latency, and exact rubric breakdown.
3. Apply the recommended pack and rerun it as the new baseline.
4. Create the Context Guard, then verify that it blocks the original library and passes the repaired pack.

For independent verification, open the public CI proof. The same zero-secret command must block the committed original bundle at 43/100 and pass the repaired pack at 92/100 with all integrity fingerprints verified.

For the native workflow, install `plugins/context-mri`, start a fresh Codex task, and ask: “Use Context MRI to run the bundled Security Release diagnostic. Explain the evidence, propose the smallest safe repair, and verify the recommended pack.” The result should identify `emergency-release-runbook.md`, improve 53→100, pass the repaired pack, and keep the original blocked.

Fresh API evaluation is an optional local/funded path, not a judging prerequisite. When no funded runner is configured, the public host disables those controls instead of silently substituting fixture output.

## Inspiration

AI agents rarely fail only because they lack context. They often fail because they have too much: an obsolete README, duplicated rules, irrelevant examples, or tool descriptions that contradict each other. Developers usually debug this by reading prompts and guessing. Context MRI turns that guesswork into a repeatable experiment and a regression guard.

## What it does

Most evaluation tools stop at pass/fail. Context MRI takes an agent task and its context bundle, runs a full baseline, then removes one context item at a time. Every condition is repeated and evaluated against the same task-specific rubric. The result is an ablation matrix showing which context raises performance, does nothing, or actively suppresses it—and a tested action plan for what happens next. The public demo includes three independently configured contracts—Support API migration, Billing API migration, and Security Release Safety—so the engine is demonstrated beyond a single hard-coded endpoint story. The security scenario evaluates an unsafe credential-handling runbook against a policy-and-risk rubric and reaches a different 53→100 result pattern. A funded bundled live suite also runs one pre-registered pairwise check, so it can distinguish a simple additive story from overlapping protection for that named pair.

Context MRI also ships as a native Codex workflow instead of requiring developers to leave their task for another dashboard. Codex calls a local MCP server to inspect the available evaluators, diagnose an explicitly supplied context pack, and verify the recommended pack against the same fingerprinted guard. The plugin is read-only by design: Codex can explain or stage a repair through its normal approval flow, but Context MRI cannot silently change source files or instructions.

For genuinely new work, Local Judge Lab lets a builder set the task, exact success answer, conflicting instruction, and source labels against the context files currently loaded in the browser. It only runs through a fresh local API evaluation—there is no custom fixture mode to make an arbitrary task look proven.

In the included demo, an archived guide tells the agent to use `/v1/chat/completions` while the current tool schema says `/v1/responses`. The baseline scores 43. Removing the stale guide scores 92 and improves all three paired repeats. Context MRI identifies the conflict, derives every file classification from those runs, then independently verifies the recommended pack at 92 with 44% fewer context tokens. Finally, it creates a downloadable Context Guard: the original library is visibly blocked for containing the stale endpoint and scoring below 80, while the repaired pack passes the same gate.

## How we built it

The product is a React + TypeScript application with a Node/Express experiment server, a Cloudflare-compatible public fixture adapter, and a transport-neutral diagnostic service shared by the web product and local Codex plugin. The plugin exposes three narrowly scoped MCP tools over local stdio. Every tool is explicitly read-only, idempotent, closed-world, and non-destructive; filenames and file contents are treated as untrusted data rather than instructions. The optional live runner uses the OpenAI Responses API with GPT‑5.6 Sol, medium reasoning, and strict Structured Outputs. The subject returns only an answer and explanation; an independent deterministic application evaluator assigns every point for task-specific answer accuracy, source authority, instruction safety, conflict explanation, and structured-output validity. The model cannot report its own grades.

We also dogfooded Context MRI's release discipline against its own repository context. A deterministic self-audit found two real inconsistencies: the upload checklist still named an older video after the preferred render changed, and the CI workflow proved only that the repair passed—not that the original was blocked. The repaired workflow now asserts both outcomes, fingerprints the audited release files, reruns all 34 automated tests, validates the installable plugin over real MCP stdio, and publishes inspectable JSON artifacts without an API key or paid service. The audit is explicitly scoped as repository consistency proof, not a fresh model-generalization claim.

Each trace records its evaluation contract ID, run ID, condition, repeat, prompt hash, latency, token usage, model output, rubric breakdown, and whether it came from a live call or fixture replay. All headline metrics are derived from those records. Each bundled fixture contract contains 18 discovery traces plus three pack-verification traces; fresh bundled mode adds three traces for its declared pairwise check. The project picker swaps the task, context files, expected answer, disallowed instruction, report dataset, rubric, and trace ledger together. Public replay clicks always use the clearly labeled replay; the fresh-live and Judge Lab endpoints return an error instead of a fixture result when they have no funded quota. The shipped `guard:check` command consumes a downloaded Context Guard and evidence export, returns inspectable JSON, and fails CI on an observed blocked term, a score below threshold, or a SHA-256 contract, source-pack, or artifact-integrity mismatch. Thirty-four automated tests protect the evaluator, classifications, aggregate claims, provenance, experiment endpoints, guard behavior, shared diagnostic service, and real MCP transport.

Codex accelerated the project from critical idea selection through implementation: official-requirement research, architecture, UI concept generation, API integration, automated tests, mathematical consistency checks, browser-based interaction and visual QA, and the complete native plugin package. In the final Build Week pass, GPT-5.6 Terra in Codex adversarially reviewed the evaluator, fixture claims, privacy boundary, and judge flow; that audit removed a false paid-API submission gate and tightened the final evidence narrative.

## Challenges

The hardest problem was epistemic honesty. A beautiful dashboard can make weak evidence look stronger than it is. We removed an early “94% confidence” claim because three repeats cannot justify it, corrected inconsistent percentages, and exposed fixture/live provenance directly in the UI. The result is less theatrical and more trustworthy.

## Accomplishments

- A complete diagnosis → repair → verification → prevention loop rather than a static dashboard
- A free, installable Codex plugin that completes that loop inside the coding conversation with three read-only local tools, zero network requests, and zero retained context
- A reusable evaluation-contract engine demonstrated with three isolated five-file scenarios, including a non-endpoint security procedure
- Twenty-one inspectable traces in each public deterministic replay; twenty-four in each funded bundled live suite
- Independent scoring that never trusts subject-model grading claims
- Mathematically derived contribution and token-reduction claims plus independent verification runs for the recommended pack
- A real apply-and-rerun loop that tests the reduced pack as the new baseline
- A downloadable Context Guard that proves the original stale library is blocked and the repaired pack passes, plus a committed GitHub Actions workflow and CI-ready check command
- A public, dual-sided GitHub Actions run that verifies `43 blocked → 92 passed` and publishes its proof artifacts
- A reproducible dogfooding audit that caught and repaired two genuine release-context inconsistencies without overstating them as fresh model evidence
- A local-only Judge Lab for a genuinely new task and success contract, with no custom-fixture fallback
- One inspectable pre-registered pairwise live check per bundled contract
- GPT‑5.6 Terra adversarial audit plus an optional API runner and honestly labeled no-secret fixture mode
- Trace export, manifest copy, context upload, and suggested rewrite flows
- Thirty-four automated tests protecting the evaluator, classifications, aggregate claims, provenance, endpoints, guard behavior, shared diagnostic service, and real MCP transport

## What we learned

Context quality is not the same as context quantity. The most damaging context can look authoritative, and simple token reduction is not enough—you need task-specific evals to determine what can safely be removed.

## What's next

Next steps are broader multi-item interaction coverage, imported production trace sets, live-evaluation adapters behind Context Guard, human-calibrated rubrics, and adapters for common agent frameworks. The local plugin remains free; a future hosted service could add team history, private deployment, and CI fleet management only after explicit retention, deletion, and tenant-isolation controls exist. The long-term product is a context compiler that routes only the minimum proven context to each task.

## Built with

Codex, GPT‑5.6 Terra, an optional GPT‑5.6 Sol Responses API runner, Model Context Protocol, React, TypeScript, Vite, Express, and Node.js.

## Codex session

`019f71e4-f746-7083-a465-1c84948bbd8c`
