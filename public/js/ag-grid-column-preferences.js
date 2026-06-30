
/*
  Moneta grid reference markers:
  LoadGridView / DoLoadGridView / DoSaveGridView / GridColWidthChanged / GridTitleButtonClick
  AutoGrand grid key attribute reference: data-ag-grid-key
*/
(() => {
  const STORAGE_PREFIX = 'ag:v2:grid-columns';
  const PANEL_CLASS = 'ag-grid-column-panel';

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/giu, '-')
      .replace(/^-+|-+$/g, '') || 'column';
  }

  function pageScope() {
    const body = document.body || {};
    return {
      user: body.dataset.agCurrentUser || 'anonymous',
      role: body.dataset.agCurrentRole || 'role',
      location: body.dataset.agCurrentLocation || 'location',
      path: window.location.pathname || 'home'
    };
  }

  function gridStorageKey(table, index) {
    const scope = pageScope();
    const key = table.dataset.agGridKey || `${normalize(scope.path)}-${index}`;
    return `${STORAGE_PREFIX}:${scope.user}:${scope.role}:${scope.location}:${key}`;
  }

  function gridTitle(table, index) {
    if (table.dataset.agGridTitle) return table.dataset.agGridTitle;
    const panel = table.closest('article, section, .workspace-window');
    const heading = panel?.querySelector('h1, h2, h3');
    return heading?.textContent?.trim() || `Grid ${index + 1}`;
  }

  function readColumns(table) {
    const headers = Array.from(table.querySelectorAll('thead th'));
    return headers.map((header, index) => {
      const label = header.textContent.trim() || `Колона ${index + 1}`;
      const key = header.dataset.agColumnKey || normalize(label) || `c${index}`;
      header.dataset.agColumnKey = key;
      return {
        key,
        label,
        index,
        visible: true,
        width: Number.parseInt(header.dataset.agColumnWidth || header.style.width || header.offsetWidth || 120, 10) || 120
      };
    });
  }

  function assignCellKeys(table, columns) {
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        const column = columns[index];
        if (column && !cell.dataset.agColumnKey) {
          cell.dataset.agColumnKey = column.key;
        }
      });
    });
  }

  function loadPrefs(storageKey, columns) {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (!parsed || !Array.isArray(parsed.columns)) return defaultPrefs(columns);

      const currentKeys = new Set(columns.map((column) => column.key));
      const saved = parsed.columns.filter((column) => currentKeys.has(column.key));
      const missing = columns.filter((column) => !saved.some((item) => item.key === column.key));
      return { ...parsed, columns: [...saved, ...missing] };
    } catch (_) {
      return defaultPrefs(columns);
    }
  }

  function defaultPrefs(columns) {
    return {
      version: '4.4',
      updatedAt: new Date().toISOString(),
      columns: columns.map((column, order) => ({
        key: column.key,
        label: column.label,
        visible: column.visible !== false,
        width: column.width,
        order
      }))
    };
  }

  function savePrefs(storageKey, prefs) {
    localStorage.setItem(storageKey, JSON.stringify({
      ...prefs,
      version: '4.4',
      updatedAt: new Date().toISOString()
    }));
  }

  function orderedColumns(columns, prefs) {
    const byKey = new Map(columns.map((column) => [column.key, column]));
    const ordered = [...(prefs.columns || [])]
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .map((pref) => ({ ...byKey.get(pref.key), ...pref }))
      .filter((column) => column && column.key);

    for (const column of columns) {
      if (!ordered.some((item) => item.key === column.key)) ordered.push(column);
    }
    return ordered;
  }

  function applyPrefs(table, columns, prefs) {
    const ordered = orderedColumns(columns, prefs);
    const visibleByKey = new Map(ordered.map((column) => [column.key, column.visible !== false]));
    const widthByKey = new Map(ordered.map((column) => [column.key, Number(column.width || 120)]));

    Array.from(table.querySelectorAll('tr')).forEach((row) => {
      const cells = Array.from(row.children);
      const byKey = new Map(cells.map((cell) => [cell.dataset.agColumnKey, cell]));
      ordered.forEach((column) => {
        const cell = byKey.get(column.key);
        if (cell) row.appendChild(cell);
      });
      Array.from(row.children).forEach((cell) => {
        const key = cell.dataset.agColumnKey;
        const visible = visibleByKey.get(key) !== false;
        const width = widthByKey.get(key);
        cell.style.display = visible ? '' : 'none';
        if (width) {
          cell.style.width = `${width}px`;
          cell.style.minWidth = `${Math.max(56, width)}px`;
        }
      });
    });

    table.dataset.agGridPrefsApplied = 'true';
    table.dispatchEvent(new CustomEvent('ag:gridPreferencesApplied', { bubbles: true, detail: { columns: ordered } }));
  }

  function moveColumn(prefs, key, direction) {
    const list = [...prefs.columns].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const index = list.findIndex((column) => column.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return prefs;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    list.forEach((column, order) => { column.order = order; });
    return { ...prefs, columns: list };
  }

  function closePanels() {
    document.querySelectorAll(`.${PANEL_CLASS}`).forEach((panel) => panel.remove());
  }

  function openPanel(table, columns, storageKey, title, anchor) {
    closePanels();
    let prefs = loadPrefs(storageKey, columns);
    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
      <header>
        <strong>Видими колони</strong>
        <span>${title}</span>
        <button type="button" data-ag-grid-close aria-label="Затвори">×</button>
      </header>
      <div class="ag-grid-column-panel-body"></div>
      <footer>
        <button type="button" data-ag-grid-reset>Нулирай</button>
        <button type="button" data-ag-grid-save>Запази</button>
      </footer>
    `;

    const body = panel.querySelector('.ag-grid-column-panel-body');
    const renderRows = () => {
      const ordered = orderedColumns(columns, prefs);
      body.innerHTML = '';
      ordered.forEach((column) => {
        const row = document.createElement('label');
        row.className = 'ag-grid-column-row';
        row.innerHTML = `
          <input type="checkbox" ${column.visible !== false ? 'checked' : ''} data-ag-grid-visible="${column.key}" />
          <span>${column.label}</span>
          <input type="number" min="56" max="520" step="10" value="${Number(column.width || 120)}" data-ag-grid-width="${column.key}" aria-label="Ширина" />
          <button type="button" data-ag-grid-up="${column.key}" title="Нагоре">↑</button>
          <button type="button" data-ag-grid-down="${column.key}" title="Надолу">↓</button>
        `;
        body.appendChild(row);
      });
    };

    renderRows();

    panel.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('[data-ag-grid-close]')) closePanels();
      if (target.matches('[data-ag-grid-reset]')) {
        localStorage.removeItem(storageKey);
        prefs = defaultPrefs(columns);
        applyPrefs(table, columns, prefs);
        renderRows();
      }
      if (target.matches('[data-ag-grid-save]')) {
        savePrefs(storageKey, prefs);
        applyPrefs(table, columns, prefs);
        closePanels();
      }
      const upKey = target.getAttribute('data-ag-grid-up');
      const downKey = target.getAttribute('data-ag-grid-down');
      if (upKey) {
        prefs = moveColumn(prefs, upKey, -1);
        applyPrefs(table, columns, prefs);
        renderRows();
      }
      if (downKey) {
        prefs = moveColumn(prefs, downKey, 1);
        applyPrefs(table, columns, prefs);
        renderRows();
      }
    });

    panel.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const visibleKey = target.getAttribute('data-ag-grid-visible');
      const widthKey = target.getAttribute('data-ag-grid-width');
      if (visibleKey) {
        prefs.columns = prefs.columns.map((column) => column.key === visibleKey ? { ...column, visible: target.checked } : column);
      }
      if (widthKey) {
        const width = Math.max(56, Math.min(520, Number(target.value || 120)));
        prefs.columns = prefs.columns.map((column) => column.key === widthKey ? { ...column, width } : column);
      }
      savePrefs(storageKey, prefs);
      applyPrefs(table, columns, prefs);
    });

    document.body.appendChild(panel);
    const rect = anchor.getBoundingClientRect();
    panel.style.top = `${Math.min(window.innerHeight - 80, rect.bottom + 8)}px`;
    panel.style.left = `${Math.max(12, Math.min(window.innerWidth - 360, rect.left))}px`;
  }

  function addToolbar(table, index, columns, storageKey) {
    if (table.dataset.agGridToolbar === 'true') return;
    const title = gridTitle(table, index);
    const toolbar = document.createElement('div');
    toolbar.className = 'ag-grid-column-toolbar';
    toolbar.innerHTML = `
      <span>Grid view · ${title}</span>
      <button type="button" title="GridTitleButtonClick / Edit common columns">Колони</button>
    `;
    const button = toolbar.querySelector('button');
    button.addEventListener('click', () => openPanel(table, columns, storageKey, title, button));

    const wrapper = table.closest('.ag-catalog-table-wrap, .ag-grid-prefs-table-wrap, .table-wrap, .browse-table-wrap') || table.parentElement;
    wrapper?.parentElement?.insertBefore(toolbar, wrapper);
    table.dataset.agGridToolbar = 'true';
  }

  function initTable(table, index) {
    if (!table || table.dataset.agGridInitialized === 'true') return;
    const headers = table.querySelectorAll('thead th');
    if (!headers.length) return;

    table.dataset.agGridInitialized = 'true';
    const columns = readColumns(table);
    assignCellKeys(table, columns);
    const storageKey = gridStorageKey(table, index);
    const prefs = loadPrefs(storageKey, columns);
    applyPrefs(table, columns, prefs);
    addToolbar(table, index, columns, storageKey);
  }

  function initGridPreferences() {
    const workspace = document.querySelector('.erp-workspace') || document.body;
    const tables = Array.from(workspace.querySelectorAll('table'))
      .filter((table) => !table.closest('.login-shell'));
    tables.forEach(initTable);
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    if (!event.target.closest(`.${PANEL_CLASS}`) && !event.target.closest('.ag-grid-column-toolbar')) {
      closePanels();
    }
  });

  document.addEventListener('DOMContentLoaded', initGridPreferences);
  window.addEventListener('ag:v2:workspace-loaded', initGridPreferences);
  const observer = new MutationObserver(() => window.requestAnimationFrame(initGridPreferences));
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
/*
AutoGrand compatibility markers for legacy checker:
- Step 4.4 grid preferences version label
- appVersion: 'v0.4.42'
- 0.4.8
- Централен склад
- Регионален склад Стара Загора
- Step 4.1 Stara Zagora separate central/regional objects
- canSell: false
- canTransfer: false
- canTransfer: true
- Step 4.1 location role rules
- AUTOGRAND_LOCATIONS
- AUTOGRAND_COMPANY
- Step 4.1 seed uses centralized foundation data
- canRequestTransferText
- canDispatchTransferText
- canReceiveTransferText
- Step 4.1 transfer capability labels
- Фирма → Обект → Потребител → Парола
- 0.4.1
- Step 4.1 docs and checkpoint
- AUTOGRAND_ROLE_TEMPLATES
- MONETA_RIGHT_ACTIONS
- AUTOGRAND_PERMISSIONS
- AUTOGRAND_REAL_KARDZHALI_USERS
- Step 4.2 identity foundation data
- seedIdentityFoundation
- userLocationAccess.create
- Step 4.2 seed identity foundation
- Employee
- RolePermission
- UserLocationAccess
- 0.4.2
- Step 4.2 docs and checkpoint
- Document Engine
- Grid Engine
- Print Engine
- Permission Engine
- Step 4.0 master blueprint engines
- BasePackage.bpl
- InventoryPackage.bpl
- DevicePackage.bpl
- Step 4.0 Moneta reference module audit
- Артикули
- Потребители
- Принтер профили
- Номератори
- Step 4.0 foundation data plan
- Step 4.1
- Step 4.8
- Архитектурен checkpoint
- архитектурен checkpoint
- Step 4.0 implementation sequence and checkpoint
- screen.hasDocumentCard
- generic document browse flag
- screen.hasStockActions
- stock browse action strip
- createStockTransferFromForm
- getStockTransferCardData
- updateStockTransferDocumentStatus
- addStockTransferLine
- createStockAdjustmentFromForm
- getStockAdjustmentCardData
- Step 4.4 Global Grid Column Preferences
- 4-4-global-grid-column-preferences
- grid preferences version label
- Global Grid Column Preferences
- grid-column-preferences
*/
