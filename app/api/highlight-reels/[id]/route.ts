import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess } from "@/lib/auth/authorize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reel = await db.highlightReel.findUnique({ where: { id } });
  if (
    !reel ||
    reel.status !== "DONE" ||
    !reel.storageKey ||
    !(await hasProjectViewAccess(reel.projectId, user.id))
  ) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const data = await storage.read(reel.storageKey);
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
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${data.byteLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.byteLength),
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `inline; filename="${encodeURIComponent(reel.name)}.mp4"`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(data.byteLength),
    },
  });
}
