import { apiClient } from '@/api/client';

export interface ExamQuestion {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  image_path?: string | null;
}

export interface Exam {
  id: string;
  teacher_id: string;
  class_id?: string | null;
  title: string;
  description: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  status: 'started' | 'submitted';
  score: number;
  percentage?: number | null;
  answers: Record<number, string | number>;
  started_at: string;
  submitted_at?: string | null;
  rank?: number | null;
}

export interface ExamStartResponse {
  attempt: ExamAttempt;
  exam: Exam;
  isPdf: boolean;
  pdfUrl?: string | null;
  questions?: ExamQuestion[];
}

export const ExamsApi = {
  getUpcoming: () => apiClient.get<Exam[]>('/exams/upcoming'),
  getResults: () => apiClient.get<(ExamAttempt & { exam: Exam })[]>('/exams/results'),
  getTeacherExams: () => apiClient.get<Exam[]>('/exams/teacher'),
  startAttempt: (examId: string) => apiClient.post<ExamStartResponse>(`/exams/${examId}/start`, {}),
  submitAttempt: (examId: string, answers: Record<number, string | number>) => 
    apiClient.post<ExamAttempt>(`/exams/${examId}/submit`, { answers }),
};
