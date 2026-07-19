# Context MRI for Codex

Context MRI is a free, local-first Codex plugin that finds which supplied context file changed an agent result, helps Codex propose a minimal repair, and verifies the repaired pack with a fingerprinted Context Guard.

## What it proves

The competition build exposes a complete native workflow:

1. Describe the task-specific evaluator.
2. Remove one context file at a time and measure the effect.
3. Inspect the finding, rubric, traces, hashes, and limitations.
4. Let Codex propose a repair through normal permissions.
5. Verify that the repaired pack passes and the original remains blocked.

## Privacy

- Local stdio MCP process
- No network requests
- No account, API key, or billing
- No context retention
- No automatic repository or chat-history access
- No write-capable plugin tools

Only context explicitly supplied to a tool is processed. Diagnostic output does not echo raw context content.

## Install from this repository

From the repository root:

```bash
npm install
npm run build:plugin
codex plugin marketplace add .
codex plugin add context-mri@personal
```

Start a new Codex task after installation so the bundled skill and MCP tools load cleanly.

## Try it

Ask:

> Use Context MRI to run the bundled Security Release diagnostic. Explain the evidence, propose the smallest safe repair, and verify the recommended pack.

The bundled example is intentionally labeled deterministic fixture replay. It demonstrates reproducible product behavior; it is not presented as broad proof that the result generalizes to every model or task.

## Develop and verify

```bash
npm run test:plugin
npm run build:plugin
npm run check:plugin
npm test
npm run build
```
