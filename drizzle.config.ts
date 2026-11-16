import { defineConfig } from 'drizzle-kit';
import { env } from 'node:process';
import 'dotenv/config';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required to generate or run Drizzle migrations.');

export default defineConfig({ schema: './src/lib/server/schema.ts', out: './drizzle', dialect: 'mysql', dbCredentials: { url: env.DATABASE_URL }, strict: true, verbose: true });
