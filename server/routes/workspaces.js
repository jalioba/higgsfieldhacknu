import { Router } from 'express';
import { readJson, appendToJson, findById, updateById } from '../utils/jsonStore.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const FILENAME = 'workspaces.json';


router.get('/', (req, res) => {
  const workspaces = readJson(FILENAME, []);
  res.json(workspaces);
});
router.post('/', (req, res) => {
  const { name, description = '' } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Workspace name is required' });
  }

  const workspace = {
    id: uuidv4(),
    name,
    description,
    memberCount: 1,
    canvasElements: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appendToJson(FILENAME, workspace);
  res.status(201).json(workspace);
});

router.get('/:id', (req, res) => {
  const workspace = findById(FILENAME, req.params.id);
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  res.json(workspace);
});


router.put('/:id', (req, res) => {
  const updated = updateById(FILENAME, req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Workspace not found' });
  }
  res.json(updated);
});

export default router;
