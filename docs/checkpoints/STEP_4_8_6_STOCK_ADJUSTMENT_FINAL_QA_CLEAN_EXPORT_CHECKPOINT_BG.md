# Checkpoint — Step 4.8.6 Stock Adjustment Final QA / Clean Export Checkpoint

## Статус

Step 4.8.6 е финален QA / clean export checkpoint за блока складови корекции.

## Завършена верига

- Step 4.8 — Stock Correction / Adjustment Document Foundation
- Step 4.8.1 — Persistent Stock Adjustment Documents + Posting Lock
- Step 4.8.2 — Real Stock Adjustment Posting Integration / Movement Binding
- Step 4.8.3 — Stock Adjustment Posting UI / Movement Trace Visibility
- Step 4.8.4 — Stock Adjustment Audit / Reversal Safety Layer
- Step 4.8.5 — Stock Adjustment Final Polish / Operator Workflow Hardening
- Step 4.8.6 — Stock Adjustment Final QA / Clean Export Checkpoint

## Добавено

- `scripts/step-4-8-6-stock-adjustment-final-qa-clean-export-smoke.cjs`
- финален Step 4.8.6 marker в `src/server.js`
- Step 4.8.6 metadata marker в `package.json` / `package-lock.json`
- документация за final QA и clean export режим

## Проверки

Финалният smoke script проверява:

- ключови service / route / view файлове;
- всички stock adjustment smoke scripts от Step 4.8.1 до Step 4.8.6;
- movement trace visibility;
- reversal safety UI;
- operator workflow UI;
- mojibake guard за активните файлове;
- clean export hygiene.

## Clean export критерий

Clean export не трябва да съдържа:

- `apply_step_4_8_*.ps1` файлове;
- `changed-files` папка;
- разархивирани changed-files ZIP папки;
- `.bak` или step backup артефакти.

## Moneta правило

Stock adjustment модулът остава в Moneta стил:

- няма триене на исторически складови движения;
- няма ръчна редакция на journal-а;
- грешна POSTED корекция се поправя чрез нов reversal draft;
- POSTED документът остава заключен;
- DRAFT документът остава операторски editable.
