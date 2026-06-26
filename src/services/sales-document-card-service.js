import prisma from '../db/prisma.js';
import { salesDocTypeMeta } from './sales-actions-service.js';

function dateText(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('bg-BG').format(new Date(value));
}

function money(value, currency = 'BGN') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function numberText(value) {
  return Number(value || 0).toFixed(2);
}

function safe(value, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function statusLabel(status) {
  const map = {
    DRAFT: 'Чернова',
    POSTED: 'Осчетоводен',
    CANCELLED: 'Отказан'
  };

  return map[status] || status || '-';
}

function workflowFor(docType) {
  const map = {
    OFFER: 'Оферта → Поръчка → Продажба',
    CUSTOMER_ORDER: 'Поръчка → Продажба → Плащане',
    SALE: 'Продажба → Складово движение OUT → Плащане → Каса',
    CREDIT_NOTE: 'Кредитно известие → Складово движение IN',
    DEBIT_NOTE: 'Допълнително начисляване',
    SALE_BY_ORDER: 'Поръчка → Продажба → Складово движение OUT',
    FREE_CREDIT_NOTE_SALE: 'Свободна корекция → Складово движение IN',
    FREE_INVOICE_SALE: 'Свободна фактура → Складово движение OUT',
    WARRANTY_CARD: 'Продажба → Гаранция'
  };

  return map[docType] || 'Продажбен документ';
}

function stockEffectText(docType) {
  if (['SALE', 'SALE_BY_ORDER', 'FREE_INVOICE_SALE'].includes(docType)) {
    return 'При осчетоводяване документът намалява складова наличност и създава OUT движение.';
  }

  if (['CREDIT_NOTE', 'FREE_CREDIT_NOTE_SALE'].includes(docType)) {
    return 'При осчетоводяване документът връща наличност и създава IN движение.';
  }

  return 'Този тип документ се заключва при осчетоводяване, но не създава складово движение.';
}

function lockMessage(status) {
  if (status === 'POSTED') {
    return 'Документът е осчетоводен. Редакция на редове е заключена. За корекция трябва отделен коригиращ документ.';
  }

  if (status === 'CANCELLED') {
    return 'Документът е отказан. Редакция на редове е заключена.';
  }

  return '';
}

function actionMessageFor(code) {
  const map = {
    document_created: {
      kind: 'success',
      title: 'Документът е създаден',
      text: 'Създадена е нова чернова. Можеш да добавиш редове.'
    },
    line_added: {
      kind: 'success',
      title: 'Редът е добавен',
      text: 'Документът е преизчислен.'
    },
    line_updated: {
      kind: 'success',
      title: 'Редът е запазен',
      text: 'Количество, цена и отстъпка са обновени.'
    },
    line_deleted: {
      kind: 'success',
      title: 'Редът е изтрит',
      text: 'Сумите са преизчислени.'
    },
    recalculated: {
      kind: 'success',
      title: 'Документът е преизчислен',
      text: 'Сумите са обновени по текущите редове.'
    },
    posted_stock_out_success: {
      kind: 'success',
      title: 'Документът е осчетоводен',
      text: 'Създадени са складови движения OUT и наличностите са намалени.'
    },
    posted_stock_in_success: {
      kind: 'success',
      title: 'Документът е осчетоводен',
      text: 'Създадени са складови движения IN и наличностите са увеличени.'
    },
    posted_no_stock_success: {
      kind: 'success',
      title: 'Документът е осчетоводен',
      text: 'Документът е заключен. Този тип документ не създава складово движение.'
    },
    already_posted: {
      kind: 'info',
      title: 'Документът вече е осчетоводен',
      text: 'Не е създадено второ складово движение.'
    },
    insufficient_stock: {
      kind: 'warning',
      title: 'Недостатъчна наличност',
      text: 'Осчетоводяването е спряно. Провери наличността в склада.'
    },
    no_lines: {
      kind: 'warning',
      title: 'Няма редове',
      text: 'Документ без редове не може да бъде осчетоводен.'
    },
    invalid_stock_line: {
      kind: 'warning',
      title: 'Невалиден складов ред',
      text: 'Някой ред няма артикул, склад или количество.'
    },
    document_locked: {
      kind: 'warning',
      title: 'Документът е заключен',
      text: 'Редакция е позволена само в статус Чернова.'
    },
    cancelled_success: {
      kind: 'info',
      title: 'Документът е отказан',
      text: 'Документът е заключен за редакция.'
    },
    posted_cannot_cancel_without_reversal: {
      kind: 'warning',
      title: 'Осчетоводен документ не се отказва директно',
      text: 'За корекция ще се използва обратен/коригиращ документ в следваща стъпка.'
    },
    posted_cannot_return_to_draft: {
      kind: 'warning',
      title: 'Осчетоводен документ не се връща в Чернова',
      text: 'Така пазим складовите движения от двойни и грешни промени.'
    },
    cancelled_locked: {
      kind: 'warning',
      title: 'Отказан документ',
      text: 'Документът е заключен.'
    }
  };

  return map[code] || null;
}

async function getStockBalanceMap(lines, documentWarehouseId) {
  const pairs = [];

  for (const line of lines) {
    const warehouseId = line.warehouseId || documentWarehouseId;
    const itemId = line.itemId;

    if (warehouseId && itemId) {
      pairs.push({ warehouseId, itemId });
    }
  }

  if (pairs.length === 0) {
    return new Map();
  }

  const uniquePairs = Array.from(
    new Map(pairs.map((pair) => [`${pair.warehouseId}:${pair.itemId}`, pair])).values()
  );

  const balances = await prisma.stockBalance.findMany({
    where: {
      OR: uniquePairs.map((pair) => ({
        warehouseId: pair.warehouseId,
        itemId: pair.itemId
      }))
    }
  });

  return new Map(
    balances.map((balance) => [`${balance.warehouseId}:${balance.itemId}`, balance])
  );
}

export async function getSalesDocumentCardData(documentId, actionCode = '') {
  const id = Number(documentId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const document = await prisma.salesDocument.findUnique({
    where: { id },
    include: {
      counterparty: true,
      warehouse: true,
      lines: {
        include: {
          item: true,
          warehouse: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!document) {
    return null;
  }

  const meta = salesDocTypeMeta[document.docType] || {
    label: document.docType,
    screenId: 'sales',
    returnUrl: '/screen/sales'
  };

  const [
    payments,
    availableItems,
    availableWarehouses,
    stockMovements,
    stockBalanceMap
  ] = await Promise.all([
    prisma.cashEntry.findMany({
      where: {
        relatedDocument: document.number
      },
      orderBy: { entryDate: 'desc' }
    }),
    prisma.item.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    }),
    prisma.stockMovement.findMany({
      where: {
        sourceDocument: document.number
      },
      include: {
        warehouse: true,
        item: true
      },
      orderBy: { movementDate: 'desc' }
    }),
    getStockBalanceMap(document.lines, document.warehouseId)
  ]);

  const rows = document.lines.map((line, index) => {
    const warehouseId = line.warehouseId || document.warehouseId;
    const balance = stockBalanceMap.get(`${warehouseId}:${line.itemId}`);
    const available = Number(balance?.quantity || 0) - Number(balance?.reservedQuantity || 0);

    return {
      lineId: line.id,
      index: index + 1,
      itemCode: safe(line.item?.code, '-'),
      itemName: safe(line.item?.name, 'Няма избран артикул'),
      warehouseName: safe(line.warehouse?.name || document.warehouse?.name, '-'),
      unit: safe(line.item?.unit, 'бр.'),
      quantity: Number(line.quantity || 0).toFixed(2),
      price: money(line.price),
      discountPercent: `${Number(line.discountPercent || 0).toFixed(2)}%`,
      lineTotal: money(line.lineTotal),
      availableQuantityText: numberText(available),
      rawQuantity: Number(line.quantity || 0).toFixed(2),
      rawPrice: Number(line.price || 0).toFixed(2),
      rawDiscountPercent: Number(line.discountPercent || 0).toFixed(2)
    };
  });

  const editableRows = rows.filter((row) => row.lineId);

  if (rows.length === 0) {
    rows.push({
      lineId: null,
      index: 1,
      itemCode: '-',
      itemName: 'Документът няма редове. Добави артикул от формата над таблицата.',
      warehouseName: safe(document.warehouse?.name, '-'),
      unit: '-',
      quantity: '0.00',
      price: money(0),
      discountPercent: '0.00%',
      lineTotal: money(0),
      availableQuantityText: '0.00',
      rawQuantity: '0.00',
      rawPrice: '0.00',
      rawDiscountPercent: '0.00'
    });
  }

  const paymentRows = payments.map((payment) => ({
    number: payment.number,
    dateText: dateText(payment.entryDate),
    amountText: money(payment.amount, payment.currency),
    method: payment.paymentMethod,
    description: payment.description
  }));

  const stockMovementRows = stockMovements.map((movement) => ({
    number: movement.number,
    dateText: dateText(movement.movementDate),
    movementType: movement.movementType,
    direction: movement.direction,
    warehouseName: movement.warehouse?.name || '-',
    itemName: movement.item?.name || '-',
    quantityText: numberText(movement.quantity),
    reason: movement.reason || ''
  }));

  const historyRows = [
    {
      time: dateText(document.createdAt),
      user: 'СТЕФАН ТАНАНОВ',
      action: 'Създаден документ',
      details: `${meta.label} ${document.number}`
    },
    {
      time: dateText(document.docDate),
      user: 'AutoGrand ERP',
      action: statusLabel(document.status),
      details: workflowFor(document.docType)
    },
    ...stockMovementRows.map((movement) => ({
      time: movement.dateText,
      user: 'AutoGrand ERP',
      action: `Складово движение ${movement.direction}`,
      details: `${movement.itemName} · ${movement.quantityText}`
    }))
  ];

  const isEditable = document.status === 'DRAFT';
  const canPost = document.status === 'DRAFT';
  const canCancel = document.status === 'DRAFT';

  return {
    id: document.id,
    title: meta.label,
    number: document.number,
    docType: document.docType,
    docTypeLabel: meta.label,
    sourceScreenId: meta.screenId,
    returnUrl: meta.returnUrl,
    workflow: workflowFor(document.docType),
    stockEffectText: stockEffectText(document.docType),
    docDateText: dateText(document.docDate),
    status: document.status,
    statusText: statusLabel(document.status),
    isEditable,
    canPost,
    canCancel,
    actionMessage: actionMessageFor(actionCode),
    lockMessage: lockMessage(document.status),
    counterpartyName: safe(document.counterparty?.name, 'Няма избран контрагент'),
    counterpartyCode: safe(document.counterparty?.code, '-'),
    counterpartyCity: safe(document.counterparty?.city, '-'),
    counterpartyPhone: safe(document.counterparty?.phone, '-'),
    warehouseName: safe(document.warehouse?.name, '-'),
    warehouseCode: safe(document.warehouse?.code, '-'),
    note: safe(document.note, 'Няма бележка'),
    rows,
    editableRows,
    paymentRows,
    stockMovementRows,
    historyRows,
    availableItems: availableItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      price: Number(item.retailPrice || 0).toFixed(2)
    })),
    availableWarehouses: availableWarehouses.map((warehouse) => ({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name
    })),
    totals: {
      totalNetText: money(document.totalNet),
      totalVatText: money(document.totalVat),
      totalGrossText: money(document.totalGross)
    },
    headerFields: [
      { label: 'Тип документ', value: meta.label },
      { label: 'Номер', value: document.number },
      { label: 'Дата', value: dateText(document.docDate) },
      { label: 'Статус', value: statusLabel(document.status) },
      { label: 'Контрагент', value: safe(document.counterparty?.name, '-') },
      { label: 'Склад', value: safe(document.warehouse?.name, '-') }
    ]
  };
}