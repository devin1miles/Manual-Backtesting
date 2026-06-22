import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const TRADER_TYPES = [
  { id: 'scalper', label: 'Scalper', sub: 'Under 15 minutes' },
  { id: 'day', label: 'Day Trader', sub: '15 min – 4 hour' },
  { id: 'swing', label: 'Swing Trader', sub: '4 hour – Daily' },
  { id: 'position', label: 'Position Trader', sub: 'Weekly+' },
];

const SETUPS = [
  'Order Block',
  'Fair Value Gap (FVG)',
  'Breaker Block',
  'Liquidity Sweep',
  'Break of Structure (BOS)',
  'Change of Character (CHoCH)',
  'Supply & Demand',
  'Fibonacci Retracement',
  'Pin Bar',
  'Inside Bar',
];

const INSTRUMENTS = {
  Forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'NZD/USD'],
  Crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'],
  Futures: ['ES', 'NQ', 'MES', 'MNQ', 'YM', 'GC', 'CL'],
  Stocks: ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT'],
};

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [traderType, setTraderType] = useState('');
  const [setups, setSetups] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canNext = step === 1 ? !!traderType : step === 2 ? setups.length > 0 : instruments.length > 0;

  async function finish() {
    setLoading(true);
    setError('');
    try {
      const { user } = await api.post('/auth/onboarding', {
        trader_type: traderType,
        setups,
        instruments,
      });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...user }));
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Progress */}
        <div style={s.progress}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ ...s.dot, background: n <= step ? 'var(--accent)' : 'var(--border)' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 style={s.title}>What type of trader are you?</h2>
            <p style={s.sub}>This helps us tailor your experience.</p>
            <div style={s.optionGrid}>
              {TRADER_TYPES.map(t => (
                <button
                  key={t.id}
                  style={{ ...s.optionBtn, ...(traderType === t.id ? s.optionActive : {}) }}
                  onClick={() => setTraderType(t.id)}
                >
                  <div style={s.optionLabel}>{t.label}</div>
                  <div style={s.optionSub}>{t.sub}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={s.title}>Which setups do you backtest?</h2>
            <p style={s.sub}>Select all that apply.</p>
            <div style={s.chipGrid}>
              {SETUPS.map(setup => (
                <button
                  key={setup}
                  style={{ ...s.chip, ...(setups.includes(setup) ? s.chipActive : {}) }}
                  onClick={() => setSetups(prev => toggle(prev, setup))}
                >
                  {setup}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={s.title}>What do you trade?</h2>
            <p style={s.sub}>Select your preferred instruments.</p>
            {Object.entries(INSTRUMENTS).map(([group, items]) => (
              <div key={group} style={s.group}>
                <div style={s.groupLabel}>{group}</div>
                <div style={s.chipGrid}>
                  {items.map(item => (
                    <button
                      key={item}
                      style={{ ...s.chip, ...(instruments.includes(item) ? s.chipActive : {}) }}
                      onClick={() => setInstruments(prev => toggle(prev, item))}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {error && <p style={s.error}>{error}</p>}

        <div style={s.footer}>
          {step > 1 && (
            <button style={s.btnBack} onClick={() => setStep(s => s - 1)}>Back</button>
          )}
          <button
            style={{ ...s.btnNext, opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'default' }}
            disabled={!canNext || loading}
            onClick={() => step < 3 ? setStep(s => s + 1) : finish()}
          >
            {loading ? 'Saving...' : step < 3 ? 'Continue' : 'Start Backtesting'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, width: '100%' },
  card: { width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px' },
  progress: { display: 'flex', gap: 8, marginBottom: 28 },
  dot: { width: 28, height: 4, borderRadius: 2, transition: 'background 0.2s' },
  title: { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--muted)', marginBottom: 24 },
  optionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 },
  optionBtn: { padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' },
  optionActive: { borderColor: 'var(--accent)', background: '#00d4aa0f' },
  optionLabel: { fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 3 },
  optionSub: { fontSize: 11, color: 'var(--muted)' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { padding: '7px 13px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 12, color: 'var(--muted)', fontWeight: 500, transition: 'all 0.15s' },
  chipActive: { background: '#00d4aa15', borderColor: 'var(--accent)', color: 'var(--accent)' },
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  error: { color: 'var(--red)', fontSize: 12, marginBottom: 10 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, gap: 10 },
  btnBack: { padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  btnNext: { flex: 1, padding: '11px', background: 'var(--accent)', color: '#0f0f14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, transition: 'opacity 0.15s' },
};
