import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const rankLists = pgTable('rank_lists', {
  id: text('id').primaryKey(),
  teacher_id: text('teacher_id').notNull(),
  year: integer('year').notNull(),
  exam_name: text('exam_name').notNull(),
  image_path: text('image_path').notNull(),
  public_url: text('public_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type RankList = typeof rankLists.$inferSelect;
export type NewRankList = typeof rankLists.$inferInsert;
