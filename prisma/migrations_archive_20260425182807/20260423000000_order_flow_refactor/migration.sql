-- CreateEnum
CREATE TYPE "PromoCodeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PromoPricingStrategy" AS ENUM ('PRICING_FLOOR', 'PURE_DISCOUNT');

-- CreateEnum
CREATE TYPE "OrderTrackingEventType" AS ENUM ('CART_VALIDATED', 'ORDER_CREATED', 'PAYMENT_INTENT_CREATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'USER_CONFIRMED_ORDER', 'LAB_SUBMISSION_STARTED', 'LAB_SUBMISSION_SUCCEEDED', 'LAB_SUBMISSION_FAILED', 'REQUISITION_CREATED', 'SUPPORT_TICKET_CREATED', 'ADMIN_RESEND_TRIGGERED');

-- CreateEnum
CREATE TYPE "TrackingActorType" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM', 'WORKER', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "SupportTicketReasonCode" AS ENUM ('GENERAL_REQUEST', 'LAB_SUBMISSION_FAILURE', 'PAYMENT_ISSUE', 'REQUISITION_ISSUE', 'ADMIN_REVIEW_REQUEST');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('CART', 'PENDING_PATIENT_INFO', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAID', 'AWAITING_USER_CONFIRMATION', 'READY_FOR_LAB_SUBMISSION', 'LAB_SUBMISSION_IN_PROGRESS', 'LAB_SUBMISSION_FAILED', 'MANUAL_REVIEW_REQUIRED', 'SUBMITTED_TO_LAB', 'REQUISITION_READY', 'COMPLETED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "orderStatus" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "orderStatus" TYPE "OrderStatus_new" USING ("orderStatus"::text::"OrderStatus_new");
ALTER TABLE "OrderTrackingEvent" ALTER COLUMN "previousStatus" TYPE "OrderStatus_new" USING ("previousStatus"::text::"OrderStatus_new");
ALTER TABLE "OrderTrackingEvent" ALTER COLUMN "nextStatus" TYPE "OrderStatus_new" USING ("nextStatus"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "orderStatus" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'REQUIRES_ACTION');
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RequisitionStatus_new" AS ENUM ('PENDING', 'RECEIVED', 'FILE_STORED', 'READY', 'FAILED', 'CANCELLED');
ALTER TABLE "Requisition" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Requisition" ALTER COLUMN "status" TYPE "RequisitionStatus_new" USING ("status"::text::"RequisitionStatus_new");
ALTER TYPE "RequisitionStatus" RENAME TO "RequisitionStatus_old";
ALTER TYPE "RequisitionStatus_new" RENAME TO "RequisitionStatus";
DROP TYPE "RequisitionStatus_old";
ALTER TABLE "Requisition" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupportTicketStatus" ADD VALUE 'AWAITING_ADMIN';
ALTER TYPE "SupportTicketStatus" ADD VALUE 'WAITING_FOR_CUSTOMER';

-- DropIndex
DROP INDEX "OrderTrackingEvent_step_status_idx";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "price",
ADD COLUMN     "baseRetailPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "currency" CHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "drawCenterId" UUID,
ADD COLUMN     "effectiveUnitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "DrawCenter" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "normalizedSearchText" VARCHAR(1000);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "labSubmissionAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "labSubmissionErrorCode" VARCHAR(100),
ADD COLUMN     "labSubmissionErrorMessage" TEXT,
ADD COLUMN     "labSubmissionPayloadJson" JSONB,
ADD COLUMN     "labSubmissionResponseJson" JSONB,
ADD COLUMN     "lastLabSubmissionAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastPaymentEventId" VARCHAR(100),
ADD COLUMN     "lastTransitionedAt" TIMESTAMP(3),
ADD COLUMN     "paymentSnapshotJson" JSONB,
ADD COLUMN     "userConfirmedAt" TIMESTAMP(3),
ALTER COLUMN "orderStatus" SET DEFAULT 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "baseRetailPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "effectiveUnitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "pricingSnapshotJson" JSONB,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "OrderPatient" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "OrderPromoCode" ADD COLUMN     "appliedCode" VARCHAR(50) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountType" "DiscountType" NOT NULL,
ADD COLUMN     "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "pricingStrategy" "PromoPricingStrategy" NOT NULL DEFAULT 'PRICING_FLOOR';

-- AlterTable
ALTER TABLE "OrderTrackingEvent" DROP COLUMN "status",
ADD COLUMN     "actorId" VARCHAR(100),
ADD COLUMN     "actorType" "TrackingActorType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "eventType" "OrderTrackingEventType" NOT NULL,
ADD COLUMN     "nextStatus" "OrderStatus",
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "previousStatus" "OrderStatus",
ALTER COLUMN "step" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "minimumMarginAmount" DECIMAL(10,2),
ADD COLUMN     "perUserLimit" INTEGER,
ADD COLUMN     "pricingStrategy" "PromoPricingStrategy" NOT NULL DEFAULT 'PRICING_FLOOR',
ADD COLUMN     "status" "PromoCodeStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Requisition" ADD COLUMN     "downloadFileName" VARCHAR(255),
ADD COLUMN     "drawCenterSnapshotJson" JSONB,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "fileMetadataJson" JSONB,
ADD COLUMN     "fileStorageKey" VARCHAR(500),
ADD COLUMN     "providerCode" VARCHAR(30),
ADD COLUMN     "rawPayloadJson" JSONB,
ADD COLUMN     "rawResponseJson" JSONB,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "assigneeUserId" UUID,
ADD COLUMN     "failureContextJson" JSONB,
ADD COLUMN     "manualReviewRequestedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reasonCode" "SupportTicketReasonCode" NOT NULL DEFAULT 'GENERAL_REQUEST',
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "resolvedByUserId" UUID;

-- CreateIndex
CREATE INDEX "CartItem_drawCenterId_idx" ON "CartItem"("drawCenterId");

-- CreateIndex
CREATE INDEX "DrawCenter_state_city_idx" ON "DrawCenter"("state", "city");

-- CreateIndex
CREATE INDEX "DrawCenter_deletedAt_idx" ON "DrawCenter"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_manualReviewRequired_idx" ON "Order"("manualReviewRequired");

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_eventType_createdAt_idx" ON "OrderTrackingEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "PromoCode_status_idx" ON "PromoCode"("status");

-- CreateIndex
CREATE INDEX "PromoCode_deletedAt_idx" ON "PromoCode"("deletedAt");

-- CreateIndex
CREATE INDEX "SupportTicket_reasonCode_status_idx" ON "SupportTicket"("reasonCode", "status");

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_drawCenterId_fkey" FOREIGN KEY ("drawCenterId") REFERENCES "DrawCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

