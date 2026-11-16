const PUBLIC_PAGES = new Set(['/', '/scholarships', '/about', '/faq', '/contact', '/feedback']);

export function trackedResourceForPath(path: string) {
	if (PUBLIC_PAGES.has(path)) return { resourceType: 'page' as const, resourceKey: path };
	const match = /^\/scholarships\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
	return match ? { resourceType: 'scholarship' as const, resourceKey: match[1] } : null;
}

export function dateKeyInKarachi(date = new Date()) {
	const parts = new Intl.DateTimeFormat('en', {
		timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit'
	}).formatToParts(date);
	const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
	return `${value.year}-${value.month}-${value.day}`;
}

export function analyticsFailureKind(cause: unknown): 'migration' | 'database' {
	if (cause && typeof cause === 'object') {
		const error = cause as { code?: unknown; errno?: unknown };
		if (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146) return 'migration';
	}
	return 'database';
}
