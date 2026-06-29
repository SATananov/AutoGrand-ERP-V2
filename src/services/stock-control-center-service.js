// AutoGrand ERP V2 - Step 4.9 Stock Transfer / Adjustment Consolidation & Inventory Control Center
// Read-only consolidation service. It does not post, edit, delete, or reverse stock journal records.

import {
  getStockControlCenterFoundation,
  STOCK_CONTROL_CENTER_MODULES,
  STOCK_CONTROL_CENTER_OPERATOR_RULES,
  STOCK_CONTROL_CENTER_QUALITY_GATES,
  STOCK_CONTROL_CENTER_VERSION,
} from '../data/stock-control-center-foundation.js';

export const STEP_4_9_STOCK_CONTROL_CENTER_SERVICE_MARKER = 'STEP_4_9_STOCK_CONTROL_CENTER_SERVICE';

function toStatusCard(module, index) {
  return {
    id: `stock-control-${index + 1}`,
    key: module.key,
    label: module.label,
    route: module.route,
    api: module.api,
    purpose: module.purpose,
    monetaRule: module.monetaRule,
    state: 'available',
    severity: 'normal',
  };
}

function buildConsolidatedTimeline() {
  return [
    {
      step: '4.8',
      label: 'Stock Correction / Adjustment Document Foundation',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.1',
      label: 'Persistent Documents + Posting Lock',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.2',
      label: 'Movement Binding',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.3',
      label: 'Movement Trace Visibility',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.4',
      label: 'Audit / Reversal Safety',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.5',
      label: 'Operator Workflow Hardening',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.8.6',
      label: 'Final QA / Clean Export',
      state: 'closed',
      route: '/stock-adjustments',
    },
    {
      step: '4.9',
      label: 'Inventory Control Center',
      state: 'active',
      route: '/stock-control-center',
    },
  ];
}

function buildOperatorChecklist() {
  return STOCK_CONTROL_CENTER_OPERATOR_RULES.map((rule, index) => ({
    ...rule,
    index: index + 1,
    checked: true,
  }));
}

function buildQualityGateCards() {
  return STOCK_CONTROL_CENTER_QUALITY_GATES.map((gate, index) => ({
    id: `quality-gate-${index + 1}`,
    label: gate,
    expected: 'PASS',
    owner: 'Step 4.9 QA',
  }));
}

export function getStockControlCenterData(options = {}) {
  const foundation = getStockControlCenterFoundation();
  const generatedAt = options.generatedAt || new Date().toISOString();

  return {
    marker: STEP_4_9_STOCK_CONTROL_CENTER_SERVICE_MARKER,
    version: STOCK_CONTROL_CENTER_VERSION,
    generatedAt,
    title: 'Inventory Control Center',
    subtitle: 'Stock transfer and adjustment consolidation view',
    foundation,
    statusCards: STOCK_CONTROL_CENTER_MODULES.map(toStatusCard),
    timeline: buildConsolidatedTimeline(),
    operatorChecklist: buildOperatorChecklist(),
    qualityGates: buildQualityGateCards(),
    summary: {
      modules: STOCK_CONTROL_CENTER_MODULES.length,
      qualityGates: STOCK_CONTROL_CENTER_QUALITY_GATES.length,
      operatorRules: STOCK_CONTROL_CENTER_OPERATOR_RULES.length,
      currentState: 'CONTROL_CENTER_READY',
    },
    links: {
      stockDashboard: '/stock-dashboard',
      transferCenter: '/stock-transfer-center',
      adjustments: '/stock-adjustments',
      ping: '/api/stock/control-center/ping',
      foundation: '/api/stock/control-center/foundation',
      summary: '/api/stock/control-center/summary',
    },
  };
}

export function getStockControlCenterFoundationData() {
  return getStockControlCenterFoundation();
}

export function getStockControlCenterSummary() {
  const data = getStockControlCenterData();
  return {
    marker: 'STEP_4_9_STOCK_CONTROL_CENTER_SUMMARY',
    version: data.version,
    generatedAt: data.generatedAt,
    summary: data.summary,
    modules: data.statusCards.map((card) => ({
      key: card.key,
      label: card.label,
      state: card.state,
      route: card.route,
    })),
    qualityGates: data.qualityGates,
  };
}
