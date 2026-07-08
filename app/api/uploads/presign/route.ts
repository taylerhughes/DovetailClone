import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectEditAccess } from "@/lib/auth/authorize";
import { checkRateLimit } from "@/lib/rateLimit/limiter";
import { tooManyRequestsResponse } from "@/lib/rateLimit/response";
import { RATE_LIMITS } from "@/lib/rateLimit/limits";
import { createPresignedUploadUrl, isPresignedUploadAvailable } from "@/lib/storage/presign";

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

export async function HEAD() {
  if (!isPresignedUploadAvailable()) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 200 });
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

    const rateLimit = await checkRateLimit(`upload:${user.id}`, RATE_LIMITS.upload);
    if (!rateLimit.allowed) {
      return tooManyRequestsResponse(rateLimit.retryAfterSec);
    }

    const body = await request.json();
    const { noteId, fileName, mimeType, sizeBytes } = body;

    if (typeof noteId !== "string" || !noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 });
    }
    if (typeof fileName !== "string" || !fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }
    if (typeof mimeType !== "string" || !mimeType) {
      return NextResponse.json({ error: "mimeType is required" }, { status: 400 });
    }
    if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
      return NextResponse.json({ error: "sizeBytes is required" }, { status: 400 });
    }

    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not allowed` },
        { status: 415 },
      );
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

    const storageKey = `${noteId}/${randomUUID()}-${fileName}`;
    const uploadUrl = await createPresignedUploadUrl(storageKey, mimeType, sizeBytes);

    return NextResponse.json({ uploadUrl, storageKey });
  } catch (err) {
    console.error("presign failed", err);
    const message = err instanceof Error ? err.message : "Presign failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
