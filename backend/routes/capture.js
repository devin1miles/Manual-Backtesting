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
    const mimeType = req.body.mimeType || 'image/jpeg';
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: image },
            },
            {
              type: 'text',
              text: `You are reading a TradingView screenshot. A Position tool settings dialog may be open, or the position tool may just be drawn on the chart.

IF A SETTINGS DIALOG IS VISIBLE (panel with fields like "Entry price", "Profit Level", "Stop Level"):
  Read these fields directly — they are the most accurate source:
  • FIRST read the dialog title: "Long position" → side = "long" | "Short position" → side = "short". This overrides everything else.
  • "Entry price" field value → entry
  • Under "PROFIT LEVEL" → "Price" field value → take_profit
  • Under "STOP LEVEL"  → "Price" field value → stop_loss
  • "Lot size" field → quantity

IF NO DIALOG IS VISIBLE (position tool drawn on chart only):
  The position tool is a colored rectangle with THREE horizontal boundaries.
  Trace each boundary across to the right price axis:
  • MIDDLE horizontal line (entry line) → entry (also shown as GRAY label on right axis)
  • GREEN/TEAL zone outer boundary → take_profit
  • RED/PINK zone outer boundary → stop_loss
  Side: take_profit > entry → "long" | take_profit < entry → "short"

IN BOTH CASES:
  • Symbol: read ticker from top-left of chart (e.g. NQ, ES1!, XAUUSD, MGC1!)
  • Outcome: did candles close past TP or SL after the entry?
      Past TP → result="win"  exit_price=take_profit
      Past SL → result="loss" exit_price=stop_loss
      Unclear  → result=null  exit_price=null

Return ONLY this JSON, no other text:
{"entry":0,"stop_loss":0,"take_profit":0,"side":"long or short","symbol":null,"risk_reward":null,"quantity":null,"exit_price":null,"result":null}`,
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
