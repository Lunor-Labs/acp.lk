import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/database';
import { ProfileRepository, Profile, ClassCenter } from '../repositories';

// ─── Center labels for UI ───────────────────────────────────────────────────
export const CENTER_LABELS: Record<ClassCenter, string> = {
  online: 'Online',
  riochem: 'Riochem',
  vision: 'Vision',
};

// ─── Context types ────────────────────────────────────────────────────────────
interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: string,
    alYear?: number,
    center?: ClassCenter
  ) => Promise<{ studentId?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
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

  // ─── signIn ──────────────────────────────────────────────────────────────
  /**
   * Signs in using either:
   *   - A Student ID (e.g. 26-0-00001) -> looks up email via ProfileRepository
   *   - An email address (teachers / admins)
   */
  async function signIn(identifier: string, password: string) {
    const studentIdPattern = /^\d{7}$/;
    let email = identifier.trim();

    if (studentIdPattern.test(email)) {
      // Look up profile by student_id to get email
      const profile = await profileRepo.findByStudentId(email);

      if (!profile) {
        throw new Error('Student ID not found. Please check your ID and try again.');
      }
      email = profile.email;
    }

    const { error } = await db.auth.signIn(email, password);
    if (error) throw error;
  }

  // ─── signUp ──────────────────────────────────────────────────────────────
  async function signUp(
    email: string,
    password: string,
    fullName: string,
    role: string,
    alYear?: number,
    center?: ClassCenter
  ): Promise<{ studentId?: string }> {
    try {
      let studentId: string | undefined;

      // Generate student ID before signup so it can go into Supabase metadata
      if (role === 'student' && alYear && center) {
        studentId = await profileRepo.generateStudentId(alYear, center);
      }

      const { user: newUser, error } = await db.auth.signUp(email, password, {
        full_name: fullName,
        role,
        ...(studentId ? { student_id: studentId } : {}),
      });

      if (error) {
        console.error('Signup auth error:', error);
        throw error;
      }

      if (newUser) {
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
      }

      return { studentId };
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  }

  // ─── forgotPassword ───────────────────────────────────────────────────────
  async function forgotPassword(email: string) {
    const { error } = await db.auth.resetPassword(email);
    if (error) throw error;
  }

  // ─── signOut ──────────────────────────────────────────────────────────────
  async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, forgotPassword }}>
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
