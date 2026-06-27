# Clean export checkpoint — Step 2.5.1 Menu Behavior

Този checkpoint е предназначен да се приложи върху AutoGrand ERP V2 Step 2.5 Desktop Workspace Behavior.

## Съдържание

Step 2.5.1 добавя пълното дървовидно меню и поведението на менюто от `autogrand-erp-step1`:

- пълна модулна структура;
- accordion поведение;
- активен ред;
- sidebar resize;
- pin/кламер;
- minimize/collapse;
- dock бутон за връщане на менюто;
- context menu;
- бързи връзки.

## Ограничения

Това е UI behavior patch. Не добавя нова бизнес логика за всички исторически Moneta-like модули.

Модулите, които вече имат реален V2 route, се отварят към реалните екрани. Останалите се отварят като placeholder ERP прозорци, за да се запази правилният desktop behavior.
