const crypto = require('crypto');

/**
 * Script to generate a secure encryption key for the application
 * Run this script to generate a new encryption key that can be added to your .env file
 */

// Constants
const KEY_LENGTH = 32;

// Generate a secure random encryption key
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

const key = generateEncryptionKey();
console.log('\nGenerated Encryption Key:');
console.log('------------------------');
console.log(key);
console.log('\nAdd this to your .env file as:');
console.log('ENCRYPTION_KEY=' + key);
console.log();
