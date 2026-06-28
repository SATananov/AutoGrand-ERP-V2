import {
  DOCUMENT_ENGINE_ACTIONS,
  DOCUMENT_ENGINE_COPY_TEMPLATES,
  DOCUMENT_ENGINE_HEADER_FIELDS,
  DOCUMENT_ENGINE_LINE_FIELDS,
  DOCUMENT_ENGINE_STATUS_FLOW,
  DOCUMENT_ENGINE_TOTALS,
  DOCUMENT_ENGINE_TYPES,
  DOCUMENT_ENGINE_VALIDATION_HOOKS,
  MONETA_DOCUMENT_ENGINE_CONCEPTS
} from '../data/autogrand-document-engine-foundation.js';

export const STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL = '4-5-global-document-engine';

function byCode(list = []) {
  return Object.fromEntries(list.map((entry) => [entry.code, entry]));
}

function permissionForTypeAction(type, action) {
  if (!type || !action) return '';
  if (action.code === 'POST') return type.postingPermission;
  if (action.code === 'PRINT') return type.printPermission;

  const module = type.module === 'purchase' ? 'purchase' : type.module === 'stock' ? 'stock' : 'sales';
  const suffixMap = {
    create: type.module === 'stock' ? 'stock.transfer.create' : `${module}.create`,
    edit: type.module === 'stock' ? 'stock.transfer.edit' : `${module}.edit`,
    cancel: type.module === 'sales' ? 'sales.cancel' : type.module === 'stock' ? 'stock.transfer.finish' : 'purchase.finish',
    finish: type.postingPermission,
    print: type.printPermission
  };

  return suffixMap[action.requiredPermissionSuffix] || `${module}.view`;
}

function buildActionMatrix() {
  return DOCUMENT_ENGINE_TYPES.map((type) => ({
    documentType: type.code,
    label: type.label,
    module: type.module,
    monetaHeader: type.monetaHeader,
    actions: DOCUMENT_ENGINE_ACTIONS.map((action) => ({
      ...action,
      requiredPermission: permissionForTypeAction(type, action),
      enabledInType: type.statusFlow.some((status) => action.allowedStatuses.includes(status))
    }))
  }));
}

function buildStatusMap() {
  const statusByCode = byCode(DOCUMENT_ENGINE_STATUS_FLOW);
  return DOCUMENT_ENGINE_TYPES.map((type) => ({
    documentType: type.code,
    statuses: type.statusFlow.map((statusCode) => statusByCode[statusCode]).filter(Boolean)
  }));
}

export function getGlobalDocumentEngineData() {
  const actionMatrix = buildActionMatrix();

  return {
    title: 'Глобален документен engine',
    healthLabel: STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL,
    monetaConcepts: MONETA_DOCUMENT_ENGINE_CONCEPTS,
    documentTypes: DOCUMENT_ENGINE_TYPES,
    headerFields: DOCUMENT_ENGINE_HEADER_FIELDS,
    lineFields: DOCUMENT_ENGINE_LINE_FIELDS,
    statuses: DOCUMENT_ENGINE_STATUS_FLOW,
    statusMap: buildStatusMap(),
    actions: DOCUMENT_ENGINE_ACTIONS,
    actionMatrix,
    copyTemplates: DOCUMENT_ENGINE_COPY_TEMPLATES,
    validationHooks: DOCUMENT_ENGINE_VALIDATION_HOOKS,
    totals: DOCUMENT_ENGINE_TOTALS,
    counters: {
      documentTypes: DOCUMENT_ENGINE_TYPES.length,
      headerFields: DOCUMENT_ENGINE_HEADER_FIELDS.length,
      lineFields: DOCUMENT_ENGINE_LINE_FIELDS.length,
      statuses: DOCUMENT_ENGINE_STATUS_FLOW.length,
      actions: DOCUMENT_ENGINE_ACTIONS.length,
      copyTemplates: DOCUMENT_ENGINE_COPY_TEMPLATES.length,
      validationHooks: DOCUMENT_ENGINE_VALIDATION_HOOKS.length,
      monetaConcepts: MONETA_DOCUMENT_ENGINE_CONCEPTS.length
    }
  };
}

export function getGlobalDocumentEngineDiagnostics() {
  const data = getGlobalDocumentEngineData();

  return {
    ok: true,
    step: STEP_4_5_DOCUMENT_ENGINE_HEALTH_LABEL,
    monetaAligned: true,
    noPrismaSchemaChange: true,
    counters: data.counters,
    requiredConcepts: [
      'TfBaseEditDocument',
      'TfBaseBrowseCardDocument',
      'PostDocument',
      'AnnulDocument',
      'S_CopyDocTemplateHeader',
      'DocStatus',
      'PostingDate',
      'DocumentNo'
    ],
    documentTypes: data.documentTypes.map((type) => ({
      code: type.code,
      monetaHeader: type.monetaHeader,
      monetaLine: type.monetaLine,
      postingPermission: type.postingPermission,
      ledgerEffects: type.ledgerEffects
    }))
  };
}

export function getDocumentEngineType(code = '') {
  const normalized = String(code || '').trim().toUpperCase();
  return DOCUMENT_ENGINE_TYPES.find((type) => type.code === normalized) || null;
}

export function getDocumentEngineStatus(code = '') {
  const normalized = String(code || '').trim().toUpperCase();
  return DOCUMENT_ENGINE_STATUS_FLOW.find((status) => status.code === normalized) || null;
}
