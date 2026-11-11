export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  created_at: string;
  class_title?: string;
  submission_count?: number;
  total_students?: number;
}

export interface Class {
  id: string;
  title: string;
  subject: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  image_path?: string;
  image_file?: File;
  image_preview?: string;
}

export interface PdfAnswer {
  question_no: number;
  correct_answer: number;
}

export interface ManualAnswer {
  question_no: number;
  correct_answer: string; // A, B, C, D
}

export interface ManualQuestion {
  id: string;
  question_number: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  image_path?: string;
}

export interface ExamDetail {
  id: string;
  title: string;
  description: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  pdfPath: string | null;
  markedAnswers: (PdfAnswer | ManualAnswer)[];
  manualQuestions: ManualQuestion[];
  isPdfExam: boolean;
}
