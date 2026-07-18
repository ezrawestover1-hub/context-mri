# Context Guard example

This pair demonstrates the artifact that Context MRI exports after a recommended pack is applied. The evidence export deliberately retains the full original input while declaring the active pack IDs; the CI runner uses those IDs and therefore tests the repaired three-file pack.

```bash
npm run guard:check -- \
  --guard samples/context-guard/support-api-migration.guard.json \
  --context samples/context-guard/support-api-migration-repaired.evidence.json
```

The example exits successfully at `92/100`. Remove the `decision.activeContextIds` field to demonstrate a nonzero failure against the stale full library.
