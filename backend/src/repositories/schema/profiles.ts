import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  full_name: text('full_name').notNull(),
  role: text('role').$type<'admin' | 'teacher' | 'student'>().notNull().default('student'),
  is_active: boolean('is_active').notNull().default(true),
  password_hash: text('password_hash'),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  student_id: text('student_id'),
  al_year: integer('al_year'),
  center: text('center').$type<'online' | 'riochem' | 'vision'>(),
  nic: text('nic'),
  whatsapp_no: text('whatsapp_no'),
  mobile_no: text('mobile_no'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;