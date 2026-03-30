import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/database';
import { ProfileRepository, Profile, ClassCenter } from '../repositories';

// ─── Center labels for UI ───────────────────────────────────────────────────
export const CENTER_LABELS: Record<ClassCenter, string> = {
  online: 'Online',
  riochem: 'Riochem',
  vision: 'Vision',
};

// ─── Pending registration data (held in memory between OTP steps) ─────────
export interface PendingRegisterData {
  fullName: string;
  role: string;
  alYear?: number;
  center?: ClassCenter;
  nic?: string;
  whatsappNo?: string;
  mobileNo?: string;
  password: string;
  studentId?: string; // pre-generated before OTP send
}

// ─── Context types ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  /**
   * Login: accepts Student ID (7 chars) or email + password.
   * Looks up email for Student IDs, then calls signInWithPassword.
   */
  signIn: (identifier: string, password: string) => Promise<void>;
  /**
   * Register step 1: generates studentId, sends OTP email (with studentId).
   * Returns the generated studentId so UI can display it.
   */
  requestSignUpOtp: (
    email: string,
    data: Omit<PendingRegisterData, 'studentId'>
  ) => Promise<{ studentId: string }>;
  /**
   * Register step 2: verifies the OTP, then creates the Supabase user
   * with the given password, creates the profile record.
   * Returns the generated Student ID.
   */
  verifySignUpOtp: (
    email: string,
    token: string,
    data: PendingRegisterData
  ) => Promise<{ studentId: string }>;
  /**
   * Password reset step 1: accepts Student ID (7 digits) or email.
   * Resolves the email, sends an OTP code. Returns the resolved email.
   */
  requestPasswordResetOtp: (identifier: string) => Promise<{ email: string }>;
  /**
   * Password reset step 2: verifies OTP, then sets the new password.
   */
  resetPasswordWithOtp: (email: string, token: string, newPassword: string) => Promise<void>;
  /**
   * Update profile fields and refresh the in-memory profile state.
   */
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'whatsapp_no' | 'mobile_no' | 'nic'>>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRepo = new ProfileRepository();

  useEffect(() => {
    db.auth.getSession().then(({ session }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { unsubscribe } = db.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const profileData = await profileRepo.findById(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  // ─── signIn (Student ID or email + password) ────────────────────────────
  async function signIn(identifier: string, password: string): Promise<void> {
    const studentIdPattern = /^\d{7}$/;
    let email = identifier.trim();

    if (studentIdPattern.test(email)) {
      // Resolve Student ID → email
      const found = await profileRepo.findByStudentId(email);
      if (!found) {
        throw new Error('Student ID not found. Please check your ID and try again.');
      }
      email = found.email;
    }

    const { error } = await db.auth.signIn(email, password);
    if (error) throw error;
  }

  // ─── requestSignUpOtp ───────────────────────────────────────────────────
  // Pre-generates the student ID and sends OTP (magic link email)
  // The email template in Supabase should include {{ .Data.student_id }} to show it.
  async function requestSignUpOtp(
    email: string,
    data: Omit<PendingRegisterData, 'studentId'>
  ): Promise<{ studentId: string }> {
    const { role, alYear, center } = data;

    // Generate the student ID ahead of time so it can appear in the confirmation email
    let studentId: string | undefined;
    if (role === 'student' && alYear && center) {
      studentId = await profileRepo.generateStudentId(alYear, center);
    }

    // Send OTP — pass student ID as metadata so Supabase email template can show it
    const { error } = await db.auth.sendOtp(email, {
      student_id: studentId ?? '',
      full_name: data.fullName,
    });
    if (error) throw error;

    return { studentId: studentId ?? '' };
  }

  // ─── verifySignUpOtp ────────────────────────────────────────────────────
  async function verifySignUpOtp(
    email: string,
    token: string,
    data: PendingRegisterData
  ): Promise<{ studentId: string }> {
    const { fullName, role, alYear, center, password, studentId, nic, whatsappNo, mobileNo } = data;

    // Step 1: verify OTP → creates Supabase auth user (passwordless session)
    const { user: newUser, error: verifyError } = await db.auth.verifyOtp(email, token);
    if (verifyError) throw verifyError;
    if (!newUser) throw new Error('Verification succeeded but no user was returned.');

    // Step 2: set the user's password so they can log in with password next time
    const { error: pwError } = await db.auth.updatePassword(password);
    if (pwError) throw pwError;

    // Step 3: check if profile already exists
    let existingProfile: Profile | null = null;
    try {
      existingProfile = await profileRepo.findById(newUser.id);
    } catch {
      // not found — create below
    }

    if (existingProfile) {
      return { studentId: existingProfile.student_id ?? '' };
    }

    // Step 4: use the pre-generated studentId, or generate if missing
    let finalStudentId = studentId;
    if (!finalStudentId && role === 'student' && alYear && center) {
      finalStudentId = await profileRepo.generateStudentId(alYear, center);
    }

    // Step 5: create the profile record
    await profileRepo.create({
      id: newUser.id,
      email,
      full_name: fullName,
      role: role as 'admin' | 'teacher' | 'student',
      is_active: true,
      student_id: finalStudentId,
      al_year: alYear,
      center: center,
      nic,
      whatsapp_no: whatsappNo,
      mobile_no: mobileNo,
    });

    // Step 6: create teacher row if applicable
    if (role === 'teacher') {
      const { error: teacherError } = await db.from('teachers')
        .insert({
          profile_id: newUser.id,
          subjects: [],
          visible_on_landing: true,
        })
        .execute();

      if (teacherError) {
        console.error('Teacher profile creation error:', teacherError);
        throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
      }
    }

    return { studentId: finalStudentId ?? '' };
  }

  // ─── requestPasswordResetOtp ─────────────────────────────────────────────
  async function requestPasswordResetOtp(identifier: string): Promise<{ email: string }> {
    const studentIdPattern = /^\d{7}$/;
    let email = identifier.trim();

    if (studentIdPattern.test(email)) {
      const found = await profileRepo.findByStudentId(email);
      if (!found) throw new Error('Student ID not found. Please check your ID.');
      email = found.email;
    }

    const { error } = await db.auth.sendOtp(email);
    if (error) throw error;
    return { email };
  }

  // ─── resetPasswordWithOtp ────────────────────────────────────────────────
  async function resetPasswordWithOtp(
    email: string,
    token: string,
    newPassword: string
  ): Promise<void> {
    // Verify OTP → establishes a session
    const { error: verifyError } = await db.auth.verifyOtp(email, token);
    if (verifyError) throw verifyError;

    // Now update the password for the signed-in user
    const { error: pwError } = await db.auth.updatePassword(newPassword);
    if (pwError) throw pwError;
  }

  // ─── updateProfile ────────────────────────────────────────────────────────
  async function updateProfile(
    updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'whatsapp_no' | 'mobile_no' | 'nic'>>
  ): Promise<void> {
    if (!user?.id) throw new Error('Not authenticated');
    const { error } = await db.from<Profile>('profiles')
      .update(updates as any)
      .eq('id', user.id)
      .execute();
    if (error) throw error;
    // Refresh cached profile
    await loadProfile(user.id);
  }

  // ─── signOut ─────────────────────────────────────────────────────────────
  async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn,
      requestSignUpOtp, verifySignUpOtp,
      requestPasswordResetOtp, resetPasswordWithOtp,
      updateProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
