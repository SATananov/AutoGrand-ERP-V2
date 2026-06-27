import prisma from '../db/prisma.js';

export const purchaseDocTypeMeta = {
  PURCHASE_ORDER: {
    label: 'Поръчка към доставчик',
    prefix: 'PORD',
    screenId: 'purchase-orders',
    returnUrl: '/screen/purchase-orders'
  },
  SUPPLIER_INVOICE: {
    label: 'Фактура доставчик',
    prefix: 'PINV',
    screenId: 'supplier-invoices',
    returnUrl: '/screen/supplier-invoices'
  },
  DELIVERY: {
    label: 'Доставка',
    prefix: 'DEL',
    screenId: 'deliveries',
    returnUrl: '/screen/deliveries'
  }
};

function toInt(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePurchaseDocType(value) {
  return purchaseDocTypeMeta[value] ? value : 'DELIVERY';
}

function stockEffectForPurchaseDocType(docType) {
  if (['DELIVERY', 'SUPPLIER_INVOICE'].includes(docType)) {
    return {
      movementType: 'PURCHASE_IN',
      direction: 'IN',
      reason: 'Осчетоводена доставка',
      successCode: 'purchase_posted_stock_in_success'
    };
  }

  return null;
}

async function getEditablePurchaseDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return null;
  }

  const document = await prisma.purchaseDocument.findUnique({
    where: { id }
  });

  if (!document || document.status !== 'DRAFT') {
    return null;
  }

  return document;
}

export async function generatePurchaseDocumentNumber(docType) {
  const normalizedDocType = normalizePurchaseDocType(docType);
  const meta = purchaseDocTypeMeta[normalizedDocType];
  const prefix = meta.prefix;

  const count = await prisma.purchaseDocument.count({
    where: {
      number: {
        startsWith: `${prefix}-`
      }
    }
  });

  let next = count + 1;

  while (true) {
    const number = `${prefix}-${String(next).padStart(6, '0')}`;
    const existing = await prisma.purchaseDocument.findUnique({ where: { number } });

    if (!existing) {
      return number;
    }

    next += 1;
  }
}

export async function getPurchaseNewDocumentFormData(docType) {
  const normalizedDocType = normalizePurchaseDocType(docType);
  const meta = purchaseDocTypeMeta[normalizedDocType];

  const [suppliers, warehouses] = await Promise.all([
    prisma.counterparty.findMany({
      where: { kind: 'SUPPLIER' },
      orderBy: { name: 'asc' }
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    })
  ]);

  return {
    docType: normalizedDocType,
    title: meta.label,
    returnUrl: meta.returnUrl,
    suppliers,
    warehouses
  };
}

export async function createPurchaseDocumentFromForm(body) {
  const docType = normalizePurchaseDocType(body.docType);
  const number = await generatePurchaseDocumentNumber(docType);

  const supplierId = toInt(body.supplierId);
  const warehouseId = toInt(body.warehouseId);

  return prisma.purchaseDocument.create({
    data: {
      number,
      docType,
      supplierId,
      warehouseId,
      status: 'DRAFT',
      totalNet: 0,
      totalVat: 0,
      totalGross: 0,
      note: body.note || ''
    }
  });
}

export async function recalculatePurchaseDocumentTotals(documentId, options = {}) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  if (!options.force) {
    const document = await prisma.purchaseDocument.findUnique({ where: { id } });

    if (!document || document.status !== 'DRAFT') {
      return { ok: false, code: 'document_locked' };
    }
  }

  const lines = await prisma.purchaseDocumentLine.findMany({
    where: { documentId: id }
  });

  const totalGross = Number(lines.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0).toFixed(2));
  const totalNet = Number((totalGross / 1.2).toFixed(2));
  const totalVat = Number((totalGross - totalNet).toFixed(2));

  await prisma.purchaseDocument.update({
    where: { id },
    data: {
      totalNet,
      totalVat,
      totalGross
    }
  });

  return { ok: true, code: 'purchase_recalculated' };
}

export async function addPurchaseDocumentLine(documentId, body) {
  const document = await getEditablePurchaseDocument(documentId);
  const itemId = toInt(body.itemId);
  const quantity = toNumber(body.quantity, 1);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!itemId || quantity <= 0) {
    return { ok: false, code: 'invalid_line' };
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    return { ok: false, code: 'invalid_line' };
  }

  const warehouseId = toInt(body.warehouseId) || document.warehouseId;
  const price = toNumber(body.price, Number(item.wholesalePrice || item.retailPrice || 0));
  const lineTotal = Number((quantity * price).toFixed(2));

  await prisma.purchaseDocumentLine.create({
    data: {
      documentId: document.id,
      itemId,
      warehouseId,
      quantity,
      price,
      lineTotal
    }
  });

  await recalculatePurchaseDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'purchase_line_added' };
}

export async function updatePurchaseDocumentLine(documentId, lineId, body) {
  const document = await getEditablePurchaseDocument(documentId);
  const id = toInt(lineId);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!id) {
    return { ok: false, code: 'invalid_line' };
  }

  const line = await prisma.purchaseDocumentLine.findFirst({
    where: {
      id,
      documentId: document.id
    },
    include: {
      item: true
    }
  });

  if (!line) {
    return { ok: false, code: 'invalid_line' };
  }

  const quantity = toNumber(body.quantity, Number(line.quantity || 1));
  const price = toNumber(body.price, Number(line.price || line.item?.wholesalePrice || 0));
  const lineTotal = Number((quantity * price).toFixed(2));

  await prisma.purchaseDocumentLine.update({
    where: { id },
    data: {
      quantity,
      price,
      lineTotal
    }
  });

  await recalculatePurchaseDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'purchase_line_updated' };
}

export async function deletePurchaseDocumentLine(documentId, lineId) {
  const document = await getEditablePurchaseDocument(documentId);
  const id = toInt(lineId);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!id) {
    return { ok: false, code: 'invalid_line' };
  }

  const line = await prisma.purchaseDocumentLine.findFirst({
    where: {
      id,
      documentId: document.id
    }
  });

  if (!line) {
    return { ok: false, code: 'invalid_line' };
  }

  await prisma.purchaseDocumentLine.delete({
    where: { id }
  });

  await recalculatePurchaseDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'purchase_line_deleted' };
}

function aggregateIncomingStock(lines, documentWarehouseId) {
  const aggregate = new Map();

  for (const line of lines) {
    const itemId = line.itemId;
    const warehouseId = line.warehouseId || documentWarehouseId;
    const quantity = Number(line.quantity || 0);
    const lineAmount = Number(line.lineTotal || 0);

    if (!itemId || !warehouseId || quantity <= 0) {
      return { ok: false, code: 'invalid_stock_line', aggregate };
    }

    const key = `${warehouseId}:${itemId}`;
    const current = aggregate.get(key) || {
      warehouseId,
      itemId,
      quantity: 0,
      amount: 0
    };

    current.quantity = Number((current.quantity + quantity).toFixed(2));
    current.amount = Number((current.amount + lineAmount).toFixed(2));
    aggregate.set(key, current);
  }

  return { ok: true, code: 'ok', aggregate };
}

async function postPurchaseDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  await recalculatePurchaseDocumentTotals(id, { force: true });

  const document = await prisma.purchaseDocument.findUnique({
    where: { id },
    include: {
      lines: true
    }
  });

  if (!document) {
    return { ok: false, code: 'document_not_found' };
  }

  if (document.status === 'POSTED') {
    return { ok: true, code: 'already_posted' };
  }

  if (document.status === 'CANCELLED') {
    return { ok: false, code: 'cancelled_locked' };
  }

  if (document.status !== 'DRAFT') {
    return { ok: false, code: 'status_locked' };
  }

  if (document.lines.length === 0) {
    return { ok: false, code: 'no_lines' };
  }

  const stockEffect = stockEffectForPurchaseDocType(document.docType);

  if (!stockEffect) {
    await prisma.purchaseDocument.update({
      where: { id: document.id },
      data: { status: 'POSTED' }
    });

    return { ok: true, code: 'purchase_posted_no_stock_success' };
  }

  const requirements = aggregateIncomingStock(document.lines, document.warehouseId);

  if (!requirements.ok) {
    return { ok: false, code: requirements.code };
  }

  await prisma.$transaction(async (tx) => {
    for (const requirement of requirements.aggregate.values()) {
      const existing = await tx.stockBalance.findUnique({
        where: {
          warehouseId_itemId: {
            warehouseId: requirement.warehouseId,
            itemId: requirement.itemId
          }
        }
      });

      const incomingAvgCost = requirement.quantity > 0 ? requirement.amount / requirement.quantity : 0;

      if (existing) {
        const currentQuantity = Number(existing.quantity || 0);
        const currentAvgCost = Number(existing.avgCost || 0);
        const newQuantity = Number((currentQuantity + requirement.quantity).toFixed(2));
        const newAvgCost = newQuantity > 0
          ? Number(((currentQuantity * currentAvgCost + requirement.amount) / newQuantity).toFixed(4))
          : Number(incomingAvgCost.toFixed(4));

        await tx.stockBalance.update({
          where: {
            warehouseId_itemId: {
              warehouseId: requirement.warehouseId,
              itemId: requirement.itemId
            }
          },
          data: {
            quantity: newQuantity,
            avgCost: newAvgCost
          }
        });
      } else {
        await tx.stockBalance.create({
          data: {
            warehouseId: requirement.warehouseId,
            itemId: requirement.itemId,
            quantity: requirement.quantity,
            reservedQuantity: 0,
            avgCost: Number(incomingAvgCost.toFixed(4))
          }
        });
      }
    }

    for (const line of document.lines) {
      const warehouseId = line.warehouseId || document.warehouseId;

      await tx.stockMovement.create({
        data: {
          number: `PM-${document.number}-${line.id}`,
          movementType: stockEffect.movementType,
          warehouseId,
          itemId: line.itemId,
          quantity: Number(line.quantity || 0),
          direction: stockEffect.direction,
          reason: stockEffect.reason,
          sourceDocument: document.number,
          note: `${document.docType} ${document.number}`
        }
      });
    }

    await tx.purchaseDocument.update({
      where: { id: document.id },
      data: { status: 'POSTED' }
    });
  });

  return { ok: true, code: stockEffect.successCode };
}

async function cancelPurchaseDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  const document = await prisma.purchaseDocument.findUnique({
    where: { id }
  });

  if (!document) {
    return { ok: false, code: 'document_not_found' };
  }

  if (document.status === 'POSTED') {
    return { ok: false, code: 'posted_cannot_cancel_without_reversal' };
  }

  if (document.status === 'CANCELLED') {
    return { ok: true, code: 'already_cancelled' };
  }

  await prisma.purchaseDocument.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });

  return { ok: true, code: 'cancelled_success' };
}

export async function updatePurchaseDocumentStatus(documentId, status) {
  const id = toInt(documentId);
  const allowed = ['DRAFT', 'POSTED', 'CANCELLED'];

  if (!id || !allowed.includes(status)) {
    return { ok: false, code: 'invalid_status' };
  }

  if (status === 'POSTED') {
    return postPurchaseDocument(id);
  }

  if (status === 'CANCELLED') {
    return cancelPurchaseDocument(id);
  }

  const document = await prisma.purchaseDocument.findUnique({
    where: { id }
  });

  if (!document) {
    return { ok: false, code: 'document_not_found' };
  }

  if (document.status === 'POSTED') {
    return { ok: false, code: 'posted_cannot_return_to_draft' };
  }

  if (document.status === 'CANCELLED') {
    return { ok: false, code: 'cancelled_locked' };
  }

  return { ok: true, code: 'draft_success' };
}
