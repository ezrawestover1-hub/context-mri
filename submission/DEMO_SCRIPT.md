# Demo video script — 2:50 target

## 0:00–0:15 — Hook

**Screen:** Context MRI overview and diagnosis.

“AI agents often don’t fail because they lack context. They fail because one stale, authoritative-looking file quietly overrides everything else. Context MRI finds that file with controlled experiments.”

## 0:15–0:35 — Explain the MRI

**Screen:** Move slowly across the three numbered steps.

“The method is simple: test the full context, remove one item at a time, then compare what changes. This support agent has five files, including a current tool schema and an archived guide that contradict each other.”

## 0:35–0:58 — Run the experiment

**Screen:** Click **Run MRI** and let the four stages animate.

“Every discovery condition runs three times against the same fixed evaluator. That creates 18 ablation traces. Context MRI then builds the recommended pack and runs three independent verification checks—21 inspectable traces in total.”

## 0:58–1:25 — The reveal

**Screen:** Point to the diagnosis, matrix, and contribution graph.

“The baseline averages 43. Removing the system prompt or current schema makes the task worse. Removing examples changes nothing. But removing `legacy-api.md` raises the mean to 92 and improves all three paired repeats. The final recommended pack also verifies at 92, with 44% fewer context tokens.”

## 1:25–1:48 — Prove the evidence

**Screen:** Click the green `−Legacy API` score of 90.

“Every square opens the underlying run: condition, ID, prompt hash, latency, tokens, output, and the exact rubric breakdown. This screen is explicitly labeled fixture replay because this API project has no quota—it never pretends simulated evidence is a fresh GPT‑5.6 call.”

## 1:48–2:08 — Apply the result

**Screen:** Close the trace, click **Remove from context pack**, then **Copy manifest** and briefly show **Export evidence**.

“One click applies the measured recommendation. The manifest keeps only the proven context, and Export Evidence downloads the full JSON ledger—not just a screenshot or summary.”

## 2:08–2:30 — Repair and re-test

**Screen:** Click **Preview safe rewrite**, stage it, then click **Run MRI** again.

“Context MRI can also suggest a safe rewrite, but it does not trust its own edit. It requires another experiment. After the rerun, baseline recovers to 92 and the repaired file is reclassified from harmful to redundant.”

## 2:30–2:50 — GPT‑5.6 and Codex

**Screen:** Open the fixture explanation briefly, then return to the clean diagnosis.

“With API quota, the same runner uses GPT‑5.6 Sol through the Responses API with strict Structured Outputs. Codex helped research the challenge, design the product, build the experiment engine, catch mathematical inconsistencies, write tests, and visually verify the workflow. Context MRI turns prompt debugging from intuition into evidence.”

## Recording checklist

- Record at 1440p or 1080p with browser zoom at 100%.
- Keep the cursor slow and deliberate.
- Start from a clean reload so the stale-file diagnosis is visible.
- Ensure the fixture label is visible; never imply fixture simulation is live.
- Keep the final upload under three minutes and public on YouTube.
- Mention both Codex and GPT‑5.6 in the audio.
