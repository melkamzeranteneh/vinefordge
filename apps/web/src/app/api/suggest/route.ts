import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth, requireBoardAccess } from '@/lib/server/auth';
import { suggestForBoard, type BoardContextNode } from '@/lib/server/ai';
import { getSnapshot } from '@/lib/server/yjs';
import type { SuggestionCard } from '@/types/board';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'viewer');

    const snapshot = await getSnapshot(params.boardId);
    const nodes = (snapshot.nodes ?? [])
      .filter(
        (n): n is { id: string; data: { title?: unknown; content?: unknown } } =>
          !!n && typeof n === 'object' && 'id' in n
      )
      .map((n) => ({
        id: String(n.id),
        title: typeof n.data?.title === 'string' ? n.data.title : '',
        content: typeof n.data?.content === 'string' ? n.data.content : '',
      }))
      .filter((n): n is BoardContextNode => n.title !== '' || n.content !== '');

    const suggestions: SuggestionCard[] = await suggestForBoard(nodes);
    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
