# Step 4.8.1 — PowerShell 5.1 Safe Apply Repair

Тази ремонтна подстъпка не променя функционалната посока на Step 4.8.

Целта е да направи apply процеса безопасен за Windows PowerShell 5.1:

- премахва PowerShell parsing риск от кирилица в `.ps1`;
- използва Node за JSON metadata update и BOM-safe JSON parse;
- запазва Step 4.8 foundation файловете;
- оставя корекциите като документна основа, без директно триене на складови движения.

Step 4.8 остава: Stock Correction / Adjustment Document Foundation.
