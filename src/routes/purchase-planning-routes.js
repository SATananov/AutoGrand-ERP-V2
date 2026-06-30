// AutoGrand ERP V2 - Step 4.13 Purchase Planning / Procurement Decision Center Foundation
// Read-only procurement routes. No document creation or stock journal mutation.

import express from "express";
import { getPurchasePlanningDecisionCenter } from "../services/purchase-planning-service.js";

const router = express.Router();

function routeOptions(req) {
  return {
    viewMode: req.query?.view,
    supplier: req.query?.supplier,
  };
}

router.get("/purchase-planning", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.render("pages/purchase-planning", {
      title: "Планиране на покупки · Procurement Center",
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
    res.render("pages/purchase-planning", {
      title: "Procurement Decision Center",
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

router.get("/api/procurement-decision-center", async (req, res, next) => {
  try {
    const decisionCenter = await getPurchasePlanningDecisionCenter(routeOptions(req));
    res.json({ ok: true, decisionCenter });
  } catch (error) {
    next(error);
  }
});

export default router;
