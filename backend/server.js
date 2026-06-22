require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');
const statsRoutes = require('./routes/stats');
const captureRoutes = require('./routes/capture');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'trading_analyzer',
      user: process.env.DB_USER || process.env.USER,
      password: process.env.DB_PASSWORD || '',
    });

app.locals.db = pool;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/capture', captureRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Trading Analyzer API running on port ${PORT}`);
});
