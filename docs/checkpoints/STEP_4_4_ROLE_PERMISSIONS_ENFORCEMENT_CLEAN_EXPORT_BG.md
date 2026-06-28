# Clean Export Checkpoint — Step 4.4 Role Permissions Enforcement

Дата: 2026-06-28

## Идентификация

```text
Project: AutoGrand ERP V2
Step: 4.4
Name: Role Permissions Enforcement / Menu, Route & Action Guard
Version: 0.4.6
Health label: 4-4-role-permissions-enforcement-menu-route-action-guard
```

## Обхват

Този checkpoint добавя Moneta-like permission enforcement слой върху Step 4.3 / 4.3.1 Login Context.

## Променени / добавени файлове

```text
package.json
package-lock.json
public/css/styles.css
scripts/check-project.mjs
src/server.js
src/services/permission-service.js
views/layouts/main.hbs
views/pages/forbidden.hbs
docs/steps/STEP_4_4_ROLE_PERMISSIONS_ENFORCEMENT_BG.md
docs/checkpoints/STEP_4_4_ROLE_PERMISSIONS_ENFORCEMENT_CLEAN_EXPORT_BG.md
```

## Няма промяна в Prisma schema

```text
prisma/schema.prisma: not changed
prisma/dev.db: not changed by this patch
```

## Проверки

Очаквани проверки от `npm run check`:

```text
OK: Step 4.4 health label
OK: Step 4.4 version label
OK: Step 4.4 role permission grants
OK: Step 4.4 route guard rules
OK: Step 4.4 request guard middleware
OK: Step 4.4 menu and ribbon filtering
OK: Step 4.4 location-aware action guard
OK: Step 4.4 forbidden access page
OK: Step 4.4 shell permission scope visibility
OK: Step 4.4 docs and checkpoint
OK: Step 4.4 Role Permissions Enforcement / Menu, Route & Action Guard patch check passed.
```

## Рискове / бележки

- Това е първи enforcement слой и е умишлено консервативен.
- Ако някоя стара ribbon команда няма разпознаваем command/id/path, тя не се спира само заради липса на mapping.
- Директните routes и POST/DELETE actions вече се пазят централизирано.
- Admin override остава активен.
- По-фините ограничения по колони/полета остават за следваща стъпка.

## Ръчен smoke test

1. Login като admin профил.
2. Отвори продажби, доставки, склад, трансфери, обекти.
3. Login като sales/cashier/warehouse профил.
4. Пробвай директен URL към забранен модул.
5. Очаквай 403 екран с активен потребител, обект и нужно право.

## Commit message

```text
Step 4.4: enforce role permissions and menu access
```
