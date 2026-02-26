import { Router } from 'express';
import { requireAuth, requireBoardAccess } from '../middleware/supabaseAuth';
import { forgeFromNode } from '../services/forgeService';

const router = Router();

router.post('/', requireAuth, requireBoardAccess(), async (req, res) => {
  const { nodeId, content, boardId, parentPosition } = req.body as {
    nodeId?: string;
    content?: string;
    boardId?: string;
    parentPosition?: { x: number; y: number };
  };

  if (!nodeId || !content || !boardId) {
    return res.status(400).json({ error: 'nodeId, content, and boardId are required' });
  }

  try {
    const nodes = await forgeFromNode({ nodeId, content, parentPosition });
    return res.json({ nodes });
  } catch (error) {
    console.error('Error forging nodes:', error);
    return res.status(500).json({ error: 'Failed to forge nodes' });
  }
});

export default router;
