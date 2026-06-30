import express from "express";
import {
  buildStockAdjustmentFromIssuePreview,
  createStockAdjustmentReversalDraft,
  createDraftFromIssue,
  createStockAdjustmentDraft,
  deleteStockAdjustmentLine,
  getStockAdjustmentAuditStatus,
  getStockAdjustmentDocument,
  getStockAdjustmentFoundationStatus,
  getStockAdjustmentMovementBindingStatus,
  getStockAdjustmentMovementTrace,
  listStockAdjustmentDocuments,
  pingStockAdjustments,
  postStockAdjustmentDocument,
  previewStockAdjustment,
  previewStockAdjustmentReversalDraft,
  upsertStockAdjustmentLine
} from "../services/stock-adjustment-service.js";

const router = express.Router();

function sendOk(res, payload) {
  res.json({ ok: true, ...payload });
}

function sendError(res, error) {
  const status = Number(error.statusCode || error.status || 500);
  res.status(status).json({
    ok: false,
    error: error.message || "Unexpected stock adjustment error"
  });
}

router.get("/stock-adjustments", async (req, res, next) => {
  try {
    const foundation = await getStockAdjustmentFoundationStatus();
    const documents = await listStockAdjustmentDocuments({ limit: 30 });
    res.render("stock-adjustments", {
      title: "РЎРєР»Р°РґРѕРІРё РєРѕСЂРµРєС†РёРё",
      pageTitle: "РЎРєР»Р°РґРѕРІРё РєРѕСЂРµРєС†РёРё",
      currentPath: req.path,
      foundation,
      initialDocumentsJson: JSON.stringify(documents),
      initialBindingJson: JSON.stringify(foundation.movementBinding || null)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/stock/adjustments/ping", async (req, res) => {
  try {
    sendOk(res, await pingStockAdjustments());
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/foundation", async (req, res) => {
  try {
    sendOk(res, { foundation: await getStockAdjustmentFoundationStatus() });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/movement-binding", async (req, res) => {
  try {
    sendOk(res, { movementBinding: await getStockAdjustmentMovementBindingStatus({ limit: req.query.limit }) });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/preview", (req, res) => {
  try {
    sendOk(res, { preview: previewStockAdjustment(req.body || {}) });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/from-issue", (req, res) => {
  try {
    sendOk(res, { adjustment: buildStockAdjustmentFromIssuePreview(req.body || {}) });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/from-issue/persist", async (req, res) => {
  try {
    const document = await createDraftFromIssue(req.body || {});
    sendOk(res, { document });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/documents", async (req, res) => {
  try {
    const documents = await listStockAdjustmentDocuments({
      status: req.query.status,
      limit: req.query.limit
    });
    sendOk(res, { documents });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/documents", async (req, res) => {
  try {
    const document = await createStockAdjustmentDraft(req.body || {});
    res.status(201).json({ ok: true, document });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/documents/:id", async (req, res) => {
  try {
    const document = await getStockAdjustmentDocument(req.params.id);
    if (!document) return res.status(404).json({ ok: false, error: "Р”РѕРєСѓРјРµРЅС‚СЉС‚ РЅРµ Рµ РЅР°РјРµСЂРµРЅ." });
    sendOk(res, { document });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/documents/:id/movement-trace", async (req, res) => {
  try {
    const trace = await getStockAdjustmentMovementTrace(req.params.id);
    sendOk(res, trace);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/documents/:id/audit", async (req, res) => {
  try {
    const audit = await getStockAdjustmentAuditStatus(req.params.id, { limit: req.query.limit });
    sendOk(res, audit);
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/api/stock/adjustments/documents/:id/reversal-preview", async (req, res) => {
  try {
    const preview = await previewStockAdjustmentReversalDraft(req.params.id);
    sendOk(res, preview);
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/documents/:id/reversal-draft", async (req, res) => {
  try {
    const document = await createStockAdjustmentReversalDraft(req.params.id, req.body || {});
    res.status(201).json({ ok: true, document });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/documents/:id/lines", async (req, res) => {
  try {
    const document = await upsertStockAdjustmentLine(req.params.id, req.body || {});
    sendOk(res, { document });
  } catch (error) {
    sendError(res, error);
  }
});

router.put("/api/stock/adjustments/documents/:id/lines/:lineId", async (req, res) => {
  try {
    const document = await upsertStockAdjustmentLine(req.params.id, {
      ...(req.body || {}),
      lineId: req.params.lineId
    });
    sendOk(res, { document });
  } catch (error) {
    sendError(res, error);
  }
});

router.delete("/api/stock/adjustments/documents/:id/lines/:lineId", async (req, res) => {
  try {
    const document = await deleteStockAdjustmentLine(req.params.id, req.params.lineId);
    sendOk(res, { document });
  } catch (error) {
    sendError(res, error);
  }
});

router.post("/api/stock/adjustments/documents/:id/post", async (req, res) => {
  try {
    const result = await postStockAdjustmentDocument(req.params.id, req.body || {});
    sendOk(res, result);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;

// Step 4.8.5 compatibility marker: stock adjustment operator workflow hardening UI is active.
// STEP_4_8_5_OPERATOR_WORKFLOW_HARDENING
