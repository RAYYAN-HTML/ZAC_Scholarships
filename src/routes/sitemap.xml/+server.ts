import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { scholarships } from '$lib/server/schema';

export async function GET() {
	const origin=(publicEnv.PUBLIC_SITE_URL||'http://localhost:5173').replace(/\/$/,'');
	const staticPaths=['/','/scholarships','/about','/faq','/contact','/feedback'];let urls:string[]=[];
	try{if(env.DATABASE_URL){const items=await getDb().select({slug:scholarships.slug,updatedAt:scholarships.updatedAt}).from(scholarships).where(and(eq(scholarships.publicationStatus,'published'),eq(scholarships.verificationStatus,'verified')));urls=items.map((item)=>`<url><loc>${origin}/scholarships/${encodeURIComponent(item.slug)}</loc><lastmod>${new Date(item.updatedAt).toISOString()}</lastmod></url>`);}}
	catch(error){console.error('[sitemap] Could not load public scholarship URLs',error);}
	const pages=staticPaths.map((path)=>`<url><loc>${origin}${path}</loc></url>`).join('');
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages}${urls.join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
