import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { summarizeNote } from "@/lib/ai/summarize";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess } from "@/lib/auth/authorize";

const bodySchema = z.object({
  noteId: z.string(),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const note = await db.note.findUnique({
    where: { id: parsed.data.noteId },
    select: { plainText: true, projectId: true },
  });
  if (!note || !(await hasProjectViewAccess(note.projectId, user.id))) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  try {
    const summary = await summarizeNote(note.plainText);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("summarize-note failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
