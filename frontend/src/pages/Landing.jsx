import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '📸',
    title: 'Screenshot Parsing',
    desc: 'Drop a TradingView screenshot and AI instantly reads your entry, stop loss, and take profit from the chart.',
  },
  {
    icon: '📊',
    title: 'Trade Journal',
    desc: 'Every trade is logged with P&L, R:R, strategy, and notes — all stored in your personal database.',
  },
  {
    icon: '📈',
    title: 'Performance Analytics',
    desc: 'Equity curve, win rate, avg win/loss, and performance by symbol — all updated in real time.',
  },
  {
    icon: '⚡',
    title: 'Built for Speed',
    desc: 'Lives inside TradingView as a floating widget. Parse and log a trade in under 10 seconds.',
  },
];

const steps = [
  { n: '1', title: 'Install the Extension', desc: 'Download from the Chrome Web Store and pin it to your toolbar.' },
  { n: '2', title: 'Set Up Your Profile', desc: 'Tell us what you trade and which setups you backtest.' },
  { n: '3', title: 'Start Backtesting', desc: 'Open TradingView, drop a screenshot, and log trades as you go.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>Trading Analyzer</div>
        <div style={s.navLinks}>
          {token ? (
            <button style={s.btnPrimary} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          ) : (
            <>
              <button style={s.btnGhost} onClick={() => navigate('/login')}>Login</button>
              <button style={s.btnPrimary} onClick={() => navigate('/login?mode=register')}>Get Started Free</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>Built for Price Action Traders</div>
          <h1 style={s.h1}>
            Backtest Faster.<br />
            <span style={s.accent}>Trade Smarter.</span>
          </h1>
          <p style={s.heroSub}>
            A Chrome extension that lives on TradingView. Drop a screenshot — AI reads your chart,
            logs the trade, and tracks your performance automatically.
          </p>
          <div style={s.heroBtns}>
            <button style={s.btnPrimary} onClick={() => navigate('/login?mode=register')}>
              Start for Free
            </button>
            <button style={s.btnOutline} onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Everything you need to backtest seriously</h2>
        <div style={s.grid4}>
          {features.map(f => (
            <div key={f.title} style={s.card}>
              <div style={s.cardIcon}>{f.icon}</div>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, background: 'var(--surface)' }}>
        <h2 style={s.sectionTitle}>How it works</h2>
        <div style={s.grid3}>
          {steps.map(step => (
            <div key={step.n} style={s.stepCard}>
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.cardDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <h2 style={{ ...s.h1, fontSize: 28, marginBottom: 12 }}>Ready to level up your backtesting?</h2>
        <p style={{ ...s.heroSub, marginBottom: 28 }}>Join traders who are building a real edge — one logged trade at a time.</p>
        <button style={{ ...s.btnPrimary, fontSize: 15, padding: '13px 36px' }} onClick={() => navigate('/login?mode=register')}>
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>© 2025 Trading Analyzer. All rights reserved.</span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', width: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 48px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 },
  navLogo: { color: 'var(--accent)', fontWeight: 700, fontSize: 16 },
  navLinks: { display: 'flex', gap: 10, alignItems: 'center' },
  hero: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 48px 72px', textAlign: 'center' },
  heroInner: { maxWidth: 640 },
  badge: { display: 'inline-block', background: '#00d4aa22', color: 'var(--accent)', border: '1px solid #00d4aa44', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, marginBottom: 20 },
  h1: { fontSize: 44, fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, marginBottom: 18 },
  accent: { color: 'var(--accent)' },
  heroSub: { color: 'var(--muted)', fontSize: 16, lineHeight: 1.65, marginBottom: 32 },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  section: { padding: '64px 48px', textAlign: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 36 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 960, margin: '0 auto' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 20px', textAlign: 'left' },
  cardIcon: { fontSize: 24, marginBottom: 12 },
  cardTitle: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 8 },
  cardDesc: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 },
  stepCard: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px', textAlign: 'left' },
  stepNum: { width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#0f0f14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, marginBottom: 14 },
  stepTitle: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 8 },
  cta: { padding: '72px 48px', textAlign: 'center', borderTop: '1px solid var(--border)' },
  footer: { padding: '20px 48px', borderTop: '1px solid var(--border)', textAlign: 'center' },
  btnPrimary: { padding: '10px 22px', background: 'var(--accent)', color: '#0f0f14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnGhost: { padding: '10px 18px', background: 'transparent', color: 'var(--muted)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnOutline: { padding: '10px 22px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
};
