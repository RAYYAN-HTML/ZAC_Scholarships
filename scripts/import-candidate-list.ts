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
const ignoredWords = new Set(['scholarship', 'scholarships', 'fellowship', 'fellowships', 'programme', 'program', 'award', 'awards', 'the', 'of', 'and', 'for', 'in', 'at', 'by', 'study', 'studies', 'international', 'fully', 'fund', 'pakistan', 'entry', 'cohort', 'scheme', 'university']);
const titleKey = (title: string) => title.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').split(' ').filter((token) => token && !ignoredWords.has(token) && !/^\d+$/.test(token)).sort().join(' ');
const confirmedAliasGroups = [
	['Global Korea Scholarship (GKS)', 'Global Korea Scholarship (GKS) Undergraduate University Track 2027'],
	['Chinese Government Scholarship (CSC)', 'Chinese Government Scholarship Program 2027–28'],
	['Harrison Physics Scholarship — Oxford', 'Wolfson Harrison Physics Scholarship 2027–28']
].map((titles) => new Set(titles.map(titleKey)));
const isSameTitle = (left: string, right: string) => {
	const leftKey = titleKey(left);
	const rightKey = titleKey(right);
	return Boolean(leftKey && leftKey === rightKey) || confirmedAliasGroups.some((group) => group.has(leftKey) && group.has(rightKey));
};

const db = await mysql.createConnection(url);
const [existing] = await db.query<mysql.RowDataPacket[]>('SELECT id,title,source_url,review_note FROM scholarships');
const knownRows = existing.map((row) => ({ id: String(row.id), title: String(row.title), sourceUrl: row.source_url ? String(row.source_url) : null, reviewNote: row.review_note ? String(row.review_note) : null }));
let imported = 0;
let skipped = 0;

try {
	for (const candidate of candidates) {
		const matches = knownRows.filter((row) => isSameTitle(candidate.title, row.title));
		if (matches.length) {
			const officialMatch = matches.find((row) => row.sourceUrl);
			const staleCandidate = officialMatch && matches.find((row) => !row.sourceUrl && row.reviewNote?.startsWith('Unverified candidate imported from the user-provided list'));
			if (staleCandidate) {
				const note = `${staleCandidate.reviewNote} Marked rejected and archived on 2026-11-16 because this candidate duplicates an existing source-backed listing: ${officialMatch.title}.`;
				await db.execute('UPDATE scholarships SET verification_status=?,publication_status=?,review_note=?,updated_at=NOW() WHERE id=?', ['rejected', 'archived', note, staleCandidate.id]);
				staleCandidate.reviewNote = note;
				console.log(`Archived duplicate candidate: ${staleCandidate.title} → ${officialMatch.title}`);
			}
			console.log(`Skipped confirmed duplicate: ${candidate.title} ↔ ${matches[0].title}`);
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
		knownRows.push({ id: '', title: candidate.title, sourceUrl: null, reviewNote });
		imported++;
	}
	console.log(`Candidate import complete: ${imported} added as pending, unpublished drafts; ${skipped} existing or confirmed duplicate rows skipped; ${candidates.length} source rows reviewed.`);
} catch (error) {
	console.error('Candidate import stopped. Imported items remain unpublished drafts.', error);
	process.exitCode = 1;
} finally {
	await db.end();
}
