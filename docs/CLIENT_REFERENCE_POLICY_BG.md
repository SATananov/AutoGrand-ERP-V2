# Client Reference Policy — Step 0.1

## Правило

Client/Moneta ZIP-овете са reference източници, не source code основа.

Позволено:

- metadata inventory
- BPL/package карта
- ERP module blueprint
- error/diagnostic pattern analysis
- private local log extract-и от твоя обект

Забранено в проекта:

- копиране на `.exe`, `.dll`, `.bpl` runtime файлове
- изпълнение на Moneta binaries
- reverse-engineered код като production source
- публикуване на private log CSV файловете

## Защо

Новият AutoGrand ERP трябва да бъде чист JS/Node проект. Moneta reference данните ни помагат да разберем модули, терминология, грешки и бизнес процеси, но не копираме proprietary runtime код.
