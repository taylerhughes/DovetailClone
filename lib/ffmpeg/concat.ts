import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { runFfmpeg } from "@/lib/ffmpeg/exec";

/** Concatenates already-normalized clips (same codec/resolution/fps) via ffmpeg's concat demuxer, stream-copying without re-encoding. */
export async function concatClips(
  clipPaths: string[],
  outputPath: string,
): Promise<void> {
  const listFile = path.join(os.tmpdir(), `concat-${randomUUID()}.txt`);
  const listContent = clipPaths
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n");
  await writeFile(listFile, listContent, "utf-8");

  try {
    await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listFile,
      "-c",
      "copy",
      outputPath,
    ]);
  } finally {
    await unlink(listFile).catch(() => {});
  }
}
