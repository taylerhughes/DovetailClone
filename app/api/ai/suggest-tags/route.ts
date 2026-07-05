import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { suggestTags } from "@/lib/ai/tagging";

const bodySchema = z.object({
  projectId: z.string(),
  text: z.string(),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { projectId, text } = parsed.data;

  const tags = await db.tag.findMany({
    where: { projectId },
    select: { id: true, name: true },
  });

  try {
    const suggestions = await suggestTags(text, tags);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("suggest-tags failed", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
