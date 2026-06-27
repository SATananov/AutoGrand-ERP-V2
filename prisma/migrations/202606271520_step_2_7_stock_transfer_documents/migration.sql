-- AutoGrand ERP V2 Step 2.7 — Stock Transfer Document Card
CREATE TABLE "StockTransferDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "transferDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromWarehouseId" INTEGER NOT NULL,
    "toWarehouseId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "StockTransferDocument_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockTransferDocument_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "StockTransferLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "quantity" REAL NOT NULL DEFAULT 1,
    "note" TEXT,
    CONSTRAINT "StockTransferLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "StockTransferDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockTransferLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StockTransferDocument_number_key" ON "StockTransferDocument"("number");
CREATE INDEX "StockTransferDocument_status_idx" ON "StockTransferDocument"("status");
CREATE INDEX "StockTransferDocument_transferDate_idx" ON "StockTransferDocument"("transferDate");
CREATE INDEX "StockTransferDocument_fromWarehouseId_idx" ON "StockTransferDocument"("fromWarehouseId");
CREATE INDEX "StockTransferDocument_toWarehouseId_idx" ON "StockTransferDocument"("toWarehouseId");
CREATE INDEX "StockTransferLine_documentId_idx" ON "StockTransferLine"("documentId");
CREATE INDEX "StockTransferLine_itemId_idx" ON "StockTransferLine"("itemId");
