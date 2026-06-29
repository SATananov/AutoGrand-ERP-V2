export const STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_STEP = 'Step 4.8.5 - Stock Adjustment Final Polish / Operator Workflow Hardening';

export const STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_MARKER = 'STEP_4_8_5_OPERATOR_WORKFLOW_HARDENING';

export const STOCK_ADJUSTMENT_OPERATOR_ACTIONS = Object.freeze({
  DRAFT: Object.freeze({
    status: 'DRAFT',
    labelBg: 'Чернова',
    tone: 'warning',
    primaryAction: 'Провери и осчетоводи',
    allowedActions: Object.freeze([
      'Редакция на редове',
      'Промяна на причина',
      'Preview на ефекта',
      'Осчетоводяване към складови движения'
    ]),
    blockedActions: Object.freeze([
      'Няма реален складов ефект преди POSTED',
      'Не се създава обратен документ от DRAFT'
    ]),
    operatorHintBg: 'Провери причина, склад, редове и очакван ефект преди осчетоводяване.'
  }),
  POSTED: Object.freeze({
    status: 'POSTED',
    labelBg: 'Осчетоводен',
    tone: 'locked',
    primaryAction: 'Виж движения и audit trail',
    allowedActions: Object.freeze([
      'Преглед на movement trace',
      'Преглед на audit trail',
      'Създаване на обратна чернова при грешка'
    ]),
    blockedActions: Object.freeze([
      'Редакция на редове',
      'Повторно осчетоводяване',
      'Изтриване или ръчна редакция на стар stock journal'
    ]),
    operatorHintBg: 'Документът е заключен. Корекция на грешка се прави само чрез нов обратен документ.'
  })
});

export const STOCK_ADJUSTMENT_OPERATOR_REASON_GUIDE = Object.freeze([
  Object.freeze({ code: 'COUNT_DIFF', labelBg: 'Разлика от инвентаризация', requiresNote: true }),
  Object.freeze({ code: 'DAMAGE', labelBg: 'Повреда / брак', requiresNote: true }),
  Object.freeze({ code: 'SYSTEM_SYNC', labelBg: 'Системно изравняване', requiresNote: true }),
  Object.freeze({ code: 'REVERSAL', labelBg: 'Обратна корекция', requiresNote: true })
]);

export function normalizeStockAdjustmentOperatorStatus(status) {
  const normalized = String(status || 'DRAFT').trim().toUpperCase();
  return normalized === 'POSTED' ? 'POSTED' : 'DRAFT';
}

export function getStockAdjustmentOperatorActionProfile(status) {
  const normalized = normalizeStockAdjustmentOperatorStatus(status);
  return STOCK_ADJUSTMENT_OPERATOR_ACTIONS[normalized] || STOCK_ADJUSTMENT_OPERATOR_ACTIONS.DRAFT;
}

export function buildStockAdjustmentOperatorWorkflowSummary(input = {}) {
  const document = input.document || input.adjustment || input || {};
  const status = normalizeStockAdjustmentOperatorStatus(document.status);
  const profile = getStockAdjustmentOperatorActionProfile(status);
  const traceSummary = input.traceSummary || document.traceSummary || document.movementTraceSummary || {};
  const auditSummary = input.auditSummary || document.auditSummary || {};

  const movementCount = Number(traceSummary.movementCount || traceSummary.totalMovements || 0);
  const auditCount = Number(auditSummary.auditCount || auditSummary.totalEvents || 0);
  const hasMovementTrace = movementCount > 0;
  const hasAuditTrail = auditCount > 0;

  return {
    step: STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_STEP,
    marker: STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_MARKER,
    status,
    labelBg: profile.labelBg,
    tone: profile.tone,
    primaryAction: profile.primaryAction,
    allowedActions: Array.from(profile.allowedActions),
    blockedActions: Array.from(profile.blockedActions),
    operatorHintBg: profile.operatorHintBg,
    hasMovementTrace,
    hasAuditTrail,
    movementCount,
    auditCount,
    canEditDraft: status === 'DRAFT',
    canPost: status === 'DRAFT',
    canCreateReversalDraft: status === 'POSTED',
    isLocked: status === 'POSTED'
  };
}
