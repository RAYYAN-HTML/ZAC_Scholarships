import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import { findPublicScholarships } from '$lib/server/queries';
import { directoryFilterSchema } from '$lib/server/validation';

export async function load({ url }) {
	const parsed = directoryFilterSchema.safeParse({
		q: url.searchParams.get('q') || undefined,
		country: url.searchParams.get('country') || undefined,
		degree: url.searchParams.get('degree') || undefined,
		category: url.searchParams.get('category') || undefined,
		funding: url.searchParams.get('funding') || undefined,
		sort: url.searchParams.get('sort') || undefined,
		page: url.searchParams.get('page') || undefined
	});
	if (!parsed.success) throw error(400, 'Some search filters are invalid. Clear the filters and try again.');
	const params = { ...parsed.data, q: parsed.data.q || undefined, country: parsed.data.country || undefined, degree: parsed.data.degree || undefined, category: parsed.data.category || undefined, funding: parsed.data.funding || undefined };
	if (!env.DATABASE_URL) return { ...params, rows: [], count: 0, countries: [], total: 0, pages: 0, databaseConfigured: false, databaseError: false };
	try { return { ...await findPublicScholarships(params), ...params, databaseConfigured: true, databaseError: false }; } catch (cause) { console.error('[directory] Could not query scholarships', cause); throw error(503, { message: 'The scholarship directory is temporarily unavailable. Please try again shortly.' }); }
}
