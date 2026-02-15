import { IDatabase, AuthUser, AuthSession } from '../IDatabase';

/**
 * Firebase Database Adapter (Placeholder)
 * 
 * This is a placeholder implementation for future Firebase support.
 * When you're ready to switch to Firebase, implement this adapter
 * following the same pattern as SupabaseAdapter.
 * 
 * Required packages:
 * - firebase
 * - @firebase/firestore
 * - @firebase/auth
 */
export class FirebaseAdapter implements IDatabase {
    constructor(config: any) {
        throw new Error('Firebase adapter not yet implemented. Use Supabase for now.');
    }

    from<T>(table: string): any {
        throw new Error('Firebase adapter not yet implemented');
    }

    auth = {
        signIn: async (email: string, password: string) => {
            throw new Error('Firebase adapter not yet implemented');
        },

        signUp: async (email: string, password: string, metadata?: any) => {
            throw new Error('Firebase adapter not yet implemented');
        },

        signOut: async () => {
            throw new Error('Firebase adapter not yet implemented');
        },

        getSession: async () => {
            throw new Error('Firebase adapter not yet implemented');
        },

        onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => {
            throw new Error('Firebase adapter not yet implemented');
        }
    };
}
