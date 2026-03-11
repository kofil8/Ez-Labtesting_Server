-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'LAB_ORDER_PLACED', 'COMPLETED', 'FAILED');

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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" VARCHAR(20),
    "profileImage" TEXT,
    "bio" VARCHAR(500),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "dateOfBirth" TIMESTAMP(3),
    "address" VARCHAR(255),
    "bloodType" VARCHAR(10),
    "allergies" VARCHAR(500),
    "medicalConditions" VARCHAR(500),
    "medications" VARCHAR(500),
    "emergencyContactName" VARCHAR(100),
    "emergencyContactPhone" VARCHAR(20),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
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
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastConnectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDisconnectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "testCode" VARCHAR(100) NOT NULL,
    "testName" VARCHAR(200) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "testImage" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "specimenType" VARCHAR(200) NOT NULL,
    "turnaround" INTEGER NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDetail" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "turnaround" INTEGER,
    "component" VARCHAR(200) NOT NULL,
    "method" VARCHAR(200) NOT NULL,
    "collectionNotes" TEXT,
    "clinicalUtility" TEXT,
    "cptCode" VARCHAR(100) NOT NULL,
    "testingLocatiion" VARCHAR(200) NOT NULL,
    "temperatures" JSONB NOT NULL DEFAULT '[]',
    "preparation" TEXT,
    "collectionMethod" TEXT,
    "resultsDelivery" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPanel" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "shortDescription" VARCHAR(300),
    "description" TEXT,
    "heroImage" VARCHAR(500),
    "bannerLabel" VARCHAR(100),
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TestPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelTest" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelTest_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "TestReview" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
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
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "labTestId" TEXT NOT NULL,
    "labCenterId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "processingFee" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "stripePaymentIntentId" TEXT,
    "accessOrderId" TEXT,
    "requisitionPdfUrl" TEXT,
    "labVisitInstructions" TEXT,
    "accessPayloadJson" JSONB NOT NULL,
    "accessCsv" TEXT,
    "paidAt" TIMESTAMP(3),
    "labOrderPlacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabCenter" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(200),
    "website" VARCHAR(500),
    "type" VARCHAR(100) NOT NULL,
    "hours" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Open',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabCenter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "Notification_priority_createdAt_idx" ON "Notification"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_userId_key" ON "UserConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_type_key" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE INDEX "NotificationTemplate_type_idx" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_name_idx" ON "Category"("isActive", "name");

-- CreateIndex
CREATE INDEX "Test_categoryId_idx" ON "Test"("categoryId");

-- CreateIndex
CREATE INDEX "Test_isPublished_isActive_idx" ON "Test"("isPublished", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TestPanel_slug_key" ON "TestPanel"("slug");

-- CreateIndex
CREATE INDEX "TestPanel_slug_idx" ON "TestPanel"("slug");

-- CreateIndex
CREATE INDEX "TestPanel_isActive_startsAt_endsAt_idx" ON "TestPanel"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "PanelTest_testId_idx" ON "PanelTest"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "PanelTest_panelId_testId_key" ON "PanelTest"("panelId", "testId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

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
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessOrderId_key" ON "Order"("accessOrderId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_labTestId_idx" ON "Order"("labTestId");

-- CreateIndex
CREATE INDEX "Order_labCenterId_idx" ON "Order"("labCenterId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "LabCenter_latitude_longitude_idx" ON "LabCenter"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "LabCenter_isActive_idx" ON "LabCenter"("isActive");

-- CreateIndex
CREATE INDEX "LabCenter_type_idx" ON "LabCenter"("type");

-- CreateIndex
CREATE INDEX "LabCenter_lastVerified_idx" ON "LabCenter"("lastVerified");

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDetail" ADD CONSTRAINT "TestDetail_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelTest" ADD CONSTRAINT "PanelTest_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "TestPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelTest" ADD CONSTRAINT "PanelTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReview" ADD CONSTRAINT "TestReview_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestReview" ADD CONSTRAINT "TestReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "TestReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_labCenterId_fkey" FOREIGN KEY ("labCenterId") REFERENCES "LabCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
