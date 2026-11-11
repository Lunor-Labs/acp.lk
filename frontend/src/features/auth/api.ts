import { apiClient } from '../../api/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  center: 'online' | 'riochem' | 'vision';
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  avatar_url?: string;
}

export interface PendingRegisterData {
  fullName: string;
  role: 'student';
  alYear: number;
  center: 'online' | 'riochem' | 'vision';
  nic: string;
  whatsappNo: string;
  mobileNo: string;
  password?: string;
  studentId?: string;
}

export const AuthApi = {
  getProfile: () => 
    apiClient.get<{ profile: UserProfile }>('/auth/me'),

  signIn: (credentials: { identifier: string; password: string }) => 
    apiClient.post<{ token: string; profile: UserProfile }>('/auth/signin', credentials),

  requestSignUpOtp: (email: string, payload: Omit<PendingRegisterData, 'studentId'>) =>
    apiClient.post<{ studentId: string }>('/auth/signup/otp', { email, data: payload }),

  verifySignUpOtp: (email: string, token: string, data: PendingRegisterData) =>
    apiClient.post<{ user: { id: string }, studentId: string }>('/auth/signup/verify', { email, token, data }),

  requestPasswordResetOtp: (identifier: string) =>
    apiClient.post<{ email: string }>('/auth/reset/otp', { identifier }),

  resetPasswordWithOtp: (email: string, token: string, newPassword: string) =>
    apiClient.post<{ success: boolean }>('/auth/reset/verify', { email, token, newPassword }),
};
