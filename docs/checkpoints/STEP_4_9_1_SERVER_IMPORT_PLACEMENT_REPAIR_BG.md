# Step 4.9.1 Server Import Placement Repair

Purpose:
- Move stock control center router import into the top-level ES module import block.
- Keep the stock control center API route mount.
- Run syntax checks, project check, stock adjustment smoke checks, and Step 4.9 smoke.
- No business logic changes.

This repair protects the Step 4.9 Stock Control Center apply flow after an import was inserted below executable code in src/server.js.