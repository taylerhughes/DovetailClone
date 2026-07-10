import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plainTextToDoc } from "@/lib/editor/plainTextToDoc";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const integration = await db.integration.findUnique({
    where: { secret: token, enabled: true },
    select: { id: true, projectId: true },
  });

  if (!integration) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    await db.integrationEvent.create({
      data: { integrationId: integration.id, status: "error", error: "Invalid JSON body" },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = (body.title ?? "Untitled").slice(0, 500);
  const content = plainTextToDoc(body.content ?? "");
  const plainText = (body.content ?? "").slice(0, 100_000);

  try {
    const note = await db.note.create({
      data: {
        projectId: integration.projectId,
        title,
        content: content as unknown as Prisma.InputJsonValue,
        plainText,
      },
      select: { id: true },
    });

    await db.integrationEvent.create({
      data: { integrationId: integration.id, status: "ok", noteId: note.id },
    });

    return NextResponse.json({ noteId: note.id });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await db.integrationEvent.create({
      data: { integrationId: integration.id, status: "error", error },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
