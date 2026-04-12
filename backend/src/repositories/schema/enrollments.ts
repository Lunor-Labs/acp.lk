import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  student_id: text('student_id').notNull(),
  class_id: text('class_id').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  enrolled_at: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
