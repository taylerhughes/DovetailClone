import { db } from "@/lib/db";

export interface NoteSearchResult {
  id: string;
  title: string;
  plainText: string;
  projectId: string;
  projectName: string;
}

export interface InsightSearchResult {
  id: string;
  title: string;
  plainText: string;
  projectId: string;
  projectName: string;
}

export interface HighlightSearchResult {
  id: string;
  quote: string;
  noteId: string;
  noteTitle: string;
  projectId: string;
  projectName: string;
}

export interface SearchResults {
  notes: NoteSearchResult[];
  highlights: HighlightSearchResult[];
  insights: InsightSearchResult[];
}

const RESULT_LIMIT = 20;

export async function searchAll(query: string, userId: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { notes: [], highlights: [], insights: [] };
  }

  // A user can reach a project as its owner, via an individual ProjectShare
  // grant, or via a live org membership when the project has org sharing
  // enabled -- the same three conditions resolveProjectAccess checks,
  // reimplemented here as SQL since these are raw queries, not the query
  // builder. Any access level (viewer or editor) is enough to find results.
  const accessCondition = `(
    p."userId" = $1
    OR EXISTS (SELECT 1 FROM "ProjectShare" ps WHERE ps."projectId" = p.id AND ps."userId" = $1)
    OR (
      p."orgShareEnabled" = true
      AND p."organizationId" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM "member" m
        WHERE m."organizationId" = p."organizationId" AND m."userId" = $1
      )
    )
  )`;

  const [notes, insights, highlights] = await Promise.all([
    db.$queryRawUnsafe<NoteSearchResult[]>(
      `
      SELECT n.id, n.title, n."plainText", n."projectId", p.name AS "projectName"
      FROM "Note" n
      JOIN "Project" p ON p.id = n."projectId"
      WHERE n."searchVector" @@ plainto_tsquery('english', $2)
        AND ${accessCondition}
      ORDER BY ts_rank(n."searchVector", plainto_tsquery('english', $2)) DESC
      LIMIT ${RESULT_LIMIT}
    `,
      userId,
      trimmed,
    ),
    db.$queryRawUnsafe<InsightSearchResult[]>(
      `
      SELECT i.id, i.title, i."plainText", i."projectId", p.name AS "projectName"
      FROM "Insight" i
      JOIN "Project" p ON p.id = i."projectId"
      WHERE i."searchVector" @@ plainto_tsquery('english', $2)
        AND ${accessCondition}
      ORDER BY ts_rank(i."searchVector", plainto_tsquery('english', $2)) DESC
      LIMIT ${RESULT_LIMIT}
    `,
      userId,
      trimmed,
    ),
    db.$queryRawUnsafe<HighlightSearchResult[]>(
      `
      SELECT h.id, h.quote, n.id AS "noteId", n.title AS "noteTitle",
             n."projectId" AS "projectId", p.name AS "projectName"
      FROM "Highlight" h
      JOIN "Note" n ON n.id = h."noteId"
      JOIN "Project" p ON p.id = n."projectId"
      WHERE h."searchVector" @@ plainto_tsquery('english', $2)
        AND ${accessCondition}
      ORDER BY ts_rank(h."searchVector", plainto_tsquery('english', $2)) DESC
      LIMIT ${RESULT_LIMIT}
    `,
      userId,
      trimmed,
    ),
  ]);

  return { notes, highlights, insights };
}
