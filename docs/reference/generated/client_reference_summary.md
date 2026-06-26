# AutoGrand Moneta Reference Summary — Step 0.1

Този файл е генериран от двата reference ZIP-а. Бинарни файлове не са копирани и не са изпълнявани.

## Private data rule

Логовете са от реален твой обект. Безопасните summary отчети са в `docs/reference/generated/`. Суровите diagnostic редове и identifier кандидати са отделени в `docs/reference/private/` и са само за локална работа.

## Sources

- `Client_REFERENCE_source-only_20260625_1447(4).zip`
  - SHA256: `fa187adaccc90638753335d76d99f1a6f933c2f5b9e6056d6156cbafe5036566`
  - entries: 895
  - uncompressed bytes: 987990748
  - unique BPL packages: 345
  - log files: 194
  - bad CRC entry: None
  - dangerous paths: 0
- `ZipMasterR23.zip`
  - SHA256: `c165519ee1217e370f1b5c976d58a7fd5e4be954e894bb07f7df87bc8b6491ed`
  - entries: 717
  - uncompressed bytes: 997440341
  - unique BPL packages: 345
  - log files: 6
  - bad CRC entry: None
  - dangerous paths: 0

## Mapped ERP modules

- `BasePackage` → **ERP основа** → `src/modules/base`
- `NomenclaturesPackage` → **Номенклатури** → `src/modules/nomenclatures`
- `SalesPackage` → **Продажби** → `src/modules/sales`
- `InventoryPackage` → **Склад** → `src/modules/inventory`
- `CRMPackage` → **CRM** → `src/modules/crm`
- `PurchasePackage` → **Доставки** → `src/modules/purchase`
- `AccountingPackage` → **Счетоводство** → `src/modules/accounting`
- `CommercePackage` → **Търговия** → `src/modules/commerce`
- `VehiclePackage` → **Автомобили** → `src/modules/vehicles`
- `ServicePackage` → **Сервиз** → `src/modules/service`
- `FixedAssetPackage` → **Дълготрайни активи** → `src/modules/fixed-assets`
- `ProductionPackage` → **Производство** → `src/modules/production`
- `ReservPackage` → **Резервации** → `src/modules/reservations`
- `JobPackage` → **Задачи и операции** → `src/modules/jobs`
- `AdvancedPackage` → **Разширени функции** → `src/modules/advanced`
- `TourPackage` → **Турове** → `src/modules/tour`
- `DevicePackage` → **Устройства** → `src/modules/devices`

## Top diagnostic categories

- Exception: 77768
- Access violation: 1200
- Validation issue: 1134
- Connection issue: 845
- ParentConnection is not assigned: 755
- Dataset issue: 560
- Dataset not in edit or insert mode: 266
- SQL/Database issue: 201
- Diagnostic: 140
- Transaction issue: 50
- Server issue: 21

## Generated files

- `zip_audit.json`
- `reference_sources.json`
- `module_map.json`
- `log_error_summary.json`
- `package_inventory.csv`
- `zipmaster_reference_notes.md`
- `../private/private_log_diagnostic_lines.csv`
- `../private/private_log_identifiers.csv`