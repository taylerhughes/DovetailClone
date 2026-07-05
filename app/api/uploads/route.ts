import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

function attachmentKindFromMime(mimeType: string): "VIDEO" | "AUDIO" | "IMAGE" | "FILE" {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "FILE";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const noteId = formData.get("noteId");
  const file = formData.get("file");

  if (typeof noteId !== "string" || !noteId) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: { id: true, projectId: true },
  });
  if (!note) {
    return NextResponse.json({ error: "note not found" }, { status: 404 });
  }

  const mimeType = file.type || "application/octet-stream";
  const kind = attachmentKindFromMime(mimeType);
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `${noteId}/${randomUUID()}-${file.name}`;

  await storage.save(storageKey, buffer);

  const attachment = await db.attachment.create({
    data: {
      noteId,
      kind,
      originalName: file.name,
      mimeType,
      sizeBytes: buffer.byteLength,
      storageKey,
    },
  });

  revalidatePath(`/projects/${note.projectId}/data/${noteId}`);

  return NextResponse.json({ attachment });
}
