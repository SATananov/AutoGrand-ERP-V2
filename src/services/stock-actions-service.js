import prisma from '../db/prisma.js';
import { locationTypeText } from './company-locations-service.js';

const STOCK_LOW_THRESHOLD = 5;

function numberText(value) {
  return Number(value || 0).toFixed(2);
}

function money(value, currency = 'BGN') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function dateTimeText(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value)).replace(',', '');
}

function movementTypeText(type) {
  const map = {
    PURCHASE_IN: 'Вход от доставка',
    SALE_OUT: 'Изход от продажба',
    SALE_RETURN_IN: 'Вход от кредитно известие',
    PURCHASE_RETURN_OUT: 'Изход към доставчик',
    ADJUSTMENT_IN: 'Корекция вход',
    ADJUSTMENT_OUT: 'Корекция изход',
    TRANSFER: 'Трансфер'
  };

  return map[type] || type || '';
}

function directionText(direction) {
  const map = {
    IN: 'Вход',
    OUT: 'Изход',
    TRANSFER: 'Трансфер'
  };

  return map[direction] || direction || '';
}

function normalizeId(value) {
  const id = Number(value || 0);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeQuantity(value) {
  const quantity = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function safeNote(value) {
  return String(value || '').trim().slice(0, 240);
}

function stockSourceNumber(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
}

async function nextMovementSequence(tx) {
  return tx.stockMovement.count().then((count) => count + 1);
}

async function findBalance(tx, warehouseId, itemId) {
  return tx.stockBalance.findUnique({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId
      }
    }
  });
}

async function incrementBalance(tx, warehouseId, itemId, quantity, avgCost = 0) {
  const existing = await findBalance(tx, warehouseId, itemId);

  if (existing) {
    const currentQuantity = Number(existing.quantity || 0);
    const incomingQuantity = Number(quantity || 0);
    const currentCost = Number(existing.avgCost || 0);
    const incomingCost = Number(avgCost || 0);
    const nextQuantity = currentQuantity + incomingQuantity;
    const nextAvgCost = incomingCost > 0
      ? ((currentQuantity * currentCost) + (incomingQuantity * incomingCost)) / Math.max(nextQuantity, 1)
      : currentCost;

    return tx.stockBalance.update({
      where: {
        warehouseId_itemId: {
          warehouseId,
          itemId
        }
      },
      data: {
        quantity: nextQuantity,
        avgCost: Number(nextAvgCost.toFixed(4))
      }
    });
  }

  return tx.stockBalance.create({
    data: {
      warehouseId,
      itemId,
      quantity,
      reservedQuantity: 0,
      avgCost: avgCost || 0
    }
  });
}

async function decrementBalance(tx, warehouseId, itemId, quantity) {
  const existing = await findBalance(tx, warehouseId, itemId);

  if (!existing || Number(existing.quantity || 0) < quantity) {
    return { ok: false, code: 'insufficient_stock' };
  }

  await tx.stockBalance.update({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId
      }
    },
    data: {
      quantity: Number((Number(existing.quantity || 0) - quantity).toFixed(4))
    }
  });

  return { ok: true, avgCost: Number(existing.avgCost || 0) };
}

async function getStockFormLists() {
  const [warehouses, items] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      include: { location: true },
      orderBy: { code: 'asc' }
    }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })
  ]);

  return {
    warehouses: warehouses.map((warehouse) => ({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      typeText: locationTypeText(warehouse.location?.type),
      city: warehouse.city || warehouse.location?.city || '',
      label: `${warehouse.code} · ${warehouse.name} · ${locationTypeText(warehouse.location?.type)}`
    })),
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit,
      wholesalePrice: item.wholesalePrice,
      label: `${item.code} · ${item.name}`
    }))
  };
}

function movementRow(row) {
  return {
    id: row.id,
    number: row.number,
    movementDateText: dateTimeText(row.movementDate),
    movementType: row.movementType,
    movementTypeText: movementTypeText(row.movementType),
    warehouseId: row.warehouseId,
    warehouseName: row.warehouse?.name || '',
    warehouseCode: row.warehouse?.code || '',
    warehouseTypeText: locationTypeText(row.warehouse?.location?.type),
    warehouseCity: row.warehouse?.city || row.warehouse?.location?.city || '',
    itemId: row.itemId,
    itemCode: row.item?.code || '',
    itemName: row.item?.name || '',
    quantityText: numberText(row.quantity),
    direction: row.direction,
    directionText: directionText(row.direction),
    reason: row.reason || '',
    sourceDocument: row.sourceDocument || '',
    note: row.note || ''
  };
}

function balanceRow(row) {
  const quantity = Number(row.quantity || 0);
  const reserved = Number(row.reservedQuantity || 0);
  const available = quantity - reserved;
  const avgCost = Number(row.avgCost || 0);

  return {
    id: row.id,
    warehouseId: row.warehouseId,
    warehouseCode: row.warehouse?.code || '',
    warehouseName: row.warehouse?.name || '',
    itemId: row.itemId,
    itemCode: row.item?.code || '',
    itemName: row.item?.name || '',
    unit: row.item?.unit || '',
    quantity,
    reserved,
    available,
    avgCost,
    quantityText: numberText(quantity),
    reservedText: numberText(reserved),
    availableText: numberText(available),
    avgCostText: money(avgCost),
    stockValueText: money(quantity * avgCost),
    isLow: available <= STOCK_LOW_THRESHOLD
  };
}

export async function getStockDashboardData(action = '') {
  const [balancesRaw, movementsRaw, warehousesRaw, itemsRaw, transferDocumentsCount] = await Promise.all([
    prisma.stockBalance.findMany({
      include: { warehouse: { include: { location: true } }, item: true },
      orderBy: [{ warehouseId: 'asc' }, { itemId: 'asc' }]
    }),
    prisma.stockMovement.findMany({
      include: { warehouse: { include: { location: true } }, item: true },
      orderBy: { movementDate: 'desc' },
      take: 12
    }),
    prisma.warehouse.findMany({ include: { location: true }, orderBy: { code: 'asc' } }),
    prisma.item.findMany({ orderBy: { code: 'asc' } }),
    prisma.stockTransferDocument.count()
  ]);

  const balances = balancesRaw.map(balanceRow);
  const movements = movementsRaw.map(movementRow);
  const warehouseMap = new Map();
  const itemMap = new Map();

  for (const row of balances) {
    const warehouse = warehouseMap.get(row.warehouseId) || {
      id: row.warehouseId,
      code: row.warehouseCode,
      name: row.warehouseName,
      typeText: row.warehouseTypeText,
      city: row.warehouseCity,
      positions: 0,
      quantity: 0,
      reserved: 0,
      available: 0,
      value: 0
    };

    warehouse.positions += 1;
    warehouse.quantity += row.quantity;
    warehouse.reserved += row.reserved;
    warehouse.available += row.available;
    warehouse.value += row.quantity * row.avgCost;
    warehouseMap.set(row.warehouseId, warehouse);

    const item = itemMap.get(row.itemId) || {
      id: row.itemId,
      code: row.itemCode,
      name: row.itemName,
      unit: row.unit,
      warehouses: 0,
      quantity: 0,
      reserved: 0,
      available: 0,
      value: 0
    };

    item.warehouses += 1;
    item.quantity += row.quantity;
    item.reserved += row.reserved;
    item.available += row.available;
    item.value += row.quantity * row.avgCost;
    itemMap.set(row.itemId, item);
  }

  const warehouseCards = Array.from(warehouseMap.values()).map((warehouse) => ({
    ...warehouse,
    quantityText: numberText(warehouse.quantity),
    reservedText: numberText(warehouse.reserved),
    availableText: numberText(warehouse.available),
    valueText: money(warehouse.value)
  }));

  const itemCards = Array.from(itemMap.values())
    .map((item) => ({
      ...item,
      quantityText: numberText(item.quantity),
      reservedText: numberText(item.reserved),
      availableText: numberText(item.available),
      valueText: money(item.value),
      isLow: item.available <= STOCK_LOW_THRESHOLD
    }))
    .sort((a, b) => a.available - b.available || a.code.localeCompare(b.code, 'bg-BG'))
    .slice(0, 10);

  const totalQuantity = balances.reduce((sum, row) => sum + row.quantity, 0);
  const totalReserved = balances.reduce((sum, row) => sum + row.reserved, 0);
  const totalValue = balances.reduce((sum, row) => sum + row.quantity * row.avgCost, 0);
  const lowStockCount = balances.filter((row) => row.isLow).length;

  return {
    action,
    successMessage: stockActionMessage(action),
    cards: [
      { title: 'Складове', value: warehousesRaw.length, subtitle: 'активни и архивни' },
      { title: 'Артикули', value: itemsRaw.length, subtitle: 'номенклатурни позиции' },
      { title: 'Наличност', value: numberText(totalQuantity), subtitle: 'общо количество' },
      { title: 'Резервирано', value: numberText(totalReserved), subtitle: 'заета наличност' },
      { title: 'Стойност', value: money(totalValue), subtitle: 'по средна цена' },
      { title: 'Ниски наличности', value: lowStockCount, subtitle: `≤ ${STOCK_LOW_THRESHOLD}` },
      { title: 'Трансфери', value: transferDocumentsCount, subtitle: 'складови документи' }
    ],
    warehouseCards,
    lowStockItems: itemCards,
    movements,
    balancesCount: balances.length
  };
}

export async function getStockAdjustmentFormData() {
  const lists = await getStockFormLists();

  return {
    title: 'Складова корекция',
    directions: [
      { value: 'IN', label: 'Вход към склад' },
      { value: 'OUT', label: 'Изход от склад' }
    ],
    ...lists
  };
}

export async function getStockTransferFormData() {
  const lists = await getStockFormLists();

  return {
    title: 'Трансфер между складове',
    ...lists
  };
}

export async function createStockAdjustmentFromForm(body = {}) {
  const warehouseId = normalizeId(body.warehouseId);
  const itemId = normalizeId(body.itemId);
  const quantity = normalizeQuantity(body.quantity);
  const direction = body.direction === 'OUT' ? 'OUT' : 'IN';
  const reason = safeNote(body.reason) || (direction === 'OUT' ? 'Складова корекция изход' : 'Складова корекция вход');
  const note = safeNote(body.note);

  if (!warehouseId || !itemId || !quantity) {
    return { ok: false, code: 'stock_adjustment_invalid' };
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });

    if (!item || !warehouse) {
      return { ok: false, code: 'stock_adjustment_invalid' };
    }

    const sequence = await nextMovementSequence(tx);
    const sourceDocument = stockSourceNumber('ADJ', sequence);

    if (direction === 'OUT') {
      const decrease = await decrementBalance(tx, warehouseId, itemId, quantity);
      if (!decrease.ok) return decrease;
    } else {
      await incrementBalance(tx, warehouseId, itemId, quantity, Number(item.wholesalePrice || 0));
    }

    await tx.stockMovement.create({
      data: {
        number: `${sourceDocument}-1`,
        movementType: direction === 'OUT' ? 'ADJUSTMENT_OUT' : 'ADJUSTMENT_IN',
        warehouseId,
        itemId,
        quantity,
        direction,
        reason,
        sourceDocument,
        note
      }
    });

    return { ok: true, code: 'stock_adjustment_success', sourceDocument };
  });
}


async function nextTransferNumber(tx) {
  const count = await tx.stockTransferDocument.count();
  return stockSourceNumber('TR', count + 1);
}

function transferStatusText(status) {
  const map = {
    DRAFT: 'Чернова',
    POSTED: 'Публикуван',
    CANCELLED: 'Отказан'
  };

  return map[status] || status || '';
}

function transferStatusKind(status) {
  const map = {
    DRAFT: 'warning',
    POSTED: 'success',
    CANCELLED: 'danger'
  };

  return map[status] || 'neutral';
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return ['DRAFT', 'POSTED', 'CANCELLED'].includes(status) ? status : '';
}

function transferLineRow(line, index, fromWarehouseId = null) {
  const quantity = Number(line.quantity || 0);
  const available = line.item?.stockBalances?.find((balance) => Number(balance.warehouseId) === Number(fromWarehouseId));
  const availableQuantity = Number(available?.quantity || 0) - Number(available?.reservedQuantity || 0);

  return {
    index,
    lineId: line.id,
    itemId: line.itemId,
    itemCode: line.item?.code || '',
    itemName: line.item?.name || '',
    unit: line.item?.unit || '',
    rawQuantity: quantity,
    quantityText: numberText(quantity),
    availableQuantityText: fromWarehouseId ? numberText(availableQuantity) : '',
    note: line.note || '',
    hasEnoughStock: !fromWarehouseId || availableQuantity >= quantity
  };
}

function transferDocumentRow(document) {
  const totalQuantity = document.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const lineCount = document.lines.length;

  return {
    id: document.id,
    number: document.number,
    transferDateText: dateTimeText(document.transferDate),
    fromWarehouseName: document.fromWarehouse?.name || '',
    fromWarehouseCode: document.fromWarehouse?.code || '',
    toWarehouseName: document.toWarehouse?.name || '',
    toWarehouseCode: document.toWarehouse?.code || '',
    status: document.status,
    statusText: transferStatusText(document.status),
    statusKind: transferStatusKind(document.status),
    lineCount,
    lineCountText: String(lineCount),
    quantityText: numberText(totalQuantity),
    note: document.note || '',
    rowOpenUrl: `/stock/transfer/${document.id}`
  };
}

export async function getStockTransferDocumentsData() {
  const documents = await prisma.stockTransferDocument.findMany({
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      lines: true
    },
    orderBy: { transferDate: 'desc' }
  });

  return documents.map(transferDocumentRow);
}

export async function createStockTransferFromForm(body = {}) {
  return createStockTransferDocumentFromForm(body);
}

export async function createStockTransferDocumentFromForm(body = {}) {
  const fromWarehouseId = normalizeId(body.fromWarehouseId);
  const toWarehouseId = normalizeId(body.toWarehouseId);
  const itemId = normalizeId(body.itemId);
  const quantity = normalizeQuantity(body.quantity);
  const note = safeNote(body.note);

  if (!fromWarehouseId || !toWarehouseId || fromWarehouseId === toWarehouseId) {
    return { ok: false, code: 'stock_transfer_invalid' };
  }

  if ((itemId && !quantity) || (!itemId && quantity)) {
    return { ok: false, code: 'stock_transfer_line_invalid' };
  }

  return prisma.$transaction(async (tx) => {
    const [fromWarehouse, toWarehouse] = await Promise.all([
      tx.warehouse.findUnique({ where: { id: fromWarehouseId } }),
      tx.warehouse.findUnique({ where: { id: toWarehouseId } })
    ]);

    if (!fromWarehouse || !toWarehouse) {
      return { ok: false, code: 'stock_transfer_invalid' };
    }

    if (itemId) {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) return { ok: false, code: 'stock_transfer_line_invalid' };
    }

    const number = await nextTransferNumber(tx);
    const document = await tx.stockTransferDocument.create({
      data: {
        number,
        fromWarehouseId,
        toWarehouseId,
        status: 'DRAFT',
        note
      }
    });

    if (itemId && quantity) {
      await tx.stockTransferLine.create({
        data: {
          documentId: document.id,
          itemId,
          quantity,
          note
        }
      });
    }

    return { ok: true, code: 'stock_transfer_document_created', documentId: document.id, number };
  });
}

export async function getStockTransferCardData(documentId, action = '') {
  const id = normalizeId(documentId);
  if (!id) return null;

  const [document, availableItems] = await Promise.all([
    prisma.stockTransferDocument.findUnique({
      where: { id },
      include: {
        fromWarehouse: { include: { location: true } },
        toWarehouse: { include: { location: true } },
        lines: {
          include: {
            item: {
              include: {
                stockBalances: true
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    }),
    prisma.item.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })
  ]);

  if (!document) return null;

  const movementRows = await prisma.stockMovement.findMany({
    where: { sourceDocument: document.number },
    include: { warehouse: { include: { location: true } }, item: true },
    orderBy: [{ movementDate: 'desc' }, { id: 'asc' }]
  });

  const rows = document.lines.map((line, index) => transferLineRow(line, index + 1, document.fromWarehouseId));
  const isEditable = document.status === 'DRAFT';
  const totalQuantity = rows.reduce((sum, row) => sum + Number(row.rawQuantity || 0), 0);
  const canPost = isEditable && rows.length > 0;
  const canCancel = document.status === 'DRAFT';
  const hasInsufficientStock = rows.some((row) => !row.hasEnoughStock);

  return {
    action,
    actionMessage: stockActionMessage(action),
    id: document.id,
    number: document.number,
    transferDateText: dateTimeText(document.transferDate),
    status: document.status,
    statusText: transferStatusText(document.status),
    statusKind: transferStatusKind(document.status),
    note: document.note || '',
    isEditable,
    canPost,
    canCancel,
    hasInsufficientStock,
    lockMessage: document.status === 'POSTED'
      ? 'Трансферът е публикуван и складовите движения са заключени.'
      : document.status === 'CANCELLED'
        ? 'Трансферът е отказан и не може да се редактира.'
        : '',
    fromWarehouse: {
      id: document.fromWarehouse.id,
      code: document.fromWarehouse.code,
      name: document.fromWarehouse.name,
      city: document.fromWarehouse.city || document.fromWarehouse.location?.city || '',
      typeText: locationTypeText(document.fromWarehouse.location?.type)
    },
    toWarehouse: {
      id: document.toWarehouse.id,
      code: document.toWarehouse.code,
      name: document.toWarehouse.name,
      city: document.toWarehouse.city || document.toWarehouse.location?.city || '',
      typeText: locationTypeText(document.toWarehouse.location?.type)
    },
    rows,
    editableRows: isEditable ? rows : [],
    availableItems: availableItems.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      unit: item.unit,
      label: `${item.code} · ${item.name}`
    })),
    stockMovementRows: movementRows.map(movementRow),
    summary: {
      linesText: String(rows.length),
      quantityText: numberText(totalQuantity),
      movementRowsText: String(movementRows.length)
    },
    historyRows: [
      { time: dateTimeText(document.createdAt), user: 'СТЕФАН ТАНАНОВ', action: 'Създаден', details: `Складов трансфер ${document.number}` },
      ...(document.postedAt ? [{ time: dateTimeText(document.postedAt), user: 'СТЕФАН ТАНАНОВ', action: 'Публикуван', details: 'Създадени са складови OUT/IN движения.' }] : []),
      ...(document.cancelledAt ? [{ time: dateTimeText(document.cancelledAt), user: 'СТЕФАН ТАНАНОВ', action: 'Отказан', details: 'Документът е заключен без складово движение.' }] : [])
    ]
  };
}

export async function addStockTransferLine(documentId, body = {}) {
  const id = normalizeId(documentId);
  const itemId = normalizeId(body.itemId);
  const quantity = normalizeQuantity(body.quantity);
  const note = safeNote(body.note);

  if (!id || !itemId || !quantity) return { ok: false, code: 'stock_transfer_line_invalid' };

  return prisma.$transaction(async (tx) => {
    const document = await tx.stockTransferDocument.findUnique({ where: { id } });
    const item = await tx.item.findUnique({ where: { id: itemId } });

    if (!document || !item || document.status !== 'DRAFT') {
      return { ok: false, code: 'stock_transfer_locked' };
    }

    await tx.stockTransferLine.create({
      data: { documentId: id, itemId, quantity, note }
    });

    return { ok: true, code: 'stock_transfer_line_added' };
  });
}

export async function updateStockTransferLine(documentId, lineId, body = {}) {
  const id = normalizeId(documentId);
  const rowId = normalizeId(lineId);
  const quantity = normalizeQuantity(body.quantity);
  const note = safeNote(body.note);

  if (!id || !rowId || !quantity) return { ok: false, code: 'stock_transfer_line_invalid' };

  return prisma.$transaction(async (tx) => {
    const document = await tx.stockTransferDocument.findUnique({ where: { id } });
    const line = await tx.stockTransferLine.findFirst({ where: { id: rowId, documentId: id } });

    if (!document || !line || document.status !== 'DRAFT') {
      return { ok: false, code: 'stock_transfer_locked' };
    }

    await tx.stockTransferLine.update({ where: { id: rowId }, data: { quantity, note } });

    return { ok: true, code: 'stock_transfer_line_updated' };
  });
}

export async function deleteStockTransferLine(documentId, lineId) {
  const id = normalizeId(documentId);
  const rowId = normalizeId(lineId);

  if (!id || !rowId) return { ok: false, code: 'stock_transfer_line_invalid' };

  return prisma.$transaction(async (tx) => {
    const document = await tx.stockTransferDocument.findUnique({ where: { id } });
    const line = await tx.stockTransferLine.findFirst({ where: { id: rowId, documentId: id } });

    if (!document || !line || document.status !== 'DRAFT') {
      return { ok: false, code: 'stock_transfer_locked' };
    }

    await tx.stockTransferLine.delete({ where: { id: rowId } });

    return { ok: true, code: 'stock_transfer_line_deleted' };
  });
}

export async function updateStockTransferDocumentStatus(documentId, nextStatusValue) {
  const id = normalizeId(documentId);
  const nextStatus = normalizeStatus(nextStatusValue);

  if (!id || !nextStatus || nextStatus === 'DRAFT') {
    return { ok: false, code: 'stock_transfer_status_invalid' };
  }

  return prisma.$transaction(async (tx) => {
    const document = await tx.stockTransferDocument.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: { include: { item: true }, orderBy: { id: 'asc' } }
      }
    });

    if (!document || document.status !== 'DRAFT') {
      return { ok: false, code: 'stock_transfer_locked' };
    }

    if (nextStatus === 'CANCELLED') {
      await tx.stockTransferDocument.update({
        where: { id },
        data: { status: 'CANCELLED', cancelledAt: new Date() }
      });
      return { ok: true, code: 'stock_transfer_cancelled' };
    }

    if (document.lines.length === 0) {
      return { ok: false, code: 'stock_transfer_empty' };
    }

    for (const line of document.lines) {
      if (!line.itemId || Number(line.quantity || 0) <= 0) {
        return { ok: false, code: 'stock_transfer_line_invalid' };
      }

      const balance = await findBalance(tx, document.fromWarehouseId, line.itemId);
      const available = Number(balance?.quantity || 0) - Number(balance?.reservedQuantity || 0);
      if (!balance || available < Number(line.quantity || 0)) {
        return { ok: false, code: 'insufficient_stock' };
      }
    }

    let sequence = await nextMovementSequence(tx);
    for (const line of document.lines) {
      const decrease = await decrementBalance(tx, document.fromWarehouseId, line.itemId, Number(line.quantity || 0));
      if (!decrease.ok) return decrease;

      await incrementBalance(tx, document.toWarehouseId, line.itemId, Number(line.quantity || 0), decrease.avgCost || Number(line.item?.wholesalePrice || 0));

      await tx.stockMovement.create({
        data: {
          number: `${document.number}-OUT-${String(sequence).padStart(3, '0')}`,
          movementType: 'TRANSFER',
          warehouseId: document.fromWarehouseId,
          itemId: line.itemId,
          quantity: Number(line.quantity || 0),
          direction: 'OUT',
          reason: `Трансфер към ${document.toWarehouse.name}`,
          sourceDocument: document.number,
          note: document.note || line.note || ''
        }
      });
      sequence += 1;

      await tx.stockMovement.create({
        data: {
          number: `${document.number}-IN-${String(sequence).padStart(3, '0')}`,
          movementType: 'TRANSFER',
          warehouseId: document.toWarehouseId,
          itemId: line.itemId,
          quantity: Number(line.quantity || 0),
          direction: 'IN',
          reason: `Трансфер от ${document.fromWarehouse.name}`,
          sourceDocument: document.number,
          note: document.note || line.note || ''
        }
      });
      sequence += 1;
    }

    await tx.stockTransferDocument.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() }
    });

    return { ok: true, code: 'stock_transfer_posted' };
  });
}

export async function getStockItemCardData(itemId, action = '') {
  const id = normalizeId(itemId);
  if (!id) return null;

  const [item, balancesRaw, movementsRaw] = await Promise.all([
    prisma.item.findUnique({ where: { id } }),
    prisma.stockBalance.findMany({
      where: { itemId: id },
      include: { warehouse: { include: { location: true } }, item: true },
      orderBy: { warehouseId: 'asc' }
    }),
    prisma.stockMovement.findMany({
      where: { itemId: id },
      include: { warehouse: { include: { location: true } }, item: true },
      orderBy: { movementDate: 'desc' },
      take: 80
    })
  ]);

  if (!item) return null;

  const balances = balancesRaw.map(balanceRow);
  const movements = movementsRaw.map(movementRow);
  const totalQuantity = balances.reduce((sum, row) => sum + row.quantity, 0);
  const totalReserved = balances.reduce((sum, row) => sum + row.reserved, 0);
  const totalValue = balances.reduce((sum, row) => sum + row.quantity * row.avgCost, 0);

  return {
    action,
    successMessage: stockActionMessage(action),
    item: {
      id: item.id,
      code: item.code,
      name: item.name,
      groupName: item.groupName || '',
      unit: item.unit,
      barcode: item.barcode || '',
      retailPriceText: money(item.retailPrice),
      wholesalePriceText: money(item.wholesalePrice)
    },
    summary: {
      quantityText: numberText(totalQuantity),
      reservedText: numberText(totalReserved),
      availableText: numberText(totalQuantity - totalReserved),
      valueText: money(totalValue),
      warehousesText: balances.length
    },
    balances,
    movements
  };
}

export async function getStockWarehouseCardData(warehouseId, action = '') {
  const id = normalizeId(warehouseId);
  if (!id) return null;

  const [warehouse, balancesRaw, movementsRaw] = await Promise.all([
    prisma.warehouse.findUnique({ where: { id }, include: { location: true } }),
    prisma.stockBalance.findMany({
      where: { warehouseId: id },
      include: { warehouse: true, item: true },
      orderBy: { itemId: 'asc' }
    }),
    prisma.stockMovement.findMany({
      where: { warehouseId: id },
      include: { warehouse: { include: { location: true } }, item: true },
      orderBy: { movementDate: 'desc' },
      take: 80
    })
  ]);

  if (!warehouse) return null;

  const balances = balancesRaw.map(balanceRow);
  const movements = movementsRaw.map(movementRow);
  const totalQuantity = balances.reduce((sum, row) => sum + row.quantity, 0);
  const totalReserved = balances.reduce((sum, row) => sum + row.reserved, 0);
  const totalValue = balances.reduce((sum, row) => sum + row.quantity * row.avgCost, 0);

  return {
    action,
    successMessage: stockActionMessage(action),
    warehouse: {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      city: warehouse.city || warehouse.location?.city || '',
      typeText: locationTypeText(warehouse.location?.type),
      address: warehouse.location?.address || '',
      phone: warehouse.location?.phone || '',
      email: warehouse.location?.email || '',
      canSellText: warehouse.location?.canSell ? 'Да' : 'Не',
      canReceivePurchasesText: warehouse.location?.canReceivePurchases ? 'Да' : 'Не',
      canTransferText: warehouse.location?.canTransfer ? 'Да' : 'Не',
      statusText: warehouse.isActive ? 'Активен' : 'Спрян'
    },
    summary: {
      quantityText: numberText(totalQuantity),
      reservedText: numberText(totalReserved),
      availableText: numberText(totalQuantity - totalReserved),
      valueText: money(totalValue),
      positionsText: balances.length
    },
    balances,
    movements
  };
}

export function stockActionMessage(action = '') {
  const map = {
    stock_adjustment_success: 'Складовата корекция е записана успешно.',
    stock_transfer_success: 'Складовият трансфер е записан успешно.',
    stock_transfer_document_created: 'Създаден е нов складов трансфер в статус Чернова.',
    stock_transfer_line_added: 'Редът е добавен към трансфера.',
    stock_transfer_line_updated: 'Редът е обновен.',
    stock_transfer_line_deleted: 'Редът е изтрит.',
    stock_transfer_posted: 'Складовият трансфер е публикуван и движенията са записани.',
    stock_transfer_cancelled: 'Складовият трансфер е отказан.',
    stock_adjustment_invalid: 'Провери склад, артикул и количество за корекцията.',
    stock_transfer_invalid: 'Провери изходния и приемащия склад за трансфера.',
    stock_transfer_line_invalid: 'Провери артикул и количество за реда на трансфера.',
    stock_transfer_locked: 'Трансферът е заключен и не може да се редактира.',
    stock_transfer_empty: 'Добави поне един ред преди публикуване.',
    stock_transfer_status_invalid: 'Невалиден статус за складовия трансфер.',
    insufficient_stock: 'Няма достатъчна наличност за избраната операция.'
  };

  return map[action] || '';
}
