import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../providers/db/drizzle.js';
import { otpCodes } from '../repositories/schema/otp_codes.js';
import { EmailService } from './emailService.js';
import { AppError } from '../utils/errors.js';

const OTP_EXPIRY_MINUTES = 10;

export const OtpService = {

  // ─── Generate & send ──────────────────────────────────────────────────────

  async send(
    email: string,
    purpose: 'signup' | 'reset',
    metadata?: Record<string, string>
  ): Promise<void> {
    const db = getDb();

    // Generate a 6-digit numeric code
    const code = String(parseInt(randomBytes(3).toString('hex'), 16)).slice(0, 6).padStart(6, '0');
    const hash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const id = randomBytes(16).toString('hex');

    // Invalidate any existing OTPs for this email + purpose
    await db
      .update(otpCodes)
      .set({ used: true })
      .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose)));

    // Store the new OTP
    await db.insert(otpCodes).values({
      id,
      email,
      code: hash,
      purpose,
      metadata: metadata ? JSON.stringify(metadata) : null,
      used: false,
      expires_at: expiresAt,
    });

    // Send the email
    await EmailService.sendOtp(email, code, purpose, {
      studentId: metadata?.student_id,
      fullName: metadata?.full_name,
    });
  },

  // ─── Verify ───────────────────────────────────────────────────────────────

  async verify(
    email: string,
    code: string,
    purpose: 'signup' | 'reset'
  ): Promise<{ metadata: Record<string, string> | null }> {
    const db = getDb();

    const now = new Date();

    // Find the latest unused, unexpired OTP for this email + purpose
    const results = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.purpose, purpose),
          eq(otpCodes.used, false),
          gt(otpCodes.expires_at, now)
        )
      )
      .orderBy(otpCodes.created_at)
      .limit(1);

    const otp = results[0];
    if (!otp) {
      throw AppError.badRequest('OTP expired or not found. Please request a new one.');
    }

    const valid = await bcrypt.compare(code, otp.code);
    if (!valid) {
      throw AppError.badRequest('Invalid OTP code.');
    }

    // Mark as used
    await db
      .update(otpCodes)
      .set({ used: true })
      .where(eq(otpCodes.id, otp.id));

    const metadata = otp.metadata ? JSON.parse(otp.metadata) : null;
    return { metadata };
  },
};