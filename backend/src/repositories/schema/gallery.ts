import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const galleryImages = pgTable('gallery_images', {
  id: text('id').primaryKey(),
  teacher_id: text('teacher_id').notNull(),
  storage_path: text('storage_path').notNull(),
  public_url: text('public_url'),
  caption: text('caption'),
  display_order: integer('display_order').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type GalleryImage = typeof galleryImages.$inferSelect;
export type NewGalleryImage = typeof galleryImages.$inferInsert;
