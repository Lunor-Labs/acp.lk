import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { IAuthProvider, AuthUser } from './IAuthProvider.js';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

const SECRET = new TextEncoder().encode(env.JWT_SECRET);

export class JwtAuthProvider implements IAuthProvider {

  // ─── Token ────────────────────────────────────────────────────────────────

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.sub || !payload.email) {
        throw AppError.unauthorized('Invalid token payload');
      }
      return {
        id: payload.sub,
        email: payload.email as string,
      };
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  }

  async generateToken(user: AuthUser): Promise<string> {
    return new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(env.JWT_EXPIRES_IN)
      .sign(SECRET);
  }

  // ─── Password ─────────────────────────────────────────────────────────────

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ─── IAuthProvider interface ──────────────────────────────────────────────
  // These are called by UserService — they need the ProfileRepository
  // so the actual signIn logic lives in UserService.
  // These stubs satisfy the interface; real logic is in the service layer.

  async signIn(_email: string, _password: string): Promise<{ token: string; user: AuthUser }> {
    throw new Error('Use UserService.signIn() instead — needs DB access');
  }

  async sendOtp(_email: string, _metadata?: Record<string, string>): Promise<void> {
    throw new Error('Use OtpService.sendOtp() instead');
  }

  async verifyOtp(_email: string, _token: string): Promise<AuthUser> {
    throw new Error('Use OtpService.verifyOtp() instead');
  }

  async updatePassword(_userId: string, _newPassword: string): Promise<void> {
    throw new Error('Use UserService.updatePassword() instead — needs DB access');
  }

  async signOut(_token: string): Promise<void> {
    // Stateless JWT — no server-side session to invalidate
  }
}