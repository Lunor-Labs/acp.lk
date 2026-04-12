import { pgTable, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
export const teachers = pgTable('teachers', {
    id: text('id').primaryKey(),
    profile_id: text('profile_id').notNull(),
    subjects: jsonb('subjects').$type().notNull().default([]),
    visible_on_landing: boolean('visible_on_landing').notNull().default(true),
    teacher_number: integer('teacher_number'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=teachers.js.map