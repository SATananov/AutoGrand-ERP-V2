import { Router } from 'express';
import {
  getStockControlCenterFoundation,
  getStockControlCenterSummary,
  getStockControlCenterOperatorChecklist,
  getStockControlCenterFilters,
  getStockControlCenterRiskPanels,
  getStockControlCenterQuickActions,
  getStockControlCenterOperationalDashboard
} from '../services/stock-control-center-service.js';

const router = Router();

function getFilter(req) {
  return req.query?.filter || 'all';
}

router.get('/stock-control-center', (req, res) => {
  const dashboard = getStockControlCenterOperationalDashboard({ filter: getFilter(req) });
  res.render('pages/stock-control-center', {
    title: 'Stock Control Center',
    pageTitle: 'Stock Control Center',
    currentPath: '/stock-control-center',
    dashboard,
    summary: dashboard.summary,
    filters: dashboard.filters,
    riskPanels: dashboard.riskPanels,
    quickActions: dashboard.quickActions,
    operatorChecklist: dashboard.operatorChecklist,
    checkpointTimeline: dashboard.checkpointTimeline
  });
});

router.get('/api/stock/control-center/ping', (_req, res) => {
  res.json({ ok: true, module: 'stock-control-center', stage: '4.9.2' });
});

router.get('/api/stock/control-center/foundation', (_req, res) => {
  res.json({ ok: true, foundation: getStockControlCenterFoundation() });
});

router.get('/api/stock/control-center/summary', (req, res) => {
  res.json({ ok: true, summary: getStockControlCenterSummary({ filter: getFilter(req) }) });
});

router.get('/api/stock/control-center/operator-checklist', (_req, res) => {
  res.json({ ok: true, checklist: getStockControlCenterOperatorChecklist() });
});

router.get('/api/stock/control-center/filters', (_req, res) => {
  res.json({ ok: true, filters: getStockControlCenterFilters() });
});

router.get('/api/stock/control-center/risk-panels', (req, res) => {
  res.json({ ok: true, riskPanels: getStockControlCenterRiskPanels({ filter: getFilter(req) }) });
});

router.get('/api/stock/control-center/quick-actions', (_req, res) => {
  res.json({ ok: true, quickActions: getStockControlCenterQuickActions() });
});

router.get('/api/stock/control-center/operational-dashboard', (req, res) => {
  res.json({ ok: true, dashboard: getStockControlCenterOperationalDashboard({ filter: getFilter(req) }) });
});

export default router;
