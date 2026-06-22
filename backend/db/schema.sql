-- Trading Analyzer Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_data JSONB,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration: run once against existing databases
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(12, 4) NOT NULL,
  exit_price DECIMAL(12, 4),
  quantity DECIMAL(12, 4) NOT NULL,
  pnl DECIMAL(12, 2),
  pnl_percent DECIMAL(8, 4),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  entry_time TIMESTAMP NOT NULL,
  exit_time TIMESTAMP,
  notes TEXT,
  tags VARCHAR(255),
  strategy VARCHAR(100),
  stop_loss DECIMAL(12, 4),
  take_profit DECIMAL(12, 4),
  risk_reward DECIMAL(8, 4),
  point_value DECIMAL(12, 4) DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration: run once against existing databases
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(12, 4);
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit DECIMAL(12, 4);
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS risk_reward DECIMAL(8, 4);
-- ALTER TABLE trades ADD COLUMN IF NOT EXISTS point_value DECIMAL(12, 4) DEFAULT 1;

CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  gross_pnl DECIMAL(12, 2) DEFAULT 0,
  net_pnl DECIMAL(12, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  avg_win DECIMAL(12, 2) DEFAULT 0,
  avg_loss DECIMAL(12, 2) DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
