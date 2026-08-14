import type { NextRequest } from 'next/server';
import { getAdminClient } from './supabase-admin';

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

export async function requireBoardAccess(userId: string, boardId: string): Promise<void> {
  if (!boardId) {
    throw new HttpError(400, 'Missing boardId');
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('boards')
    .select('id,user_id')
    .eq('id', boardId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'Board not found');
  }

  if (data.user_id !== userId) {
    throw new HttpError(403, 'Forbidden');
  }
}
