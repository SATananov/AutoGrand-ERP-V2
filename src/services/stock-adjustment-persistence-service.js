import { PrismaClient } from "@prisma/client";
import {
  detectRealStockMovementBinding,
  getStockAdjustmentMovementBindingStatus,
  insertBoundStockAdjustmentMovement,
  listStockMovementBindingCandidates,
  STOCK_ADJUSTMENT_SOURCE_TYPE
} from "./stock-adjustment-movement-binding-service.js";

const prisma = globalThis.__autoGrandStockAdjustmentPrisma || new PrismaClient();
if (!globalThis.__autoGrandStockAdjustmentPrisma) {
  globalThis.__autoGrandStockAdjustmentPrisma = prisma;
}

const DOCUMENT_TABLE = "ag_stock_adjustment_documents";
const LINE_TABLE = "ag_stock_adjustment_lines";
const POSTING_LOG_TABLE = "ag_stock_adjustment_posting_log";
const AUDIT_TABLE = "ag_stock_adjustment_audit";
const POSTED = "POSTED";
const DRAFT = "DRAFT";
const STEP = "4.8.4";
// Step 4.8.3 compatibility marker: const STEP = "4.8.3"

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
    totalDelta: Number(row.total_delta || row.totalDelta || 0),
    postedMovementCount: Number(row.posted_movement_count || row.postedMovementCount || 0),
    movementBindingTable: row.movement_binding_table || row.movementBindingTable || null,
    auditEventCount: Number(row.audit_event_count || row.auditEventCount || 0),
    lastAuditAt: row.last_audit_at || row.lastAuditAt || null,
    reversalOfDocumentId: row.reversal_of_document_id || row.reversalOfDocumentId || "",
    reversalReason: row.reversal_reason || row.reversalReason || ""
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
    postedMovementId: row.posted_movement_id || row.movement_id || null,
    postedMovementTable: row.movement_table || null,
    postedQuantityDelta: row.posted_quantity_delta === undefined || row.posted_quantity_delta === null ? null : Number(row.posted_quantity_delta),
    movementDirection: row.movement_direction || null,
    bindingProfile: row.binding_profile || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function normalizeTraceRow(row) {
  return {
    logId: row.log_id || row.id,
    documentId: row.document_id,
    lineId: row.line_id,
    movementTable: row.movement_table,
    movementId: row.movement_id,
    quantityDelta: Number(row.quantity_delta || 0),
    movementDirection: row.movement_direction || (Number(row.quantity_delta || 0) >= 0 ? "IN" : "OUT"),
    bindingProfile: row.binding_profile || "movement-table-bound",
    bindingScore: row.binding_score === undefined || row.binding_score === null ? null : Number(row.binding_score),
    sourceType: row.source_type || STOCK_ADJUSTMENT_SOURCE_TYPE,
    postedBy: row.posted_by || "",
    createdAt: row.created_at || null,
    itemId: row.item_id || "",
    itemCode: row.item_code || "",
    itemName: row.item_name || "",
    warehouseId: row.warehouse_id || "",
    warehouseName: row.warehouse_name || "",
    currentQuantity: Number(row.current_quantity || 0),
    countedQuantity: Number(row.counted_quantity || 0),
    lineDeltaQuantity: Number(row.delta_quantity || 0),
    reason: row.reason || "",
    note: row.note || ""
  };
}

function normalizeAuditRow(row) {
  let payload = null;
  if (row.payload_json) {
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = { raw: row.payload_json };
    }
  }
  return {
    id: row.id,
    documentId: row.document_id || "",
    eventType: row.event_type || "UNKNOWN",
    eventScope: row.event_scope || "document",
    reasonCode: row.reason_code || "OTHER",
    reasonText: row.reason_text || "",
    actor: row.actor || "system",
    payload,
    createdAt: row.created_at || null
  };
}

function buildTraceSummary(traceRows = []) {
  const tables = Array.from(new Set(traceRows.map((row) => row.movementTable).filter(Boolean)));
  const postedBy = Array.from(new Set(traceRows.map((row) => row.postedBy).filter(Boolean)));
  const sourceTypes = Array.from(new Set(traceRows.map((row) => row.sourceType).filter(Boolean)));
  const positiveCount = traceRows.filter((row) => Number(row.quantityDelta || 0) > 0).length;
  const negativeCount = traceRows.filter((row) => Number(row.quantityDelta || 0) < 0).length;
  const zeroCount = traceRows.filter((row) => Math.abs(Number(row.quantityDelta || 0)) <= 0.0000001).length;
  const totalQuantityDelta = traceRows.reduce((sum, row) => sum + Number(row.quantityDelta || 0), 0);
  const lastPostedAt = traceRows.reduce((latest, row) => {
    if (!row.createdAt) return latest;
    if (!latest || String(row.createdAt) > String(latest)) return row.createdAt;
    return latest;
  }, null);

  return {
    movementCount: traceRows.length,
    positiveCount,
    negativeCount,
    zeroCount,
    totalQuantityDelta,
    tables,
    postedBy,
    sourceTypes,
    lastPostedAt,
    hasTrace: traceRows.length > 0,
    lockProof: traceRows.length > 0 ? "POSTED document has movement trace rows and is locked." : "No movement trace rows yet."
  };
}

function buildAuditSummary(auditRows = []) {
  const byType = auditRows.reduce((acc, row) => {
    acc[row.eventType] = (acc[row.eventType] || 0) + 1;
    return acc;
  }, {});
  const reasonCodes = Array.from(new Set(auditRows.map((row) => row.reasonCode).filter(Boolean)));
  const actors = Array.from(new Set(auditRows.map((row) => row.actor).filter(Boolean)));
  const lastEventAt = auditRows.reduce((latest, row) => {
    if (!row.createdAt) return latest;
    if (!latest || String(row.createdAt) > String(latest)) return row.createdAt;
    return latest;
  }, null);
  return {
    eventCount: auditRows.length,
    byType,
    reasonCodes,
    actors,
    lastEventAt,
    hasAudit: auditRows.length > 0,
    safetyRule: "Audit trail is append-only. Posted documents are reversed by a new draft document, not edited."
  };
}

async function tableInfo(db, table) {
  return db.$queryRawUnsafe(`PRAGMA table_info(${quoteIdent(table)})`);
}

async function ensureColumn(db, table, name, definition) {
  const columns = await tableInfo(db, table);
  const exists = columns.some((column) => String(column.name).toLowerCase() === String(name).toLowerCase());
  if (!exists) {
    await db.$executeRawUnsafe(`ALTER TABLE ${quoteIdent(table)} ADD COLUMN ${quoteIdent(name)} ${definition}`);
  }
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

  await ensureColumn(db, POSTING_LOG_TABLE, "movement_direction", "TEXT");
  await ensureColumn(db, POSTING_LOG_TABLE, "binding_profile", "TEXT");
  await ensureColumn(db, POSTING_LOG_TABLE, "binding_score", "REAL");
  await ensureColumn(db, POSTING_LOG_TABLE, "source_type", "TEXT");
  await ensureColumn(db, POSTING_LOG_TABLE, "posted_by", "TEXT");

  await ensureColumn(db, DOCUMENT_TABLE, "reversal_of_document_id", "TEXT");
  await ensureColumn(db, DOCUMENT_TABLE, "reversal_reason", "TEXT");

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${quoteIdent(AUDIT_TABLE)} (
      id TEXT PRIMARY KEY,
      document_id TEXT,
      event_type TEXT NOT NULL,
      event_scope TEXT NOT NULL DEFAULT 'document',
      reason_code TEXT NOT NULL DEFAULT 'OTHER',
      reason_text TEXT,
      actor TEXT,
      payload_json TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_ag_stock_adjustment_audit_document
    ON ${quoteIdent(AUDIT_TABLE)}(document_id, created_at)
  `);

  return {
    ok: true,
    step: STEP,
    documentTable: DOCUMENT_TABLE,
    lineTable: LINE_TABLE,
    postingLogTable: POSTING_LOG_TABLE,
    auditTable: AUDIT_TABLE,
    movementBinding: "real-stock-movement-table-only",
    reversalMode: "new-draft-document-with-opposite-lines"
  };
}

async function readDocumentRow(id, db = prisma) {
  await ensureStockAdjustmentPersistence(db);
  const rows = await db.$queryRawUnsafe(
    `SELECT d.*,
            (SELECT COUNT(*) FROM ${quoteIdent(LINE_TABLE)} l WHERE l.document_id = d.id) AS line_count,
            (SELECT COALESCE(SUM(l.delta_quantity), 0) FROM ${quoteIdent(LINE_TABLE)} l WHERE l.document_id = d.id) AS total_delta,
            (SELECT COUNT(*) FROM ${quoteIdent(POSTING_LOG_TABLE)} pl WHERE pl.document_id = d.id) AS posted_movement_count,
            (SELECT MAX(pl.movement_table) FROM ${quoteIdent(POSTING_LOG_TABLE)} pl WHERE pl.document_id = d.id) AS movement_binding_table,
            (SELECT COUNT(*) FROM ${quoteIdent(AUDIT_TABLE)} ae WHERE ae.document_id = d.id) AS audit_event_count,
            (SELECT MAX(ae.created_at) FROM ${quoteIdent(AUDIT_TABLE)} ae WHERE ae.document_id = d.id) AS last_audit_at
     FROM ${quoteIdent(DOCUMENT_TABLE)} d
     WHERE d.id = ?`,
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

async function appendStockAdjustmentAuditEvent(db, event = {}) {
  const payload = event.payload === undefined ? null : JSON.stringify(event.payload);
  await db.$executeRawUnsafe(
    `INSERT INTO ${quoteIdent(AUDIT_TABLE)}
     (id, document_id, event_type, event_scope, reason_code, reason_text, actor, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId("SAA"),
    cleanText(event.documentId || event.document_id),
    cleanText(event.eventType || event.event_type, "UNKNOWN"),
    cleanText(event.eventScope || event.event_scope, "document"),
    cleanText(event.reasonCode || event.reason_code, "OTHER"),
    cleanText(event.reasonText || event.reason_text),
    cleanText(event.actor || event.user || "system"),
    payload,
    nowIso()
  );
}

async function getAuditRows(documentId, options = {}, db = prisma) {
  await ensureStockAdjustmentPersistence(db);
  const limit = Math.min(Math.max(Number(options.limit || 80), 1), 300);
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM ${quoteIdent(AUDIT_TABLE)}
     WHERE document_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    documentId,
    limit
  );
  return rows.map(normalizeAuditRow);
}

export async function listStockAdjustmentDocuments(options = {}) {
  await ensureStockAdjustmentPersistence();
  const status = cleanText(options.status).toUpperCase();
  const limit = Math.min(Math.max(Number(options.limit || 50), 1), 200);
  const where = status ? "WHERE d.status = ?" : "";
  const params = status ? [status, limit] : [limit];
  const rows = await prisma.$queryRawUnsafe(
    `SELECT d.*,
            (SELECT COUNT(*) FROM ${quoteIdent(LINE_TABLE)} l WHERE l.document_id = d.id) AS line_count,
            (SELECT COALESCE(SUM(l.delta_quantity), 0) FROM ${quoteIdent(LINE_TABLE)} l WHERE l.document_id = d.id) AS total_delta,
            (SELECT COUNT(*) FROM ${quoteIdent(POSTING_LOG_TABLE)} pl WHERE pl.document_id = d.id) AS posted_movement_count,
            (SELECT MAX(pl.movement_table) FROM ${quoteIdent(POSTING_LOG_TABLE)} pl WHERE pl.document_id = d.id) AS movement_binding_table,
            (SELECT COUNT(*) FROM ${quoteIdent(AUDIT_TABLE)} ae WHERE ae.document_id = d.id) AS audit_event_count,
            (SELECT MAX(ae.created_at) FROM ${quoteIdent(AUDIT_TABLE)} ae WHERE ae.document_id = d.id) AS last_audit_at
     FROM ${quoteIdent(DOCUMENT_TABLE)} d
     ${where}
     ORDER BY d.created_at DESC
     LIMIT ?`,
    ...params
  );
  return rows.map(normalizeDoc);
}

async function getPostingLogRows(documentId, db = prisma) {
  await ensureStockAdjustmentPersistence(db);
  return db.$queryRawUnsafe(
    `SELECT * FROM ${quoteIdent(POSTING_LOG_TABLE)} WHERE document_id = ? ORDER BY created_at ASC`,
    documentId
  );
}

async function getMovementTraceRows(documentId, db = prisma) {
  await ensureStockAdjustmentPersistence(db);
  const rows = await db.$queryRawUnsafe(
    `SELECT pl.id AS log_id, pl.document_id, pl.line_id, pl.movement_table, pl.movement_id,
            pl.quantity_delta, pl.created_at, pl.movement_direction, pl.binding_profile,
            pl.binding_score, pl.source_type, pl.posted_by,
            l.item_id, l.item_code, l.item_name, l.warehouse_id, l.warehouse_name,
            l.current_quantity, l.counted_quantity, l.delta_quantity, l.reason, l.note
     FROM ${quoteIdent(POSTING_LOG_TABLE)} pl
     LEFT JOIN ${quoteIdent(LINE_TABLE)} l ON l.document_id = pl.document_id AND l.id = pl.line_id
     WHERE pl.document_id = ?
     ORDER BY pl.created_at ASC, pl.id ASC`,
    documentId
  );
  return rows.map(normalizeTraceRow);
}

export async function getStockAdjustmentDocument(id) {
  await ensureStockAdjustmentPersistence();
  const docRow = await readDocumentRow(id);
  if (!docRow) return null;
  const lineRows = await prisma.$queryRawUnsafe(
    `SELECT l.*, pl.movement_table, pl.quantity_delta AS posted_quantity_delta,
            pl.movement_direction, pl.binding_profile, pl.movement_id
     FROM ${quoteIdent(LINE_TABLE)} l
     LEFT JOIN ${quoteIdent(POSTING_LOG_TABLE)} pl ON pl.document_id = l.document_id AND pl.line_id = l.id
     WHERE l.document_id = ?
     ORDER BY l.created_at ASC`,
    id
  );
  const postingLog = await getPostingLogRows(id);
  const movementTrace = await getMovementTraceRows(id);
  const auditTrail = await getAuditRows(id, { limit: 80 });
  return {
    ...normalizeDoc(docRow),
    lines: lineRows.map(normalizeLine),
    postingLog,
    movementTrace,
    traceSummary: buildTraceSummary(movementTrace),
    auditTrail,
    auditSummary: buildAuditSummary(auditTrail)
  };
}

export async function getStockAdjustmentMovementTrace(documentId) {
  await ensureStockAdjustmentPersistence();
  const docRow = await readDocumentRow(documentId);
  if (!docRow) {
    const err = new Error("Документът за складова корекция не е намерен.");
    err.statusCode = 404;
    throw err;
  }
  const movementTrace = await getMovementTraceRows(documentId);
  const auditTrail = await getAuditRows(documentId, { limit: 40 });
  return {
    document: normalizeDoc(docRow),
    traceSummary: buildTraceSummary(movementTrace),
    auditSummary: buildAuditSummary(auditTrail),
    movementTrace
  };
}

export async function getStockAdjustmentAuditTrail(documentId, options = {}) {
  await ensureStockAdjustmentPersistence();
  const docRow = await readDocumentRow(documentId);
  if (!docRow) {
    const err = new Error("Документът за складова корекция не е намерен.");
    err.statusCode = 404;
    throw err;
  }
  const auditTrail = await getAuditRows(documentId, options);
  return {
    document: normalizeDoc(docRow),
    auditSummary: buildAuditSummary(auditTrail),
    auditTrail
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
     (id, number, status, reason, note, issue_key, source_issue_json, created_at, updated_at, reversal_of_document_id, reversal_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    number,
    DRAFT,
    cleanText(input.reason, "Складова корекция"),
    cleanText(input.note),
    cleanText(input.issueKey || input.issue_key),
    sourceIssue,
    now,
    now,
    cleanText(input.reversalOfDocumentId || input.reversal_of_document_id),
    cleanText(input.reversalReason || input.reversal_reason)
  );

  await appendStockAdjustmentAuditEvent(prisma, {
    documentId: id,
    eventType: input.reversalOfDocumentId || input.reversal_of_document_id ? "REVERSAL_DRAFT_CREATED" : "DRAFT_CREATED",
    reasonCode: cleanText(input.reasonCode || input.reason_code, input.reversalOfDocumentId || input.reversal_of_document_id ? "REVERSAL_SAFETY" : "OTHER"),
    reasonText: cleanText(input.reason, "Складова корекция"),
    actor: cleanText(input.actor || input.createdBy || "system"),
    payload: { number, issueKey: cleanText(input.issueKey || input.issue_key), reversalOfDocumentId: cleanText(input.reversalOfDocumentId || input.reversal_of_document_id) }
  });

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

  await appendStockAdjustmentAuditEvent(prisma, {
    documentId,
    eventType: existing.length > 0 ? "LINE_UPDATED" : "LINE_CREATED",
    eventScope: "line",
    reasonCode: cleanText(input.reasonCode || input.reason_code, "OTHER"),
    reasonText: cleanText(input.reason || input.note),
    actor: cleanText(input.actor || input.updatedBy || "system"),
    payload: { lineId: id, itemId: cleanText(input.itemId || input.item_id), deltaQuantity }
  });

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
  await appendStockAdjustmentAuditEvent(prisma, {
    documentId,
    eventType: "LINE_DELETED",
    eventScope: "line",
    reasonCode: "OTHER",
    actor: "system",
    payload: { lineId }
  });
  return getStockAdjustmentDocument(documentId);
}

// Compatibility wrappers kept for the Step 4.8.1 smoke markers.
async function detectStockMovementTarget(db) {
  return detectRealStockMovementBinding(db);
}

async function insertStockMovement(db, doc, line, options = {}) {
  return insertBoundStockAdjustmentMovement(db, {
    document: doc,
    line,
    postedBy: options.postedBy,
    user: options.user,
    reason: options.reason,
    binding: options.binding
  });
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
      const existingLog = await getPostingLogRows(documentId, tx);
      await appendStockAdjustmentAuditEvent(tx, {
        documentId,
        eventType: "POST_REPLAY_BLOCKED",
        reasonCode: "REVERSAL_SAFETY",
        reasonText: "Repeated POST was blocked by idempotency guard.",
        actor: cleanText(options.postedBy || options.user || "system"),
        payload: { existingMovementCount: existingLog.length }
      });
      return {
        ok: true,
        alreadyPosted: true,
        movementBinding: existingLog.length ? existingLog[0].movement_table : null,
        movements: existingLog.map((row) => ({
          reused: true,
          movementId: row.movement_id,
          movementTable: row.movement_table,
          table: row.movement_table,
          quantityDelta: Number(row.quantity_delta || 0),
          direction: row.movement_direction,
          bindingProfile: row.binding_profile,
          sourceType: row.source_type || STOCK_ADJUSTMENT_SOURCE_TYPE
        }))
      };
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

    const binding = await detectStockMovementTarget(tx);
    if (!binding) {
      const err = new Error("Не е намерена реална таблица за складови движения. Осчетоводяването е спряно, за да се защити журналът.");
      err.statusCode = 500;
      throw err;
    }

    const doc = normalizeDoc(docRow);
    const postedBy = cleanText(options.postedBy || options.user || "system");
    const movements = [];
    for (const line of nonZeroLines) {
      const existingLog = await tx.$queryRawUnsafe(
        `SELECT * FROM ${quoteIdent(POSTING_LOG_TABLE)} WHERE document_id = ? AND line_id = ?`,
        documentId,
        line.id
      );
      if (existingLog.length > 0) {
        const row = existingLog[0];
        movements.push({
          reused: true,
          movementId: row.movement_id,
          movementTable: row.movement_table,
          table: row.movement_table,
          quantityDelta: Number(row.quantity_delta || 0),
          direction: row.movement_direction,
          bindingProfile: row.binding_profile,
          sourceType: row.source_type || STOCK_ADJUSTMENT_SOURCE_TYPE
        });
        continue;
      }

      const movement = await insertStockMovement(tx, doc, line, { postedBy, binding });
      if (movement.skipped) continue;

      await tx.$executeRawUnsafe(
        `INSERT INTO ${quoteIdent(POSTING_LOG_TABLE)}
         (id, document_id, line_id, movement_table, movement_id, quantity_delta, created_at,
          movement_direction, binding_profile, binding_score, source_type, posted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId("APL"),
        documentId,
        line.id,
        movement.movementTable || movement.table,
        movement.movementId,
        movement.quantityDelta,
        nowIso(),
        movement.direction,
        movement.bindingProfile,
        movement.bindingScore,
        movement.sourceType || STOCK_ADJUSTMENT_SOURCE_TYPE,
        postedBy
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
      postedBy,
      postedAt,
      "POSTED документ - заключен; реалният ефект е записан като ново складово движение",
      postedAt,
      documentId
    );

    await appendStockAdjustmentAuditEvent(tx, {
      documentId,
      eventType: "DOCUMENT_POSTED_LOCKED",
      reasonCode: cleanText(options.reasonCode || options.reason_code, "OTHER"),
      reasonText: "Document posted and locked with bound stock movements.",
      actor: postedBy,
      payload: { movementCount: movements.length, movementBinding: binding.table, bindingProfile: binding.profile }
    });

    return {
      ok: true,
      step: STEP,
      alreadyPosted: false,
      movementBinding: binding.table,
      bindingProfile: binding.profile,
      movements
    };
  });

  return {
    ...result,
    document: await getStockAdjustmentDocument(documentId)
  };
}


export async function previewStockAdjustmentReversal(documentId) {
  await ensureStockAdjustmentPersistence();
  const doc = await getStockAdjustmentDocument(documentId);
  if (!doc) {
    const err = new Error("Документът за складова корекция не е намерен.");
    err.statusCode = 404;
    throw err;
  }
  if (doc.status !== POSTED) {
    const err = new Error("Обратна корекция може да се подготви само за POSTED документ.");
    err.statusCode = 409;
    throw err;
  }
  const reversalLines = (doc.lines || [])
    .filter((line) => Math.abs(asNumber(line.deltaQuantity, 0)) > 0.0000001)
    .map((line) => ({
      sourceLineId: line.id,
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      warehouseId: line.warehouseId,
      warehouseName: line.warehouseName,
      currentQuantity: line.countedQuantity,
      countedQuantity: line.currentQuantity,
      deltaQuantity: -asNumber(line.deltaQuantity, 0),
      reason: `Обратна корекция на ${doc.number}`
    }));
  const totalDelta = reversalLines.reduce((sum, line) => sum + Number(line.deltaQuantity || 0), 0);
  return {
    ok: true,
    step: STEP,
    sourceDocument: doc,
    reversal: {
      reason: `Обратна корекция на ${doc.number}`,
      note: "Създава се нов DRAFT документ. Старият POSTED документ и movement trace не се редактират.",
      lineCount: reversalLines.length,
      totalDelta,
      lines: reversalLines
    },
    safety: {
      oldMovementsDeleted: false,
      oldJournalEdited: false,
      createsNewDraftDocument: true,
      autoPost: false
    }
  };
}

export async function createReversalDraftFromDocument(documentId, input = {}) {
  const preview = await previewStockAdjustmentReversal(documentId);
  const sourceDoc = preview.sourceDocument;
  const reason = cleanText(input.reason, preview.reversal.reason);
  const actor = cleanText(input.actor || input.createdBy || input.user || "system");
  const reversalDoc = await createStockAdjustmentDraft({
    reason,
    note: cleanText(input.note, preview.reversal.note),
    issueKey: `REVERSAL:${sourceDoc.id}`,
    reasonCode: "REVERSAL_SAFETY",
    actor,
    reversalOfDocumentId: sourceDoc.id,
    reversalReason: reason,
    sourceIssue: {
      type: "stock-adjustment-reversal",
      sourceDocumentId: sourceDoc.id,
      sourceNumber: sourceDoc.number,
      sourcePostedAt: sourceDoc.postedAt,
      sourceMovementCount: sourceDoc.postedMovementCount
    }
  });

  for (const line of preview.reversal.lines) {
    await upsertStockAdjustmentLine(reversalDoc.id, {
      ...line,
      reasonCode: "REVERSAL_SAFETY",
      actor,
      note: `Source line: ${line.sourceLineId}`
    });
  }

  await appendStockAdjustmentAuditEvent(prisma, {
    documentId: sourceDoc.id,
    eventType: "REVERSAL_DRAFT_LINKED",
    reasonCode: "REVERSAL_SAFETY",
    reasonText: reason,
    actor,
    payload: { reversalDocumentId: reversalDoc.id, reversalNumber: reversalDoc.number }
  });

  await appendStockAdjustmentAuditEvent(prisma, {
    documentId: reversalDoc.id,
    eventType: "REVERSAL_SOURCE_LINKED",
    reasonCode: "REVERSAL_SAFETY",
    reasonText: reason,
    actor,
    payload: { sourceDocumentId: sourceDoc.id, sourceNumber: sourceDoc.number }
  });

  return getStockAdjustmentDocument(reversalDoc.id);
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
  const bindingStatus = await getStockAdjustmentMovementBindingStatus(prisma);
  const movementTarget = bindingStatus.active;
  return {
    ok: true,
    step: STEP,
    persistence,
    movementTarget,
    movementBinding: bindingStatus,
    canPost: Boolean(movementTarget),
    rule: "Осчетоводяването използва реална таблица за складови движения, връща movement trace и записва audit trail. Обратната корекция е нов DRAFT документ."
  };
}

export async function getStockAdjustmentMovementBindingHealth() {
  await ensureStockAdjustmentPersistence();
  return getStockAdjustmentMovementBindingStatus(prisma);
}

export async function listStockAdjustmentMovementBindingCandidates(options = {}) {
  await ensureStockAdjustmentPersistence();
  return listStockMovementBindingCandidates(prisma, options);
}
