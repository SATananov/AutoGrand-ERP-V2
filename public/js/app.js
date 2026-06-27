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

  function initRibbon(root) {
    const scope = root || document;
    scope.querySelectorAll('.ribbon-button').forEach((button) => {
      if (!markBound(button, 'Ribbon')) return;
      button.addEventListener('click', () => {
        const label = button.innerText.trim().replace(/\s+/g, ' ');
        const status = document.querySelector('[data-ag-status-message]');
        if (status) status.textContent = `▣ Команда: ${label}`;
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
