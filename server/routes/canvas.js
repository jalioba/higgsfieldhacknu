import { Router } from 'express';
import { readJson, writeJson } from '../utils/jsonStore.js';

const router = Router();

router.get('/:workspaceId', (req, res) => {
  const { workspaceId } = req.params;
  const canvasFile = `canvas_${workspaceId}.json`;
  const data = readJson(canvasFile, { elements: [], appState: {} });
  res.json(data);
});

router.put('/:workspaceId', (req, res) => {
  const { workspaceId } = req.params;
  const { canvasData } = req.body;

  if (!canvasData) {
    return res.status(400).json({ error: 'canvasData is required' });
  }

  const canvasFile = `canvas_${workspaceId}.json`;
  const success = writeJson(canvasFile, {
    ...canvasData,
    savedAt: new Date().toISOString(),
  });

  if (success) {
    res.json({ success: true, savedAt: new Date().toISOString() });
  } else {
    res.status(500).json({ error: 'Failed to save canvas data' });
  }
});

export default router;
