import type { IAuthProvider, AuthUser } from './IAuthProvider.js';
/**
 * Supabase Auth Provider
 *
 * Uses Supabase's service key for server-side auth operations.
 * The service key bypasses Row Level Security — keep it server-side only.
 *
 * To swap to another provider (Firebase, Auth0, etc.):
 *  1. Create a new class implementing IAuthProvider
 *  2. Register it in providers/index.ts
 */
export declare class SupabaseAuthProvider implements IAuthProvider {
    private client;
    constructor(supabaseUrl: string, supabaseServiceKey: string);
    verifyToken(token: string): Promise<AuthUser>;
    signIn(email: string, password: string): Promise<{
        token: string;
        user: AuthUser;
    }>;
    sendOtp(email: string, metadata?: Record<string, string>): Promise<void>;
    verifyOtp(email: string, token: string): Promise<AuthUser>;
    updatePassword(userId: string, newPassword: string): Promise<void>;
    signOut(_token: string): Promise<void>;
}
//# sourceMappingURL=SupabaseAuthProvider.d.ts.map