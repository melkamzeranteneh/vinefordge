import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth, requireBoardAccess } from '@/lib/server/auth';
import { getAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'owner');

    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin
      .from('boards')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', params.boardId);

    if (error) {
      throw new HttpError(500, 'Failed to rename board');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error renaming board:', error);
    return NextResponse.json({ error: 'Failed to rename board' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'owner');

    const admin = getAdminClient();
    // nodes/edges/board_documents/board_members cascade via FK.
    const { error } = await admin
      .from('boards')
      .delete()
      .eq('id', params.boardId);

    if (error) {
      throw new HttpError(500, 'Failed to delete board');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
