-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "testCode" VARCHAR(100) NOT NULL,
    "testName" VARCHAR(200) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "testImage" VARCHAR(500),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDetail" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "turnaround" INTEGER NOT NULL,
    "specimenType" VARCHAR(200) NOT NULL,
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

-- AddForeignKey
ALTER TABLE "TestDetail" ADD CONSTRAINT "TestDetail_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
