// AutoGrand ERP V2 - Step 4.12 Inventory Planning / Reorder Suggestions Foundation
// Read-only decision-support service. This module never creates documents and never mutates stock journals.
// No automatic document creation. No stock posting/reversal/correction/journal mutation.

const DEFAULT_PLANNING_PROFILE = Object.freeze({
  reviewWindowDays: 30,
  slowMovingDays: 90,
  riskWindowDays: 14,
  targetCoverDays: 30,
  minimumSuggestedQty: 1,
});

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
    itemName: "Декоративен лайсна стар модел",
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
  return "OK";
}

function priorityLabel(priority) {
  if (priority === "critical") return "Висок приоритет";
  if (priority === "reorder") return "За дозареждане";
  if (priority === "slow") return "Бавно движение";
  return "Наблюдение";
}

function normalizePlanningRow(row, index) {
  const code = String(firstValue(row, ["itemCode", "code", "Code", "sku", "itemNo", "ItemNo", "number"], `ITEM-${index + 1}`));
  const name = String(firstValue(row, ["itemName", "name", "Name", "description", "Description", "caption", "Caption"], code));
  const groupName = String(firstValue(row, ["groupName", "group", "productGroup", "category", "Category"], "Склад"));
  const warehouseName = String(firstValue(row, ["warehouseName", "warehouse", "locationName", "businessGroupName", "storeName"], "Всички обекти"));
  const currentQty = roundQty(firstValue(row, ["currentQty", "onHandQty", "onHand", "quantity", "Quantity", "qty", "stockQty", "availableQty"], 0));
  const reservedQty = roundQty(firstValue(row, ["reservedQty", "blockedQty", "allocatedQty", "committedQty"], 0));
  const inboundQty = roundQty(firstValue(row, ["inboundQty", "orderedQty", "qtyToReceive", "QtyToReceive", "openPurchaseQty"], 0));
  const minimumQty = roundQty(firstValue(row, ["minimumQty", "minQty", "minimumStock", "reorderPoint", "safeQty"], Math.max(1, Math.ceil(currentQty * 0.35))));
  const maximumQty = roundQty(firstValue(row, ["maximumQty", "maxQty", "targetQty", "orderUpToQty"], Math.max(minimumQty * 2, currentQty + minimumQty)));
  const averageDailyIssueQty = roundQty(firstValue(row, ["averageDailyIssueQty", "avgDailyIssueQty", "avgDailyOutQty", "dailyDemandQty", "salesVelocityQty"], 0));
  const daysSinceLastMovement = Math.max(0, Math.round(toNumber(firstValue(row, ["daysSinceLastMovement", "lastMovementDays", "daysIdle", "ageDays"], 0))));
  const unitCost = roundMoney(firstValue(row, ["unitCost", "averageCost", "avgCost", "lastCost", "cost", "Cost"], 0));

  return {
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
  const projectedAvailableQty = roundQty(row.currentQty + row.inboundQty - row.reservedQty);
  const targetByCoverQty = row.averageDailyIssueQty > 0 ? row.averageDailyIssueQty * profile.targetCoverDays : row.minimumQty;
  const orderUpToQty = Math.max(row.maximumQty, row.minimumQty, targetByCoverQty);
  const recommendedOrderQty = projectedAvailableQty < row.minimumQty
    ? Math.max(profile.minimumSuggestedQty, Math.ceil(orderUpToQty - projectedAvailableQty))
    : 0;
  const riskLevel = classifyRisk(projectedAvailableQty, row.averageDailyIssueQty, row.minimumQty, profile);
  const isSlowMoving = row.currentQty > 0 && row.daysSinceLastMovement >= profile.slowMovingDays;
  const isBelowMinimum = projectedAvailableQty < row.minimumQty;
  const isOutOfStockRisk = riskLevel === "critical" || riskLevel === "warning";
  const priority = riskLevel === "critical" ? "critical" : (recommendedOrderQty > 0 ? "reorder" : (isSlowMoving ? "slow" : "watch"));
  const lockedReadOnlyReason = "read-only decision support; no automatic document creation";

  return {
    ...row,
    projectedAvailableQty,
    targetQty: roundQty(orderUpToQty),
    recommendedOrderQty,
    recommendedOrderValue: roundMoney(recommendedOrderQty * row.unitCost),
    riskLevel,
    riskLabel: riskLabel(riskLevel),
    priority,
    priorityLabel: priorityLabel(priority),
    isSlowMoving,
    isBelowMinimum,
    isOutOfStockRisk,
    lockedReadOnlyReason,
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
        // Ignore incompatible helper signatures. Step 4.12 remains read-only and uses fallback rows.
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

  return { rows: FALLBACK_SOURCE_ROWS.map((row) => ({ ...row })), sourceName: "step-4-12-foundation-seed" };
}

function buildSummary(items) {
  const totalRecommendedValue = roundMoney(items.reduce((sum, item) => sum + item.recommendedOrderValue, 0));
  const totalProjectedQty = roundQty(items.reduce((sum, item) => sum + item.projectedAvailableQty, 0));
  const reorderCount = items.filter((item) => item.recommendedOrderQty > 0).length;
  const outOfStockRiskCount = items.filter((item) => item.isOutOfStockRisk).length;
  const slowMovingCount = items.filter((item) => item.isSlowMoving).length;
  const belowMinimumCount = items.filter((item) => item.isBelowMinimum).length;

  return {
    totalItems: items.length,
    reorderCount,
    outOfStockRiskCount,
    slowMovingCount,
    belowMinimumCount,
    totalProjectedQty,
    totalRecommendedValue,
    managerStatus: outOfStockRiskCount > 0 ? "Нужен е преглед" : "Стабилно",
  };
}

export async function getInventoryPlanningSnapshot(options = {}) {
  const profile = { ...DEFAULT_PLANNING_PROFILE, ...(options.profile || {}) };
  const { rows, sourceName } = await collectSourceRows();
  const items = rows
    .map((row, index) => enrichPlanningRow(normalizePlanningRow(row, index), profile))
    .sort((a, b) => {
      const weight = { critical: 0, reorder: 1, slow: 2, watch: 3 };
      return (weight[a.priority] ?? 9) - (weight[b.priority] ?? 9) || b.recommendedOrderQty - a.recommendedOrderQty;
    });

  const reorderSuggestions = items.filter((item) => item.recommendedOrderQty > 0);
  const slowMovingItems = items.filter((item) => item.isSlowMoving);
  const outOfStockRiskItems = items.filter((item) => item.isOutOfStockRisk);

  return {
    step: "4.12",
    moduleKey: "inventory-planning",
    title: "Inventory Planning / Reorder Suggestions Foundation",
    generatedAtIso: new Date().toISOString(),
    sourceName,
    readOnly: true,
    guardrails: [
      "Няма автоматично създаване на документи",
      "Няма posting, reversal, correction или промяна на stock movement journal",
      "POSTED документите остават заключени",
      "Няма директна редакция или изтриване на stock journal",
    ],
    profile,
    summary: buildSummary(items),
    items,
    reorderSuggestions,
    slowMovingItems,
    outOfStockRiskItems,
    managerSnapshot: {
      title: "Мениджърски преглед",
      reviewWindowDays: profile.reviewWindowDays,
      nextAction: reorderSuggestions.length > 0
        ? "Преглед на предложенията и ръчно планиране на заявка/покупка при нужда."
        : "Няма критични предложения за дозареждане.",
      safetyNote: "Модулът е само за анализ и не създава документи автоматично.",
    },
  };
}

export default {
  getInventoryPlanningSnapshot,
};
