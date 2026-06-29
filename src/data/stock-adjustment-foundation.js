// AutoGrand ERP V2 — Step 4.8.3 Stock Adjustment Posting UI / Movement Trace Visibility
// Foundation metadata for the stock correction / adjustment document workflow.

export const STOCK_ADJUSTMENT_STEP = "4.8.3";
export const STOCK_ADJUSTMENT_VERSION = "0.4.15";

export const STOCK_ADJUSTMENT_DOCUMENT_STATES = Object.freeze({
  DRAFT: "DRAFT",
  POSTED: "POSTED"
});

export const STOCK_ADJUSTMENT_MONETA_RULES = Object.freeze([
  "Старите складови движения не се трият.",
  "Складовият журнал не се редактира ръчно.",
  "Корекцията се прави чрез отделен документ.",
  "Документът минава през DRAFT към POSTED.",
  "POSTED документ е заключен и не допуска промяна на редове.",
  "Складовият ефект се записва като ново коригиращо движение в реалния movement слой.",
  "Повторен POST не създава второ движение за същия ред.",
  "POSTED документът показва видим movement trace към създадените движения."
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
  usesShadowTables: false,
  prismaSchemaChangeRequired: false
});

export function getStockAdjustmentFoundation() {
  return {
    ok: true,
    step: STOCK_ADJUSTMENT_STEP,
    version: STOCK_ADJUSTMENT_VERSION,
    title: "Stock Adjustment Posting UI / Movement Trace Visibility",
    bgTitle: "Видим trace на осчетоводените складови корекции",
    route: "/stock-adjustments",
    api: {
      ping: "/api/stock/adjustments/ping",
      foundation: "/api/stock/adjustments/foundation",
      preview: "/api/stock/adjustments/preview",
      fromIssue: "/api/stock/adjustments/from-issue",
      documents: "/api/stock/adjustments/documents",
      movementBinding: "/api/stock/adjustments/movement-binding",
      movementTrace: "/api/stock/adjustments/documents/:id/movement-trace",
      post: "/api/stock/adjustments/documents/:id/post"
    },
    states: STOCK_ADJUSTMENT_DOCUMENT_STATES,
    capabilities: STOCK_ADJUSTMENT_CAPABILITIES,
    monetaRules: STOCK_ADJUSTMENT_MONETA_RULES,
    persistence: {
      documentTable: "ag_stock_adjustment_documents",
      lineTable: "ag_stock_adjustment_lines",
      postingLogTable: "ag_stock_adjustment_posting_log",
      mode: "runtime-safe-sqlite-ddl-via-prisma-raw-sql",
      movementBinding: "existing-stock-movement-table-only"
    }
  };
}

export default getStockAdjustmentFoundation;
