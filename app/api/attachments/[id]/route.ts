import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess, hasProjectEditAccess } from "@/lib/auth/authorize";

export async function GET(
  request: Request,
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

  let data;
  try {
    data = await storage.read(attachment.storageKey);
  } catch (err) {
    console.error("attachment read failed", err);
    return NextResponse.json({ error: "Failed to read attachment" }, { status: 500 });
  }

  const range = request.headers.get("range");

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : data.byteLength - 1;
      const chunk = data.subarray(start, end + 1);

      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Type": attachment.mimeType,
          "Content-Range": `bytes ${start}-${end}/${data.byteLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.byteLength),
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.originalName)}"`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(data.byteLength),
    },
  });
}

export async function DELETE(
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
  if (!attachment || !(await hasProjectEditAccess(attachment.note.projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    // Delete the DB row first: if this fails, nothing changed. Deleting
    // storage first risked leaving a row that permanently points at a
    // missing file if the DB call then failed — an orphaned file on disk
    // (cleaned up right after) is the safer side to fail on.
    const note = await db.attachment.delete({
      where: { id },
      select: { note: { select: { id: true, projectId: true } } },
    });

    try {
      await storage.delete(attachment.storageKey);
    } catch (err) {
      console.error("attachment storage cleanup failed", err);
    }

    revalidatePath(`/projects/${note.note.projectId}/data/${note.note.id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("attachment delete failed", err);
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
