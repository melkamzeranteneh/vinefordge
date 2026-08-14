import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth, requireBoardAccess } from '@/lib/server/auth';
import { forgeFromNode } from '@/lib/server/forge';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = (await req.json()) as {
      nodeId?: string;
      content?: string;
      boardId?: string;
      parentPosition?: { x: number; y: number };
    };

    if (!body.nodeId || !body.content || !body.boardId) {
      return NextResponse.json(
        { error: 'nodeId, content, and boardId are required' },
        { status: 400 }
      );
    }

    await requireBoardAccess(user.id, body.boardId);

    const nodes = await forgeFromNode({
      nodeId: body.nodeId,
      content: body.content,
      parentPosition: body.parentPosition,
    });

    return NextResponse.json({ nodes });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error forging nodes:', error);
    return NextResponse.json({ error: 'Failed to forge nodes' }, { status: 500 });
  }
}
