import { createClient } from '@supabase/supabase-js';
/**
 * Supabase Storage Provider
 *
 * Uses Supabase Storage with the service key for server-side file operations.
 *
 * To swap to AWS S3:
 *  1. Create S3StorageProvider implementing IStorageProvider
 *  2. Register it in providers/index.ts
 */
export class SupabaseStorageProvider {
    client;
    constructor(supabaseUrl, supabaseServiceKey) {
        this.client = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    async upload(bucket, path, file, mimeType, options = {}) {
        const { error } = await this.client.storage.from(bucket).upload(path, file, {
            contentType: mimeType,
            upsert: options.upsert ?? false,
        });
        if (error)
            throw new Error(error.message);
        const publicUrl = this.getPublicUrl(bucket, path);
        return { path, publicUrl };
    }
    async getSignedUrl(bucket, path, expiresIn) {
        const { data, error } = await this.client.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error || !data?.signedUrl) {
            throw new Error(error?.message || 'Failed to create signed URL');
        }
        return data.signedUrl;
    }
    getPublicUrl(bucket, path) {
        const { data } = this.client.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
    async delete(bucket, paths) {
        const { error } = await this.client.storage.from(bucket).remove(paths);
        if (error)
            throw new Error(error.message);
    }
}
//# sourceMappingURL=SupabaseStorageProvider.js.map