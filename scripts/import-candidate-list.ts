import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

type Candidate = {
	listName: string;
	rowNumber: number;
	title: string;
	country: string;
	degreeLevels: string;
	suppliedStatus: string;
};

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('Set DATABASE_URL before importing scholarship candidates.');
	process.exit(1);
}

const candidates = JSON.parse(readFileSync(new URL('../data/scholarship-candidates-2026-11-16.json', import.meta.url), 'utf8')) as Candidate[];
const ignoredWords = new Set(['scholarship', 'scholarships', 'programme', 'program', 'award', 'awards', 'the', 'of', 'and', 'for', 'in', 'at', 'by', 'study', 'studies', 'international', 'fully', 'fund', '2026', '2027', '2028', '2029', 'pakistan', 'entry', 'cohort', 'scheme', 'university']);
const titleTokens = (title: string) => new Set(title.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((token) => token && !ignoredWords.has(token)));
const isLikelySameTitle = (left: string, right: string) => {
	const a = titleTokens(left);
	const b = titleTokens(right);
	if (!a.size || !b.size) return false;
	if (a.size === b.size && [...a].every((token) => b.has(token))) return true;
	const smaller = a.size <= b.size ? a : b;
	const larger = a.size <= b.size ? b : a;
	return smaller.size >= 2 && [...smaller].every((token) => larger.has(token));
};

const db = await mysql.createConnection(url);
const [existing] = await db.query<mysql.RowDataPacket[]>('SELECT title FROM scholarships');
const knownTitles = existing.map((row) => String(row.title));
let imported = 0;
let skipped = 0;

try {
	for (const candidate of candidates) {
		const duplicate = knownTitles.find((title) => isLikelySameTitle(candidate.title, title));
		if (duplicate) {
			console.log(`Skipped possible duplicate: ${candidate.title} ↔ ${duplicate}`);
			skipped++;
			continue;
		}

		const baseSlug = candidate.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 170);
		let slug = baseSlug;
		for (let suffix = 2;; suffix++) {
			const [matches] = await db.execute<mysql.RowDataPacket[]>('SELECT id FROM scholarships WHERE slug=? LIMIT 1', [slug]);
			if (!matches.length) break;
			slug = `${baseSlug.slice(0, 180)}-${suffix}`;
		}

		const suppliedStatus = candidate.suppliedStatus ? ` The original list stated: “${candidate.suppliedStatus}” (not verified).` : '';
		const reviewNote = `Unverified candidate imported from the user-provided list “${candidate.listName}”, row ${candidate.rowNumber}, on 2026-11-16. The title, provider, existence, Pakistani eligibility, current application status, official source, funding and requirements have not been checked. Research the provider’s official page before changing verification status.${suppliedStatus}`;
		await db.execute(
			'INSERT INTO scholarships (id,slug,title,provider,country,category,degree_levels,fields_of_study,description,eligibility,benefits,required_documents,opening_date,deadline,funding_type,application_url,source_url,verified_at,verification_status,application_status,publication_status,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?,?)',
			[randomUUID(), slug, candidate.title, 'Not specified', candidate.country, 'Other', candidate.degreeLevels, null, 'Unverified candidate from a user-provided list. Confirm that this scholarship exists and is open to Pakistani applicants before treating it as an opportunity.', 'Not specified — verify with the official provider.', 'Not specified — verify with the official provider.', 'Not specified — verify with the official provider.', null, null, 'Not specified', null, null, 'pending_verification', 'unconfirmed', 'draft', reviewNote]
		);
		knownTitles.push(candidate.title);
		imported++;
	}
	console.log(`Candidate import complete: ${imported} added as pending, unpublished drafts; ${skipped} possible duplicates skipped; ${candidates.length} source rows reviewed.`);
} catch (error) {
	console.error('Candidate import stopped. Imported items remain unpublished drafts.', error);
	process.exitCode = 1;
} finally {
	await db.end();
}
