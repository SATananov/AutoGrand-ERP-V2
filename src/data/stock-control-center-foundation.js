export const STOCK_CONTROL_CENTER_STAGE = '4.9.2';
export const STOCK_CONTROL_CENTER_VERSION = '0.4.21';

export const stockControlCenterFilterDefinitions = Object.freeze([
  {
    key: 'all',
    label: 'Всички складови операции',
    description: 'Общ преглед на transfer, adjustment, movement trace и audit safety слоевете.',
    tone: 'neutral'
  },
  {
    key: 'transfers',
    label: 'Трансфери',
    description: 'Фокус върху бъдещите междускладови движения и контрола им.',
    tone: 'info'
  },
  {
    key: 'adjustments',
    label: 'Корекции',
    description: 'Фокус върху корекционните документи, posting lock и reversal safety.',
    tone: 'warning'
  },
  {
    key: 'risk',
    label: 'Риск',
    description: 'Показва панели за отрицателна наличност, отключени документи и missing trace.',
    tone: 'danger'
  }
]);

export const stockControlCenterRiskPanels = Object.freeze([
  {
    key: 'negative-stock',
    label: 'Отрицателна наличност',
    severity: 'high',
    state: 'guarded',
    metric: '0 blocking cases',
    description: 'Контролен панел за бъдещи сигнали при наличност под нула.',
    operatorHint: 'Провери movement trace преди корекционен документ.'
  },
  {
    key: 'posted-unlocked',
    label: 'POSTED документ без lock',
    severity: 'critical',
    state: 'guarded',
    metric: '0 blocking cases',
    description: 'Следи дали осчетоводените корекции остават заключени.',
    operatorHint: 'Не отключвай ръчно POSTED документи; използвай reversal документ.'
  },
  {
    key: 'missing-movement-trace',
    label: 'Липсващ movement trace',
    severity: 'medium',
    state: 'observed',
    metric: 'trace visible',
    description: 'Свързва adjustment документа с реалните stock movements.',
    operatorHint: 'Отвори trace панела от документа или от Control Center.'
  },
  {
    key: 'manual-journal-edit',
    label: 'Ръчна редакция на journal',
    severity: 'critical',
    state: 'blocked',
    metric: 'not allowed',
    description: 'Moneta правило: stock journal не се редактира ръчно.',
    operatorHint: 'Коригирай чрез нов документ, не чрез промяна на старо движение.'
  }
]);

export const stockControlCenterQuickActions = Object.freeze([
  {
    key: 'open-adjustments',
    label: 'Отвори корекции',
    href: '/stock-adjustments',
    description: 'Преминава към Stock Adjustment documents.'
  },
  {
    key: 'review-resolution',
    label: 'Преглед на hardening',
    href: '/stock-hardening',
    description: 'Проверява negative stock и double movement diagnostics.'
  },
  {
    key: 'refresh-control-center',
    label: 'Обнови Control Center',
    href: '/stock-control-center',
    description: 'Презарежда consolidation dashboard-а.'
  }
]);

export const stockControlCenterCheckpointTimeline = Object.freeze([
  {
    step: '4.8',
    label: 'Stock Correction / Adjustment Foundation',
    state: 'closed'
  },
  {
    step: '4.8.6',
    label: 'Final QA / Clean Export Checkpoint',
    state: 'closed'
  },
  {
    step: '4.9',
    label: 'Stock Control Center Foundation',
    state: 'closed'
  },
  {
    step: '4.9.1',
    label: 'Operator Dashboard Polish',
    state: 'closed'
  },
  {
    step: '4.9.2',
    label: 'Operational Filters / Risk Panels / Quick Actions',
    state: 'active'
  }
]);

export function getStockControlCenterFoundation() {
  return {
    stage: STOCK_CONTROL_CENTER_STAGE,
    version: STOCK_CONTROL_CENTER_VERSION,
    module: 'stock-control-center',
    mode: 'read-only-consolidation',
    filters: stockControlCenterFilterDefinitions,
    riskPanels: stockControlCenterRiskPanels,
    quickActions: stockControlCenterQuickActions,
    checkpointTimeline: stockControlCenterCheckpointTimeline,
    rules: [
      'No manual stock journal edits',
      'POSTED documents remain locked',
      'Corrections are document-driven',
      'Reversal creates a new document',
      'Control Center is read-only'
    ]
  };
}
