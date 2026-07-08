import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectEditAccess } from "@/lib/auth/authorize";
import { isPresignedUploadAvailable } from "@/lib/storage/presign";

function attachmentKindFromMime(mimeType: string): "VIDEO" | "AUDIO" | "IMAGE" | "FILE" {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "FILE";
}

export async function POST(request: Request) {
  if (!isPresignedUploadAvailable()) {
    return NextResponse.json({ error: "Presigned uploads not available" }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, storageKey, originalName, mimeType, sizeBytes } = body;

    if (typeof noteId !== "string" || !noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }
    if (typeof storageKey !== "string" || !storageKey) {
      return NextResponse.json({ error: "storageKey is required" }, { status: 400 });
    }
    if (typeof originalName !== "string" || !originalName) {
      return NextResponse.json({ error: "originalName is required" }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !mimeType) {
      return NextResponse.json({ error: "mimeType is required" }, { status: 400 });
    }
    if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
      return NextResponse.json({ error: "sizeBytes is required" }, { status: 400 });
    }

    // Verify the storageKey belongs to this note (prefix check prevents cross-note abuse)
    if (!storageKey.startsWith(`${noteId}/`)) {
      return NextResponse.json({ error: "Invalid storageKey" }, { status: 400 });
    }

    const note = await db.note.findUnique({
      where: { id: noteId },
      select: { id: true, projectId: true },
    });
    if (!note) {
      return NextResponse.json({ error: "note not found" }, { status: 404 });
    }
    if (!(await hasProjectEditAccess(note.projectId, user.id))) {
      return NextResponse.json({ error: "note not found" }, { status: 404 });
    }

    const kind = attachmentKindFromMime(mimeType);
    const attachment = await db.attachment.create({
      data: {
        noteId,
        kind,
        originalName,
        mimeType,
        sizeBytes,
        storageKey,
      },
    });

    revalidatePath(`/projects/${note.projectId}/data/${noteId}`);

    return NextResponse.json({ attachment });
  } catch (err) {
    console.error("confirm upload failed", err);
    const message = err instanceof Error ? err.message : "Confirm failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
