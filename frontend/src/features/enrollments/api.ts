import { apiClient } from '@/api/client';

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  is_active: boolean;
  enrolled_at: string;
  class?: any; // populated with nested class metadata
}

export const EnrollmentsApi = {
  /** Fetch all actively enrolled classes for the current student */
  getMyEnrollments: () => apiClient.get<Enrollment[]>('/enrollments/me'),

  /** Enroll the current student in a specific class */
  enroll: (classId: string) => apiClient.post<Enrollment>('/enrollments', { classId }),

  /** Unenroll */
  unenroll: (classId: string) => apiClient.delete<{ message: string }>(`/enrollments/${classId}`),
};
