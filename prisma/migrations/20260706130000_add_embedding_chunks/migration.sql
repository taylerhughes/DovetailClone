-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "EmbeddingSubjectType" AS ENUM ('NOTE', 'HIGHLIGHT', 'INSIGHT');

-- CreateTable
CREATE TABLE "EmbeddingChunk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subjectType" "EmbeddingSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "chunkText" TEXT NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmbeddingChunk_projectId_idx" ON "EmbeddingChunk"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingChunk_subjectType_subjectId_chunkIndex_key" ON "EmbeddingChunk"("subjectType", "subjectId", "chunkIndex");

-- CreateIndex (HNSW, cosine distance -- Voyage embeddings are unit-normalized)
CREATE INDEX "EmbeddingChunk_embedding_hnsw_idx" ON "EmbeddingChunk" USING hnsw (embedding vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "EmbeddingChunk" ADD CONSTRAINT "EmbeddingChunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
