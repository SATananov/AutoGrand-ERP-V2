// AutoGrand ERP V2 — Step 4.7.4 Stock Audit Resolution View
// Marker: AG_STEP_4_7_4_STOCK_AUDIT_RESOLUTION_ROUTE

import express from "express";
import {
  getStockEngineAudit,
  buildStockSnapshot,
  getStockAuditResolution
} from "../services/stock-engine-hardening-service.js";

const router = express.Router();

function buildSafeAuditFromError(error) {
  const message = error && error.message ? error.message : "Unknown stock hardening audit error.";
  return {
    ok: false,
    step: "4.7.4",
    healthLabel: "4-7-stock-engine-hardening",
    errors: [message],
    contract: { delegateName: null, fieldMap: {} },
    summary: {
      movementCount: 0,
      balanceCount: 0,
      negativeBalanceCount: 0,
      duplicateMovementCount: 0,
      limit: 0
    },
    balances: [],
    negativeBalances: [],
    duplicateMovements: [],
    negativeBalanceDetails: [],
    duplicateMovementDetails: [],
    resolutionSummary: { negativeIssueCount: 0, duplicateIssueCount: 0, blockingIssueCount: 0 },
    resolutionPlan: ["Провери Prisma модела за складови движения и имената на полетата за артикул, обект и количество."],
    monetaRules: [
      "posted-document-only-affects-stock",
      "no-silent-negative-stock",
      "one-document-line-one-stock-effect",
      "object-location-isolation",
      "ledger-is-source-of-truth",
      "reversal-instead-of-delete"
    ],
    recommendedNextActions: [
      "Провери Prisma модела за складови движения и имената на полетата за артикул, обект и количество."
    ]
  };
}

async function readAudit() {
  try {
    return await getStockEngineAudit({ limit: 50000 });
  } catch (error) {
    return buildSafeAuditFromError(error);
  }
}

async function readResolution() {
  try {
    return await getStockAuditResolution({ limit: 50000 });
  } catch (error) {
    const safeAudit = buildSafeAuditFromError(error);
    return {
      ok: false,
      step: "4.7.4",
      healthLabel: safeAudit.healthLabel,
      summary: safeAudit.summary,
      negativeBalanceDetails: [],
      duplicateMovementDetails: [],
      resolutionSummary: safeAudit.resolutionSummary,
      resolutionPlan: safeAudit.resolutionPlan,
      contract: safeAudit.contract,
      errors: safeAudit.errors
    };
  }
}

function renderViewWithFallback(res, viewNames, locals, index = 0, previousError = null) {
  const viewName = viewNames[index];
  if (!viewName) {
    const details = previousError && previousError.stack ? previousError.stack : String(previousError || "Unknown render error");
    return res.status(500).type("text/plain").send([
      "AutoGrand ERP V2 Step 4.7.4 view render repair could not find a stock hardening view.",
      "Expected one of: stock-hardening-audit, pages/stock-hardening-audit.",
      details
    ].join("\n"));
  }

  return res.render(viewName, locals, (error, html) => {
    if (!error) return res.send(html);
    return renderViewWithFallback(res, viewNames, locals, index + 1, error);
  });
}

router.get(["/stock-hardening", "/stock-hardening/"], async (_req, res) => {
  const audit = await readAudit();
  const resolution = await readResolution();
  const locals = {
    title: "Складов контрол",
    pageTitle: "Складов контрол",
    activeModule: "stock-hardening",
    activePage: "stock-hardening",
    step47Audit: audit,
    step47AuditJson: JSON.stringify(audit, null, 2),
    step47Resolution: resolution,
    step47ResolutionJson: JSON.stringify(resolution, null, 2)
  };

  return renderViewWithFallback(res, ["stock-hardening-audit", "pages/stock-hardening-audit"], locals);
});

router.get(["/api/stock/hardening/ping", "/api/stock/hardening/health"], (_req, res) => {
  res.json({ ok: true, step: "4.7.4", route: "stock-hardening", healthLabel: "4-7-stock-engine-hardening" });
});

router.get("/api/stock/hardening/audit", async (_req, res) => {
  const audit = await readAudit();
  res.json(audit);
});

router.get("/api/stock/hardening/resolution", async (_req, res) => {
  const resolution = await readResolution();
  res.json(resolution);
});

router.get("/api/stock/hardening/balances", async (_req, res) => {
  try {
    const snapshot = await buildStockSnapshot({ limit: 50000 });
    res.json({
      ok: snapshot.ok,
      step: snapshot.step,
      healthLabel: snapshot.healthLabel,
      summary: snapshot.summary,
      balances: snapshot.balances,
      negativeBalances: snapshot.negativeBalances,
      negativeBalanceDetails: snapshot.negativeBalanceDetails || []
    });
  } catch (error) {
    res.status(200).json(buildSafeAuditFromError(error));
  }
});

export default router;
