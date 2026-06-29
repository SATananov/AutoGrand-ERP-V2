import express from 'express';
import {
  getStockReportsBalance,
  getStockReportsMovements,
  getStockReportsOptions,
  getStockReportsSummary
} from '../services/stock-reports-service.js';

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function sendError(res, error) {
  console.error('[stock-reports]', error);
  res.status(500).json({
    ok: false,
    error: 'STOCK_REPORTS_READ_FAILED',
    message: 'Справката не може да бъде заредена в момента. Данните не са променени.'
  });
}

router.get('/stock-reports', (req, res) => {
  res.render('pages/stock-reports', {
    title: 'Складови справки',
    activeModule: 'stock-reports',
    pageClass: 'stock-reports-page'
  });
});

router.get('/api/stock/reports/options', async (req, res) => {
  try {
    res.json(await getStockReportsOptions(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/reports/summary', async (req, res) => {
  try {
    res.json(await getStockReportsSummary(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/reports/balance', async (req, res) => {
  try {
    res.json(await getStockReportsBalance(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/reports/movements', async (req, res) => {
  try {
    res.json(await getStockReportsMovements(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
