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

  function downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = snapshotFileName();
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
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
        if (!cardEnabled || !row) return;
        const rowId = row.dataset.rowId;
        if (!rowId) return;

        const url = `${documentCardPath}/${rowId}`;
        const titleCell = row.querySelector('[data-field="number"], td:nth-child(2), td:first-child');
        const title = titleCell?.textContent?.trim() || 'Документна карта';

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
    initDocumentTabs(root);
  }

  window.AutoGrandERPAppInit = initAutoGrandERP;

  document.addEventListener('DOMContentLoaded', () => {
    initAutoGrandERP(document);
  });
})();
