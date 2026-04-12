/**
 * Storage Provider Interface
 *
 * Abstracts file storage operations.
 * Swap implementations (Supabase Storage → S3 → R2) without touching services.
 */
export interface UploadResult {
  path: string;
  publicUrl: string | null;
}

export interface IStorageProvider {
  /**
   * Upload a file buffer to storage.
   * Returns the storage path and (if the bucket is public) a public URL.
   */
  upload(
    bucket: string,
    path: string,
    file: Buffer,
    mimeType: string,
    options?: { upsert?: boolean }
  ): Promise<UploadResult>;

  /**
   * Generate a signed URL for private file access.
   * @param expiresIn - seconds until the URL expires
   */
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>;

  /**
   * Get a permanent public URL for a file in a public bucket.
   */
  getPublicUrl(bucket: string, path: string): string;

  /**
   * Delete one or more files from storage.
   */
  delete(bucket: string, paths: string[]): Promise<void>;
}
