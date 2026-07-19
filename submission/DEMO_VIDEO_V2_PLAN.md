# Demo video V2 — native Codex winner cut

## Objective

Make the native diagnose → repair → verify loop the story. The website supports the proof; it is no longer the entire demo. Target **2:35–2:50**, hard stop at **2:55**. The official limit is less than three minutes and requires clear audio covering what was built and how Codex and GPT-5.6 were used.

The final cut must show real interactions, use Ezra's voice, contain no copyrighted music, and preserve the distinction between deterministic fixture evidence and fresh model evidence.

## Exact narration and shot plan

### Scene 1 · 0:00–0:13 · Cold open

**Narration**

“Your AI agent can have the right model, the right tools, and almost every right instruction—and still fail because one bad file overrules the rest. Context M—R—I finds that file.”

**Screen**

- Start on the unsafe Security Release answer for one second.
- Hard cut to `53 → 100` and the filename `emergency-release-runbook.md`.
- Title: **Find the bad context. Prove the repair.**

### Scene 2 · 0:13–0:34 · Ask Codex, not another dashboard

**Narration**

“Now it works where developers already work. I ask Codex why my release agent chose an unsafe credential procedure. Codex calls Context MRI locally with only the task and files I choose—no account, no billing, and no repository crawl.”

**Screen**

- Record a real fresh Codex task with the installed plugin.
- Use this exact prompt: `Use Context MRI to run the bundled Security Release diagnostic. Explain the evidence, propose the smallest safe repair, verify that the original pack remains blocked, and verify that the recommended pack passes.`
- Show the tool call, not a recreated transcript.

### Scene 3 · 0:34–0:56 · Diagnosis with evidence

**Narration**

“For this task under this evaluator, the emergency release runbook has the largest observed negative single-file effect. With the full pack, the agent scores fifty-three. Remove that instruction, and it reaches one hundred. Context MRI returns representative traces, the scoring contract, pack fingerprints, and its limits—not just a confident label.”

**Screen**

- Hold on the real `diagnose_context_pack` result.
- Highlight harmful file, `53 → 100`, evaluator ID, three representative traces, and the task-specific limitation.
- Never imply this bundled result is a fresh API call.

### Scene 4 · 0:56–1:17 · Human-approved repair

**Narration**

“The plugin is deliberately read-only. It cannot silently rewrite my project. Codex explains the smallest evidence-backed repair, and any edit still uses the normal approval flow. That keeps diagnosis separate from authority.”

**Screen**

- Show Codex's concise repair proposal.
- Show the approval boundary visually; do not pretend an edit occurred if no edit was made.
- Overlay: `PLUGIN: READ-ONLY · LOCAL STDIO · ZERO NETWORK · ZERO RETENTION`.

### Scene 5 · 1:17–1:37 · Verify before trust

**Narration**

“Then Context MRI verifies both sides. The repaired pack passes at one hundred, while the original stays blocked at fifty-three. The finding becomes a reusable Context Guard, so the same regression can fail continuous integration before it reaches users.”

**Screen**

- Show the real `verify_context_pack` result.
- Split proof: `REPAIRED PASSED · 100` and `ORIGINAL BLOCKED · 53`.
- Flash the public GitHub Actions step proving the two-sided guard.

### Scene 6 · 1:37–1:58 · The deeper product

**Narration**

“Tracing tools show what an agent did. Context MRI experimentally tests which supplied context changes the result, then verifies the repair. The web product exposes every ablation, repeat, rubric, trace, interaction check, smaller pack, and guard. Every label applies only to this task under this evaluator.”

**Screen**

- Fast, readable montage from the deployed site:
  1. Security project selected.
  2. Ablation matrix and trace inspector.
  3. Evaluator contract.
  4. Apply and verify.
  5. Context Guard.
- Keep each view on screen long enough to read one claim.

### Scene 7 · 1:58–2:20 · Independent proof and honesty

**Narration**

“I also ran five fresh Codex tasks. Five out of five discovered the installed plugin and completed the full loop. A renamed and reworded file passed a lexical robustness check. A semantic paraphrase is published as a negative control and current limitation. The public demo remains clearly labeled deterministic replay.”

**Screen**

- Show the sanitized five-run artifact: tool names, outcomes, timestamps, and hashes only.
- Show the robustness proof with two explicit cards: `LEXICAL CHECK · PASSED` and `SEMANTIC PARAPHRASE · NEGATIVE CONTROL / LIMITATION`.
- Show the deployed replay label, current green GitHub Actions run, self-audit, and public repository briefly.
- On-screen: `5/5 FRESH CODEX TASKS · 36 TESTS · REAL MCP STDIO · PUBLIC PROOF`.
- Do not show a private prompt, source file, account identifier, usage record, or full Codex transcript.

### Scene 8 · 2:20–2:47 · Codex, GPT-5.6, and close

**Narration**

“Codex helped me research the rules, challenge the idea, design the experiment, build the evaluator and interface, test every interaction, and package this native workflow. Then GPT-five-point-six Terra in Codex adversarially audited the math, fixture claims, privacy boundary, and judge path. Context M—R—I turns agent debugging from guesswork into evidence: find the bad context once, prove the repair, and keep it from returning.”

**Screen**

- High-energy build montage: requirements → Codex task → tests → browser QA → plugin package.
- End card for at least three seconds:
  - **CONTEXT MRI**
  - `Find it once. Keep it out.`
  - `context-mri.ezra-westover1.chatgpt.site`
  - `Developer Tools · OpenAI Build Week`

## Capture order

Capture footage in this order so a failed take cannot derail the edit:

1. Start a **fresh Codex task** after confirming the Context MRI plugin is enabled.
2. Record the exact judge prompt and the real diagnosis, repair explanation, and verification outputs.
3. Record the deployed Security Release workflow at 1440p or higher.
4. Record the successful public GitHub Actions run and inspectable proof artifacts.
5. Record short Codex build-history shots with no secrets or unrelated private content visible.
6. Record all eight narration scenes separately. Redo only the scene that needs work.
7. Build captions from the final chosen takes, then time the visuals to the voice—not the reverse.

## Editing rules

- Use fast cuts for transitions, but hold every important score or claim for at least 1.5 seconds.
- Keep captions to two lines and emphasize only one phrase per shot.
- Use the existing pine-green, cream, rust, and botanical evidence language.
- Use light interface sounds only if original or licensed; silence is better than risky music.
- Do not use zooms merely to add motion. Every camera move must reveal a detail.
- Show `Codex` and `GPT-5.6 Terra` in both audio and visible text.
- Say M—R—I as three letters in every take.
- Do not claim broad generalization, autonomous repair, fresh hosted inference, or production safety certification.
- Call the renamed/reworded experiment a **lexical robustness check**, never a semantic holdout.
- Label the semantic paraphrase as a **negative control / limitation**.
- Describe the result as **controlled, task-specific ablation evidence**, not causal proof.

## Final judge gate

Before upload, verify all of the following:

- Runtime is below 2:55; YouTube link works in a private window.
- The first 20 seconds communicate the problem, product, and native Codex advantage.
- The Security diagnostic, repair boundary, and two-sided verification are visible.
- The deterministic replay label is readable.
- The five-run proof is visibly sanitized and presented only as installation/orchestration reliability.
- The lexical check and semantic negative control are both visible and accurately labeled.
- Codex and GPT-5.6 contributions are explained, not merely named.
- Public URL, repository, and green CI run are correct.
- Captions match Ezra's final audio exactly.
- No secret, API key, personal message, unrelated task, copyrighted music, or third-party trademark appears.

## Fallback

Keep the existing 2:17 winner-pass render unchanged until this cut is fully rendered and watched end to end. If the native Codex footage or narration is not clean, submit the proven existing video rather than a rushed replacement.
