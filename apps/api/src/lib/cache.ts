interface CacheEntry<T> {
	data: T;
	expires: number;
}

export class InMemoryCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private ttl: number;

	constructor(ttlSeconds: number) {
		this.ttl = ttlSeconds * 1000;
	}

	get(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) {
			return null;
		}

		if (Date.now() > entry.expires) {
			this.cache.delete(key);
			return null;
		}

		return entry.data;
	}

	set(key: string, value: T): void {
		const expires = Date.now() + this.ttl;
		this.cache.set(key, { data: value, expires });
	}

	delete(key: string): void {
		this.cache.delete(key);
	}
}
