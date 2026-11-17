import { env } from '$env/dynamic/private';
import { findHomepageFeatured } from '$lib/server/queries';
export async function load() { if (!env.DATABASE_URL) return { featured: [], total: 0, databaseConfigured: false, databaseError: false }; try { const featured = await findHomepageFeatured(); return { featured, total: featured.length, databaseConfigured: true, databaseError: false }; } catch (error) { console.error('[home] Could not load verified scholarships', error); return { featured: [], total: 0, databaseConfigured: true, databaseError: true }; } }
