/*
  Warnings:

  - You are about to drop the column `insuranceJson` on the `CheckoutSession` table. All the data in the column will be lost.
  - You are about to drop the column `hasInsurance` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceGroupNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceMemberId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceProvider` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `policyholderRelationship` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_labTestId_fkey";

-- DropForeignKey
ALTER TABLE "PanelTest" DROP CONSTRAINT "PanelTest_testId_fkey";

-- AlterTable
ALTER TABLE "CheckoutSession" DROP COLUMN "insuranceJson",
ADD COLUMN     "submitIdempotencyKey" VARCHAR(100);

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "hasInsurance",
DROP COLUMN "insuranceGroupNumber",
DROP COLUMN "insuranceMemberId",
DROP COLUMN "insuranceProvider",
DROP COLUMN "policyholderRelationship";

-- CreateIndex
CREATE INDEX "TestDetail_testId_idx" ON "TestDetail"("testId");

-- AddForeignKey
ALTER TABLE "PanelTest" ADD CONSTRAINT "PanelTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
