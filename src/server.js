import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { decorateNavigation } from './data/navigation.js';
import { RIBBON_GROUPS } from './data/ribbon.js';
import { getDashboardData, getScreenData } from './services/core-data-service.js';
import { getSalesDocumentCardData } from './services/sales-document-card-service.js';
import { getPurchaseDocumentCardData } from './services/purchase-document-card-service.js';
import {
  getSalesNewDocumentFormData,
  createSalesDocumentFromForm,
  addSalesDocumentLine,
  updateSalesDocumentLine,
  deleteSalesDocumentLine,
  recalculateSalesDocumentTotals,
  updateSalesDocumentStatus,
  createSalesDocumentPayment
} from './services/sales-actions-service.js';
import {
  getPurchaseNewDocumentFormData,
  createPurchaseDocumentFromForm,
  addPurchaseDocumentLine,
  updatePurchaseDocumentLine,
  deletePurchaseDocumentLine,
  recalculatePurchaseDocumentTotals,
  updatePurchaseDocumentStatus
} from './services/purchase-actions-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

function todayText() {
  return new Intl.DateTimeFormat('bg-BG').format(new Date());
}

function statusDateTimeText(date = new Date()) {
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date).replace(',', '');
}

function baseViewData({ title, currentScreen = '', statusText = 'Отворен екран: Начало' } = {}) {
  return {
    title: title || 'AutoGrand ERP V2',
    appVersion: 'v0.1.1',
    companyName: 'КЪРДЖАЛИ - Автогранд ООД',
    userName: 'СТЕФАН ТАНАНОВ',
    databaseName: 'Local SQLite',
    statusDate: todayText(),
    statusDateTime: statusDateTimeText(),
    currentScreen,
    statusText,
    navigationGroups: decorateNavigation(currentScreen),
    ribbonGroups: RIBBON_GROUPS
  };
}


function isWorkspacePartialRequest(req) {
  return req.query?.workspace === '1' || req.get('X-AG-Workspace') === '1';
}

function renderPage(req, res, view, data = {}, options = {}) {
  const renderOptions = {
    ...data,
    ...(isWorkspacePartialRequest(req) ? { layout: false } : options)
  };

  res.render(view, renderOptions);
}

function redirectSalesWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/document/sales/${documentId}?action=${actionCode}`);
}

function redirectPurchaseWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/document/purchase/${documentId}?action=${actionCode}`);
}


function snapshotFolderPath() {
  return path.join(os.homedir(), 'Desktop', 'AutoGrand Snapshots');
}

function safeSnapshotFileName(value = '') {
  const raw = String(value || '').trim();
  const fallbackDate = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = raw || `AutoGrand_Snapshot_${fallbackDate}.png`;
  const cleaned = base
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return cleaned.toLowerCase().endsWith('.png') ? cleaned : `${cleaned}.png`;
}

function decodePngDataUrl(dataUrl = '') {
  const value = String(dataUrl || '');
  const match = value.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('invalid_snapshot_payload');
  }

  return Buffer.from(match[1], 'base64');
}

async function ensureSnapshotFolder() {
  const folder = snapshotFolderPath();
  await fs.promises.mkdir(folder, { recursive: true });
  return folder;
}

function openFolder(folder) {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('explorer.exe', [folder], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  if (platform === 'darwin') {
    spawn('open', [folder], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  spawn('xdg-open', [folder], { detached: true, stdio: 'ignore' }).unref();
}

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(rootDir, 'views/layouts'),
  partialsDir: path.join(rootDir, 'views/partials'),
  helpers: {
    cell(row, key) {
      return row?.[key] ?? '';
    },
    inc(value) {
      return Number(value || 0) + 1;
    },
    formatNumber(value) {
      return new Intl.NumberFormat('bg-BG').format(Number(value || 0));
    },
    formatBytes(value) {
      const bytes = Number(value || 0);
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 B';
      }

      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
      }

      return `${new Intl.NumberFormat('bg-BG', {
        maximumFractionDigits: unitIndex === 0 ? 0 : 1
      }).format(size)} ${units[unitIndex]}`;
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(rootDir, 'views/pages'));

app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(express.json({ limit: '30mb' }));
app.use('/public', express.static(path.join(rootDir, 'public')));

app.get('/', async (req, res) => {
  const dashboard = await getDashboardData();

  renderPage(req, res, 'moneta-home', {
    ...baseViewData({
      title: 'AutoGrand ERP V2 — Начало',
      statusText: 'Отворен екран: Начало'
    }),
    dashboard
  });
});

app.get('/screen/:screenId', async (req, res) => {
  const screen = await getScreenData(req.params.screenId);

  if (!screen) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Екранът не е намерен',
        statusText: 'Екранът не е намерен'
      })
    });
  }

  screen.isSalesDocument = screen.kind === 'salesDocument';
  screen.isPurchaseDocument = screen.kind === 'purchaseDocument';
  screen.hasDocumentCard = screen.isSalesDocument || screen.isPurchaseDocument;

  if (screen.isSalesDocument) {
    const docType = screen.where?.docType || 'SALE';
    screen.newDocumentUrl = `/document/sales/new/${docType}`;
    screen.documentCardPath = '/document/sales';
  }

  if (screen.isPurchaseDocument) {
    const docType = screen.where?.docType || 'DELIVERY';
    screen.newDocumentUrl = `/document/purchase/new/${docType}`;
    screen.documentCardPath = '/document/purchase';
  }

  renderPage(req, res, 'screen-browse', {
    ...baseViewData({
      title: `${screen.title} — AutoGrand ERP V2`,
      currentScreen: screen.id,
      statusText: `Отворен generated screen: ${screen.title}`
    }),
    screen
  });
});

app.get('/document/sales/new/:docType', async (req, res) => {
  const formData = await getSalesNewDocumentFormData(req.params.docType);

  renderPage(req, res, 'sales-document-new', {
    ...baseViewData({
      title: `Нов документ — ${formData.title}`,
      currentScreen: 'sales',
      statusText: `Нов продажбен документ: ${formData.title}`
    }),
    formData
  });
});

app.post('/document/sales/new', async (req, res) => {
  const document = await createSalesDocumentFromForm(req.body);
  res.redirect(`/document/sales/${document.id}?action=document_created`);
});

app.get('/document/sales/:documentId', async (req, res) => {
  const documentCard = await getSalesDocumentCardData(req.params.documentId, req.query.action || '');

  if (!documentCard) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Документът не е намерен',
        currentScreen: 'sales',
        statusText: 'Документът не е намерен'
      })
    });
  }

  renderPage(req, res, 'sales-document-card', {
    ...baseViewData({
      title: `${documentCard.title} ${documentCard.number} — AutoGrand ERP V2`,
      currentScreen: documentCard.sourceScreenId || 'sales',
      statusText: `Отворена документна карта: ${documentCard.title} ${documentCard.number}`
    }),
    documentCard
  });
});

app.post('/document/sales/:documentId/lines', async (req, res) => {
  const result = await addSalesDocumentLine(req.params.documentId, req.body);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/sales/:documentId/lines/:lineId/update', async (req, res) => {
  const result = await updateSalesDocumentLine(req.params.documentId, req.params.lineId, req.body);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/sales/:documentId/lines/:lineId/delete', async (req, res) => {
  const result = await deleteSalesDocumentLine(req.params.documentId, req.params.lineId);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/sales/:documentId/recalculate', async (req, res) => {
  const result = await recalculateSalesDocumentTotals(req.params.documentId);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'recalculate_failed');
});

app.post('/document/sales/:documentId/status', async (req, res) => {
  const result = await updateSalesDocumentStatus(req.params.documentId, req.body.status);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'status_failed');
});

app.post('/document/sales/:documentId/payments', async (req, res) => {
  const result = await createSalesDocumentPayment(req.params.documentId, req.body);
  redirectSalesWithAction(res, req.params.documentId, result?.code || 'payment_failed');
});


app.get('/document/purchase/new/:docType', async (req, res) => {
  const formData = await getPurchaseNewDocumentFormData(req.params.docType);

  renderPage(req, res, 'purchase-document-new', {
    ...baseViewData({
      title: `Нов доставен документ — ${formData.title}`,
      currentScreen: formData.docType === 'PURCHASE_ORDER' ? 'purchase-orders' : formData.docType === 'SUPPLIER_INVOICE' ? 'supplier-invoices' : 'deliveries',
      statusText: `Нов доставен документ: ${formData.title}`
    }),
    formData
  });
});

app.post('/document/purchase/new', async (req, res) => {
  const document = await createPurchaseDocumentFromForm(req.body);
  res.redirect(`/document/purchase/${document.id}?action=purchase_document_created`);
});

app.get('/document/purchase/:documentId', async (req, res) => {
  const documentCard = await getPurchaseDocumentCardData(req.params.documentId, req.query.action || '');

  if (!documentCard) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Доставният документ не е намерен',
        currentScreen: 'deliveries',
        statusText: 'Доставният документ не е намерен'
      })
    });
  }

  renderPage(req, res, 'purchase-document-card', {
    ...baseViewData({
      title: `${documentCard.title} ${documentCard.number} — AutoGrand ERP V2`,
      currentScreen: documentCard.sourceScreenId || 'deliveries',
      statusText: `Отворена доставна карта: ${documentCard.title} ${documentCard.number}`
    }),
    documentCard
  });
});

app.post('/document/purchase/:documentId/lines', async (req, res) => {
  const result = await addPurchaseDocumentLine(req.params.documentId, req.body);
  redirectPurchaseWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/purchase/:documentId/lines/:lineId/update', async (req, res) => {
  const result = await updatePurchaseDocumentLine(req.params.documentId, req.params.lineId, req.body);
  redirectPurchaseWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/purchase/:documentId/lines/:lineId/delete', async (req, res) => {
  const result = await deletePurchaseDocumentLine(req.params.documentId, req.params.lineId);
  redirectPurchaseWithAction(res, req.params.documentId, result?.code || 'line_action_failed');
});

app.post('/document/purchase/:documentId/recalculate', async (req, res) => {
  const result = await recalculatePurchaseDocumentTotals(req.params.documentId);
  redirectPurchaseWithAction(res, req.params.documentId, result?.code || 'recalculate_failed');
});

app.post('/document/purchase/:documentId/status', async (req, res) => {
  const result = await updatePurchaseDocumentStatus(req.params.documentId, req.body.status);
  redirectPurchaseWithAction(res, req.params.documentId, result?.code || 'status_failed');
});


app.post('/tools/snapshot/save', async (req, res) => {
  try {
    const folder = await ensureSnapshotFolder();
    const fileName = safeSnapshotFileName(req.body?.fileName);
    const filePath = path.join(folder, fileName);
    const pngBuffer = decodePngDataUrl(req.body?.dataUrl);

    await fs.promises.writeFile(filePath, pngBuffer);

    res.json({
      ok: true,
      folder,
      fileName,
      filePath
    });
  } catch (error) {
    console.error('Snapshot save failed:', error);
    res.status(400).json({
      ok: false,
      error: 'snapshot_save_failed'
    });
  }
});

app.post('/tools/snapshot/open-folder', async (req, res) => {
  try {
    const folder = await ensureSnapshotFolder();
    openFolder(folder);
    res.json({ ok: true, folder });
  } catch (error) {
    console.error('Snapshot open folder failed:', error);
    res.status(500).json({
      ok: false,
      error: 'snapshot_open_folder_failed'
    });
  }
});

app.get('/reference', (req, res) => {
  renderPage(req, res, 'reference-local', {
    ...baseViewData({
      title: 'Client Reference Map — AutoGrand ERP V2',
      currentScreen: 'reference-map',
      statusText: 'Отворен reference екран'
    })
  });
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app: 'autogrand-erp-v2',
    step: '2-4-purchases-delivery-stock-in'
  });
});

app.use((req, res) => {
  res.status(404);
    return renderPage(req, res, 'not-found', {
    ...baseViewData({
      title: 'Страницата не е намерена',
      statusText: 'Страницата не е намерена'
    })
  });
});

app.listen(PORT, () => {
  console.log(`AutoGrand ERP V2 is running at http://localhost:${PORT}`);
});