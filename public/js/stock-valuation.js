(function () {
  const root = document.querySelector('[data-stock-valuation-root]');
  if (!root) return;

  const state = {
    activeTab: 'snapshot',
    filters: {},
    options: null,
    snapshot: null,
    balance: null,
    movements: null,
    search: ''
  };

  const form = root.querySelector('[data-valuation-filters]');
  const statusEl = root.querySelector('[data-valuation-status]');

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  function fmtNumber(value, digits = 2) {
    const number = Number(value || 0);
    return number.toLocaleString('bg-BG', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function fmtQty(value) {
    const number = Number(value || 0);
    return number.toLocaleString('bg-BG', { maximumFractionDigits: 3 });
  }

  function text(value, fallback = '-') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  }

  function confidenceBadge(row) {
    const level = row.costConfidenceLevel || (row.missingCost ? 'missing' : 'medium');
    const label = row.costConfidenceLabel || (level === 'high' ? 'Висока' : level === 'medium' ? 'Средна' : 'Липсва');
    const score = Number(row.costConfidenceScore || 0);
    return `<span class="valuation-badge valuation-badge-${level}">${text(label)}${score ? ` · ${score}%` : ''}</span>`;
  }

  function valueBandBadge(row) {
    const band = row.valueBand || 'zero';
    return `<span class="valuation-band valuation-band-${band}">${text(row.valueBandLabel || band)}</span>`;
  }

  function managerFlagBadge(row) {
    const flag = row.managerFlag || 'OK';
    const level = flag === 'OK' ? 'ok' : 'warn';
    return `<span class="valuation-manager-flag valuation-manager-${level}">${text(flag)}</span>`;
  }

  function setStatus(message, type = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.status = type;
  }

  function buildParams(extra = {}) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value !== '') params.set(key, value);
    }
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.set(key, value);
    });
    return params;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json.ok === false) throw new Error(json.message || json.error || 'Request failed');
    return json;
  }

  function fillSelect(select, rows, allLabel) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${allLabel}</option>`;
    (rows || []).forEach((row) => {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.name || row.label || row.id;
      select.appendChild(option);
    });
    select.value = current;
  }

  function collectRowsForSearch(rows) {
    const query = String(state.search || '').trim().toLowerCase();
    if (!query) return rows || [];
    return (rows || []).filter((row) => Object.values(row).some((value) => String(value || '').toLowerCase().includes(query)));
  }

  function renderKpis(summary) {
    const map = {
      totalStockValue: fmtNumber(summary.totalStockValue),
      positiveStockValue: fmtNumber(summary.positiveStockValue),
      negativeStockValue: fmtNumber(summary.negativeStockValue),
      missingCostPositions: fmtQty(summary.missingCostPositions),
      costCoverage: `${summary.costCoverage || 0}%`,
      highConfidencePositions: fmtQty(summary.highConfidencePositions),
      mediumConfidencePositions: fmtQty(summary.mediumConfidencePositions),
      riskPositions: fmtQty(summary.riskPositions)
    };
    Object.entries(map).forEach(([key, value]) => {
      const el = root.querySelector(`[data-kpi="${key}"]`);
      if (el) el.textContent = value;
    });
    const period = root.querySelector('[data-summary-period]');
    if (period) period.textContent = `${summary.period?.from || '-'} → ${summary.period?.to || '-'}`;
  }

  function rowHtml(cells) {
    return `<tr>${cells.map((cell) => `<td${cell.className ? ` class="${cell.className}"` : ''}>${cell.html ?? text(cell.value)}</td>`).join('')}</tr>`;
  }

  function renderTable(selector, rows, mapper, emptyText = 'Няма данни за избраните филтри.') {
    const tbody = root.querySelector(`${selector} tbody`);
    if (!tbody) return;
    const visibleRows = collectRowsForSearch(rows);
    if (!visibleRows.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="empty">${emptyText}</td></tr>`;
      return;
    }
    tbody.innerHTML = visibleRows.map((row) => rowHtml(mapper(row))).join('');
  }

  function renderSnapshot(snapshot) {
    renderKpis(snapshot.summary || {});
    const notes = root.querySelector('[data-snapshot-notes]');
    if (notes) {
      notes.innerHTML = (snapshot.notes || []).map((note) => `<article>${text(note)}</article>`).join('');
    }
    const managerStrip = root.querySelector('[data-manager-strip]');
    if (managerStrip) {
      const summary = snapshot.summary || {};
      managerStrip.innerHTML = [
        ['Manager risk', fmtQty(summary.riskPositions), 'Позиции за контрол'],
        ['High value', fmtQty(summary.highValuePositions), 'Висока/критична стойност'],
        ['Missing cost', fmtQty(summary.missingCostPositions), 'Без себестойност'],
        ['Coverage', `${summary.costCoverage || 0}%`, 'Покритие на себестойността']
      ].map(([title, value, hint]) => `<article><span>${title}</span><strong>${value}</strong><em>${hint}</em></article>`).join('');
    }
    renderTable('[data-high-value-table]', snapshot.highValue || [], (row) => [
      { value: row.itemLabel },
      { value: row.locationLabel },
      { value: fmtQty(row.netQuantity), className: 'num' },
      { value: fmtNumber(row.unitCost), className: 'num' },
      { value: fmtNumber(row.stockValue), className: 'num' },
      { html: confidenceBadge(row) },
      { html: valueBandBadge(row) },
      { html: managerFlagBadge(row) }
    ]);
  }

  function renderBalance(balance) {
    const rows = balance.rows || [];
    const counter = root.querySelector('[data-balance-counter]');
    if (counter) counter.textContent = `${collectRowsForSearch(rows).length} реда`;
    renderTable('[data-balance-table]', rows, (row) => [
      { value: row.itemLabel },
      { value: row.locationLabel },
      { value: fmtQty(row.netQuantity), className: 'num' },
      { value: fmtNumber(row.unitCost), className: 'num' },
      { value: fmtNumber(row.stockValue), className: 'num' },
      { value: fmtNumber(row.incomingValue), className: 'num' },
      { value: fmtNumber(row.outgoingValue), className: 'num' },
      { value: row.lastMovementDate },
      { html: confidenceBadge(row) },
      { html: valueBandBadge(row) },
      { html: managerFlagBadge(row) }
    ]);
  }

  function renderLocations(snapshot) {
    const rows = snapshot.locationSummary || [];
    const counter = root.querySelector('[data-location-counter]');
    if (counter) counter.textContent = `${collectRowsForSearch(rows).length} обекта`;
    renderTable('[data-location-table]', rows, (row) => [
      { value: row.locationLabel },
      { value: fmtNumber(row.stockValue), className: 'num' },
      { value: fmtNumber(row.positiveValue), className: 'num' },
      { value: fmtNumber(row.negativeValue), className: 'num' },
      { value: fmtQty(row.netQuantity), className: 'num' },
      { value: fmtQty(row.positions), className: 'num' },
      { value: fmtQty(row.missingCostPositions), className: 'num' },
      { value: `${row.missingCostRate || 0}%`, className: 'num' }
    ]);
  }

  function renderMovements(movements) {
    const rows = movements.rows || [];
    const counter = root.querySelector('[data-movement-counter]');
    if (counter) counter.textContent = `${collectRowsForSearch(rows).length} реда`;
    renderTable('[data-movement-table]', rows, (row) => [
      { value: row.date },
      { value: row.itemLabel },
      { value: row.locationLabel },
      { html: row.documentHref ? `<a href="${row.documentHref}">${text(row.documentNo || row.documentId)}</a>` : text(row.documentNo || row.documentId) },
      { value: fmtQty(row.signedQuantity), className: 'num' },
      { value: fmtNumber(row.unitCost), className: 'num' },
      { value: fmtNumber(row.movementValue), className: 'num' },
      { html: `${text(row.costSource || row.costConfidence)} ${confidenceBadge(row)}` }
    ]);
  }

  function setTab(tab) {
    state.activeTab = tab;
    root.querySelectorAll('[data-valuation-tab]').forEach((button) => button.classList.toggle('active', button.dataset.valuationTab === tab));
    root.querySelectorAll('[data-tab-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.tabPanel === tab));
    renderAll();
  }

  function renderAll() {
    if (state.snapshot) renderSnapshot(state.snapshot);
    if (state.balance) renderBalance(state.balance);
    if (state.snapshot) renderLocations(state.snapshot);
    if (state.movements) renderMovements(state.movements);
  }

  async function loadOptions() {
    const options = await fetchJson(`/api/stock/valuation/options?${buildParams()}`);
    state.options = options;
    fillSelect(root.querySelector('[data-filter-item]'), options.items, 'Всички артикули');
    fillSelect(root.querySelector('[data-filter-location]'), options.locations, 'Всички обекти');
  }

  async function loadReports() {
    setStatus('Зареждане на стойностната справка...');
    const params = buildParams();
    state.search = String(form.querySelector('[data-filter-search]')?.value || '');
    const [snapshot, balance, movements] = await Promise.all([
      fetchJson(`/api/stock/valuation/snapshot?${params}`),
      fetchJson(`/api/stock/valuation/balance?${params}`),
      fetchJson(`/api/stock/valuation/movements-cost?${params}`)
    ]);
    state.snapshot = snapshot;
    state.balance = balance;
    state.movements = movements;
    renderAll();
    if (!snapshot.ready) setStatus(snapshot.summary?.diagnostics?.reason || 'Не е открита read-only база за valuation.', 'warn');
    else setStatus(`Готово · ${snapshot.summary.rows} позиции · стойност ${fmtNumber(snapshot.summary.totalStockValue)} BGN · coverage ${snapshot.summary.costCoverage || 0}%`, 'ok');
  }

  function csvEscape(value) {
    const textValue = String(value ?? '');
    return /[";\n]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue;
  }

  function exportCsv() {
    let rows = [];
    let header = [];
    if (state.activeTab === 'locations') {
      header = ['location', 'stock_value', 'positive_value', 'negative_value', 'net_quantity', 'positions', 'missing_cost', 'missing_rate'];
      rows = collectRowsForSearch(state.snapshot?.locationSummary || []).map((row) => [row.locationLabel, row.stockValue, row.positiveValue, row.negativeValue, row.netQuantity, row.positions, row.missingCostPositions, row.missingCostRate]);
    } else if (state.activeTab === 'movements') {
      header = ['date', 'item', 'location', 'document', 'signed_quantity', 'unit_cost', 'movement_value', 'confidence'];
      rows = collectRowsForSearch(state.movements?.rows || []).map((row) => [row.date, row.itemLabel, row.locationLabel, row.documentNo || row.documentId, row.signedQuantity, row.unitCost, row.movementValue, row.costConfidence]);
    } else {
      header = ['item', 'location', 'quantity', 'unit_cost', 'stock_value', 'incoming_value', 'outgoing_value', 'confidence', 'confidence_score', 'value_band', 'manager_flag'];
      rows = collectRowsForSearch(state.balance?.rows || state.snapshot?.highValue || []).map((row) => [row.itemLabel, row.locationLabel, row.netQuantity, row.unitCost, row.stockValue, row.incomingValue, row.outgoingValue, row.costConfidenceLabel || row.costConfidence, row.costConfidenceScore, row.valueBandLabel || row.valueBand, row.managerFlag]);
    }
    const csv = [header, ...rows].map((line) => line.map(csvEscape).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-valuation-${state.activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function initDefaults() {
    const from = root.querySelector('[data-filter-from]');
    const to = root.querySelector('[data-filter-to]');
    if (from && !from.value) from.value = daysAgo(365);
    if (to && !to.value) to.value = today();
  }

  root.querySelectorAll('[data-valuation-tab]').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.valuationTab)));
  root.querySelector('[data-valuation-print]')?.addEventListener('click', () => window.print());
  root.querySelector('[data-valuation-export]')?.addEventListener('click', exportCsv);
  root.querySelectorAll('[data-valuation-period]').forEach((button) => button.addEventListener('click', async () => {
    const to = root.querySelector('[data-filter-to]');
    const from = root.querySelector('[data-filter-from]');
    if (to) to.value = today();
    if (from) {
      if (button.dataset.valuationPeriod === 'year') from.value = `${new Date().getFullYear()}-01-01`;
      else from.value = daysAgo(Number(button.dataset.valuationPeriod || 365));
    }
    try { await loadReports(); } catch (error) { console.error(error); setStatus(error.message || 'Грешка при зареждане.', 'error'); }
  }));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await loadReports();
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Грешка при зареждане.', 'error');
    }
  });

  form.querySelector('[data-filter-search]')?.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderAll();
  });

  initDefaults();
  setTab('snapshot');
  loadOptions().then(loadReports).catch((error) => {
    console.error(error);
    setStatus(error.message || 'Грешка при зареждане.', 'error');
  });
}());
