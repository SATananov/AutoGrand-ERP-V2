# Step 4.8.6.3 Final QA Smoke Diagnostic Repair

Status: repair patch for Step 4.8.6 final QA smoke.

Purpose:
- keep Step 4.8.6 as final QA / clean export checkpoint;
- avoid brittle exact wording assertions in the final smoke;
- keep the smoke ASCII-only to avoid PowerShell 5.1 and mojibake issues;
- preserve the stock adjustment business logic from Steps 4.8.1 - 4.8.5.

Scope:
- rewrites only scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs;
- adds this checkpoint document;
- does not edit posting, movement binding, audit, reversal, or operator workflow logic.

Expected validation:
- npm run check
- Step 4.8.1 smoke
- Step 4.8.2 smoke
- Step 4.8.3 smoke
- Step 4.8.4 smoke
- Step 4.8.5 smoke
- Step 4.8.6 smoke
