// Script to generate a secure random string for OAUTH_STATE
const crypto = require('crypto');

// Generate a 32-byte random string and encode it in base64
const state = crypto.randomBytes(32).toString('base64');

console.log('Generated OAUTH_STATE:');
console.log(state);
