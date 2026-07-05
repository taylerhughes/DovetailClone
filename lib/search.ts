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

export async function searchAll(query: string): Promise<SearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { notes: [], highlights: [], insights: [] };
  }

  const [notes, insights, highlights] = await Promise.all([
    db.$queryRaw<NoteSearchResult[]>`
      SELECT n.id, n.title, n."plainText", n."projectId", p.name AS "projectName"
      FROM "Note" n
      JOIN "Project" p ON p.id = n."projectId"
      WHERE n."searchVector" @@ plainto_tsquery('english', ${trimmed})
      ORDER BY ts_rank(n."searchVector", plainto_tsquery('english', ${trimmed})) DESC
      LIMIT ${RESULT_LIMIT}
    `,
    db.$queryRaw<InsightSearchResult[]>`
      SELECT i.id, i.title, i."plainText", i."projectId", p.name AS "projectName"
      FROM "Insight" i
      JOIN "Project" p ON p.id = i."projectId"
      WHERE i."searchVector" @@ plainto_tsquery('english', ${trimmed})
      ORDER BY ts_rank(i."searchVector", plainto_tsquery('english', ${trimmed})) DESC
      LIMIT ${RESULT_LIMIT}
    `,
    db.$queryRaw<HighlightSearchResult[]>`
      SELECT h.id, h.quote, n.id AS "noteId", n.title AS "noteTitle",
             n."projectId" AS "projectId", p.name AS "projectName"
      FROM "Highlight" h
      JOIN "Note" n ON n.id = h."noteId"
      JOIN "Project" p ON p.id = n."projectId"
      WHERE h."searchVector" @@ plainto_tsquery('english', ${trimmed})
      ORDER BY ts_rank(h."searchVector", plainto_tsquery('english', ${trimmed})) DESC
      LIMIT ${RESULT_LIMIT}
    `,
  ]);

  return { notes, highlights, insights };
}
