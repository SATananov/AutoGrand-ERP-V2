import { DEFAULT_LOCATION_CODE } from './autogrand-foundation.js';

export const MONETA_RIGHT_ACTIONS = [
  { action: 'read', label: 'Преглед', monetaRef: 'ReadRight' },
  { action: 'insert', label: 'Добавяне', monetaRef: 'InsertRight' },
  { action: 'edit', label: 'Редакция', monetaRef: 'EditRight' },
  { action: 'delete', label: 'Изтриване', monetaRef: 'DeleteRight' },
  { action: 'finish', label: 'Приключване / осчетоводяване', monetaRef: 'FinishRight' },
  { action: 'print', label: 'Печат', monetaRef: 'PrintRight' },
  { action: 'export', label: 'Експорт', monetaRef: 'ExportRight' },
  { action: 'edit_props', label: 'Настройки / свойства', monetaRef: 'EditPropsRight' },
  { action: 'annul', label: 'Анулиране', monetaRef: 'AnnulRight' }
];

export const AUTOGRAND_PERMISSIONS = [
  { code: 'core.login', module: 'core', action: 'read', name: 'Вход в системата', sortOrder: 10 },
  { code: 'core.change_context', module: 'core', action: 'edit_props', name: 'Смяна на фирма / обект', sortOrder: 20 },

  { code: 'locations.read', module: 'locations', action: 'read', name: 'Преглед на обекти', sortOrder: 100 },
  { code: 'locations.edit', module: 'locations', action: 'edit_props', name: 'Редакция на обекти', sortOrder: 110 },

  { code: 'users.read', module: 'users', action: 'read', name: 'Преглед на потребители', sortOrder: 200 },
  { code: 'users.insert', module: 'users', action: 'insert', name: 'Добавяне на потребител', sortOrder: 210 },
  { code: 'users.edit', module: 'users', action: 'edit', name: 'Редакция на потребител', sortOrder: 220 },
  { code: 'users.delete', module: 'users', action: 'delete', name: 'Спиране / изтриване на потребител', sortOrder: 230 },
  { code: 'users.manage_rights', module: 'users', action: 'edit_props', name: 'Управление на права', sortOrder: 240 },

  { code: 'items.read', module: 'items', action: 'read', name: 'Преглед на артикули', sortOrder: 300 },
  { code: 'items.edit', module: 'items', action: 'edit', name: 'Редакция на артикули', sortOrder: 310 },
  { code: 'prices.read', module: 'prices', action: 'read', name: 'Преглед на продажни цени', sortOrder: 320 },
  { code: 'prices.view_cost', module: 'prices', action: 'read', name: 'Преглед на доставни цени', sortOrder: 330 },
  { code: 'prices.edit', module: 'prices', action: 'edit', name: 'Редакция на цени', sortOrder: 340 },

  { code: 'sales.read', module: 'sales', action: 'read', name: 'Преглед продажби', sortOrder: 400 },
  { code: 'sales.insert', module: 'sales', action: 'insert', name: 'Нова продажба', sortOrder: 410 },
  { code: 'sales.edit', module: 'sales', action: 'edit', name: 'Редакция продажба', sortOrder: 420 },
  { code: 'sales.finish', module: 'sales', action: 'finish', name: 'Приключване продажба', sortOrder: 430 },
  { code: 'sales.print', module: 'sales', action: 'print', name: 'Печат продажба', sortOrder: 440 },
  { code: 'sales.annul', module: 'sales', action: 'annul', name: 'Анулиране продажба', sortOrder: 450 },

  { code: 'purchases.read', module: 'purchases', action: 'read', name: 'Преглед доставки', sortOrder: 500 },
  { code: 'purchases.insert', module: 'purchases', action: 'insert', name: 'Нова доставка', sortOrder: 510 },
  { code: 'purchases.edit', module: 'purchases', action: 'edit', name: 'Редакция доставка', sortOrder: 520 },
  { code: 'purchases.finish', module: 'purchases', action: 'finish', name: 'Приключване доставка', sortOrder: 530 },
  { code: 'purchases.print', module: 'purchases', action: 'print', name: 'Печат доставка', sortOrder: 540 },
  { code: 'purchases.annul', module: 'purchases', action: 'annul', name: 'Анулиране доставка', sortOrder: 550 },

  { code: 'stock.read', module: 'stock', action: 'read', name: 'Преглед наличности', sortOrder: 600 },
  { code: 'stock.print', module: 'stock', action: 'print', name: 'Печат складови справки', sortOrder: 610 },
  { code: 'stock.export', module: 'stock', action: 'export', name: 'Експорт складови справки', sortOrder: 620 },

  { code: 'transfer.read', module: 'transfer', action: 'read', name: 'Преглед трансфери', sortOrder: 700 },
  { code: 'transfer.request', module: 'transfer', action: 'insert', name: 'Заявяване на трансфер', sortOrder: 710 },
  { code: 'transfer.dispatch', module: 'transfer', action: 'finish', name: 'Изпращане на трансфер', sortOrder: 720 },
  { code: 'transfer.receive', module: 'transfer', action: 'finish', name: 'Приемане на трансфер', sortOrder: 730 },
  { code: 'transfer.return', module: 'transfer', action: 'annul', name: 'Връщане към изпращач', sortOrder: 740 },
  { code: 'transfer.print', module: 'transfer', action: 'print', name: 'Печат на трансфер', sortOrder: 750 },

  { code: 'stock_adjustment.read', module: 'stock_adjustment', action: 'read', name: 'Преглед складови корекции', sortOrder: 800 },
  { code: 'stock_adjustment.insert', module: 'stock_adjustment', action: 'insert', name: 'Нова складова корекция', sortOrder: 810 },
  { code: 'stock_adjustment.edit', module: 'stock_adjustment', action: 'edit', name: 'Редакция складова корекция', sortOrder: 820 },
  { code: 'stock_adjustment.finish', module: 'stock_adjustment', action: 'finish', name: 'Приключване складова корекция', sortOrder: 830 },
  { code: 'stock_adjustment.print', module: 'stock_adjustment', action: 'print', name: 'Печат складова корекция', sortOrder: 840 },
  { code: 'stock_adjustment.annul', module: 'stock_adjustment', action: 'annul', name: 'Анулиране складова корекция', sortOrder: 850 },

  { code: 'finance.read', module: 'finance', action: 'read', name: 'Преглед финанси', sortOrder: 900 },
  { code: 'finance.edit', module: 'finance', action: 'edit', name: 'Редакция финанси', sortOrder: 910 },
  { code: 'reports.export', module: 'reports', action: 'export', name: 'Експорт справки', sortOrder: 1000 },
  { code: 'printers.edit', module: 'printers', action: 'edit_props', name: 'Настройки принтери', sortOrder: 1100 },
  { code: 'settings.edit', module: 'settings', action: 'edit_props', name: 'Системни настройки', sortOrder: 1200 }
];

const ALL_PERMISSION_CODES = AUTOGRAND_PERMISSIONS.map((permission) => permission.code);
const READ_ONLY_CODES = AUTOGRAND_PERMISSIONS
  .filter((permission) => permission.action === 'read' || permission.code === 'core.login')
  .map((permission) => permission.code);

export const AUTOGRAND_ROLE_TEMPLATES = [
  {
    code: 'ADMIN',
    name: 'Администратор',
    description: 'Пълен достъп до всички обекти, настройки, права и документи.',
    legacyRole: 'admin',
    level: 10,
    permissions: ALL_PERMISSION_CODES
  },
  {
    code: 'MANAGER',
    name: 'Управител обект',
    description: 'Управлява продажби, склад и трансфери за обекта си; вижда доставни цени.',
    legacyRole: 'manager',
    level: 30,
    permissions: [
      'core.login', 'core.change_context',
      'locations.read', 'users.read',
      'items.read', 'prices.read', 'prices.view_cost',
      'sales.read', 'sales.insert', 'sales.edit', 'sales.finish', 'sales.print', 'sales.annul',
      'purchases.read', 'purchases.insert', 'purchases.edit', 'purchases.finish', 'purchases.print',
      'stock.read', 'stock.print', 'stock.export',
      'transfer.read', 'transfer.request', 'transfer.dispatch', 'transfer.receive', 'transfer.return', 'transfer.print',
      'stock_adjustment.read', 'stock_adjustment.insert', 'stock_adjustment.edit', 'stock_adjustment.finish', 'stock_adjustment.print',
      'finance.read', 'reports.export'
    ]
  },
  {
    code: 'SALES',
    name: 'Продажби',
    description: 'Работа с клиенти, продажби, ценова листа и заявки за трансфер без доставни цени.',
    legacyRole: 'sales',
    level: 50,
    permissions: [
      'core.login',
      'locations.read',
      'items.read', 'prices.read',
      'sales.read', 'sales.insert', 'sales.edit', 'sales.finish', 'sales.print',
      'stock.read',
      'transfer.read', 'transfer.request', 'transfer.receive', 'transfer.print'
    ]
  },
  {
    code: 'WAREHOUSE',
    name: 'Склад',
    description: 'Складова работа, наличности, трансфери, приемане и изпращане без доставни цени.',
    legacyRole: 'warehouse',
    level: 60,
    permissions: [
      'core.login',
      'locations.read',
      'items.read', 'prices.read',
      'stock.read', 'stock.print',
      'transfer.read', 'transfer.request', 'transfer.dispatch', 'transfer.receive', 'transfer.return', 'transfer.print',
      'stock_adjustment.read', 'stock_adjustment.insert', 'stock_adjustment.edit', 'stock_adjustment.print'
    ]
  },
  {
    code: 'ACCOUNTING',
    name: 'Счетоводство',
    description: 'Преглед и приключване на документи, финанси, справки и доставни цени.',
    legacyRole: 'accounting',
    level: 70,
    permissions: [
      'core.login', 'locations.read', 'items.read', 'prices.read', 'prices.view_cost',
      'sales.read', 'sales.print',
      'purchases.read', 'purchases.finish', 'purchases.print',
      'stock.read', 'transfer.read', 'transfer.print',
      'finance.read', 'finance.edit', 'reports.export'
    ]
  },

  {
    code: 'CASHIER',
    name: 'Касиер / деловодител',
    description: 'Каса, деловодство, преглед и печат на документи за обекта без системни настройки.',
    legacyRole: 'cashier',
    level: 65,
    permissions: [
      'core.login',
      'locations.read',
      'items.read', 'prices.read',
      'sales.read', 'sales.print',
      'purchases.read', 'purchases.print',
      'stock.read',
      'transfer.read', 'transfer.print',
      'finance.read', 'finance.edit', 'reports.export'
    ]
  },
  {
    code: 'SALES_REP',
    name: 'Търговски представител',
    description: 'Работа с клиенти, продажбени документи, ценова листа, наличности и справки.',
    legacyRole: 'sales_rep',
    level: 55,
    permissions: [
      'core.login',
      'locations.read',
      'items.read', 'prices.read',
      'sales.read', 'sales.insert', 'sales.edit', 'sales.print',
      'stock.read',
      'transfer.read', 'transfer.request', 'transfer.print',
      'reports.export'
    ]
  },
  {
    code: 'READONLY',
    name: 'Само преглед',
    description: 'Безопасен профил за справки без редакция и приключване.',
    legacyRole: 'readonly',
    level: 90,
    permissions: READ_ONLY_CODES
  }
];

export const AUTOGRAND_REAL_KARDZHALI_USERS = [
  {
    username: 'stefan.admin',
    displayName: 'СТЕФАН ТАНАНОВ — АДМИНИСТРАТОР',
    employeeCode: 'EMP-KJ-STEFAN',
    employeeDisplayName: 'СТЕФАН ТАНАНОВ',
    employeePosition: 'Администратор / Управител',
    firstName: 'Стефан',
    lastName: 'Тананов',
    position: 'Администратор / Управител',
    roleCode: 'ADMIN',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: 'all-locations'
  },
  {
    username: 'stefan.manager',
    displayName: 'СТЕФАН ТАНАНОВ — УПРАВИТЕЛ',
    employeeCode: 'EMP-KJ-STEFAN',
    employeeDisplayName: 'СТЕФАН ТАНАНОВ',
    employeePosition: 'Администратор / Управител',
    firstName: 'Стефан',
    lastName: 'Тананов',
    position: 'Администратор / Управител',
    roleCode: 'MANAGER',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'angel.angelov',
    displayName: 'АНГЕЛ АНГЕЛОВ',
    employeeCode: 'EMP-KJ-ANGEL-ANGELOV',
    firstName: 'Ангел',
    lastName: 'Ангелов',
    position: 'Продавач консултант',
    roleCode: 'SALES',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'dimitar.mitrev',
    displayName: 'ДИМИТЪР МИТРЕВ',
    employeeCode: 'EMP-KJ-DIMITAR-MITREV',
    firstName: 'Димитър',
    lastName: 'Митрев',
    position: 'Продавач консултант',
    roleCode: 'SALES',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'svetoslav.kolev',
    displayName: 'СВЕТОСЛАВ КОЛЕВ',
    employeeCode: 'EMP-KJ-SVETOSLAV-KOLEV',
    firstName: 'Светослав',
    lastName: 'Колев',
    position: 'Продавач консултант',
    roleCode: 'SALES',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'stayko.staykov',
    displayName: 'СТАЙКО СТАЙКОВ',
    employeeCode: 'EMP-KJ-STAYKO-STAYKOV',
    firstName: 'Стайко',
    lastName: 'Стайков',
    position: 'Продавач консултант',
    roleCode: 'SALES',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'hyusnyu.rasim',
    displayName: 'ХЮСНЮ РАСИМ',
    employeeCode: 'EMP-KJ-HYUSNYU-RASIM',
    firstName: 'Хюсню',
    lastName: 'Расим',
    position: 'Продавач консултант',
    roleCode: 'SALES',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'edis.halil',
    displayName: 'ЕДИС ХАЛИЛ',
    employeeCode: 'EMP-KJ-EDIS-HALIL',
    firstName: 'Едис',
    lastName: 'Халил',
    position: 'Склад',
    roleCode: 'WAREHOUSE',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'galina.nikolova',
    displayName: 'ГАЛИНА НИКОЛОВА',
    employeeCode: 'EMP-KJ-GALINA-NIKOLOVA',
    firstName: 'Галина',
    lastName: 'Николова',
    position: 'Касиер / деловодител',
    roleCode: 'CASHIER',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  },
  {
    username: 'veselin.stoyanov',
    displayName: 'ВЕСЕЛИН СТОЯНОВ',
    employeeCode: 'EMP-KJ-VESELIN-STOYANOV',
    firstName: 'Веселин',
    lastName: 'Стоянов',
    position: 'Търговски представител',
    roleCode: 'SALES_REP',
    defaultLocationCode: DEFAULT_LOCATION_CODE,
    access: [DEFAULT_LOCATION_CODE]
  }
];

// Backward-compatible export used by the Step 4.2 seed script.
export const AUTOGRAND_DEMO_USERS = AUTOGRAND_REAL_KARDZHALI_USERS;

export function roleByCode(code) {
  return AUTOGRAND_ROLE_TEMPLATES.find((role) => role.code === code) || AUTOGRAND_ROLE_TEMPLATES.find((role) => role.code === 'READONLY');
}

export function permissionByCode(code) {
  return AUTOGRAND_PERMISSIONS.find((permission) => permission.code === code) || null;
}
