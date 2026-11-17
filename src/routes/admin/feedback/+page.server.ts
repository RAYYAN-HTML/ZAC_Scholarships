import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { feedback } from '$lib/server/schema';
import { feedbackReplySchema } from '$lib/server/validation';

export async function load() {
	if (!env.DATABASE_URL) return { rows: [], databaseConfigured: false };
	try {
		return { rows: await getDb().select().from(feedback).orderBy(desc(feedback.createdAt)), databaseConfigured: true };
	} catch (cause) {
		console.error('[admin-feedback] Could not load feedback', cause);
		return { rows: [], databaseConfigured: true, databaseError: true };
	}
}

export const actions = {
	status: async ({ request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '');
		if (!/^[\da-f-]{36}$/i.test(id) || !['new', 'reviewed', 'resolved'].includes(status)) return fail(400, { error: 'Invalid feedback update.' });
		try {
			await getDb().update(feedback).set({ status: status as 'new' | 'reviewed' | 'resolved' }).where(eq(feedback.id, id));
			return { success: true };
		} catch (cause) {
			console.error('[admin-feedback] Could not update feedback status', cause);
			return fail(503, { error: 'Feedback status could not be saved right now.' });
		}
	},
	reply: async ({ request }) => {
		const form = await request.formData();
		const parsed = feedbackReplySchema.safeParse({ id: form.get('id'), reply: form.get('reply'), isPublic: form.get('isPublic') === 'true' ? 'true' : 'false' });
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Please check the reply.' });
		try {
			const db = getDb();
			const [item] = await db.select({ publicRequested: feedback.publicRequested }).from(feedback).where(eq(feedback.id, parsed.data.id)).limit(1);
			if (!item) return fail(404, { error: 'That feedback entry could not be found.' });
			if (parsed.data.isPublic && !item.publicRequested) return fail(400, { error: 'This submitter did not consent to public sharing. Keep this entry private.' });
			const reply = parsed.data.reply || null;
			await db.update(feedback).set({ adminReply: reply, repliedAt: reply ? new Date() : null, isPublic: parsed.data.isPublic }).where(eq(feedback.id, parsed.data.id));
			return { success: true };
		} catch (cause) {
			console.error('[admin-feedback] Could not save feedback reply', cause);
			return fail(503, { error: 'The reply could not be saved right now.' });
		}
	}
};
