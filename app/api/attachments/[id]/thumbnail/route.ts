import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { extractFrame } from "@/lib/ffmpeg/thumbnail";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { note: { select: { projectId: true } } },
  });
  if (!attachment || !(await hasProjectViewAccess(attachment.note.projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (attachment.kind !== "VIDEO") {
    return NextResponse.json({ error: "not a video" }, { status: 404 });
  }

  let storageKey = attachment.thumbnailStorageKey;

  if (!storageKey) {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "attachment-thumb-"));
    try {
      const sourceBuffer = await storage.read(attachment.storageKey);
      const sourcePath = path.join(
        tmpDir,
        `source${path.extname(attachment.originalName) || ".mp4"}`,
      );
      await writeFile(sourcePath, sourceBuffer);

      const outputPath = path.join(tmpDir, "thumb.jpg");
      await extractFrame(sourcePath, outputPath, 0);

      const thumbBuffer = await readFile(outputPath);
      storageKey = `attachment-thumbnails/${attachment.id}/${randomUUID()}.jpg`;
      await storage.save(storageKey, thumbBuffer);

      await db.attachment.update({
        where: { id: attachment.id },
        data: { thumbnailStorageKey: storageKey },
      });
    } catch (err) {
      console.error("attachment thumbnail generation failed", err);
      return NextResponse.json({ error: "Failed to generate thumbnail" }, { status: 500 });
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  let data;
  try {
    data = await storage.read(storageKey);
  } catch (err) {
    console.error("attachment thumbnail read failed", err);
    return NextResponse.json({ error: "Failed to read thumbnail" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Length": String(data.byteLength),
    },
  });
}
