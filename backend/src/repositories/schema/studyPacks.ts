import { pgTable, text, timestamp, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { teachers } from './teachers.js';

export const studyPacks = pgTable('study_packs', {
  id: text('id').primaryKey(),
  teacher_id: text('teacher_id').notNull().references(() => teachers.id),
  title: text('title').notNull(),
  description: text('description'),
  subject: text('subject').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  is_free: boolean('is_free').notNull().default(false),
  materials: jsonb('materials').$type<VideoLesson[]>(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  size: string;
  url?: string;
  youtube_url?: string;
}

export type StudyPack = typeof studyPacks.$inferSelect;
export type NewStudyPack = typeof studyPacks.$inferInsert;
