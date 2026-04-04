-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'LAB_PARTNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_COMPLETED', 'ORDER_IN_PROGRESS', 'RESULTS_READY', 'RESULTS_ABNORMAL', 'APPOINTMENT_SCHEDULED', 'APPOINTMENT_REMINDER', 'NEW_DISCOUNT', 'DISCOUNT_EXPIRING', 'LAB_CENTER_UPDATED', 'LAB_CENTER_CLOSED', 'SYSTEM_ALERT', 'ADMIN_ANNOUNCEMENT', 'WELCOME', 'ACCOUNT_VERIFIED', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('blocked', 'requires_physician');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'ACH');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'processing', 'requisition_sent', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AccessSubmissionStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'SUBMITTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('generated', 'sent_to_lab', 'specimen_collected', 'processing', 'results_ready');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percent', 'fixed');

-- CreateEnum
CREATE TYPE "PatientRelation" AS ENUM ('SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "profileImage" TEXT,
    "bio" VARCHAR(500),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "dateOfBirth" TIMESTAMP(3),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" CHAR(2),
    "zipCode" VARCHAR(10),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "laboratoryId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAction" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mfaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaSetupAt" TIMESTAMP(3),
    "gender" "Gender",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCategory" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "description" TEXT,
    "shortDescription" VARCHAR(500),
    "categoryId" BIGINT NOT NULL,
    "specimenType" VARCHAR(100),
    "turnaroundDays" SMALLINT,
    "isPanel" BOOLEAN NOT NULL DEFAULT false,
    "cptCode" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestComponent" (
    "id" BIGSERIAL NOT NULL,
    "panelId" BIGINT NOT NULL,
    "componentTestId" BIGINT NOT NULL,

    CONSTRAINT "TestComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratory" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "apiEndpoint" VARCHAR(500),
    "apiKeyEncrypted" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" BIGSERIAL NOT NULL,
    "testId" BIGINT NOT NULL,
    "laboratoryId" BIGINT NOT NULL,
    "labTestCode" VARCHAR(50) NOT NULL,
    "labCost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "retailPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "turnaroundDaysOverride" SMALLINT,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateRestriction" (
    "id" BIGSERIAL NOT NULL,
    "stateCode" CHAR(2) NOT NULL,
    "testId" BIGINT,
    "restrictionType" "RestrictionType" NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StateRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawCenter" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "laboratoryId" BIGINT,
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zipCode" VARCHAR(10) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "phone" VARCHAR(20),
    "hours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DrawCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" BIGINT NOT NULL,
    "laboratoryId" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "laboratoryId" BIGINT NOT NULL,
    "drawCenterId" BIGINT,
    "orderNumber" VARCHAR(30) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "processingFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethodType" "PaymentMethodType",
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'pending',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripePaymentMethodId" TEXT,
    "accessSubmissionStatus" "AccessSubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "accessOrderId" TEXT,
    "accessClientId" TEXT,
    "requisitionPdfUrl" TEXT,
    "requisitionPdfPath" TEXT,
    "labVisitInstructions" TEXT,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "accessPayloadJson" JSONB,
    "accessResponseJson" JSONB,
    "accessErrorMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "submittedToLabAt" TIMESTAMP(3),
    "labOrderPlacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentTrackingStep" INTEGER NOT NULL DEFAULT 1,
    "trackingUpdatedAt" TIMESTAMP(3),
    "notificationsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastNotificationAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPatient" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "relationToUser" "PatientRelation" NOT NULL DEFAULT 'SELF',
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "addressLine1" VARCHAR(255),
    "addressLine2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" CHAR(2),
    "zipCode" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "testId" BIGINT NOT NULL,
    "labTestCode" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "labCost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" BIGINT,
    "laboratoryId" BIGINT,
    "requisitionNumber" VARCHAR(50),
    "requisitionPdfPath" VARCHAR(500),
    "status" "RequisitionStatus" NOT NULL DEFAULT 'generated',
    "labOrderId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "minOrder" DECIMAL(10,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPromoCode" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "promoCodeId" BIGINT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "OrderPromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestReview" (
    "id" TEXT NOT NULL,
    "testId" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "comment" VARCHAR(1000) NOT NULL,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHelpful" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" VARCHAR(30) NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "subject" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "responseTarget" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredVia" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "emailSubject" VARCHAR(200) NOT NULL,
    "emailBody" TEXT NOT NULL,
    "pushTitle" VARCHAR(200) NOT NULL,
    "pushBody" VARCHAR(500) NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resourceId" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "changesBefore" TEXT,
    "changesAfter" TEXT,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_laboratoryId_idx" ON "User"("laboratoryId");

-- CreateIndex
CREATE UNIQUE INDEX "TestCategory_slug_key" ON "TestCategory"("slug");

-- CreateIndex
CREATE INDEX "TestCategory_sortOrder_idx" ON "TestCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "TestCategory_isActive_idx" ON "TestCategory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Test_slug_key" ON "Test"("slug");

-- CreateIndex
CREATE INDEX "Test_categoryId_idx" ON "Test"("categoryId");

-- CreateIndex
CREATE INDEX "Test_isActive_idx" ON "Test"("isActive");

-- CreateIndex
CREATE INDEX "Test_isPopular_idx" ON "Test"("isPopular");

-- CreateIndex
CREATE INDEX "Test_cptCode_idx" ON "Test"("cptCode");

-- CreateIndex
CREATE INDEX "Test_categoryId_isActive_idx" ON "Test"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "Test_slug_idx" ON "Test"("slug");

-- CreateIndex
CREATE INDEX "TestComponent_componentTestId_idx" ON "TestComponent"("componentTestId");

-- CreateIndex
CREATE UNIQUE INDEX "TestComponent_panelId_componentTestId_key" ON "TestComponent"("panelId", "componentTestId");

-- CreateIndex
CREATE UNIQUE INDEX "Laboratory_code_key" ON "Laboratory"("code");

-- CreateIndex
CREATE INDEX "Laboratory_isActive_idx" ON "Laboratory"("isActive");

-- CreateIndex
CREATE INDEX "LabTest_laboratoryId_idx" ON "LabTest"("laboratoryId");

-- CreateIndex
CREATE INDEX "LabTest_isAvailable_idx" ON "LabTest"("isAvailable");

-- CreateIndex
CREATE INDEX "LabTest_labTestCode_idx" ON "LabTest"("labTestCode");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_testId_laboratoryId_key" ON "LabTest"("testId", "laboratoryId");

-- CreateIndex
CREATE INDEX "StateRestriction_stateCode_idx" ON "StateRestriction"("stateCode");

-- CreateIndex
CREATE INDEX "StateRestriction_testId_idx" ON "StateRestriction"("testId");

-- CreateIndex
CREATE INDEX "StateRestriction_stateCode_isActive_idx" ON "StateRestriction"("stateCode", "isActive");

-- CreateIndex
CREATE INDEX "DrawCenter_laboratoryId_idx" ON "DrawCenter"("laboratoryId");

-- CreateIndex
CREATE INDEX "DrawCenter_state_idx" ON "DrawCenter"("state");

-- CreateIndex
CREATE INDEX "DrawCenter_zipCode_idx" ON "DrawCenter"("zipCode");

-- CreateIndex
CREATE INDEX "DrawCenter_isActive_idx" ON "DrawCenter"("isActive");

-- CreateIndex
CREATE INDEX "DrawCenter_latitude_longitude_idx" ON "DrawCenter"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE INDEX "CartItem_testId_idx" ON "CartItem"("testId");

-- CreateIndex
CREATE INDEX "CartItem_laboratoryId_idx" ON "CartItem"("laboratoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_testId_laboratoryId_key" ON "CartItem"("userId", "testId", "laboratoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeChargeId_key" ON "Order"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessOrderId_key" ON "Order"("accessOrderId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_laboratoryId_idx" ON "Order"("laboratoryId");

-- CreateIndex
CREATE INDEX "Order_drawCenterId_idx" ON "Order"("drawCenterId");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_paymentMethodType_idx" ON "Order"("paymentMethodType");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_accessSubmissionStatus_idx" ON "Order"("accessSubmissionStatus");

-- CreateIndex
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPatient_orderId_key" ON "OrderPatient"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_testId_idx" ON "OrderItem"("testId");

-- CreateIndex
CREATE INDEX "Requisition_orderId_idx" ON "Requisition"("orderId");

-- CreateIndex
CREATE INDEX "Requisition_orderItemId_idx" ON "Requisition"("orderItemId");

-- CreateIndex
CREATE INDEX "Requisition_laboratoryId_idx" ON "Requisition"("laboratoryId");

-- CreateIndex
CREATE INDEX "Requisition_status_idx" ON "Requisition"("status");

-- CreateIndex
CREATE INDEX "Requisition_labOrderId_idx" ON "Requisition"("labOrderId");

-- CreateIndex
CREATE INDEX "Requisition_requisitionNumber_idx" ON "Requisition"("requisitionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoCode_expiresAt_idx" ON "PromoCode"("expiresAt");

-- CreateIndex
CREATE INDEX "OrderPromoCode_orderId_idx" ON "OrderPromoCode"("orderId");

-- CreateIndex
CREATE INDEX "OrderPromoCode_promoCodeId_idx" ON "OrderPromoCode"("promoCodeId");

-- CreateIndex
CREATE INDEX "TestReview_testId_idx" ON "TestReview"("testId");

-- CreateIndex
CREATE INDEX "TestReview_userId_idx" ON "TestReview"("userId");

-- CreateIndex
CREATE INDEX "TestReview_rating_idx" ON "TestReview"("rating");

-- CreateIndex
CREATE INDEX "TestReview_createdAt_idx" ON "TestReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TestReview_testId_userId_key" ON "TestReview"("testId", "userId");

-- CreateIndex
CREATE INDEX "ReviewHelpful_reviewId_idx" ON "ReviewHelpful"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewHelpful_userId_idx" ON "ReviewHelpful"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewHelpful_reviewId_userId_key" ON "ReviewHelpful"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_orderId_createdAt_idx" ON "OrderTrackingEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_step_status_idx" ON "OrderTrackingEvent"("step", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_status_idx" ON "SupportTicket"("priority", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");

-- CreateIndex
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_senderId_idx" ON "SupportMessage"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_priority_createdAt_idx" ON "Notification"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_type_key" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE INDEX "NotificationTemplate_type_idx" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestComponent" ADD CONSTRAINT "TestComponent_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestComponent" ADD CONSTRAINT "TestComponent_componentTestId_fkey" FOREIGN KEY ("componentTestId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateRestriction" ADD CONSTRAINT "StateRestriction_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawCenter" ADD CONSTRAINT "DrawCenter_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_drawCenterId_fkey" FOREIGN KEY ("drawCenterId") REFERENCES "DrawCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPatient" ADD CONSTRAINT "OrderPatient_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requisition" ADD CONSTRAINT "Requisition_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPromoCode" ADD CONSTRAINT "OrderPromoCode_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPromoCode" ADD CONSTRAINT "OrderPromoCode_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReview" ADD CONSTRAINT "TestReview_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReview" ADD CONSTRAINT "TestReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TestReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTrackingEvent" ADD CONSTRAINT "OrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
