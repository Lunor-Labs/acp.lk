import { ProfileRepository } from '../repositories/ProfileRepository.js';
import type { NewProfile } from '../repositories/schema/index.js';
import { JwtAuthProvider } from '../providers/auth/JwtAuthProvider.js';
import { OtpService } from './otpService.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

const jwtAuth = new JwtAuthProvider();

export class UserService {
  private profileRepo: ProfileRepository;

  constructor() {
    this.profileRepo = new ProfileRepository(getDb());
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolveEmail(identifier: string): Promise<string> {
    if (identifier.includes('@')) return identifier.trim();
    const profile = await this.profileRepo.findByStudentId(identifier.trim());
    if (!profile) throw AppError.forbidden('Invalid credentials');
    return profile.email;
  }

  // ─── Sign in ──────────────────────────────────────────────────────────────

  async signIn(identifier: string, password: string) {
    const email = await this.resolveEmail(identifier);

    const profile = await this.profileRepo.findByEmail(email);
    if (!profile) throw AppError.unauthorized('Invalid credentials');
    if (!profile.is_active) throw AppError.forbidden('Your account has been deactivated');
    if (!profile.password_hash) throw AppError.unauthorized('Invalid credentials');

    const valid = await jwtAuth.verifyPassword(password, profile.password_hash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const token = await jwtAuth.generateToken({
      id: profile.id,
      email: profile.email,
    });

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

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const profile = await this.profileRepo.findById(userId);
    if (!profile) throw AppError.notFound('Profile not found');
    if (!profile.password_hash) throw AppError.badRequest('No password set');

    const valid = await jwtAuth.verifyPassword(currentPassword, profile.password_hash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const hash = await jwtAuth.hashPassword(newPassword);
    await this.profileRepo.update(userId, { password_hash: hash });
  }

  // ─── Sign-up OTP flow ─────────────────────────────────────────────────────

  async requestSignUpOtp(
    email: string,
    data: {
      fullName: string;
      alYear: number;
      center: 'online' | 'riochem' | 'vision';
      nic: string;
      whatsappNo: string;
      mobileNo: string;
      password: string;
    }
  ): Promise<{ studentId: string }> {
    const existing = await this.profileRepo.findByEmail(email);
    if (existing) throw AppError.conflict('Email is already registered');

    const studentId = await this.profileRepo.generateStudentId(data.alYear, data.center);

    // Store signup data in OTP metadata so we have it at verify step
    await OtpService.send(email, 'signup', {
      full_name: data.fullName,
      al_year: String(data.alYear),
      center: data.center,
      student_id: studentId,
      nic: data.nic,
      whatsapp_no: data.whatsappNo,
      mobile_no: data.mobileNo,
      password: data.password,   // stored temporarily, used at verify step
    });

    return { studentId };
  }

  async verifySignUpOtp(
    email: string,
    code: string,
    data: {
      fullName: string;
      alYear: number;
      center: 'online' | 'riochem' | 'vision';
      password?: string;
      studentId?: string;
    }
  ): Promise<{ user: { id: string }; profile: Awaited<ReturnType<ProfileRepository['create']>> }> {
    // Verify OTP — throws if invalid or expired
    const { metadata } = await OtpService.verify(email, code, 'signup');

    // If profile already exists (retry case), return it
    const existing = await this.profileRepo.findByEmail(email);
    if (existing) return { user: { id: existing.id }, profile: existing };

    // Resolve values — prefer metadata stored at OTP send time
    const fullName = metadata?.full_name ?? data.fullName;
    const alYear = metadata?.al_year ? parseInt(metadata.al_year) : data.alYear;
    const center = (metadata?.center ?? data.center) as 'online' | 'riochem' | 'vision';
    const studentId = metadata?.student_id ?? data.studentId
      ?? await this.profileRepo.generateStudentId(alYear, center);
    const rawPassword = metadata?.password ?? data.password;

    if (!rawPassword) throw AppError.badRequest('Password is required');

    const password_hash = await jwtAuth.hashPassword(rawPassword);
    const id = crypto.randomUUID();

    const profile = await this.profileRepo.create({
      id,
      email,
      full_name: fullName,
      al_year: alYear,
      center,
      student_id: studentId,
      role: 'student',
      is_active: true,
      password_hash,
      nic: metadata?.nic,
      whatsapp_no: metadata?.whatsapp_no,
      mobile_no: metadata?.mobile_no,
    });

    return { user: { id }, profile };
  }

  // ─── Password reset OTP flow ──────────────────────────────────────────────

  async requestPasswordResetOtp(identifier: string): Promise<{ email: string }> {
    const email = await this.resolveEmail(identifier);
    const profile = await this.profileRepo.findByEmail(email);
    if (!profile) throw AppError.notFound('Account not found');

    await OtpService.send(email, 'reset');
    return { email };
  }

  async resetPasswordWithOtp(email: string, code: string, newPassword: string): Promise<void> {
    await OtpService.verify(email, code, 'reset');

    const profile = await this.profileRepo.findByEmail(email);
    if (!profile) throw AppError.notFound('Account not found');

    const password_hash = await jwtAuth.hashPassword(newPassword);
    await this.profileRepo.update(profile.id, { password_hash });
  }
}