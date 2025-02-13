import OpenAI from 'openai';
import { GenerateAltTextRequest, GenerateAltTextResponse } from './types';

export async function generateAltTextWithOpenAI(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  const openai = new OpenAI({
    apiKey: request.apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Generate a concise, descriptive alt text for this image. Focus on the main subject and important details. Keep it under 125 characters." 
            },
            {
              type: "image_url",
              image_url: request.imageUrl,
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const altText = response.choices[0]?.message?.content || 'No description generated';

    return {
      altText,
      provider: 'openai'
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate alt text with OpenAI');
  }
}
