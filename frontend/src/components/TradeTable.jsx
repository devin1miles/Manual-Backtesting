import { usd, fmtDate, fmtTime, pnlColor } from '../utils/format';

export default function TradeTable({ trades = [], onDelete }) {
  if (!trades.length) return (
    <div style={styles.empty}>No trades yet. Use the Chrome extension (<kbd>⌘⇧T</kbd> on TradingView) to log trades.</div>
  );

  return (
    <div style={styles.wrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {['Symbol', 'Side', 'Entry', 'SL', 'TP', 'R:R', 'Exit', 'Qty', 'P&L', 'Date', 'Status', ''].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map(t => {
            const pnl = parseFloat(t.pnl);
            return (
              <tr key={t.id} style={styles.row}>
                <td style={{ ...styles.td, fontWeight: 700 }}>{t.symbol}</td>
                <td style={{ ...styles.td, color: t.side === 'long' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>{t.side}</td>
                <td style={styles.td}>{parseFloat(t.entry_price).toFixed(2)}</td>
                <td style={{ ...styles.td, color: 'var(--red)' }}>{t.stop_loss ? parseFloat(t.stop_loss).toFixed(2) : '—'}</td>
                <td style={{ ...styles.td, color: 'var(--green)' }}>{t.take_profit ? parseFloat(t.take_profit).toFixed(2) : '—'}</td>
                <td style={{ ...styles.td, color: 'var(--muted)' }}>{t.risk_reward ? `${parseFloat(t.risk_reward).toFixed(2)}:1` : '—'}</td>
                <td style={styles.td}>{t.exit_price ? parseFloat(t.exit_price).toFixed(2) : '—'}</td>
                <td style={styles.td}>{t.quantity}</td>
                <td style={{ ...styles.td, color: pnlColor(pnl), fontWeight: 700 }}>{t.pnl != null ? usd(pnl) : '—'}</td>
                <td style={{ ...styles.td, color: 'var(--muted)' }}>{fmtDate(t.entry_time)}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: t.status === 'closed' ? '#1a3a2a' : '#1a2a3a', color: t.status === 'closed' ? 'var(--green)' : '#7ab' }}>
                    {t.status}
                  </span>
                </td>
                <td style={styles.td}>
                  {onDelete && (
                    <button style={styles.del} onClick={() => onDelete(t.id)}>✕</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)' },
  row: { borderBottom: '1px solid var(--border)' },
  td: { padding: '11px 14px', fontSize: 13 },
  badge: { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  del: { background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 6px', borderRadius: 4 },
  empty: { padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 },
};
