import { generateAltTextWithOpenAI } from './openai';
import { generateAltTextWithAnthropic } from './anthropic';
import { GenerateAltTextRequest, GenerateAltTextResponse, AiProvider } from './types';

export async function generateAltText(
  request: GenerateAltTextRequest
): Promise<GenerateAltTextResponse> {
  switch (request.provider) {
    case 'openai':
      return generateAltTextWithOpenAI(request);
    case 'anthropic':
      return generateAltTextWithAnthropic(request);
    default:
      throw new Error(`Unsupported AI provider: ${request.provider}`);
  }
}
