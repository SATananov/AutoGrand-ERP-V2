# Step 4.8.6.6 - Final QA smoke surface repair

This checkpoint repairs the Step 4.8.6 final QA smoke script.

Purpose:
- keep the final QA smoke ASCII-only;
- avoid brittle checks for one exact implementation word;
- verify real stock adjustment integration surfaces;
- preserve the Step 4.8.1-4.8.5 business logic untouched;
- keep clean export hygiene checks active after apply cleanup.

No stock adjustment posting, movement binding, audit, reversal, or operator workflow business behavior is changed by this repair.
