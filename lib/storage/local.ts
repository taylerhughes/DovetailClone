import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./types";

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    const resolved = path.resolve(this.baseDir, key);
    if (!resolved.startsWith(path.resolve(this.baseDir))) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async save(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
