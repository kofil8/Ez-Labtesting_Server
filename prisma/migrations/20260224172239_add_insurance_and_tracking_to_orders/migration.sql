-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currentTrackingStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "hasInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceGroupNumber" VARCHAR(100),
ADD COLUMN     "insuranceMemberId" VARCHAR(100),
ADD COLUMN     "insuranceProvider" VARCHAR(100),
ADD COLUMN     "lastNotificationAt" TIMESTAMP(3),
ADD COLUMN     "notificationsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "policyholderRelationship" VARCHAR(50),
ADD COLUMN     "trackingUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrderTrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "message" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_orderId_createdAt_idx" ON "OrderTrackingEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_step_status_idx" ON "OrderTrackingEvent"("step", "status");

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- AddForeignKey
ALTER TABLE "OrderTrackingEvent" ADD CONSTRAINT "OrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
