import { IDatabase } from './IDatabase';
import { SupabaseAdapter } from './adapters/SupabaseAdapter';
import { FirebaseAdapter } from './adapters/FirebaseAdapter';

export type DatabaseType = 'supabase' | 'firebase';

export interface DatabaseConfig {
    // Supabase config
    url?: string;
    anonKey?: string;

    // Firebase config
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
}

/**
 * Database Factory
 * Creates the appropriate database adapter based on configuration
 */
export class DatabaseFactory {
    static create(type: DatabaseType, config: DatabaseConfig): IDatabase {
        switch (type) {
            case 'supabase':
                if (!config.url || !config.anonKey) {
                    throw new Error('Supabase requires url and anonKey in config');
                }
                return new SupabaseAdapter(config.url, config.anonKey);

            case 'firebase':
                if (!config.apiKey || !config.projectId) {
                    throw new Error('Firebase requires apiKey and projectId in config');
                }
                return new FirebaseAdapter(config);

            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }
}
