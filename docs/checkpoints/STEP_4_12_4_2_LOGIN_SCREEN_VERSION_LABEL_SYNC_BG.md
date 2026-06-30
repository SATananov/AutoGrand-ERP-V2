# Checkpoint — Step 4.12.4.2 Login Screen Version Label Sync

Стъпката синхронизира runtime version label-а на login/shell UI към `v0.4.42`, така че видимият екран да не показва старата работна версия `v0.4.10`.

## Очакван резултат

- Login екранът показва `v0.4.42 · работна версия`.
- Runtime views/public не съдържат стария hardcoded label `v0.4.10`.
- Package metadata е `0.4.42`.
- Inventory Planning block остава module-closed through Step 4.12.4.1.

## Guardrails

Това е само UI/version-label sync. Няма промяна по stock posting, reversal, correction, movement journal, Prisma schema или POSTED document locks.

