import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { revalidatePath } from "next/cache";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
// Video/audio need a much higher ceiling than documents/images — a research
// interview recording routinely runs into the hundreds of MB, and rejecting
// those would make the transcription feature unusable for real files.
const MAX_MEDIA_UPLOAD_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/"];
const ALLOWED_EXACT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

function isAllowedMimeType(mimeType: string): boolean {
  return (
    ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    ALLOWED_EXACT_MIME_TYPES.includes(mimeType)
  );
}

function attachmentKindFromMime(mimeType: string): "VIDEO" | "AUDIO" | "IMAGE" | "FILE" {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "FILE";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const noteId = formData.get("noteId");
    const file = formData.get("file");

    if (typeof noteId !== "string" || !noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not allowed` },
        { status: 415 },
      );
    }
    const isMedia = mimeType.startsWith("video/") || mimeType.startsWith("audio/");
    const maxBytes = isMedia ? MAX_MEDIA_UPLOAD_BYTES : MAX_UPLOAD_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds the ${maxBytes / (1024 * 1024)}MB upload limit` },
        { status: 413 },
      );
    }

    const note = await db.note.findUnique({
      where: { id: noteId },
      select: { id: true, projectId: true },
    });
    if (!note) {
      return NextResponse.json({ error: "note not found" }, { status: 404 });
    }

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
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
