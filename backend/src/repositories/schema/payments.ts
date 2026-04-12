import { pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const feePayments = pgTable('fee_payments', {
  id: text('id').primaryKey(),
  student_id: text('student_id').notNull(),
  teacher_id: text('teacher_id').notNull(),
  class_id: text('class_id'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_date: timestamp('payment_date', { withTimezone: true }).defaultNow().notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FeePayment = typeof feePayments.$inferSelect;
export type NewFeePayment = typeof feePayments.$inferInsert;
