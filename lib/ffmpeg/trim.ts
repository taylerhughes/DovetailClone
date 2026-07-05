import { runFfmpeg } from "@/lib/ffmpeg/exec";

const NORMALIZED_SCALE =
  "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black";

/**
 * Trims [startSec, endSec) from `inputPath` into `outputPath`, re-encoding to
 * a common H.264/AAC/720p baseline so clips from different source videos can
 * later be concatenated with a fast stream-copy instead of another re-encode.
 */
export async function trimClip(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
): Promise<void> {
  const duration = Math.max(0.1, endSec - startSec);
  await runFfmpeg([
    "-y",
    "-ss",
    String(startSec),
    "-i",
    inputPath,
    "-t",
    String(duration),
    "-vf",
    NORMALIZED_SCALE,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-ar",
    "44100",
    "-ac",
    "2",
    outputPath,
  ]);
}
