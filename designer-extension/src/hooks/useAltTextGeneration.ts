import { useState } from 'react';
import { useAuth } from './useAuth';

interface GenerateAltTextOptions {
  imageUrl: string;
  provider: 'openai' | 'anthropic';
}

interface UseAltTextGenerationReturn {
  generateAltText: (options: GenerateAltTextOptions) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
}

/**
 * Hook for generating alt text using AI providers
 * Handles API communication and error states
 */
export function useAltTextGeneration(): UseAltTextGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: authState } = useAuth();

  const generateAltText = async ({ imageUrl, provider }: GenerateAltTextOptions): Promise<string> => {
    if (!authState?.sessionToken) {
      throw new Error('Not authenticated');
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/generate-alt-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.sessionToken}`,
        },
        body: JSON.stringify({ imageUrl, provider }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate alt text');
      }

      const data = await response.json();
      return data.altText;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAltText,
    isGenerating,
    error,
  };
}
