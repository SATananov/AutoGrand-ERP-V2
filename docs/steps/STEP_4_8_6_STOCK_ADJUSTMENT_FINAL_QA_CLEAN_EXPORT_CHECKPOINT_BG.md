# Step 4.8.6 — Stock Adjustment Final QA / Clean Export Checkpoint

## Цел

Step 4.8.6 затваря блока за складови корекции като финален QA и clean export checkpoint. Тази стъпка не добавя нова бизнес логика към осчетоводяването, а проверява и документира, че веригата от Step 4.8 до Step 4.8.5 е завършена, проследима и безопасна за операторска работа.

## Обхват

Проверяват се следните слоеве:

- foundation / preview слой за складови корекции;
- persistent DRAFT / POSTED документи;
- posting lock;
- real stock movement binding;
- movement trace visibility;
- audit и reversal safety;
- operator workflow hardening;
- clean export hygiene.

## Moneta правило

Финалното правило остава непроменено:

- старите складови движения не се трият;
- складовият журнал не се редактира ръчно;
- грешна POSTED корекция се поправя чрез нов обратен документ;
- DRAFT документът може да се редактира;
- POSTED документът е заключен;
- повторен POST не трябва да създава втори складов ефект.

## QA проверки

Добавен е финален smoke script:

```bash
node scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs
```

Той проверява:

- наличност на ключовите Step 4.8.1–4.8.6 файлове;
- наличност на всички smoke scripts за stock adjustment веригата;
- наличие на Step 4.8.6 marker в `src/server.js` и `package.json`;
- запазване на movement trace UI;
- запазване на reversal safety UI;
- запазване на operator workflow UI;
- липса на mojibake markers в активните stock adjustment файлове;
- липса на apply / changed-files / backup артефакти при clean export.

## Clean export режим

При нормален apply run script-ът допуска временни apply артефакти чрез environment flag. След cleanup финалното стартиране трябва да бъде без този flag, за да гарантира, че repository root е чист от временни файлове.

## Очакван финал

След Step 4.8.6 финалната проверка трябва да бъде:

```bash
npm run check
node scripts/step-4-8-1-stock-adjustment-smoke.cjs
node scripts/step-4-8-2-stock-adjustment-movement-binding-smoke.cjs
node scripts/step-4-8-3-stock-adjustment-movement-trace-visibility-smoke.cjs
node scripts/step-4-8-4-stock-adjustment-audit-reversal-safety-smoke.cjs
node scripts/step-4-8-5-stock-adjustment-operator-workflow-smoke.cjs
node scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs
git status --short
```

`git status --short` трябва да бъде празен след commit и push.
