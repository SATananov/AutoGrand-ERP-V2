(() => {
  'use strict';

  const labels = {
    title: '\u0417\u0430\u0442\u0432\u0430\u0440\u044f\u043d\u0435 \u043d\u0430 Stock Control Center',
    subtitle: '\u0424\u0438\u043d\u0430\u043b\u0435\u043d QA \u0441\u043b\u043e\u0439: \u0447\u0435\u0442\u0438\u043c\u043e\u0441\u0442, \u043f\u0435\u0447\u0430\u0442, \u0432\u0440\u044a\u0437\u043a\u0438 \u0438 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u0438 read-only \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438.',
    safe: 'Read-only QA',
    noJournalEdit: '\u0411\u0435\u0437 \u0440\u044a\u0447\u043d\u0430 \u0440\u0435\u0434\u0430\u043a\u0446\u0438\u044f \u043d\u0430 stock journal',
    postedLocked: 'POSTED locked',
    correctionFlow: '\u041a\u043e\u0440\u0435\u043a\u0446\u0438\u044f\u0442\u0430 \u043c\u0438\u043d\u0430\u0432\u0430 \u043f\u0440\u0435\u0437 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442',
    inspectorReady: 'Inspector ready',
    stockCenter: '\u041a\u044a\u043c Stock Control Center',
    printQa: '\u041f\u0435\u0447\u0430\u0442 QA',
    copyQa: '\u041a\u043e\u043f\u0438\u0440\u0430\u0439 QA',
    copied: '\u041a\u043e\u043f\u0438\u0440\u0430\u043d\u043e',
    copiedFail: '\u041d\u0435 \u0435 \u043a\u043e\u043f\u0438\u0440\u0430\u043d\u043e'
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  function pageMatches() {
    const path = window.location.pathname || '';
    if (path.indexOf('/stock-control-center') !== -1) {
      return true;
    }
    return Boolean(
      document.querySelector('[data-ag-stock-inspector]') ||
      document.querySelector('[data-ag-step-4-9-4-toolbar]') ||
      document.querySelector('.ag-stock-inspector') ||
      document.querySelector('.ag-inspector-polish-toolbar')
    );
  }

  function mountTarget() {
    return document.querySelector('main') ||
      document.querySelector('.workspace-main') ||
      document.querySelector('.app-main') ||
      document.querySelector('.page-content') ||
      document.body;
  }

  async function copyQa(button) {
    const text = [
      'AutoGrand ERP V2',
      'Stock Control Center final QA closure',
      'Step 4.9.5',
      window.location.href,
      new Date().toLocaleString()
    ].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
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
        button.textContent = labels.copyQa;
      }, 1400);
    } catch (error) {
      button.textContent = labels.copiedFail;
      setTimeout(() => {
        button.textContent = labels.copyQa;
      }, 1800);
    }
  }

  function statusChip(text, kind) {
    const chip = document.createElement('span');
    chip.className = `ag-stock-closure-chip ag-stock-closure-chip-${kind}`;
    chip.textContent = text;
    return chip;
  }

  function addClosurePanel() {
    if (!pageMatches()) {
      return;
    }

    if (document.querySelector('[data-ag-step-4-9-5-closure]')) {
      return;
    }

    const mount = mountTarget();
    if (!mount) {
      return;
    }

    const panel = document.createElement('section');
    panel.className = 'ag-stock-closure-panel';
    panel.setAttribute('data-ag-step-4-9-5-closure', 'true');

    const left = document.createElement('div');
    left.className = 'ag-stock-closure-text';

    const title = document.createElement('h2');
    title.textContent = labels.title;

    const subtitle = document.createElement('p');
    subtitle.textContent = labels.subtitle;

    const chips = document.createElement('div');
    chips.className = 'ag-stock-closure-chips';
    chips.appendChild(statusChip(labels.safe, 'safe'));
    chips.appendChild(statusChip(labels.noJournalEdit, 'locked'));
    chips.appendChild(statusChip(labels.postedLocked, 'posted'));
    chips.appendChild(statusChip(labels.correctionFlow, 'flow'));
    chips.appendChild(statusChip(labels.inspectorReady, 'ready'));

    left.appendChild(title);
    left.appendChild(subtitle);
    left.appendChild(chips);

    const actions = document.createElement('div');
    actions.className = 'ag-stock-closure-actions';

    const center = document.createElement('a');
    center.href = '/stock-control-center';
    center.className = 'ag-stock-closure-action';
    center.textContent = labels.stockCenter;
    actions.appendChild(center);

    const print = document.createElement('button');
    print.type = 'button';
    print.className = 'ag-stock-closure-action';
    print.textContent = labels.printQa;
    print.addEventListener('click', () => window.print());
    actions.appendChild(print);

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ag-stock-closure-action';
    copy.textContent = labels.copyQa;
    copy.addEventListener('click', () => copyQa(copy));
    actions.appendChild(copy);

    panel.appendChild(left);
    panel.appendChild(actions);

    mount.insertBefore(panel, mount.firstChild);
    document.documentElement.classList.add('ag-step-4-9-5-stock-control-closure-ready');
  }

  ready(addClosurePanel);
})();
