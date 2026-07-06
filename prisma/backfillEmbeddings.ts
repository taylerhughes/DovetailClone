import "dotenv/config";
import { db } from "@/lib/db";
import { isEmbeddingsEnabled } from "@/lib/embeddings/client";
import { chunkPlainText } from "@/lib/embeddings/chunking";
import { embedTexts } from "@/lib/embeddings/embed";
import { replaceChunksForSubject, type EmbeddingSubjectType } from "@/lib/embeddings/store";
import { EMBEDDING_MODELS } from "@/lib/embeddings/client";

const BATCH_SIZE = 50;
const VOYAGE_BATCH_SIZE = 200;

interface Subject {
  id: string;
  projectId: string;
  chunks: string[];
}

async function alreadyEmbedded(subjectType: EmbeddingSubjectType, subjectId: string) {
  const existing = await db.embeddingChunk.findFirst({
    where: { subjectType, subjectId, model: EMBEDDING_MODELS.embed },
    select: { id: true },
  });
  return existing != null;
}

async function embedSubjects(subjectType: EmbeddingSubjectType, subjects: Subject[]) {
  // Flatten all chunks across subjects into one list so Voyage calls can be
  // batched efficiently (backfill volume matters for round-trip count, unlike
  // the simpler one-call-per-subject sync-on-save path).
  const flatTexts: string[] = [];
  const owners: { subjectIndex: number; chunkIndex: number }[] = [];
  subjects.forEach((subject, subjectIndex) => {
    subject.chunks.forEach((text, chunkIndex) => {
      flatTexts.push(text);
      owners.push({ subjectIndex, chunkIndex });
    });
  });

  const embeddingsBySubject: number[][][] = subjects.map((s) => new Array(s.chunks.length));

  for (let i = 0; i < flatTexts.length; i += VOYAGE_BATCH_SIZE) {
    const batchTexts = flatTexts.slice(i, i + VOYAGE_BATCH_SIZE);
    const batchOwners = owners.slice(i, i + VOYAGE_BATCH_SIZE);
    const batchEmbeddings = await embedTexts(batchTexts, "document");
    batchOwners.forEach((owner, j) => {
      embeddingsBySubject[owner.subjectIndex][owner.chunkIndex] = batchEmbeddings[j];
    });
  }

  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    if (subject.chunks.length === 0) continue;
    await replaceChunksForSubject(
      subjectType,
      subject.id,
      subject.projectId,
      subject.chunks.map((text, j) => ({ text, embedding: embeddingsBySubject[i][j] })),
    );
  }
}

async function backfillNotes() {
  let cursor: string | undefined;
  let processed = 0;
  for (;;) {
    const notes = await db.note.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, projectId: true, plainText: true },
    });
    if (notes.length === 0) break;
    cursor = notes[notes.length - 1].id;

    const pending: Subject[] = [];
    for (const note of notes) {
      if (await alreadyEmbedded("NOTE", note.id)) continue;
      pending.push({ id: note.id, projectId: note.projectId, chunks: chunkPlainText(note.plainText) });
    }
    if (pending.length > 0) await embedSubjects("NOTE", pending);

    processed += notes.length;
    console.log(`Notes: processed ${processed} (embedded ${pending.length} in this batch)`);
  }
}

async function backfillHighlights() {
  let cursor: string | undefined;
  let processed = 0;
  for (;;) {
    const highlights = await db.highlight.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, quote: true, note: { select: { projectId: true } } },
    });
    if (highlights.length === 0) break;
    cursor = highlights[highlights.length - 1].id;

    const pending: Subject[] = [];
    for (const highlight of highlights) {
      if (!highlight.quote.trim()) continue;
      if (await alreadyEmbedded("HIGHLIGHT", highlight.id)) continue;
      pending.push({
        id: highlight.id,
        projectId: highlight.note.projectId,
        chunks: [highlight.quote],
      });
    }
    if (pending.length > 0) await embedSubjects("HIGHLIGHT", pending);

    processed += highlights.length;
    console.log(`Highlights: processed ${processed} (embedded ${pending.length} in this batch)`);
  }
}

async function backfillInsights() {
  let cursor: string | undefined;
  let processed = 0;
  for (;;) {
    const insights = await db.insight.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, projectId: true, plainText: true },
    });
    if (insights.length === 0) break;
    cursor = insights[insights.length - 1].id;

    const pending: Subject[] = [];
    for (const insight of insights) {
      if (await alreadyEmbedded("INSIGHT", insight.id)) continue;
      pending.push({
        id: insight.id,
        projectId: insight.projectId,
        chunks: chunkPlainText(insight.plainText),
      });
    }
    if (pending.length > 0) await embedSubjects("INSIGHT", pending);

    processed += insights.length;
    console.log(`Insights: processed ${processed} (embedded ${pending.length} in this batch)`);
  }
}

async function main() {
  if (!isEmbeddingsEnabled()) {
    console.error("VOYAGE_API_KEY is not set; nothing to backfill.");
    process.exitCode = 1;
    return;
  }

  console.log("Backfilling Note embeddings…");
  await backfillNotes();
  console.log("Backfilling Highlight embeddings…");
  await backfillHighlights();
  console.log("Backfilling Insight embeddings…");
  await backfillInsights();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
