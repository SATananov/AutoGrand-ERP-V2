import {
  AUTOGRAND_CATALOG_FOUNDATION,
  STEP_4_3_CATALOG_FOUNDATION_VERSION
} from '../data/autogrand-catalog-foundation.js';

export const STEP_4_3_CATALOG_HEALTH_LABEL = '4-3-items-units-vat-prices-suppliers-foundation';

function money(value) {
  return new Intl.NumberFormat('bg-BG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function byCode(rows = []) {
  return new Map(rows.map((row) => [row.code, row]));
}

function yesNo(value) {
  return value ? 'Да' : 'Не';
}

function joinCodes(rows = []) {
  return rows.length ? rows.join(', ') : '—';
}

function supplierGroupText(supplier = {}) {
  return joinCodes(supplier.groups || supplier.itemProductGroupCodes || []);
}

function itemPriceRows(item = {}, priceLevels = []) {
  return priceLevels.map((level) => ({
    code: level.code,
    name: level.name,
    amountText: `${money(item.prices?.[level.code])} ${level.currency}`,
    includesVatText: level.includesVat ? 'с ДДС' : 'без ДДС',
    fieldText: level.priceField || 'UnitPrice'
  }));
}

function vatSetupName(setup = {}, businessByCode, productByCode) {
  const business = businessByCode.get(setup.vatBusPostingGroupCode);
  const product = productByCode.get(setup.vatProdPostingGroupCode);
  return `${business?.name || setup.vatBusPostingGroupCode} × ${product?.name || setup.vatProdPostingGroupCode}`;
}

export function getCatalogFoundationData() {
  const foundation = AUTOGRAND_CATALOG_FOUNDATION;
  const measureByCode = byCode(foundation.measures);
  const categoryByCode = byCode(foundation.itemCategories);
  const productGroupByCode = byCode(foundation.itemProductGroups);
  const productClassByCode = byCode(foundation.itemProductClasses);
  const templateByCode = byCode(foundation.itemTemplates);
  const vatProductByCode = byCode(foundation.vatProductPostingGroups);
  const vatBusinessByCode = byCode(foundation.vatBusinessPostingGroups);
  const contragentByCode = byCode(foundation.contragents);

  const itemCrossRefsByItem = foundation.itemCrossReferences.reduce((acc, row) => {
    acc[row.itemCode] = acc[row.itemCode] || [];
    acc[row.itemCode].push(row);
    return acc;
  }, {});

  const items = foundation.items.map((item) => {
    const category = categoryByCode.get(item.itemCategoryCode);
    const productGroup = productGroupByCode.get(item.itemProductGroupCode);
    const productClass = productClassByCode.get(item.itemProductClassCode);
    const template = templateByCode.get(item.itemTemplateCode);
    const measure = measureByCode.get(item.measureCode);
    const purchMeasure = measureByCode.get(item.purchMeasureCode);
    const vatProduct = vatProductByCode.get(item.vatProdPostingGroupCode);
    const supplier = contragentByCode.get(item.preferredSupplierCode);
    const crossRefs = itemCrossRefsByItem[item.code] || [];

    return {
      ...item,
      categoryName: category?.name || item.itemCategoryCode,
      groupName: productGroup?.name || item.itemProductGroupCode,
      productClassName: productClass?.name || item.itemProductClassCode,
      templateName: template?.name || item.itemTemplateCode,
      unitName: measure?.shortName || item.measureCode,
      purchaseUnitName: purchMeasure?.shortName || item.purchMeasureCode,
      vatName: vatProduct?.name || item.vatProdPostingGroupCode,
      vatPercentText: `${vatProduct?.vatPercent ?? 0}%`,
      supplierName: supplier?.name || item.preferredSupplierCode,
      supplierCodeText: crossRefs.map((row) => row.supplierItemCode).join(', ') || '—',
      retailPriceText: `${money(item.prices?.RETAIL)} BGN`,
      internalPriceText: `${money(item.prices?.INTERNAL)} BGN`,
      stockLocationText: (item.locations || []).join(', '),
      priceRows: itemPriceRows(item, foundation.priceLevels),
      priceIncludingVATText: yesNo(item.priceIncludingVAT)
    };
  });

  const suppliers = foundation.suppliers.map((supplier) => ({
    ...supplier,
    groupsText: supplierGroupText(supplier),
    preferredText: yesNo(supplier.isPreferred)
  }));

  const contragents = foundation.contragents.map((contragent) => ({
    ...contragent,
    rolesText: joinCodes(contragent.roles),
    groupsText: joinCodes(contragent.itemProductGroupCodes),
    preferredText: yesNo(contragent.isPreferredSupplier)
  }));

  const vatPostingSetup = foundation.vatPostingSetup.map((setup) => ({
    ...setup,
    nameText: vatSetupName(setup, vatBusinessByCode, vatProductByCode),
    priceIncludingVATText: yesNo(setup.priceIncludingVAT)
  }));

  const itemUnitConversions = foundation.itemUnitConversions.map((row) => ({
    ...row,
    measureName: measureByCode.get(row.measureCode)?.shortName || row.measureCode,
    purchMeasureName: measureByCode.get(row.purchMeasureCode)?.shortName || row.purchMeasureCode
  }));

  const itemCategories = foundation.itemCategories.map((category) => ({
    ...category,
    stockControlText: yesNo(category.stockControl)
  }));

  const itemProductGroups = foundation.itemProductGroups.map((group) => ({
    ...group,
    categoryName: categoryByCode.get(group.categoryCode)?.name || group.categoryCode,
    stockControlText: yesNo(group.stockControl)
  }));

  const stockControlledGroups = foundation.itemProductGroups.filter((group) => group.stockControl).length;
  const serviceGroups = foundation.itemProductGroups.filter((group) => !group.stockControl).length;
  const preferredSuppliers = foundation.contragents.filter((supplier) => supplier.isPreferredSupplier).length;

  return {
    version: STEP_4_3_CATALOG_FOUNDATION_VERSION,
    healthLabel: STEP_4_3_CATALOG_HEALTH_LABEL,
    monetaConcepts: [
      'N_Item',
      'N_ItemCategory',
      'N_ItemProductGroup',
      'N_ItemProductClass',
      'R_ItemUnitOfMeasure',
      'G_VATPostingSetup',
      'N_Contragent',
      'N_ItemCrossRef',
      'N_ItemUnitPriceHistory'
    ],
    summaryCards: [
      { label: 'Артикули', value: items.length, hint: 'N_Item foundation SKU редове' },
      { label: 'Мерни единици', value: foundation.measures.length, hint: 'Measure_Id / PurchMeasure' },
      { label: 'ДДС setup', value: vatPostingSetup.length, hint: 'G_VATPostingSetup' },
      { label: 'Контрагенти', value: contragents.length, hint: `${preferredSuppliers} предпочитани доставчици` }
    ],
    operationalCards: [
      { label: 'Категории', value: foundation.itemCategories.length, hint: 'N_ItemCategory' },
      { label: 'Продуктови групи', value: foundation.itemProductGroups.length, hint: `${stockControlledGroups} складови / ${serviceGroups} услуги` },
      { label: 'Ценови нива', value: foundation.priceLevels.length, hint: 'TfEdPrices / TfBrPriceList' },
      { label: 'Cross refs', value: foundation.itemCrossReferences.length, hint: 'N_ItemCrossRef' }
    ],
    measures: foundation.measures,
    units: foundation.units,
    itemUnitConversions,
    itemCategories,
    itemProductGroups,
    itemProductClasses: foundation.itemProductClasses,
    itemTemplates: foundation.itemTemplates,
    vatBusinessPostingGroups: foundation.vatBusinessPostingGroups,
    vatProductPostingGroups: foundation.vatProductPostingGroups,
    vatPostingSetup,
    vatGroups: foundation.vatGroups,
    priceLevels: foundation.priceLevels,
    contragents,
    suppliers,
    items,
    itemCrossReferences: foundation.itemCrossReferences,
    itemUnitPriceHistory: foundation.itemUnitPriceHistory
  };
}

export function getCatalogFoundationDiagnostics() {
  const catalog = getCatalogFoundationData();
  return {
    ok: true,
    version: catalog.version,
    healthLabel: catalog.healthLabel,
    monetaConcepts: catalog.monetaConcepts,
    counts: {
      measures: catalog.measures.length,
      itemCategories: catalog.itemCategories.length,
      itemProductGroups: catalog.itemProductGroups.length,
      itemProductClasses: catalog.itemProductClasses.length,
      itemTemplates: catalog.itemTemplates.length,
      vatBusinessPostingGroups: catalog.vatBusinessPostingGroups.length,
      vatProductPostingGroups: catalog.vatProductPostingGroups.length,
      vatPostingSetup: catalog.vatPostingSetup.length,
      priceLevels: catalog.priceLevels.length,
      contragents: catalog.contragents.length,
      suppliers: catalog.suppliers.length,
      items: catalog.items.length,
      itemCrossReferences: catalog.itemCrossReferences.length,
      itemUnitPriceHistory: catalog.itemUnitPriceHistory.length,
      // Legacy counters kept for older smoke checks.
      units: catalog.units.length,
      vatGroups: catalog.vatGroups.length
    }
  };
}
