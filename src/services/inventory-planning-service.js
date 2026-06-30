// AutoGrand ERP V2 - Step 4.12.2 Inventory Planning Detail Inspector / Item Planning Drilldown
// Read-only decision-support service. This module never creates documents and never mutates stock journals.
// No automatic document creation. No stock posting/reversal/correction/journal mutation.

const DEFAULT_PLANNING_PROFILE = Object.freeze({
  reviewWindowDays: 30,
  slowMovingDays: 90,
  riskWindowDays: 14,
  targetCoverDays: 30,
  minimumSuggestedQty: 1,
  dashboardTopLimit: 5,
  detailTimelineLimit: 8,
  relatedItemLimit: 6,
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
    lastPurchaseDate: "2026-06-11",
    lastIssueDate: "2026-06-24",
    supplierName: "Основен доставчик",
    movements: [
      { date: "2026-06-24", type: "OUT", qty: 3, documentNo: "SAL-000421", location: "Централен склад", note: "продажба / сервизен разход" },
      { date: "2026-06-18", type: "OUT", qty: 2, documentNo: "SAL-000408", location: "Централен склад", note: "изписване към клиент" },
      { date: "2026-06-11", type: "IN", qty: 12, documentNo: "PUR-000196", location: "Централен склад", note: "последна доставка" },
    ],
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
    lastPurchaseDate: "2026-06-09",
    lastIssueDate: "2026-06-19",
    supplierName: "Основен доставчик",
    movements: [
      { date: "2026-06-19", type: "OUT", qty: 2, documentNo: "SAL-000404", location: "Централен склад", note: "продажба" },
      { date: "2026-06-09", type: "IN", qty: 20, documentNo: "PUR-000188", location: "Централен склад", note: "доставка" },
    ],
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
    lastPurchaseDate: "2026-05-31",
    lastIssueDate: "2026-06-27",
    supplierName: "Спирачни системи",
    movements: [
      { date: "2026-06-27", type: "OUT", qty: 1, documentNo: "SAL-000435", location: "Сервизен склад", note: "последно изписване" },
      { date: "2026-06-20", type: "OUT", qty: 2, documentNo: "SAL-000417", location: "Сервизен склад", note: "сервизен разход" },
      { date: "2026-05-31", type: "IN", qty: 8, documentNo: "PUR-000173", location: "Сервизен склад", note: "последна доставка" },
    ],
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
    lastPurchaseDate: "2025-12-12",
    lastIssueDate: "2025-12-24",
    supplierName: "Архивен доставчик",
    movements: [
      { date: "2025-12-24", type: "OUT", qty: 1, documentNo: "SAL-000114", location: "Втори склад", note: "рядко движение" },
      { date: "2025-12-12", type: "IN", qty: 25, documentNo: "PUR-000051", location: "Втори склад", note: "стара доставка" },
    ],
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
    lastPurchaseDate: "2026-06-05",
    lastIssueDate: "2026-06-29",
    supplierName: "Електро части",
    movements: [
      { date: "2026-06-29", type: "OUT", qty: 1, documentNo: "SAL-000443", location: "Централен склад", note: "последна продажба" },
      { date: "2026-06-05", type: "IN", qty: 6, documentNo: "PUR-000181", location: "Централен склад", note: "доставка" },
    ],
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

function normalizeDateLabel(value, fallback = "няма данни") {
  if (!value) return fallback;
  const text = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return String(value);
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
  const lastPurchaseDate = firstValue(row, ["lastPurchaseDate", "lastInboundDate", "lastReceiptDate", "lastDeliveryDate"], null);
  const lastIssueDate = firstValue(row, ["lastIssueDate", "lastSaleDate", "lastOutboundDate", "lastMovementDate"], null);
  const supplierName = String(firstValue(row, ["supplierName", "preferredSupplier", "vendorName", "lastSupplierName"], "не е зададен"));

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
    lastPurchaseDate,
    lastIssueDate,
    supplierName,
    sourceRow: row,
  };
}

function explainRecommendation(row, profile) {
  if (row.riskLevel === "critical") {
    return "Проектната наличност е нула или отрицателна. Нужно е ръчно мениджърско решение преди заявка или покупка.";
  }
  if (row.recommendedOrderQty > 0) {
    return `Проектната наличност е под минималното ниво. Предложението покрива цел около ${profile.targetCoverDays} дни или зададения максимум.`;
  }
  if (row.isSlowMoving) {
    return "Артикулът има наличност, но движението е бавно. Препоръката е проверка за залежаване, прехвърляне или промоция.";
  }
  if (row.riskLevel === "watch") {
    return "Артикулът не е под минимум, но покритието е близо до риск прозореца. Следи следващите движения.";
  }
  return "Артикулът е стабилен спрямо текущите planning правила.";
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
  const detailHref = `/inventory-planning/item/${encodeURIComponent(row.itemCode)}`;

  const enriched = {
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
    isSlowMoving,
    isBelowMinimum,
    isOutOfStockRisk,
    coverageDays,
    coverageLabel: coverageDays === null ? "няма разход" : `${coverageDays} дни покритие`,
    lockedReadOnlyReason,
    detailHref,
    display: {
      currentQty: formatQty(row.currentQty),
      reservedQty: formatQty(row.reservedQty),
      inboundQty: formatQty(row.inboundQty),
      projectedAvailableQty: formatQty(projectedAvailableQty),
      minimumQty: formatQty(row.minimumQty),
      maximumQty: formatQty(row.maximumQty),
      targetQty: formatQty(orderUpToQty),
      recommendedOrderQty: formatQty(recommendedOrderQty),
      recommendedOrderValue: formatMoney(recommendedOrderValue),
      stockValue: formatMoney(stockValue),
      averageDailyIssueQty: formatQty(row.averageDailyIssueQty),
      unitCost: formatMoney(row.unitCost),
      daysSinceLastMovement: formatDays(row.daysSinceLastMovement),
      lastPurchaseDate: normalizeDateLabel(row.lastPurchaseDate),
      lastIssueDate: normalizeDateLabel(row.lastIssueDate),
    },
  };

  enriched.actionLabel = actionLabel(enriched);
  enriched.recommendationText = explainRecommendation(enriched, profile);
  return enriched;
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
        // Ignore incompatible helper signatures. Step 4.12.2 remains read-only and uses fallback rows.
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

  return { rows: FALLBACK_SOURCE_ROWS.map((row) => ({ ...row })), sourceName: "step-4-12-2-detail-inspector-seed" };
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
      detailHref: item.detailHref,
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

function buildWarehouseRows(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.warehouseName || "Всички обекти";
    const current = map.get(key) || {
      warehouseName: key,
      currentQty: 0,
      reservedQty: 0,
      inboundQty: 0,
      projectedAvailableQty: 0,
      minimumQty: 0,
      recommendedOrderQty: 0,
      stockValue: 0,
    };
    current.currentQty = roundQty(current.currentQty + item.currentQty);
    current.reservedQty = roundQty(current.reservedQty + item.reservedQty);
    current.inboundQty = roundQty(current.inboundQty + item.inboundQty);
    current.projectedAvailableQty = roundQty(current.projectedAvailableQty + item.projectedAvailableQty);
    current.minimumQty = roundQty(current.minimumQty + item.minimumQty);
    current.recommendedOrderQty = roundQty(current.recommendedOrderQty + item.recommendedOrderQty);
    current.stockValue = roundMoney(current.stockValue + item.stockValue);
    map.set(key, current);
  }

  return Array.from(map.values()).map((row) => ({
    ...row,
    riskLabel: row.projectedAvailableQty <= 0 ? "Критичен" : (row.projectedAvailableQty < row.minimumQty ? "Под минимум" : "OK"),
    display: {
      currentQty: formatQty(row.currentQty),
      reservedQty: formatQty(row.reservedQty),
      inboundQty: formatQty(row.inboundQty),
      projectedAvailableQty: formatQty(row.projectedAvailableQty),
      minimumQty: formatQty(row.minimumQty),
      recommendedOrderQty: formatQty(row.recommendedOrderQty),
      stockValue: formatMoney(row.stockValue),
    },
  }));
}

function normalizeMovement(raw, index, fallbackLocation) {
  const type = String(firstValue(raw, ["type", "movementType", "direction", "entryType"], "INFO")).toUpperCase();
  const qty = roundQty(firstValue(raw, ["qty", "quantity", "Quantity", "movementQty"], 0));
  const date = normalizeDateLabel(firstValue(raw, ["date", "postingDate", "createdAt", "documentDate"], null), "без дата");
  const documentNo = String(firstValue(raw, ["documentNo", "docNo", "documentNumber", "sourceNo", "number"], `ROW-${index + 1}`));
  const location = String(firstValue(raw, ["location", "warehouseName", "warehouse", "locationName"], fallbackLocation));
  const note = String(firstValue(raw, ["note", "description", "reason", "source"], "stock movement reference"));
  const tone = type.includes("OUT") || type.includes("ISSUE") || type.includes("SALE") ? "out" : (type.includes("IN") || type.includes("RECEIPT") || type.includes("PUR") ? "in" : "info");

  return {
    index,
    date,
    type,
    qty,
    documentNo,
    location,
    note,
    tone,
    displayQty: formatQty(qty),
  };
}

function movementArraysFromSourceRow(sourceRow) {
  if (!sourceRow || typeof sourceRow !== "object") return [];
  const candidates = ["movements", "stockMovements", "movementRows", "journalRows", "entries", "history"];
  for (const key of candidates) {
    const value = sourceRow[key];
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
}

function buildMovementTimeline(item, sourceRows, profile) {
  const rawMovements = sourceRows.flatMap((row) => movementArraysFromSourceRow(row.sourceRow || row));
  const normalized = rawMovements
    .map((row, index) => normalizeMovement(row, index, item.warehouseName))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, profile.detailTimelineLimit);

  if (normalized.length > 0) return normalized;

  const fallback = [];
  if (item.lastIssueDate) {
    fallback.push(normalizeMovement({ date: item.lastIssueDate, type: "OUT", qty: Math.max(1, item.averageDailyIssueQty), documentNo: "LAST-OUT", location: item.warehouseName, note: "последно отчетено изходящо движение" }, 0, item.warehouseName));
  }
  if (item.lastPurchaseDate) {
    fallback.push(normalizeMovement({ date: item.lastPurchaseDate, type: "IN", qty: Math.max(1, item.inboundQty || item.minimumQty), documentNo: "LAST-IN", location: item.warehouseName, note: "последно отчетено входящо движение" }, 1, item.warehouseName));
  }
  fallback.push(normalizeMovement({ date: "planning", type: "INFO", qty: item.projectedAvailableQty, documentNo: "READ-ONLY", location: item.warehouseName, note: "проектна наличност за planning inspector" }, fallback.length, item.warehouseName));
  return fallback.slice(0, profile.detailTimelineLimit);
}

function buildPlanningSignals(item, profile) {
  return [
    {
      key: "minimum",
      title: "Минимално количество",
      tone: item.isBelowMinimum ? "danger" : "stable",
      value: `${item.display.projectedAvailableQty} / мин. ${item.display.minimumQty}`,
      note: item.isBelowMinimum ? "Проектната наличност е под минимум." : "Проектната наличност покрива минимума.",
    },
    {
      key: "coverage",
      title: "Покритие",
      tone: item.riskLevel === "critical" ? "danger" : (item.riskLevel === "watch" ? "warning" : "stable"),
      value: item.coverageLabel,
      note: `Риск прозорец: ${profile.riskWindowDays} дни.`,
    },
    {
      key: "reserved",
      title: "Резервирано / блокирано",
      tone: item.reservedQty > 0 ? "warning" : "stable",
      value: item.display.reservedQty,
      note: "Влияе върху проектната наличност, но не се редактира от този модул.",
    },
    {
      key: "inbound",
      title: "Очаквано входящо",
      tone: item.inboundQty > 0 ? "stable" : "muted",
      value: item.display.inboundQty,
      note: "Само отчетено за планиране. Няма създаване на документ.",
    },
    {
      key: "slow",
      title: "Бавно движение",
      tone: item.isSlowMoving ? "warning" : "stable",
      value: item.display.daysSinceLastMovement,
      note: item.isSlowMoving ? "Над прага за slow-moving артикул." : "Няма slow-moving сигнал.",
    },
  ];
}

function buildManualRecommendation(item) {
  const steps = [];
  if (item.riskLevel === "critical") {
    steps.push("Провери реална наличност и резервирани количества.");
    steps.push("Потвърди с управител дали да се планира покупка или трансфер.");
  } else if (item.recommendedOrderQty > 0) {
    steps.push("Провери последна доставка, доставчик и очаквано входящо количество.");
    steps.push("Създай документ само ръчно в съответния модул след потвърждение.");
  } else if (item.isSlowMoving) {
    steps.push("Провери дали артикулът е залежал, заменен или подходящ за трансфер.");
    steps.push("Не увеличавай наличността без ръчна търговска проверка.");
  } else {
    steps.push("Няма нужда от действие според текущите правила.");
    steps.push("Следи следващото движение и промяната в резервираните количества.");
  }

  return {
    title: item.actionLabel,
    tone: item.priority,
    explanation: item.recommendationText,
    suggestedManualSteps: steps,
    noAutomaticDocument: true,
    displayRecommendedOrderQty: item.display.recommendedOrderQty,
    displayRecommendedOrderValue: item.display.recommendedOrderValue,
  };
}

function buildRelatedItems(item, allItems, profile) {
  return allItems
    .filter((candidate) => candidate.itemCode !== item.itemCode && candidate.groupName === item.groupName)
    .slice(0, profile.relatedItemLimit)
    .map((candidate) => ({
      itemCode: candidate.itemCode,
      itemName: candidate.itemName,
      riskLabel: candidate.riskLabel,
      priorityLabel: candidate.priorityLabel,
      displayProjectedQty: candidate.display.projectedAvailableQty,
      detailHref: candidate.detailHref,
    }));
}

async function buildInventoryPlanningData(options = {}) {
  const profile = { ...DEFAULT_PLANNING_PROFILE, ...(options.profile || {}) };
  const viewMode = normalizeViewMode(options.viewMode);
  const { rows, sourceName } = await collectSourceRows();
  const normalizedRows = rows.map((row, index) => normalizePlanningRow(row, index));
  const items = normalizedRows
    .map((row) => enrichPlanningRow(row, profile))
    .sort((a, b) => {
      const weight = { critical: 0, reorder: 1, slow: 2, watch: 3, stable: 4 };
      return (weight[a.priority] ?? 9) - (weight[b.priority] ?? 9)
        || b.recommendedOrderValue - a.recommendedOrderValue
        || b.recommendedOrderQty - a.recommendedOrderQty;
    });

  const visibleItems = applyViewMode(items, viewMode);
  const summary = buildSummary(items);

  return {
    profile,
    viewMode,
    sourceName,
    normalizedRows,
    items,
    visibleItems,
    summary,
  };
}

export async function getInventoryPlanningSnapshot(options = {}) {
  const data = await buildInventoryPlanningData(options);
  const { profile, viewMode, sourceName, items, visibleItems, summary } = data;
  const reorderSuggestions = items.filter((item) => item.recommendedOrderQty > 0);
  const slowMovingItems = items.filter((item) => item.isSlowMoving);
  const outOfStockRiskItems = items.filter((item) => item.isOutOfStockRisk);

  return {
    step: "4.12.2",
    previousStep: "4.12.1",
    moduleKey: "inventory-planning",
    title: "Inventory Planning / Reorder Suggestions Detail Inspector",
    generatedAtIso: new Date().toISOString(),
    sourceName,
    readOnly: true,
    uiPolishVersion: "manager-dashboard-refinement",
    detailInspectorVersion: "item-planning-drilldown",
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

export async function getInventoryPlanningItemDetail(itemCode, options = {}) {
  const data = await buildInventoryPlanningData(options);
  const lookup = decodeURIComponent(String(itemCode || "")).trim().toLowerCase();
  if (!lookup) return null;

  const item = data.items.find((candidate) => candidate.itemCode.toLowerCase() === lookup);
  if (!item) return null;

  const sameItemRows = data.items.filter((candidate) => candidate.itemCode === item.itemCode);
  const sourceRows = data.normalizedRows.filter((row) => row.itemCode === item.itemCode);
  const warehouseRows = buildWarehouseRows(sameItemRows.length > 0 ? sameItemRows : [item]);
  const movementTimeline = buildMovementTimeline(item, sourceRows.length > 0 ? sourceRows : [item], data.profile);

  return {
    step: "4.12.2",
    previousStep: "4.12.1",
    moduleKey: "inventory-planning",
    title: "Inventory Planning Detail Inspector / Item Planning Drilldown",
    generatedAtIso: new Date().toISOString(),
    sourceName: data.sourceName,
    readOnly: true,
    item,
    summary: data.summary,
    profile: data.profile,
    warehouseRows,
    movementTimeline,
    planningSignals: buildPlanningSignals(item, data.profile),
    manualRecommendation: buildManualRecommendation(item),
    relatedItems: buildRelatedItems(item, data.items, data.profile),
    backHref: "/inventory-planning",
    apiHref: `/api/stock/inventory-planning/items/${encodeURIComponent(item.itemCode)}`,
    guardrails: [
      "Детайлният инспектор е само за преглед и управленско решение",
      "Няма автоматично създаване на purchase, transfer или correction документ",
      "Няма промяна на stock movement journal",
      "POSTED документите остават locked",
    ],
  };
}

export default {
  getInventoryPlanningSnapshot,
  getInventoryPlanningItemDetail,
};
