# Build Week submission checklist

## Required materials

- [x] Working project
- [x] Category selected: Developer Tools
- [x] Project description drafted in `submission/DEVPOST.md`
- [x] Devpost project draft created: https://devpost.com/software/context-mri
- [x] Record the short scene-eight human-voice pickup that explicitly explains Codex usage
- [x] Render and verify the updated under-three-minute demo at 1080p with stereo audio (H.264, 1920×1080, 30 fps, stereo AAC, 2:17.17); the action scene now visibly shows Context Guard blocking 43 and passing 92 without changing narration or runtime
- [ ] Upload public YouTube demo
- [x] Public repository: https://github.com/ezrawestover1-hub/context-mri
- [x] README with setup, sample data, and judge test path
- [x] Codex task/session ID captured: `019f71e4-f746-7083-a465-1c84948bbd8c`
- [x] GPT-5.6 Terra Codex adversarial audit captured in `submission/GPT_5_6_TERRA_AUDIT.md`
- [x] Installation instructions and supported platforms
- [x] No-key fixture path for testing without rebuilding infrastructure
- [x] Public no-login demo: https://context-mri.ezra-westover1.chatgpt.site
- [x] MIT license for a public repository

## Judging-criteria mapping

### Technological implementation

- GPT‑5.6 Terra Codex adversarial audit of evaluator, provenance, and judge flow
- Optional GPT‑5.6 Responses API experiment runner for funded API projects
- Strict Structured Outputs
- Concurrency-limited 18-run discovery suite with one-call quota probe
- Three independent recommended-pack verification runs (21 traces total)
- Reusable, contract-driven evaluator proven across isolated Support and Billing migrations
- Public replay endpoint deliberately separated from the optional live runner, so judge clicks are deterministic and cannot consume a configured key
- Evidence-derived file classifications and context pack
- Independent deterministic evaluator over endpoint + explanation; no self-reported model grades
- Unit-tested evaluator, aggregate, classification, and provenance invariants
- Applied-pack rerun submits the reduced bundle as a separate experiment and captures its report ID
- Downloadable Context Guard blocks the original stale library, passes the repaired pack, and has a zero-service CI runner that exits nonzero on regression

### Design

- Plain-language three-step explanation plus complete three-panel workflow
- Editorial scientific-instrument visual system
- Matrix-to-trace interaction
- Honest live/fixture provenance
- Working export, copy, upload, exclusion, and rewrite controls
- Responsive narrow-screen layout

### Potential impact

- Solves context rot and prompt/tool conflict in production agents
- Gives teams a repeatable alternative to manual prompt archaeology
- Reduces tokens only when task-specific evidence supports removal
- Turns one measured finding into a portable regression check, so an obsolete endpoint cannot quietly return in the same task contract

### Quality of idea

- Treats context as an experimentally profiled dependency graph
- Finds harmful context, not merely long context
- Combines debugging, evaluation, optimization, and regression evidence

## Final manual actions

1. Upload `submission/video/out/context-mri-demo.mp4` publicly or unlisted to YouTube and add the URL to Devpost.
2. Open the YouTube link in a private window to confirm it is viewable without your account.
3. Confirm the Devpost form accepts the captured Codex session ID; if it specifically requires an ID emitted by `/feedback`, run `/feedback` in this task and use the displayed ID.
4. Submit before **July 21, 2026 at 5:00 PM PDT**.

## Verified public judge path

- URL: https://context-mri.ezra-westover1.chatgpt.site
- Anonymous page load: passed
- Evidence trace inspector: passed
- Full fixture MRI replay: passed
- Recommended pack staging: passed at 1,602 tokens
- Reduced-pack second experiment and distinct verification report: passed on the production endpoint
- Browser console errors or warnings: none
