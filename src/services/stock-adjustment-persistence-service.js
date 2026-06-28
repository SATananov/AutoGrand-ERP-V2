import { PrismaClient } from "@prisma/client";

const prisma = globalThis.__autoGrandStockAdjustmentPrisma || new PrismaClient();
if (!globalThis.__autoGrandStockAdjustmentPrisma) {
  globalThis.__autoGrandStockAdjustmentPrisma = prisma;
}

const DOCUMENT_TABLE = "ag_stock_adjustment_documents";
const LINE_TABLE = "ag_stock_adjustment_lines";
const POSTING_LOG_TABLE = "ag_stock_adjustment_posting_log";
const POSTED = "POSTED";
const DRAFT = "DRAFT";

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
  return String(value).trim();
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function rowValue(row, name) {
  return row[name] ?? row[name.toLowerCase()] ?? row[name.toUpperCase()];
}

function normalizeDoc(row) {
  if (!row) return null;
  const status = row.status || DRAFT;
  return {
    id: row.id,
    number: row.number,
    status,
    locked: status === POSTED,
    reason: row.reason || "",
    note: row.note || "",
    issueKey: row.issue_key || "",
    sourceIssueJson: row.source_issue_json || "",
    postedAt: row.posted_at || null,
    postedBy: row.posted_by || "",
    lockedAt: row.locked_at || null,
    lockReason: row.lock_reason || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    lineCount: Number(row.line_count || row.lineCount || 0),
    totalDelta: Number(row.total_delta || row.totalDelta || 0)
  };
}

function normalizeLine(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    itemId: row.item_id,
    itemCode: row.item_code || "",
    itemName: row.item_name || "",
    warehouseId: row.warehouse_id || "",
    warehouseName: row.warehouse_name || "",
    currentQuantity: Number(row.current_quantity || 0),
    countedQuantity: Number(row.counted_quantity || 0),
    deltaQuantity: Number(row.delta_quantity || 0),
    reason: row.reason || "",
    note: row.note || "",
    postedMovementId: row.posted_movement_id || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

export async function ensureStockAdjustmentPersistence(db = prisma) {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(DOCUMENT_TABLE)} (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      reason TEXT,
      note TEXT,
      issue_key TEXT,
      source_issue_json TEXT,
      posted_at TEXT,
      posted_by TEXT,
      locked_at TEXT,
      lock_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(LINE_TABLE)} (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_code TEXT,
      item_name TEXT,
      warehouse_id TEXT,
      warehouse_name TEXT,
      current_quantity REAL NOT NULL DEFAULT 0,
      counted_quantity REAL NOT NULL DEFAULT 0,
      delta_quantity REAL NOT NULL DEFAULT 0,
      reason TEXT,
      note TEXT,
      posted_movement_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(document_id) REFERENCES ${quoteIdent(DOCUMENT_TABLE)}(id)
    )
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_ag_stock_adjustment_lines_document
    ON ${quoteIdent(LINE_TABLE)}(document_id)
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(POSTING_LOG_TABLE)} (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      line_id TEXT NOT NULL,
      movement_table TEXT NOT NULL,
      movement_id TEXT NOT NULL,
      quantity_delta REAL NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(document_id, line_id)
    )
  `);

  return {
    ok: true,
    documentTable: DOCUMENT_TABLE,
    lineTable: LINE_TABLE,
    postingLogTable: POSTING_LOG_TABLE
  };
}

async function readDocumentRow(id, db = prisma) {
  await ensureStockAdjustmentPersistence(db);
  const rows = await db.$queryRawUnsafe(
    `SELECT d.*, COUNT(l.id) AS line_count, COALESCE(SUM(l.delta_quantity), 0) AS total_delta
     FROM ${quoteIdent(DOCUMENT_TABLE)} d
     LEFT JOIN ${quoteIdent(LINE_TABLE)} l ON l.document_id = d.id
     WHERE d.id = ?
     GROUP BY d.id`,
    id
  );
  return rows[0] || null;
}

async function assertDraftDocument(id, db = prisma) {
  const row = await readDocumentRow(id, db);
  if (!row) {
    const err = new Error("Документът за складова корекция не е намерен.");
    err.statusCode = 404;
    throw err;
  }
  if (row.status === POSTED) {
    const err = new Error("Документът е осчетоводен и заключен. Не може да се редактира.");
    err.statusCode = 409;
    throw err;
  }
  return row;
}

export async function listStockAdjustmentDocuments(options = {}) {
  await ensureStockAdjustmentPersistence();
  const status = cleanText(options.status).toUpperCase();
  const limit = Math.min(Math.max(Number(options.limit || 50), 1), 200);
  const where = status ? "WHERE d.status = ?" : "";
  const params = status ? [status, limit] : [limit];
  const rows = await prisma.$queryRawUnsafe(
    `SELECT d.*, COUNT(l.id) AS line_count, COALESCE(SUM(l.delta_quantity), 0) AS total_delta
     FROM ${quoteIdent(DOCUMENT_TABLE)} d
     LEFT JOIN ${quoteIdent(LINE_TABLE)} l ON l.document_id = d.id
     ${where}
     GROUP BY d.id
     ORDER BY d.created_at DESC
     LIMIT ?`,
    ...params
  );
  return rows.map(normalizeDoc);
}

export async function getStockAdjustmentDocument(id) {
  await ensureStockAdjustmentPersistence();
  const docRow = await readDocumentRow(id);
  if (!docRow) return null;
  const lineRows = await prisma.$queryRawUnsafe(
    `SELECT * FROM ${quoteIdent(LINE_TABLE)} WHERE document_id = ? ORDER BY created_at ASC`,
    id
  );
  return {
    ...normalizeDoc(docRow),
    lines: lineRows.map(normalizeLine)
  };
}

export async function createStockAdjustmentDraft(input = {}) {
  await ensureStockAdjustmentPersistence();
  const id = newId("SAD");
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const number = cleanText(input.number) || `SKK-${stamp}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const now = nowIso();
  const sourceIssue = input.sourceIssue ? JSON.stringify(input.sourceIssue) : cleanText(input.sourceIssueJson);

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${quoteIdent(DOCUMENT_TABLE)}
     (id, number, status, reason, note, issue_key, source_issue_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    number,
    DRAFT,
    cleanText(input.reason, "Складова корекция"),
    cleanText(input.note),
    cleanText(input.issueKey || input.issue_key),
    sourceIssue,
    now,
    now
  );

  return getStockAdjustmentDocument(id);
}

export async function upsertStockAdjustmentLine(documentId, input = {}) {
  await ensureStockAdjustmentPersistence();
  await assertDraftDocument(documentId);

  const now = nowIso();
  const currentQuantity = asNumber(input.currentQuantity ?? input.current_quantity, 0);
  const countedQuantity = asNumber(input.countedQuantity ?? input.counted_quantity, currentQuantity);
  const explicitDelta = input.deltaQuantity ?? input.delta_quantity;
  const deltaQuantity = explicitDelta === undefined || explicitDelta === null || explicitDelta === ""
    ? countedQuantity - currentQuantity
    : asNumber(explicitDelta, 0);

  const id = cleanText(input.id || input.lineId || input.line_id) || newId("SAL");
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM ${quoteIdent(LINE_TABLE)} WHERE id = ? AND document_id = ?`,
    id,
    documentId
  );

  if (existing.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE ${quoteIdent(LINE_TABLE)}
       SET item_id = ?, item_code = ?, item_name = ?, warehouse_id = ?, warehouse_name = ?,
           current_quantity = ?, counted_quantity = ?, delta_quantity = ?, reason = ?, note = ?, updated_at = ?
       WHERE id = ? AND document_id = ?`,
      cleanText(input.itemId || input.item_id),
      cleanText(input.itemCode || input.item_code),
      cleanText(input.itemName || input.item_name, "Артикул"),
      cleanText(input.warehouseId || input.warehouse_id),
      cleanText(input.warehouseName || input.warehouse_name),
      currentQuantity,
      countedQuantity,
      deltaQuantity,
      cleanText(input.reason),
      cleanText(input.note),
      now,
      id,
      documentId
    );
  } else {
    if (!cleanText(input.itemId || input.item_id)) {
      const err = new Error("Липсва itemId за реда на складовата корекция.");
      err.statusCode = 400;
      throw err;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${quoteIdent(LINE_TABLE)}
       (id, document_id, item_id, item_code, item_name, warehouse_id, warehouse_name,
        current_quantity, counted_quantity, delta_quantity, reason, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      documentId,
      cleanText(input.itemId || input.item_id),
      cleanText(input.itemCode || input.item_code),
      cleanText(input.itemName || input.item_name, "Артикул"),
      cleanText(input.warehouseId || input.warehouse_id),
      cleanText(input.warehouseName || input.warehouse_name),
      currentQuantity,
      countedQuantity,
      deltaQuantity,
      cleanText(input.reason),
      cleanText(input.note),
      now,
      now
    );
  }

  return getStockAdjustmentDocument(documentId);
}

export async function deleteStockAdjustmentLine(documentId, lineId) {
  await ensureStockAdjustmentPersistence();
  await assertDraftDocument(documentId);
  await prisma.$executeRawUnsafe(
    `DELETE FROM ${quoteIdent(LINE_TABLE)} WHERE id = ? AND document_id = ?`,
    lineId,
    documentId
  );
  return getStockAdjustmentDocument(documentId);
}

async function listTables(db) {
  return db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
}

async function tableInfo(db, table) {
  return db.$queryRawUnsafe(`PRAGMA table_info(${quoteIdent(table)})`);
}

function columnByNames(columns, names) {
  const lower = new Map(columns.map((c) => [String(c.name).toLowerCase(), c.name]));
  for (const name of names) {
    const found = lower.get(String(name).toLowerCase());
    if (found) return found;
  }
  return null;
}

function stockMovementTableScore(table, columns) {
  const names = new Set(columns.map((c) => String(c.name).toLowerCase()));
  let score = 0;
  const tableLower = table.toLowerCase();
  if (tableLower.includes("stock")) score += 5;
  if (tableLower.includes("movement") || tableLower.includes("journal")) score += 5;
  if (names.has("quantity") || names.has("qty") || names.has("delta_quantity") || names.has("deltaquantity")) score += 5;
  if (names.has("itemid") || names.has("item_id") || names.has("productid") || names.has("product_id")) score += 4;
  if (names.has("warehouseid") || names.has("warehouse_id") || names.has("locationid") || names.has("location_id")) score += 2;
  if (names.has("direction") || names.has("type") || names.has("movementtype") || names.has("movement_type")) score += 3;
  if (tableLower.startsWith("ag_stock_adjustment")) score -= 100;
  return score;
}

async function detectStockMovementTarget(db) {
  const tables = await listTables(db);
  let best = null;
  for (const row of tables) {
    const table = row.name;
    const columns = await tableInfo(db, table);
    const score = stockMovementTableScore(table, columns);
    if (!best || score > best.score) best = { table, columns, score };
  }
  if (!best || best.score < 10) return null;
  return best;
}

function defaultRequiredValue(column, line, doc, quantityDelta, movementId) {
  const name = String(column.name).toLowerCase();
  const type = String(column.type || "").toUpperCase();
  if (name === "id" || name.endsWith("_id")) return movementId;
  if (name.includes("number") || name.includes("reference")) return doc.number;
  if (name.includes("date") || name.includes("time") || name.includes("created") || name.includes("updated")) return nowIso();
  if (name.includes("status")) return POSTED;
  if (name.includes("direction")) return quantityDelta >= 0 ? "IN" : "OUT";
  if (name.includes("type") || name.includes("kind")) return "ADJUSTMENT";
  if (name.includes("reason") || name.includes("note") || name.includes("comment") || name.includes("description")) return `Складова корекция ${doc.number}`;
  if (name.includes("item")) return line.item_id;
  if (name.includes("warehouse") || name.includes("location") || name.includes("object")) return line.warehouse_id || null;
  if (type.includes("INT") || type.includes("REAL") || type.includes("NUM") || type.includes("DEC") || type.includes("FLOAT") || type.includes("DOUBLE")) return 0;
  return "STOCK_ADJUSTMENT";
}

async function insertStockMovement(db, doc, line) {
  const target = await detectStockMovementTarget(db);
  if (!target) {
    const err = new Error("Не е намерена съществуваща таблица за складови движения. Осчетоводяването е спряно, за да не се симулира журнал.");
    err.statusCode = 500;
    throw err;
  }

  const columns = target.columns;
  const movementId = newId("SMV");
  const quantityDelta = asNumber(line.delta_quantity, 0);
  const quantityAbs = Math.abs(quantityDelta);
  const valuesByColumn = new Map();

  const idColumn = columnByNames(columns, ["id"]);
  if (idColumn) valuesByColumn.set(idColumn, movementId);

  const quantityColumn = columnByNames(columns, ["delta_quantity", "deltaQuantity", "quantityDelta", "qtyDelta", "quantity", "qty", "amount"]);
  if (quantityColumn) {
    const lower = String(quantityColumn).toLowerCase();
    valuesByColumn.set(quantityColumn, lower.includes("delta") ? quantityDelta : quantityAbs);
  }

  const signedQuantityColumn = columnByNames(columns, ["signedQuantity", "signed_quantity"]);
  if (signedQuantityColumn) valuesByColumn.set(signedQuantityColumn, quantityDelta);

  const directionColumn = columnByNames(columns, ["direction", "side", "io"]);
  if (directionColumn) valuesByColumn.set(directionColumn, quantityDelta >= 0 ? "IN" : "OUT");

  const typeColumn = columnByNames(columns, ["type", "movementType", "movement_type", "kind"]);
  if (typeColumn) valuesByColumn.set(typeColumn, "ADJUSTMENT");

  const itemColumn = columnByNames(columns, ["itemId", "item_id", "productId", "product_id", "articleId", "article_id"]);
  if (itemColumn) valuesByColumn.set(itemColumn, line.item_id);

  const warehouseColumn = columnByNames(columns, ["warehouseId", "warehouse_id", "locationId", "location_id", "objectId", "object_id"]);
  if (warehouseColumn) valuesByColumn.set(warehouseColumn, line.warehouse_id || null);

  const sourceTypeColumn = columnByNames(columns, ["sourceType", "source_type", "documentType", "document_type", "originType", "origin_type"]);
  if (sourceTypeColumn) valuesByColumn.set(sourceTypeColumn, "STOCK_ADJUSTMENT");

  const sourceIdColumn = columnByNames(columns, ["sourceId", "source_id", "documentId", "document_id", "originId", "origin_id"]);
  if (sourceIdColumn) valuesByColumn.set(sourceIdColumn, doc.id);

  const sourceLineColumn = columnByNames(columns, ["sourceLineId", "source_line_id", "documentLineId", "document_line_id"]);
  if (sourceLineColumn) valuesByColumn.set(sourceLineColumn, line.id);

  const numberColumn = columnByNames(columns, ["documentNumber", "document_number", "sourceNumber", "source_number", "reference", "referenceNo", "reference_no"]);
  if (numberColumn) valuesByColumn.set(numberColumn, doc.number);

  const reasonColumn = columnByNames(columns, ["reason", "note", "comment", "description"]);
  if (reasonColumn) valuesByColumn.set(reasonColumn, `Складова корекция ${doc.number}`);

  const createdColumn = columnByNames(columns, ["createdAt", "created_at", "postedAt", "posted_at", "movementDate", "movement_date", "date"]);
  if (createdColumn) valuesByColumn.set(createdColumn, nowIso());

  for (const column of columns) {
    const columnName = String(column.name);
    const hasDefault = column.dflt_value !== null && column.dflt_value !== undefined;
    const required = Number(column.notnull) === 1 && !hasDefault && Number(column.pk) !== 1;
    if (required && !valuesByColumn.has(columnName)) {
      valuesByColumn.set(columnName, defaultRequiredValue(column, line, doc, quantityDelta, movementId));
    }
  }

  const insertColumns = Array.from(valuesByColumn.keys());
  const insertValues = insertColumns.map((name) => valuesByColumn.get(name));
  if (insertColumns.length === 0) {
    const err = new Error(`Таблицата ${target.table} не приема безопасен insert за складово движение.`);
    err.statusCode = 500;
    throw err;
  }

  const placeholders = insertColumns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${quoteIdent(target.table)} (${insertColumns.map(quoteIdent).join(", ")}) VALUES (${placeholders})`;
  await db.$executeRawUnsafe(sql, ...insertValues);

  return {
    movementId,
    table: target.table,
    quantityDelta,
    score: target.score
  };
}

export async function postStockAdjustmentDocument(documentId, options = {}) {
  await ensureStockAdjustmentPersistence();
  const result = await prisma.$transaction(async (tx) => {
    await ensureStockAdjustmentPersistence(tx);
    const docRow = await readDocumentRow(documentId, tx);
    if (!docRow) {
      const err = new Error("Документът за складова корекция не е намерен.");
      err.statusCode = 404;
      throw err;
    }
    if (docRow.status === POSTED) {
      const existing = await getStockAdjustmentDocument(documentId);
      return { ok: true, alreadyPosted: true, document: existing, movements: [] };
    }

    const lines = await tx.$queryRawUnsafe(
      `SELECT * FROM ${quoteIdent(LINE_TABLE)} WHERE document_id = ? ORDER BY created_at ASC`,
      documentId
    );
    const nonZeroLines = lines.filter((line) => Math.abs(asNumber(line.delta_quantity, 0)) > 0.0000001);
    if (nonZeroLines.length === 0) {
      const err = new Error("Документът няма редове с реална разлика за осчетоводяване.");
      err.statusCode = 400;
      throw err;
    }

    const doc = normalizeDoc(docRow);
    const movements = [];
    for (const line of nonZeroLines) {
      const existingLog = await tx.$queryRawUnsafe(
        `SELECT * FROM ${quoteIdent(POSTING_LOG_TABLE)} WHERE document_id = ? AND line_id = ?`,
        documentId,
        line.id
      );
      if (existingLog.length > 0) continue;

      const movement = await insertStockMovement(tx, doc, line);
      await tx.$executeRawUnsafe(
        `INSERT INTO ${quoteIdent(POSTING_LOG_TABLE)}
         (id, document_id, line_id, movement_table, movement_id, quantity_delta, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        newId("APL"),
        documentId,
        line.id,
        movement.table,
        movement.movementId,
        movement.quantityDelta,
        nowIso()
      );
      await tx.$executeRawUnsafe(
        `UPDATE ${quoteIdent(LINE_TABLE)} SET posted_movement_id = ?, updated_at = ? WHERE id = ?`,
        movement.movementId,
        nowIso(),
        line.id
      );
      movements.push(movement);
    }

    const postedAt = nowIso();
    await tx.$executeRawUnsafe(
      `UPDATE ${quoteIdent(DOCUMENT_TABLE)}
       SET status = ?, posted_at = ?, posted_by = ?, locked_at = ?, lock_reason = ?, updated_at = ?
       WHERE id = ?`,
      POSTED,
      postedAt,
      cleanText(options.postedBy || options.user || "system"),
      postedAt,
      "POSTED документ — заключен по Moneta логика",
      postedAt,
      documentId
    );

    return { ok: true, alreadyPosted: false, movements };
  });

  return {
    ...result,
    document: await getStockAdjustmentDocument(documentId)
  };
}

export async function createDraftFromIssue(issue = {}) {
  const doc = await createStockAdjustmentDraft({
    reason: cleanText(issue.reason, "Корекция от складов одит"),
    note: cleanText(issue.note || issue.message),
    issueKey: cleanText(issue.key || issue.issueKey || issue.id),
    sourceIssue: issue
  });

  const itemId = cleanText(issue.itemId || issue.item_id || issue.item || issue.productId);
  if (itemId) {
    await upsertStockAdjustmentLine(doc.id, {
      itemId,
      itemCode: issue.itemCode || issue.item_code || "",
      itemName: issue.itemName || issue.item_name || "Артикул от одит",
      warehouseId: issue.warehouseId || issue.warehouse_id || issue.locationId || "",
      warehouseName: issue.warehouseName || issue.warehouse_name || "",
      currentQuantity: issue.currentQuantity ?? issue.current_quantity ?? issue.expectedQuantity ?? 0,
      countedQuantity: issue.countedQuantity ?? issue.counted_quantity ?? issue.actualQuantity ?? 0,
      deltaQuantity: issue.deltaQuantity ?? issue.delta_quantity,
      reason: "Ред от складов одит"
    });
  }

  return getStockAdjustmentDocument(doc.id);
}

export async function getStockAdjustmentPersistenceHealth() {
  const persistence = await ensureStockAdjustmentPersistence();
  const movementTarget = await detectStockMovementTarget(prisma);
  return {
    ok: true,
    persistence,
    movementTarget: movementTarget
      ? {
          table: movementTarget.table,
          score: movementTarget.score,
          columns: movementTarget.columns.map((column) => column.name)
        }
      : null,
    canPost: Boolean(movementTarget),
    rule: "Осчетоводяването спира, ако не бъде открита реална таблица за складови движения."
  };
}
