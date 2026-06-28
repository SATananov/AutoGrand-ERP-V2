# Step 4.8.2 — Step 4.6 Docs Repair

## Цел

Възстановява липсващите документационни файлове за Step 4.6, които проектният checker очаква.

## Причина

При прилагане на Step 4.8 checker-ът спря с:

`MISSING: Step 4.6 docs and checkpoint`

Това е документационна липса, не runtime проблем в Stock Adjustment Foundation.

## Промяна

Добавени са:

- `docs/steps/STEP_4_6_GLOBAL_PRINT_ENGINE_BG.md`
- `docs/checkpoints/STEP_4_6_GLOBAL_PRINT_ENGINE_CLEAN_EXPORT_BG.md`

## Статус

Repair patch. Не променя бизнес логика, маршрути, услуги или база данни.
