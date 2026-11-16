import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { desc, eq, inArray, like, or } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { scholarships } from '$lib/server/schema';
import { findAdminScholarships } from '$lib/server/queries';

export async function load({ url }) {
	if (!env.DATABASE_URL) return { rows: [], query: url.searchParams.get('q') ?? '', databaseConfigured: false };
	try {
		const query = url.searchParams.get('q')?.trim() ?? '';
		const rows = query
			? await getDb().select().from(scholarships).where(or(like(scholarships.title, `%${query}%`), like(scholarships.provider, `%${query}%`))).orderBy(desc(scholarships.updatedAt))
			: await findAdminScholarships();
		return { rows, query, databaseConfigured: true };
	} catch (cause) {
		console.error('[admin-scholarships] Could not list scholarships', cause);
		return { rows: [], query: url.searchParams.get('q') ?? '', databaseConfigured: true, databaseError: true };
	}
}

export const actions = {
	status: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const field = String(form.get('field') ?? '');
		const value = String(form.get('value') ?? '');
		if (!id || !['verificationStatus', 'applicationStatus', 'publicationStatus'].includes(field)) return fail(400, { error: 'Invalid scholarship update.' });
		const allowed = { verificationStatus: ['pending_verification', 'verified', 'needs_reverification', 'expired', 'rejected'], applicationStatus: ['open', 'upcoming', 'closed', 'unconfirmed'], publicationStatus: ['draft', 'published', 'archived'] } as const;
		if (!allowed[field as keyof typeof allowed].includes(value as never)) return fail(400, { error: 'Invalid status.' });
		if (field === 'publicationStatus' && value === 'published') {
			const [listing] = await getDb().select().from(scholarships).where(eq(scholarships.id, id)).limit(1);
			if (!listing || listing.verificationStatus !== 'verified') return fail(400, { error: 'Only verified scholarships can be published.' });
		}
		const now = new Date();
		const update = field === 'verificationStatus'
			? { verificationStatus: value as typeof allowed.verificationStatus[number], verifiedAt: value === 'verified' ? now : null, updatedAt: now }
			: field === 'applicationStatus'
				? { applicationStatus: value as typeof allowed.applicationStatus[number], updatedAt: now }
				: { publicationStatus: value as typeof allowed.publicationStatus[number], updatedAt: now };
		await getDb().update(scholarships).set(update).where(eq(scholarships.id, id));
		return { success: true };
	},
	bulkAction: async ({ request }) => {
		const form = await request.formData();
		const mode = String(form.get('mode') ?? '');
		const ids = [...new Set(form.getAll('ids').map(String).filter(Boolean))];
		if (!['verify', 'publish', 'draft'].includes(mode)) return fail(400, { error: 'Choose a valid bulk action.' });
		if (!ids.length) return fail(400, { error: 'Select at least one scholarship.' });
		if (ids.length > 100) return fail(400, { error: 'Select no more than 100 scholarships at a time.' });

		const db = getDb();
		const selected = await db.select({ id: scholarships.id, verificationStatus: scholarships.verificationStatus }).from(scholarships).where(inArray(scholarships.id, ids));
		if (selected.length !== ids.length) return fail(404, { error: 'One or more selected scholarships could not be found.' });
		const now = new Date();

		if (mode === 'verify') {
			await db.update(scholarships).set({ verificationStatus: 'verified', verifiedAt: now, updatedAt: now }).where(inArray(scholarships.id, ids));
			return { success: `${ids.length} scholarship${ids.length === 1 ? '' : 's'} marked verified. They remain drafts until published.` };
		}

		if (mode === 'publish') {
			if (selected.some((row) => row.verificationStatus !== 'verified')) {
				return fail(400, { error: 'Verify every selected scholarship before publishing.' });
			}
			await db.update(scholarships).set({ publicationStatus: 'published', updatedAt: now }).where(inArray(scholarships.id, ids));
			return { success: `${ids.length} verified scholarship${ids.length === 1 ? '' : 's'} published and now visible in the public directory.` };
		}

		await db.update(scholarships).set({ publicationStatus: 'draft', updatedAt: now }).where(inArray(scholarships.id, ids));
		return { success: `${ids.length} scholarship${ids.length === 1 ? '' : 's'} moved to drafts.` };
	}
};
