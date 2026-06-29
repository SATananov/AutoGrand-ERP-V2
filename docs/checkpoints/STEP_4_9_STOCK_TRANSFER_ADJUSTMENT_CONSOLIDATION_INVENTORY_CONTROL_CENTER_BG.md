# Checkpoint — Step 4.9 Stock Transfer / Adjustment Consolidation & Inventory Control Center

## Статус

Подготвен като changed-files patch върху чист Step 4.8.6 checkpoint.

## Обхват

Step 4.9 добавя read-only Inventory Control Center, който консолидира завършените складови корекции и наличните складови трансфери.

## Важно

Тази стъпка не променя бизнес логиката за:

- posting lock;
- movement binding;
- movement trace;
- audit / reversal safety;
- operator workflow hardening.

Тя добавя контролен/операторски изглед и QA повърхност за следващите inventory control стъпки.

## Очаквани проверки

- `npm run check`
- `node scripts/step-4-8-1-stock-adjustment-smoke.cjs`
- `node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs`
- `node scripts/step-4-8-3-stock-adjustment-movement-trace-visibility-smoke.cjs`
- `node scripts/step-4-8-4-stock-adjustment-audit-reversal-safety-smoke.cjs`
- `node scripts/step-4-8-5-stock-adjustment-operator-workflow-smoke.cjs`
- `node scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs`
- `node scripts/step-4-9-stock-control-center-smoke.cjs`

## Clean export правило

След apply script-а трябва да се изтрият:

- `apply_step_4_9_stock_control_center.ps1`
- `changed-files/`

и `git status --short` трябва да показва само реалните Step 4.9 файлове преди commit.
