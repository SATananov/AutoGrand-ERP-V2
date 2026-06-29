// AutoGrand ERP V2 - Step 4.9 Stock Transfer / Adjustment Consolidation & Inventory Control Center
// Foundation constants for the inventory control center.

export const STEP_4_9_STOCK_CONTROL_CENTER_MARKER = 'STEP_4_9_STOCK_CONTROL_CENTER';

export const STOCK_CONTROL_CENTER_VERSION = '4.9.0';

export const STOCK_CONTROL_CENTER_MODULES = Object.freeze([
  {
    key: 'stock-transfers',
    label: 'Stock Transfers',
    route: '/stock-transfer-center',
    api: '/api/stock/transfers',
    purpose: 'Move stock between company locations without deleting old movements.',
    monetaRule: 'Transfer documents must create auditable stock movements, not manual journal edits.',
  },
  {
    key: 'stock-adjustments',
    label: 'Stock Adjustments',
    route: '/stock-adjustments',
    api: '/api/stock/adjustments',
    purpose: 'Correct physical stock through DRAFT -> POSTED adjustment documents.',
    monetaRule: 'Wrong posted corrections are reversed through a new document, never by editing old journal entries.',
  },
  {
    key: 'movement-trace',
    label: 'Movement Trace',
    route: '/api/stock/adjustments/documents/:id/movement-trace',
    api: '/api/stock/adjustments/documents/:id/movement-trace',
    purpose: 'Expose the movement records created by posted adjustment documents.',
    monetaRule: 'Traceability must show the binding between documents and movements.',
  },
  {
    key: 'audit-reversal',
    label: 'Audit / Reversal Safety',
    route: '/api/stock/adjustments/documents/:id/audit',
    api: '/api/stock/adjustments/documents/:id/reversal-preview',
    purpose: 'Provide audit visibility and safe reversal draft workflow.',
    monetaRule: 'A reversal is a new auditable document, not a destructive update.',
  },
]);

export const STOCK_CONTROL_CENTER_QUALITY_GATES = Object.freeze([
  'npm run check',
  'step-4-8-1-stock-adjustment-smoke',
  'step-4-8-2-stock-adjustment-movement-binding-smoke',
  'step-4-8-3-stock-adjustment-movement-trace-visibility-smoke',
  'step-4-8-4-stock-adjustment-audit-reversal-safety-smoke',
  'step-4-8-5-stock-adjustment-operator-workflow-smoke',
  'step-4-8-6-stock-adjustment-final-qa-clean-export-smoke',
  'step-4-9-stock-control-center-smoke',
]);

export const STOCK_CONTROL_CENTER_OPERATOR_RULES = Object.freeze([
  {
    key: 'no-delete-journal',
    title: 'No manual deletion',
    description: 'Old stock movement records remain part of the audit history.',
  },
  {
    key: 'document-first',
    title: 'Document-first correction',
    description: 'Stock changes are performed through transfer or adjustment documents.',
  },
  {
    key: 'posted-lock',
    title: 'Posted lock',
    description: 'Posted documents are locked and corrections are handled through reversal drafts.',
  },
  {
    key: 'trace-required',
    title: 'Movement trace required',
    description: 'Operators must be able to trace the movement records created by a document.',
  },
]);

export function getStockControlCenterFoundation() {
  return {
    marker: STEP_4_9_STOCK_CONTROL_CENTER_MARKER,
    version: STOCK_CONTROL_CENTER_VERSION,
    modules: STOCK_CONTROL_CENTER_MODULES,
    qualityGates: STOCK_CONTROL_CENTER_QUALITY_GATES,
    operatorRules: STOCK_CONTROL_CENTER_OPERATOR_RULES,
  };
}
