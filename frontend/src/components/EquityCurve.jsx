import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fmtDate } from '../utils/format';

export default function EquityCurve({ data = [] }) {
  if (!data.length) return (
    <div style={styles.empty}>No closed trades yet — equity curve will appear here.</div>
  );

  const chartData = data.map(d => ({
    date: fmtDate(d.date),
    pnl: parseFloat(d.cumulative_pnl).toFixed(2),
  }));

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Equity Curve</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, fontSize: 12 }}
            formatter={(val) => [`$${val}`, 'Cumulative P&L']}
          />
          <ReferenceLine y={0} stroke="#2a2a38" />
          <Area type="monotone" dataKey="pnl" stroke="#00d4aa" strokeWidth={2} fill="url(#pnlGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginBottom: 24 },
  title: { fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 12 },
  empty: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 32, textAlign: 'center', color: 'var(--muted)', marginBottom: 24 },
};
