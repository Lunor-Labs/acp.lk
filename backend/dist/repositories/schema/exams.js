import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
export const exams = pgTable('exams', {
    id: text('id').primaryKey(),
    teacher_id: text('teacher_id').notNull(),
    class_id: text('class_id'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    subject: text('subject').notNull(),
    start_time: timestamp('start_time', { withTimezone: true }).notNull(),
    end_time: timestamp('end_time', { withTimezone: true }).notNull(),
    duration_minutes: integer('duration_minutes').notNull(),
    total_marks: integer('total_marks').notNull(),
    questions: jsonb('questions'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const examQuestions = pgTable('exam_questions', {
    id: text('id').primaryKey(),
    exam_id: text('exam_id').notNull(),
    question_number: integer('question_number').notNull(),
    question_text: text('question_text').notNull(),
    options: jsonb('options').$type().notNull(),
    correct_answer: text('correct_answer').notNull(),
    marks: integer('marks').notNull().default(1),
    image_path: text('image_path'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const examAttempts = pgTable('exam_attempts', {
    id: text('id').primaryKey(),
    exam_id: text('exam_id').notNull(),
    student_id: text('student_id').notNull(),
    status: text('status').$type().notNull().default('started'),
    score: integer('score').notNull().default(0),
    percentage: integer('percentage'),
    answers: jsonb('answers'),
    started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    submitted_at: timestamp('submitted_at', { withTimezone: true }),
    rank: integer('rank'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=exams.js.map