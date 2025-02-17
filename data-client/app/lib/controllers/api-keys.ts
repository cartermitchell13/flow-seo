import database from '../utils/database';
import { encrypt, decrypt } from '../utils/encryption';

/**
 * Controller for managing API keys with encryption
 */
export const apiKeysController = {
  /**
   * Save an API key for a specific provider
   * @param userId - The user's ID
   * @param siteId - The site's ID
   * @param provider - The AI provider (e.g., 'openai')
   * @param apiKey - The API key to store
   */
  async saveApiKey(userId: string, siteId: string, provider: string, apiKey: string) {
    try {
      // Log the attempt (safely)
      console.log('Attempting to save API key:', {
        userId,
        siteId,
        provider,
        keyLength: apiKey.length,
        keyPrefix: apiKey.slice(0, 10) + '...'
      });
      
      // Encrypt the API key before storing
      const encryptedKey = encrypt(apiKey);
      
      // Store in database
      await database.saveApiKey(userId, siteId, provider, encryptedKey);
      console.log('Encrypted API key stored in database for:', { userId, siteId, provider });
      
      return { success: true };
    } catch (error) {
      // Log the full error for debugging (without sensitive data)
      console.error('Error in saveApiKey:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        siteId,
        provider
      });
      throw error;
    }
  },

  /**
   * Get the selected AI provider for a user
   * @param userId - The user's ID
   * @param siteId - The site's ID
   */
  async getSelectedProvider(userId: string, siteId: string): Promise<string | null> {
    try {
      return await database.getSelectedProvider(userId, siteId);
    } catch (error) {
      console.error('Error in getSelectedProvider:', { error, userId, siteId });
      return null;
    }
  },

  /**
   * Get the API key for a specific provider
   * @param userId - The user's ID
   * @param siteId - The site's ID
   * @param provider - The provider to get the key for
   */
  async getApiKey(userId: string, siteId: string, provider: string): Promise<string | null> {
    try {
      const encryptedKey = await database.getApiKey(userId, siteId, provider);
      
      // If no key found, return null
      if (!encryptedKey) {
        return null;
      }
      
      // Decrypt the API key before returning
      return decrypt(encryptedKey);
    } catch (error) {
      console.error('Error in getApiKey:', { error, userId, siteId, provider });
      return null;
    }
  },

  /**
   * Delete an API key for a specific provider
   * @param userId - The user's ID
   * @param siteId - The site's ID
   * @param provider - The provider to delete the key for
   */
  async deleteApiKey(userId: string, siteId: string, provider: string): Promise<boolean> {
    try {
      // Delete from database
      await database.deleteApiKey(userId, siteId, provider);
      console.log('API key deleted for:', { userId, siteId, provider });
      
      return true;
    } catch (error) {
      console.error('Error in deleteApiKey:', { error, userId, siteId, provider });
      throw error;
    }
  }
};
