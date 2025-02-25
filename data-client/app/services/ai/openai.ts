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

export async function generateAltTextWithOpenAI(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  const openai = new OpenAI({
    apiKey: request.apiKey,
  });

  try {
    // Create a prompt that includes SEO context if available
    const prompt = createSeoPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: request.imageUrl
              }
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const altText = response.choices[0]?.message?.content || 'No description generated';

    return {
      altText: cleanAltText(altText),
      provider: 'openai'
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate alt text with OpenAI');
  }
}
