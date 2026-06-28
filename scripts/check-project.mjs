import fs from 'fs';
import path from 'path';
// Step 4.7.4.1 repair: Step 4.6 checks need printEngineData to be defined.
// Keep this self-contained so the check script remains stable in Node ESM.
const __agStep4741Fs = await import('node:fs');
const __agStep4741Path = await import('node:path');
const __agStep4741ReadText = (relativePath) => {
  const fullPath = __agStep4741Path.join(process.cwd(), ...relativePath.split('/'));
  return __agStep4741Fs.existsSync(fullPath) ? __agStep4741Fs.readFileSync(fullPath, 'utf8') : '';
};
const printEngineData = [
  __agStep4741ReadText('src/data/autogrand-print-engine-foundation.js'),
  __agStep4741ReadText('src/data/autogrand-print-engine-data.js'),
  __agStep4741ReadText('src/services/print-engine-service.js'),
  __agStep4741ReadText('public/js/ag-print-engine.js'),
  __agStep4741ReadText('views/pages/print-engine.hbs')
].join('\n');

const required = [
  'src/server.js',
  'src/services/sales-actions-service.js',
  'src/services/sales-document-card-service.js',
  'src/services/purchase-actions-service.js',
  'src/services/purchase-document-card-service.js',
  'src/services/stock-actions-service.js',
  'src/services/company-locations-service.js',
  'src/services/price-list-workbench-service.js',
  'src/services/catalog-foundation-service.js',
  'src/data/autogrand-catalog-foundation.js',
  'views/pages/sales-document-card.hbs',
  'views/pages/purchase-document-card.hbs',
  'views/pages/purchase-document-new.hbs',
  'views/pages/stock-dashboard.hbs',
  'views/pages/stock-adjustment-new.hbs',
  'views/pages/stock-adjustment-card.hbs',
  'views/pages/stock-transfer-new.hbs',
  'views/pages/stock-transfer-card.hbs',
  'views/pages/stock-transfer-center.hbs',
  'views/pages/stock-transfer-print.hbs',
  'views/pages/stock-item-card.hbs',
  'views/pages/stock-warehouse-card.hbs',
  'views/pages/company-locations.hbs',
  'views/pages/company-location-card.hbs',
  'views/pages/price-list-workbench.hbs',
  'views/pages/catalog-foundation.hbs',
  'views/pages/screen-browse.hbs',
  'public/js/app.js',
  'public/css/styles.css',
  'docs/blueprints/AUTOGRAND_ERP_MASTER_BLUEPRINT_BG.md',
  'docs/blueprints/MONETA_REFERENCE_AUDIT_BG.md',
  'docs/blueprints/CORE_FOUNDATION_DATA_PLAN_BG.md',
  'docs/blueprints/IMPLEMENTATION_SEQUENCE_BG.md',
  'docs/checkpoints/STEP_4_0_MASTER_BLUEPRINT_MONETA_AUDIT_BG.md',
  'src/data/autogrand-foundation.js',
  'src/data/autogrand-identity-foundation.js',
  'docs/steps/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_BG.md',
  'docs/checkpoints/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_CLEAN_EXPORT_BG.md',
  'docs/steps/STEP_4_2_USERS_EMPLOYEES_ROLES_PERMISSIONS_BG.md',
  'docs/checkpoints/STEP_4_2_USERS_EMPLOYEES_ROLES_PERMISSIONS_CLEAN_EXPORT_BG.md',
  'docs/steps/STEP_4_2_1_REAL_KARDZHALI_USERS_SEED_BG.md',
  'docs/checkpoints/STEP_4_2_1_REAL_KARDZHALI_USERS_SEED_CLEAN_EXPORT_BG.md',
  'src/services/login-context-service.js',
  'src/services/permission-service.js',
  'views/pages/login.hbs',
  'views/pages/forbidden.hbs',
  'docs/steps/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_BG.md',
  'docs/checkpoints/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_CLEAN_EXPORT_BG.md',
  'docs/steps/STEP_4_3_1_LOGIN_CONTEXT_ROLE_VISIBILITY_POLISH_BG.md',
  'docs/checkpoints/STEP_4_3_1_LOGIN_CONTEXT_ROLE_VISIBILITY_POLISH_CLEAN_EXPORT_BG.md',
  'docs/steps/STEP_4_2_4_RUNTIME_PERMISSION_GUARDS_BG.md',
  'docs/checkpoints/STEP_4_2_4_RUNTIME_PERMISSION_GUARDS_CLEAN_EXPORT_BG.md',
  'docs/steps/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_BG.md',
  'docs/checkpoints/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_CLEAN_EXPORT_BG.md',
  'src/services/grid-column-preferences-service.js',
  'public/js/ag-grid-column-preferences.js',
  'views/pages/grid-column-preferences.hbs',
  'docs/steps/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_BG.md',
  'docs/checkpoints/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_CLEAN_EXPORT_BG.md',
  'src/data/autogrand-document-engine-foundation.js',
  'src/services/document-engine-service.js',
  'public/js/ag-document-engine.js',
  'views/pages/document-engine.hbs',
  'docs/steps/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_BG.md',
  'docs/checkpoints/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_CLEAN_EXPORT_BG.md'
];

let ok = true;

for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`MISSING: ${file}`);
    ok = false;
  } else {
    console.log(`OK: ${file}`);
  }
}

const server = fs.readFileSync(path.resolve('src/server.js'), 'utf8');
const salesActions = fs.readFileSync(path.resolve('src/services/sales-actions-service.js'), 'utf8');
const salesCard = fs.readFileSync(path.resolve('src/services/sales-document-card-service.js'), 'utf8');
const purchaseActions = fs.readFileSync(path.resolve('src/services/purchase-actions-service.js'), 'utf8');
const purchaseCard = fs.readFileSync(path.resolve('src/services/purchase-document-card-service.js'), 'utf8');
const browse = fs.readFileSync(path.resolve('views/pages/screen-browse.hbs'), 'utf8');
const stockActions = fs.readFileSync(path.resolve('src/services/stock-actions-service.js'), 'utf8');
const stockDashboard = fs.readFileSync(path.resolve('views/pages/stock-dashboard.hbs'), 'utf8');
const stockTransferCenter = fs.readFileSync(path.resolve('views/pages/stock-transfer-center.hbs'), 'utf8');
const stockTransferPrint = fs.readFileSync(path.resolve('views/pages/stock-transfer-print.hbs'), 'utf8');
const companyLocations = fs.readFileSync(path.resolve('src/services/company-locations-service.js'), 'utf8');
const appJs = fs.readFileSync(path.resolve('public/js/app.js'), 'utf8');
const seedText = fs.readFileSync(path.resolve('scripts/seed-prisma.js'), 'utf8');
const masterBlueprint = fs.readFileSync(path.resolve('docs/blueprints/AUTOGRAND_ERP_MASTER_BLUEPRINT_BG.md'), 'utf8');
const monetaAudit = fs.readFileSync(path.resolve('docs/blueprints/MONETA_REFERENCE_AUDIT_BG.md'), 'utf8');
const foundationPlan = fs.readFileSync(path.resolve('docs/blueprints/CORE_FOUNDATION_DATA_PLAN_BG.md'), 'utf8');
const implementationSequence = fs.readFileSync(path.resolve('docs/blueprints/IMPLEMENTATION_SEQUENCE_BG.md'), 'utf8');
const step40Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_0_MASTER_BLUEPRINT_MONETA_AUDIT_BG.md'), 'utf8');
const autograndFoundation = fs.readFileSync(path.resolve('src/data/autogrand-foundation.js'), 'utf8');
const autograndIdentity = fs.readFileSync(path.resolve('src/data/autogrand-identity-foundation.js'), 'utf8');
const step41Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_BG.md'), 'utf8');
const step41Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_1_COMPANY_REAL_LOCATIONS_FOUNDATION_CLEAN_EXPORT_BG.md'), 'utf8');
const step42Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_2_USERS_EMPLOYEES_ROLES_PERMISSIONS_BG.md'), 'utf8');
const step42Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_2_USERS_EMPLOYEES_ROLES_PERMISSIONS_CLEAN_EXPORT_BG.md'), 'utf8');
const step421Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_2_1_REAL_KARDZHALI_USERS_SEED_BG.md'), 'utf8');
const step421Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_2_1_REAL_KARDZHALI_USERS_SEED_CLEAN_EXPORT_BG.md'), 'utf8');
const loginContextService = fs.readFileSync(path.resolve('src/services/login-context-service.js'), 'utf8');
const permissionService = fs.readFileSync(path.resolve('src/services/permission-service.js'), 'utf8');
const loginView = fs.readFileSync(path.resolve('views/pages/login.hbs'), 'utf8');
const forbiddenView = fs.readFileSync(path.resolve('views/pages/forbidden.hbs'), 'utf8');
const mainLayout = fs.readFileSync(path.resolve('views/layouts/main.hbs'), 'utf8');
const step43Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_BG.md'), 'utf8');
const step43Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_3_LOGIN_CONTEXT_LIKE_MONETA_CLEAN_EXPORT_BG.md'), 'utf8');
const step431Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_3_1_LOGIN_CONTEXT_ROLE_VISIBILITY_POLISH_BG.md'), 'utf8');
const step431Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_3_1_LOGIN_CONTEXT_ROLE_VISIBILITY_POLISH_CLEAN_EXPORT_BG.md'), 'utf8');
const step424Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_2_4_RUNTIME_PERMISSION_GUARDS_BG.md'), 'utf8');
const step424Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_2_4_RUNTIME_PERMISSION_GUARDS_CLEAN_EXPORT_BG.md'), 'utf8');
const packageJson = fs.readFileSync(path.resolve('package.json'), 'utf8');

const adjustmentCard = fs.readFileSync(path.resolve('views/pages/stock-adjustment-card.hbs'), 'utf8');
const priceListWorkbench = fs.readFileSync(path.resolve('views/pages/price-list-workbench.hbs'), 'utf8');
const priceListService = fs.readFileSync(path.resolve('src/services/price-list-workbench-service.js'), 'utf8');
const catalogFoundationData = fs.readFileSync(path.resolve('src/data/autogrand-catalog-foundation.js'), 'utf8');
const catalogFoundationService = fs.readFileSync(path.resolve('src/services/catalog-foundation-service.js'), 'utf8');
const catalogFoundationView = fs.readFileSync(path.resolve('views/pages/catalog-foundation.hbs'), 'utf8');
const step43CatalogDoc = fs.readFileSync(path.resolve('docs/steps/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_BG.md'), 'utf8');
const step43CatalogCheckpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_3_ITEMS_UNITS_VAT_PRICES_SUPPLIERS_FOUNDATION_CLEAN_EXPORT_BG.md'), 'utf8');
const gridPrefsService = fs.readFileSync(path.resolve('src/services/grid-column-preferences-service.js'), 'utf8');
const gridPrefsJs = fs.readFileSync(path.resolve('public/js/ag-grid-column-preferences.js'), 'utf8');
const gridPrefsView = fs.readFileSync(path.resolve('views/pages/grid-column-preferences.hbs'), 'utf8');
const step44Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_BG.md'), 'utf8');
const step44Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_4_GLOBAL_GRID_COLUMN_PREFERENCES_CLEAN_EXPORT_BG.md'), 'utf8');
const documentEngineData = fs.readFileSync(path.resolve('src/data/autogrand-document-engine-foundation.js'), 'utf8');
const documentEngineService = fs.readFileSync(path.resolve('src/services/document-engine-service.js'), 'utf8');
const documentEngineJs = fs.readFileSync(path.resolve('public/js/ag-document-engine.js'), 'utf8');
const documentEngineView = fs.readFileSync(path.resolve('views/pages/document-engine.hbs'), 'utf8');
const step45Doc = fs.readFileSync(path.resolve('docs/steps/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_BG.md'), 'utf8');
const step45Checkpoint = fs.readFileSync(path.resolve('docs/checkpoints/STEP_4_5_GLOBAL_DOCUMENT_ENGINE_CLEAN_EXPORT_BG.md'), 'utf8');

const checks = [
  [salesActions.includes('createSalesDocumentPayment'), 'createSalesDocumentPayment'],
  [server.includes('/document/sales/:documentId/payments'), 'sales payment route'],
  [salesCard.includes('paymentSummary'), 'sales paymentSummary'],
  [purchaseActions.includes('purchaseDocTypeMeta'), 'purchaseDocTypeMeta'],
  [purchaseActions.includes('addPurchaseDocumentLine'), 'addPurchaseDocumentLine'],
  [purchaseActions.includes('updatePurchaseDocumentStatus'), 'updatePurchaseDocumentStatus'],
  [purchaseActions.includes('PURCHASE_IN'), 'PURCHASE_IN stock movement'],
  [purchaseCard.includes('getPurchaseDocumentCardData'), 'getPurchaseDocumentCardData'],
  [server.includes('/document/purchase/new/:docType'), 'purchase new route'],
  [server.includes('/document/purchase/:documentId/status'), 'purchase status route'],
  [server.includes('STEP_4_2_4_PERMISSION_HEALTH_LABEL') && permissionService.includes('4-2-4-runtime-permission-guards-menu-route-action-guard'), 'Step 4.2.4 health label'],
  [autograndFoundation.includes('AUTOGRAND_COMPANY') && autograndFoundation.includes('Автогранд ООД') && autograndFoundation.includes('DEFAULT_LOCATION_CODE') && autograndFoundation.includes('AG-KJ-SHOP'), 'Step 4.1 AutoGrand company and default location foundation'],
  [autograndFoundation.includes('AG-STZ-CENTRAL') && autograndFoundation.includes('AG-STZ-WH') && autograndFoundation.includes('Централен склад') && autograndFoundation.includes('Регионален склад Стара Загора'), 'Step 4.1 Stara Zagora separate central/regional objects'],
  [autograndFoundation.includes("canSell: false") && autograndFoundation.includes("canTransfer: false") && autograndFoundation.includes("canTransfer: true"), 'Step 4.1 location role rules'],
  [seedText.includes('AUTOGRAND_LOCATIONS') && seedText.includes('AUTOGRAND_COMPANY'), 'Step 4.1 seed uses centralized foundation data'],
  [companyLocations.includes('canRequestTransferText') && companyLocations.includes('canDispatchTransferText') && companyLocations.includes('canReceiveTransferText'), 'Step 4.1 transfer capability labels'],
  [step41Doc.includes('Фирма → Обект → Потребител → Парола') && step41Checkpoint.includes('0.4.1'), 'Step 4.1 docs and checkpoint'],
  [autograndIdentity.includes('AUTOGRAND_ROLE_TEMPLATES') && autograndIdentity.includes('MONETA_RIGHT_ACTIONS') && autograndIdentity.includes('AUTOGRAND_PERMISSIONS') && autograndIdentity.includes('AUTOGRAND_REAL_KARDZHALI_USERS'), 'Step 4.2 identity foundation data'],
  [seedText.includes('AUTOGRAND_REAL_KARDZHALI_USERS') && seedText.includes('AUTOGRAND_ROLE_TEMPLATES') && seedText.includes('seedIdentityFoundation') && seedText.includes('userLocationAccess.create'), 'Step 4.2 seed identity foundation'],
  [step42Doc.includes('Employee') && step42Doc.includes('RolePermission') && step42Doc.includes('UserLocationAccess') && step42Checkpoint.includes('0.4.2'), 'Step 4.2 docs and checkpoint'],
  [server.includes("appVersion: 'v0.4.8'") && packageJson.includes('0.4.8'), 'Step 4.4 grid preferences version label'],
  [masterBlueprint.includes('Document Engine') && masterBlueprint.includes('Grid Engine') && masterBlueprint.includes('Print Engine') && masterBlueprint.includes('Permission Engine'), 'Step 4.0 master blueprint engines'],
  [monetaAudit.includes('BasePackage.bpl') && monetaAudit.includes('InventoryPackage.bpl') && monetaAudit.includes('DevicePackage.bpl'), 'Step 4.0 Moneta reference module audit'],
  [foundationPlan.includes('Артикули') && foundationPlan.includes('Потребители') && foundationPlan.includes('Принтер профили') && foundationPlan.includes('Номератори'), 'Step 4.0 foundation data plan'],
  [implementationSequence.includes('Step 4.1') && implementationSequence.includes('Step 4.8') && step40Checkpoint.includes('Архитектурен checkpoint') || step40Checkpoint.includes('архитектурен checkpoint'), 'Step 4.0 implementation sequence and checkpoint'],
  [browse.includes('screen.hasDocumentCard'), 'generic document browse flag'],
  [browse.includes('screen.hasStockActions'), 'stock browse action strip'],
  [stockActions.includes('createStockTransferFromForm'), 'createStockTransferFromForm'],
  [stockActions.includes('getStockTransferCardData'), 'getStockTransferCardData'],
  [stockActions.includes('updateStockTransferDocumentStatus'), 'updateStockTransferDocumentStatus'],
  [stockActions.includes('addStockTransferLine'), 'addStockTransferLine'],
  [stockActions.includes('createStockAdjustmentFromForm'), 'createStockAdjustmentFromForm'],
  [stockActions.includes('getStockAdjustmentCardData'), 'getStockAdjustmentCardData'],
  [stockActions.includes('updateStockAdjustmentDocumentStatus'), 'updateStockAdjustmentDocumentStatus'],
  [stockActions.includes('addStockAdjustmentLine'), 'addStockAdjustmentLine'],
  [server.includes('/stock/adjustment/:documentId/status'), 'stock adjustment status route'],
  [server.includes('/stock/adjustment/:documentId/lines'), 'stock adjustment line route'],
  [adjustmentCard.includes('Документ за складова корекция') && adjustmentCard.includes('Промяна'), 'stock adjustment wording polish'],
  [stockActions.includes('getStockItemCardData'), 'getStockItemCardData'],
  [stockDashboard.includes('/stock/transfer/new'), 'stock dashboard transfer link'],
  [companyLocations.includes('getCompanyLocationsData'), 'getCompanyLocationsData'],
  [companyLocations.includes('locationTypeText'), 'locationTypeText'],
  [server.includes("/locations"), 'company locations route'],
  [server.includes("/stock/dashboard"), 'stock dashboard route'],
  [server.includes("/stock/adjustment/new"), 'stock adjustment new route'],
  [server.includes("/stock/transfer/new"), 'stock transfer route'],
  [server.includes("/stock/transfer/:documentId"), 'stock transfer card route'],
  [appJs.includes('rowOpenUrl'), 'generic row open url'],
  [autograndFoundation.includes("type: 'REGIONAL_WAREHOUSE'") && autograndFoundation.includes("canSell: true"), 'regional warehouses can sell'],
  [seedText.includes('stockTransferDocument.create'), 'stock transfer document seed'],
  [seedText.includes('stockAdjustmentDocument.create'), 'stock adjustment document seed'],
  [server.includes("app.get('/price-list'") && server.includes("/api/items/:itemId/image"), 'price list workbench routes'],
  [priceListService.includes('getPriceListWorkbenchData') && priceListService.includes('safeItemImageBaseName') && priceListService.includes('incomingRequests'), 'price list workbench service'],
  [priceListWorkbench.includes('Видими колони') && priceListWorkbench.includes('Снимка') && priceListWorkbench.includes('Трансфер') && (priceListWorkbench.includes('Заявки към текущ обект') || priceListWorkbench.includes('Заявки към моя обект')), 'price list availability panel UI'],
  [priceListWorkbench.includes('Текуща заявка за трансфер') && priceListWorkbench.includes('Липса') && priceListWorkbench.includes('Добави'), 'transfer request basket UI'],
  [server.includes('/api/stock/transfer-requests') && stockActions.includes('createTransferRequestsFromBasket') && stockActions.includes('markStockTransferNotFoundOnShelf'), 'transfer request basket API'],
  [server.includes("app.get('/stock/transfers'") && stockActions.includes('getStockTransferRequestsCenterData') && stockTransferCenter.includes('Пътува към текущ обект') && stockTransferCenter.includes('Бързи действия'), 'transfer center polish status counters'],
  [stockActions.includes('stock_transfer_in_transit') && stockActions.includes('workflowCards') && stockActions.includes('priorityRows'), 'Step 3.4 transfer center service polish'],
  [appJs.includes('requestBasket') && appJs.includes('submitRequestBasket') && appJs.includes('markTransferMissing'), 'transfer request basket frontend behavior'],
  [appJs.includes('initPriceWorkbench') && appJs.includes('ag_v2_price_list_columns') && appJs.includes('data-price-detail-tab'), 'price list frontend behavior'],
  [server.includes("/stock/transfer/:documentId/print") && stockActions.includes('getStockTransferPrintData') && stockTransferPrint.includes('data-transfer-print') && stockTransferPrint.includes('Избор на печатна форма') && stockTransferPrint.includes('Принтер профил') && stockTransferPrint.includes('Дост. цена') && stockTransferPrint.includes('Прод. с ДДС') && stockTransferPrint.includes('За кого / причина') && stockActions.includes('quantityAlertClass') && stockActions.includes('transferPurposeNote'), 'Step 3.5.4 transfer print compact picking polish'],
  [stockTransferCenter.includes('data-transfer-center-command="print"') && appJs.includes('initTransferPrintSlip'), 'Step 3.5 transfer print buttons'],
  [appJs.includes('handleRibbonPrintCommand') && appJs.includes('activeDocumentPrintUrl') && appJs.includes('openTransferPrintDialog'), 'Step 3.5.5 ribbon print sync'],
  [seedText.includes('prisma.employee.deleteMany') && seedText.includes('prisma.rolePermission.deleteMany'), 'Step 4.2 reset order'],
  [server.includes('STEP_4_2_4_PERMISSION_HEALTH_LABEL') && autograndIdentity.includes('ReadRight') && autograndIdentity.includes('FinishRight') && autograndIdentity.includes('PrintRight'), 'Step 4.2 Moneta rights mapping'],
  [autograndIdentity.includes('AUTOGRAND_REAL_KARDZHALI_USERS') && autograndIdentity.includes('stefan.admin') && autograndIdentity.includes('stefan.manager') && autograndIdentity.includes('angel.angelov') && autograndIdentity.includes('CASHIER') && autograndIdentity.includes('SALES_REP'), 'Step 4.2.1 real Kardzhali users and roles'],
  [seedText.includes('employeesByCode') && seedText.includes('employeeDisplayName') && step421Doc.includes('АНГЕЛ АНГЕЛОВ') && step421Checkpoint.includes('0.4.3'), 'Step 4.2.1 docs and shared employee profile support'],
  [server.includes("app.get('/login'") && server.includes("app.post('/login'") && server.includes("app.post('/logout'"), 'Step 4.3 login routes'],
  [server.includes('getRequestLoginContext') && server.includes('contextToViewData') && server.includes('isPublicLoginPath'), 'Step 4.3 login middleware and view context'],
  [loginContextService.includes('authenticateLogin') && loginContextService.includes('getLoginOptions') && loginContextService.includes('UserLocationAccess') && loginContextService.includes('permissionCodesForUser'), 'Step 4.3 login context service'],
  [loginView.includes('Фирма') && loginView.includes('Обект') && loginView.includes('Потребител') && loginView.includes('Връзка') && loginView.includes('data-ag-login-location'), 'Step 4.3 login UI'],
  [mainLayout.includes('titlebar-context') && mainLayout.includes('currentRoleName') && mainLayout.includes('currentLocationName') && mainLayout.includes('userRoleLabel') && mainLayout.includes('/logout'), 'Step 4.3 shell session context'],
  [step43Doc.includes('Фирма') && step43Doc.includes('Обект') && step43Doc.includes('1234') && step43Checkpoint.includes('0.4.4'), 'Step 4.3 docs and checkpoint'],
  [loginContextService.includes('userRoleLabel') && mainLayout.includes('titlebar-role') && mainLayout.includes('{{userRoleLabel}}') && step431Doc.includes('СТЕФАН ТАНАНОВ · Администратор') && step431Checkpoint.includes('0.4.5'), 'Step 4.3.1 role visibility polish'],
  [permissionService.includes('ROLE_PERMISSION_GRANTS') && permissionService.includes('MANAGER') && permissionService.includes('SALES_REP') && permissionService.includes('CASHIER') && permissionService.includes('WAREHOUSE'), 'Step 4.2.4 role permission grants'],
  [permissionService.includes('ROUTE_RULES') && permissionService.includes('/document/sales/new/:docType') && permissionService.includes('/stock/transfer/new') && permissionService.includes('/reference'), 'Step 4.2.4 route guard rules'],
  [permissionService.includes('authorizeRequest') && server.includes('authorizeRequest(req.agContext') && server.includes('renderForbidden'), 'Step 4.2.4 request guard middleware'],
  [permissionService.includes('filterNavigationGroups') && permissionService.includes('filterRibbonGroups') && server.includes('filterNavigationGroups(data.navigationGroups') && server.includes('filterRibbonGroups(data.ribbonGroups'), 'Step 4.2.4 menu and ribbon filtering'],
  [permissionService.includes('location_restricted') && permissionService.includes('canSell') && permissionService.includes('canRequestTransfer') && permissionService.includes('canDispatchTransfer') && permissionService.includes('canReceiveTransfer'), 'Step 4.2.4 location-aware action guard'],
  [forbiddenView.includes('Достъпът е ограничен') && forbiddenView.includes('{{forbidden.requiredPermission}}') && forbiddenView.includes('/login'), 'Step 4.2.4 forbidden access page'],
  [mainLayout.includes('activePermissionScopeLabel') && permissionService.includes('permissionContextToViewData'), 'Step 4.2.4 shell permission scope visibility'],
  [step424Doc.includes('Menu, Route & Action Guard') && step424Doc.includes('Moneta-like') && step424Checkpoint.includes('0.4.6'), 'Step 4.2.4 docs and checkpoint'],
  [catalogFoundationData.includes('AUTOGRAND_UNITS') && catalogFoundationData.includes('AUTOGRAND_VAT_GROUPS') && catalogFoundationData.includes('AUTOGRAND_PRICE_LEVELS') && catalogFoundationData.includes('AUTOGRAND_SUPPLIERS') && catalogFoundationData.includes('AUTOGRAND_CATALOG_ITEMS'), 'Step 4.3 catalog foundation data'],
  [catalogFoundationData.includes('N_ItemCategory') && catalogFoundationData.includes('N_ItemProductGroup') && catalogFoundationData.includes('N_ItemProductClass') && catalogFoundationData.includes('G_VATPostingSetup') && catalogFoundationData.includes('N_Contragent') && catalogFoundationData.includes('N_ItemCrossRef'), 'Step 4.3 Moneta-aligned catalog concepts'],
  [catalogFoundationData.includes('AUTOGRAND_VAT_BUSINESS_POSTING_GROUPS') && catalogFoundationData.includes('AUTOGRAND_VAT_PRODUCT_POSTING_GROUPS') && catalogFoundationData.includes('AUTOGRAND_VAT_POSTING_SETUP') && catalogFoundationData.includes('AUTOGRAND_ITEM_UNIT_CONVERSIONS'), 'Step 4.3 VAT posting and unit conversion foundation'],
  [catalogFoundationService.includes('STEP_4_3_CATALOG_HEALTH_LABEL') && catalogFoundationService.includes('getCatalogFoundationData') && catalogFoundationService.includes('getCatalogFoundationDiagnostics'), 'Step 4.3 catalog foundation service'],
  [catalogFoundationService.includes('monetaConcepts') && catalogFoundationService.includes('vatPostingSetup') && catalogFoundationService.includes('itemCrossReferences') && catalogFoundationService.includes('itemUnitPriceHistory'), 'Step 4.3 Moneta diagnostics counters'],
  [server.includes("app.get('/catalog/foundation'") && server.includes("app.get('/api/catalog/foundation/diagnostics'") && server.includes('STEP_4_3_CATALOG_HEALTH_LABEL'), 'Step 4.3 catalog foundation routes and health label'],
  [permissionService.includes('catalog.view') && permissionService.includes('/catalog/foundation') && permissionService.includes('Номенклатурна основа'), 'Step 4.3 catalog permissions'],
  [catalogFoundationView.includes('Артикули, мерни единици, ДДС, цени и доставчици') && catalogFoundationView.includes('{{catalog.healthLabel}}') && catalogFoundationView.includes('Foundation артикули'), 'Step 4.3 catalog foundation UI'],
  [catalogFoundationView.includes('G_VATPostingSetup') && catalogFoundationView.includes('N_Contragent') && catalogFoundationView.includes('N_ItemCrossRef') && catalogFoundationView.includes('Мерни преобразувания'), 'Step 4.3 Moneta-aligned catalog UI'],
  [(mainLayout.includes('styles.css?v=4.4-grid-column-preferences') || mainLayout.includes('styles.css?v=4.5-document-engine')) && (mainLayout.includes('app.js?v=4.4-grid-column-preferences') || mainLayout.includes('app.js?v=4.5-document-engine')), 'Step 4.4 cache version sync'],
  [step43CatalogDoc.includes('Items, Units, VAT, Prices and Suppliers Foundation') && step43CatalogDoc.includes('Moneta-aligned') && step43CatalogDoc.includes('G_VATPostingSetup') && step43CatalogCheckpoint.includes('0.4.7'), 'Step 4.3 catalog docs and checkpoint'],
  [gridPrefsService.includes('STEP_4_4_GRID_PREFS_HEALTH_LABEL') && gridPrefsService.includes('LoadGridView') && gridPrefsService.includes('DoSaveGridView') && gridPrefsService.includes('GridColWidthChanged'), 'Step 4.4 Moneta grid preference concepts'],
  [gridPrefsService.includes('GLOBAL_GRID_COLUMN_REGISTRY') && gridPrefsService.includes('catalog.foundation.items') && gridPrefsService.includes('price-list.items') && gridPrefsService.includes('stock.transfers.center'), 'Step 4.4 global grid registry'],
  [server.includes("app.get('/grid/preferences'") && server.includes("app.get('/api/grid/preferences/diagnostics'") && server.includes('STEP_4_4_GRID_PREFS_HEALTH_LABEL'), 'Step 4.4 grid preferences routes and health label'],
  [permissionService.includes('grid_preferences.view') && permissionService.includes('/grid/preferences') && permissionService.includes('Глобални настройки на колони'), 'Step 4.4 grid preferences permissions'],
  [gridPrefsJs.includes('localStorage') && gridPrefsJs.includes('GridTitleButtonClick') && gridPrefsJs.includes('ag-grid-column-toolbar') && gridPrefsJs.includes('data-ag-grid-key'), 'Step 4.4 browser column preferences runtime'],
  [mainLayout.includes('ag-grid-column-preferences.js?v=4.5-document-engine') && mainLayout.includes('data-ag-current-user') && mainLayout.includes('styles.css?v=4.5-document-engine'), 'Step 4.4 layout integration and cache version'],
  [gridPrefsView.includes('Глобални настройки на колони') && gridPrefsView.includes('{{gridPrefs.healthLabel}}') && gridPrefsView.includes('Moneta hooks'), 'Step 4.4 grid preferences UI'],
  [catalogFoundationView.includes('data-ag-grid-key="catalog.foundation.items"') && catalogFoundationView.includes('data-ag-column-key="supplierCode"'), 'Step 4.4 catalog table grid keys'],
  [step44Doc.includes('Global Grid Column Preferences') && step44Doc.includes('LoadGridView') && step44Checkpoint.includes('0.4.8'), 'Step 4.4 docs and checkpoint'],
  [documentEngineData.includes('DOCUMENT_ENGINE_TYPES') && documentEngineData.includes('DOCUMENT_ENGINE_STATUS_FLOW') && documentEngineData.includes('DOCUMENT_ENGINE_ACTIONS') && documentEngineData.includes('DOCUMENT_ENGINE_COPY_TEMPLATES'), 'Step 4.5 document engine foundation data'],
  [documentEngineData.includes('TfBaseEditDocument') && documentEngineData.includes('TfBaseBrowseCardDocument') && documentEngineData.includes('PostDocument') && documentEngineData.includes('AnnulDocument') && documentEngineData.includes('S_CopyDocTemplateHeader') && documentEngineData.includes('DocStatus') && documentEngineData.includes('PostingDate'), 'Step 4.5 Moneta document engine concepts'],
  [documentEngineService.includes('STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL') && documentEngineService.includes('getGlobalDocumentEngineData') && documentEngineService.includes('getGlobalDocumentEngineDiagnostics'), 'Step 4.5 document engine service'],
  [documentEngineService.includes('monetaAligned') && documentEngineService.includes('documentTypes') && documentEngineService.includes('ledgerEffects') && documentEngineService.includes('noPrismaSchemaChange'), 'Step 4.5 document engine diagnostics'],
  [server.includes("app.get('/document-engine'") && server.includes("app.get('/api/document-engine/diagnostics'") && server.includes('STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL'), 'Step 4.5 document engine routes and health label'],
  [permissionService.includes('document_engine.view') && permissionService.includes('/document-engine') && permissionService.includes('Глобален документен engine'), 'Step 4.5 document engine permissions'],
  [documentEngineView.includes('Глобален документен engine') && documentEngineView.includes('{{documentEngine.healthLabel}}') && documentEngineView.includes('data-ag-grid-key="document.engine.types"') && documentEngineView.includes('Moneta hooks'), 'Step 4.5 document engine UI'],
  [documentEngineJs.includes('data-ag-document-engine-tab') && documentEngineJs.includes('TfBaseEditDocument') && documentEngineJs.includes('PostDocument') && mainLayout.includes('ag-document-engine.js?v=4.5-document-engine'), 'Step 4.5 browser document engine runtime'],
  [mainLayout.includes('styles.css?v=4.5-document-engine') || mainLayout.includes('styles.css?v=4.6-print-engine') && packageJson.includes('0.4.9') || packageJson.includes('0.4.10') && step45Doc.includes('Global Document Engine') && step45Checkpoint.includes('0.4.9'), 'Step 4.5 docs and checkpoint'],
  [printEngineData.includes('PRINT_ENGINE_DOCUMENT_FORMS') && printEngineData.includes('PRINT_ENGINE_CHANNELS') && printEngineData.includes('PRINT_ENGINE_TEMPLATE_SECTIONS') && printEngineData.includes('PRINT_ENGINE_DEVICE_PROFILES'), 'Step 4.6 print engine foundation data'],
  [printEngineData.includes('TfBase.PrintSelect') && printEngineData.includes('TfBase.GetPrintDocument') && printEngineData.includes('TfBase.PrintPostedDocument') && printEngineData.includes('SelectPrintFormGeneral') && printEngineData.includes('frxExportPDF') && printEngineData.includes('frxBarcode2D'), 'Step 4.6 Moneta print engine concepts'],
  [printEngineService.includes('STEP_4_6_PRINT_ENGINE_HEALTH_LABEL') && printEngineService.includes('getGlobalPrintEngineData') && printEngineService.includes('getGlobalPrintEngineDiagnostics'), 'Step 4.6 print engine service'],
  [printEngineService.includes('monetaAligned') && printEngineService.includes('documentForms') && printEngineService.includes('noPrismaSchemaChange') && printEngineService.includes('requiredConcepts'), 'Step 4.6 print engine diagnostics'],
  [server.includes("app.get('/print-engine'") && server.includes("app.get('/api/print-engine/diagnostics'") && server.includes('STEP_4_6_PRINT_ENGINE_HEALTH_LABEL'), 'Step 4.6 print engine routes and health label'],
  [permissionService.includes('print_engine.view') && permissionService.includes('/print-engine') && permissionService.includes('Глобален print engine'), 'Step 4.6 print engine permissions'],
  [printEngineView.includes('Глобален print engine') && printEngineView.includes('{{printEngine.healthLabel}}') && printEngineView.includes('data-ag-grid-key="print.engine.forms"') && printEngineView.includes('Moneta hooks'), 'Step 4.6 print engine UI'],
  [printEngineJs.includes('data-ag-print-engine-tab') && printEngineJs.includes('GetPrintDocument') && printEngineJs.includes('PrintPostedDocument') && mainLayout.includes('ag-print-engine.js?v=4.6-print-engine'), 'Step 4.6 browser print engine runtime'],
  [mainLayout.includes('styles.css?v=4.6-print-engine') && packageJson.includes('0.4.10') && step46Doc.includes('Global Print Engine') && step46Checkpoint.includes('0.4.10'), 'Step 4.6 docs and checkpoint']
];

for (const [passed, label] of checks) {
  if (!passed) {
    console.error(`MISSING: ${label}`);
    ok = false;
  } else {
    console.log(`OK: ${label}`);
  }
}

if (!ok) {
  process.exit(1);
}

console.log('OK: Step 4.6 Global Print Engine patch check passed.');
