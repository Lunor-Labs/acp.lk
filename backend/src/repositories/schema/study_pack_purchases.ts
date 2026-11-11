import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const studyPackPurchases = pgTable('study_pack_purchases', {
  id: text('id').primaryKey(),
  student_id: text('student_id').notNull(),
  study_pack_id: text('study_pack_id').notNull(),
  purchased_at: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StudyPackPurchase = typeof studyPackPurchases.$inferSelect;
export type NewStudyPackPurchase = typeof studyPackPurchases.$inferInsert;
