// AutoGrand ERP V2 - Step 4.12.3 Inventory Planning Supplier / Purchase Recommendation View
// Read-only routes. No purchase document creation, no journal edit, no posting mutation.

import express from "express";
import {
  getInventoryPlanningItemDetail,
  getInventoryPlanningSnapshot,
  getInventoryPlanningSupplierDetail,
  getInventoryPlanningSupplierRecommendations,
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
      healthLabel: "4-12-3-inventory-planning-supplier-purchase-recommendation-view",
      snapshot,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/inventory-planning/suppliers", async (req, res, next) => {
  try {
    const supplierSnapshot = await getInventoryPlanningSupplierRecommendations(routeOptions(req));
    res.render("pages/inventory-planning-suppliers", {
      title: "Доставчици · Планиране на покупки",
      moduleTitle: "Планиране на наличности",
      activeModule: "inventory-planning",
      healthLabel: "4-12-3-inventory-planning-supplier-purchase-recommendation-view",
      supplierSnapshot,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/inventory-planning/suppliers/:supplierKey", async (req, res, next) => {
  try {
    const supplierDetail = await getInventoryPlanningSupplierDetail(req.params.supplierKey, routeOptions(req));
    if (!supplierDetail) {
      res.status(404).send("Inventory planning supplier not found");
      return;
    }

    res.render("pages/inventory-planning-supplier", {
      title: `${supplierDetail.supplier.supplierName} · Планиране на покупки`,
      moduleTitle: "Планиране на наличности",
      activeModule: "inventory-planning",
      healthLabel: "4-12-3-inventory-planning-supplier-purchase-recommendation-view",
      supplierDetail,
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
      healthLabel: "4-12-3-inventory-planning-supplier-purchase-recommendation-view",
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

router.get("/api/stock/inventory-planning/suppliers", async (req, res, next) => {
  try {
    const supplierSnapshot = await getInventoryPlanningSupplierRecommendations(routeOptions(req));
    res.json({ ok: true, supplierSnapshot });
  } catch (error) {
    next(error);
  }
});

router.get("/api/inventory-planning/suppliers", async (req, res, next) => {
  try {
    const supplierSnapshot = await getInventoryPlanningSupplierRecommendations(routeOptions(req));
    res.json({ ok: true, supplierSnapshot });
  } catch (error) {
    next(error);
  }
});

router.get("/api/stock/inventory-planning/suppliers/:supplierKey", async (req, res, next) => {
  try {
    const supplierDetail = await getInventoryPlanningSupplierDetail(req.params.supplierKey, routeOptions(req));
    if (!supplierDetail) {
      res.status(404).json({ ok: false, error: "INVENTORY_PLANNING_SUPPLIER_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, supplierDetail });
  } catch (error) {
    next(error);
  }
});

router.get("/api/inventory-planning/suppliers/:supplierKey", async (req, res, next) => {
  try {
    const supplierDetail = await getInventoryPlanningSupplierDetail(req.params.supplierKey, routeOptions(req));
    if (!supplierDetail) {
      res.status(404).json({ ok: false, error: "INVENTORY_PLANNING_SUPPLIER_NOT_FOUND" });
      return;
    }
    res.json({ ok: true, supplierDetail });
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
