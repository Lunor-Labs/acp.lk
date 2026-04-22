import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { IStorageProvider, UploadResult } from './IStorageProvider.js';

/**
 * Supabase Storage Provider
 *
 * Uses Supabase Storage with the service key for server-side file operations.
 *
 * To swap to AWS S3:
 *  1. Create S3StorageProvider implementing IStorageProvider
 *  2. Register it in providers/index.ts
 */
export class SupabaseStorageProvider implements IStorageProvider {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async upload(
    bucket: string,
    path: string,
    file: Buffer,
    mimeType: string,
    options: { upsert?: boolean } = {}
  ): Promise<UploadResult> {
    const { error } = await this.client.storage.from(bucket).upload(path, file, {
      contentType: mimeType,
      upsert: options.upsert ?? false,
    });

    if (error) throw new Error(error.message);

    const publicUrl = this.getPublicUrl(bucket, path);
    return { path, publicUrl };
  }

  async getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || 'Failed to create signed URL');
    }
    return data.signedUrl;
  }

  async createSignedUploadUrl(bucket: string, path: string): Promise<{ signedUrl: string; token: string; path: string }> {
    const { data, error } = await this.client.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create signed upload URL');
    }
    return data;
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async delete(bucket: string, paths: string[]): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove(paths);
    if (error) throw new Error(error.message);
  }
}
