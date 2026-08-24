import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth } from '@/lib/server/auth';
import { researchIdea } from '@/lib/server/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = (await req.json()) as { content?: string };
    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const research = await researchIdea(content);
    return NextResponse.json({ research });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error researching idea:', error);
    return NextResponse.json({ error: 'Failed to research idea' }, { status: 500 });
  }
}
