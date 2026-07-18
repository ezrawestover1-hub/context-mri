# Demo video script — 2:35 target

## 0:00–0:12 — Hook

**Screen:** Context MRI overview and diagnosis.

“AI agents often fail because one stale, authoritative-looking file quietly overrides everything else. Context MRI finds that file with controlled experiments.”

## 0:12–0:30 — Explain the MRI

**Screen:** Move slowly across the three numbered steps.

“The method is simple: test the full context, remove one file at a time, then keep only what measurably helps. This agent has a current schema and an archived guide that contradict each other.”

## 0:30–0:50 — Run the experiment

**Screen:** Click **Run MRI** and let the four stages animate.

“Every condition runs three times against the same fixed evaluator: 18 ablation traces, followed by three independent pack checks—21 inspectable traces in total.”

## 0:50–1:15 — The reveal

**Screen:** Point to the diagnosis, matrix, and contribution graph.

“The baseline averages 43. Removing required context makes the task worse, and removing examples changes nothing. But removing `legacy-api.md` raises the mean to 92 in all three paired repeats. The recommended pack verifies at 92 with 44% fewer context tokens.”

## 1:15–1:37 — Prove the evidence

**Screen:** Click the green `−Legacy API` score of 90.

“Every score opens its run ID, prompt hash, tokens, output, and exact rubric. This public demo is explicitly labeled fixture replay—it never pretends simulated evidence is a fresh GPT‑5.6 call.”

## 1:37–1:56 — Apply the result

**Screen:** Close the trace, click **Remove harmful file**, then **Copy manifest** and briefly show **Export evidence**.

“One click applies the measured recommendation. The manifest keeps only proven context, and Export Evidence downloads the full JSON ledger—not just a summary.”

## 1:56–2:18 — Repair and re-test

**Screen:** Click **Preview safe rewrite**, stage it, then click **Run MRI** again.

“Context MRI can suggest a safe rewrite, but it does not trust its own edit. After another experiment, baseline recovers to 92 and the repaired file changes from harmful to redundant.”

## 2:18–2:35 — GPT‑5.6 and Codex

**Screen:** Open the fixture explanation briefly, then return to the clean diagnosis.

“With API quota, the same runner uses GPT‑5.6 Sol through the Responses API with strict Structured Outputs. Codex helped select the idea, design the product, build and test the engine, and catch mathematical inconsistencies. Context MRI turns prompt debugging from intuition into evidence.”

## Recording checklist

- Record at 1440p or 1080p with browser zoom at 100%.
- Keep the cursor slow and deliberate.
- Start from a clean reload so the stale-file diagnosis is visible.
- Ensure the fixture label is visible; never imply fixture simulation is live.
- Keep the final upload under three minutes and public on YouTube.
- Mention both Codex and GPT‑5.6 in the audio.
