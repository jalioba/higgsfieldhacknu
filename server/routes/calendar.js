import { Router } from 'express';
import { readJson, writeJson, appendToJson } from '../utils/jsonStore.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/events', async (req, res) => {
  try {
    const hasAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    if (hasAuth) {
      
      
      
      
      
      
      
      
      
      
      
      
    }

    const events = readJson('events.json', []);
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const { title, start, end, addMeet = false } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start, and end are required' });
    }

    const hasAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

    if (hasAuth) {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    }

    
    const meetCode = addMeet ? generateMeetCode() : null;
    const event = {
      id: uuidv4(),
      title,
      start,
      end,
      hasMeet: addMeet,
      meetLink: meetCode ? `https://meet.google.com/${meetCode}` : null,
      createdAt: new Date().toISOString(),
    };

    appendToJson('events.json', event);
    res.json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const hasAuth = process.env.GOOGLE_CLIENT_ID;

    if (hasAuth) {
      
    }

    const events = readJson('events.json', []);
    const filtered = events.filter((e) => e.id !== req.params.id);
    if (filtered.length === events.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    writeJson('events.json', filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

function generateMeetCode() {
  const c = 'abcdefghijklmnopqrstuvwxyz';
  const p = () => Array.from({ length: 3 }, () => c[Math.floor(Math.random() * c.length)]).join('');
  return `${p()}-${p()}-${p()}`;
}

export default router;
