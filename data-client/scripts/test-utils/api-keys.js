const database = require('./database');
const { encrypt, decrypt } = require('./encryption');

const apiKeysController = {
  async saveApiKey(userId, siteId, provider, apiKey) {
    try {
      console.log('Attempting to save API key:', {
        userId,
        siteId,
        provider,
        keyLength: apiKey.length,
        keyPrefix: apiKey.slice(0, 10) + '...'
      });
      
      const encryptedKey = encrypt(apiKey);
      await database.saveApiKey(userId, siteId, provider, encryptedKey);
      console.log('Encrypted API key stored in database for:', { userId, siteId, provider });
      
      return { success: true };
    } catch (error) {
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

  async getSelectedProvider(userId, siteId) {
    try {
      return await database.getSelectedProvider(userId, siteId);
    } catch (error) {
      console.error('Error in getSelectedProvider:', { error, userId, siteId });
      return null;
    }
  },

  async getApiKey(userId, siteId, provider) {
    try {
      const encryptedKey = await database.getApiKey(userId, siteId, provider);
      
      if (!encryptedKey) {
        return null;
      }
      
      return decrypt(encryptedKey);
    } catch (error) {
      console.error('Error in getApiKey:', { error, userId, siteId, provider });
      return null;
    }
  }
};

module.exports = { apiKeysController };
