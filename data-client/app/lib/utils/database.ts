import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Database as SQLiteDatabase } from "sqlite";
import { mkdir } from "fs/promises";

/**
 * Database Utility
 * ---------------
 * This module provides functions to interact with a SQLite database.
 * It ensures a single connection to the database and manages tables for:
 * - Site authorizations
 * - User authorizations
 * - API keys
 */

/**
 * Gets or initializes the SQLite database connection.
 * Implements a singleton pattern to ensure only one database connection exists.
 *
 * The function:
 * 1. Creates the database directory if it doesn't exist
 * 2. Establishes a connection to the SQLite database
 * 3. Initializes required tables:
 *    - SiteAuthorizations: Stores site ID and access token pairs
 *    - UserAuthorizations: Maps user IDs to their access tokens
 *    - ApiKeys: Stores encrypted API keys for each provider
 *    - SelectedProviders: Tracks the selected AI provider for each user/site
 *
 * @returns Promise<SQLiteDatabase> The database connection instance
 * @throws Error if database initialization fails
 */

// Singleton pattern to maintain one database connection
let db: SQLiteDatabase | null = null;

async function getDb() {
  // If a database doesn't exist, create one
  if (!db) {
    const dbPath = "./db/database.db";
    const dbDir = "./db";

    try {
      // Ensure the directory exists
      await mkdir(dbDir, { recursive: true });

      // Open SQLite database connection with specified file path and driver
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Create tables for SiteAuthorizations and UserAuthorizations if they don't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS siteAuthorizations (
          siteId TEXT PRIMARY KEY,
          accessToken TEXT
        );
        
        CREATE TABLE IF NOT EXISTS userAuthorizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          accessToken TEXT
        );

        DROP TABLE IF EXISTS apiKeys;
        CREATE TABLE apiKeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          siteId TEXT,
          provider TEXT,
          encryptedKey TEXT,
          createdAt INTEGER,
          UNIQUE(userId, siteId, provider)
        );

        DROP TABLE IF EXISTS selectedProviders;
        CREATE TABLE selectedProviders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT,
          siteId TEXT,
          provider TEXT,
          UNIQUE(userId, siteId)
        );
      `);
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  return db;
}

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
) {
  const db = await getDb();
  await db.run(
    "REPLACE INTO siteAuthorizations (siteId, accessToken) VALUES (?, ?)",
    [siteId, accessToken]
  );
  console.log("Site authorization pairing updated.");
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
) {
  const db = await getDb();
  await db.run(
    "REPLACE INTO userAuthorizations (userId, accessToken) VALUES (?, ?)",
    [userId, accessToken]
  );
  console.log("User access token pairing updated.");
}

/**
 * Retrieves the access token for a given site ID.
 *
 * @param {string} siteId - The unique identifier for the Webflow site
 * @returns {Promise<string>} The access token for the site
 * @throws Error if no access token is found or the site does not exist
 */
export async function getAccessTokenFromSiteId(
  siteId: string
): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    "SELECT accessToken FROM siteAuthorizations WHERE siteId = ?",
    [siteId]
  );

  if (!row?.accessToken) {
    throw new Error("No access token found or site does not exist");
  }

  return row.accessToken;
}

/**
 * Retrieves the access token for a given user ID.
 *
 * @param {string} userId - The unique identifier for the Webflow user
 * @returns {Promise<string>} The access token for the user
 * @throws Error if no access token is found or the user does not exist
 */
export async function getAccessTokenFromUserId(
  userId: string
): Promise<string> {
  const db = await getDb();
  const row = await db.get(
    "SELECT accessToken FROM userAuthorizations WHERE userId = ?",
    [userId]
  );

  if (!row?.accessToken) {
    throw new Error("No access token found or user does not exist");
  }

  return row.accessToken;
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
  const db = await getDb();
  await db.run(
    `REPLACE INTO apiKeys (userId, siteId, provider, encryptedKey, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, siteId, provider, encryptedKey, Date.now()]
  );

  // Update selected provider
  await db.run(
    `REPLACE INTO selectedProviders (userId, siteId, provider)
     VALUES (?, ?, ?)`,
    [userId, siteId, provider]
  );
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
  const db = await getDb();
  const row = await db.get(
    "SELECT encryptedKey FROM apiKeys WHERE userId = ? AND siteId = ? AND provider = ?",
    [userId, siteId, provider]
  );
  return row?.encryptedKey || null;
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
  const db = await getDb();
  const row = await db.get(
    "SELECT provider FROM selectedProviders WHERE userId = ? AND siteId = ?",
    [userId, siteId]
  );
  return row?.provider || null;
}

/**
 * Clears all data from the database.
 *
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  const db = await getDb();
  await db.run("DELETE FROM siteAuthorizations");
  await db.run("DELETE FROM userAuthorizations");
  await db.run("DELETE FROM apiKeys");
  await db.run("DELETE FROM selectedProviders");
  console.log("Database cleared successfully");
}

const database = {
  getAccessTokenFromSiteId,
  getAccessTokenFromUserId,
  insertSiteAuthorization,
  insertUserAuthorization,
  saveApiKey,
  getApiKey,
  getSelectedProvider,
  clearDatabase,
};

export default database;
