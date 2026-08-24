import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth, requireBoardAccess } from '@/lib/server/auth';
import { getSnapshot } from '@/lib/server/yjs';
import { getAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { boardId } = params;

    const { role } = await requireBoardAccess(user.id, boardId);

    const admin = getAdminClient();
    const { data: board } = await admin
      .from('boards')
      .select('name')
      .eq('id', boardId)
      .single();

    const snapshot = await getSnapshot(boardId);
    return NextResponse.json({
      ...snapshot,
      board: { id: boardId, name: board?.name ?? 'Untitled board' },
      role,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error loading snapshot:', error);
    return NextResponse.json({ error: 'Failed to load snapshot' }, { status: 500 });
  }
}
