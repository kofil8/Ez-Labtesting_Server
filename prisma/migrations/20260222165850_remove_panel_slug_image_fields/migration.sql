/*
  Warnings:

  - You are about to drop the column `bannerLabel` on the `TestPanel` table. All the data in the column will be lost.
  - You are about to drop the column `heroImage` on the `TestPanel` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `TestPanel` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `TestPanel` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TestPanel_slug_idx";

-- DropIndex
DROP INDEX "TestPanel_slug_key";

-- AlterTable
ALTER TABLE "TestPanel" DROP COLUMN "bannerLabel",
DROP COLUMN "heroImage",
DROP COLUMN "shortDescription",
DROP COLUMN "slug";
