# Step 4.8.6.1 ASCII Final QA Smoke Repair

Repair scope:
- Rewrites `scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs` as ASCII-only.
- Keeps Step 4.8.6 final QA intent.
- Does not change stock adjustment business logic.
- Avoids PowerShell 5.1 / mojibake false positives.

Validation:
- `node --check scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs`
- `npm run check`
- Step 4.8.1 through Step 4.8.6 smoke scripts.
