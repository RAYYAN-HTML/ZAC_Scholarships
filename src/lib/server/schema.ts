import { mysqlTable, varchar, text, timestamp, date, mysqlEnum, index, boolean, int, uniqueIndex } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const scholarships = mysqlTable('scholarships', {
	id: varchar('id', { length: 36 }).primaryKey(), slug: varchar('slug', { length: 190 }).notNull().unique(), title: varchar('title', { length: 240 }).notNull(), provider: varchar('provider', { length: 240 }).notNull(), country: varchar('country', { length: 120 }).notNull(), category: varchar('category', { length: 80 }).notNull(), degreeLevels: text('degree_levels').notNull(), fieldsOfStudy: text('fields_of_study'), description: text('description').notNull(), eligibility: text('eligibility'), benefits: text('benefits'), requiredDocuments: text('required_documents'), openingDate: date('opening_date', { mode: 'string' }), deadline: date('deadline', { mode: 'string' }), fundingType: varchar('funding_type', { length: 80 }).notNull(), applicationUrl: varchar('application_url', { length: 1000 }), sourceUrl: varchar('source_url', { length: 1000 }), verifiedAt: timestamp('verified_at'), verificationStatus: mysqlEnum('verification_status', ['pending_verification','verified','needs_reverification','expired','rejected']).notNull().default('pending_verification'), applicationStatus: mysqlEnum('application_status', ['open','upcoming','closed','unconfirmed']).notNull().default('unconfirmed'), publicationStatus: mysqlEnum('publication_status', ['draft','published','archived']).notNull().default('draft'), reviewNote: text('review_note'), createdAt: timestamp('created_at').defaultNow().notNull(), updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
}, (table) => [index('scholarship_public_index').on(table.publicationStatus, table.verificationStatus, table.deadline), index('scholarship_country_index').on(table.country), index('scholarship_category_index').on(table.category)]);

export const admins = mysqlTable('admins', { id: varchar('id', { length: 36 }).primaryKey(), email: varchar('email', { length: 254 }).notNull().unique(), passwordHash: varchar('password_hash', { length: 255 }).notNull(), name: varchar('name', { length: 160 }).notNull(), role: mysqlEnum('role', ['admin','editor']).notNull().default('admin'), active: boolean('active').notNull().default(true), createdAt: timestamp('created_at').defaultNow().notNull() });
export const sessions = mysqlTable('sessions', { id: varchar('id', { length: 64 }).primaryKey(), adminId: varchar('admin_id', { length: 36 }).notNull().references(() => admins.id, { onDelete: 'cascade' }), expiresAt: timestamp('expires_at').notNull(), createdAt: timestamp('created_at').defaultNow().notNull() }, (table) => [index('session_expiry_index').on(table.expiresAt)]);
export const feedback = mysqlTable('feedback', { id: varchar('id', { length: 36 }).primaryKey(), category: varchar('category', { length: 60 }).notNull(), message: text('message').notNull(), status: mysqlEnum('status', ['new','reviewed','resolved']).notNull().default('new'), createdAt: timestamp('created_at').defaultNow().notNull() }, (table) => [index('feedback_status_index').on(table.status, table.createdAt)]);

export const dailyPageViews = mysqlTable('daily_page_views', {
	id: varchar('id', { length: 36 }).primaryKey(),
	resourceType: mysqlEnum('resource_type', ['page', 'scholarship']).notNull(),
	resourceKey: varchar('resource_key', { length: 190 }).notNull(),
	viewDate: date('view_date', { mode: 'string' }).notNull(),
	viewCount: int('view_count', { unsigned: true }).notNull().default(0)
}, (table) => [
	uniqueIndex('daily_page_views_resource_day_unique').on(table.resourceType, table.resourceKey, table.viewDate),
	index('daily_page_views_date_index').on(table.viewDate)
]);

export const adminRelations = relations(admins, ({ many }) => ({ sessions: many(sessions) }));
export const sessionRelations = relations(sessions, ({ one }) => ({ admin: one(admins, { fields: [sessions.adminId], references: [admins.id] }) }));
