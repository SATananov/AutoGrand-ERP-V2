# Step 4.7.4.3 — Step 4.6 Docs Check Repair

## Причина

След Step 4.7.4.2 `scripts/check-project.mjs` вече не пада с `ReferenceError`, но проверката все още връща:

```text
MISSING: Step 4.6 docs and checkpoint
```

Причината е липсващи или непопаднали под очакваното име Step 4.6 документационни файлове.

## Промяна

Добавени са очакваните Step 4.6 documentation/checkpoint файлове:

- `docs/steps/STEP_4_6_GLOBAL_PRINT_ENGINE_BG.md`
- `docs/checkpoints/STEP_4_6_GLOBAL_PRINT_ENGINE_CLEAN_EXPORT_BG.md`

## Цел

Да се възстанови пълната checker верига, без промяна в runtime логиката на Step 4.7.4.
