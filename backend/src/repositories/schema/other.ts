import { pgTable, text, boolean, timestamp, integer, numeric } from 'drizzle-orm/pg-core';

export const classReviews = pgTable('class_reviews', {
  id: text('id').primaryKey(),
  teacher_id: text('teacher_id').notNull(),
  student_name: text('student_name').notNull(),
  review_text: text('review_text').notNull(),
  rating: numeric('rating', { precision: 3, scale: 1 }).notNull(),
  student_image_url: text('student_image_url'),
  gender: text('gender').$type<'male' | 'female'>(),
  is_visible: boolean('is_visible').notNull().default(true),
  display_order: integer('display_order').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const successStudents = pgTable('success', {
  id: text('id').primaryKey(),
  full_name: text('full_name'),
  index_no: text('index_no'),
  results: text('results'),
  faculty: text('faculty'),
  university: text('university'),
  image_path: text('image_path'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pdfExams = pgTable('pdf_exams', {
  id: text('id').primaryKey(),
  exam_id: text('exam_id').notNull(),
  question_no: integer('question_no').notNull(),
  correct_answer: integer('correct_answer').notNull(),
  pdf_path: text('pdf_path').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const testResults = pgTable('test_results', {
  id: text('id').primaryKey(),
  student_id: text('student_id').notNull(),
  teacher_id: text('teacher_id').notNull(),
  class_id: text('class_id'),
  test_name: text('test_name').notNull(),
  marks: numeric('marks', { precision: 6, scale: 2 }),
  total_marks: numeric('total_marks', { precision: 6, scale: 2 }),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  grade: text('grade'),
  date: text('date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ClassReview = typeof classReviews.$inferSelect;
export type NewClassReview = typeof classReviews.$inferInsert;
export type SuccessStudent = typeof successStudents.$inferSelect;
export type NewSuccessStudent = typeof successStudents.$inferInsert;
export type PdfExam = typeof pdfExams.$inferSelect;
export type NewPdfExam = typeof pdfExams.$inferInsert;
export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;
