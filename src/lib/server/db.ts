import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let pool: mysql.Pool | undefined;
export function getDb() {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured. Copy .env.example to .env and configure MySQL.');
	pool ??= mysql.createPool({ uri: env.DATABASE_URL, connectionLimit: 8, waitForConnections: true, enableKeepAlive: true });
	return drizzle(pool, { schema, mode: 'default' });
}
