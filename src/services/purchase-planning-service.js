// AutoGrand ERP V2 - Step 4.13.4 Purchase Planning Purchase Draft Preparation / Manual Procurement Handoff
// Read-only procurement decision support over the existing Inventory Planning supplier recommendations.
// Guardrail: no purchase document creation, no stock posting, no stock journal mutation, no auto-approval.

import {
  getInventoryPlanningSnapshot,
  getInventoryPlanningSupplierRecommendations,
} from "./inventory-planning-service.js";

const STEP_4_13_4 = "4.13.4";
const STEP_4_13_4_HEALTH_LABEL = "4-13-4-purchase-planning-purchase-draft-preparation-manual-procurement-handoff";
const STEP_4_13_3 = STEP_4_13_4;
const STEP_4_13_3_HEALTH_LABEL = STEP_4_13_4_HEALTH_LABEL;
const STEP_4_13_2 = STEP_4_13_4;
const STEP_4_13_2_HEALTH_LABEL = STEP_4_13_4_HEALTH_LABEL;
const STEP_4_13 = STEP_4_13_4;
const STEP_4_13_HEALTH_LABEL = STEP_4_13_4_HEALTH_LABEL;

const PROCUREMENT_POLICY = Object.freeze({
  budgetWarningLimit: 2500,
  budgetReviewLimit: 5000,
  criticalSupplierLimit: 3,
  topDecisionLimit: 6,
  topLineLimit: 8,
  topSupplierCardLimit: 6,
  detailPeerSupplierLimit: 4,
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

function supplierLookupKey(value = "") {
  return decodeURIComponent(String(value || "")).trim().toLowerCase();
}

function compactText(value, fallback = "няма данни") {
  const text = String(value || "").trim();
  return text || fallback;
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
    supplierDetailHref: `/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}`,
    supplierProcurementHref: `/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}`,
    supplierDraftHandoffHref: `/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}/handoff`,
    supplierFocusHref: `/purchase-planning?supplier=${encodeURIComponent(supplier.supplierName || supplier.supplierKey || "")}`,
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
  const lookup = supplierLookupKey(selectedSupplier);
  if (!lookup) return null;
  return suppliers.find((supplier) =>
    supplierLookupKey(supplier.supplierName) === lookup
    || supplierLookupKey(supplier.supplierKey) === lookup
  ) || null;
}

function supplierLaneCode(supplier = {}) {
  if (supplier.readiness?.code === "urgent-review") return "urgent";
  if (supplier.readiness?.code === "budget-check") return "budget";
  if (supplier.readiness?.code === "ready-for-manual-order") return "ready";
  return "monitor";
}

function normalizeLane(lane = "all") {
  const code = String(lane || "all").trim().toLowerCase();
  return ["all", "urgent", "budget", "ready", "monitor"].includes(code) ? code : "all";
}

function laneLabel(lane = "all") {
  return {
    all: "Всички доставчици",
    urgent: "Спешен преглед",
    budget: "Бюджетен контрол",
    ready: "Готово за ръчно решение",
    monitor: "Наблюдение",
  }[normalizeLane(lane)] || "Всички доставчици";
}

function filterSuppliersByLane(suppliers = [], activeLane = "all") {
  const lane = normalizeLane(activeLane);
  if (lane === "all") return suppliers;
  return suppliers.filter((supplier) => supplierLaneCode(supplier) === lane);
}

function pct(value, total) {
  const base = toNumber(total);
  if (base <= 0) return "0%";
  return `${Math.round((toNumber(value) / base) * 100)}%`;
}

function buildManagerFilters(suppliers = [], activeLane = "all") {
  const lane = normalizeLane(activeLane);
  const counts = suppliers.reduce((acc, supplier) => {
    acc[supplierLaneCode(supplier)] += 1;
    return acc;
  }, { urgent: 0, budget: 0, ready: 0, monitor: 0 });

  return [
    { key: "all", label: "Всички", tone: "ok", count: suppliers.length, note: "пълен procurement snapshot" },
    { key: "urgent", label: "Спешни", tone: "danger", count: counts.urgent, note: "критичен риск" },
    { key: "budget", label: "Бюджет", tone: "warning", count: counts.budget, note: "стойност за преглед" },
    { key: "ready", label: "Готови", tone: "ok", count: counts.ready, note: "може ръчно решение" },
    { key: "monitor", label: "Наблюдение", tone: "muted", count: counts.monitor, note: "без активна покупка" },
  ].map((filter) => ({
    ...filter,
    active: filter.key === lane,
    href: filter.key === "all" ? "/purchase-planning" : `/purchase-planning?lane=${filter.key}`,
  }));
}

function buildRecommendationMix(summary = {}, suppliers = []) {
  const total = Math.max(1, suppliers.length);
  const laneCounts = suppliers.reduce((acc, supplier) => {
    acc[supplierLaneCode(supplier)] += 1;
    return acc;
  }, { urgent: 0, budget: 0, ready: 0, monitor: 0 });

  return [
    { key: "urgent", label: "Спешни", tone: "danger", count: laneCounts.urgent, percent: pct(laneCounts.urgent, total), note: "първо действие" },
    { key: "budget", label: "Бюджет", tone: "warning", count: laneCounts.budget, percent: pct(laneCounts.budget, total), note: "мениджърски контрол" },
    { key: "ready", label: "Готови", tone: "ok", count: laneCounts.ready, percent: pct(laneCounts.ready, total), note: "ръчна поръчка" },
    { key: "monitor", label: "Наблюдение", tone: "muted", count: laneCounts.monitor, percent: pct(laneCounts.monitor, total), note: "следи snapshot" },
  ];
}

function buildManagerPanels(summary = {}, suppliers = []) {
  const sortedByValue = [...suppliers].sort((a, b) => toNumber(b.recommendedOrderValueTotal) - toNumber(a.recommendedOrderValueTotal));
  const topSupplier = sortedByValue[0] || null;

  return [
    {
      key: "priority",
      tone: summary.urgentSuppliers > 0 ? "danger" : "ok",
      kicker: "Приоритет",
      title: summary.urgentSuppliers > 0 ? "Започни от критичните доставчици" : "Няма критичен supplier блокер",
      value: String(summary.urgentSuppliers || 0),
      note: "доставчици за незабавен преглед",
      href: "/purchase-planning?lane=urgent",
    },
    {
      key: "budget",
      tone: summary.budgetBand?.tone || "ok",
      kicker: "Бюджет",
      title: summary.budgetBand?.label || "В нормален праг",
      value: summary.displayRecommendedValueTotal,
      note: "ориентировъчна стойност за ръчен purchase преглед",
      href: "/purchase-planning?lane=budget",
    },
    {
      key: "supplier",
      tone: topSupplier?.readiness?.tone || "muted",
      kicker: "Top supplier",
      title: topSupplier?.supplierName || "Няма активен доставчик",
      value: topSupplier?.displayRecommendedOrderValueTotal || "0.00",
      note: topSupplier?.decisionLabel || "няма активна покупка",
      href: topSupplier?.supplierProcurementHref || "/purchase-planning",
    },
    {
      key: "manual",
      tone: "ok",
      kicker: "Workflow",
      title: "Само ръчно решение",
      value: String(summary.totalPurchaseLines || 0),
      note: "редове за човешко потвърждение — без auto document",
      href: "/document/purchase/new/PURCHASE_ORDER",
    },
  ];
}

function buildSupplierCards(suppliers = []) {
  return suppliers.slice(0, PROCUREMENT_POLICY.topSupplierCardLimit).map((supplier, index) => ({
    ...supplier,
    cardRank: index + 1,
    laneCode: supplierLaneCode(supplier),
    metricLine: `${supplier.reorderLineCount || 0} реда · ${supplier.criticalCount || 0} критични · ${supplier.displayRecommendedOrderValueTotal}`,
    actionLabel: supplier.readiness?.code === "monitor" ? "Следи" : "Отвори решение",
  }));
}

function lineTone(line = {}) {
  const risk = String(line.riskLabel || line.priorityLabel || "").toLowerCase();
  if (risk.includes("крит") || risk.includes("critical")) return "danger";
  if (risk.includes("миним") || risk.includes("наблю") || risk.includes("warning") || risk.includes("watch")) return "warning";
  return "ok";
}

function sumLineValue(lines = []) {
  return lines.reduce((sum, line) => sum + toNumber(line.recommendedOrderValue), 0);
}

function sumLineQty(lines = []) {
  return lines.reduce((sum, line) => sum + toNumber(line.recommendedOrderQty), 0);
}

function buildLineBreakdown(lines = [], key = "warehouseName", fallbackLabel = "няма данни") {
  const groups = new Map();
  for (const line of lines) {
    const title = compactText(line[key], fallbackLabel);
    const current = groups.get(title) || {
      title,
      lineCount: 0,
      criticalCount: 0,
      recommendedQty: 0,
      recommendedValue: 0,
    };
    current.lineCount += 1;
    current.criticalCount += lineTone(line) === "danger" ? 1 : 0;
    current.recommendedQty += toNumber(line.recommendedOrderQty);
    current.recommendedValue += toNumber(line.recommendedOrderValue);
    groups.set(title, current);
  }

  return Array.from(groups.values())
    .sort((a, b) => b.criticalCount - a.criticalCount || b.recommendedValue - a.recommendedValue || a.title.localeCompare(b.title, "bg"))
    .map((row, index) => ({
      ...row,
      rowRank: index + 1,
      tone: row.criticalCount > 0 ? "danger" : (row.recommendedValue > 0 ? "warning" : "ok"),
      displayRecommendedQty: formatQty(row.recommendedQty),
      displayRecommendedValue: formatMoney(row.recommendedValue),
    }));
}

function buildSupplierDetailMetrics(supplier = {}, lines = []) {
  return [
    {
      key: "lines",
      label: "Редове за преглед",
      value: String(lines.length || 0),
      note: `${supplier.reorderLineCount || 0} reorder · ${supplier.criticalCount || 0} критични`,
      tone: supplier.criticalCount > 0 ? "danger" : "ok",
    },
    {
      key: "qty",
      label: "Препоръчано количество",
      value: formatQty(sumLineQty(lines)),
      note: "сбор само от активните recommendation редове",
      tone: "ok",
    },
    {
      key: "value",
      label: "Ориентировъчна стойност",
      value: supplier.displayRecommendedOrderValueTotal || formatMoney(sumLineValue(lines)),
      note: supplier.budgetBand?.label || "бюджетен статус",
      tone: supplier.budgetBand?.tone || "ok",
    },
    {
      key: "stock",
      label: "Наличностна стойност",
      value: supplier.displayStockValueTotal || "0.00",
      note: "read-only stock context",
      tone: "muted",
    },
  ];
}

function buildSupplierDecisionSignals(supplier = {}) {
  return [
    {
      key: "readiness",
      title: supplier.decisionLabel || "Procurement решение",
      tone: supplier.readiness?.tone || "ok",
      value: supplier.readiness?.code || "ready",
      note: supplier.decisionNextAction || "Провери доставчик, цена и срок преди документ.",
    },
    {
      key: "budget",
      title: supplier.budgetBand?.label || "Бюджет",
      tone: supplier.budgetBand?.tone || "ok",
      value: supplier.displayRecommendedOrderValueTotal || "0.00",
      note: supplier.budgetBand?.note || "Само ориентир; няма автоматичен документ.",
    },
    {
      key: "coverage",
      title: "Складове / групи",
      tone: "muted",
      value: compactText(supplier.warehouseList),
      note: compactText(supplier.groupList),
    },
  ];
}

function buildSupplierManualSteps(supplier = {}) {
  if (supplier.criticalCount > 0) {
    return [
      { order: 1, tone: "danger", title: "Провери критичните редове", description: "Сравни проектна наличност, резервирано и входящо количество по всеки ред." },
      { order: 2, tone: "warning", title: "Потвърди с управител", description: "Критичен supplier сигнал не трябва да създава документ без човешко решение." },
      { order: 3, tone: "ok", title: "Подготви ръчна покупка", description: "След одобрение отвори purchase модул и въведи документа ръчно." },
    ];
  }

  if (supplier.reorderLineCount > 0) {
    return [
      { order: 1, tone: "warning", title: "Провери цена и срок", description: "Сравни последна цена, бюджетен праг и очакван delivery срок." },
      { order: 2, tone: "ok", title: "Групирай редовете", description: "Използвай recommendation lines като read-only списък за подготовка." },
      { order: 3, tone: "muted", title: "Създай документ ръчно", description: "Procurement inspector не създава purchase документ автоматично." },
    ];
  }

  return [
    { order: 1, tone: "muted", title: "Само наблюдение", description: "Няма активна purchase препоръка за този доставчик в текущия snapshot." },
    { order: 2, tone: "ok", title: "Следи следващ snapshot", description: "Върни се след нови движения, доставки или промяна на минимални количества." },
  ];
}

function buildSupplierPeerLinks(supplier = {}, suppliers = []) {
  return suppliers
    .filter((candidate) => candidate.supplierKey !== supplier.supplierKey)
    .slice(0, PROCUREMENT_POLICY.detailPeerSupplierLimit)
    .map((candidate) => ({
      supplierName: candidate.supplierName,
      decisionLabel: candidate.decisionLabel,
      value: candidate.displayRecommendedOrderValueTotal,
      tone: candidate.readiness?.tone || "ok",
      href: candidate.supplierDetailHref,
    }));
}

function compactDraftKeyPart(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-я-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "supplier";
}

function buildDraftLine(line = {}, index = 0) {
  const qty = toNumber(line.recommendedOrderQty);
  const estimatedValue = toNumber(line.recommendedOrderValue);
  const tone = lineTone(line);
  const displayQty = line.displayRecommendedOrderQty || formatQty(qty);
  const displayValue = line.displayRecommendedOrderValue || formatMoney(estimatedValue);
  const itemCode = compactText(line.itemCode, "код");
  const itemName = compactText(line.itemName, "артикул");
  const warehouseName = compactText(line.warehouseName, "склад");

  return {
    lineNumber: index + 1,
    tone,
    itemCode,
    itemName,
    warehouseName,
    groupName: compactText(line.groupName, "група"),
    suggestedQty: qty,
    displaySuggestedQty: displayQty,
    estimatedValue,
    displayEstimatedValue: displayValue,
    sourceRisk: line.riskLabel || line.priorityLabel || "planning signal",
    manualNote: tone === "danger"
      ? "Потвърди критична липса преди въвеждане в purchase документа."
      : "Провери цена, срок и MOQ преди ръчно въвеждане.",
    copyText: `${itemCode} | ${itemName} | ${warehouseName} | qty ${displayQty} | est. ${displayValue}`,
  };
}

function buildPurchaseDraftPreparation(supplier = {}, lines = []) {
  const draftLines = lines.map(buildDraftLine);
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const supplierKey = compactDraftKeyPart(supplier.supplierKey || supplier.supplierName);
  const draftKey = `PP-${dateKey}-${supplierKey}`.toUpperCase();
  const totalQty = sumLineQty(lines);
  const totalValue = sumLineValue(lines);
  const budget = budgetBand(totalValue);
  const hasCritical = toNumber(supplier.criticalCount) > 0;

  return {
    active: true,
    step: STEP_4_13_4,
    title: "Purchase Draft Preparation / Manual Procurement Handoff",
    subtitle: "Подготвен read-only пакет за ръчно въвеждане в purchase документа.",
    draftKey,
    draftStateLabel: "Подготовка · не е документ",
    documentType: "PURCHASE_ORDER",
    documentTypeLabel: "Поръчка към доставчик",
    supplierName: supplier.supplierName,
    supplierKey: supplier.supplierKey,
    readinessLabel: supplier.decisionLabel,
    readinessTone: supplier.readiness?.tone || "ok",
    budgetLabel: budget.label,
    budgetTone: budget.tone,
    totalLines: draftLines.length,
    totalCriticalLines: draftLines.filter((line) => line.tone === "danger").length,
    displayTotalQty: formatQty(totalQty),
    displayTotalValue: formatMoney(totalValue),
    manualPurchaseHref: "/document/purchase/new/PURCHASE_ORDER",
    supplierInspectorHref: supplier.supplierDetailHref,
    apiHref: `/api/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}/handoff`,
    draftLines,
    headerFields: [
      { label: "Тип документ", value: "PURCHASE_ORDER · ръчно" },
      { label: "Доставчик", value: supplier.supplierName || "няма данни" },
      { label: "Източник", value: "Inventory Planning supplier recommendations" },
      { label: "Състояние", value: "Само подготовка — няма запис в БД" },
    ],
    checklist: [
      { order: 1, tone: hasCritical ? "danger" : "ok", title: "Потвърди критичните редове", description: "Провери наличност, резервирано и очаквани доставки преди документ." },
      { order: 2, tone: budget.tone, title: "Провери бюджет и цена", description: "Ориентировъчната стойност не е одобрение за покупка." },
      { order: 3, tone: "warning", title: "Копирай редовете ръчно", description: "Използвай handoff редовете като списък за оператор, без автоматично прехвърляне." },
      { order: 4, tone: "muted", title: "Отвори празен purchase документ", description: "Документът се създава само от човек в стандартния purchase workflow." },
    ],
    copyBlock: [
      `Draft: ${draftKey}`,
      `Supplier: ${supplier.supplierName || "няма данни"}`,
      `Document type: PURCHASE_ORDER (manual)` ,
      `Lines: ${draftLines.length} | Qty: ${formatQty(totalQty)} | Est: ${formatMoney(totalValue)}`,
      ...draftLines.map((line) => `${line.lineNumber}. ${line.copyText}`),
    ].join("\n"),
    guardrails: [
      "Това е handoff подготовка, не purchase документ",
      "Няма автоматично записване на header, lines, delivery или invoice",
      "Няма stock posting, reversal, correction или journal mutation",
      "Операторът въвежда документа ръчно след човешко одобрение",
    ],
  };
}

function buildSupplierDetailInspector(supplier = null, suppliers = []) {
  if (!supplier) {
    return {
      active: false,
      missing: true,
      title: "Supplier recommendation drilldown",
      emptyText: "Избери доставчик от supplier cards или decision workbench, за да видиш detail inspector.",
      draftPreparation: null,
    };
  }

  const lines = (supplier.purchaseLines || []).map((line, index) => ({
    ...line,
    rowRank: index + 1,
    tone: lineTone(line),
    planningDetailHref: line.detailHref,
    inspectorNote: line.riskLabel === "Критичен риск"
      ? "първо провери нулева/отрицателна проектна наличност"
      : "провери минимално количество, цена и срок преди purchase документ",
  }));

  return {
    active: true,
    missing: false,
    title: "Supplier Recommendation Drilldown",
    subtitle: "Детайлен read-only инспектор за доставчик преди ръчна purchase поръчка.",
    supplier,
    supplierName: supplier.supplierName,
    supplierKey: supplier.supplierKey,
    decisionLabel: supplier.decisionLabel,
    nextAction: supplier.decisionNextAction,
    tone: supplier.readiness?.tone || "ok",
    metrics: buildSupplierDetailMetrics(supplier, lines),
    decisionSignals: buildSupplierDecisionSignals(supplier),
    recommendationLines: lines,
    warehouseBreakdown: buildLineBreakdown(lines, "warehouseName", "Склад"),
    groupBreakdown: buildLineBreakdown(lines, "groupName", "Група"),
    manualSteps: buildSupplierManualSteps(supplier),
    peerSuppliers: buildSupplierPeerLinks(supplier, suppliers),
    inventorySupplierHref: supplier.supplierInventoryHref,
    manualPurchaseHref: "/document/purchase/new/PURCHASE_ORDER",
    handoffHref: supplier.supplierDraftHandoffHref,
    apiHref: `/api/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}`,
    handoffApiHref: `/api/purchase-planning/suppliers/${encodeURIComponent(supplier.supplierKey || supplier.supplierName || "")}/handoff`,
    draftPreparation: buildPurchaseDraftPreparation(supplier, lines),
    guardrails: [
      "Детайлният inspector е само за управленско решение",
      "Няма автоматично създаване на purchase, delivery или supplier invoice документ",
      "Няма stock posting, reversal, correction или journal mutation",
      "Редовете са recommendation snapshot и се въвеждат ръчно при одобрение",
      "Handoff подготовката не записва purchase header или lines",
    ],
  };
}

function buildManagerInsights(summary = {}, purchaseLines = [], suppliers = []) {
  const topLine = purchaseLines[0] || null;
  const activeSupplierCount = suppliers.filter((supplier) => toNumber(supplier.reorderLineCount) > 0).length;
  return [
    {
      tone: summary.statusTone || "ok",
      label: "Decision focus",
      value: summary.statusLabel,
      note: summary.nextAction,
    },
    {
      tone: "warning",
      label: "Supplier coverage",
      value: `${activeSupplierCount}/${summary.supplierCount || suppliers.length}`,
      note: "доставчици с активни purchase редове в текущия snapshot",
    },
    {
      tone: topLine?.supplierPriority === "critical" ? "danger" : "ok",
      label: "First line",
      value: topLine ? `${topLine.itemCode} · ${topLine.supplierName}` : "Няма активен ред",
      note: topLine ? `${topLine.warehouseName} · ${topLine.displayRecommendedOrderQty} · ${topLine.displayRecommendedOrderValue}` : "няма активни reorder редове",
    },
  ];
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
  const activeLane = normalizeLane(options.lane);
  const filteredSuppliers = filterSuppliersByLane(suppliers, activeLane);
  const filteredPurchaseLines = flattenPurchaseLines(filteredSuppliers);
  const detailInspector = buildSupplierDetailInspector(selectedSupplier, suppliers);

  return {
    step: STEP_4_13,
    previousStep: supplierSnapshot.step || "4.12.3",
    moduleKey: "purchase-planning",
    title: "Purchase Planning / Manual Procurement Handoff",
    healthLabel: STEP_4_13_HEALTH_LABEL,
    generatedAtIso: new Date().toISOString(),
    sourceName: supplierSnapshot.sourceName || inventorySnapshot.sourceName || "inventory-planning-service",
    uiPolishStep: "4.13.2",
    detailInspectorStep: "4.13.3",
    purchaseDraftStep: "4.13.4",
    activeLane,
    activeLaneLabel: laneLabel(activeLane),
    readOnly: true,
    policy: {
      ...PROCUREMENT_POLICY,
      displayBudgetWarningLimit: formatMoney(PROCUREMENT_POLICY.budgetWarningLimit),
      displayBudgetReviewLimit: formatMoney(PROCUREMENT_POLICY.budgetReviewLimit),
    },
    summary,
    decisionLanes: buildDecisionLanes(suppliers),
    managerFilters: buildManagerFilters(suppliers, activeLane),
    managerPanels: buildManagerPanels(summary, suppliers),
    recommendationMix: buildRecommendationMix(summary, suppliers),
    managerInsights: buildManagerInsights(summary, purchaseLines, suppliers),
    supplierCards: buildSupplierCards(suppliers),
    suppliers,
    filteredSuppliers,
    filteredSupplierCount: filteredSuppliers.length,
    filteredPurchaseLines,
    selectedSupplier,
    selectedSupplierName: selectedSupplier?.supplierName || "",
    selectedSupplierActive: Boolean(selectedSupplier),
    detailInspector,
    detailInspectorActive: Boolean(selectedSupplier),
    purchaseDraftPreparation: detailInspector.draftPreparation,
    purchaseDraftPreparationActive: Boolean(detailInspector.draftPreparation?.active),
    topPurchaseLines: purchaseLines.slice(0, PROCUREMENT_POLICY.topLineLimit),
    filteredTopPurchaseLines: filteredPurchaseLines.slice(0, PROCUREMENT_POLICY.topLineLimit),
    purchaseLines,
    warehouseCoverage: uniqueList(purchaseLines.map((line) => line.warehouseName)).join(", ") || "няма активни редове",
    groupCoverage: uniqueList(purchaseLines.map((line) => line.groupName)).join(", ") || "няма активни редове",
    manualWorkflow: buildManualWorkflow(summary),
    upstreamLinks: [
      { label: "Inventory Planning Dashboard", href: "/inventory-planning", note: "reorder и risk snapshot" },
      { label: "Supplier purchase recommendations", href: "/inventory-planning/suppliers", note: "детайлен supplier planning" },
      { label: "Нов purchase документ", href: "/document/purchase/new/PURCHASE_ORDER", note: "само ръчно след решение" },
      { label: "Manual procurement handoff", href: selectedSupplier?.supplierDraftHandoffHref || "/purchase-planning", note: "read-only draft preparation пакет" },
    ],
    apiHref: "/api/purchase-planning",
    inventoryPlanningHref: "/inventory-planning",
    supplierPlanningHref: "/inventory-planning/suppliers",
    manualPurchaseHref: "/document/purchase/new/PURCHASE_ORDER",
    guardrails: [
      "Procurement center е само decision-support слой",
      "Manual handoff е read-only подготовка, не purchase документ",
      "Няма автоматично създаване на purchase, delivery или supplier invoice документ",
      "Няма stock posting, reversal, correction или journal mutation",
      "POSTED документите и съществуващият purchase workflow остават locked по досегашните правила",
    ],
  };
}

export { STEP_4_13, STEP_4_13_HEALTH_LABEL, STEP_4_13_2, STEP_4_13_2_HEALTH_LABEL, STEP_4_13_3, STEP_4_13_3_HEALTH_LABEL, STEP_4_13_4, STEP_4_13_4_HEALTH_LABEL };

export default {
  getPurchasePlanningDecisionCenter,
};
