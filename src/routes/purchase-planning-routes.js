// AutoGrand ERP V2 - Step 4.13.3 Purchase Planning Detail Inspector / Supplier Recommendation Drilldown
// Read-only procurement routes. No document creation or stock journal mutation.

import express from "express";
import { getPurchasePlanningDecisionCenter } from "../services/purchase-planning-service.js";

const router = express.Router();

function routeOptions(req) {
  return {
    viewMode: req.query?.view,
    supplier: req.query?.supplier,
    lane: req.query?.lane,
  };
}

router.get("/purchase-planning", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.render("purchase-planning", {
      title: "Планиране на покупки · Supplier Recommendation Drilldown",
      moduleTitle: "Планиране на покупки",
      activeModule: "purchase-planning",
      healthLabel: decisionCenter.healthLabel,
      decisionCenter,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/purchase-planning/suppliers/:supplierKey", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter({
      ...routeOptions(req),
      supplier: req.params.supplierKey,
      inspectorMode: true,
    });
    res.render("purchase-planning", {
      title: `${decisionCenter.selectedSupplierName || "Доставчик"} · Procurement Supplier Drilldown`,
      moduleTitle: "Планиране на покупки",
      activeModule: "purchase-planning",
      healthLabel: decisionCenter.healthLabel,
      decisionCenter,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/procurement-decision-center", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.render("purchase-planning", {
      title: "Procurement Decision Center · Supplier Recommendation Drilldown",
      moduleTitle: "Планиране на покупки",
      activeModule: "purchase-planning",
      healthLabel: decisionCenter.healthLabel,
      decisionCenter,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/purchase-planning", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.json({ ok: true, decisionCenter });
  } catch (error) {
    next(error);
  }
});

router.get("/api/purchase-planning/suppliers/:supplierKey", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter({
      ...routeOptions(req),
      supplier: req.params.supplierKey,
      inspectorMode: true,
    });
    res.json({
      ok: true,
      decisionCenter,
      detailInspector: decisionCenter.detailInspector,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/procurement-decision-center", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.json({ ok: true, decisionCenter });
  } catch (error) {
    next(error);
  }
});

export default router;
