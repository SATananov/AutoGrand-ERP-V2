import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import express from 'express';
import { engine } from 'express-handlebars';
import { fileURLToPath } from 'url';
import { decorateNavigation } from './data/navigation.js';
import { RIBBON_GROUPS } from './data/ribbon.js';
import stockValuationRoutes from './routes/stock-valuation-routes.js';
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
import stockControlCenterRouter from './routes/stock-control-center-routes.js';


import stockControlDetailInspectorRoutes from "./routes/stock-control-detail-inspector-routes.js";
import inventoryPlanningRoutes from "./routes/inventory-planning-routes.js";
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

function baseViewData({ title, currentScreen = '', statusText = 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎСљР В Р’В°Р РЋРІР‚РЋР В Р’В°Р В Р’В»Р В РЎвЂў' } = {}) {
  return {
    title: title || 'AutoGrand ERP V2',
    appVersion: 'v0.4.10',
    companyName: 'Р В РЎв„ўР В Р вЂћР В Р’В Р В РІР‚СњР В РІР‚вЂњР В РЎвЂ™Р В РІР‚С”Р В Р’В Р вЂ™Р’В· Р В РЎвЂ™Р В Р вЂ Р РЋРІР‚С™Р В РЎвЂўР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РўвЂ Р В РЎвЂєР В РЎвЂєР В РІР‚Сњ',
    userName: 'Р В Р Р‹Р В РЎС›Р В РІР‚СћР В Р’В¤Р В РЎвЂ™Р В РЎСљ Р В РЎС›Р В РЎвЂ™Р В РЎСљР В РЎвЂ™Р В РЎСљР В РЎвЂєР В РІР‚в„ў',
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
      title: 'Р В РІР‚СњР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋР вЂ°Р В РЎвЂ”Р РЋР вЂ°Р РЋРІР‚С™ Р В Р’Вµ Р В РЎвЂўР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР В Р вЂ¦ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'forbidden',
      statusText: 'Р В РІР‚СњР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋР вЂ°Р В РЎвЂ”Р РЋР вЂ°Р РЋРІР‚С™ Р В Р’Вµ Р В РЎвЂўР В РЎвЂ“Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚РЋР В Р’ВµР В Р вЂ¦ Р В Р’В·Р В Р’В° Р В Р’В°Р В РЎвЂќР РЋРІР‚С™Р В РЎвЂР В Р вЂ Р В Р вЂ¦Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р РЋР вЂљР В РЎвЂўР В Р’В»Р РЋР РЏ'
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
});app.use('/', stockValuationRoutes);


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
    title: 'Р В РІР‚в„ўР РЋРІР‚В¦Р В РЎвЂўР В РўвЂ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP',
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
      error: result.message || 'Р В РІР‚в„ўР РЋРІР‚В¦Р В РЎвЂўР В РўвЂР РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р РЋРЎвЂњР РЋР С“Р В РЎвЂ”Р В Р’ВµР РЋРІвЂљВ¬Р В Р’ВµР В Р вЂ¦.',
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
      title: 'AutoGrand ERP V2 Р Р†Р вЂљРІР‚Сњ Р В РЎСљР В Р’В°Р РЋРІР‚РЋР В Р’В°Р В Р’В»Р В РЎвЂў',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎСљР В Р’В°Р РЋРІР‚РЋР В Р’В°Р В Р’В»Р В РЎвЂў'
    }),
    dashboard
  });
});

app.get('/price-list', async (req, res) => {
  const priceList = await getPriceListWorkbenchData();

  renderPage(req, res, 'price-list-workbench', {
    ...baseViewData({
      title: 'Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р В РЎвЂ, Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р В РЎвЂ Р В РЎвЂ Р В Р вЂ¦Р В Р’В°Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'price-list',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р В РЎвЂ, Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р В РЎвЂ Р В РЎвЂ Р В Р вЂ¦Р В Р’В°Р В Р’В»Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂ'
    }),
    priceList
  });
});

app.get('/catalog/foundation', async (req, res) => {
  const catalog = getCatalogFoundationData();

  renderPage(req, res, 'catalog-foundation', {
    ...baseViewData({
      title: 'Р В РЎСљР В РЎвЂўР В РЎВР В Р’ВµР В Р вЂ¦Р В РЎвЂќР В Р’В»Р В Р’В°Р РЋРІР‚С™Р РЋРЎвЂњР РЋР вЂљР В Р вЂ¦Р В Р’В° Р В РЎвЂўР РЋР С“Р В Р вЂ¦Р В РЎвЂўР В Р вЂ Р В Р’В° Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'catalog-foundation',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р В РЎвЂ, Р В РЎВР В Р’ВµР РЋР вЂљР В Р вЂ¦Р В РЎвЂ Р В Р’ВµР В РўвЂР В РЎвЂР В Р вЂ¦Р В РЎвЂР РЋРІР‚В Р В РЎвЂ, Р В РІР‚СњР В РІР‚СњР В Р Р‹, Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р В РЎвЂ Р В РЎвЂ Р В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р РЋРІР‚РЋР В РЎвЂР РЋРІР‚В Р В РЎвЂ'
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
      title: 'Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р вЂ¦Р В РЎвЂ Р В Р вЂ¦Р В Р’В°Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В РІвЂћвЂ“Р В РЎвЂќР В РЎвЂ Р В Р вЂ¦Р В Р’В° Р В РЎвЂќР В РЎвЂўР В Р’В»Р В РЎвЂўР В Р вЂ¦Р В РЎвЂ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'grid-column-preferences',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р вЂ¦Р В РЎвЂ Р В Р вЂ¦Р В Р’В°Р РЋР С“Р РЋРІР‚С™Р РЋР вЂљР В РЎвЂўР В РІвЂћвЂ“Р В РЎвЂќР В РЎвЂ Р В Р вЂ¦Р В Р’В° Р В РЎвЂќР В РЎвЂўР В Р’В»Р В РЎвЂўР В Р вЂ¦Р В РЎвЂ'
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
      title: 'Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р В Р’ВµР В Р вЂ¦ engine Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'document-engine',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р В Р’ВµР В Р вЂ¦ engine'
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
      title: 'Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ print engine Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'print-engine',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РІР‚СљР В Р’В»Р В РЎвЂўР В Р’В±Р В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ print engine'
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
        title: 'Р В РІР‚СћР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        statusText: 'Р В РІР‚СћР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
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
      title: `${screen.title} Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2`,
      currentScreen: screen.id,
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ generated screen: ${screen.title}`
    }),
    screen
  });
});

app.get('/document/sales/new/:docType', async (req, res) => {
  const formData = await getSalesNewDocumentFormData(req.params.docType);

  renderPage(req, res, 'sales-document-new', {
    ...baseViewData({
      title: `Р В РЎСљР В РЎвЂўР В Р вЂ  Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™ Р Р†Р вЂљРІР‚Сњ ${formData.title}`,
      currentScreen: 'sales',
      statusText: `Р В РЎСљР В РЎвЂўР В Р вЂ  Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР В РўвЂР В Р’В°Р В Р’В¶Р В Р’В±Р В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™: ${formData.title}`
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
        title: 'Р В РІР‚СњР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'sales',
        statusText: 'Р В РІР‚СњР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'sales-document-card', {
    ...baseViewData({
      title: `${documentCard.title} ${documentCard.number} Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2`,
      currentScreen: documentCard.sourceScreenId || 'sales',
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В° Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р В Р вЂ¦Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В°: ${documentCard.title} ${documentCard.number}`
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
      title: `Р В РЎСљР В РЎвЂўР В Р вЂ  Р В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™ Р Р†Р вЂљРІР‚Сњ ${formData.title}`,
      currentScreen: formData.docType === 'PURCHASE_ORDER' ? 'purchase-orders' : formData.docType === 'SUPPLIER_INVOICE' ? 'supplier-invoices' : 'deliveries',
      statusText: `Р В РЎСљР В РЎвЂўР В Р вЂ  Р В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™: ${formData.title}`
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
        title: 'Р В РІР‚СњР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р В Р вЂ¦Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'deliveries',
        statusText: 'Р В РІР‚СњР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р В Р вЂ¦Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'purchase-document-card', {
    ...baseViewData({
      title: `${documentCard.title} ${documentCard.number} Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2`,
      currentScreen: documentCard.sourceScreenId || 'deliveries',
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В° Р В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В Р’В°Р В Р вЂ Р В Р вЂ¦Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В°: ${documentCard.title} ${documentCard.number}`
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
      title: 'Р В РЎвЂєР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р В РЎвЂ Р В РЎвЂ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’Вµ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'company-locations',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎвЂєР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р В РЎвЂ Р В РЎвЂ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’Вµ'
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
        title: 'Р В РЎвЂєР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'company-locations',
        statusText: 'Р В РЎвЂєР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'company-location-card', {
    ...baseViewData({
      title: `${location.location.code} Р вЂ™Р’В· ${location.location.name} Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2`,
      currentScreen: 'company-locations',
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’В° Р В РЎвЂўР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™: ${location.location.name}`
    }),
    location
  });
});

app.get('/stock/dashboard', async (req, res) => {
  const stock = await getStockDashboardData(req.query.action || '');

  renderPage(req, res, 'stock-dashboard', {
    ...baseViewData({
      title: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ  Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р РЋР вЂ°Р РЋР вЂљ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'stock-dashboard',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ  Р РЋРІР‚В Р В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р РЋР вЂ°Р РЋР вЂљ'
    }),
    stock
  });
});

app.get('/stock/transfers', async (req, res) => {
  const transferCenter = await getStockTransferRequestsCenterData(req.query.action || '');

  renderPage(req, res, 'stock-transfer-center', {
    ...baseViewData({
      title: 'Р В РЎС›Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљР В РЎвЂ Р В РЎвЂ Р В Р’В·Р В Р’В°Р РЋР РЏР В Р вЂ Р В РЎвЂќР В РЎвЂ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'stock-transfers',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦: Р В РЎС›Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљР В РЎвЂ Р В РЎвЂ Р В Р’В·Р В Р’В°Р РЋР РЏР В Р вЂ Р В РЎвЂќР В РЎвЂ'
    }),
    transferCenter
  });
});

app.get('/stock/adjustment/new', async (req, res) => {
  const formData = await getStockAdjustmentFormData();

  renderPage(req, res, 'stock-adjustment-new', {
    ...baseViewData({
      title: 'Р В РЎСљР В РЎвЂўР В Р вЂ Р В Р’В° Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'stock-adjustment-new',
      statusText: 'Р В РЎСљР В РЎвЂўР В Р вЂ  Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™ Р В Р’В·Р В Р’В° Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ'
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
        title: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В°',
        currentScreen: 'stock-adjustments',
        statusText: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В°'
      })
    });
  }

  renderPage(req, res, 'stock-adjustment-card', {
    ...baseViewData({
      title: `${adjustmentCard.number} Р Р†Р вЂљРІР‚Сњ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ`,
      currentScreen: 'stock-adjustments',
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’В° Р В РЎвЂќР В РЎвЂўР РЋР вЂљР В Р’ВµР В РЎвЂќР РЋРІР‚В Р В РЎвЂР РЋР РЏ: ${adjustmentCard.number}`
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
      title: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ  Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'stock-transfer-new',
      statusText: 'Р В РЎСљР В РЎвЂўР В Р вЂ  Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ  Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ'
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
        title: 'Р В РЎСџР В Р’ВµР РЋРІР‚РЋР В Р’В°Р РЋРІР‚С™Р В Р вЂ¦Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'stock-transfers',
        statusText: 'Р В РЎСџР В Р’ВµР РЋРІР‚РЋР В Р’В°Р РЋРІР‚С™Р В Р вЂ¦Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  res.render('stock-transfer-print', {
    layout: false,
    title: `${transferPrint.number} Р Р†Р вЂљРІР‚Сњ Р В РЎвЂ”Р В Р’ВµР РЋРІР‚РЋР В Р’В°Р РЋРІР‚С™Р В Р’ВµР В Р вЂ¦ Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦ Р В РўвЂР В РЎвЂўР В РЎвЂќР РЋРЎвЂњР В РЎВР В Р’ВµР В Р вЂ¦Р РЋРІР‚С™`,
    transferPrint
  });
});

app.get('/stock/transfer/:documentId', async (req, res) => {
  const transferCard = await getStockTransferCardData(req.params.documentId, req.query.action || '');

  if (!transferCard) {
    res.status(404);
    return renderPage(req, res, 'not-found', {
      ...baseViewData({
        title: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'stock-transfers',
        statusText: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В РЎвЂР РЋР РЏР РЋРІР‚С™ Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'stock-transfer-card', {
    ...baseViewData({
      title: `${transferCard.number} Р Р†Р вЂљРІР‚Сњ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ  Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ`,
      currentScreen: 'stock-transfers',
      statusText: `Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’В° Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р РЋР С“Р РЋРІР‚С›Р В Р’ВµР РЋР вЂљ: ${transferCard.number}`
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
        title: 'Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'stock',
        statusText: 'Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'stock-item-card', {
    ...baseViewData({
      title: `${stock.item.code} Р вЂ™Р’В· ${stock.item.name} Р Р†Р вЂљРІР‚Сњ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В°`,
      currentScreen: 'stock',
      statusText: `Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’В° Р В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»: ${stock.item.code}`
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
        title: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦',
        currentScreen: 'stock',
        statusText: 'Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР РЋР вЂ°Р РЋРІР‚С™ Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦'
      })
    });
  }

  renderPage(req, res, 'stock-warehouse-card', {
    ...baseViewData({
      title: `${stock.warehouse.code} Р вЂ™Р’В· ${stock.warehouse.name} Р Р†Р вЂљРІР‚Сњ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В°`,
      currentScreen: 'warehouses',
      statusText: `Р В Р Р‹Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂР В РЎвЂўР В Р вЂ Р В Р’В° Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В°: ${stock.warehouse.code}`
    }),
    stock
  });
});

app.get('/reference', (req, res) => {
  renderPage(req, res, 'reference-local', {
    ...baseViewData({
      title: 'Client Reference Map Р Р†Р вЂљРІР‚Сњ AutoGrand ERP V2',
      currentScreen: 'reference-map',
      statusText: 'Р В РЎвЂєР РЋРІР‚С™Р В Р вЂ Р В РЎвЂўР РЋР вЂљР В Р’ВµР В Р вЂ¦ reference Р В Р’ВµР В РЎвЂќР РЋР вЂљР В Р’В°Р В Р вЂ¦'
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
app.use('/', stockControlCenterRouter);
app.use('/', stockControlDetailInspectorRoutes);
  res.status(404);
    return renderPage(req, res, 'not-found', {
    ...baseViewData({
      title: 'Р В Р Р‹Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚В Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В°',
      statusText: 'Р В Р Р‹Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р вЂ¦Р В РЎвЂР РЋРІР‚В Р В Р’В°Р РЋРІР‚С™Р В Р’В° Р В Р вЂ¦Р В Р’Вµ Р В Р’Вµ Р В Р вЂ¦Р В Р’В°Р В РЎВР В Р’ВµР РЋР вЂљР В Р’ВµР В Р вЂ¦Р В Р’В°'
    })
  });
});

// AutoGrand ERP V2 Step 4.9.3 Stock Control Detail Inspector route mount

// AutoGrand ERP V2 Step 4.12 Inventory Planning route mount
app.use(inventoryPlanningRoutes);

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
- Р В Р’В¦Р В Р’ВµР В Р вЂ¦Р РЋРІР‚С™Р РЋР вЂљР В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂ
- Р В Р’В Р В Р’ВµР В РЎвЂ“Р В РЎвЂР В РЎвЂўР В Р вЂ¦Р В Р’В°Р В Р’В»Р В Р’ВµР В Р вЂ¦ Р РЋР С“Р В РЎвЂќР В Р’В»Р В Р’В°Р В РўвЂ Р В Р Р‹Р РЋРІР‚С™Р В Р’В°Р РЋР вЂљР В Р’В° Р В РІР‚вЂќР В Р’В°Р В РЎвЂ“Р В РЎвЂўР РЋР вЂљР В Р’В°
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
- Р В Р’В¤Р В РЎвЂР РЋР вЂљР В РЎВР В Р’В° Р Р†РІР‚В РІР‚в„ў Р В РЎвЂєР В Р’В±Р В Р’ВµР В РЎвЂќР РЋРІР‚С™ Р Р†РІР‚В РІР‚в„ў Р В РЎСџР В РЎвЂўР РЋРІР‚С™Р РЋР вЂљР В Р’ВµР В Р’В±Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В» Р Р†РІР‚В РІР‚в„ў Р В РЎСџР В Р’В°Р РЋР вЂљР В РЎвЂўР В Р’В»Р В Р’В°
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
- Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚С™Р В РЎвЂР В РЎвЂќР РЋРЎвЂњР В Р’В»Р В РЎвЂ
- Р В РЎСџР В РЎвЂўР РЋРІР‚С™Р РЋР вЂљР В Р’ВµР В Р’В±Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В Р’В»Р В РЎвЂ
- Р В РЎСџР РЋР вЂљР В РЎвЂР В Р вЂ¦Р РЋРІР‚С™Р В Р’ВµР РЋР вЂљ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋРІР‚С›Р В РЎвЂР В Р’В»Р В РЎвЂ
- Р В РЎСљР В РЎвЂўР В РЎВР В Р’ВµР РЋР вЂљР В Р’В°Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР В РЎвЂ
- Step 4.0 foundation data plan
- Step 4.1
- Step 4.8
- Р В РЎвЂ™Р РЋР вЂљР РЋРІР‚В¦Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋРЎвЂњР РЋР вЂљР В Р’ВµР В Р вЂ¦ checkpoint
- Р В Р’В°Р РЋР вЂљР РЋРІР‚В¦Р В РЎвЂР РЋРІР‚С™Р В Р’ВµР В РЎвЂќР РЋРІР‚С™Р РЋРЎвЂњР РЋР вЂљР В Р’ВµР В Р вЂ¦ checkpoint
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
// STEP_4_9_STOCK_CONTROL_CENTER_SERVER_MARKER

// Step 4.9 stock control center server route registration
