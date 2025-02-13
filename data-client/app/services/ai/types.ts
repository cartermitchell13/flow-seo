export type AiProvider = 'openai' | 'anthropic';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
}

export interface GenerateAltTextRequest {
  imageUrl: string;
  provider: AiProvider;
  apiKey: string;
}

export interface GenerateAltTextResponse {
  altText: string;
  provider: AiProvider;
}
