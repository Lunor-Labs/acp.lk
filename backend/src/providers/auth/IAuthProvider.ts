/**
 * Auth Provider Interface
 *
 * Abstracts authentication operations.
 * Swap implementations (Supabase → Firebase → Auth0) without touching services.
 */
export interface AuthUser {
  id: string;
  email: string;
}

export interface IAuthProvider {
  /**
   * Verify a JWT token and return the authenticated user.
   * Throws if the token is invalid or expired.
   */
  verifyToken(token: string): Promise<AuthUser>;

  /**
   * Sign in with email + password. Returns a session token.
   */
  signIn(email: string, password: string): Promise<{ token: string; user: AuthUser }>;

  /**
   * Send an OTP email to the given address.
   * Optional metadata is forwarded to the email template.
   */
  sendOtp(email: string, metadata?: Record<string, string>): Promise<void>;

  /**
   * Verify an OTP token for an email. Returns the user on success.
   */
  verifyOtp(email: string, token: string): Promise<AuthUser>;

  /**
   * Update the password for the currently authenticated user (by userId).
   */
  updatePassword(userId: string, newPassword: string): Promise<void>;

  /**
   * Sign out a user session (if applicable; no-op for pure JWT providers).
   */
  signOut(token: string): Promise<void>;
}
