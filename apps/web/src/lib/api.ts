import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function getSession(): Promise<Session | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    session?: Session | null;
  } = {}
): Promise<T> {
  const session = options.session ?? (await getSession());
  if (!session) {
    throw new ApiError(401, 'You are not signed in');
  }

  const res = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON error body
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk: number[] = [];
    for (let j = i; j < Math.min(i + chunkSize, bytes.length); j += 1) {
      chunk.push(bytes[j]);
    }
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
