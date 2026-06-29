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
  const stockMode = ['all', 'positive', 'negative', 'zero', 'missing-cost', 'high-value'].includes(String(query.stockMode || ''))
    ? String(query.stockMode)
    : 'all';
  const confidenceMode = ['all', 'high', 'medium', 'missing'].includes(String(query.confidenceMode || ''))
    ? String(query.confidenceMode)
    : 'all';
  const managerFocus = ['all', 'risk', 'missing-cost', 'negative', 'high-value'].includes(String(query.managerFocus || ''))
    ? String(query.managerFocus)
    : 'all';
  const valueBand = ['all', 'critical', 'high', 'medium', 'low', 'zero'].includes(String(query.valueBand || ''))
    ? String(query.valueBand)
    : 'all';
  const valueMin = query.valueMin === undefined || query.valueMin === '' ? null : roundMoney(query.valueMin);
  const valueMax = query.valueMax === undefined || query.valueMax === '' ? null : roundMoney(query.valueMax);
  const limit = Math.max(10, Math.min(1000, asNumber(query.limit, 250)));
  return { from, to, itemId, locationId, valuationMode, stockMode, confidenceMode, managerFocus, valueBand, valueMin, valueMax, limit };
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


function getCostConfidenceLevel(confidence, valuedMovements = 0, movements = 0) {
  if (confidence === 'missing' || valuedMovements <= 0) {
    return { level: 'missing', label: 'Липсва', score: 0 };
  }
  if (confidence === 'direct-unit') {
    return { level: 'high', label: 'Висока', score: 100 };
  }
  const ratio = movements > 0 ? valuedMovements / movements : 0;
  if (ratio >= 0.75) return { level: 'high', label: 'Висока', score: 90 };
  return { level: 'medium', label: 'Средна', score: Math.max(45, Math.round(ratio * 100)) };
}

function getMovementConfidenceLevel(confidence) {
  if (confidence === 'direct-unit') return { level: 'high', label: 'Висока', score: 100 };
  if (confidence === 'derived-total') return { level: 'medium', label: 'Средна', score: 70 };
  return { level: 'missing', label: 'Липсва', score: 0 };
}

function getValueBand(value) {
  const absValue = Math.abs(asNumber(value, 0));
  if (absValue === 0) return 'zero';
  if (absValue >= 10000) return 'critical';
  if (absValue >= 3000) return 'high';
  if (absValue >= 500) return 'medium';
  return 'low';
}

function getValueBandLabel(valueBand) {
  const labels = {
    critical: 'Критична стойност',
    high: 'Висока стойност',
    medium: 'Средна стойност',
    low: 'Ниска стойност',
    zero: 'Нулева стойност'
  };
  return labels[valueBand] || 'Всички стойности';
}

function buildManagerFlag(row) {
  if (row.missingCost) return 'Липсва себестойност';
  if (row.netQuantity < 0) return 'Отрицателна наличност';
  if (row.valueBand === 'critical' || row.valueBand === 'high') return 'Висока стойност';
  if (row.costConfidenceLevel === 'medium') return 'Средна увереност';
  return 'OK';
}

function passesManagerFilters(row, filters) {
  if (filters.confidenceMode !== 'all' && row.costConfidenceLevel !== filters.confidenceMode) return false;
  if (filters.valueBand !== 'all' && row.valueBand !== filters.valueBand) return false;
  if (filters.valueMin !== null && Math.abs(row.stockValue) < filters.valueMin) return false;
  if (filters.valueMax !== null && Math.abs(row.stockValue) > filters.valueMax) return false;
  if (filters.managerFocus === 'missing-cost') return row.missingCost;
  if (filters.managerFocus === 'negative') return row.netQuantity < 0;
  if (filters.managerFocus === 'high-value') return row.valueBand === 'critical' || row.valueBand === 'high';
  if (filters.managerFocus === 'risk') return row.missingCost || row.netQuantity < 0 || row.valueBand === 'critical' || row.costConfidenceLevel !== 'high';
  return true;
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
      costConfidenceLevel: getMovementConfidenceLevel(cost.confidence).level,
      costConfidenceLabel: getMovementConfidenceLevel(cost.confidence).label,
      costConfidenceScore: getMovementConfidenceLevel(cost.confidence).score,
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
    const confidence = getCostConfidenceLevel(group.costConfidence, group.valuedMovements, group.movements);
    const valueBand = getValueBand(stockValue);
    const roundedRow = {
      ...group,
      incoming: roundMoney(group.incoming),
      outgoing: roundMoney(group.outgoing),
      netQuantity: roundMoney(group.netQuantity),
      incomingValue: roundMoney(group.incomingValue),
      outgoingValue: roundMoney(group.outgoingValue),
      unitCost: roundMoney(unitCost),
      stockValue: roundMoney(stockValue),
      missingCost,
      costConfidenceLevel: confidence.level,
      costConfidenceLabel: confidence.label,
      costConfidenceScore: confidence.score,
      valueBand,
      valueBandLabel: getValueBandLabel(valueBand),
      valuationMode: filters.valuationMode
    };
    roundedRow.managerFlag = buildManagerFlag(roundedRow);
    return roundedRow;
  }).filter((row) => {
    if (filters.stockMode === 'positive' && row.netQuantity <= 0) return false;
    if (filters.stockMode === 'negative' && row.netQuantity >= 0) return false;
    if (filters.stockMode === 'zero' && row.netQuantity !== 0) return false;
    if (filters.stockMode === 'missing-cost' && !row.missingCost) return false;
    if (filters.stockMode === 'high-value' && !(row.valueBand === 'critical' || row.valueBand === 'high')) return false;
    return passesManagerFilters(row, filters);
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
        missingCostPositions: 0,
        highValuePositions: 0,
        riskPositions: 0
      });
    }
    const group = groups.get(key);
    group.stockValue += row.stockValue;
    if (row.stockValue >= 0) group.positiveValue += row.stockValue;
    else group.negativeValue += row.stockValue;
    group.netQuantity += row.netQuantity;
    group.positions += 1;
    if (row.missingCost) group.missingCostPositions += 1;
    if (row.valueBand === 'critical' || row.valueBand === 'high') group.highValuePositions += 1;
    if (row.managerFlag !== 'OK') group.riskPositions += 1;
  }
  return [...groups.values()].map((row) => ({
    ...row,
    stockValue: roundMoney(row.stockValue),
    positiveValue: roundMoney(row.positiveValue),
    negativeValue: roundMoney(row.negativeValue),
    netQuantity: roundMoney(row.netQuantity),
    missingCostRate: row.positions ? Math.round((row.missingCostPositions / row.positions) * 100) : 0
  })).sort((a, b) => Math.abs(b.stockValue) - Math.abs(a.stockValue));
}

function summarizeValuation(rows, meta, filters) {
  const totalStockValue = rows.reduce((sum, row) => sum + row.stockValue, 0);
  const positiveStockValue = rows.reduce((sum, row) => sum + (row.stockValue > 0 ? row.stockValue : 0), 0);
  const negativeStockValue = rows.reduce((sum, row) => sum + (row.stockValue < 0 ? row.stockValue : 0), 0);
  const missingCostPositions = rows.filter((row) => row.missingCost).length;
  const negativePositions = rows.filter((row) => row.netQuantity < 0).length;
  const zeroPositions = rows.filter((row) => row.netQuantity === 0).length;
  const highValuePositions = rows.filter((row) => row.valueBand === 'critical' || row.valueBand === 'high').length;
  const riskPositions = rows.filter((row) => row.managerFlag !== 'OK').length;
  const highConfidencePositions = rows.filter((row) => row.costConfidenceLevel === 'high').length;
  const mediumConfidencePositions = rows.filter((row) => row.costConfidenceLevel === 'medium').length;
  const missingConfidencePositions = rows.filter((row) => row.costConfidenceLevel === 'missing').length;
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
    highValuePositions,
    riskPositions,
    highConfidencePositions,
    mediumConfidencePositions,
    missingConfidencePositions,
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


function getCostSourceKindLabel(kind) {
  const labels = {
    'direct-unit': 'Директна единична цена',
    'derived-total': 'Изведена от обща стойност',
    missing: 'Липсва себестойност'
  };
  return labels[kind] || 'Неизвестен източник';
}

function getConfidenceExplanation(row) {
  if (!row) return 'Няма избрана позиция за анализ.';
  if (row.costConfidenceLevel === 'high') {
    return 'Себестойността е с висока увереност, защото има директна единична цена или стабилно покритие от стойностни входящи движения.';
  }
  if (row.costConfidenceLevel === 'medium') {
    return 'Себестойността е със средна увереност, защото част от стойността е изведена от обща сума или покритието не е пълно.';
  }
  return 'Липсва откриваема себестойност за тази позиция в избрания период. Провери доставките и входящите движения.';
}

function buildLedgerRows(movements) {
  let runningQuantity = 0;
  let runningValue = 0;
  return movements.map((row, index) => {
    const movementValue = row.costConfidence === 'missing'
      ? 0
      : roundMoney(row.unitCost * Math.abs(row.signedQuantity || 0));
    const signedValue = row.signedQuantity < 0 ? -Math.abs(movementValue) : Math.abs(movementValue);
    runningQuantity = roundMoney(runningQuantity + row.signedQuantity);
    runningValue = roundMoney(runningValue + signedValue);
    const runningUnitCost = runningQuantity !== 0 ? roundMoney(Math.abs(runningValue) / Math.abs(runningQuantity)) : 0;
    return {
      ...row,
      ledgerLine: index + 1,
      signedValue: roundMoney(signedValue),
      runningQuantity,
      runningValue,
      runningUnitCost,
      sourceKindLabel: getCostSourceKindLabel(row.costConfidence),
      sourceColumn: row.costSource || '',
      sourceHref: row.documentHref || ''
    };
  });
}

function summarizeCostSources(movements, ledgerRows, balanceRow, filters) {
  const valuedRows = movements.filter((row) => row.costConfidence !== 'missing' && row.unitCost > 0);
  const directRows = valuedRows.filter((row) => row.costConfidence === 'direct-unit');
  const derivedRows = valuedRows.filter((row) => row.costConfidence === 'derived-total');
  const missingRows = movements.filter((row) => row.costConfidence === 'missing');
  const incomingValuedRows = valuedRows.filter((row) => row.signedQuantity > 0);
  const latestValued = incomingValuedRows.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]
    || valuedRows.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]
    || null;
  const totalQuantity = movements.reduce((sum, row) => sum + row.signedQuantity, 0);
  const totalValue = ledgerRows.length ? ledgerRows[ledgerRows.length - 1].runningValue : 0;
  return {
    generatedAt: new Date().toISOString(),
    valuationMode: filters.valuationMode,
    itemId: balanceRow?.itemId || filters.itemId || '',
    itemLabel: balanceRow?.itemLabel || '',
    locationId: balanceRow?.locationId || filters.locationId || '',
    locationLabel: balanceRow?.locationLabel || '',
    movements: movements.length,
    valuedMovements: valuedRows.length,
    directUnitMovements: directRows.length,
    derivedTotalMovements: derivedRows.length,
    missingCostMovements: missingRows.length,
    netQuantity: roundMoney(balanceRow?.netQuantity ?? totalQuantity),
    unitCost: roundMoney(balanceRow?.unitCost || latestValued?.unitCost || 0),
    stockValue: roundMoney(balanceRow?.stockValue ?? totalValue),
    latestUnitCost: roundMoney(latestValued?.unitCost || 0),
    latestCostDate: latestValued?.date || '',
    latestCostDocument: latestValued?.documentNo || latestValued?.documentId || '',
    latestCostHref: latestValued?.documentHref || '',
    costConfidenceLevel: balanceRow?.costConfidenceLevel || 'missing',
    costConfidenceLabel: balanceRow?.costConfidenceLabel || 'Липсва',
    costConfidenceScore: balanceRow?.costConfidenceScore || 0,
    confidenceExplanation: getConfidenceExplanation(balanceRow),
    safety: 'Read-only cost source inspector. No journal, posting, reversal or correction write operation is executed.'
  };
}

async function buildValuationDrilldown(query = {}) {
  const filters = normalizeFilters({ ...query, limit: query.limit || 1000 });
  const meta = await buildMeta();
  if (!meta.ready) {
    return {
      ok: true,
      ready: false,
      filters,
      summary: summarizeValuation([], meta, filters),
      selected: null,
      rows: [],
      sourceRows: [],
      message: meta.reason
    };
  }
  const rawRows = await queryMovementRows(meta, filters, { limit: Math.max(10, Math.min(1000, filters.limit || 1000)) });
  const movements = (await prepareCostRows(meta, rawRows)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const balanceRows = aggregateValuation(movements, filters);
  const selected = balanceRows[0] || null;
  const ledgerRows = buildLedgerRows(movements);
  const sourceRows = movements
    .filter((row) => row.costConfidence !== 'missing' || row.signedQuantity > 0)
    .slice()
    .sort((a, b) => {
      if (a.costConfidence === 'missing' && b.costConfidence !== 'missing') return 1;
      if (a.costConfidence !== 'missing' && b.costConfidence === 'missing') return -1;
      return String(b.date).localeCompare(String(a.date));
    })
    .slice(0, Math.min(filters.limit, 250))
    .map((row, index) => ({
      ...row,
      sourceLine: index + 1,
      sourceKindLabel: getCostSourceKindLabel(row.costConfidence),
      sourceColumn: row.costSource || '',
      sourceHref: row.documentHref || ''
    }));
  return {
    ok: true,
    ready: true,
    filters,
    summary: summarizeValuation(balanceRows, meta, filters),
    selected,
    sourceSummary: summarizeCostSources(movements, ledgerRows, selected, filters),
    rows: ledgerRows,
    sourceRows,
    diagnostics: buildDiagnostics(meta)
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
      { id: 'missing-cost', name: 'Липсва себестойност' },
      { id: 'high-value', name: 'Висока стойност' }
    ],
    confidenceModes: [
      { id: 'all', name: 'Всички нива' },
      { id: 'high', name: 'Висока увереност' },
      { id: 'medium', name: 'Средна увереност' },
      { id: 'missing', name: 'Липсва себестойност' }
    ],
    managerFocusModes: [
      { id: 'all', name: 'Всички позиции' },
      { id: 'risk', name: 'Само рискови' },
      { id: 'missing-cost', name: 'Липсва себестойност' },
      { id: 'negative', name: 'Отрицателни наличности' },
      { id: 'high-value', name: 'Висока стойност' }
    ],
    valueBands: [
      { id: 'all', name: 'Всички стойности' },
      { id: 'critical', name: 'Критична стойност' },
      { id: 'high', name: 'Висока стойност' },
      { id: 'medium', name: 'Средна стойност' },
      { id: 'low', name: 'Ниска стойност' },
      { id: 'zero', name: 'Нулева стойност' }
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
      valuation.summary.riskPositions > 0
        ? `${valuation.summary.riskPositions} позиции са маркирани за управителски контрол.`
        : 'Няма позиции с управителски риск за избраните филтри.',
      'Справката е read-only и не променя складови движения, документи или journal записи.'
    ]
  };
}


export async function getStockValuationItemLedger(query = {}) {
  const drilldown = await buildValuationDrilldown(query);
  return {
    ok: true,
    ready: drilldown.ready,
    filters: drilldown.filters,
    summary: drilldown.summary,
    selected: drilldown.selected,
    rows: drilldown.rows,
    diagnostics: drilldown.diagnostics,
    safety: 'Read-only item valuation ledger. No stock journal write operation is executed.'
  };
}

export async function getStockValuationCostSource(query = {}) {
  const drilldown = await buildValuationDrilldown(query);
  return {
    ok: true,
    ready: drilldown.ready,
    filters: drilldown.filters,
    selected: drilldown.selected,
    sourceSummary: drilldown.sourceSummary || null,
    sourceRows: drilldown.sourceRows || [],
    diagnostics: drilldown.diagnostics,
    safety: 'Read-only cost source trace. No posting, reversal, correction or valuation write operation is executed.'
  };
}
