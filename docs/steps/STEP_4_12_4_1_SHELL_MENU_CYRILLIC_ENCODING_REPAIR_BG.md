# Step 4.12.4.1 — Shell Menu Cyrillic Encoding Repair

## Цел

Тази междинна repair стъпка поправя mojibake проблем в `views/partials/sidebar.hbs`, при който българските етикети в лявото ERP меню се визуализират като `РњРµ...`, `Рџ...`, `С‚...` вместо като нормална кирилица.

## Обхват

- Поправя само shell/sidebar navigation labels.
- Добавя smoke check за кирилицата в менюто.
- Вдига версията до `0.4.41`.
- Не добавя нов ERP модул.
- Не променя складови posting/reversal/correction правила.
- Не променя stock movement journal.

## Guardrails

Inventory Planning остава read-only / decision-support слой. Тази стъпка е UI encoding repair и не създава документи, движения или journal записи.
