-- Step 2.6.1 — Company locations / warehouses / trade objects foundation.
-- Adds a common location layer for offices, central warehouses, regional warehouses and trade objects.

CREATE TABLE "CompanyLocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SHOP',
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "companyId" INTEGER,
    "canHoldStock" BOOLEAN NOT NULL DEFAULT true,
    "canSell" BOOLEAN NOT NULL DEFAULT false,
    "canReceivePurchases" BOOLEAN NOT NULL DEFAULT true,
    "canTransfer" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CompanyLocation_code_key" ON "CompanyLocation"("code");
CREATE INDEX "CompanyLocation_type_idx" ON "CompanyLocation"("type");
CREATE INDEX "CompanyLocation_city_idx" ON "CompanyLocation"("city");
CREATE INDEX "CompanyLocation_companyId_idx" ON "CompanyLocation"("companyId");

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "locationId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warehouse_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "CompanyLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Warehouse" ("id", "code", "name", "city", "isActive", "createdAt")
SELECT "id", "code", "name", "city", "isActive", "createdAt" FROM "Warehouse";

DROP TABLE "Warehouse";
ALTER TABLE "new_Warehouse" RENAME TO "Warehouse";

CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE UNIQUE INDEX "Warehouse_locationId_key" ON "Warehouse"("locationId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
