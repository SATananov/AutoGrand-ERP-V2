import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STEP_LABEL = "Step 4.9.3 Stock Control Center Drilldown / Detail Inspector";
const MAX_TRACE_ROWS = 30;

function asText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function normalizeType(value) {
  return asText(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function modelMap() {
  return prisma._runtimeDataModel?.models || {};
}

function modelNames() {
  return Object.keys(modelMap());
}

function delegateFor(modelName) {
  const delegateName = lowerFirst(modelName);
  return prisma[delegateName];
}

function fieldsFor(modelName) {
  const model = modelMap()[modelName];
  return Array.isArray(model?.fields) ? model.fields : [];
}

function hasField(modelName, fieldName) {
  return fieldsFor(modelName).some((field) => field.name === fieldName);
}

function getFieldType(modelName, fieldName) {
  return fieldsFor(modelName).find((field) => field.name === fieldName)?.type || "String";
}

function readFirst(record, names) {
  if (!record) return "";
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(record, name)) {
      const value = record[name];
      if (value !== null && value !== undefined && asText(value) !== "") return value;
    }
  }
  return "";
}

function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value)) output[key] = toPlain(item);
    return output;
  }
  return value;
}

function safeNumber(value) {
  const numeric = Number.parseInt(asText(value), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function valueForField(modelName, fieldName, rawValue) {
  const fieldType = getFieldType(modelName, fieldName);
  const text = asText(rawValue).trim();
  if (!text) return undefined;
  if (fieldType === "Int") {
    const parsed = safeNumber(text);
    return parsed === null ? undefined : parsed;
  }
  if (fieldType === "BigInt") {
    const parsed = safeNumber(text);
    return parsed === null ? undefined : BigInt(parsed);
  }
  if (fieldType === "String") return text;
  return undefined;
}

function buildWhereAny(modelName, fieldNames, rawValue) {
  const clauses = [];
  for (const fieldName of fieldNames) {
    if (!hasField(modelName, fieldName)) continue;
    const value = valueForField(modelName, fieldName, rawValue);
    if (value !== undefined) clauses.push({ [fieldName]: value });
  }
  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];
  return { OR: clauses };
}

function orderByFor(modelName) {
  if (hasField(modelName, "createdAt")) return { createdAt: "desc" };
  if (hasField(modelName, "created_at")) return { created_at: "desc" };
  if (hasField(modelName, "date")) return { date: "desc" };
  if (hasField(modelName, "documentDate")) return { documentDate: "desc" };
  if (hasField(modelName, "id")) return { id: "desc" };
  return undefined;
}

function matchesAny(name, patterns) {
  return patterns.some((pattern) => pattern.test(name));
}

function documentModelCandidates(documentType) {
  const type = normalizeType(documentType);
  const all = modelNames();
  const prioritized = [];
  const pushBy = (patterns) => {
    for (const name of all) {
      if (prioritized.includes(name)) continue;
      if (matchesAny(name, patterns)) prioritized.push(name);
    }
  };

  if (type.includes("adjust")) pushBy([/Adjustment/i, /Correction/i]);
  if (type.includes("transfer")) pushBy([/Transfer/i]);
  if (type.includes("purchase") || type.includes("delivery")) pushBy([/Purchase/i, /Delivery/i, /Receipt/i]);
  if (type.includes("sale") || type.includes("sales")) pushBy([/Sales/i, /Sale/i]);
  if (type.includes("stock")) pushBy([/Stock.*Document/i, /Document.*Stock/i]);

  pushBy([/Document/i, /Invoice/i, /Order/i]);
  return prioritized;
}

function movementModelCandidates() {
  const all = modelNames();
  const prioritized = [];
  const pushBy = (patterns) => {
    for (const name of all) {
      if (prioritized.includes(name)) continue;
      if (matchesAny(name, patterns)) prioritized.push(name);
    }
  };
  pushBy([/Stock.*Movement/i, /Movement.*Stock/i, /Stock.*Journal/i, /Journal.*Stock/i, /Inventory.*Movement/i]);
  pushBy([/Movement/i, /Journal/i, /Ledger/i]);
  return prioritized;
}

async function findFirstRecord(candidates, fieldNames, rawValue) {
  if (!rawValue) return null;
  for (const modelName of candidates) {
    const delegate = delegateFor(modelName);
    if (!delegate?.findFirst) continue;
    const where = buildWhereAny(modelName, fieldNames, rawValue);
    if (!where) continue;
    try {
      const record = await delegate.findFirst({ where });
      if (record) return { modelName, record: toPlain(record) };
    } catch (error) {
      // Continue probing other compatible models. Inspector must be read-only and fail-soft.
    }
  }
  return null;
}

async function findManyRecords(candidates, fieldNames, rawValue) {
  if (!rawValue) return [];
  const output = [];
  for (const modelName of candidates) {
    const delegate = delegateFor(modelName);
    if (!delegate?.findMany) continue;
    const where = buildWhereAny(modelName, fieldNames, rawValue);
    if (!where) continue;
    try {
      const orderBy = orderByFor(modelName);
      const args = { where, take: MAX_TRACE_ROWS };
      if (orderBy) args.orderBy = orderBy;
      const rows = await delegate.findMany(args);
      for (const row of rows || []) output.push({ modelName, record: toPlain(row) });
    } catch (error) {
      // Continue probing other compatible models. Inspector must be read-only and fail-soft.
    }
  }
  return output;
}

function summarizeDocument(found, context) {
  if (!found?.record) {
    return {
      found: false,
      modelName: "",
      id: asText(context.documentId || context.movementId || ""),
      number: asText(context.documentNumber || ""),
      type: asText(context.documentType || "stock"),
      status: "UNKNOWN",
      statusText: "Документът не беше намерен автоматично",
      title: "Инспекция по подаден контекст",
      date: "",
      location: "",
      operator: "",
      locked: false,
      rawFields: [],
    };
  }

  const record = found.record;
  const id = readFirst(record, ["id", "uuid", "documentId"]);
  const number = readFirst(record, ["documentNumber", "number", "docNumber", "code", "reference", "name"]);
  const status = readFirst(record, ["status", "state", "documentStatus", "postingStatus", "workflowStatus"]);
  const date = readFirst(record, ["documentDate", "date", "createdAt", "created_at", "updatedAt", "postedAt"]);
  const location = readFirst(record, ["locationName", "warehouseName", "objectName", "storeName", "sourceWarehouseName", "destinationWarehouseName"]);
  const operator = readFirst(record, ["operatorName", "userName", "createdByName", "postedByName", "employeeName", "ownerName"]);
  const locked = Boolean(readFirst(record, ["locked", "isLocked", "posted", "isPosted"])) || /posted|locked|final|closed/i.test(asText(status));
  const type = asText(context.documentType || found.modelName);

  return {
    found: true,
    modelName: found.modelName,
    id: asText(id),
    number: asText(number || id),
    type,
    status: asText(status || "UNKNOWN"),
    statusText: asText(status || "Няма статус в модела"),
    title: `${type || found.modelName} ${number || id || ""}`.trim(),
    date: asText(date),
    location: asText(location),
    operator: asText(operator),
    locked,
    rawFields: Object.entries(record).slice(0, 18).map(([key, value]) => ({ key, value: asText(value) })),
  };
}

function summarizeMovement(found) {
  const record = found.record;
  const id = readFirst(record, ["id", "uuid", "movementId"]);
  const date = readFirst(record, ["date", "movementDate", "createdAt", "created_at", "postedAt"]);
  const item = readFirst(record, ["itemName", "productName", "articleName", "sku", "itemCode", "productCode", "name"]);
  const warehouse = readFirst(record, ["warehouseName", "locationName", "objectName", "storeName"]);
  const direction = readFirst(record, ["direction", "movementType", "type", "kind", "operation"]);
  const quantity = readFirst(record, ["quantity", "qty", "deltaQty", "movementQty", "stockQty"]);
  const documentNumber = readFirst(record, ["documentNumber", "docNumber", "sourceDocumentNumber", "reference"]);
  const status = readFirst(record, ["status", "state", "postingStatus"]);
  return {
    modelName: found.modelName,
    id: asText(id),
    date: asText(date),
    item: asText(item),
    warehouse: asText(warehouse),
    direction: asText(direction),
    quantity: asText(quantity),
    documentNumber: asText(documentNumber),
    status: asText(status),
  };
}

function analyzeReversal(documentSummary, movements) {
  const joined = [documentSummary.status, documentSummary.statusText, ...movements.map((row) => `${row.direction} ${row.status}`)].join(" ");
  const hasReversal = /revers|annul|cancel|void|correction|adjustment|сторно|анул|корекц/i.test(joined);
  if (hasReversal) {
    return {
      label: "Има сигнал за correction/reversal",
      tone: "warning",
      description: "Открит е статус или движение, което прилича на анулиране, сторно или корекция. Следващата стъпка трябва да мине през отделен correction/adjustment документ.",
    };
  }
  if (!documentSummary.found && movements.length === 0) {
    return {
      label: "Няма достатъчно данни",
      tone: "muted",
      description: "Inspector-ът не намери документ или движение по подадения контекст. Няма да предлага опасно действие.",
    };
  }
  return {
    label: "Няма открит reversal/correction маркер",
    tone: "ok",
    description: "Не е открито автоматично сторно, анулиране или корекционен документ. Това не отключва POSTED документ и не позволява ръчна редакция на journal.",
  };
}

function checklist(documentSummary, movements, context) {
  return [
    {
      label: "Документът е намерен",
      ok: documentSummary.found,
      text: documentSummary.found ? "Има реален документен контекст." : "Няма намерен документ; работи се само по подаден филтър/риск.",
    },
    {
      label: "Movement trace е проверен",
      ok: movements.length > 0,
      text: movements.length > 0 ? `Открити движения: ${movements.length}.` : "Не са открити движения по този контекст.",
    },
    {
      label: "POSTED lock е уважен",
      ok: true,
      text: documentSummary.locked ? "Документът изглежда posted/locked и не се отключва от inspector-а." : "Inspector-ът не променя locked статус.",
    },
    {
      label: "Correction/reversal е отделен поток",
      ok: true,
      text: "Всички корекции остават през отделен stock adjustment/correction документ.",
    },
    {
      label: "Journal е read-only",
      ok: true,
      text: "Няма бутон за ръчно редактиране или триене на stock movement journal.",
    },
    {
      label: "Контекстът от risk/filter е запазен",
      ok: Boolean(context.riskCode || context.filterCode || context.openUrl || context.source),
      text: context.riskCode || context.filterCode || context.source || "Няма подаден risk/filter код.",
    },
  ];
}

function safeActions(documentSummary, context) {
  const openUrl = asText(context.openUrl || "");
  const actions = [];
  if (openUrl && /^\//.test(openUrl)) {
    actions.push({ label: "Отвори документа", url: openUrl, tone: "primary", note: "Връща към оригиналната document card навигация." });
  }
  actions.push({ label: "Към Stock Control Center", url: "/stock-control-center", tone: "neutral", note: "Назад към risk panels и operational filters." });
  actions.push({ label: "Към складови корекции", url: "/stock-adjustments", tone: "safe", note: "Безопасен correction/adjustment поток; не редактира journal директно." });
  actions.push({ label: "Към stock hardening audit", url: "/stock-hardening", tone: "neutral", note: "Диагностика и audit resolution view от Step 4.7.4." });
  if (documentSummary.id) {
    actions.push({ label: "API inspector JSON", url: `/api/stock-control-center/inspect?documentId=${encodeURIComponent(documentSummary.id)}&documentType=${encodeURIComponent(documentSummary.type || "stock")}`, tone: "muted", note: "Read-only JSON trace за QA." });
  }
  return actions;
}

export async function getStockControlDetailInspector(input = {}) {
  const context = {
    documentId: asText(input.documentId || input.docId || input.id || ""),
    documentNumber: asText(input.documentNumber || input.docNumber || input.number || ""),
    documentType: asText(input.documentType || input.docType || input.type || "stock"),
    movementId: asText(input.movementId || input.stockMovementId || ""),
    riskCode: asText(input.riskCode || input.risk || ""),
    filterCode: asText(input.filterCode || input.filter || ""),
    source: asText(input.source || ""),
    openUrl: asText(input.openUrl || ""),
  };

  const warnings = [];
  let documentResult = null;
  let movementResults = [];

  try {
    const docCandidates = documentModelCandidates(context.documentType);
    const movementCandidates = movementModelCandidates();
    const docFieldNames = ["id", "uuid", "documentId", "documentNumber", "docNumber", "number", "code", "reference"];
    const movementFieldNames = ["id", "uuid", "movementId", "stockMovementId", "documentId", "sourceDocumentId", "documentNumber", "docNumber", "sourceDocumentNumber", "reference"];

    documentResult = await findFirstRecord(docCandidates, docFieldNames, context.documentId || context.documentNumber);
    if (!documentResult && context.documentNumber) documentResult = await findFirstRecord(docCandidates, docFieldNames, context.documentNumber);

    if (context.movementId) {
      movementResults = await findManyRecords(movementCandidates, movementFieldNames, context.movementId);
    }
    if (movementResults.length === 0 && (context.documentId || context.documentNumber)) {
      movementResults = await findManyRecords(movementCandidates, movementFieldNames, context.documentId || context.documentNumber);
    }
  } catch (error) {
    warnings.push(`Inspector read warning: ${error.message}`);
  }

  const documentSummary = summarizeDocument(documentResult, context);
  const movements = movementResults.map(summarizeMovement);
  const reversal = analyzeReversal(documentSummary, movements);
  const operatorChecklist = checklist(documentSummary, movements, context);
  const actions = safeActions(documentSummary, context);

  return {
    stepLabel: STEP_LABEL,
    generatedAt: new Date().toISOString(),
    context,
    document: documentSummary,
    movements,
    reversal,
    checklist: operatorChecklist,
    actions,
    warnings,
    monetaLogic: [
      "browse/filter/risk -> document card/detail inspector",
      "posted document remains locked",
      "stock movement journal is read-only",
      "correction/reversal goes through a separate document",
      "operator sees trace/checklist before safe action",
    ],
  };
}
