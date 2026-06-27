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
  const [balancesRaw, movementsRaw, warehousesRaw, itemsRaw] = await Promise.all([
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
    prisma.item.findMany({ orderBy: { code: 'asc' } })
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
      { title: 'Ниски наличности', value: lowStockCount, subtitle: `≤ ${STOCK_LOW_THRESHOLD}` }
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

export async function createStockTransferFromForm(body = {}) {
  const fromWarehouseId = normalizeId(body.fromWarehouseId);
  const toWarehouseId = normalizeId(body.toWarehouseId);
  const itemId = normalizeId(body.itemId);
  const quantity = normalizeQuantity(body.quantity);
  const note = safeNote(body.note);

  if (!fromWarehouseId || !toWarehouseId || !itemId || !quantity || fromWarehouseId === toWarehouseId) {
    return { ok: false, code: 'stock_transfer_invalid' };
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    const fromWarehouse = await tx.warehouse.findUnique({ where: { id: fromWarehouseId } });
    const toWarehouse = await tx.warehouse.findUnique({ where: { id: toWarehouseId } });

    if (!item || !fromWarehouse || !toWarehouse) {
      return { ok: false, code: 'stock_transfer_invalid' };
    }

    const decrease = await decrementBalance(tx, fromWarehouseId, itemId, quantity);
    if (!decrease.ok) return decrease;

    await incrementBalance(tx, toWarehouseId, itemId, quantity, decrease.avgCost || Number(item.wholesalePrice || 0));

    const sequence = await nextMovementSequence(tx);
    const sourceDocument = stockSourceNumber('TR', sequence);

    await tx.stockMovement.create({
      data: {
        number: `${sourceDocument}-OUT`,
        movementType: 'TRANSFER',
        warehouseId: fromWarehouseId,
        itemId,
        quantity,
        direction: 'OUT',
        reason: `Трансфер към ${toWarehouse.name}`,
        sourceDocument,
        note
      }
    });

    await tx.stockMovement.create({
      data: {
        number: `${sourceDocument}-IN`,
        movementType: 'TRANSFER',
        warehouseId: toWarehouseId,
        itemId,
        quantity,
        direction: 'IN',
        reason: `Трансфер от ${fromWarehouse.name}`,
        sourceDocument,
        note
      }
    });

    return { ok: true, code: 'stock_transfer_success', sourceDocument };
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
    stock_adjustment_invalid: 'Провери склад, артикул и количество за корекцията.',
    stock_transfer_invalid: 'Провери складовете, артикула и количеството за трансфера.',
    insufficient_stock: 'Няма достатъчна наличност за избраната операция.'
  };

  return map[action] || '';
}
