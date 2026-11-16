import { json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db';
import { dailyPageViews, scholarships } from '$lib/server/schema';
import { FixedWindowRateLimiter } from '$lib/server/rate-limit';
import { dateKeyInKarachi, trackedResourceForPath } from '$lib/server/analytics';
import { readBodyWithinLimit } from '$lib/server/request-body';

const payloadSchema = z.object({ path: z.string().min(1).max(256) }).strict();
const limiter = new FixedWindowRateLimiter(120, 60_000);

export async function POST({ request, getClientAddress }) {
	if (!env.DATABASE_URL) return new Response(null, { status: 204 });
	if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null, { status: 403 });
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return new Response(null, { status: 415 });
	if (!limiter.consume(getClientAddress())) return new Response(null, { status: 429 });
	let bodyText: string | null;
	try {
		bodyText = await readBodyWithinLimit(request, 1024);
	} catch {
		return json({ error: 'Invalid analytics request.' }, { status: 400 });
	}
	if (bodyText === null) return new Response(null, { status: 413 });

	let body: unknown;
	try {
		body = JSON.parse(bodyText);
	} catch {
		return json({ error: 'Invalid analytics request.' }, { status: 400 });
	}
	const parsed = payloadSchema.safeParse(body);
	if (!parsed.success) return json({ error: 'Invalid analytics request.' }, { status: 400 });

	try {
		const resource = trackedResourceForPath(parsed.data.path);
		if (!resource) return new Response(null, { status: 204 });
		if (resource.resourceType === 'scholarship') {
			const [listing] = await getDb().select({ slug: scholarships.slug }).from(scholarships).where(and(
				eq(scholarships.slug, resource.resourceKey),
				eq(scholarships.publicationStatus, 'published'),
				eq(scholarships.verificationStatus, 'verified')
			)).limit(1);
			if (!listing) return new Response(null, { status: 204 });
			resource.resourceKey = listing.slug;
		}
		await getDb().insert(dailyPageViews).values({
			id: randomUUID(), ...resource, viewDate: dateKeyInKarachi(), viewCount: 1
		}).onDuplicateKeyUpdate({ set: { viewCount: sql`${dailyPageViews.viewCount} + 1` } });
		return new Response(null, { status: 204 });
	} catch (cause) {
		console.error('[analytics] Could not save page view', cause);
		return new Response(null, { status: 503 });
	}
}
