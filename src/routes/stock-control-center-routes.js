import express from 'express';
import {
  getStockControlCenterPing,
  getStockControlCenterSummary,
  getStockControlCenterViewModel,
} from '../services/stock-control-center-service.js';

const router = express.Router();

router.get('/stock-control-center', (req, res, next) => {
  try {
    res.render('pages/stock-control-center', getStockControlCenterViewModel());
  } catch (error) {
    next(error);
  }
});

router.get('/api/stock/control-center/ping', (req, res) => {
  res.json(getStockControlCenterPing());
});

router.get('/api/stock/control-center/foundation', (req, res) => {
  res.json(getStockControlCenterSummary().foundation);
});

router.get('/api/stock/control-center/summary', (req, res) => {
  res.json(getStockControlCenterSummary());
});

router.get('/api/stock/control-center/operator-checklist', (req, res) => {
  const summary = getStockControlCenterSummary();
  res.json({ ok: true, step: summary.step, checklist: summary.checklist });
});

export default router;
