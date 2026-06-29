// AutoGrand ERP V2 — Step 4.8.4 Stock Adjustment Audit / Reversal Safety Layer
// Foundation metadata for the stock correction / adjustment audit and safe reversal workflow.
// Step 4.8.2 compatibility marker: 4.8.2 / 0.4.14
// Step 4.8.3 compatibility marker: 4.8.3 / 0.4.15

export const STOCK_ADJUSTMENT_STEP = "4.8.4";
export const STOCK_ADJUSTMENT_VERSION = "0.4.16";

export const STOCK_ADJUSTMENT_DOCUMENT_STATES = Object.freeze({
  DRAFT: "DRAFT",
  POSTED: "POSTED"
});

export const STOCK_ADJUSTMENT_REASON_CODES = Object.freeze({
  STOCK_COUNT: "STOCK_COUNT",
  NEGATIVE_STOCK_REPAIR: "NEGATIVE_STOCK_REPAIR",
  DOUBLE_MOVEMENT_REPAIR: "DOUBLE_MOVEMENT_REPAIR",
  DATA_IMPORT_REPAIR: "DATA_IMPORT_REPAIR",
  REVERSAL_SAFETY: "REVERSAL_SAFETY",
  OTHER: "OTHER"
});

export const STOCK_ADJUSTMENT_MONETA_RULES = Object.freeze([
  "Старите складови движения не се трият.",
  "Складовият журнал не се редактира ръчно.",
  "Корекцията се прави чрез отделен документ.",
  "Документът минава през DRAFT към POSTED.",
  "POSTED документ е заключен и не допуска промяна на редове.",
  "Складовият ефект се записва като ново коригиращо движение в реалния movement слой.",
  "Повторен POST не създава второ движение за същия ред.",
  "POSTED документът показва видим movement trace към създадените движения.",
  "Всяко действие се записва в audit trail.",
  "Грешен POSTED документ се неутрализира чрез нов обратен DRAFT документ, не чрез редакция или триене."
]);

export const STOCK_ADJUSTMENT_CAPABILITIES = Object.freeze({
  persistentDocuments: true,
  postingLock: true,
  rawJournalEdit: false,
  deleteOldMovements: false,
  createsCorrectionMovement: true,
  realMovementBinding: true,
  idempotentPosting: true,
  movementTraceVisibility: true,
  auditTrail: true,
  reasonCodes: true,
  reversalDraftSafety: true,
  reversalAutoPost: false,
  usesShadowTables: false,
  prismaSchemaChangeRequired: false
});

export function getStockAdjustmentFoundation() {
  return {
    ok: true,
    step: STOCK_ADJUSTMENT_STEP,
    version: STOCK_ADJUSTMENT_VERSION,
    title: "Stock Adjustment Audit / Reversal Safety Layer",
    bgTitle: "Audit и безопасна обратна корекция на складови документи",
    route: "/stock-adjustments",
    api: {
      ping: "/api/stock/adjustments/ping",
      foundation: "/api/stock/adjustments/foundation",
      preview: "/api/stock/adjustments/preview",
      fromIssue: "/api/stock/adjustments/from-issue",
      documents: "/api/stock/adjustments/documents",
      movementBinding: "/api/stock/adjustments/movement-binding",
      movementTrace: "/api/stock/adjustments/documents/:id/movement-trace",
      audit: "/api/stock/adjustments/documents/:id/audit",
      reversalPreview: "/api/stock/adjustments/documents/:id/reversal-preview",
      reversalDraft: "/api/stock/adjustments/documents/:id/reversal-draft",
      post: "/api/stock/adjustments/documents/:id/post"
    },
    states: STOCK_ADJUSTMENT_DOCUMENT_STATES,
    reasonCodes: STOCK_ADJUSTMENT_REASON_CODES,
    capabilities: STOCK_ADJUSTMENT_CAPABILITIES,
    monetaRules: STOCK_ADJUSTMENT_MONETA_RULES,
    persistence: {
      documentTable: "ag_stock_adjustment_documents",
      lineTable: "ag_stock_adjustment_lines",
      postingLogTable: "ag_stock_adjustment_posting_log",
      auditTable: "ag_stock_adjustment_audit",
      mode: "runtime-safe-sqlite-ddl-via-prisma-raw-sql",
      movementBinding: "existing-stock-movement-table-only",
      reversalMode: "new-draft-document-with-opposite-lines"
    }
  };
}

export default getStockAdjustmentFoundation;

// Step 4.8.5 - Stock Adjustment Final Polish / Operator Workflow Hardening
export {
  STOCK_ADJUSTMENT_OPERATOR_ACTIONS,
  STOCK_ADJUSTMENT_OPERATOR_REASON_GUIDE,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_MARKER,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_STEP,
  buildStockAdjustmentOperatorWorkflowSummary,
  getStockAdjustmentOperatorActionProfile,
  normalizeStockAdjustmentOperatorStatus
} from './stock-adjustment-operator-workflow-foundation.js';