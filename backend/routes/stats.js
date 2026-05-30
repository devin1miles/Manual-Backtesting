const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/stats/today
router.get('/today', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
        COUNT(*) FILTER (WHERE pnl < 0) AS losing_trades,
        COALESCE(SUM(pnl), 0) AS net_pnl,
        COALESCE(AVG(pnl) FILTER (WHERE pnl > 0), 0) AS avg_win,
        COALESCE(AVG(pnl) FILTER (WHERE pnl < 0), 0) AS avg_loss
       FROM trades
       WHERE user_id = $1
         AND status = 'closed'
         AND exit_time::date = CURRENT_DATE`,
      [userId]
    );
    const row = result.rows[0];
    const total = parseInt(row.total_trades);
    const wins = parseInt(row.winning_trades);
    row.win_rate = total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00';
    res.json(row);
  } catch (err) {
    console.error('Stats today error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/month
router.get('/month', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
        COUNT(*) FILTER (WHERE pnl < 0) AS losing_trades,
        COALESCE(SUM(pnl), 0) AS net_pnl,
        COALESCE(AVG(pnl) FILTER (WHERE pnl > 0), 0) AS avg_win,
        COALESCE(AVG(pnl) FILTER (WHERE pnl < 0), 0) AS avg_loss
       FROM trades
       WHERE user_id = $1
         AND status = 'closed'
         AND DATE_TRUNC('month', exit_time) = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const row = result.rows[0];
    const total = parseInt(row.total_trades);
    const wins = parseInt(row.winning_trades);
    row.win_rate = total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00';
    res.json(row);
  } catch (err) {
    console.error('Stats month error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/all-time
router.get('/all-time', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
        COUNT(*) FILTER (WHERE pnl < 0) AS losing_trades,
        COALESCE(SUM(pnl), 0) AS net_pnl,
        COALESCE(MAX(pnl), 0) AS best_trade,
        COALESCE(MIN(pnl), 0) AS worst_trade,
        COALESCE(AVG(pnl) FILTER (WHERE pnl > 0), 0) AS avg_win,
        COALESCE(AVG(pnl) FILTER (WHERE pnl < 0), 0) AS avg_loss
       FROM trades
       WHERE user_id = $1 AND status = 'closed'`,
      [userId]
    );
    const row = result.rows[0];
    const total = parseInt(row.total_trades);
    const wins = parseInt(row.winning_trades);
    row.win_rate = total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00';
    res.json(row);
  } catch (err) {
    console.error('Stats all-time error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/equity-curve
router.get('/equity-curve', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT
        exit_time::date AS date,
        SUM(pnl) OVER (ORDER BY exit_time) AS cumulative_pnl,
        pnl
       FROM trades
       WHERE user_id = $1 AND status = 'closed'
       ORDER BY exit_time`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Equity curve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/daily
router.get('/daily', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;
  const { days = 30 } = req.query;

  try {
    const result = await db.query(
      `SELECT
        exit_time::date AS date,
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
        COALESCE(SUM(pnl), 0) AS net_pnl
       FROM trades
       WHERE user_id = $1
         AND status = 'closed'
         AND exit_time >= CURRENT_DATE - INTERVAL '1 day' * $2
       GROUP BY exit_time::date
       ORDER BY date DESC`,
      [userId, days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Stats daily error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/by-symbol
router.get('/by-symbol', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT
        symbol,
        COUNT(*) AS total_trades,
        COUNT(*) FILTER (WHERE pnl > 0) AS winning_trades,
        COALESCE(SUM(pnl), 0) AS net_pnl,
        COALESCE(AVG(pnl), 0) AS avg_pnl
       FROM trades
       WHERE user_id = $1 AND status = 'closed'
       GROUP BY symbol
       ORDER BY net_pnl DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Stats by-symbol error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/best-worst
router.get('/best-worst', async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;

  try {
    const best = await db.query(
      `SELECT * FROM trades WHERE user_id = $1 AND status = 'closed' ORDER BY pnl DESC LIMIT 5`,
      [userId]
    );
    const worst = await db.query(
      `SELECT * FROM trades WHERE user_id = $1 AND status = 'closed' ORDER BY pnl ASC LIMIT 5`,
      [userId]
    );
    res.json({ best: best.rows, worst: worst.rows });
  } catch (err) {
    console.error('Best/worst error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
