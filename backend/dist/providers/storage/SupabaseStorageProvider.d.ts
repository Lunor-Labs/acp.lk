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
export declare class SupabaseStorageProvider implements IStorageProvider {
    private client;
    constructor(supabaseUrl: string, supabaseServiceKey: string);
    upload(bucket: string, path: string, file: Buffer, mimeType: string, options?: {
        upsert?: boolean;
    }): Promise<UploadResult>;
    getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
    getPublicUrl(bucket: string, path: string): string;
    delete(bucket: string, paths: string[]): Promise<void>;
}
//# sourceMappingURL=SupabaseStorageProvider.d.ts.map