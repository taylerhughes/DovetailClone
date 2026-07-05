import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectAccess } from "@/lib/auth/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reel = await db.highlightReel.findUnique({
    where: { id },
    select: { status: true, errorMessage: true, projectId: true },
  });
  if (!reel || !(await hasProjectAccess(reel.projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: reel.status,
    errorMessage: reel.errorMessage,
  });
}
