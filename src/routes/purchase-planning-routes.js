// AutoGrand ERP V2 - Step 4.13.4 Purchase Planning Purchase Draft Preparation / Manual Procurement Handoff
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
      title: "Планиране на покупки · Manual Procurement Handoff",
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
      title: `${decisionCenter.selectedSupplierName || "Доставчик"} · Manual Procurement Handoff`,
      moduleTitle: "Планиране на покупки",
      activeModule: "purchase-planning",
      healthLabel: decisionCenter.healthLabel,
      decisionCenter,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/purchase-planning/suppliers/:supplierKey/handoff", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter({
      ...routeOptions(req),
      supplier: req.params.supplierKey,
      inspectorMode: true,
      handoffMode: true,
    });
    res.render("purchase-planning", {
      title: `${decisionCenter.selectedSupplierName || "Доставчик"} · Purchase Draft Preparation`,
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
      title: "Procurement Decision Center · Manual Procurement Handoff",
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

router.get("/api/purchase-planning/suppliers/:supplierKey/handoff", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter({
      ...routeOptions(req),
      supplier: req.params.supplierKey,
      inspectorMode: true,
      handoffMode: true,
    });
    res.json({
      ok: true,
      decisionCenter,
      draftPreparation: decisionCenter.purchaseDraftPreparation,
      guardrails: decisionCenter.purchaseDraftPreparation?.guardrails || decisionCenter.guardrails,
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
