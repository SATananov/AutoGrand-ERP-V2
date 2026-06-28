# Checkpoint — Step 4.2 Users + Employees + Roles + Permissions

## Версия

```text
0.4.2
```

## Health label

```text
4-2-users-employees-roles-permissions-foundation
```

## Тип

Foundation checkpoint.

## Съдържание

Step 4.2 добавя реална основа за потребители, служители, роли, права и достъп до обекти.

## Нови модели

```text
Employee
Role
Permission
RolePermission
UserLocationAccess
UserPermissionOverride
```

## Разширен User

```text
employeeId
roleId
defaultLocationId
passwordHash
language
isActive
lastLoginAt
```

## Роли

```text
ADMIN       Администратор
MANAGER     Управител обект
SALES       Продажби
WAREHOUSE   Склад
ACCOUNTING  Счетоводство
READONLY    Само преглед
```

## Права

Правата са изградени по Moneta-like действия:

```text
read
insert
edit
delete
finish
print
export
edit_props
annul
```

## Development users

```text
stefan
kj_manager
kj_sales
kj_stock
stz_stock
readonly
```

Реалните имена и роли ще бъдат въведени в следваща стъпка, когато потребителят ги предостави.

## Нови екрани

```text
/screen/users
/screen/employees
/screen/roles
/screen/permissions
```

## Забележка

Тази стъпка променя Prisma schema. След прилагане трябва да се изпълни:

```powershell
npm run db:generate
```

След това се пускат стандартните проверки.
