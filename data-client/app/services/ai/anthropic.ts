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
 * Creates a prompt for alt text generation that includes site context for SEO
 * @param request The alt text generation request with optional site context
 * @returns A prompt string with SEO context
 */
function createSeoPrompt(request: GenerateAltTextRequest): string {
  let prompt = "Generate a concise, descriptive alt text for this image. Focus on the main subject and important details. Keep it under 125 characters.";
  
  // Add SEO context if available
  if (request.siteContext) {
    const { siteName, keywords, description } = request.siteContext;
    
    prompt += "\n\nThis image is for a website called " + siteName;
    
    if (description) {
      prompt += ". The site is about: " + description;
    }
    
    if (keywords && keywords.length > 0) {
      prompt += "\n\nWhere appropriate, try to naturally incorporate one or more of these keywords: " + 
        keywords.slice(0, 5).join(", ") + 
        ". Only use keywords that are genuinely relevant to the image content.";
    }
    
    prompt += "\n\nThe alt text should be SEO-friendly but still accurately describe the image. Don't force keywords if they don't fit naturally.";
  }
  
  return prompt;
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
    
    // Create a prompt that includes SEO context if available
    const prompt = createSeoPrompt(request);
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64
              }
            }
          ]
        }
      ]
    });

    const altText = response.content[0]?.type === 'text' ? response.content[0].text : 'No description generated';

    return {
      altText: cleanAltText(altText),
      provider: 'anthropic'
    };
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new Error('Failed to generate alt text with Anthropic');
  }
}
