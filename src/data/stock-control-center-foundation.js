export const STOCK_CONTROL_CENTER_STEP = '4.9.1';
export const STOCK_CONTROL_CENTER_MODULE = 'stock-control-center';
export const STOCK_CONTROL_CENTER_ROUTE = '/stock-control-center';

export const STOCK_CONTROL_CENTER_LANES = [
  {
    key: 'transfers',
    label: 'Stock Transfers',
    bgLabel: 'Складови трансфери',
    status: 'planned',
    intent: 'Transfer documents will move stock between objects without manual journal edits.',
    operatorNote: 'Use transfer documents when the same item changes location or object.',
  },
  {
    key: 'adjustments',
    label: 'Stock Adjustments',
    bgLabel: 'Корекции на склад',
    status: 'active',
    intent: 'Step 4.8 adjustment documents remain the approved correction path.',
    operatorNote: 'Use draft adjustment documents and post them only after review.',
  },
  {
    key: 'movementTrace',
    label: 'Movement Trace',
    bgLabel: 'Проследяване на движения',
    status: 'active',
    intent: 'Every posted stock effect must be traceable back to its source document.',
    operatorNote: 'Use the movement trace panel before reversal or audit decisions.',
  },
  {
    key: 'auditSafety',
    label: 'Audit / Reversal Safety',
    bgLabel: 'Одит и безопасно сторниране',
    status: 'active',
    intent: 'Corrections are additive and reversible, never destructive.',
    operatorNote: 'Create a reversal draft instead of editing posted movement history.',
  },
];

export const STOCK_CONTROL_CENTER_METRICS = [
  {
    key: 'readOnly',
    label: 'Read-only control center',
    bgLabel: 'Само преглед и контрол',
    state: 'locked',
    tone: 'safe',
    value: 'ON',
  },
  {
    key: 'adjustmentWorkflow',
    label: 'Adjustment workflow',
    bgLabel: 'Процес за корекции',
    state: 'active',
    tone: 'ok',
    value: '4.8.x',
  },
  {
    key: 'transferWorkflow',
    label: 'Transfer workflow',
    bgLabel: 'Процес за трансфери',
    state: 'planned',
    tone: 'planned',
    value: 'NEXT',
  },
  {
    key: 'qaGate',
    label: 'QA gate',
    bgLabel: 'QA контрол',
    state: 'active',
    tone: 'ok',
    value: 'PASS',
  },
];

export const STOCK_CONTROL_CENTER_OPERATOR_CHECKLIST = [
  {
    key: 'checkDraft',
    title: 'Check draft document',
    bgTitle: 'Провери черновата',
    description: 'Confirm item, quantity, object, note and reason before posting.',
  },
  {
    key: 'checkTrace',
    title: 'Check movement trace',
    bgTitle: 'Провери проследяването',
    description: 'Confirm the movement source and document relation before audit decisions.',
  },
  {
    key: 'checkLock',
    title: 'Respect posted lock',
    bgTitle: 'Спазвай заключването',
    description: 'Posted documents are immutable; use a reversal or new correction document.',
  },
  {
    key: 'checkExport',
    title: 'Clean export checkpoint',
    bgTitle: 'Чист export checkpoint',
    description: 'No temporary apply folders or patch helpers should remain before commit.',
  },
];

export const STOCK_CONTROL_CENTER_SAFETY_RULES = [
  'No direct stock journal edits from the control center.',
  'No deletion of posted stock movement history.',
  'No silent quantity changes after posting.',
  'Every correction must keep source document traceability.',
  'Transfers and adjustments must stay separate document types.',
];

export function getStockControlCenterFoundation() {
  return {
    step: STOCK_CONTROL_CENTER_STEP,
    module: STOCK_CONTROL_CENTER_MODULE,
    route: STOCK_CONTROL_CENTER_ROUTE,
    lanes: STOCK_CONTROL_CENTER_LANES,
    metrics: STOCK_CONTROL_CENTER_METRICS,
    checklist: STOCK_CONTROL_CENTER_OPERATOR_CHECKLIST,
    safetyRules: STOCK_CONTROL_CENTER_SAFETY_RULES,
  };
}
