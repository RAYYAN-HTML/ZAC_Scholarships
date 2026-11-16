import assert from 'node:assert/strict';
import test from 'node:test';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import { analyticsFailureKind, dateKeyInKarachi, trackedResourceForPath } from '../src/lib/server/analytics';
import { FixedWindowRateLimiter } from '../src/lib/server/rate-limit';
import { isAdminProtectedPath } from '../src/lib/server/auth-guard';
import { dailyPageViews } from '../src/lib/server/schema';
import { directoryFilterSchema } from '../src/lib/server/validation';
import { readBodyWithinLimit, readBytesWithinLimit } from '../src/lib/server/request-body';

test('rate limiter enforces a fixed window and bounded client table', () => {
	const limiter = new FixedWindowRateLimiter(2, 1_000, 2);
	assert.equal(limiter.consume('a', 100), true);
	assert.equal(limiter.consume('a', 101), true);
	assert.equal(limiter.consume('a', 102), false);
	assert.equal(limiter.consume('b', 102), true);
	assert.equal(limiter.consume('c', 103), false);
	assert.equal(limiter.consume('a', 1_100), true);
	assert.equal(limiter.consume('c', 1_102), true);
});

test('request-level admin guard covers action routes but leaves login public', () => {
	assert.equal(isAdminProtectedPath('/admin'), true);
	assert.equal(isAdminProtectedPath('/admin/scholarships/new'), true);
	assert.equal(isAdminProtectedPath('/admin/feedback'), true);
	assert.equal(isAdminProtectedPath('/admin/login'), false);
	assert.equal(isAdminProtectedPath('/administrator'), false);
});

test('analytics date uses the Pakistan calendar day', () => {
	assert.equal(dateKeyInKarachi(new Date('2026-11-15T18:59:59Z')), '2026-11-15');
	assert.equal(dateKeyInKarachi(new Date('2026-11-15T19:00:00Z')), '2026-11-16');
});

test('analytics error reports a missing migration separately from database outages', () => {
	assert.equal(analyticsFailureKind({ code: 'ER_NO_SUCH_TABLE', errno: 1146 }), 'migration');
	assert.equal(analyticsFailureKind({ code: 'ECONNREFUSED' }), 'database');
	assert.equal(analyticsFailureKind(new Error('unexpected error')), 'database');
});

test('analytics only classifies known public pages and scholarship slugs', () => {
	assert.deepEqual(trackedResourceForPath('/'), { resourceType: 'page', resourceKey: '/' });
	assert.deepEqual(trackedResourceForPath('/scholarships'), { resourceType: 'page', resourceKey: '/scholarships' });
	assert.deepEqual(trackedResourceForPath('/scholarships/chinese-government-program'), {
		resourceType: 'scholarship', resourceKey: 'chinese-government-program'
	});
	assert.equal(trackedResourceForPath('/admin'), null);
	assert.equal(trackedResourceForPath('/api/analytics/view'), null);
	assert.equal(trackedResourceForPath('/scholarships/invalid?x=1'), null);
});

test('directory query validation trims input and rejects unreasonable searches/pages', () => {
	const parsed = directoryFilterSchema.safeParse({ q: '  engineering  ', page: '3', sort: 'latest' });
	assert.equal(parsed.success, true);
	if (parsed.success) {
		assert.equal(parsed.data.q, 'engineering');
		assert.equal(parsed.data.page, 3);
	}
	assert.equal(directoryFilterSchema.safeParse({ q: 'x'.repeat(121), page: '1' }).success, false);
	assert.equal(directoryFilterSchema.safeParse({ q: '', page: '1001' }).success, false);
	assert.equal(directoryFilterSchema.safeParse({ q: '', page: 'Infinity' }).success, false);
});

test('daily view insertion compiles as an atomic MySQL upsert', async () => {
	const pool = mysql.createPool('mysql://test:test@127.0.0.1:1/test');
	try {
		const query = drizzle(pool).insert(dailyPageViews).values({
			id: 'test-id', resourceType: 'page', resourceKey: '/', viewDate: '2026-11-15', viewCount: 1
		}).onDuplicateKeyUpdate({ set: { viewCount: sql`${dailyPageViews.viewCount} + 1` } });
		const compiled = query.toSQL();
		assert.match(compiled.sql, /on duplicate key update/i);
		assert.match(compiled.sql, /view_count.*\+ 1/i);
	} finally {
		await pool.end();
	}
});

test('analytics request body cap rejects oversized data with missing or false content length', async () => {
	const missingLength = new Request('https://cce.test/analytics', { method: 'POST', body: 'x'.repeat(1025) });
	assert.equal(await readBodyWithinLimit(missingLength, 1024), null);

	const falseLength = new Request('https://cce.test/analytics', {
		method: 'POST',
		headers: { 'content-length': '1' },
		body: 'x'.repeat(1025)
	});
	assert.equal(await readBodyWithinLimit(falseLength, 1024), null);

	const accepted = new Request('https://cce.test/analytics', { method: 'POST', body: '{"path":"/"}' });
	assert.equal(await readBodyWithinLimit(accepted, 1024), '{"path":"/"}');
});

test('feedback body cap preserves multipart form data and rejects oversized submissions', async () => {
	const formData = new FormData();
	formData.set('category', 'Suggestion');
	formData.set('message', 'Please add more scholarship filters.');
	const request = new Request('https://cce.test/feedback', { method: 'POST', body: formData });
	const bytes = await readBytesWithinLimit(request, 16_384);
	assert.ok(bytes);
	const replay = new Request(request.url, {
		method: 'POST',
		headers: { 'content-type': request.headers.get('content-type')! },
		body: bytes
	});
	const restored = await replay.formData();
	assert.equal(restored.get('category'), 'Suggestion');
	assert.equal(restored.get('message'), 'Please add more scholarship filters.');

	const oversized = new Request('https://cce.test/feedback', { method: 'POST', body: 'x'.repeat(16_385) });
	assert.equal(await readBytesWithinLimit(oversized, 16_384), null);
});
