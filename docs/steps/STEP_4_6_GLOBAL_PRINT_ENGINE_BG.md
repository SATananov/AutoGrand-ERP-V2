# Step 4.6 — Global Print Engine

## Цел

Step 4.6 добавя глобален печатен engine за AutoGrand ERP V2 в Moneta-like ERP shell. Печатът се управлява централизирано, вместо всеки модул да прави собствена отделна print логика.

## Обхват

- Глобални форми за печат на документи.
- Канали за печат и визуализация.
- Секции за шаблони.
- Профили за печатни устройства.
- Runtime за browser print.
- Диагностична страница и health label.
- Permission markers за бъдещо включване към runtime permission guards.

## Маркери за project checker

- `PRINT_ENGINE_DOCUMENT_FORMS`
- `PRINT_ENGINE_CHANNELS`
- `PRINT_ENGINE_TEMPLATE_SECTIONS`
- `PRINT_ENGINE_DEVICE_PROFILES`
- `STEP_4_6_PRINT_ENGINE_HEALTH_LABEL`
- `getGlobalPrintEngineData`
- `getGlobalPrintEngineDiagnostics`
- `PRINT_ENGINE_PERMISSION_VIEW`
- `PRINT_ENGINE_PERMISSION_PREVIEW`
- `PRINT_ENGINE_PERMISSION_PRINT`
- `PRINT_ENGINE_PERMISSION_TEMPLATE`
- `PRINT_ENGINE_PERMISSION_DEVICE`
- `PRINT_ENGINE_PERMISSION_DIAGNOSTICS`
- `STEP_4_6_GLOBAL_PRINT_ENGINE_BG`
- `STEP_4_6_GLOBAL_PRINT_ENGINE_CLEAN_EXPORT_BG`

## Moneta правило

Печатът е глобална услуга над документи, справки и складови процеси. Разрешенията за печат трябва да се проверяват централизирано, а не да се дублират по екрани.

## Статус

Step 4.6 е завършен преди Step 4.7 и Step 4.8 и се третира като стабилен checkpoint.
