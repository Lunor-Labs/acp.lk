import { createClient } from '@supabase/supabase-js';
import { AppError } from '../../utils/errors.js';
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
export class SupabaseAuthProvider {
    client;
    constructor(supabaseUrl, supabaseServiceKey) {
        // NOTE: Uses service key (not anon key) — server-side only
        this.client = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    async verifyToken(token) {
        const { data, error } = await this.client.auth.getUser(token);
        if (error || !data.user) {
            throw AppError.unauthorized('Invalid or expired token');
        }
        return {
            id: data.user.id,
            email: data.user.email ?? '',
        };
    }
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) {
            throw AppError.unauthorized(error?.message || 'Invalid credentials');
        }
        return {
            token: data.session.access_token,
            user: { id: data.user.id, email: data.user.email ?? '' },
        };
    }
    async sendOtp(email, metadata) {
        const { error } = await this.client.auth.signInWithOtp({
            email,
            options: metadata ? { data: metadata } : undefined,
        });
        if (error)
            throw new Error(error.message);
    }
    async verifyOtp(email, token) {
        const { data, error } = await this.client.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        if (error || !data.user) {
            throw AppError.unauthorized(error?.message || 'Invalid OTP');
        }
        return { id: data.user.id, email: data.user.email ?? '' };
    }
    async updatePassword(userId, newPassword) {
        const { error } = await this.client.auth.admin.updateUserById(userId, {
            password: newPassword,
        });
        if (error)
            throw new Error(error.message);
    }
    async signOut(_token) {
        // With service key, sign-out is a no-op (stateless JWT).
        // For session-based auth, implement token revocation here.
    }
}
//# sourceMappingURL=SupabaseAuthProvider.js.map