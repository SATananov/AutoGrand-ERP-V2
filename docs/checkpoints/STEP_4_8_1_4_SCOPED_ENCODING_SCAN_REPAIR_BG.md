# Step 4.8.1.4 - Scoped Encoding Scan Repair

Purpose:
- Step 4.8.1 npm check and smoke are already passing.
- The previous helper script used a repository-wide encoding scan and stopped on an older blueprint document.
- This repair preserves Step 4.8.1 logic, repairs only explicit replacement-marker corruption in the known legacy blueprint when present, and then runs a scoped encoding scan over files currently staged/modified for this step.

Moneta rule preserved:
- no old stock movements are deleted;
- no manual stock journal editing is introduced;
- stock adjustment documents remain DRAFT -> POSTED with lock after posting.
