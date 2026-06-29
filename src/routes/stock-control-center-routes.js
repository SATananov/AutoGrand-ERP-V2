// AutoGrand ERP V2 - Step 4.9 Stock Transfer / Adjustment Consolidation & Inventory Control Center

import express from 'express';
import {
  getStockControlCenterData,
  getStockControlCenterFoundationData,
  getStockControlCenterSummary,
} from '../services/stock-control-center-service.js';

export const STEP_4_9_STOCK_CONTROL_CENTER_ROUTES_MARKER = 'STEP_4_9_STOCK_CONTROL_CENTER_ROUTES';

const router = express.Router();

router.get('/stock-control-center', (req, res, next) => {
  try {
    const data = getStockControlCenterData();
    res.render('pages/stock-control-center', {
      title: 'Inventory Control Center',
      pageTitle: 'Inventory Control Center',
      activeNav: 'stock-control-center',
      ...data,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/api/stock/control-center/ping', (req, res) => {
  res.json({
    ok: true,
    marker: STEP_4_9_STOCK_CONTROL_CENTER_ROUTES_MARKER,
    step: '4.9',
    route: '/api/stock/control-center/ping',
  });
});

router.get('/api/stock/control-center/foundation', (req, res) => {
  res.json({
    ok: true,
    data: getStockControlCenterFoundationData(),
  });
});

router.get('/api/stock/control-center/summary', (req, res) => {
  res.json({
    ok: true,
    data: getStockControlCenterSummary(),
  });
});

export default router;
