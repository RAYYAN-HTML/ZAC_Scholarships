import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

// Official-source checks of opportunities named in the two user-pasted lists.
// This controlled importer always creates pending, unpublished review drafts.
const rows = [
	{
		title: 'Chevening Scholarship for Pakistan 2027–28', provider: 'UK Foreign, Commonwealth & Development Office / Chevening', country: 'United Kingdom', category: 'Government', degreeLevels: 'Master’s', fieldsOfStudy: 'One-year taught master’s degree at an eligible UK university',
		description: 'UK government scholarship programme for eligible Pakistani applicants pursuing a one-year taught master’s degree in the United Kingdom.',
		eligibility: 'Pakistani applicants must meet Chevening’s citizenship, education, work-experience, course-choice and return-to-home-country requirements. Check the official Pakistan page for the current complete rules.',
		benefits: 'The Chevening award package is described on the official programme pages; confirm the applicable 2027–28 package before publication.', requiredDocuments: 'Not specified in this draft; see current official application guidance.',
		openingDate: null, deadline: '2026-10-06', fundingType: 'Fully funded Master’s scholarship', applicationUrl: 'https://www.chevening.org/apply/', sourceUrl: 'https://www.chevening.org/scholarship/pakistan/', applicationStatus: 'closed',
		reviewNote: 'Official Chevening Pakistan page confirms the programme and says 2027–28 applications are closed. Official timeline gives 6 October 2026 as the deadline. Checked 2026-11-16 UTC. Do not reopen or publish without a newer official cycle announcement.'
	},
	{
		title: 'Rhodes Scholarship for Pakistan 2027 Entry', provider: 'The Rhodes Trust', country: 'United Kingdom', category: 'University', degreeLevels: 'Postgraduate (Oxford degree-specific)', fieldsOfStudy: 'Eligible postgraduate degrees at the University of Oxford',
		description: 'Annual Rhodes Trust scholarship for eligible applicants from Pakistan to undertake postgraduate study at the University of Oxford.',
		eligibility: 'Pakistan constituency applicants must satisfy the Rhodes Trust’s citizenship, age, academic and constituency criteria and meet Oxford course admission requirements. Review the official Pakistan page for complete rules.',
		benefits: 'Rhodes scholarship funding for Oxford study; confirm the current package and course duration on the official Rhodes Trust page.', requiredDocuments: 'Online application and supporting materials specified in the current Rhodes Pakistan application guidance.',
		openingDate: '2026-06-01', deadline: '2026-08-05', fundingType: 'Fully funded postgraduate scholarship', applicationUrl: 'https://www.rhodeshouse.ox.ac.uk/scholarships/applications/pakistan/', sourceUrl: 'https://www.rhodeshouse.ox.ac.uk/scholarships/applications/pakistan/', applicationStatus: 'closed',
		reviewNote: 'Official Rhodes Trust Pakistan constituency page confirms two annual awards and the 2027-entry window (1 June–5 August 2026 Pakistan time). Checked 2026-11-16 UTC. The pasted list was too broad: this is a postgraduate Oxford award, not a general Master’s/PhD promise.'
	},
	{
		title: 'Oxford Clarendon Fund Scholarships 2027–28', provider: 'Clarendon Fund / University of Oxford', country: 'United Kingdom', category: 'University', degreeLevels: 'Graduate (course-specific)', fieldsOfStudy: 'Eligible graduate courses at the University of Oxford',
		description: 'Oxford graduate scholarship fund offering awards to academically outstanding applicants across eligible graduate disciplines.',
		eligibility: 'Applicants of any nationality applying for an eligible Oxford graduate course. Applicants are automatically considered when they apply by the relevant course funding deadline; deadlines vary by course.',
		benefits: 'Clarendon awards cover course fees and provide a living-cost grant. Confirm current award terms on the official Oxford listing.', requiredDocuments: 'Apply for the Oxford graduate course by its applicable December or January funding deadline; check course-specific instructions.',
		openingDate: null, deadline: null, fundingType: 'Graduate tuition and living-cost scholarship', applicationUrl: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search/scholarships-a-z-listing', sourceUrl: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search/scholarships-a-z-listing', applicationStatus: 'unconfirmed',
		reviewNote: 'Oxford official graduate scholarship directory confirms Clarendon awards and automatic consideration for eligible applications. No single deadline: course deadlines apply. Checked 2026-11-16 UTC. Keep draft until the exact 2027–28 course criteria and deadlines are reviewed.'
	},
	{
		title: 'Wolfson Harrison Physics Scholarship 2027–28', provider: 'Wolfson College, University of Oxford', country: 'United Kingdom', category: 'University', degreeLevels: 'DPhil', fieldsOfStudy: 'Physics (any branch)',
		description: 'Wolfson College scholarship for an eligible DPhil candidate in Physics at the University of Oxford.',
		eligibility: 'Applicants for a DPhil in Physics at Oxford; other course and award criteria must be checked on the current official Wolfson page.',
		benefits: 'Official college information describes fees and a grant up to the doctoral stipend rate; confirm the 2027–28 amount before publication.', requiredDocuments: 'Oxford DPhil application and any current scholarship requirements listed by Wolfson College.',
		openingDate: null, deadline: null, fundingType: 'Doctoral fees and stipend support', applicationUrl: 'https://www.wolfson.ox.ac.uk/scholarships/', sourceUrl: 'https://www.wolfson.ox.ac.uk/scholarships/', applicationStatus: 'unconfirmed',
		reviewNote: 'Official Wolfson scholarships page confirms the award and the specific DPhil Physics scope; the user-pasted list incorrectly described it as Master’s/PhD. Course deadline applies; verify current 2027–28 award terms and deadline. Checked 2026-11-16 UTC.'
	},
	{
		title: 'Peters Family Scholarship in Water Science, Policy and Management 2027–28', provider: 'Wolfson College, University of Oxford', country: 'United Kingdom', category: 'University', degreeLevels: 'MSc Water Science, Policy and Management', fieldsOfStudy: 'Water science, policy and management',
		description: 'Wolfson College scholarship associated with Oxford’s MSc in Water Science, Policy and Management.',
		eligibility: 'Applicants for the specified Oxford MSc. Wolfson states that criteria for the 2027–28 award are under review; no broader eligibility should be assumed.',
		benefits: 'Scholarship funding is described on the official Wolfson page; the current award amount and conditions require confirmation.', requiredDocuments: 'Oxford course application and current Wolfson scholarship requirements; 2027–28 criteria are under review.',
		openingDate: null, deadline: null, fundingType: 'Scholarship (current amount not confirmed)', applicationUrl: 'https://www.wolfson.ox.ac.uk/scholarships/', sourceUrl: 'https://www.wolfson.ox.ac.uk/scholarships/', applicationStatus: 'unconfirmed',
		reviewNote: 'Official Wolfson page confirms this is tied to the MSc Water Science, Policy and Management, not general Master’s/PhD study. Current 2027–28 criteria are under review. Checked 2026-11-16 UTC; must remain pending/unconfirmed until criteria are published.'
	},
	{
		title: 'Yenching Academy Scholarship 2027 Cohort', provider: 'Yenching Academy of Peking University', country: 'China', category: 'University', degreeLevels: 'Master’s', fieldsOfStudy: 'China Studies (interdisciplinary Master’s programme)',
		description: 'Yenching Academy’s interdisciplinary Master’s in China Studies for international students beginning in September 2027.',
		eligibility: 'International applicants, including Pakistanis, who meet the Academy’s degree, age, academic achievement, language and other current application requirements.',
		benefits: 'For admitted scholars, the official application materials describe tuition, accommodation, round-trip travel, basic medical insurance, monthly stipend and research support for the first year; continuation terms apply for the second year.', requiredDocuments: 'Online application and supporting materials listed in the 2027 application instructions, including academic records, recommendations and language evidence as applicable.',
		openingDate: '2026-09-01', deadline: '2026-11-30', fundingType: 'Fully funded Master’s scholarship', applicationUrl: 'https://apply.yca.pku.edu.cn/application', sourceUrl: 'https://yenchingacademy.pku.edu.cn/ADMISSIONS.htm', applicationStatus: 'open',
		reviewNote: 'Current Yenching Academy admissions page and 2027 instructions confirm the 2027 cohort, international eligibility and 30 Nov 2026 deadline (09:00 Beijing time); application opened 1 Sep 2026. Checked 2026-11-16 UTC. Verify time-zone and complete current terms before publishing.'
	},
	{
		title: 'NUS Research Scholarship', provider: 'National University of Singapore (NUS Graduate School)', country: 'Singapore', category: 'University', degreeLevels: 'Research Master’s, PhD', fieldsOfStudy: 'Eligible research programmes; faculty-specific',
		description: 'NUS scholarship support for eligible full-time graduate research students.',
		eligibility: 'International and local applicants may be eligible subject to academic requirements and the rules of the admitting NUS faculty or programme.',
		benefits: 'Official NUS Graduate School page lists a tuition fee subsidy and monthly stipend; amounts and terms vary by degree and current rules.', requiredDocuments: 'Apply to an eligible NUS graduate research programme and satisfy the programme’s application requirements.',
		openingDate: null, deadline: null, fundingType: 'Tuition support and stipend (programme-specific)', applicationUrl: 'https://nusgs.nus.edu.sg/scholarships/nus-research-scholarship', sourceUrl: 'https://nusgs.nus.edu.sg/scholarships/nus-research-scholarship', applicationStatus: 'unconfirmed',
		reviewNote: 'Official NUS Graduate School page confirms the award, eligibility for international students and research degree scope. Deadlines are programme-specific and no single current cycle is confirmed. Checked 2026-11-16 UTC.'
	},
	{
		title: 'NTU Research Scholarship', provider: 'Nanyang Technological University (NTU Singapore)', country: 'Singapore', category: 'University', degreeLevels: 'Research Master’s, PhD', fieldsOfStudy: 'Eligible full-time graduate research programmes',
		description: 'NTU scholarship for eligible full-time graduate research candidates.',
		eligibility: 'International candidates may be considered for full-time graduate research, subject to NTU and school-specific requirements.',
		benefits: 'Official NTU information describes tuition coverage and a stipend; rates and award conditions depend on current rules and degree level.', requiredDocuments: 'Apply to an eligible NTU graduate research programme and submit documents required by the school.',
		openingDate: null, deadline: null, fundingType: 'Tuition coverage and stipend (school-specific)', applicationUrl: 'https://www.ntu.edu.sg/admissions/graduate/financialmatters/scholarships/rss', sourceUrl: 'https://www.ntu.edu.sg/admissions/graduate/financialmatters/scholarships/rss', applicationStatus: 'unconfirmed',
		reviewNote: 'Official NTU page confirms the scholarship and its graduate research scope, including international applicants. Intake dates are set with programme/school applications; no universal deadline confirmed. Checked 2026-11-16 UTC.'
	},
	{
		title: 'Singapore International Graduate Award (SINGA)', provider: 'A*STAR and participating Singapore universities', country: 'Singapore', category: 'Government / Research', degreeLevels: 'PhD', fieldsOfStudy: 'Biomedical sciences, computing and information sciences, engineering and technology, physical sciences',
		description: 'Singapore graduate research award supporting eligible international students undertaking a PhD at participating Singapore research institutions.',
		eligibility: 'International graduates with strong academic records and interest in research; exact current eligibility and participating programmes must be confirmed from the official SINGA call.',
		benefits: 'The current award package was not reliably confirmed from the accessible official call and is not specified in this draft.', requiredDocuments: 'Not specified in this draft; use the official current SINGA application instructions.',
		openingDate: null, deadline: null, fundingType: 'Research scholarship (current coverage not confirmed)', applicationUrl: 'https://www.a-star.edu.sg/scholarships/for-graduate-students/singapore-international-graduate-award-singa', sourceUrl: 'https://www.a-star.edu.sg/scholarships/for-graduate-students/singapore-international-graduate-award-singa', applicationStatus: 'unconfirmed',
		reviewNote: 'Official A*STAR materials identify SINGA as an active graduate scholarship programme, but its current live call could not be reliably accessed; list’s claimed 1 Dec 2026 deadline is unconfirmed. No deadline or benefit amount entered. Checked 2026-11-16 UTC; keep pending and unpublished.'
	},
	{
		title: 'Global Korea Scholarship (GKS) Undergraduate University Track 2027', provider: 'National Institute for International Education (NIIED), Republic of Korea', country: 'South Korea', category: 'Government', degreeLevels: 'Undergraduate; Associate degree (track-specific)', fieldsOfStudy: 'Participating Korean universities and programmes listed in the official 2027 notice',
		description: 'Korean government scholarship programme for international students applying to participating universities through the 2027 undergraduate university track.',
		eligibility: 'International applicants may be eligible subject to nationality, age, education and academic rules in the current GKS guidelines. Pakistani route and each university’s eligibility must be checked against the current notice.',
		benefits: 'Not specified in this draft; verify the applicable 2027 official guideline.', requiredDocuments: 'University-specific application materials and the current NIIED GKS guideline.',
		openingDate: null, deadline: null, fundingType: 'Government scholarship (current 2027 package not confirmed)', applicationUrl: 'https://www.studyinkorea.go.kr/en/plan/gksNoticeRead.do?bbsId=BBSMSTR_000000000461&nttId=4527', sourceUrl: 'https://www.studyinkorea.go.kr/en/plan/gksNoticeRead.do?bbsId=BBSMSTR_000000000461&nttId=4527', applicationStatus: 'unconfirmed',
		reviewNote: 'Official Study in Korea / NIIED notice confirms the 2027 undergraduate university track; participating universities set their own application schedules. Pakistani eligibility, exact available programmes and benefit terms were not confirmed in this notice. Checked 2026-11-16 UTC; do not represent as an active Pakistan-specific opening.'
	},
	{
		title: 'Swiss Government Excellence Scholarships 2027–28 — Pakistan', provider: 'Swiss Confederation / Embassy of Switzerland in Pakistan', country: 'Switzerland', category: 'Government', degreeLevels: 'PhD; one-year research stay for doctoral candidates', fieldsOfStudy: 'Research; doctoral research as specified in the call',
		description: 'Swiss Government Excellence Scholarship call announced for eligible Pakistani researchers and doctoral candidates for academic year 2027–28.',
		eligibility: 'Pakistani applicants must meet the requirements of the specific research or PhD scholarship category and Swiss host institution. Consult the official call and country-specific rules.',
		benefits: 'Award benefits depend on scholarship category; confirm current official terms.', requiredDocuments: 'Application documents and Swiss host/institution requirements as set out in the current official call.',
		openingDate: null, deadline: '2026-10-31', fundingType: 'Government research / PhD scholarship', applicationUrl: 'https://www.go.eskas.ch/LoginServlet', sourceUrl: 'https://www.hec.gov.pk/english/HECAnnouncements/Pages/SGES.aspx', applicationStatus: 'closed',
		reviewNote: 'HEC Pakistan official announcement confirms a 2027–28 Pakistan call with one-year research and three-year PhD categories and an online deadline of 31 Oct 2026. HEC notes it only advertises and does not nominate/fund. Checked 2026-11-16 UTC; keep draft pending direct review of Swiss category rules and award package.'
	}
];

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
try {
	for (const row of rows) {
		const [existing] = await connection.execute<mysql.RowDataPacket[]>(
			'SELECT id FROM scholarships WHERE LOWER(title)=LOWER(?) OR (provider=? AND LOWER(title)=LOWER(?)) LIMIT 1',
			[row.title, row.provider, row.title]
		);
		if (existing.length) { console.log(`Skipped duplicate: ${row.title}`); continue; }
		const baseSlug = row.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 170);
		let slug = baseSlug;
		for (let suffix = 2; ; suffix++) {
			const [matches] = await connection.execute<mysql.RowDataPacket[]>('SELECT id FROM scholarships WHERE slug=? LIMIT 1', [slug]);
			if (!matches.length) break;
			slug = `${baseSlug.slice(0, 180)}-${suffix}`;
		}
		await connection.execute(
			'INSERT INTO scholarships (id,slug,title,provider,country,category,degree_levels,fields_of_study,description,eligibility,benefits,required_documents,opening_date,deadline,funding_type,application_url,source_url,verified_at,verification_status,application_status,publication_status,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?,?)',
			[randomUUID(), slug, row.title, row.provider, row.country, row.category, row.degreeLevels, row.fieldsOfStudy, row.description, row.eligibility, row.benefits, row.requiredDocuments, row.openingDate, row.deadline, row.fundingType, row.applicationUrl, row.sourceUrl, 'pending_verification', row.applicationStatus, 'draft', row.reviewNote]
		);
		console.log(`Imported unpublished draft: ${row.title}`);
	}
} catch (error) {
	console.error('Import failed; no record was published.', error);
	process.exitCode = 1;
} finally {
	await connection.end();
}
