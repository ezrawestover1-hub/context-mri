# Devpost submission copy

## Project name

Context MRI

## Tagline

Find the one file quietly breaking your AI agent.

## Track

Developer Tools

## Short description

Context MRI runs controlled context-ablation experiments against an AI agent, identifies instructions that are required, redundant, or harmful, then turns the result into a smaller tested pack and a portable regression guard.

## Try it

Public no-login demo: https://context-mri.ezra-westover1.chatgpt.site

Public source repository: https://github.com/ezrawestover1-hub/context-mri

The hosted judge path is an explicitly labeled deterministic fixture replay, so it needs no account, API key, or external setup. The repository also includes an optional GPT-5.6 Sol Responses API runner for funded OpenAI API projects.

## Inspiration

AI agents rarely fail because they lack context. They often fail because they have too much: an obsolete README, duplicated rules, irrelevant examples, or tool descriptions that contradict each other. Developers usually debug this by reading prompts and guessing. Context MRI turns that guesswork into a repeatable experiment.

## What it does

Context MRI takes an agent task and its context bundle, runs a full baseline, then removes one context item at a time. Every condition is repeated and evaluated against the same task-specific rubric. The result is an ablation matrix showing which context raises performance, does nothing, or actively suppresses it. The public demo includes two independently configured contracts—Support API migration and Billing API migration—so the method is demonstrated beyond a single hard-coded endpoint story.

In the included demo, an archived guide tells the agent to use `/v1/chat/completions` while the current tool schema says `/v1/responses`. The baseline scores 43. Removing the stale guide scores 92 and improves all three paired repeats. Context MRI identifies the conflict, derives every file classification from those runs, then independently verifies the recommended pack at 92 with 44% fewer context tokens. Finally, it creates a downloadable Context Guard: the original library is visibly blocked for containing the stale endpoint and scoring below 80, while the repaired pack passes the same gate.

## How we built it

The product is a React + TypeScript application with a Node/Express experiment server and a Cloudflare-compatible public fixture adapter. The live runner uses the OpenAI Responses API with GPT‑5.6 Sol, medium reasoning, and strict Structured Outputs. The subject returns only an endpoint and explanation; an independent deterministic application evaluator assigns every point for endpoint accuracy, recency reasoning, legacy handling, conflict explanation, and schema validity. The model cannot report its own grades.

Each trace records its evaluation contract ID, run ID, condition, repeat, prompt hash, latency, token usage, model output, rubric breakdown, and whether it came from a live call or fixture replay. All headline metrics are derived from those records. Each bundled contract contains 18 discovery traces plus three pack-verification traces, and the project picker swaps the task, context files, legacy/current endpoint assertions, report dataset, and trace ledger together. Public clicks always use the clearly labeled replay; fresh GPT-5.6 generation remains an intentional, separate live-runner action. The shipped `guard:check` command consumes a downloaded Context Guard and evidence export, returns inspectable JSON, and fails CI when it sees an observed blocked term or a score below the guard threshold.

Codex accelerated the project from critical idea selection through implementation: official-requirement research, architecture, UI concept generation, API integration, automated tests, mathematical consistency checks, and browser-based interaction and visual QA. In the final Build Week pass, GPT-5.6 Terra in Codex adversarially reviewed the evaluator, fixture claims, and judge flow; that audit removed a false paid-API submission gate and tightened the final evidence narrative.

## Challenges

The hardest problem was epistemic honesty. A beautiful dashboard can make weak evidence look stronger than it is. We removed an early “94% confidence” claim because three repeats cannot justify it, corrected inconsistent percentages, and exposed fixture/live provenance directly in the UI. The result is less theatrical and more trustworthy.

## Accomplishments

- A complete, runnable developer product rather than a static proof of concept
- Twenty-one inspectable traces in the default experiment
- A reusable evaluation-contract engine demonstrated with two isolated five-file scenarios
- Mathematically derived contribution and token-reduction claims
- Independent verification runs for the recommended pack
- A real apply-and-rerun loop that tests the reduced pack as the new baseline
- A downloadable Context Guard that proves the original stale library is blocked and the repaired pack passes, plus a CI-ready check command
- Independent scoring that never trusts subject-model grading claims
- GPT‑5.6 Terra adversarial audit plus an optional API runner and honestly labeled no-secret fixture mode
- Trace export, manifest copy, context upload, and suggested rewrite flows
- Unit tests protecting the evaluator, classifications, aggregate claims, and provenance

## What we learned

Context quality is not the same as context quantity. The most damaging context can look authoritative, and simple token reduction is not enough—you need task-specific evals to determine what can safely be removed.

## What's next

Next steps are multi-item interaction ablations, imported production trace sets, live-evaluation adapters behind Context Guard, human-calibrated rubrics, and adapters for common agent frameworks. The long-term product is a context compiler that routes only the minimum proven context to each task.

## Built with

Codex, GPT‑5.6 Terra, an optional GPT‑5.6 Sol Responses API runner, React, TypeScript, Vite, Express, and Node.js.

## Codex session

`019f71e4-f746-7083-a465-1c84948bbd8c`
