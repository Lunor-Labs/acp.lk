import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/database';
import { ProfileRepository, Profile } from '../repositories';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
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

  async function signIn(email: string, password: string) {
    const { error } = await db.auth.signIn(email, password);
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string, role: string) {
    try {
      const { user: newUser, error } = await db.auth.signUp(email, password, {
        full_name: fullName,
        role: role
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
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  }

  async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
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
