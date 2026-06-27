import fs from 'fs';
import path from 'path';
import prisma from '../db/prisma.js';

const imageRoot = path.resolve('public/uploads/item-images');
const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

function numberText(value) {
  return Number(value || 0).toFixed(2);
}

function money(value, currency = 'BGN') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function dateText(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value)).replace(',', '');
}

export function safeItemImageBaseName(value = '') {
  const raw = String(value || '').trim() || 'item-image';
  const cleaned = raw
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return cleaned || 'item-image';
}

function imageUrlForItemCode(code = '') {
  const base = safeItemImageBaseName(code);

  for (const ext of imageExtensions) {
    const fileName = `${base}${ext}`;
    const fullPath = path.join(imageRoot, fileName);
    if (fs.existsSync(fullPath)) {
      return `/public/uploads/item-images/${encodeURIComponent(fileName)}`;
    }
  }

  return '';
}

function statusLabel(value) {
  const quantity = Number(value || 0);
  if (quantity > 0) return 'Свободно';
  return 'Няма свободно';
}

function selectedPrice(item, priceList) {
  const priceListItem = item.priceListItems?.find((entry) => entry.priceList?.id === priceList?.id) || item.priceListItems?.[0];
  return Number(priceListItem?.price ?? item.retailPrice ?? 0);
}

function normalizeLocationName(warehouse) {
  return warehouse?.location?.name || warehouse?.name || '';
}

function locationTypeText(type) {
  const map = {
    OFFICE: 'Офис',
    CENTRAL_WAREHOUSE: 'Централен склад',
    REGIONAL_WAREHOUSE: 'Регионален склад',
    SHOP: 'Търговски обект',
    SERVICE: 'Сервиз',
    VEHICLE: 'Автомобил',
    VIRTUAL: 'Виртуален склад'
  };

  return map[type] || 'Обект';
}

function actionLabel(available) {
  return Number(available || 0) > 0 ? 'Добави' : 'Няма свободно';
}

function isShelfMissing(document) {
  const text = `${document?.note || ''} ${(document?.lines || []).map((line) => line.note || '').join(' ')}`.toLocaleLowerCase('bg-BG');
  return text.includes('липса на рафт') || text.includes('не е намерено') || text.includes('shelf_missing');
}

function availabilityTone({ isCurrent, available, reserved }) {
  if (isCurrent) return 'current';
  if (Number(available || 0) <= 0) return Number(reserved || 0) > 0 ? 'busy' : 'empty';
  if (Number(available || 0) <= 2) return 'low';
  return 'free';
}

function transferStatusText(status) {
  const map = {
    DRAFT: 'Чернова',
    POSTED: 'Изпратен',
    CANCELLED: 'Отказан'
  };

  return map[status] || status || '';
}

function transferLineRows(documents = [], itemId, currentWarehouseId) {
  const incomingTasks = [];
  const outgoingRequests = [];
  const history = [];

  for (const document of documents) {
    const lines = (document.lines || []).filter((line) => Number(line.itemId || 0) === Number(itemId || 0));
    if (!lines.length) continue;

    const quantity = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const base = {
      id: document.id,
      number: document.number,
      status: document.status,
      statusText: transferStatusText(document.status),
      fromWarehouseId: document.fromWarehouseId,
      toWarehouseId: document.toWarehouseId,
      fromName: normalizeLocationName(document.fromWarehouse),
      toName: normalizeLocationName(document.toWarehouse),
      quantity,
      quantityText: numberText(quantity),
      createdAtText: dateText(document.createdAt),
      cardUrl: `/stock/transfer/${document.id}`,
      isShelfMissing: isShelfMissing(document)
    };

    if (document.status === 'DRAFT' && document.fromWarehouseId === currentWarehouseId) {
      incomingTasks.push({
        ...base,
        tone: 'needs-action',
        statusText: 'Чака проверка на рафт',
        actionText: 'Изпрати',
        missingActionText: 'Липса',
        helperText: `${base.toName} очаква стока от ${base.fromName}`
      });
    } else if (document.status === 'DRAFT' && document.toWarehouseId === currentWarehouseId) {
      outgoingRequests.push({
        ...base,
        tone: 'waiting',
        actionText: 'Чакаме',
        statusText: 'Чака проверка',
        helperText: `Поискано от ${base.fromName}`
      });
    } else if (document.status === 'CANCELLED' && base.isShelfMissing && document.toWarehouseId === currentWarehouseId) {
      outgoingRequests.push({
        ...base,
        tone: 'missing',
        actionText: 'ЛИПСА',
        statusText: 'ЛИПСА НА РАФТ',
        helperText: `${base.fromName} не намери артикула на рафт`
      });
      history.push({
        ...base,
        tone: 'missing',
        statusText: 'ЛИПСА НА РАФТ',
        helperText: `${base.fromName} → ${base.toName}`
      });
    } else if (document.status !== 'DRAFT') {
      history.push({
        ...base,
        tone: base.isShelfMissing ? 'missing' : (document.status === 'POSTED' ? 'done' : 'cancelled'),
        statusText: base.isShelfMissing ? 'ЛИПСА НА РАФТ' : base.statusText,
        helperText: `${base.fromName} → ${base.toName}`
      });
    }
  }

  return { incomingTasks, outgoingRequests, history };
}

export async function getPriceListWorkbenchData() {
  const [priceList, items, warehouses, transferDocuments] = await Promise.all([
    prisma.priceList.findFirst({ where: { status: 'ACTIVE' }, orderBy: { code: 'asc' } }),
    prisma.item.findMany({
      where: { isActive: true },
      include: {
        priceListItems: { include: { priceList: true } },
        stockBalances: { include: { warehouse: { include: { location: true } } } }
      },
      orderBy: { code: 'asc' }
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      include: { location: true },
      orderBy: [{ code: 'asc' }]
    }),
    prisma.stockTransferDocument.findMany({
      include: {
        fromWarehouse: { include: { location: true } },
        toWarehouse: { include: { location: true } },
        lines: { include: { item: true } }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 80
    })
  ]);

  const currentWarehouse = warehouses.find((warehouse) => warehouse.location?.isCurrent) || warehouses[0] || null;
  const currentWarehouseId = currentWarehouse?.id || null;
  const currency = priceList?.currency || 'BGN';

  const rows = items.map((item) => {
    const balances = item.stockBalances || [];
    const currentBalance = balances.find((balance) => balance.warehouseId === currentWarehouseId) || null;
    const currentQuantity = Number(currentBalance?.quantity || 0);
    const currentReserved = Number(currentBalance?.reservedQuantity || 0);
    const currentAvailable = Math.max(currentQuantity - currentReserved, 0);
    const totalQuantity = balances.reduce((sum, balance) => sum + Number(balance.quantity || 0), 0);
    const totalReserved = balances.reduce((sum, balance) => sum + Number(balance.reservedQuantity || 0), 0);
    const totalAvailable = Math.max(totalQuantity - totalReserved, 0);
    const price = selectedPrice(item, priceList);
    const imageUrl = imageUrlForItemCode(item.code);
    const requestData = transferLineRows(transferDocuments, item.id, currentWarehouseId);

    const availability = warehouses
      .map((warehouse) => {
        const balance = balances.find((entry) => entry.warehouseId === warehouse.id);
        const quantity = Number(balance?.quantity || 0);
        const reserved = Number(balance?.reservedQuantity || 0);
        const available = Math.max(quantity - reserved, 0);
        const isCurrent = warehouse.id === currentWarehouseId;
        const tone = availabilityTone({ isCurrent, available, reserved });

        return {
          warehouseId: warehouse.id,
          warehouseCode: warehouse.code,
          warehouseName: normalizeLocationName(warehouse),
          locationType: warehouse.location?.type || '',
          locationTypeText: locationTypeText(warehouse.location?.type),
          city: warehouse.city || warehouse.location?.city || '',
          isCurrent,
          isCurrentText: isCurrent ? 'Текущ обект' : '',
          quantity,
          reserved,
          available,
          quantityText: numberText(quantity),
          reservedText: numberText(reserved),
          availableText: numberText(available),
          statusText: statusLabel(available),
          actionText: actionLabel(available),
          canRequest: available > 0 && !isCurrent,
          defaultRequestQuantityText: numberText(Math.min(1, available || 1)),
          tone,
          isFree: tone === 'free',
          isLow: tone === 'low',
          isBusy: tone === 'busy',
          isEmpty: tone === 'empty'
        };
      })
      .sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        if (b.available !== a.available) return b.available - a.available;
        return a.warehouseName.localeCompare(b.warehouseName, 'bg');
      });

    const incomingRequestCount = requestData.incomingTasks.length;
    const outgoingRequestCount = requestData.outgoingRequests.length;

    return {
      id: item.id,
      code: item.code,
      safeImageName: `${safeItemImageBaseName(item.code)}.png`,
      name: item.name,
      unit: item.unit,
      groupName: item.groupName || '',
      barcode: item.barcode || '',
      price,
      priceText: money(price, currency),
      retailPriceText: money(item.retailPrice, currency),
      wholesalePriceText: money(item.wholesalePrice, currency),
      currentWarehouseName: normalizeLocationName(currentWarehouse),
      currentQuantity,
      currentReserved,
      currentAvailable,
      currentQuantityText: numberText(currentQuantity),
      currentReservedText: numberText(currentReserved),
      currentAvailableText: numberText(currentAvailable),
      totalQuantity,
      totalReserved,
      totalAvailable,
      totalQuantityText: numberText(totalQuantity),
      totalReservedText: numberText(totalReserved),
      totalAvailableText: numberText(totalAvailable),
      inTransferText: numberText(requestData.outgoingRequests.reduce((sum, row) => sum + row.quantity, 0)),
      incomingRequestCount,
      outgoingRequestCount,
      incomingRequestBadge: incomingRequestCount ? `${incomingRequestCount} чака` : '',
      imageUrl,
      imageStatusText: imageUrl ? 'Има снимка' : 'Няма снимка',
      itemCardUrl: `/stock/item/${item.id}`,
      availability,
      incomingRequests: requestData.incomingTasks,
      outgoingRequests: requestData.outgoingRequests,
      transferHistory: requestData.history.slice(0, 8)
    };
  });

  const rowsWithStock = rows.filter((row) => row.currentAvailable > 0).length;
  const rowsWithIncomingRequests = rows.filter((row) => row.incomingRequestCount > 0).length;

  return {
    title: 'Артикули, цени и наличности',
    priceListName: priceList?.name || 'Продажна ценова листа',
    currency,
    currentWarehouse: currentWarehouse ? {
      id: currentWarehouse.id,
      code: currentWarehouse.code,
      name: normalizeLocationName(currentWarehouse)
    } : null,
    columns: [
      { key: 'code', label: 'Код', visible: true },
      { key: 'name', label: 'Описание', visible: true },
      { key: 'priceText', label: 'Ед. цена', visible: true },
      { key: 'currentAvailableText', label: 'Своб. к-во', visible: true },
      { key: 'currentQuantityText', label: 'Налично к-во', visible: true },
      { key: 'unit', label: 'Мярка', visible: true },
      { key: 'totalQuantityText', label: 'Обща наличност', visible: true },
      { key: 'groupName', label: 'Група', visible: true },
      { key: 'barcode', label: 'Баркод', visible: false },
      { key: 'wholesalePriceText', label: 'Доставна цена', visible: false },
      { key: 'currentReservedText', label: 'Резервирано', visible: false },
      { key: 'totalAvailableText', label: 'Общо свободно', visible: false },
      { key: 'inTransferText', label: 'В заявка', visible: false },
      { key: 'incomingRequestBadge', label: 'Искат от нас', visible: false },
      { key: 'imageStatusText', label: 'Снимка', visible: false }
    ],
    quickViews: [
      { id: 'sales', title: 'Продажба', columns: 'code,name,priceText,currentAvailableText,totalQuantityText' },
      { id: 'stock', title: 'Склад', columns: 'code,name,currentQuantityText,currentReservedText,currentAvailableText,totalQuantityText' },
      { id: 'delivery', title: 'Доставки', columns: 'code,name,wholesalePriceText,unit,barcode,groupName' },
      { id: 'transfer', title: 'Трансфери', columns: 'code,name,currentAvailableText,totalAvailableText,inTransferText,incomingRequestBadge,totalQuantityText' },
      { id: 'full', title: 'Пълен изглед', columns: 'code,name,priceText,currentAvailableText,currentQuantityText,unit,totalQuantityText,groupName,barcode,wholesalePriceText,currentReservedText,totalAvailableText,inTransferText,incomingRequestBadge,imageStatusText' }
    ],
    rows,
    counters: {
      rows: rows.length,
      rowsWithStock,
      rowsWithIncomingRequests,
      totalQuantityText: numberText(rows.reduce((sum, row) => sum + row.totalQuantity, 0)),
      currentWarehouseName: normalizeLocationName(currentWarehouse)
    }
  };
}
