import { neon } from '@neondatabase/serverless';
import { AuthResponse, SiteAuthorization, UserAuthorization } from './database-types';

/**
 * Database Utility for Neon PostgreSQL
 * ----------------------------------
 * This module provides functions to interact with a Neon PostgreSQL database.
 * It manages tables for:
 * - Site authorizations
 * - User authorizations
 * - API keys
 * - Selected providers
 */

// Get the database URL from environment variables
const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING!;

// Create the neon SQL instance
const sql = neon(DATABASE_URL);

/**
 * Initializes the database by creating necessary tables if they don't exist.
 * @returns Promise<void>
 */
export async function initializeDatabase() {
  try {
    console.log("Creating database tables if they don't exist");
    // Create tables for site and user authorizations
    await sql`
      CREATE TABLE IF NOT EXISTS site_authorizations (
        site_id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_authorizations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        access_token TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        encrypted_key TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, site_id, provider)
      );

      CREATE TABLE IF NOT EXISTS selected_providers (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, site_id)
      );
    `;
    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

/**
 * Inserts a new site authorization into the database.
 * @param {string} siteId - The unique identifier for the Webflow site
 * @param {string} accessToken - The OAuth access token for the site
 */
export async function insertSiteAuthorization(siteId: string, accessToken: string) {
  await sql`
    INSERT INTO site_authorizations (site_id, access_token)
    VALUES (${siteId}, ${accessToken})
    ON CONFLICT (site_id) DO UPDATE SET access_token = ${accessToken}
  `;
}

/**
 * Inserts a new user authorization into the database.
 * @param {string} userId - The unique identifier for the Webflow user
 * @param {string} accessToken - The OAuth access token for the user
 */
export async function insertUserAuthorization(userId: string, accessToken: string) {
  await sql`
    INSERT INTO user_authorizations (user_id, access_token)
    VALUES (${userId}, ${accessToken})
  `;
}

/**
 * Retrieves the access token for a given site ID.
 * @param {string} siteId - The unique identifier for the Webflow site
 * @returns {Promise<string>} The access token for the site
 */
export async function getAccessTokenFromSiteId(siteId: string): Promise<string> {
  const result = await sql`
    SELECT access_token FROM site_authorizations WHERE site_id = ${siteId}
  `;
  
  if (result.length === 0) {
    throw new Error(`No access token found for site ID: ${siteId}`);
  }
  
  return result[0].access_token;
}

/**
 * Retrieves the access token for a given user ID.
 * @param {string} userId - The unique identifier for the Webflow user
 * @returns {Promise<string>} The access token for the user
 */
export async function getAccessTokenFromUserId(userId: string): Promise<string> {
  const result = await sql`
    SELECT access_token FROM user_authorizations 
    WHERE user_id = ${userId} 
    ORDER BY id DESC LIMIT 1
  `;
  
  if (result.length === 0) {
    throw new Error(`No access token found for user ID: ${userId}`);
  }
  
  return result[0].access_token;
}

/**
 * Saves an encrypted API key for a specific provider.
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @param {string} provider - The AI provider
 * @param {string} encryptedKey - The encrypted API key
 */
export async function saveApiKey(
  userId: string,
  siteId: string,
  provider: string,
  encryptedKey: string
) {
  await sql`
    INSERT INTO api_keys (user_id, site_id, provider, encrypted_key)
    VALUES (${userId}, ${siteId}, ${provider}, ${encryptedKey})
    ON CONFLICT (user_id, site_id, provider) 
    DO UPDATE SET encrypted_key = ${encryptedKey}
  `;
}

/**
 * Deletes an API key for a specific provider.
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @param {string} provider - The AI provider
 */
export async function deleteApiKey(
  userId: string,
  siteId: string,
  provider: string
) {
  await sql`
    DELETE FROM api_keys 
    WHERE user_id = ${userId} 
    AND site_id = ${siteId} 
    AND provider = ${provider}
  `;
}

/**
 * Gets the encrypted API key for a specific provider.
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
    SELECT encrypted_key 
    FROM api_keys 
    WHERE user_id = ${userId} 
    AND site_id = ${siteId} 
    AND provider = ${provider}
  `;
  
  return result.length > 0 ? result[0].encrypted_key : null;
}

/**
 * Gets the selected AI provider for a user.
 * @param {string} userId - The user's ID
 * @param {string} siteId - The site's ID
 * @returns {Promise<string | null>} The selected provider if found
 */
export async function getSelectedProvider(
  userId: string,
  siteId: string
): Promise<string | null> {
  const result = await sql`
    SELECT provider 
    FROM selected_providers 
    WHERE user_id = ${userId} 
    AND site_id = ${siteId}
  `;
  
  return result.length > 0 ? result[0].provider : null;
}

/**
 * Gets the current authentication data
 * @returns Promise<AuthResponse | null>
 */
async function getAuth(): Promise<AuthResponse | null> {
  try {
    const sitesResult = await sql`
      SELECT site_id, access_token FROM site_authorizations
    `;
    
    const usersResult = await sql`
      SELECT user_id, access_token FROM user_authorizations
    `;

    if (sitesResult.length === 0 && usersResult.length === 0) {
      return null;
    }

    // Transform the results to match our types
    const sites: SiteAuthorization[] = sitesResult.map(row => ({
      site_id: row.site_id,
      access_token: row.access_token
    }));

    const users: UserAuthorization[] = usersResult.map(row => ({
      user_id: row.user_id,
      access_token: row.access_token
    }));

    return {
      sites,
      users,
    };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
}

/**
 * Clears all tables in the database (Development only)
 * @returns Promise<void>
 */
async function clearDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('clearDatabase can only be called in development environment');
  }
  
  await sql`
    TRUNCATE TABLE site_authorizations CASCADE;
    TRUNCATE TABLE user_authorizations CASCADE;
    TRUNCATE TABLE api_keys CASCADE;
    TRUNCATE TABLE selected_providers CASCADE;
  `;
}

// Initialize database when module is imported
initializeDatabase().catch(console.error);

// Create database interface object
const database = {
  initializeDatabase,
  insertSiteAuthorization,
  insertUserAuthorization,
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  saveApiKey,
  deleteApiKey,
  getApiKey,
  getSelectedProvider,
  getAuth,
  clearDatabase,
};

export default database;
