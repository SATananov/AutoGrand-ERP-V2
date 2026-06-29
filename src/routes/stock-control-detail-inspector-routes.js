import express from "express";
import { getStockControlDetailInspector } from "../services/stock-control-detail-inspector-service.js";

const router = express.Router();

function queryInput(req) {
  return {
    documentId: req.query.documentId || req.query.docId || req.query.id || "",
    documentNumber: req.query.documentNumber || req.query.docNumber || req.query.number || "",
    documentType: req.query.documentType || req.query.docType || req.query.type || "stock",
    movementId: req.query.movementId || req.query.stockMovementId || "",
    riskCode: req.query.riskCode || req.query.risk || "",
    filterCode: req.query.filterCode || req.query.filter || "",
    source: req.query.source || "stock-control-center",
    openUrl: req.query.openUrl || "",
  };
}

router.get("/api/stock-control-center/inspect", async (req, res, next) => {
  try {
    const inspector = await getStockControlDetailInspector(queryInput(req));
    res.json({ ok: true, inspector });
  } catch (error) {
    next(error);
  }
});

router.get("/stock-control-center/inspect", async (req, res, next) => {
  try {
    const inspector = await getStockControlDetailInspector(queryInput(req));
    res.render("pages/stock-control-detail-inspector", {
      title: "Stock Control Detail Inspector",
      activeModule: "stock-control-center",
      inspector,
      stepLabel: inspector.stepLabel,
      context: inspector.context,
      document: inspector.document,
      movements: inspector.movements,
      reversal: inspector.reversal,
      checklist: inspector.checklist,
      actions: inspector.actions,
      warnings: inspector.warnings,
      monetaLogic: inspector.monetaLogic,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
