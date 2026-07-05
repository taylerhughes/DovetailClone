import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync("ffmpeg", args, { maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      throw new Error("ffmpeg is not installed or not on PATH");
    }
    throw err;
  }
}
