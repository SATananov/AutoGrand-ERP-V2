# Step 4.9.2 — Stock Control Center Operational Filters / Risk Panels / Quick Actions

## Цел

Step 4.9.2 надгражда Stock Control Center с операторски филтри, risk panels и quick actions.
Слоят остава read-only и не променя вече затворената Step 4.8 posting / reversal логика.

## Добавено

- Operational filters: all, transfers, adjustments, risk.
- Risk panels за отрицателна наличност, POSTED без lock, missing trace и manual journal edit.
- Quick actions към безопасни stock екрани.
- API endpoints за filters, risk panels, quick actions и operational dashboard.
- UI блокове за filter strip, risk panel list и quick action list.
- Smoke coverage за Step 4.9.2.

## Правила

- Stock journal не се редактира ръчно.
- POSTED документи остават locked.
- Correction/reversal минава през документ.
- Control Center е read-only consolidation слой.
