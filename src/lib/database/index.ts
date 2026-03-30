import { DatabaseFactory, DatabaseType } from './DatabaseFactory';
import { IDatabase } from './IDatabase';

/**
 * Database Instance
 * 
 * This is the main database instance used throughout the application.
 * To switch databases, simply change the VITE_DB_TYPE environment variable.
 * 
 * Supported values:
 * - 'supabase' (default) - PostgreSQL via Supabase
 * - 'firebase' - Firebase Firestore (when implemented)
 */

// Read database type from environment variable
const DB_TYPE = (import.meta.env.VITE_DB_TYPE || 'supabase') as DatabaseType;

// Create database instance based on type
let db: IDatabase;

if (DB_TYPE === 'supabase') {
    db = DatabaseFactory.create('supabase', {
        url: import.meta.env.VITE_SUPABASE_URL || 'https://bmkrvgyjmtvcxatlashi.supabase.co',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ||
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJta3J2Z3lqbXR2Y3hhdGxhc2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODQzMjksImV4cCI6MjA4NjY2MDMyOX0.V9akkQdVc8b_BuopM8IapM2WH61_2gUqTSM4aG4bOpU'
    });
} else if (DB_TYPE === 'firebase') {
    db = DatabaseFactory.create('firebase', {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    });
} else {
    throw new Error(`Unsupported database type: ${DB_TYPE}`);
}

// Export the database instance
export { db };

// Re-export types for convenience
export * from './IDatabase';
export type { DatabaseType } from './DatabaseFactory';
