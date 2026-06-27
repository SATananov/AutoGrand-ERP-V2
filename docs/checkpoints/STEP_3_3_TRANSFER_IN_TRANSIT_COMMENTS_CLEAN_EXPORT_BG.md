# Clean Export — Step 3.3 Transfer In Transit Status + Request Comments

Този checkpoint добавя междинен статус **Пътува** и виртуален **Трансферен склад / В път** към трансферните заявки.

## Проверки

```powershell
node scripts/check-project.mjs
node --check src/server.js
node --check src/services/stock-actions-service.js
node --check public/js/app.js
node --check public/js/erp-v2-workspace-manager.js
```

## Очакван резултат

- При изпращане стоката излиза от изпращащия обект и влиза във **В път**.
- При приемане стоката излиза от **В път** и влиза в получаващия обект.
- При връщане стоката се връща от **В път** към изпращача.
- Коментарът към заявката остава видим в трансферния център и документа.
