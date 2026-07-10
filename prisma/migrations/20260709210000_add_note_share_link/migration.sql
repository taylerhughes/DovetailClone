-- AlterTable
ALTER TABLE "Note" ADD COLUMN "shareLinkEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Note" ADD COLUMN "shareLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Note_shareLinkToken_key" ON "Note"("shareLinkToken");
