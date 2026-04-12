import { ProfileRepository } from '../repositories/ProfileRepository.js';
import type { NewProfile } from '../repositories/schema/index.js';
import { IAuthProvider } from '../providers/auth/IAuthProvider.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

export class UserService {
  private profileRepo: ProfileRepository;

  constructor(private authProvider: IAuthProvider) {
    this.profileRepo = new ProfileRepository(getDb());
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Resolve an identifier (email OR student ID) to an email address.
   */
  private async resolveEmail(identifier: string): Promise<string> {
    if (identifier.includes('@')) return identifier;

    const profile = await this.profileRepo.findByStudentId(identifier);
    if (!profile) throw AppError.forbidden('Invalid credentials');
    return profile.email;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  /**
   * Sign in using email or student ID + password.
   * Returns a JWT token and the user profile.
   */
  async signIn(identifier: string, password: string) {
    const email = await this.resolveEmail(identifier);
    const { token, user } = await this.authProvider.signIn(email, password);

    const profile = await this.profileRepo.findByEmail(user.email);
    if (!profile) throw AppError.notFound('Profile not found in database');
    if (!profile.is_active) throw AppError.forbidden('Your account has been deactivated');

    return { token, profile };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const profile = await this.profileRepo.findById(userId);
    if (!profile) throw AppError.notFound('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<NewProfile>) {
    return this.profileRepo.update(userId, updates);
  }

  // ─── Sign-up OTP flow ─────────────────────────────────────────────────────

  /**
   * Step 1: Send a sign-up OTP to the provided email.
   * Returns a pre-generated student ID so the frontend can display it to the user.
   */
  async requestSignUpOtp(
    email: string,
    data: {
      fullName: string;
      alYear: number;
      center: 'online' | 'riochem' | 'vision';
      nic: string;
      whatsappNo: string;
      mobileNo: string;
      password?: string;
    }
  ): Promise<{ studentId: string }> {
    // Prevent duplicate accounts
    const existing = await this.profileRepo.findByEmail(email);
    if (existing) throw AppError.badRequest('Email is already registered');

    // Pre-generate student ID so it can be shown before OTP is verified
    const studentId = await this.profileRepo.generateStudentId(data.alYear, data.center);

    // Send OTP — pass metadata so it arrives in the email template
    await this.authProvider.sendOtp(email, {
      full_name: data.fullName,
      al_year: data.alYear.toString(),
      center: data.center,
      student_id: studentId,
      nic: data.nic,
      whatsapp_no: data.whatsappNo,
      mobile_no: data.mobileNo,
    });

    return { studentId };
  }

  /**
   * Step 2: Verify OTP and create the profile in the DB.
   */
  async verifySignUpOtp(
    email: string,
    token: string,
    data: {
      fullName: string;
      alYear: number;
      center: 'online' | 'riochem' | 'vision';
      password?: string;
      studentId?: string;
    }
  ): Promise<{ user: { id: string }; profile: Awaited<ReturnType<ProfileRepository['create']>> }> {
    // Verify OTP with Supabase — this creates the auth user
    const authUser = await this.authProvider.verifyOtp(email, token);

    // If profile already exists (e.g., retry), return it as-is
    const existing = await this.profileRepo.findById(authUser.id);
    if (existing) return { user: authUser, profile: existing };

    // Generate or reuse student ID
    const studentId = data.studentId ?? await this.profileRepo.generateStudentId(data.alYear, data.center);

    // If a password was supplied, set it via the admin API
    if (data.password) {
      await this.authProvider.updatePassword(authUser.id, data.password);
    }

    // Create profile record
    const profile = await this.profileRepo.create({
      id: authUser.id,
      email,
      full_name: data.fullName,
      al_year: data.alYear,
      center: data.center,
      student_id: studentId,
      role: 'student',
      is_active: true,
    });

    return { user: authUser, profile };
  }

  // ─── Password reset OTP flow ──────────────────────────────────────────────

  /**
   * Step 1: Send a password-reset OTP.
   * Accepts email or student ID as identifier.
   * Returns the resolved email so the frontend can display it.
   */
  async requestPasswordResetOtp(identifier: string): Promise<{ email: string }> {
    const email = await this.resolveEmail(identifier);

    // Ensure account exists before sending OTP
    const profile = await this.profileRepo.findByEmail(email);
    if (!profile) throw AppError.notFound('Account not found');

    // Reuse the sendOtp method for password reset (recovery type)
    await this.authProvider.sendOtp(email);

    return { email };
  }

  /**
   * Step 2: Verify OTP and set a new password.
   */
  async resetPasswordWithOtp(email: string, token: string, newPassword: string): Promise<void> {
    // Verify the OTP — this logs the user in temporarily
    const authUser = await this.authProvider.verifyOtp(email, token);

    // Use admin API to update password
    await this.authProvider.updatePassword(authUser.id, newPassword);
  }
}
