# Checkpoint — Step 4.7.3 Stock Hardening View Lookup Repair

Step 4.7.3 поправя render lookup проблема за `/stock-hardening`.

Проблемът беше, че Express търсеше `pages/stock-hardening-audit` в директория `views/pages`, което води до грешен път `views/pages/pages/stock-hardening-audit.hbs`.

След patch-а route-ът използва безопасен fallback render:

1. `stock-hardening-audit`
2. `pages/stock-hardening-audit`

API audit-ът остава активен и правилно маркира реални складови несъответствия за следваща hardening/data cleanup стъпка.
