# Checkpoint — Step 4.5 Global Document Engine

## Статус

Step 4.5 добавя Moneta-aligned Global Document Engine foundation за AutoGrand ERP V2.

## Версия

- `package.json`: `0.4.9`
- Health label: `4-5-global-document-engine`

## Няма DB промяна

- Prisma schema: няма промяна
- `prisma/dev.db`: не е част от patch-а

## Основни файлове

- `src/data/autogrand-document-engine-foundation.js`
- `src/services/document-engine-service.js`
- `public/js/ag-document-engine.js`
- `views/pages/document-engine.hbs`
- `docs/steps/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_BG.md`
- `docs/checkpoints/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_CLEAN_EXPORT_BG.md`

## Moneta съответствие

Използвани концепции от Moneta ZIP-а:

- `TfBaseEditDocument`
- `TfBaseBrowseCardDocument`
- `TfBaseEditPostedDocument`
- `TfEdPostDocumentEdit`
- `PostDocument`
- `CheckCanPostDocument`
- `CheckDocumentBeforeDelete`
- `CheckInDocument`
- `CheckOutDocument`
- `AnnulDocument`
- `PrintPostedDocument`
- `S_CopyDocTemplateHeader`
- `S_CopyDocTemplateLine`
- `DocStatus`
- `PostingDate`
- `PostingUser_Id`

## Ръчна проверка

След apply:

```powershell
npm run check
npm run dev
```

Проверка в браузър:

- `http://localhost:3000/document-engine`
- `http://localhost:3000/api/document-engine/diagnostics`
- `http://localhost:3000/health`

## Очаквано

- Екранът показва документни типове, header/line полета, действия и Moneta hooks.
- Diagnostics връща броячи за document types, statuses, actions, copy templates и validation hooks.
- Permission guard работи с `document_engine.view`.
