// AutoGrand ERP V2 — Step 4.7 Stock Engine Hardening
// Marker: AG_STEP_4_7_STOCK_ENGINE_HARDENING_SERVICE
// Purpose: central, auditable stock ledger guard for posted stock movements.

let cachedPrisma = null;

const STEP_4_7_STOCK_HEALTH_LABEL = "4-7-stock-engine-hardening";
const DEFAULT_LIMIT = 50000;
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
    if (exact && prisma[exact] && typeof prisma[exact].findMany === "function") {
      return exact;
    }
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
      step: "4.7",
      healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
      errors: contract.errors,
      contract: { delegateName: contract.delegateName, fieldMap: contract.fieldMap },
      summary: { movementCount: 0, balanceCount: 0, negativeBalanceCount: 0, duplicateMovementCount: 0 },
      balances: [],
      negativeBalances: [],
      duplicateMovements: []
    };
  }

  const limit = Math.max(1, Math.min(Number(options.limit || DEFAULT_LIMIT), DEFAULT_LIMIT));
  const rows = await contract.prisma[contract.delegateName].findMany({ take: limit });
  const balancesByKey = new Map();
  const seenSignatures = new Map();
  const duplicates = [];

  for (const row of rows) {
    const key = balanceKey(row, contract.fieldMap);
    const signed = signedQuantity(row, contract.fieldMap);
    const current = balancesByKey.get(key) || {
      itemId: contract.fieldMap.itemId ? row[contract.fieldMap.itemId] : null,
      locationId: contract.fieldMap.locationId ? row[contract.fieldMap.locationId] : null,
      onHand: 0,
      movementCount: 0
    };

    current.onHand += signed;
    current.movementCount += 1;
    balancesByKey.set(key, current);

    const signature = movementSignature(row, contract.fieldMap);
    const existing = seenSignatures.get(signature);
    if (existing) duplicates.push({ signature, firstId: existing.id || null, duplicateId: row.id || null });
    else seenSignatures.set(signature, row);
  }

  const balances = Array.from(balancesByKey.values())
    .map((item) => ({ ...item, onHand: Number(item.onHand.toFixed(6)) }))
    .sort(sortBalances);
  const negativeBalances = balances.filter((item) => item.onHand < -EPSILON);
  const ok = negativeBalances.length === 0 && duplicates.length === 0;

  return {
    ok,
    step: "4.7",
    healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
    errors: ok ? [] : [
      ...(negativeBalances.length ? [`Negative stock balances detected: ${negativeBalances.length}`] : []),
      ...(duplicates.length ? [`Potential duplicate stock movement signatures detected: ${duplicates.length}`] : [])
    ],
    contract: { delegateName: contract.delegateName, modelName: contract.modelName, fields: contract.fields, fieldMap: contract.fieldMap },
    summary: { movementCount: rows.length, balanceCount: balances.length, negativeBalanceCount: negativeBalances.length, duplicateMovementCount: duplicates.length, limit },
    balances,
    negativeBalances,
    duplicateMovements: duplicates
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

export const stockEngineHardeningService = {
  step: "4.7",
  healthLabel: STEP_4_7_STOCK_HEALTH_LABEL,
  resolveStockMovementContract,
  buildStockSnapshot,
  assertStockAvailability,
  getStockEngineAudit
};

export default stockEngineHardeningService;
