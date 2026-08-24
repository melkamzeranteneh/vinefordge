import { NextRequest, NextResponse } from 'next/server';
import { HttpError, requireAuth } from '@/lib/server/auth';
import { getAdminClient } from '@/lib/server/supabase-admin';
import type { BoardSummary, BoardRole } from '@/types/board';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const admin = getAdminClient();

    // Memberships give us role + board id in one query.
    const { data: memberships, error: memberError } = await admin
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', user.id);

    if (memberError) {
      throw new HttpError(500, 'Failed to load boards');
    }

    let boardIds = (memberships ?? []).map((m) => m.board_id as string);

    // Legacy fallback: boards created before the members table existed.
    const { data: owned } = await admin
      .from('boards')
      .select('id')
      .eq('user_id', user.id);
    for (const board of owned ?? []) {
      if (!boardIds.includes(board.id)) boardIds.push(board.id);
    }

    if (boardIds.length === 0) {
      return NextResponse.json({ boards: [] satisfies BoardSummary[] });
    }

    const { data: boards, error } = await admin
      .from('boards')
      .select('id,name,user_id,created_at,updated_at,owner_email')
      .in('id', boardIds)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new HttpError(500, 'Failed to load boards');
    }

    const roleByBoard = new Map(
      (memberships ?? []).map((m) => [m.board_id, m.role as BoardRole])
    );

    const summary: BoardSummary[] = (boards ?? []).map((b) => ({
      id: b.id,
      name: b.name ?? 'Untitled board',
      role: b.user_id === user.id ? 'owner' : (roleByBoard.get(b.id) ?? 'viewer'),
      ownerEmail: b.owner_email ?? undefined,
      updatedAt: b.updated_at,
      createdAt: b.created_at,
    }));

    return NextResponse.json({ boards: summary });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error listing boards:', error);
    return NextResponse.json({ error: 'Failed to list boards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim() || 'Untitled board';

    const admin = getAdminClient();
    const { data: board, error } = await admin
      .from('boards')
      .insert([
        {
          user_id: user.id,
          name,
          owner_email: user.email ?? null,
        },
      ])
      .select('id,name,created_at,updated_at')
      .single();

    if (error || !board) {
      throw new HttpError(500, 'Failed to create board');
    }

    // Seed the membership table so access checks have one source of truth.
    await admin.from('board_members').insert([
      {
        board_id: board.id,
        user_id: user.id,
        email: user.email ?? '',
        role: 'owner',
      },
    ]);

    const payload: BoardSummary = {
      id: board.id,
      name: board.name ?? name,
      role: 'owner',
      ownerEmail: user.email,
      updatedAt: board.updated_at,
      createdAt: board.created_at,
    };

    return NextResponse.json({ board: payload }, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
