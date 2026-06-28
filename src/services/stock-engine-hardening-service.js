// AutoGrand ERP V2 — Step 4.7.4 Stock Audit Resolution View
// Marker: AG_STEP_4_7_4_STOCK_AUDIT_RESOLUTION_SERVICE
// Purpose: central stock ledger audit plus operator-friendly resolution details.

let cachedPrisma = null;

const STEP_4_7_STOCK_HEALTH_LABEL = "4-7-stock-engine-hardening";
const DEFAULT_LIMIT = 50000;
const DETAIL_LIMIT = 12;
const EPSILON = 0.000001;

const MODEL_CANDIDATES = [
  "stockMovement",
  "stockMovements",
  "inventoryMovement",
  "inventoryMovements",
  "warehouseMovement",
  "warehouseMovements"
];

const FIELD_CANDIDATES = {
  itemId: ["itemId", "productId", "articleId", "partId", "skuId", "catalogItemId"],
  locationId: ["locationId", "objectId", "warehouseId", "storeId", "branchId", "siteId"],
  quantity: ["quantity", "qty", "movementQty", "stockQty", "baseQuantity", "amount"],
  direction: ["direction", "stockDirection", "movementDirection", "side", "sign"],
  type: ["movementType", "type", "kind", "reason", "sourceType", "operationType"],
  documentId: ["documentId", "sourceDocumentId", "sourceId", "referenceId", "saleDocumentId", "purchaseDocumentId", "transferDocumentId"],
  lineId: ["documentLineId", "lineId", "sourceLineId", "saleDocumentLineId", "purchaseDocumentLineId", "transferLineId"],
  createdAt: ["createdAt", "postedAt", "movementDate", "date", "timestamp"]
};

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "object" && typeof value.toNumber === "function") return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function safeDateString(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return safeString(value);
}

async function tryImportPrisma(path) {
  try {
    const module = await import(path);
    return module.prisma || module.default || module.client || module.db || null;
  } catch (_error) {
    return null;
  }
}

export async function getPrismaClient() {
  if (cachedPrisma) return cachedPrisma;

  const candidates = [
    "../db/prisma.js",
    "../lib/prisma.js",
    "../database/prisma.js",
    "../prisma/client.js",
    "../prisma.js"
  ];

  for (const candidate of candidates) {
    const resolved = await tryImportPrisma(candidate);
    if (resolved) {
      cachedPrisma = resolved;
      return cachedPrisma;
    }
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    cachedPrisma = new PrismaClient();
    return cachedPrisma;
  } catch (error) {
    const wrapped = new Error("Cannot resolve Prisma client for Step 4.7 Stock Engine Hardening.");
    wrapped.cause = error;
    wrapped.code = "AG_STEP_4_7_PRISMA_NOT_FOUND";
    throw wrapped;
  }
}

function getRuntimeModels(prisma) {
  const runtime = prisma && prisma._runtimeDataModel && prisma._runtimeDataModel.models;
  if (!runtime) return [];
  return Object.entries(runtime).map(([name, model]) => ({ name, model }));
}

function findDelegateName(prisma, candidates) {
  const keys = Object.keys(prisma || {});
  for (const candidate of candidates) {
    const lower = normalizeName(candidate);
    const exact = keys.find((key) => normalizeName(key) === lower);
    if (exact && prisma[exact] && typeof prisma[exact].findMany === "function") return exact;
  }

  return keys.find((key) => {
    const lower = normalizeName(key);
    return lower.includes("stock") && lower.includes("movement") && prisma[key] && typeof prisma[key].findMany === "function";
  }) || null;
}

function findModel(prisma, delegateName) {
  const models = getRuntimeModels(prisma);
  return models.find((entry) => normalizeName(entry.name) === normalizeName(delegateName)) || null;
}

function listModelFields(modelEntry) {
  const fields = modelEntry && modelEntry.model && Array.isArray(modelEntry.model.fields)
    ? modelEntry.model.fields
    : [];
  return fields.map((field) => field.name || field.dbName || "").filter(Boolean);
}

function pickField(fields, candidates) {
  const normalized = new Map(fields.map((field) => [normalizeName(field), field]));
  for (const candidate of candidates) {
    const match = normalized.get(normalizeName(candidate));
    if (match) return match;
  }
  return null;
}

function buildFieldMap(fields) {
  return {
    itemId: pickField(fields, FIELD_CANDIDATES.itemId),
    locationId: pickField(fields, FIELD_CANDIDATES.locationId),
    quantity: pickField(fields, FIELD_CANDIDATES.quantity),
    direction: pickField(fields, FIELD_CANDIDATES.direction),
    type: pickField(fields, FIELD_CANDIDATES.type),
    documentId: pickField(fields, FIELD_CANDIDATES.documentId),
    lineId: pickField(fields, FIELD_CANDIDATES.lineId),
    createdAt: pickField(fields, FIELD_CANDIDATES.createdAt)
  };
}

function signedQuantity(row, fieldMap) {
  const rawQty = numberValue(row[fieldMap.quantity]);
  const absolute = Math.abs(rawQty);
  if (rawQty < 0) return rawQty;

  const tokens = [
    fieldMap.direction ? row[fieldMap.direction] : "",
    fieldMap.type ? row[fieldMap.type] : ""
  ].map((value) => safeString(value).toUpperCase()).join(" ");

  const outTokens = [
    "OUT", "SALE", "SALES", "ISSUE", "DISPATCH", "TRANSFER_OUT", "STOCK_OUT",
    "EXPEDITION", "CONSUME", "WRITE_OFF", "РАЗХОД", "ИЗПИС", "ПРОДАЖ", "ЕКСПЕДИЦ"
  ];

  const inTokens = [
    "IN", "PURCHASE", "DELIVERY", "RECEIVE", "RECEIPT", "TRANSFER_IN", "STOCK_IN",
    "ADJUSTMENT_IN", "ПРИХОД", "ДОСТАВ", "ПРИЕМ", "ЗАПРИХОД"
  ];

  if (outTokens.some((token) => tokens.includes(token))) return -absolute;
  if (inTokens.some((token) => tokens.includes(token))) return absolute;

  return rawQty;
}

function movementSignature(row, fieldMap) {
  return [
    fieldMap.documentId ? safeString(row[fieldMap.documentId]) : "no-document",
    fieldMap.lineId ? safeString(row[fieldMap.lineId]) : "no-line",
    fieldMap.itemId ? safeString(row[fieldMap.itemId]) : "no-item",
    fieldMap.locationId ? safeString(row[fieldMap.locationId]) : "no-location",
    fieldMap.type ? safeString(row[fieldMap.type]) : "no-type",
    signedQuantity(row, fieldMap).toFixed(6)
  ].join("|");
}

function balanceKey(row, fieldMap) {
  return [
    fieldMap.itemId ? safeString(row[fieldMap.itemId]) : "NO_ITEM",
    fieldMap.locationId ? safeString(row[fieldMap.locationId]) : "NO_LOCATION"
  ].join("|");
}

function sortBalances(a, b) {
  const loc = safeString(a.locationId).localeCompare(safeString(b.locationId));
  if (loc !== 0) return loc;
  return safeString(a.itemId).localeCompare(safeString(b.itemId));
}

function normalizeMovement(row, fieldMap) {
  const signed = signedQuantity(row, fieldMap);
  return {
    id: row.id ?? null,
    itemId: fieldMap.itemId ? row[fieldMap.itemId] : null,
    locationId: fieldMap.locationId ? row[fieldMap.locationId] : null,
    quantity: fieldMap.quantity ? numberValue(row[fieldMap.quantity]) : 0,
    signedQuantity: Number(signed.toFixed(6)),
    direction: fieldMap.direction ? safeString(row[fieldMap.direction]) : "",
    type: fieldMap.type ? safeString(row[fieldMap.type]) : "",
    documentId: fieldMap.documentId ? row[fieldMap.documentId] ?? null : null,
    lineId: fieldMap.lineId ? row[fieldMap.lineId] ?? null : null,
    createdAt: fieldMap.createdAt ? safeDateString(row[fieldMap.createdAt]) : "",
    signature: movementSignature(row, fieldMap)
  };
}

function sortMovementsNewestFirst(a, b) {
  const dateA = a.createdAt ? Date.parse(a.createdAt) : 0;
  const dateB = b.createdAt ? Date.parse(b.createdAt) : 0;
  if (dateA !== dateB) return dateB - dateA;
  return safeString(b.id).localeCompare(safeString(a.id));
}

function buildResolutionPayload(snapshot, movementsByBalanceKey, duplicateGroups) {
  const negativeBalanceDetails = snapshot.negativeBalances.map((balance) => {
    const key = [safeString(balance.itemId), safeString(balance.locationId)].join("|");
    const relatedMovements = (movementsByBalanceKey.get(key) || [])
      .slice()
      .sort(sortMovementsNewestFirst)
      .slice(0, DETAIL_LIMIT);

    return {
      ...balance,
      shortageQuantity: Number(Math.abs(numberValue(balance.onHand)).toFixed(6)),
      relatedMovementCount: movementsByBalanceKey.get(key)?.length || 0,
      relatedMovements,
      suggestedAction: "Прегледай последните OUT/SALE движения за този артикул и обект. Корекцията трябва да е чрез обратен запис, не чрез изтриване."
    };
  });

  const duplicateMovementDetails = duplicateGroups
    .filter((group) => group.movements.length > 1)
    .map((group) => ({
      signature: group.signature,
      count: group.movements.length,
      documentId: group.movements[0]?.documentId ?? null,
      lineId: group.movements[0]?.lineId ?? null,
      itemId: group.movements[0]?.itemId ?? null,
      locationId: group.movements[0]?.locationId ?? null,
      signedQuantity: group.movements[0]?.signedQuantity ?? 0,
      movements: group.movements.slice().sort(sortMovementsNewestFirst).slice(0, DETAIL_LIMIT),
      suggestedAction: "Провери дали документният ред е публикуван повече от веднъж. Ако е реален дублаж, добави обратен запис или блокирай повторното осчетоводяване."
    }));

  return {
    ok: negativeBalanceDetails.length === 0 && duplicateMovementDetails.length === 0,
    negativeBalanceDetails,
    duplicateMovementDetails,
    resolutionSummary: {
      negativeIssueCount: negativeBalanceDetails.length,
      duplicateIssueCount: duplicateMovementDetails.length,
      blockingIssueCount: negativeBalanceDetails.length + duplicateMovementDetails.length
    },
    resolutionPlan: [
      "1. Отвори отрицателните наличности и виж последните движения за същия артикул/обект.",
      "2. Ако има дублаж, провери documentId + lineId подписа преди ново публикуване.",
      "3. Не трий складов журнал. Корекцията се прави с обратен запис.",
      "4. След корекция пусни audit отново и продължи само при чист резултат."
    ]
  };
}

export async function resolveStockMovementContract(prismaArg = null) {
  const prisma = prismaArg || await getPrismaClient();
  const delegateName = findDelegateName(prisma, MODEL_CANDIDATES);

  if (!delegateName) {
    return {
      ok: false,
      prisma,
      delegateName: null,
      fieldMap: {},
      errors: ["Stock movement Prisma model was not found. Expected model like StockMovement or InventoryMovement."]
    };
  }

  const model = findModel(prisma, delegateName);
  const fields = listModelFields(model);
  const fieldMap = buildFieldMap(fields);
  const errors = [];

  for (const required of ["itemId", "locationId", "quantity"]) {
    if (!fieldMap[required]) errors.push(`Stock movement model ${delegateName} is missing required semantic field: ${required}`);
  }

  return {
    ok: errors.length === 0,
    prisma,
    delegateName,
    modelName: model ? model.name : delegateName,
    fields,
    fieldMap,
    errors
  };
}

export async function buildStockSnapshot(options = {}) {
  const contract = await resolveStockMovementContract(options.prisma || null);
  if (!contract.ok) {
    return {
      ok: false,
      step: "4.7.4",
      healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
      errors: contract.errors,
      contract: { delegateName: contract.delegateName, fieldMap: contract.fieldMap },
      summary: { movementCount: 0, balanceCount: 0, negativeBalanceCount: 0, duplicateMovementCount: 0 },
      balances: [],
      negativeBalances: [],
      duplicateMovements: [],
      movementDetails: []
    };
  }

  const limit = Math.max(1, Math.min(Number(options.limit || DEFAULT_LIMIT), DEFAULT_LIMIT));
  const rows = await contract.prisma[contract.delegateName].findMany({ take: limit });
  const balancesByKey = new Map();
  const seenSignatures = new Map();
  const duplicateRows = [];
  const movementsByBalanceKey = new Map();
  const duplicateGroupsBySignature = new Map();
  const movementDetails = [];

  for (const row of rows) {
    const key = balanceKey(row, contract.fieldMap);
    const movement = normalizeMovement(row, contract.fieldMap);
    movementDetails.push(movement);

    const related = movementsByBalanceKey.get(key) || [];
    related.push(movement);
    movementsByBalanceKey.set(key, related);

    const current = balancesByKey.get(key) || {
      itemId: contract.fieldMap.itemId ? row[contract.fieldMap.itemId] : null,
      locationId: contract.fieldMap.locationId ? row[contract.fieldMap.locationId] : null,
      onHand: 0,
      movementCount: 0
    };

    current.onHand += movement.signedQuantity;
    current.movementCount += 1;
    balancesByKey.set(key, current);

    const existing = seenSignatures.get(movement.signature);
    if (existing) duplicateRows.push({ signature: movement.signature, firstId: existing.id || null, duplicateId: movement.id || null });
    else seenSignatures.set(movement.signature, movement);

    const duplicateGroup = duplicateGroupsBySignature.get(movement.signature) || { signature: movement.signature, movements: [] };
    duplicateGroup.movements.push(movement);
    duplicateGroupsBySignature.set(movement.signature, duplicateGroup);
  }

  const balances = Array.from(balancesByKey.values())
    .map((item) => ({ ...item, onHand: Number(item.onHand.toFixed(6)) }))
    .sort(sortBalances);
  const negativeBalances = balances.filter((item) => item.onHand < -EPSILON);
  const duplicateGroups = Array.from(duplicateGroupsBySignature.values()).filter((group) => group.movements.length > 1);
  const resolution = buildResolutionPayload({ negativeBalances }, movementsByBalanceKey, duplicateGroups);
  const ok = negativeBalances.length === 0 && duplicateRows.length === 0;

  return {
    ok,
    step: "4.7.4",
    healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
    errors: ok ? [] : [
      ...(negativeBalances.length ? [`Negative stock balances detected: ${negativeBalances.length}`] : []),
      ...(duplicateRows.length ? [`Potential duplicate stock movement signatures detected: ${duplicateRows.length}`] : [])
    ],
    contract: { delegateName: contract.delegateName, modelName: contract.modelName, fields: contract.fields, fieldMap: contract.fieldMap },
    summary: { movementCount: rows.length, balanceCount: balances.length, negativeBalanceCount: negativeBalances.length, duplicateMovementCount: duplicateRows.length, limit },
    balances,
    negativeBalances,
    duplicateMovements: duplicateRows,
    movementDetails: movementDetails.slice(0, DETAIL_LIMIT),
    ...resolution
  };
}

export async function assertStockAvailability(request = {}) {
  const itemId = safeString(request.itemId);
  const locationId = safeString(request.locationId || request.objectId || request.warehouseId);
  const requestedQuantity = Math.abs(numberValue(request.quantity));
  const allowNegativeStock = request.allowNegativeStock === true;

  if (!itemId) throw Object.assign(new Error("Missing itemId for stock availability check."), { code: "AG_STEP_4_7_ITEM_REQUIRED" });
  if (!locationId) throw Object.assign(new Error("Missing locationId/objectId/warehouseId for stock availability check."), { code: "AG_STEP_4_7_LOCATION_REQUIRED" });
  if (requestedQuantity <= EPSILON) return { ok: true, requestedQuantity, availableQuantity: 0, bypass: "non-positive-request" };

  const snapshot = await buildStockSnapshot({ prisma: request.prisma, limit: request.limit || DEFAULT_LIMIT });
  if (!snapshot.ok && snapshot.contract && !snapshot.contract.delegateName) {
    throw Object.assign(new Error("Stock movement contract is not available."), { code: "AG_STEP_4_7_CONTRACT_UNAVAILABLE", details: snapshot.errors });
  }

  const balance = snapshot.balances.find((entry) => safeString(entry.itemId) === itemId && safeString(entry.locationId) === locationId);
  const availableQuantity = balance ? numberValue(balance.onHand) : 0;

  if (!allowNegativeStock && availableQuantity + EPSILON < requestedQuantity) {
    throw Object.assign(new Error("Недостатъчна наличност за складово движение."), {
      code: "AG_STEP_4_7_STOCK_SHORTAGE",
      itemId,
      locationId,
      requestedQuantity,
      availableQuantity,
      shortageQuantity: Number((requestedQuantity - availableQuantity).toFixed(6))
    });
  }

  return { ok: true, itemId, locationId, requestedQuantity, availableQuantity, allowNegativeStock };
}

export async function getStockEngineAudit(options = {}) {
  const snapshot = await buildStockSnapshot(options);
  return {
    ...snapshot,
    monetaRules: [
      "posted-document-only-affects-stock",
      "no-silent-negative-stock",
      "one-document-line-one-stock-effect",
      "object-location-isolation",
      "ledger-is-source-of-truth",
      "reversal-instead-of-delete"
    ],
    recommendedNextActions: snapshot.ok
      ? ["Continue with guarded integration in sales, purchases and transfers posting services."]
      : ["Review negative balances or duplicate movement signatures before adding new posting flows."]
  };
}

export async function getStockAuditResolution(options = {}) {
  const audit = await getStockEngineAudit(options);
  return {
    ok: audit.ok,
    step: "4.7.4",
    healthLabel: audit.healthLabel,
    summary: audit.summary,
    negativeBalanceDetails: audit.negativeBalanceDetails || [],
    duplicateMovementDetails: audit.duplicateMovementDetails || [],
    resolutionSummary: audit.resolutionSummary || { negativeIssueCount: 0, duplicateIssueCount: 0, blockingIssueCount: 0 },
    resolutionPlan: audit.resolutionPlan || [],
    contract: audit.contract,
    errors: audit.errors || []
  };
}

export const stockEngineHardeningService = {
  step: "4.7.4",
  healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
  resolveStockMovementContract,
  buildStockSnapshot,
  assertStockAvailability,
  getStockEngineAudit,
  getStockAuditResolution
};

export default stockEngineHardeningService;
