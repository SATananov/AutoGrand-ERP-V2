import express from 'express';
import {
  getStockValuationBalance,
  getStockValuationMovements,
  getStockValuationOptions,
  getStockValuationSnapshot,
  getStockValuationSummary
} from '../services/stock-valuation-service.js';

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-AutoGrand-Read-Only', 'stock-valuation');
  next();
});

function sendError(res, error) {
  console.error('[stock-valuation]', error);
  res.status(500).json({
    ok: false,
    error: 'STOCK_VALUATION_READ_FAILED',
    message: 'Стойностната складова справка не може да бъде заредена в момента. Данните не са променени.'
  });
}

router.get('/stock-valuation', (req, res) => {
  res.render('pages/stock-valuation', {
    title: 'Стойност на склада · Cost Confidence',
    activeModule: 'stock-valuation',
    pageClass: 'stock-valuation-page'
  });
});

router.get('/api/stock/valuation/options', async (req, res) => {
  try {
    res.json(await getStockValuationOptions(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/valuation/summary', async (req, res) => {
  try {
    res.json(await getStockValuationSummary(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/valuation/balance', async (req, res) => {
  try {
    res.json(await getStockValuationBalance(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/valuation/movements-cost', async (req, res) => {
  try {
    res.json(await getStockValuationMovements(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/api/stock/valuation/snapshot', async (req, res) => {
  try {
    res.json(await getStockValuationSnapshot(req.query));
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
