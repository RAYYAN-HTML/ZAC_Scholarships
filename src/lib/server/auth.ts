import { env } from '$env/dynamic/private';
import { and, eq, gt } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { getDb } from './db';
import { admins, sessions } from './schema';

const COOKIE = 'cce_admin_session'; const DAY = 24 * 60 * 60 * 1000; const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function createSession(event: RequestEvent, adminId: string) { const token = randomBytes(32).toString('hex'); const expiresAt = new Date(Date.now() + 8 * DAY); await getDb().insert(sessions).values({ id: tokenHash(token), adminId, expiresAt }); event.cookies.set(COOKIE, token, { path: '/', httpOnly: true, sameSite: 'strict', secure: env.NODE_ENV === 'production', expires: expiresAt }); }
export async function deleteSession(cookies: Cookies) { const token = cookies.get(COOKIE); if (token && env.DATABASE_URL) await getDb().delete(sessions).where(eq(sessions.id, tokenHash(token))); cookies.delete(COOKIE, { path: '/' }); }
export async function getAdmin(cookies: Cookies) { const token = cookies.get(COOKIE); if (!token) return null; if (!env.DATABASE_URL) return null; const rows = await getDb().select({ id: admins.id, email: admins.email, name: admins.name, role: admins.role }).from(sessions).innerJoin(admins, eq(sessions.adminId, admins.id)).where(and(eq(sessions.id, tokenHash(token)),gt(sessions.expiresAt,new Date()),eq(admins.active,true))).limit(1); return rows[0] ?? null; }
