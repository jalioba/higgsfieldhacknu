import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { getCanvasData, saveCanvasData } from '../services/firebase.js';
import { startGeneration, pollImageResult } from '../services/higgsfield.js';

dotenv.config();

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { message, workspaceId, imageBase64, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let canvasData = [];
    if (workspaceId) {
      canvasData = await getCanvasData(workspaceId);
    }

    if (!process.env.AI_API_KEY) {
      return res.json({
        reply: `🔧 AI service is not configured yet. Please set your AI_API_KEY in server/.env\n\nYour message: "${message}"`,
        mock: true,
      });
    }

    let systemPrompt = `You are an AI assistant for the Higgsfield AI Collaboration Platform. 
You help team members brainstorm ideas, analyze their canvas drawings, plan features, 
and provide creative suggestions. Be helpful, concise, and proactive.

You can now SEE the user's canvas through the attached image! If they show you a table or a diagram, you can read it perfectly and reference the contents visually.

IMPORTANT: You have the ability to draw directly on the user's Excalidraw canvas!
If the user asks you to draw something, diagram something, or add something to the canvas, YOU MUST output a JSON block containing the Excalidraw elements.

Format your drawing response exactly like this:
\`\`\`json
{
  "excalidrawElements": [
    { "type": "rectangle", "x": 100, "y": 100, "width": 100, "height": 50, "backgroundColor": "transparent", "strokeColor": "#000000" },
    { "type": "text", "x": 110, "y": 115, "text": "Example", "fontSize": 20 }
  ]
}
\`\`\`

- For anything that requires a full image, complex drawing, UI mockup, logo, realistic people/art, you MUST trigger Higgsfield AI generation!
To do this, use exactly this JSON format:
\`\`\`json
{
  "higgsfieldGeneration": {
    "prompt": "Highly detailed description of the image to generate",
    "x": 200, "y": 200 
  }
}
\`\`\`
- If the image needs specific dimensions, you can specify width and height in the JSON too.
- For simple diagrams, shapes, or basic wireframes, use the "excalidrawElements" JSON block instead.
- CRITICAL: Use the JSON block at the VERY END of your message.
- CRITICAL: Tell the user something like "I am generating an image for you... ✨" before the JSON block.`;

  if (req.body.botType === 'higgsBot') {
    systemPrompt = `You are HiggsBot, a specialized AI image generation assistant.
The user wants you to generate a high-quality image based on their request.
You must NOT have a conversation. You must ONLY output the higgsfieldGeneration JSON block.
Translate the user's request (if any language) into a highly detailed, professional English prompt for advanced AI image generation.

Format EXACTLY like this (NO TEXT BEFORE OR AFTER):
\`\`\`json
{
  "higgsfieldGeneration": {
    "prompt": "Highly detailed English description of the image...",
    "x": 200,
    "y": 200
  }
}
\`\`\``;
  }

    if (canvasData && Array.isArray(canvasData) && canvasData.length > 0) {
      const canvasSummary = canvasData
        .filter((el) => !el.isDeleted)
        .map((el) => {
          if (el.type === 'text') return `Text: "${el.text}"`;
          if (el.type === 'rectangle') return `Rectangle at (${Math.round(el.x)}, ${Math.round(el.y)})`;
          if (el.type === 'ellipse') return `Ellipse at (${Math.round(el.x)}, ${Math.round(el.y)})`;
          if (el.type === 'arrow') return `Arrow connection`;
          if (el.type === 'line') return `Line`;
          if (el.type === 'freedraw') return `Freehand drawing`;
          return `${el.type} element`;
        })
        .join('; ');

      systemPrompt += `\n\nThe user's current canvas contains the following elements:\n${canvasSummary}`;
    }

    const rawMessages = [...history];
    const formattedHistory = [];

    for (const msg of rawMessages) {
      if (!msg.text || msg.text === "Bot is typing...") continue;
      const role = msg.isBot ? 'assistant' : 'user';
      const last = formattedHistory[formattedHistory.length - 1];
      if (last && last.role === role && typeof last.content === 'string') {
        last.content += '\n\n' + msg.text;
      } else if (last && last.role === role && Array.isArray(last.content)) {
        last.content.push({ type: 'text', text: msg.text });
      } else {
        formattedHistory.push({ role, content: msg.text });
      }
    }

    const currentUserContent = [];
    if (imageBase64) {
      currentUserContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: imageBase64
        }
      });
    }
    currentUserContent.push({
      type: "text",
      text: message
    });

    formattedHistory.push({
      role: 'user',
      content: currentUserContent
    });

    let finalMessages = formattedHistory.slice(-20);
    if (finalMessages.length > 0 && finalMessages[0].role === 'assistant') {
      finalMessages.shift();
    }

    const client = new Anthropic({
      apiKey: process.env.AI_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      system: systemPrompt,
      max_tokens: 1024,
      temperature: 0.7,
      messages: finalMessages,
    });

    let reply = response.content?.[0]?.text || 'No response from AI';
    let higgsfieldData = null;

    if (workspaceId) {
      const codeBlocks = [...reply.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)];
      
      for (const match of codeBlocks) {
        try {
          const content = match[1].trim();
          const parsed = JSON.parse(content);
          
          let handled = false;
          if (parsed.excalidrawElements && Array.isArray(parsed.excalidrawElements)) {
            const genEls = parsed.excalidrawElements.map((el) => ({
              ...el,
              id: el.id || Math.random().toString(36).substring(2, 9),
              version: 1,
              versionNonce: Math.floor(Math.random() * 1000000),
              isDeleted: false,
            }));
            const newEls = [...canvasData, ...genEls];
            await saveCanvasData(workspaceId, newEls);
            reply = reply.replace(match[0], "\n*(🎨 I drew something on the canvas!)*");
            handled = true;
          }
          
          if (parsed.higgsfieldGeneration) {
            higgsfieldData = parsed.higgsfieldGeneration;
            reply = reply.replace(match[0], "\n*(✨ Starting Higgsfield Image Generation...)*");
            handled = true;
          }

          if (handled) {
            canvasData = await getCanvasData(workspaceId); 
          }
        } catch (e) {
          console.error("Could not parse bot JSON block on server", e);
        }
      }
    }

    res.json({ reply, higgsfieldData });
  } catch (error) {
    console.error('AI chat error:', error);
    res.json({
      error: true,
      reply: `❌ AI Error: ${error.message || 'Unknown error occurred'}`,
    });
  }
});

router.post('/generations/start', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const jobId = await startGeneration(prompt);
    res.json({ jobId });
  } catch (error) {
    console.error('Higgsfield start gen router error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/generations/poll/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const url = await pollImageResult(jobId);
    if (url) {
      res.json({ status: 'completed', url });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error) {
    console.error('Higgsfield poll router error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
