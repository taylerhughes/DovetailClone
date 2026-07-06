import path from "node:path";
import { LocalStorageAdapter } from "./local";
import { S3StorageAdapter } from "./s3";
import type { StorageAdapter } from "./types";

function createStorageAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  switch (driver) {
    case "local": {
      const dir = process.env.STORAGE_LOCAL_DIR ?? ".data/uploads";
      return new LocalStorageAdapter(path.resolve(process.cwd(), dir));
    }
    case "s3": {
      const bucket = process.env.AWS_S3_BUCKET;
      if (!bucket) {
        throw new Error("STORAGE_DRIVER=s3 requires AWS_S3_BUCKET to be set");
      }
      const region = process.env.AWS_REGION ?? "us-east-1";
      return new S3StorageAdapter(bucket, region);
    }
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}

export const storage = createStorageAdapter();
export type { StorageAdapter } from "./types";
