const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, onboarding_completed, created_at',
      [email, password_hash, username || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username, onboarding_completed: user.onboarding_completed } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({ token, user: { id: user.id, email: user.email, username: user.username, onboarding_completed: user.onboarding_completed } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = req.app.locals.db;
    const result = await db.query('SELECT id, email, username, onboarding_completed FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ valid: true, user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/onboarding
router.post('/onboarding', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.userId;
  const { trader_type, setups, instruments } = req.body;

  try {
    const result = await db.query(
      `UPDATE users
       SET onboarding_completed = TRUE,
           onboarding_data = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, username, onboarding_completed`,
      [JSON.stringify({ trader_type, setups, instruments }), userId]
    );
    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot
router.post('/forgot', async (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Email not found' });

    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );

    // If Resend is configured, send email; otherwise log token to console
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM || 'Trading Analyzer <onboarding@resend.dev>',
        to: email,
        subject: 'Trading Analyzer — Reset your password',
        text: `Click to reset your password (expires in 1 hour):\n\n${resetUrl}`,
      });
      if (error) console.error('Resend error:', error);
    } else {
      console.log(`[Password Reset] token for ${email}: ${token}`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Forgot error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset
router.post('/reset', async (req, res) => {
  const db = req.app.locals.db;
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });

  try {
    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, result.rows[0].id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
