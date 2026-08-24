import type { NextRequest } from 'next/server';
import { getAdminClient } from './supabase-admin';
import type { BoardRole } from '@/types/board';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(
  req: NextRequest
): Promise<{ id: string; email?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    throw new HttpError(401, 'Invalid Authorization header');
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'Invalid or expired token');
  }

  return { id: data.user.id, email: data.user.email ?? undefined };
}

const ROLE_RANK: Record<BoardRole, number> = { viewer: 0, editor: 1, owner: 2 };

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const admin = getAdminClient();

  // Preferred path: auth.users is exposed to PostgREST on most projects.
  const { data: rows, error } = await admin
    .schema('auth')
    .from('users')
    .select('id,email')
    .eq('email', normalized)
    .limit(1);

  if (!error && rows && rows.length > 0) {
    return rows[0].id as string;
  }

  // Fallback: page through Admin API users.
  for (let page = 1; page <= 10; page += 1) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    const match = users.find(
      (u) => (u.email ?? '').toLowerCase() === normalized
    );
    if (match) return match.id;
    if (users.length < 200) break;
  }

  return null;
}

export async function requireBoardAccess(
  userId: string,
  boardId: string,
  minRole: BoardRole = 'viewer'
): Promise<{ boardId: string; role: BoardRole }> {
  if (!boardId) {
    throw new HttpError(400, 'Missing boardId');
  }

  const admin = getAdminClient();
  const { data: membership, error } = await admin
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'Failed to check board access');
  }

  if (!membership) {
    // Fall back to legacy ownership column so pre-migration boards keep working.
    const { data: board } = await admin
      .from('boards')
      .select('id,user_id')
      .eq('id', boardId)
      .single();

    if (!board) {
      throw new HttpError(404, 'Board not found');
    }
    if (board.user_id !== userId) {
      throw new HttpError(403, 'You do not have access to this board');
    }
    return { boardId, role: 'owner' };
  }

  const role = membership.role as BoardRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Requires ${minRole} access`);
  }

  return { boardId, role };
}
