import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getAdmin } from '$lib/server/auth';
import { isAdminProtectedPath } from '$lib/server/auth-guard';

export const handle: Handle = async ({ event, resolve }) => {
	try { event.locals.admin = await getAdmin(event.cookies); } catch (error) { console.error('[auth] Could not validate admin session', error); event.locals.admin = null; }
	if (!event.locals.admin && isAdminProtectedPath(event.url.pathname)) redirect(303, '/admin/login');
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff'); response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); response.headers.set('X-Frame-Options', 'DENY'); response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};
