(function () {
  'use strict';

  function markBound(element, key) {
    if (!element) return false;
    const datasetKey = `agBound${key}`;
    if (element.dataset[datasetKey] === 'true') return false;
    element.dataset[datasetKey] = 'true';
    return true;
  }

  function normalize(value) {
    return String(value || '').toLocaleLowerCase('bg-BG').trim();
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function setStatusText(message) {
    const status = document.querySelector('[data-ag-status-text]') || document.querySelector('[data-ag-status-message]');
    if (status) status.textContent = message;
  }

  function timestampForFileName() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds())
    ].join('-');
  }

  function snapshotFileName() {
    return `AutoGrand_Snapshot_${timestampForFileName()}.png`;
  }

  function downloadBlobAs(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName || snapshotFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadBlob(blob) {
    downloadBlobAs(blob, snapshotFileName());
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('snapshot-read-failed'));
      reader.readAsDataURL(blob);
    });
  }

  async function captureScreenBlob() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      throw new Error('screen-capture-unavailable');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      await video.play();
      await new Promise((resolve) => {
        if (video.videoWidth && video.videoHeight) {
          resolve();
          return;
        }
        video.onloadedmetadata = () => resolve();
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || window.innerWidth;
      canvas.height = video.videoHeight || window.innerHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToPngBlob(canvas);
      if (!blob) throw new Error('snapshot-empty');
      return blob;
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  async function copyPngBlob(blob) {
    if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function' || typeof window.ClipboardItem !== 'function') {
      return false;
    }

    await navigator.clipboard.write([
      new window.ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  }

  async function saveSnapshotToDesktop(blob) {
    const dataUrl = await blobToDataUrl(blob);
    const fileName = snapshotFileName();

    const response = await fetch('/tools/snapshot/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, fileName })
    });

    if (!response.ok) {
      throw new Error('snapshot-save-failed');
    }

    return response.json();
  }

  async function openSnapshotFolder() {
    const response = await fetch('/tools/snapshot/open-folder', { method: 'POST' });
    if (!response.ok) {
      throw new Error('snapshot-open-folder-failed');
    }
    return response.json();
  }

  async function shareSnapshot(blob) {
    const file = new File([blob], snapshotFileName(), { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && typeof navigator.share === 'function') {
      await navigator.share({
        title: 'AutoGrand ERP снимка',
        text: 'Снимка от AutoGrand ERP',
        files: [file]
      });
      return true;
    }

    return false;
  }

  function setSnapshotButtonWorking(button, isWorking) {
    if (!button) return;
    button.disabled = isWorking;
    button.classList.toggle('is-working', isWorking);
  }

  async function performSnapshotAction(action, button) {
    setSnapshotButtonWorking(button, true);

    try {
      if (action === 'open-folder') {
        const result = await openSnapshotFolder();
        setStatusText(`Снимки: отворена папка ${result.folder || 'AutoGrand Snapshots'}`);
        return;
      }

      setStatusText('Снимка: изберете прозорец или екран за заснемане');
      const blob = await captureScreenBlob();

      if (action === 'copy') {
        const copied = await copyPngBlob(blob);
        if (copied) {
          setStatusText('Снимка: изображението е копирано в клипборда');
        } else {
          downloadBlob(blob);
          setStatusText('Снимка: браузърът не позволи копиране, файлът е изтеглен като PNG');
        }
        return;
      }

      if (action === 'save-desktop') {
        try {
          const result = await saveSnapshotToDesktop(blob);
          setStatusText(`Снимка: записана на Desktop → ${result.fileName}`);
        } catch (error) {
          downloadBlob(blob);
          setStatusText('Снимка: Desktop записът не успя, файлът е изтеглен като PNG');
          console.warn('AutoGrand snapshot desktop save fallback:', error);
        }
        return;
      }

      if (action === 'save-as') {
        downloadBlob(blob);
        setStatusText('Снимка: файлът е подготвен за запис като PNG');
        return;
      }

      if (action === 'share') {
        const shared = await shareSnapshot(blob);
        if (shared) {
          setStatusText('Снимка: отворен е системният прозорец за споделяне');
        } else {
          try {
            const result = await saveSnapshotToDesktop(blob);
            setStatusText(`Снимка: споделянето не е налично, записана е → ${result.fileName}`);
          } catch (error) {
            downloadBlob(blob);
            setStatusText('Снимка: споделянето не е налично, файлът е изтеглен като PNG');
            console.warn('AutoGrand snapshot share fallback:', error);
          }
        }
      }
    } catch (error) {
      if (error && error.name === 'NotAllowedError') {
        setStatusText('Снимка: отказано е заснемане от браузъра');
      } else {
        setStatusText('Снимка: браузърът не позволи операцията');
      }
      console.warn('AutoGrand snapshot command failed:', error);
    } finally {
      setSnapshotButtonWorking(button, false);
    }
  }

  function closeSnapshotMenu() {
    document.querySelectorAll('.ag-snapshot-menu').forEach((menu) => menu.remove());
    document.removeEventListener('click', closeSnapshotMenu, true);
    window.removeEventListener('resize', closeSnapshotMenu);
    window.removeEventListener('scroll', closeSnapshotMenu, true);
  }

  function showSnapshotMenu(button) {
    closeSnapshotMenu();

    const menu = document.createElement('div');
    menu.className = 'ag-snapshot-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = `
      <button type="button" role="menuitem" data-snapshot-action="copy"><span>📋</span><strong>Копирай снимка</strong></button>
      <button type="button" role="menuitem" data-snapshot-action="save-desktop"><span>💾</span><strong>Запази на Desktop</strong></button>
      <button type="button" role="menuitem" data-snapshot-action="save-as"><span>📁</span><strong>Запази като...</strong></button>
      <button type="button" role="menuitem" data-snapshot-action="share"><span>📨</span><strong>Сподели...</strong></button>
      <button type="button" role="menuitem" data-snapshot-action="open-folder"><span>🗂️</span><strong>Отвори папка Snapshots</strong></button>
    `;

    document.body.appendChild(menu);

    const rect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - menuRect.width - 8);
    const top = Math.min(rect.bottom + 6, window.innerHeight - menuRect.height - 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    menu.querySelectorAll('[data-snapshot-action]').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = item.dataset.snapshotAction;
        closeSnapshotMenu();
        performSnapshotAction(action, button);
      });
    });

    window.setTimeout(() => {
      document.addEventListener('click', closeSnapshotMenu, true);
      window.addEventListener('resize', closeSnapshotMenu);
      window.addEventListener('scroll', closeSnapshotMenu, true);
    }, 0);
  }

  function initRibbon(root) {
    const scope = root || document;
    scope.querySelectorAll('.ribbon-button').forEach((button) => {
      if (!markBound(button, 'Ribbon')) return;
      button.addEventListener('click', () => {
        const command = button.dataset.ribbonCommand || '';
        const label = button.innerText.trim().replace(/\s+/g, ' ');

        if (command === 'snapshot') {
          showSnapshotMenu(button);
          return;
        }

        setStatusText(`Команда: ${label}`);
        console.log(`AutoGrand ribbon action: ${label}`);
      });
    });
  }

  function initBrowseScreens(root) {
    const scope = root || document;

    scope.querySelectorAll('.sales-screen').forEach((screen) => {
      if (screen.dataset.agBrowseReady === 'true') return;
      screen.dataset.agBrowseReady = 'true';

      const rows = Array.from(screen.querySelectorAll('.selectable-row'));
      const previews = Array.from(screen.querySelectorAll('.detail-preview'));
      const cardEnabled = screen.dataset.cardEnabled === 'true';
      const documentCardPath = screen.dataset.documentCardPath || '/document/sales';

      function activeRow() {
        return screen.querySelector('.selectable-row.active:not([hidden])');
      }

      function openDocumentCard(row) {
        if (!row) return;
        const rowId = row.dataset.rowId;
        const rowOpenUrl = row.dataset.rowOpenUrl || '';

        if (!rowOpenUrl && (!cardEnabled || !rowId)) return;

        const url = rowOpenUrl || `${documentCardPath}/${rowId}`;
        const titleCell = row.querySelector('[data-field="number"], [data-field="itemName"], td:nth-child(2), td:first-child');
        const title = titleCell?.textContent?.trim() || 'Карта';

        if (window.AutoGrandERPWorkspace?.openUrl) {
          window.AutoGrandERPWorkspace.openUrl(url, { title, kind: 'document-card', sourceElement: row });
        } else {
          window.location.href = url;
        }
      }

      function activateRow(row) {
        if (!row) return;

        const rowId = row.dataset.rowId;

        rows.forEach((item) => item.classList.remove('active'));
        previews.forEach((item) => item.classList.remove('active'));

        row.classList.add('active');

        const preview = screen.querySelector(`.detail-preview[data-preview-id="${cssEscape(rowId)}"]`);
        if (preview) preview.classList.add('active');
      }

      rows.forEach((row) => {
        row.addEventListener('click', () => activateRow(row));
        row.addEventListener('dblclick', () => openDocumentCard(row));
      });

      screen.querySelector('.open-active-card')?.addEventListener('click', () => {
        openDocumentCard(activeRow());
      });

      const filterField = screen.querySelector('#agFilterField');
      const filterOperator = screen.querySelector('#agFilterOperator');
      const filterValue = screen.querySelector('#agFilterValue');
      const clearFilter = screen.querySelector('#agClearFilter');

      function rowText(row, field) {
        if (field === 'all') return normalize(row.innerText);
        const cell = row.querySelector(`[data-field="${cssEscape(field)}"]`);
        return normalize(cell?.innerText || '');
      }

      function matchesOperator(haystack, needle, operator) {
        if (!needle) return true;
        if (operator === 'starts') return haystack.startsWith(needle);
        if (operator === 'equals') return haystack === needle;
        return haystack.includes(needle);
      }

      function applyFilter() {
        const field = filterField?.value || 'all';
        const operator = filterOperator?.value || 'contains';
        const needle = normalize(filterValue?.value || '');
        let firstVisible = null;

        rows.forEach((row) => {
          const haystack = rowText(row, field);
          const visible = matchesOperator(haystack, needle, operator);
          row.hidden = !visible;
          if (visible && !firstVisible) firstVisible = row;
        });

        activateRow(firstVisible);
      }

      filterField?.addEventListener('change', applyFilter);
      filterOperator?.addEventListener('change', applyFilter);
      filterValue?.addEventListener('input', applyFilter);

      clearFilter?.addEventListener('click', () => {
        if (filterField) filterField.value = 'all';
        if (filterOperator) filterOperator.value = 'contains';
        if (filterValue) filterValue.value = '';

        rows.forEach((row) => {
          row.hidden = false;
        });

        activateRow(rows[0]);
      });

      activateRow(rows[0]);
    });
  }


  function safeFileName(value, fallback) {
    const raw = String(value || fallback || 'AutoGrand').trim();
    return (raw
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120) || 'AutoGrand') + (raw.toLowerCase().endsWith('.png') ? '' : '');
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('file-read-failed'));
      reader.readAsDataURL(file);
    });
  }

  async function blobFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('image-fetch-failed');
    return response.blob();
  }

  function initPriceWorkbench(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-price-workbench]').forEach((screen) => {
      if (screen.dataset.agPriceReady === 'true') return;
      screen.dataset.agPriceReady = 'true';

      const storageKey = 'ag_v2_price_list_columns';
      const rows = Array.from(screen.querySelectorAll('[data-price-row]'));
      const grid = screen.querySelector('[data-price-grid]');
      const columns = Array.from(screen.querySelectorAll('[data-column-key]')).map((th) => ({
        key: th.dataset.columnKey,
        visible: th.dataset.defaultVisible === 'true'
      }));
      const searchField = screen.querySelector('[data-price-search-field]');
      const searchInput = screen.querySelector('[data-price-search-input]');
      const onlyAvailable = screen.querySelector('[data-price-only-available]');
      const columnsDialog = screen.querySelector('[data-price-columns-dialog]');
      const imageDialog = screen.querySelector('[data-price-image-dialog]');
      const floatingMenu = screen.querySelector('[data-price-floating-menu]');
      const imageInput = screen.querySelector('[data-price-image-input]');
      const previewImg = screen.querySelector('[data-price-image-preview]');
      const noImage = screen.querySelector('[data-price-no-image]');
      const modalImg = screen.querySelector('[data-modal-image]');
      const modalNoImage = screen.querySelector('[data-modal-no-image]');
      const detailCards = Array.from(screen.querySelectorAll('[data-price-detail-for]'));
      const requestBasket = [];
      const basket = screen.querySelector('[data-transfer-request-basket]');
      const basketBody = screen.querySelector('[data-transfer-basket-body]');
      const basketTable = screen.querySelector('[data-transfer-basket-table]');
      const basketEmpty = screen.querySelector('[data-transfer-basket-empty]');
      const basketSummary = screen.querySelector('[data-transfer-basket-summary]');
      const submitBasketButton = screen.querySelector('[data-price-command="submit-request-basket"]');
      const clearBasketButton = screen.querySelector('[data-price-command="clear-request-basket"]');
      const requestNoteInput = screen.querySelector('[data-transfer-request-note]');

      function activeRow() {
        return screen.querySelector('[data-price-row].active:not([hidden])') || rows.find((row) => !row.hidden) || rows[0] || null;
      }

      function activeItemData() {
        const row = activeRow();
        return {
          row,
          itemId: row?.dataset.itemId || '',
          code: row?.dataset.code || '',
          name: row?.dataset.name || '',
          imageUrl: row?.dataset.imageUrl || '',
          saveName: row?.dataset.saveName || `${safeFileName(row?.dataset.code || 'article')}.png`,
          cardUrl: row?.dataset.cardUrl || ''
        };
      }

      function setImageElement(img, emptyNode, imageUrl) {
        if (!img || !emptyNode) return;
        if (imageUrl) {
          img.src = imageUrl;
          img.hidden = false;
          emptyNode.hidden = true;
        } else {
          img.removeAttribute('src');
          img.hidden = true;
          emptyNode.hidden = false;
        }
      }

      function syncSelectedItem() {
        const item = activeItemData();
        screen.querySelectorAll('[data-selected-code], [data-modal-code]').forEach((node) => {
          node.textContent = item.code || 'Артикул';
        });
        screen.querySelectorAll('[data-selected-name], [data-modal-name]').forEach((node) => {
          node.textContent = item.name || '';
        });
        setImageElement(previewImg, noImage, item.imageUrl);
        setImageElement(modalImg, modalNoImage, item.imageUrl);

        detailCards.forEach((card) => {
          const active = card.dataset.priceDetailFor === item.itemId;
          card.classList.toggle('active', active);
          if (active && !card.querySelector('[data-price-detail-tab].active')) {
            card.querySelector('[data-price-detail-tab]')?.classList.add('active');
            card.querySelector('[data-price-detail-panel]')?.classList.add('active');
          }
        });
      }

      function setActiveRow(row) {
        if (!row) return;
        rows.forEach((item) => item.classList.remove('active'));
        row.classList.add('active');
        syncSelectedItem();
      }

      function columnCheckboxes() {
        return Array.from(screen.querySelectorAll('[data-price-column-toggle]'));
      }

      function getSelectedColumns() {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const keys = saved.split(',').map((item) => item.trim()).filter(Boolean);
          if (keys.length) return keys;
        }
        return columns.filter((column) => column.visible).map((column) => column.key);
      }

      function setSelectedColumns(keys, persist) {
        const selected = new Set(keys && keys.length ? keys : columns.filter((column) => column.visible).map((column) => column.key));
        columnCheckboxes().forEach((checkbox) => {
          checkbox.checked = selected.has(checkbox.dataset.priceColumnToggle);
        });
        if (persist) localStorage.setItem(storageKey, Array.from(selected).join(','));
        applyColumnVisibility(Array.from(selected));
      }

      function applyColumnVisibility(keys) {
        const selected = new Set(keys || getSelectedColumns());
        grid?.querySelectorAll('[data-column-key], [data-field]').forEach((cell) => {
          const key = cell.dataset.columnKey || cell.dataset.field;
          const visible = selected.has(key);
          cell.hidden = !visible;
        });
      }

      function normalizeValue(value) {
        return normalize(value).replace(/\s+/g, ' ');
      }

      function rowValue(row, field) {
        if (field === 'all') return normalizeValue(row.innerText);
        return normalizeValue(row.dataset[field] || row.querySelector(`[data-field="${cssEscape(field)}"]`)?.textContent || '');
      }

      function applyFilter() {
        const field = searchField?.value || 'code';
        const needle = normalizeValue(searchInput?.value || '');
        const mustBeAvailable = Boolean(onlyAvailable?.checked);
        let first = null;

        rows.forEach((row) => {
          const available = Number(row.dataset.currentAvailable || 0);
          const matchesText = !needle || rowValue(row, field).includes(needle);
          const matchesAvailability = !mustBeAvailable || available > 0;
          const visible = matchesText && matchesAvailability;
          row.hidden = !visible;
          if (visible && !first) first = row;
        });

        setActiveRow(first || rows[0]);
      }

      function openColumns() {
        setSelectedColumns(getSelectedColumns(), false);
        if (typeof columnsDialog?.showModal === 'function') columnsDialog.showModal();
        else columnsDialog?.setAttribute('open', 'open');
      }

      function closeColumns() {
        if (typeof columnsDialog?.close === 'function') columnsDialog.close();
        else columnsDialog?.removeAttribute('open');
      }

      function openImageDialog() {
        syncSelectedItem();
        if (typeof imageDialog?.showModal === 'function') imageDialog.showModal();
        else imageDialog?.setAttribute('open', 'open');
      }

      function closeImageDialog() {
        if (typeof imageDialog?.close === 'function') imageDialog.close();
        else imageDialog?.removeAttribute('open');
      }

      function closeFloatingMenu() {
        if (!floatingMenu) return;
        floatingMenu.hidden = true;
        floatingMenu.innerHTML = '';
        document.removeEventListener('click', closeFloatingMenu, true);
      }

      function showFloatingMenu(button, items) {
        if (!floatingMenu || !button) return;
        closeFloatingMenu();
        floatingMenu.innerHTML = items.map((item) => `<button type="button" data-price-command="${item.command}">${item.label}</button>`).join('');
        floatingMenu.hidden = false;
        const rect = button.getBoundingClientRect();
        const menuRect = floatingMenu.getBoundingClientRect();
        floatingMenu.style.left = `${Math.min(rect.left, window.innerWidth - menuRect.width - 8)}px`;
        floatingMenu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - menuRect.height - 8)}px`;
        window.setTimeout(() => document.addEventListener('click', closeFloatingMenu, true), 0);
      }


      function formatDecimal(value) {
        const number = Number(value || 0);
        return Number.isFinite(number) ? number.toFixed(2) : '0.00';
      }

      function requestBasketKey(itemId, fromWarehouseId) {
        return `${itemId || ''}:${fromWarehouseId || ''}`;
      }

      function renderRequestBasket() {
        if (!basket || !basketBody || !basketTable || !basketEmpty) return;
        const hasRows = requestBasket.length > 0;
        basket.classList.toggle('is-empty', !hasRows);
        basketTable.hidden = !hasRows;
        basketEmpty.hidden = hasRows;
        if (submitBasketButton) submitBasketButton.disabled = !hasRows || requestBasket.some((line) => line.status === 'missing');
        if (clearBasketButton) clearBasketButton.disabled = !hasRows;

        if (basketSummary) {
          const totalQuantity = requestBasket.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
          basketSummary.textContent = hasRows
            ? `${requestBasket.length} реда · ${formatDecimal(totalQuantity)} бр. · изпраща се като заявка към избраните обекти`
            : 'Избери артикул и обект, после добави количество към заявката.';
        }

        basketBody.innerHTML = requestBasket.map((line, index) => {
          const missing = line.status === 'missing';
          const waiting = line.status === 'ready';
          const statusText = missing ? 'Над свободното / ЛИПСА' : 'Готово за заявка';
          const tone = missing ? 'missing' : 'ready';
          return `
            <tr class="basket-row ${tone}" data-basket-index="${index}">
              <td><strong>${line.itemCode}</strong><span>${line.itemName}</span></td>
              <td>${line.fromWarehouseName}</td>
              <td>${line.toWarehouseName}</td>
              <td>${formatDecimal(line.available)}</td>
              <td>
                <input type="number" min="0.01" step="0.01" value="${formatDecimal(line.quantity)}" data-basket-quantity="${index}" />
              </td>
              <td><mark>${statusText}</mark>${waiting ? '<span>Ще се изпрати като заявка</span>' : '<span>Количеството вече не е свободно</span>'}</td>
              <td><button type="button" data-price-command="remove-request-line" data-basket-index="${index}">Премахни</button></td>
            </tr>`;
        }).join('');
      }

      function addActiveItemToRequest(button) {
        const item = activeItemData();
        const fromWarehouseId = button?.dataset.fromWarehouseId || '';
        const fromWarehouseName = button?.dataset.fromWarehouseName || '';
        const available = Number(button?.dataset.fromAvailable || 0);
        const pack = button?.closest('.availability-action-pack');
        const quantityInput = pack?.querySelector('[data-request-quantity]');
        let quantity = Number(String(quantityInput?.value || '1').replace(',', '.'));
        if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1;
        quantity = Math.min(quantity, available || quantity);

        if (!item.itemId || !fromWarehouseId || available <= 0) {
          setStatusText('Заявка: няма свободно количество за избрания обект');
          return;
        }

        const key = requestBasketKey(item.itemId, fromWarehouseId);
        const existing = requestBasket.find((line) => line.key === key);
        if (existing) {
          existing.quantity = Math.min(Number(existing.quantity || 0) + quantity, available);
          existing.status = existing.quantity <= available ? 'ready' : 'missing';
        } else {
          requestBasket.push({
            key,
            itemId: item.itemId,
            itemCode: item.code,
            itemName: item.name,
            fromWarehouseId,
            fromWarehouseName,
            toWarehouseId: basket?.dataset.toWarehouseId || '',
            toWarehouseName: basket?.dataset.toWarehouseName || screen.dataset.currentLocation || 'текущ обект',
            available,
            quantity,
            status: quantity <= available ? 'ready' : 'missing'
          });
        }

        renderRequestBasket();
        basket?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        setStatusText(`Добавено към текуща заявка: ${item.code} от ${fromWarehouseName}`);
      }

      function clearRequestBasket() {
        requestBasket.splice(0, requestBasket.length);
        if (requestNoteInput) requestNoteInput.value = '';
        renderRequestBasket();
        setStatusText('Текущата заявка е изчистена');
      }

      async function submitRequestBasket() {
        if (!requestBasket.length) {
          setStatusText('Заявка: няма добавени артикули');
          return;
        }

        const lines = requestBasket.filter((line) => line.status !== 'missing').map((line) => ({
          itemId: line.itemId,
          fromWarehouseId: line.fromWarehouseId,
          quantity: line.quantity,
          note: [requestNoteInput?.value?.trim(), `Заявено от ценова листа: ${line.itemCode}`].filter(Boolean).join(' · ')
        }));

        if (!lines.length) {
          setStatusText('Заявка: всички редове са с липса или над свободното количество');
          return;
        }

        if (submitBasketButton) submitBasketButton.disabled = true;
        const response = await fetch('/api/stock/transfer-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toWarehouseId: basket?.dataset.toWarehouseId || '',
            note: requestNoteInput?.value?.trim() || 'Заявка от ценова листа — чака проверка на рафт.',
            lines
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          renderRequestBasket();
          setStatusText('Заявка: изпращането не успя или няма свободно количество');
          return;
        }

        clearRequestBasket();
        setStatusText(`Заявка: изпратена към ${result.documents?.length || 1} обект/а. Колегите ще видят задачата за рафт.`);
        window.setTimeout(() => window.location.reload(), 850);
      }

      async function sendTransferRequest(button) {
        const transferId = button?.dataset.transferId || '';
        if (!transferId) return;
        button.disabled = true;
        const response = await fetch(`/api/stock/transfer-requests/${encodeURIComponent(transferId)}/send`, { method: 'POST' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          button.disabled = false;
          setStatusText('Изпращане: не успя. Провери свободното количество в обекта.');
          return;
        }
        setStatusText('Изпращане: трансферът е в статус Пътува и е във В път.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      async function markTransferMissing(button) {
        const transferId = button?.dataset.transferId || '';
        if (!transferId) return;
        const ok = window.confirm('Маркирай като ЛИПСА НА РАФТ? Заявителят ще види, че стоката няма да дойде от този обект.');
        if (!ok) return;
        button.disabled = true;
        const response = await fetch(`/api/stock/transfer-requests/${encodeURIComponent(transferId)}/not-found`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'ЛИПСА НА РАФТ: заявената стока не е намерена физически.' })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          button.disabled = false;
          setStatusText('Липса: маркирането не успя.');
          return;
        }
        setStatusText('Липса: заявката е маркирана като ЛИПСА НА РАФТ.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      function setPlaceholderMessage(command) {
        const item = activeItemData();
        const labels = {
          history: 'Историята ще се отвори за избрания артикул.',
          requestTransfer: `Заявка за трансфер: ${item.code || 'артикул'} към текущия обект.`,
          createSale: `Създай продажба за ${item.code || 'артикул'}.`,
          createOrder: `Създай поръчка за ${item.code || 'артикул'}.`,
          createOffer: `Създай оферта за ${item.code || 'артикул'}.`,
          incomingTransfer: `Трансфер получаване за ${item.code || 'артикул'}.`,
          outgoingTransfer: `Трансфер изпращане за ${item.code || 'артикул'}.`,
          deliveryPrices: 'Цени доставки за избрания артикул.',
          salesPrices: 'Цени продажби за избрания артикул.',
          help: 'Работен екран: търсене, колони, снимка и наличност по обекти.',
          select: 'Избран е артикулът от активния ред.',
          cancel: 'Отказ от избор.'
        };
        setStatusText(labels[command] || `Команда: ${command}`);
      }

      async function uploadImageFromFile(file) {
        const item = activeItemData();
        if (!item.row || !file) return;
        const dataUrl = await readFileAsDataUrl(file);
        const response = await fetch(`/api/items/${encodeURIComponent(item.itemId)}/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, itemCode: item.code })
        });
        if (!response.ok) throw new Error('image-upload-failed');
        const result = await response.json();
        const imageUrl = `${result.imageUrl}?v=${Date.now()}`;
        item.row.dataset.imageUrl = imageUrl;
        setStatusText(`Снимка: качена за артикул ${item.code}`);
        syncSelectedItem();
      }

      async function deleteImage() {
        const item = activeItemData();
        if (!item.row || !item.code) return;
        const response = await fetch(`/api/items/${encodeURIComponent(item.itemId)}/image?itemCode=${encodeURIComponent(item.code)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('image-delete-failed');
        item.row.dataset.imageUrl = '';
        setStatusText(`Снимка: изтрита за артикул ${item.code}`);
        syncSelectedItem();
      }

      async function saveImageAs() {
        const item = activeItemData();
        if (!item.imageUrl) {
          setStatusText('Снимка: няма снимка за избрания артикул');
          return;
        }
        const blob = await blobFromUrl(item.imageUrl);
        downloadBlobAs(blob, item.saveName || `${safeFileName(item.code)}.png`);
        setStatusText(`Снимка: запис като ${item.saveName || item.code}`);
      }

      function runCommand(command, button) {
        const commandName = command || '';
        const item = activeItemData();

        if (commandName === 'columns') return openColumns();
        if (commandName === 'close-columns') return closeColumns();
        if (commandName === 'close-image') return closeImageDialog();
        if (commandName === 'apply-columns') {
          const keys = columnCheckboxes().filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.dataset.priceColumnToggle);
          setSelectedColumns(keys, true);
          setStatusText('Колони: изгледът е приложен');
          return;
        }
        if (commandName === 'reset-columns') {
          localStorage.removeItem(storageKey);
          setSelectedColumns(columns.filter((column) => column.visible).map((column) => column.key), true);
          setStatusText('Колони: върнат е стандартният изглед');
          return;
        }
        if (commandName === 'clear-filter') {
          if (searchInput) searchInput.value = '';
          if (onlyAvailable) onlyAvailable.checked = false;
          applyFilter();
          setStatusText('Филтър: показани са всички артикули');
          return;
        }
        if (commandName === 'filter') return applyFilter();
        if (commandName === 'more') {
          return showFloatingMenu(button, [
            { command: 'columns', label: 'Видими колони' },
            { command: 'save-view', label: 'Запази изгледа' },
            { command: 'reset-columns', label: 'Стандартен изглед' },
            { command: 'export', label: 'Експорт' },
            { command: 'print', label: 'Печат' }
          ]);
        }
        if (commandName === 'image') return openImageDialog();
        if (commandName === 'upload-image') {
          imageInput?.click();
          return;
        }
        if (commandName === 'delete-image') {
          deleteImage().catch((error) => {
            console.warn('AutoGrand item image delete failed:', error);
            setStatusText('Снимка: изтриването не успя');
          });
          return;
        }
        if (commandName === 'save-image-as') {
          saveImageAs().catch((error) => {
            console.warn('AutoGrand item image save-as failed:', error);
            setStatusText('Снимка: записът не успя');
          });
          return;
        }
        if (commandName === 'focus-request-basket' || commandName === 'request-transfer') {
          basket?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          setStatusText('Текуща заявка: добави артикули от наличностите по обекти.');
          return;
        }
        if (commandName === 'add-to-request') {
          addActiveItemToRequest(button);
          return;
        }
        if (commandName === 'submit-request-basket') {
          submitRequestBasket().catch((error) => {
            console.warn('AutoGrand transfer request submit failed:', error);
            setStatusText('Заявка: изпращането не успя');
            renderRequestBasket();
          });
          return;
        }
        if (commandName === 'clear-request-basket') {
          clearRequestBasket();
          return;
        }
        if (commandName === 'remove-request-line') {
          const index = Number(button?.dataset.basketIndex || -1);
          if (index >= 0) requestBasket.splice(index, 1);
          renderRequestBasket();
          setStatusText('Редът е премахнат от текущата заявка');
          return;
        }
        if (commandName === 'send-transfer-request') {
          sendTransferRequest(button).catch((error) => {
            console.warn('AutoGrand transfer request send failed:', error);
            setStatusText('Изпращане: операцията не успя');
          });
          return;
        }
        if (commandName === 'mark-transfer-missing') {
          markTransferMissing(button).catch((error) => {
            console.warn('AutoGrand transfer request missing failed:', error);
            setStatusText('Липса: операцията не успя');
          });
          return;
        }
        if (commandName === 'open-transfer') {
          const transferUrl = button?.dataset.transferUrl || '';
          if (transferUrl) {
            if (window.AutoGrandERPWorkspace?.openUrl) window.AutoGrandERPWorkspace.openUrl(transferUrl, { title: 'Трансфер', kind: 'document-card' });
            else window.location.href = transferUrl;
          }
          return;
        }
        if (commandName === 'open-card' && item.cardUrl) {
          if (window.AutoGrandERPWorkspace?.openUrl) window.AutoGrandERPWorkspace.openUrl(item.cardUrl, { title: item.code, kind: 'document-card' });
          else window.location.href = item.cardUrl;
          return;
        }
        if (commandName === 'availability') {
          screen.querySelector('.price-detail-zone')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          setStatusText(`Наличности по обекти: ${item.code || 'избран артикул'}`);
          return;
        }
        setPlaceholderMessage(commandName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));
      }

      rows.forEach((row) => {
        row.addEventListener('click', () => setActiveRow(row));
        row.addEventListener('dblclick', () => runCommand('open-card'));
      });

      searchField?.addEventListener('change', applyFilter);
      searchInput?.addEventListener('input', applyFilter);
      onlyAvailable?.addEventListener('change', applyFilter);

      imageInput?.addEventListener('change', () => {
        const file = imageInput.files?.[0];
        if (!file) return;
        uploadImageFromFile(file).catch((error) => {
          console.warn('AutoGrand item image upload failed:', error);
          setStatusText('Снимка: качването не успя');
        }).finally(() => {
          imageInput.value = '';
        });
      });

      screen.addEventListener('click', (event) => {
        const detailTab = event.target.closest('[data-price-detail-tab]');
        if (detailTab && screen.contains(detailTab)) {
          event.preventDefault();
          event.stopPropagation();
          const card = detailTab.closest('[data-price-detail-for]');
          const tabName = detailTab.dataset.priceDetailTab;
          card?.querySelectorAll('[data-price-detail-tab]').forEach((button) => button.classList.toggle('active', button === detailTab));
          card?.querySelectorAll('[data-price-detail-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.priceDetailPanel === tabName));
          setStatusText(`Панел: ${detailTab.textContent.trim()}`);
          return;
        }

        const commandButton = event.target.closest('[data-price-command]');
        if (commandButton && screen.contains(commandButton)) {
          event.preventDefault();
          event.stopPropagation();
          runCommand(commandButton.dataset.priceCommand, commandButton);
          return;
        }

        const menuButton = event.target.closest('[data-price-menu]');
        if (menuButton && screen.contains(menuButton)) {
          event.preventDefault();
          event.stopPropagation();
          const menu = menuButton.dataset.priceMenu;
          const menus = {
            item: [
              { command: 'open-card', label: 'Карта' },
              { command: 'history', label: 'История' },
              { command: 'image', label: 'Снимка на артикул' },
              { command: 'availability', label: 'Наличности по обекти' }
            ],
            delivery: [
              { command: 'delivery-prices', label: 'Цени доставки' },
              { command: 'delivery-discounts', label: 'Отстъпки доставки' },
              { command: 'last-delivery', label: 'Последна доставка' }
            ],
            sales: [
              { command: 'sales-prices', label: 'Цени продажби' },
              { command: 'create-sale', label: 'Създай продажба' },
              { command: 'create-order', label: 'Създай поръчка' },
              { command: 'create-offer', label: 'Създай оферта' }
            ],
            transfer: [
              { command: 'request-transfer', label: 'Заяви от друг обект' },
              { command: 'outgoing-transfer', label: 'Трансфер изпращане' },
              { command: 'incoming-transfer', label: 'Трансфер получаване' },
              { command: 'availability', label: 'Наличности по обекти' }
            ]
          };
          showFloatingMenu(menuButton, menus[menu] || []);
        }
      });

      screen.addEventListener('change', (event) => {
        const quantityInput = event.target.closest('[data-basket-quantity]');
        if (!quantityInput || !screen.contains(quantityInput)) return;
        const index = Number(quantityInput.dataset.basketQuantity || -1);
        const line = requestBasket[index];
        if (!line) return;
        let quantity = Number(String(quantityInput.value || '').replace(',', '.'));
        if (!Number.isFinite(quantity) || quantity <= 0) quantity = 1;
        line.quantity = quantity;
        line.status = quantity <= Number(line.available || 0) ? 'ready' : 'missing';
        renderRequestBasket();
      });

      screen.querySelector('[data-price-check-all]')?.addEventListener('change', (event) => {
        const checked = Boolean(event.target.checked);
        columnCheckboxes().forEach((checkbox) => { checkbox.checked = checked; });
      });

      screen.querySelectorAll('[data-price-view-columns]').forEach((button) => {
        button.addEventListener('click', () => {
          const keys = String(button.dataset.priceViewColumns || '').split(',').filter(Boolean);
          setSelectedColumns(keys, false);
        });
      });

      setSelectedColumns(getSelectedColumns(), false);
      renderRequestBasket();
      setActiveRow(rows[0]);
    });
  }


  function initTransferRequestCenter(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-transfer-center]').forEach((center) => {
      if (center.dataset.agTransferCenterReady === 'true') return;
      center.dataset.agTransferCenterReady = 'true';

      function activateTab(tabName) {
        const target = tabName || 'incoming';
        center.querySelectorAll('[data-transfer-center-tab]').forEach((button) => {
          button.classList.toggle('active', button.dataset.transferCenterTab === target);
        });
        center.querySelectorAll('[data-transfer-center-panel]').forEach((panel) => {
          panel.classList.toggle('active', panel.dataset.transferCenterPanel === target);
        });
        setStatusText(`Трансфери и заявки: ${target}`);
      }

      function openTransfer(button) {
        const transferUrl = button?.dataset.transferUrl || '';
        if (!transferUrl) return;
        if (window.AutoGrandERPWorkspace?.openUrl) {
          window.AutoGrandERPWorkspace.openUrl(transferUrl, { title: 'Трансфер', kind: 'document-card' });
        } else {
          window.location.href = transferUrl;
        }
      }

      function actionComment(button) {
        const row = button?.closest('tr');
        return row?.querySelector('[data-transfer-action-note]')?.value?.trim() || '';
      }

      async function postTransferAction(button, url, body = null, errorText = 'Операцията не успя.') {
        const transferId = button?.dataset.transferId || '';
        if (!transferId) return null;
        button.disabled = true;
        const options = { method: 'POST' };
        if (body) {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = JSON.stringify(body);
        }
        const response = await fetch(url.replace('{id}', encodeURIComponent(transferId)), options);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          button.disabled = false;
          setStatusText(errorText);
          return null;
        }
        return result;
      }

      async function sendTransfer(button) {
        const result = await postTransferAction(
          button,
          '/api/stock/transfer-requests/{id}/send',
          { comment: actionComment(button) },
          'Изпращане: не успя. Провери свободното количество и редовете на трансфера.'
        );
        if (!result) return;
        setStatusText('Изпращане: трансферът е в статус Пътува и стои във В път до приемане.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      async function markMissing(button) {
        const ok = window.confirm('Маркирай като ЛИПСА НА РАФТ? Това означава: системата показва свободно количество, но стоката не е намерена физически.');
        if (!ok) return;
        const result = await postTransferAction(
          button,
          '/api/stock/transfer-requests/{id}/not-found',
          { reason: 'ЛИПСА НА РАФТ: заявената стока не е намерена физически.' },
          'Липса на рафт: маркирането не успя.'
        );
        if (!result) return;
        setStatusText('Липса на рафт: заявката е маркирана като проблем за заявителя.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      async function receiveTransfer(button, withPrint = false) {
        const result = await postTransferAction(
          button,
          '/api/stock/transfer-requests/{id}/receive',
          { print: withPrint ? '1' : '0', comment: actionComment(button) },
          'Приемане: трансферът не може да бъде приет.'
        );
        if (!result) return;
        setStatusText(withPrint ? 'Приемане: трансферът е приет. Печатът е placeholder.' : 'Приемане: трансферът е приет в текущия обект.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      async function returnTransfer(button) {
        const ok = window.confirm('Върни трансфера към обекта изпращач? Използвай това, ако стоката не е дошла, е грешна, повредена или текущият обект не я приема.');
        if (!ok) return;
        const result = await postTransferAction(
          button,
          '/api/stock/transfer-requests/{id}/return',
          { reason: actionComment(button) || 'Върнат към обекта изпращач: текущият обект не приема трансфера.' },
          'Връщане: трансферът не може да бъде върнат към изпращача.'
        );
        if (!result) return;
        setStatusText('Връщане: трансферът е върнат към обекта изпращач.');
        window.setTimeout(() => window.location.reload(), 700);
      }

      center.addEventListener('click', (event) => {
        const tabButton = event.target.closest('[data-transfer-center-tab]');
        if (tabButton && center.contains(tabButton)) {
          event.preventDefault();
          activateTab(tabButton.dataset.transferCenterTab);
          return;
        }

        const commandButton = event.target.closest('[data-transfer-center-command]');
        if (!commandButton || !center.contains(commandButton)) return;
        event.preventDefault();

        const command = commandButton.dataset.transferCenterCommand;
        if (command === 'open') return openTransfer(commandButton);
        if (command === 'send') {
          sendTransfer(commandButton).catch((error) => {
            console.warn('AutoGrand transfer center send failed:', error);
            setStatusText('Изпращане: операцията не успя.');
          });
          return;
        }
        if (command === 'missing') {
          markMissing(commandButton).catch((error) => {
            console.warn('AutoGrand transfer center missing failed:', error);
            setStatusText('Липса на рафт: операцията не успя.');
          });
          return;
        }
        if (command === 'receive' || command === 'receive-print') {
          receiveTransfer(commandButton, command === 'receive-print').catch((error) => {
            console.warn('AutoGrand transfer center receive failed:', error);
            setStatusText('Приемане: операцията не успя.');
          });
          return;
        }
        if (command === 'return') {
          returnTransfer(commandButton).catch((error) => {
            console.warn('AutoGrand transfer center return failed:', error);
            setStatusText('Връщане: операцията не успя.');
          });
        }
      });

      const requestedTab = new URLSearchParams(window.location.search).get('tab');
      activateTab(requestedTab || 'incoming');
    });
  }

  function initDocumentTabs(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-document-card]').forEach((card) => {
      if (card.dataset.agTabsReady === 'true') return;
      card.dataset.agTabsReady = 'true';

      const tabButtons = Array.from(card.querySelectorAll('[data-card-tab]'));
      const tabPanels = Array.from(card.querySelectorAll('[data-card-panel]'));

      function activateDocumentTab(tabName) {
        tabButtons.forEach((button) => {
          button.classList.toggle('active', button.dataset.cardTab === tabName);
        });

        tabPanels.forEach((panel) => {
          panel.classList.toggle('active', panel.dataset.cardPanel === tabName);
        });
      }

      tabButtons.forEach((button) => {
        button.addEventListener('click', () => activateDocumentTab(button.dataset.cardTab));
      });

      activateDocumentTab('lines');
    });
  }

  function initAutoGrandERP(root) {
    initRibbon(root);
    initBrowseScreens(root);
    initPriceWorkbench(root);
    initTransferRequestCenter(root);
    initDocumentTabs(root);
  }

  window.AutoGrandERPAppInit = initAutoGrandERP;

  document.addEventListener('DOMContentLoaded', () => {
    initAutoGrandERP(document);
  });
})();
