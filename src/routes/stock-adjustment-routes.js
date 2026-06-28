// AutoGrand ERP V2 — Step 4.8 Stock Correction / Adjustment Document Foundation
// Marker: AG_STEP_4_8_STOCK_ADJUSTMENT_FOUNDATION_ROUTE

import express from "express";
import {
  getStockAdjustmentFoundation,
  previewStockAdjustmentDocument,
  buildStockAdjustmentDraftFromIssue
} from "../services/stock-adjustment-service.js";

const router = express.Router();

function buildSafeFoundationFromError(error) {
  const message = error && error.message ? error.message : "Unknown stock adjustment foundation error.";
  return {
    ok: false,
    step: "4.8",
    healthLabel: "4-8-stock-correction-adjustment-foundation",
    pageTitle: "Складови корекции",
    errors: [message],
    documentTypes: [],
    reasonCodes: [],
    statusFlow: [],
    monetaRules: [
      "Корекцията е отделен документ, не ръчна промяна в складовия журнал.",
      "Публикуваната корекция създава ново складово движение; старото движение не се изтрива тихо."
    ],
    storage: { ok: false, canPersistAdjustmentDocuments: false, note: message },
    auditSummary: {},
    resolutionSummary: { negativeIssueCount: 0, duplicateIssueCount: 0, blockingIssueCount: 0 },
    suggestedDrafts: [],
    endpoints: {
      page: "/stock-adjustments",
      foundation: "/api/stock/adjustments/foundation",
      preview: "/api/stock/adjustments/preview",
      fromIssue: "/api/stock/adjustments/from-issue",
      stockAudit: "/stock-hardening"
    }
  };
}

async function readFoundation() {
  try {
    return await getStockAdjustmentFoundation({ limit: 24 });
  } catch (error) {
    return buildSafeFoundationFromError(error);
  }
}

function renderViewWithFallback(res, viewNames, locals, index = 0, previousError = null) {
  const viewName = viewNames[index];
  if (!viewName) {
    const details = previousError && previousError.stack ? previousError.stack : String(previousError || "Unknown render error");
    return res.status(500).type("text/plain").send([
      "AutoGrand ERP V2 Step 4.8 view render could not find the stock adjustments view.",
      "Expected one of: stock-adjustments, pages/stock-adjustments.",
      details
    ].join("\n"));
  }

  return res.render(viewName, locals, (error, html) => {
    if (!error) return res.send(html);
    return renderViewWithFallback(res, viewNames, locals, index + 1, error);
  });
}

router.get(["/stock-adjustments", "/stock-adjustments/"], async (_req, res) => {
  const foundation = await readFoundation();
  const locals = {
    title: "Складови корекции",
    pageTitle: "Складови корекции",
    activeModule: "stock-adjustments",
    activePage: "stock-adjustments",
    step48Foundation: foundation,
    step48FoundationJson: JSON.stringify(foundation, null, 2)
  };

  return renderViewWithFallback(res, ["stock-adjustments", "pages/stock-adjustments"], locals);
});

router.get(["/api/stock/adjustments/ping", "/api/stock/adjustments/health"], (_req, res) => {
  res.json({ ok: true, step: "4.8", route: "stock-adjustments", healthLabel: "4-8-stock-correction-adjustment-foundation" });
});

router.get("/api/stock/adjustments/foundation", async (_req, res) => {
  const foundation = await readFoundation();
  res.json(foundation);
});

router.post("/api/stock/adjustments/preview", (req, res) => {
  const preview = previewStockAdjustmentDocument(req.body || {});
  res.status(preview.ok ? 200 : 400).json(preview);
});

router.post("/api/stock/adjustments/from-issue", (req, res) => {
  const draft = buildStockAdjustmentDraftFromIssue(req.body || {});
  res.status(draft.ok ? 200 : 400).json(draft);
});

export default router;
