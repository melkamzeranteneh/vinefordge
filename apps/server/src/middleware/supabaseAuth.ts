import type { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../services/supabaseClient';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email?: string;
  };
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header' });
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as AuthenticatedRequest).user = {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };

  return next();
}

export function requireBoardAccess(paramName = 'boardId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const boardId = req.params[paramName] ?? req.body?.boardId;
    if (!boardId) {
      return res.status(400).json({ error: 'Missing boardId' });
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Missing user context' });
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error(error);
      return res.status(503).json({ error: 'Supabase is not configured' });
    }

    const { data, error } = await supabase
      .from('boards')
      .select('id,user_id')
      .eq('id', boardId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (data.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}
