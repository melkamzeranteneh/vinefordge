import { Router } from 'express';
import { requireAuth, requireBoardAccess } from '../middleware/supabaseAuth';
import { applyYjsUpdate, flushBoard, getSnapshot } from '../services/yjsPersistence';

const router = Router();

router.post('/:boardId/yjs-update', requireAuth, requireBoardAccess(), async (req, res) => {
  const { boardId } = req.params;
  const { update } = req.body as { update?: string };

  if (!update) {
    return res.status(400).json({ error: 'Missing update payload' });
  }

  await applyYjsUpdate(boardId, update);
  return res.json({ ok: true });
});

router.post('/:boardId/flush', requireAuth, requireBoardAccess(), async (req, res) => {
  const { boardId } = req.params;
  await flushBoard(boardId);
  return res.json({ ok: true });
});

router.get('/:boardId/snapshot', requireAuth, requireBoardAccess(), async (req, res) => {
  const { boardId } = req.params;
  const snapshot = await getSnapshot(boardId);
  return res.json(snapshot);
});

export default router;
