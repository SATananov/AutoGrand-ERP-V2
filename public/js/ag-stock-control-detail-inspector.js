(function () {
  "use strict";

  var STEP_MARKER = "ag-stock-control-detail-inspector-step-4-9-3";

  function isStockControlPage() {
    var path = window.location.pathname || "";
    return path.indexOf("stock-control") !== -1 || path.indexOf("stock-hardening") !== -1;
  }

  function textOf(node) {
    return (node && node.textContent ? node.textContent : "").trim();
  }

  function inferTypeFromHref(href) {
    var value = String(href || "").toLowerCase();
    if (value.indexOf("adjust") !== -1 || value.indexOf("correction") !== -1) return "stock-adjustment";
    if (value.indexOf("transfer") !== -1) return "stock-transfer";
    if (value.indexOf("purchase") !== -1 || value.indexOf("delivery") !== -1) return "purchase";
    if (value.indexOf("sale") !== -1) return "sales";
    if (value.indexOf("movement") !== -1 || value.indexOf("journal") !== -1) return "stock-movement";
    return "stock";
  }

  function inferIdFromHref(href) {
    var value = String(href || "");
    var matches = value.match(/\/(\d+)(?:[/?#]|$)/g);
    if (!matches || !matches.length) return "";
    var last = matches[matches.length - 1].replace(/\D/g, "");
    return last || "";
  }

  function nearestContext(anchor) {
    return anchor.closest("tr, .ag-risk-card, .ag-risk-panel, .ag-panel, .ag-card, .ag-table-row, [data-risk-code], [data-document-id], [data-doc-id]") || anchor.parentElement;
  }

  function contextFrom(anchor) {
    var box = nearestContext(anchor);
    var data = (box && box.dataset) || {};
    var href = anchor.getAttribute("href") || "";
    return {
      documentId: data.documentId || data.docId || data.id || anchor.dataset.documentId || anchor.dataset.docId || inferIdFromHref(href),
      documentNumber: data.documentNumber || data.docNumber || anchor.dataset.documentNumber || anchor.dataset.docNumber || "",
      movementId: data.movementId || data.stockMovementId || anchor.dataset.movementId || anchor.dataset.stockMovementId || "",
      documentType: data.documentType || data.docType || anchor.dataset.documentType || anchor.dataset.docType || inferTypeFromHref(href),
      riskCode: data.riskCode || anchor.dataset.riskCode || "",
      filterCode: data.filterCode || anchor.dataset.filterCode || "",
      source: "stock-control-center",
      openUrl: href
    };
  }

  function inspectorUrl(context) {
    var params = new URLSearchParams();
    Object.keys(context).forEach(function (key) {
      if (context[key]) params.set(key, context[key]);
    });
    return "/stock-control-center/inspect?" + params.toString();
  }

  function looksLikeDocumentAnchor(anchor) {
    var href = anchor.getAttribute("href") || "";
    if (!href || href.charAt(0) !== "/") return false;
    if (href.indexOf("/stock-control-center/inspect") === 0) return false;
    if (/stock-(adjustments|transfers|hardening|control|movement|journal)/i.test(href)) return true;
    if (/(sales|purchase|delivery|document)/i.test(href)) return true;
    return Boolean(anchor.dataset.documentId || anchor.dataset.docId || anchor.dataset.movementId || anchor.closest("[data-document-id], [data-doc-id], [data-movement-id], [data-risk-code]"));
  }

  function addInspectorLink(anchor) {
    var box = nearestContext(anchor);
    if (!box || box.querySelector("." + STEP_MARKER)) return;
    var context = contextFrom(anchor);
    if (!context.documentId && !context.documentNumber && !context.movementId && !context.openUrl) return;

    var link = document.createElement("a");
    link.className = "ag-button ag-button--ghost ag-button--tiny " + STEP_MARKER;
    link.href = inspectorUrl(context);
    link.textContent = "Инспектор";
    link.setAttribute("data-ag-safe-action", "detail-inspector");
    link.setAttribute("title", "Read-only drilldown към документ, movement trace и safe actions");

    var actionCell = box.querySelector("td:last-child, .ag-actions, .ag-card-actions, .ag-risk-actions, .action-strip");
    if (actionCell) {
      actionCell.appendChild(link);
    } else {
      box.appendChild(link);
    }
  }

  function enhanceStockControlDrilldown() {
    if (!isStockControlPage()) return;
    document.querySelectorAll("a[href]").forEach(function (anchor) {
      if (looksLikeDocumentAnchor(anchor)) addInspectorLink(anchor);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceStockControlDrilldown);
  } else {
    enhanceStockControlDrilldown();
  }
})();
