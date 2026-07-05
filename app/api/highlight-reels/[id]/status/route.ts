import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const reel = await db.highlightReel.findUnique({
    where: { id },
    select: { status: true, errorMessage: true },
  });
  if (!reel) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: reel.status,
    errorMessage: reel.errorMessage,
  });
}
