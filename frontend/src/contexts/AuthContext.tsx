import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthApi, type UserProfile, type PendingRegisterData } from '../features/auth/api';

export const CENTER_LABELS: Record<string, string> = {
  online: 'Online',
  riochem: 'Riochem (Kurunegala)',
  vision: 'Vision (Kandy)',
};

export type { PendingRegisterData };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => void;
  requestSignUpOtp: (email: string, partialData: Omit<PendingRegisterData, 'studentId'>) => Promise<{ studentId: string }>;
  verifySignUpOtp: (email: string, token: string, data: PendingRegisterData) => Promise<{ studentId: string }>;
  requestPasswordResetOtp: (identifier: string) => Promise<{ email: string }>;
  resetPasswordWithOtp: (email: string, token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('acp_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    AuthApi.getProfile()
      .then((data) => {
        setUser(data.profile);
      })
      .catch((error) => {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('acp_token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const data = await AuthApi.signIn({ identifier, password });
    localStorage.setItem('acp_token', data.token);
    setUser(data.profile);
  };

  const signOut = () => {
    localStorage.removeItem('acp_token');
    setUser(null);
    window.location.href = '/';
  };

  const requestSignUpOtp = async (email: string, data: Omit<PendingRegisterData, 'studentId'>) => {
    return AuthApi.requestSignUpOtp(email, data);
  };

  const verifySignUpOtp = async (email: string, token: string, data: PendingRegisterData) => {
    return AuthApi.verifySignUpOtp(email, token, data);
  };

  const requestPasswordResetOtp = async (identifier: string) => {
    return AuthApi.requestPasswordResetOtp(identifier);
  };

  const resetPasswordWithOtp = async (email: string, token: string, newPassword: string) => {
    await AuthApi.resetPasswordWithOtp(email, token, newPassword);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signOut,
      requestSignUpOtp,
      verifySignUpOtp,
      requestPasswordResetOtp,
      resetPasswordWithOtp
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
