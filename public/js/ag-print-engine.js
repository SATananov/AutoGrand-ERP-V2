/*
  Step 4.6 browser print engine runtime
  Moneta print hooks:
  PrintSelect / GetPrintDocument / GetPrintDocumentType / PrintPostedDocument / SelectPrintFormGeneral
  AfterPrintDocument / PrintTXT / PrintLabel / BarcodeCallBack / frxExportPDF / frxExportXLSX
*/
(function () {
  function setActiveTab(root, tabName) {
    const tabs = root.querySelectorAll('[data-ag-print-engine-tab]');
    const panels = root.querySelectorAll('[data-ag-print-engine-panel]');

    tabs.forEach((tab) => {
      const active = tab.getAttribute('data-ag-print-engine-tab') === tabName;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const active = panel.getAttribute('data-ag-print-engine-panel') === tabName;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  function bindPrintEngine(root) {
    const firstTab = root.querySelector('[data-ag-print-engine-tab]');
    if (firstTab) setActiveTab(root, firstTab.getAttribute('data-ag-print-engine-tab'));

    root.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-ag-print-engine-tab]');
      if (!tab || !root.contains(tab)) return;
      setActiveTab(root, tab.getAttribute('data-ag-print-engine-tab'));
    });

    root.addEventListener('click', (event) => {
      const preview = event.target.closest('[data-ag-print-preview-demo]');
      if (!preview || !root.contains(preview)) return;
      const formCode = preview.getAttribute('data-ag-print-preview-demo') || 'PRINT_FORM';
      const status = root.querySelector('[data-ag-print-engine-status]');
      if (status) {
        status.textContent = `Preview готов за ${formCode} · SelectPrintFormGeneral → GetPrintDocument → Print`;
      }
    });
  }

  function boot() {
    document.querySelectorAll('[data-ag-print-engine]').forEach(bindPrintEngine);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
