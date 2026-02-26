import * as Y from 'yjs';
import { redis } from './redisClient';
import { getSupabaseClient } from './supabaseClient';

const DOC_KEY_PREFIX = 'vine:doc:';
const DIRTY_SET_KEY = 'vine:dirty';
const FLUSH_INTERVAL_MS = Number(process.env.FLUSH_INTERVAL_MS ?? 5000);

function encodeUpdate(update: Uint8Array): string {
  return Buffer.from(update).toString('base64');
}

function decodeUpdate(encoded: string): Uint8Array {
  return Buffer.from(encoded, 'base64');
}

async function loadDoc(boardId: string): Promise<Y.Doc> {
  const doc = new Y.Doc();
  const encoded = await redis.get(`${DOC_KEY_PREFIX}${boardId}`);
  if (encoded) {
    Y.applyUpdate(doc, decodeUpdate(encoded));
  }
  return doc;
}

async function saveDoc(boardId: string, doc: Y.Doc): Promise<void> {
  const update = Y.encodeStateAsUpdate(doc);
  await redis.set(`${DOC_KEY_PREFIX}${boardId}`, encodeUpdate(update));
}

function extractSnapshot(doc: Y.Doc) {
  const nodes = doc.getArray('nodes').toJSON();
  const edges = doc.getArray('edges').toJSON();
  return { nodes, edges };
}

async function persistSnapshot(boardId: string, nodes: unknown[], edges: unknown[]) {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  await supabase.from('nodes').upsert(
    [{ board_id: boardId, data: nodes, updated_at: now }],
    { onConflict: 'board_id' }
  );
  await supabase.from('edges').upsert(
    [{ board_id: boardId, data: edges, updated_at: now }],
    { onConflict: 'board_id' }
  );
}

export async function applyYjsUpdate(boardId: string, updateBase64: string): Promise<void> {
  const update = decodeUpdate(updateBase64);
  const doc = await loadDoc(boardId);
  Y.applyUpdate(doc, update);
  await saveDoc(boardId, doc);
  await redis.sadd(DIRTY_SET_KEY, boardId);
}

export async function getSnapshot(boardId: string): Promise<{ nodes: unknown[]; edges: unknown[] }> {
  const doc = await loadDoc(boardId);
  return extractSnapshot(doc);
}

export async function flushBoard(boardId: string): Promise<void> {
  const doc = await loadDoc(boardId);
  const { nodes, edges } = extractSnapshot(doc);
  await persistSnapshot(boardId, nodes, edges);
}

export async function flushDirtyBoards(): Promise<number> {
  const boardIds = await redis.smembers(DIRTY_SET_KEY);
  if (boardIds.length === 0) {
    return 0;
  }

  for (const boardId of boardIds) {
    await flushBoard(boardId);
  }

  await redis.srem(DIRTY_SET_KEY, ...boardIds);
  return boardIds.length;
}

let flushTimer: NodeJS.Timeout | null = null;

export function startFlushLoop() {
  if (flushTimer) {
    return;
  }

  flushTimer = setInterval(async () => {
    try {
      await flushDirtyBoards();
    } catch (error) {
      console.error('Flush loop error:', error);
    }
  }, FLUSH_INTERVAL_MS);
}
