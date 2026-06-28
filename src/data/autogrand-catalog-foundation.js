// Step 4.3 — Items, Units, VAT, Prices and Suppliers Foundation
// Moneta-aligned static foundation used before the full Prisma catalogue schema is introduced.
// Reference concepts observed in Moneta client packages: N_Item, N_ItemCategory,
// N_ItemProductGroup, N_ItemProductClass, Measure_Id, R_ItemUnitOfMeasure,
// G_VATPostingSetup, VATBus_PostingGroup, VATProd_PostingGroup, N_Contragent,
// N_ItemCrossRef and N_ItemUnitPriceHistory.

export const STEP_4_3_CATALOG_FOUNDATION_VERSION = '0.4.7';

export const AUTOGRAND_MEASURES = [
  {
    code: 'PCS',
    monetaField: 'Measure_Id',
    name: 'Брой',
    shortName: 'бр.',
    decimalPlaces: 0,
    type: 'COUNT',
    isBase: true,
    note: 'Основна мерна единица за резервни части и аксесоари.'
  },
  {
    code: 'SET',
    monetaField: 'Measure_Id',
    name: 'Комплект',
    shortName: 'к-т',
    decimalPlaces: 0,
    type: 'COUNT',
    isBase: false,
    note: 'Комплект артикули, напр. комплект накладки или филтри.'
  },
  {
    code: 'L',
    monetaField: 'Measure_Id',
    name: 'Литър',
    shortName: 'л',
    decimalPlaces: 3,
    type: 'VOLUME',
    isBase: false,
    note: 'Масла, антифриз, течности и добавки.'
  },
  {
    code: 'KG',
    monetaField: 'Measure_Id',
    name: 'Килограм',
    shortName: 'кг',
    decimalPlaces: 3,
    type: 'WEIGHT',
    isBase: false,
    note: 'Консумативи, насипни материали и сервизни материали.'
  },
  {
    code: 'HOUR',
    monetaField: 'Measure_Id',
    name: 'Час труд',
    shortName: 'ч',
    decimalPlaces: 2,
    type: 'SERVICE',
    isBase: false,
    note: 'Сервизни операции и работно време.'
  },
  {
    code: 'PACK',
    monetaField: 'PurchMeasure',
    name: 'Опаковка',
    shortName: 'оп.',
    decimalPlaces: 0,
    type: 'PACKAGE',
    isBase: false,
    note: 'Доставна опаковка с коефициент към базова единица.'
  }
];

export const AUTOGRAND_ITEM_UNIT_CONVERSIONS = [
  {
    itemCode: 'AG-OIL-5W30-1L',
    measureCode: 'L',
    purchMeasureCode: 'PACK',
    qtyPerUnitOfMeasure: 12,
    note: '12 литра в доставна опаковка.'
  },
  {
    itemCode: 'AG-FIL-001',
    measureCode: 'PCS',
    purchMeasureCode: 'PACK',
    qtyPerUnitOfMeasure: 10,
    note: '10 броя в кашон.'
  },
  {
    itemCode: 'AG-BRK-PADS-FR',
    measureCode: 'SET',
    purchMeasureCode: 'SET',
    qtyPerUnitOfMeasure: 1,
    note: 'Продажба и доставка като комплект.'
  }
];

export const AUTOGRAND_ITEM_CATEGORIES = [
  {
    code: 'PARTS',
    monetaName: 'N_ItemCategory',
    name: 'Резервни части',
    kind: 'GOODS',
    stockControl: true,
    note: 'Материални артикули със складово движение.'
  },
  {
    code: 'CONSUMABLES',
    monetaName: 'N_ItemCategory',
    name: 'Консумативи',
    kind: 'GOODS',
    stockControl: true,
    note: 'Масла, течности и сервизни консумативи.'
  },
  {
    code: 'SERVICES',
    monetaName: 'N_ItemCategory',
    name: 'Услуги',
    kind: 'SERVICE',
    stockControl: false,
    note: 'Услуги без складово количество.'
  },
  {
    code: 'GOODS',
    monetaName: 'N_ItemCategory',
    name: 'Стоки',
    kind: 'GOODS',
    stockControl: true,
    note: 'Аксесоари и търговски артикули.'
  }
];

export const AUTOGRAND_ITEM_PRODUCT_GROUPS = [
  {
    code: 'FILTERS',
    monetaName: 'N_ItemProductGroup',
    name: 'Филтри',
    categoryCode: 'PARTS',
    defaultMeasureCode: 'PCS',
    defaultVatProdGroupCode: 'VAT20-PARTS',
    stockControl: true
  },
  {
    code: 'OILS',
    monetaName: 'N_ItemProductGroup',
    name: 'Масла и течности',
    categoryCode: 'CONSUMABLES',
    defaultMeasureCode: 'L',
    defaultVatProdGroupCode: 'VAT20-CONSUMABLES',
    stockControl: true
  },
  {
    code: 'BRAKES',
    monetaName: 'N_ItemProductGroup',
    name: 'Спирачна система',
    categoryCode: 'PARTS',
    defaultMeasureCode: 'SET',
    defaultVatProdGroupCode: 'VAT20-PARTS',
    stockControl: true
  },
  {
    code: 'TYRES',
    monetaName: 'N_ItemProductGroup',
    name: 'Гуми',
    categoryCode: 'PARTS',
    defaultMeasureCode: 'PCS',
    defaultVatProdGroupCode: 'VAT20-PARTS',
    stockControl: true
  },
  {
    code: 'SERVICE',
    monetaName: 'N_ItemProductGroup',
    name: 'Сервизни услуги',
    categoryCode: 'SERVICES',
    defaultMeasureCode: 'HOUR',
    defaultVatProdGroupCode: 'VAT20-SERVICE',
    stockControl: false
  },
  {
    code: 'ACCESSORIES',
    monetaName: 'N_ItemProductGroup',
    name: 'Аксесоари',
    categoryCode: 'GOODS',
    defaultMeasureCode: 'PCS',
    defaultVatProdGroupCode: 'VAT20-GOODS',
    stockControl: true
  }
];

export const AUTOGRAND_ITEM_PRODUCT_CLASSES = [
  {
    code: 'FAST_MOVING',
    monetaName: 'N_ItemProductClass',
    name: 'Бързооборотни',
    replenishmentPolicy: 'MIN_MAX',
    note: 'Следят минимални количества и заявки към склад.'
  },
  {
    code: 'ORDER_ONLY',
    monetaName: 'N_ItemProductClass',
    name: 'По заявка',
    replenishmentPolicy: 'ORDER_ONLY',
    note: 'Поддържат се с доставна поръчка, без голям локален запас.'
  },
  {
    code: 'SERVICE_ONLY',
    monetaName: 'N_ItemProductClass',
    name: 'Само услуга',
    replenishmentPolicy: 'NO_STOCK',
    note: 'Без складови движения.'
  }
];

export const AUTOGRAND_ITEM_TEMPLATES = [
  {
    code: 'TEMPLATE-PART',
    monetaForm: 'TfEdItemTemplate',
    name: 'Шаблон резервна част',
    itemCategoryCode: 'PARTS',
    itemProductClassCode: 'FAST_MOVING',
    trackStock: true,
    priceIncludingVAT: true
  },
  {
    code: 'TEMPLATE-CONSUMABLE',
    monetaForm: 'TfEdItemTemplate',
    name: 'Шаблон консуматив',
    itemCategoryCode: 'CONSUMABLES',
    itemProductClassCode: 'FAST_MOVING',
    trackStock: true,
    priceIncludingVAT: true
  },
  {
    code: 'TEMPLATE-SERVICE',
    monetaForm: 'TfEdItemTemplate',
    name: 'Шаблон услуга',
    itemCategoryCode: 'SERVICES',
    itemProductClassCode: 'SERVICE_ONLY',
    trackStock: false,
    priceIncludingVAT: true
  }
];

export const AUTOGRAND_VAT_BUSINESS_POSTING_GROUPS = [
  {
    code: 'BG-CUSTOMER',
    monetaField: 'VATBus_PostingGroup',
    name: 'Клиент България',
    countryCode: 'BG'
  },
  {
    code: 'BG-SUPPLIER',
    monetaField: 'VATBus_PostingGroup',
    name: 'Доставчик България',
    countryCode: 'BG'
  },
  {
    code: 'INTERNAL',
    monetaField: 'VATBus_PostingGroup',
    name: 'Вътрешен трансфер',
    countryCode: 'BG'
  }
];

export const AUTOGRAND_VAT_PRODUCT_POSTING_GROUPS = [
  {
    code: 'VAT20-PARTS',
    monetaField: 'VATProd_PostingGroup',
    name: 'Резервни части ДДС 20%',
    vatPercent: 20,
    vat0Type: null
  },
  {
    code: 'VAT20-CONSUMABLES',
    monetaField: 'VATProd_PostingGroup',
    name: 'Консумативи ДДС 20%',
    vatPercent: 20,
    vat0Type: null
  },
  {
    code: 'VAT20-GOODS',
    monetaField: 'VATProd_PostingGroup',
    name: 'Стоки ДДС 20%',
    vatPercent: 20,
    vat0Type: null
  },
  {
    code: 'VAT20-SERVICE',
    monetaField: 'VATProd_PostingGroup',
    name: 'Услуги ДДС 20%',
    vatPercent: 20,
    vat0Type: null
  },
  {
    code: 'VAT0-EXPORT',
    monetaField: 'VATProd_PostingGroup',
    name: 'Нулева ставка / износ',
    vatPercent: 0,
    vat0Type: 'EXPORT'
  }
];

export const AUTOGRAND_VAT_POSTING_SETUP = [
  {
    code: 'BG-CUSTOMER__VAT20-PARTS',
    monetaName: 'G_VATPostingSetup',
    vatBusPostingGroupCode: 'BG-CUSTOMER',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    vatPercent: 20,
    vatCalculationType: 'NORMAL_VAT',
    priceIncludingVAT: true,
    vatLedger: 'SALES'
  },
  {
    code: 'BG-CUSTOMER__VAT20-CONSUMABLES',
    monetaName: 'G_VATPostingSetup',
    vatBusPostingGroupCode: 'BG-CUSTOMER',
    vatProdPostingGroupCode: 'VAT20-CONSUMABLES',
    vatPercent: 20,
    vatCalculationType: 'NORMAL_VAT',
    priceIncludingVAT: true,
    vatLedger: 'SALES'
  },
  {
    code: 'BG-CUSTOMER__VAT20-SERVICE',
    monetaName: 'G_VATPostingSetup',
    vatBusPostingGroupCode: 'BG-CUSTOMER',
    vatProdPostingGroupCode: 'VAT20-SERVICE',
    vatPercent: 20,
    vatCalculationType: 'NORMAL_VAT',
    priceIncludingVAT: true,
    vatLedger: 'SALES'
  },
  {
    code: 'BG-SUPPLIER__VAT20-PARTS',
    monetaName: 'G_VATPostingSetup',
    vatBusPostingGroupCode: 'BG-SUPPLIER',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    vatPercent: 20,
    vatCalculationType: 'NORMAL_VAT',
    priceIncludingVAT: false,
    vatLedger: 'PURCHASE'
  },
  {
    code: 'INTERNAL__VAT20-PARTS',
    monetaName: 'G_VATPostingSetup',
    vatBusPostingGroupCode: 'INTERNAL',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    vatPercent: 0,
    vatCalculationType: 'INTERNAL_NO_VAT',
    priceIncludingVAT: false,
    vatLedger: 'NONE'
  }
];

export const AUTOGRAND_PRICE_LEVELS = [
  {
    code: 'RETAIL',
    monetaForm: 'TfEdPrices',
    name: 'Продажна цена',
    priority: 10,
    currency: 'BGN',
    includesVat: true,
    priceField: 'UnitPrice',
    priceNoVatField: 'UnitPriceNoVAT',
    roleHint: 'Клиентска продажба / POS / фактура'
  },
  {
    code: 'WHOLESALE',
    monetaForm: 'TfBrPriceList',
    name: 'Партньорска цена',
    priority: 20,
    currency: 'BGN',
    includesVat: true,
    priceField: 'UnitPrice',
    priceNoVatField: 'UnitPriceNoVAT',
    roleHint: 'Фирмени клиенти и сервизни партньори'
  },
  {
    code: 'INTERNAL',
    monetaForm: 'N_ItemUnitPriceHistory',
    name: 'Вътрешна цена',
    priority: 30,
    currency: 'BGN',
    includesVat: false,
    priceField: 'UnitCost',
    priceNoVatField: 'UnitCost',
    roleHint: 'Себестойност, трансфери, контрол и справки'
  }
];

export const AUTOGRAND_CONTRAGENTS = [
  {
    code: 'CTR-AG-CENTRAL',
    monetaName: 'N_Contragent',
    name: 'Автогранд централен склад',
    vatNumber: 'BG000000001',
    roles: ['SUPPLIER', 'INTERNAL'],
    city: 'Стара Загора',
    paymentTerms: 'Вътрешен трансфер',
    leadTimeDays: 1,
    isPreferredSupplier: true,
    itemProductGroupCodes: ['FILTERS', 'OILS', 'BRAKES', 'TYRES', 'ACCESSORIES']
  },
  {
    code: 'CTR-OILS',
    monetaName: 'N_Contragent',
    name: 'Доставчик масла и течности',
    vatNumber: 'BG000000002',
    roles: ['SUPPLIER'],
    city: 'Пловдив',
    paymentTerms: '7 дни',
    leadTimeDays: 2,
    isPreferredSupplier: true,
    itemProductGroupCodes: ['OILS']
  },
  {
    code: 'CTR-PARTS',
    monetaName: 'N_Contragent',
    name: 'Доставчик резервни части',
    vatNumber: 'BG000000003',
    roles: ['SUPPLIER'],
    city: 'София',
    paymentTerms: '14 дни',
    leadTimeDays: 3,
    isPreferredSupplier: true,
    itemProductGroupCodes: ['FILTERS', 'BRAKES', 'ACCESSORIES']
  },
  {
    code: 'CTR-TYRES',
    monetaName: 'N_Contragent',
    name: 'Доставчик гуми',
    vatNumber: 'BG000000004',
    roles: ['SUPPLIER'],
    city: 'Бургас',
    paymentTerms: '30 дни',
    leadTimeDays: 4,
    isPreferredSupplier: false,
    itemProductGroupCodes: ['TYRES']
  }
];

export const AUTOGRAND_CATALOG_ITEMS = [
  {
    code: 'AG-FIL-001',
    monetaName: 'N_Item',
    barcode: '3800000000011',
    name: 'Маслен филтър универсален',
    itemCategoryCode: 'PARTS',
    itemProductGroupCode: 'FILTERS',
    itemProductClassCode: 'FAST_MOVING',
    itemTemplateCode: 'TEMPLATE-PART',
    measureCode: 'PCS',
    purchMeasureCode: 'PACK',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    preferredSupplierCode: 'CTR-PARTS',
    minStock: 6,
    unitCost: 7.2,
    prices: { INTERNAL: 7.2, WHOLESALE: 10.8, RETAIL: 14.4 },
    priceIncludingVAT: true,
    locations: ['AG-KJ-SHOP', 'AG-STZ-WH']
  },
  {
    code: 'AG-FIL-002',
    monetaName: 'N_Item',
    barcode: '3800000000028',
    name: 'Въздушен филтър стандарт',
    itemCategoryCode: 'PARTS',
    itemProductGroupCode: 'FILTERS',
    itemProductClassCode: 'FAST_MOVING',
    itemTemplateCode: 'TEMPLATE-PART',
    measureCode: 'PCS',
    purchMeasureCode: 'PACK',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    preferredSupplierCode: 'CTR-PARTS',
    minStock: 5,
    unitCost: 12.5,
    prices: { INTERNAL: 12.5, WHOLESALE: 17.4, RETAIL: 22.9 },
    priceIncludingVAT: true,
    locations: ['AG-KJ-SHOP', 'AG-STZ-WH']
  },
  {
    code: 'AG-OIL-5W30-1L',
    monetaName: 'N_Item',
    barcode: '3800000000035',
    name: 'Моторно масло 5W30 1L',
    itemCategoryCode: 'CONSUMABLES',
    itemProductGroupCode: 'OILS',
    itemProductClassCode: 'FAST_MOVING',
    itemTemplateCode: 'TEMPLATE-CONSUMABLE',
    measureCode: 'L',
    purchMeasureCode: 'PACK',
    vatProdPostingGroupCode: 'VAT20-CONSUMABLES',
    preferredSupplierCode: 'CTR-OILS',
    minStock: 12,
    unitCost: 10.9,
    prices: { INTERNAL: 10.9, WHOLESALE: 14.9, RETAIL: 18.9 },
    priceIncludingVAT: true,
    locations: ['AG-KJ-SHOP', 'AG-STZ-WH', 'AG-STZ-CENTRAL']
  },
  {
    code: 'AG-BRK-PADS-FR',
    monetaName: 'N_Item',
    barcode: '3800000000042',
    name: 'Комплект предни накладки',
    itemCategoryCode: 'PARTS',
    itemProductGroupCode: 'BRAKES',
    itemProductClassCode: 'FAST_MOVING',
    itemTemplateCode: 'TEMPLATE-PART',
    measureCode: 'SET',
    purchMeasureCode: 'SET',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    preferredSupplierCode: 'CTR-PARTS',
    minStock: 3,
    unitCost: 38,
    prices: { INTERNAL: 38, WHOLESALE: 52, RETAIL: 68 },
    priceIncludingVAT: true,
    locations: ['AG-KJ-SHOP', 'AG-STZ-WH']
  },
  {
    code: 'AG-TYR-2055516',
    monetaName: 'N_Item',
    barcode: '3800000000059',
    name: 'Гума 205/55 R16 летен профил',
    itemCategoryCode: 'PARTS',
    itemProductGroupCode: 'TYRES',
    itemProductClassCode: 'ORDER_ONLY',
    itemTemplateCode: 'TEMPLATE-PART',
    measureCode: 'PCS',
    purchMeasureCode: 'PCS',
    vatProdPostingGroupCode: 'VAT20-PARTS',
    preferredSupplierCode: 'CTR-TYRES',
    minStock: 4,
    unitCost: 92,
    prices: { INTERNAL: 92, WHOLESALE: 118, RETAIL: 149 },
    priceIncludingVAT: true,
    locations: ['AG-STZ-WH']
  },
  {
    code: 'AG-SRV-DIAG',
    monetaName: 'N_Item',
    barcode: '',
    name: 'Компютърна диагностика',
    itemCategoryCode: 'SERVICES',
    itemProductGroupCode: 'SERVICE',
    itemProductClassCode: 'SERVICE_ONLY',
    itemTemplateCode: 'TEMPLATE-SERVICE',
    measureCode: 'HOUR',
    purchMeasureCode: 'HOUR',
    vatProdPostingGroupCode: 'VAT20-SERVICE',
    preferredSupplierCode: 'CTR-AG-CENTRAL',
    minStock: 0,
    unitCost: 0,
    prices: { INTERNAL: 0, WHOLESALE: 30, RETAIL: 45 },
    priceIncludingVAT: true,
    locations: ['AG-KJ-SHOP']
  }
];

export const AUTOGRAND_ITEM_CROSS_REFERENCES = [
  {
    itemCode: 'AG-FIL-001',
    monetaName: 'N_ItemCrossRef',
    contragentCode: 'CTR-PARTS',
    supplierItemCode: 'FIL-OIL-U-001',
    supplierBarcode: 'PARTS-FIL-001',
    referenceType: 'SUPPLIER_CODE'
  },
  {
    itemCode: 'AG-OIL-5W30-1L',
    monetaName: 'N_ItemCrossRef',
    contragentCode: 'CTR-OILS',
    supplierItemCode: 'OIL-5W30-1L',
    supplierBarcode: 'OILS-5W30-001',
    referenceType: 'SUPPLIER_CODE'
  },
  {
    itemCode: 'AG-TYR-2055516',
    monetaName: 'N_ItemCrossRef',
    contragentCode: 'CTR-TYRES',
    supplierItemCode: 'TYR-205-55-R16-SUMMER',
    supplierBarcode: 'TYRES-2055516',
    referenceType: 'SUPPLIER_CODE'
  }
];

export const AUTOGRAND_ITEM_UNIT_PRICE_HISTORY = [
  {
    itemCode: 'AG-FIL-001',
    monetaName: 'N_ItemUnitPriceHistory',
    priceLevelCode: 'RETAIL',
    unitPrice: 14.4,
    unitPriceNoVAT: 12,
    unitCost: 7.2,
    priceIncludingVAT: true,
    validFrom: '2026-01-01'
  },
  {
    itemCode: 'AG-OIL-5W30-1L',
    monetaName: 'N_ItemUnitPriceHistory',
    priceLevelCode: 'RETAIL',
    unitPrice: 18.9,
    unitPriceNoVAT: 15.75,
    unitCost: 10.9,
    priceIncludingVAT: true,
    validFrom: '2026-01-01'
  },
  {
    itemCode: 'AG-BRK-PADS-FR',
    monetaName: 'N_ItemUnitPriceHistory',
    priceLevelCode: 'RETAIL',
    unitPrice: 68,
    unitPriceNoVAT: 56.67,
    unitCost: 38,
    priceIncludingVAT: true,
    validFrom: '2026-01-01'
  }
];

// Backward-compatible aliases used by existing Step 4.3 checks and templates.
export const AUTOGRAND_UNITS = AUTOGRAND_MEASURES;
export const AUTOGRAND_VAT_GROUPS = AUTOGRAND_VAT_PRODUCT_POSTING_GROUPS.map((group) => ({
  code: group.code,
  name: group.name,
  rate: group.vatPercent,
  factor: group.vatPercent === 20 ? 1.2 : 1,
  isDefault: group.code === 'VAT20-PARTS',
  salesText: group.vatPercent === 20 ? 'Продажба с начислен ДДС 20%' : 'Нулева ставка / специален режим'
}));
export const AUTOGRAND_ITEM_GROUPS = AUTOGRAND_ITEM_PRODUCT_GROUPS.map((group) => ({
  code: group.code,
  name: group.name,
  parentCode: group.categoryCode,
  defaultUnitCode: group.defaultMeasureCode,
  defaultVatCode: group.defaultVatProdGroupCode,
  stockControl: group.stockControl
}));
export const AUTOGRAND_SUPPLIERS = AUTOGRAND_CONTRAGENTS
  .filter((contragent) => contragent.roles.includes('SUPPLIER'))
  .map((contragent) => ({
    code: contragent.code,
    name: contragent.name,
    vatNumber: contragent.vatNumber,
    type: contragent.roles.includes('INTERNAL') ? 'INTERNAL' : 'EXTERNAL',
    city: contragent.city,
    paymentTerms: contragent.paymentTerms,
    leadTimeDays: contragent.leadTimeDays,
    isPreferred: contragent.isPreferredSupplier,
    groups: contragent.itemProductGroupCodes
  }));

export const AUTOGRAND_CATALOG_FOUNDATION = {
  measures: AUTOGRAND_MEASURES,
  units: AUTOGRAND_UNITS,
  itemUnitConversions: AUTOGRAND_ITEM_UNIT_CONVERSIONS,
  itemCategories: AUTOGRAND_ITEM_CATEGORIES,
  itemProductGroups: AUTOGRAND_ITEM_PRODUCT_GROUPS,
  itemProductClasses: AUTOGRAND_ITEM_PRODUCT_CLASSES,
  itemTemplates: AUTOGRAND_ITEM_TEMPLATES,
  vatBusinessPostingGroups: AUTOGRAND_VAT_BUSINESS_POSTING_GROUPS,
  vatProductPostingGroups: AUTOGRAND_VAT_PRODUCT_POSTING_GROUPS,
  vatPostingSetup: AUTOGRAND_VAT_POSTING_SETUP,
  vatGroups: AUTOGRAND_VAT_GROUPS,
  priceLevels: AUTOGRAND_PRICE_LEVELS,
  contragents: AUTOGRAND_CONTRAGENTS,
  suppliers: AUTOGRAND_SUPPLIERS,
  items: AUTOGRAND_CATALOG_ITEMS,
  itemCrossReferences: AUTOGRAND_ITEM_CROSS_REFERENCES,
  itemUnitPriceHistory: AUTOGRAND_ITEM_UNIT_PRICE_HISTORY
};
