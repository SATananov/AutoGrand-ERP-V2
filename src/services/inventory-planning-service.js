// AutoGrand ERP V2 - Step 4.12.1 Inventory Planning UI Polish / Manager Dashboard Refinement
// Read-only decision-support service. This module never creates documents and never mutates stock journals.
// No automatic document creation. No stock posting/reversal/correction/journal mutation.

const DEFAULT_PLANNING_PROFILE = Object.freeze({
  reviewWindowDays: 30,
  slowMovingDays: 90,
  riskWindowDays: 14,
  targetCoverDays: 30,
  minimumSuggestedQty: 1,
  dashboardTopLimit: 5,
});

const VIEW_MODES = Object.freeze(["all", "critical", "reorder", "slow", "watch", "stable"]);

const FALLBACK_SOURCE_ROWS = Object.freeze([
  {
    itemCode: "AG-OIL-5W30",
    itemName: "Моторно масло 5W30 5L",
    groupName: "Консумативи",
    warehouseName: "Централен склад",
    currentQty: 4,
    reservedQty: 2,
    inboundQty: 0,
    minimumQty: 10,
    maximumQty: 35,
    averageDailyIssueQty: 0.8,
    daysSinceLastMovement: 6,
    unitCost: 48.5,
  },
  {
    itemCode: "AG-FLT-AIR-01",
    itemName: "Въздушен филтър стандарт",
    groupName: "Филтри",
    warehouseName: "Централен склад",
    currentQty: 18,
    reservedQty: 4,
    inboundQty: 8,
    minimumQty: 15,
    maximumQty: 45,
    averageDailyIssueQty: 0.55,
    daysSinceLastMovement: 11,
    unitCost: 18.9,
  },
  {
    itemCode: "AG-BRK-PAD-SET",
    itemName: "Комплект накладки предни",
    groupName: "Спирачна система",
    warehouseName: "Сервизен склад",
    currentQty: 1,
    reservedQty: 1,
    inboundQty: 0,
    minimumQty: 6,
    maximumQty: 20,
    averageDailyIssueQty: 0.35,
    daysSinceLastMovement: 3,
    unitCost: 62,
  },
  {
    itemCode: "AG-OLD-TRIM-09",
    itemName: "Декоративна лайсна стар модел",
    groupName: "Бавнодвижещи се",
    warehouseName: "Втори склад",
    currentQty: 24,
    reservedQty: 0,
    inboundQty: 0,
    minimumQty: 2,
    maximumQty: 8,
    averageDailyIssueQty: 0.01,
    daysSinceLastMovement: 188,
    unitCost: 14.2,
  },
  {
    itemCode: "AG-BAT-70AH",
    itemName: "Акумулатор 70Ah",
    groupName: "Електро",
    warehouseName: "Централен склад",
    currentQty: 0,
    reservedQty: 1,
    inboundQty: 2,
    minimumQty: 5,
    maximumQty: 16,
    averageDailyIssueQty: 0.22,
    daysSinceLastMovement: 1,
    unitCost: 154,
  },
]);

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundQty(value) {
  return Math.max(0, Math.round((toNumber(value) + Number.EPSILON) * 100) / 100);
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function firstValue(source, keys, fallback = undefined) {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return fallback;
}

function formatQty(value) {
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 2 }).format(roundQty(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(roundMoney(value));
}

function formatDays(value) {
  const days = Math.max(0, Math.round(toNumber(value)));
  return `${days} дни`;
}

function classifyRisk(projectedAvailableQty, averageDailyIssueQty, minimumQty, profile) {
  if (projectedAvailableQty <= 0) return "critical";
  if (projectedAvailableQty <= minimumQty) return "warning";
  const riskWindowDemand = averageDailyIssueQty * profile.riskWindowDays;
  if (averageDailyIssueQty > 0 && projectedAvailableQty <= riskWindowDemand) return "watch";
  return "ok";
}

function riskLabel(riskLevel) {
  if (riskLevel === "critical") return "Критичен риск";
  if (riskLevel === "warning") return "Под минимум";
  if (riskLevel === "watch") return "Наблюдение";
  return "Стабилно";
}

function priorityLabel(priority) {
  if (priority === "critical") return "Висок приоритет";
  if (priority === "reorder") return "За дозареждане";
  if (priority === "slow") return "Бавно движение";
  if (priority === "stable") return "Стабилно";
  return "Наблюдение";
}

function actionLabel(item) {
  if (item.riskLevel === "critical") return "Ръчен преглед днес";
  if (item.recommendedOrderQty > 0) return "Планирай ръчно";
  if (item.isSlowMoving) return "Провери залежаване";
  if (item.riskLevel === "watch") return "Следи движението";
  return "Няма действие";
}

function normalizePlanningRow(row, index) {
  const code = String(firstValue(row, ["itemCode", "code", "Code", "sku", "itemNo", "ItemNo", "number"], `ITEM-${index + 1}`));
  const name = String(firstValue(row, ["itemName", "name", "Name", "description", "Description", "caption", "Caption"], code));
  const groupName = String(firstValue(row, ["groupName", "group", "productGroup", "category", "Category"], "Склад"));
  const warehouseName = String(firstValue(row, ["warehouseName", "warehouse", "locationName", "businessGroupName", "storeName"], "Всички обекти"));
  const currentQty = roundQty(firstValue(row, ["currentQty", "onHandQty", "onHand", "quantity", "Quantity", "qty", "stockQty", "availableQty"], 0));
  const reservedQty = roundQty(firstValue(row, ["reservedQty", "blockedQty", "allocatedQty", "committedQty"], 0));
  const inboundQty = roundQty(firstValue(row, ["inboundQty", "orderedQty", "qtyToReceive", "QtyToReceive", "openPurchaseQty"], 0));
  const minimumQty = roundQty(firstValue(row, ["minimumQty", "minQty", "minimumStock", "reorderPoint", "reorderQty"], 0));
  const maximumQty = roundQty(firstValue(row, ["maximumQty", "maxQty", "maximumStock", "targetQty", "orderUpToQty"], Math.max(minimumQty * 2, currentQty)));
  const averageDailyIssueQty = roundQty(firstValue(row, ["averageDailyIssueQty", "avgDailyIssueQty", "dailyDemandQty", "dailySalesQty", "averageDailyOutQty"], 0));
  const daysSinceLastMovement = Math.max(0, Math.round(toNumber(firstValue(row, ["daysSinceLastMovement", "daysWithoutMovement", "idleDays", "lastMovementDays"], 0))));
  const unitCost = roundMoney(firstValue(row, ["unitCost", "averageCost", "avgCost", "cost", "valuationCost"], 0));

  return {
    sourceIndex: index,
    itemCode: code,
    itemName: name,
    groupName,
    warehouseName,
    currentQty,
    reservedQty,
    inboundQty,
    minimumQty,
    maximumQty,
    averageDailyIssueQty,
    daysSinceLastMovement,
    unitCost,
  };
}

function enrichPlanningRow(row, profile) {
  const projectedAvailableQty = roundQty(row.currentQty - row.reservedQty + row.inboundQty);
  const demandCoverQty = roundQty(row.averageDailyIssueQty * profile.targetCoverDays);
  const orderUpToQty = Math.max(row.maximumQty, row.minimumQty, demandCoverQty);
  const recommendedOrderQty = projectedAvailableQty < row.minimumQty
    ? Math.max(profile.minimumSuggestedQty, Math.ceil(orderUpToQty - projectedAvailableQty))
    : 0;
  const riskLevel = classifyRisk(projectedAvailableQty, row.averageDailyIssueQty, row.minimumQty, profile);
  const isSlowMoving = row.currentQty > 0 && row.daysSinceLastMovement >= profile.slowMovingDays;
  const isBelowMinimum = projectedAvailableQty < row.minimumQty;
  const isOutOfStockRisk = riskLevel === "critical" || riskLevel === "warning";
  const coverageDays = row.averageDailyIssueQty > 0 ? Math.floor(projectedAvailableQty / row.averageDailyIssueQty) : null;
  const stockValue = roundMoney(row.currentQty * row.unitCost);
  const recommendedOrderValue = roundMoney(recommendedOrderQty * row.unitCost);
  const priority = riskLevel === "critical" ? "critical" : (recommendedOrderQty > 0 ? "reorder" : (isSlowMoving ? "slow" : (riskLevel === "watch" ? "watch" : "stable")));
  const lockedReadOnlyReason = "read-only decision support; no automatic document creation";

  return {
    ...row,
    projectedAvailableQty,
    targetQty: roundQty(orderUpToQty),
    recommendedOrderQty,
    recommendedOrderValue,
    stockValue,
    riskLevel,
    riskLabel: riskLabel(riskLevel),
    priority,
    priorityLabel: priorityLabel(priority),
    actionLabel: actionLabel({ riskLevel, recommendedOrderQty, isSlowMoving }),
    isSlowMoving,
    isBelowMinimum,
    isOutOfStockRisk,
    coverageDays,
    coverageLabel: coverageDays === null ? "няма разход" : `${coverageDays} дни покритие`,
    lockedReadOnlyReason,
    display: {
      currentQty: formatQty(row.currentQty),
      reservedQty: formatQty(row.reservedQty),
      inboundQty: formatQty(row.inboundQty),
      projectedAvailableQty: formatQty(projectedAvailableQty),
      minimumQty: formatQty(row.minimumQty),
      targetQty: formatQty(orderUpToQty),
      recommendedOrderQty: formatQty(recommendedOrderQty),
      recommendedOrderValue: formatMoney(recommendedOrderValue),
      stockValue: formatMoney(stockValue),
      daysSinceLastMovement: formatDays(row.daysSinceLastMovement),
    },
  };
}

function findCandidateArrays(value, depth = 0) {
  if (!value || depth > 5) return [];
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return [value];
    }
    return value.flatMap((item) => findCandidateArrays(item, depth + 1));
  }
  if (typeof value !== "object") return [];
  return Object.values(value).flatMap((item) => findCandidateArrays(item, depth + 1));
}

function scoreCandidateArray(rows) {
  const keys = new Set(rows.flatMap((row) => Object.keys(row || {})));
  const keyText = Array.from(keys).join(" ").toLowerCase();
  let score = 0;
  for (const token of ["item", "code", "name", "quantity", "qty", "stock", "warehouse", "cost", "value", "available"]) {
    if (keyText.includes(token)) score += 1;
  }
  if (rows.length >= 3) score += 2;
  return score;
}

async function tryCallExport(modulePath, exportNames) {
  try {
    const mod = await import(modulePath);
    for (const exportName of exportNames) {
      const candidate = mod[exportName];
      if (typeof candidate !== "function") continue;
      try {
        const result = await candidate({ mode: "inventory-planning", readOnly: true });
        const arrays = findCandidateArrays(result).sort((a, b) => scoreCandidateArray(b) - scoreCandidateArray(a));
        if (arrays.length > 0 && scoreCandidateArray(arrays[0]) >= 3) return arrays[0];
      } catch {
        // Ignore incompatible helper signatures. Step 4.12.1 remains read-only and uses fallback rows.
      }
    }
  } catch {
    // Optional source module is not available in older checkpoints.
  }
  return null;
}

async function collectSourceRows() {
  const candidates = [
    ["./stock-valuation-service.js", ["getStockValuationSnapshot", "buildStockValuationSnapshot", "getInventoryCostViewSnapshot", "buildStockValuationViewModel"]],
    ["./stock-reports-service.js", ["getStockReportsSnapshot", "buildStockReportsSnapshot", "getInventoryAnalyticsSnapshot", "buildInventoryAnalyticsSnapshot"]],
    ["./stock-control-center-service.js", ["getStockControlCenterSnapshot", "buildStockControlCenterSnapshot", "getStockSnapshot"]],
    ["./stock-engine-hardening-service.js", ["getStockAuditSnapshot", "buildStockAuditSnapshot", "getStockHardeningSnapshot"]],
  ];

  for (const [modulePath, exportNames] of candidates) {
    const rows = await tryCallExport(modulePath, exportNames);
    if (rows && rows.length > 0) return { rows, sourceName: modulePath.replace("./", "") };
  }

  return { rows: FALLBACK_SOURCE_ROWS.map((row) => ({ ...row })), sourceName: "step-4-12-1-polish-seed" };
}

function buildBreakdown(items, key, title) {
  const map = new Map();
  for (const item of items) {
    const name = item[key] || "Неразпределено";
    const current = map.get(name) || {
      title: name,
      itemCount: 0,
      criticalCount: 0,
      reorderCount: 0,
      slowMovingCount: 0,
      recommendedOrderValue: 0,
    };
    current.itemCount += 1;
    current.criticalCount += item.riskLevel === "critical" ? 1 : 0;
    current.reorderCount += item.recommendedOrderQty > 0 ? 1 : 0;
    current.slowMovingCount += item.isSlowMoving ? 1 : 0;
    current.recommendedOrderValue = roundMoney(current.recommendedOrderValue + item.recommendedOrderValue);
    map.set(name, current);
  }

  return Array.from(map.values())
    .sort((a, b) => b.criticalCount - a.criticalCount || b.reorderCount - a.reorderCount || b.recommendedOrderValue - a.recommendedOrderValue)
    .map((row) => ({
      ...row,
      label: title,
      displayRecommendedOrderValue: formatMoney(row.recommendedOrderValue),
    }));
}

function buildSummary(items) {
  const totalRecommendedValue = roundMoney(items.reduce((sum, item) => sum + item.recommendedOrderValue, 0));
  const totalProjectedQty = roundQty(items.reduce((sum, item) => sum + item.projectedAvailableQty, 0));
  const totalStockValue = roundMoney(items.reduce((sum, item) => sum + item.stockValue, 0));
  const reorderCount = items.filter((item) => item.recommendedOrderQty > 0).length;
  const outOfStockRiskCount = items.filter((item) => item.isOutOfStockRisk).length;
  const criticalCount = items.filter((item) => item.riskLevel === "critical").length;
  const warningCount = items.filter((item) => item.riskLevel === "warning").length;
  const watchCount = items.filter((item) => item.riskLevel === "watch").length;
  const stableCount = items.filter((item) => item.riskLevel === "ok").length;
  const slowMovingCount = items.filter((item) => item.isSlowMoving).length;
  const belowMinimumCount = items.filter((item) => item.isBelowMinimum).length;
  const recommendedOrderQtyTotal = roundQty(items.reduce((sum, item) => sum + item.recommendedOrderQty, 0));

  return {
    totalItems: items.length,
    reorderCount,
    outOfStockRiskCount,
    criticalCount,
    warningCount,
    watchCount,
    stableCount,
    slowMovingCount,
    belowMinimumCount,
    recommendedOrderQtyTotal,
    totalProjectedQty,
    totalRecommendedValue,
    totalStockValue,
    displayRecommendedOrderQtyTotal: formatQty(recommendedOrderQtyTotal),
    displayTotalProjectedQty: formatQty(totalProjectedQty),
    displayTotalRecommendedValue: formatMoney(totalRecommendedValue),
    displayTotalStockValue: formatMoney(totalStockValue),
    managerStatus: outOfStockRiskCount > 0 ? "Нужен е преглед" : "Стабилно",
    managerTone: criticalCount > 0 ? "critical" : (reorderCount > 0 ? "warning" : "stable"),
  };
}

function normalizeViewMode(value) {
  const text = String(value || "all").toLowerCase().trim();
  return VIEW_MODES.includes(text) ? text : "all";
}

function applyViewMode(items, viewMode) {
  if (viewMode === "critical") return items.filter((item) => item.riskLevel === "critical" || item.isOutOfStockRisk);
  if (viewMode === "reorder") return items.filter((item) => item.recommendedOrderQty > 0);
  if (viewMode === "slow") return items.filter((item) => item.isSlowMoving);
  if (viewMode === "watch") return items.filter((item) => item.riskLevel === "watch");
  if (viewMode === "stable") return items.filter((item) => item.priority === "stable");
  return items;
}

function buildFilterChips(items, viewMode) {
  const chipDefs = [
    { key: "all", label: "Всички", count: items.length },
    { key: "critical", label: "Риск", count: items.filter((item) => item.isOutOfStockRisk).length },
    { key: "reorder", label: "Дозареждане", count: items.filter((item) => item.recommendedOrderQty > 0).length },
    { key: "slow", label: "Бавно движение", count: items.filter((item) => item.isSlowMoving).length },
    { key: "watch", label: "Наблюдение", count: items.filter((item) => item.riskLevel === "watch").length },
    { key: "stable", label: "Стабилни", count: items.filter((item) => item.priority === "stable").length },
  ];

  return chipDefs.map((chip) => ({
    ...chip,
    href: `/inventory-planning?view=${chip.key}`,
    isActive: chip.key === viewMode,
  }));
}

function buildAttentionLanes(items, profile) {
  const topLimit = profile.dashboardTopLimit;
  const criticalItems = items.filter((item) => item.isOutOfStockRisk).slice(0, topLimit);
  const reorderItems = items.filter((item) => item.recommendedOrderQty > 0).slice(0, topLimit);
  const slowItems = items.filter((item) => item.isSlowMoving).slice(0, topLimit);

  return [
    {
      key: "risk",
      title: "Спешен риск",
      note: "Критични и под минимално ниво",
      count: criticalItems.length,
      tone: criticalItems.length > 0 ? "danger" : "stable",
      items: criticalItems,
      empty: "Няма критични артикули.",
    },
    {
      key: "reorder",
      title: "За дозареждане",
      note: "Ръчно планиране, без автоматичен документ",
      count: reorderItems.length,
      tone: reorderItems.length > 0 ? "warning" : "stable",
      items: reorderItems,
      empty: "Няма предложения за дозареждане.",
    },
    {
      key: "slow",
      title: "Бавно движение",
      note: `Над ${profile.slowMovingDays} дни без движение`,
      count: slowItems.length,
      tone: slowItems.length > 0 ? "muted" : "stable",
      items: slowItems,
      empty: "Няма бавнодвижещи се артикули.",
    },
  ];
}

function buildManagerSnapshot(items, summary, profile) {
  let nextAction = "Няма критични предложения за дозареждане.";
  if (summary.criticalCount > 0) {
    nextAction = "Прегледай критичните артикули и планирай ръчно заявка или покупка при нужда.";
  } else if (summary.reorderCount > 0) {
    nextAction = "Прегледай предложенията за дозареждане и потвърди ръчно след търговска проверка.";
  } else if (summary.slowMovingCount > 0) {
    nextAction = "Провери бавнодвижещите се артикули за залежаване, прехвърляне или промоционално действие.";
  }

  const topPriorityItems = items
    .filter((item) => item.priority !== "stable")
    .slice(0, profile.dashboardTopLimit)
    .map((item) => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      riskLabel: item.riskLabel,
      actionLabel: item.actionLabel,
      recommendedOrderQty: item.display.recommendedOrderQty,
    }));

  return {
    title: "Мениджърски planning snapshot",
    reviewWindowDays: profile.reviewWindowDays,
    nextAction,
    topPriorityItems,
    safetyNote: "Модулът е само за анализ и не създава документи автоматично.",
    statusLabel: summary.managerStatus,
    statusTone: summary.managerTone,
  };
}

export async function getInventoryPlanningSnapshot(options = {}) {
  const profile = { ...DEFAULT_PLANNING_PROFILE, ...(options.profile || {}) };
  const viewMode = normalizeViewMode(options.viewMode);
  const { rows, sourceName } = await collectSourceRows();
  const items = rows
    .map((row, index) => enrichPlanningRow(normalizePlanningRow(row, index), profile))
    .sort((a, b) => {
      const weight = { critical: 0, reorder: 1, slow: 2, watch: 3, stable: 4 };
      return (weight[a.priority] ?? 9) - (weight[b.priority] ?? 9)
        || b.recommendedOrderValue - a.recommendedOrderValue
        || b.recommendedOrderQty - a.recommendedOrderQty;
    });

  const reorderSuggestions = items.filter((item) => item.recommendedOrderQty > 0);
  const slowMovingItems = items.filter((item) => item.isSlowMoving);
  const outOfStockRiskItems = items.filter((item) => item.isOutOfStockRisk);
  const visibleItems = applyViewMode(items, viewMode);
  const summary = buildSummary(items);

  return {
    step: "4.12.1",
    previousStep: "4.12",
    moduleKey: "inventory-planning",
    title: "Inventory Planning / Reorder Suggestions UI Polish",
    generatedAtIso: new Date().toISOString(),
    sourceName,
    readOnly: true,
    uiPolishVersion: "manager-dashboard-refinement",
    guardrails: [
      "Няма автоматично създаване на документи",
      "Няма posting, reversal, correction или промяна на stock movement journal",
      "POSTED документите остават заключени",
      "Няма директна редакция или изтриване на stock journal",
    ],
    profile,
    viewMode,
    filterChips: buildFilterChips(items, viewMode),
    summary,
    items,
    visibleItems,
    visibleCount: visibleItems.length,
    reorderSuggestions,
    slowMovingItems,
    outOfStockRiskItems,
    attentionLanes: buildAttentionLanes(items, profile),
    warehouseBreakdown: buildBreakdown(items, "warehouseName", "Склад"),
    groupBreakdown: buildBreakdown(items, "groupName", "Група"),
    managerSnapshot: buildManagerSnapshot(items, summary, profile),
  };
}

export default {
  getInventoryPlanningSnapshot,
};
