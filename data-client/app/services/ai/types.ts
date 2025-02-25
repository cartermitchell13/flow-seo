export type AiProvider = 'openai' | 'anthropic';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
}

export interface SiteContext {
  siteName: string;
  domain: string;
  keywords: string[];
  description: string;
}

export interface GenerateAltTextRequest {
  imageUrl: string;
  provider: AiProvider;
  apiKey: string;
  siteContext?: SiteContext; // Optional site context for SEO optimization
}

export interface GenerateAltTextResponse {
  altText: string;
  provider: AiProvider;
}
