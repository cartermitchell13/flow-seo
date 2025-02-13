import { NextResponse } from 'next/server';
import { generateAltText } from '../../../services/ai';
import { GenerateAltTextRequest } from '../../../services/ai/types';

export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateAltTextRequest;

    if (!body.imageUrl || !body.provider || !body.apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await generateAltText(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Alt text generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate alt text' },
      { status: 500 }
    );
  }
}
