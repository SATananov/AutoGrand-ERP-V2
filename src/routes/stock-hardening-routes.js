// AutoGrand ERP V2 — Step 4.7.3 Stock Engine Hardening view lookup repair
// Marker: AG_STEP_4_7_3_STOCK_ENGINE_HARDENING_VIEW_LOOKUP_REPAIR

import express from "express";
import { getStockEngineAudit, buildStockSnapshot } from "../services/stock-engine-hardening-service.js";

const router = express.Router();

function buildSafeAuditFromError(error) {
  const message = error && error.message ? error.message : "Unknown stock hardening audit error.";
  return {
    ok: false,
    step: "4.7",
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

function renderViewWithFallback(res, viewNames, locals, index = 0, previousError = null) {
  const viewName = viewNames[index];
  if (!viewName) {
    const details = previousError && previousError.stack ? previousError.stack : String(previousError || "Unknown render error");
    return res.status(500).type("text/plain").send([
      "AutoGrand ERP V2 Step 4.7.3 view render repair could not find a stock hardening view.",
      "Expected one of: stock-hardening-audit, pages/stock-hardening-audit.",
      details
    ].join("\n"));
  }

  return res.render(viewName, locals, (error, html) => {
    if (!error) {
      return res.send(html);
    }
    return renderViewWithFallback(res, viewNames, locals, index + 1, error);
  });
}

router.get(["/stock-hardening", "/stock-hardening/"], async (_req, res) => {
  const audit = await readAudit();
  const locals = {
    title: "Складов контрол",
    pageTitle: "Складов контрол",
    activeModule: "stock-hardening",
    activePage: "stock-hardening",
    step47Audit: audit,
    step47AuditJson: JSON.stringify(audit, null, 2)
  };

  return renderViewWithFallback(res, ["stock-hardening-audit", "pages/stock-hardening-audit"], locals);
});

router.get(["/api/stock/hardening/ping", "/api/stock/hardening/health"], (_req, res) => {
  res.json({ ok: true, step: "4.7.3", route: "stock-hardening", healthLabel: "4-7-stock-engine-hardening" });
});

router.get("/api/stock/hardening/audit", async (_req, res) => {
  const audit = await readAudit();
  res.json(audit);
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
      negativeBalances: snapshot.negativeBalances
    });
  } catch (error) {
    res.status(200).json(buildSafeAuditFromError(error));
  }
});

export default router;
