import React, { useState, useEffect } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';

/**
 * API Key Manager Component
 * ------------------------
 * Provides a user interface for:
 * - Selecting an AI provider
 * - Managing API keys for each provider
 * - Displaying validation and error states
 */

interface Props {
  onProviderChange?: (provider: string) => void;
}

export function ApiKeyManager({ onProviderChange }: Props) {
  // States
  const [apiKey, setApiKey] = useState('');
  const {
    selectedProvider,
    isLoading,
    error,
    saveApiKey,
    getApiKey,
    setSelectedProvider,
  } = useApiKeys();

  // Available providers
  const providers = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'deepseek', name: 'Deepseek' },
  ];

  // Load existing API key when provider changes
  useEffect(() => {
    if (selectedProvider) {
      loadApiKey(selectedProvider);
      onProviderChange?.(selectedProvider);
    }
  }, [selectedProvider]);

  /**
   * Load the API key for the selected provider
   */
  const loadApiKey = async (provider: string) => {
    try {
      const key = await getApiKey(provider);
      setApiKey(key || '');
    } catch (err) {
      console.error('Error loading API key:', err);
    }
  };

  /**
   * Handle provider selection
   */
  const handleProviderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = event.target.value;
    setSelectedProvider(provider);
  };

  /**
   * Handle API key submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProvider || !apiKey) return;

    try {
      await saveApiKey(selectedProvider, apiKey);
      // Show success message or notification
    } catch (err) {
      // Error is handled by the hook
      console.error('Error saving API key:', err);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">API Key Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label htmlFor="provider" className="block text-sm font-medium mb-1">
            AI Provider
          </label>
          <select
            id="provider"
            value={selectedProvider || ''}
            onChange={handleProviderChange}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          >
            <option value="">Select a provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your API key"
            disabled={isLoading || !selectedProvider}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedProvider || !apiKey}
          className={`w-full p-2 rounded text-white ${
            isLoading
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </button>
      </form>
    </div>
  );
}
