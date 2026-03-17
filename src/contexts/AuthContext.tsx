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
}

// ─── Context types ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  /**
   * Login step 1: accepts Student ID (7 digits) or email.
   * Looks up the email for Student IDs, then sends a 6-digit OTP.
   * Returns the resolved email so the UI can display it.
   */
  requestLoginOtp: (identifier: string) => Promise<{ email: string }>;
  /**
   * Login step 2: verifies the OTP and establishes a session.
   */
  verifyLoginOtp: (email: string, token: string) => Promise<void>;
  /**
   * Register step 1: sends an OTP to the provided email.
   * No password required — the OTP acts as the verification.
   */
  requestSignUpOtp: (email: string) => Promise<void>;
  /**
   * Register step 2: verifies the OTP, then creates the profile record
   * (and teacher row if applicable). Returns the generated Student ID for students.
   */
  verifySignUpOtp: (
    email: string,
    token: string,
    data: PendingRegisterData
  ) => Promise<{ studentId?: string }>;
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

  // ─── requestLoginOtp ────────────────────────────────────────────────────
  async function requestLoginOtp(identifier: string): Promise<{ email: string }> {
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

    const { error } = await db.auth.sendOtp(email);
    if (error) throw error;
    return { email };
  }

  // ─── verifyLoginOtp ─────────────────────────────────────────────────────
  async function verifyLoginOtp(email: string, token: string): Promise<void> {
    const { error } = await db.auth.verifyOtp(email, token);
    if (error) throw error;
  }

  // ─── requestSignUpOtp ───────────────────────────────────────────────────
  async function requestSignUpOtp(email: string): Promise<void> {
    const { error } = await db.auth.sendOtp(email);
    if (error) throw error;
  }

  // ─── verifySignUpOtp ────────────────────────────────────────────────────
  async function verifySignUpOtp(
    email: string,
    token: string,
    data: PendingRegisterData
  ): Promise<{ studentId?: string }> {
    const { fullName, role, alYear, center } = data;

    // Verify OTP → creates Supabase auth user (or signs in existing)
    const { user: newUser, error } = await db.auth.verifyOtp(email, token);
    if (error) throw error;

    if (!newUser) throw new Error('Verification succeeded but no user was returned.');

    // Check if a profile already exists (in case of re-registration attempt)
    let existingProfile: Profile | null = null;
    try {
      existingProfile = await profileRepo.findById(newUser.id);
    } catch {
      // not found — proceed to create
    }

    if (existingProfile) {
      // Profile already exists — return the existing student ID
      return { studentId: existingProfile.student_id };
    }

    // Generate student ID (students only)
    let studentId: string | undefined;
    if (role === 'student' && alYear && center) {
      studentId = await profileRepo.generateStudentId(alYear, center);
    }

    // Create the profile record
    await profileRepo.create({
      id: newUser.id,
      email,
      full_name: fullName,
      role: role as 'admin' | 'teacher' | 'student',
      is_active: true,
      student_id: studentId,
      al_year: alYear,
      center: center,
    });

    // Create teacher row if applicable
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

    return { studentId };
  }

  // ─── signOut ─────────────────────────────────────────────────────────────
  async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      requestLoginOtp, verifyLoginOtp,
      requestSignUpOtp, verifySignUpOtp,
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
