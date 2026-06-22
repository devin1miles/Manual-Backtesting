const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// POST /api/trades — create a trade
const POINT_VALUES = {
  // E-mini
  ES: 50, NQ: 20, YM: 5, RTY: 50,
  // Micro
  MES: 5, MNQ: 2, MYM: 0.5, M2K: 5,
  // Metals
  GC: 100, MGC: 10, SI: 5000, SIL: 1000,
  // Energy
  CL: 1000, MCL: 100, NG: 10000,
  // Crypto perps (USD-margined, 1:1)
  BTC: 1, ETH: 1,
};

function getPointValue(symbol) {
  const base = symbol.replace(/\d+!?$/, '').toUpperCase();
  return POINT_VALUES[base] || 1;
}

router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;
  const { symbol, side, entry_price, exit_price, quantity, entry_time, exit_time, notes, tags, strategy, stop_loss, take_profit, risk_reward, point_value } = req.body;

  if (!symbol || !side || !entry_price || !quantity || !entry_time) {
    return res.status(400).json({ error: 'symbol, side, entry_price, quantity, and entry_time are required' });
  }

  const pv = parseFloat(point_value) || getPointValue(symbol);
  let pnl = null;
  let pnl_percent = null;
  let status = 'open';

  if (exit_price && exit_time) {
    status = 'closed';
    const multiplier = side === 'long' ? 1 : -1;
    pnl = ((exit_price - entry_price) * quantity * pv * multiplier).toFixed(2);
    pnl_percent = (((exit_price - entry_price) / entry_price) * 100 * multiplier).toFixed(4);
  }

  try {
    const result = await db.query(
      `INSERT INTO trades
        (user_id, symbol, side, entry_price, exit_price, quantity, pnl, pnl_percent, status, entry_time, exit_time, notes, tags, strategy, stop_loss, take_profit, risk_reward, point_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [userId, symbol.toUpperCase(), side, entry_price, exit_price || null, quantity, pnl, pnl_percent, status,
       entry_time, exit_time || null, notes || null, tags || null, strategy || null,
       stop_loss || null, take_profit || null, risk_reward || null, pv]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create trade error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/trades — list all trades
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;
  const { symbol, status, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM trades WHERE user_id = $1';
  const params = [userId];

  if (symbol) {
    params.push(symbol.toUpperCase());
    query += ` AND symbol = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ` ORDER BY entry_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/trades/:id — single trade
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.query('SELECT * FROM trades WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get trade error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/trades/:id — update a trade
router.put('/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const userId = req.user.userId;
  const { exit_price, exit_time, notes, tags, strategy } = req.body;

  try {
    const existing = await db.query('SELECT * FROM trades WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Trade not found' });

    const trade = existing.rows[0];
    let pnl = trade.pnl;
    let pnl_percent = trade.pnl_percent;
    let status = trade.status;

    if (exit_price && exit_time) {
      status = 'closed';
      const multiplier = trade.side === 'long' ? 1 : -1;
      pnl = ((exit_price - trade.entry_price) * trade.quantity * trade.point_value * multiplier).toFixed(2);
      pnl_percent = (((exit_price - trade.entry_price) / trade.entry_price) * 100 * multiplier).toFixed(4);
    }

    const result = await db.query(
      `UPDATE trades SET
        exit_price = COALESCE($1, exit_price),
        exit_time  = COALESCE($2, exit_time),
        notes      = COALESCE($3, notes),
        tags       = COALESCE($4, tags),
        strategy   = COALESCE($5, strategy),
        pnl        = $6,
        pnl_percent= $7,
        status     = $8,
        updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [exit_price || null, exit_time || null, notes || null, tags || null,
       strategy || null, pnl, pnl_percent, status, id, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/trades/:id
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await db.query('DELETE FROM trades WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trade not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Delete trade error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
