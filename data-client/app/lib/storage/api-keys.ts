import { kv } from '@vercel/kv';
import { AIProvider } from '../validators/api-keys';

/**
 * Storage interface for API keys and provider preferences
 */
export const apiKeyStorage = {
  /**
   * Save an API key for a specific provider
   * @param userId - The user's ID
   * @param provider - The AI provider
   * @param apiKey - The API key to store
   */
  async saveApiKey(userId: string, provider: AIProvider, apiKey: string): Promise<void> {
    // Store API key in secure storage
    const key = `user:${userId}:${provider}:apiKey`;
    await kv.set(key, apiKey);

    // Store provider selection (non-sensitive)
    await kv.set(`user:${userId}:selectedProvider`, provider);
  },

  /**
   * Get the API key for a specific provider
   * @param userId - The user's ID
   * @param provider - The AI provider
   */
  async getApiKey(userId: string, provider: AIProvider): Promise<string | null> {
    const key = `user:${userId}:${provider}:apiKey`;
    return kv.get(key);
  },

  /**
   * Get the selected provider for a user
   * @param userId - The user's ID
   */
  async getSelectedProvider(userId: string): Promise<AIProvider | null> {
    return kv.get(`user:${userId}:selectedProvider`);
  },

  /**
   * Delete an API key for a specific provider
   * @param userId - The user's ID
   * @param provider - The AI provider
   */
  async deleteApiKey(userId: string, provider: AIProvider): Promise<void> {
    const key = `user:${userId}:${provider}:apiKey`;
    await kv.del(key);
  }
};
