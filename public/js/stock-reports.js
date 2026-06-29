(() => {
  const root = document.querySelector('[data-stock-reports-root]');
  if (!root) return;

  const state = {
    activeTab: 'overview',
    balanceRows: [],
    movementRows: [],
    summary: {},
    diagnostics: {},
    topNegative: [],
    topMovement: []
  };

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysAgoIso(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  function firstDayOfMonthIso() {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  }

  function firstDayOfYearIso() {
    const date = new Date();
    date.setMonth(0, 1);
    return date.toISOString().slice(0, 10);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 3 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 19).replace('T', ' ');
    return new Intl.DateTimeFormat('bg-BG', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  function text(value, fallback = '-') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  }

  function escapeHtml(value) {
    return text(value, '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function selectedText(selector, fallback) {
    const el = $(selector);
    if (!el) return fallback;
    const option = el.options?.[el.selectedIndex];
    return option?.textContent || fallback;
  }

  function buildQuery() {
    const params = new URLSearchParams();
    params.set('from', $('[data-filter-from]').value || daysAgoIso(30));
    params.set('to', $('[data-filter-to]').value || todayIso());
    params.set('limit', $('[data-filter-limit]').value || '100');
    const itemId = $('[data-filter-item]').value;
    const locationId = $('[data-filter-location]').value;
    const operatorId = $('[data-filter-operator]').value;
    if (itemId) params.set('itemId', itemId);
    if (locationId) params.set('locationId', locationId);
    if (operatorId) params.set('operatorId', operatorId);
    return params;
  }

  function getReportMode() {
    return $('[data-filter-report-mode]')?.value || 'all';
  }

  function getSearchTerm() {
    return ($('[data-filter-search]')?.value || '').trim().toLowerCase();
  }

  function rowMatchesSearch(row, keys) {
    const term = getSearchTerm();
    if (!term) return true;
    return keys.some((key) => String(row[key] || '').toLowerCase().includes(term));
  }

  function filterBalanceRows(rows) {
    const mode = getReportMode();
    return (rows || []).filter((row) => {
      if (!rowMatchesSearch(row, ['itemLabel', 'locationLabel', 'lastMovementDate'])) return false;
      if (mode === 'negative') return Number(row.netQuantity) < 0;
      if (mode === 'zero') return Number(row.netQuantity) === 0;
      if (mode === 'active') return Number(row.movements) > 1;
      return true;
    });
  }

  function filterMovementRows(rows) {
    return (rows || []).filter((row) => rowMatchesSearch(row, [
      'itemLabel', 'locationLabel', 'documentNo', 'documentId', 'movementType', 'status', 'operatorLabel', 'date'
    ]));
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const json = await response.json();
    if (!response.ok || json.ok === false) {
      throw new Error(json.message || json.error || 'Заявката не беше успешна.');
    }
    return json;
  }

  function setStatus(message, type = 'info') {
    const el = $('[data-stock-report-status]');
    if (!el) return;
    el.textContent = message;
    el.dataset.statusType = type;
  }

  function fillSelect(select, rows, emptyLabel) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = emptyLabel;
    select.appendChild(empty);
    rows.forEach((row) => {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.code ? `${row.code} · ${row.name}` : row.name;
      select.appendChild(option);
    });
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function setKpis(summary) {
    $$('[data-kpi]').forEach((el) => {
      const key = el.dataset.kpi;
      el.textContent = formatNumber(summary?.[key] || 0);
    });
  }

  function setSummaryPanel(filters, diagnostics) {
    const period = `${text(filters?.from)} — ${text(filters?.to)}`;
    const values = {
      '[data-summary-period]': period,
      '[data-summary-location]': selectedText('[data-filter-location]', 'Всички'),
      '[data-summary-item]': selectedText('[data-filter-item]', 'Всички'),
      '[data-summary-operator]': selectedText('[data-filter-operator]', 'Всички'),
      '[data-summary-table]': diagnostics?.movementTable || '-',
      '[data-summary-ready]': diagnostics?.ready === false ? 'Нужна е настройка' : 'Готово'
    };
    Object.entries(values).forEach(([selector, value]) => {
      const el = $(selector);
      if (el) el.textContent = value;
    });
  }

  function renderBalance(rows) {
    const filtered = filterBalanceRows(rows);
    const tbody = $('[data-stock-report-balance] tbody');
    const counter = $('[data-balance-counter]');
    if (counter) counter.textContent = `${formatNumber(filtered.length)} реда`;
    tbody.innerHTML = '';
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Няма данни за избрания филтър.</td></tr>';
      return;
    }
    filtered.forEach((row) => {
      const tr = document.createElement('tr');
      if (Number(row.netQuantity) < 0) tr.classList.add('danger-row');
      tr.innerHTML = `
        <td>${escapeHtml(row.itemLabel)}</td>
        <td>${escapeHtml(row.locationLabel)}</td>
        <td class="num">${formatNumber(row.incoming)}</td>
        <td class="num">${formatNumber(row.outgoing)}</td>
        <td class="num strong">${formatNumber(row.netQuantity)}</td>
        <td class="num">${formatNumber(row.movements)}</td>
        <td>${escapeHtml(formatDate(row.lastMovementDate))}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMovements(rows) {
    const filtered = filterMovementRows(rows);
    const tbody = $('[data-stock-report-movements] tbody');
    const counter = $('[data-movement-counter]');
    if (counter) counter.textContent = `${formatNumber(filtered.length)} реда`;
    tbody.innerHTML = '';
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">Няма движения за избрания филтър.</td></tr>';
      return;
    }
    filtered.forEach((row) => {
      const tr = document.createElement('tr');
      if (Number(row.signedQuantity) < 0) tr.classList.add('warn-row');
      tr.innerHTML = `
        <td>${escapeHtml(formatDate(row.date))}</td>
        <td>${escapeHtml(row.itemLabel)}</td>
        <td>${escapeHtml(row.locationLabel)}</td>
        <td>${escapeHtml(row.operatorLabel)}</td>
        <td>${escapeHtml(row.documentNo || row.documentId)}</td>
        <td>${escapeHtml(row.movementType || row.status)}</td>
        <td class="num">${formatNumber(row.quantity)}</td>
        <td class="num strong">${formatNumber(row.signedQuantity)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderList(selector, rows, emptyLabel, valueKey) {
    const el = $(selector);
    if (!el) return;
    el.innerHTML = '';
    const filtered = (rows || []).filter((row) => rowMatchesSearch(row, ['itemLabel', 'locationLabel']));
    if (!filtered.length) {
      el.innerHTML = `<p class="empty-list">${escapeHtml(emptyLabel)}</p>`;
      return;
    }
    filtered.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'stock-report-list-item';
      item.innerHTML = `
        <span>${escapeHtml(row.itemLabel)}</span>
        <em>${escapeHtml(row.locationLabel)}</em>
        <strong>${formatNumber(row[valueKey])}</strong>
      `;
      el.appendChild(item);
    });
  }

  function renderAll() {
    setKpis(state.summary || {});
    renderBalance(state.balanceRows || []);
    renderMovements(state.movementRows || []);
    renderList('[data-stock-report-negative]', state.topNegative || [], 'Няма отрицателни наличности в избрания период.', 'netQuantity');
    renderList('[data-stock-report-active]', state.topMovement || [], 'Няма активност в избрания период.', 'movements');
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    $$('[data-report-tab]').forEach((button) => {
      const active = button.dataset.reportTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('[data-tab-panel]').forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset.tabPanel !== tab);
    });
  }

  function setPeriodPreset(preset) {
    const from = $('[data-filter-from]');
    const to = $('[data-filter-to]');
    to.value = todayIso();
    if (preset === 'month') from.value = firstDayOfMonthIso();
    else if (preset === 'year') from.value = firstDayOfYearIso();
    else from.value = daysAgoIso(Number(preset || 30));
    $$('[data-period-preset]').forEach((button) => button.classList.toggle('active', button.dataset.periodPreset === String(preset)));
  }

  async function loadOptions() {
    const params = buildQuery();
    const data = await fetchJson(`/api/stock/reports/options?${params.toString()}`);
    fillSelect($('[data-filter-location]'), data.locations || [], 'Всички обекти');
    fillSelect($('[data-filter-item]'), data.items || [], 'Всички артикули');
    fillSelect($('[data-filter-operator]'), data.operators || [], 'Всички оператори');
    if (data.diagnostics && data.diagnostics.ready === false) {
      setStatus(data.diagnostics.reason || 'Няма открити складови движения.', 'warn');
    }
  }

  async function loadReports() {
    const params = buildQuery();
    setStatus('Зареждане на складовите справки...', 'info');
    const [summary, balance, movements] = await Promise.all([
      fetchJson(`/api/stock/reports/summary?${params.toString()}`),
      fetchJson(`/api/stock/reports/balance?${params.toString()}`),
      fetchJson(`/api/stock/reports/movements?${params.toString()}`)
    ]);
    state.summary = summary.summary || {};
    state.diagnostics = summary.diagnostics || balance.diagnostics || movements.diagnostics || {};
    state.topNegative = summary.topNegative || [];
    state.topMovement = summary.topMovement || [];
    state.balanceRows = balance.rows || [];
    state.movementRows = movements.rows || [];
    setSummaryPanel(summary.filters || balance.filters || movements.filters || {}, state.diagnostics);
    renderAll();
    setStatus('Справките са заредени. Режимът е само за преглед.', 'ok');
  }

  function csvEscape(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  function toCsv(rows, header) {
    const lines = [header.map((col) => csvEscape(col.label)).join(',')];
    rows.forEach((row) => {
      lines.push(header.map((col) => csvEscape(row[col.key])).join(','));
    });
    return lines.join('\n');
  }

  function downloadCsv() {
    let rows = filterBalanceRows(state.balanceRows);
    let header = [
      { key: 'itemLabel', label: 'item' },
      { key: 'locationLabel', label: 'location' },
      { key: 'incoming', label: 'incoming' },
      { key: 'outgoing', label: 'outgoing' },
      { key: 'netQuantity', label: 'netQuantity' },
      { key: 'movements', label: 'movements' },
      { key: 'lastMovementDate', label: 'lastMovementDate' }
    ];

    if (state.activeTab === 'movements') {
      rows = filterMovementRows(state.movementRows);
      header = [
        { key: 'date', label: 'date' },
        { key: 'itemLabel', label: 'item' },
        { key: 'locationLabel', label: 'location' },
        { key: 'operatorLabel', label: 'operator' },
        { key: 'documentNo', label: 'documentNo' },
        { key: 'movementType', label: 'type' },
        { key: 'quantity', label: 'quantity' },
        { key: 'signedQuantity', label: 'signedQuantity' }
      ];
    }

    const blob = new Blob([toCsv(rows, header)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-reports-${state.activeTab}-${todayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function resetFilters() {
    setPeriodPreset('30');
    $('[data-filter-location]').value = '';
    $('[data-filter-item]').value = '';
    $('[data-filter-operator]').value = '';
    $('[data-filter-report-mode]').value = 'all';
    $('[data-filter-search]').value = '';
    $('[data-filter-limit]').value = '100';
  }

  async function init() {
    setPeriodPreset('30');
    setActiveTab('overview');

    $('[data-stock-report-filters]').addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await loadReports();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    $$('[data-report-tab]').forEach((button) => {
      button.addEventListener('click', () => setActiveTab(button.dataset.reportTab));
    });

    $$('[data-period-preset]').forEach((button) => {
      button.addEventListener('click', async () => {
        setPeriodPreset(button.dataset.periodPreset);
        try {
          await loadReports();
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });
    });

    ['[data-filter-report-mode]', '[data-filter-search]'].forEach((selector) => {
      const el = $(selector);
      if (el) el.addEventListener('input', renderAll);
    });

    $('[data-stock-report-reset]').addEventListener('click', async () => {
      resetFilters();
      try {
        await loadReports();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    $('[data-stock-report-print]').addEventListener('click', () => window.print());
    $('[data-stock-report-export]').addEventListener('click', downloadCsv);

    try {
      await loadOptions();
      await loadReports();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  }

  init();
})();
