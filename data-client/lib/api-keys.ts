import { webflow } from '@webflow/designer-extension-sdk';

/**
 * Retrieves an API key for a specific user and provider
 * @param userId - The Webflow user ID
 * @param provider - The AI provider (openai, anthropic)
 * @returns The API key if found, null otherwise
 */
export async function getApiKey(userId: string, provider: string): Promise<string | null> {
  try {
    const secretKey = `user:${userId}:${provider}:apiKey`;
    return await webflow.getSecret(secretKey);
  } catch (error) {
    console.error(`Error retrieving API key for ${provider}:`, error);
    return null;
  }
}

/**
 * Gets the user's selected AI provider
 * @param userId - The Webflow user ID
 * @returns The selected provider or default 'openai'
 */
export async function getSelectedProvider(userId: string): Promise<string> {
  try {
    const provider = await webflow.keyValueStore.get(`user:${userId}:selectedProvider`);
    return provider || 'openai'; // Default to OpenAI if not set
  } catch (error) {
    console.error('Error retrieving selected provider:', error);
    return 'openai'; // Default to OpenAI on error
  }
}
