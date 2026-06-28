# Checkpoint — Step 4.3 Login Context like Moneta

## Версия

```text
0.4.4
```

## Health label

```text
4-3-login-context-like-moneta
```

## Добавени / променени ключови файлове

```text
src/services/login-context-service.js
views/pages/login.hbs
views/layouts/main.hbs
public/css/styles.css
src/server.js
scripts/seed-prisma.js
package.json
scripts/check-project.mjs
docs/steps/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_BG.md
docs/checkpoints/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_CLEAN_EXPORT_BG.md
```

## Потвърдено поведение

- `/login` показва вход по фирма, обект, потребител, парола и език.
- Потребителите се филтрират според избрания обект.
- Временната работна парола е `1234`.
- След вход top/status bar показват реалния потребител, роля и текущ обект.
- `/logout` изчиства login context.
- Без активна сесия нормалните ERP страници пренасочват към `/login`.

## Посока

Следваща логична стъпка:

```text
Step 4.4 — Items, Units, VAT, Prices and Suppliers Foundation
```

или отделна security стъпка за реални пароли и permission guards.
