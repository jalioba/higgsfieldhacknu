import { Router } from 'express';
import { readJson, writeJson } from '../utils/jsonStore.js';

const router = Router();

router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

  if (!clientId) {
    return res.json({
      url: null,
      configured: false,
      message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env',
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/meetings.space.created',
  ].join(' ');

  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.json({ url, configured: true });
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    writeJson('tokens.json', {
      ...tokens,
      savedAt: new Date().toISOString(),
    });

    res.redirect('http://localhost:5173/workspace?auth=success');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('http://localhost:5173/workspace?auth=error');
  }
});


router.get('/status', (req, res) => {
  const hasCredentials = !!process.env.GOOGLE_CLIENT_ID;
  const tokens = readJson('tokens.json', null);
  const hasTokens = tokens && tokens.access_token;

  res.json({
    configured: hasCredentials,
    connected: hasTokens,
    services: {
      meet: hasCredentials,
      calendar: hasCredentials,
    },
  });
});

export default router;
