import {
  STOCK_ADJUSTMENT_OPERATOR_REASON_GUIDE,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_MARKER,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_STEP,
  buildStockAdjustmentOperatorWorkflowSummary,
  getStockAdjustmentOperatorActionProfile,
  normalizeStockAdjustmentOperatorStatus
} from '../data/stock-adjustment-operator-workflow-foundation.js';

export {
  STOCK_ADJUSTMENT_OPERATOR_REASON_GUIDE,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_MARKER,
  STOCK_ADJUSTMENT_OPERATOR_WORKFLOW_STEP,
  buildStockAdjustmentOperatorWorkflowSummary,
  getStockAdjustmentOperatorActionProfile,
  normalizeStockAdjustmentOperatorStatus
};

export function getStockAdjustmentOperatorWorkflowPanel(input = {}) {
  const summary = buildStockAdjustmentOperatorWorkflowSummary(input);
  return {
    ...summary,
    headlineBg: summary.isLocked
      ? 'Документът е заключен след осчетоводяване'
      : 'Документът е чернова и може да се подготви безопасно',
    safetyChecklist: buildStockAdjustmentSafetyChecklist(summary),
    reasonGuide: STOCK_ADJUSTMENT_OPERATOR_REASON_GUIDE.map((reason) => ({ ...reason }))
  };
}

export function buildStockAdjustmentSafetyChecklist(summary = {}) {
  const status = normalizeStockAdjustmentOperatorStatus(summary.status);
  if (status === 'POSTED') {
    return [
      { key: 'posted-lock', labelBg: 'POSTED документът е locked', ok: true },
      { key: 'movement-trace', labelBg: 'Провери movement trace преди обратна корекция', ok: Boolean(summary.hasMovementTrace) },
      { key: 'audit-trail', labelBg: 'Провери audit trail и причина', ok: Boolean(summary.hasAuditTrail) },
      { key: 'reversal-only', labelBg: 'Грешка се поправя чрез нов обратен DRAFT', ok: true }
    ];
  }

  return [
    { key: 'draft-editable', labelBg: 'DRAFT документът може да се редактира', ok: true },
    { key: 'reason-required', labelBg: 'Причината трябва да е ясна преди POST', ok: true },
    { key: 'preview-first', labelBg: 'Провери preview преди осчетоводяване', ok: true },
    { key: 'no-stock-effect-yet', labelBg: 'Няма реален складов ефект преди POSTED', ok: true }
  ];
}

export function buildStockAdjustmentOperatorErrorMessage(error) {
  const rawMessage = typeof error === 'string' ? error : error?.message;
  const message = String(rawMessage || '').trim();

  if (!message) {
    return 'Действието не беше изпълнено. Провери документа и опитай отново.';
  }

  if (message.includes('POSTED') || message.toLowerCase().includes('locked')) {
    return 'Документът е осчетоводен и заключен. Използвай обратна корекция, вместо редакция.';
  }

  if (message.toLowerCase().includes('movement')) {
    return 'Складовото движение не може да бъде създадено безопасно. Старият журнал не се редактира ръчно.';
  }

  return message;
}
