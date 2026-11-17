import { and, asc, desc, eq, gte, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { getDb } from './db';
import { feedback, scholarships } from './schema';
import { dateKeyInKarachi } from './analytics';

export async function findPublicScholarships(filters: { q?: string; country?: string; degree?: string; category?: string; funding?: string; sort?: string; page?: number }) {
	const db = getDb(); const page = Math.max(1, filters.page ?? 1); const size = 9;
	const conditions = [eq(scholarships.publicationStatus, 'published'), eq(scholarships.verificationStatus, 'verified')];
	if (filters.q) conditions.push(or(like(scholarships.title, `%${filters.q}%`), like(scholarships.provider, `%${filters.q}%`), like(scholarships.fieldsOfStudy, `%${filters.q}%`))!);
	if (filters.country) conditions.push(eq(scholarships.country, filters.country));
	if (filters.degree) conditions.push(like(scholarships.degreeLevels, `%${filters.degree}%`));
	if (filters.category) conditions.push(eq(scholarships.category, filters.category));
	if (filters.funding) conditions.push(eq(scholarships.fundingType, filters.funding));
	const today = dateKeyInKarachi();
	const statusPriority = sql<number>`case
		when ${scholarships.deadline} is not null and ${scholarships.deadline} < ${today} then 4
		when ${scholarships.openingDate} is not null and ${scholarships.openingDate} > ${today} then 1
		when ${scholarships.applicationStatus} = 'closed' then 3
		when ${scholarships.applicationStatus} = 'upcoming' then 1
		when ${scholarships.deadline} is null then 2
		when ${scholarships.applicationStatus} = 'open' then 0
		else 2
	end`;
	const order = filters.sort === 'latest'
		? [asc(statusPriority), desc(scholarships.createdAt)]
		: filters.sort === 'alphabetical'
			? [asc(statusPriority), asc(scholarships.title)]
			: [asc(statusPriority), asc(isNull(scholarships.deadline)), asc(scholarships.deadline)];
	const publicListings = and(eq(scholarships.publicationStatus, 'published'), eq(scholarships.verificationStatus, 'verified'));
	const [rows, count, countries, total] = await Promise.all([
		db.select().from(scholarships).where(and(...conditions)).orderBy(...order).limit(size).offset((page - 1) * size),
		db.select({ value: sql<number>`count(*)` }).from(scholarships).where(and(...conditions)),
		db.selectDistinct({ value: scholarships.country }).from(scholarships).where(publicListings).orderBy(asc(scholarships.country)),
		db.select({ value: sql<number>`count(*)` }).from(scholarships).where(publicListings)
	]);
	return {
		rows: rows.map((row) => ({
			...row,
			applicationStatus: row.deadline && row.deadline < today ? 'closed' : row.applicationStatus
		})),
		count: Number(count[0]?.value ?? 0),
		countries: countries.map((item) => item.value),
		total: Number(total[0]?.value ?? 0),
		page,
		pages: Math.ceil(Number(count[0]?.value ?? 0) / size)
	};
}
export async function findPublicScholarshipFilters() {
	const publicListings = and(eq(scholarships.publicationStatus, 'published'), eq(scholarships.verificationStatus, 'verified'));
	const [categories, fundingTypes] = await Promise.all([
		getDb().selectDistinct({ value: scholarships.category }).from(scholarships).where(publicListings).orderBy(asc(scholarships.category)),
		getDb().selectDistinct({ value: scholarships.fundingType }).from(scholarships).where(publicListings).orderBy(asc(scholarships.fundingType))
	]);
	return { categories: categories.map((item) => item.value), fundingTypes: fundingTypes.map((item) => item.value) };
}
/** Homepage highlights only actionable listings. Closed and elapsed-deadline scholarships stay in the directory. */
export async function findHomepageFeatured() {
	const today = dateKeyInKarachi();
	return getDb().select().from(scholarships).where(and(
		eq(scholarships.publicationStatus, 'published'),
		eq(scholarships.verificationStatus, 'verified'),
		inArray(scholarships.applicationStatus, ['open', 'upcoming']),
		or(isNull(scholarships.deadline), gte(scholarships.deadline, today))
	)).orderBy(asc(isNull(scholarships.deadline)), asc(scholarships.deadline), desc(scholarships.createdAt)).limit(3);
}
export async function findScholarship(slug: string) { const result = await getDb().select().from(scholarships).where(and(eq(scholarships.slug, slug),eq(scholarships.publicationStatus,'published'),eq(scholarships.verificationStatus,'verified'))).limit(1); return result[0]; }
export async function findAdminScholarships() { return getDb().select().from(scholarships).orderBy(desc(scholarships.updatedAt)); }
export async function findFeedback() { return getDb().select().from(feedback).orderBy(desc(feedback.createdAt)); }
