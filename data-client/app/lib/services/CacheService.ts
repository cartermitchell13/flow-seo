/**
 * Generic Cache Service
 * -------------------
 * Provides in-memory caching with expiration
 */
export class CacheService<T = unknown> {
  private static instance: CacheService;
  private cache: Map<string, { data: T; timestamp: number }>;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance<T>(): CacheService<T> {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService<T>();
    }
    return CacheService.instance as CacheService<T>;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}
