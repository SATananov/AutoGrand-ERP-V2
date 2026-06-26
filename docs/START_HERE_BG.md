# START HERE — Step 0.1

1. Разархивирай проекта на Desktop.
2. Отвори папката във VS Code.
3. Пусни:

```powershell
npm install
npm run dev
```

4. Отвори `http://localhost:3000`.

## Reference анализ

Проектът вече съдържа генерирани reference отчети от двата ZIP-а. Ако искаш да ги регенерираш локално, сложи двата ZIP файла на Desktop и пусни:

```powershell
npm run analyze:references
```

## Private папка

`docs/reference/private/` съдържа реални diagnostic log редове и identifier кандидати от твоя обект. Това е локален материал за бъдещото изграждане на ERP логиката. Не го публикувай.
