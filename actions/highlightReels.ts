"use server";

import { revalidatePath } from "next/cache";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { trimClip } from "@/lib/ffmpeg/trim";
import { concatClips } from "@/lib/ffmpeg/concat";
import { REEL_ELIGIBLE_HIGHLIGHT_WHERE } from "@/lib/highlightReelEligibility";
import { requireUser } from "@/lib/auth/session";
import { requireProjectEditAccess } from "@/lib/auth/authorize";

export async function createHighlightReel(
  projectId: string,
  tagId: string,
  name: string,
) {
  const user = await requireUser();
  await requireProjectEditAccess(projectId, user.id);

  const reel = await db.highlightReel.create({
    data: { projectId, tagId, name: name.trim() || "Untitled reel" },
  });

  revalidatePath(`/projects/${projectId}/tags/${tagId}`);

  // Long-running self-hosted Node process, not a serverless function — this
  // detached task keeps running after the action returns; the client polls
  // the reel status route for completion.
  void processHighlightReel(reel.id);

  return reel;
}

async function processHighlightReel(reelId: string) {
  const reel = await db.highlightReel.findUnique({ where: { id: reelId } });
  if (!reel) return;

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "highlight-reel-"));

  try {
    await db.highlightReel.update({
      where: { id: reelId },
      data: { status: "PROCESSING" },
    });

    const highlights = await db.highlight.findMany({
      where: {
        tagAssignments: { some: { tagId: reel.tagId } },
        ...REEL_ELIGIBLE_HIGHLIGHT_WHERE,
      },
      orderBy: { createdAt: "asc" },
      include: { attachment: true },
    });

    if (highlights.length === 0) {
      throw new Error(
        "No tagged highlights have a video/audio clip range to include.",
      );
    }

    const clipPaths: string[] = [];
    for (const [i, highlight] of highlights.entries()) {
      const attachment = highlight.attachment!;
      const sourceBuffer = await storage.read(attachment.storageKey);
      const sourcePath = path.join(tmpDir, `source-${i}${path.extname(attachment.originalName) || ".mp4"}`);
      await writeFile(sourcePath, sourceBuffer);

      const clipPath = path.join(tmpDir, `clip-${i}.mp4`);
      await trimClip(sourcePath, clipPath, highlight.clipStartSec!, highlight.clipEndSec!);
      clipPaths.push(clipPath);
    }

    const outputPath = path.join(tmpDir, "output.mp4");
    await concatClips(clipPaths, outputPath);

    const outputBuffer = await readFile(outputPath);
    const storageKey = `highlight-reels/${reelId}/${randomUUID()}.mp4`;
    await storage.save(storageKey, outputBuffer);

    await db.highlightReel.update({
      where: { id: reelId },
      data: { status: "DONE", storageKey },
    });
  } catch (err) {
    console.error("processHighlightReel failed", err);
    await db.highlightReel.update({
      where: { id: reelId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Reel generation failed",
      },
    });
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
