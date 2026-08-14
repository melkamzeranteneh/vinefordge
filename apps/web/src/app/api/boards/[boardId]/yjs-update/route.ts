import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth, requireBoardAccess } from '@/lib/server/auth';
import { applyYjsUpdate } from '@/lib/server/yjs';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { boardId } = params;

    await requireBoardAccess(user.id, boardId);

    const body = (await req.json()) as { update?: string };
    if (!body.update) {
      return NextResponse.json({ error: 'Missing update payload' }, { status: 400 });
    }

    await applyYjsUpdate(boardId, body.update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error applying yjs update:', error);
    return NextResponse.json({ error: 'Failed to apply update' }, { status: 500 });
  }
}
