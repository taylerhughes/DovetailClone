-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "HighlightReelStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "speakerMap" JSONB,
ADD COLUMN     "transcriptionError" TEXT,
ADD COLUMN     "transcriptionStatus" "TranscriptionStatus" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "attachmentId" TEXT,
ADD COLUMN     "clipEndSec" DOUBLE PRECISION,
ADD COLUMN     "clipStartSec" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "HighlightReel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "HighlightReelStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HighlightReel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HighlightReel_tagId_idx" ON "HighlightReel"("tagId");

-- CreateIndex
CREATE INDEX "HighlightReel_projectId_idx" ON "HighlightReel"("projectId");

-- CreateIndex
CREATE INDEX "Highlight_attachmentId_idx" ON "Highlight"("attachmentId");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightReel" ADD CONSTRAINT "HighlightReel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightReel" ADD CONSTRAINT "HighlightReel_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
