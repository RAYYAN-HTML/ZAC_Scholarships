import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';

type Mapping = { title: string; sourceUrl: string; sourceNote: string };
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const mappings = JSON.parse(
	readFileSync(new URL('../data/candidate-source-urls-2026-11-16.json', import.meta.url), 'utf8')
) as Mapping[];
const db = await mysql.createConnection(databaseUrl);
let updated = 0;
let skipped = 0;

try {
	for (const mapping of mappings) {
		const note = `Official source URL located on 2026-11-16; listing remains pending verification and unpublished. ${mapping.sourceNote}`;
		const [result] = await db.execute<mysql.ResultSetHeader>(
			`UPDATE scholarships
			 SET source_url = ?, review_note = CONCAT(COALESCE(review_note, ''), '\n', ?), updated_at = NOW()
			 WHERE title = ? AND source_url IS NULL
			 AND verification_status = 'pending_verification'
			 AND publication_status = 'draft'`,
			[mapping.sourceUrl, note, mapping.title]
		);
		if (result.affectedRows) {
			updated += result.affectedRows;
			console.log(`Added official source URL: ${mapping.title} (${result.affectedRows} record(s))`);
		} else {
			skipped++;
			console.log(`No eligible empty-source draft matched: ${mapping.title}`);
		}
	}
	console.log(`Source URL update complete: ${updated} updated, ${skipped} skipped. No verification/publication status was changed.`);
} finally {
	await db.end();
}
