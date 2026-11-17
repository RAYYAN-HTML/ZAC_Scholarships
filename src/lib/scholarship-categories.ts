export const scholarshipCategories = [
	'Government programme',
	'University award',
	'International programme',
	'Foundation / nonprofit',
	'Merit-based award',
	'Need-based aid',
	'Research opportunity',
	'Professional qualification',
	'Other'
] as const;

const categoryGroups: Record<(typeof scholarshipCategories)[number], string[]> = {
	'Government programme': ['Government', 'Government / International', 'Government / University', 'International / Government'],
	'University award': ['University'],
	'International programme': ['International', 'International / University consortium'],
	'Foundation / nonprofit': ['Foundation', 'International / Nonprofit', 'Private / Nonprofit'],
	'Merit-based award': ['Merit-based'],
	'Need-based aid': ['Need-based'],
	'Research opportunity': ['Research', 'Government / Research'],
	'Professional qualification': ['Professional qualification'],
	Other: ['Other']
};

const normalizedCategory = new Map<string, (typeof scholarshipCategories)[number]>();
for (const category of scholarshipCategories) normalizedCategory.set(category.toLowerCase(), category);
for (const [category, aliases] of Object.entries(categoryGroups)) {
	for (const alias of aliases) normalizedCategory.set(alias.toLowerCase(), category as (typeof scholarshipCategories)[number]);
}

export function normalizeScholarshipCategory(value: string | null | undefined): (typeof scholarshipCategories)[number] {
	return normalizedCategory.get(value?.trim().toLowerCase() ?? '') ?? 'Other';
}

export function rawScholarshipCategories(value: string): string[] {
	const category = normalizeScholarshipCategory(value);
	return [category, ...(categoryGroups[category] ?? [])];
}
