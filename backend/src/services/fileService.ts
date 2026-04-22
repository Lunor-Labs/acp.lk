import { SupabaseStorageProvider } from '../providers/storage/SupabaseStorageProvider.js';
import { env } from '../config/env.js';

export class FileService {
  private storage: SupabaseStorageProvider;

  constructor() {
    this.storage = new SupabaseStorageProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }

  async getSignedUploadUrl({ bucket, path }: { bucket: string; path: string }) {
    return this.storage.createSignedUploadUrl(bucket, path);
  }
  
  // Note: the backend SupabaseClient.storage.from().createSignedUploadUrl 
  // is specifically designed for uploads. Let's add it.

  getPublicUrl(bucket: string, path: string) {
    return this.storage.getPublicUrl(bucket, path);
  }
}

let fileServiceInstance: FileService;
export function getFileService() {
  if (!fileServiceInstance) {
    fileServiceInstance = new FileService();
  }
  return fileServiceInstance;
}
