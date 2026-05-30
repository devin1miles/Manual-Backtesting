import { usd, pct, pnlColor } from '../utils/format';

export default function StatCards({ stats }) {
  if (!stats) return null;
  const pnl = parseFloat(stats.net_pnl) || 0;

  const cards = [
    { label: 'Net P&L', value: usd(pnl), color: pnlColor(pnl) },
    { label: 'Win Rate', value: pct(stats.win_rate) },
    { label: 'Total Trades', value: stats.total_trades || 0 },
    { label: 'Avg Win', value: usd(stats.avg_win), color: 'var(--green)' },
    { label: 'Avg Loss', value: usd(stats.avg_loss), color: 'var(--red)' },
    { label: 'Winners / Losers', value: `${stats.winning_trades || 0} / ${stats.losing_trades || 0}` },
  ];

  return (
    <div style={styles.grid}>
      {cards.map(({ label, value, color }) => (
        <div key={label} style={styles.card}>
          <div style={styles.label}>{label}</div>
          <div style={{ ...styles.value, color: color || 'var(--text)' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' },
  label: { fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' },
  value: { fontSize: 22, fontWeight: 700 },
};
