import db from '../app/lib/utils/database';
import { decrypt } from '../app/lib/utils/encryption';

/**
 * Retrieves an API key for a specific user and provider
 * @param userId - The Webflow user ID
 * @param siteId - The Webflow site ID
 * @param provider - The AI provider (openai, anthropic)
 * @returns The API key if found, null otherwise
 */
export async function getApiKey(userId: string, siteId: string, provider: string): Promise<string | null> {
  try {
    // Get encrypted key from database
    const encryptedKey = await db.getApiKey(userId, siteId, provider);
    
    if (!encryptedKey) {
      return null;
    }
    
    // Decrypt the key
    return decrypt(encryptedKey);
  } catch (error) {
    console.error(`Error retrieving API key for ${provider}:`, error);
    return null;
  }
}

/**
 * Gets the user's selected AI provider
 * @param userId - The Webflow user ID
 * @param siteId - The Webflow site ID
 * @returns The selected provider if found, null otherwise
 */
export async function getSelectedProvider(userId: string, siteId: string): Promise<string | null> {
  try {
    return await db.getSelectedProvider(userId, siteId);
  } catch (error) {
    console.error('Error retrieving selected provider:', error);
    return null;
  }
}
