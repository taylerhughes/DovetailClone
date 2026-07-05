import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const attachment = await db.attachment.findUnique({
    where: { id },
    select: { transcriptionStatus: true, transcriptionError: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: attachment.transcriptionStatus,
    error: attachment.transcriptionError,
  });
}
