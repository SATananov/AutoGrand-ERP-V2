# Step 4.9.2.1 — Version Guard Repair

Поправя само QA compatibility guard-а след Step 4.9.2.

Причина:
- Step 4.9.2 обновява версията до `0.4.21`.
- Старият Step 4.8.6 smoke все още приемаше само `0.4.18`, `0.4.19`, `0.4.20`.

Обхват:
- Добавя `0.4.21` към package version compatibility проверките в stock QA smoke scripts.
- Не променя posting, reversal, movement binding или stock journal логиката.
- Запазва Step 4.9.2 като read-only operational Control Center слой.
