import prisma from '../db/prisma.js';
import { DEFAULT_LOCATION_CODE, locationTransferCapabilities } from '../data/autogrand-foundation.js';

export function locationTypeText(type = '') {
  const map = {
    OFFICE: 'Централен офис',
    CENTRAL_WAREHOUSE: 'Централен склад',
    REGIONAL_WAREHOUSE: 'Регионален склад',
    SHOP: 'Търговски обект',
    SERVICE: 'Сервизен обект',
    VEHICLE: 'Мобилен склад',
    VIRTUAL: 'Виртуален склад'
  };

  return map[type] || type || 'Обект';
}

function yesNo(value) {
  return value ? 'Да' : 'Не';
}

function enabledDisabled(value) {
  return value ? 'Разрешено' : 'Не';
}

function contactLine(location) {
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.address) parts.push(location.address);
  return parts.join(' · ');
}

function locationRow(location) {
  const warehouse = location.warehouses?.[0] || null;
  const transfer = locationTransferCapabilities(location);
  return {
    id: location.id,
    code: location.code,
    name: location.name,
    type: location.type,
    typeText: locationTypeText(location.type),
    city: location.city || '',
    address: location.address || '',
    phone: location.phone || '',
    email: location.email || '',
    contactPerson: location.contactPerson || '',
    contactLine: contactLine(location),
    canHoldStock: location.canHoldStock,
    canSell: location.canSell,
    canReceivePurchases: location.canReceivePurchases,
    canTransfer: location.canTransfer,
    canRequestTransfer: transfer.canRequestTransfer,
    canDispatchTransfer: transfer.canDispatchTransfer,
    canReceiveTransfer: transfer.canReceiveTransfer,
    canHoldStockText: yesNo(location.canHoldStock),
    canSellText: yesNo(location.canSell),
    canReceivePurchasesText: yesNo(location.canReceivePurchases),
    canTransferText: yesNo(location.canTransfer),
    canRequestTransferText: enabledDisabled(transfer.canRequestTransfer),
    canDispatchTransferText: enabledDisabled(transfer.canDispatchTransfer),
    canReceiveTransferText: enabledDisabled(transfer.canReceiveTransfer),
    isDefault: location.isDefault,
    isCurrent: location.isCurrent || location.code === DEFAULT_LOCATION_CODE,
    isActive: location.isActive,
    statusText: location.isActive ? 'Активен' : 'Спрян',
    warehouseId: warehouse?.id || null,
    warehouseCode: warehouse?.code || '',
    warehouseName: warehouse?.name || ''
  };
}

function money(value, currency = 'BGN') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function numberText(value) {
  return Number(value || 0).toFixed(2);
}

function groupLocations(rows) {
  const order = ['OFFICE', 'CENTRAL_WAREHOUSE', 'REGIONAL_WAREHOUSE', 'SHOP', 'SERVICE', 'VEHICLE', 'VIRTUAL'];
  return order
    .map((type) => {
      const items = rows.filter((row) => row.type === type);
      return {
        type,
        title: locationTypeText(type),
        count: items.length,
        items
      };
    })
    .filter((group) => group.count > 0);
}

export async function getCompanyLocationsData() {
  const locationsRaw = await prisma.companyLocation.findMany({
    include: { warehouses: true, company: true },
    orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }]
  });

  const rows = locationsRaw.map(locationRow);
  const stockLocations = rows.filter((row) => row.canHoldStock);
  const salesLocations = rows.filter((row) => row.canSell);
  const currentLocation = rows.find((row) => row.code === DEFAULT_LOCATION_CODE) || rows.find((row) => row.isCurrent) || rows.find((row) => row.isDefault) || null;
  const transferLocations = rows.filter((row) => row.canTransfer);

  return {
    rows,
    groups: groupLocations(rows),
    currentLocation,
    cards: [
      { title: 'Всички обекти', value: rows.length, subtitle: '17 реални AutoGrand обекта от foundation базата' },
      { title: 'Складови обекти', value: stockLocations.length, subtitle: 'всички без централния офис' },
      { title: 'Обекти с продажби', value: salesLocations.length, subtitle: 'всички без офис и централен склад' },
      { title: 'Трансферни обекти', value: transferLocations.length, subtitle: 'всички без централния офис' },
      { title: 'Активен обект', value: currentLocation?.city || '—', subtitle: currentLocation?.name || 'не е избран' }
    ]
  };
}

export async function getCompanyLocationCardData(locationId) {
  const id = Number(locationId || 0);
  if (!Number.isInteger(id) || id <= 0) return null;

  const location = await prisma.companyLocation.findUnique({
    where: { id },
    include: {
      company: true,
      warehouses: {
        include: {
          stockBalances: {
            include: { item: true }
          },
          stockMovements: {
            include: { item: true },
            orderBy: { movementDate: 'desc' },
            take: 40
          }
        }
      }
    }
  });

  if (!location) return null;

  const row = locationRow(location);
  const warehouse = location.warehouses?.[0] || null;
  const balances = warehouse?.stockBalances || [];
  const movements = warehouse?.stockMovements || [];
  const totalQuantity = balances.reduce((sum, balance) => sum + Number(balance.quantity || 0), 0);
  const totalReserved = balances.reduce((sum, balance) => sum + Number(balance.reservedQuantity || 0), 0);
  const totalValue = balances.reduce((sum, balance) => sum + Number(balance.quantity || 0) * Number(balance.avgCost || 0), 0);

  return {
    location: row,
    companyName: location.company?.name || '',
    summary: {
      positionsText: balances.length,
      quantityText: numberText(totalQuantity),
      reservedText: numberText(totalReserved),
      availableText: numberText(totalQuantity - totalReserved),
      valueText: money(totalValue),
      movementsText: movements.length
    },
    balances: balances.map((balance) => ({
      id: balance.id,
      itemId: balance.itemId,
      itemCode: balance.item?.code || '',
      itemName: balance.item?.name || '',
      unit: balance.item?.unit || '',
      quantityText: numberText(balance.quantity),
      reservedText: numberText(balance.reservedQuantity),
      availableText: numberText(Number(balance.quantity || 0) - Number(balance.reservedQuantity || 0)),
      avgCostText: money(balance.avgCost),
      stockValueText: money(Number(balance.quantity || 0) * Number(balance.avgCost || 0))
    })),
    movements: movements.map((movement) => ({
      id: movement.id,
      number: movement.number,
      movementDateText: new Intl.DateTimeFormat('bg-BG').format(new Date(movement.movementDate)),
      movementType: movement.movementType,
      itemCode: movement.item?.code || '',
      itemName: movement.item?.name || '',
      quantityText: numberText(movement.quantity),
      directionText: movement.direction === 'IN' ? 'Вход' : movement.direction === 'OUT' ? 'Изход' : 'Трансфер',
      sourceDocument: movement.sourceDocument || '',
      reason: movement.reason || ''
    }))
  };
}
