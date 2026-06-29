// AutoGrand ERP V2 - Step 4.12 Inventory Planning / Reorder Suggestions Foundation
// Read-only routes. No document creation, no journal edit, no posting mutation.

import express from "express";
import { getInventoryPlanningSnapshot } from "../services/inventory-planning-service.js";

const router = express.Router();

router.get("/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot();
    res.render("pages/inventory-planning", {
      title: "Планиране на наличности",
      moduleTitle: "Планиране на наличности",
      activeModule: "inventory-planning",
      healthLabel: "4-12-inventory-planning-reorder-suggestions-foundation",
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/stock/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot();
    res.json({ ok: true, snapshot });
  } catch (error) {
    next(error);
  }
});

router.get("/api/inventory-planning", async (req, res, next) => {
  try {
    const snapshot = await getInventoryPlanningSnapshot();
    res.json({ ok: true, snapshot });
  } catch (error) {
    next(error);
  }
});

export default router;
