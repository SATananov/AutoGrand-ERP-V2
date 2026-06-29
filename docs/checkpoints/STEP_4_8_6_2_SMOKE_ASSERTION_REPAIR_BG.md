# Step 4.8.6.2 Smoke Assertion Repair

This checkpoint repairs the Step 4.8.6 final QA smoke script only.

Scope:
- keep stock adjustment business logic unchanged;
- replace brittle literal assertion for posting lock wording with flexible safety markers;
- keep the smoke script ASCII-only;
- keep clean export hygiene and mojibake checks active.

Expected validation:
- npm run check
- Step 4.8.1 smoke
- Step 4.8.2 smoke
- Step 4.8.3 smoke
- Step 4.8.4 smoke
- Step 4.8.5 smoke
- Step 4.8.6 smoke
