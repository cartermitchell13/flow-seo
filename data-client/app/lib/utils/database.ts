import { neon } from '@neondatabase/serverless';

/**
 * Database Utility
 * ---------------
 * This module provides functions to interact with a Neon PostgreSQL database.
 * It manages tables for:
 * - Site authorizations
 * - User authorizations
 * - API keys
 */

const sql = neon(process.env.POSTGRES_URL!);

/**
 * Inserts a new site authorization into the database.
 * 
 * @param {string} siteId - The unique identifier for the Webflow site
 * @param {string} accessToken - The OAuth access token for the site
 * @returns {Promise<void>}
 */
export async function insertSiteAuthorization(
  siteId: string,
  accessToken: string
): Promise<void> {
  await sql`
    INSERT INTO site_authorizations (site_id, access_token)
    VALUES (${siteId}, ${accessToken})
    ON CONFLICT (site_id) DO UPDATE
    SET access_token = ${accessToken}
  `;
}

/**
 * Inserts a new user authorization into the database.
 * 
 * @param {string} userId - The unique identifier for the Webflow user
 * @param {string} accessToken - The OAuth access token for the user
 * @returns {Promise<void>}
 */
export async function insertUserAuthorization(
  userId: string,
  accessToken: string
): Promise<void> {
  await sql`
    INSERT INTO user_authorizations (user_id, access_token)
    VALUES (${userId}, ${accessToken})
    ON CONFLICT (user_id) DO UPDATE
    SET access_token = ${accessToken}
  `;
}

/**
 * Retrieves the access token for a given site ID.
 * 
 * @param {string} siteId - The unique identifier for the Webflow site
 * @returns {Promise<string>} The access token for the site
 * @throws Error if no access token is found or the site does not exist
 */
export async function getAccessTokenFromSiteId(siteId: string): Promise<string> {
  const result = await sql`
    SELECT access_token FROM site_authorizations
    WHERE site_id = ${siteId}
  `;
  
  if (!result || result.length === 0) {
    throw new Error(`No access token found for site ID: ${siteId}`);
  }
  
  return result[0].access_token;
}

/**
 * Retrieves the access token for a given user ID.
 * 
 * @param {string} userId - The unique identifier for the Webflow user
 * @returns {Promise<string>} The access token for the user
 * @throws Error if no access token is found or the user does not exist
 */
export async function getAccessTokenFromUserId(userId: string): Promise<string> {
  const result = await sql`
    SELECT access_token FROM user_authorizations
    WHERE user_id = ${userId}
  `;
  
  if (!result || result.length === 0) {
    throw new Error(`No access token found for user ID: ${userId}`);
  }
  
  return result[0].access_token;
}

/**
 * Saves an encrypted API key for a specific provider.
 * 
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @param {string} provider - The AI provider (e.g., 'openai')
 * @param {string} encryptedKey - The encrypted API key
 * @returns {Promise<void>}
 */
export async function saveApiKey(
  userId: string,
  siteId: string,
  provider: string,
  encryptedKey: string
): Promise<void> {
  await sql`
    INSERT INTO api_keys (user_id, site_id, provider, encrypted_key)
    VALUES (${userId}, ${siteId}, ${provider}, ${encryptedKey})
    ON CONFLICT (user_id, site_id, provider) DO UPDATE
    SET encrypted_key = ${encryptedKey}
  `;
}

/**
 * Deletes an API key for a specific provider.
 * 
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @param {string} provider - The AI provider
 * @returns {Promise<void>}
 */
export async function deleteApiKey(
  userId: string,
  siteId: string,
  provider: string
): Promise<void> {
  await sql`
    DELETE FROM api_keys
    WHERE user_id = ${userId}
      AND site_id = ${siteId}
      AND provider = ${provider}
  `;
}

/**
 * Gets the encrypted API key for a specific provider.
 * 
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @param {string} provider - The AI provider
 * @returns {Promise<string | null>} The encrypted API key if found
 */
export async function getApiKey(
  userId: string,
  siteId: string,
  provider: string
): Promise<string | null> {
  const result = await sql`
    SELECT encrypted_key FROM api_keys
    WHERE user_id = ${userId}
      AND site_id = ${siteId}
      AND provider = ${provider}
  `;
  
  return result.length > 0 ? result[0].encrypted_key : null;
}

/**
 * Gets the selected AI provider for a user.
 * 
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @returns {Promise<string | null>} The selected provider if found
 */
export async function getSelectedProvider(
  userId: string,
  siteId: string
): Promise<string | null> {
  const result = await sql`
    SELECT provider FROM api_keys
    WHERE user_id = ${userId}
      AND site_id = ${siteId}
    LIMIT 1
  `;
  
  return result.length > 0 ? result[0].provider : null;
}

/**
 * Clears all data from the database.
 * 
 * @returns {Promise<void>}
 */
export async function clearDatabase(): Promise<void> {
  await sql`TRUNCATE TABLE site_authorizations, user_authorizations, api_keys`;
}

const database = {
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  insertSiteAuthorization,
  insertUserAuthorization,
  saveApiKey,
  deleteApiKey,
  getApiKey,
  getSelectedProvider,
  clearDatabase,
};

export default database;
