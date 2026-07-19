# Context Guard example

This pair demonstrates the artifact that Context MRI exports after a recommended pack is applied. The evidence export deliberately retains the full original input while declaring the active pack IDs; the CI runner uses those IDs and therefore tests the repaired three-file pack.

```bash
npm run guard:check -- \
  --guard samples/context-guard/support-api-migration.guard.json \
  --context samples/context-guard/support-api-migration-repaired.evidence.json
```

The example exits successfully at `92/100`. Remove the `decision.activeContextIds` field to demonstrate a nonzero failure against the stale full library.

The repository's [GitHub Actions workflow](../../.github/workflows/context-guard.yml) runs this exact check on relevant pull requests and main-branch changes. In a production repository, replace these sample paths with the downloaded guard and evidence export for the task you want to protect.
