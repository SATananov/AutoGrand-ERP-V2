# Checkpoint — Step 4.8.5 Stock Adjustment Final Polish / Operator Workflow Hardening

## Статус

Step 4.8.5 добавя финален операторски workflow hardening слой за складови корекции.

## Основна идея

След Step 4.8.4 системата вече има persistent documents, posting lock, real movement binding, movement trace visibility и audit / reversal safety. Step 4.8.5 прави работата по-ясна за оператора:

- какво може да се прави в DRAFT;
- какво е блокирано в POSTED;
- кога се използва reversal draft;
- какви причини се очакват;
- какви съобщения трябва да се показват при грешки.

## Safety правила

- Не се трият стари движения.
- Не се редактира ръчно stock journal.
- POSTED документът остава locked.
- Reversal документът е нов DRAFT, не автоматичен silent fix.
- UI обяснява поведението преди операторът да натисне действие.

## Smoke marker

`STEP_4_8_5_OPERATOR_WORKFLOW_HARDENING`
