import {
  STOCK_CONTROL_CENTER_STAGE,
  STOCK_CONTROL_CENTER_VERSION,
  getStockControlCenterFoundation,
  stockControlCenterFilterDefinitions,
  stockControlCenterRiskPanels,
  stockControlCenterQuickActions,
  stockControlCenterCheckpointTimeline
} from '../data/stock-control-center-foundation.js';

function normalizeFilter(filter) {
  const requested = String(filter || 'all').trim().toLowerCase();
  const allowed = new Set(stockControlCenterFilterDefinitions.map((item) => item.key));
  return allowed.has(requested) ? requested : 'all';
}

function filterRiskPanels(filterKey) {
  if (filterKey === 'risk') {
    return stockControlCenterRiskPanels;
  }

  if (filterKey === 'adjustments') {
    return stockControlCenterRiskPanels.filter((panel) => [
      'posted-unlocked',
      'missing-movement-trace',
      'manual-journal-edit'
    ].includes(panel.key));
  }

  if (filterKey === 'transfers') {
    return stockControlCenterRiskPanels.filter((panel) => [
      'negative-stock',
      'missing-movement-trace'
    ].includes(panel.key));
  }

  return stockControlCenterRiskPanels;
}

export function getStockControlCenterFilters() {
  return stockControlCenterFilterDefinitions.map((filter) => ({
    ...filter,
    isDefault: filter.key === 'all'
  }));
}

export function getStockControlCenterRiskPanels(options = {}) {
  const activeFilter = normalizeFilter(options.filter);
  return filterRiskPanels(activeFilter).map((panel) => ({
    ...panel,
    activeFilter
  }));
}

export function getStockControlCenterQuickActions() {
  return stockControlCenterQuickActions.map((action, index) => ({
    ...action,
    order: index + 1,
    readOnlySafe: true
  }));
}

export function getStockControlCenterSummary(options = {}) {
  const activeFilter = normalizeFilter(options.filter);
  const riskPanels = getStockControlCenterRiskPanels({ filter: activeFilter });
  const highRiskCount = riskPanels.filter((panel) => ['high', 'critical'].includes(panel.severity)).length;

  return {
    stage: STOCK_CONTROL_CENTER_STAGE,
    version: STOCK_CONTROL_CENTER_VERSION,
    activeFilter,
    title: 'Stock Control Center',
    subtitle: 'Transfer, Adjustment, Movement Trace and Audit Safety consolidation',
    mode: 'read-only',
    counters: {
      filters: stockControlCenterFilterDefinitions.length,
      riskPanels: riskPanels.length,
      highRiskPanels: highRiskCount,
      quickActions: stockControlCenterQuickActions.length,
      checkpoints: stockControlCenterCheckpointTimeline.length
    },
    status: {
      postingLock: 'active',
      movementTrace: 'visible',
      reversalSafety: 'document-driven',
      journalEditPolicy: 'blocked',
      controlMode: 'read-only'
    }
  };
}

export function getStockControlCenterOperatorChecklist() {
  return [
    {
      key: 'choose-filter',
      label: 'Избери operational filter',
      description: 'Операторът започва от all / transfers / adjustments / risk.'
    },
    {
      key: 'review-risk-panels',
      label: 'Прегледай risk panels',
      description: 'Провери high и critical панели преди действие.'
    },
    {
      key: 'open-source-document',
      label: 'Отвори source документ',
      description: 'Всяко действие трябва да започне от документ, не от journal.'
    },
    {
      key: 'use-quick-action',
      label: 'Използвай safe quick action',
      description: 'Quick actions водят към read-only или документно-безопасни екрани.'
    }
  ];
}

export function getStockControlCenterOperationalDashboard(options = {}) {
  const activeFilter = normalizeFilter(options.filter);
  const foundation = getStockControlCenterFoundation();

  return {
    foundation,
    summary: getStockControlCenterSummary({ filter: activeFilter }),
    filters: getStockControlCenterFilters().map((filter) => ({
      ...filter,
      isActive: filter.key === activeFilter
    })),
    riskPanels: getStockControlCenterRiskPanels({ filter: activeFilter }),
    quickActions: getStockControlCenterQuickActions(),
    operatorChecklist: getStockControlCenterOperatorChecklist(),
    checkpointTimeline: stockControlCenterCheckpointTimeline,
    activeFilter
  };
}

export { getStockControlCenterFoundation };
