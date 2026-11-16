import { error } from '@sveltejs/kit';
import { findScholarship } from '$lib/server/queries';
export async function load({ params }) { let item; try { item = await findScholarship(params.slug); } catch (cause) { console.error('[scholarship-detail] Could not load listing', cause); throw error(503, 'This scholarship could not be loaded right now.'); } if (!item) throw error(404, 'This scholarship is not available.'); return { item }; }
