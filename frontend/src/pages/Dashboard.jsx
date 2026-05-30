import { useState, useEffect } from 'react';
import api from '../api/client';
import StatCards from '../components/StatCards';
import EquityCurve from '../components/EquityCurve';
import TradeTable from '../components/TradeTable';

export default function Dashboard() {
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState(null);
  const [equity, setEquity] = useState([]);
  const [trades, setTrades] = useState([]);

  useEffect(() => { loadAll(); }, [period]);

  async function loadAll() {
    try {
      const [s, e, t] = await Promise.all([
        api.get(`/stats/${period}`),
        api.get('/stats/equity-curve'),
        api.get('/trades?limit=10'),
      ]);
      setStats(s);
      setEquity(e);
      setTrades(t);
    } catch {}
  }

  async function deleteTrade(id) {
    if (!confirm('Delete this trade?')) return;
    try {
      await api.delete(`/trades/${id}`);
      loadAll();
    } catch {}
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.h2}>Dashboard</h2>
        <div style={styles.tabs}>
          {['today', 'month', 'all-time'].map(p => (
            <button key={p} style={{ ...styles.tab, ...(period === p ? styles.tabActive : {}) }} onClick={() => setPeriod(p)}>
              {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <StatCards stats={stats} />
      <EquityCurve data={equity} />

      <div style={styles.sectionTitle}>Recent Trades</div>
      <TradeTable trades={trades} onDelete={deleteTrade} />
    </div>
  );
}

const styles = {
  page: { flex: 1, padding: 32, overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h2: { fontSize: 20, fontWeight: 700, color: 'var(--text)' },
  tabs: { display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' },
  tab: { padding: '5px 14px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  tabActive: { background: 'var(--accent)', color: '#0f0f14' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 },
};
