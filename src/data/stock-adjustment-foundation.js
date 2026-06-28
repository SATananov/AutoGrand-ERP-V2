// AutoGrand ERP V2 — Step 4.8 Stock Correction / Adjustment Document Foundation
// Marker: AG_STEP_4_8_STOCK_ADJUSTMENT_FOUNDATION_DATA

export const STEP_4_8_STOCK_ADJUSTMENT_HEALTH_LABEL = "4-8-stock-correction-adjustment-foundation";

export const STOCK_ADJUSTMENT_DOCUMENT_TYPES = [
  {
    code: "STOCK_CORRECTION_IN",
    label: "Корекция плюс",
    direction: "IN",
    sign: 1,
    documentPrefix: "SCI",
    purpose: "Увеличава наличност при доказана липса в журнала или начална корекция."
  },
  {
    code: "STOCK_CORRECTION_OUT",
    label: "Корекция минус",
    direction: "OUT",
    sign: -1,
    documentPrefix: "SCO",
    purpose: "Намалява наличност при инвентаризационна разлика, брак или грешно завишаване."
  },
  {
    code: "STOCK_REVERSAL",
    label: "Обратен складов запис",
    direction: "REVERSAL",
    sign: 0,
    documentPrefix: "SRV",
    purpose: "Не трие старо движение, а създава равен обратен ефект срещу грешен/дублиран запис."
  },
  {
    code: "OPENING_BALANCE",
    label: "Начална наличност",
    direction: "IN",
    sign: 1,
    documentPrefix: "SOB",
    purpose: "Контролирано въвеждане на начални количества при старт на обект/склад."
  }
];

export const STOCK_ADJUSTMENT_REASON_CODES = [
  {
    code: "NEGATIVE_BALANCE_FIX",
    label: "Корекция на отрицателна наличност",
    preferredDocumentType: "STOCK_CORRECTION_IN",
    requiresSourceIssue: true
  },
  {
    code: "DUPLICATE_MOVEMENT_REVERSAL",
    label: "Обратен запис срещу дублирано движение",
    preferredDocumentType: "STOCK_REVERSAL",
    requiresSourceIssue: true
  },
  {
    code: "PHYSICAL_INVENTORY_DIFFERENCE",
    label: "Инвентаризационна разлика",
    preferredDocumentType: "STOCK_CORRECTION_IN",
    requiresSourceIssue: false
  },
  {
    code: "DAMAGED_OR_SCRAPPED_GOODS",
    label: "Брак / повредена стока",
    preferredDocumentType: "STOCK_CORRECTION_OUT",
    requiresSourceIssue: false
  },
  {
    code: "OPENING_BALANCE_IMPORT",
    label: "Начална наличност",
    preferredDocumentType: "OPENING_BALANCE",
    requiresSourceIssue: false
  },
  {
    code: "MANUAL_STOCK_REVIEW",
    label: "Ръчна складова проверка",
    preferredDocumentType: "STOCK_CORRECTION_IN",
    requiresSourceIssue: false
  }
];

export const STOCK_ADJUSTMENT_STATUS_FLOW = [
  { code: "DRAFT", label: "Чернова", locksStock: false },
  { code: "READY", label: "Готов за осчетоводяване", locksStock: false },
  { code: "POSTED", label: "Осчетоводен", locksStock: true },
  { code: "VOID", label: "Анулиран", locksStock: true }
];

export const STOCK_ADJUSTMENT_MONETA_RULES = [
  "Корекцията е отделен документ, не ръчна промяна в складовия журнал.",
  "Публикуваната корекция създава ново складово движение; старото движение не се изтрива тихо.",
  "Всеки ред трябва да има артикул, обект/локация, количество, причина и посока.",
  "Обратен запис срещу дублаж трябва да е равен по количество и обратен по знак.",
  "При отрицателна наличност предложената корекция е входящ ред само за липсващото количество.",
  "Публикуването трябва да е еднократно и заключва документа."
];

export function getAdjustmentTypeByCode(code) {
  return STOCK_ADJUSTMENT_DOCUMENT_TYPES.find((entry) => entry.code === code) || null;
}

export function getReasonByCode(code) {
  return STOCK_ADJUSTMENT_REASON_CODES.find((entry) => entry.code === code) || null;
}
