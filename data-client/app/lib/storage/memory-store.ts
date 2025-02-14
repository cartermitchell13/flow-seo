/**
 * Simple in-memory storage for development
 */
class MemoryStore {
  private store: Map<string, string>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Store a value
   */
  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  /**
   * Retrieve a value
   */
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  /**
   * Delete a value
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Export a singleton instance
export const memoryStore = new MemoryStore();
