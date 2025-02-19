import Anthropic from '@anthropic-ai/sdk';
import { GenerateAltTextRequest, GenerateAltTextResponse } from './types';

/**
 * Interface for image metadata
 */
interface ImageData {
  base64: string;
  mimeType: string;
}

/**
 * Fetches an image from a URL and converts it to base64, detecting the mime type
 */
async function imageUrlToBase64(url: string): Promise<ImageData> {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');
  
  // Ensure we have a valid image type
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('Invalid image type: ' + contentType);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  return {
    base64,
    mimeType: contentType
  };
}

/**
 * Cleans the AI-generated alt text by removing prefixes and extra whitespace
 * @param text The raw alt text from the AI
 * @returns Cleaned alt text
 */
function cleanAltText(text: string): string {
  // Remove "Alt text:" or "Alt Text:" prefix if present
  const cleanedText = text.replace(/^(?:Alt text:|Alt Text:)\s*/i, '');
  // Trim whitespace and ensure proper punctuation
  return cleanedText.trim();
}

export async function generateAltTextWithAnthropic(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  const anthropic = new Anthropic({
    apiKey: request.apiKey,
  });

  try {
    // Convert image URL to base64 and get mime type
    const { base64, mimeType } = await imageUrlToBase64(request.imageUrl);
    
    // Validate mime type is supported by Anthropic
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
    if (!supportedMimeTypes.includes(mimeType as typeof supportedMimeTypes[number])) {
      throw new Error(`Unsupported image type: ${mimeType}. Must be one of: ${supportedMimeTypes.join(', ')}`);
    }
    
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
                type: "base64",
                media_type: mimeType as typeof supportedMimeTypes[number],
                data: base64
              }
            }
          ]
        }
      ]
    });

    // Extract text from the response content
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response format from Anthropic');
    }

    return {
      altText: cleanAltText(content.text),
      provider: 'anthropic'
    };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new Error('Failed to generate alt text with Anthropic');
  }
}
