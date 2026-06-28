# AutoGrand ERP V2 — Step 4.3 Login Context like Moneta

Този changed-files ZIP добавя работен ERP вход по модел:

```text
Фирма → Обект → Потребител → Парола → Език
```

Временна работна парола за seed потребителите:

```text
1234
```

След вход AutoGrand ERP показва активния потребител, роля и текущ обект в горната лента и статус бара.

Няма Prisma schema промяна спрямо Step 4.2.1, но ако локално не е пускан Step 4.2.1, изпълни `npm run db:generate`.
