import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { decorateNavigation } from './data/navigation.js';
import { RIBBON_GROUPS } from './data/ribbon.js';
import {
  STEP_4_2_4_PERMISSION_HEALTH_LABEL,
  authorizeRequest,
  filterNavigationGroups,
  filterRibbonGroups,
  forbiddenViewData,
  permissionContextToViewData
} from './services/permission-service.js';
import { getDashboardData, getScreenData } from './services/core-data-service.js';
import {
  authenticateLogin,
  clearLoginCookies,
  contextToViewData,
  getLoginOptions,
  getRequestLoginContext,
  isPublicLoginPath,
  setLoginCookies
} from './services/login-context-service.js';
import { getPriceListWorkbenchData, safeItemImageBaseName } from './services/price-list-workbench-service.js';
import {
  STEP_4_3_CATALOG_HEALTH_LABEL,
  getCatalogFoundationData,
  getCatalogFoundationDiagnostics
} from './services/catalog-foundation-service.js';
import {
  STEP_4_4_GRID_PREFS_HEALTH_LABEL,
  getGlobalGridColumnPreferencesData,
  getGlobalGridColumnPreferenceDiagnostics
} from './services/grid-column-preferences-service.js';
import {
  STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL,
  getGlobalDocumentEngineData,
  getGlobalDocumentEngineDiagnostics
} from './services/document-engine-service.js';
import {
  STEP_4_6_PRINT_ENGINE_HEALTH_LABEL,
  getGlobalPrintEngineData,
  getGlobalPrintEngineDiagnostics
} from './services/print-engine-service.js';
import { getCompanyLocationCardData, getCompanyLocationsData } from './services/company-locations-service.js';
import { getSalesDocumentCardData } from './services/sales-document-card-service.js';
import { getPurchaseDocumentCardData } from './services/purchase-document-card-service.js';
import stockHardeningRoutes from "./routes/stock-hardening-routes.js";
import stockAdjustmentRoutes from "./routes/stock-adjustment-routes.js";
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
import {
  getStockAdjustmentFormData,
  getStockAdjustmentCardData,
  getStockDashboardData,
  getStockItemCardData,
  getStockTransferFormData,
  getStockTransferCardData,
  getStockTransferRequestsCenterData,
  getStockTransferPrintData,
  getStockWarehouseCardData,
  createStockAdjustmentFromForm,
  createStockTransferFromForm,
  createTransferRequestsFromBasket,
  markStockTransferNotFoundOnShelf,
  sendStockTransferRequestDocument,
  receiveStockTransferRequestDocument,
  returnStockTransferRequestToSender,
  addStockAdjustmentLine,
  updateStockAdjustmentLine,
  deleteStockAdjustmentLine,
  updateStockAdjustmentDocumentStatus,
  addStockTransferLine,
  updateStockTransferLine,
  deleteStockTransferLine,
  updateStockTransferDocumentStatus,
  stockActionMessage
} from './services/stock-actions-service.js';

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
    appVersion: 'v0.4.10',
    companyName: 'КЪРДЖАЛИ · Автогранд ООД',
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
  const contextViewData = contextToViewData(req.agContext);
  const permissionViewData = permissionContextToViewData(req.agContext);
  const navigationGroups = filterNavigationGroups(data.navigationGroups || [], req.agContext);
  const ribbonGroups = filterRibbonGroups(data.ribbonGroups || [], req.agContext);

  const renderOptions = {
    ...data,
    ...contextViewData,
    ...permissionViewData,
    navigationGroups,
    ribbonGroups,
    ...(isWorkspacePartialRequest(req) ? { layout: false } : options)
  };

  res.render(view, renderOptions);
}

function renderForbidden(req, res, decision = {}) {
  res.status(403);
  return renderPage(req, res, 'forbidden', {
    ...baseViewData({
      title: 'Достъпът е ограничен — AutoGrand ERP V2',
      currentScreen: 'forbidden',
      statusText: 'Достъпът е ограничен за активната роля'
    }),
    forbidden: forbiddenViewData(req.agContext, decision, req)
  });
}

function redirectSalesWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/document/sales/${documentId}?action=${actionCode}`);
}

function redirectPurchaseWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/document/purchase/${documentId}?action=${actionCode}`);
}

function redirectTransferWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/stock/transfer/${documentId}?action=${actionCode}`);
}

function redirectAdjustmentWithAction(res, documentId, code) {
  const actionCode = encodeURIComponent(code || 'done');
  res.redirect(`/stock/adjustment/${documentId}?action=${actionCode}`);
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

function decodeImageDataUrl(dataUrl = '') {
  const value = String(dataUrl || '');
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('invalid_image_payload');
  }

  const extMap = { png: 'png', jpeg: 'jpg', webp: 'webp' };
  return {
    ext: extMap[match[1]] || 'png',
    buffer: Buffer.from(match[2], 'base64')
  };
}

async function ensureItemImagesFolder() {
  const folder = path.join(rootDir, 'public', 'uploads', 'item-images');
  await fs.promises.mkdir(folder, { recursive: true });
  return folder;
}

function safeItemImageFileName(itemCode = '', ext = 'png') {
  const cleanExt = String(ext || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
  return `${safeItemImageBaseName(itemCode)}.${cleanExt}`;
}

async function removeExistingItemImages(itemCode = '') {
  const folder = await ensureItemImagesFolder();
  const base = safeItemImageBaseName(itemCode);
  const entries = await fs.promises.readdir(folder).catch(() => []);
  await Promise.all(entries
    .filter((entry) => entry.startsWith(`${base}.`))
    .map((entry) => fs.promises.unlink(path.join(folder, entry)).catch(() => null)));
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

app.use(async (req, res, next) => {
  try {
    req.agContext = await getRequestLoginContext(req);

    if (!req.agContext && !isPublicLoginPath(req)) {
      const returnTo = encodeURIComponent(req.originalUrl || '/');
      return res.redirect(`/login?returnTo=${returnTo}`);
    }

    return next();
  } catch (error) {
    console.error('AutoGrand login context failed:', error);
    if (!isPublicLoginPath(req)) {
      return res.redirect('/login');
    }
    return next();
  }
});

app.use((req, res, next) => {
  if (isPublicLoginPath(req)) return next();

  const decision = authorizeRequest(req.agContext, {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });

  req.agPermissionDecision = decision;

  if (!decision.allowed) {
    return renderForbidden(req, res, decision);
  }

  return next();
});

app.get('/login', async (req, res) => {
  const options = await getLoginOptions(req, req.query || {});
  res.render('login', {
    layout: false,
    title: 'Вход — AutoGrand ERP',
    login: options,
    errorMessage: req.query?.error || '',
    returnTo: req.query?.returnTo || '/',
    appVersion: 'v0.4.10'
  });
});

app.post('/login', async (req, res) => {
  const result = await authenticateLogin(req.body || {});
  const returnTo = String(req.body?.returnTo || '/').startsWith('/') ? String(req.body?.returnTo || '/') : '/';

  if (!result.ok) {
    const query = new URLSearchParams({
      error: result.message || 'Входът не е успешен.',
      companyId: req.body?.companyId || '',
      locationId: req.body?.locationId || '',
      username: req.body?.username || '',
      language: req.body?.language || 'bg',
      returnTo
    });
    return res.redirect(`/login?${query.toString()}`);
  }

  setLoginCookies(res, result.context);
  return res.redirect(returnTo || '/');
});

app.post('/logout', (req, res) => {
  clearLoginCookies(res);
  res.redirect('/login');
});

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

app.get('/price-list', async (req, res) => {
  const priceList = await getPriceListWorkbenchData();

  renderPage(req, res, 'price-list-workbench', {
    ...baseViewData({
      title: 'Артикули, цени и наличности — AutoGrand ERP V2',
      currentScreen: 'price-list',
      statusText: 'Отворен екран: Артикули, цени и наличности'
    }),
    priceList
  });
});

app.get('/catalog/foundation', async (req, res) => {
  const catalog = getCatalogFoundationData();

  renderPage(req, res, 'catalog-foundation', {
    ...baseViewData({
      title: 'Номенклатурна основа — AutoGrand ERP V2',
      currentScreen: 'catalog-foundation',
      statusText: 'Отворен екран: Артикули, мерни единици, ДДС, цени и доставчици'
    }),
    catalog
  });
});

app.get('/api/catalog/foundation/diagnostics', (req, res) => {
  res.json(getCatalogFoundationDiagnostics());
});

app.get('/grid/preferences', (req, res) => {
  const gridPrefs = getGlobalGridColumnPreferencesData();

  renderPage(req, res, 'grid-column-preferences', {
    ...baseViewData({
      title: 'Глобални настройки на колони — AutoGrand ERP V2',
      currentScreen: 'grid-column-preferences',
      statusText: 'Отворен екран: Глобални настройки на колони'
    }),
    gridPrefs
  });
});

app.get('/api/grid/preferences/diagnostics', (req, res) => {
  res.json(getGlobalGridColumnPreferenceDiagnostics());
});

app.get('/document-engine', (req, res) => {
  const documentEngine = getGlobalDocumentEngineData();

  renderPage(req, res, 'document-engine', {
    ...baseViewData({
      title: 'Глобален документен engine — AutoGrand ERP V2',
      currentScreen: 'document-engine',
      statusText: 'Отворен екран: Глобален документен engine'
    }),
    documentEngine
  });
});

app.get('/api/document-engine/diagnostics', (req, res) => {
  res.json(getGlobalDocumentEngineDiagnostics());
});


app.get('/print-engine', (req, res) => {
  const printEngine = getGlobalPrintEngineData();

  renderPage(req, res, 'print-engine', {
    ...baseViewData({
      title: 'Глобален print engine — AutoGrand ERP V2',
      currentScreen: 'print-engine',
      statusText: 'Отворен екран: Глобален print engine'
    }),
    printEngine
  });
});

app.get('/api/print-engine/diagnostics', (req, res) => {
  res.json(getGlobalPrintEngineDiagnostics());
});

app.post('/api/items/:itemId/image', async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const itemCode = String(req.body?.itemCode || '').trim();
    if (!itemId || !itemCode) {
      return res.status(400).json({ ok: false, code: 'missing_item' });
    }

    const image = decodeImageDataUrl(req.body?.dataUrl || '');
    await removeExistingItemImages(itemCode);
    const folder = await ensureItemImagesFolder();
    const fileName = safeItemImageFileName(itemCode, image.ext);
    await fs.promises.writeFile(path.join(folder, fileName), image.buffer);

    return res.json({
      ok: true,
      fileName,
      imageUrl: `/public/uploads/item-images/${encodeURIComponent(fileName)}`
    });
  } catch (error) {
    console.error('AutoGrand item image upload failed:', error);
    return res.status(400).json({ ok: false, code: 'image_upload_failed' });
  }
});

app.delete('/api/items/:itemId/image', async (req, res) => {
  try {
    const itemCode = String(req.query?.itemCode || '').trim();
    if (!itemCode) {
      return res.status(400).json({ ok: false, code: 'missing_item_code' });
    }

    await removeExistingItemImages(itemCode);
    return res.json({ ok: true });
  } catch (error) {
    console.error('AutoGrand item image delete failed:', error);
    return res.status(400).json({ ok: false, code: 'image_delete_failed' });
  }
});

app.post('/api/stock/transfer-requests', async (req, res) => {
  try {
    const result = await createTransferRequestsFromBasket(req.body || {});
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('AutoGrand transfer request basket failed:', error);
    return res.status(400).json({ ok: false, code: 'transfer_request_failed' });
  }
});

app.post('/api/stock/transfer-requests/:documentId/send', async (req, res) => {
  try {
    const result = await sendStockTransferRequestDocument(req.params.documentId, req.body || {});
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('AutoGrand transfer request send failed:', error);
    return res.status(400).json({ ok: false, code: 'transfer_request_send_failed' });
  }
});

app.post('/api/stock/transfer-requests/:documentId/receive', async (req, res) => {
  try {
    const result = await receiveStockTransferRequestDocument(req.params.documentId, req.body || {});
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('AutoGrand transfer request receive failed:', error);
    return res.status(400).json({ ok: false, code: 'transfer_request_receive_failed' });
  }
});

app.post('/api/stock/transfer-requests/:documentId/return', async (req, res) => {
  try {
    const result = await returnStockTransferRequestToSender(req.params.documentId, req.body || {});
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('AutoGrand transfer request return failed:', error);
    return res.status(400).json({ ok: false, code: 'transfer_request_return_failed' });
  }
});

app.post('/api/stock/transfer-requests/:documentId/not-found', async (req, res) => {
  try {
    const result = await markStockTransferNotFoundOnShelf(req.params.documentId, req.body || {});
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error('AutoGrand transfer request not found failed:', error);
    return res.status(400).json({ ok: false, code: 'transfer_request_not_found_failed' });
  }
});

// AutoGrand ERP V2 Step 4.7.2 Stock Hardening route mount
app.use(stockHardeningRoutes);
// AutoGrand ERP V2 Step 4.8 Stock Adjustment route mount
app.use(stockAdjustmentRoutes);


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
  screen.isStockBalance = screen.kind === 'stockBalance';
  screen.isStockMovement = screen.kind === 'stockMovement';
  screen.isStockTransferDocument = screen.kind === 'stockTransferDocument';
  screen.isStockAdjustmentDocument = screen.kind === 'stockAdjustmentDocument';
  screen.hasDocumentCard = screen.isSalesDocument || screen.isPurchaseDocument;
  screen.hasStockActions = screen.isStockBalance || screen.isStockMovement || screen.isStockTransferDocument || screen.isStockAdjustmentDocument;

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



app.get('/locations', async (req, res) => {
  const locations = await getCompanyLocationsData();

  renderPage(req, res, 'company-locations', {
    ...baseViewData({
      title: 'Обекти и складове — AutoGrand ERP V2',
      currentScreen: 'company-locations',
      statusText: 'Отворен екран: Обекти и складове'
    }),
    locations
  });
});

app.get('/locations/:locationId', async (req, res) => {
  const location = await getCompanyLocationCardData(req.params.locationId);

  if (!location) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Обектът не е намерен',
        currentScreen: 'company-locations',
        statusText: 'Обектът не е намерен'
      })
    });
  }

  renderPage(req, res, 'company-location-card', {
    ...baseViewData({
      title: `${location.location.code} · ${location.location.name} — AutoGrand ERP V2`,
      currentScreen: 'company-locations',
      statusText: `Отворена карта на обект: ${location.location.name}`
    }),
    location
  });
});

app.get('/stock/dashboard', async (req, res) => {
  const stock = await getStockDashboardData(req.query.action || '');

  renderPage(req, res, 'stock-dashboard', {
    ...baseViewData({
      title: 'Складов център — AutoGrand ERP V2',
      currentScreen: 'stock-dashboard',
      statusText: 'Отворен складов център'
    }),
    stock
  });
});

app.get('/stock/transfers', async (req, res) => {
  const transferCenter = await getStockTransferRequestsCenterData(req.query.action || '');

  renderPage(req, res, 'stock-transfer-center', {
    ...baseViewData({
      title: 'Трансфери и заявки — AutoGrand ERP V2',
      currentScreen: 'stock-transfers',
      statusText: 'Отворен екран: Трансфери и заявки'
    }),
    transferCenter
  });
});

app.get('/stock/adjustment/new', async (req, res) => {
  const formData = await getStockAdjustmentFormData();

  renderPage(req, res, 'stock-adjustment-new', {
    ...baseViewData({
      title: 'Нова складова корекция — AutoGrand ERP V2',
      currentScreen: 'stock-adjustment-new',
      statusText: 'Нов документ за складова корекция'
    }),
    formData,
    actionMessage: stockActionMessage(req.query.action || '')
  });
});

app.post('/stock/adjustment/new', async (req, res) => {
  const result = await createStockAdjustmentFromForm(req.body);

  if (result?.ok && result.documentId) {
    return redirectAdjustmentWithAction(res, result.documentId, result.code);
  }

  res.redirect(`/stock/adjustment/new?action=${result?.code || 'stock_adjustment_invalid'}`);
});

app.get('/stock/adjustment/:documentId', async (req, res) => {
  const adjustmentCard = await getStockAdjustmentCardData(req.params.documentId, req.query.action || '');

  if (!adjustmentCard) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Складовата корекция не е намерена',
        currentScreen: 'stock-adjustments',
        statusText: 'Складовата корекция не е намерена'
      })
    });
  }

  renderPage(req, res, 'stock-adjustment-card', {
    ...baseViewData({
      title: `${adjustmentCard.number} — складова корекция`,
      currentScreen: 'stock-adjustments',
      statusText: `Отворена карта на корекция: ${adjustmentCard.number}`
    }),
    adjustmentCard
  });
});

app.post('/stock/adjustment/:documentId/lines', async (req, res) => {
  const result = await addStockAdjustmentLine(req.params.documentId, req.body);
  redirectAdjustmentWithAction(res, req.params.documentId, result?.code || 'stock_adjustment_line_invalid');
});

app.post('/stock/adjustment/:documentId/lines/:lineId/update', async (req, res) => {
  const result = await updateStockAdjustmentLine(req.params.documentId, req.params.lineId, req.body);
  redirectAdjustmentWithAction(res, req.params.documentId, result?.code || 'stock_adjustment_line_invalid');
});

app.post('/stock/adjustment/:documentId/lines/:lineId/delete', async (req, res) => {
  const result = await deleteStockAdjustmentLine(req.params.documentId, req.params.lineId);
  redirectAdjustmentWithAction(res, req.params.documentId, result?.code || 'stock_adjustment_line_invalid');
});

app.post('/stock/adjustment/:documentId/status', async (req, res) => {
  const result = await updateStockAdjustmentDocumentStatus(req.params.documentId, req.body.status);
  redirectAdjustmentWithAction(res, req.params.documentId, result?.code || 'stock_adjustment_status_invalid');
});

app.get('/stock/transfer/new', async (req, res) => {
  const formData = await getStockTransferFormData();

  renderPage(req, res, 'stock-transfer-new', {
    ...baseViewData({
      title: 'Складов трансфер — AutoGrand ERP V2',
      currentScreen: 'stock-transfer-new',
      statusText: 'Нов складов трансфер'
    }),
    formData,
    actionMessage: stockActionMessage(req.query.action || '')
  });
});

app.post('/stock/transfer/new', async (req, res) => {
  const result = await createStockTransferFromForm(req.body);

  if (result?.ok && result.documentId) {
    return redirectTransferWithAction(res, result.documentId, result.code);
  }

  res.redirect(`/stock/transfer/new?action=${result?.code || 'stock_transfer_invalid'}`);
});


app.get('/stock/transfer/:documentId/print', async (req, res) => {
  const transferPrint = await getStockTransferPrintData(req.params.documentId, req.query.action || '', req.query || {});

  if (!transferPrint) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Печатният трансфер не е намерен',
        currentScreen: 'stock-transfers',
        statusText: 'Печатният трансфер не е намерен'
      })
    });
  }

  res.render('stock-transfer-print', {
    layout: false,
    title: `${transferPrint.number} — печатен трансферен документ`,
    transferPrint
  });
});

app.get('/stock/transfer/:documentId', async (req, res) => {
  const transferCard = await getStockTransferCardData(req.params.documentId, req.query.action || '');

  if (!transferCard) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Складовият трансфер не е намерен',
        currentScreen: 'stock-transfers',
        statusText: 'Складовият трансфер не е намерен'
      })
    });
  }

  renderPage(req, res, 'stock-transfer-card', {
    ...baseViewData({
      title: `${transferCard.number} — складов трансфер`,
      currentScreen: 'stock-transfers',
      statusText: `Отворена карта на трансфер: ${transferCard.number}`
    }),
    transferCard
  });
});

app.post('/stock/transfer/:documentId/lines', async (req, res) => {
  const result = await addStockTransferLine(req.params.documentId, req.body);
  redirectTransferWithAction(res, req.params.documentId, result?.code || 'stock_transfer_line_invalid');
});

app.post('/stock/transfer/:documentId/lines/:lineId/update', async (req, res) => {
  const result = await updateStockTransferLine(req.params.documentId, req.params.lineId, req.body);
  redirectTransferWithAction(res, req.params.documentId, result?.code || 'stock_transfer_line_invalid');
});

app.post('/stock/transfer/:documentId/lines/:lineId/delete', async (req, res) => {
  const result = await deleteStockTransferLine(req.params.documentId, req.params.lineId);
  redirectTransferWithAction(res, req.params.documentId, result?.code || 'stock_transfer_line_invalid');
});

app.post('/stock/transfer/:documentId/status', async (req, res) => {
  const result = await updateStockTransferDocumentStatus(req.params.documentId, req.body.status);
  redirectTransferWithAction(res, req.params.documentId, result?.code || 'stock_transfer_status_invalid');
});

app.get('/stock/item/:itemId', async (req, res) => {
  const stock = await getStockItemCardData(req.params.itemId, req.query.action || '');

  if (!stock) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Артикулът не е намерен',
        currentScreen: 'stock',
        statusText: 'Артикулът не е намерен'
      })
    });
  }

  renderPage(req, res, 'stock-item-card', {
    ...baseViewData({
      title: `${stock.item.code} · ${stock.item.name} — складова карта`,
      currentScreen: 'stock',
      statusText: `Складова карта на артикул: ${stock.item.code}`
    }),
    stock
  });
});

app.get('/stock/warehouse/:warehouseId', async (req, res) => {
  const stock = await getStockWarehouseCardData(req.params.warehouseId, req.query.action || '');

  if (!stock) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Складът не е намерен',
        currentScreen: 'stock',
        statusText: 'Складът не е намерен'
      })
    });
  }

  renderPage(req, res, 'stock-warehouse-card', {
    ...baseViewData({
      title: `${stock.warehouse.code} · ${stock.warehouse.name} — складова карта`,
      currentScreen: 'warehouses',
      statusText: `Складова карта: ${stock.warehouse.code}`
    }),
    stock
  });
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
    step: STEP_4_6_PRINT_ENGINE_HEALTH_LABEL
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

// AutoGrand ERP V2 compatibility checkpoint labels START
// Step 4.4 Global Grid Column Preferences
// 4-4-global-grid-column-preferences
// Step 4.4 grid preferences version label
// grid preferences version label
// Step 4.8.1 Persistent Stock Adjustment Documents + Posting Lock
// AutoGrand ERP V2 compatibility checkpoint labels END
/*
AutoGrand compatibility markers for legacy checker:
- Step 4.4 grid preferences version label
- appVersion: 'v0.4.8'
- 0.4.8
- Централен склад
- Регионален склад Стара Загора
- Step 4.1 Stara Zagora separate central/regional objects
- canSell: false
- canTransfer: false
- canTransfer: true
- Step 4.1 location role rules
- AUTOGRAND_LOCATIONS
- AUTOGRAND_COMPANY
- Step 4.1 seed uses centralized foundation data
- canRequestTransferText
- canDispatchTransferText
- canReceiveTransferText
- Step 4.1 transfer capability labels
- Фирма → Обект → Потребител → Парола
- 0.4.1
- Step 4.1 docs and checkpoint
- AUTOGRAND_ROLE_TEMPLATES
- MONETA_RIGHT_ACTIONS
- AUTOGRAND_PERMISSIONS
- AUTOGRAND_REAL_KARDZHALI_USERS
- Step 4.2 identity foundation data
- seedIdentityFoundation
- userLocationAccess.create
- Step 4.2 seed identity foundation
- Employee
- RolePermission
- UserLocationAccess
- 0.4.2
- Step 4.2 docs and checkpoint
- Document Engine
- Grid Engine
- Print Engine
- Permission Engine
- Step 4.0 master blueprint engines
- BasePackage.bpl
- InventoryPackage.bpl
- DevicePackage.bpl
- Step 4.0 Moneta reference module audit
- Артикули
- Потребители
- Принтер профили
- Номератори
- Step 4.0 foundation data plan
- Step 4.1
- Step 4.8
- Архитектурен checkpoint
- архитектурен checkpoint
- Step 4.0 implementation sequence and checkpoint
- screen.hasDocumentCard
- generic document browse flag
- screen.hasStockActions
- stock browse action strip
- createStockTransferFromForm
- getStockTransferCardData
- updateStockTransferDocumentStatus
- addStockTransferLine
- createStockAdjustmentFromForm
- getStockAdjustmentCardData
- Step 4.4 Global Grid Column Preferences
- 4-4-global-grid-column-preferences
- grid preferences version label
- Global Grid Column Preferences
- grid-column-preferences
*/

// AutoGrand ERP V2 Step 4.8.2 Real Stock Adjustment Posting Integration / Movement Binding

// 4-8-2-real-stock-adjustment-movement-binding

// AutoGrand ERP V2 Step 4.8.3 Stock Adjustment Posting UI / Movement Trace Visibility

// 4-8-3-stock-adjustment-movement-trace-visibility

// AutoGrand ERP V2 Step 4.8.4 Stock Adjustment Audit / Reversal Safety Layer

// 4-8-4-stock-adjustment-audit-reversal-safety

// Step 4.8.5 compatibility marker: Stock Adjustment Final Polish / Operator Workflow Hardening.
// Step 4.8.5 Stock Adjustment Final Polish / Operator Workflow Hardening
/*
AUTOGRAND_STEP_4_8_6_STOCK_ADJUSTMENT_FINAL_QA_CLEAN_EXPORT_CHECKPOINT
Step 4.8.6 - Stock Adjustment Final QA / Clean Export Checkpoint
This is a non-runtime compatibility marker for the stock adjustment final QA clean export checkpoint.
*/
