type Entry = { count: number; resetAt: number };

/** A bounded, process-local fixed-window limiter for the single-process MVP. */
export class FixedWindowRateLimiter {
	private readonly entries = new Map<string, Entry>();
	private checks = 0;

	constructor(
		private readonly limit: number,
		private readonly windowMs: number,
		private readonly maxClients = 10_000
	) {}

	consume(key: string, now = Date.now()): boolean {
		if (++this.checks % 256 === 0 || this.entries.size >= this.maxClients) {
			for (const [client, entry] of this.entries) {
				if (entry.resetAt <= now) this.entries.delete(client);
			}
		}

		const entry = this.entries.get(key);
		if (entry && entry.resetAt > now) {
			if (entry.count >= this.limit) return false;
			entry.count++;
			return true;
		}

		if (this.entries.size >= this.maxClients) return false;
		this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
		return true;
	}
}
