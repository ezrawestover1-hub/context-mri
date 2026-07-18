# GPT-5.6 Terra final-submission audit

**Where it happened:** Codex, using GPT-5.6 Terra with high reasoning

**Scope:** Context MRI's independent evaluator, fixture/live provenance, applied-pack verification, demo-video claims, and Devpost submission plan.

## Findings and decisions

1. **Do not make paid API quota an eligibility gate.** The public judge path is intentionally a deterministic fixture replay, and Build Week's free-tier guidance says a project only needs a meaningful GPT-5.6 contribution. The optional Responses API runner remains in the repository, but funded API evidence is not required to submit or judge the product.

2. **The final video must describe a real GPT-5.6 contribution, not merely name an optional model path.** The scene-eight pickup now explains that GPT-5.6 Terra was used in Codex to adversarially review the evaluator, fixture claims, and final judge flow.

3. **Trust boundaries must stay explicit.** The public product labels its 21 records as a deterministic fixture replay, keeps the optional live API path separate, and does not represent fixture output as fresh model evidence.

4. **The evaluator needs regression protection against misleading prose.** The test suite confirms that a response cannot earn recency, legacy, or conflict points merely by negating those claims. The subject returns an endpoint and explanation; application code assigns rubric points.

## Actions completed from this audit

- Removed API billing from the submission-critical checklist.
- Reframed the optional live API runner honestly in the README and Devpost copy.
- Updated the scene-eight narration, captions, recording booth, and visual to explain both Codex and GPT-5.6 Terra.
- Retained the fixture/live distinction and the independent-evaluator regression tests.

## Evidence and limitation

This is a documented GPT-5.6 Terra Codex contribution to the project, not a claim that the public fixture contains fresh API traces. The public app remains self-contained for judges; the optional live runner is available only to funded API projects.
