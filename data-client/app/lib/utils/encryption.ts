import crypto from 'crypto';

/**
 * Encryption Utility
 * -----------------
 * Provides functions for encrypting and decrypting sensitive data using AES-256-GCM.
 * Uses a secure encryption key derived from the environment variable.
 * 
 * Security features:
 * - AES-256-GCM encryption (NIST recommended)
 * - Unique IV (Initialization Vector) for each encryption
 * - Authentication tag to verify data integrity
 * - Key derivation using PBKDF2
 */

// Constants for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from the master key using PBKDF2
 * @param salt - Salt for key derivation
 * @returns Derived key
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted data in format: salt:iv:authTag:encryptedData (base64)
 */
export function encrypt(text: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key using PBKDF2
  const key = deriveKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the text
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine all components and convert to base64
  return Buffer.concat([
    salt,
    iv,
    authTag,
    encrypted
  ]).toString('base64');
}

/**
 * Decrypts data that was encrypted using the encrypt function
 * @param encryptedData - Encrypted data in format: salt:iv:authTag:encryptedData (base64)
 * @returns Decrypted text
 */
export function decrypt(encryptedData: string): string {
  // Convert from base64 and extract components
  const buffer = Buffer.from(encryptedData, 'base64');
  
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  // Derive key using PBKDF2
  const key = deriveKey(salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt the data
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');
}

/**
 * Generates a secure random encryption key suitable for AES-256
 * Use this to generate the ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
