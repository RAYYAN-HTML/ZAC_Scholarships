import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { deleteSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { dailyPageViews, scholarships } from '$lib/server/schema';
import { analyticsFailureKind, dateKeyInKarachi } from '$lib/server/analytics';

const DAY = 24 * 60 * 60 * 1000;
const dateDaysAgo = (days: number) => dateKeyInKarachi(new Date(Date.now() - days * DAY));
const emptyStats = { total: 0, published: 0, pending: 0, expired: 0, pageViewsToday: 0, pageViewsLast7Days: 0 };

export async function load() {
	if (!env.DATABASE_URL) return { databaseConfigured: false, analyticsError: true, analyticsProblem: 'config' as const, stats: emptyStats, popular: [], recent: [] };
	try {
		const db = getDb();
		const [all, published, pending, expired, recent] = await Promise.all([
			db.select({ n: sql<number>`count(*)` }).from(scholarships),
			db.select({ n: sql<number>`count(*)` }).from(scholarships).where(and(eq(scholarships.publicationStatus, 'published'), eq(scholarships.verificationStatus, 'verified'))),
			db.select({ n: sql<number>`count(*)` }).from(scholarships).where(eq(scholarships.verificationStatus, 'pending_verification')),
			db.select({ n: sql<number>`count(*)` }).from(scholarships).where(eq(scholarships.verificationStatus, 'expired')),
			db.select().from(scholarships).orderBy(desc(scholarships.updatedAt)).limit(5)
		]);
		let analyticsError = false;
		let analyticsProblem: 'migration' | 'database' | null = null;
		let pageViewsToday = 0;
		let pageViewsLast7Days = 0;
		let popular: { id: string; title: string; slug: string; views: number }[] = [];
		try {
			const [todayViews, weekViews, topListings] = await Promise.all([
			db.select({ n: sql<number>`coalesce(sum(${dailyPageViews.viewCount}), 0)` }).from(dailyPageViews).where(eq(dailyPageViews.viewDate, dateKeyInKarachi())),
			db.select({ n: sql<number>`coalesce(sum(${dailyPageViews.viewCount}), 0)` }).from(dailyPageViews).where(gte(dailyPageViews.viewDate, dateDaysAgo(6))),
			db.select({ id: scholarships.id, title: scholarships.title, slug: scholarships.slug, views: sql<number>`sum(${dailyPageViews.viewCount})` })
				.from(dailyPageViews)
				.innerJoin(scholarships, eq(scholarships.slug, dailyPageViews.resourceKey))
				.where(and(eq(dailyPageViews.resourceType, 'scholarship'), gte(dailyPageViews.viewDate, dateDaysAgo(29)), eq(scholarships.publicationStatus, 'published'), eq(scholarships.verificationStatus, 'verified')))
				.groupBy(scholarships.id, scholarships.title, scholarships.slug)
				.orderBy(desc(sql`sum(${dailyPageViews.viewCount})`))
				.limit(5)
			]);
			pageViewsToday = Number(todayViews[0]?.n ?? 0);
			pageViewsLast7Days = Number(weekViews[0]?.n ?? 0);
			popular = topListings.map((item) => ({ ...item, views: Number(item.views ?? 0) }));
		} catch (cause) {
			analyticsError = true;
			analyticsProblem = analyticsFailureKind(cause);
			console.error('[admin-dashboard] Could not load site activity analytics; apply pending database migrations', cause);
		}
		return {
			databaseConfigured: true,
			analyticsError,
			analyticsProblem,
			stats: {
				total: Number(all[0]?.n ?? 0), published: Number(published[0]?.n ?? 0),
				pending: Number(pending[0]?.n ?? 0), expired: Number(expired[0]?.n ?? 0),
				pageViewsToday, pageViewsLast7Days
			},
			popular,
			recent
		};
	} catch (cause) {
		console.error('[admin-dashboard] Could not load dashboard statistics', cause);
		return { databaseConfigured: true, databaseError: true, analyticsError: true, analyticsProblem: 'database' as const, stats: emptyStats, popular: [], recent: [] };
	}
}

export const actions={logout:async(event)=>{await deleteSession(event.cookies);return {success:true}}};
