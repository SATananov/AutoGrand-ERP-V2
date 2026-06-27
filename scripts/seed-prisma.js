import prisma from '../src/db/prisma.js';

async function reset() {
  await prisma.serviceOrderLine.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
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

  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { code: 'WH-MAIN', name: 'Основен склад', city: 'Кърджали' } }),
    prisma.warehouse.create({ data: { code: 'WH-SRV', name: 'Сервизен склад', city: 'Кърджали' } })
  ]);

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
        warehouseId: warehouses[0].id,
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
          warehouseId: warehouses[0].id,
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
        warehouseId: warehouses[0].id,
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
        warehouseId: warehouses[0].id,
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
        warehouseId: warehouses[0].id,
        itemId: item.id,
        quantity: item.code === 'A-0001' ? 34 : item.code === 'A-0002' ? 18 : item.code === 'A-0003' ? 7 : 3,
        reservedQuantity: item.code === 'A-0003' ? 1 : 0,
        avgCost: item.wholesalePrice
      }
    });
  }

  await prisma.stockMovement.create({
    data: { number: 'PM-DEL-000001-1', movementType: 'PURCHASE_IN', warehouseId: warehouses[0].id, itemId: items[1].id, quantity: 5, direction: 'IN', reason: 'Осчетоводена доставка', sourceDocument: 'DEL-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'PM-PINV-000001-1', movementType: 'PURCHASE_IN', warehouseId: warehouses[0].id, itemId: items[1].id, quantity: 5, direction: 'IN', reason: 'Осчетоводена доставка', sourceDocument: 'PINV-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'SM-SL-000001-1', movementType: 'SALE_OUT', warehouseId: warehouses[0].id, itemId: items[0].id, quantity: 1, direction: 'OUT', reason: 'Осчетоводена продажба', sourceDocument: 'SL-000001' }
  });
  await prisma.stockMovement.create({
    data: { number: 'TR-000001', movementType: 'TRANSFER', warehouseId: warehouses[1].id, itemId: items[1].id, quantity: 4, direction: 'TRANSFER', reason: 'Трансфер към сервизен склад', sourceDocument: 'TR-000001' }
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

  console.log('OK: AutoGrand ERP V2 Step 2.4 purchases/deliveries seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });