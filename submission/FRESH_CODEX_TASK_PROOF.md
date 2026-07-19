# Five fresh Codex task proof

## Result

**5/5 fresh Codex tasks passed** the installed-plugin orchestration contract for the bundled Security Release workflow.

Each run started in a fresh ephemeral Codex task with the installed Context MRI plugin and had to:

1. discover and call the plugin;
2. call `diagnose_context_pack` exactly once;
3. reuse the returned short-lived `guardRef`;
4. verify the original pack as **blocked at 53/100**;
5. verify the repaired pack as **passed at 100/100**; and
6. preserve contract, artifact, and recommended-pack fingerprint integrity.

Four runs optionally inspected `describe_evaluators`; one correctly proceeded directly to diagnosis. No run produced an MCP error, repeated the unchanged diagnosis, or required transcription of the full guard.

## What this proves—and what it does not

This is evidence of **installation, plugin discovery, tool selection, guard handoff, and orchestration reliability** across five fresh Codex tasks.

It does not prove broad model causation, semantic generalization, or production safety. The diagnosis itself remains controlled, task-specific deterministic fixture evidence.

## Sanitized public artifact

The machine-readable record is [`FRESH_CODEX_TASK_PROOF.json`](./FRESH_CODEX_TASK_PROOF.json).

SHA-256:

```text
49e1ae3a9910ff31632d65677b27bb9eda798f7a89a21ff0d5d66040f5ab5134
```

It publishes only tool names, outcomes, timestamps, report IDs, representative prompt hashes, guard fingerprints, integrity booleans, plugin version, model, and sandbox mode.

It does **not** publish private prompts, full Codex transcripts, raw context, source files, account data, or usage metadata.
