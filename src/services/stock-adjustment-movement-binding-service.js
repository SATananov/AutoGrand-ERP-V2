// AutoGrand ERP V2 Step 4.8.2 Real Stock Adjustment Posting Integration / Movement Binding
// Runtime binding adapter between stock adjustment documents and the existing stock movement journal.

export const STOCK_ADJUSTMENT_SOURCE_TYPE = "STOCK_ADJUSTMENT";
export const STOCK_ADJUSTMENT_MOVEMENT_KIND = "ADJUSTMENT";
export const STOCK_ADJUSTMENT_BINDING_STEP = "4.8.2";

const EXCLUDED_TABLE_PREFIXES = [
  "ag_stock_adjustment",
  "sqlite_",
  "_prisma",
  "prisma_"
];

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}_${Date.now().toString(36).toUpperCase()}_${random}`;
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function normalizeColumnName(name) {
  return String(name || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function columnNameSet(columns) {
  return new Set(columns.map((column) => normalizeColumnName(column.name)));
}

function columnByNames(columns, names) {
  const byNormalized = new Map(columns.map((column) => [normalizeColumnName(column.name), column.name]));
  for (const name of names) {
    const found = byNormalized.get(normalizeColumnName(name));
    if (found) return found;
  }
  return null;
}

function columnObjectByName(columns, name) {
  const normalized = normalizeColumnName(name);
  return columns.find((column) => normalizeColumnName(column.name) === normalized) || null;
}

function hasAnyColumn(columns, names) {
  return Boolean(columnByNames(columns, names));
}

function isAutoIntegerPrimaryKey(column) {
  const type = String(column.type || "").toUpperCase();
  return Number(column.pk) === 1 && type.includes("INT");
}

async function listTables(db) {
  return db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
}

async function tableInfo(db, table) {
  return db.$queryRawUnsafe(`PRAGMA table_info(${quoteIdent(table)})`);
}

function isExcludedTable(table) {
  const lower = String(table || "").toLowerCase();
  return EXCLUDED_TABLE_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function resolveColumnRoles(columns) {
  const id = columnByNames(columns, ["id", "movementId", "movement_id", "stockMovementId", "stock_movement_id"]);
  const item = columnByNames(columns, [
    "itemId",
    "item_id",
    "productId",
    "product_id",
    "articleId",
    "article_id",
    "goodsId",
    "goods_id",
    "skuId",
    "sku_id"
  ]);
  const warehouse = columnByNames(columns, [
    "warehouseId",
    "warehouse_id",
    "locationId",
    "location_id",
    "objectId",
    "object_id",
    "storeId",
    "store_id"
  ]);
  const signedQuantity = columnByNames(columns, [
    "signedQuantity",
    "signed_quantity",
    "quantityDelta",
    "quantity_delta",
    "deltaQuantity",
    "delta_quantity",
    "qtyDelta",
    "qty_delta"
  ]);
  const quantity = columnByNames(columns, ["quantity", "qty", "amount", "movementQuantity", "movement_quantity"]);
  const direction = columnByNames(columns, ["direction", "side", "io", "movementDirection", "movement_direction"]);
  const movementType = columnByNames(columns, ["movementType", "movement_type", "type", "kind", "operationType", "operation_type"]);
  const sourceType = columnByNames(columns, ["sourceType", "source_type", "documentType", "document_type", "originType", "origin_type"]);
  const sourceId = columnByNames(columns, ["sourceId", "source_id", "documentId", "document_id", "originId", "origin_id"]);
  const sourceLineId = columnByNames(columns, ["sourceLineId", "source_line_id", "documentLineId", "document_line_id", "originLineId", "origin_line_id"]);
  const sourceNumber = columnByNames(columns, ["sourceNumber", "source_number", "documentNumber", "document_number", "reference", "referenceNo", "reference_no"]);
  const reason = columnByNames(columns, ["reason", "note", "comment", "description", "memo"]);
  const createdAt = columnByNames(columns, ["createdAt", "created_at", "postedAt", "posted_at", "movementDate", "movement_date", "date"]);
  const updatedAt = columnByNames(columns, ["updatedAt", "updated_at"]);
  const postedBy = columnByNames(columns, ["postedBy", "posted_by", "createdBy", "created_by", "userId", "user_id", "operator"]);
  const status = columnByNames(columns, ["status", "state"]);

  return {
    id,
    item,
    warehouse,
    signedQuantity,
    quantity,
    direction,
    movementType,
    sourceType,
    sourceId,
    sourceLineId,
    sourceNumber,
    reason,
    createdAt,
    updatedAt,
    postedBy,
    status
  };
}

function scoreStockMovementCandidate(table, columns) {
  if (isExcludedTable(table)) return -1000;

  const lower = String(table || "").toLowerCase();
  const names = columnNameSet(columns);
  const roles = resolveColumnRoles(columns);
  let score = 0;

  if (lower.includes("stock")) score += 8;
  if (lower.includes("movement")) score += 10;
  if (lower.includes("journal")) score += 9;
  if (lower.includes("ledger")) score += 6;
  if (lower.includes("inventory")) score += 5;
  if (lower.includes("transaction")) score += 4;

  if (roles.item) score += 8;
  if (roles.warehouse) score += 5;
  if (roles.signedQuantity) score += 8;
  if (roles.quantity) score += 6;
  if (roles.direction) score += 5;
  if (roles.movementType) score += 4;
  if (roles.sourceType) score += 3;
  if (roles.sourceId) score += 4;
  if (roles.sourceLineId) score += 4;
  if (roles.createdAt) score += 2;

  if (names.has("sku") || names.has("barcode")) score += 1;
  if (!roles.item) score -= 12;
  if (!roles.quantity && !roles.signedQuantity) score -= 12;
  if (lower.includes("view") || lower.includes("audit") || lower.includes("log")) score -= 1;

  return score;
}

function requiredColumnGaps(columns, roles) {
  const roleColumns = new Set(Object.values(roles).filter(Boolean).map((name) => normalizeColumnName(name)));
  const gaps = [];

  for (const column of columns) {
    const name = String(column.name || "");
    const normalized = normalizeColumnName(name);
    const hasDefault = column.dflt_value !== null && column.dflt_value !== undefined;
    const isPrimary = Number(column.pk) === 1;
    const required = Number(column.notnull) === 1 && !hasDefault && !isAutoIntegerPrimaryKey(column);
    if (!required) continue;
    if (isPrimary && roles.id) continue;
    if (roleColumns.has(normalized)) continue;
    if (canProvideFallbackValue(column)) continue;
    gaps.push(name);
  }

  return gaps;
}

function canProvideFallbackValue(column) {
  const name = normalizeColumnName(column.name);
  const type = String(column.type || "").toUpperCase();
  if (name.includes("date") || name.includes("time") || name.includes("created") || name.includes("updated")) return true;
  if (name.includes("status") || name.includes("state")) return true;
  if (name.includes("type") || name.includes("kind")) return true;
  if (name.includes("reason") || name.includes("note") || name.includes("comment") || name.includes("description") || name.includes("memo")) return true;
  if (name.includes("number") || name.includes("reference")) return true;
  if (name.includes("user") || name.includes("operator") || name.includes("by")) return true;
  if (type.includes("INT") || type.includes("REAL") || type.includes("NUM") || type.includes("DEC") || type.includes("FLOAT") || type.includes("DOUBLE")) return true;
  return true;
}

function buildBindingProfile(table, columns, score) {
  const roles = resolveColumnRoles(columns);
  const requiredGaps = requiredColumnGaps(columns, roles);
  const canInsert = Boolean(roles.item && (roles.quantity || roles.signedQuantity) && requiredGaps.length === 0 && score >= 12);
  const profile = roles.sourceId && roles.sourceLineId
    ? "source-line-bound"
    : roles.sourceId
      ? "source-document-bound"
      : "movement-table-bound";

  return {
    step: STOCK_ADJUSTMENT_BINDING_STEP,
    table,
    score,
    profile,
    canInsert,
    requiredGaps,
    roles,
    columns: columns.map((column) => ({
      name: column.name,
      type: column.type,
      notnull: Number(column.notnull || 0),
      pk: Number(column.pk || 0),
      dflt_value: column.dflt_value
    }))
  };
}

export async function listStockMovementBindingCandidates(db, options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit || 8), 25));
  const tables = await listTables(db);
  const candidates = [];

  for (const row of tables) {
    const table = row.name;
    if (!table || isExcludedTable(table)) continue;
    const columns = await tableInfo(db, table);
    const score = scoreStockMovementCandidate(table, columns);
    if (score <= 0) continue;
    candidates.push(buildBindingProfile(table, columns, score));
  }

  return candidates
    .sort((a, b) => Number(b.canInsert) - Number(a.canInsert) || b.score - a.score || a.table.localeCompare(b.table))
    .slice(0, limit);
}

export async function detectRealStockMovementBinding(db) {
  const candidates = await listStockMovementBindingCandidates(db, { limit: 25 });
  return candidates.find((candidate) => candidate.canInsert) || null;
}

export async function resolveStockMovementBinding(db) {
  const binding = await detectRealStockMovementBinding(db);
  if (!binding) {
    const err = new Error("Real stock movement binding was not found. Posting stopped to protect the stock journal.");
    err.statusCode = 500;
    throw err;
  }
  return binding;
}

function rowValue(row, names, fallback = "") {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name];
    const lower = String(name).toLowerCase();
    const upper = String(name).toUpperCase();
    if (row[lower] !== undefined && row[lower] !== null) return row[lower];
    if (row[upper] !== undefined && row[upper] !== null) return row[upper];
  }
  return fallback;
}

function setValue(valuesByColumn, columnName, value) {
  if (!columnName) return;
  valuesByColumn.set(columnName, value);
}

function fallbackRequiredValue(column, context) {
  const name = normalizeColumnName(column.name);
  const type = String(column.type || "").toUpperCase();

  if (name === "id" || name.endsWith("id")) return context.movementId;
  if (name.includes("date") || name.includes("time") || name.includes("created") || name.includes("updated")) return context.now;
  if (name.includes("status") || name.includes("state")) return "POSTED";
  if (name.includes("direction") || name === "io" || name.includes("side")) return context.direction;
  if (name.includes("type") || name.includes("kind")) return STOCK_ADJUSTMENT_MOVEMENT_KIND;
  if (name.includes("source") && name.includes("line")) return context.lineId;
  if (name.includes("source") || name.includes("document") || name.includes("origin")) return context.documentId;
  if (name.includes("number") || name.includes("reference")) return context.documentNumber;
  if (name.includes("item") || name.includes("product") || name.includes("article") || name.includes("goods") || name.includes("sku")) return context.itemId;
  if (name.includes("warehouse") || name.includes("location") || name.includes("object") || name.includes("store")) return context.warehouseId;
  if (name.includes("reason") || name.includes("note") || name.includes("comment") || name.includes("description") || name.includes("memo")) return context.reason;
  if (name.includes("user") || name.includes("operator") || name.includes("by")) return context.postedBy;
  if (type.includes("INT") || type.includes("REAL") || type.includes("NUM") || type.includes("DEC") || type.includes("FLOAT") || type.includes("DOUBLE")) return 0;
  return STOCK_ADJUSTMENT_SOURCE_TYPE;
}

function buildMovementValues(binding, document, line, options = {}) {
  const roles = binding.roles || {};
  const movementId = newId("SMV");
  const quantityDelta = asNumber(rowValue(line, ["delta_quantity", "deltaQuantity"], 0), 0);
  const direction = quantityDelta >= 0 ? "IN" : "OUT";
  const now = nowIso();
  const itemId = cleanText(rowValue(line, ["item_id", "itemId"]));
  const warehouseId = cleanText(rowValue(line, ["warehouse_id", "warehouseId"]));
  const documentId = cleanText(document.id);
  const documentNumber = cleanText(document.number, documentId);
  const lineId = cleanText(rowValue(line, ["id", "line_id", "lineId"]));
  const postedBy = cleanText(options.postedBy || options.user || "system");
  const reason = cleanText(options.reason || rowValue(line, ["reason"], ""), `Stock adjustment ${documentNumber}`);
  const valuesByColumn = new Map();

  const idColumn = roles.id ? columnObjectByName(binding.columns, roles.id) : null;
  const autoIdColumn = Boolean(idColumn && isAutoIntegerPrimaryKey(idColumn));
  if (roles.id && !autoIdColumn) {
    setValue(valuesByColumn, roles.id, movementId);
  }

  if (roles.signedQuantity) setValue(valuesByColumn, roles.signedQuantity, quantityDelta);
  if (roles.quantity) {
    const normalizedQuantity = normalizeColumnName(roles.quantity);
    const value = normalizedQuantity.includes("delta") || normalizedQuantity.includes("signed") ? quantityDelta : Math.abs(quantityDelta);
    setValue(valuesByColumn, roles.quantity, value);
  }
  if (roles.direction) setValue(valuesByColumn, roles.direction, direction);
  if (roles.movementType) setValue(valuesByColumn, roles.movementType, STOCK_ADJUSTMENT_MOVEMENT_KIND);
  if (roles.sourceType) setValue(valuesByColumn, roles.sourceType, STOCK_ADJUSTMENT_SOURCE_TYPE);
  if (roles.sourceId) setValue(valuesByColumn, roles.sourceId, documentId);
  if (roles.sourceLineId) setValue(valuesByColumn, roles.sourceLineId, lineId);
  if (roles.sourceNumber) setValue(valuesByColumn, roles.sourceNumber, documentNumber);
  if (roles.item) setValue(valuesByColumn, roles.item, itemId);
  if (roles.warehouse) setValue(valuesByColumn, roles.warehouse, warehouseId || null);
  if (roles.reason) setValue(valuesByColumn, roles.reason, reason);
  if (roles.createdAt) setValue(valuesByColumn, roles.createdAt, now);
  if (roles.updatedAt) setValue(valuesByColumn, roles.updatedAt, now);
  if (roles.postedBy) setValue(valuesByColumn, roles.postedBy, postedBy);
  if (roles.status) setValue(valuesByColumn, roles.status, "POSTED");

  const context = {
    movementId,
    quantityDelta,
    direction,
    now,
    itemId,
    warehouseId,
    documentId,
    documentNumber,
    lineId,
    postedBy,
    reason
  };

  for (const column of binding.columns || []) {
    const name = String(column.name || "");
    const hasDefault = column.dflt_value !== null && column.dflt_value !== undefined;
    const required = Number(column.notnull) === 1 && !hasDefault && !isAutoIntegerPrimaryKey(column);
    if (required && !valuesByColumn.has(name)) {
      valuesByColumn.set(name, fallbackRequiredValue(column, context));
    }
  }

  return { movementId, quantityDelta, direction, valuesByColumn, autoIdColumn, idColumnName: roles.id || null };
}

export async function findExistingBoundStockMovement(db, binding, document, line) {
  const roles = binding.roles || {};
  if (!roles.sourceId || !roles.sourceLineId) return null;

  const documentId = cleanText(document.id);
  const lineId = cleanText(rowValue(line, ["id", "line_id", "lineId"]));
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM ${quoteIdent(binding.table)} WHERE ${quoteIdent(roles.sourceId)} = ? AND ${quoteIdent(roles.sourceLineId)} = ? LIMIT 1`,
    documentId,
    lineId
  );

  return rows[0] || null;
}

export async function insertBoundStockAdjustmentMovement(db, input = {}) {
  const document = input.document || input.doc;
  const line = input.line;
  if (!document || !line) {
    const err = new Error("Missing stock adjustment document or line for movement binding.");
    err.statusCode = 400;
    throw err;
  }

  const binding = input.binding || await resolveStockMovementBinding(db);
  const quantityDelta = asNumber(rowValue(line, ["delta_quantity", "deltaQuantity"], 0), 0);
  if (Math.abs(quantityDelta) <= 0.0000001) {
    return {
      skipped: true,
      reason: "zero-delta",
      movementId: null,
      movementTable: binding.table,
      table: binding.table,
      quantityDelta: 0,
      direction: "NONE",
      bindingProfile: binding.profile,
      bindingScore: binding.score,
      sourceType: STOCK_ADJUSTMENT_SOURCE_TYPE
    };
  }

  const existing = await findExistingBoundStockMovement(db, binding, document, line);
  if (existing) {
    const existingId = existing.id || existing.ID || existing.movement_id || existing.movementId || null;
    return {
      reused: true,
      movementId: existingId,
      movementTable: binding.table,
      table: binding.table,
      quantityDelta,
      direction: quantityDelta >= 0 ? "IN" : "OUT",
      bindingProfile: binding.profile,
      bindingScore: binding.score,
      sourceType: STOCK_ADJUSTMENT_SOURCE_TYPE
    };
  }

  const built = buildMovementValues(binding, document, line, input);
  const insertColumns = Array.from(built.valuesByColumn.keys());
  const insertValues = insertColumns.map((name) => built.valuesByColumn.get(name));
  if (insertColumns.length === 0) {
    const err = new Error(`Stock movement binding table ${binding.table} has no safe insert columns.`);
    err.statusCode = 500;
    throw err;
  }

  const placeholders = insertColumns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${quoteIdent(binding.table)} (${insertColumns.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;
  await db.$executeRawUnsafe(sql, ...insertValues);

  let persistedMovementId = built.movementId;
  if (built.autoIdColumn) {
    const idRows = await db.$queryRawUnsafe("SELECT last_insert_rowid() AS id");
    if (idRows && idRows[0] && idRows[0].id !== undefined && idRows[0].id !== null) {
      persistedMovementId = String(idRows[0].id);
    }
  }

  return {
    reused: false,
    movementId: persistedMovementId,
    movementTable: binding.table,
    table: binding.table,
    quantityDelta: built.quantityDelta,
    direction: built.direction,
    bindingProfile: binding.profile,
    bindingScore: binding.score,
    sourceType: STOCK_ADJUSTMENT_SOURCE_TYPE
  };
}

export async function getStockAdjustmentMovementBindingStatus(db) {
  const candidates = await listStockMovementBindingCandidates(db, { limit: 8 });
  const active = candidates.find((candidate) => candidate.canInsert) || null;
  return {
    ok: true,
    step: STOCK_ADJUSTMENT_BINDING_STEP,
    sourceType: STOCK_ADJUSTMENT_SOURCE_TYPE,
    active,
    candidates,
    canPost: Boolean(active),
    rule: "Posting uses an existing stock movement table only. Old movements are never edited or deleted."
  };
}
