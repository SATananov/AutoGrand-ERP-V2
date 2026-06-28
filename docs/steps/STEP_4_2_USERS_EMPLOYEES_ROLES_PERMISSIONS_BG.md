# Step 4.2 — Users + Employees + Role Permission Foundation

## Цел

Тази стъпка изгражда основата за реален ERP вход и права по AutoGrand начин, като използва Moneta само като reference за структурата на правата.

Ключовият принцип е:

```text
Фирма → Обект → Потребител → Роля → Конкретни права
```

Това подготвя бъдещия login екран в стил AutoGrand:

```text
Фирма: Автогранд ООД
Обект: Кърджали
Потребител: ...
Парола: ...
Език: BG / EN
```

## Какво добавя

Добавени са foundation модели:

```text
Employee
Role
Permission
RolePermission
UserLocationAccess
UserPermissionOverride
```

`User` е разширен с:

```text
employeeId
roleId
defaultLocationId
passwordHash
language
isActive
lastLoginAt
```

Старото поле `role` остава за съвместимост със старите екрани.

## Moneta reference логика

От Moneta файловете се вижда права по действия, не само роли. Затова AutoGrand използва шаблони роли + конкретни права.

Moneta-like права:

```text
ReadRight      → Преглед
InsertRight    → Добавяне
EditRight      → Редакция
DeleteRight    → Изтриване
FinishRight    → Приключване / осчетоводяване
PrintRight     → Печат
ExportRight    → Експорт
EditPropsRight → Настройки / свойства
AnnulRight     → Анулиране
```

## Seed роли

Добавени са начални шаблони роли:

```text
Администратор
Управител обект
Продажби
Склад
Счетоводство
Само преглед
```

Това са работни шаблони. Реалните потребители и точни права ще се настроят след като потребителят даде реални имена и роли.

## Демо потребители

Добавени са безопасни демонстрационни потребители:

```text
stefan      → Администратор
kj_manager  → Управител Кърджали
kj_sales    → Продажби Кърджали
kj_stock    → Склад Кърджали
stz_stock   → Склад Централен
readonly    → Само преглед
```

Тези профили са за development foundation. Паролите са placeholder и не са production login логика.

## Достъп по обект

Всеки потребител има достъп до един или повече обекти чрез `UserLocationAccess`.

Пазят се:

```text
може да влиза в обекта
обект по подразбиране
може да продава
може да заявява трансфер
може да изпраща трансфер
може да приема трансфер
```

Това е важно, защото AutoGrand ERP работи по текущ обект, не само по текущ потребител.

## Нови admin екрани през browse engine

Добавени са екрани:

```text
/screen/users
/screen/employees
/screen/roles
/screen/permissions
```

В менюто Администриране вече има:

```text
Потребители
Служители
Роли и права
Права
```

## Какво не прави още

Тази стъпка не прави истински login с пароли. Това е foundation слой.

Следваща логична стъпка:

```text
Step 4.3 — AutoGrand Login Context Screen
```

Там ще се направи реалният вход:

```text
Фирма / Обект / Потребител / Парола / Език
```

## Проверка

След прилагане трябва да се изпълни:

```powershell
npm run db:generate
node scripts/check-project.mjs
node --check src/server.js
node --check scripts/seed-prisma.js
node --check src/data/autogrand-identity-foundation.js
node --check src/services/core-data-service.js
```
