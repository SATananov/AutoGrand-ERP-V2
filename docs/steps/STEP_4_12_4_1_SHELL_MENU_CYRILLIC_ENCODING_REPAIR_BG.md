# Step 4.12.4.1 — Shell Menu Cyrillic Encoding Repair

This repair closes a visible shell/menu encoding issue after the Inventory Planning module closure.

## Scope

- Rewrites `views/partials/sidebar.hbs` as a clean UTF-8 Bulgarian menu.
- Keeps AutoGrand green Moneta-like shell behavior.
- Adds a dedicated smoke check for shell Cyrillic labels and planning links.
- Updates version to `0.4.41`.

## Guardrails

- No Prisma schema change.
- No stock posting change.
- No reversal or correction change.
- No stock movement journal mutation.
- No direct edit/delete of the stock journal.
- POSTED documents remain locked.

## Expected result

The left ERP menu must display normal Bulgarian text such as `Меню`, `Продажби`, `Доставки`, `Наличности`, `Контрол на склада`, and `Планиране на наличности`.
