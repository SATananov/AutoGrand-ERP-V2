// Step 4.2.4 — Moneta-like permission foundation for menu, route and action guards.
// No Prisma schema change: this service evaluates the active Login Context from Step 4.3.

const ADMIN_ROLE_CODES = new Set([
  'ADMIN',
  'ADMINISTRATOR',
  'SYSTEM_ADMIN',
  'OWNER',
  'SUPER_ADMIN'
]);

const ROLE_PERMISSION_GRANTS = {
  ADMIN: ['*'],
  ADMINISTRATOR: ['*'],
  SYSTEM_ADMIN: ['*'],
  OWNER: ['*'],
  SUPER_ADMIN: ['*'],

  MANAGER: [
    'dashboard.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.finish',
    'sales.cancel',
    'sales.payment',
    'purchase.view',
    'purchase.create',
    'purchase.edit',
    'purchase.finish',
    'stock.view',
    'stock.transfer.view',
    'stock.transfer.create',
    'stock.transfer.edit',
    'stock.transfer.finish',
    'stock.transfer.print',
    'stock.adjustment.view',
    'stock.adjustment.create',
    'stock.adjustment.edit',
    'stock.adjustment.finish',
    'price_list.view',
    'price_list.edit',
    'catalog.view',
    'catalog.edit',
    'locations.view',
    'reports.view',
    'tools.snapshot'
  ],

  SALES_REP: [
    'dashboard.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.payment',
    'price_list.view',
    'catalog.view',
    'stock.view',
    'stock.transfer.view',
    'stock.transfer.create',
    'reports.view',
    'tools.snapshot'
  ],

  SALES: [
    'dashboard.view',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.payment',
    'price_list.view',
    'catalog.view',
    'stock.view',
    'stock.transfer.view',
    'stock.transfer.create',
    'reports.view',
    'tools.snapshot'
  ],

  CASHIER: [
    'dashboard.view',
    'sales.view',
    'sales.payment',
    'price_list.view',
    'catalog.view',
    'reports.view',
    'tools.snapshot'
  ],

  WAREHOUSE: [
    'dashboard.view',
    'purchase.view',
    'stock.view',
    'stock.transfer.view',
    'stock.transfer.create',
    'stock.transfer.edit',
    'stock.transfer.finish',
    'stock.transfer.print',
    'stock.adjustment.view',
    'price_list.view',
    'catalog.view',
    'tools.snapshot'
  ],

  STOCK: [
    'dashboard.view',
    'purchase.view',
    'stock.view',
    'stock.transfer.view',
    'stock.transfer.create',
    'stock.transfer.edit',
    'stock.transfer.finish',
    'stock.transfer.print',
    'stock.adjustment.view',
    'price_list.view',
    'catalog.view',
    'tools.snapshot'
  ],

  PURCHASE: [
    'dashboard.view',
    'purchase.view',
    'purchase.create',
    'purchase.edit',
    'purchase.finish',
    'stock.view',
    'price_list.view',
    'catalog.view',
    'tools.snapshot'
  ],

  ACCOUNTANT: [
    'dashboard.view',
    'sales.view',
    'purchase.view',
    'stock.view',
    'price_list.view',
    'catalog.view',
    'reports.view',
    'tools.snapshot'
  ],

  OPERATOR: [
    'dashboard.view',
    'sales.view',
    'price_list.view',
    'catalog.view',
    'stock.view',
    'tools.snapshot'
  ]
};

const ACTION_TERMS = {
  view: ['view', 'read', 'browse', 'list', 'open', 'show', 'readright'],
  create: ['create', 'new', 'insert', 'add', 'makeright'],
  edit: ['edit', 'update', 'change', 'modify', 'writeright'],
  finish: ['finish', 'post', 'posting', 'complete', 'confirm', 'end', 'finishright'],
  cancel: ['cancel', 'void', 'annul', 'delete', 'deleteright'],
  payment: ['payment', 'pay', 'cash', 'cashier'],
  print: ['print', 'slip', 'preview', 'printright']
};

const MODULE_TERMS = {
  dashboard: ['dashboard', 'home', 'main'],
  sales: ['sales', 'sale', 'pos', 'invoice', 'receipt', 'document'],
  purchase: ['purchase', 'delivery', 'supplier', 'supply'],
  stock: ['stock', 'inventory', 'warehouse', 'transfer', 'adjustment'],
  price_list: ['price', 'item', 'article', 'nomenclature', 'product'],
  catalog: ['catalog', 'unit', 'vat', 'supplier', 'sku', 'barcode'],
  locations: ['location', 'companylocation', 'object', 'warehouse'],
  reports: ['report', 'analysis', 'statement'],
  tools: ['tool', 'snapshot', 'print'],
  system: ['system', 'setting', 'admin', 'reference']
};

const ROUTE_RULES = [
  route('*', '/', 'dashboard.view', 'Начало'),
  route('GET', '/price-list', 'price_list.view', 'Артикули, цени и наличности'),
  route('GET', '/catalog/foundation', 'catalog.view', 'Номенклатурна основа'),
  route('GET', '/api/catalog/foundation/diagnostics', 'catalog.view', 'Диагностика на номенклатурна основа'),
  route('POST', '/api/items/:itemId/image', 'price_list.edit', 'Качване на снимка на артикул'),
  route('DELETE', '/api/items/:itemId/image', 'price_list.edit', 'Премахване на снимка на артикул'),

  route('POST', '/api/stock/transfer-requests', 'stock.transfer.create', 'Създаване на заявка за трансфер', { anyLocationFlag: ['canRequestTransfer', 'canDispatchTransfer'] }),
  route('POST', '/api/stock/transfer-requests/:documentId/send', 'stock.transfer.finish', 'Изпращане на трансфер', { anyLocationFlag: ['canDispatchTransfer'] }),
  route('POST', '/api/stock/transfer-requests/:documentId/receive', 'stock.transfer.finish', 'Приемане на трансфер', { anyLocationFlag: ['canReceiveTransfer'] }),
  route('POST', '/api/stock/transfer-requests/:documentId/return', 'stock.transfer.finish', 'Връщане на трансфер', { anyLocationFlag: ['canReceiveTransfer', 'canDispatchTransfer'] }),
  route('POST', '/api/stock/transfer-requests/:documentId/not-found', 'stock.transfer.edit', 'Маркиране липса на рафт', { anyLocationFlag: ['canDispatchTransfer'] }),

  route('GET', '/screen/:screenId', 'dashboard.view', 'ERP екран'),

  route('GET', '/document/sales/new/:docType', 'sales.create', 'Нов продажбен документ', { anyLocationFlag: ['canSell'] }),
  route('POST', '/document/sales/new', 'sales.create', 'Създаване на продажбен документ', { anyLocationFlag: ['canSell'] }),
  route('GET', '/document/sales/:documentId', 'sales.view', 'Преглед на продажбен документ'),
  route('POST', '/document/sales/:documentId/lines', 'sales.edit', 'Добавяне на ред в продажба', { anyLocationFlag: ['canSell'] }),
  route('POST', '/document/sales/:documentId/lines/:lineId/update', 'sales.edit', 'Редакция на ред в продажба', { anyLocationFlag: ['canSell'] }),
  route('POST', '/document/sales/:documentId/lines/:lineId/delete', 'sales.edit', 'Изтриване на ред в продажба', { anyLocationFlag: ['canSell'] }),
  route('POST', '/document/sales/:documentId/recalculate', 'sales.edit', 'Преизчисляване на продажба', { anyLocationFlag: ['canSell'] }),
  route('POST', '/document/sales/:documentId/status', 'sales.finish', 'Приключване на продажбен документ'),
  route('POST', '/document/sales/:documentId/payments', 'sales.payment', 'Плащане по продажба'),

  route('GET', '/document/purchase/new/:docType', 'purchase.create', 'Нов доставен документ'),
  route('POST', '/document/purchase/new', 'purchase.create', 'Създаване на доставен документ'),
  route('GET', '/document/purchase/:documentId', 'purchase.view', 'Преглед на доставен документ'),
  route('POST', '/document/purchase/:documentId/lines', 'purchase.edit', 'Добавяне на ред в доставка'),
  route('POST', '/document/purchase/:documentId/lines/:lineId/update', 'purchase.edit', 'Редакция на ред в доставка'),
  route('POST', '/document/purchase/:documentId/lines/:lineId/delete', 'purchase.edit', 'Изтриване на ред в доставка'),
  route('POST', '/document/purchase/:documentId/recalculate', 'purchase.edit', 'Преизчисляване на доставка'),
  route('POST', '/document/purchase/:documentId/status', 'purchase.finish', 'Приключване на доставен документ'),

  route('POST', '/tools/snapshot/save', 'tools.snapshot', 'Запис на snapshot'),
  route('POST', '/tools/snapshot/open-folder', 'tools.snapshot', 'Отваряне на snapshot папка'),

  route('GET', '/locations', 'locations.view', 'Обекти и складове'),
  route('GET', '/locations/:locationId', 'locations.view', 'Карта на обект'),

  route('GET', '/stock/dashboard', 'stock.view', 'Складов център'),
  route('GET', '/stock/transfers', 'stock.transfer.view', 'Трансфери и заявки'),
  route('GET', '/stock/adjustment/new', 'stock.adjustment.create', 'Нова складова корекция'),
  route('POST', '/stock/adjustment/new', 'stock.adjustment.create', 'Създаване на складова корекция'),
  route('GET', '/stock/adjustment/:documentId', 'stock.adjustment.view', 'Преглед на складова корекция'),
  route('POST', '/stock/adjustment/:documentId/lines', 'stock.adjustment.edit', 'Добавяне на ред в складова корекция'),
  route('POST', '/stock/adjustment/:documentId/lines/:lineId/update', 'stock.adjustment.edit', 'Редакция на ред в складова корекция'),
  route('POST', '/stock/adjustment/:documentId/lines/:lineId/delete', 'stock.adjustment.edit', 'Изтриване на ред в складова корекция'),
  route('POST', '/stock/adjustment/:documentId/status', 'stock.adjustment.finish', 'Приключване на складова корекция'),

  route('GET', '/stock/transfer/new', 'stock.transfer.create', 'Нов складов трансфер', { anyLocationFlag: ['canRequestTransfer', 'canDispatchTransfer'] }),
  route('POST', '/stock/transfer/new', 'stock.transfer.create', 'Създаване на складов трансфер', { anyLocationFlag: ['canRequestTransfer', 'canDispatchTransfer'] }),
  route('GET', '/stock/transfer/:documentId/print', 'stock.transfer.print', 'Печат на складов трансфер'),
  route('GET', '/stock/transfer/:documentId', 'stock.transfer.view', 'Преглед на складов трансфер'),
  route('POST', '/stock/transfer/:documentId/lines', 'stock.transfer.edit', 'Добавяне на ред в складов трансфер'),
  route('POST', '/stock/transfer/:documentId/lines/:lineId/update', 'stock.transfer.edit', 'Редакция на ред в складов трансфер'),
  route('POST', '/stock/transfer/:documentId/lines/:lineId/delete', 'stock.transfer.edit', 'Изтриване на ред в складов трансфер'),
  route('POST', '/stock/transfer/:documentId/status', 'stock.transfer.finish', 'Приключване на складов трансфер'),

  route('GET', '/stock/item/:itemId', 'stock.view', 'Складова карта на артикул'),
  route('GET', '/stock/warehouse/:warehouseId', 'stock.view', 'Складова карта на склад'),
  route('GET', '/reference', 'system.reference', 'Reference map')
];

const SCREEN_RULES = [
  screenRule(['sales', 'sale', 'faktura', 'invoice', 'receipt', 'pos'], 'sales.view', 'Продажбени екрани'),
  screenRule(['purchase', 'delivery', 'supplier', 'dostav'], 'purchase.view', 'Доставни екрани'),
  screenRule(['stock', 'warehouse', 'inventory', 'transfer', 'adjustment', 'movement', 'balance'], 'stock.view', 'Складови екрани'),
  screenRule(['price', 'item', 'article', 'nomenclature'], 'price_list.view', 'Артикули и ценови листи'),
  screenRule(['catalog', 'unit', 'vat', 'supplier', 'barcode'], 'catalog.view', 'Номенклатурна основа'),
  screenRule(['location', 'company'], 'locations.view', 'Обекти и фирма'),
  screenRule(['report', 'analysis'], 'reports.view', 'Справки')
];

const COMMAND_RULES = [
  commandRule(['sales', 'sale', 'pos', 'invoice'], 'sales.view', 'Продажби'),
  commandRule(['purchase', 'delivery', 'supplier'], 'purchase.view', 'Доставки'),
  commandRule(['stock', 'warehouse', 'inventory'], 'stock.view', 'Склад'),
  commandRule(['transfer'], 'stock.transfer.view', 'Трансфери'),
  commandRule(['adjustment'], 'stock.adjustment.view', 'Складови корекции'),
  commandRule(['price', 'item', 'article'], 'price_list.view', 'Цени и артикули'),
  commandRule(['catalog', 'unit', 'vat', 'supplier'], 'catalog.view', 'Номенклатурна основа'),
  commandRule(['location', 'company'], 'locations.view', 'Обекти'),
  commandRule(['reference', 'settings', 'admin'], 'system.reference', 'Системни функции'),
  commandRule(['print'], 'tools.snapshot', 'Печат / snapshot')
];

function route(method, pattern, permission, label, options = {}) {
  return { method, pattern, permission, label, ...options, matcher: patternToMatcher(pattern) };
}

function screenRule(keywords, permission, label) {
  return { keywords, permission, label };
}

function commandRule(keywords, permission, label) {
  return { keywords, permission, label };
}

function normalize(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeToken(value = '') {
  return normalize(value).replace(/[^a-z0-9а-яё]+/giu, '');
}

function normalizeRoleCode(value = '') {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
}

function patternToMatcher(pattern = '/') {
  const escaped = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

function methodMatches(ruleMethod, requestMethod) {
  if (!ruleMethod || ruleMethod === '*') return true;
  const request = String(requestMethod || 'GET').toUpperCase();
  return Array.isArray(ruleMethod)
    ? ruleMethod.map((method) => String(method).toUpperCase()).includes(request)
    : String(ruleMethod).toUpperCase() === request;
}

function permissionsForRole(roleCode = '') {
  const normalized = normalizeRoleCode(roleCode || 'OPERATOR');
  return ROLE_PERMISSION_GRANTS[normalized] || ROLE_PERMISSION_GRANTS.OPERATOR || [];
}

function isAdminContext(context) {
  const roleCode = normalizeRoleCode(context?.roleCode || context?.role || '');
  return ADMIN_ROLE_CODES.has(roleCode) || permissionsForRole(roleCode).includes('*');
}

function permissionParts(permission = '') {
  const [module = '', action = 'view'] = String(permission || '').split('.');
  return { module: normalize(module), action: normalize(action || 'view') };
}

function codeLooksLikePermission(rawCode = '', permission = '') {
  const code = normalizeToken(rawCode);
  if (!code) return false;

  const exact = normalizeToken(permission);
  if (code === exact || code.includes(exact)) return true;

  const { module, action } = permissionParts(permission);
  const modules = MODULE_TERMS[module] || [module];
  const actions = ACTION_TERMS[action] || [action];

  const hasModule = modules.some((term) => code.includes(normalizeToken(term)));
  const hasAction = actions.some((term) => code.includes(normalizeToken(term)));

  return hasModule && hasAction;
}

function explicitPermissionAllowed(context, permission) {
  const codes = Array.isArray(context?.permissions) ? context.permissions : [];
  return codes.some((code) => codeLooksLikePermission(code, permission));
}

export function hasPermission(context, permission) {
  if (!permission || permission === '*') return true;
  if (!context?.isAuthenticated) return false;
  if (isAdminContext(context)) return true;
  if (explicitPermissionAllowed(context, permission)) return true;

  const roleGrants = permissionsForRole(context.roleCode);
  return roleGrants.includes('*') || roleGrants.includes(permission);
}

export function hasAnyPermission(context, permissions = []) {
  const list = Array.isArray(permissions) ? permissions : [permissions];
  return list.some((permission) => hasPermission(context, permission));
}

function locationFlagAllowed(context, flags = []) {
  const list = Array.isArray(flags) ? flags : [flags];
  if (!list.length) return true;
  if (isAdminContext(context)) return true;
  return list.some((flag) => Boolean(context?.[flag]));
}

function deny(rule, reason, extra = {}) {
  return {
    allowed: false,
    permission: rule?.permission || '',
    label: rule?.label || 'Ограничен достъп',
    reason,
    ...extra
  };
}

function allow(rule = null, extra = {}) {
  return {
    allowed: true,
    permission: rule?.permission || '',
    label: rule?.label || '',
    ...extra
  };
}

export function ruleForRequest({ method = 'GET', path = '/' } = {}) {
  const requestPath = String(path || '/').split('?')[0] || '/';
  return ROUTE_RULES.find((rule) => methodMatches(rule.method, method) && rule.matcher.test(requestPath)) || null;
}

export function ruleForScreen(screenId = '') {
  const token = normalizeToken(screenId);
  if (!token) return null;
  return SCREEN_RULES.find((rule) => rule.keywords.some((keyword) => token.includes(normalizeToken(keyword)))) || null;
}

export function ruleForCommand(value = '') {
  const token = normalizeToken(value);
  if (!token) return null;
  return COMMAND_RULES.find((rule) => rule.keywords.some((keyword) => token.includes(normalizeToken(keyword)))) || null;
}

export function authorizeRule(context, rule) {
  if (!rule) return allow();
  if (!context?.isAuthenticated) return deny(rule, 'not_authenticated');
  if (!hasPermission(context, rule.permission)) return deny(rule, 'missing_permission');
  if (rule.anyLocationFlag && !locationFlagAllowed(context, rule.anyLocationFlag)) {
    return deny(rule, 'location_restricted', { requiredLocationFlags: rule.anyLocationFlag });
  }
  return allow(rule);
}

export function authorizeRequest(context, request = {}) {
  const rule = ruleForRequest(request);

  if (request?.path === '/screen/:screenId') {
    return authorizeRule(context, rule);
  }

  if (rule?.pattern === '/screen/:screenId') {
    const screenId = String(request.path || '').split('/').filter(Boolean)[1] || '';
    const screenRuleDecision = authorizeRule(context, ruleForScreen(screenId) || rule);
    return screenRuleDecision.allowed ? allow(ruleForScreen(screenId) || rule) : screenRuleDecision;
  }

  return authorizeRule(context, rule);
}

function decisionForNavigationItem(item = {}, context) {
  const candidates = [
    item.permission,
    item.permissionCode,
    item.requiredPermission
  ].filter(Boolean);

  for (const permission of candidates) {
    const decision = authorizeRule(context, { permission, label: item.label || item.title || permission });
    if (!decision.allowed) return decision;
  }

  const pathValue = item.href || item.url || item.path || item.to || '';
  if (pathValue && String(pathValue).startsWith('/')) {
    const rule = ruleForRequest({ method: 'GET', path: String(pathValue).split('?')[0] });
    if (rule) return authorizeRule(context, rule);
  }

  const commandValue = item.command || item.id || item.screenId || item.key || item.currentScreen || '';
  const commandRuleDecision = ruleForCommand(commandValue) || ruleForScreen(commandValue);
  return authorizeRule(context, commandRuleDecision);
}

function filterItemCollection(items, context) {
  if (!Array.isArray(items)) return items;

  return items
    .map((item) => filterNavigationItem(item, context))
    .filter(Boolean);
}

function filterNavigationItem(item = {}, context) {
  if (!item || typeof item !== 'object') return item;

  const nestedKeys = ['items', 'children', 'links', 'screens', 'entries', 'buttons'];
  const cloned = { ...item };

  for (const key of nestedKeys) {
    if (Array.isArray(cloned[key])) {
      cloned[key] = filterItemCollection(cloned[key], context);
    }
  }

  const hasNested = nestedKeys.some((key) => Array.isArray(cloned[key]) && cloned[key].length > 0);
  const decision = decisionForNavigationItem(item, context);

  if (decision.allowed || hasNested) {
    return cloned;
  }

  return null;
}

export function filterNavigationGroups(groups = [], context) {
  if (!Array.isArray(groups)) return groups;
  return groups
    .map((group) => filterNavigationItem(group, context))
    .filter(Boolean);
}

export function filterRibbonGroups(groups = [], context) {
  if (!Array.isArray(groups)) return groups;

  return groups
    .map((group) => {
      const buttons = Array.isArray(group.buttons)
        ? group.buttons.filter((button) => decisionForNavigationItem(button, context).allowed)
        : group.buttons;

      if (Array.isArray(buttons) && buttons.length === 0) return null;
      return { ...group, buttons };
    })
    .filter(Boolean);
}

export function permissionContextToViewData(context) {
  const roleCode = normalizeRoleCode(context?.roleCode || 'OPERATOR');
  const roleGrants = permissionsForRole(roleCode);
  const isAdmin = isAdminContext(context);

  return {
    isSystemAdmin: isAdmin,
    activeRoleCode: roleCode,
    activePermissionScopeLabel: isAdmin ? 'Пълен достъп' : 'Ограничен достъп по роля и обект',
    activePermissionCount: isAdmin ? 'ALL' : String(roleGrants.length),
    canAccessSales: hasPermission(context, 'sales.view'),
    canCreateSales: hasPermission(context, 'sales.create') && locationFlagAllowed(context, ['canSell']),
    canAccessPurchases: hasPermission(context, 'purchase.view'),
    canAccessStock: hasPermission(context, 'stock.view'),
    canAccessTransfers: hasPermission(context, 'stock.transfer.view'),
    canAccessPriceList: hasPermission(context, 'price_list.view'),
    canAccessLocations: hasPermission(context, 'locations.view'),
    canAccessSystemReference: hasPermission(context, 'system.reference')
  };
}

export function forbiddenViewData(context, decision = {}, request = {}) {
  return {
    title: 'Достъпът е ограничен',
    moduleLabel: decision.label || 'Ограничен модул',
    requiredPermission: decision.permission || '—',
    reason: decision.reason || 'missing_permission',
    requestPath: request.originalUrl || request.path || '/',
    requestMethod: request.method || 'GET',
    userLabel: context?.isAuthenticated ? `${context.userName} · ${context.roleName}` : 'Няма активен потребител',
    locationLabel: context?.isAuthenticated ? context.locationName : 'Не е избран обект',
    permissionScopeLabel: permissionContextToViewData(context).activePermissionScopeLabel
  };
}

export const STEP_4_2_4_PERMISSION_HEALTH_LABEL = '4-2-4-runtime-permission-guards-menu-route-action-guard';
