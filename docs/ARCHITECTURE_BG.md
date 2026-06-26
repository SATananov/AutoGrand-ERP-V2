# Архитектура — Step 0.1

Проектът е нов Node.js / Express / Handlebars ERP shell.

## Слоеве

```text
src/server.js                  Express app
src/services/reference-service.js
src/data/                      JSON snapshot за UI
views/                         Handlebars страници
public/                        CSS/JS за browser UI
tools/                         Python reference анализатори
docs/reference/generated/      безопасни summary отчети
docs/reference/private/        локални private log extract-и
```

## Reference принцип

Двата Moneta/Client ZIP-а не се копират като runtime dependency. Анализаторът чете ZIP metadata и log текстове, но не изпълнява binaries.

## Следваща архитектурна стъпка

Step 1 ще добави база данни и core domain entities:

- клиенти
- артикули
- складове
- ценови листи
- документи
- продажби
- доставки
