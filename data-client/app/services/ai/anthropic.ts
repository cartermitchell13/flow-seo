import Anthropic from '@anthropic-ai/sdk';
import { GenerateAltTextRequest, GenerateAltTextResponse } from './types';

export async function generateAltTextWithAnthropic(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  const anthropic = new Anthropic({
    apiKey: request.apiKey,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Generate a concise, descriptive alt text for this image. Focus on the main subject and important details. Keep it under 125 characters."
            },
            {
              type: "image",
              source: {
                type: "url",
                url: request.imageUrl
              }
            }
          ]
        }
      ]
    });

    const altText = response.content[0]?.text || 'No description generated';

    return {
      altText,
      provider: 'anthropic'
    };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new Error('Failed to generate alt text with Anthropic');
  }
}
