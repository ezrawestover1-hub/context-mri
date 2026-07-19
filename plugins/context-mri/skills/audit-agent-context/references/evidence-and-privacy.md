# Evidence and privacy language

## Evidence meanings

- **Baseline score:** Evaluator score with every supplied file present.
- **Omission score:** Score after removing one file while keeping the rest fixed.
- **Contribution:** Baseline minus omission score. A negative value means removal improved the measured result.
- **Paired agreement:** Number of matched repeats in which removal changed the score in the same direction.
- **Context Guard:** Fingerprinted, task-specific policy that checks the recommended pack, blocked terms, score threshold, and artifact integrity.

## Context classifications

- **Required:** Removing the file materially lowers the measured result.
- **Useful:** Removing the file causes a smaller but consistent loss.
- **Redundant:** Removing the file causes no meaningful measured change.
- **Harmful:** Removing the file materially improves the measured result.

Always scope classifications to the task and evaluator.

## Required claim language

Use:

> For this task under this evaluator, removing `FILE` changed the score from `A` to `B` across the measured repeats.

Avoid:

> `FILE` is bad context everywhere.

For fixture mode, add:

> This is deterministic, task-specific replay evidence. It proves the product workflow is reproducible, not that the finding generalizes to every model or task.

## Privacy boundary

- Processing happens inside the local plugin process.
- The free beta makes no network request.
- The plugin stores no context or history.
- The plugin receives only tool arguments selected by Codex from user-approved content.
- Raw context content is not echoed in diagnostic output.
- The plugin has no write tool; any repair is a separate Codex action governed by normal permissions.

## Unsupported requests

If no bundled evaluator matches, say that Context MRI cannot causally score that arbitrary task in free deterministic mode. Offer to:

1. Reframe the request to a supported evaluator.
2. Inspect likely conflicts qualitatively without presenting a causal score.
3. Use a future custom/live evaluator when available.
