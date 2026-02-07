import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'),
    avatar: text('avatar'),
    createdAt: integer('created_at')
        .notNull()
        .$defaultFn(() => Date.now()),
});
export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
});
export const posts = sqliteTable('posts', {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content').notNull(),
    status: text('status').notNull().default('draft'),
    tags: text('tags'),
    readingTime: text('reading_time'),
    publishedAt: integer('published_at'),
    authorId: text('author_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at')
        .notNull()
        .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
        .notNull()
        .$defaultFn(() => Date.now()),
});
export const siteSettings = sqliteTable('site_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});
