# AutoGrand ERP V2 — Step 4.7.3 Stock Hardening View Lookup Repair

## Цел

Step 4.7.3 поправя начина, по който страницата `/stock-hardening` намира Handlebars view файла.

При текущата Express конфигурация директорията за views може да бъде `views/pages`, затова `res.render("pages/stock-hardening-audit")` търси файл в `views/pages/pages/stock-hardening-audit.hbs` и връща грешка.

## Промяна

- Route-ът вече опитва първо `stock-hardening-audit`.
- Ако проектът е с друг view root, има fallback към `pages/stock-hardening-audit`.
- API endpoint-ите остават същите.
- Audit резултатът продължава да показва реалните складови предупреждения: отрицателни наличности и потенциално дублирани движения.

## Проверка

- `/api/stock/hardening/ping` трябва да върне `ok: true`.
- `/stock-hardening` трябва да отвори Moneta-like страницата за складов контрол.
- `/api/stock/hardening/audit` трябва да върне JSON audit.
