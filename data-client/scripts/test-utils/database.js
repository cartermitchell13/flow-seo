const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { mkdir } = require('fs/promises');

let db = null;

async function getDb() {
  if (!db) {
    const dbPath = "./db/test.db";
    const dbDir = "./db";

    try {
      await mkdir(dbDir, { recursive: true });

      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS APIKeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          siteId TEXT NOT NULL,
          provider TEXT NOT NULL,
          apiKey TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(userId, siteId, provider)
        );
      `);

      return db;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  return db;
}

async function saveApiKey(userId, siteId, provider, apiKey) {
  const db = await getDb();
  await db.run(
    `INSERT OR REPLACE INTO APIKeys (userId, siteId, provider, apiKey)
     VALUES (?, ?, ?, ?)`,
    [userId, siteId, provider, apiKey]
  );
}

async function getApiKey(userId, siteId, provider) {
  const db = await getDb();
  const result = await db.get(
    `SELECT apiKey FROM APIKeys
     WHERE userId = ? AND siteId = ? AND provider = ?`,
    [userId, siteId, provider]
  );
  return result ? result.apiKey : null;
}

async function getSelectedProvider(userId, siteId) {
  const db = await getDb();
  const result = await db.get(
    `SELECT provider FROM APIKeys
     WHERE userId = ? AND siteId = ?
     ORDER BY createdAt DESC LIMIT 1`,
    [userId, siteId]
  );
  return result ? result.provider : null;
}

module.exports = {
  saveApiKey,
  getApiKey,
  getSelectedProvider
};
