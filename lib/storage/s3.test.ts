import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class FakeCommand {
    constructor(public input: unknown) {}
  }
  class FakeS3Client {
    send = sendMock;
  }
  return {
    S3Client: FakeS3Client,
    PutObjectCommand: class extends FakeCommand {},
    GetObjectCommand: class extends FakeCommand {},
    DeleteObjectCommand: class extends FakeCommand {},
  };
});

import { S3StorageAdapter } from "./s3";

beforeEach(() => {
  sendMock.mockReset();
});

describe("S3StorageAdapter", () => {
  it("save sends a PutObjectCommand with the bucket/key/body", async () => {
    sendMock.mockResolvedValue({});
    const adapter = new S3StorageAdapter("my-bucket", "us-east-1");

    await adapter.save("notes/abc/file.png", Buffer.from("hello"));

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command.input).toEqual({
      Bucket: "my-bucket",
      Key: "notes/abc/file.png",
      Body: Buffer.from("hello"),
    });
  });

  it("read converts the response body to a Buffer via transformToByteArray", async () => {
    sendMock.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) },
    });
    const adapter = new S3StorageAdapter("my-bucket", "us-east-1");

    const result = await adapter.read("notes/abc/file.png");

    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it("read converts an async-iterable body to a Buffer when transformToByteArray is unavailable", async () => {
    async function* fakeStream() {
      yield new Uint8Array([1, 2]);
      yield new Uint8Array([3]);
    }
    sendMock.mockResolvedValue({ Body: fakeStream() });
    const adapter = new S3StorageAdapter("my-bucket", "us-east-1");

    const result = await adapter.read("notes/abc/file.png");

    expect(result).toEqual(Buffer.from([1, 2, 3]));
  });

  it("read throws when the response has no body", async () => {
    sendMock.mockResolvedValue({});
    const adapter = new S3StorageAdapter("my-bucket", "us-east-1");

    await expect(adapter.read("missing-key")).rejects.toThrow(/no body/i);
  });

  it("delete sends a DeleteObjectCommand with the bucket/key", async () => {
    sendMock.mockResolvedValue({});
    const adapter = new S3StorageAdapter("my-bucket", "us-east-1");

    await adapter.delete("notes/abc/file.png");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command.input).toEqual({ Bucket: "my-bucket", Key: "notes/abc/file.png" });
  });
});
