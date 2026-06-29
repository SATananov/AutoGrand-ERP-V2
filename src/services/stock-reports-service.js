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

function normalizeName(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function asNumber(value, fallback = 0) {
  if (typeof value === 'bigint') return Number(value);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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
  const map = new Map(columns.map((col) => [normalizeName(col.name), col.name]));
  for (const candidate of candidates) {
    const hit = map.get(normalizeName(candidate));
    if (hit) return hit;
  }
  for (const col of columns) {
    const norm = normalizeName(col.name);
    if (candidates.some((candidate) => norm.includes(normalizeName(candidate)))) return col.name;
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

function isNumericColumn(column) {
  const type = String(column?.type || '').toUpperCase();
  return /INT|REAL|NUM|DEC|DOUBLE|FLOAT/.test(type) || normalizeName(column?.name).includes('qty') || normalizeName(column?.name).includes('quantity');
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
    let score = tableNameScore(entry.name, MOVEMENT_NAME_HINTS) * 3;
    if (quantityCol) score += 4;
    if (itemCol) score += 3;
    if (dateCol) score += 2;
    if (typeCol) score += 1;
    if (!quantityCol) score -= 6;
    return { ...entry, quantityCol, itemCol, dateCol, typeCol, score };
  });

  return candidates.sort((a, b) => b.score - a.score)[0] || null;
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

function normalizeDateInput(value, fallbackDays = 30) {
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
  const from = normalizeDateInput(query.from, 30);
  const to = normalizeToDate(query.to);
  const itemId = String(query.itemId || '').trim();
  const locationId = String(query.locationId || '').trim();
  const limit = Math.max(10, Math.min(500, asNumber(query.limit, 100)));
  return { from, to, itemId, locationId, limit };
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
  const order = movement.dateCol ? `ORDER BY ${quoteIdent(movement.dateCol)} DESC` : '';
  const limit = options.limit || filters.limit || 100;
  const sql = `SELECT * FROM ${quoteIdent(movement.name)} ${where.clause} ${order} LIMIT ${Number(limit)}`;
  const rows = await meta.prisma.$queryRawUnsafe(sql, ...where.params);
  return rows.map(cleanRow);
}

function getDirectionText(row, meta) {
  const movement = meta.movement;
  const values = [movement.typeCol, movement.statusCol, movement.noteCol, movement.documentNoCol]
    .filter(Boolean)
    .map((col) => String(row[col] || '').toLowerCase())
    .join(' ');
  return values;
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

function getLookupKey(value) {
  if (value === null || value === undefined || value === '') return '__none__';
  return String(value);
}

function displayValue(value, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

async function fetchLookupRows(meta, lookup, max = 1000) {
  if (!lookup?.idCol) return new Map();
  const cols = [lookup.idCol, lookup.codeCol, lookup.nameCol].filter(Boolean);
  const select = [...new Set(cols)].map(quoteIdent).join(', ');
  const sql = `SELECT ${select} FROM ${quoteIdent(lookup.name)} ORDER BY ${lookup.nameCol ? quoteIdent(lookup.nameCol) : quoteIdent(lookup.idCol)} LIMIT ${Number(max)}`;
  const rows = await meta.prisma.$queryRawUnsafe(sql);
  const map = new Map();
  for (const row of rows.map(cleanRow)) {
    const key = getLookupKey(row[lookup.idCol]);
    map.set(key, {
      id: key,
      code: lookup.codeCol ? displayValue(row[lookup.codeCol], '') : '',
      name: lookup.nameCol ? displayValue(row[lookup.nameCol], key) : key
    });
  }
  return map;
}

function labelFromLookup(map, id, fallbackPrefix) {
  const key = getLookupKey(id);
  const hit = map.get(key);
  if (hit) {
    return hit.code ? `${hit.code} · ${hit.name}` : hit.name;
  }
  if (key === '__none__') return '-';
  return `${fallbackPrefix} ${key}`;
}

async function prepareRows(meta, rows) {
  const itemMap = await fetchLookupRows(meta, meta.item);
  const locationMap = await fetchLookupRows(meta, meta.location);
  return rows.map((row) => {
    const signedQuantity = getSignedQuantity(row, meta);
    const itemId = meta.movement.itemCol ? row[meta.movement.itemCol] : null;
    const locationId = meta.movement.locationCol ? row[meta.movement.locationCol] : null;
    return {
      id: meta.movement.idCol ? displayValue(row[meta.movement.idCol]) : '',
      date: meta.movement.dateCol ? displayValue(row[meta.movement.dateCol]) : '',
      itemId: displayValue(itemId, ''),
      itemLabel: labelFromLookup(itemMap, itemId, 'Артикул'),
      locationId: displayValue(locationId, ''),
      locationLabel: labelFromLookup(locationMap, locationId, 'Обект'),
      quantity: asNumber(row[meta.movement.quantityCol]),
      signedQuantity,
      incoming: signedQuantity > 0 ? signedQuantity : 0,
      outgoing: signedQuantity < 0 ? Math.abs(signedQuantity) : 0,
      documentId: meta.movement.documentCol ? displayValue(row[meta.movement.documentCol], '') : '',
      documentNo: meta.movement.documentNoCol ? displayValue(row[meta.movement.documentNoCol], '') : '',
      movementType: meta.movement.typeCol ? displayValue(row[meta.movement.typeCol], '') : '',
      status: meta.movement.statusCol ? displayValue(row[meta.movement.statusCol], '') : '',
      note: meta.movement.noteCol ? displayValue(row[meta.movement.noteCol], '') : ''
    };
  });
}

function aggregateBalance(rows) {
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
        lastMovementDate: ''
      });
    }
    const group = groups.get(key);
    group.incoming += row.incoming;
    group.outgoing += row.outgoing;
    group.netQuantity += row.signedQuantity;
    group.movements += 1;
    if (!group.lastMovementDate || String(row.date) > String(group.lastMovementDate)) {
      group.lastMovementDate = row.date;
    }
  }
  return [...groups.values()].sort((a, b) => Math.abs(b.netQuantity) - Math.abs(a.netQuantity));
}

function summarizeRows(rows) {
  const balance = aggregateBalance(rows);
  const incoming = rows.reduce((sum, row) => sum + row.incoming, 0);
  const outgoing = rows.reduce((sum, row) => sum + row.outgoing, 0);
  const negative = balance.filter((row) => row.netQuantity < 0).length;
  const zero = balance.filter((row) => row.netQuantity === 0).length;
  return {
    movementRows: rows.length,
    skuLocations: balance.length,
    incoming,
    outgoing,
    netQuantity: incoming - outgoing,
    negativeSkuLocations: negative,
    zeroSkuLocations: zero
  };
}

function buildDiagnostics(meta) {
  if (!meta.ready) {
    return { ready: false, reason: meta.reason, tables: meta.tables };
  }
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
      document: meta.movement.documentCol,
      documentNo: meta.movement.documentNoCol
    },
    itemTable: meta.item?.name || null,
    locationTable: meta.location?.name || null
  };
}

export async function getStockReportsOptions(query = {}) {
  const meta = await buildMeta();
  const filters = normalizeFilters(query);
  if (!meta.ready) return { ok: true, filters, diagnostics: buildDiagnostics(meta), items: [], locations: [] };

  const itemMap = await fetchLookupRows(meta, meta.item, 500);
  const locationMap = await fetchLookupRows(meta, meta.location, 500);
  const rows = await prepareRows(meta, await queryMovementRows(meta, filters, { limit: 1000 }));

  const itemFallback = new Map();
  const locationFallback = new Map();
  for (const row of rows) {
    if (row.itemId) itemFallback.set(row.itemId, { id: row.itemId, code: '', name: row.itemLabel });
    if (row.locationId) locationFallback.set(row.locationId, { id: row.locationId, code: '', name: row.locationLabel });
  }

  return {
    ok: true,
    filters,
    diagnostics: buildDiagnostics(meta),
    items: [...(itemMap.size ? itemMap : itemFallback).values()],
    locations: [...(locationMap.size ? locationMap : locationFallback).values()]
  };
}

export async function getStockReportsSummary(query = {}) {
  const meta = await buildMeta();
  const filters = normalizeFilters(query);
  if (!meta.ready) return { ok: true, filters, diagnostics: buildDiagnostics(meta), summary: summarizeRows([]), warnings: [meta.reason] };
  const rows = await prepareRows(meta, await queryMovementRows(meta, filters, { limit: 50000 }));
  const balance = aggregateBalance(rows);
  return {
    ok: true,
    filters,
    diagnostics: buildDiagnostics(meta),
    summary: summarizeRows(rows),
    topNegative: balance.filter((row) => row.netQuantity < 0).slice(0, 10),
    topMovement: balance.sort((a, b) => b.movements - a.movements).slice(0, 10)
  };
}

export async function getStockReportsBalance(query = {}) {
  const meta = await buildMeta();
  const filters = normalizeFilters(query);
  if (!meta.ready) return { ok: true, filters, diagnostics: buildDiagnostics(meta), rows: [] };
  const rows = await prepareRows(meta, await queryMovementRows(meta, filters, { limit: 50000 }));
  return {
    ok: true,
    filters,
    diagnostics: buildDiagnostics(meta),
    rows: aggregateBalance(rows).slice(0, filters.limit)
  };
}

export async function getStockReportsMovements(query = {}) {
  const meta = await buildMeta();
  const filters = normalizeFilters(query);
  if (!meta.ready) return { ok: true, filters, diagnostics: buildDiagnostics(meta), rows: [] };
  const rows = await prepareRows(meta, await queryMovementRows(meta, filters, { limit: filters.limit }));
  return { ok: true, filters, diagnostics: buildDiagnostics(meta), rows };
}
