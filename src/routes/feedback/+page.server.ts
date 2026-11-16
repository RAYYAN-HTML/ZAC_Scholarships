import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'node:crypto';
import { getDb } from '$lib/server/db';
import { feedback } from '$lib/server/schema';
import { feedbackSchema } from '$lib/server/validation';
import { FixedWindowRateLimiter } from '$lib/server/rate-limit';
import { readBytesWithinLimit } from '$lib/server/request-body';

const hits = new FixedWindowRateLimiter(5, 60 * 60 * 1000);
export const actions = { default: async ({ request, getClientAddress }) => {
	const ip = getClientAddress(); if (!hits.consume(ip)) return fail(429, { error: 'Too many submissions. Please try again later.' });
	let body: Uint8Array<ArrayBuffer> | null;
	try { body = await readBytesWithinLimit(request, 16_384); } catch { return fail(400, { error: 'Please submit a valid feedback form.' }); }
	if (body === null) return fail(413, { error: 'Your feedback form is too large. Please shorten your message.' });
	let form: FormData;
	try {
		const contentType = request.headers.get('content-type');
		form = await new Request(request.url, { method: 'POST', headers: contentType ? { 'content-type': contentType } : {}, body: body.buffer }).formData();
	} catch { return fail(400, { error: 'Please submit a valid feedback form.' }); }
	const parsed = feedbackSchema.safeParse({ category: form.get('category'), message: form.get('message') }); if (!parsed.success) return fail(400,{error:parsed.error.issues[0]?.message ?? 'Please check your message.'});
	if (!env.DATABASE_URL) return fail(503,{error:'Feedback is temporarily unavailable because the portal database is not configured.'});
	try { await getDb().insert(feedback).values({id:randomUUID(),...parsed.data}); return { success:true }; } catch (cause) { console.error('[feedback] Could not store anonymous feedback',cause); return fail(503,{error:'We couldn’t save your feedback. Please try again shortly.'}); }
} };
