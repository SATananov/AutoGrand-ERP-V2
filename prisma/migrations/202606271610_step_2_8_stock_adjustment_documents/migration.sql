-- AutoGrand ERP V2 Step 2.8 — Stock Adjustment Document Card
CREATE TABLE "StockAdjustmentDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "adjustmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" INTEGER NOT NULL,
    "adjustmentType" TEXT NOT NULL DEFAULT 'CORRECTION_IN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "StockAdjustmentDocument_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "StockAdjustmentLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "quantity" REAL NOT NULL DEFAULT 1,
    "direction" TEXT NOT NULL DEFAULT 'IN',
    "reason" TEXT,
    "note" TEXT,
    CONSTRAINT "StockAdjustmentLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StockAdjustmentDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustmentLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StockAdjustmentDocument_number_key" ON "StockAdjustmentDocument"("number");
CREATE INDEX "StockAdjustmentDocument_status_idx" ON "StockAdjustmentDocument"("status");
CREATE INDEX "StockAdjustmentDocument_adjustmentDate_idx" ON "StockAdjustmentDocument"("adjustmentDate");
CREATE INDEX "StockAdjustmentDocument_warehouseId_idx" ON "StockAdjustmentDocument"("warehouseId");
CREATE INDEX "StockAdjustmentDocument_adjustmentType_idx" ON "StockAdjustmentDocument"("adjustmentType");
CREATE INDEX "StockAdjustmentLine_documentId_idx" ON "StockAdjustmentLine"("documentId");
CREATE INDEX "StockAdjustmentLine_itemId_idx" ON "StockAdjustmentLine"("itemId");
CREATE INDEX "StockAdjustmentLine_direction_idx" ON "StockAdjustmentLine"("direction");
