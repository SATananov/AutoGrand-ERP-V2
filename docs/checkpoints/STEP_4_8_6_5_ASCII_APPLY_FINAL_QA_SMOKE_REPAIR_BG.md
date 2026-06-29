# Step 4.8.6.5 ASCII apply / final QA smoke repair

Purpose: repair the Step 4.8.6 final QA smoke script and apply script so both are ASCII-only and safe for Windows PowerShell 5.1.

Scope:
- rewrites only scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs;
- does not change stock adjustment posting, movement binding, trace, audit, reversal, or operator workflow business logic;
- keeps the final QA / clean export checkpoint focused on active files and smoke coverage.

Status: repair checkpoint for Step 4.8.6 final QA closeout.
