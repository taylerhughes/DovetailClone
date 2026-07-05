import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAiEnabled } from "@/lib/ai/client";
import { suggestTags } from "@/lib/ai/tagging";
import { getCurrentUser } from "@/lib/auth/session";
import { hasProjectViewAccess } from "@/lib/auth/authorize";

const bodySchema = z.object({
  projectId: z.string(),
  text: z.string(),
});

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are disabled" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { projectId, text } = parsed.data;

  if (!(await hasProjectViewAccess(projectId, user.id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

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
