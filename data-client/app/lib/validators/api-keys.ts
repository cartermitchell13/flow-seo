/**
 * Types for API key validation
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cohere';

interface ProviderKeyFormat {
  prefix: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

/**
 * API key format specifications for different providers
 */
const KEY_FORMATS: Record<AIProvider, ProviderKeyFormat> = {
  openai: {
    prefix: 'sk-',
    pattern: /^sk-[a-zA-Z0-9]{48}$/,
    minLength: 51,
    maxLength: 51
  },
  anthropic: {
    prefix: 'sk-ant-api03-',
    pattern: /^sk-ant-api03-[a-zA-Z0-9_-]{94}$/,
    minLength: 108,
    maxLength: 108
  },
  google: {
    prefix: 'AIza',
    pattern: /^AIza[a-zA-Z0-9_-]{35}$/,
    minLength: 39,
    maxLength: 39
  },
  cohere: {
    prefix: 'co-',
    pattern: /^co-[a-zA-Z0-9]{36}$/,
    minLength: 40,
    maxLength: 40
  }
};

/**
 * Error class for API key validation failures
 */
export class APIKeyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIKeyValidationError';
  }
}

/**
 * Validates an API key for a specific provider
 * @param provider - The AI provider
 * @param apiKey - The API key to validate
 * @throws {APIKeyValidationError} If validation fails
 */
export function validateApiKey(provider: AIProvider, apiKey: string): void {
  // Basic validation
  if (!apiKey) {
    throw new APIKeyValidationError('API key is required');
  }

  const format = KEY_FORMATS[provider];
  if (!format) {
    throw new APIKeyValidationError(`Unsupported provider: ${provider}`);
  }

  // Length check
  if (format.minLength && apiKey.length < format.minLength) {
    throw new APIKeyValidationError(
      `API key too short. Expected at least ${format.minLength} characters for ${provider}`
    );
  }
  if (format.maxLength && apiKey.length > format.maxLength) {
    throw new APIKeyValidationError(
      `API key too long. Expected at most ${format.maxLength} characters for ${provider}`
    );
  }

  // Prefix check
  if (!apiKey.startsWith(format.prefix)) {
    throw new APIKeyValidationError(
      `Invalid API key format. ${provider} API keys should start with "${format.prefix}"`
    );
  }

  // Pattern check
  if (format.pattern && !format.pattern.test(apiKey)) {
    throw new APIKeyValidationError(
      `Invalid API key format for ${provider}. Please check your API key.`
    );
  }
}

/**
 * Sanitizes an API key for logging (shows only first and last 4 characters)
 * @param apiKey - The API key to sanitize
 */
export function sanitizeApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '****';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
