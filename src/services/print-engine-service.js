import {
  MONETA_PRINT_ENGINE_CONCEPTS,
  PRINT_ENGINE_AUDIT_EVENTS,
  PRINT_ENGINE_CHANNELS,
  PRINT_ENGINE_DEVICE_PROFILES,
  PRINT_ENGINE_DOCUMENT_FORMS,
  PRINT_ENGINE_HOOKS,
  PRINT_ENGINE_TEMPLATE_SECTIONS
} from '../data/autogrand-print-engine-foundation.js';

export const STEP_4_6_PRINT_ENGINE_HEALTH_LABEL = '4-6-global-print-engine';

function byCode(list = []) {
  return Object.fromEntries(list.map((entry) => [entry.code, entry]));
}

function buildFormsByDocumentType() {
  return PRINT_ENGINE_DOCUMENT_FORMS.reduce((acc, form) => {
    if (!acc[form.documentType]) acc[form.documentType] = [];
    acc[form.documentType].push(form);
    return acc;
  }, {});
}

function buildChannelMatrix() {
  const channelByCode = byCode(PRINT_ENGINE_CHANNELS);
  return PRINT_ENGINE_DOCUMENT_FORMS.map((form) => ({
    code: form.code,
    label: form.label,
    documentType: form.documentType,
    permission: form.permission,
    defaultChannel: form.defaultChannel,
    channels: form.supportedChannels.map((channelCode) => channelByCode[channelCode]).filter(Boolean)
  }));
}

function buildTemplateSectionMatrix() {
  const sectionByCode = byCode(PRINT_ENGINE_TEMPLATE_SECTIONS);
  return PRINT_ENGINE_DOCUMENT_FORMS.map((form) => ({
    code: form.code,
    label: form.label,
    sections: form.templateSections.map((sectionCode) => sectionByCode[sectionCode]).filter(Boolean)
  }));
}

export function getGlobalPrintEngineData() {
  const channelMatrix = buildChannelMatrix();
  const sectionMatrix = buildTemplateSectionMatrix();

  return {
    title: 'Глобален print engine',
    healthLabel: STEP_4_6_PRINT_ENGINE_HEALTH_LABEL,
    monetaConcepts: MONETA_PRINT_ENGINE_CONCEPTS,
    channels: PRINT_ENGINE_CHANNELS,
    documentForms: PRINT_ENGINE_DOCUMENT_FORMS,
    formsByDocumentType: buildFormsByDocumentType(),
    templateSections: PRINT_ENGINE_TEMPLATE_SECTIONS,
    deviceProfiles: PRINT_ENGINE_DEVICE_PROFILES,
    hooks: PRINT_ENGINE_HOOKS,
    auditEvents: PRINT_ENGINE_AUDIT_EVENTS,
    channelMatrix,
    sectionMatrix,
    counters: {
      monetaConcepts: MONETA_PRINT_ENGINE_CONCEPTS.length,
      channels: PRINT_ENGINE_CHANNELS.length,
      documentForms: PRINT_ENGINE_DOCUMENT_FORMS.length,
      templateSections: PRINT_ENGINE_TEMPLATE_SECTIONS.length,
      deviceProfiles: PRINT_ENGINE_DEVICE_PROFILES.length,
      hooks: PRINT_ENGINE_HOOKS.length,
      auditEvents: PRINT_ENGINE_AUDIT_EVENTS.length
    }
  };
}

export function getGlobalPrintEngineDiagnostics() {
  const data = getGlobalPrintEngineData();

  return {
    ok: true,
    step: STEP_4_6_PRINT_ENGINE_HEALTH_LABEL,
    monetaAligned: true,
    noPrismaSchemaChange: true,
    counters: data.counters,
    requiredConcepts: [
      'TfBase.PrintSelect',
      'TfBase.GetPrintDocument',
      'TfBase.PrintPostedDocument',
      'TfBase.SelectPrintFormGeneral',
      'TfBase.AfterPrintDocument',
      'uBrSelectPrintForm',
      'frxExportPDF',
      'frxBarcode2D'
    ],
    documentForms: data.documentForms.map((form) => ({
      code: form.code,
      documentType: form.documentType,
      permission: form.permission,
      defaultChannel: form.defaultChannel,
      monetaPrintType: form.monetaPrintType,
      supportedChannels: form.supportedChannels
    })),
    hooks: data.hooks.map((hook) => ({
      code: hook.code,
      monetaMethod: hook.monetaMethod,
      phase: hook.phase
    }))
  };
}

export function getPrintEngineForm(code = '') {
  const normalized = String(code || '').trim().toUpperCase();
  return PRINT_ENGINE_DOCUMENT_FORMS.find((form) => form.code === normalized) || null;
}

export function getPrintEngineChannel(code = '') {
  const normalized = String(code || '').trim().toUpperCase();
  return PRINT_ENGINE_CHANNELS.find((channel) => channel.code === normalized) || null;
}
