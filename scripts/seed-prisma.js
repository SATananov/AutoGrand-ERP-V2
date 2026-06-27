import prisma from '../src/db/prisma.js';

async function reset() {
  await prisma.serviceOrderLine.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
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
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
}

async function main() {
  await reset();

  const company = await prisma.company.create({
    data: {
      code: 'AG-KJ',
      name: 'КЪРДЖАЛИ - Автогранд ООД',
      city: 'Кърджали',
      address: 'AutoGrand ERP V2 локална база'
    }
  });

  await prisma.user.create({
    data: {
      username: 'stefan',
      displayName: 'СТЕФАН ТАНАНОВ',
      role: 'admin',
      companyId: company.id
    }
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

  const locationSeed = [
    { code: 'AG-SOF-OFFICE', name: 'Централен офис', type: 'OFFICE', city: 'София', address: 'бул. Черни връх 157', phone: '+359 2 962 2995', email: 'office@autogrand.bg', canHoldStock: false, canSell: false, canReceivePurchases: false, canTransfer: false, sortOrder: 10 },
    { code: 'AG-STZ-CENTRAL', name: 'Централен склад', type: 'CENTRAL_WAREHOUSE', city: 'Стара Загора', address: 'ул. Новозагорско шосе 35001, срещу РАЗСАДНИК РАЗЦВЕТ', phone: '0882 442 069', email: 'stz_sklad@autogrand.bg', canHoldStock: true, canSell: false, canReceivePurchases: true, canTransfer: true, sortOrder: 20 },
    { code: 'AG-SOF-ROJEN', name: 'Регионален склад София Рожен', type: 'REGIONAL_WAREHOUSE', city: 'София', address: 'бул. Рожен 22, НПЗ Военна рампа', phone: '02 936 04 04; 02 488 62 99; 02 426 71 44; 0884 00 03 60; 0878 40 13 62; 0878 40 13 61', email: 'sofia_rojen@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 30 },
    { code: 'AG-BLG-WH', name: 'Регионален склад Благоевград', type: 'REGIONAL_WAREHOUSE', city: 'Благоевград', address: 'бул. Васил Левски 38', phone: '073 88 23 01; 0884 61 74 47', email: 'blagoevgrad@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 40 },
    { code: 'AG-PDV-WH', name: 'Регионален склад Пловдив', type: 'REGIONAL_WAREHOUSE', city: 'Пловдив', address: 'бул. Асеновградско шосе 2', phone: '0887 90 21 17; 0882 82 90 16', email: 'plovdiv@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 50 },
    { code: 'AG-PDV-NORTH', name: 'Регионален склад Пловдив Север', type: 'REGIONAL_WAREHOUSE', city: 'Пловдив', address: 'ул. Васил Левски 177', phone: '0882 126 212; 0882 660 051', email: 'plovdiv_sever@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 60 },
    { code: 'AG-STZ-WH', name: 'Регионален склад Стара Загора', type: 'REGIONAL_WAREHOUSE', city: 'Стара Загора', address: 'ул. Новозагорско шосе 35001, срещу РАЗСАДНИК РАЗЦВЕТ', phone: '042 64 64 60; 0888 56 27 89', email: 'st.zagora@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 70 },
    { code: 'AG-HSK-WH', name: 'Регионален склад Хасково', type: 'REGIONAL_WAREHOUSE', city: 'Хасково', address: 'бул. Илинден 6', phone: '038 66 41 28; 0882 75 81 00; 0888 26 91 98', email: 'haskovo_sklad@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 80 },
    { code: 'AG-BGS-WH', name: 'Регионален склад Бургас', type: 'REGIONAL_WAREHOUSE', city: 'Бургас', address: 'ул. Индустриална 51', phone: '056 84 02 44; 0882 424 908; 0884 422 131; 0879 140 091; 0879 140 092', email: 'burgas@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 90 },
    { code: 'AG-YAM-SHOP', name: 'Търговски обект Ямбол', type: 'SHOP', city: 'Ямбол', address: 'ул. Ормана 68', phone: '0887 79 20 33', email: 'yambol@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 110 },
    { code: 'AG-HRM-SHOP', name: 'Търговски обект Харманли', type: 'SHOP', city: 'Харманли', address: 'Главен път E80 Паркинг КВЕЛЕ', phone: '0888 26 91 99', email: 'harmanli@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 120 },
    { code: 'AG-SLV-SHOP', name: 'Търговски обект Сливен', type: 'SHOP', city: 'Сливен', address: 'бул. Цар Симеон 43', phone: '044 62 31 39; 0885 33 58 71', email: 'sliven@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 130 },
    { code: 'AG-SAN-SHOP', name: 'Търговски обект Сандански', type: 'SHOP', city: 'Сандански', address: 'ул. Стефан Стамболов 49', phone: '0892 21 26 83; 0878 28 26 17; 0887 58 59 98', email: 'sandanski@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 140 },
    { code: 'AG-PET-SHOP', name: 'Търговски обект Петрич', type: 'SHOP', city: 'Петрич', address: 'ул. Места 18 Б', phone: '0884 45 03 23; 0889 49 98 30', email: 'petrich@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 150 },
    { code: 'AG-KJ-SHOP', name: 'Търговски обект Кърджали', type: 'SHOP', city: 'Кърджали', address: 'бул. България 99', phone: '0887 79 20 28', email: 'kardjali@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, isDefault: true, isCurrent: true, sortOrder: 160 },
    { code: 'AG-KZK-SHOP', name: 'Търговски обект Казанлък', type: 'SHOP', city: 'Казанлък', address: 'бул. Александър Батенберг 12', phone: '0889 28 66 08', email: 'kazanlak@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 170 },
    { code: 'AG-DGR-SHOP', name: 'Търговски обект Димитровград', type: 'SHOP', city: 'Димитровград', address: 'бул. Стефан Стамболов 65', phone: '0391 6 38 08; 0887 20 75 95', email: 'dimitrovgrad@autogrand.bg', canHoldStock: true, canSell: true, canReceivePurchases: true, canTransfer: true, sortOrder: 180 }
  ];

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
        quantity: item.code === 'A-0001' ? 34 : item.code === 'A-0002' ? 18 : item.code === 'A-0003' ? 7 : 3,
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

  console.log('OK: AutoGrand ERP V2 Step 2.7 stock transfer document card seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });