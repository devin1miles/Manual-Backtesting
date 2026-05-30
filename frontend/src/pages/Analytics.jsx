import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../api/client';
import { usd, pct } from '../utils/format';

export default function Analytics() {
  const [bySymbol, setBySymbol] = useState([]);
  const [bestWorst, setBestWorst] = useState({ best: [], worst: [] });
  const [daily, setDaily] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/stats/by-symbol'),
      api.get('/stats/best-worst'),
      api.get('/stats/daily?days=30'),
    ]).then(([sym, bw, d]) => {
      setBySymbol(sym);
      setBestWorst(bw);
      setDaily(d);
    }).catch(() => {});
  }, []);

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Analytics</h2>

      {/* Daily P&L Bar Chart */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Daily P&L (Last 30 Days)</div>
        {daily.length ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[...daily].reverse()} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }} formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'P&L']} />
              <Bar dataKey="net_pnl" radius={[4, 4, 0, 0]}>
                {daily.map((d, i) => <Cell key={i} fill={parseFloat(d.net_pnl) >= 0 ? '#00d4aa' : '#ff5c5c'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={styles.empty}>No data yet</div>}
      </div>

      {/* By Symbol */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Performance by Symbol</div>
        {bySymbol.length ? (
          <table style={styles.table}>
            <thead><tr>{['Symbol', 'Trades', 'Win Rate', 'Net P&L', 'Avg P&L'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {bySymbol.map(s => (
                <tr key={s.symbol} style={styles.row}>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{s.symbol}</td>
                  <td style={styles.td}>{s.total_trades}</td>
                  <td style={styles.td}>{pct((s.winning_trades / s.total_trades) * 100)}</td>
                  <td style={{ ...styles.td, color: parseFloat(s.net_pnl) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{usd(s.net_pnl)}</td>
                  <td style={styles.td}>{usd(s.avg_pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={styles.empty}>No data yet</div>}
      </div>

      {/* Best / Worst */}
      <div style={styles.row2}>
        {[{ label: 'Best Trades', data: bestWorst.best, color: 'var(--green)' },
          { label: 'Worst Trades', data: bestWorst.worst, color: 'var(--red)' }].map(({ label, data, color }) => (
          <div key={label} style={styles.halfCard}>
            <div style={styles.cardTitle}>{label}</div>
            {data.length ? data.map(t => (
              <div key={t.id} style={styles.tradeRow}>
                <span style={{ fontWeight: 700 }}>{t.symbol}</span>
                <span style={{ color, fontWeight: 700 }}>{usd(t.pnl)}</span>
              </div>
            )) : <div style={styles.empty}>No data yet</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { flex: 1, padding: 32, overflowY: 'auto' },
  h2: { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 12 },
  empty: { color: 'var(--muted)', fontSize: 13, padding: '16px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, color: 'var(--muted)', padding: '6px 8px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase' },
  row: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 8px', fontSize: 13 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  halfCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 },
  tradeRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 },
};
