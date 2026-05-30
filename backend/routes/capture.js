const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 15000,
  maxRetries: 0,
});

// POST /api/capture — receives a base64 screenshot, returns parsed trade data
router.post('/', async (req, res) => {
  const { image } = req.body; // base64 PNG/JPEG, no data URI prefix needed

  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }

  try {
    const t0 = Date.now();
    console.log('[capture] image received, size:', Math.round(image.length / 1024), 'KB — calling Anthropic...');
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `This is the RIGHT SIDE of a TradingView chart showing the price axis. There are colored price labels: a green label (Take Profit/Target), a red label (Stop Loss/Stop), and a gray label (Entry). Return ONLY this JSON with no other text:
{"symbol":null,"side":"long or short","entry":0,"stop_loss":0,"take_profit":0,"quantity":1}
Use null for any value not visible. side is "long" if take_profit is above entry, "short" if below.`,
            },
          ],
        },
      ],
    });

    console.log('[capture] Anthropic responded in', Date.now() - t0, 'ms');
    const text = message.content[0].text.trim();

    // Extract JSON from response (Claude sometimes adds markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Could not parse response from vision model' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    console.error('Capture error:', err.message);
    res.status(500).json({ error: err.message || 'Vision API failed' });
  }
});

module.exports = router;
