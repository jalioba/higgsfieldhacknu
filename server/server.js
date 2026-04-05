import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import aiRouter from './routes/ai.js';
import meetRouter from './routes/meet.js';
import calendarRouter from './routes/calendar.js';
import canvasRouter from './routes/canvas.js';
import workspacesRouter from './routes/workspaces.js';
import authRouter from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));


app.use('/api/ai', aiRouter);
app.use('/api/meet', meetRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/canvas', canvasRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/auth', authRouter);


app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ai: !!process.env.AI_API_KEY,
      google: !!process.env.GOOGLE_CLIENT_ID,
    },
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Higgsfield AI Server              ║
  ║   Running on http://localhost:${PORT}  ║
  ╠══════════════════════════════════════╣
  ║   AI:     ${process.env.AI_API_KEY ? '✅ Configured' : '❌ Not configured'}          ║
  ║   Google: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}          ║
  ╚══════════════════════════════════════╝
  `);
});
