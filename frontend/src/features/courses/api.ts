import { apiClient } from '@/api/client';

export interface Material {
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'other';
}

export interface Week {
  id: string;
  title: string;
  description?: string;
  schedule_time?: string;
  zoom_link?: string;
  recordings: string[];
  materials: Material[];
}

export interface Course {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  subject: string;
  schedule: string | null;
  zoom_link: string | null;
  price: number;
  is_free: boolean;
  is_active: boolean;
  materials: Material[];
  weeks: Week[];
  created_at: string;
}

export const CoursesApi = {
  /** list teacher's own classes */
  getTeacherCourses: () => apiClient.get<Course[]>('/courses/teacher/me'),
  
  /** create a class */
  createCourse: (data: Partial<Course>) => apiClient.post<Course>('/courses', data),
  
  /** update a class */
  updateCourse: (id: string, data: Partial<Course>) => apiClient.put<Course>(`/courses/${id}`, data),

  /** list active courses for students */
  listActiveCourses: () => apiClient.get<Course[]>('/courses'),
};
