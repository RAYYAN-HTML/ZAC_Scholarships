import { redirect } from '@sveltejs/kit';
export const load = ({ locals, url }) => { if(!locals.admin && url.pathname !== '/admin/login') redirect(303,'/admin/login'); return { admin:locals.admin }; };
