import { getStockAdjustmentFoundation } from "../data/stock-adjustment-foundation.js";
import {
  createDraftFromIssue,
  createReversalDraftFromDocument,
  createStockAdjustmentDraft,
  deleteStockAdjustmentLine,
  ensureStockAdjustmentPersistence,
  getStockAdjustmentAuditTrail,
  getStockAdjustmentDocument,
  getStockAdjustmentMovementBindingHealth,
  getStockAdjustmentMovementTrace,
  getStockAdjustmentPersistenceHealth,
  listStockAdjustmentDocuments,
  listStockAdjustmentMovementBindingCandidates,
  postStockAdjustmentDocument,
  previewStockAdjustmentReversal,
  upsertStockAdjustmentLine
} from "./stock-adjustment-persistence-service.js";

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export async function pingStockAdjustments() {
  const health = await getStockAdjustmentPersistenceHealth();
  return {
    ok: true,
    step: "4.8.4",
    version: "0.4.16",
    message: "Stock adjustment audit and reversal safety are visible in the UI.",
    health
  };
}

export async function getStockAdjustmentFoundationStatus() {
  const persistence = await ensureStockAdjustmentPersistence();
  const health = await getStockAdjustmentPersistenceHealth();
  const movementBinding = await getStockAdjustmentMovementBindingHealth();
  return {
    ...getStockAdjustmentFoundation(),
    persistence,
    health,
    movementBinding,
    traceVisibility: {
      ok: true,
      step: "4.8.4",
      api: "/api/stock/adjustments/documents/:id/movement-trace",
      auditApi: "/api/stock/adjustments/documents/:id/audit",
      reversalApi: "/api/stock/adjustments/documents/:id/reversal-draft",
      ui: "POSTED documents show movement trace, audit trail and reversal safety actions."
    }
  };
}

export async function getStockAdjustmentMovementBindingStatus(options = {}) {
  const health = await getStockAdjustmentMovementBindingHealth();
  const candidates = await listStockAdjustmentMovementBindingCandidates({ limit: options.limit || 8 });
  return {
    ...health,
    candidates
  };
}

export function previewStockAdjustment(payload = {}) {
  const currentQuantity = asNumber(payload.currentQuantity ?? payload.current_quantity, 0);
  const countedQuantity = asNumber(payload.countedQuantity ?? payload.counted_quantity, currentQuantity);
  const explicitDelta = payload.deltaQuantity ?? payload.delta_quantity;
  const deltaQuantity = explicitDelta === undefined || explicitDelta === null || explicitDelta === ""
    ? countedQuantity - currentQuantity
    : asNumber(explicitDelta, 0);

  return {
    ok: true,
    step: "4.8.4",
    mode: "preview-only",
    itemId: cleanText(payload.itemId || payload.item_id),
    itemCode: cleanText(payload.itemCode || payload.item_code),
    itemName: cleanText(payload.itemName || payload.item_name, "Артикул"),
    warehouseId: cleanText(payload.warehouseId || payload.warehouse_id || payload.locationId),
    currentQuantity,
    countedQuantity,
    deltaQuantity,
    direction: deltaQuantity >= 0 ? "IN" : "OUT",
    createsMovement: Math.abs(deltaQuantity) > 0.0000001,
    postingIntegration: "POSTED document writes one bound stock movement per non-zero line.",
    monetaRule: "Preview не пипа склада. Реален ефект има само след DRAFT към POSTED."
  };
}

export function buildStockAdjustmentFromIssuePreview(issue = {}) {
  const preview = previewStockAdjustment({
    itemId: issue.itemId || issue.item_id || issue.productId,
    itemCode: issue.itemCode || issue.item_code,
    itemName: issue.itemName || issue.item_name,
    warehouseId: issue.warehouseId || issue.warehouse_id || issue.locationId,
    currentQuantity: issue.currentQuantity ?? issue.current_quantity ?? issue.expectedQuantity ?? 0,
    countedQuantity: issue.countedQuantity ?? issue.counted_quantity ?? issue.actualQuantity ?? 0,
    deltaQuantity: issue.deltaQuantity ?? issue.delta_quantity
  });

  return {
    ok: true,
    step: "4.8.4",
    mode: "issue-preview",
    issueKey: cleanText(issue.key || issue.issueKey || issue.id),
    issue,
    preview,
    nextAction: "POST /api/stock/adjustments/from-issue/persist"
  };
}

export async function getStockAdjustmentAuditStatus(documentId, options = {}) {
  return getStockAdjustmentAuditTrail(documentId, options);
}

export async function previewStockAdjustmentReversalDraft(documentId) {
  return previewStockAdjustmentReversal(documentId);
}

export async function createStockAdjustmentReversalDraft(documentId, payload = {}) {
  return createReversalDraftFromDocument(documentId, payload);
}

export {
  createDraftFromIssue,
  createReversalDraftFromDocument,
  createStockAdjustmentDraft,
  deleteStockAdjustmentLine,
  ensureStockAdjustmentPersistence,
  getStockAdjustmentAuditTrail,
  getStockAdjustmentDocument,
  getStockAdjustmentPersistenceHealth,
  getStockAdjustmentMovementTrace,
  previewStockAdjustmentReversal,
  listStockAdjustmentDocuments,
  postStockAdjustmentDocument,
  upsertStockAdjustmentLine
};
