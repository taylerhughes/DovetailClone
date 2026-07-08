import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Generates a presigned S3 PUT URL for direct browser-to-S3 upload.
 * Only available when STORAGE_DRIVER=s3.
 */
export async function createPresignedUploadUrl(
  key: string,
  mimeType: string,
  sizeBytes: number,
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "us-east-1";
  if (!bucket) throw new Error("AWS_S3_BUCKET is not set");

  const client = new S3Client({ region });
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
  });

  return getSignedUrl(client, command, { expiresIn: 300 });
}

export async function createPresignedGetUrl(key: string): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "us-east-1";
  if (!bucket) throw new Error("AWS_S3_BUCKET is not set");

  const client = new S3Client({ region });
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export function isPresignedUploadAvailable(): boolean {
  return process.env.STORAGE_DRIVER === "s3" && !!process.env.AWS_S3_BUCKET;
}
