(() => {
  'use strict';

  const STATE = {
    toolbarSelector: '[data-ag-step-4-9-4-toolbar]',
    pageHints: [
      'stock-control-center/inspect',
      'stock-control-detail-inspector'
    ]
  };

  const labels = {
    title: '\u0418\u043d\u0441\u043f\u0435\u043a\u0442\u043e\u0440 \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u043e\u0432 \u043a\u043e\u043d\u0442\u0440\u043e\u043b',
    subtitle: '\u0411\u044a\u0440\u0437\u0438 \u0432\u0440\u044a\u0437\u043a\u0438, QA \u043f\u0435\u0447\u0430\u0442 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0431\u0435\u0437 \u043f\u0440\u043e\u043c\u044f\u043d\u0430 \u043d\u0430 \u0436\u0443\u0440\u043d\u0430\u043b\u0430.',
    back: '\u041d\u0430\u0437\u0430\u0434 \u043a\u044a\u043c \u043a\u043e\u043d\u0442\u0440\u043e\u043b\u043d\u0438\u044f \u0446\u0435\u043d\u0442\u044a\u0440',
    print: '\u041f\u0435\u0447\u0430\u0442 / QA',
    copy: '\u041a\u043e\u043f\u0438\u0440\u0430\u0439 \u0440\u0435\u0444\u0435\u0440\u0435\u043d\u0446\u0438\u044f',
    copied: '\u041a\u043e\u043f\u0438\u0440\u0430\u043d\u043e',
    copiedFail: '\u041d\u0435 \u0435 \u043a\u043e\u043f\u0438\u0440\u0430\u043d\u043e',
    apiTrace: '\u041f\u0440\u0435\u0433\u043b\u0435\u0434 \u043d\u0430 API \u0441\u043b\u0435\u0434\u0430',
    quickLinks: '\u0411\u044a\u0440\u0437\u0438 \u0432\u0440\u044a\u0437\u043a\u0438 \u043a\u044a\u043c \u0442\u0435\u043a\u0443\u0449\u0438\u044f \u043f\u0440\u0435\u0433\u043b\u0435\u0434',
    noLinks: '\u041d\u044f\u043c\u0430 \u043e\u0442\u043a\u0440\u0438\u0442\u0438 \u0434\u043e\u043f\u044a\u043b\u043d\u0438\u0442\u0435\u043b\u043d\u0438 \u0432\u0440\u044a\u0437\u043a\u0438.',
    printFooter: '\u041f\u0435\u0447\u0430\u0442\u0435\u043d QA \u0438\u0437\u0433\u043b\u0435\u0434',
    status: '\u0421\u044a\u0441\u0442\u043e\u044f\u043d\u0438\u0435',
    posted: '\u041f\u0443\u0431\u043b\u0438\u043a\u0443\u0432\u0430\u043d / \u0437\u0430\u043a\u043b\u044e\u0447\u0435\u043d',
    draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0430',
    correction: '\u041a\u043e\u0440\u0435\u043a\u0446\u0438\u044f',
    reversal: '\u0421\u0442\u043e\u0440\u043d\u043e',
    readonly: 'Read-only'
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  function isInspectorPage() {
    const path = window.location.pathname || '';
    if (path.indexOf('/stock-control-center/inspect') !== -1) {
      return true;
    }
    if (document.querySelector('[data-ag-stock-inspector], .ag-stock-inspector, .stock-control-detail-inspector, .stock-control-detail')) {
      return true;
    }
    return STATE.pageHints.some((hint) => document.body && document.body.innerHTML.indexOf(hint) !== -1);
  }

  function findMount() {
    return document.querySelector('main') ||
      document.querySelector('.workspace-main') ||
      document.querySelector('.app-main') ||
      document.querySelector('.page-content') ||
      document.body;
  }

  function currentQuery() {
    const search = window.location.search || '';
    return search.charAt(0) === '?' ? search.slice(1) : search;
  }

  function buildApiHref() {
    const query = currentQuery();
    return query ? `/api/stock-control-center/inspect?${query}` : '/api/stock-control-center/inspect';
  }

  function uniqueAnchors() {
    const seen = new Set();
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const blocked = [
      '#',
      'javascript:',
      'mailto:',
      'tel:'
    ];

    return anchors
      .map((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim();
        return { href, text: text || href };
      })
      .filter((item) => item.href && !blocked.some((prefix) => item.href.toLowerCase().startsWith(prefix)))
      .filter((item) => {
        const key = `${item.href}|${item.text}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .filter((item) => item.href.indexOf('/stock-control-center') === -1 || item.href.indexOf('/inspect') !== -1)
      .slice(0, 8);
  }

  async function copyReference(button) {
    const reference = [
      labels.title,
      window.location.href,
      new Date().toLocaleString()
    ].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reference);
      } else {
        const field = document.createElement('textarea');
        field.value = reference;
        field.setAttribute('readonly', 'readonly');
        field.style.position = 'fixed';
        field.style.left = '-9999px';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      button.textContent = labels.copied;
      setTimeout(() => {
        button.textContent = labels.copy;
      }, 1500);
    } catch (error) {
      button.textContent = labels.copiedFail;
      setTimeout(() => {
        button.textContent = labels.copy;
      }, 1800);
    }
  }

  function renderQuickLinks(container) {
    const links = uniqueAnchors();
    const list = document.createElement('div');
    list.className = 'ag-inspector-polish-links';
    const title = document.createElement('strong');
    title.textContent = labels.quickLinks;
    list.appendChild(title);

    if (!links.length) {
      const empty = document.createElement('span');
      empty.className = 'ag-inspector-polish-empty';
      empty.textContent = labels.noLinks;
      list.appendChild(empty);
      container.appendChild(list);
      return;
    }

    links.forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.text;
      link.className = 'ag-inspector-polish-link';
      list.appendChild(link);
    });

    container.appendChild(list);
  }

  function addStatusBadges(toolbar) {
    const text = (document.body.textContent || '').toUpperCase();
    const box = document.createElement('div');
    box.className = 'ag-inspector-polish-badges';

    const badge = (value, kind) => {
      const item = document.createElement('span');
      item.className = `ag-inspector-polish-badge ag-inspector-polish-badge-${kind}`;
      item.textContent = value;
      box.appendChild(item);
    };

    badge(labels.readonly, 'safe');

    if (text.indexOf('POSTED') !== -1 || text.indexOf('LOCKED') !== -1) {
      badge(labels.posted, 'locked');
    }
    if (text.indexOf('DRAFT') !== -1) {
      badge(labels.draft, 'draft');
    }
    if (text.indexOf('CORRECTION') !== -1 || text.indexOf('\u041a\u041e\u0420\u0415\u041a\u0426') !== -1) {
      badge(labels.correction, 'correction');
    }
    if (text.indexOf('REVERSAL') !== -1 || text.indexOf('\u0421\u0422\u041e\u0420\u041d') !== -1) {
      badge(labels.reversal, 'reversal');
    }

    toolbar.appendChild(box);
  }

  function addPrintFooter() {
    if (document.querySelector('[data-ag-step-4-9-4-print-footer]')) {
      return;
    }

    const footer = document.createElement('div');
    footer.className = 'ag-inspector-polish-print-footer';
    footer.setAttribute('data-ag-step-4-9-4-print-footer', 'true');
    footer.textContent = `${labels.printFooter} | ${new Date().toLocaleString()} | ${window.location.href}`;
    document.body.appendChild(footer);
  }

  function ensureToolbar() {
    if (!isInspectorPage()) {
      return;
    }

    if (document.querySelector(STATE.toolbarSelector)) {
      return;
    }

    const mount = findMount();
    if (!mount) {
      return;
    }

    const toolbar = document.createElement('section');
    toolbar.className = 'ag-inspector-polish-toolbar';
    toolbar.setAttribute('data-ag-step-4-9-4-toolbar', 'true');

    const head = document.createElement('div');
    head.className = 'ag-inspector-polish-head';

    const textWrap = document.createElement('div');
    textWrap.className = 'ag-inspector-polish-title-wrap';

    const title = document.createElement('h2');
    title.textContent = labels.title;

    const subtitle = document.createElement('p');
    subtitle.textContent = labels.subtitle;

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);
    head.appendChild(textWrap);

    const actions = document.createElement('div');
    actions.className = 'ag-inspector-polish-actions';

    const back = document.createElement('a');
    back.className = 'ag-inspector-polish-action';
    back.href = '/stock-control-center';
    back.textContent = labels.back;
    actions.appendChild(back);

    const api = document.createElement('a');
    api.className = 'ag-inspector-polish-action';
    api.href = buildApiHref();
    api.textContent = labels.apiTrace;
    actions.appendChild(api);

    const print = document.createElement('button');
    print.type = 'button';
    print.className = 'ag-inspector-polish-action';
    print.textContent = labels.print;
    print.addEventListener('click', () => window.print());
    actions.appendChild(print);

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ag-inspector-polish-action';
    copy.textContent = labels.copy;
    copy.addEventListener('click', () => copyReference(copy));
    actions.appendChild(copy);

    head.appendChild(actions);
    toolbar.appendChild(head);

    addStatusBadges(toolbar);
    renderQuickLinks(toolbar);

    mount.insertBefore(toolbar, mount.firstChild);
    addPrintFooter();
    document.documentElement.classList.add('ag-step-4-9-4-inspector-polish-ready');
  }

  ready(ensureToolbar);
})();
