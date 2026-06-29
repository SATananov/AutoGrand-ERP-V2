import {
  getStockControlCenterFoundation,
  STOCK_CONTROL_CENTER_STEP,
} from '../data/stock-control-center-foundation.js';

function buildStepSummary() {
  return [
    {
      step: '4.8.1',
      title: 'Persistent adjustment documents',
      status: 'complete',
      note: 'Draft and posted adjustment documents are persistent and auditable.',
    },
    {
      step: '4.8.2',
      title: 'Movement binding',
      status: 'complete',
      note: 'Posted adjustment documents create traceable stock movement effects.',
    },
    {
      step: '4.8.3',
      title: 'Movement trace visibility',
      status: 'complete',
      note: 'Operators can inspect stock movement trace from the adjustment UI.',
    },
    {
      step: '4.8.4',
      title: 'Audit and reversal safety',
      status: 'complete',
      note: 'Reversal creates safe draft documents instead of mutating posted history.',
    },
    {
      step: '4.8.5',
      title: 'Operator workflow hardening',
      status: 'complete',
      note: 'UI and API surfaces reinforce the safe correction workflow.',
    },
    {
      step: '4.9',
      title: 'Stock control center foundation',
      status: 'complete',
      note: 'Control center consolidates transfer, adjustment, trace and QA concepts.',
    },
    {
      step: STOCK_CONTROL_CENTER_STEP,
      title: 'Control center UI polish',
      status: 'active',
      note: 'Dashboard cards, operator checklist and QA indicators are polished.',
    },
  ];
}

function buildControlCards(foundation) {
  return foundation.lanes.map((lane, index) => ({
    ...lane,
    number: String(index + 1).padStart(2, '0'),
    isActive: lane.status === 'active',
    isPlanned: lane.status === 'planned',
  }));
}

function buildQaPanels(foundation) {
  return [
    {
      key: 'routeSurface',
      title: 'Route and API surface',
      bgTitle: 'Route и API повърхност',
      status: 'OK',
      detail: 'The control center keeps a visible page and JSON summary endpoints.',
    },
    {
      key: 'operatorSurface',
      title: 'Operator surface',
      bgTitle: 'Операторска повърхност',
      status: 'OK',
      detail: 'Workflow cards explain what the operator can safely do next.',
    },
    {
      key: 'safetySurface',
      title: 'Safety rules',
      bgTitle: 'Правила за безопасност',
      status: 'OK',
      detail: `${foundation.safetyRules.length} non-destructive stock rules are visible.`,
    },
  ];
}

export function getStockControlCenterSummary(options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const foundation = getStockControlCenterFoundation();
  const controlCards = buildControlCards(foundation);
  const qaPanels = buildQaPanels(foundation);
  const stepSummary = buildStepSummary();

  return {
    ok: true,
    step: STOCK_CONTROL_CENTER_STEP,
    module: foundation.module,
    generatedAtIso: generatedAt.toISOString(),
    pageTitle: 'Център за складов контрол',
    pageSubtitle: 'Консолидиран контрол върху трансфери, корекции, движения и безопасност.',
    foundation,
    metrics: foundation.metrics,
    controlCards,
    checklist: foundation.checklist,
    safetyRules: foundation.safetyRules,
    qaPanels,
    stepSummary,
  };
}

export function getStockControlCenterViewModel(options = {}) {
  const summary = getStockControlCenterSummary(options);

  return {
    title: 'Складов контрол',
    bodyClass: 'page-stock-control-center',
    ...summary,
  };
}

export function getStockControlCenterPing() {
  return {
    ok: true,
    step: STOCK_CONTROL_CENTER_STEP,
    module: 'stock-control-center',
    status: 'ready',
  };
}
