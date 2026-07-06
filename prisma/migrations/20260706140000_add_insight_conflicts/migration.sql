-- CreateEnum
CREATE TYPE "ConflictSubjectType" AS ENUM ('HIGHLIGHT', 'INSIGHT');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "InsightConflict" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "conflictingType" "ConflictSubjectType" NOT NULL,
    "conflictingId" TEXT NOT NULL,
    "severity" "ConflictSeverity" NOT NULL,
    "explanation" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightConflict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsightConflict_insightId_conflictingType_conflictingId_key" ON "InsightConflict"("insightId", "conflictingType", "conflictingId");

-- AddForeignKey
ALTER TABLE "InsightConflict" ADD CONSTRAINT "InsightConflict_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
