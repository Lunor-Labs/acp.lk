import { S3StorageProvider } from '../providers/storage/S3StorageProvider.js';
import { env } from '../config/env.js';

const storage = new S3StorageProvider();

export const FileService = {

  // ─── Upload a file buffer ─────────────────────────────────────────────────

  async upload(
    path: string,
    file: Buffer,
    mimeType: string,
    options: { upsert?: boolean } = {}
  ) {
    return storage.upload(env.S3_BUCKET, path, file, mimeType, options);
  },

  // ─── Get a signed URL for private file download ───────────────────────────

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    return storage.getSignedUrl(env.S3_BUCKET, path, expiresIn);
  },

  // ─── Get a signed URL for direct browser upload ───────────────────────────

  async createSignedUploadUrl(path: string) {
    return storage.createSignedUploadUrl(env.S3_BUCKET, path);
  },

  // ─── Get a permanent public URL ───────────────────────────────────────────

  getPublicUrl(path: string): string {
    return storage.getPublicUrl(env.S3_BUCKET, path);
  },

  // ─── Delete files ─────────────────────────────────────────────────────────

  async delete(paths: string[]): Promise<void> {
    return storage.delete(env.S3_BUCKET, paths);
  },
};