import { db } from "@/lib/db";
import { EMBEDDING_MODELS } from "./client";

export type EmbeddingSubjectType = "NOTE" | "HIGHLIGHT" | "INSIGHT";

export interface ChunkToStore {
  text: string;
  embedding: number[];
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Full delete-and-recreate for a subject's chunks. Simpler and cheap enough
 * at this app's scale than trying to diff edited paragraphs against a prior
 * chunk set (which has no stable identity across edits anyway).
 */
export async function replaceChunksForSubject(
  subjectType: EmbeddingSubjectType,
  subjectId: string,
  projectId: string,
  chunks: ChunkToStore[],
): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "EmbeddingChunk"
    WHERE "subjectType" = ${subjectType}::"EmbeddingSubjectType" AND "subjectId" = ${subjectId}
  `;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await db.$executeRaw`
      INSERT INTO "EmbeddingChunk"
        ("id", "projectId", "subjectType", "subjectId", "chunkIndex", "chunkText", "embedding", "model", "updatedAt")
      VALUES
        (gen_random_uuid()::text, ${projectId}, ${subjectType}::"EmbeddingSubjectType", ${subjectId}, ${i}, ${chunk.text}, ${toVectorLiteral(chunk.embedding)}::vector, ${EMBEDDING_MODELS.embed}, now())
    `;
  }
}

export async function deleteChunksForSubject(
  subjectType: EmbeddingSubjectType,
  subjectId: string,
): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "EmbeddingChunk"
    WHERE "subjectType" = ${subjectType}::"EmbeddingSubjectType" AND "subjectId" = ${subjectId}
  `;
}

export interface SimilaritySearchResult {
  subjectType: EmbeddingSubjectType;
  subjectId: string;
  chunkText: string;
  distance: number;
}

export async function similaritySearch({
  queryEmbedding,
  accessibleProjectIds,
  k,
  subjectTypes,
  excludeSubjectIds,
}: {
  queryEmbedding: number[];
  accessibleProjectIds: string[];
  k: number;
  subjectTypes?: EmbeddingSubjectType[];
  excludeSubjectIds?: { subjectType: EmbeddingSubjectType; subjectId: string }[];
}): Promise<SimilaritySearchResult[]> {
  if (accessibleProjectIds.length === 0) return [];

  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const typeFilter =
    subjectTypes && subjectTypes.length > 0
      ? subjectTypes
      : (["NOTE", "HIGHLIGHT", "INSIGHT"] as EmbeddingSubjectType[]);
  const excluded = excludeSubjectIds ?? [];

  const rows = await db.$queryRaw<SimilaritySearchResult[]>`
    SELECT "subjectType", "subjectId", "chunkText",
           ("embedding" <=> ${vectorLiteral}::vector) AS distance
    FROM "EmbeddingChunk"
    WHERE "projectId" = ANY(${accessibleProjectIds})
      AND "subjectType" = ANY(${typeFilter}::"EmbeddingSubjectType"[])
      AND NOT EXISTS (
        SELECT 1 FROM unnest(${excluded.map((e) => e.subjectType)}::"EmbeddingSubjectType"[], ${excluded.map((e) => e.subjectId)}::text[]) AS ex(t, i)
        WHERE ex.t = "EmbeddingChunk"."subjectType" AND ex.i = "EmbeddingChunk"."subjectId"
      )
    ORDER BY distance ASC
    LIMIT ${k}
  `;

  return rows;
}
