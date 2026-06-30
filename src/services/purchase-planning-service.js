// AutoGrand ERP V2 - Step 4.13 Purchase Planning / Procurement Decision Center Foundation
// Read-only procurement decision support over the existing Inventory Planning supplier recommendations.
// Guardrail: no purchase document creation, no stock posting, no stock journal mutation, no auto-approval.

import {
  getInventoryPlanningSnapshot,
  getInventoryPlanningSupplierRecommendations,
} from "./inventory-planning-service.js";

const STEP_4_13 = "4.13";
const STEP_4_13_HEALTH_LABEL = "4-13-purchase-planning-procurement-decision-center-foundation";

const PROCUREMENT_POLICY = Object.freeze({
  budgetWarningLimit: 2500,
  budgetReviewLimit: 5000,
  criticalSupplierLimit: 3,
  topDecisionLimit: 6,
  topLineLimit: 8,
});

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatQty(value) {
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 }).format(Math.max(0, toNumber(value)));
}

function formatMoney(value) {
  return new Intl.NumberFormat("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, toNumber(value)));
}

function uniqueList(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function procurementTone(priority = "stable") {
  if (priority === "critical") return "danger";
  if (priority === "reorder" || priority === "watch") return "warning";
  if (priority === "slow") return "muted";
  return "ok";
}

function budgetBand(value) {
  const amount = toNumber(value);
  if (amount >= PROCUREMENT_POLICY.budgetReviewLimit) {
    return {
      code: "review",
      label: "Бюджетен преглед",
      tone: "danger",
      note: "Над високия праг — изисква управленско потвърждение преди ръчна покупка.",
    };
  }

  if (amount >= PROCUREMENT_POLICY.budgetWarningLimit) {
    return {
      code: "watch",
      label: "Бюджетно внимание",
      tone: "warning",
      note: "Среден праг — провери cash/budget контекста преди purchase документ.",
    };
  }

  return {
    code: "normal",
    label: "В нормален праг",
    tone: "ok",
    note: "Ориентирът е под warning прага, но документът пак се създава само ръчно.",
  };
}

function readinessForSupplier(supplier = {}) {
  const criticalCount = toNumber(supplier.criticalCount);
  const reorderLineCount = toNumber(supplier.reorderLineCount);
  const value = toNumber(supplier.recommendedOrderValueTotal);

  if (criticalCount > 0) {
    return {
      code: "urgent-review",
      label: "Нужен е спешен преглед",
      tone: "danger",
      nextAction: "Провери критичните редове, наличности и последни доставки преди ръчна заявка.",
    };
  }

  if (reorderLineCount > 0 && value >= PROCUREMENT_POLICY.budgetWarningLimit) {
    return {
      code: "budget-check",
      label: "Провери бюджет",
      tone: "warning",
      nextAction: "Съгласувай стойността и групирай редовете преди създаване на purchase документ.",
    };
  }

  if (reorderLineCount > 0) {
    return {
      code: "ready-for-manual-order",
      label: "Готово за ръчно решение",
      tone: "ok",
      nextAction: "Може да се подготви ръчна покупка след проверка на доставчик, цена и срок.",
    };
  }

  return {
    code: "monitor",
    label: "Само наблюдение",
    tone: "muted",
    nextAction: "Няма редове за покупка; следи следващия planning snapshot.",
  };
}

function normalizeDecisionSupplier(supplier = {}, index = 0) {
  const budget = budgetBand(supplier.recommendedOrderValueTotal);
  const readiness = readinessForSupplier(supplier);
  const purchaseLines = Array.isArray(supplier.purchaseLines) ? supplier.purchaseLines : [];

  return {
    ...supplier,
    decisionRank: index + 1,
    procurementTone: procurementTone(supplier.priority),
    budgetBand: budget,
    readiness,
    decisionLabel: readiness.label,
    decisionNextAction: readiness.nextAction,
    supplierInventoryHref: supplier.supplierHref || "/inventory-planning/suppliers",
    supplierProcurementHref: `/purchase-planning?supplier=${encodeURIComponent(supplier.supplierName || supplier.supplierKey || "")}`,
    firstLineHref: purchaseLines[0]?.detailHref || supplier.supplierHref || "/inventory-planning/suppliers",
    displayRecommendedOrderQtyTotal: supplier.display?.recommendedOrderQtyTotal || formatQty(supplier.recommendedOrderQtyTotal),
    displayRecommendedOrderValueTotal: supplier.display?.recommendedOrderValueTotal || formatMoney(supplier.recommendedOrderValueTotal),
    displayStockValueTotal: supplier.display?.stockValueTotal || formatMoney(supplier.stockValueTotal),
    purchaseLines: purchaseLines.map((line, lineIndex) => ({
      ...line,
      lineRank: lineIndex + 1,
      decisionNote: line.riskLabel === "Критичен риск" ? "първо провери нулева наличност" : "провери цена/срок преди покупка",
    })),
  };
}

function flattenPurchaseLines(suppliers = []) {
  return suppliers.flatMap((supplier) =>
    supplier.purchaseLines.map((line) => ({
      ...line,
      supplierName: supplier.supplierName,
      supplierKey: supplier.supplierKey,
      supplierHref: supplier.supplierInventoryHref,
      supplierProcurementHref: supplier.supplierProcurementHref,
      supplierPriority: supplier.priority,
      supplierReadinessLabel: supplier.readiness.label,
      supplierBudgetLabel: supplier.budgetBand.label,
      displayRecommendedOrderQty: line.displayRecommendedOrderQty || formatQty(line.recommendedOrderQty),
      displayRecommendedOrderValue: line.displayRecommendedOrderValue || formatMoney(line.recommendedOrderValue),
    }))
  ).sort((a, b) => {
    const priorityWeight = { critical: 0, reorder: 1, watch: 2, slow: 3, stable: 4 };
    return (priorityWeight[a.supplierPriority] ?? 9) - (priorityWeight[b.supplierPriority] ?? 9)
      || toNumber(b.recommendedOrderValue) - toNumber(a.recommendedOrderValue);
  });
}

function buildProcurementSummary(supplierSnapshot = {}, inventorySnapshot = {}, suppliers = []) {
  const supplierSummary = supplierSnapshot.supplierSummary || {};
  const inventorySummary = inventorySnapshot.summary || {};
  const totalValue = toNumber(supplierSummary.recommendedValueTotal);
  const budget = budgetBand(totalValue);
  const urgentSuppliers = suppliers.filter((supplier) => supplier.readiness.code === "urgent-review").length;
  const readySuppliers = suppliers.filter((supplier) => supplier.readiness.code === "ready-for-manual-order").length;
  const budgetCheckSuppliers = suppliers.filter((supplier) => supplier.readiness.code === "budget-check").length;

  return {
    supplierCount: toNumber(supplierSummary.supplierCount),
    suppliersWithPurchase: toNumber(supplierSummary.suppliersWithPurchase),
    criticalSuppliers: toNumber(supplierSummary.criticalSuppliers),
    urgentSuppliers,
    readySuppliers,
    budgetCheckSuppliers,
    totalPurchaseLines: toNumber(supplierSummary.totalPurchaseLines),
    recommendedQtyTotal: toNumber(supplierSummary.recommendedQtyTotal),
    recommendedValueTotal: totalValue,
    inventoryCriticalCount: toNumber(inventorySummary.criticalCount),
    inventoryReorderCount: toNumber(inventorySummary.reorderCount),
    budgetBand: budget,
    statusTone: urgentSuppliers > 0 ? "danger" : budget.tone,
    statusLabel: urgentSuppliers > 0
      ? "Има доставчици за спешно решение"
      : budget.code === "review"
        ? "Нужен е бюджетен преглед"
        : "Procurement snapshot е готов за ръчен преглед",
    nextAction: urgentSuppliers > 0
      ? "Започни от критичните доставчици и провери складовите дефицити преди purchase документ."
      : "Групирай редовете по доставчик и създай purchase документ само след човешко потвърждение.",
    displayRecommendedQtyTotal: supplierSummary.displayRecommendedQtyTotal || formatQty(supplierSummary.recommendedQtyTotal),
    displayRecommendedValueTotal: supplierSummary.displayRecommendedValueTotal || formatMoney(totalValue),
  };
}

function buildDecisionLanes(suppliers = []) {
  const urgent = suppliers.filter((supplier) => supplier.readiness.code === "urgent-review");
  const budget = suppliers.filter((supplier) => supplier.readiness.code === "budget-check");
  const ready = suppliers.filter((supplier) => supplier.readiness.code === "ready-for-manual-order");
  const monitor = suppliers.filter((supplier) => supplier.readiness.code === "monitor");

  return [
    {
      key: "urgent",
      title: "Спешен преглед",
      tone: "danger",
      count: urgent.length,
      note: "Критични доставчици / риск от липса",
      empty: "Няма критични доставчици за момента.",
      suppliers: urgent.slice(0, PROCUREMENT_POLICY.topDecisionLimit),
    },
    {
      key: "budget",
      title: "Бюджетен контрол",
      tone: "warning",
      count: budget.length,
      note: "Стойност над warning праг",
      empty: "Няма доставчици с бюджетно предупреждение.",
      suppliers: budget.slice(0, PROCUREMENT_POLICY.topDecisionLimit),
    },
    {
      key: "ready",
      title: "Готово за ръчно решение",
      tone: "ok",
      count: ready.length,
      note: "Има reorder редове без критичен флаг",
      empty: "Няма доставчици в ready lane.",
      suppliers: ready.slice(0, PROCUREMENT_POLICY.topDecisionLimit),
    },
    {
      key: "monitor",
      title: "Наблюдение",
      tone: "muted",
      count: monitor.length,
      note: "Без покупка в този snapshot",
      empty: "Всички доставчици имат активни решения.",
      suppliers: monitor.slice(0, PROCUREMENT_POLICY.topDecisionLimit),
    },
  ];
}

function buildManualWorkflow(summary = {}) {
  return [
    {
      order: 1,
      title: "Провери критичните редове",
      description: "Сравни проектна наличност, резервирано и входящо количество преди заявка.",
      tone: summary.urgentSuppliers > 0 ? "danger" : "ok",
    },
    {
      order: 2,
      title: "Групирай по доставчик",
      description: "Използвай supplier recommendation snapshot като работен списък, без автоматичен документ.",
      tone: "warning",
    },
    {
      order: 3,
      title: "Потвърди цена, срок и бюджет",
      description: "Procurement center показва ориентировъчна стойност, но не променя purchase модула.",
      tone: summary.budgetBand?.tone || "ok",
    },
    {
      order: 4,
      title: "Създай purchase документ ръчно",
      description: "След човешко решение отвори доставния модул и въведи документа ръчно.",
      tone: "muted",
    },
  ];
}

function buildSupplierFocus(suppliers = [], selectedSupplier = "") {
  const lookup = String(selectedSupplier || "").trim().toLowerCase();
  if (!lookup) return null;
  return suppliers.find((supplier) =>
    String(supplier.supplierName || "").toLowerCase() === lookup
    || String(supplier.supplierKey || "").toLowerCase() === lookup
  ) || null;
}

export async function getPurchasePlanningDecisionCenter(options = {}) {
  const [inventorySnapshot, supplierSnapshot] = await Promise.all([
    getInventoryPlanningSnapshot({ viewMode: options.viewMode }),
    getInventoryPlanningSupplierRecommendations({ viewMode: options.viewMode }),
  ]);

  const suppliers = (supplierSnapshot.supplierRecommendations || [])
    .map(normalizeDecisionSupplier)
    .sort((a, b) => {
      const priorityWeight = { critical: 0, reorder: 1, watch: 2, slow: 3, stable: 4 };
      return (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9)
        || toNumber(b.recommendedOrderValueTotal) - toNumber(a.recommendedOrderValueTotal);
    });
  const purchaseLines = flattenPurchaseLines(suppliers);
  const summary = buildProcurementSummary(supplierSnapshot, inventorySnapshot, suppliers);
  const selectedSupplier = buildSupplierFocus(suppliers, options.supplier);

  return {
    step: STEP_4_13,
    previousStep: supplierSnapshot.step || "4.12.3",
    moduleKey: "purchase-planning",
    title: "Purchase Planning / Procurement Decision Center Foundation",
    healthLabel: STEP_4_13_HEALTH_LABEL,
    generatedAtIso: new Date().toISOString(),
    sourceName: supplierSnapshot.sourceName || inventorySnapshot.sourceName || "inventory-planning-service",
    readOnly: true,
    policy: {
      ...PROCUREMENT_POLICY,
      displayBudgetWarningLimit: formatMoney(PROCUREMENT_POLICY.budgetWarningLimit),
      displayBudgetReviewLimit: formatMoney(PROCUREMENT_POLICY.budgetReviewLimit),
    },
    summary,
    decisionLanes: buildDecisionLanes(suppliers),
    suppliers,
    selectedSupplier,
    selectedSupplierName: selectedSupplier?.supplierName || "",
    selectedSupplierActive: Boolean(selectedSupplier),
    topPurchaseLines: purchaseLines.slice(0, PROCUREMENT_POLICY.topLineLimit),
    purchaseLines,
    warehouseCoverage: uniqueList(purchaseLines.map((line) => line.warehouseName)).join(", ") || "няма активни редове",
    groupCoverage: uniqueList(purchaseLines.map((line) => line.groupName)).join(", ") || "няма активни редове",
    manualWorkflow: buildManualWorkflow(summary),
    upstreamLinks: [
      { label: "Inventory Planning Dashboard", href: "/inventory-planning", note: "reorder и risk snapshot" },
      { label: "Supplier purchase recommendations", href: "/inventory-planning/suppliers", note: "детайлен supplier planning" },
      { label: "Нов purchase документ", href: "/document/purchase/new/PURCHASE_ORDER", note: "само ръчно след решение" },
    ],
    apiHref: "/api/purchase-planning",
    inventoryPlanningHref: "/inventory-planning",
    supplierPlanningHref: "/inventory-planning/suppliers",
    manualPurchaseHref: "/document/purchase/new/PURCHASE_ORDER",
    guardrails: [
      "Procurement center е само decision-support слой",
      "Няма автоматично създаване на purchase, delivery или supplier invoice документ",
      "Няма stock posting, reversal, correction или journal mutation",
      "POSTED документите и съществуващият purchase workflow остават locked по досегашните правила",
    ],
  };
}

export { STEP_4_13, STEP_4_13_HEALTH_LABEL };

export default {
  getPurchasePlanningDecisionCenter,
};
