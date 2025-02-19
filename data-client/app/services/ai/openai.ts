import OpenAI from 'openai';
import { GenerateAltTextRequest, GenerateAltTextResponse } from './types';

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

/**
 * Converts an image URL to base64
 * @param imageUrl URL of the image
 * @returns Base64 encoded image with MIME type
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Detect MIME type from the response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Convert to base64 and prepend with data URL format
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image URL');
  }
}

export async function generateAltTextWithOpenAI(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  try {
    // Validate API key format
    if (!request.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    // Convert image URL to base64
    const base64Image = await imageUrlToBase64(request.imageUrl);

    const openai = new OpenAI({
      apiKey: request.apiKey,
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Generate an SEO-optimized alt text for this image. Include relevant keywords naturally, focus on the main subject and important details, and ensure it's descriptive for both users and search engines. Keep it under 125 characters and make it specific yet concise." 
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              },
            ],
          },
        ],
        max_tokens: 100,
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No response content from OpenAI');
      }

      const altText = response.choices[0].message.content;

      return {
        altText: cleanAltText(altText),
        provider: 'openai'
      };
    } catch (error) {
      // Type guard for OpenAI API errors
      if (error && typeof error === 'object' && 'status' in error) {
        // Handle specific OpenAI API errors
        if (error.status === 401) {
          throw new Error('Invalid or expired OpenAI API key');
        } else if (error.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        } else if (error.status === 500) {
          throw new Error('OpenAI service error. Please try again later');
        }
        
        console.error('OpenAI API Error:', {
          status: error.status,
          message: (error as { message?: string }).message,
          type: (error as { type?: string }).type
        });
      }
      
      console.error('OpenAI API Error:', error);
      if (error instanceof Error) {
        throw new Error(`OpenAI Error: ${error.message}`);
      } else {
        throw new Error('Unknown OpenAI Error');
      }
    }
  } catch (error) {
    console.error('OpenAI Generation Error:', error);
    if (error instanceof Error) {
      throw error; // Preserve the specific error message
    } else {
      throw new Error('Unknown OpenAI Generation Error');
    }
  }
}
