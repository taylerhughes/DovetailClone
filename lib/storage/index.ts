import path from "node:path";
import { LocalStorageAdapter } from "./local";
import type { StorageAdapter } from "./types";

function createStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  switch (driver) {
    case "local": {
      const dir = process.env.STORAGE_LOCAL_DIR ?? ".data/uploads";
      return new LocalStorageAdapter(path.resolve(process.cwd(), dir));
    }
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}

export const storage = createStorageAdapter();
export type { StorageAdapter } from "./types";
