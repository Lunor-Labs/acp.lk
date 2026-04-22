import { apiClient } from '@/api/client';

export interface StudentDashboardStats {
  enrolledClasses: number;
  purchasedStudyPacks: number;
  upcomingExams: number;
}

export interface StudentPerformanceData {
  month: string;
  percentage: number;
}

export interface TeacherDashboardStats {
  totalPlatformStudents: number;
  totalEnrolledStudents: number;
  newStudentsThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClasses: number;
  activeClasses: number;
}

export interface TeacherOnboardingData {
  month: string;
  platformStudents: number;
  enrollments: number;
}

export const DashboardApi = {
  getStudentDashboard: () =>
    apiClient.get<{
      stats: StudentDashboardStats;
      performanceData: StudentPerformanceData[];
    }>('/dashboard/student'),

  getTeacherDashboard: () =>
    apiClient.get<{
      stats: TeacherDashboardStats;
      onboardingData: TeacherOnboardingData[];
    }>('/dashboard/teacher'),
};

export interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  size: string;
  url?: string;
  youtube_url?: string;
}

export interface StudyPack {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  materials: VideoLesson[];
  created_at: string;
  status?: string;
  sales_count?: number;
}

export const StudyPacksApi = {
  getTeacherPacks: () => apiClient.get<{ data: StudyPack[] }>('/studypacks/teacher').then(r => r.data),
  createPack: (data: Omit<StudyPack, 'id' | 'created_at' | 'status' | 'sales_count'>) => apiClient.post<{ data: StudyPack }>('/studypacks', data).then(r => r.data),
  updatePack: (id: string, data: Partial<StudyPack>) => apiClient.patch<{ data: StudyPack }>(`/studypacks/${id}`, data).then(r => r.data),
  deletePack: (id: string) => apiClient.delete(`/studypacks/${id}`),
};

export const FilesApi = {
  getSignedUploadUrl: (bucket: string, path: string) => apiClient.post<{ data: { signedUrl: string, token: string, path: string } }>('/files/signed-upload-url', { bucket, path }).then(r => r.data),
  
  // Helper to directly upload file using signed URL
  uploadWithSignedUrl: async (bucket: string, path: string, file: File) => {
    const { data } = await FilesApi.getSignedUploadUrl(bucket, path);
    const res = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file
    });
    if (!res.ok) {
      throw new Error('Failed to upload file');
    }
    // Return storage path to save to DB
    return path;
  }
};

export const TeacherExamsApi = {
  getExams: () => apiClient.get<{ data: any[] }>('/exams/teacher').then(r => r.data),
  createExam: (data: any) => apiClient.post<{ data: any }>('/exams/teacher', data).then(r => r.data),
  updateExam: (id: string, data: any) => apiClient.patch<{ data: any }>(`/exams/teacher/${id}`, data).then(r => r.data),
  deleteExam: (id: string) => apiClient.delete(`/exams/teacher/${id}`),
};
