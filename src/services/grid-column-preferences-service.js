// Step 4.4 — Global Grid Column Preferences foundation.
// Moneta reference audit: LoadGridView / DoSaveGridView / GridColWidthChanged /
// GridTitleButtonClick / miEditCommonColumns / miAddColumns / TfEdReportColumns.
// No Prisma schema change in this step: runtime preferences are persisted in browser localStorage.

export const STEP_4_4_GRID_PREFS_HEALTH_LABEL = '4-4-global-grid-column-preferences';

export const MONETA_GRID_PREFERENCE_CONCEPTS = [
  'LoadGridView',
  'DoLoadGridView',
  'DoSaveGridView',
  'GridColWidthChanged',
  'GridTitleButtonClick',
  'AssignGridProps',
  'TfEdReportColumns',
  'miEditCommonColumns',
  'miAddColumns',
  'VisibleFields',
  'ColumnRights',
  'DisplayWidth'
];

const SCOPE_DIMENSIONS = [
  { code: 'user', name: 'Потребител', monetaHint: 'персонална подредба на grid view' },
  { code: 'role', name: 'Роля / профил', monetaHint: 'ролята ограничава видимостта и действията' },
  { code: 'location', name: 'Обект', monetaHint: 'контекст на активния търговски обект / склад' },
  { code: 'form', name: 'Форма / екран', monetaHint: 'формата има собствен grid key и набор колони' }
];

export const GLOBAL_GRID_COLUMN_REGISTRY = [
  grid('price-list.items', 'Артикули, цени и наличности', 'price-list', [
    col('photo', 'Снимка', 72, true, 'Снимка / preview'),
    col('code', 'Код', 110, true, 'N_Item.Code'),
    col('name', 'Артикул', 260, true, 'N_Item.Name'),
    col('group', 'Група', 180, true, 'N_ItemProductGroup'),
    col('stock', 'Наличност', 120, true, 'складова наличност'),
    col('retailPrice', 'Прод. цена', 120, true, 'UnitPrice с ДДС'),
    col('deliveryPrice', 'Дост. цена', 120, false, 'UnitCost'),
    col('supplier', 'Доставчик', 180, false, 'N_Contragent'),
    col('supplierCode', 'Код при доставчик', 160, false, 'N_ItemCrossRef')
  ]),
  grid('catalog.foundation.items', 'Foundation артикули', 'catalog-foundation', [
    col('code', 'Код', 110, true, 'N_Item.Code'),
    col('item', 'Артикул', 260, true, 'N_Item.Name'),
    col('groupClass', 'Група / клас', 230, true, 'N_ItemProductGroup / N_ItemProductClass'),
    col('measure', 'Ед.', 90, true, 'Measure_Id / PurchMeasure'),
    col('vat', 'ДДС', 90, true, 'VATProd_PostingGroup'),
    col('contragent', 'Контрагент', 190, true, 'N_Contragent'),
    col('supplierCode', 'Код при доставчик', 170, true, 'N_ItemCrossRef'),
    col('internalPrice', 'Вътр.', 110, true, 'UnitCost'),
    col('retailPrice', 'Прод.', 110, true, 'UnitPrice')
  ]),
  grid('catalog.foundation.measures', 'Мерни единици', 'catalog-foundation', [
    col('code', 'Код', 90, true, 'Measure_Id'),
    col('name', 'Име', 180, true, 'Name'),
    col('decimalPlaces', 'Дес.', 70, true, 'Decimal places'),
    col('moneta', 'Moneta', 160, true, 'Moneta поле')
  ]),
  grid('catalog.foundation.vatPosting', 'ДДС posting setup', 'catalog-foundation', [
    col('setup', 'Setup', 180, true, 'G_VATPostingSetup'),
    col('vat', 'ДДС', 80, true, 'VATPercent'),
    col('ledger', 'Дневник', 140, true, 'VATLedger'),
    col('price', 'Цена', 140, true, 'PriceIncludingVAT')
  ]),
  grid('catalog.foundation.contragents', 'Контрагенти доставчици', 'catalog-foundation', [
    col('code', 'Код', 90, true, 'N_Contragent.Code'),
    col('name', 'Име', 240, true, 'N_Contragent.Name'),
    col('roles', 'Роли', 150, true, 'ContragentType'),
    col('leadTime', 'Срок', 90, true, 'Lead time')
  ]),
  grid('sales.documents.browse', 'Продажбени документи', 'screen-browse', [
    col('number', 'Номер', 120, true, 'Document No.'),
    col('date', 'Дата', 110, true, 'Posting Date'),
    col('customer', 'Клиент', 220, true, 'N_Contragent'),
    col('status', 'Статус', 120, true, 'Document Status'),
    col('total', 'Сума', 120, true, 'Amount Incl. VAT'),
    col('location', 'Обект', 160, false, 'Location filter')
  ]),
  grid('purchase.documents.browse', 'Доставни документи', 'screen-browse', [
    col('number', 'Номер', 120, true, 'Document No.'),
    col('date', 'Дата', 110, true, 'Posting Date'),
    col('supplier', 'Доставчик', 220, true, 'N_Contragent'),
    col('status', 'Статус', 120, true, 'Document Status'),
    col('total', 'Сума', 120, true, 'Amount'),
    col('warehouse', 'Склад', 160, false, 'Warehouse filter')
  ]),
  grid('stock.dashboard.balances', 'Складови наличности', 'stock-dashboard', [
    col('item', 'Артикул', 260, true, 'N_Item'),
    col('warehouse', 'Склад', 160, true, 'Warehouse'),
    col('available', 'Налично', 120, true, 'Available Qty'),
    col('reserved', 'Резерв.', 120, false, 'Reserved Qty'),
    col('incoming', 'Очаквано', 120, false, 'Incoming Qty'),
    col('minQty', 'Мин.', 90, false, 'Min Qty')
  ]),
  grid('stock.transfers.center', 'Трансфери и заявки', 'stock-transfers', [
    col('number', 'Номер', 120, true, 'Transfer No.'),
    col('from', 'От обект', 180, true, 'From Location'),
    col('to', 'Към обект', 180, true, 'To Location'),
    col('status', 'Статус', 140, true, 'Status'),
    col('priority', 'Приоритет', 110, true, 'Priority'),
    col('actions', 'Действия', 180, true, 'Actions')
  ])
];

function grid(key, title, screen, columns = []) {
  return {
    key,
    title,
    screen,
    storageKey: `ag:v2:grid-columns:${key}`,
    columns,
    monetaHooks: ['LoadGridView', 'DoSaveGridView', 'GridColWidthChanged', 'GridTitleButtonClick']
  };
}

function col(key, label, width, visible = true, monetaField = '') {
  return { key, label, width, visible, monetaField };
}

function summarizeRegistry(registry = GLOBAL_GRID_COLUMN_REGISTRY) {
  const columnCount = registry.reduce((sum, item) => sum + item.columns.length, 0);
  const hiddenByDefaultCount = registry.reduce(
    (sum, item) => sum + item.columns.filter((column) => !column.visible).length,
    0
  );

  return {
    grids: registry.length,
    columns: columnCount,
    hiddenByDefault: hiddenByDefaultCount,
    screens: new Set(registry.map((item) => item.screen)).size,
    scopeDimensions: SCOPE_DIMENSIONS.length,
    monetaConcepts: MONETA_GRID_PREFERENCE_CONCEPTS.length
  };
}

export function getGlobalGridColumnPreferencesData() {
  const diagnostics = summarizeRegistry();

  return {
    version: '0.4.8',
    healthLabel: STEP_4_4_GRID_PREFS_HEALTH_LABEL,
    title: 'Глобални настройки на колони',
    subtitle: 'Moneta-like LoadGridView / DoSaveGridView foundation за всички browse grids.',
    monetaConcepts: MONETA_GRID_PREFERENCE_CONCEPTS,
    scopeDimensions: SCOPE_DIMENSIONS,
    registry: GLOBAL_GRID_COLUMN_REGISTRY,
    diagnostics,
    rules: [
      'Всяка таблица получава grid key по форма/екран.',
      'Подредба, видимост и ширини се пазят локално по потребител, роля, обект и grid key.',
      'Reset връща фабричната AutoGrand подредба.',
      'Следващ DB step може да премести localStorage pref-овете в Prisma таблица без промяна на UI.'
    ]
  };
}

export function getGlobalGridColumnPreferenceDiagnostics() {
  return {
    ok: true,
    step: STEP_4_4_GRID_PREFS_HEALTH_LABEL,
    version: '0.4.8',
    diagnostics: summarizeRegistry(),
    gridKeys: GLOBAL_GRID_COLUMN_REGISTRY.map((item) => item.key),
    monetaConcepts: MONETA_GRID_PREFERENCE_CONCEPTS,
    persistence: 'browser-localStorage-foundation'
  };
}
