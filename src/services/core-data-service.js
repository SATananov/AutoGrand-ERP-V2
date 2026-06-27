import prisma from '../db/prisma.js';
import { locationTypeText } from './company-locations-service.js';

export const screenDefinitions = {
  'price-list': {
    title: 'Ценова листа',
    group: 'Продажби',
    kind: 'priceList',
    columns: [
      { key: 'code', label: 'Код' },
      { key: 'name', label: 'Наименование' },
      { key: 'currency', label: 'Валута' },
      { key: 'itemsCount', label: 'Редове' },
      { key: 'status', label: 'Статус' }
    ]
  },

  'advance-payments': {
    title: 'Авансови плащания',
    group: 'Продажби',
    kind: 'cashEntry',
    where: { kind: 'ADVANCE' },
    columns: cashColumns()
  },
  'offers': {
    title: 'Оферта',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'OFFER' },
    columns: salesDocumentColumns()
  },
  'customer-orders': {
    title: 'Поръчки от клиенти',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'CUSTOMER_ORDER' },
    columns: salesDocumentColumns()
  },
  'sales': {
    title: 'Продажби',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'SALE' },
    columns: salesDocumentColumns()
  },
  'credit-note': {
    title: 'Кредитно известие',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'CREDIT_NOTE' },
    columns: salesDocumentColumns()
  },
  'debit-note': {
    title: 'Дебитно известие',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'DEBIT_NOTE' },
    columns: salesDocumentColumns()
  },
  'sales-payments': {
    title: 'Плащания продажби',
    group: 'Продажби',
    kind: 'cashEntry',
    where: { kind: 'SALE_PAYMENT' },
    columns: cashColumns()
  },
  'sale-by-order': {
    title: 'Продажба по поръчка',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'SALE_BY_ORDER' },
    columns: salesDocumentColumns()
  },
  'free-credit-note-sale': {
    title: 'Свободно КИ продажба',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'FREE_CREDIT_NOTE_SALE' },
    columns: salesDocumentColumns()
  },
  'free-invoice-sales': {
    title: 'Свободна фактура продажби',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'FREE_INVOICE_SALE' },
    columns: salesDocumentColumns()
  },
  'warranty-cards': {
    title: 'Гаранционни карти',
    group: 'Продажби',
    kind: 'salesDocument',
    where: { docType: 'WARRANTY_CARD' },
    columns: salesDocumentColumns()
  },
  'daily-cash': {
    title: 'Дневна каса',
    group: 'Продажби',
    kind: 'cashEntry',
    where: {},
    columns: cashColumns()
  },

  'purchase-orders': {
    title: 'Поръчки към доставчици',
    group: 'Доставки',
    kind: 'purchaseDocument',
    where: { docType: 'PURCHASE_ORDER' },
    columns: purchaseDocumentColumns()
  },
  'supplier-invoices': {
    title: 'Фактури доставчици',
    group: 'Доставки',
    kind: 'purchaseDocument',
    where: { docType: 'SUPPLIER_INVOICE' },
    columns: purchaseDocumentColumns()
  },
  'deliveries': {
    title: 'Доставки',
    group: 'Доставки',
    kind: 'purchaseDocument',
    where: { docType: 'DELIVERY' },
    columns: purchaseDocumentColumns()
  },
  'supplier-payments': {
    title: 'Плащания доставки',
    group: 'Доставки',
    kind: 'cashEntry',
    where: { kind: 'SUPPLIER_PAYMENT' },
    columns: cashColumns()
  },

  'company-locations': {
    title: 'Обекти и складове',
    group: 'Склад',
    kind: 'companyLocation',
    columns: [
      { key: 'code', label: 'Код' },
      { key: 'name', label: 'Обект' },
      { key: 'typeText', label: 'Тип' },
      { key: 'city', label: 'Град' },
      { key: 'canHoldStockText', label: 'Наличност' },
      { key: 'canSellText', label: 'Продажби' },
      { key: 'statusText', label: 'Статус' }
    ]
  },

  'warehouses': {
    title: 'Складове',
    group: 'Склад',
    kind: 'warehouse',
    columns: [
      { key: 'code', label: 'Код' },
      { key: 'name', label: 'Склад' },
      { key: 'typeText', label: 'Тип обект' },
      { key: 'city', label: 'Град' },
      { key: 'statusText', label: 'Статус' }
    ]
  },
  'stock': {
    title: 'Наличности',
    group: 'Склад',
    kind: 'stockBalance',
    columns: [
      { key: 'warehouseName', label: 'Склад' },
      { key: 'itemCode', label: 'Код' },
      { key: 'itemName', label: 'Артикул' },
      { key: 'quantityText', label: 'Наличност' },
      { key: 'reservedText', label: 'Резервирано' },
      { key: 'availableText', label: 'Свободно' },
      { key: 'avgCostText', label: 'Средна цена' },
      { key: 'stockValueText', label: 'Стойност' }
    ]
  },
  'stock-movements': {
    title: 'Складови движения',
    group: 'Склад',
    kind: 'stockMovement',
    where: {},
    columns: stockMovementColumns()
  },
  'stock-transfers': {
    title: 'Трансфери и заявки',
    group: 'Склад',
    kind: 'stockTransferDocument',
    columns: stockTransferDocumentColumns()
  },
  'stock-adjustments': {
    title: 'Складови корекции',
    group: 'Склад',
    kind: 'stockAdjustmentDocument',
    columns: stockAdjustmentDocumentColumns()
  },

  'cash': {
    title: 'Каса',
    group: 'Финанси и счетоводство',
    kind: 'cashEntry',
    where: {},
    columns: cashColumns()
  },
  'payments': {
    title: 'Плащания',
    group: 'Финанси и счетоводство',
    kind: 'cashEntry',
    where: {},
    columns: cashColumns()
  },

  'counterparties': {
    title: 'Контрагенти',
    group: 'Номенклатури',
    kind: 'counterparty',
    columns: [
      { key: 'code', label: 'Код' },
      { key: 'name', label: 'Име' },
      { key: 'kindText', label: 'Тип' },
      { key: 'city', label: 'Град' },
      { key: 'phone', label: 'Телефон' }
    ]
  },
  'items': {
    title: 'Артикули',
    group: 'Номенклатури',
    kind: 'item',
    columns: [
      { key: 'code', label: 'Код' },
      { key: 'name', label: 'Артикул' },
      { key: 'groupName', label: 'Група' },
      { key: 'unit', label: 'Мярка' },
      { key: 'retailPriceText', label: 'Цена' }
    ]
  },
  'item-groups': {
    title: 'Групи артикули',
    group: 'Номенклатури',
    kind: 'itemGroup',
    columns: [
      { key: 'groupName', label: 'Група' },
      { key: 'itemsCount', label: 'Артикули' },
      { key: 'avgPriceText', label: 'Средна продажна цена' }
    ]
  },

  'vehicles': {
    title: 'Автомобили',
    group: 'Автомобили',
    kind: 'vehicle',
    columns: [
      { key: 'registration', label: 'Регистрация' },
      { key: 'brand', label: 'Марка' },
      { key: 'model', label: 'Модел' },
      { key: 'year', label: 'Година' },
      { key: 'ownerName', label: 'Собственик' }
    ]
  },
  'service-orders': {
    title: 'Сервизни поръчки',
    group: 'Сервиз и поддръжка',
    kind: 'serviceOrder',
    columns: [
      { key: 'number', label: 'Номер' },
      { key: 'orderDateText', label: 'Дата' },
      { key: 'vehicleText', label: 'Автомобил' },
      { key: 'counterpartyName', label: 'Клиент' },
      { key: 'status', label: 'Статус' },
      { key: 'totalGrossText', label: 'Общо' }
    ]
  },

  'web-orders': {
    title: 'Онлайн поръчки',
    group: 'Електронна търговия',
    kind: 'placeholder',
    columns: [
      { key: 'module', label: 'Модул' },
      { key: 'status', label: 'Статус' },
      { key: 'note', label: 'Бележка' }
    ]
  },
  'users': {
    title: 'Потребители',
    group: 'Администриране',
    kind: 'user',
    columns: [
      { key: 'username', label: 'Потребител' },
      { key: 'displayName', label: 'Име' },
      { key: 'role', label: 'Роля' },
      { key: 'companyName', label: 'Фирма' }
    ]
  },
  'settings': {
    title: 'Настройки',
    group: 'Администриране',
    kind: 'placeholder',
    columns: [
      { key: 'module', label: 'Модул' },
      { key: 'status', label: 'Статус' },
      { key: 'note', label: 'Бележка' }
    ]
  }
};

function salesDocumentColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'docDateText', label: 'Дата' },
    { key: 'counterpartyName', label: 'Контрагент' },
    { key: 'warehouseName', label: 'Склад' },
    { key: 'status', label: 'Статус' },
    { key: 'totalGrossText', label: 'Общо' }
  ];
}

function purchaseDocumentColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'docDateText', label: 'Дата' },
    { key: 'supplierName', label: 'Доставчик' },
    { key: 'warehouseName', label: 'Склад' },
    { key: 'status', label: 'Статус' },
    { key: 'totalGrossText', label: 'Общо' }
  ];
}

function cashColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'entryDateText', label: 'Дата' },
    { key: 'kindText', label: 'Тип' },
    { key: 'counterpartyName', label: 'Контрагент' },
    { key: 'description', label: 'Описание' },
    { key: 'amountText', label: 'Сума' }
  ];
}

function stockMovementColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'movementDateText', label: 'Дата' },
    { key: 'movementTypeText', label: 'Тип' },
    { key: 'warehouseName', label: 'Склад' },
    { key: 'itemName', label: 'Артикул' },
    { key: 'quantityText', label: 'Количество' },
    { key: 'directionText', label: 'Посока' }
  ];
}

function stockTransferDocumentColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'transferDateText', label: 'Дата' },
    { key: 'fromWarehouseName', label: 'От склад' },
    { key: 'toWarehouseName', label: 'Към склад' },
    { key: 'statusText', label: 'Статус' },
    { key: 'lineCountText', label: 'Редове' },
    { key: 'quantityText', label: 'Количество' }
  ];
}

function stockAdjustmentDocumentColumns() {
  return [
    { key: 'number', label: 'Номер' },
    { key: 'adjustmentDateText', label: 'Дата' },
    { key: 'warehouseName', label: 'Склад' },
    { key: 'adjustmentTypeText', label: 'Тип' },
    { key: 'statusText', label: 'Статус' },
    { key: 'lineCountText', label: 'Редове' },
    { key: 'quantityText', label: 'Количество' }
  ];
}

function money(value, currency = 'BGN') {
  return String(Number(value || 0).toFixed(2)) + ' ' + currency;
}

function numberText(value) {
  return Number(value || 0).toFixed(2);
}

function dateText(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('bg-BG').format(new Date(value));
}

function movementTypeText(type) {
  const map = {
    PURCHASE_IN: 'Вход от доставка',
    SALE_OUT: 'Изход от продажба',
    SALE_RETURN_IN: 'Вход от кредитно известие',
    PURCHASE_RETURN_OUT: 'Изход към доставчик',
    ADJUSTMENT_IN: 'Корекция вход',
    ADJUSTMENT_OUT: 'Корекция изход',
    ADJUSTMENT_SURPLUS_IN: 'Излишък',
    ADJUSTMENT_SHORTAGE_OUT: 'Липса',
    ADJUSTMENT_SCRAP_OUT: 'Брак',
    ADJUSTMENT_INITIAL_IN: 'Начално салдо',
    TRANSFER: 'Трансфер'
  };
  return map[type] || type || '';
}

function kindText(kind) {
  const map = {
    CUSTOMER: 'Клиент',
    SUPPLIER: 'Доставчик',
    ADVANCE: 'Аванс',
    SALE_PAYMENT: 'Плащане продажба',
    SUPPLIER_PAYMENT: 'Плащане доставка',
    CASH_IN: 'Приход',
    CASH_OUT: 'Разход'
  };
  return map[kind] || kind || '';
}

function fallbackRows(definition) {
  return [
    {
      id: 0,
      code: 'DEMO',
      name: 'Пусни Prisma migration и seed, за да се заредят реалните начални данни.',
      status: 'WAITING_DB',
      module: definition.title,
      note: 'Базата още не е синхронизирана.',
      number: 'DEMO-0001',
      entryDateText: '',
      counterpartyName: 'AutoGrand',
      amountText: '0.00 BGN',
      description: 'Базата още не е инициализирана.',
      kindText: 'Информация',
      totalGrossText: '0.00 BGN'
    }
  ];
}

export async function getDashboardData() {
  try {
    const [
      counterparties,
      items,
      warehouses,
      companyLocations,
      priceLists,
      salesDocuments,
      purchaseDocuments,
      stockBalances,
      stockMovements,
      stockTransferDocuments,
      stockAdjustmentDocuments,
      cashEntries,
      vehicles,
      serviceOrders
    ] = await Promise.all([
      prisma.counterparty.count(),
      prisma.item.count(),
      prisma.warehouse.count(),
      prisma.companyLocation.count(),
      prisma.priceList.count(),
      prisma.salesDocument.count(),
      prisma.purchaseDocument.count(),
      prisma.stockBalance.count(),
      prisma.stockMovement.count(),
      prisma.stockTransferDocument.count(),
      prisma.stockAdjustmentDocument.count(),
      prisma.cashEntry.count(),
      prisma.vehicle.count(),
      prisma.serviceOrder.count()
    ]);

    return {
      dbReady: true,
      cards: [
        { title: 'Контрагенти', value: counterparties, subtitle: 'клиенти и доставчици' },
        { title: 'Артикули', value: items, subtitle: 'номенклатури' },
        { title: 'Обекти', value: companyLocations, subtitle: 'офиси, складове и магазини' },
        { title: 'Складове', value: warehouses, subtitle: 'локации с наличност' },
        { title: 'Ценови листи', value: priceLists, subtitle: 'продажбени цени' },
        { title: 'Продажби', value: salesDocuments, subtitle: 'документи' },
        { title: 'Доставки', value: purchaseDocuments, subtitle: 'доставни документи' },
        { title: 'Наличности', value: stockBalances, subtitle: 'складови позиции' },
        { title: 'Движения', value: stockMovements, subtitle: 'складова история' },
        { title: 'Трансфери', value: stockTransferDocuments, subtitle: 'складови документи' },
        { title: 'Корекции', value: stockAdjustmentDocuments, subtitle: 'складови документи' },
        { title: 'Каса', value: cashEntries, subtitle: 'плащания' },
        { title: 'Автомобили', value: vehicles, subtitle: 'регистър' },
        { title: 'Сервиз', value: serviceOrders, subtitle: 'сервизни поръчки' }
      ]
    };
  } catch (error) {
    return {
      dbReady: false,
      error: error.message,
      cards: [
        { title: 'Prisma', value: '0', subtitle: 'очаква migrate' },
        { title: 'SQLite', value: '0', subtitle: 'очаква dev.db' },
        { title: 'Seed', value: '0', subtitle: 'очаква начални данни' }
      ]
    };
  }
}

export async function getScreenData(screenId) {
  const definition = screenDefinitions[screenId];

  if (!definition) {
    return null;
  }

  try {
    let rows = [];

    if (definition.kind === 'priceList') {
      const result = await prisma.priceList.findMany({
        include: { items: true },
        orderBy: { code: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        currency: row.currency,
        itemsCount: row.items.length,
        status: row.status
      }));
    }

    if (definition.kind === 'salesDocument') {
      const result = await prisma.salesDocument.findMany({
        where: definition.where || {},
        include: { counterparty: true, warehouse: true },
        orderBy: { docDate: 'desc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        number: row.number,
        docDateText: dateText(row.docDate),
        counterpartyName: row.counterparty?.name || '',
        warehouseName: row.warehouse?.name || '',
        status: row.status,
        totalGrossText: money(row.totalGross)
      }));
    }

    if (definition.kind === 'purchaseDocument') {
      const result = await prisma.purchaseDocument.findMany({
        where: definition.where || {},
        include: { supplier: true, warehouse: true },
        orderBy: { docDate: 'desc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        number: row.number,
        docDateText: dateText(row.docDate),
        supplierName: row.supplier?.name || '',
        warehouseName: row.warehouse?.name || '',
        status: row.status,
        totalGrossText: money(row.totalGross)
      }));
    }

    if (definition.kind === 'cashEntry') {
      const result = await prisma.cashEntry.findMany({
        where: definition.where || {},
        orderBy: { entryDate: 'desc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        number: row.number,
        entryDateText: dateText(row.entryDate),
        kindText: kindText(row.kind),
        description: row.description,
        counterpartyName: row.counterpartyName || '',
        amountText: money(row.amount, row.currency),
        paymentMethod: row.paymentMethod,
        relatedDocument: row.relatedDocument || ''
      }));
    }

    if (definition.kind === 'counterparty') {
      const result = await prisma.counterparty.findMany({
        orderBy: { code: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        kindText: kindText(row.kind),
        city: row.city || '',
        phone: row.phone || ''
      }));
    }

    if (definition.kind === 'item') {
      const result = await prisma.item.findMany({
        orderBy: { code: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        groupName: row.groupName || '',
        unit: row.unit,
        retailPriceText: money(row.retailPrice)
      }));
    }

    if (definition.kind === 'itemGroup') {
      const items = await prisma.item.findMany({
        orderBy: { groupName: 'asc' }
      });

      const groups = new Map();

      for (const item of items) {
        const groupName = item.groupName || 'Без група';
        const current = groups.get(groupName) || { groupName, itemsCount: 0, totalPrice: 0 };
        current.itemsCount += 1;
        current.totalPrice += Number(item.retailPrice || 0);
        groups.set(groupName, current);
      }

      rows = Array.from(groups.values()).map((group, index) => ({
        id: index + 1,
        groupName: group.groupName,
        itemsCount: group.itemsCount,
        avgPriceText: money(group.totalPrice / Math.max(group.itemsCount, 1))
      }));
    }

    if (definition.kind === 'companyLocation') {
      const result = await prisma.companyLocation.findMany({
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }]
      });

      rows = result.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        typeText: locationTypeText(row.type),
        city: row.city || '',
        canHoldStockText: row.canHoldStock ? 'Да' : 'Не',
        canSellText: row.canSell ? 'Да' : 'Не',
        canReceivePurchasesText: row.canReceivePurchases ? 'Да' : 'Не',
        canTransferText: row.canTransfer ? 'Да' : 'Не',
        statusText: row.isActive ? 'Активен' : 'Спрян',
        rowOpenUrl: `/locations/${row.id}`
      }));
    }

    if (definition.kind === 'warehouse') {
      const result = await prisma.warehouse.findMany({
        include: { location: true },
        orderBy: { code: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        typeText: locationTypeText(row.location?.type),
        city: row.city || row.location?.city || '',
        statusText: row.isActive ? 'Активен' : 'Спрян',
        rowOpenUrl: `/stock/warehouse/${row.id}`
      }));
    }

    if (definition.kind === 'stockBalance') {
      const result = await prisma.stockBalance.findMany({
        include: { warehouse: { include: { location: true } }, item: true },
        orderBy: [{ warehouseId: 'asc' }, { itemId: 'asc' }]
      });

      rows = result.map((row) => {
        const quantity = Number(row.quantity || 0);
        const reserved = Number(row.reservedQuantity || 0);
        const avgCost = Number(row.avgCost || 0);

        return {
          id: row.id,
          warehouseId: row.warehouseId,
          warehouseCode: row.warehouse?.code || '',
          warehouseName: row.warehouse?.name || '',
          itemId: row.itemId,
          itemCode: row.item?.code || '',
          itemName: row.item?.name || '',
          quantityText: numberText(quantity),
          reservedText: numberText(reserved),
          availableText: numberText(quantity - reserved),
          avgCostText: money(avgCost),
          stockValueText: money(quantity * avgCost),
          itemCardUrl: `/stock/item/${row.itemId}`,
          warehouseCardUrl: `/stock/warehouse/${row.warehouseId}`
        };
      });
    }

    if (definition.kind === 'stockMovement') {
      const result = await prisma.stockMovement.findMany({
        where: definition.where || {},
        include: { warehouse: { include: { location: true } }, item: true },
        orderBy: { movementDate: 'desc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        number: row.number,
        movementDateText: dateText(row.movementDate),
        movementType: row.movementType,
        movementTypeText: movementTypeText(row.movementType),
        warehouseId: row.warehouseId,
        warehouseName: row.warehouse?.name || '',
        itemId: row.itemId,
        itemName: row.item?.name || '',
        quantityText: numberText(row.quantity),
        directionText: row.direction === 'IN' ? 'Вход' : row.direction === 'OUT' ? 'Изход' : 'Трансфер',
        sourceDocument: row.sourceDocument || '',
        reason: row.reason || '',
        itemCardUrl: row.itemId ? `/stock/item/${row.itemId}` : '',
        warehouseCardUrl: row.warehouseId ? `/stock/warehouse/${row.warehouseId}` : ''
      }));
    }

    if (definition.kind === 'stockTransferDocument') {
      const result = await prisma.stockTransferDocument.findMany({
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          lines: true
        },
        orderBy: { transferDate: 'desc' }
      });

      rows = result.map((row) => {
        const totalQuantity = row.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
        const statusMap = { DRAFT: 'Чернова', POSTED: 'Публикуван', CANCELLED: 'Отказан' };

        return {
          id: row.id,
          number: row.number,
          transferDateText: dateText(row.transferDate),
          fromWarehouseName: row.fromWarehouse?.name || '',
          toWarehouseName: row.toWarehouse?.name || '',
          status: row.status,
          statusText: statusMap[row.status] || row.status,
          lineCountText: String(row.lines.length),
          quantityText: numberText(totalQuantity),
          rowOpenUrl: `/stock/transfer/${row.id}`
        };
      });
    }

    if (definition.kind === 'stockAdjustmentDocument') {
      const result = await prisma.stockAdjustmentDocument.findMany({
        include: {
          warehouse: true,
          lines: true
        },
        orderBy: { adjustmentDate: 'desc' }
      });

      rows = result.map((row) => {
        const totalQuantity = row.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
        const statusMap = { DRAFT: 'Чернова', POSTED: 'Публикуван', CANCELLED: 'Отказан' };
        const typeMap = {
          INITIAL_IN: 'Начално салдо',
          SURPLUS_IN: 'Излишък',
          CORRECTION_IN: 'Корекция вход',
          CORRECTION_OUT: 'Корекция изход',
          SHORTAGE_OUT: 'Липса',
          SCRAP_OUT: 'Брак'
        };

        return {
          id: row.id,
          number: row.number,
          adjustmentDateText: dateText(row.adjustmentDate),
          warehouseName: row.warehouse?.name || '',
          adjustmentTypeText: typeMap[row.adjustmentType] || row.adjustmentType,
          status: row.status,
          statusText: statusMap[row.status] || row.status,
          lineCountText: String(row.lines.length),
          quantityText: numberText(totalQuantity),
          rowOpenUrl: `/stock/adjustment/${row.id}`
        };
      });
    }

    if (definition.kind === 'vehicle') {
      const result = await prisma.vehicle.findMany({
        orderBy: { registration: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        registration: row.registration,
        brand: row.brand,
        model: row.model,
        year: row.year || '',
        ownerName: row.ownerName || ''
      }));
    }

    if (definition.kind === 'serviceOrder') {
      const result = await prisma.serviceOrder.findMany({
        include: { vehicle: true, counterparty: true },
        orderBy: { orderDate: 'desc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        number: row.number,
        orderDateText: dateText(row.orderDate),
        vehicleText: row.vehicle ? `${row.vehicle.registration} · ${row.vehicle.brand} ${row.vehicle.model}` : '',
        counterpartyName: row.counterparty?.name || '',
        status: row.status,
        totalGrossText: money(row.totalGross)
      }));
    }

    if (definition.kind === 'user') {
      const result = await prisma.user.findMany({
        include: { company: true },
        orderBy: { username: 'asc' }
      });

      rows = result.map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        role: row.role,
        companyName: row.company?.name || ''
      }));
    }

    if (definition.kind === 'placeholder') {
      rows = [
        {
          id: 1,
          module: definition.title,
          status: 'FOUNDATION',
          note: 'Модулът е добавен в глобалната Moneta структура и ще получи реални екрани в следващите стъпки.'
        }
      ];
    }

    return {
      ...definition,
      id: screenId,
      dbReady: true,
      rows
    };
  } catch (error) {
    return {
      ...definition,
      id: screenId,
      dbReady: false,
      error: error.message,
      rows: fallbackRows(definition)
    };
  }
}