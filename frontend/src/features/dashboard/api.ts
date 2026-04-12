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
