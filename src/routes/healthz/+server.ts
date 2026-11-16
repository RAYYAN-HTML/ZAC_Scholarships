import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';

export async function GET() {
	if (!env.DATABASE_URL) return json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	try {
		await getDb().execute(sql`select 1`);
		return json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (cause) {
		console.error('[health] Database readiness check failed', cause);
		return json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}
}
