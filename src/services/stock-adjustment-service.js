// AutoGrand ERP V2 — Step 4.8 Stock Correction / Adjustment Document Foundation
// Marker: AG_STEP_4_8_STOCK_ADJUSTMENT_FOUNDATION_SERVICE
// Purpose: safe Moneta-like correction document foundation over the Step 4.7 stock audit ledger.

import {
  STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
  STOCK_ADJUSTMENT_DOCUMENT_TYPES,
  STOCK_ADJUSTMENT_REASON_CODES,
  STOCK_ADJUSTMENT_STATUS_FLOW,
  STOCK_ADJUSTMENT_MONETA_RULES,
  getAdjustmentTypeByCode,
  getReasonByCode
} from "../data/stock-adjustment-foundation.js";
import {
  getStockAuditResolution,
  resolveStockMovementContract,
  getPrismaClient
} from "./stock-engine-hardening-service.js";

const DEFAULT_PREVIEW_LIMIT = 24;
const EPSILON = 0.000001;

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "object" && typeof value.toNumber === "function") return value.toNumber();
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundQuantity(value) {
  return Number(numberValue(value).toFixed(6));
}

function nowIso() {
  return new Date().toISOString();
}

function buildDocumentNumber(prefix = "SAD") {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${prefix}-${stamp}`;
}

function inferSignedQuantity(documentType, quantity, explicitSign = null) {
  const type = getAdjustmentTypeByCode(documentType);
  const absolute = Math.abs(numberValue(quantity));
  if (explicitSign === 1 || explicitSign === -1) return roundQuantity(absolute * explicitSign);
  if (!type) return 0;
  if (type.code === "STOCK_REVERSAL") return 0;
  return roundQuantity(absolute * numberValue(type.sign));
}

function normalizeLine(line = {}, index = 0, documentType = "STOCK_CORRECTION_IN") {
  const quantity = Math.abs(numberValue(line.quantity ?? line.shortageQuantity ?? line.signedQuantity));
  const signedQuantity = line.signedQuantity !== undefined && documentType === "STOCK_REVERSAL"
    ? roundQuantity(line.signedQuantity)
    : inferSignedQuantity(documentType, quantity, line.sign);

  return {
    lineNo: numberValue(line.lineNo) || index + 1,
    itemId: line.itemId ?? null,
    locationId: line.locationId ?? null,
    quantity: roundQuantity(quantity),
    signedQuantity,
    reasonCode: safeString(line.reasonCode || "MANUAL_STOCK_REVIEW"),
    sourceDocumentId: line.sourceDocumentId ?? line.documentId ?? null,
    sourceLineId: line.sourceLineId ?? line.lineId ?? null,
    sourceMovementId: line.sourceMovementId ?? line.movementId ?? null,
    note: safeString(line.note || line.suggestedAction || "")
  };
}

function buildDraftHeader(payload = {}) {
  const reason = getReasonByCode(payload.reasonCode) || getReasonByCode("MANUAL_STOCK_REVIEW");
  const documentType = payload.documentType || reason?.preferredDocumentType || "STOCK_CORRECTION_IN";
  const type = getAdjustmentTypeByCode(documentType) || getAdjustmentTypeByCode("STOCK_CORRECTION_IN");

  return {
    kind: "STOCK_ADJUSTMENT_DOCUMENT",
    step: "4.8",
    healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
    status: "DRAFT",
    documentType: type.code,
    documentTypeLabel: type.label,
    direction: type.direction,
    number: payload.number || buildDocumentNumber(type.documentPrefix),
    date: payload.date || nowIso().slice(0, 10),
    reasonCode: reason?.code || "MANUAL_STOCK_REVIEW",
    reasonLabel: reason?.label || "Ръчна складова проверка",
    sourceAuditIssue: payload.sourceAuditIssue || null,
    createdAt: nowIso(),
    operatorNote: safeString(payload.operatorNote || payload.note || "")
  };
}

export function validateStockAdjustmentDraft(payload = {}) {
  const errors = [];
  const warnings = [];
  const header = buildDraftHeader(payload);
  const type = getAdjustmentTypeByCode(header.documentType);
  const reason = getReasonByCode(header.reasonCode);
  const rawLines = Array.isArray(payload.lines) ? payload.lines : [];
  const lines = rawLines.map((line, index) => normalizeLine(line, index, header.documentType));

  if (!type) errors.push("Невалиден тип складова корекция.");
  if (!reason) errors.push("Невалидна причина за складова корекция.");
  if (lines.length === 0) errors.push("Документът трябва да има поне един ред.");

  lines.forEach((line) => {
    if (!safeString(line.itemId)) errors.push(`Ред ${line.lineNo}: липсва артикул.`);
    if (!safeString(line.locationId)) errors.push(`Ред ${line.lineNo}: липсва обект/локация.`);
    if (Math.abs(numberValue(line.quantity)) <= EPSILON) errors.push(`Ред ${line.lineNo}: количеството трябва да е по-голямо от 0.`);
    if (header.documentType !== "STOCK_REVERSAL" && Math.abs(numberValue(line.signedQuantity)) <= EPSILON) {
      errors.push(`Ред ${line.lineNo}: складовият ефект не може да е 0.`);
    }
    if (header.documentType === "STOCK_REVERSAL" && Math.abs(numberValue(line.signedQuantity)) <= EPSILON) {
      warnings.push(`Ред ${line.lineNo}: за обратен запис трябва да се зададе обратен signedQuantity при реално осчетоводяване.`);
    }
    if (!getReasonByCode(line.reasonCode)) warnings.push(`Ред ${line.lineNo}: причината не е от стандартния списък.`);
  });

  const totalSignedQuantity = roundQuantity(lines.reduce((sum, line) => sum + numberValue(line.signedQuantity), 0));

  return {
    ok: errors.length === 0,
    step: "4.8",
    healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
    header,
    lines,
    totals: {
      lineCount: lines.length,
      totalSignedQuantity
    },
    errors,
    warnings,
    monetaRules: STOCK_ADJUSTMENT_MONETA_RULES
  };
}

export function previewStockAdjustmentDocument(payload = {}) {
  const validation = validateStockAdjustmentDraft(payload);
  return {
    ...validation,
    document: {
      ...validation.header,
      lines: validation.lines,
      totals: validation.totals,
      postingPolicy: {
        affectsStockOnlyWhenPosted: true,
        reversalInsteadOfDelete: true,
        singlePostingRequired: true,
        blocksSilentNegativeStock: true
      }
    }
  };
}

function buildNegativeBalanceDraft(issue) {
  const quantity = Math.abs(numberValue(issue.shortageQuantity || issue.onHand));
  return previewStockAdjustmentDocument({
    documentType: "STOCK_CORRECTION_IN",
    reasonCode: "NEGATIVE_BALANCE_FIX",
    sourceAuditIssue: {
      issueType: "NEGATIVE_BALANCE",
      itemId: issue.itemId,
      locationId: issue.locationId,
      onHand: issue.onHand
    },
    operatorNote: "Автоматично предложение от Step 4.7 audit: изчистване на отрицателна наличност чрез входяща корекция.",
    lines: [{
      itemId: issue.itemId,
      locationId: issue.locationId,
      quantity,
      reasonCode: "NEGATIVE_BALANCE_FIX",
      note: "Корекция само за липсващото количество. Проверка на причината преди осчетоводяване."
    }]
  }).document;
}

function buildDuplicateMovementDraft(issue) {
  const signedQuantity = roundQuantity(numberValue(issue.signedQuantity) * -1);
  return previewStockAdjustmentDocument({
    documentType: "STOCK_REVERSAL",
    reasonCode: "DUPLICATE_MOVEMENT_REVERSAL",
    sourceAuditIssue: {
      issueType: "DUPLICATE_MOVEMENT",
      signature: issue.signature,
      documentId: issue.documentId,
      lineId: issue.lineId
    },
    operatorNote: "Автоматично предложение от Step 4.7 audit: обратен запис срещу потенциално дублирано движение.",
    lines: [{
      itemId: issue.itemId,
      locationId: issue.locationId,
      quantity: Math.abs(signedQuantity),
      signedQuantity,
      reasonCode: "DUPLICATE_MOVEMENT_REVERSAL",
      sourceDocumentId: issue.documentId,
      sourceLineId: issue.lineId,
      note: "Преди осчетоводяване потвърди, че дублажът е реален, а не коректни две отделни операции."
    }]
  }).document;
}

function buildSuggestedDrafts(resolution, limit = DEFAULT_PREVIEW_LIMIT) {
  const drafts = [];
  const negativeIssues = Array.isArray(resolution?.negativeBalanceDetails) ? resolution.negativeBalanceDetails : [];
  const duplicateIssues = Array.isArray(resolution?.duplicateMovementDetails) ? resolution.duplicateMovementDetails : [];

  for (const issue of negativeIssues) {
    if (drafts.length >= limit) break;
    drafts.push({
      issueType: "NEGATIVE_BALANCE",
      issueLabel: "Отрицателна наличност",
      priority: "HIGH",
      draft: buildNegativeBalanceDraft(issue)
    });
  }

  for (const issue of duplicateIssues) {
    if (drafts.length >= limit) break;
    drafts.push({
      issueType: "DUPLICATE_MOVEMENT",
      issueLabel: "Дублиран складов ефект",
      priority: "REVIEW",
      draft: buildDuplicateMovementDraft(issue)
    });
  }

  return drafts;
}

async function inspectStorageCompatibility() {
  try {
    const prisma = await getPrismaClient();
    const movementContract = await resolveStockMovementContract(prisma);
    const delegateKeys = Object.keys(prisma || {}).filter((key) => prisma[key] && typeof prisma[key].findMany === "function");
    const adjustmentDelegates = delegateKeys.filter((key) => {
      const lower = key.toLowerCase();
      return (lower.includes("adjust") || lower.includes("correction") || lower.includes("inventory")) && lower.includes("document");
    });

    return {
      ok: true,
      movementDelegate: movementContract.delegateName,
      movementFieldMap: movementContract.fieldMap,
      adjustmentDelegates,
      canPersistAdjustmentDocuments: adjustmentDelegates.length > 0,
      note: adjustmentDelegates.length > 0
        ? "Открит е потенциален Prisma модел за складови корекции; следваща стъпка може да върже реално записване."
        : "Няма отделен Prisma модел за складови корекции. Step 4.8 оставя безопасна preview/foundation зона без риск за журнала."
    };
  } catch (error) {
    return {
      ok: false,
      movementDelegate: null,
      movementFieldMap: {},
      adjustmentDelegates: [],
      canPersistAdjustmentDocuments: false,
      note: error?.message || "Prisma introspection failed."
    };
  }
}

export async function getStockAdjustmentFoundation(options = {}) {
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : DEFAULT_PREVIEW_LIMIT;
  let resolution = null;
  let resolutionError = null;

  try {
    resolution = await getStockAuditResolution({ limit: 50000 });
  } catch (error) {
    resolutionError = error?.message || "Cannot read Step 4.7 stock audit resolution.";
    resolution = {
      ok: false,
      summary: { movementCount: 0, balanceCount: 0, negativeBalanceCount: 0, duplicateMovementCount: 0 },
      resolutionSummary: { negativeIssueCount: 0, duplicateIssueCount: 0, blockingIssueCount: 0 },
      negativeBalanceDetails: [],
      duplicateMovementDetails: [],
      resolutionPlan: []
    };
  }

  const storage = await inspectStorageCompatibility();
  const suggestedDrafts = buildSuggestedDrafts(resolution, limit);

  return {
    ok: true,
    step: "4.8",
    healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
    pageTitle: "Складови корекции",
    documentTypes: STOCK_ADJUSTMENT_DOCUMENT_TYPES,
    reasonCodes: STOCK_ADJUSTMENT_REASON_CODES,
    statusFlow: STOCK_ADJUSTMENT_STATUS_FLOW,
    monetaRules: STOCK_ADJUSTMENT_MONETA_RULES,
    storage,
    resolutionError,
    auditSummary: resolution.summary || {},
    resolutionSummary: resolution.resolutionSummary || {},
    suggestedDrafts,
    endpoints: {
      page: "/stock-adjustments",
      foundation: "/api/stock/adjustments/foundation",
      preview: "/api/stock/adjustments/preview",
      fromIssue: "/api/stock/adjustments/from-issue",
      stockAudit: "/stock-hardening"
    },
    nextStep: "Step 4.8.1 може да добави реална Prisma таблица и еднократно осчетоводяване на корекциите."
  };
}

export function buildStockAdjustmentDraftFromIssue(payload = {}) {
  const issueType = safeString(payload.issueType || payload.sourceIssueType).toUpperCase();
  if (issueType === "NEGATIVE_BALANCE") {
    return {
      ok: true,
      step: "4.8",
      healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
      draft: buildNegativeBalanceDraft(payload)
    };
  }

  if (issueType === "DUPLICATE_MOVEMENT") {
    return {
      ok: true,
      step: "4.8",
      healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
      draft: buildDuplicateMovementDraft(payload)
    };
  }

  return {
    ok: false,
    step: "4.8",
    healthLabel: STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL,
    errors: ["Непознат тип audit issue. Поддържа се NEGATIVE_BALANCE или DUPLICATE_MOVEMENT."]
  };
}
