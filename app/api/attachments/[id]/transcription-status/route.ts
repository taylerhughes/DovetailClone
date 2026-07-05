import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    select: {
      transcriptionStatus: true,
      transcriptionError: true,
      note: { select: { projectId: true } },
    },
  });
  if (!attachment || !(await hasProjectViewAccess(attachment.note.projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: attachment.transcriptionStatus,
    error: attachment.transcriptionError,
  });
}
