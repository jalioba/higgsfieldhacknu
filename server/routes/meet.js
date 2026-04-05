import { Router } from 'express';
import { readJson, writeJson, appendToJson } from '../utils/jsonStore.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Meeting title is required' });
    }

    const hasGoogleAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    let meetLink;
    let meetId;

    if (hasGoogleAuth) {

      meetId = uuidv4();
      meetLink = `https://meet.google.com/${generateMeetCode()}`;
    } else {
      meetId = uuidv4();
      meetLink = `https://meet.google.com/${generateMeetCode()}`;
    }

    const meeting = {
      id: meetId,
      title,
      link: meetLink,
      status: 'active',
      createdAt: new Date().toISOString(),
      participants: 1,
      isReal: hasGoogleAuth,
    };

    appendToJson('meetings.json', meeting);

    res.json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});


router.get('/list', (req, res) => {
  const meetings = readJson('meetings.json', []);
  res.json(meetings);
});


router.get('/:id', (req, res) => {
  const meetings = readJson('meetings.json', []);
  const meeting = meetings.find((m) => m.id === req.params.id);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  res.json(meeting);
});


router.delete('/:id', (req, res) => {
  const meetings = readJson('meetings.json', []);
  const filtered = meetings.filter((m) => m.id !== req.params.id);
  if (filtered.length === meetings.length) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  writeJson('meetings.json', filtered);
  res.json({ success: true });
});

function generateMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}-${part()}`;
}

export default router;
