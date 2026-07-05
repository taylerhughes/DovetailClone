export interface StoredFile {
  data: Buffer;
  mimeType: string;
}

export interface StorageAdapter {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
