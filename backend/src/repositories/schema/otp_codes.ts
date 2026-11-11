import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const otpCodes = pgTable('otp_codes', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),           // bcrypt hash of the 6-digit code
  purpose: text('purpose')               // 'signup' | 'reset'
    .$type<'signup' | 'reset'>()
    .notNull(),
  metadata: text('metadata'),            // JSON string — stores signup data
  used: boolean('used').notNull().default(false),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;