/*
 * AutoGrand ERP V2 Step 2.5.5 Statusbar Polish
 * Purpose: keep the bottom statusbar compact, logical and clock-aware.
 */
(function () {
  'use strict';

  const workspace = document.getElementById('ag-v2-workspace');
  const stage = document.getElementById('ag-v2-workspace-stage');
  const layer = document.getElementById('ag-v2-window-layer');
  const tabs = document.getElementById('ag-v2-workspace-tabs');
  const home = document.getElementById('ag-v2-workspace-home');
  const dock = document.getElementById('ag-v2-minimized-dock');
  const sidebar = document.getElementById('ag-v2-sidebar');
  const statusCell = document.querySelector('[data-ag-status-message]');
  const statusTextNode = document.querySelector('[data-ag-status-text]');
  const statusClockNode = document.querySelector('[data-ag-status-clock]');
  const main = document.querySelector('.erp-main');

  if (!workspace || !stage || !layer || !tabs || !home) return;

  const state = {
    z: 50,
    cascade: 0,
    moving: null,
    resizing: null,
    sidebarResize: null
  };

  const MIN_WIDTH = 540;
  const MIN_HEIGHT = 320;
  const SIDEBAR_WIDTH_KEY = 'ag_v2_sidebar_width';
  const SIDEBAR_LOCK_KEY = 'ag_v2_sidebar_locked';
  const SIDEBAR_MIN_KEY = 'ag_v2_sidebar_minimized';
  const QUICK_LINKS_KEY = 'ag_v2_quick_links';

  const KNOWN_ROUTES = new Map([
    ['Продажби||Ценова листа', '/screen/price-list'],
    ['Продажби||Авансови плащания', '/screen/advance-payments'],
    ['Продажби||Оферта', '/screen/offers'],
    ['Продажби||Поръчки от клиенти', '/screen/customer-orders'],
    ['Продажби||Продажби', '/screen/sales'],
    ['Продажби||Продажба', '/document/sales/new/SALE'],
    ['Продажби||Кредитно известие', '/screen/credit-note'],
    ['Продажби||Дебитно известие', '/screen/debit-note'],
    ['Продажби||Плащания продажби', '/screen/sales-payments'],
    ['Продажби||Продажба по поръчка', '/screen/sale-by-order'],
    ['Продажби||Свободно КИ продажба', '/screen/free-credit-note-sale'],
    ['Продажби||Свободна фактура продажби', '/screen/free-invoice-sales'],
    ['Продажби||Свободна фактура продажби (с добавяне на ред)', '/screen/free-invoice-sales'],
    ['Продажби||Гаранционни карти', '/screen/warranty-cards'],
    ['Продажби||Дневна каса', '/screen/daily-cash'],

    ['Доставки||Поръчки към доставчици', '/screen/purchase-orders'],
    ['Доставки||Плащания - доставки', '/screen/supplier-payments'],
    ['Доставки||Доставка от поръчка', '/document/purchase/new/DELIVERY'],
    ['Доставки||Свободна фактура доставка', '/screen/supplier-invoices'],
    ['Доставки||Фактури доставчици', '/screen/supplier-invoices'],
    ['Доставки||Доставки', '/screen/deliveries'],

    ['Склад||Обекти и складове', '/locations'],
    ['Склад||Обекти на фирмата', '/locations'],
    ['Склад||Складов център', '/stock/dashboard'],
    ['Склад||Наличности', '/screen/stock'],
    ['Склад||Складови движения', '/screen/stock-movements'],
    ['Склад||Складова корекция', '/stock/adjustment/new'],
    ['Склад||Нов трансфер', '/stock/transfer/new'],
    ['Склад||История трансфери', '/screen/stock-transfers'],
    ['Склад||Трансфер на стока', '/stock/transfer/new'],
    ['Склад||Складове', '/screen/warehouses'],
    ['Склад||Артикули', '/screen/items'],
    ['Склад||Журнал артикули', '/screen/stock-movements'],
    ['Склад||Журнал физ. инвентар', '/screen/stock-movements'],
    ['Склад||Параметри на артикули по обекти', '/locations'],
    ['Склад / Номенклатури||Параметри на артикули по обекти', '/locations'],
    ['Склад / Справки||Наличности по обекти', '/stock/dashboard'],
    ['Склад / Справки||Движения по артикул', '/screen/stock-movements'],

    ['Финанси и счетоводство||Парични сметки', '/screen/cash'],
    ['Финанси и счетоводство||Банкови / касови операции', '/screen/payments'],
    ['Финанси и счетоводство||Каса', '/screen/cash'],
    ['Финанси и счетоводство||Плащания', '/screen/payments'],

    ['Номенклатури / Общи||Мерки', '/screen/items'],
    ['Номенклатури / Фирмени||Обекти', '/locations'],
    ['Номенклатури / Фирмени||Складове', '/screen/warehouses'],
    ['Номенклатури||Обекти и складове', '/locations'],
    ['Номенклатури||Контрагенти', '/screen/counterparties'],
    ['Номенклатури||Артикули', '/screen/items'],
    ['Номенклатури||Групи артикули', '/screen/item-groups'],
    ['Продажби / Номенклатури||Контрагенти', '/screen/counterparties'],
    ['Доставки / Номенклатури||Контрагенти', '/screen/counterparties'],
    ['Склад / Номенклатури||Продуктови групи', '/screen/item-groups'],

    ['Сервиз и поддръжка||Сервизни поръчки', '/screen/service-orders'],
    ['Сервиз и поддръжка||Сервизни изделия', '/screen/items'],
    ['Електронна търговия||Онлайн поръчки', '/screen/web-orders'],
    ['Автомобили||Автомобили', '/screen/vehicles'],
    ['Автомобили||Автомобил (карта)', '/screen/vehicles'],
    ['Автомобили||Продажба автомобил', '/screen/sales'],
    ['Автомобили||Доставка автомобил', '/screen/deliveries'],
    ['Администриране / Потребители||Потребители', '/screen/users'],
    ['Администриране||Настройки на компания', '/screen/settings']
  ]);

  const TITLE_ROUTES = new Map([
    ['Контрагенти', '/screen/counterparties'],
    ['Артикули', '/screen/items'],
    ['Обекти и складове', '/locations'],
    ['Обекти на фирмата', '/locations'],
    ['Складов център', '/stock/dashboard'],
    ['Наличности', '/screen/stock'],
    ['Складови движения', '/screen/stock-movements'],
    ['Складова корекция', '/stock/adjustment/new'],
    ['Нов трансфер', '/stock/transfer/new'],
    ['История трансфери', '/screen/stock-transfers'],
    ['Складове', '/screen/warehouses'],
    ['Групи артикули', '/screen/item-groups'],
    ['Потребители', '/screen/users'],
    ['Настройки', '/screen/settings'],
    ['Онлайн поръчки', '/screen/web-orders'],
    ['Сервизни поръчки', '/screen/service-orders'],
    ['Автомобили', '/screen/vehicles']
  ]);

  function setStatus(message) {
    if (!message) return;
    const target = statusTextNode || statusCell;
    if (target) target.textContent = message;
  }

  function padClockPart(value) {
    return String(value).padStart(2, '0');
  }

  function formatStatusDateTime(date = new Date()) {
    const day = padClockPart(date.getDate());
    const month = padClockPart(date.getMonth() + 1);
    const year = date.getFullYear();
    const hour = padClockPart(date.getHours());
    const minute = padClockPart(date.getMinutes());
    const second = padClockPart(date.getSeconds());
    return `${day}.${month}.${year} г. ${hour}:${minute}:${second}`;
  }

  function initStatusClock() {
    if (!statusClockNode) return;
    const update = () => {
      statusClockNode.textContent = formatStatusDateTime();
    };
    update();
    window.setInterval(update, 1000);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hashText(value) {
    let hash = 0;
    const text = String(value || 'window');
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function routeFromUrl(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.delete('workspace');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  function partialUrl(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set('workspace', '1');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  function windowIdForUrl(url) {
    return `ag-v2-${hashText(routeFromUrl(url))}`;
  }

  function titleFromElement(element, fallback) {
    const explicit = element?.dataset?.agScreenTitle || element?.dataset?.moduleTitle || element?.dataset?.windowTitle;
    const text = explicit || element?.textContent || fallback || 'ERP прозорец';
    return String(text).replace(/\s+/g, ' ').trim() || 'ERP прозорец';
  }

  function allWindows() {
    return Array.from(layer.querySelectorAll('.ag-v2-window'));
  }

  function getWindow(id) {
    return layer.querySelector(`.ag-v2-window[data-window-id="${cssEscape(id)}"]`);
  }

  function getTab(id) {
    return tabs.querySelector(`.workspace-tab[data-window-id="${cssEscape(id)}"]`);
  }

  function showHome() {
    allWindows().forEach((win) => win.classList.remove('is-front-window'));
    home.classList.add('is-active');
    tabs.querySelectorAll('.workspace-tab').forEach((tab) => {
      tab.classList.toggle('is-active', tab.hasAttribute('data-workspace-home'));
    });
    workspace.classList.toggle('has-open-windows', allWindows().length > 0);
    setStatus('Отворен екран: Начало');
  }

  function syncTabs(activeId) {
    tabs.querySelectorAll('.workspace-tab').forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.windowId === activeId);
    });
    tabs.querySelector('[data-workspace-home]')?.classList.toggle('is-active', !activeId && allWindows().length === 0);
  }

  function bringToFront(win) {
    if (!win) return;

    win.classList.remove('is-minimized');
    win.hidden = false;
    state.z += 1;
    win.style.zIndex = String(state.z);

    allWindows().forEach((item) => {
      item.classList.toggle('is-front-window', item === win);
      item.classList.toggle('is-active', item === win);
    });

    dock?.querySelector(`[data-window-id="${cssEscape(win.dataset.windowId)}"]`)?.remove();
    home.classList.remove('is-active');
    syncTabs(win.dataset.windowId);
    setStatus(`Отворен прозорец: ${win.dataset.windowTitle || 'ERP прозорец'}`);
  }

  function stageSize() {
    const box = stage.getBoundingClientRect();
    return {
      width: Math.max(640, box.width),
      height: Math.max(420, box.height)
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function positionWindow(win, kind) {
    const size = stageSize();
    const index = state.cascade % 8;
    const isCard = kind === 'document-card' || kind === 'document-new';
    const baseWidth = isCard ? size.width * 0.82 : size.width * 0.76;
    const baseHeight = isCard ? size.height * 0.78 : size.height * 0.7;
    const width = clamp(baseWidth - index * 22, MIN_WIDTH, size.width - 28);
    const height = clamp(baseHeight - index * 18, MIN_HEIGHT, size.height - 28);
    const left = clamp(22 + index * 32, 8, Math.max(8, size.width - width - 8));
    const top = clamp(18 + index * 28, 8, Math.max(8, size.height - height - 8));

    win.style.left = `${Math.round(left)}px`;
    win.style.top = `${Math.round(top)}px`;
    win.style.width = `${Math.round(width)}px`;
    win.style.height = `${Math.round(height)}px`;
    state.cascade += 1;
  }

  function updateWindowTitle(win, title) {
    const cleanTitle = String(title || 'ERP прозорец').replace(/\s+/g, ' ').trim();
    win.dataset.windowTitle = cleanTitle;
    win.querySelector('[data-ag-window-title]').textContent = cleanTitle;
    const tab = getTab(win.dataset.windowId);
    if (tab) tab.querySelector('[data-ag-tab-title]').textContent = cleanTitle;
  }

  function detectTitle(body, fallback) {
    const titleNode = body.querySelector('.document-card-header h1, .sales-screen-header h1, .screen-title-block h1, h1');
    return titleNode?.textContent?.trim() || fallback || 'ERP прозорец';
  }

  function createTab(id, title) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'workspace-tab ag-v2-tab';
    tab.dataset.windowId = id;
    tab.innerHTML = `<span data-ag-tab-title></span><span class="ag-v2-tab-close" aria-hidden="true">×</span>`;
    tab.querySelector('[data-ag-tab-title]').textContent = title;
    tab.addEventListener('click', (event) => {
      if (event.target.closest('.ag-v2-tab-close')) {
        closeWindow(id);
        return;
      }
      bringToFront(getWindow(id));
    });
    tabs.appendChild(tab);
    return tab;
  }

  function createWindow(id, title, kind) {
    const win = document.createElement('section');
    win.className = 'ag-v2-window';
    win.dataset.windowId = id;
    win.dataset.windowTitle = title;
    win.dataset.windowKind = kind || 'screen';
    win.innerHTML = `
      <header class="ag-v2-window-titlebar" data-ag-window-drag>
        <div class="ag-v2-window-title">
          <span class="ag-v2-window-icon">▣</span>
          <strong data-ag-window-title></strong>
          <em>${kind === 'document-card' ? 'Документ' : 'Екран'}</em>
        </div>
        <div class="ag-v2-window-controls">
          <button type="button" data-ag-window-minimize aria-label="Минимизирай">—</button>
          <button type="button" data-ag-window-maximize aria-label="Максимизирай">□</button>
          <button type="button" data-ag-window-close aria-label="Затвори">×</button>
        </div>
      </header>
      <div class="ag-v2-window-body" data-ag-window-body></div>
      <span class="ag-v2-resize-edge ag-v2-edge-n" data-ag-resize="n"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-s" data-ag-resize="s"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-e" data-ag-resize="e"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-w" data-ag-resize="w"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-ne" data-ag-resize="ne"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-nw" data-ag-resize="nw"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-se" data-ag-resize="se"></span>
      <span class="ag-v2-resize-edge ag-v2-edge-sw" data-ag-resize="sw"></span>
    `;
    win.querySelector('[data-ag-window-title]').textContent = title;
    layer.appendChild(win);
    createTab(id, title);
    positionWindow(win, kind);
    bringToFront(win);
    return win;
  }

  function setBodyLoading(win, message) {
    const body = win.querySelector('[data-ag-window-body]');
    body.innerHTML = `<div class="ag-v2-window-loading"><strong>${message || 'Зареждане...'}</strong><span>Моля, изчакай зареждането на екрана.</span></div>`;
  }

  function normalizeFetchedHtml(html) {
    const text = String(html || '').trim();
    if (!text.includes('<html')) return text;

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const extracted = doc.querySelector('.workspace-home-window, .workspace-window, main, body');
    return extracted ? extracted.innerHTML : text;
  }

  async function loadWindowContent(win, url, options) {
    const opts = options || {};
    const body = win.querySelector('[data-ag-window-body]');
    win.dataset.windowUrl = routeFromUrl(url);
    setBodyLoading(win, 'Зареждане на ERP екран...');

    try {
      const response = await fetch(partialUrl(url), {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-AG-Workspace': '1',
          'X-Requested-With': 'AutoGrandWorkspace'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      body.innerHTML = normalizeFetchedHtml(html);

      const detected = detectTitle(body, opts.title || win.dataset.windowTitle);
      updateWindowTitle(win, detected);
      window.AutoGrandERPAppInit?.(body);
      setStatus(`Отворен прозорец: ${detected}`);
    } catch (error) {
      body.innerHTML = `<div class="ag-v2-window-error"><strong>Екранът не можа да се зареди.</strong><span>${escapeHtml(String(error.message || error))}</span></div>`;
      setStatus('Грешка при зареждане на ERP прозорец');
    }
  }

  function openUrl(url, options) {
    const opts = options || {};
    const route = routeFromUrl(url);
    if (route === '/') {
      showHome();
      return null;
    }

    const baseId = windowIdForUrl(route);
    const id = opts.id || (opts.duplicate ? `${baseId}-${Date.now().toString(36)}` : baseId);
    const existing = getWindow(id);
    if (existing && !opts.duplicate) {
      bringToFront(existing);
      return existing;
    }

    const title = opts.title || titleFromElement(opts.sourceElement, 'ERP прозорец');
    const kind = opts.kind || inferKind(route);
    const win = createWindow(id, title, kind);
    loadWindowContent(win, route, { title });
    return win;
  }

  function inferKind(route) {
    if (route.includes('/document/') && route.includes('/new/')) return 'document-new';
    if (route.includes('/document/')) return 'document-card';
    if (route.includes('/reference')) return 'reference';
    return 'screen';
  }

  function menuKey(button) {
    return `${button?.dataset?.modulePath || ''}||${button?.dataset?.moduleTitle || ''}`;
  }

  function moduleRoute(button) {
    if (!button) return '';
    if (button.dataset.agRoute) return button.dataset.agRoute;
    const key = menuKey(button);
    if (KNOWN_ROUTES.has(key)) return KNOWN_ROUTES.get(key);
    const title = button.dataset.moduleTitle || button.textContent.trim();
    if (TITLE_ROUTES.has(title)) return TITLE_ROUTES.get(title);
    return '';
  }

  function moduleKindLabel(kind) {
    const labels = {
      document: 'Документ / операция',
      reference: 'Номенклатура',
      history: 'История',
      settings: 'Настройка',
      report: 'Справка'
    };
    return labels[kind] || 'ERP модул';
  }

  function moduleInfo(button) {
    return {
      title: button?.dataset?.moduleTitle || button?.textContent?.trim() || 'ERP модул',
      path: button?.dataset?.modulePath || 'AutoGrand ERP',
      kind: button?.dataset?.moduleKind || 'document',
      route: moduleRoute(button)
    };
  }

  function placeholderHtml(info) {
    const actions = info.kind === 'report'
      ? ['Изчисли', 'Филтър', 'Печат', 'Експорт']
      : info.kind === 'settings'
        ? ['Преглед', 'Редакция', 'Запази', 'Провери']
        : ['Нов', 'Отвори', 'Редакция', 'Печат', 'Експорт'];

    return `
      <section class="ag-v2-module-placeholder">
        <header class="ag-v2-placeholder-head">
          <div>
            <span>${escapeHtml(info.path)}</span>
            <h1>${escapeHtml(info.title)}</h1>
            <p>${escapeHtml(moduleKindLabel(info.kind))}</p>
          </div>
          <strong>Behavior only</strong>
        </header>
        <nav class="ag-v2-placeholder-toolbar" aria-label="Команди">
          ${actions.map((action) => `<button type="button">${escapeHtml(action)}</button>`).join('')}
        </nav>
        <div class="ag-v2-placeholder-grid">
          <section>
            <div class="ag-v2-placeholder-filter">Филтриране <input type="text" placeholder="Търсене"></div>
            <table>
              <thead><tr><th></th><th>Код</th><th>Описание</th><th>Статус</th></tr></thead>
              <tbody>
                <tr><td>▶</td><td>AG</td><td>${escapeHtml(info.title)}</td><td>Подготвен модул</td></tr>
                <tr><td></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>
          </section>
          <aside>
            <h2>Контекст</h2>
            <button type="button">Карта</button>
            <button type="button">История</button>
            <button type="button">Свързани</button>
            <button type="button">Помощ</button>
          </aside>
        </div>
      </section>
    `;
  }

  function openMenuPlaceholder(button, options) {
    const opts = options || {};
    const info = moduleInfo(button);
    const baseId = `ag-v2-menu-${hashText(`${info.path}-${info.title}-${info.kind}`)}`;
    const id = opts.duplicate ? `${baseId}-${Date.now().toString(36)}` : baseId;
    const existing = getWindow(id);
    if (existing && !opts.duplicate) {
      bringToFront(existing);
      return existing;
    }

    const win = createWindow(id, info.title, info.kind || 'screen');
    win.dataset.windowUrl = '';
    win.querySelector('[data-ag-window-body]').innerHTML = placeholderHtml(info);
    window.AutoGrandERPAppInit?.(win.querySelector('[data-ag-window-body]'));
    return win;
  }

  function activateMenuButton(button) {
    sidebar?.querySelectorAll('.tree-leaf[data-module-title], .tree-item').forEach((item) => {
      item.classList.toggle('is-active', item === button);
      item.classList.toggle('active', item === button);
    });
  }

  function openModuleButton(button, options) {
    const opts = options || {};
    if (!button) return null;
    activateMenuButton(button);
    const info = moduleInfo(button);
    if (info.route) {
      return openUrl(info.route, {
        title: info.title,
        sourceElement: button,
        kind: inferKind(info.route),
        id: opts.duplicate ? '' : windowIdForUrl(info.route),
        duplicate: opts.duplicate
      });
    }
    return openMenuPlaceholder(button, opts);
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add('is-minimized');
    win.hidden = true;

    const id = win.dataset.windowId;
    let dockButton = dock?.querySelector(`[data-window-id="${cssEscape(id)}"]`);
    if (!dockButton && dock) {
      dockButton = document.createElement('button');
      dockButton.type = 'button';
      dockButton.className = 'ag-v2-dock-button';
      dockButton.dataset.windowId = id;
      dockButton.addEventListener('click', () => {
        dockButton.remove();
        bringToFront(win);
      });
      dock.appendChild(dockButton);
    }
    if (dockButton) dockButton.textContent = win.dataset.windowTitle || 'ERP прозорец';

    const next = allWindows().find((item) => item !== win && !item.classList.contains('is-minimized'));
    if (next) bringToFront(next);
    else showHome();
  }

  function toggleMaximize(win) {
    if (!win) return;
    const maximized = win.classList.toggle('is-maximized');

    if (maximized) {
      win.dataset.restoreLeft = win.style.left;
      win.dataset.restoreTop = win.style.top;
      win.dataset.restoreWidth = win.style.width;
      win.dataset.restoreHeight = win.style.height;
      win.style.left = '8px';
      win.style.top = '8px';
      win.style.width = 'calc(100% - 16px)';
      win.style.height = 'calc(100% - 16px)';
    } else {
      win.style.left = win.dataset.restoreLeft || win.style.left;
      win.style.top = win.dataset.restoreTop || win.style.top;
      win.style.width = win.dataset.restoreWidth || win.style.width;
      win.style.height = win.dataset.restoreHeight || win.style.height;
    }
    bringToFront(win);
  }

  function closeWindow(id) {
    const win = getWindow(id);
    getTab(id)?.remove();
    dock?.querySelector(`[data-window-id="${cssEscape(id)}"]`)?.remove();
    win?.remove();

    const next = allWindows().filter((item) => !item.classList.contains('is-minimized')).pop();
    if (next) bringToFront(next);
    else showHome();
  }

  function startMove(event, win) {
    if (!win || win.classList.contains('is-maximized')) return;
    if (event.target.closest('button')) return;
    const rect = win.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    state.moving = {
      win,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      stageLeft: stageRect.left,
      stageTop: stageRect.top
    };
    bringToFront(win);
    event.preventDefault();
  }

  function startResize(event, win, dir) {
    if (!win || win.classList.contains('is-maximized')) return;
    const rect = win.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    state.resizing = {
      win,
      dir,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left - stageRect.left,
      top: rect.top - stageRect.top,
      width: rect.width,
      height: rect.height
    };
    bringToFront(win);
    event.preventDefault();
  }

  function setupSidebarControls() {
    if (!sidebar) return;
    const header = sidebar.querySelector('.sidebar-header') || sidebar.querySelector('.menu-title');
    if (!header) return;

    sidebar.querySelectorAll('.sidebar-actions, .sidebar-resizer').forEach((node) => node.remove());
    document.getElementById('ag-v2-sidebar-dock')?.remove();

    const actions = document.createElement('div');
    actions.className = 'sidebar-actions';

    const pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.className = 'sidebar-pin-btn';

    const minimizeButton = document.createElement('button');
    minimizeButton.type = 'button';
    minimizeButton.className = 'sidebar-minimize-btn';

    actions.appendChild(pinButton);
    actions.appendChild(minimizeButton);
    header.appendChild(actions);

    const resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    sidebar.appendChild(resizer);

    const dockButton = document.createElement('button');
    dockButton.type = 'button';
    dockButton.id = 'ag-v2-sidebar-dock';
    dockButton.className = 'sidebar-dock-button';
    dockButton.innerHTML = '<span class="statusbar-menu-icon" aria-hidden="true">☰</span><strong>Меню</strong>';
    dockButton.title = 'Покажи главното меню';
    dockButton.hidden = true;

    // Keep the bottom statusbar stable. The restore-menu control lives as a slim floating tab on the left edge.
    document.body.appendChild(dockButton);

    let width = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY) || 505);
    if (!Number.isFinite(width)) width = 505;
    let locked = localStorage.getItem(SIDEBAR_LOCK_KEY) === 'true';
    let minimized = localStorage.getItem(SIDEBAR_MIN_KEY) === 'true';

    function applyWidth() {
      width = clamp(width, 260, 760);
      document.documentElement.style.setProperty('--ag-v2-sidebar-width', `${Math.round(width)}px`);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(width)));
    }

    function applyState() {
      pinButton.textContent = locked ? '📌' : '📍';
      pinButton.title = locked ? 'Отключи разтягането' : 'Заключи менюто';
      minimizeButton.textContent = '◀';
      minimizeButton.title = 'Минимизирай менюто';
      sidebar.classList.toggle('is-width-locked', locked);
      document.body.classList.toggle('is-v2-sidebar-minimized', minimized);
      dockButton.hidden = !minimized;
      dockButton.classList.toggle('is-visible', minimized);
      dockButton.setAttribute('aria-hidden', minimized ? 'false' : 'true');
      localStorage.setItem(SIDEBAR_LOCK_KEY, String(locked));
      localStorage.setItem(SIDEBAR_MIN_KEY, String(minimized));
      setStatus(minimized ? 'Менюто е скрито' : 'Менюто е активно');
    }

    pinButton.addEventListener('click', () => {
      locked = !locked;
      applyState();
    });

    minimizeButton.addEventListener('click', () => {
      minimized = true;
      applyState();
    });

    dockButton.addEventListener('click', () => {
      minimized = false;
      applyState();
    });

    resizer.addEventListener('pointerdown', (event) => {
      if (locked || minimized) return;
      event.preventDefault();
      state.sidebarResize = {
        startX: event.clientX,
        startWidth: sidebar.getBoundingClientRect().width
      };
      document.body.classList.add('is-resizing-sidebar');
    });

    resizer.addEventListener('dblclick', () => {
      if (locked || minimized) return;
      width = 505;
      applyWidth();
    });

    applyWidth();
    applyState();
  }

  function safeKind(value) {
    const kind = String(value || 'document').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return kind || 'document';
  }

  function iconClassForKind(kind) {
    const cleanKind = safeKind(kind);
    const map = {
      document: 'tree-icon-document',
      reference: 'tree-icon-reference',
      history: 'tree-icon-history',
      settings: 'tree-icon-settings',
      report: 'tree-icon-report'
    };
    return map[cleanKind] || 'tree-icon-document';
  }

  function iconClassForMainModule(title) {
    const map = {
      'Продажби': 'tree-icon-sales',
      'Доставки': 'tree-icon-purchases',
      'Склад': 'tree-icon-stock',
      'Финанси и счетоводство': 'tree-icon-finance',
      'Номенклатури': 'tree-icon-nomenclatures',
      'Сервиз и поддръжка': 'tree-icon-service',
      'Електронна търговия': 'tree-icon-commerce',
      'Автомобили': 'tree-icon-vehicles',
      'Администриране': 'tree-icon-admin',
      'Бързи връзки': 'tree-icon-favorites'
    };
    return map[title] || 'tree-icon-root';
  }

  function glyphForIconClass(iconClass) {
    const map = {
      'tree-icon-root': '🧩',
      'tree-icon-folder': '📁',
      'tree-icon-document': '📋',
      'tree-icon-reference': '📒',
      'tree-icon-history': '🕘',
      'tree-icon-settings': '🔧',
      'tree-icon-report': '📈',
      'tree-icon-sales': '🧾',
      'tree-icon-purchases': '🚚',
      'tree-icon-stock': '📦',
      'tree-icon-finance': '💳',
      'tree-icon-nomenclatures': '📚',
      'tree-icon-service': '🛠️',
      'tree-icon-commerce': '🛒',
      'tree-icon-vehicles': '🚗',
      'tree-icon-admin': '⚙️',
      'tree-icon-favorites': '⭐'
    };
    return map[iconClass] || '📋';
  }

  function ensureLeadingIcon(container, iconClass) {
    if (!container) return null;
    let icon = container.querySelector(':scope > .tree-icon');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.setAttribute('aria-hidden', 'true');
      container.insertBefore(icon, container.firstChild);
    }
    decorateMenuIcon(icon, iconClass);
    return icon;
  }

  function decorateMenuIcon(icon, iconClass) {
    if (!icon) return;
    const cleanClass = iconClass || 'tree-icon-document';
    Array.from(icon.classList).forEach((name) => {
      if (name.startsWith('tree-icon-') && name !== 'tree-icon') icon.classList.remove(name);
    });
    icon.classList.add(cleanClass);
    icon.setAttribute('data-ag-glyph', glyphForIconClass(cleanClass));
    icon.setAttribute('aria-hidden', 'true');
  }

  function applyMenuIcons(tree) {
    tree.querySelectorAll(':scope > details.ag-top-module').forEach((module) => {
      const summary = module.querySelector(':scope > summary');
      const moduleName = module.dataset.mainModule || summary?.querySelector('span:last-child')?.textContent?.trim() || '';
      ensureLeadingIcon(summary, iconClassForMainModule(moduleName));
    });

    tree.querySelectorAll('button[data-module-title]').forEach((button) => {
      ensureLeadingIcon(button, iconClassForKind(button.dataset.moduleKind));
    });

    tree.querySelectorAll('.tree-folder-item > details > summary').forEach((summary) => {
      ensureLeadingIcon(summary, 'tree-icon-folder');
    });
  }

  function setupMenuAccordionAndTooltips() {
    const tree = sidebar?.querySelector('.ag-main-menu-tree');
    if (!tree) return;

    applyMenuIcons(tree);

    const topModules = Array.from(tree.querySelectorAll(':scope > details.ag-top-module'));
    topModules.forEach((module) => {
      module.addEventListener('toggle', () => {
        if (!module.open) return;
        topModules.forEach((other) => {
          if (other !== module) other.open = false;
        });
      });
    });

    tree.querySelectorAll('summary, .tree-leaf').forEach((node) => {
      const label = node.dataset?.moduleTitle || node.querySelector('span:last-child')?.textContent || node.textContent || '';
      const clean = String(label).replace(/\s+/g, ' ').trim();
      if (clean) {
        node.setAttribute('title', clean);
        node.setAttribute('aria-label', clean);
      }
    });
  }

  function quickLinkKey(info) {
    const cleanInfo = info || {};
    const title = String(cleanInfo.title || cleanInfo.originalTitle || 'Бърза връзка').replace(/\s+/g, ' ').trim();
    const path = String(cleanInfo.path || 'AutoGrand ERP').replace(/\s+/g, ' ').trim();
    const kind = safeKind(cleanInfo.kind || 'document');
    return String(cleanInfo.key || `${path}||${title}||${kind}`);
  }

  function normalizeQuickLink(info) {
    const cleanInfo = info || {};
    const kind = safeKind(cleanInfo.kind || 'document');
    const title = String(cleanInfo.title || cleanInfo.originalTitle || 'Бърза връзка').replace(/\s+/g, ' ').trim() || 'Бърза връзка';
    const path = String(cleanInfo.path || 'AutoGrand ERP').replace(/\s+/g, ' ').trim() || 'AutoGrand ERP';
    return {
      key: quickLinkKey({ ...cleanInfo, title, path, kind }),
      title,
      path,
      kind,
      route: cleanInfo.route || '',
      originalTitle: cleanInfo.originalTitle || title
    };
  }

  function readQuickLinks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(QUICK_LINKS_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      const seen = new Set();
      const normalized = [];
      parsed.forEach((item) => {
        const info = normalizeQuickLink(item);
        if (seen.has(info.key)) return;
        seen.add(info.key);
        normalized.push(info);
      });
      return normalized;
    } catch {
      return [];
    }
  }

  function writeQuickLinks(items) {
    const seen = new Set();
    const normalized = [];
    (Array.isArray(items) ? items : []).forEach((item) => {
      const info = normalizeQuickLink(item);
      if (seen.has(info.key)) return;
      seen.add(info.key);
      normalized.push(info);
    });
    localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(normalized));
  }

  function quickLinksList() {
    return sidebar?.querySelector('.ag-quick-links-list') || null;
  }

  function renderQuickLinks() {
    const list = quickLinksList();
    if (!list) return;
    const items = readQuickLinks();
    writeQuickLinks(items);
    list.innerHTML = '';
    list.classList.toggle('ag-empty-quick-links', items.length === 0);
    items.forEach((info, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      const kind = safeKind(info.kind || 'document');
      const iconClass = iconClassForKind(kind);
      button.type = 'button';
      button.className = `tree-leaf tree-${kind} ag-quick-link-item`;
      button.dataset.moduleTitle = info.title || '';
      button.dataset.modulePath = info.path || '';
      button.dataset.moduleKind = kind;
      button.dataset.quickLinkKey = quickLinkKey(info);
      button.dataset.quickLinkIndex = String(index);
      if (info.route) button.dataset.agRoute = info.route;
      button.innerHTML = `<span class="tree-icon ${iconClass}" data-ag-glyph="${escapeHtml(glyphForIconClass(iconClass))}"></span><span>${escapeHtml(info.title || 'Бърза връзка')}</span>`;
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  function addQuickLink(button) {
    const info = normalizeQuickLink(moduleInfo(button));
    const items = readQuickLinks();
    if (!items.some((item) => quickLinkKey(item) === info.key)) {
      items.push(info);
      writeQuickLinks(items);
      renderQuickLinks();
      setStatus('Добавено в Бързи връзки');
    }
    const quick = sidebar?.querySelector('details[data-main-module="Бързи връзки"]');
    if (quick) quick.open = true;
  }

  function removeQuickLink(button) {
    const key = button?.dataset?.quickLinkKey || '';
    const index = Number.parseInt(button?.dataset?.quickLinkIndex || '-1', 10);
    if (!key && !Number.isFinite(index)) return;
    const items = readQuickLinks();
    const filtered = items.filter((item, itemIndex) => {
      if (key && quickLinkKey(item) === key) return false;
      if (!key && itemIndex === index) return false;
      return true;
    });
    writeQuickLinks(filtered);
    renderQuickLinks();
    setStatus(filtered.length === items.length ? 'Бързата връзка не беше намерена' : 'Бързата връзка е премахната');
  }

  function renameQuickLink(button) {
    const key = button?.dataset?.quickLinkKey;
    if (!key) return;
    const current = button.dataset.moduleTitle || 'Бърза връзка';
    const next = window.prompt('Ново име на бързата връзка:', current);
    if (next === null) return;
    const clean = next.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const items = readQuickLinks();
    const target = items.find((item) => quickLinkKey(item) === key);
    if (!target) return;
    target.title = clean;
    target.key = quickLinkKey({ ...target, title: target.originalTitle || clean });
    writeQuickLinks(items);
    renderQuickLinks();
    setStatus('Бързата връзка е преименувана');
  }

  document.addEventListener('pointermove', (event) => {
    if (state.moving) {
      const data = state.moving;
      const size = stageSize();
      const width = data.win.offsetWidth;
      const height = data.win.offsetHeight;
      const left = clamp(event.clientX - data.stageLeft - data.offsetX, 0, Math.max(0, size.width - width));
      const top = clamp(event.clientY - data.stageTop - data.offsetY, 0, Math.max(0, size.height - height));
      data.win.style.left = `${Math.round(left)}px`;
      data.win.style.top = `${Math.round(top)}px`;
    }

    if (state.resizing) {
      const data = state.resizing;
      const size = stageSize();
      const dx = event.clientX - data.startX;
      const dy = event.clientY - data.startY;
      let left = data.left;
      let top = data.top;
      let width = data.width;
      let height = data.height;

      if (data.dir.includes('e')) width = data.width + dx;
      if (data.dir.includes('s')) height = data.height + dy;
      if (data.dir.includes('w')) {
        width = data.width - dx;
        left = data.left + dx;
      }
      if (data.dir.includes('n')) {
        height = data.height - dy;
        top = data.top + dy;
      }

      width = clamp(width, MIN_WIDTH, size.width - 8);
      height = clamp(height, MIN_HEIGHT, size.height - 8);
      left = clamp(left, 0, Math.max(0, size.width - width));
      top = clamp(top, 0, Math.max(0, size.height - height));

      data.win.style.left = `${Math.round(left)}px`;
      data.win.style.top = `${Math.round(top)}px`;
      data.win.style.width = `${Math.round(width)}px`;
      data.win.style.height = `${Math.round(height)}px`;
    }

    if (state.sidebarResize) {
      let width = state.sidebarResize.startWidth + (event.clientX - state.sidebarResize.startX);
      width = clamp(width, 260, 760);
      document.documentElement.style.setProperty('--ag-v2-sidebar-width', `${Math.round(width)}px`);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(width)));
    }
  });

  document.addEventListener('pointerup', () => {
    state.moving = null;
    state.resizing = null;
    if (state.sidebarResize) {
      state.sidebarResize = null;
      document.body.classList.remove('is-resizing-sidebar');
    }
  });

  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.dataset.workspaceIgnore === 'true') return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;
    const url = new URL(anchor.href, window.location.origin);
    return url.origin === window.location.origin && !url.pathname.startsWith('/public') && url.pathname !== '/health';
  }

  document.addEventListener('click', (event) => {
    const controlWin = event.target.closest('.ag-v2-window');
    if (event.target.closest('[data-ag-window-close]') && controlWin) {
      closeWindow(controlWin.dataset.windowId);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-ag-window-minimize]') && controlWin) {
      minimizeWindow(controlWin);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-ag-window-maximize]') && controlWin) {
      toggleMaximize(controlWin);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-workspace-home]')) {
      showHome();
      event.preventDefault();
      return;
    }

    const moduleButton = event.target.closest('.ag-main-menu-tree button[data-module-title]');
    if (moduleButton) {
      event.preventDefault();
      openModuleButton(moduleButton);
      return;
    }

    const anchor = event.target.closest('a[href]');
    if (!anchor || !isInternalLink(anchor)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    activateMenuButton(anchor);
    const route = routeFromUrl(anchor.href);
    const title = titleFromElement(anchor, anchor.getAttribute('aria-label') || route);
    openUrl(route, { title, sourceElement: anchor, kind: inferKind(route) });
  });

  document.addEventListener('pointerdown', (event) => {
    const win = event.target.closest('.ag-v2-window');
    if (!win) return;
    if (event.target.closest('[data-ag-window-drag]')) startMove(event, win);
    const edge = event.target.closest('[data-ag-resize]');
    if (edge) startResize(event, win, edge.dataset.agResize);
  });

  document.addEventListener('dblclick', (event) => {
    const titlebar = event.target.closest('[data-ag-window-drag]');
    if (!titlebar) return;
    const win = titlebar.closest('.ag-v2-window');
    toggleMaximize(win);
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    const win = form.closest('.ag-v2-window');
    if (!win) return;

    event.preventDefault();
    const body = win.querySelector('[data-ag-window-body]');
    const submitter = event.submitter;
    const formData = new FormData(form);
    if (submitter?.name && !formData.has(submitter.name)) formData.append(submitter.name, submitter.value || '');

    try {
      body.classList.add('is-loading-form');
      const response = await fetch(form.action || window.location.href, {
        method: (form.method || 'GET').toUpperCase(),
        body: (form.method || 'GET').toUpperCase() === 'GET' ? null : formData,
        credentials: 'same-origin',
        headers: {
          'X-AG-Workspace': '1',
          'X-Requested-With': 'AutoGrandWorkspace'
        }
      });

      if (response.redirected) {
        await loadWindowContent(win, routeFromUrl(response.url), { title: win.dataset.windowTitle });
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      body.innerHTML = normalizeFetchedHtml(html);
      updateWindowTitle(win, detectTitle(body, win.dataset.windowTitle));
      window.AutoGrandERPAppInit?.(body);
    } catch (error) {
      body.insertAdjacentHTML('afterbegin', `<div class="ag-v2-window-error"><strong>Командата не беше изпълнена.</strong><span>${escapeHtml(String(error.message || error))}</span></div>`);
    } finally {
      body.classList.remove('is-loading-form');
    }
  });

  let contextMenu = null;
  let contextTarget = null;

  function closeContextMenu() {
    contextMenu?.remove();
    contextMenu = null;
    contextTarget = null;
  }

  function contextOpenTarget(target, options) {
    const opts = options || {};
    if (!target) return;
    if (target.matches('a[href]')) {
      openUrl(target.href, { title: titleFromElement(target), sourceElement: target, kind: inferKind(target.href), duplicate: opts.duplicate });
      return;
    }
    openModuleButton(target, opts);
  }

  function contextButton(label, attr, options) {
    const opts = options || {};
    const disabled = opts.disabled ? ' disabled aria-disabled="true"' : '';
    return `<button type="button" ${attr}${disabled}>${escapeHtml(label)}</button>`;
  }

  document.addEventListener('contextmenu', (event) => {
    const item = event.target.closest('.ag-quick-link-item, .ag-main-menu-tree button[data-module-title], .tree-item');
    if (!item) return;
    event.preventDefault();
    closeContextMenu();
    contextTarget = item;

    const isQuickLink = item.classList.contains('ag-quick-link-item');

    contextMenu = document.createElement('div');
    contextMenu.className = `ag-v2-context-menu is-moneta-context${isQuickLink ? ' is-quick-link-context' : ''}`;
    contextMenu.innerHTML = isQuickLink
      ? `
        ${contextButton('Отвори', 'data-ag-context-open')}
        ${contextButton('Отвори в нов прозорец', 'data-ag-context-open-new')}
        <div class="ag-v2-context-separator" role="separator"></div>
        ${contextButton('Изтриване', 'data-ag-context-delete')}
        ${contextButton('Преименувай', 'data-ag-context-rename')}
        ${contextButton('Запази промените', 'data-ag-context-save', { disabled: true })}
      `
      : `
        ${contextButton('Отвори', 'data-ag-context-open')}
        ${contextButton('Отвори в нов прозорец', 'data-ag-context-open-new')}
        <div class="ag-v2-context-separator" role="separator"></div>
        ${contextButton('Добави в Бързи връзки', 'data-ag-context-quick')}
        ${contextButton('Скрий менюто', 'data-ag-context-collapse')}
      `;

    const left = Math.min(event.clientX, window.innerWidth - 260);
    const top = Math.min(event.clientY, window.innerHeight - 190);
    contextMenu.style.left = `${Math.max(4, left)}px`;
    contextMenu.style.top = `${Math.max(4, top)}px`;
    document.body.appendChild(contextMenu);

    contextMenu.querySelector('[data-ag-context-open]')?.addEventListener('click', () => {
      contextOpenTarget(contextTarget);
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-open-new]')?.addEventListener('click', () => {
      contextOpenTarget(contextTarget, { duplicate: true });
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-quick]')?.addEventListener('click', () => {
      if (contextTarget?.matches('button[data-module-title]')) addQuickLink(contextTarget);
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-delete]')?.addEventListener('click', () => {
      if (contextTarget?.classList.contains('ag-quick-link-item')) removeQuickLink(contextTarget);
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-rename]')?.addEventListener('click', () => {
      if (contextTarget?.classList.contains('ag-quick-link-item')) renameQuickLink(contextTarget);
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-collapse]')?.addEventListener('click', () => {
      document.body.classList.add('is-v2-sidebar-minimized');
      localStorage.setItem(SIDEBAR_MIN_KEY, 'true');
      document.getElementById('ag-v2-sidebar-dock')?.removeAttribute('hidden');
      closeContextMenu();
    });
  });


  document.addEventListener('click', (event) => {
    if (contextMenu && !event.target.closest('.ag-v2-context-menu')) closeContextMenu();
  });

  window.addEventListener('resize', () => {
    allWindows().forEach((win) => {
      if (win.classList.contains('is-maximized')) return;
      const size = stageSize();
      const width = Math.min(win.offsetWidth, size.width - 16);
      const height = Math.min(win.offsetHeight, size.height - 16);
      const left = clamp(win.offsetLeft, 0, Math.max(0, size.width - width));
      const top = clamp(win.offsetTop, 0, Math.max(0, size.height - height));
      win.style.width = `${Math.max(MIN_WIDTH, width)}px`;
      win.style.height = `${Math.max(MIN_HEIGHT, height)}px`;
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    });
  });

  initStatusClock();
  setupSidebarControls();
  setupMenuAccordionAndTooltips();
  renderQuickLinks();

  window.AutoGrandERPWorkspace = {
    openUrl,
    showHome,
    closeWindow,
    bringToFrontByUrl(url) {
      bringToFront(getWindow(windowIdForUrl(url)));
    }
  };

  window.AutoGrandERPAppInit?.(home);
})();
