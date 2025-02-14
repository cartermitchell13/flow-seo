const crypto = require('crypto');

// Generate a secure random key for AES-256
const key = crypto.randomBytes(32).toString('base64');
console.log('Generated ENCRYPTION_KEY:', key);
