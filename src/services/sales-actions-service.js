import prisma from '../db/prisma.js';

export const salesDocTypeMeta = {
  OFFER: { label: 'Оферта', prefix: 'OF', screenId: 'offers', returnUrl: '/screen/offers' },
  CUSTOMER_ORDER: { label: 'Поръчка от клиент', prefix: 'PO', screenId: 'customer-orders', returnUrl: '/screen/customer-orders' },
  SALE: { label: 'Продажба', prefix: 'SL', screenId: 'sales', returnUrl: '/screen/sales' },
  CREDIT_NOTE: { label: 'Кредитно известие', prefix: 'CN', screenId: 'credit-note', returnUrl: '/screen/credit-note' },
  DEBIT_NOTE: { label: 'Дебитно известие', prefix: 'DN', screenId: 'debit-note', returnUrl: '/screen/debit-note' },
  SALE_BY_ORDER: { label: 'Продажба по поръчка', prefix: 'SBO', screenId: 'sale-by-order', returnUrl: '/screen/sale-by-order' },
  FREE_CREDIT_NOTE_SALE: { label: 'Свободно КИ продажба', prefix: 'FCN', screenId: 'free-credit-note-sale', returnUrl: '/screen/free-credit-note-sale' },
  FREE_INVOICE_SALE: { label: 'Свободна фактура продажби', prefix: 'FI', screenId: 'free-invoice-sales', returnUrl: '/screen/free-invoice-sales' },
  WARRANTY_CARD: { label: 'Гаранционна карта', prefix: 'WC', screenId: 'warranty-cards', returnUrl: '/screen/warranty-cards' }
};

function toInt(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDocType(value) {
  return salesDocTypeMeta[value] ? value : 'SALE';
}

function stockEffectForDocType(docType) {
  if (['SALE', 'SALE_BY_ORDER', 'FREE_INVOICE_SALE'].includes(docType)) {
    return {
      movementType: 'SALE_OUT',
      direction: 'OUT',
      balanceOperation: 'decrement',
      reason: 'Осчетоводена продажба',
      successCode: 'posted_stock_out_success'
    };
  }

  if (['CREDIT_NOTE', 'FREE_CREDIT_NOTE_SALE'].includes(docType)) {
    return {
      movementType: 'SALE_RETURN',
      direction: 'IN',
      balanceOperation: 'increment',
      reason: 'Осчетоводена корекция / връщане',
      successCode: 'posted_stock_in_success'
    };
  }

  return null;
}

async function getEditableDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return null;
  }

  const document = await prisma.salesDocument.findUnique({
    where: { id }
  });

  if (!document || document.status !== 'DRAFT') {
    return null;
  }

  return document;
}

export async function generateSalesDocumentNumber(docType) {
  const normalizedDocType = normalizeDocType(docType);
  const meta = salesDocTypeMeta[normalizedDocType];
  const prefix = meta.prefix;

  const count = await prisma.salesDocument.count({
    where: {
      number: {
        startsWith: `${prefix}-`
      }
    }
  });

  let next = count + 1;

  while (true) {
    const number = `${prefix}-${String(next).padStart(6, '0')}`;
    const existing = await prisma.salesDocument.findUnique({ where: { number } });

    if (!existing) {
      return number;
    }

    next += 1;
  }
}

export async function getSalesNewDocumentFormData(docType) {
  const normalizedDocType = normalizeDocType(docType);
  const meta = salesDocTypeMeta[normalizedDocType];

  const [counterparties, warehouses] = await Promise.all([
    prisma.counterparty.findMany({
      where: { kind: 'CUSTOMER' },
      orderBy: { name: 'asc' }
    }),
    prisma.warehouse.findMany({
      orderBy: { code: 'asc' }
    })
  ]);

  return {
    docType: normalizedDocType,
    title: meta.label,
    returnUrl: meta.returnUrl,
    counterparties,
    warehouses
  };
}

export async function createSalesDocumentFromForm(body) {
  const docType = normalizeDocType(body.docType);
  const number = await generateSalesDocumentNumber(docType);

  const counterpartyId = toInt(body.counterpartyId);
  const warehouseId = toInt(body.warehouseId);

  return prisma.salesDocument.create({
    data: {
      number,
      docType,
      counterpartyId,
      warehouseId,
      status: 'DRAFT',
      totalNet: 0,
      totalVat: 0,
      totalGross: 0,
      note: body.note || ''
    }
  });
}

export async function recalculateSalesDocumentTotals(documentId, options = {}) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  if (!options.force) {
    const document = await prisma.salesDocument.findUnique({ where: { id } });

    if (!document || document.status !== 'DRAFT') {
      return { ok: false, code: 'document_locked' };
    }
  }

  const lines = await prisma.salesDocumentLine.findMany({
    where: { documentId: id }
  });

  const totalGross = Number(lines.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0).toFixed(2));
  const totalNet = Number((totalGross / 1.2).toFixed(2));
  const totalVat = Number((totalGross - totalNet).toFixed(2));

  await prisma.salesDocument.update({
    where: { id },
    data: {
      totalNet,
      totalVat,
      totalGross
    }
  });

  return { ok: true, code: 'recalculated' };
}

export async function addSalesDocumentLine(documentId, body) {
  const document = await getEditableDocument(documentId);
  const itemId = toInt(body.itemId);
  const quantity = toNumber(body.quantity, 1);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!itemId) {
    return { ok: false, code: 'invalid_line' };
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    return { ok: false, code: 'invalid_line' };
  }

  const warehouseId = toInt(body.warehouseId) || document.warehouseId;
  const price = toNumber(body.price, Number(item.retailPrice || 0));
  const discountPercent = toNumber(body.discountPercent, 0);
  const lineTotal = Number((quantity * price * (1 - discountPercent / 100)).toFixed(2));

  await prisma.salesDocumentLine.create({
    data: {
      documentId: document.id,
      itemId,
      warehouseId,
      quantity,
      price,
      discountPercent,
      lineTotal
    }
  });

  await recalculateSalesDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'line_added' };
}

export async function updateSalesDocumentLine(documentId, lineId, body) {
  const document = await getEditableDocument(documentId);
  const id = toInt(lineId);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!id) {
    return { ok: false, code: 'invalid_line' };
  }

  const line = await prisma.salesDocumentLine.findFirst({
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
  const price = toNumber(body.price, Number(line.price || line.item?.retailPrice || 0));
  const discountPercent = toNumber(body.discountPercent, Number(line.discountPercent || 0));
  const lineTotal = Number((quantity * price * (1 - discountPercent / 100)).toFixed(2));

  await prisma.salesDocumentLine.update({
    where: { id },
    data: {
      quantity,
      price,
      discountPercent,
      lineTotal
    }
  });

  await recalculateSalesDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'line_updated' };
}

export async function deleteSalesDocumentLine(documentId, lineId) {
  const document = await getEditableDocument(documentId);
  const id = toInt(lineId);

  if (!document) {
    return { ok: false, code: 'document_locked' };
  }

  if (!id) {
    return { ok: false, code: 'invalid_line' };
  }

  const line = await prisma.salesDocumentLine.findFirst({
    where: {
      id,
      documentId: document.id
    }
  });

  if (!line) {
    return { ok: false, code: 'invalid_line' };
  }

  await prisma.salesDocumentLine.delete({
    where: { id }
  });

  await recalculateSalesDocumentTotals(document.id, { force: true });

  return { ok: true, code: 'line_deleted' };
}

function aggregateStockRequirements(lines, documentWarehouseId) {
  const aggregate = new Map();

  for (const line of lines) {
    const itemId = line.itemId;
    const warehouseId = line.warehouseId || documentWarehouseId;
    const quantity = Number(line.quantity || 0);

    if (!itemId || !warehouseId || quantity <= 0) {
      return { ok: false, code: 'invalid_stock_line', aggregate };
    }

    const key = `${warehouseId}:${itemId}`;
    const current = aggregate.get(key) || {
      warehouseId,
      itemId,
      quantity: 0
    };

    current.quantity = Number((current.quantity + quantity).toFixed(2));
    aggregate.set(key, current);
  }

  return { ok: true, code: 'ok', aggregate };
}

async function validateStockAvailability(lines, documentWarehouseId) {
  const requirements = aggregateStockRequirements(lines, documentWarehouseId);

  if (!requirements.ok) {
    return requirements;
  }

  for (const requirement of requirements.aggregate.values()) {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: requirement.warehouseId,
          itemId: requirement.itemId
        }
      }
    });

    const available = Number(balance?.quantity || 0) - Number(balance?.reservedQuantity || 0);

    if (!balance || available < requirement.quantity) {
      return {
        ok: false,
        code: 'insufficient_stock',
        requirement
      };
    }
  }

  return requirements;
}

async function postSalesDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  await recalculateSalesDocumentTotals(id, { force: true });

  const document = await prisma.salesDocument.findUnique({
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

  const stockEffect = stockEffectForDocType(document.docType);

  if (!stockEffect) {
    await prisma.salesDocument.update({
      where: { id: document.id },
      data: { status: 'POSTED' }
    });

    return { ok: true, code: 'posted_no_stock_success' };
  }

  const requirements = aggregateStockRequirements(document.lines, document.warehouseId);

  if (!requirements.ok) {
    return { ok: false, code: requirements.code };
  }

  if (stockEffect.direction === 'OUT') {
    const stockCheck = await validateStockAvailability(document.lines, document.warehouseId);

    if (!stockCheck.ok) {
      return { ok: false, code: stockCheck.code };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const requirement of requirements.aggregate.values()) {
      if (stockEffect.balanceOperation === 'decrement') {
        await tx.stockBalance.update({
          where: {
            warehouseId_itemId: {
              warehouseId: requirement.warehouseId,
              itemId: requirement.itemId
            }
          },
          data: {
            quantity: {
              decrement: requirement.quantity
            }
          }
        });
      }

      if (stockEffect.balanceOperation === 'increment') {
        await tx.stockBalance.upsert({
          where: {
            warehouseId_itemId: {
              warehouseId: requirement.warehouseId,
              itemId: requirement.itemId
            }
          },
          update: {
            quantity: {
              increment: requirement.quantity
            }
          },
          create: {
            warehouseId: requirement.warehouseId,
            itemId: requirement.itemId,
            quantity: requirement.quantity,
            reservedQuantity: 0,
            avgCost: 0
          }
        });
      }
    }

    for (const line of document.lines) {
      const warehouseId = line.warehouseId || document.warehouseId;

      await tx.stockMovement.create({
        data: {
          number: `SM-${document.number}-${line.id}`,
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

    await tx.salesDocument.update({
      where: { id: document.id },
      data: { status: 'POSTED' }
    });
  });

  return { ok: true, code: stockEffect.successCode };
}

async function cancelSalesDocument(documentId) {
  const id = toInt(documentId);

  if (!id) {
    return { ok: false, code: 'document_not_found' };
  }

  const document = await prisma.salesDocument.findUnique({
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

  await prisma.salesDocument.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });

  return { ok: true, code: 'cancelled_success' };
}

export async function updateSalesDocumentStatus(documentId, status) {
  const id = toInt(documentId);
  const allowed = ['DRAFT', 'POSTED', 'CANCELLED'];

  if (!id || !allowed.includes(status)) {
    return { ok: false, code: 'invalid_status' };
  }

  if (status === 'POSTED') {
    return postSalesDocument(id);
  }

  if (status === 'CANCELLED') {
    return cancelSalesDocument(id);
  }

  const document = await prisma.salesDocument.findUnique({
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