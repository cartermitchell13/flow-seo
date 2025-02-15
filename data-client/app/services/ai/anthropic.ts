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

  // Add proper base64 prefix
  const prefix = `data:${contentType};base64,`;
  
  return {
    base64,
    mimeType: contentType
  };
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
                media_type: mimeType,
                data: base64
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
