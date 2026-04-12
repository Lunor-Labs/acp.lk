import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { IAuthProvider } from '../providers/auth/IAuthProvider.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

export class UserService {
  private profileRepo: ProfileRepository;

  constructor(private authProvider: IAuthProvider) {
    this.profileRepo = new ProfileRepository(getDb());
  }

  /**
   * Translates a user identifier (which can be an email OR a student ID)
   * into their email address.
   */
  private async resolveEmail(identifier: string): Promise<string> {
    if (identifier.includes('@')) {
      return identifier;
    }

    const profile = await this.profileRepo.findByStudentId(identifier);
    if (!profile) {
      throw AppError.forbidden('Invalid credentials');
    }
    return profile.email;
  }

  /**
   * Sign in using email or student ID.
   */
  async signIn(identifier: string, password: string) {
    const email = await this.resolveEmail(identifier);
    const { token, user } = await this.authProvider.signIn(email, password);

    // Verify profile exists in our DB
    const profile = await this.profileRepo.findByEmail(user.email);
    if (!profile) {
      throw AppError.notFound('Profile not found in database');
    }

    if (!profile.is_active) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    return { token, profile };
  }

  /**
   * Get a user's full profile by ID
   */
  async getProfile(userId: string) {
    const profile = await this.profileRepo.findById(userId);
    if (!profile) {
      throw AppError.notFound('Profile not found');
    }
    return profile;
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, updates: Parameters<ProfileRepository['update']>[1]) {
    return this.profileRepo.update(userId, updates);
  }

  /**
   * Request sign-up OTP
   */
  async requestSignUpOtp(data: {
    email: string;
    fullName: string;
    alYear: number;
    center: 'online' | 'riochem' | 'vision';
  }) {
    // Check if email already in use
    const existing = await this.profileRepo.findByEmail(data.email);
    if (existing) {
      throw AppError.badRequest('Email is already registered');
    }

    // Generate specific metadata to pass with OTP for confirmation
    await this.authProvider.sendOtp(data.email, {
      full_name: data.fullName,
      al_year: data.alYear.toString(),
      center: data.center
    });
  }

  /**
   * Verify signup OTP and initialize DB profile
   */
  async verifySignUpOtp(email: string, token: string, password?: string) {
    const user = await this.authProvider.verifyOtp(email, token);

    const existing = await this.profileRepo.findById(user.id);
    if (existing) {
      return { user, profile: existing };
    }

    // Usually metadata is kept in local storage during sign up flow on frontend
    // Assuming for now the frontend passes the required fields back or we update them later
    // In our architecture, the profile should be created.
    throw new Error("Creation context needed. Ensure frontend passes al_year and center to finish profile creation.");
  }

  /**
   * Register Profile (if bypass OTP or after verify)
   */
  async registerProfile(
    userId: string,
    email: string,
    fullName: string,
    alYear: number,
    center: 'online' | 'riochem' | 'vision'
  ) {
    const studentId = await this.profileRepo.generateStudentId(alYear, center);
    
    const profile = await this.profileRepo.create({
      id: userId,
      email,
      full_name: fullName,
      al_year: alYear,
      center,
      student_id: studentId,
      role: 'student',
      is_active: true
    });

    return profile;
  }
}
