export const NAV_GROUPS = [
  {
    id: 'sales',
    title: 'Продажби',
    icon: '▣',
    open: true,
    items: [
      { id: 'price-list', title: 'Ценова листа', icon: '▤', href: '/price-list' },
      { id: 'advance-payments', title: 'Авансови плащания', icon: '▤' },
      { id: 'offers', title: 'Оферта', icon: '▤' },
      { id: 'customer-orders', title: 'Поръчки от клиенти', icon: '▤' },
      { id: 'sales', title: 'Продажби', icon: '▤' },
      { id: 'credit-note', title: 'Кредитно известие', icon: '▤' },
      { id: 'debit-note', title: 'Дебитно известие', icon: '▤' },
      { id: 'sales-payments', title: 'Плащания продажби', icon: '▤' },
      { id: 'sale-by-order', title: 'Продажба по поръчка', icon: '▤' },
      { id: 'free-credit-note-sale', title: 'Свободно КИ продажба', icon: '▤' },
      { id: 'free-invoice-sales', title: 'Свободна фактура продажби', icon: '▤' },
      { id: 'warranty-cards', title: 'Гаранционни карти', icon: '▤' },
      { id: 'daily-cash', title: 'Дневна каса', icon: '▥' }
    ],
    folders: ['Номенклатури', 'История', 'Настройки', 'Справки']
  },
  {
    id: 'purchase',
    title: 'Доставки',
    icon: '🚚',
    items: [
      { id: 'purchase-orders', title: 'Поръчки към доставчици', icon: '▤' },
      { id: 'supplier-invoices', title: 'Фактури доставчици', icon: '▤' },
      { id: 'deliveries', title: 'Доставки', icon: '▤' },
      { id: 'supplier-payments', title: 'Плащания доставки', icon: '▤' }
    ],
    folders: ['Номенклатури', 'История', 'Настройки', 'Справки']
  },
  {
    id: 'inventory',
    title: 'Склад',
    icon: '⌂',
    items: [
      { id: 'stock-dashboard', title: 'Складов център', icon: '▦', href: '/stock/dashboard' },
      { id: 'company-locations', title: 'Обекти и складове', icon: '⌂', href: '/locations' },
      { id: 'stock', title: 'Наличности', icon: '▤' },
      { id: 'stock-movements', title: 'Складови движения', icon: '⇅' },
      { id: 'stock-adjustment-new', title: 'Нова складова корекция', icon: '🧾', href: '/stock/adjustment/new' },
      { id: 'stock-adjustments', title: 'История складови корекции', icon: '▤' },
      { id: 'stock-transfer-new', title: 'Нов трансфер', icon: '⇄', href: '/stock/transfer/new' },
      { id: 'stock-transfers', title: 'История трансфери', icon: '▤' },
      { id: 'warehouses', title: 'Складове', icon: '▥' }
    ],
    folders: ['История', 'Настройки', 'Справки']
  },
  {
    id: 'finance',
    title: 'Финанси и счетоводство',
    icon: '▥',
    items: [
      { id: 'cash', title: 'Каса', icon: '▤' },
      { id: 'payments', title: 'Плащания', icon: '▤' },
      { id: 'sales-payments', title: 'Плащания продажби', icon: '▤' },
      { id: 'supplier-payments', title: 'Плащания доставки', icon: '▤' }
    ],
    folders: ['Справки', 'Настройки']
  },
  {
    id: 'nomenclatures',
    title: 'Номенклатури',
    icon: '◫',
    items: [
      { id: 'counterparties', title: 'Контрагенти', icon: '▤' },
      { id: 'items', title: 'Артикули', icon: '▤' },
      { id: 'item-groups', title: 'Групи артикули', icon: '▤' },
      { id: 'company-locations', title: 'Обекти и складове', icon: '⌂', href: '/locations' },
      { id: 'warehouses', title: 'Складове', icon: '▤' },
      { id: 'price-list', title: 'Ценова листа', icon: '▤', href: '/price-list' }
    ],
    folders: ['Настройки', 'Справки']
  },
  {
    id: 'service',
    title: 'Сервиз и поддръжка',
    icon: '⚙',
    items: [
      { id: 'service-orders', title: 'Сервизни поръчки', icon: '▤' },
      { id: 'vehicles', title: 'Автомобили в сервиз', icon: '▤' }
    ]
  },
  {
    id: 'commerce',
    title: 'Електронна търговия',
    icon: '◉',
    items: [
      { id: 'web-orders', title: 'Онлайн поръчки', icon: '▤' }
    ]
  },
  {
    id: 'vehicles',
    title: 'Автомобили',
    icon: '▰',
    items: [
      { id: 'vehicles', title: 'Автомобили', icon: '▤' },
      { id: 'service-orders', title: 'Сервизна история', icon: '▤' },
      { id: 'warranty-cards', title: 'Гаранции', icon: '▤' }
    ]
  },
  {
    id: 'admin',
    title: 'Администриране',
    icon: '⚙',
    items: [
      { id: 'company-locations', title: 'Обекти на фирмата', icon: '⌂', href: '/locations' },
      { id: 'users', title: 'Потребители', icon: '▤' },
      { id: 'settings', title: 'Настройки', icon: '▤' }
    ]
  },
  {
    id: 'quick',
    title: 'Бързи връзки',
    icon: '☆',
    items: [
      { id: 'reference-map', title: 'Client Reference Map', icon: '▤' }
    ]
  }
];

export function decorateNavigation(currentScreenId = '') {
  return NAV_GROUPS.map((group) => {
    const hasActiveItem = group.items.some((item) => item.id === currentScreenId);
    return {
      ...group,
      isOpen: group.open || hasActiveItem,
      items: group.items.map((item) => ({
        ...item,
        href: item.href || (item.id === 'reference-map' ? '/reference' : `/screen/${item.id}`),
        active: item.id === currentScreenId
      }))
    };
  });
}