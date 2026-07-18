# Demo video script — final 1:54 cut

The rendered video uses the real deployed interface, burned-in captions, and the narration below. Final file: `submission/video/out/context-mri-demo.mp4`.

## 0:00–0:15 — Hook

**Screen:** Context MRI title card and the 43 → 92 result.

“Most AI agent failures are not model failures. One stale, authoritative-looking file can quietly override a correct schema. Context MRI finds the file making an agent worse, and proves it with controlled experiments.”

## 0:15–0:30 — Explain the method

**Screen:** Input, test, action steps and the product’s beginner-first landing page.

“Give Context MRI the task, the files the agent reads, and a fixed definition of success. It tests the full bundle, removes one file at a time, repeats every condition three times, and scores each answer with the same rubric.”

## 0:30–0:48 — Show the finding

**Screen:** The harmful file diagnosis, baseline score, verified score, repeats, and token reduction.

“In this example, a current Responses API schema conflicts with an archived chat-completions guide. The full bundle averages forty-three. Without legacy-api dot markdown, the mean jumps to ninety-two in all three paired repeats, with forty-four percent fewer context tokens.”

## 0:48–1:05 — Inspect the evidence

**Screen:** The experiment matrix, contribution graph, file inspector, and evidence-field labels.

“Every score is inspectable. Open any cell to see its run ID, prompt hash, latency, token use, model output, and exact rubric. Eighteen discovery traces plus three independent pack checks produce twenty-one evidence records, not one lucky answer.”

## 1:05–1:20 — Explain what to do next

**Screen:** Remove or rewrite, apply the pack, and run again.

“The result becomes a concrete action plan: remove or rewrite the harmful file, apply the smaller verified pack, then run the experiment again. Even a suggested rewrite is labeled untrusted until it survives another test.”

## 1:20–1:38 — Explain fixture and live modes

**Screen:** Side-by-side public fixture replay and GPT-5.6 Sol live runner.

“The hosted judge demo is clearly labeled deterministic fixture replay, so it never presents simulated evidence as a fresh model call. With funded quota, the same runner uses GPT-5.6 Sol through the Responses API, medium reasoning, and strict Structured Outputs.”

## 1:38–1:55 — Codex and close

**Screen:** Final Context MRI card, public URL, and the Codex + GPT-5.6 build summary.

“Codex helped select the idea, research the official requirements, design the experiment, build and test the engine, refine the interface, and catch mathematical inconsistencies through browser QA. Context MRI turns prompt debugging from intuition into evidence.”

## Verified render

- Duration: 1:54.53
- Video: H.264, 1920×1080, 30 fps
- Audio: AAC, 48 kHz stereo
- File size: 22.6 MB
- Both Codex and GPT-5.6 are explained in the narration and captions.
- Fixture replay and live-model provenance are explicitly distinguished.
