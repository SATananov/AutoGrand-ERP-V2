/*
 * AutoGrand ERP V2 Step 2.5 Desktop Workspace Behavior
 * Purpose: apply step1-like MDI behavior to V2 without changing business logic.
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

  if (!workspace || !stage || !layer || !tabs || !home) return;

  const state = {
    z: 50,
    cascade: 0,
    moving: null,
    resizing: null
  };

  const MIN_WIDTH = 540;
  const MIN_HEIGHT = 320;

  function setStatus(message) {
    if (statusCell && message) statusCell.textContent = `▣ ${message}`;
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
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
    const explicit = element?.dataset?.agScreenTitle || element?.dataset?.windowTitle;
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
    const left = clamp(22 + index * 32, 8, size.width - width - 8);
    const top = clamp(18 + index * 28, 8, size.height - height - 8);

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
      body.innerHTML = `<div class="ag-v2-window-error"><strong>Екранът не можа да се зареди.</strong><span>${String(error.message || error)}</span></div>`;
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

    const id = opts.id || windowIdForUrl(route);
    const existing = getWindow(id);
    if (existing) {
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
      win.style.width = `calc(100% - 16px)`;
      win.style.height = `calc(100% - 16px)`;
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

  document.addEventListener('pointermove', (event) => {
    if (state.moving) {
      const data = state.moving;
      const size = stageSize();
      const width = data.win.offsetWidth;
      const height = data.win.offsetHeight;
      const left = clamp(event.clientX - data.stageLeft - data.offsetX, 0, size.width - width);
      const top = clamp(event.clientY - data.stageTop - data.offsetY, 0, size.height - height);
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
      left = clamp(left, 0, size.width - width);
      top = clamp(top, 0, size.height - height);

      data.win.style.left = `${Math.round(left)}px`;
      data.win.style.top = `${Math.round(top)}px`;
      data.win.style.width = `${Math.round(width)}px`;
      data.win.style.height = `${Math.round(height)}px`;
    }
  });

  document.addEventListener('pointerup', () => {
    state.moving = null;
    state.resizing = null;
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
    if (event.target.closest('[data-ag-window-close]')) {
      closeWindow(controlWin.dataset.windowId);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-ag-window-minimize]')) {
      minimizeWindow(controlWin);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-ag-window-maximize]')) {
      toggleMaximize(controlWin);
      event.preventDefault();
      return;
    }
    if (event.target.closest('[data-workspace-home]')) {
      showHome();
      event.preventDefault();
      return;
    }

    const anchor = event.target.closest('a[href]');
    if (!anchor || !isInternalLink(anchor)) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    document.querySelectorAll('.tree-item').forEach((item) => item.classList.toggle('active', item === anchor));
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
      body.insertAdjacentHTML('afterbegin', `<div class="ag-v2-window-error"><strong>Командата не беше изпълнена.</strong><span>${String(error.message || error)}</span></div>`);
    } finally {
      body.classList.remove('is-loading-form');
    }
  });

  document.querySelector('[data-ag-menu-collapse]')?.addEventListener('click', () => {
    document.querySelector('.erp-main')?.classList.toggle('is-menu-collapsed');
    setStatus(document.querySelector('.erp-main')?.classList.contains('is-menu-collapsed') ? 'Менюто е свито' : 'Менюто е разгънато');
  });

  document.querySelector('[data-ag-menu-pin]')?.addEventListener('click', () => {
    sidebar?.classList.toggle('is-menu-pinned');
    setStatus(sidebar?.classList.contains('is-menu-pinned') ? 'Менюто е закачено' : 'Менюто е откачено');
  });

  let contextMenu = null;

  function closeContextMenu() {
    contextMenu?.remove();
    contextMenu = null;
  }

  document.addEventListener('contextmenu', (event) => {
    const item = event.target.closest('.tree-item');
    if (!item) return;
    event.preventDefault();
    closeContextMenu();

    contextMenu = document.createElement('div');
    contextMenu.className = 'ag-v2-context-menu';
    contextMenu.innerHTML = `
      <button type="button" data-ag-context-open>Отвори</button>
      <button type="button" data-ag-context-focus>Покажи отпред</button>
      <button type="button" data-ag-context-collapse>Свий менюто</button>
    `;
    contextMenu.style.left = `${event.clientX}px`;
    contextMenu.style.top = `${event.clientY}px`;
    document.body.appendChild(contextMenu);

    contextMenu.querySelector('[data-ag-context-open]').addEventListener('click', () => {
      openUrl(item.href, { title: titleFromElement(item), sourceElement: item, kind: inferKind(item.href) });
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-focus]').addEventListener('click', () => {
      const existing = getWindow(windowIdForUrl(item.href));
      if (existing) bringToFront(existing);
      else openUrl(item.href, { title: titleFromElement(item), sourceElement: item, kind: inferKind(item.href) });
      closeContextMenu();
    });
    contextMenu.querySelector('[data-ag-context-collapse]').addEventListener('click', () => {
      document.querySelector('.erp-main')?.classList.add('is-menu-collapsed');
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
      const left = clamp(win.offsetLeft, 0, size.width - width);
      const top = clamp(win.offsetTop, 0, size.height - height);
      win.style.width = `${Math.max(MIN_WIDTH, width)}px`;
      win.style.height = `${Math.max(MIN_HEIGHT, height)}px`;
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    });
  });

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
