import { runFfmpeg } from "@/lib/ffmpeg/exec";

/**
 * Extracts a single frame at `atSec` from `inputPath` into `outputPath` as a
 * JPEG. Seeking before -i (rather than after) lets ffmpeg jump straight to
 * the nearest keyframe instead of decoding from the start of the file.
 */
export async function extractFrame(
  inputPath: string,
  outputPath: string,
  atSec: number,
): Promise<void> {
  await runFfmpeg([
    "-y",
    "-ss",
    String(Math.max(0, atSec)),
    "-i",
    inputPath,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    outputPath,
  ]);
}
