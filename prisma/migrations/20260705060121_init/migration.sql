-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('VIDEO', 'AUDIO', 'IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'SINGLE_SELECT', 'MULTI_SELECT', 'PERSON', 'DATE');

-- CreateEnum
CREATE TYPE "FieldAppliesTo" AS ENUM ('NOTE', 'INSIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "ViewEntityType" AS ENUM ('NOTE', 'HIGHLIGHT', 'INSIGHT');

-- CreateEnum
CREATE TYPE "ViewLayout" AS ENUM ('GRID', 'BOARD', 'TABLE', 'CANVAS', 'LIST');

-- CreateEnum
CREATE TYPE "CanvasSubjectType" AS ENUM ('NOTE', 'HIGHLIGHT', 'INSIGHT');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "content" JSONB NOT NULL,
    "plainText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "markId" TEXT,
    "wholeNote" BOOLEAN NOT NULL DEFAULT false,
    "quote" TEXT NOT NULL,
    "orphaned" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled insight',
    "content" JSONB NOT NULL,
    "plainText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightHighlight" (
    "insightId" TEXT NOT NULL,
    "highlightId" TEXT NOT NULL,

    CONSTRAINT "InsightHighlight_pkey" PRIMARY KEY ("insightId","highlightId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteTag" (
    "noteId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("noteId","tagId")
);

-- CreateTable
CREATE TABLE "HighlightTag" (
    "highlightId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "HighlightTag_pkey" PRIMARY KEY ("highlightId","tagId")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "appliesTo" "FieldAppliesTo" NOT NULL DEFAULT 'BOTH',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldOption" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FieldOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteFieldValue" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "teamMemberId" TEXT,

    CONSTRAINT "NoteFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteFieldValueOption" (
    "noteFieldValueId" TEXT NOT NULL,
    "fieldOptionId" TEXT NOT NULL,

    CONSTRAINT "NoteFieldValueOption_pkey" PRIMARY KEY ("noteFieldValueId","fieldOptionId")
);

-- CreateTable
CREATE TABLE "InsightFieldValue" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "teamMemberId" TEXT,

    CONSTRAINT "InsightFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightFieldValueOption" (
    "insightFieldValueId" TEXT NOT NULL,
    "fieldOptionId" TEXT NOT NULL,

    CONSTRAINT "InsightFieldValueOption_pkey" PRIMARY KEY ("insightFieldValueId","fieldOptionId")
);

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" "ViewEntityType" NOT NULL,
    "layout" "ViewLayout" NOT NULL,
    "groupByFieldId" TEXT,
    "sortFieldId" TEXT,
    "sortDirection" TEXT,
    "filterConfig" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasCardPosition" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "subjectType" "CanvasSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "zIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CanvasCardPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_projectId_idx" ON "Note"("projectId");

-- CreateIndex
CREATE INDEX "Attachment_noteId_idx" ON "Attachment"("noteId");

-- CreateIndex
CREATE INDEX "Highlight_noteId_idx" ON "Highlight"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_noteId_markId_key" ON "Highlight"("noteId", "markId");

-- CreateIndex
CREATE INDEX "Insight_projectId_idx" ON "Insight"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_projectId_name_key" ON "Tag"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Field_projectId_name_key" ON "Field"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NoteFieldValue_noteId_fieldId_key" ON "NoteFieldValue"("noteId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightFieldValue_insightId_fieldId_key" ON "InsightFieldValue"("insightId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "View_projectId_name_key" ON "View"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasCardPosition_viewId_subjectType_subjectId_key" ON "CanvasCardPosition"("viewId", "subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightHighlight" ADD CONSTRAINT "InsightHighlight_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightHighlight" ADD CONSTRAINT "InsightHighlight_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteTag" ADD CONSTRAINT "NoteTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightTag" ADD CONSTRAINT "HighlightTag_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightTag" ADD CONSTRAINT "HighlightTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldOption" ADD CONSTRAINT "FieldOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFieldValue" ADD CONSTRAINT "NoteFieldValue_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFieldValue" ADD CONSTRAINT "NoteFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFieldValue" ADD CONSTRAINT "NoteFieldValue_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFieldValueOption" ADD CONSTRAINT "NoteFieldValueOption_noteFieldValueId_fkey" FOREIGN KEY ("noteFieldValueId") REFERENCES "NoteFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFieldValueOption" ADD CONSTRAINT "NoteFieldValueOption_fieldOptionId_fkey" FOREIGN KEY ("fieldOptionId") REFERENCES "FieldOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFieldValue" ADD CONSTRAINT "InsightFieldValue_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFieldValue" ADD CONSTRAINT "InsightFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFieldValue" ADD CONSTRAINT "InsightFieldValue_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFieldValueOption" ADD CONSTRAINT "InsightFieldValueOption_insightFieldValueId_fkey" FOREIGN KEY ("insightFieldValueId") REFERENCES "InsightFieldValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightFieldValueOption" ADD CONSTRAINT "InsightFieldValueOption_fieldOptionId_fkey" FOREIGN KEY ("fieldOptionId") REFERENCES "FieldOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_groupByFieldId_fkey" FOREIGN KEY ("groupByFieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_sortFieldId_fkey" FOREIGN KEY ("sortFieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasCardPosition" ADD CONSTRAINT "CanvasCardPosition_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;
