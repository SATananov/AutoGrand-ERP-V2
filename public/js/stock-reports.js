(() => {
  const root = document.querySelector('[data-stock-reports-root]');
  if (!root) return;

  const state = {
    balanceRows: [],
    movementRows: []
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

  function buildQuery() {
    const params = new URLSearchParams();
    params.set('from', $('[data-filter-from]').value || daysAgoIso(30));
    params.set('to', $('[data-filter-to]').value || todayIso());
    params.set('limit', $('[data-filter-limit]').value || '100');
    const itemId = $('[data-filter-item]').value;
    const locationId = $('[data-filter-location]').value;
    if (itemId) params.set('itemId', itemId);
    if (locationId) params.set('locationId', locationId);
    return params;
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
    el.textContent = message;
    el.dataset.statusType = type;
  }

  function fillSelect(select, rows, emptyLabel) {
    const current = select.value;
    select.innerHTML = `<option value="">${emptyLabel}</option>`;
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

  function renderBalance(rows) {
    state.balanceRows = rows || [];
    const tbody = $('[data-stock-report-balance] tbody');
    tbody.innerHTML = '';
    if (!rows?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Няма данни за избрания филтър.</td></tr>';
      return;
    }
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      if (Number(row.netQuantity) < 0) tr.classList.add('danger-row');
      tr.innerHTML = `
        <td>${text(row.itemLabel)}</td>
        <td>${text(row.locationLabel)}</td>
        <td class="num">${formatNumber(row.incoming)}</td>
        <td class="num">${formatNumber(row.outgoing)}</td>
        <td class="num strong">${formatNumber(row.netQuantity)}</td>
        <td class="num">${formatNumber(row.movements)}</td>
        <td>${formatDate(row.lastMovementDate)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMovements(rows) {
    state.movementRows = rows || [];
    const tbody = $('[data-stock-report-movements] tbody');
    tbody.innerHTML = '';
    if (!rows?.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">Няма движения за избрания филтър.</td></tr>';
      return;
    }
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      if (Number(row.signedQuantity) < 0) tr.classList.add('warn-row');
      tr.innerHTML = `
        <td>${formatDate(row.date)}</td>
        <td>${text(row.itemLabel)}</td>
        <td>${text(row.locationLabel)}</td>
        <td>${text(row.documentNo || row.documentId)}</td>
        <td>${text(row.movementType || row.status)}</td>
        <td class="num">${formatNumber(row.quantity)}</td>
        <td class="num strong">${formatNumber(row.signedQuantity)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderList(selector, rows, emptyLabel, valueKey) {
    const el = $(selector);
    el.innerHTML = '';
    if (!rows?.length) {
      el.innerHTML = `<p class="empty-list">${emptyLabel}</p>`;
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'stock-report-list-item';
      item.innerHTML = `
        <span>${text(row.itemLabel)}</span>
        <em>${text(row.locationLabel)}</em>
        <strong>${formatNumber(row[valueKey])}</strong>
      `;
      el.appendChild(item);
    });
  }

  async function loadOptions() {
    const params = buildQuery();
    const data = await fetchJson(`/api/stock/reports/options?${params.toString()}`);
    fillSelect($('[data-filter-location]'), data.locations || [], 'Всички обекти');
    fillSelect($('[data-filter-item]'), data.items || [], 'Всички артикули');
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
    setKpis(summary.summary || {});
    renderBalance(balance.rows || []);
    renderMovements(movements.rows || []);
    renderList('[data-stock-report-negative]', summary.topNegative || [], 'Няма отрицателни наличности в избрания период.', 'netQuantity');
    renderList('[data-stock-report-active]', summary.topMovement || [], 'Няма активност в избрания период.', 'movements');
    setStatus('Справките са заредени. Режимът е само за преглед.', 'ok');
  }

  function toCsv(rows) {
    const header = ['item', 'location', 'incoming', 'outgoing', 'netQuantity', 'movements', 'lastMovementDate'];
    const lines = [header.join(',')];
    rows.forEach((row) => {
      lines.push(header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    return lines.join('\n');
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(state.balanceRows)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-reports-${todayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function init() {
    $('[data-filter-from]').value = daysAgoIso(30);
    $('[data-filter-to]').value = todayIso();
    $('[data-stock-report-filters]').addEventListener('submit', async (event) => {
      event.preventDefault();
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
