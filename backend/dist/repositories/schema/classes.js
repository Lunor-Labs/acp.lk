import { pgTable, text, boolean, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
export const classes = pgTable('classes', {
    id: text('id').primaryKey(),
    teacher_id: text('teacher_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    subject: text('subject').notNull(),
    schedule: text('schedule'),
    zoom_link: text('zoom_link'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
    is_free: boolean('is_free').notNull().default(false),
    is_active: boolean('is_active').notNull().default(true),
    materials: jsonb('materials').default([]),
    weeks: jsonb('weeks').default([]),
    next_session_date: text('next_session_date'),
    status: text('status'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
//# sourceMappingURL=classes.js.map