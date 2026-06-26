-- CreateTable
CREATE TABLE "PurchaseDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" INTEGER,
    "warehouseId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalNet" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Counterparty" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseDocument_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseDocumentLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "warehouseId" INTEGER,
    "quantity" REAL NOT NULL DEFAULT 1,
    "price" REAL NOT NULL DEFAULT 0,
    "lineTotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseDocumentLine_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PurchaseDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseDocumentLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseDocumentLine_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "warehouseId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "reservedQuantity" REAL NOT NULL DEFAULT 0,
    "avgCost" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockBalance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "movementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseId" INTEGER,
    "itemId" INTEGER,
    "quantity" REAL NOT NULL DEFAULT 0,
    "direction" TEXT NOT NULL,
    "reason" TEXT,
    "sourceDocument" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" INTEGER,
    "counterpartyId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "problemDescription" TEXT,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrder_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceOrderLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceOrderId" INTEGER NOT NULL,
    "itemId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "price" REAL NOT NULL DEFAULT 0,
    "lineTotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ServiceOrderLine_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceOrderLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseDocument_number_key" ON "PurchaseDocument"("number");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_warehouseId_itemId_key" ON "StockBalance"("warehouseId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_number_key" ON "StockMovement"("number");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_number_key" ON "ServiceOrder"("number");
