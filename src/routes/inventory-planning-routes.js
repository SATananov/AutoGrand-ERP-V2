// AutoGrand ERP V2 - Step 4.12.1 Inventory Planning UI Polish / Manager Dashboard Refinement
// Read-only routes. No document creation, no journal edit, no posting mutation.

import express from "express";
import { getInventoryPlanningSnapshot } from "../services/inventory-planning-service.js";

const router = express.Router();

function routeOptions(req) {
  return {
    viewMode: req.query?.view,
  };
}

router.get("/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot(routeOptions(req));
    res.render("pages/inventory-planning", {
      title: "Планиране на наличности",
      moduleTitle: "Планиране на наличности",
      activeModule: "inventory-planning",
      healthLabel: "4-12-1-inventory-planning-ui-polish-manager-dashboard",
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/stock/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot(routeOptions(req));
    res.json({ ok: true, snapshot });
  } catch (error) {
    next(error);
  }
});

router.get("/api/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot(routeOptions(req));
    res.json({ ok: true, snapshot });
  } catch (error) {
    next(error);
  }
});

export default router;
