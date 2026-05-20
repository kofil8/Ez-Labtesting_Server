ALTER TABLE "Test"
ADD COLUMN "isPhysicianReviewed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "TestReview"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isFlagged" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "TestReview_isPublished_isFlagged_idx" ON "TestReview"("isPublished", "isFlagged");
