import { NextRequest, NextResponse } from 'next/server';
import {
  HttpError,
  findUserIdByEmail,
  requireAuth,
  requireBoardAccess,
} from '@/lib/server/auth';
import { getAdminClient } from '@/lib/server/supabase-admin';
import type { BoardMember } from '@/types/board';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'viewer');

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('board_members')
      .select('user_id,email,role')
      .eq('board_id', params.boardId)
      .order('role', { ascending: true });

    if (error) {
      throw new HttpError(500, 'Failed to load members');
    }

    return NextResponse.json({ members: (data ?? []) as BoardMember[] });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error listing members:', error);
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'owner');

    const body = (await req.json()) as { email?: string; role?: 'editor' | 'viewer' };
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    const role = body.role === 'viewer' ? 'viewer' : 'editor';

    const userId = await findUserIdByEmail(email);
    if (!userId) {
      return NextResponse.json(
        { error: 'No Vineforge account found for that email' },
        { status: 404 }
      );
    }

    const admin = getAdminClient();
    const { data: board } = await admin
      .from('boards')
      .select('user_id')
      .eq('id', params.boardId)
      .single();
    if (board && board.user_id === userId) {
      return NextResponse.json(
        { error: 'That user already owns this board' },
        { status: 409 }
      );
    }

    const { error } = await admin.from('board_members').upsert(
      [{ board_id: params.boardId, user_id: userId, email, role }],
      { onConflict: 'board_id,user_id' }
    );

    if (error) {
      throw new HttpError(500, 'Failed to add member');
    }

    return NextResponse.json({
      member: { user_id: userId, email, role } satisfies BoardMember,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await requireAuth(req);
    await requireBoardAccess(user.id, params.boardId, 'owner');

    const url = new URL(req.url);
    const memberId = url.searchParams.get('userId');
    if (!memberId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const admin = getAdminClient();
    // Owners cannot be removed; ownership transfers are out of scope.
    const { error } = await admin
      .from('board_members')
      .delete()
      .eq('board_id', params.boardId)
      .eq('user_id', memberId)
      .neq('role', 'owner');

    if (error) {
      throw new HttpError(500, 'Failed to remove member');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
