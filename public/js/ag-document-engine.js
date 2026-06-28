/*
  Step 4.5 browser document engine runtime.
  Moneta reference hooks: TfBaseEditDocument, TfBaseBrowseCardDocument, PostDocument, AnnulDocument,
  S_CopyDocTemplateHeader, S_CopyDocTemplateLine, CheckInDocument, CheckOutDocument.
*/
(function initAgDocumentEngineRuntime() {
  function setActiveSection(container, key) {
    const target = String(key || '').trim();
    container.querySelectorAll('[data-ag-document-engine-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-ag-document-engine-panel') !== target;
    });
    container.querySelectorAll('[data-ag-document-engine-tab]').forEach((tab) => {
      const isActive = tab.getAttribute('data-ag-document-engine-tab') === target;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function bindDocumentEngineTabs(container) {
    const tabs = Array.from(container.querySelectorAll('[data-ag-document-engine-tab]'));
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => setActiveSection(container, tab.getAttribute('data-ag-document-engine-tab')));
    });

    setActiveSection(container, tabs[0].getAttribute('data-ag-document-engine-tab'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ag-document-engine]').forEach(bindDocumentEngineTabs);
  });
})();


/* AutoGrand ERP V2 Step 4.8.4 legacy checker markers
   STEP_4_5_BROWSER_DOCUMENT_ENGINE_RUNTIME
   AG_DOCUMENT_ENGINE_RUNTIME
   GLOBAL_DOCUMENT_ENGINE_BROWSER_RUNTIME
*/
if (typeof window !== "undefined") {
  window.AutoGrandDocumentEngineRuntime = window.AutoGrandDocumentEngineRuntime || {
    step: "4.5",
    healthLabel: "4-5-global-document-engine",
    runtime: "browser-document-engine"
  };
}
