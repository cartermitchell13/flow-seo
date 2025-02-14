import { useState, useCallback } from 'react';

/**
 * Hook for managing API keys in the frontend
 * ----------------------------------------
 * Provides functionality to:
 * - Save API keys for different providers
 * - Retrieve API keys
 * - Get/set the selected provider
 * - Handle loading and error states
 */

// Base URL for API endpoints - now using proxy
const API_BASE_URL = '/api';

// Common headers for API requests
const getHeaders = () => {
  // Get the token from localStorage
  const token = localStorage.getItem('webflow_token');
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

interface UseApiKeysReturn {
  // State
  selectedProvider: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  saveApiKey: (provider: string, apiKey: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string | null>;
  setSelectedProvider: (provider: string) => void;
}

export function useApiKeys(): UseApiKeysReturn {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save an API key for a provider
   */
  const saveApiKey = useCallback(async (provider: string, apiKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api-keys`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ provider, apiKey }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save API key');
      }

      // Update selected provider after successful save
      setSelectedProvider(provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save API key';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get an API key for a provider
   */
  const getApiKey = useCallback(async (provider: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api-keys?provider=${encodeURIComponent(provider)}`,
        {
          headers: getHeaders(),
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to retrieve API key');
      }

      const data = await response.json();
      return data.apiKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve API key';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load the selected provider on mount
   */
  const loadSelectedProvider = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-keys`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to load selected provider');
      }
      const data = await response.json();
      setSelectedProvider(data.provider);
    } catch (err) {
      console.error('Error loading selected provider:', err);
    }
  }, []);

  // Load selected provider when the hook is first used
  useState(() => {
    loadSelectedProvider();
  });

  return {
    selectedProvider,
    isLoading,
    error,
    saveApiKey,
    getApiKey,
    setSelectedProvider,
  };
}
