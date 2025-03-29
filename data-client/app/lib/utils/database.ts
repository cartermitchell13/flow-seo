import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Database as SQLiteDatabase } from "sqlite";
import { mkdir } from "fs/promises";
import pg from 'pg';

/**
 * Database Utility
 * ---------------
 * This module provides functions to interact with a database.
 * It supports both SQLite (for local development) and PostgreSQL/Neon (for production).
 * It ensures a single connection to the database and manages tables for:
 * - Site authorizations
 * - User authorizations
 * - API keys
 */

// Interface for database operations to support both SQLite and PostgreSQL
interface DatabaseConnection {
  exec(sql: string): Promise<void>;
  get<T>(sql: string, ...params: any[]): Promise<T | undefined>;
  all<T>(sql: string, ...params: any[]): Promise<T[]>;
  run(sql: string, ...params: any[]): Promise<any>;
}

// Singleton pattern to maintain one database connection
let dbConnection: DatabaseConnection | null = null;

/**
 * Gets or initializes the database connection.
 * Implements a singleton pattern to ensure only one database connection exists.
 * Uses SQLite for development and PostgreSQL for production.
 *
 * @returns Promise<DatabaseConnection> The database connection instance
 * @throws Error if database initialization fails
 */
async function getDb(): Promise<DatabaseConnection> {
  // If a database connection doesn't exist, create one
  if (!dbConnection) {
    // Check if we're in production or development
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Use PostgreSQL (Neon) in production
      try {
        const neonConnectionString = process.env.DATABASE_URL;
        
        if (!neonConnectionString) {
          throw new Error('DATABASE_URL environment variable is required in production');
        }
        
        // Create PostgreSQL client
        const pgClient = new pg.Client({
          connectionString: neonConnectionString,
          ssl: {
            rejectUnauthorized: false // Required for Neon
          }
        });
        
        await pgClient.connect();
        
        // Create tables if they don't exist
        await pgClient.query(`
          CREATE TABLE IF NOT EXISTS siteAuthorizations (
            siteId TEXT PRIMARY KEY,
            accessToken TEXT
          );
          
          CREATE TABLE IF NOT EXISTS userAuthorizations (
            id SERIAL PRIMARY KEY,
            userId TEXT,
            accessToken TEXT
          );

          CREATE TABLE IF NOT EXISTS apiKeys (
            id SERIAL PRIMARY KEY,
            userId TEXT,
            siteId TEXT,
            provider TEXT,
            encryptedKey TEXT,
            createdAt BIGINT,
            UNIQUE(userId, siteId, provider)
          );

          CREATE TABLE IF NOT EXISTS selectedProviders (
            id SERIAL PRIMARY KEY,
            userId TEXT,
            siteId TEXT,
            provider TEXT,
            UNIQUE(userId, siteId)
          );
        `);
        
        // Create a wrapper for PostgreSQL client to match our interface
        dbConnection = {
          exec: async (sql: string) => {
            await pgClient.query(sql);
          },
          get: async <T>(sql: string, ...params: any[]): Promise<T | undefined> => {
            const result = await pgClient.query(sql, params);
            return result.rows[0] as T | undefined;
          },
          all: async <T>(sql: string, ...params: any[]): Promise<T[]> => {
            const result = await pgClient.query(sql, params);
            return result.rows as T[];
          },
          run: async (sql: string, ...params: any[]): Promise<any> => {
            return await pgClient.query(sql, params);
          }
        };
        
        console.log('Connected to PostgreSQL (Neon) database');
      } catch (error) {
        console.error("Error initializing PostgreSQL database:", error);
        throw error;
      }
    } else {
      // Use SQLite in development
      try {
        const dbPath = "./db/database.db";
        const dbDir = "./db";

        // Ensure the directory exists
        await mkdir(dbDir, { recursive: true });

        // Open SQLite database connection with specified file path and driver
        const sqliteDb = await open({
          filename: dbPath,
          driver: sqlite3.Database,
        });

        // Create tables for SiteAuthorizations and UserAuthorizations if they don't exist
        await sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS siteAuthorizations (
            siteId TEXT PRIMARY KEY,
            accessToken TEXT
          );
          
          CREATE TABLE IF NOT EXISTS userAuthorizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            accessToken TEXT
          );

          CREATE TABLE IF NOT EXISTS apiKeys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            siteId TEXT,
            provider TEXT,
            encryptedKey TEXT,
            createdAt INTEGER,
            UNIQUE(userId, siteId, provider)
          );

          CREATE TABLE IF NOT EXISTS selectedProviders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            siteId TEXT,
            provider TEXT,
            UNIQUE(userId, siteId)
          );
        `);
        
        // Use SQLite directly as it already matches our interface
        dbConnection = sqliteDb;
        console.log('Connected to SQLite database');
      } catch (error) {
        console.error("Error initializing SQLite database:", error);
        throw error;
      }
    }
  }
  
  return dbConnection;
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
  
  // Define the type for the row
  interface SiteAuthRow {
    accessToken: string;
  }
  
  const row = await db.get<SiteAuthRow>(
    `SELECT accessToken FROM siteAuthorizations WHERE siteId = ?`,
    siteId
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
  
  // Define the type for the row
  interface UserAuthRow {
    accessToken: string;
  }
  
  const row = await db.get<UserAuthRow>(
    `SELECT accessToken FROM userAuthorizations WHERE userId = ?`,
    userId
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
  const db = await getDb();
  
  // Delete the API key
  await db.run(
    `DELETE FROM apiKeys 
     WHERE userId = ? AND siteId = ? AND provider = ?`,
    [userId, siteId, provider]
  );

  // Also remove from selected providers if it was selected
  await db.run(
    `DELETE FROM selectedProviders 
     WHERE userId = ? AND siteId = ? AND provider = ?`,
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
  
  // Define the type for the row
  interface ApiKeyRow {
    encryptedKey: string;
  }
  
  const row = await db.get<ApiKeyRow>(
    `SELECT encryptedKey FROM apiKeys 
     WHERE userId = ? AND siteId = ? AND provider = ?`,
    userId,
    siteId,
    provider
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
  
  // Define the type for the row
  interface ProviderRow {
    provider: string;
  }
  
  const row = await db.get<ProviderRow>(
    `SELECT provider FROM selectedProviders 
     WHERE userId = ? AND siteId = ?`,
    userId,
    siteId
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
  deleteApiKey,
  clearDatabase,
};

export default database;
