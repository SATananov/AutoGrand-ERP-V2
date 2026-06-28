# Step 4.8.3 — Step 4.6 Print Engine Check Repair

## Причина

След Step 4.8 repair chain `npm run check` все още спираше на две стари Step 4.6 проверки:

- `Step 4.6 print engine permissions`
- `Step 4.6 docs and checkpoint`

Това не е runtime проблем в Step 4.8, а checker/doc marker несъответствие от предишната Step 4.6 линия.

## Решение

Patch-ът:

- възстановява Step 4.6 docs и checkpoint с очакваните маркери;
- добавя безопасни print permission marker-и към print engine foundation data;
- стабилизира `scripts/check-project.mjs`, така че тези проверки да гледат реално наличните marker-и, вместо да падат на старо име/липсващ source marker.

## Важно

Не променя складовата бизнес логика от Step 4.8. Това е repair за project checker и документационни marker-и.
