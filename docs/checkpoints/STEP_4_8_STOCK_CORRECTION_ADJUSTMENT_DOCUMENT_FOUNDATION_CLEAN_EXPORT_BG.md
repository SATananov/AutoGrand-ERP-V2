# Checkpoint — Step 4.8 Stock Correction / Adjustment Document Foundation

## Статус

Step 4.8 добавя безопасна основа за складови корекционни документи върху Step 4.7 audit/resolution слоя.

## Проверки

- Новата страница `/stock-adjustments` се рендерира в ERP shell.
- API `/api/stock/adjustments/foundation` връща типове документи, причини, status flow, storage compatibility и предложени draft корекции.
- API `/api/stock/adjustments/preview` валидира и визуализира корекционен документ без запис в база.
- API `/api/stock/adjustments/from-issue` генерира draft от отрицателна наличност или дублирано движение.
- `/stock-hardening` има връзка към новата страница.

## Правило

Корекцията не трябва да бъде SQL update/delete върху стар складов запис. Тя трябва да бъде отделен документ и нов контролируем складов ефект.
