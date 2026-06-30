// AutoGrand ERP V2 - Step 4.12.2 Inventory Planning Detail Inspector / Item Planning Drilldown
// Read-only routes. No document creation, no journal edit, no posting mutation.

import express from "express";
import {
  getInventoryPlanningItemDetail,
  getInventoryPlanningSnapshot,
} from "../services/inventory-planning-service.js";

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
      healthLabel: "4-12-2-inventory-planning-detail-inspector-item-drilldown",
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/inventory-planning/item/:itemCode", async (req, res, next) => {
  try {
    const detail = await getInventoryPlanningItemDetail(req.params.itemCode, routeOptions(req));
    if (!detail) {
      res.status(404).send("Inventory planning item not found");
      return;
    }

    res.render("pages/inventory-planning-item", {
      title: `${detail.item.itemCode} · Планиране на наличности`,
      moduleTitle: "Планиране на наличности",
      activeModule: "inventory-planning",
      healthLabel: "4-12-2-inventory-planning-detail-inspector-item-drilldown",
      detail,
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

router.get("/api/stock/inventory-planning/items/:itemCode", async (req, res, next) => {
  try {
    const detail = await getInventoryPlanningItemDetail(req.params.itemCode, routeOptions(req));
    if (!detail) {
      res.status(404).json({ ok: false, error: "INVENTORY_PLANNING_ITEM_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, detail });
  } catch (error) {
    next(error);
  }
});

router.get("/api/inventory-planning/items/:itemCode", async (req, res, next) => {
  try {
    const detail = await getInventoryPlanningItemDetail(req.params.itemCode, routeOptions(req));
    if (!detail) {
      res.status(404).json({ ok: false, error: "INVENTORY_PLANNING_ITEM_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, detail });
  } catch (error) {
    next(error);
  }
});

export default router;
