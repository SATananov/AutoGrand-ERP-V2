import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let cachedPrisma = null;
let cachedMeta = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const MOVEMENT_NAME_HINTS = [
  'stockmovement',
  'stockmovementjournal',
  'stockjournal',
  'itemjournal',
  'inventoryjournal',
  'movement',
  'journal',
  'stock'
];

const ITEM_TABLE_HINTS = ['item', 'items', 'article', 'articles', 'product', 'products'];
const LOCATION_TABLE_HINTS = ['location', 'locations', 'warehouse', 'warehouses', 'store', 'stores', 'object', 'objects'];

const UNIT_COST_CANDIDATES = [
  'unitCost',
  'unit_cost',
  'cost',
  'avgCost',
  'averageCost',
  'purchasePrice',
  'purchase_price',
  'unitPrice',
  'unit_price',
  'price',
  'netPrice',
  'net_price'
];

const TOTAL_VALUE_CANDIDATES = [
  'totalCost',
  'total_cost',
  'value',
  'stockValue',
  'stock_value',
  'amount',
  'totalAmount',
  'total_amount',
  'lineTotal',
  'line_total',
  'netAmount',
  'net_amount'
];

function normalizeName(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function asNumber(value, fallback = 0) {
  if (typeof value === 'bigint') return Number(value);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  const number = asNumber(value, 0);
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

function cleanValue(value) {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  return value;
}

function cleanRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) {
    out[key] = cleanValue(value);
  }
  return out;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function findColumn(columns, candidates) {
  const exactMap = new Map(columns.map((column) => [normalizeName(column.name), column.name]));
  for (const candidate of candidates) {
    const hit = exactMap.get(normalizeName(candidate));
    if (hit) return hit;
  }
  for (const column of columns) {
    const norm = normalizeName(column.name);
    if (candidates.some((candidate) => norm.includes(normalizeName(candidate)))) return column.name;
  }
  return null;
}

function findAnyColumn(columns, groups) {
  for (const group of groups) {
    const hit = findColumn(columns, group);
    if (hit) return hit;
  }
  return null;
}

function tableNameScore(name, hints) {
  const norm = normalizeName(name);
  return hints.reduce((score, hint) => score + (norm.includes(normalizeName(hint)) ? 1 : 0), 0);
}

function isNumericColumn(column) {
  const type = String(column?.type || '').toUpperCase();
  const norm = normalizeName(column?.name || '');
  return /INT|REAL|NUM|DEC|DOUBLE|FLOAT/.test(type) || norm.includes('qty') || norm.includes('quantity') || norm.includes('amount') || norm.includes('price') || norm.includes('cost') || norm.includes('value');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolvePrisma() {
  if (cachedPrisma) return cachedPrisma;
  const candidates = [
    path.join(PROJECT_ROOT, 'src', 'lib', 'prisma.js'),
    path.join(PROJECT_ROOT, 'src', 'prisma.js'),
    path.join(PROJECT_ROOT, 'src', 'db', 'prisma.js'),
    path.join(PROJECT_ROOT, 'src', 'database', 'prisma.js'),
    path.join(PROJECT_ROOT, 'src', 'services', 'prisma-service.js'),
    path.join(PROJECT_ROOT, 'prisma', 'client.js')
  ];
  for (const candidate of candidates) {
    if (!(await fileExists(candidate))) continue;
    const mod = await import(pathToFileURL(candidate).href);
    const prisma = mod.prisma || mod.default || mod.client || mod.db;
    if (prisma && typeof prisma.$queryRawUnsafe === 'function') {
      cachedPrisma = prisma;
      return cachedPrisma;
    }
  }
  const { PrismaClient } = await import('@prisma/client');
  cachedPrisma = new PrismaClient();
  return cachedPrisma;
}

async function listTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name"
  );
  return rows.map((row) => row.name).filter(Boolean);
}

async function listColumns(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info(${quoteIdent(tableName)})`);
  return rows.map((row) => ({
    name: row.name,
    type: String(row.type || '').toUpperCase(),
    notnull: Boolean(row.notnull),
    pk: Boolean(row.pk)
  }));
}

function selectLookupTable(tablesWithColumns, hints) {
  const candidates = tablesWithColumns.map((entry) => {
    const columns = entry.columns;
    const idCol = findColumn(columns, ['id', `${entry.name}Id`, `${entry.name}_id`, 'code']);
    const codeCol = findColumn(columns, ['code', 'sku', 'number', 'itemCode', 'articleCode']);
    const nameCol = findColumn(columns, ['name', 'title', 'label', 'description', 'displayName']);
    let score = tableNameScore(entry.name, hints) * 3;
    if (idCol) score += 2;
    if (codeCol) score += 1;
    if (nameCol) score += 3;
    return { ...entry, idCol, codeCol, nameCol, score };
  });
  const best = candidates.sort((a, b) => b.score - a.score)[0] || null;
  return best && best.score >= 4 ? best : null;
}

function selectMovementTable(tablesWithColumns) {
  const candidates = tablesWithColumns.map((entry) => {
    const columns = entry.columns;
    const quantityCol = findAnyColumn(columns, [
      ['quantity', 'qty', 'baseQuantity', 'movementQuantity', 'stockQuantity', 'postedQuantity'],
      ['amountQty', 'qtty']
    ]);
    const itemCol = findAnyColumn(columns, [
      ['itemId', 'item_id', 'articleId', 'article_id', 'productId', 'product_id', 'stockItemId', 'stock_item_id'],
      ['sku', 'itemCode', 'articleCode']
    ]);
    const dateCol = findAnyColumn(columns, [
      ['movementDate', 'postingDate', 'postedAt', 'documentDate', 'createdAt', 'created_at', 'date'],
      ['updatedAt', 'updated_at']
    ]);
    const typeCol = findAnyColumn(columns, [
      ['direction', 'movementType', 'type', 'entryType', 'operation', 'operationType', 'sourceType', 'documentType'],
      ['kind', 'status']
    ]);
    const unitCostCol = findColumn(columns.filter(isNumericColumn), UNIT_COST_CANDIDATES);
    const totalValueCol = findColumn(columns.filter(isNumericColumn), TOTAL_VALUE_CANDIDATES);
    let score = tableNameScore(entry.name, MOVEMENT_NAME_HINTS) * 3;
    if (quantityCol) score += 4;
    if (itemCol) score += 3;
    if (dateCol) score += 2;
    if (typeCol) score += 1;
    if (unitCostCol) score += 2;
    if (totalValueCol) score += 2;
    if (!quantityCol) score -= 7;
    return { ...entry, quantityCol, itemCol, dateCol, typeCol, unitCostCol, totalValueCol, score };
  });
  return candidates.sort((a, b) => b.score - a.score)[0] || null;
}

async function buildMeta() {
  if (cachedMeta) return cachedMeta;
  const prisma = await resolvePrisma();
  const tables = await listTables(prisma);
  const tablesWithColumns = [];
  for (const tableName of tables) {
    tablesWithColumns.push({ name: tableName, columns: await listColumns(prisma, tableName) });
  }
  const movement = selectMovementTable(tablesWithColumns);
  if (!movement || !movement.quantityCol) {
    cachedMeta = {
      prisma,
      ready: false,
      reason: 'Не е открита таблица за складови движения с количествена колона.',
      tables: tablesWithColumns.map((entry) => entry.name)
    };
    return cachedMeta;
  }

  const columns = movement.columns;
  movement.idCol = findColumn(columns, ['id', 'movementId', 'entryId']);
  movement.locationCol = findAnyColumn(columns, [
    ['locationId', 'location_id', 'warehouseId', 'warehouse_id', 'storeId', 'store_id', 'objectId', 'object_id'],
    ['businessGroupId', 'business_group_id', 'bgId', 'bg_id']
  ]);
  movement.documentCol = findAnyColumn(columns, [
    ['documentId', 'document_id', 'sourceDocumentId', 'source_document_id', 'stockDocumentId', 'stock_document_id'],
    ['docId', 'doc_id']
  ]);
  movement.documentNoCol = findAnyColumn(columns, [
    ['documentNo', 'document_no', 'sourceDocumentNo', 'source_document_no', 'docNo', 'doc_no', 'number'],
    ['reference', 'ref']
  ]);
  movement.statusCol = findColumn(columns, ['status', 'state', 'postingStatus']);
  movement.userCol = findColumn(columns, ['createdBy', 'created_by', 'postedBy', 'posted_by', 'userId', 'user_id', 'operatorId', 'operator_id']);
  movement.noteCol = findColumn(columns, ['note', 'notes', 'comment', 'description', 'reason']);

  cachedMeta = {
    prisma,
    ready: true,
    movement,
    item: selectLookupTable(tablesWithColumns, ITEM_TABLE_HINTS),
    location: selectLookupTable(tablesWithColumns, LOCATION_TABLE_HINTS),
    tables: tablesWithColumns.map((entry) => entry.name)
  };
  return cachedMeta;
}

function normalizeDateInput(value, fallbackDays = 365) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date();
  date.setDate(date.getDate() - fallbackDays);
  return date.toISOString().slice(0, 10);
}

function normalizeToDate(value) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  return new Date().toISOString().slice(0, 10);
}

function normalizeFilters(query = {}) {
  const from = normalizeDateInput(query.from, 365);
  const to = normalizeToDate(query.to);
  const itemId = String(query.itemId || '').trim();
  const locationId = String(query.locationId || '').trim();
  const valuationMode = ['last-in', 'weighted-average', 'movement-value'].includes(String(query.valuationMode || ''))
    ? String(query.valuationMode)
    : 'weighted-average';
  const stockMode = ['all', 'positive', 'negative', 'zero', 'missing-cost'].includes(String(query.stockMode || ''))
    ? String(query.stockMode)
    : 'all';
  const limit = Math.max(10, Math.min(1000, asNumber(query.limit, 250)));
  return { from, to, itemId, locationId, valuationMode, stockMode, limit };
}

function buildWhere(meta, filters, options = {}) {
  const movement = meta.movement;
  const where = [];
  const params = [];
  if (movement.dateCol && options.withDate !== false) {
    where.push(`${quoteIdent(movement.dateCol)} >= ?`);
    params.push(`${filters.from}T00:00:00.000Z`);
    where.push(`${quoteIdent(movement.dateCol)} <= ?`);
    params.push(`${filters.to}T23:59:59.999Z`);
  }
  if (movement.itemCol && filters.itemId) {
    where.push(`${quoteIdent(movement.itemCol)} = ?`);
    params.push(filters.itemId);
  }
  if (movement.locationCol && filters.locationId) {
    where.push(`${quoteIdent(movement.locationCol)} = ?`);
    params.push(filters.locationId);
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function queryMovementRows(meta, filters, options = {}) {
  if (!meta.ready) return [];
  const movement = meta.movement;
  const where = buildWhere(meta, filters, options);
  const order = movement.dateCol ? `ORDER BY ${quoteIdent(movement.dateCol)} ASC` : '';
  const limit = Number(options.limit || filters.limit || 250);
  const sql = `SELECT * FROM ${quoteIdent(movement.name)} ${where.clause} ${order} LIMIT ${limit}`;
  const rows = await meta.prisma.$queryRawUnsafe(sql, ...where.params);
  return rows.map(cleanRow);
}

async function fetchLookupRows(meta, lookup, max = 2000) {
  if (!lookup?.idCol) return new Map();
  const cols = [lookup.idCol, lookup.codeCol, lookup.nameCol].filter(Boolean);
  const select = [...new Set(cols)].map(quoteIdent).join(', ');
  const sql = `SELECT ${select} FROM ${quoteIdent(lookup.name)} ORDER BY ${lookup.nameCol ? quoteIdent(lookup.nameCol) : quoteIdent(lookup.idCol)} LIMIT ${Number(max)}`;
  const rows = await meta.prisma.$queryRawUnsafe(sql);
  const map = new Map();
  for (const row of rows.map(cleanRow)) {
    const id = displayValue(row[lookup.idCol], '');
    if (!id) continue;
    map.set(id, {
      id,
      code: lookup.codeCol ? displayValue(row[lookup.codeCol], '') : '',
      name: lookup.nameCol ? displayValue(row[lookup.nameCol], id) : id
    });
  }
  return map;
}

function displayValue(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function labelFromLookup(map, id, fallbackPrefix) {
  const key = displayValue(id, '');
  const hit = map.get(key);
  if (hit) return hit.code ? `${hit.code} · ${hit.name}` : hit.name;
  return key ? `${fallbackPrefix} ${key}` : '-';
}

function getDirectionText(row, meta) {
  const movement = meta.movement;
  return [movement.typeCol, movement.statusCol, movement.noteCol, movement.documentNoCol]
    .filter(Boolean)
    .map((col) => String(row[col] || '').toLowerCase())
    .join(' ');
}

function getSignedQuantity(row, meta) {
  const raw = asNumber(row[meta.movement.quantityCol]);
  if (!Number.isFinite(raw) || raw === 0) return 0;
  if (raw < 0) return raw;
  const text = getDirectionText(row, meta);
  if (/\b(out|sale|sales|issue|shipment|consume|consumption|writeoff|correction-out|minus|negative)\b/.test(text)) return -Math.abs(raw);
  if (/изход|продаж|изпис|разход|намал|минус|експед/.test(text)) return -Math.abs(raw);
  if (/\b(in|purchase|receipt|delivery|incoming|plus|positive|transfer-in)\b/.test(text)) return Math.abs(raw);
  if (/вход|достав|приход|получ|плюс|прием/.test(text)) return Math.abs(raw);
  return raw;
}

function resolveRowCost(row, meta) {
  const movement = meta.movement;
  const absQty = Math.abs(getSignedQuantity(row, meta));
  const unitRaw = movement.unitCostCol ? asNumber(row[movement.unitCostCol], NaN) : NaN;
  if (Number.isFinite(unitRaw) && unitRaw > 0) {
    return {
      unitCost: roundMoney(unitRaw),
      totalValue: roundMoney(unitRaw * absQty),
      source: movement.unitCostCol,
      confidence: 'direct-unit'
    };
  }
  const totalRaw = movement.totalValueCol ? asNumber(row[movement.totalValueCol], NaN) : NaN;
  if (Number.isFinite(totalRaw) && totalRaw !== 0 && absQty > 0) {
    const unit = Math.abs(totalRaw) / absQty;
    return {
      unitCost: roundMoney(unit),
      totalValue: roundMoney(Math.abs(totalRaw)),
      source: movement.totalValueCol,
      confidence: 'derived-total'
    };
  }
  return { unitCost: 0, totalValue: 0, source: '', confidence: 'missing' };
}

function buildSourceDocumentHref(row, meta) {
  const documentId = meta.movement.documentCol ? displayValue(row[meta.movement.documentCol], '') : '';
  const documentNo = meta.movement.documentNoCol ? displayValue(row[meta.movement.documentNoCol], '') : '';
  if (documentId) return `/stock-control-center?documentId=${encodeURIComponent(documentId)}`;
  if (documentNo) return `/stock-control-center?documentNo=${encodeURIComponent(documentNo)}`;
  return '';
}

async function prepareCostRows(meta, rawRows) {
  const itemMap = await fetchLookupRows(meta, meta.item);
  const locationMap = await fetchLookupRows(meta, meta.location);
  return rawRows.map((row) => {
    const signedQuantity = getSignedQuantity(row, meta);
    const itemId = meta.movement.itemCol ? displayValue(row[meta.movement.itemCol], '') : '';
    const locationId = meta.movement.locationCol ? displayValue(row[meta.movement.locationCol], '') : '';
    const cost = resolveRowCost(row, meta);
    return {
      id: meta.movement.idCol ? displayValue(row[meta.movement.idCol], '') : '',
      date: meta.movement.dateCol ? displayValue(row[meta.movement.dateCol], '') : '',
      itemId,
      itemLabel: labelFromLookup(itemMap, itemId, 'Артикул'),
      locationId,
      locationLabel: labelFromLookup(locationMap, locationId, 'Обект'),
      quantity: asNumber(row[meta.movement.quantityCol]),
      signedQuantity,
      incoming: signedQuantity > 0 ? signedQuantity : 0,
      outgoing: signedQuantity < 0 ? Math.abs(signedQuantity) : 0,
      unitCost: cost.unitCost,
      movementValue: cost.totalValue,
      costSource: cost.source,
      costConfidence: cost.confidence,
      documentId: meta.movement.documentCol ? displayValue(row[meta.movement.documentCol], '') : '',
      documentNo: meta.movement.documentNoCol ? displayValue(row[meta.movement.documentNoCol], '') : '',
      documentHref: buildSourceDocumentHref(row, meta),
      movementType: meta.movement.typeCol ? displayValue(row[meta.movement.typeCol], '') : '',
      status: meta.movement.statusCol ? displayValue(row[meta.movement.statusCol], '') : ''
    };
  });
}

function aggregateValuation(rows, filters) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.itemId || '-'}|${row.locationId || '-'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        itemId: row.itemId,
        itemLabel: row.itemLabel,
        locationId: row.locationId,
        locationLabel: row.locationLabel,
        incoming: 0,
        outgoing: 0,
        netQuantity: 0,
        movements: 0,
        valuedMovements: 0,
        incomingValue: 0,
        outgoingValue: 0,
        lastUnitCost: 0,
        lastMovementDate: '',
        costConfidence: 'missing'
      });
    }
    const group = groups.get(key);
    group.incoming += row.incoming;
    group.outgoing += row.outgoing;
    group.netQuantity += row.signedQuantity;
    group.movements += 1;
    if (row.costConfidence !== 'missing' && row.unitCost > 0) {
      group.valuedMovements += 1;
      group.lastUnitCost = row.unitCost;
      if (row.signedQuantity >= 0) group.incomingValue += row.movementValue;
      else group.outgoingValue += row.unitCost * Math.abs(row.signedQuantity);
      if (row.costConfidence === 'direct-unit') group.costConfidence = 'direct-unit';
      else if (group.costConfidence === 'missing') group.costConfidence = 'derived-total';
    }
    if (!group.lastMovementDate || String(row.date) > String(group.lastMovementDate)) {
      group.lastMovementDate = row.date;
    }
  }

  return [...groups.values()].map((group) => {
    const weightedCost = group.incoming > 0 && group.incomingValue > 0 ? group.incomingValue / group.incoming : 0;
    let unitCost = 0;
    if (filters.valuationMode === 'last-in') unitCost = group.lastUnitCost || weightedCost;
    else if (filters.valuationMode === 'movement-value') unitCost = group.netQuantity !== 0 ? (group.incomingValue - group.outgoingValue) / group.netQuantity : weightedCost;
    else unitCost = weightedCost || group.lastUnitCost;
    if (!Number.isFinite(unitCost) || unitCost < 0) unitCost = Math.abs(unitCost) || 0;
    const stockValue = group.netQuantity * unitCost;
    const missingCost = group.valuedMovements === 0;
    return {
      ...group,
      incoming: roundMoney(group.incoming),
      outgoing: roundMoney(group.outgoing),
      netQuantity: roundMoney(group.netQuantity),
      incomingValue: roundMoney(group.incomingValue),
      outgoingValue: roundMoney(group.outgoingValue),
      unitCost: roundMoney(unitCost),
      stockValue: roundMoney(stockValue),
      missingCost,
      valuationMode: filters.valuationMode
    };
  }).filter((row) => {
    if (filters.stockMode === 'positive') return row.netQuantity > 0;
    if (filters.stockMode === 'negative') return row.netQuantity < 0;
    if (filters.stockMode === 'zero') return row.netQuantity === 0;
    if (filters.stockMode === 'missing-cost') return row.missingCost;
    return true;
  }).sort((a, b) => Math.abs(b.stockValue) - Math.abs(a.stockValue));
}

function buildLocationSummary(valuationRows) {
  const groups = new Map();
  for (const row of valuationRows) {
    const key = row.locationId || '-';
    if (!groups.has(key)) {
      groups.set(key, {
        locationId: row.locationId,
        locationLabel: row.locationLabel,
        stockValue: 0,
        positiveValue: 0,
        negativeValue: 0,
        netQuantity: 0,
        positions: 0,
        missingCostPositions: 0
      });
    }
    const group = groups.get(key);
    group.stockValue += row.stockValue;
    if (row.stockValue >= 0) group.positiveValue += row.stockValue;
    else group.negativeValue += row.stockValue;
    group.netQuantity += row.netQuantity;
    group.positions += 1;
    if (row.missingCost) group.missingCostPositions += 1;
  }
  return [...groups.values()].map((row) => ({
    ...row,
    stockValue: roundMoney(row.stockValue),
    positiveValue: roundMoney(row.positiveValue),
    negativeValue: roundMoney(row.negativeValue),
    netQuantity: roundMoney(row.netQuantity)
  })).sort((a, b) => Math.abs(b.stockValue) - Math.abs(a.stockValue));
}

function summarizeValuation(rows, meta, filters) {
  const totalStockValue = rows.reduce((sum, row) => sum + row.stockValue, 0);
  const positiveStockValue = rows.reduce((sum, row) => sum + (row.stockValue > 0 ? row.stockValue : 0), 0);
  const negativeStockValue = rows.reduce((sum, row) => sum + (row.stockValue < 0 ? row.stockValue : 0), 0);
  const missingCostPositions = rows.filter((row) => row.missingCost).length;
  const negativePositions = rows.filter((row) => row.netQuantity < 0).length;
  const zeroPositions = rows.filter((row) => row.netQuantity === 0).length;
  const costCoverage = rows.length ? Math.round(((rows.length - missingCostPositions) / rows.length) * 100) : 0;
  return {
    generatedAt: new Date().toISOString(),
    period: { from: filters.from, to: filters.to },
    valuationMode: filters.valuationMode,
    stockMode: filters.stockMode,
    rows: rows.length,
    totalStockValue: roundMoney(totalStockValue),
    positiveStockValue: roundMoney(positiveStockValue),
    negativeStockValue: roundMoney(negativeStockValue),
    missingCostPositions,
    negativePositions,
    zeroPositions,
    costCoverage,
    safety: 'Read-only valuation view. No posting, reversal, correction or stock journal write operation is executed.',
    diagnostics: buildDiagnostics(meta)
  };
}

function buildDiagnostics(meta) {
  if (!meta.ready) return { ready: false, reason: meta.reason, tables: meta.tables };
  return {
    ready: true,
    movementTable: meta.movement.name,
    movementColumns: {
      id: meta.movement.idCol,
      date: meta.movement.dateCol,
      item: meta.movement.itemCol,
      location: meta.movement.locationCol,
      quantity: meta.movement.quantityCol,
      type: meta.movement.typeCol,
      unitCost: meta.movement.unitCostCol,
      totalValue: meta.movement.totalValueCol,
      document: meta.movement.documentCol,
      documentNo: meta.movement.documentNoCol
    },
    itemTable: meta.item?.name || null,
    locationTable: meta.location?.name || null
  };
}

async function buildValuation(query = {}) {
  const filters = normalizeFilters(query);
  const meta = await buildMeta();
  if (!meta.ready) {
    return {
      ok: true,
      ready: false,
      filters,
      summary: summarizeValuation([], meta, filters),
      rows: [],
      locationSummary: [],
      movements: [],
      message: meta.reason
    };
  }
  const rawRows = await queryMovementRows(meta, filters, { limit: filters.limit });
  const movements = await prepareCostRows(meta, rawRows);
  const rows = aggregateValuation(movements, filters);
  const locationSummary = buildLocationSummary(rows);
  return {
    ok: true,
    ready: true,
    filters,
    summary: summarizeValuation(rows, meta, filters),
    rows,
    locationSummary,
    movements: movements.slice().reverse().slice(0, Math.min(filters.limit, 250))
  };
}

export async function getStockValuationOptions(query = {}) {
  const filters = normalizeFilters(query);
  const meta = await buildMeta();
  if (!meta.ready) return { ok: true, ready: false, filters, items: [], locations: [], diagnostics: buildDiagnostics(meta) };
  const rows = await queryMovementRows(meta, { ...filters, limit: 1000 }, { limit: 1000 });
  const prepared = await prepareCostRows(meta, rows);
  const items = new Map();
  const locations = new Map();
  for (const row of prepared) {
    if (row.itemId && !items.has(row.itemId)) items.set(row.itemId, { id: row.itemId, name: row.itemLabel });
    if (row.locationId && !locations.has(row.locationId)) locations.set(row.locationId, { id: row.locationId, name: row.locationLabel });
  }
  return {
    ok: true,
    ready: true,
    filters,
    items: [...items.values()].sort((a, b) => a.name.localeCompare(b.name, 'bg')),
    locations: [...locations.values()].sort((a, b) => a.name.localeCompare(b.name, 'bg')),
    valuationModes: [
      { id: 'weighted-average', name: 'Среднопретеглена цена' },
      { id: 'last-in', name: 'Последна входна цена' },
      { id: 'movement-value', name: 'По стойност на движенията' }
    ],
    stockModes: [
      { id: 'all', name: 'Всички позиции' },
      { id: 'positive', name: 'Само положителни' },
      { id: 'negative', name: 'Само отрицателни' },
      { id: 'zero', name: 'Нулеви наличности' },
      { id: 'missing-cost', name: 'Липсва себестойност' }
    ],
    diagnostics: buildDiagnostics(meta)
  };
}

export async function getStockValuationSummary(query = {}) {
  const valuation = await buildValuation(query);
  return { ok: true, ready: valuation.ready, filters: valuation.filters, summary: valuation.summary, diagnostics: valuation.summary.diagnostics };
}

export async function getStockValuationBalance(query = {}) {
  const valuation = await buildValuation(query);
  return { ok: true, ready: valuation.ready, filters: valuation.filters, rows: valuation.rows, summary: valuation.summary };
}

export async function getStockValuationMovements(query = {}) {
  const valuation = await buildValuation(query);
  return { ok: true, ready: valuation.ready, filters: valuation.filters, rows: valuation.movements, summary: valuation.summary };
}

export async function getStockValuationSnapshot(query = {}) {
  const valuation = await buildValuation(query);
  const highValue = valuation.rows.slice(0, 10);
  return {
    ok: true,
    ready: valuation.ready,
    filters: valuation.filters,
    summary: valuation.summary,
    highValue,
    locationSummary: valuation.locationSummary,
    notes: [
      valuation.summary.missingCostPositions > 0
        ? `${valuation.summary.missingCostPositions} позиции са без откриваема себестойност и трябва да се прегледат.`
        : 'Всички позиции имат откриваема стойностна основа за избрания период.',
      valuation.summary.negativePositions > 0
        ? `${valuation.summary.negativePositions} позиции са с отрицателна наличност.`
        : 'Няма отрицателни позиции в избраната справка.',
      'Справката е read-only и не променя складови движения, документи или journal записи.'
    ]
  };
}
