import * as Y from 'yjs';
import { getAdminClient } from './supabase-admin';

const DOC_TABLE = 'board_documents';

export type BoardSnapshot = { nodes: unknown[]; edges: unknown[] };

function encodeUpdate(update: Uint8Array): string {
  return Buffer.from(update).toString('base64');
}

function decodeUpdate(encoded: string): Uint8Array {
  return Buffer.from(encoded, 'base64');
}

async function loadDoc(boardId: string): Promise<Y.Doc> {
  const doc = new Y.Doc();
  const admin = getAdminClient();
  const { data, error } = await admin
    .from(DOC_TABLE)
    .select('update')
    .eq('board_id', boardId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.update) {
    Y.applyUpdate(doc, decodeUpdate(data.update));
  }
  return doc;
}

async function saveDoc(boardId: string, doc: Y.Doc): Promise<void> {
  const update = encodeUpdate(Y.encodeStateAsUpdate(doc));
  const admin = getAdminClient();
  const { error } = await admin.from(DOC_TABLE).upsert(
    [{ board_id: boardId, update, updated_at: new Date().toISOString() }],
    { onConflict: 'board_id' }
  );

  if (error) {
    throw error;
  }
}

function extractSnapshot(doc: Y.Doc): BoardSnapshot {
  const nodes = doc.getArray('nodes').toJSON();
  const edges = doc.getArray('edges').toJSON();
  return { nodes, edges };
}

async function persistSnapshot(boardId: string, snapshot: BoardSnapshot): Promise<void> {
  const now = new Date().toISOString();
  const admin = getAdminClient();
  await admin.from('nodes').upsert(
    [{ board_id: boardId, data: snapshot.nodes, updated_at: now }],
    { onConflict: 'board_id' }
  );
  await admin.from('edges').upsert(
    [{ board_id: boardId, data: snapshot.edges, updated_at: now }],
    { onConflict: 'board_id' }
  );
}

export async function applyYjsUpdate(boardId: string, updateBase64: string): Promise<BoardSnapshot> {
  const doc = await loadDoc(boardId);
  Y.applyUpdate(doc, decodeUpdate(updateBase64));
  const snapshot = extractSnapshot(doc);
  await saveDoc(boardId, doc);
  await persistSnapshot(boardId, snapshot);
  await touchBoard(boardId);
  return snapshot;
}

async function touchBoard(boardId: string): Promise<void> {
  const admin = getAdminClient();
  await admin
    .from('boards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', boardId);
}

export async function getSnapshot(boardId: string): Promise<BoardSnapshot> {
  const doc = await loadDoc(boardId);
  return extractSnapshot(doc);
}
