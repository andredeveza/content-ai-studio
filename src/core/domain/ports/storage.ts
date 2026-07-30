export interface UploadInput {
  readonly path: string;
  readonly file: Buffer;
  readonly contentType: string;
}

export interface StoragePort {
  upload(input: UploadInput): Promise<{ path: string; publicUrl: string }>;
  remove(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}
