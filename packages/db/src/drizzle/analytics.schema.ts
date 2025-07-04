import {
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { user } from './schema';

export const projects = pgTable('projects', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id')
        .notNull()
        .references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectSchemas = pgTable('project_schemas', {
    id: serial('id').primaryKey(),
    projectId: varchar('project_id', { length: 255 })
        .notNull()
        .references(() => projects.id),
    version: integer('version').notNull(),
    schema: jsonb('schema').notNull(),
    status: text('status', { enum: ['draft', 'active', 'archived'] })
        .notNull()
        .default('draft'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 