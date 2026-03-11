-- Added OrderItem + CheckoutSession models and made Order.labTestId optional.

-- 1) Make labTestId nullable (backward-compatible)
ALTER TABLE "Order" ALTER COLUMN "labTestId" DROP NOT NULL;

-- 2) Enums
DO $$ BEGIN
  CREATE TYPE "OrderItemType" AS ENUM ('TEST', 'PANEL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CheckoutStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3) OrderItem table
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "OrderItemType" NOT NULL,
  "testId" TEXT,
  "panelId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_type_idx" ON "OrderItem"("type");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "TestPanel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) CheckoutSession table
CREATE TABLE IF NOT EXISTS "CheckoutSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "CheckoutStatus" NOT NULL DEFAULT 'DRAFT',
  "patientJson" JSONB NOT NULL,
  "insuranceJson" JSONB NOT NULL,
  "itemsJson" JSONB NOT NULL,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "processingFee" DOUBLE PRECISION NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CheckoutSession_userId_status_idx" ON "CheckoutSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "CheckoutSession_expiresAt_idx" ON "CheckoutSession"("expiresAt");

ALTER TABLE "CheckoutSession"
  ADD CONSTRAINT "CheckoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CheckoutSession"
  ADD CONSTRAINT "CheckoutSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
