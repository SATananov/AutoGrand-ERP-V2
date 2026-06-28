# Roadmap — AutoGrand ERP V2

## Стабилен checkpoint

`fed2af4 Add Step 3.5 transfer print workflow and purpose comments` е стабилният функционален checkpoint преди Step 4.0.

## Step 4.0 — Master Blueprint + Moneta Reference Audit

Целта е да се спре хаотичното надграждане и да се заключи голямата ERP карта:

- AutoGrand Core;
- Номенклатури;
- Склад;
- Продажби;
- Доставки;
- CRM;
- Сервиз;
- Финанси;
- Устройства и печат.

Reference архивите от Moneta се използват само за архитектурна ориентация. AutoGrand ERP остава собствена система.

## Следваща последователност

```text
Step 4.1 — Core Master Data Foundation
Step 4.2 — Users, Employees, Roles and Permissions
Step 4.3 — Items, Units, VAT, Prices and Suppliers Foundation
Step 4.4 — Demo Dataset / Working Test Base
Step 4.5 — Global Grid Column Preferences
Step 4.6 — Global Document Pattern Cleanup
Step 4.7 — Global Print Forms Engine
Step 4.8 — Stock Engine Hardening
Step 5.0 — Sales Module Completion
Step 6.0 — Purchases Module Completion
Step 7.0 — Service / Vehicles Foundation
Step 8.0 — Finance / Payments / Reports
```

## Правило за следващите стъпки

Преди да се прави нов голям модул, трябва да се проверява дали липсва foundation таблица, право, статус, печатна форма или grid настройка.
