import prisma from '../src/db/prisma.js';
import { AUTOGRAND_COMPANY, AUTOGRAND_LOCATIONS } from '../src/data/autogrand-foundation.js';
import { AUTOGRAND_REAL_KARDZHALI_USERS, AUTOGRAND_PERMISSIONS, AUTOGRAND_ROLE_TEMPLATES } from '../src/data/autogrand-identity-foundation.js';

async function reset() {
  await prisma.userPermissionOverride.deleteMany();
  await prisma.userLocationAccess.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.serviceOrderLine.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustmentLine.deleteMany();
  await prisma.stockAdjustmentDocument.deleteMany();
  await prisma.stockTransferLine.deleteMany();
  await prisma.stockTransferDocument.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.purchaseDocumentLine.deleteMany();
  await prisma.purchaseDocument.deleteMany();
  await prisma.salesDocumentLine.deleteMany();
  await prisma.salesDocument.deleteMany();
  await prisma.cashEntry.deleteMany();
  await prisma.priceListItem.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.item.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.companyLocation.deleteMany();
  await prisma.counterparty.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.company.deleteMany();
}

async function seedIdentityFoundation(company, locations) {
  const permissionRows = new Map();
  for (const permission of AUTOGRAND_PERMISSIONS) {
    const row = await prisma.permission.create({ data: permission });
    permissionRows.set(row.code, row);
  }

  const roleRows = new Map();
  for (const role of AUTOGRAND_ROLE_TEMPLATES) {
    const row = await prisma.role.create({
      data: {
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level,
        companyId: company.id,
        isSystem: true,
        isActive: true
      }
    });

    roleRows.set(row.code, row);

    for (const permissionCode of role.permissions) {
      const permission = permissionRows.get(permissionCode);
      if (!permission) continue;

      await prisma.rolePermission.create({
        data: { roleId: row.id, permissionId: permission.id, allowed: true }
      });
    }
  }

  const locationsByCode = new Map(locations.map((location) => [location.code, location]));
  const employeesByCode = new Map();

  for (const userSeed of AUTOGRAND_REAL_KARDZHALI_USERS) {
    const roleTemplate = roleRows.get(userSeed.roleCode) || roleRows.get('READONLY');
    const defaultLocation = locationsByCode.get(userSeed.defaultLocationCode) || null;

    let employee = employeesByCode.get(userSeed.employeeCode);
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          code: userSeed.employeeCode,
          firstName: userSeed.firstName || null,
          lastName: userSeed.lastName || null,
          displayName: userSeed.employeeDisplayName || userSeed.displayName,
          position: userSeed.employeePosition || userSeed.position || roleTemplate?.name || '',
          companyId: company.id,
          primaryLocationId: defaultLocation?.id || null,
          isActive: true
        }
      });
      employeesByCode.set(userSeed.employeeCode, employee);
    }

    const user = await prisma.user.create({
      data: {
        username: userSeed.username,
        displayName: userSeed.displayName,
        role: roleTemplate?.code?.toLowerCase() || 'readonly',
        passwordHash: 'dev-placeholder-change-later',
        language: 'bg',
        companyId: company.id,
        employeeId: employee.id,
        roleId: roleTemplate?.id || null,
        defaultLocationId: defaultLocation?.id || null,
        isActive: true
      }
    });

    let accessLocations = [];
    if (userSeed.access === 'all-locations') {
      accessLocations = locations;
    } else if (userSeed.access === 'all-transfer-locations') {
      accessLocations = locations.filter((location) => location.canTransfer);
    } else {
      const codes = Array.isArray(userSeed.access) ? userSeed.access : [userSeed.defaultLocationCode];
      accessLocations = codes.map((code) => locationsByCode.get(code)).filter(Boolean);
    }

    const rolePermissionCodes = new Set(userSeed.roleCode === 'ADMIN'
      ? AUTOGRAND_PERMISSIONS.map((permission) => permission.code)
      : AUTOGRAND_ROLE_TEMPLATES.find((role) => role.code === userSeed.roleCode)?.permissions || []);

    for (const location of accessLocations) {
      await prisma.userLocationAccess.create({
        data: {
          userId: user.id,
          locationId: location.id,
          isDefault: defaultLocation?.id === location.id,
          canLogin: true,
          canSell: Boolean(location.canSell) && (rolePermissionCodes.has('sales.insert') || rolePermissionCodes.has('sales.finish')),
          canRequestTransfer: Boolean(location.canTransfer) && rolePermissionCodes.has('transfer.request'),
          canDispatchTransfer: Boolean(location.canTransfer) && rolePermissionCodes.has('transfer.dispatch'),
          canReceiveTransfer: Boolean(location.canTransfer) && rolePermissionCodes.has('transfer.receive')
        }
      });
    }
  }
}

async function main() {
  await reset();

  const company = await prisma.company.create({
    data: AUTOGRAND_COMPANY
  });

  const customers = await Promise.all([
    prisma.counterparty.create({
      data: { code: 'C0001', name: 'Автоклиент 1 ЕООД', kind: 'CUSTOMER', city: 'Кърджали', phone: '0888 000 001' }
    }),
    prisma.counterparty.create({
      data: { code: 'C0002', name: 'Сервизен клиент ООД', kind: 'CUSTOMER', city: 'Хасково', phone: '0888 000 002' }
    })
  ]);

  const suppliers = await Promise.all([
    prisma.counterparty.create({
      data: { code: 'S0001', name: 'Доставчик Авточасти ЕООД', kind: 'SUPPLIER', city: 'Пловдив', phone: '0888 000 003' }
    }),
    prisma.counterparty.create({
      data: { code: 'S0002', name: 'Доставчик Масла ООД', kind: 'SUPPLIER', city: 'София', phone: '0888 000 004' }
    })
  ]);

  const locationSeed = AUTOGRAND_LOCATIONS;

  const locations = [];
  for (const location of locationSeed) {
    locations.push(await prisma.companyLocation.create({
      data: {
        ...location,
        companyId: company.id
      }
    }));
  }

  const warehouses = [];
  for (const location of locations.filter((entry) => entry.canHoldStock)) {
    warehouses.push(await prisma.warehouse.create({
      data: {
        code: location.code,
        name: location.name,
        city: location.city,
        locationId: location.id
      }
    }));
  }

  await seedIdentityFoundation(company, locations);

  const activeWarehouse = warehouses.find((warehouse) => warehouse.code === 'AG-KJ-SHOP') || warehouses[0];
  const centralWarehouse = warehouses.find((warehouse) => warehouse.code === 'AG-STZ-CENTRAL') || activeWarehouse;

  const items = await Promise.all([
    prisma.item.create({
      data: { code: 'A-0001', name: 'Моторно масло 5W-30', groupName: 'Масла', unit: 'бр.', barcode: '380000000001', retailPrice: 28.5, wholesalePrice: 24 }
    }),
    prisma.item.create({
      data: { code: 'A-0002', name: 'Въздушен филтър', groupName: 'Филтри', unit: 'бр.', barcode: '380000000002', retailPrice: 18.9, wholesalePrice: 15.2 }
    }),
    prisma.item.create({
      data: { code: 'A-0003', name: 'Комплект спирачни накладки', groupName: 'Спирачна система', unit: 'к-т', barcode: '380000000003', retailPrice: 96, wholesalePrice: 82 }
    }),
    prisma.item.create({
      data: { code: 'A-0004', name: 'Акумулатор 74Ah', groupName: 'Електрооборудване', unit: 'бр.', barcode: '380000000004', retailPrice: 185, wholesalePrice: 158 }
    })
  ]);

  const retailList = await prisma.priceList.create({
    data: { code: 'PL-RET', name: 'Продажна ценова листа', currency: 'BGN', status: 'ACTIVE' }
  });

  for (const item of items) {
    await prisma.priceListItem.create({
      data: { priceListId: retailList.id, itemId: item.id, price: item.retailPrice, vatPercent: 20 }
    });
  }

  const salesDocs = [
    ['OF-000001', 'OFFER', customers[0].id, 171.0, 'Оферта към клиент'],
    ['PO-000001', 'CUSTOMER_ORDER', customers[0].id, 46.8, 'Поръчка от клиент'],
    ['SL-000001', 'SALE', customers[0].id, 143.4, 'Продажба'],
    ['CN-000001', 'CREDIT_NOTE', customers[0].id, -18.9, 'Кредитно известие'],
    ['DN-000001', 'DEBIT_NOTE', customers[1].id, 28.5, 'Дебитно известие'],
    ['SBO-000001', 'SALE_BY_ORDER', customers[1].id, 96.0, 'Продажба по поръчка'],
    ['FI-000001', 'FREE_INVOICE_SALE', customers[1].id, 124.5, 'Свободна фактура продажби'],
    ['FCN-000001', 'FREE_CREDIT_NOTE_SALE', customers[1].id, -28.5, 'Свободно КИ продажба'],
    ['WC-000001', 'WARRANTY_CARD', customers[0].id, 0, 'Гаранционна карта']
  ];

  for (const [number, docType, counterpartyId, totalGross, note] of salesDocs) {
    const doc = await prisma.salesDocument.create({
      data: {
        number,
        docType,
        counterpartyId,
        warehouseId: activeWarehouse.id,
        status: docType === 'OFFER' ? 'DRAFT' : 'POSTED',
        totalNet: Number((totalGross / 1.2).toFixed(2)),
        totalVat: Number((totalGross - totalGross / 1.2).toFixed(2)),
        totalGross,
        note
      }
    });

    if (totalGross !== 0) {
      await prisma.salesDocumentLine.create({
        data: {
          documentId: doc.id,
          itemId: items[0].id,
          warehouseId: activeWarehouse.id,
          quantity: 1,
          price: Math.abs(totalGross),
          discountPercent: 0,
          lineTotal: totalGross
        }
      });
    }
  }

  const purchaseDocs = [
    ['PORD-000001', 'PURCHASE_ORDER', suppliers[0].id, 340.0, 'Поръчка към доставчик'],
    ['PINV-000001', 'SUPPLIER_INVOICE', suppliers[0].id, 420.0, 'Фактура доставчик'],
    ['DEL-000001', 'DELIVERY', suppliers[1].id, 185.0, 'Доставка към склад']
  ];

  for (const [number, docType, supplierId, totalGross, note] of purchaseDocs) {
    const doc = await prisma.purchaseDocument.create({
      data: {
        number,
        docType,
        supplierId,
        warehouseId: activeWarehouse.id,
        status: docType === 'PURCHASE_ORDER' ? 'DRAFT' : 'POSTED',
        totalNet: Number((totalGross / 1.2).toFixed(2)),
        totalVat: Number((totalGross - totalGross / 1.2).toFixed(2)),
        totalGross,
        note
      }
    });

    await prisma.purchaseDocumentLine.create({
      data: {
        documentId: doc.id,
        itemId: items[1].id,
        warehouseId: activeWarehouse.id,
        quantity: 5,
        price: totalGross / 5,
        lineTotal: totalGross
      }
    });
  }

  await prisma.cashEntry.create({
    data: { number: 'ADV-000001', kind: 'ADVANCE', description: 'Авансово плащане по клиентска поръчка', counterpartyName: customers[0].name, amount: 100, paymentMethod: 'cash' }
  });
  await prisma.cashEntry.create({
    data: { number: 'PAY-000001', kind: 'SALE_PAYMENT', description: 'Плащане продажби', counterpartyName: customers[0].name, amount: 143.4, paymentMethod: 'cash', relatedDocument: 'SL-000001' }
  });
  await prisma.cashEntry.create({
    data: { number: 'SPAY-000001', kind: 'SUPPLIER_PAYMENT', description: 'Плащане към доставчик', counterpartyName: suppliers[0].name, amount: 420, paymentMethod: 'bank', relatedDocument: 'PINV-000001' }
  });
  await prisma.cashEntry.create({
    data: { number: 'CASH-000001', kind: 'CASH_IN', description: 'Дневна каса — начален приход', counterpartyName: 'Каса', amount: 250, paymentMethod: 'cash' }
  });

  for (const item of items) {
    await prisma.stockBalance.create({
      data: {
        warehouseId: activeWarehouse.id,
        itemId: item.id,
        quantity: item.code === 'A-0001' ? 34 : item.code === 'A-0002' ? 18 : item.code === 'A-0003' ? 7 : 4,
        reservedQuantity: item.code === 'A-0003' ? 1 : 0,
        avgCost: item.wholesalePrice
      }
    });
  }

  await prisma.stockMovement.create({
    data: { number: 'PM-DEL-000001-1', movementType: 'PURCHASE_IN', warehouseId: activeWarehouse.id, itemId: items[1].id, quantity: 5, direction: 'IN', reason: 'Осчетоводена доставка', sourceDocument: 'DEL-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'PM-PINV-000001-1', movementType: 'PURCHASE_IN', warehouseId: activeWarehouse.id, itemId: items[1].id, quantity: 5, direction: 'IN', reason: 'Осчетоводена доставка', sourceDocument: 'PINV-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'SM-SL-000001-1', movementType: 'SALE_OUT', warehouseId: activeWarehouse.id, itemId: items[0].id, quantity: 1, direction: 'OUT', reason: 'Осчетоводена продажба', sourceDocument: 'SL-000001' }
  });

  const adjustmentDocument = await prisma.stockAdjustmentDocument.create({
    data: {
      number: 'ADJ-000001',
      warehouseId: activeWarehouse.id,
      adjustmentType: 'SURPLUS_IN',
      status: 'POSTED',
      note: 'Начална складова корекция за демонстрация',
      postedAt: new Date()
    }
  });

  await prisma.stockAdjustmentLine.create({
    data: {
      documentId: adjustmentDocument.id,
      itemId: items[3].id,
      quantity: 1,
      direction: 'IN',
      reason: 'Излишък от инвентаризация',
      note: 'Демо корекционен ред'
    }
  });

  await prisma.stockMovement.create({
    data: { number: 'ADJ-000001-001', movementType: 'ADJUSTMENT_SURPLUS_IN', warehouseId: activeWarehouse.id, itemId: items[3].id, quantity: 1, direction: 'IN', reason: 'Излишък от инвентаризация', sourceDocument: 'ADJ-000001' }
  });

  const transferDocument = await prisma.stockTransferDocument.create({
    data: {
      number: 'TR-000001',
      fromWarehouseId: centralWarehouse.id,
      toWarehouseId: activeWarehouse.id,
      status: 'POSTED',
      note: 'Начален публикуван трансфер за демонстрация',
      postedAt: new Date()
    }
  });

  await prisma.stockTransferLine.create({
    data: { documentId: transferDocument.id, itemId: items[1].id, quantity: 4, note: 'Начален ред' }
  });

  await prisma.stockMovement.create({
    data: { number: 'TR-000001-OUT-001', movementType: 'TRANSFER', warehouseId: centralWarehouse.id, itemId: items[1].id, quantity: 4, direction: 'OUT', reason: `Трансфер към ${activeWarehouse.name}`, sourceDocument: 'TR-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'TR-000001-IN-002', movementType: 'TRANSFER', warehouseId: activeWarehouse.id, itemId: items[1].id, quantity: 4, direction: 'IN', reason: `Трансфер от ${centralWarehouse.name}`, sourceDocument: 'TR-000001' }
  });

  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: { registration: 'К 0001 АГ', vin: 'AUTO000000000001', brand: 'Mercedes-Benz', model: 'Sprinter', year: 2019, ownerName: customers[0].name }
    }),
    prisma.vehicle.create({
      data: { registration: 'К 0002 АГ', vin: 'AUTO000000000002', brand: 'Volkswagen', model: 'Transporter', year: 2021, ownerName: customers[1].name }
    })
  ]);

  const serviceOrder = await prisma.serviceOrder.create({
    data: {
      number: 'SRV-000001',
      vehicleId: vehicles[0].id,
      counterpartyId: customers[0].id,
      status: 'OPEN',
      problemDescription: 'Профилактика и смяна на филтри',
      totalGross: 76.8
    }
  });

  await prisma.serviceOrderLine.create({
    data: {
      serviceOrderId: serviceOrder.id,
      itemId: items[1].id,
      description: 'Смяна въздушен филтър',
      quantity: 1,
      price: 18.9,
      lineTotal: 18.9
    }
  });

  console.log('OK: AutoGrand ERP V2 Step 4.3 login context seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });