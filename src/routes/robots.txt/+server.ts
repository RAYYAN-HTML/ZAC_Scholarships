import { env } from '$env/dynamic/public';

export function GET() {
	const sitemap = env.PUBLIC_SITE_URL ? `Sitemap: ${env.PUBLIC_SITE_URL.replace(/\/$/, '')}/sitemap.xml\n` : '';
	return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /healthz\n${sitemap}`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
	});
}
