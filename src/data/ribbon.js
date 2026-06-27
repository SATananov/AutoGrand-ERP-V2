export const RIBBON_GROUPS = [
  {
    id: 'print-view',
    title: 'Печат и преглед',
    buttons: [
      { command: 'print', label: 'Печат', icon: '🖨️', hint: 'Печат на текущия екран или документ' },
      { command: 'preview', label: 'Преглед', icon: '👁️', hint: 'Визуален преглед преди печат' }
    ]
  },
  {
    id: 'clipboard',
    title: 'Клипборд',
    buttons: [
      { command: 'copy', label: 'Копирай', icon: '📑', hint: 'Копиране на избран запис или стойност' },
      { command: 'paste', label: 'Постави', icon: '📋', hint: 'Поставяне на стойност или ред' },
      { command: 'cut', label: 'Изрежи', icon: '✂️', hint: 'Изрязване на избраната стойност' },
      { command: 'snapshot', label: 'Снимка', icon: '📸', hint: 'Снимка на екрана: копиране, запис на Desktop и споделяне' }
    ]
  },
  {
    id: 'document',
    title: 'Документ',
    buttons: [
      { command: 'new', label: 'Нов', icon: '➕', hint: 'Създаване на нов запис или документ' },
      { command: 'save', label: 'Запази', icon: '💾', hint: 'Запазване на промените' },
      { command: 'cancel', label: 'Отказ', icon: '↩️', hint: 'Отказ от текущото действие' }
    ]
  },
  {
    id: 'record',
    title: 'Запис',
    buttons: [
      { command: 'delete', label: 'Изтрий', icon: '🗑️', hint: 'Изтриване на избран запис' },
      { command: 'recalculate', label: 'Пресметни', icon: '🧮', hint: 'Преизчисляване на текущия документ или списък' }
    ]
  },
  {
    id: 'browse',
    title: 'Списък и изглед',
    buttons: [
      { command: 'filter-field', label: 'Филтър', icon: '▾', hint: 'Филтриране по избрано поле' },
      { command: 'show-all', label: 'Всички', icon: '☷', hint: 'Показване на всички записи' },
      { command: 'sort', label: 'Сортирай', icon: '↕', hint: 'Сортиране на списъка' },
      { command: 'refresh', label: 'Опресни', icon: '🔄', hint: 'Опресняване на текущия екран' }
    ]
  },
  {
    id: 'transfer',
    title: 'Обмен',
    buttons: [
      { command: 'export', label: 'Експорт', icon: '📤', hint: 'Експорт на данни' },
      { command: 'import', label: 'Импорт', icon: '📥', hint: 'Импорт на данни' }
    ]
  },
  {
    id: 'navigation',
    title: 'Навигация',
    buttons: [
      { command: 'first', label: 'Първи', icon: '⏮', hint: 'Преминаване към първи запис' },
      { command: 'previous', label: 'Предишен', icon: '◀', hint: 'Преминаване към предишен запис' },
      { command: 'next', label: 'Следващ', icon: '▶', hint: 'Преминаване към следващ запис' },
      { command: 'last', label: 'Последен', icon: '⏭', hint: 'Преминаване към последен запис' }
    ]
  }
];
